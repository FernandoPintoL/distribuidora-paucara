<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StockApiController extends Controller
{
    /**
     * Preparar datos de stock para impresión
     * Guarda los datos filtrados en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresion(Request $request)
    {
        try {
            $validated = $request->validate([
                'stock'           => 'required|array',
                'almacen_filtro'  => 'nullable|string',
                'busqueda_filtro' => 'nullable|string',
            ]);

            // Guardar en sesión
            session([
                'stock_impresion'   => $validated['stock'],
                'almacen_filtro'    => $validated['almacen_filtro'],
                'busqueda_filtro'   => $validated['busqueda_filtro'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos preparados para impresión',
                'cantidad' => count($validated['stock']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }
}
