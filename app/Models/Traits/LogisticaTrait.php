<?php
namespace App\Models\Traits;

use App\Models\Envio;
use App\Models\SeguimientoEnvio;
use App\Models\TransferenciaInventario;
use App\Models\Venta;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * Trait para empleados con rol de Logística
 */
trait LogisticaTrait
{
    /**
     * Verifica si el empleado pertenece al área de logística
     */
    public function esLogistica(): bool
    {
        return $this->user && $this->user->hasRole('Logística');
    }

    /**
     * Envíos gestionados por este empleado de logística
     */
    public function enviosGestionados(): HasMany
    {
        return $this->hasMany(Envio::class, 'gestionado_por');
    }

    /**
     * Seguimientos de envío registrados por este empleado
     */
    public function seguimientosRegistrados(): HasMany
    {
        return $this->hasMany(SeguimientoEnvio::class, 'registrado_por');
    }

    /**
     * Transferencias de inventario supervisadas
     */
    public function transferenciasInventarioSupervisadas(): HasMany
    {
        return $this->hasMany(TransferenciaInventario::class, 'supervisado_por');
    }

    /**
     * Obtiene los envíos pendientes asignados
     */
    public function enviosPendientes(): Collection
    {
        return $this->enviosGestionados()
            ->whereIn('estado', ['Pendiente', 'En Preparación', 'En Tránsito'])
            ->with(['venta', 'venta.cliente', 'chofer'])
            ->get();
    }

    /**
     * Obtiene las ventas pendientes de asignación para envío
     */
    public function ventasPendientesAsignacion(): Collection
    {
        if (! $this->esLogistica()) {
            return collect();
        }

        return Venta::whereDoesntHave('envio')
            ->where('requiere_envio', true)
            ->where('estado', 'Confirmado')
            ->with(['cliente', 'direccionEntrega'])
            ->get();
    }

    /**
     * Verifica si hay alguna alerta de retraso en envíos
     */
    public function tieneAlertasRetraso(): bool
    {
        return $this->enviosGestionados()
            ->whereIn('estado', ['En Preparación', 'En Tránsito'])
            ->whereDate('fecha_entrega_estimada', '<', now())
            ->exists();
    }

    /**
     * Obtiene los envíos con alerta de retraso
     */
    public function enviosConRetraso(): Collection
    {
        return $this->enviosGestionados()
            ->whereIn('estado', ['En Preparación', 'En Tránsito'])
            ->whereDate('fecha_entrega_estimada', '<', now())
            ->with(['venta', 'venta.cliente', 'chofer'])
            ->get();
    }
}
