<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrestamoProveedor extends Model
{
    protected $table = 'prestamo_proveedor';

    protected $fillable = [
        'prestable_id',
        'proveedor_id',
        'cantidad',
        'es_compra',
        'precio_unitario',
        'numero_documento',
        'fecha_prestamo',
        'fecha_esperada_devolucion',
        'estado',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'es_compra' => 'boolean',
        'precio_unitario' => 'decimal:2',
        'fecha_prestamo' => 'date',
        'fecha_esperada_devolucion' => 'date',
    ];

    public function prestable(): BelongsTo
    {
        return $this->belongsTo(Prestable::class);
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }

    public function devoluciones(): HasMany
    {
        return $this->hasMany(DevolucionProveedorPrestamo::class);
    }
}
