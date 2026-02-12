<?php

namespace App\Services\Reservas;

use App\Models\Proforma;
use App\Models\Producto;
use App\Models\ReservaProforma;
use App\Models\MovimientoInventario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de Distribución de Reservas
 *
 * Implementa algoritmo FIFO (First-In-First-Out) para distribuir reservas
 * entre múltiples lotes del mismo producto
 */
class ReservaDistribucionService
{
    /**
     * Distribuir cantidad entre lotes disponibles (FIFO)
     *
     * @param Proforma $proforma
     * @param int $producto_id
     * @param int $cantidad_solicitada
     * @param int $dias_vencimiento (por defecto 3 días)
     *
     * @return array ['success' => bool, 'reservas' => [...], 'error' => string|null, 'distribucion' => [...]]
     */
    public function distribuirReserva(
        Proforma $proforma,
        int $producto_id,
        int $cantidad_solicitada,
        int $dias_vencimiento = 3
    ) {
        try {
            // 🔧 Obtener el almacén de la empresa del usuario autenticado
            $user = auth()->user();
            if (!$user || !$user->empresa) {
                return [
                    'success' => false,
                    'reservas' => [],
                    'error' => 'No se encontró empresa para el usuario autenticado',
                    'distribucion' => [],
                ];
            }

            $almacen_id = $user->empresa->almacen_id;
            if (!$almacen_id) {
                return [
                    'success' => false,
                    'reservas' => [],
                    'error' => 'La empresa no tiene almacén definido',
                    'distribucion' => [],
                ];
            }

            // Obtener producto
            $producto = Producto::findOrFail($producto_id);

            // Obtener todos los lotes disponibles (FIFO: ordenado por ID ASC para seguir creación)
            $lotes = $producto->stock()
                ->where('almacen_id', $almacen_id)
                ->whereRaw('cantidad_disponible > 0')  // Solo lotes con stock disponible
                ->orderBy('id', 'ASC')  // FIFO: más antiguo primero (por ID)
                ->get();

            // Validar que hay stock disponible
            $total_disponible = $lotes->sum('cantidad_disponible');
            if ($total_disponible < $cantidad_solicitada) {
                return [
                    'success' => false,
                    'reservas' => [],
                    'error' => "Stock insuficiente. Disponible: {$total_disponible}, Solicitado: {$cantidad_solicitada}",
                    'distribucion' => [],
                ];
            }

            // Distribuir entre lotes
            $reservas_creadas = [];
            $distribucion = [];
            $cantidad_pendiente = $cantidad_solicitada;

            DB::transaction(function () use (
                &$reservas_creadas,
                &$distribucion,
                &$cantidad_pendiente,
                $lotes,
                $proforma,
                $producto,
                $almacen_id,
                $dias_vencimiento
            ) {
                foreach ($lotes as $stock_producto) {
                    if ($cantidad_pendiente <= 0) {
                        break;  // Ya se distribuyó todo
                    }

                    // Calcular cuánto se puede tomar de este lote
                    // Cast a integer porque cantidad_reservada es INTEGER, no DECIMAL
                    $cantidad_a_reservar = (int) min($cantidad_pendiente, $stock_producto->cantidad_disponible);

                    // 📊 CAPTURAR TOTAL DEL PRODUCTO ANTES DE ACTUALIZAR
                    // El movimiento debe registrar el TOTAL del producto (todos los lotes), no solo este lote
                    $totalProductoAntes = $producto->stock()
                        ->where('almacen_id', $almacen_id)
                        ->sum('cantidad_disponible');

                    // Crear reserva para este lote
                    $reserva = ReservaProforma::create([
                        'proforma_id' => $proforma->id,
                        'stock_producto_id' => $stock_producto->id,
                        'cantidad_reservada' => $cantidad_a_reservar,
                        'fecha_reserva' => now(),
                        'fecha_expiracion' => now()->addDays($dias_vencimiento),
                        'estado' => ReservaProforma::ACTIVA,
                    ]);

                    // Actualizar cantidades en stock
                    $stock_producto->decrement('cantidad_disponible', $cantidad_a_reservar);
                    $stock_producto->increment('cantidad_reservada', $cantidad_a_reservar);

                    // 📊 CAPTURAR TOTAL DEL PRODUCTO DESPUÉS DE ACTUALIZAR
                    $totalProductoDespues = $producto->stock()
                        ->where('almacen_id', $almacen_id)
                        ->sum('cantidad_disponible');

                    // Registrar movimiento en inventario con TOTAL del producto
                    MovimientoInventario::create([
                        'stock_producto_id' => $stock_producto->id,
                        'cantidad' => -$cantidad_a_reservar,  // Negativo: reserva
                        'cantidad_anterior' => $totalProductoAntes,  // 📊 TOTAL del producto ANTES
                        'cantidad_posterior' => $totalProductoDespues,  // 📊 TOTAL del producto DESPUÉS
                        'tipo' => MovimientoInventario::TIPO_RESERVA_PROFORMA,
                        'numero_documento' => $proforma->numero,
                        'referencia_tipo' => 'proforma',
                        'referencia_id' => $proforma->id,
                        'observacion' => "FIFO: {$cantidad_a_reservar} unidades de lote {$stock_producto->lote} (Total producto: {$totalProductoAntes}→{$totalProductoDespues}, Vencimiento: {$dias_vencimiento}d)",
                        'user_id' => Auth::id() ?? 1,
                        'fecha' => now(),
                    ]);

                    // Registrar en array de respuesta
                    $reservas_creadas[] = $reserva;
                    $distribucion[] = [
                        'reserva_id' => $reserva->id,
                        'stock_producto_id' => $stock_producto->id,
                        'lote' => $stock_producto->lote,
                        'cantidad_reservada' => $cantidad_a_reservar,
                        'cantidad_disponible_antes' => $stock_producto->cantidad_disponible + $cantidad_a_reservar,
                        'cantidad_disponible_ahora' => $stock_producto->cantidad_disponible,
                    ];

                    $cantidad_pendiente -= $cantidad_a_reservar;

                    Log::info('✅ Reserva distribuida de lote', [
                        'reserva_id' => $reserva->id,
                        'proforma_id' => $proforma->id,
                        'producto_id' => $producto->id,
                        'lote' => $stock_producto->lote,
                        'cantidad' => $cantidad_a_reservar,
                    ]);
                }
            });

            return [
                'success' => true,
                'reservas' => $reservas_creadas,
                'error' => null,
                'distribucion' => $distribucion,
                'resumen' => [
                    'cantidad_solicitada' => $cantidad_solicitada,
                    'cantidad_reservada' => $cantidad_solicitada - $cantidad_pendiente,
                    'cantidad_lotes' => count($distribucion),
                    'dias_vencimiento' => $dias_vencimiento,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('❌ Error distribuiendo reserva', [
                'proforma_id' => $proforma->id,
                'producto_id' => $producto_id,
                'cantidad' => $cantidad_solicitada,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'reservas' => [],
                'error' => $e->getMessage(),
                'distribucion' => [],
            ];
        }
    }

    /**
     * Liberar todas las reservas de un producto en una proforma
     *
     * @param Proforma $proforma
     * @param int $producto_id
     * @param string $motivo
     *
     * @return array ['success' => bool, 'cantidad_liberada' => int, 'reservas_liberadas' => int]
     */
    public function liberarReservasPorProducto(Proforma $proforma, int $producto_id, string $motivo = 'Producto removido')
    {
        try {
            $cantidad_liberada = 0;
            $reservas_liberadas = 0;

            DB::transaction(function () use (
                &$cantidad_liberada,
                &$reservas_liberadas,
                $proforma,
                $producto_id,
                $motivo
            ) {
                // Obtener todas las reservas activas de este producto en la proforma
                $reservas = ReservaProforma::whereHas('stockProducto', function ($q) use ($producto_id) {
                    $q->where('producto_id', $producto_id);
                })
                    ->where('proforma_id', $proforma->id)
                    ->where('estado', ReservaProforma::ACTIVA)
                    ->get();

                foreach ($reservas as $reserva) {
                    $cantidad = $reserva->cantidad_reservada;
                    $stock = $reserva->stockProducto;

                    // Restaurar stock
                    $stock->increment('cantidad_disponible', $cantidad);
                    $stock->decrement('cantidad_reservada', $cantidad);

                    // Registrar movimiento
                    MovimientoInventario::create([
                        'stock_producto_id' => $stock->id,
                        'cantidad' => $cantidad,  // Positivo: liberar
                        'tipo' => MovimientoInventario::TIPO_LIBERACION_RESERVA,
                        'numero_documento' => $proforma->numero,
                        'referencia_tipo' => 'proforma',
                        'referencia_id' => $proforma->id,
                        'observacion' => "{$motivo} (lote: {$stock->lote})",
                        'user_id' => Auth::id() ?? 1,
                        'fecha' => now(),
                    ]);

                    // Marcar reserva como liberada
                    $reserva->update(['estado' => ReservaProforma::LIBERADA]);

                    $cantidad_liberada += $cantidad;
                    $reservas_liberadas++;

                    Log::info('✅ Reserva liberada', [
                        'reserva_id' => $reserva->id,
                        'proforma_id' => $proforma->id,
                        'producto_id' => $producto_id,
                        'cantidad' => $cantidad,
                        'motivo' => $motivo,
                    ]);
                }
            });

            return [
                'success' => true,
                'cantidad_liberada' => $cantidad_liberada,
                'reservas_liberadas' => $reservas_liberadas,
            ];
        } catch (\Exception $e) {
            Log::error('❌ Error liberando reservas', [
                'proforma_id' => $proforma->id,
                'producto_id' => $producto_id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'cantidad_liberada' => 0,
                'reservas_liberadas' => 0,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Liberar TODAS las reservas de una proforma
     *
     * Se ejecuta cuando la proforma es rechazada o se requiere liberar todas las reservas
     *
     * @param Proforma $proforma
     * @param string $motivo (ej: "Proforma rechazada", "Cambio de cliente", etc.)
     *
     * @return array ['success' => bool, 'cantidad_liberada' => int, 'reservas_liberadas' => int, 'error' => string|null]
     */
    public function liberarTodasLasReservas(Proforma $proforma, string $motivo = 'Rechazo de proforma')
    {
        try {
            $cantidad_liberada = 0;
            $reservas_liberadas = 0;

            DB::transaction(function () use (
                &$cantidad_liberada,
                &$reservas_liberadas,
                $proforma,
                $motivo
            ) {
                // Obtener TODAS las reservas activas de esta proforma
                $reservas = ReservaProforma::where('proforma_id', $proforma->id)
                    ->where('estado', ReservaProforma::ACTIVA)
                    ->with('stockProducto')
                    ->get();

                foreach ($reservas as $reserva) {
                    $cantidad = $reserva->cantidad_reservada;
                    $stock = $reserva->stockProducto;
                    $producto = $stock->producto;
                    $almacen_id = $stock->almacen_id;

                    // 📊 CAPTURAR TOTAL DEL PRODUCTO ANTES DE RESTAURAR
                    $totalProductoAntes = $producto->stock()
                        ->where('almacen_id', $almacen_id)
                        ->sum('cantidad_disponible');

                    // Restaurar stock
                    $stock->increment('cantidad_disponible', $cantidad);
                    $stock->decrement('cantidad_reservada', $cantidad);

                    // 📊 CAPTURAR TOTAL DEL PRODUCTO DESPUÉS DE RESTAURAR
                    $totalProductoDespues = $producto->stock()
                        ->where('almacen_id', $almacen_id)
                        ->sum('cantidad_disponible');

                    // Registrar movimiento de liberación con TOTAL del producto
                    MovimientoInventario::create([
                        'stock_producto_id' => $stock->id,
                        'cantidad' => $cantidad,  // Positivo: liberar
                        'cantidad_anterior' => $totalProductoAntes,  // 📊 TOTAL del producto ANTES
                        'cantidad_posterior' => $totalProductoDespues,  // 📊 TOTAL del producto DESPUÉS
                        'tipo' => MovimientoInventario::TIPO_LIBERACION_RESERVA,
                        'numero_documento' => $proforma->numero,
                        'referencia_tipo' => 'proforma',
                        'referencia_id' => $proforma->id,
                        'observacion' => "{$motivo}: {$cantidad} unidades liberadas de lote {$stock->lote} (Total producto: {$totalProductoAntes}→{$totalProductoDespues})",
                        'user_id' => Auth::id() ?? 1,
                        'fecha' => now(),
                    ]);

                    // Marcar reserva como liberada
                    $reserva->update(['estado' => ReservaProforma::LIBERADA]);

                    $cantidad_liberada += $cantidad;
                    $reservas_liberadas++;

                    Log::info('✅ Reserva liberada por rechazo de proforma', [
                        'reserva_id' => $reserva->id,
                        'proforma_id' => $proforma->id,
                        'stock_producto_id' => $stock->id,
                        'cantidad' => $cantidad,
                        'motivo' => $motivo,
                    ]);
                }
            });

            return [
                'success' => true,
                'cantidad_liberada' => $cantidad_liberada,
                'reservas_liberadas' => $reservas_liberadas,
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('❌ Error liberando todas las reservas de proforma', [
                'proforma_id' => $proforma->id,
                'motivo' => $motivo,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'cantidad_liberada' => 0,
                'reservas_liberadas' => 0,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtener información de disponibilidad de un producto en el almacén de la empresa
     *
     * @param int $producto_id
     *
     * @return array ['total_cantidad' => int, 'total_disponible' => int, 'lotes' => [...]]
     */
    public function obtenerDisponibilidad(int $producto_id)
    {
        // 🔧 Obtener el almacén de la empresa del usuario autenticado
        $user = auth()->user();
        if (!$user || !$user->empresa) {
            return [
                'producto_id' => $producto_id,
                'almacen_id' => null,
                'total_cantidad' => 0,
                'total_disponible' => 0,
                'total_reservado' => 0,
                'lotes' => [],
                'error' => 'No se encontró empresa para el usuario autenticado',
            ];
        }

        $almacen_id = $user->empresa->almacen_id;
        if (!$almacen_id) {
            return [
                'producto_id' => $producto_id,
                'almacen_id' => null,
                'total_cantidad' => 0,
                'total_disponible' => 0,
                'total_reservado' => 0,
                'lotes' => [],
                'error' => 'La empresa no tiene almacén definido',
            ];
        }

        $lotes = Producto::findOrFail($producto_id)
            ->stock()
            ->where('almacen_id', $almacen_id)
            ->orderBy('id', 'ASC')
            ->get()
            ->map(function ($stock) {
                return [
                    'stock_producto_id' => $stock->id,
                    'lote' => $stock->lote,
                    'cantidad_total' => $stock->cantidad,
                    'cantidad_disponible' => $stock->cantidad_disponible,
                    'cantidad_reservada' => $stock->cantidad_reservada,
                    'porcentaje_disponible' => $stock->cantidad > 0
                        ? round(($stock->cantidad_disponible / $stock->cantidad) * 100, 2)
                        : 0,
                ];
            });

        return [
            'producto_id' => $producto_id,
            'almacen_id' => $almacen_id,
            'total_cantidad' => $lotes->sum('cantidad_total'),
            'total_disponible' => $lotes->sum('cantidad_disponible'),
            'total_reservado' => $lotes->sum('cantidad_reservada'),
            'lotes' => $lotes->all(),
        ];
    }
}
