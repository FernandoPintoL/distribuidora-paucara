<?php
namespace App\Models;

use App\Models\Traits\GeneratesSequentialCode;
use App\Models\Traits\HasActiveScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory, GeneratesSequentialCode, HasActiveScope;

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
        'preventista_id',           // ← NUEVO
        'usuario_actualizacion_id', // ← NUEVO
        'fecha_creacion',           // ← NUEVO
        'fecha_actualizacion',      // ← NUEVO
    ];

    protected function casts(): array
    {
        return [
            'activo'         => 'boolean',
            'fecha_registro' => 'datetime',
            'limite_credito' => 'decimal:2',
        ];
    }

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

    /**
     * ✅ NUEVO: Preventista que gestiona este cliente
     */
    public function preventista()
    {
        return $this->belongsTo(Empleado::class, 'preventista_id');
    }

    /**
     * ✅ NUEVO: Usuario que actualizó el cliente
     */
    public function usuarioActualizacion()
    {
        return $this->belongsTo(User::class, 'usuario_actualizacion_id');
    }

    /**
     * ✅ NUEVO: Auditoría de cambios
     */
    public function auditLogs()
    {
        return $this->hasMany(ClienteAudit::class);
    }

    /**
     * ✅ NUEVO: Método para registrar cambios manualmente
     */
    public function registrarCambio(string $accion, array $cambios, ?string $motivo = null)
    {
        ClienteAudit::create([
            'cliente_id' => $this->id,
            'preventista_id' => auth()->user()?->empleado?->id,
            'usuario_id' => auth()->user()?->id,
            'accion' => $accion,
            'cambios' => $cambios,
            'motivo' => $motivo,
            'ip_address' => request()?->ip() ?? '127.0.0.1',
        ]);
    }

    /**
     * ✅ SCOPE: Filtrar clientes por usuario actual
     * - Preventista: Solo VE sus clientes (preventista_id = empleado_id)
     * - Cliente: Solo VE su propio cliente (user_id = auth()->id())
     * - Super Admin: VE TODOS los clientes (sin filtro)
     */
    public function scopeForCurrentUser($query)
    {
        $user = auth()->user();

        // Super Admin ve TODOS
        if ($user?->hasRole(['super-admin', 'Super Admin'])) {
            return $query;
        }

        // Preventista ve SOLO sus clientes
        if ($user?->hasRole(['Preventista', 'preventista'])) {
            return $query->where('preventista_id', $user->empleado?->id);
        }

        // Cliente ve SOLO su cliente
        if ($user?->hasRole(['Cliente', 'cliente'])) {
            return $query->where('user_id', $user->id);
        }

        // Admin y otros: Sin filtro específico (controlado por Policy)
        return $query;
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

        // Regenerar código si la localidad cambia
        static::updating(function ($cliente) {
            \Log::info("📝 Evento updating disparado para cliente {$cliente->id}", [
                'isDirty' => $cliente->isDirty(),
                'dirty_attributes' => $cliente->getDirty(),
                'localidad_id_actual' => $cliente->localidad_id,
                'localidad_id_original' => $cliente->getOriginal('localidad_id'),
            ]);

            if ($cliente->isDirty('localidad_id')) {
                $localidadAnterior = $cliente->getOriginal('localidad_id');
                $localidadNueva = $cliente->localidad_id;

                \Log::info("🔄 Localidad cambió en cliente {$cliente->id}", [
                    'anterior' => $localidadAnterior,
                    'nueva' => $localidadNueva,
                    'codigo_anterior' => $cliente->getOriginal('codigo_cliente'),
                    'codigo_actual' => $cliente->codigo_cliente,
                ]);

                // Regenerar el código con la nueva localidad (incluso si es NULL)
                if ($localidadNueva) {
                    $codigoAnterior = $cliente->codigo_cliente;
                    $cliente->codigo_cliente = $cliente->generateCodigoCliente();

                    \Log::info("✅ Código de cliente regenerado", [
                        'cliente_id' => $cliente->id,
                        'codigo_anterior' => $codigoAnterior ?? 'NULL',
                        'codigo_nuevo' => $cliente->codigo_cliente,
                    ]);
                }
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
