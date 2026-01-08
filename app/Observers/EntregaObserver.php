<?php

namespace App\Observers;

use App\Models\Entrega;
use App\Services\WebSocket\EntregaWebSocketService;
use Illuminate\Support\Facades\Log;

/**
 * EntregaObserver - FASE 5: WebSocket Sync
 *
 * RESPONSABILIDADES:
 * ✓ Detectar cambios de estado en Entrega
 * ✓ Disparar notificaciones WebSocket automáticamente
 * ✓ Notificar a clientes, chofer, admin
 * ✓ Validar SLA al cambiar de estado
 *
 * CICLO DE VIDA:
 * - updated(): Cuando se actualiza entrega
 *   ├─ Detecta cambio en estado o estado_entrega_id
 *   ├─ Obtiene estado anterior y nuevo
 *   └─ Dispara notificaciones WebSocket
 */
class EntregaObserver
{
    private EntregaWebSocketService $webSocketService;

    public function __construct(EntregaWebSocketService $webSocketService)
    {
        $this->webSocketService = $webSocketService;
    }

    /**
     * Disparar notificaciones cuando Entrega cambia de estado
     *
     * Se ejecuta DESPUÉS de que se actualiza el registro en BD
     * Aprovecha para enviar notificaciones sincronizadas
     */
    public function updated(Entrega $entrega): void
    {
        // Detectar si cambió el estado (ENUM legacy o FK nuevo)
        $cambioEstadoEnum = $entrega->isDirty('estado');
        $cambioEstadoFk = $entrega->isDirty('estado_entrega_id');

        if (!$cambioEstadoEnum && !$cambioEstadoFk) {
            return; // No hay cambio de estado
        }

        try {
            // Obtener estado anterior y nuevo
            $estadoAnterior = $cambioEstadoEnum ? $entrega->getOriginal('estado') : null;
            $estadoNuevo = $entrega->estado;

            if ($cambioEstadoFk && $entrega->estadoEntrega) {
                $estadoNuevo = $entrega->estadoEntrega->codigo;
            }

            Log::info('🔔 EntregaObserver: Cambio de estado detectado', [
                'entrega_id' => $entrega->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $estadoNuevo,
            ]);

            // NUEVA - FASE 5: Dispara sincronización con notificación centralizada
            $this->webSocketService->notifyEstadoSincronizado(
                $entrega,
                $estadoNuevo,
                $estadoAnterior
            );

            // Si cambió a EN_TRANSITO, validar SLA
            if ($estadoNuevo === 'EN_TRANSITO') {
                $this->webSocketService->notifyEstadoConValidacionSLA($entrega, $estadoNuevo);
            }

            Log::info('✅ Notificaciones WebSocket enviadas', [
                'entrega_id' => $entrega->id,
                'estado_nuevo' => $estadoNuevo,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error en EntregaObserver', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Notificar cuando se crea una entrega
     *
     * Envía notificaciones a:
     * - Equipo de logística
     * - Clientes involucrados
     * - Admin
     */
    public function created(Entrega $entrega): void
    {
        try {
            $this->webSocketService->notifyCreated($entrega);

            Log::info('✅ Entrega creada - Notificación enviada', [
                'entrega_id' => $entrega->id,
                'numero' => $entrega->numero,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error notificando creación de entrega', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
