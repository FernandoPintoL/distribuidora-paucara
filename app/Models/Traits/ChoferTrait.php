<?php
namespace App\Models\Traits;

use App\Models\TransferenciaInventario;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Trait para empleados con rol de Chofer
 */
trait ChoferTrait
{
    /**
     * Verifica si el empleado es un chofer
     */
    public function esChofer(): bool
    {
        return $this->user && $this->user->hasRole('Chofer') && $this->licencia !== null;
    }

    /**
     * Transferencias asignadas a este chofer
     */
    public function transferencias(): HasMany
    {
        return $this->hasMany(TransferenciaInventario::class, 'chofer_id');
    }

    /**
     * Verificar si la licencia está vigente
     */
    public function licenciaVigente(): bool
    {
        return $this->fecha_vencimiento_licencia &&
        $this->fecha_vencimiento_licencia->isFuture();
    }

    /**
     * Scope para filtrar solo choferes
     */
    public function scopeChoferes($query)
    {
        return $query->whereHas('user', function ($q) {
            $q->role('Chofer');
        })->whereNotNull('licencia');
    }

    /**
     * Scope para choferes activos
     */
    public function scopeChoferesActivos($query)
    {
        return $query->choferes()->where('estado', 'activo');
    }
}
