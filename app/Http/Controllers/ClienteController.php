<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    public function index(Request $request): Response
    {
        $q = (string) $request->string('q');

        $activoParam = $request->input('activo');
        $activo = null;
        if ($activoParam !== null && $activoParam !== '' && $activoParam !== 'all') {
            if ($activoParam === '1' || $activoParam === 1 || $activoParam === true || $activoParam === 'true') {
                $activo = true;
            } elseif ($activoParam === '0' || $activoParam === 0 || $activoParam === false || $activoParam === 'false') {
                $activo = false;
            }
        }

        $allowedOrderBy = ['id', 'nombre', 'fecha_registro'];
        $rawOrderBy = (string) $request->string('order_by');
        $orderBy = in_array($rawOrderBy, $allowedOrderBy, true) ? $rawOrderBy : 'id';

        $rawOrderDir = strtolower((string) $request->string('order_dir'));
        $orderDir = in_array($rawOrderDir, ['asc', 'desc'], true) ? $rawOrderDir : 'desc';

        $items = Cliente::query()
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

        return Inertia::render('clientes/index', [
            'clientes' => $items,
            'filters' => [
                'q' => $q,
                'activo' => $activo !== null ? ($activo ? '1' : '0') : null,
                'order_by' => $orderBy,
                'order_dir' => $orderDir,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('clientes/form', [
            'cliente' => null,
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
            'activo' => ['boolean'],
            'foto_perfil' => ['nullable', 'image', 'max:5120'],
            'ci_anverso' => ['nullable', 'image', 'max:5120'],
            'ci_reverso' => ['nullable', 'image', 'max:5120'],
        ]);
        $data['activo'] = $data['activo'] ?? true;

        if ($request->hasFile('foto_perfil')) {
            $data['foto_perfil'] = $request->file('foto_perfil')->store('clientes', 'public');
        }
        if ($request->hasFile('ci_anverso')) {
            $data['ci_anverso'] = $request->file('ci_anverso')->store('clientes', 'public');
        }
        if ($request->hasFile('ci_reverso')) {
            $data['ci_reverso'] = $request->file('ci_reverso')->store('clientes', 'public');
        }

        Cliente::create($data);

        return redirect()->route('clientes.index')->with('success', 'Cliente creado');
    }

    public function edit(Cliente $cliente): Response
    {
        return Inertia::render('clientes/form', [
            'cliente' => $cliente,
        ]);
    }

    public function update(Request $request, Cliente $cliente): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'activo' => ['boolean'],
            'foto_perfil' => ['nullable', 'image', 'max:5120'],
            'ci_anverso' => ['nullable', 'image', 'max:5120'],
            'ci_reverso' => ['nullable', 'image', 'max:5120'],
        ]);

        $updates = $data;
        if ($request->hasFile('foto_perfil')) {
            $updates['foto_perfil'] = $request->file('foto_perfil')->store('clientes', 'public');
        }
        if ($request->hasFile('ci_anverso')) {
            $updates['ci_anverso'] = $request->file('ci_anverso')->store('clientes', 'public');
        }
        if ($request->hasFile('ci_reverso')) {
            $updates['ci_reverso'] = $request->file('ci_reverso')->store('clientes', 'public');
        }

        $cliente->update($updates);

        return redirect()->route('clientes.index')->with('success', 'Cliente actualizado');
    }

    public function destroy(Cliente $cliente): RedirectResponse
    {
        $cliente->delete();

        return redirect()->route('clientes.index')->with('success', 'Cliente eliminado');
    }
}
