<?php
namespace App\Services;

use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Validar disponibilidad de stock para múltiples productos
     *
     * IMPORTANTE: También valida que los productos estén activos
     */
    public function validarStockDisponible(array $productos, int $almacenId = 1): array
    {
        $resultados = [];
        $errores    = [];

        foreach ($productos as $item) {
            $productoId         = $item['producto_id'] ?? $item['id'];
            $cantidadSolicitada = $item['cantidad'];

            // Validar que el producto exista y esté activo
            $producto = Producto::find($productoId);

            if (!$producto) {
                $errores[] = "Producto ID {$productoId}: No encontrado";
                $resultados[] = [
                    'producto_id'         => $productoId,
                    'cantidad_solicitada' => $cantidadSolicitada,
                    'stock_disponible'    => 0,
                    'suficiente'          => false,
                    'activo'              => false,
                    'error'               => 'Producto no encontrado',
                ];
                continue;
            }

            if (!$producto->activo) {
                $errores[] = "Producto ID {$productoId} ({$producto->nombre}): Producto desactivado";
                $resultados[] = [
                    'producto_id'         => $productoId,
                    'cantidad_solicitada' => $cantidadSolicitada,
                    'stock_disponible'    => 0,
                    'suficiente'          => false,
                    'activo'              => false,
                    'error'               => 'Producto desactivado',
                ];
                continue;
            }

            $stockDisponible = $this->obtenerStockDisponible($productoId, $almacenId);

            $resultado = [
                'producto_id'         => $productoId,
                'cantidad_solicitada' => $cantidadSolicitada,
                'stock_disponible'    => $stockDisponible,
                'suficiente'          => $stockDisponible >= $cantidadSolicitada,
                'activo'              => true,
            ];

            if (! $resultado['suficiente']) {
                $errores[] = "Producto ID {$productoId} ({$producto->nombre}): Stock insuficiente. Disponible: {$stockDisponible}, Solicitado: {$cantidadSolicitada}";
            }

            $resultados[] = $resultado;
        }

        return [
            'valido'   => empty($errores),
            'errores'  => $errores,
            'detalles' => $resultados,
        ];
    }

    /**
     * Obtener stock disponible de un producto en un almacén específico
     *
     * IMPORTANTE: Usa cantidad_disponible para respetar las reservas activas
     */
    public function obtenerStockDisponible(int $productoId, int $almacenId = 1): int
    {
        return StockProducto::where('producto_id', $productoId)
            ->where('almacen_id', $almacenId)
            ->sum('cantidad_disponible'); // ✓ Cambiado de 'cantidad' a 'cantidad_disponible'
    }

    /**
     * Obtener detalles de stock por lotes (FIFO - First In, First Out)
     */
    public function obtenerStockPorLotes(int $productoId, int $almacenId = 1): Collection
    {
        return StockProducto::where('producto_id', $productoId)
            ->where('almacen_id', $almacenId)
            ->where('cantidad', '>', 0)
            ->orderBy('fecha_vencimiento', 'asc')
            ->orderBy('id', 'asc') // FIFO por orden de llegada
            ->get();
    }

    /**
     * Procesar salida de stock por venta (usando FIFO)
     *
     * IMPORTANTE:
     * - Valida y procesa stock con bloqueo pesimista para evitar race conditions TOC/TOU
     * - La validación ocurre DENTRO de la transacción con el mismo lock que el procesamiento
     * - DEBE llamarse dentro de una transacción DB activa (manejada por el caller)
     * - No inicia su propia transacción para evitar transacciones anidadas
     *
     * @throws Exception si hay stock insuficiente o productos inactivos
     */
    public function procesarSalidaVenta(array $productos, string $numeroVenta, int $almacenId = 1): array
    {
        $movimientos = [];

        // ✅ CORRECCIÓN CR#2: NO iniciar transacción aquí
        // El caller (VentaController o Venta model) ya está en una transacción
        // Evitamos transacciones anidadas que causan deadlocks

        try {
            foreach ($productos as $item) {
                $productoId        = $item['producto_id'] ?? $item['id'];
                $cantidadNecesaria = $item['cantidad'];

                // 🔒 FASE 1: VALIDAR con BLOQUEO PESIMISTA (elimina TOC/TOU)
                // Obtener stock por lotes usando FIFO con lock
                $stocksLotes = StockProducto::where('producto_id', $productoId)
                    ->where('almacen_id', $almacenId)
                    ->where('cantidad_disponible', '>', 0) // ✓ Usar cantidad_disponible
                    ->orderBy('fecha_vencimiento', 'asc')
                    ->orderBy('id', 'asc') // FIFO por orden de llegada
                    ->lockForUpdate() // 🔒 BLOQUEO PESIMISTA - nadie más puede modificar estos registros
                    ->get();

                // Validar que hay producto activo antes de continuar
                $producto = Producto::find($productoId);
                if (!$producto) {
                    throw new Exception("Producto ID {$productoId} no encontrado");
                }
                if (!$producto->activo) {
                    throw new Exception("Producto '{$producto->nombre}' está desactivado");
                }

                // Calcular stock disponible total CON EL LOCK activo
                $stockDisponibleTotal = $stocksLotes->sum('cantidad_disponible');

                // Validar que hay suficiente stock ANTES de procesar
                if ($stockDisponibleTotal < $cantidadNecesaria) {
                    throw new Exception(
                        "Stock insuficiente para producto '{$producto->nombre}'. " .
                        "Disponible: {$stockDisponibleTotal}, Solicitado: {$cantidadNecesaria}"
                    );
                }

                // ✅ FASE 2: PROCESAR (validación ya pasó con el lock activo)
                $cantidadRestante = $cantidadNecesaria;

                foreach ($stocksLotes as $stockLote) {
                    if ($cantidadRestante <= 0) {
                        break;
                    }

                    // Tomar de cantidad_disponible, no de cantidad total
                    $cantidadTomar = min($cantidadRestante, $stockLote->cantidad_disponible);

                    // Actualizar cantidad_disponible usando UPDATE atómico
                    $affected = DB::table('stock_productos')
                        ->where('id', $stockLote->id)
                        ->where('cantidad_disponible', '>=', $cantidadTomar)
                        ->update([
                            'cantidad' => DB::raw("cantidad - {$cantidadTomar}"),
                            'cantidad_disponible' => DB::raw("cantidad_disponible - {$cantidadTomar}"),
                            'fecha_actualizacion' => now(),
                        ]);

                    if ($affected === 0) {
                        // Esto NO debería ocurrir porque tenemos el lock, pero por si acaso
                        throw new Exception(
                            "Race condition inesperada para producto ID {$productoId}. " .
                            "Por favor contacte al administrador del sistema."
                        );
                    }

                    // Actualizar modelo en memoria
                    $stockLote->cantidad -= $cantidadTomar;
                    $stockLote->cantidad_disponible -= $cantidadTomar;

                    // Registrar movimiento de salida
                    $movimiento = MovimientoInventario::create([
                        'stock_producto_id' => $stockLote->id,
                        'cantidad' => -$cantidadTomar, // Negativo para salida
                        'cantidad_anterior' => $stockLote->cantidad + $cantidadTomar,
                        'cantidad_posterior' => $stockLote->cantidad,
                        'tipo' => MovimientoInventario::TIPO_SALIDA_VENTA,
                        'observacion' => "Venta #{$numeroVenta}",
                        'numero_documento' => $numeroVenta,
                        'fecha' => now(),
                        'user_id' => \Illuminate\Support\Facades\Auth::id(),
                    ]);

                    $movimientos[] = $movimiento;
                    $cantidadRestante -= $cantidadTomar;

                    \Illuminate\Support\Facades\Log::info('Stock procesado para venta', [
                        'venta' => $numeroVenta,
                        'producto_id' => $productoId,
                        'producto_nombre' => $producto->nombre,
                        'stock_producto_id' => $stockLote->id,
                        'cantidad_tomada' => $cantidadTomar,
                        'cantidad_restante' => $cantidadRestante,
                    ]);
                }

                // Esta validación es redundante ahora, pero la dejamos como safeguard
                if ($cantidadRestante > 0) {
                    throw new Exception(
                        "Error inesperado: quedaron {$cantidadRestante} unidades sin procesar para producto '{$producto->nombre}'. " .
                        "Por favor contacte al administrador del sistema."
                    );
                }
            }

            // ✅ CORRECCIÓN CR#2: NO hacer commit aquí
            // El caller manejará el commit/rollback de la transacción

            \Illuminate\Support\Facades\Log::info('Venta procesada exitosamente', [
                'venta' => $numeroVenta,
                'movimientos_creados' => count($movimientos),
            ]);

            return $movimientos;

        } catch (Exception $e) {
            // ✅ CORRECCIÓN CR#2: NO hacer rollback aquí
            // El caller manejará el rollback de la transacción

            \Illuminate\Support\Facades\Log::error('Error al procesar salida de venta', [
                'venta' => $numeroVenta,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-lanzar la excepción para que el caller haga rollback
            throw $e;
        }
    }

    /**
     * Procesar entrada de stock por compra
     *
     * IMPORTANTE:
     * - Inicializa correctamente cantidad_disponible y cantidad_reservada
     * - DEBE llamarse dentro de una transacción DB activa (manejada por el caller)
     * - No inicia su propia transacción para evitar transacciones anidadas
     */
    public function procesarEntradaCompra(array $productos, string $numeroCompra, int $almacenId = 1): array
    {
        $movimientos = [];

        // ✅ CORRECCIÓN CR#2: NO iniciar transacción aquí

        try {
            foreach ($productos as $item) {
                $productoId       = $item['producto_id'] ?? $item['id'];
                $cantidad         = $item['cantidad'];
                $lote             = $item['lote'] ?? null;
                $fechaVencimiento = $item['fecha_vencimiento'] ?? null;

                // Buscar o crear stock para este producto/almacén/lote
                $stockProducto = StockProducto::firstOrCreate([
                    'producto_id' => $productoId,
                    'almacen_id'  => $almacenId,
                    'lote'        => $lote,
                ], [
                    'cantidad'             => 0,
                    'cantidad_disponible'  => 0, // ✓ Inicializar correctamente
                    'cantidad_reservada'   => 0, // ✓ Inicializar correctamente
                    'fecha_actualizacion'  => now(),
                    'fecha_vencimiento'    => $fechaVencimiento,
                ]);

                // Actualizar stock usando UPDATE atómico
                $affected = DB::table('stock_productos')
                    ->where('id', $stockProducto->id)
                    ->update([
                        'cantidad' => DB::raw("cantidad + {$cantidad}"),
                        'cantidad_disponible' => DB::raw("cantidad_disponible + {$cantidad}"),
                        'fecha_actualizacion' => now(),
                    ]);

                if ($affected === 0) {
                    throw new Exception("Error al actualizar stock para producto ID {$productoId}");
                }

                // Actualizar modelo en memoria
                $cantidadAnterior = $stockProducto->cantidad;
                $stockProducto->cantidad += $cantidad;
                $stockProducto->cantidad_disponible += $cantidad;

                // Registrar movimiento de entrada
                $movimiento = MovimientoInventario::create([
                    'stock_producto_id' => $stockProducto->id,
                    'cantidad' => $cantidad, // Positivo para entrada
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_posterior' => $stockProducto->cantidad,
                    'tipo' => MovimientoInventario::TIPO_ENTRADA_COMPRA,
                    'observacion' => "Compra #{$numeroCompra}",
                    'numero_documento' => $numeroCompra,
                    'fecha' => now(),
                    'user_id' => \Illuminate\Support\Facades\Auth::id(),
                ]);

                $movimientos[] = $movimiento;

                \Illuminate\Support\Facades\Log::info('Stock de compra registrado', [
                    'compra' => $numeroCompra,
                    'producto_id' => $productoId,
                    'cantidad' => $cantidad,
                    'stock_producto_id' => $stockProducto->id,
                ]);
            }

            // ✅ CORRECCIÓN CR#2: NO hacer commit aquí

            \Illuminate\Support\Facades\Log::info('Compra procesada exitosamente', [
                'compra' => $numeroCompra,
                'movimientos_creados' => count($movimientos),
            ]);

            return $movimientos;

        } catch (Exception $e) {
            // ✅ CORRECCIÓN CR#2: NO hacer rollback aquí

            \Illuminate\Support\Facades\Log::error('Error al procesar entrada de compra', [
                'compra' => $numeroCompra,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Verificar productos con stock bajo
     */
    public function obtenerProductosStockBajo(): Collection
    {
        return Producto::whereHas('stocks', function ($query) {
            $query->selectRaw('producto_id, SUM(cantidad) as total_stock')
                ->groupBy('producto_id')
                ->havingRaw('SUM(cantidad) <= productos.stock_minimo');
        })
            ->with(['stocks' => function ($query) {
                $query->where('cantidad', '>', 0);
            }])
            ->get();
    }

    /**
     * Obtener productos próximos a vencer
     */
    public function obtenerProductosProximosVencer(int $diasAnticipacion = 30): Collection
    {
        return StockProducto::query()->proximoVencer($diasAnticipacion)
            ->with(['producto', 'almacen'])
            ->get();
    }

    /**
     * Obtener productos vencidos
     */
    public function obtenerProductosVencidos(): Collection
    {
        return StockProducto::query()->vencido()
            ->with(['producto', 'almacen'])
            ->get();
    }

    /**
     * Ajustar stock manualmente
     */
    public function ajustarStock(
        int $productoId,
        int $almacenId,
        int $nuevaCantidad,
        string $motivo,
        ?string $lote = null
    ): MovimientoInventario {
        DB::beginTransaction();

        try {
            // Buscar el stock específico
            $stockProducto = StockProducto::where('producto_id', $productoId)
                ->where('almacen_id', $almacenId)
                ->when($lote, function ($query, $lote) {
                    return $query->where('lote', $lote);
                })
                ->first();

            if (! $stockProducto) {
                throw new Exception('No se encontró stock para el producto en el almacén especificado');
            }

            $cantidadAnterior = $stockProducto->cantidad;
            $diferencia       = $nuevaCantidad - $cantidadAnterior;

            if ($diferencia == 0) {
                throw new Exception('La cantidad nueva es igual a la actual');
            }

            $tipo = $diferencia > 0 ?
            MovimientoInventario::TIPO_ENTRADA_AJUSTE :
            MovimientoInventario::TIPO_SALIDA_AJUSTE;

            // Registrar el ajuste
            $movimiento = MovimientoInventario::registrar(
                $stockProducto,
                $diferencia,
                $tipo,
                $motivo
            );

            DB::commit();

            return $movimiento;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Obtener stock disponible total de un producto en todos los almacenes
     *
     * IMPORTANTE: Usa cantidad_disponible para respetar las reservas activas
     */
    public function obtenerStockTotalProducto(int $productoId): int
    {
        return StockProducto::where('producto_id', $productoId)
            ->sum('cantidad_disponible'); // ✓ Consistente con obtenerStockDisponible
    }

    /**
     * Obtener stock físico total (disponible + reservado) de un producto
     *
     * Útil para inventarios y reportes donde se necesite el total físico
     */
    public function obtenerStockFisicoTotalProducto(int $productoId): int
    {
        return StockProducto::where('producto_id', $productoId)
            ->sum('cantidad'); // Stock físico total
    }

    /**
     * Procesar salida de stock por envío (usando FIFO)
     *
     * IMPORTANTE:
     * - Usa cantidad_disponible y bloqueos para evitar race conditions
     * - DEBE llamarse dentro de una transacción DB activa (manejada por el caller)
     */
    public function procesarSalidaEnvio(array $productos, string $numeroEnvio, int $almacenId = 1): array
    {
        $movimientos = [];

        // ✅ CORRECCIÓN CR#2: NO iniciar transacción aquí

        try {
            foreach ($productos as $item) {
                $productoId        = $item['producto_id'] ?? $item['id'];
                $cantidadNecesaria = $item['cantidad'];

                // Obtener stock por lotes usando FIFO con BLOQUEO PESIMISTA
                $stocksLotes = StockProducto::where('producto_id', $productoId)
                    ->where('almacen_id', $almacenId)
                    ->where('cantidad_disponible', '>', 0) // ✓ Usar cantidad_disponible
                    ->orderBy('fecha_vencimiento', 'asc')
                    ->orderBy('id', 'asc') // FIFO
                    ->lockForUpdate() // 🔒 BLOQUEO PESIMISTA
                    ->get();

                $cantidadRestante = $cantidadNecesaria;

                foreach ($stocksLotes as $stockLote) {
                    if ($cantidadRestante <= 0) {
                        break;
                    }

                    $cantidadTomar = min($cantidadRestante, $stockLote->cantidad_disponible);

                    // Actualizar cantidad_disponible usando UPDATE atómico
                    $affected = DB::table('stock_productos')
                        ->where('id', $stockLote->id)
                        ->where('cantidad_disponible', '>=', $cantidadTomar)
                        ->update([
                            'cantidad' => DB::raw("cantidad - {$cantidadTomar}"),
                            'cantidad_disponible' => DB::raw("cantidad_disponible - {$cantidadTomar}"),
                            'fecha_actualizacion' => now(),
                        ]);

                    if ($affected === 0) {
                        throw new Exception("Race condition detectada para producto ID {$productoId}. Reintente la operación.");
                    }

                    // Actualizar modelo en memoria
                    $stockLote->cantidad -= $cantidadTomar;
                    $stockLote->cantidad_disponible -= $cantidadTomar;

                    // Registrar movimiento de salida por envío
                    $movimiento = MovimientoInventario::create([
                        'stock_producto_id' => $stockLote->id,
                        'cantidad' => -$cantidadTomar,
                        'cantidad_anterior' => $stockLote->cantidad + $cantidadTomar,
                        'cantidad_posterior' => $stockLote->cantidad,
                        'tipo' => MovimientoInventario::TIPO_SALIDA_ENVIO,
                        'observacion' => "Envío #{$numeroEnvio}",
                        'numero_documento' => $numeroEnvio,
                        'fecha' => now(),
                        'user_id' => \Illuminate\Support\Facades\Auth::id(),
                    ]);

                    $movimientos[] = $movimiento;
                    $cantidadRestante -= $cantidadTomar;

                    \Illuminate\Support\Facades\Log::info('Stock procesado para envío', [
                        'envio' => $numeroEnvio,
                        'producto_id' => $productoId,
                        'cantidad_tomada' => $cantidadTomar,
                    ]);
                }

                if ($cantidadRestante > 0) {
                    throw new Exception("Stock insuficiente para producto ID {$productoId}. Faltan {$cantidadRestante} unidades.");
                }
            }

            // ✅ CORRECCIÓN CR#2: NO hacer commit aquí

            \Illuminate\Support\Facades\Log::info('Envío procesado exitosamente', [
                'envio' => $numeroEnvio,
                'movimientos_creados' => count($movimientos),
            ]);

            return $movimientos;

        } catch (Exception $e) {
            // ✅ CORRECCIÓN CR#2: NO hacer rollback aquí

            \Illuminate\Support\Facades\Log::error('Error al procesar salida de envío', [
                'envio' => $numeroEnvio,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Procesar entrada de stock por cancelación de envío
     *
     * IMPORTANTE: DEBE llamarse dentro de una transacción DB activa
     */
    public function procesarEntradaCancelacionEnvio(array $productos, string $numeroEnvio, int $almacenId = 1): array
    {
        $movimientos = [];

        // ✅ CORRECCIÓN CR#2: NO iniciar transacción aquí

        try {
            foreach ($productos as $item) {
                $productoId = $item['producto_id'] ?? $item['id'];
                $cantidad   = $item['cantidad'];

                // Buscar o crear stock para este producto
                $stockProducto = StockProducto::firstOrCreate([
                    'producto_id' => $productoId,
                    'almacen_id'  => $almacenId,
                    'lote'        => $item['lote'] ?? 'REPOSICION-' . now()->format('Ymd'),
                ], [
                    'cantidad'            => 0,
                    'cantidad_disponible' => 0,
                    'fecha_vencimiento'   => $item['fecha_vencimiento'] ?? now()->addYears(5),
                ]);

                // Registrar movimiento de entrada por cancelación
                $movimiento = MovimientoInventario::registrar(
                    $stockProducto,
                    $cantidad, // Positivo para entrada
                    MovimientoInventario::TIPO_ENTRADA_CANCELACION_ENVIO,
                    "Cancelación envío #{$numeroEnvio}",
                    $numeroEnvio
                );

                $movimientos[] = $movimiento;
            }

            // ✅ CORRECCIÓN CR#2: NO hacer commit aquí

            return $movimientos;

        } catch (Exception $e) {
            // ✅ CORRECCIÓN CR#2: NO hacer rollback aquí
            throw $e;
        }
    }
}
