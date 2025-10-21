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
        'foto_perfil', 'ci_anverso', 'ci_reverso', 'codigo_proveedor', 'latitud', 'longitud',
    ];

    protected $casts = [
        'activo'         => 'boolean',
        'fecha_registro' => 'datetime',
        'latitud'        => 'decimal:8',
        'longitud'       => 'decimal:8',
    ];

    protected static function boot()
    {
        parent::boot();

        // Generar el código de proveedor DESPUÉS de crear, para poder usar el ID del proveedor
        static::created(function ($proveedor) {
            if (! $proveedor->codigo_proveedor) {
                $proveedor->codigo_proveedor = $proveedor->generateCodigoProveedor();
                // Guardar en silencio para evitar eventos recursivos
                $proveedor->saveQuietly();
            }
        });
    }

    public function generateCodigoProveedor(): string
    {
        // Regla: PRV + 000 + IDPROVEEDOR (con padding a 4 dígitos hasta 999)
        $numero = (int) $this->id;
        if ($numero < 1000) {
            // 1 => PRV0001, 12 => PRV0012, 999 => PRV0999
            return 'PRV' . str_pad((string) $numero, 4, '0', STR_PAD_LEFT);
        }

        // A partir de 1000, se usa el número tal cual (PRV1000, PRV1001, ...)
        return 'PRV' . $numero;
    }

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
