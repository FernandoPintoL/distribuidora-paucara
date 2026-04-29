<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venta;
use App\Models\DetalleVenta;
use App\Models\DetallePagoVenta;
use App\Models\EstadoDocumento;
use App\Models\EstadoLogistica;
use App\Models\Moneda;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VentasComidasController extends Controller
{
    /**
     * Crear una venta de comidas/helados
     *
     * FLUJO:
     * 1. Validar productos y cantidades
     * 2. Crear Venta
     * 3. Crear DetalleVenta para cada producto
     * 4. Crear DetallePagoVenta con el monto total
     *
     * REQUEST:
     * {
     *   "cliente_id": 1 | null (optional),
     *   "tipo_pago_id": 2,
     *   "productos_comida": [
     *     {
     *       "producto_id": 1,
     *       "nombre": "Helado Acaí",
     *       "precio_base": 25.00,
     *       "adicionales_ids": [1, 3],
     *       "cantidad": 2,
     *       "subtotal": 60.00
     *     }
     *   ],
     *   "total": 60.00,
     *   "observaciones": null
     * }
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validar datos básicos
            $validated = $request->validate([
                'cliente_id'       => 'nullable|exists:clientes,id',
                'tipo_pago_id'     => 'required|exists:tipo_pago,id',
                'productos_comida' => 'required|array|min:1',
                'productos_comida.*.producto_id' => 'required|exists:productos,id',
                'productos_comida.*.nombre' => 'required|string',
                'productos_comida.*.precio_base' => 'required|numeric|min:0',
                'productos_comida.*.cantidad' => 'required|numeric|min:1',
                'productos_comida.*.subtotal' => 'required|numeric|min:0',
                'total' => 'required|numeric|min:0',
                'observaciones' => 'nullable|string',
            ]);

            Log::info('🍦 [VentasComidasController::store] Iniciando creación de venta de comidas', [
                'cliente_id' => $validated['cliente_id'],
                'tipo_pago_id' => $validated['tipo_pago_id'],
                'cantidad_productos' => count($validated['productos_comida']),
                'total' => $validated['total'],
            ]);

            // Validar que todos los productos son de comida
            $productosIds = collect($validated['productos_comida'])->pluck('producto_id')->unique();
            $productosValidar = Producto::whereIn('id', $productosIds)->get();

            foreach ($productosValidar as $producto) {
                if (!$producto->es_producto_comida) {
                    return response()->json([
                        'success' => false,
                        'message' => "Producto '{$producto->nombre}' no es un producto de comida",
                    ], 422);
                }
            }

            // Crear dentro de una transacción
            $venta = DB::transaction(function () use ($validated) {
                // Obtener estado inicial
                $estadoInicial = EstadoDocumento::obtenerEstadoInicial();

                // Obtener estado logístico SIN_ENTREGA
                $estadoSinEntrega = EstadoLogistica::where('codigo', 'SIN_ENTREGA')
                    ->where('categoria', 'venta_logistica')
                    ->first();

                // Obtener moneda por defecto (BOB)
                $monedaDefecto = Moneda::where('codigo', 'BOB')->first() ??
                    Moneda::first();

                // Crear Venta
                $venta = Venta::create([
                    'numero'                 => '0', // Se asignará después
                    'cliente_id'             => $validated['cliente_id'],
                    'usuario_id'             => Auth::id(),
                    'preventista_id'         => Auth::id(), // Usuario actual es el vendedor
                    'fecha'                  => now()->date(),
                    'subtotal'               => $validated['total'],
                    'descuento'              => 0,
                    'impuesto'               => 0,
                    'total'                  => $validated['total'],
                    'observaciones'          => $validated['observaciones'],
                    'estado_documento_id'    => $estadoInicial,
                    'moneda_id'              => $monedaDefecto->id,
                    'tipo_pago_id'           => $validated['tipo_pago_id'],
                    'estado_logistico_id'    => $estadoSinEntrega?->id,
                    'requiere_envio'         => false, // Comidas no requieren envío
                    'estado_pago'            => 'PENDIENTE', // Se marca como pagado al registrar el detalle
                    'monto_pagado'           => $validated['total'],
                ]);

                // Asignar número secuencial
                $venta->numero = $venta->id;
                $venta->save();

                Log::info('✅ [VentasComidasController::store] Venta creada', [
                    'venta_id' => $venta->id,
                    'numero' => $venta->numero,
                ]);

                // Crear DetalleVenta para cada producto
                foreach ($validated['productos_comida'] as $producto) {
                    DetalleVenta::create([
                        'venta_id'       => $venta->id,
                        'producto_id'    => $producto['producto_id'],
                        'cantidad'       => $producto['cantidad'],
                        'precio_unitario' => $producto['precio_base'],
                        'descuento'      => 0,
                        'subtotal'       => $producto['subtotal'],
                    ]);
                }

                Log::info('✅ [VentasComidasController::store] Detalles de venta creados', [
                    'venta_id' => $venta->id,
                    'cantidad_detalles' => count($validated['productos_comida']),
                ]);

                // Crear DetallePagoVenta con el monto total
                DetallePagoVenta::create([
                    'venta_id'     => $venta->id,
                    'tipo_pago_id' => $validated['tipo_pago_id'],
                    'monto'        => $validated['total'],
                    'fecha_pago'   => now(),
                ]);

                Log::info('✅ [VentasComidasController::store] Detalle de pago creado', [
                    'venta_id' => $venta->id,
                    'monto' => $validated['total'],
                ]);

                return $venta;
            });

            Log::info('🎉 [VentasComidasController::store] Venta de comidas creada exitosamente', [
                'venta_id' => $venta->id,
                'total' => $venta->total,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Venta de comidas registrada exitosamente',
                'ventaId' => $venta->id,
                'numero' => $venta->numero,
                'total' => $venta->total,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('❌ [VentasComidasController::store] Validación fallida', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ [VentasComidasController::store] Error al crear venta', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la venta: ' . $e->getMessage(),
            ], 500);
        }
    }
}
