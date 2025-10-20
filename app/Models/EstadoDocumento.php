<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadoDocumento extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'estados_documento';

    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'activo',
        'permite_edicion',
        'permite_anulacion',
        'es_estado_final',
        'color',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    // Relaciones
    public function compras()
    {
        return $this->hasMany(Compra::class, 'estado_documento_id');
    }

    public function ventas()
    {
        return $this->hasMany(Venta::class, 'estado_documento_id');
    }

    public function proformas()
    {
        return $this->hasMany(Proforma::class, 'estado_documento_id');
    }
}
