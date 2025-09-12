<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservaProforma extends Model
{
    use HasFactory;

    protected $table = 'reservas_proforma';

    protected $fillable = [
        'proforma_id',
        'stock_producto_id',
        'cantidad_reservada',
        'fecha_reserva',
        'fecha_expiracion',
        'estado',
    ];

    protected $casts = [
        'fecha_reserva' => 'datetime',
        'fecha_expiracion' => 'datetime',
        'cantidad_reservada' => 'integer',
    ];

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

    public function liberar(): bool
    {
        if ($this->estado !== self::ACTIVA) {
            return false;
        }

        $this->update(['estado' => self::LIBERADA]);

        // Actualizar cantidad disponible en stock
        $this->stockProducto->increment('cantidad_disponible', $this->cantidad_reservada);
        $this->stockProducto->decrement('cantidad_reservada', $this->cantidad_reservada);

        return true;
    }

    public function consumir(): bool
    {
        if ($this->estado !== self::ACTIVA) {
            return false;
        }

        $this->update(['estado' => self::CONSUMIDA]);

        // Reducir cantidad física del stock y liberar reserva
        $this->stockProducto->decrement('cantidad', $this->cantidad_reservada);
        $this->stockProducto->decrement('cantidad_reservada', $this->cantidad_reservada);

        return true;
    }
}
