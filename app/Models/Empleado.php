<?php
namespace App\Models;

use App\Models\Traits\ChoferTrait;
use App\Models\Traits\RolesFuncionalesTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    use HasFactory, ChoferTrait, RolesFuncionalesTrait;

    protected $fillable = [
        'user_id',
        'codigo_empleado',
        'ci',
        'licencia',                   // Para choferes
        'fecha_vencimiento_licencia', // Para choferes
        'telefono',
        'direccion',
        'fecha_ingreso',
        'fecha_salida',
        'estado',
        'puede_acceder_sistema',
        'ultimo_acceso_sistema',
        'foto_perfil',
        'cv_documento',
        'observaciones',
        'latitud',  // Coordenadas GPS
        'longitud', // Coordenadas GPS
    ];

    /**
     * Atributos que se añaden automáticamente al modelo
     */
    protected $appends = ['nombre', 'email', 'usernick', 'roles'];

    protected function casts(): array
    {
        return [
            'fecha_ingreso'              => 'date:Y-m-d',
            'fecha_salida'               => 'date:Y-m-d',
            'fecha_vencimiento_licencia' => 'date:Y-m-d', // Para choferes
            'puede_acceder_sistema'      => 'boolean',
            'ultimo_acceso_sistema'      => 'datetime',
            'latitud'                    => 'decimal:8',
            'longitud'                   => 'decimal:8',
        ];
    }

    /**
     * Usuario asociado al empleado
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withDefault();
    }

    /**
     * Accessor: Obtener el nombre del empleado desde el usuario relacionado
     */
    public function getNombreAttribute(): string
    {
        return $this->user?->name ?? $this->codigo_empleado ?? 'Sin nombre';
    }

    /**
     * Accessor: Obtener el email del empleado desde el usuario relacionado
     */
    public function getEmailAttribute(): ?string
    {
        return $this->user?->email;
    }

    /**
     * Accessor: Obtener el usernick del empleado desde el usuario relacionado
     */
    public function getUsernickAttribute(): ?string
    {
        return $this->user?->usernick;
    }

    /**
     * Accessor: Obtener los roles del empleado como array de nombres
     */
    public function getRolesAttribute(): array
    {
        if (!$this->user) {
            return [];
        }

        // Verificar si la relación roles está cargada en el usuario
        if (!$this->user->relationLoaded('roles')) {
            return [];
        }

        return $this->user->roles->pluck('name')->toArray();
    }

    /**
     * Verificar si el empleado está activo
     */
    public function estaActivo(): bool
    {
        return $this->estado === 'activo';
    }

    /**
     * Verificar si puede acceder al sistema
     */
    public function puedeAccederSistema(): bool
    {
        return $this->puede_acceder_sistema && $this->estaActivo();
    }

    /**
     * Calcular años de servicio
     */
    public function anosServicio(): int
    {
        if (! $this->fecha_ingreso) {
            return 0;
        }

        $fechaFin    = $this->fecha_salida ?? now();
        $fechaInicio = \Carbon\Carbon::parse($this->fecha_ingreso);

        return $fechaInicio->diffInYears($fechaFin);
    }

    /**
     * Verificar si está en periodo de prueba (menos de 3 meses)
     */
    public function enPeriodoPrueba(): bool
    {
        if (! $this->fecha_ingreso) {
            return false;
        }

        return \Carbon\Carbon::parse($this->fecha_ingreso)->diffInMonths(now()) < 3;
    }

    /**
     * Scope para empleados activos
     */
    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    /**
     * Scope para empleados que pueden acceder al sistema
     */
    public function scopeConAccesoSistema($query)
    {
        return $query->where('puede_acceder_sistema', true)->where('estado', 'activo');
    }

    /**
     * Actualizar último acceso al sistema
     */
    public function actualizarUltimoAcceso(): void
    {
        $this->update(['ultimo_acceso_sistema' => now()]);
    }
}
