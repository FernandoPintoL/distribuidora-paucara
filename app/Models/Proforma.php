<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proforma extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'fecha',
        'fecha_vencimiento',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'observaciones',
        'convertida_a_venta',
        'cliente_id',
        'usuario_id',
        'estado_documento_id',
        'moneda_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_vencimiento' => 'date',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuesto' => 'decimal:2',
        'total' => 'decimal:2',
        'convertida_a_venta' => 'boolean',
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

    public function detalles()
    {
        return $this->hasMany(DetalleProforma::class);
    }

    public function ventas()
    {
        return $this->hasMany(Venta::class);
    }
}
