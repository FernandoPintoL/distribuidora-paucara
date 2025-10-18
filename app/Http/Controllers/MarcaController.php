<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarcaController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->string('q');
        $items = Marca::query()
            ->when($q, function ($qq) use ($q) {
                $searchLower = strtolower($q);
                $qq->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
            })
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('marcas/index', [
            'marcas' => $items,
            'filters' => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('marcas/form', [
            'marca' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ]);
        $data['activo'] = $data['activo'] ?? true;
        Marca::create($data);

        return redirect()->route('marcas.index')->with('success', 'Marca creada');
    }

    public function edit(Marca $marca): Response
    {
        return Inertia::render('marcas/form', [
            'marca' => $marca,
        ]);
    }

    public function update(Request $request, Marca $marca): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ]);
        $marca->update($data);

        return redirect()->route('marcas.index')->with('success', 'Marca actualizada');
    }

    public function destroy(Marca $marca): RedirectResponse
    {
        $marca->delete();

        return redirect()->route('marcas.index')->with('success', 'Marca eliminada');
    }
}
