<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevolucionProveedorPrestamo extends Model
{
    protected $table = 'devolucion_proveedor_prestamo';

    protected $fillable = [
        'prestamo_proveedor_detalle_id',
        'cantidad_devuelta',
        'observaciones',
        'fecha_devolucion',
    ];

    protected $casts = [
        'cantidad_devuelta' => 'integer',
        'fecha_devolucion' => 'date',
    ];

    // ✅ Relación con detalle del préstamo
    public function detalle(): BelongsTo
    {
        return $this->belongsTo(PrestamoProveedorDetalle::class, 'prestamo_proveedor_detalle_id');
    }
}
