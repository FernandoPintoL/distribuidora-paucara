<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReservaProforma extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'reservas_proforma';

    protected $fillable = [
        'proforma_id',
        'stock_producto_id',
        'cantidad_reservada',
        'fecha_reserva',
        'fecha_expiracion',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_reserva' => 'datetime',
            'fecha_expiracion' => 'datetime',
            'cantidad_reservada' => 'integer',  // ← Asegurar que sea INTEGER, no float
            'proforma_id' => 'integer',
            'stock_producto_id' => 'integer',
            'deleted_at' => 'datetime', // ✓ Para SoftDeletes
        ];
    }

    // Estados de reserva
    const ACTIVA = 'ACTIVA';

    const LIBERADA = 'LIBERADA';

    const CONSUMIDA = 'CONSUMIDA';

    // Relaciones
    public function proforma(): BelongsTo
    {
        return $this->belongsTo(Proforma::class);
    }

    public function stockProducto(): BelongsTo
    {
        return $this->belongsTo(StockProducto::class, 'stock_producto_id');
    }

    // Scopes
    public function scopeActivas($query)
    {
        return $query->where('estado', self::ACTIVA);
    }

    public function scopeExpiradas($query)
    {
        return $query->where('fecha_expiracion', '<', now())
            ->where('estado', self::ACTIVA);
    }

    // Métodos de utilidad
    public function estaExpirada(): bool
    {
        return $this->fecha_expiracion && $this->fecha_expiracion->isPast() && $this->estado === self::ACTIVA;
    }

    /**
     * Liberar reserva (devolver a cantidad_disponible)
     *
     * IMPORTANTE: Sin transacción anidada (la transacción la maneja el caller)
     * PostgreSQL no soporta transacciones anidadas sin savepoints
     */
    public function liberar(): bool
    {
        if ($this->estado !== self::ACTIVA) {
            return false;
        }

        try {
            // Actualizar estado de reserva
            $this->update(['estado' => self::LIBERADA]);

            // Actualizar stock usando UPDATE atómico
            $affected = \Illuminate\Support\Facades\DB::table('stock_productos')
                ->where('id', $this->stock_producto_id)
                ->where('cantidad_reservada', '>=', $this->cantidad_reservada) // Validación
                ->update([
                    'cantidad_disponible' => \Illuminate\Support\Facades\DB::raw("cantidad_disponible + {$this->cantidad_reservada}"),
                    'cantidad_reservada' => \Illuminate\Support\Facades\DB::raw("cantidad_reservada - {$this->cantidad_reservada}"),
                    'fecha_actualizacion' => now(),
                ]);

            if ($affected === 0) {
                throw new \Exception("Error al liberar reserva - stock insuficiente o no encontrado");
            }

            \Illuminate\Support\Facades\Log::info('✅ Reserva liberada', [
                'reserva_id' => $this->id,
                'proforma_id' => $this->proforma_id,
                'stock_producto_id' => $this->stock_producto_id,
                'cantidad' => $this->cantidad_reservada,
            ]);

            return true;

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error al liberar reserva', [
                'reserva_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Consumir reserva (reducir cantidad física del stock)
     *
     * IMPORTANTE: Sin transacción anidada (la transacción la maneja el caller)
     * PostgreSQL no soporta transacciones anidadas sin savepoints
     */
    public function consumir(?string $numeroVenta = null): bool
    {
        if ($this->estado !== self::ACTIVA) {
            return false;
        }

        try {
            // 1️⃣ OBTENER VALORES ANTES DEL CAMBIO
            // ✅ NUEVO (2026-02-11): Agregado lockForUpdate() para prevenir race conditions
            $stockAntes = \Illuminate\Support\Facades\DB::table('stock_productos')
                ->where('id', $this->stock_producto_id)
                ->lockForUpdate()  // ← Previene race conditions en consumos concurrent
                ->first(['cantidad', 'cantidad_disponible', 'cantidad_reservada']);

            if (!$stockAntes) {
                throw new \Exception("Stock producto no encontrado (ID: {$this->stock_producto_id})");
            }

            // Actualizar estado de reserva
            $this->update(['estado' => self::CONSUMIDA]);

            // 2️⃣ ACTUALIZAR STOCK
            $affected = \Illuminate\Support\Facades\DB::table('stock_productos')
                ->where('id', $this->stock_producto_id)
                ->update([
                    'cantidad' => \Illuminate\Support\Facades\DB::raw("cantidad - {$this->cantidad_reservada}"),
                    'cantidad_reservada' => \Illuminate\Support\Facades\DB::raw("cantidad_reservada - {$this->cantidad_reservada}"),
                    'fecha_actualizacion' => now(),
                ]);

            if ($affected === 0) {
                throw new \Exception("Stock producto no encontrado (ID: {$this->stock_producto_id})");
            }

            // 3️⃣ OBTENER VALORES DESPUÉS DEL CAMBIO
            $stockDespues = \Illuminate\Support\Facades\DB::table('stock_productos')
                ->where('id', $this->stock_producto_id)
                ->first(['cantidad', 'cantidad_disponible', 'cantidad_reservada']);

            if (!$stockDespues) {
                throw new \Exception("Stock producto no encontrado después de actualizar (ID: {$this->stock_producto_id})");
            }

            // ✅ NUEVO: Registrar movimiento completo en movimientos_inventario
            try {
                $detallesMovimiento = [
                    'cantidad_anterior' => (int) $stockAntes->cantidad,
                    'cantidad_posterior' => (int) $stockDespues->cantidad,
                    'cantidad_disponible_anterior' => (int) $stockAntes->cantidad_disponible,
                    'cantidad_disponible_posterior' => (int) $stockDespues->cantidad_disponible,
                    'cantidad_reservada_anterior' => (int) $stockAntes->cantidad_reservada,
                    'cantidad_reservada_posterior' => (int) $stockDespues->cantidad_reservada,
                ];

                // ✅ MEJORADO (2026-02-11): Obtener información adicional de venta y producto
                $venta = null;
                $ventaId = null;
                if ($numeroVenta) {
                    $venta = Venta::where('numero', $numeroVenta)->first(['id', 'numero', 'cliente_id', 'total']);
                    $ventaId = $venta ? $venta->id : null;
                }

                // Obtener nombre del producto desde la relación stockProducto
                $stockProducto = $this->stockProducto;
                if (!$stockProducto) {
                    $stockProducto = StockProducto::find($this->stock_producto_id);
                }
                $productoNombre = ($stockProducto && $stockProducto->producto) ? $stockProducto->producto->nombre : 'Producto desconocido';
                $productoId = $stockProducto ? $stockProducto->producto_id : null;
                $lote = $stockProducto ? $stockProducto->lote : 'Sin lote';

                // Obtener número de proforma
                $proforma = $this->proforma;
                if (!$proforma) {
                    $proforma = Proforma::find($this->proforma_id);
                }
                $proformaNumero = $proforma ? $proforma->numero : "PRO-{$this->proforma_id}";

                $observacionData = [
                    'evento' => 'Consumo de reserva - Convertida a Venta',
                    // 🔗 VENTA (INFORMACIÓN CRÍTICA)
                    'venta_numero' => $numeroVenta ?? 'sin_numero',
                    'venta_id' => $ventaId,
                    // 📊 PROFORMA (REFERENCIA)
                    'proforma_numero' => $proformaNumero,
                    'proforma_id' => $this->proforma_id,
                    // 📦 PRODUCTO
                    'producto_nombre' => $productoNombre,
                    'producto_id' => $productoId,
                    'lote' => $lote,
                    'stock_producto_id' => $this->stock_producto_id,
                    // 📝 CANTIDAD
                    'cantidad_consumida' => (int) $this->cantidad_reservada,
                    'reserva_id' => $this->id,
                    'detalles' => $detallesMovimiento,
                ];

                \App\Models\MovimientoInventario::create([
                    'stock_producto_id' => $this->stock_producto_id,
                    'tipo' => 'CONSUMO_RESERVA',
                    'cantidad_anterior' => (int) $stockAntes->cantidad,
                    'cantidad' => -$this->cantidad_reservada, // Negativa = salida de stock
                    'cantidad_posterior' => (int) $stockDespues->cantidad,
                    'numero_documento' => $numeroVenta,
                    'observacion' => json_encode($observacionData, JSON_UNESCAPED_UNICODE),
                    'user_id' => \Illuminate\Support\Facades\Auth::id(),
                    'referencia_id' => $this->proforma_id,
                    'referencia_tipo' => 'proforma',
                ]);

                \Illuminate\Support\Facades\Log::info('✅ Movimiento de consumo registrado con detalles completos', [
                    'reserva_id' => $this->id,
                    'stock_producto_id' => $this->stock_producto_id,
                    'cantidad_consumida' => $this->cantidad_reservada,
                    'numero_venta' => $numeroVenta,
                    'detalles' => $detallesMovimiento,
                ]);
            } catch (\Exception $movimentoError) {
                // Log pero no bloquear el flujo si falla el registro de movimiento
                \Illuminate\Support\Facades\Log::warning('⚠️ Error al registrar movimiento de consumo (no crítico)', [
                    'reserva_id' => $this->id,
                    'error' => $movimentoError->getMessage(),
                    'trace' => $movimentoError->getTraceAsString(),
                ]);
            }

            \Illuminate\Support\Facades\Log::info('✅ Reserva consumida', [
                'reserva_id' => $this->id,
                'proforma_id' => $this->proforma_id,
                'stock_producto_id' => $this->stock_producto_id,
                'cantidad' => $this->cantidad_reservada,
                'numero_venta' => $numeroVenta,
            ]);

            return true;

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error al consumir reserva', [
                'reserva_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }
}
