<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'fecha',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'observaciones',
        'cliente_id',
        'usuario_id',
        'estado_documento_id',
        'moneda_id',
        'proforma_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuesto' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    // Relaciones
    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }

    public function estadoDocumento()
    {
        return $this->belongsTo(EstadoDocumento::class);
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class);
    }

    public function proforma()
    {
        return $this->belongsTo(Proforma::class);
    }

    public function detalles()
    {
        return $this->hasMany(DetalleVenta::class);
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }

    public function cuentaPorCobrar()
    {
        return $this->hasOne(CuentaPorCobrar::class);
    }

    public function movimientoCaja()
    {
        return $this->hasOne(MovimientoCaja::class, 'numero_documento', 'numero');
    }
}
