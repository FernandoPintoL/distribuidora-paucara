<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrestableStock extends Model
{
    protected $table = 'prestable_stock';

    protected $fillable = [
        'prestable_id',
        'almacen_id',
        'cantidad_disponible',
        'cantidad_en_prestamo_cliente',
        'cantidad_en_prestamo_proveedor',
        'cantidad_vendida',
    ];

    protected $casts = [
        'cantidad_disponible' => 'integer',
        'cantidad_en_prestamo_cliente' => 'integer',
        'cantidad_en_prestamo_proveedor' => 'integer',
        'cantidad_vendida' => 'integer',
    ];

    public function prestable(): BelongsTo
    {
        return $this->belongsTo(Prestable::class);
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }
}
