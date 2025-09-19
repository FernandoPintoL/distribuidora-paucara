<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'codigo_empleado',
        'ci',
        'telefono',
        'direccion',
        'fecha_nacimiento',
        'genero',
        'estado_civil',
        'cargo',
        'departamento',
        'supervisor_id',
        'fecha_ingreso',
        'fecha_salida',
        'tipo_contrato',
        'estado',
        'salario_base',
        'bonos',
        'cuenta_bancaria',
        'banco',
        'contacto_emergencia_nombre',
        'contacto_emergencia_telefono',
        'contacto_emergencia_relacion',
        'puede_acceder_sistema',
        'ultimo_acceso_sistema',
        'foto_perfil',
        'cv_documento',
        'contrato_documento',
        'certificaciones',
        'horario_trabajo',
        'observaciones',
        'notas_rrhh',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date',
            'fecha_ingreso' => 'date',
            'fecha_salida' => 'date',
            'salario_base' => 'decimal:2',
            'bonos' => 'decimal:2',
            'puede_acceder_sistema' => 'boolean',
            'ultimo_acceso_sistema' => 'datetime',
            'certificaciones' => 'array',
            'horario_trabajo' => 'array',
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
     * Supervisor del empleado
     */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supervisor_id');
    }

    /**
     * Empleados supervisados por este empleado
     */
    public function supervisados(): HasMany
    {
        return $this->hasMany(self::class, 'supervisor_id');
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
        $fechaFin = $this->fecha_salida ?? now();

        return $this->fecha_ingreso->diffInYears($fechaFin);
    }

    /**
     * Calcular edad
     */
    public function edad(): ?int
    {
        return $this->fecha_nacimiento?->diffInYears(now());
    }

    /**
     * Obtener salario total (base + bonos)
     */
    public function salarioTotal(): float
    {
        return ($this->salario_base ?? 0) + ($this->bonos ?? 0);
    }

    /**
     * Verificar si está en periodo de prueba (menos de 3 meses)
     */
    public function enPeriodoPrueba(): bool
    {
        return $this->fecha_ingreso->diffInMonths(now()) < 3;
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
     * Scope por departamento
     */
    public function scopePorDepartamento($query, string $departamento)
    {
        return $query->where('departamento', $departamento);
    }

    /**
     * Scope por cargo
     */
    public function scopePorCargo($query, string $cargo)
    {
        return $query->where('cargo', $cargo);
    }

    /**
     * Actualizar último acceso al sistema
     */
    public function actualizarUltimoAcceso(): void
    {
        $this->update(['ultimo_acceso_sistema' => now()]);
    }
}
