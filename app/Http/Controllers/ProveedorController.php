<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProveedorController extends Controller
{
    public function index(Request $request): Response
    {
        $q = (string) $request->string('q');

        // Leer filtros adicionales
        $activoParam = $request->input('activo');
        $activo = null;
        if ($activoParam !== null && $activoParam !== '' && $activoParam !== 'all') {
            if ($activoParam === '1' || $activoParam === 1 || $activoParam === true || $activoParam === 'true') {
                $activo = true;
            } elseif ($activoParam === '0' || $activoParam === 0 || $activoParam === false || $activoParam === 'false') {
                $activo = false;
            }
        }

        $allowedOrderBy = ['id', 'nombre', 'created_at'];
        $rawOrderBy = (string) $request->string('order_by');
        $orderBy = in_array($rawOrderBy, $allowedOrderBy, true) ? $rawOrderBy : 'id';

        $rawOrderDir = strtolower((string) $request->string('order_dir'));
        $orderDir = in_array($rawOrderDir, ['asc', 'desc'], true) ? $rawOrderDir : 'desc';

        $items = Proveedor::query()
            ->when($q, function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('nombre', 'ilike', "%$q%")
                        ->orWhere('razon_social', 'ilike', "%$q%")
                        ->orWhere('nit', 'ilike', "%$q%")
                        ->orWhere('telefono', 'ilike', "%$q%");
                });
            })
            ->when($activo !== null, function ($query) use ($activo) {
                $query->where('activo', $activo);
            })
            ->orderBy($orderBy, $orderDir)
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('proveedores/index', [
            'items' => $items,
            'filters' => [
                'q' => $q,
                'activo' => $activo,
                'order_by' => $orderBy,
                'order_dir' => $orderDir,
            ],
        ]);
    }

    /**
     * API: Buscar proveedores para autocompletado
     */
    public function buscarApi(Request $request): JsonResponse
    {
        $q = $request->string('q');
        $limite = $request->integer('limite', 10);

        if (! $q || strlen($q) < 2) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $proveedores = Proveedor::select(['id', 'nombre', 'razon_social', 'nit', 'telefono', 'email'])
            ->where('activo', true)
            ->where(function ($query) use ($q) {
                $query->where('nombre', 'ilike', "%$q%")
                    ->orWhere('razon_social', 'ilike', "%$q%")
                    ->orWhere('nit', 'ilike', "%$q%")
                    ->orWhere('telefono', 'ilike', "%$q%");
            })
            ->limit($limite)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $proveedores,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('proveedores/form', [
            'proveedor' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'contacto' => ['nullable', 'string', 'max:255'],
            'activo' => ['boolean'],
            'foto_perfil' => ['nullable', 'image', 'max:5120'],
            'ci_anverso' => ['nullable', 'image', 'max:5120'],
            'ci_reverso' => ['nullable', 'image', 'max:5120'],
        ]);
        $data['activo'] = $data['activo'] ?? true;

        if ($request->hasFile('foto_perfil')) {
            $data['foto_perfil'] = $request->file('foto_perfil')->store('proveedores', 'public');
        }
        if ($request->hasFile('ci_anverso')) {
            $data['ci_anverso'] = $request->file('ci_anverso')->store('proveedores', 'public');
        }
        if ($request->hasFile('ci_reverso')) {
            $data['ci_reverso'] = $request->file('ci_reverso')->store('proveedores', 'public');
        }

        Proveedor::create($data);

        return redirect()->route('proveedores.index')->with('success', 'Proveedor creado');
    }

    public function edit(Proveedor $proveedore): Response
    {
        return Inertia::render('proveedores/form', [
            'proveedor' => $proveedore,
        ]);
    }

    public function update(Request $request, Proveedor $proveedore): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'contacto' => ['nullable', 'string', 'max:255'],
            'activo' => ['boolean'],
            'foto_perfil' => ['nullable', 'image', 'max:5120'],
            'ci_anverso' => ['nullable', 'image', 'max:5120'],
            'ci_reverso' => ['nullable', 'image', 'max:5120'],
        ]);

        $updates = $data;
        if ($request->hasFile('foto_perfil')) {
            $updates['foto_perfil'] = $request->file('foto_perfil')->store('proveedores', 'public');
        }
        if ($request->hasFile('ci_anverso')) {
            $updates['ci_anverso'] = $request->file('ci_anverso')->store('proveedores', 'public');
        }
        if ($request->hasFile('ci_reverso')) {
            $updates['ci_reverso'] = $request->file('ci_reverso')->store('proveedores', 'public');
        }

        $proveedore->update($updates);

        return redirect()->route('proveedores.index')->with('success', 'Proveedor actualizado');
    }

    public function destroy(Proveedor $proveedore): RedirectResponse
    {
        $proveedore->delete();

        return redirect()->route('proveedores.index')->with('success', 'Proveedor eliminado');
    }
}
