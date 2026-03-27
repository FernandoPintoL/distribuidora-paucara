<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    protected $table = 'compras';

    protected $fillable = [
        'numero',
        'fecha',
        'numero_factura',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'observaciones',
        'proveedor_id',
        'usuario_id',
        'estado_documento_id',
        'moneda_id',
        'tipo_pago_id',
        'almacen_id',
    ];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    // Relaciones
    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function estadoDocumento()
    {
        return $this->belongsTo(EstadoDocumento::class, 'estado_documento_id');
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class, 'moneda_id');
    }

    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class, 'tipo_pago_id');
    }

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }

    public function cuentaPorPagar()
    {
        return $this->hasOne(CuentaPorPagar::class, 'compra_id');
    }

    public function pagos()
    {
        return $this->hasManyThrough(
            Pago::class,
            CuentaPorPagar::class,
            'compra_id',
            'cuenta_por_pagar_id',
            'id',
            'id'
        );
    }

    public function movimientoCaja()
    {
        return $this->hasOne(MovimientoCaja::class, 'numero_documento', 'numero');
    }

    public function asientoContable()
    {
        return $this->morphOne(AsientoContable::class, 'asientable');
    }

    /**
     * Revertir movimientos de inventario al anular compra
     *
     * Crea movimientos de salida (cantidad negativa) para revertir las entradas originales
     */
    public function revertirMovimientosInventario(): void
    {
        // ✅ REFACTORIZADO (2026-03-27): Revertir movimientos de compra AGRUPADOS
        // Agrupa detalles por producto_id y crea movimientos agregados

        $almacen = $this->almacen;

        if (!$almacen) {
            \Illuminate\Support\Facades\Log::warning('No hay almacén configurado para la compra', [
                'compra_id' => $this->id,
                'almacen_id' => $this->almacen_id,
            ]);
            return;
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($almacen) {
            // Agrupar detalles por producto_id
            $detallesPorProducto = $this->detalles->groupBy('producto_id');

            foreach ($detallesPorProducto as $productoId => $detallesProducto) {
                $detallesLotes = [];
                $cantidadTotalARevertir = 0;
                $producto = $detallesProducto->first()->producto;

                // Procesar cada detalle (lote) del producto
                foreach ($detallesProducto as $detalle) {
                    try {
                        // Buscar o crear stock_producto para este lote específico
                        $stockProducto = \App\Models\StockProducto::where('producto_id', $productoId)
                            ->where('almacen_id', $almacen->id)
                            ->where(function ($q) use ($detalle) {
                                if ($detalle->lote) {
                                    $q->where('lote', $detalle->lote);
                                } else {
                                    $q->whereNull('lote');
                                }
                            })
                            ->lockForUpdate()
                            ->first();

                        if (!$stockProducto) {
                            // Si no existe, crearlo (caso raro)
                            $stockProducto = \App\Models\StockProducto::create([
                                'producto_id' => $productoId,
                                'almacen_id' => $almacen->id,
                                'cantidad' => 0,
                                'cantidad_disponible' => 0,
                                'cantidad_reservada' => 0,
                                'lote' => $detalle->lote,
                                'fecha_vencimiento' => $detalle->fecha_vencimiento,
                                'fecha_actualizacion' => now(),
                            ]);
                        }

                        // Capturar ANTES de actualizar
                        $cantidadAnterior = (float) $stockProducto->cantidad;
                        $cantidadDisponibleAnterior = (float) $stockProducto->cantidad_disponible;
                        $cantidadReservadaAnterior = (float) $stockProducto->cantidad_reservada;
                        $cantidadARevertir = (int) $detalle->cantidad;

                        // Revertir: decrementar cantidad (salida)
                        $stockProducto->decrement('cantidad', $cantidadARevertir);
                        $stockProducto->decrement('cantidad_disponible', $cantidadARevertir);

                        // Recargar para obtener DESPUÉS
                        $stockProducto->refresh();
                        $cantidadPosterior = (float) $stockProducto->cantidad;
                        $cantidadDisponiblePosterior = (float) $stockProducto->cantidad_disponible;
                        $cantidadReservadaPosterior = (float) $stockProducto->cantidad_reservada;

                        // Guardar detalle por lote
                        $detallesLotes[] = [
                            'stock_producto_id' => $stockProducto->id,
                            'lote' => $stockProducto->lote,
                            'cantidad' => -$cantidadARevertir,  // Negativo: salida
                            'cantidad_total_anterior' => $cantidadAnterior,
                            'cantidad_total_posterior' => $cantidadPosterior,
                            'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                            'cantidad_disponible_posterior' => $cantidadDisponiblePosterior,
                            'cantidad_reservada_anterior' => $cantidadReservadaAnterior,
                            'cantidad_reservada_posterior' => $cantidadReservadaPosterior,
                        ];

                        $cantidadTotalARevertir += $cantidadARevertir;

                        // Eliminar lote si queda en 0 o negativo
                        if ($cantidadPosterior <= 0) {
                            \Illuminate\Support\Facades\Log::info('Eliminando lote completamente por anulación de compra', [
                                'stock_producto_id' => $stockProducto->id,
                                'producto_id' => $productoId,
                                'lote' => $detalle->lote,
                                'almacen_id' => $almacen->id,
                                'cantidad_final' => $cantidadPosterior,
                            ]);

                            // Eliminar movimientos primero (FK constraint)
                            \App\Models\MovimientoInventario::where('stock_producto_id', $stockProducto->id)
                                ->forceDelete();

                            $stockProducto->forceDelete();
                        }

                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Error al revertir detalle de compra', [
                            'compra_id' => $this->id,
                            'producto_id' => $productoId,
                            'detalle_id' => $detalle->id,
                            'lote' => $detalle->lote,
                            'error' => $e->getMessage(),
                        ]);

                        throw $e;
                    }
                }

                // ✅ REFACTORIZADO (2026-03-27): Crear UN SOLO movimiento SALIDA_AJUSTE agregado
                if ($cantidadTotalARevertir > 0) {
                    $movimientoService = new \App\Services\Stock\MovimientoInventarioService();
                    $movimiento = $movimientoService->registrarMovimientoAgrupado(
                        $productoId,
                        $almacen->id,
                        \App\Models\MovimientoInventario::TIPO_SALIDA_AJUSTE,
                        -$cantidadTotalARevertir,  // Negativo: salida
                        $this->numero,
                        $detallesLotes,
                        [
                            'referencia_tipo' => 'compra_anulacion',
                            'referencia_id' => $this->id,
                            'observacion_extra' => [
                                'compra_numero' => $this->numero,
                                'compra_id' => $this->id,
                                'motivo' => 'Reversión por anulación de compra',
                            ]
                        ]
                    );

                    \Illuminate\Support\Facades\Log::info('✅ Movimiento de reversión agrupado registrado para compra', [
                        'compra' => $this->numero,
                        'producto_id' => $productoId,
                        'movimiento_id' => $movimiento->id,
                        'cantidad_lotes' => count($detallesLotes),
                        'cantidad_total' => $cantidadTotalARevertir,
                    ]);
                }
            }

            \Illuminate\Support\Facades\Log::info('✅ Inventario revertido exitosamente por anulación de compra (AGRUPADO)', [
                'compra_id' => $this->id,
                'compra_numero' => $this->numero,
                'productos_revertidos' => count($detallesPorProducto),
            ]);
        });
    }

    /**
     * Revertir movimiento de caja al anular compra
     *
     * Crea un movimiento de ingreso (monto positivo) para compensar el egreso original
     */
    public function revertirMovimientoCaja(): void
    {
        if (!$this->movimientoCaja) {
            return;
        }

        try {
            $movimientoOriginal = $this->movimientoCaja;

            // Obtener el tipo de operación ANULACION para la reversión
            $tipoOperacionAnulacion = \App\Models\TipoOperacionCaja::where('codigo', 'ANULACION')->firstOrFail();

            // Crear movimiento de reversión con monto positivo (inverso del egreso)
            \App\Models\MovimientoCaja::create([
                'caja_id' => $movimientoOriginal->caja_id,
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'fecha' => now(),
                'monto' => abs($movimientoOriginal->monto), // Positivo (inverso del egreso negativo)
                'observaciones' => "Anulación de compra #{$this->numero}",
                'numero_documento' => $this->numero . '-ANU',
                'tipo_operacion_id' => $tipoOperacionAnulacion->id,
                'tipo_pago_id' => $movimientoOriginal->tipo_pago_id,
                'compra_id' => $this->id,
            ]);

            \Illuminate\Support\Facades\Log::info('Movimiento de caja revertido por anulación de compra', [
                'compra' => $this->numero,
                'movimiento_original_id' => $movimientoOriginal->id,
                'monto_original' => $movimientoOriginal->monto,
                'monto_reversa' => abs($movimientoOriginal->monto),
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al revertir movimiento de caja para compra ' . $this->numero, [
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
