<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DireccionCliente extends Model
{
    use HasFactory;

    protected $table = 'direcciones_cliente';

    protected $fillable = [
        'cliente_id', 'direccion', 'latitud', 'longitud', 'es_principal', 'activa',
    ];

    protected $casts = [
        'latitud' => 'float',
        'longitud' => 'float',
        'es_principal' => 'boolean',
        'activa' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
