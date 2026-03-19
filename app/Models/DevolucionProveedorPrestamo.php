<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevolucionProveedorPrestamo extends Model
{
    protected $table = 'devolucion_proveedor_prestamo';

    protected $fillable = [
        'prestamo_proveedor_id',
        'cantidad_devuelta',
        'observaciones',
        'fecha_devolucion',
    ];

    protected $casts = [
        'cantidad_devuelta' => 'integer',
        'fecha_devolucion' => 'date',
    ];

    public function prestamoProveedor(): BelongsTo
    {
        return $this->belongsTo(PrestamoProveedor::class);
    }
}
