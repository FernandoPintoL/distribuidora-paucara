<?php

namespace App\Services\Venta;

use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * VentaDistribucionService - Gestión centralizada de consumo y devolución de stock para ventas
 *
 * RESPONSABILIDADES:
 * ✓ Consumir stock cuando se crea una venta (FIFO por vencimiento)
 * ✓ Devolver stock cuando se anula una venta (inversa al consumo)
 * ✓ Validar disponibilidad ANTES de consumir
 * ✓ Obtener información de disponibilidad actual
 * ✓ Registrar movimientos completos (cantidad_anterior, cantidad_posterior)
 *
 * CARACTERÍSTICAS:
 * ✅ FIFO: Ordena por fecha_vencimiento (vence primero) + id (creado primero)
 * ✅ Almacén: Siempre usa empresa.almacen_id (del usuario autenticado)
 * ✅ Stock Negativo: Permitido para CREDITO (promesas de pago)
 * ✅ Transacciones: DB::transaction para atomicidad
 * ✅ Auditoría: Logs completos de cada operación
 * ✅ Movimientos: Registra ANTES/DESPUÉS correctamente
 */
class VentaDistribucionService
{
    /**
     * Consumir stock para una venta usando FIFO
     *
     * FLUJO:
     * 1. Validar datos
     * 2. Para cada producto:
     *    a. Obtener stocks con FIFO (vencimiento cercano primero)
     *    b. Validar si hay disponible (excepto CREDITO)
     *    c. Consumir según FIFO
     *    d. Registrar movimiento SALIDA_VENTA
     * 3. Retornar movimientos creados
     *
     * @param array $detalles Array de productos: [['producto_id' => X, 'cantidad' => Y], ...]
     * @param string $numeroVenta Referencia para movimiento (ej: VEN20260211-0001)
     * @param bool $permitirStockNegativo Para CREDITO (permite stock negativo)
     * @return array Movimientos creados en movimientos_inventario
     * @throws Exception Si stock insuficiente o error en proceso
     */
    public function consumirStock(
        array $detalles,
        string $numeroVenta,
        bool $permitirStockNegativo = false
    ): array {
        Log::info('🔄 [VentaDistribucionService::consumirStock] Iniciando consumo de stock', [
            'numero_venta' => $numeroVenta,
            'cantidad_productos' => count($detalles),
            'almacen_id' => auth()->user()?->empresa?->almacen_id ?? 1,
            'permite_stock_negativo' => $permitirStockNegativo,
            'timestamp' => now()->toIso8601String(),
        ]);

        $almacenId = auth()->user()?->empresa?->almacen_id ?? 1;
        $movimientos = [];

        return DB::transaction(function () use ($detalles, $numeroVenta, $almacenId, $permitirStockNegativo, &$movimientos) {
            foreach ($detalles as $item) {
                $productoId = $item['producto_id'] ?? $item['id'];
                $cantidad = (int) ($item['cantidad'] ?? 0);

                if ($cantidad <= 0) {
                    Log::warning('⚠️ [VentaDistribucionService] Cantidad inválida', [
                        'producto_id' => $productoId,
                        'cantidad' => $cantidad,
                    ]);
                    continue;
                }

                // 1. Obtener producto
                $producto = Producto::find($productoId);
                if (!$producto) {
                    throw new Exception("Producto ID {$productoId} no encontrado");
                }

                // 2. Obtener stocks disponibles con FIFO (vencimiento cercano primero)
                // ✅ FIFO: ordenar por fecha_vencimiento ASC (vence primero), luego id (creado primero)
                $stocks = StockProducto::where('producto_id', $productoId)
                    ->where('almacen_id', $almacenId)
                    ->where('cantidad_disponible', '>', 0)
                    ->orderBy('fecha_vencimiento', 'asc')  // ← Vencimiento más cercano primero
                    ->orderBy('id', 'asc')                  // ← Creado primero
                    ->lockForUpdate()                       // ← Lock pesimista
                    ->get();

                // 3. Validar stock disponible
                $stockTotal = $stocks->sum('cantidad_disponible');
                if (!$permitirStockNegativo && $stockTotal < $cantidad) {
                    Log::error('❌ [VentaDistribucionService] Stock insuficiente', [
                        'producto_id' => $productoId,
                        'cantidad_necesaria' => $cantidad,
                        'stock_disponible' => $stockTotal,
                        'numero_venta' => $numeroVenta,
                    ]);
                    throw new Exception(
                        "Stock insuficiente para producto ID {$productoId}: " .
                        "Disponible: {$stockTotal}, Necesario: {$cantidad}"
                    );
                }

                // Log si es CREDITO (stock negativo permitido)
                if ($permitirStockNegativo && $stockTotal < $cantidad) {
                    Log::info('ℹ️ [VentaDistribucionService] Stock negativo permitido (CREDITO)', [
                        'producto_id' => $productoId,
                        'cantidad_necesaria' => $cantidad,
                        'stock_disponible' => $stockTotal,
                        'numero_venta' => $numeroVenta,
                    ]);
                }

                // 4. Consumir stock según FIFO
                $cantidadRestante = $cantidad;

                foreach ($stocks as $stock) {
                    if ($cantidadRestante <= 0) {
                        break;
                    }

                    // Tomar lo menor: lo que necesito o lo que hay disponible
                    $cantidadTomar = min($cantidadRestante, $stock->cantidad_disponible);

                    // Guardar valores ANTES de actualizar
                    $cantidadAnterior = $stock->cantidad;
                    $cantidadDisponibleAnterior = $stock->cantidad_disponible;

                    // Actualizar stock_productos
                    $stock->decrement('cantidad_disponible', $cantidadTomar);
                    $stock->decrement('cantidad', $cantidadTomar);

                    // Recargar para obtener valores actualizados
                    $stock->refresh();
                    $cantidadPosterior = $stock->cantidad;
                    $cantidadDisponiblePosterior = $stock->cantidad_disponible;

                    // Registrar movimiento SALIDA_VENTA con valores ANTES/DESPUÉS
                    $movimiento = MovimientoInventario::create([
                        'stock_producto_id' => $stock->id,
                        'cantidad' => -$cantidadTomar,  // ← NEGATIVO (salida)
                        'cantidad_anterior' => $cantidadAnterior,
                        'cantidad_posterior' => $cantidadPosterior,
                        'tipo' => MovimientoInventario::TIPO_SALIDA_VENTA,
                        'numero_documento' => $numeroVenta,
                        'observacion' => json_encode([
                            'evento' => 'Consumo de stock para venta',
                            'venta_numero' => $numeroVenta,
                            'producto_id' => $productoId,
                            'lote' => $stock->lote,
                            'cantidad_anterior' => $cantidadAnterior,
                            'cantidad_posterior' => $cantidadPosterior,
                            'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                            'cantidad_disponible_posterior' => $cantidadDisponiblePosterior,
                        ]),
                        'fecha' => now(),
                        'user_id' => Auth::id() ?? 1,
                    ]);

                    Log::debug('📦 [VentaDistribucionService] Consumo registrado', [
                        'venta' => $numeroVenta,
                        'stock_producto_id' => $stock->id,
                        'producto_id' => $productoId,
                        'lote' => $stock->lote,
                        'cantidad_consumida' => $cantidadTomar,
                        'cantidad_anterior' => $cantidadAnterior,
                        'cantidad_posterior' => $cantidadPosterior,
                    ]);

                    $movimientos[] = $movimiento;
                    $cantidadRestante -= $cantidadTomar;
                }
            }

            Log::info('✅ [VentaDistribucionService::consumirStock] Stock consumido exitosamente', [
                'numero_venta' => $numeroVenta,
                'movimientos_creados' => count($movimientos),
                'almacen_id' => $almacenId,
                'timestamp' => now()->toIso8601String(),
            ]);

            return $movimientos;
        });
    }

    /**
     * Devolver stock cuando se anula una venta
     *
     * FLUJO:
     * 1. Obtener movimientos de consumo de la venta
     * 2. Para cada movimiento:
     *    a. Restaurar cantidad en stock_productos
     *    b. Registrar movimiento ENTRADA_AJUSTE inverso
     * 3. Retornar resultado de devolución
     *
     * @param string $numeroVenta Referencia de la venta a devolver
     * @return array Resultado de devolución: ['success' => bool, 'cantidad_devuelta' => int, 'movimientos' => int, 'error' => string|null]
     */
    public function devolverStock(string $numeroVenta): array
    {
        Log::info('🔄 [VentaDistribucionService::devolverStock] Iniciando devolución de stock', [
            'numero_venta' => $numeroVenta,
            'timestamp' => now()->toIso8601String(),
        ]);

        try {
            return DB::transaction(function () use ($numeroVenta) {
                // Obtener movimientos de consumo (SALIDA_VENTA + CONSUMO_RESERVA)
                // ✅ CORREGIDO (2026-02-11): Incluir CONSUMO_RESERVA para ventas convertidas desde proforma
                $movimientos = MovimientoInventario::where('numero_documento', $numeroVenta)
                    ->whereIn('tipo', [
                        MovimientoInventario::TIPO_SALIDA_VENTA,
                        'CONSUMO_RESERVA'  // ← Para ventas creadas desde proforma
                    ])
                    ->lockForUpdate()
                    ->get();

                if ($movimientos->isEmpty()) {
                    Log::warning('⚠️ [VentaDistribucionService] No hay movimientos de consumo para devolver (SALIDA_VENTA + CONSUMO_RESERVA)', [
                        'numero_venta' => $numeroVenta,
                        'nota' => 'Posible: venta nunca consumió stock, o está duplicando reversión',
                    ]);

                    return [
                        'success' => true,
                        'cantidad_devuelta' => 0,
                        'movimientos' => 0,
                        'error' => null,
                    ];
                }

                $totalDevuelto = 0;
                $movimientosCreados = 0;

                foreach ($movimientos as $movimiento) {
                    $stock = $movimiento->stockProducto;
                    $cantidadADevolver = abs($movimiento->cantidad);

                    // Valores ANTES de devolver
                    $cantidadAnterior = $stock->cantidad;
                    $cantidadDisponibleAnterior = $stock->cantidad_disponible;

                    Log::debug('🔄 [VentaDistribucionService] ANTES de devolver', [
                        'venta' => $numeroVenta,
                        'stock_producto_id' => $stock->id,
                        'lote' => $stock->lote,
                        'cantidad_a_devolver' => $cantidadADevolver,
                        'cantidad_anterior' => $cantidadAnterior,
                        'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                    ]);

                    // Restaurar stock usando UPDATE atómico
                    $affected = DB::table('stock_productos')
                        ->where('id', $stock->id)
                        ->update([
                            'cantidad' => DB::raw("cantidad + " . (int) $cantidadADevolver),
                            'cantidad_disponible' => DB::raw("cantidad_disponible + " . (int) $cantidadADevolver),
                            'fecha_actualizacion' => DB::raw('CURRENT_TIMESTAMP'),
                        ]);

                    if ($affected === 0) {
                        throw new Exception("Error al restaurar stock para stock_producto_id {$stock->id}");
                    }

                    // Recargar stock para obtener valores actualizados
                    $stock->refresh();
                    $cantidadPosterior = $stock->cantidad;
                    $cantidadDisponiblePosterior = $stock->cantidad_disponible;

                    Log::debug('✅ [VentaDistribucionService] DESPUÉS de devolver', [
                        'venta' => $numeroVenta,
                        'stock_producto_id' => $stock->id,
                        'cantidad_anterior' => $cantidadAnterior,
                        'cantidad_posterior' => $cantidadPosterior,
                        'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                        'cantidad_disponible_posterior' => $cantidadDisponiblePosterior,
                    ]);

                    // Registrar movimiento de devolución ENTRADA_AJUSTE
                    MovimientoInventario::create([
                        'stock_producto_id' => $stock->id,
                        'cantidad' => $cantidadADevolver,  // ← POSITIVO (entrada)
                        'cantidad_anterior' => $cantidadAnterior,
                        'cantidad_posterior' => $cantidadPosterior,
                        'tipo' => MovimientoInventario::TIPO_ENTRADA_AJUSTE,
                        'numero_documento' => $numeroVenta . '-DEV',
                        'observacion' => json_encode([
                            'evento' => 'Devolución de stock por anulación de venta',
                            'venta_numero' => $numeroVenta,
                            'producto_id' => $stock->producto_id,
                            'lote' => $stock->lote,
                            'cantidad_anterior' => $cantidadAnterior,
                            'cantidad_posterior' => $cantidadPosterior,
                            'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                            'cantidad_disponible_posterior' => $cantidadDisponiblePosterior,
                        ]),
                        'fecha' => now(),
                        'user_id' => Auth::id() ?? 1,
                    ]);

                    Log::info('✅ [VentaDistribucionService] Devolución registrada', [
                        'venta' => $numeroVenta,
                        'stock_producto_id' => $stock->id,
                        'lote' => $stock->lote,
                        'cantidad_devuelta' => $cantidadADevolver,
                    ]);

                    $totalDevuelto += $cantidadADevolver;
                    $movimientosCreados++;
                }

                Log::info('✅ [VentaDistribucionService::devolverStock] Stock devuelto exitosamente (SALIDA_VENTA + CONSUMO_RESERVA)', [
                    'numero_venta' => $numeroVenta,
                    'cantidad_total_devuelta' => $totalDevuelto,
                    'movimientos_creados' => $movimientosCreados,
                    'tipos_revertidos' => $movimientos->pluck('tipo')->unique()->toArray(),
                    'timestamp' => now()->toIso8601String(),
                ]);

                return [
                    'success' => true,
                    'cantidad_devuelta' => $totalDevuelto,
                    'movimientos' => $movimientosCreados,
                    'error' => null,
                ];
            });
        } catch (Exception $e) {
            Log::error('❌ [VentaDistribucionService::devolverStock] Error en devolución', [
                'numero_venta' => $numeroVenta,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'cantidad_devuelta' => 0,
                'movimientos' => 0,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Validar si hay stock disponible para una venta
     *
     * @param array $detalles Array de productos a validar
     * @return array ['valido' => bool, 'detalles' => array de errores si aplica]
     */
    public function validarDisponible(array $detalles): array
    {
        Log::debug('🔍 [VentaDistribucionService::validarDisponible] Validando disponibilidad', [
            'cantidad_productos' => count($detalles),
            'almacen_id' => auth()->user()?->empresa?->almacen_id ?? 1,
        ]);

        $almacenId = auth()->user()?->empresa?->almacen_id ?? 1;
        $errores = [];

        foreach ($detalles as $item) {
            $productoId = $item['producto_id'] ?? $item['id'];
            $cantidad = (int) ($item['cantidad'] ?? 0);

            if ($cantidad <= 0) {
                continue;
            }

            $stockTotal = StockProducto::where('producto_id', $productoId)
                ->where('almacen_id', $almacenId)
                ->sum('cantidad_disponible');

            if ($stockTotal < $cantidad) {
                $errores[] = [
                    'producto_id' => $productoId,
                    'cantidad_necesaria' => $cantidad,
                    'stock_disponible' => $stockTotal,
                ];

                Log::warning('⚠️ [VentaDistribucionService] Stock insuficiente', [
                    'producto_id' => $productoId,
                    'cantidad_necesaria' => $cantidad,
                    'stock_disponible' => $stockTotal,
                ]);
            }
        }

        $valido = empty($errores);

        Log::debug('✅ [VentaDistribucionService::validarDisponible] Validación completada', [
            'valido' => $valido,
            'errores' => count($errores),
        ]);

        return [
            'valido' => $valido,
            'detalles' => $errores,
        ];
    }

    /**
     * Obtener disponibilidad actual de stock para productos
     *
     * @param array $productoIds Array de IDs de productos
     * @return array Array con disponibilidad por producto: [['producto_id' => X, 'disponible' => Y], ...]
     */
    public function obtenerDisponibilidad(array $productoIds): array
    {
        $almacenId = auth()->user()?->empresa?->almacen_id ?? 1;

        return StockProducto::whereIn('producto_id', $productoIds)
            ->where('almacen_id', $almacenId)
            ->groupBy('producto_id')
            ->selectRaw('producto_id, SUM(cantidad_disponible) as disponible')
            ->get()
            ->map(function ($item) {
                return [
                    'producto_id' => $item->producto_id,
                    'disponible' => (int) $item->disponible,
                ];
            })
            ->toArray();
    }
}
