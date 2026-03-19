<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrestamoCliente extends Model
{
    protected $table = 'prestamo_cliente';

    protected $fillable = [
        'prestable_id',
        'cliente_id',
        'venta_id',
        'chofer_id',
        'cantidad',
        'es_venta',
        'es_evento',
        'precio_unitario',
        'precio_prestamo',
        'monto_garantia',
        'fecha_prestamo',
        'fecha_esperada_devolucion',
        'estado',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'es_venta' => 'boolean',
        'es_evento' => 'boolean',
        'precio_unitario' => 'decimal:2',
        'precio_prestamo' => 'decimal:2',
        'monto_garantia' => 'decimal:2',
        'fecha_prestamo' => 'date',
        'fecha_esperada_devolucion' => 'date',
    ];

    public function prestable(): BelongsTo
    {
        return $this->belongsTo(Prestable::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    public function chofer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chofer_id');
    }

    public function devoluciones(): HasMany
    {
        return $this->hasMany(DevolucionClientePrestamo::class);
    }
}
