<?php

namespace App\Http\Controllers;

use App\Models\UnidadMedida;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnidadMedidaController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->string('q');
        $items = UnidadMedida::query()
            ->when($q, function ($qq) use ($q) {
                $searchLower = strtolower($q);
                $qq->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(codigo) like ?', ["%$searchLower%"]);
            })
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('unidades/index', [
            'unidades' => $items,
            'filters' => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('unidades/form', [
            'unidad' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'codigo' => ['required', 'string', 'max:10', 'unique:unidades_medida,codigo'],
            'nombre' => ['required', 'string', 'max:255'],
            'activo' => ['boolean'],
        ]);
        $data['activo'] = $data['activo'] ?? true;
        UnidadMedida::create($data);

        return redirect()->route('unidades.index')->with('success', 'Unidad creada');
    }

    public function edit(UnidadMedida $unidad): Response
    {
        return Inertia::render('unidades/form', [
            'unidad' => $unidad,
        ]);
    }

    public function update(Request $request, UnidadMedida $unidad): RedirectResponse
    {
        $data = $request->validate([
            'codigo' => ['required', 'string', 'max:10', 'unique:unidades_medida,codigo,'.$unidad->id],
            'nombre' => ['required', 'string', 'max:255'],
            'activo' => ['boolean'],
        ]);
        $unidad->update($data);

        return redirect()->route('unidades.index')->with('success', 'Unidad actualizada');
    }

    public function destroy(UnidadMedida $unidad): RedirectResponse
    {
        $unidad->delete();

        return redirect()->route('unidades.index')->with('success', 'Unidad eliminada');
    }
}
