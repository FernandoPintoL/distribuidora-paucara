<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockProducto extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'stock_productos';

    protected $fillable = [
        'producto_id',
        'almacen_id',
        'cantidad',
        'fecha_actualizacion',
        'lote',
        'fecha_vencimiento'
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'fecha_actualizacion' => 'datetime',
        'fecha_vencimiento' => 'date',
    ];

    public function producto(){ return $this->belongsTo(Producto::class, 'producto_id'); }
    public function almacen(){ return $this->belongsTo(Almacen::class, 'almacen_id'); }
}
