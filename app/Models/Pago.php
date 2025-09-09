<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    protected $fillable = [
        'venta_id',
        'tipo_pago_id',
        'monto',
        'fecha',
        'numero_transaccion',
        'observaciones',
        'moneda_id',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha' => 'datetime',
    ];

    // Relaciones
    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class);
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class);
    }
}
