<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoriaController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->string('q');
        $categorias = Categoria::query()
            ->when($q, function ($qq) use ($q) {
                $searchLower = strtolower($q);
                $qq->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
            })
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('categorias/index', [
            'categorias' => $categorias,
            'filters' => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('categorias/form', [
            'categoria' => null,
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
        Categoria::create($data);

        return redirect()->route('categorias.index')->with('success', 'Categoría creada');
    }

    public function edit(Categoria $categoria): Response
    {
        return Inertia::render('categorias/form', [
            'categoria' => $categoria,
        ]);
    }

    public function update(Request $request, Categoria $categoria): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ]);
        $categoria->update($data);

        return redirect()->route('categorias.index')->with('success', 'Categoría actualizada');
    }

    public function destroy(Categoria $categoria): RedirectResponse
    {
        $categoria->delete();

        return redirect()->route('categorias.index')->with('success', 'Categoría eliminada');
    }
}
