<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoAjusteInventario extends Model
{
    /** @use HasFactory<\Database\Factories\TipoAjusteInventarioFactory> */
    use HasFactory;

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

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    /**
     * Scope para obtener solo tipos activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para ordenar por orden
     */
    public function scopeOrdenados($query)
    {
        return $query->orderBy('clave')->orderBy('label');
    }
}
