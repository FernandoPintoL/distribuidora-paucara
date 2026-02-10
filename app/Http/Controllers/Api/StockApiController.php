<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockProducto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    /**
     * Preparar datos de movimientos para impresión
     * Guarda los datos filtrados en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresionMovimientos(Request $request)
    {
        try {
            $validated = $request->validate([
                'movimientos' => 'required|array',
                'filtros'     => 'nullable|array',
            ]);

            // Guardar en sesión
            session([
                'movimientos_impresion' => $validated['movimientos'],
                'movimientos_filtros'   => $validated['filtros'] ?? [],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos preparados para impresión',
                'cantidad' => count($validated['movimientos']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preparar datos de ventas para impresión
     * Guarda los datos filtrados en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresionVentas(Request $request)
    {
        try {
            $validated = $request->validate([
                'ventas'  => 'required|array',
                'filtros' => 'nullable|array',
            ]);

            // Guardar en sesión
            session([
                'ventas_impresion' => $validated['ventas'],
                'ventas_filtros'   => $validated['filtros'] ?? [],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos preparados para impresión',
                'cantidad' => count($validated['ventas']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preparar datos de compras para impresión
     * Guarda los datos filtrados en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresionCompras(Request $request)
    {
        try {
            $validated = $request->validate([
                'compras' => 'required|array',
                'filtros' => 'nullable|array',
            ]);

            // Guardar en sesión
            session([
                'compras_impresion' => $validated['compras'],
                'compras_filtros'   => $validated['filtros'] ?? [],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos preparados para impresión',
                'cantidad' => count($validated['compras']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Eliminar un lote de stock (stock_producto)
     * Permite eliminar lotes incluso si tienen movimientos asociados
     *
     * @param int $id ID del stock_producto a eliminar
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $stockProducto = StockProducto::findOrFail($id);

            // Log de auditoría
            Log::info('Eliminando lote de stock', [
                'stock_producto_id' => $id,
                'producto_id' => $stockProducto->producto_id,
                'almacen_id' => $stockProducto->almacen_id,
                'lote' => $stockProducto->lote,
                'cantidad' => $stockProducto->cantidad,
                'user_id' => auth()->id(),
            ]);

            // Eliminar el stock_producto (CASCADE eliminará movimientos asociados si está configurado)
            $stockProducto->delete();

            return response()->json([
                'success' => true,
                'message' => "Lote '{$stockProducto->lote}' eliminado correctamente",
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Intento de eliminar stock_producto no existente', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'El lote no existe',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error eliminando lote de stock', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar lote: ' . $e->getMessage(),
            ], 422);
        }
    }
}
