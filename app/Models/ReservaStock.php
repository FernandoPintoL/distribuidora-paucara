<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class ReservaStock extends Model
{
    use HasFactory;

    protected $table = 'reservas_stock';

    protected $fillable = [
        'producto_id',
        'almacen_id',
        'user_id',
        'tipo_reserva',
        'referencia_tipo',
        'referencia_id',
        'cantidad_reservada',
        'cantidad_utilizada',
        'estado',
        'fecha_vencimiento',
        'motivo',
        'observaciones',
        'fecha_liberacion',
        'liberado_por'
    ];

    protected $casts = [
        'cantidad_reservada' => 'decimal:4',
        'cantidad_utilizada' => 'decimal:4',
        'fecha_vencimiento' => 'datetime',
        'fecha_liberacion' => 'datetime',
    ];

    // Estados de reserva
    const ESTADO_ACTIVA = 'activa';
    const ESTADO_PARCIALMENTE_UTILIZADA = 'parcialmente_utilizada';
    const ESTADO_UTILIZADA = 'utilizada';
    const ESTADO_LIBERADA = 'liberada';
    const ESTADO_VENCIDA = 'vencida';

    // Tipos de reserva
    const TIPO_VENTA = 'venta';
    const TIPO_ORDEN = 'orden';
    const TIPO_TRANSFERENCIA = 'transferencia';
    const TIPO_MANUAL = 'manual';

    // Relaciones
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function liberadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'liberado_por');
    }

    // Scopes
    public function scopeActivas($query)
    {
        return $query->where('estado', self::ESTADO_ACTIVA);
    }

    public function scopeVencidas($query)
    {
        return $query->where('estado', self::ESTADO_VENCIDA)
                    ->orWhere(function($q) {
                        $q->whereNotNull('fecha_vencimiento')
                          ->where('fecha_vencimiento', '<', now());
                    });
    }

    public function scopePorVencer($query, $dias = 3)
    {
        return $query->where('estado', self::ESTADO_ACTIVA)
                    ->whereNotNull('fecha_vencimiento')
                    ->whereBetween('fecha_vencimiento', [now(), now()->addDays($dias)]);
    }

    public function scopePorProducto($query, $productoId)
    {
        return $query->where('producto_id', $productoId);
    }

    public function scopePorAlmacen($query, $almacenId)
    {
        return $query->where('almacen_id', $almacenId);
    }

    // Métodos auxiliares
    public function getCantidadDisponibleAttribute()
    {
        return $this->cantidad_reservada - $this->cantidad_utilizada;
    }

    public function estaVencida(): bool
    {
        if ($this->estado === self::ESTADO_VENCIDA) {
            return true;
        }

        if ($this->fecha_vencimiento && $this->fecha_vencimiento->isPast()) {
            return true;
        }

        return false;
    }

    public function puedeUtilizar($cantidad): bool
    {
        if ($this->estaVencida()) {
            return false;
        }

        if ($this->estado !== self::ESTADO_ACTIVA && $this->estado !== self::ESTADO_PARCIALMENTE_UTILIZADA) {
            return false;
        }

        return $this->cantidad_disponible >= $cantidad;
    }

    public function utilizar($cantidad, $observaciones = null): bool
    {
        if (!$this->puedeUtilizar($cantidad)) {
            return false;
        }

        $this->cantidad_utilizada += $cantidad;

        if ($this->cantidad_utilizada >= $this->cantidad_reservada) {
            $this->estado = self::ESTADO_UTILIZADA;
        } elseif ($this->cantidad_utilizada > 0) {
            $this->estado = self::ESTADO_PARCIALMENTE_UTILIZADA;
        }

        if ($observaciones) {
            $this->observaciones = $this->observaciones
                ? $this->observaciones . "\n" . $observaciones
                : $observaciones;
        }

        return $this->save();
    }

    public function liberar($userId, $motivo = null): bool
    {
        if ($this->estado === self::ESTADO_UTILIZADA || $this->estado === self::ESTADO_LIBERADA) {
            return false;
        }

        $this->estado = self::ESTADO_LIBERADA;
        $this->fecha_liberacion = now();
        $this->liberado_por = $userId;

        if ($motivo) {
            $this->observaciones = $this->observaciones
                ? $this->observaciones . "\n" . $motivo
                : $motivo;
        }

        return $this->save();
    }

    public function marcarComoVencida(): bool
    {
        if ($this->estado === self::ESTADO_UTILIZADA || $this->estado === self::ESTADO_LIBERADA) {
            return false;
        }

        $this->estado = self::ESTADO_VENCIDA;
        return $this->save();
    }

    // Métodos estáticos
    public static function reservarStock($productoId, $almacenId, $cantidad, $tipoReserva, $userId, $options = [])
    {
        $reserva = new self([
            'producto_id' => $productoId,
            'almacen_id' => $almacenId,
            'user_id' => $userId,
            'tipo_reserva' => $tipoReserva,
            'cantidad_reservada' => $cantidad,
            'referencia_tipo' => $options['referencia_tipo'] ?? null,
            'referencia_id' => $options['referencia_id'] ?? null,
            'fecha_vencimiento' => $options['fecha_vencimiento'] ?? null,
            'motivo' => $options['motivo'] ?? null,
            'observaciones' => $options['observaciones'] ?? null,
        ]);

        return $reserva->save() ? $reserva : null;
    }

    public static function stockReservado($productoId, $almacenId = null)
    {
        $query = self::where('producto_id', $productoId)
                    ->whereIn('estado', [self::ESTADO_ACTIVA, self::ESTADO_PARCIALMENTE_UTILIZADA]);

        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        return $query->sum(\DB::raw('cantidad_reservada - cantidad_utilizada'));
    }

    public static function liberarReservasVencidas()
    {
        return self::where('estado', '!=', self::ESTADO_LIBERADA)
                  ->where('estado', '!=', self::ESTADO_UTILIZADA)
                  ->where('fecha_vencimiento', '<', now())
                  ->update(['estado' => self::ESTADO_VENCIDA]);
    }
}