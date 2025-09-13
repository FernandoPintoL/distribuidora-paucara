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
     */
    public function validarStockDisponible(array $productos, int $almacenId = 1): array
    {
        $resultados = [];
        $errores    = [];

        foreach ($productos as $item) {
            $productoId         = $item['producto_id'] ?? $item['id'];
            $cantidadSolicitada = $item['cantidad'];

            $stockDisponible = $this->obtenerStockDisponible($productoId, $almacenId);

            $resultado = [
                'producto_id'         => $productoId,
                'cantidad_solicitada' => $cantidadSolicitada,
                'stock_disponible'    => $stockDisponible,
                'suficiente'          => $stockDisponible >= $cantidadSolicitada,
            ];

            if (! $resultado['suficiente']) {
                $errores[] = "Producto ID {$productoId}: Stock insuficiente. Disponible: {$stockDisponible}, Solicitado: {$cantidadSolicitada}";
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
     */
    public function obtenerStockDisponible(int $productoId, int $almacenId = 1): int
    {
        return StockProducto::where('producto_id', $productoId)
            ->where('almacen_id', $almacenId)
            ->sum('cantidad');
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
     */
    public function procesarSalidaVenta(array $productos, string $numeroVenta, int $almacenId = 1): array
    {
        $movimientos = [];

        DB::beginTransaction();

        try {
            foreach ($productos as $item) {
                $productoId        = $item['producto_id'] ?? $item['id'];
                $cantidadNecesaria = $item['cantidad'];

                // Obtener stock por lotes usando FIFO
                $stocksLotes = $this->obtenerStockPorLotes($productoId, $almacenId);

                $cantidadRestante = $cantidadNecesaria;

                foreach ($stocksLotes as $stockLote) {
                    if ($cantidadRestante <= 0) {
                        break;
                    }

                    $cantidadTomar = min($cantidadRestante, $stockLote->cantidad);

                    // Registrar movimiento de salida
                    $movimiento = MovimientoInventario::registrar(
                        $stockLote,
                        -$cantidadTomar, // Negativo para salida
                        MovimientoInventario::TIPO_SALIDA_VENTA,
                        "Venta #{$numeroVenta}",
                        $numeroVenta
                    );

                    $movimientos[] = $movimiento;
                    $cantidadRestante -= $cantidadTomar;
                }

                if ($cantidadRestante > 0) {
                    throw new Exception("Stock insuficiente para producto ID {$productoId}. Faltan {$cantidadRestante} unidades.");
                }
            }

            DB::commit();

            return $movimientos;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Procesar entrada de stock por compra
     */
    public function procesarEntradaCompra(array $productos, string $numeroCompra, int $almacenId = 1): array
    {
        $movimientos = [];

        DB::beginTransaction();

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
                    'cantidad'            => 0,
                    'fecha_actualizacion' => now(),
                    'fecha_vencimiento'   => $fechaVencimiento,
                ]);

                // Registrar movimiento de entrada
                $movimiento = MovimientoInventario::registrar(
                    $stockProducto,
                    $cantidad, // Positivo para entrada
                    MovimientoInventario::TIPO_ENTRADA_COMPRA,
                    "Compra #{$numeroCompra}",
                    $numeroCompra
                );

                $movimientos[] = $movimiento;
            }

            DB::commit();

            return $movimientos;

        } catch (Exception $e) {
            DB::rollBack();
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
     * Obtener stock total de un producto en todos los almacenes
     */
    public function obtenerStockTotalProducto(int $productoId): int
    {
        return StockProducto::where('producto_id', $productoId)
            ->sum('cantidad_disponible');
    }

    /**
     * Procesar salida de stock por envío
     */
    public function procesarSalidaEnvio(array $productos, string $numeroEnvio, int $almacenId = 1): array
    {
        $movimientos = [];

        DB::beginTransaction();

        try {
            foreach ($productos as $item) {
                $productoId        = $item['producto_id'] ?? $item['id'];
                $cantidadNecesaria = $item['cantidad'];

                // Obtener stock por lotes usando FIFO
                $stocksLotes = $this->obtenerStockPorLotes($productoId, $almacenId);

                $cantidadRestante = $cantidadNecesaria;

                foreach ($stocksLotes as $stockLote) {
                    if ($cantidadRestante <= 0) {
                        break;
                    }

                    $cantidadTomar = min($cantidadRestante, $stockLote->cantidad);

                    // Registrar movimiento de salida por envío
                    $movimiento = MovimientoInventario::registrar(
                        $stockLote,
                        -$cantidadTomar, // Negativo para salida
                        MovimientoInventario::TIPO_SALIDA_ENVIO,
                        "Envío #{$numeroEnvio}",
                        $numeroEnvio
                    );

                    $movimientos[] = $movimiento;
                    $cantidadRestante -= $cantidadTomar;
                }

                if ($cantidadRestante > 0) {
                    throw new Exception("Stock insuficiente para producto ID {$productoId}. Faltan {$cantidadRestante} unidades.");
                }
            }

            DB::commit();

            return $movimientos;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Procesar entrada de stock por cancelación de envío
     */
    public function procesarEntradaCancelacionEnvio(array $productos, string $numeroEnvio, int $almacenId = 1): array
    {
        $movimientos = [];

        DB::beginTransaction();

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

            DB::commit();

            return $movimientos;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
