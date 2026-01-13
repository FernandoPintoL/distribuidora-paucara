<?php

namespace App\Listeners;

use App\Events\EntregaAsignada;
use App\Services\Notifications\EntregaNotificationService;
use Illuminate\Support\Facades\Log;

/**
 * Listener que envía notificaciones cuando se asigna una entrega a un chofer
 *
 * Se ejecuta automáticamente y síncronamente cuando se dispara el evento EntregaAsignada
 * No implementa ShouldQueue porque queremos ejecución inmediata
 *
 * ✅ NUEVO: Utiliza EntregaNotificationService que:
 *    - Guarda la notificación en BD (persistente)
 *    - Envía notificación en tiempo real vía WebSocket
 *
 * Esto es complementario a BroadcastEntregaAsignada (que solo hace broadcast)
 */
class SendEntregaAsignadaNotification
{
    protected EntregaNotificationService $notificationService;

    public function __construct(EntregaNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the event.
     *
     * Delega al EntregaNotificationService para:
     * 1. Guardar la notificación en la base de datos (tabla notifications)
     * 2. Enviar notificación en tiempo real al servidor WebSocket Node.js
     *
     * ✅ CRUCIAL: Sin este listener, el chofer NO ve notificaciones persistentes
     */
    public function handle(EntregaAsignada $event): void
    {
        try {
            $entrega = $event->entrega;

            Log::info('🔔 SendEntregaAsignadaNotification - Listener disparado', [
                'entrega_id' => $entrega->id,
                'entrega_numero' => $entrega->numero_entrega,
                'chofer_id' => $entrega->chofer_id,
                'chofer_nombre' => $entrega->chofer?->name,
            ]);

            // Cargar relaciones necesarias si no están cargadas
            if (!$entrega->relationLoaded('chofer')) {
                $entrega->load('chofer');
            }

            // ✅ Usar el servicio especializado de entregas
            // Esto GUARDA la notificación en la BD
            $result = $this->notificationService->notifyAsignada($entrega);

            if ($result) {
                Log::info('✅ Notificación de entrega asignada procesada exitosamente', [
                    'entrega_id' => $entrega->id,
                    'entrega_numero' => $entrega->numero_entrega,
                    'chofer_id' => $entrega->chofer_id,
                ]);
            } else {
                Log::warning('⚠️ La notificación WebSocket no pudo enviarse (pero se guardó en BD)', [
                    'entrega_id' => $entrega->id,
                    'chofer_id' => $entrega->chofer_id,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('❌ Error procesando notificación de entrega asignada', [
                'entrega_id' => $event->entrega->id ?? null,
                'chofer_id' => $event->entrega->chofer_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
