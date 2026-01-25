<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    protected $table = 'compras';

    protected $fillable = [
        'numero',
        'fecha',
        'numero_factura',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'observaciones',
        'proveedor_id',
        'usuario_id',
        'estado_documento_id',
        'moneda_id',
        'tipo_pago_id',
        'almacen_id',
    ];

    // Relaciones
    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function estadoDocumento()
    {
        return $this->belongsTo(EstadoDocumento::class, 'estado_documento_id');
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class, 'moneda_id');
    }

    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class, 'tipo_pago_id');
    }

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }

    public function cuentaPorPagar()
    {
        return $this->hasOne(CuentaPorPagar::class, 'compra_id');
    }
}
