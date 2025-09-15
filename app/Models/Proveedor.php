<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'proveedores';

    protected $fillable = [
        'nombre', 'razon_social', 'nit', 'telefono', 'email', 'direccion', 'contacto', 'activo', 'fecha_registro',
        'foto_perfil', 'ci_anverso', 'ci_reverso',
    ];

    protected $casts = [
        'activo'         => 'boolean',
        'fecha_registro' => 'datetime',
    ];

    // Relaciones
    public function compras()
    {
        return $this->hasMany(Compra::class);
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'proveedor_id');
    }
}
