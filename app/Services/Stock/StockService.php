<?php
namespace App\Services\Stock;

use App\DTOs\Stock\ValidacionStockDTO;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

/**
 * StockService - ÚNICA FUENTE DE VERDAD para operaciones de stock
 *
 * RESPONSABILIDADES:
 * ✓ Validar disponibilidad de stock
 * ✓ Consumir stock por venta
 * ✓ Recibir stock por compra
 * ✓ Revertir stock por devolución
 * ✓ Registrar movimientos
 * ✓ Manejar reservas
 *
 * INVARIANTE: Todos los cambios de stock PASAN POR AQUÍ
 *
 * NO RESPONSABILIDADES:
 * ✗ HTTP
 * ✗ Formateo de respuesta
 * ✗ Lógica de venta (eso es VentaService)
 */
class StockService
{
    use ManagesTransactions, LogsOperations;

    /**
     * Validar disponibilidad de stock para múltiples productos
     *
     * IMPORTANTE: No consume nada, solo valida
     *
     * @return ValidacionStockDTO
     */
    public function validarDisponible(
        array $productos,
        int $almacenId = 2
    ): ValidacionStockDTO {
        $resultados = [];
        $errores    = [];

        foreach ($productos as $item) {
            $productoId         = $item['producto_id'] ?? $item['id'];
            $cantidadSolicitada = $item['cantidad'];

            // Validar que el producto exista y esté activo
            $producto = Producto::find($productoId);

            if (! $producto) {
                $errores[]    = "Producto ID {$productoId}: No encontrado";
                $resultados[] = [
                    'producto_id'         => $productoId,
                    'cantidad_solicitada' => $cantidadSolicitada,
                    'stock_disponible'    => 0,
                    'suficiente'          => false,
                    'error'               => 'Producto no encontrado',
                ];
                continue;
            }

            if (! $producto->activo) {
                $errores[]    = "Producto '{$producto->nombre}': Desactivado";
                $resultados[] = [
                    'producto_id'         => $productoId,
                    'cantidad_solicitada' => $cantidadSolicitada,
                    'stock_disponible'    => 0,
                    'suficiente'          => false,
                    'error'               => 'Producto desactivado',
                ];
                continue;
            }

            $stockDisponible = $this->obtenerDisponible($productoId, $almacenId);

            $suficiente = $stockDisponible >= $cantidadSolicitada;

            $resultado = [
                'producto_id'         => $productoId,
                'producto_nombre'     => $producto->nombre,
                'cantidad_solicitada' => $cantidadSolicitada,
                'stock_disponible'    => $stockDisponible,
                'suficiente'          => $suficiente,
            ];

            if (! $suficiente) {
                $errores[] = "Producto '{$producto->nombre}': Stock insuficiente. " .
                    "Disponible: {$stockDisponible}, Solicitado: {$cantidadSolicitada}";
            }

            $resultados[] = $resultado;
        }

        return new ValidacionStockDTO(
            valido: empty($errores),
            errores: $errores,
            detalles: $resultados,
        );
    }

    /**
     * Obtener stock disponible de un producto en un almacén
     *
     * Fórmula: cantidad_física - reservas_activas
     *
     * IMPORTANTE: Usa cantidad_disponible campo calculado en BD
     */
    public function obtenerDisponible(int $productoId, int $almacenId = 1): int
    {
        return StockProducto::where('producto_id', $productoId)
            ->where('almacen_id', $almacenId)
            ->sum('cantidad_disponible');
    }

    /**
     * Consumir stock por venta
     *
     * DEBE ser llamado DENTRO de una transacción
     *
     * @param array $productos Array de { producto_id, cantidad }
     * @param string $referencia Identificador de la operación (VENTA#123)
     * @param int $almacenId
     * @throws Exception Si hay stock insuficiente
     */
    public function procesarSalidaVenta(
        array $productos,
        string $referencia,
        int $almacenId = 1
    ): array {
        $movimientos = [];

        try {
            foreach ($productos as $item) {
                $productoId        = $item['producto_id'] ?? $item['id'];
                $cantidadNecesaria = $item['cantidad'];

                // Obtener stock con LOCK pesimista (FIFO)
                $stocks = StockProducto::where('producto_id', $productoId)
                    ->where('almacen_id', $almacenId)
                    ->where('cantidad_disponible', '>', 0)
                    ->orderBy('fecha_vencimiento', 'asc')
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->get();

                // Validar stock total
                $stockTotal = $stocks->sum('cantidad_disponible');
                if ($stockTotal < $cantidadNecesaria) {
                    throw new Exception(
                        "Stock insuficiente para producto ID {$productoId}"
                    );
                }

                // Consumir según FIFO
                $cantidadRestante = $cantidadNecesaria;

                foreach ($stocks as $stock) {
                    if ($cantidadRestante <= 0) {
                        break;
                    }

                    $cantidadTomar = min($cantidadRestante, $stock->cantidad_disponible);

                    // Actualizar stock
                    $stock->decrement('cantidad_disponible', $cantidadTomar);
                    $stock->decrement('cantidad', $cantidadTomar);

                    // Registrar movimiento
                    $movimiento = MovimientoInventario::create([
                        'stock_producto_id'  => $stock->id,
                        'cantidad'           => -$cantidadTomar,
                        'cantidad_anterior'  => $stock->cantidad + $cantidadTomar,
                        'cantidad_posterior' => $stock->cantidad,
                        'tipo'               => MovimientoInventario::TIPO_SALIDA_VENTA,
                        'numero_documento'   => $referencia,
                        'fecha'              => now(),
                        'user_id'            => Auth::id(),
                    ]);

                    $movimientos[] = $movimiento;
                    $cantidadRestante -= $cantidadTomar;
                }
            }

            $this->logSuccess('Stock consumido por venta', [
                'referencia'  => $referencia,
                'movimientos' => count($movimientos),
            ]);

            return $movimientos;

        } catch (Exception $e) {
            $this->logError('Error al consumir stock', [
                'referencia' => $referencia,
                'error'      => $e->getMessage(),
            ], $e);

            throw $e;
        }
    }

    /**
     * Devolver stock por rechazo o devolución
     *
     * DEBE ser llamado DENTRO de una transacción
     */
    public function devolverStock(
        array $productos,
        string $referencia,
        int $almacenId = 1
    ): array {
        $movimientos = [];

        try {
            foreach ($productos as $item) {
                $productoId = $item['producto_id'] ?? $item['id'];
                $cantidad   = $item['cantidad'];

                // Buscar o crear stock
                $stock = StockProducto::firstOrCreate(
                    [
                        'producto_id' => $productoId,
                        'almacen_id'  => $almacenId,
                    ],
                    [
                        'cantidad'            => 0,
                        'cantidad_disponible' => 0,
                    ]
                );

                // Aumentar cantidad
                $stock->increment('cantidad', $cantidad);
                $stock->increment('cantidad_disponible', $cantidad);

                // Registrar movimiento
                $movimiento = MovimientoInventario::create([
                    'stock_producto_id'  => $stock->id,
                    'cantidad'           => $cantidad,
                    'cantidad_anterior'  => $stock->cantidad - $cantidad,
                    'cantidad_posterior' => $stock->cantidad,
                    'tipo'               => MovimientoInventario::TIPO_ENTRADA_DEVOLUCION,
                    'numero_documento'   => $referencia,
                    'fecha'              => now(),
                    'user_id'            => Auth::id(),
                ]);

                $movimientos[] = $movimiento;
            }

            $this->logSuccess('Stock devuelto', [
                'referencia'  => $referencia,
                'movimientos' => count($movimientos),
            ]);

            return $movimientos;

        } catch (Exception $e) {
            $this->logError('Error al devolver stock', [
                'referencia' => $referencia,
            ], $e);

            throw $e;
        }
    }

    /**
     * Recibir stock por compra
     *
     * DEBE ser llamado DENTRO de una transacción
     */
    public function procesarEntradaCompra(
        array $productos,
        string $referencia,
        int $almacenId = 1
    ): array {
        $movimientos = [];

        try {
            foreach ($productos as $item) {
                $productoId       = $item['producto_id'] ?? $item['id'];
                $cantidad         = $item['cantidad'];
                $lote             = $item['lote'] ?? null;
                $fechaVencimiento = $item['fecha_vencimiento'] ?? null;

                // Buscar o crear
                $stock = StockProducto::firstOrCreate(
                    [
                        'producto_id' => $productoId,
                        'almacen_id'  => $almacenId,
                        'lote'        => $lote,
                    ],
                    [
                        'cantidad'            => 0,
                        'cantidad_disponible' => 0,
                        'fecha_vencimiento'   => $fechaVencimiento,
                    ]
                );

                // Aumentar cantidad
                $stock->increment('cantidad', $cantidad);
                $stock->increment('cantidad_disponible', $cantidad);

                // Registrar movimiento
                $movimiento = MovimientoInventario::create([
                    'stock_producto_id'  => $stock->id,
                    'cantidad'           => $cantidad,
                    'cantidad_anterior'  => $stock->cantidad - $cantidad,
                    'cantidad_posterior' => $stock->cantidad,
                    'tipo'               => MovimientoInventario::TIPO_ENTRADA_COMPRA,
                    'numero_documento'   => $referencia,
                    'fecha'              => now(),
                    'user_id'            => Auth::id(),
                ]);

                $movimientos[] = $movimiento;
            }

            $this->logSuccess('Stock recibido por compra', [
                'referencia'  => $referencia,
                'movimientos' => count($movimientos),
            ]);

            return $movimientos;

        } catch (Exception $e) {
            $this->logError('Error al recibir compra', [
                'referencia' => $referencia,
            ], $e);

            throw $e;
        }
    }

    /**
     * Obtener productos con stock bajo
     */
    public function obtenerStockBajo(): Collection
    {
        return Producto::whereHas('stocks', function ($query) {
            $query->selectRaw('producto_id, SUM(cantidad) as total')
                ->groupBy('producto_id')
                ->havingRaw('SUM(cantidad) <= productos.stock_minimo');
        })->get();
    }

    /**
     * Obtener productos próximos a vencer
     */
    public function obtenerProximosVencer(int $dias = 30): Collection
    {
        return StockProducto::whereBetween('fecha_vencimiento', [
            now(),
            now()->addDays($dias),
        ])->with('producto')->get();
    }
}
