<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompraPrestableDetalle extends Model
{
    protected $table = 'compra_prestable_detalles';

    protected $fillable = [
        'compra_prestable_id',
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
     * Compra a la que pertenece este detalle
     */
    public function compraPrestable(): BelongsTo
    {
        return $this->belongsTo(CompraPrestable::class, 'compra_prestable_id');
    }

    /**
     * Prestable comprado
     */
    public function prestable(): BelongsTo
    {
        return $this->belongsTo(Prestable::class);
    }

    /**
     * Almacén donde se va a guardar el prestable
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
