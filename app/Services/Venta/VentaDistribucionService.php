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
     * ✅ NUEVO (2026-02-16): Verificar si una cantidad es número entero
     * Útil para productos NO fraccionados que deben rechazar decimales
     */
    private function esCantidadEntero(float $cantidad): bool
    {
        return $cantidad == floor($cantidad);
    }

    /**
     * ✅ NUEVO (2026-02-16): Obtener cantidad real a consumir del stock
     * Aplica conversiones de unidad si el producto se vende en unidad diferente a almacenamiento
     *
     * FLUJO:
     * 1. Si producto NO es fraccionado y cantidad tiene decimales → ERROR
     * 2. Si hay conversión de unidad → convertir a unidad de almacenamiento
     * 3. Devolver cantidad a consumir (en unidad de almacenamiento)
     *
     * @param Producto $producto Producto a consumir
     * @param float $cantidadSolicitada Cantidad solicitada (en unidad de venta)
     * @param int|null $unidadVentaId ID de unidad de venta (null = usar unidad base del producto)
     * @return array ['cantidad_consumir' => float, 'conversion_aplicada' => bool, 'factor' => float|null]
     * @throws Exception Si producto no permite decimales pero cantidad tiene decimales
     */
    private function obtenerCantidadAConsumir(
        Producto $producto,
        float $cantidadSolicitada,
        ?int $unidadVentaId = null
    ): array {
        // 🔷 PASO 1: Validar que decimales sean permitidos si aplican
        if (!$producto->es_fraccionado && !$this->esCantidadEntero($cantidadSolicitada)) {
            throw new Exception(
                "El producto '{$producto->nombre}' no permite cantidades fraccionadas. " .
                "Solicitado: {$cantidadSolicitada}"
            );
        }

        // 🔷 PASO 2: Si no hay unidad de venta especificada, usar unidad nativa del producto
        $unidadVentaId = $unidadVentaId ?? $producto->unidad_medida_id;

        // 🔷 PASO 3: Si vende en unidad igual a la de almacenamiento, no hay conversión
        if ($unidadVentaId === $producto->unidad_medida_id) {
            return [
                'cantidad_consumir' => $cantidadSolicitada,
                'conversion_aplicada' => false,
                'factor' => null,
            ];
        }

        // 🔷 PASO 4: Buscar conversión activa de esta unidad a unidad de almacenamiento
        $conversion = $producto->conversiones()
            ->where('unidad_destino_id', $unidadVentaId)
            ->where('activo', true)
            ->first();

        // Si NO hay conversión pero se solicita en unidad diferente → ERROR
        if (!$conversion) {
            Log::error('❌ [VentaDistribucionService] Conversión no encontrada', [
                'producto_id' => $producto->id,
                'producto_nombre' => $producto->nombre,
                'unidad_venta_id' => $unidadVentaId,
                'unidad_almacenamiento_id' => $producto->unidad_medida_id,
            ]);

            throw new Exception(
                "No existe conversión configurada para el producto '{$producto->nombre}' " .
                "de la unidad de venta a la unidad de almacenamiento"
            );
        }

        // 🔷 PASO 5: Convertir cantidad de unidad de venta a unidad de almacenamiento
        $cantidadAConsumir = $conversion->convertirABase($cantidadSolicitada);

        Log::debug('🔄 [VentaDistribucionService] Conversión aplicada', [
            'producto_id' => $producto->id,
            'producto_nombre' => $producto->nombre,
            'cantidad_solicitada' => $cantidadSolicitada,
            'unidad_venta' => $conversion->unidadDestino?->nombre ?? 'ID:' . $unidadVentaId,
            'cantidad_consumir' => $cantidadAConsumir,
            'unidad_almacenamiento' => $conversion->unidadBase?->nombre ?? 'ID:' . $producto->unidad_medida_id,
            'factor_conversion' => $conversion->factor_conversion,
        ]);

        return [
            'cantidad_consumir' => $cantidadAConsumir,
            'conversion_aplicada' => true,
            'factor' => (float) $conversion->factor_conversion,
        ];
    }

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
                // ✅ CAMBIO (2026-02-16): Permitir decimales en lugar de truncar a entero
                $cantidad = (float) ($item['cantidad'] ?? 0);
                // ✅ NUEVO: Obtener unidad de venta desde el item (si existe)
                // 🔧 CORREGIDO (2026-02-18): Buscar 'unidad_venta_id' (del frontend) o 'unidad_medida_id' (para compatibilidad)
                $unidadVentaId = $item['unidad_venta_id'] ?? $item['unidad_medida_id'] ?? null;

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

                // ✅ NUEVO (2026-02-16): Obtener cantidad real a consumir (aplicando conversiones si aplican)
                try {
                    $resultadoConversion = $this->obtenerCantidadAConsumir($producto, $cantidad, $unidadVentaId);
                    $cantidadAConsumir = $resultadoConversion['cantidad_consumir'];
                    $conversionAplicada = $resultadoConversion['conversion_aplicada'];
                    $factorConversion = $resultadoConversion['factor'];
                } catch (Exception $e) {
                    Log::error('❌ [VentaDistribucionService] Error al obtener cantidad a consumir', [
                        'producto_id' => $productoId,
                        'cantidad_solicitada' => $cantidad,
                        'unidad_venta_id' => $unidadVentaId,
                        'error' => $e->getMessage(),
                    ]);
                    throw $e;
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

                // 3. Validar stock disponible (en unidad de almacenamiento)
                $stockTotal = $stocks->sum('cantidad_disponible');
                if (!$permitirStockNegativo && $stockTotal < $cantidadAConsumir) {
                    Log::error('❌ [VentaDistribucionService] Stock insuficiente', [
                        'producto_id' => $productoId,
                        'cantidad_solicitada' => $cantidad,
                        'cantidad_a_consumir' => $cantidadAConsumir,
                        'unidad_venta' => $unidadVentaId,
                        'stock_disponible' => $stockTotal,
                        'numero_venta' => $numeroVenta,
                        'conversion_aplicada' => $conversionAplicada,
                    ]);
                    throw new Exception(
                        "Stock insuficiente para producto ID {$productoId}: " .
                        "Disponible: {$stockTotal}, Necesario: {$cantidadAConsumir}"
                    );
                }

                // Log si es CREDITO (stock negativo permitido)
                if ($permitirStockNegativo && $stockTotal < $cantidadAConsumir) {
                    Log::info('ℹ️ [VentaDistribucionService] Stock negativo permitido (CREDITO)', [
                        'producto_id' => $productoId,
                        'cantidad_solicitada' => $cantidad,
                        'cantidad_a_consumir' => $cantidadAConsumir,
                        'stock_disponible' => $stockTotal,
                        'numero_venta' => $numeroVenta,
                        'conversion_aplicada' => $conversionAplicada,
                    ]);
                }

                // 4. Consumir stock según FIFO
                $cantidadRestante = (float) $cantidadAConsumir;  // ✅ Asegurar que es float/decimal

                foreach ($stocks as $stock) {
                    if ($cantidadRestante <= 0) {
                        break;
                    }

                    // Tomar lo menor: lo que necesito o lo que hay disponible
                    // ✅ CORREGIDO (2026-02-18): Asegurar que ambos valores son floats para decimales correctos
                    $cantidadTomar = (float) min($cantidadRestante, (float) $stock->cantidad_disponible);

                    // Guardar valores ANTES de actualizar
                    // ✅ CORREGIDO (2026-02-18): Convertir a float para preservar decimales
                    $cantidadAnterior = (float) $stock->cantidad;
                    $cantidadDisponibleAnterior = (float) $stock->cantidad_disponible;

                    // Actualizar stock_productos
                    $stock->decrement('cantidad_disponible', $cantidadTomar);
                    $stock->decrement('cantidad', $cantidadTomar);

                    // Recargar para obtener valores actualizados
                    $stock->refresh();
                    // ✅ CORREGIDO (2026-02-18): Convertir a float para preservar decimales
                    $cantidadPosterior = (float) $stock->cantidad;
                    $cantidadDisponiblePosterior = (float) $stock->cantidad_disponible;

                    // ✅ NUEVO (2026-02-16): Registrar movimiento con información de conversión
                    // ✅ MEJORADO (2026-02-18): Usar columnas dedicadas para conversiones + JSON para metadatos
                    $movimiento = MovimientoInventario::create([
                        'stock_producto_id' => $stock->id,
                        'cantidad' => -$cantidadTomar,  // ← NEGATIVO (salida) EN UNIDAD ALMACENAMIENTO
                        'cantidad_anterior' => $cantidadAnterior,
                        'cantidad_posterior' => $cantidadPosterior,
                        'tipo' => MovimientoInventario::TIPO_SALIDA_VENTA,
                        'numero_documento' => $numeroVenta,
                        // ✅ NUEVO (2026-02-18): Columnas específicas para conversiones
                        'cantidad_solicitada' => $conversionAplicada ? -$cantidad : null,     // ← Cantidad en unidad de venta
                        'unidad_venta_id' => $conversionAplicada ? $unidadVentaId : null,    // ← ID de unidad de venta
                        'unidad_base_id' => $conversionAplicada ? $producto->unidad_id : null, // ← ID de unidad base (almacenamiento)
                        'factor_conversion' => $conversionAplicada ? $factorConversion : null, // ← Factor de conversión
                        'es_conversion_aplicada' => $conversionAplicada,                       // ← ¿Se aplicó conversión?
                        'observacion' => json_encode([
                            'evento' => 'Consumo de stock para venta',
                            'venta_numero' => $numeroVenta,
                            'producto_id' => $productoId,
                            'lote' => $stock->lote,
                            'cantidad_solicitada' => $cantidad,                      // ← Cantidad en unidad de venta
                            'unidad_solicitud_id' => $unidadVentaId,                 // ← ID de unidad de venta
                            'cantidad_consumida' => $cantidadAConsumir,              // ← Cantidad en unidad almacenamiento
                            'conversion_aplicada' => $conversionAplicada,            // ← Si se aplicó conversión
                            'factor_conversion' => $factorConversion,                // ← Factor usado
                            'cantidad_anterior' => $cantidadAnterior,               // ← Stock ANTES
                            'cantidad_posterior' => $cantidadPosterior,             // ← Stock DESPUÉS
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
                    $cantidadRestante = (float) ($cantidadRestante - $cantidadTomar);  // ✅ Mantener como float
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
            // ✅ CAMBIO (2026-02-16): Permitir decimales en lugar de truncar a entero
            $cantidad = (float) ($item['cantidad'] ?? 0);
            // ✅ NUEVO: Obtener unidad de venta desde el item (si existe)
            $unidadVentaId = $item['unidad_medida_id'] ?? null;

            if ($cantidad <= 0) {
                continue;
            }

            // ✅ NUEVO (2026-02-16): Obtener cantidad real a consumir (con conversión si aplica)
            $producto = Producto::find($productoId);
            if (!$producto) {
                $errores[] = [
                    'producto_id' => $productoId,
                    'cantidad_necesaria' => $cantidad,
                    'stock_disponible' => 0,
                    'error' => 'Producto no encontrado',
                ];
                continue;
            }

            try {
                $resultadoConversion = $this->obtenerCantidadAConsumir($producto, $cantidad, $unidadVentaId);
                $cantidadAValidar = $resultadoConversion['cantidad_consumir'];
            } catch (Exception $e) {
                $errores[] = [
                    'producto_id' => $productoId,
                    'cantidad_necesaria' => $cantidad,
                    'stock_disponible' => 0,
                    'error' => $e->getMessage(),
                ];
                continue;
            }

            $stockTotal = StockProducto::where('producto_id', $productoId)
                ->where('almacen_id', $almacenId)
                ->sum('cantidad_disponible');

            if ($stockTotal < $cantidadAValidar) {
                $errores[] = [
                    'producto_id' => $productoId,
                    'cantidad_necesaria' => $cantidadAValidar,
                    'stock_disponible' => $stockTotal,
                ];

                Log::warning('⚠️ [VentaDistribucionService] Stock insuficiente', [
                    'producto_id' => $productoId,
                    'cantidad_solicitada' => $cantidad,
                    'cantidad_a_validar' => $cantidadAValidar,
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
                    // ✅ CAMBIO (2026-02-16): Retornar como float para soportar productos fraccionados
                    'disponible' => (float) $item->disponible,
                ];
            })
            ->toArray();
    }
}
