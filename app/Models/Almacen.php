<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Almacen extends Model
{
    use HasFactory;

    protected $table = 'almacenes';

    protected $fillable = [
        'nombre','direccion','responsable','telefono','activo'
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function stockProductos()
    {
        return $this->hasMany(StockProducto::class, 'almacen_id');
    }
}
