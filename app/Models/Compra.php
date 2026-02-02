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
        foreach ($this->detalles as $detalle) {
            $producto = $detalle->producto;
            // ✅ Usar el almacén de la compra, no el primero disponible
            $almacen = $this->almacen;

            if (!$almacen) {
                \Illuminate\Support\Facades\Log::warning('No hay almacén configurado para la compra', [
                    'compra_id' => $this->id,
                    'detalle_id' => $detalle->id,
                    'almacen_id' => $this->almacen_id,
                ]);
                continue;
            }

            try {
                // ✅ Buscar o crear el stock para revertir
                $stockProducto = \App\Models\StockProducto::where('producto_id', $producto->id)
                    ->where('almacen_id', $almacen->id)
                    ->where(function ($q) use ($detalle) {
                        if ($detalle->lote) {
                            $q->where('lote', $detalle->lote);
                        } else {
                            $q->whereNull('lote');
                        }
                    })
                    ->first();

                if (!$stockProducto) {
                    // Si no existe, crearlo (caso raro, pero posible)
                    $stockProducto = \App\Models\StockProducto::create([
                        'producto_id' => $producto->id,
                        'almacen_id' => $almacen->id,
                        'cantidad' => 0,
                        'cantidad_disponible' => 0,
                        'cantidad_reservada' => 0,
                        'lote' => $detalle->lote,
                        'fecha_vencimiento' => $detalle->fecha_vencimiento,
                        'fecha_actualizacion' => now(),
                    ]);
                }

                // ✅ Actualizar directamente (sin validación de stock negativo)
                $cantidadAnterior = $stockProducto->cantidad;
                $cantidadNueva = $cantidadAnterior - (int)$detalle->cantidad;

                \Illuminate\Support\Facades\DB::table('stock_productos')
                    ->where('id', $stockProducto->id)
                    ->update([
                        'cantidad' => $cantidadNueva,
                        'cantidad_disponible' => $cantidadNueva,
                        'fecha_actualizacion' => now(),
                    ]);

                // ✅ Registrar movimiento de ajuste (sin validación)
                \App\Models\MovimientoInventario::create([
                    'stock_producto_id' => $stockProducto->id,
                    'cantidad' => -(int)$detalle->cantidad,
                    'fecha' => now(),
                    'observacion' => "Reversión por anulación de compra #{$this->numero}",
                    'numero_documento' => $this->numero,
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_posterior' => $cantidadNueva,
                    'tipo' => \App\Models\MovimientoInventario::TIPO_SALIDA_AJUSTE,
                    'user_id' => \Illuminate\Support\Facades\Auth::id(),
                ]);

                // ✅ Si el lote queda en cantidad 0 o negativo, eliminarlo completamente (hard delete)
                if ($cantidadNueva <= 0) {
                    \Illuminate\Support\Facades\Log::info('Eliminando lote completamente por anulación de compra', [
                        'stock_producto_id' => $stockProducto->id,
                        'producto_id' => $producto->id,
                        'lote' => $detalle->lote,
                        'almacen_id' => $almacen->id,
                        'cantidad_final' => $cantidadNueva,
                    ]);

                    // ✅ Primero eliminar los movimientos de inventario asociados (para evitar FK constraint)
                    \App\Models\MovimientoInventario::where('stock_producto_id', $stockProducto->id)
                        ->forceDelete();

                    // ✅ Luego eliminar el stock_producto
                    $stockProducto->forceDelete();  // Hard delete - elimina completamente del registro
                }

                \Illuminate\Support\Facades\Log::info('Inventario revertido por anulación de compra', [
                    'compra_id' => $this->id,
                    'producto_id' => $producto->id,
                    'cantidad' => $detalle->cantidad,
                    'almacen_id' => $almacen->id,
                    'lote' => $detalle->lote,
                    'cantidad_final' => $cantidadNueva,
                ]);

            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Error al revertir movimiento de inventario por compra', [
                    'compra_id' => $this->id,
                    'producto_id' => $producto->id,
                    'lote' => $detalle->lote,
                    'error' => $e->getMessage(),
                ]);

                throw $e;
            }
        }
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
