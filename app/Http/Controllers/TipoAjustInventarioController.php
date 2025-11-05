<?php
namespace App\Http\Controllers;

use App\Models\TipoAjustInventario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TipoAjustInventarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $tipos = TipoAjustInventario::where('activo', true)->get();

        return response()->json([
            'data'    => $tipos,
            'message' => 'Tipos de ajuste obtenidos correctamente',
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'clave'       => 'required|string|unique:tipos_ajuste_inventario,clave',
            'label'       => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'color'       => 'nullable|string',
            'bg_color'    => 'nullable|string',
            'text_color'  => 'nullable|string',
        ]);

        $tipo = TipoAjustInventario::create([
            'clave'       => strtoupper($request->clave),
            'label'       => $request->label,
            'descripcion' => $request->descripcion,
            'color'       => $request->color,
            'bg_color'    => $request->bg_color,
            'text_color'  => $request->text_color,
            'activo'      => true,
        ]);

        return response()->json([
            'data'    => $tipo,
            'message' => 'Tipo de ajuste creado correctamente',
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(TipoAjustInventario $tipoAjustInventario): JsonResponse
    {
        return response()->json([
            'data'    => $tipoAjustInventario,
            'message' => 'Tipo de ajuste obtenido correctamente',
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TipoAjustInventario $tipoAjustInventario): JsonResponse
    {
        $request->validate([
            'clave'       => 'required|string|unique:tipos_ajuste_inventario,clave,' . $tipoAjustInventario->id,
            'label'       => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'color'       => 'nullable|string',
            'bg_color'    => 'nullable|string',
            'text_color'  => 'nullable|string',
            'activo'      => 'boolean',
        ]);

        $tipoAjustInventario->update([
            'clave'       => strtoupper($request->clave),
            'label'       => $request->label,
            'descripcion' => $request->descripcion,
            'color'       => $request->color,
            'bg_color'    => $request->bg_color,
            'text_color'  => $request->text_color,
            'activo'      => $request->activo ?? $tipoAjustInventario->activo,
        ]);

        return response()->json([
            'data'    => $tipoAjustInventario,
            'message' => 'Tipo de ajuste actualizado correctamente',
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TipoAjustInventario $tipoAjustInventario): JsonResponse
    {
        // Verificar si tiene movimientos asociados
        if ($tipoAjustInventario->movimientosInventario()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el tipo de ajuste porque tiene movimientos asociados',
            ], 422);
        }

        $tipoAjustInventario->delete();

        return response()->json([
            'message' => 'Tipo de ajuste eliminado correctamente',
        ]);
    }
}
