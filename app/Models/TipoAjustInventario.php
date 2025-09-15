<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoAjustInventario extends Model
{
    protected $table = 'tipos_ajuste_inventario';

    protected $fillable = [
        'clave',
        'label',
        'descripcion',
        'color',
        'bg_color',
        'text_color',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function movimientosInventario()
    {
        return $this->hasMany(MovimientoInventario::class, 'tipo_ajuste_inventario_id');
    }
}
