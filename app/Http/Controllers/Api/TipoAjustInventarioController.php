<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TipoAjustInventario;
use Illuminate\Http\Request;

class TipoAjustInventarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => TipoAjustInventario::where('activo', true)->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'clave'       => 'required|string|unique:tipos_ajuste_inventario,clave',
            'label'       => 'required|string',
            'descripcion' => 'nullable|string',
            'color'       => 'nullable|string',
            'bg_color'    => 'nullable|string',
            'text_color'  => 'nullable|string',
            'activo'      => 'boolean',
        ]);
        $tipo = TipoAjustInventario::create($validated);
        return response()->json(['data' => $tipo], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(TipoAjustInventario $tipoAjustInventario)
    {
        return response()->json(['data' => $tipoAjustInventario]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TipoAjustInventario $tipoAjustInventario)
    {
        $validated = $request->validate([
            'clave'       => 'sometimes|required|string|unique:tipos_ajuste_inventario,clave,' . $tipoAjustInventario->id,
            'label'       => 'sometimes|required|string',
            'descripcion' => 'nullable|string',
            'color'       => 'nullable|string',
            'bg_color'    => 'nullable|string',
            'text_color'  => 'nullable|string',
            'activo'      => 'boolean',
        ]);
        $tipoAjustInventario->update($validated);
        return response()->json(['data' => $tipoAjustInventario]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TipoAjustInventario $tipoAjustInventario)
    {
        $tipoAjustInventario->delete();
        return response()->json(['message' => 'Eliminado correctamente']);
    }
}
