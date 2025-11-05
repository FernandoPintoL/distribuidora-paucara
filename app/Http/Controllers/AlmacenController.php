<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AlmacenController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->string('q');
        $items = Almacen::query()
            ->when($q, function ($qq) use ($q) {
                $searchLower = strtolower($q);
                $qq->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
            })
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('almacenes/index', [
            'almacenes' => $items,
            'filters' => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('almacenes/form', [
            'almacen' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'responsable' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'activo' => ['boolean'],
        ]);
        $data['activo'] = $data['activo'] ?? true;
        Almacen::create($data);

        return redirect()->route('almacenes.index')->with('success', 'Almacén creado');
    }

    public function edit(Almacen $almacene): Response
    {
        return Inertia::render('almacenes/form', [
            'almacen' => $almacene,
        ]);
    }

    public function update(Request $request, Almacen $almacene): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'responsable' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'activo' => ['boolean'],
        ]);
        $almacene->update($data);

        return redirect()->route('almacenes.index')->with('success', 'Almacén actualizado');
    }

    public function destroy(Almacen $almacene): RedirectResponse
    {
        $almacene->delete();

        return redirect()->route('almacenes.index')->with('success', 'Almacén eliminado');
    }
}
