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
        'localidad_id',
        'codigo_cliente',
        'user_id',
        'usuario_creacion_id',
    ];

    protected $casts = [
        'activo'         => 'boolean',
        'fecha_registro' => 'datetime',
        'limite_credito' => 'decimal:2',
    ];

    public function localidad()
    {
        return $this->belongsTo(Localidad::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function direcciones()
    {
        return $this->hasMany(DireccionCliente::class, 'cliente_id');
    }

    public function ventanasEntrega()
    {
        return $this->hasMany(VentanaEntregaCliente::class, 'cliente_id');
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

    public function categorias()
    {
        return $this->belongsToMany(CategoriaCliente::class, 'categoria_cliente', 'cliente_id', 'categoria_cliente_id')->withTimestamps();
    }

    public function cuentasPorCobrar()
    {
        return $this->hasMany(CuentaPorCobrar::class);
    }

    public function usuarioCreacion()
    {
        return $this->belongsTo(User::class, 'usuario_creacion_id');
    }

    protected static function boot()
    {
        parent::boot();

        // Generar el código de cliente DESPUÉS de crear, para poder usar el ID del cliente
        static::created(function ($cliente) {
            if (! $cliente->codigo_cliente && $cliente->localidad_id) {
                $cliente->codigo_cliente = $cliente->generateCodigoCliente();
                // Guardar en silencio para evitar eventos recursivos
                $cliente->saveQuietly();
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

        // Regla: CODLOCALIDAD + 000 + IDCLIENTE (con padding a 4 dígitos hasta 999)
        $numero = (int) $this->id;
        if ($numero < 1000) {
            // 1 => 0001, 12 => 0012, 999 => 0999
            return $codigoLocalidad . str_pad((string) $numero, 4, '0', STR_PAD_LEFT);
        }

        // A partir de 1000, se usa el número tal cual (PS1000, PS1001, ...)
        return $codigoLocalidad . $numero;
    }
}
