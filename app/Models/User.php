<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'usernick',
        'email',
        'password',
        'activo',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
        ];
    }

    /**
     * Relación con datos del empleado si es que los tiene
     */
    public function empleado(): HasOne
    {
        return $this->hasOne(Empleado::class);
    }

    /**
     * Relación con datos del chofer (empleado con rol Chofer)
     */
    public function chofer(): HasOne
    {
        return $this->hasOne(Empleado::class);
    }

    /**
     * Relación con datos del cliente si es que los tiene
     */
    public function cliente(): HasOne
    {
        return $this->hasOne(Cliente::class);
    }

    /**
     * Verificar si el usuario es un empleado
     */
    public function esEmpleado(): bool
    {
        return $this->empleado !== null;
    }

    /**
     * Verificar si el usuario es un cliente
     */
    public function esCliente(): bool
    {
        return $this->cliente !== null;
    }

    /**
     * Verificar si el empleado puede acceder al sistema
     */
    public function puedeAccederSistema(): bool
    {
        return $this->empleado?->puedeAccederSistema() ?? true; // Si no es empleado, puede acceder por defecto
    }

    /**
     * Actualizar último acceso si es empleado
     */
    public function actualizarUltimoAccesoEmpleado(): void
    {
        if ($this->esEmpleado()) {
            $this->empleado->actualizarUltimoAcceso();
        }
    }

    /**
     * Asigna roles validando compatibilidad
     * Lanza excepción si hay conflicto
     */
    public function asignarRolesValidado(array $roles): void
    {
        $validator = new \App\Services\RoleCompatibilityValidator();
        $validator->validar($roles, $this->roles->pluck('name')->first());
        $this->syncRoles($roles);
    }

    /**
     * Valida si puede tener múltiples roles específicos
     */
    public function puedenCombinarse(array $roles): bool
    {
        try {
            $validator = new \App\Services\RoleCompatibilityValidator();
            $validator->validar($roles);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Obtiene roles compatibles con el rol actual
     */
    public function obtenerRolesCompatibles(array $rolesDisponibles): array
    {
        $rolActual = $this->roles->pluck('name')->first();

        if (!$rolActual) {
            return $rolesDisponibles;
        }

        $validator = new \App\Services\RoleCompatibilityValidator();
        return $validator->obtenerCompatibles($rolActual, $rolesDisponibles);
    }
}
