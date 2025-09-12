<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockProducto extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'stock_productos';

    protected $fillable = [
        'producto_id',
        'almacen_id',
        'cantidad',
        'cantidad_reservada',
        'cantidad_disponible',
        'fecha_actualizacion',
        'lote',
        'fecha_vencimiento',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'cantidad_reservada' => 'integer',
        'cantidad_disponible' => 'integer',
        'fecha_actualizacion' => 'datetime',
        'fecha_vencimiento' => 'date',
    ];

    /**
     * Relaciones
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    public function movimientos()
    {
        return $this->hasMany(MovimientoInventario::class, 'stock_producto_id');
    }

    /**
     * Scopes
     */
    public function scopePorProducto($query, $productoId)
    {
        return $query->where('producto_id', $productoId);
    }

    public function scopePorAlmacen($query, $almacenId)
    {
        return $query->where('almacen_id', $almacenId);
    }

    public function scopeConStock($query)
    {
        return $query->where('cantidad', '>', 0);
    }

    public function scopeProximoVencer($query, int $diasAnticipacion = 30)
    {
        $fechaLimite = now()->addDays($diasAnticipacion);

        return $query->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '<=', $fechaLimite)
            ->where('fecha_vencimiento', '>', now());
    }

    public function scopeVencido($query)
    {
        return $query->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '<', now());
    }

    /**
     * Métodos auxiliares
     */
    public function estaVencido(): bool
    {
        return $this->fecha_vencimiento && $this->fecha_vencimiento < now()->toDateString();
    }

    public function proximoVencer(int $diasAnticipacion = 30): bool
    {
        if (! $this->fecha_vencimiento) {
            return false;
        }

        $fechaLimite = now()->addDays($diasAnticipacion);

        return $this->fecha_vencimiento <= $fechaLimite->toDateString() &&
        $this->fecha_vencimiento > now()->toDateString();
    }

    public function diasParaVencer(): ?int
    {
        if (! $this->fecha_vencimiento) {
            return null;
        }

        return now()->diffInDays($this->fecha_vencimiento, false);
    }

    /**
     * Relación con reservas
     */
    public function reservas()
    {
        return $this->hasMany(ReservaProforma::class, 'stock_producto_id');
    }

    public function reservasActivas()
    {
        return $this->reservas()->activas();
    }

    /**
     * Métodos para gestión de reservas
     */
    public function reservar(int $cantidad): bool
    {
        if ($this->cantidad_disponible < $cantidad) {
            return false;
        }

        $this->decrement('cantidad_disponible', $cantidad);
        $this->increment('cantidad_reservada', $cantidad);

        return true;
    }

    public function liberarReserva(int $cantidad): bool
    {
        if ($this->cantidad_reservada < $cantidad) {
            return false;
        }

        $this->increment('cantidad_disponible', $cantidad);
        $this->decrement('cantidad_reservada', $cantidad);

        return true;
    }

    public function tieneStockDisponible(int $cantidadRequerida): bool
    {
        return $this->cantidad_disponible >= $cantidadRequerida;
    }

    public function actualizarCantidadDisponible(): void
    {
        $reservasActivas = $this->reservasActivas()->sum('cantidad_reservada');
        $this->update([
            'cantidad_reservada' => $reservasActivas,
            'cantidad_disponible' => $this->cantidad - $reservasActivas,
        ]);
    }
}
