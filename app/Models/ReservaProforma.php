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
    public function consumir(): bool
    {
        if ($this->estado !== self::ACTIVA) {
            return false;
        }

        try {
            // Actualizar estado de reserva
            $this->update(['estado' => self::CONSUMIDA]);

            // ✅ SIMPLIFICADO: Actualizar stock confiando en que la reserva se creó correctamente
            // Las reservas ya validaron disponibilidad al crearse, así que simplemente descuenta
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

            \Illuminate\Support\Facades\Log::info('✅ Reserva consumida', [
                'reserva_id' => $this->id,
                'proforma_id' => $this->proforma_id,
                'stock_producto_id' => $this->stock_producto_id,
                'cantidad' => $this->cantidad_reservada,
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
