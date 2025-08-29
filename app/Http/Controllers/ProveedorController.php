<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProveedorController extends Controller
{
    public function index(Request $request): Response
    {
        $q = (string) $request->string('q');
        $items = Proveedor::query()
            ->when($q, function($qq) use ($q){
                $qq->where('nombre', 'ilike', "%$q%")
                   ->orWhere('razon_social', 'ilike', "%$q%");
            })
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('proveedores/index', [
            'proveedores' => $items,
            'filters' => ['q' => $q],
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
            'nombre' => ['required','string','max:255'],
            'razon_social' => ['nullable','string','max:255'],
            'nit' => ['nullable','string','max:255'],
            'telefono' => ['nullable','string','max:100'],
            'email' => ['nullable','email','max:255'],
            'direccion' => ['nullable','string','max:255'],
            'contacto' => ['nullable','string','max:255'],
            'activo' => ['boolean'],
        ]);
        $data['activo'] = $data['activo'] ?? true;
        Proveedor::create($data);
        return redirect()->route('proveedores.index')->with('success', 'Proveedor creado');
    }

    public function edit(Proveedor $proveedor): Response
    {
        return Inertia::render('proveedores/form', [
            'proveedor' => $proveedor,
        ]);
    }

    public function update(Request $request, Proveedor $proveedor): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required','string','max:255'],
            'razon_social' => ['nullable','string','max:255'],
            'nit' => ['nullable','string','max:255'],
            'telefono' => ['nullable','string','max:100'],
            'email' => ['nullable','email','max:255'],
            'direccion' => ['nullable','string','max:255'],
            'contacto' => ['nullable','string','max:255'],
            'activo' => ['boolean'],
        ]);
        $proveedor->update($data);
        return redirect()->route('proveedores.index')->with('success', 'Proveedor actualizado');
    }

    public function destroy(Proveedor $proveedor): RedirectResponse
    {
        $proveedor->delete();
        return redirect()->route('proveedores.index')->with('success', 'Proveedor eliminado');
    }
}
