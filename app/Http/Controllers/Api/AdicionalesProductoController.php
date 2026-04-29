<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdicionalesProducto;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdicionalesProductoController extends Controller
{
    /**
     * Obtener adicionales de un producto
     */
    public function obtenerPorProducto(Producto $producto): JsonResponse
    {
        $adicionales = $producto->adicionales()
            ->activos()
            ->ordenados()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $adicionales,
        ]);
    }

    /**
     * Crear un nuevo adicional
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio_adicional' => 'required|numeric|min:0',
            'orden' => 'integer|min:0',
        ]);

        // Verificar que el producto es de comida
        $producto = Producto::findOrFail($validated['producto_id']);
        if (!$producto->es_producto_comida) {
            return response()->json([
                'success' => false,
                'message' => 'Este producto no es de comida/helado',
            ], 422);
        }

        $adicional = AdicionalesProducto::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Adicional creado correctamente',
            'data' => $adicional,
        ], 201);
    }

    /**
     * Actualizar un adicional
     */
    public function update(Request $request, AdicionalesProducto $adicional): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'string|max:255',
            'descripcion' => 'nullable|string',
            'precio_adicional' => 'numeric|min:0',
            'orden' => 'integer|min:0',
            'activo' => 'boolean',
        ]);

        $adicional->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Adicional actualizado correctamente',
            'data' => $adicional,
        ]);
    }

    /**
     * Eliminar un adicional
     */
    public function destroy(AdicionalesProducto $adicional): JsonResponse
    {
        $adicional->delete();

        return response()->json([
            'success' => true,
            'message' => 'Adicional eliminado correctamente',
        ]);
    }

    /**
     * Obtener productos de comida
     */
    public function productosComida(): JsonResponse
    {
        $productos = Producto::where('es_producto_comida', true)
            ->where('activo', true)
            ->with(['adicionales' => function($q) {
                $q->activos()->ordenados();
            }])
            ->get(['id', 'nombre', 'descripcion', 'precio_venta', 'es_producto_comida']);

        return response()->json([
            'success' => true,
            'data' => $productos,
        ]);
    }
}
