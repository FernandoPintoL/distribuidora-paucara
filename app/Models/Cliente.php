<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'clientes';

    protected $fillable = [
        'nombre',
        'razon_social',
        'nit',
        'telefono',
        'email',
        'activo',
        'fecha_registro',
        'limite_credito',
        'foto_perfil',
        'ci_anverso',
        'ci_reverso',
        'latitud',
        'longitud',
        'localidad_id',
        'codigo_cliente',
    ];

    protected $casts = [
        'activo'         => 'boolean',
        'fecha_registro' => 'datetime',
        'limite_credito' => 'decimal:2',
        'latitud'        => 'decimal:8',
        'longitud'       => 'decimal:8',
    ];

    public function localidad()
    {
        return $this->belongsTo(Localidad::class);
    }

    public function direcciones()
    {
        return $this->hasMany(DireccionCliente::class, 'cliente_id');
    }

    public function fotosLugar()
    {
        return $this->hasMany(FotoLugarCliente::class, 'cliente_id');
    }

    public function ventas()
    {
        return $this->hasMany(Venta::class);
    }

    public function proformas()
    {
        return $this->hasMany(Proforma::class);
    }

    public function cuentasPorCobrar()
    {
        return $this->hasMany(CuentaPorCobrar::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($cliente) {
            if (! $cliente->codigo_cliente && $cliente->localidad_id) {
                $cliente->codigo_cliente = $cliente->generateCodigoCliente();
            }
        });
    }

    public function generateCodigoCliente(): string
    {
        if (! $this->localidad_id) {
            return '';
        }

        $localidad = $this->localidad;
        if (! $localidad) {
            return '';
        }

        $codigoLocalidad = $localidad->codigo;

        // Obtener el último ID de cliente para esta localidad
        $ultimoCliente = self::where('localidad_id', $this->localidad_id)
            ->orderBy('id', 'desc')
            ->first();

        $numero = 1;
        if ($ultimoCliente && $ultimoCliente->codigo_cliente) {
            // Extraer el número del código existente
            $partes = explode($codigoLocalidad, $ultimoCliente->codigo_cliente);
            if (count($partes) > 1) {
                $numero = (int) $partes[1] + 1;
            }
        }

        // Formatear con 3 ceros hasta 999, luego sin ceros
        if ($numero < 1000) {
            return $codigoLocalidad . str_pad($numero, 3, '0', STR_PAD_LEFT);
        } else {
            return $codigoLocalidad . $numero;
        }
    }
}
