<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrestamoVendidoDetalle extends Model
{
    protected $table = 'prestamos_vendidos_detalles';

    protected $fillable = [
        'prestamo_vendido_id',
        'prestable_id',
        'almacen_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'observaciones',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    // ==================== RELACIONES ====================

    /**
     * Venta a la que pertenece este detalle
     */
    public function prestamoVendido(): BelongsTo
    {
        return $this->belongsTo(PrestamoVendido::class, 'prestamo_vendido_id');
    }

    /**
     * Prestable vendido
     */
    public function prestable(): BelongsTo
    {
        return $this->belongsTo(Prestable::class);
    }

    /**
     * Almacén del cual se sacó el prestable
     */
    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    // ==================== MÉTODOS ====================

    /**
     * Calcular subtotal automáticamente
     */
    public function calcularSubtotal(): self
    {
        $this->subtotal = $this->cantidad * $this->precio_unitario;
        return $this;
    }

    /**
     * Scope por prestable
     */
    public function scopePorPrestable($query, int $prestableId)
    {
        return $query->where('prestable_id', $prestableId);
    }

    /**
     * Scope por almacén
     */
    public function scopePorAlmacen($query, int $almacenId)
    {
        return $query->where('almacen_id', $almacenId);
    }
}
