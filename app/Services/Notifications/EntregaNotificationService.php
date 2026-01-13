<?php

namespace App\Services\Notifications;

use App\Models\Entrega;
use App\Models\User;
use App\Services\WebSocket\EntregaWebSocketService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Servicio orquestador de notificaciones de entregas
 *
 * Este servicio coordina entre:
 * - Notificaciones en BD (DatabaseNotificationService)
 * - Notificaciones en tiempo real (EntregaWebSocketService)
 *
 * Responsabilidad única: Lógica de negocio de notificaciones de entregas
 * ✅ NUEVO: Guarda notificaciones para choferes cuando se asignan entregas
 */
class EntregaNotificationService
{
    protected DatabaseNotificationService $dbNotificationService;
    protected EntregaWebSocketService $wsService;

    public function __construct(
        DatabaseNotificationService $dbNotificationService,
        EntregaWebSocketService $wsService
    ) {
        $this->dbNotificationService = $dbNotificationService;
        $this->wsService = $wsService;
    }

    /**
     * Notificar asignación de entrega a chofer
     * - Guarda en BD para el chofer asignado
     * - Envía notificación en tiempo real vía WebSocket
     *
     * ✅ NUEVO: Este método es crucial para que el chofer vea notificaciones persistentes
     */
    public function notifyAsignada(Entrega $entrega): bool
    {
        if (!$entrega->chofer_id) {
            Log::warning('⚠️ Intento de notificar entrega sin chofer asignado', [
                'entrega_id' => $entrega->id,
            ]);
            return false;
        }

        try {
            // 1. Obtener el chofer
            $chofer = User::find($entrega->chofer_id);
            if (!$chofer) {
                Log::warning('⚠️ Chofer no encontrado para asignación', [
                    'entrega_id' => $entrega->id,
                    'chofer_id' => $entrega->chofer_id,
                ]);
                return false;
            }

            // 2. Guardar en BD (persistente) ✅ CRÍTICO
            $this->dbNotificationService->create(
                $chofer->id,
                'entrega.asignada',
                [
                    'entrega_numero' => $entrega->numero_entrega ?? "ENT-{$entrega->id}",
                    'entrega_id' => $entrega->id,
                    'cliente_nombre' => $entrega->cliente ?? 'Cliente',
                    'direccion' => $entrega->direccion,
                    'estado' => $entrega->estado,
                    'peso_kg' => $entrega->peso_kg,
                    'mensaje' => "Nueva entrega asignada: {$entrega->numero_entrega}",
                ],
                [
                    'entrega_id' => $entrega->id,
                ]
            );

            Log::info('✅ Notificación de entrega asignada guardada en BD', [
                'entrega_id' => $entrega->id,
                'chofer_id' => $chofer->id,
                'chofer_nombre' => $chofer->name,
            ]);

            // 3. ✅ Enviar notificación en tiempo real vía WebSocket (usando método especializado)
            return $this->wsService->notifyAsignada($entrega);

        } catch (\Exception $e) {
            Log::error('❌ Error procesando notificación de entrega asignada', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Notificar cambio de estado de entrega
     */
    public function notifyEstadoCambio(Entrega $entrega, string $estadoAnterior): bool
    {
        if (!$entrega->chofer_id) {
            return false;
        }

        try {
            $chofer = User::find($entrega->chofer_id);
            if (!$chofer) {
                return false;
            }

            // Guardar en BD
            $this->dbNotificationService->create(
                $chofer->id,
                'entrega.estado_cambio',
                [
                    'entrega_numero' => $entrega->numero_entrega ?? "ENT-{$entrega->id}",
                    'entrega_id' => $entrega->id,
                    'estado_anterior' => $estadoAnterior,
                    'estado_nuevo' => $entrega->estado,
                    'mensaje' => "Estado de entrega cambió a: {$entrega->estado}",
                ],
                [
                    'entrega_id' => $entrega->id,
                ]
            );

            Log::info('✅ Notificación de cambio de estado guardada en BD', [
                'entrega_id' => $entrega->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $entrega->estado,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('❌ Error notificando cambio de estado de entrega', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Notificar finalización de entrega
     */
    public function notifyCompletada(Entrega $entrega): bool
    {
        if (!$entrega->chofer_id) {
            return false;
        }

        try {
            $chofer = User::find($entrega->chofer_id);
            if (!$chofer) {
                return false;
            }

            // Guardar en BD
            $this->dbNotificationService->create(
                $chofer->id,
                'entrega.completada',
                [
                    'entrega_numero' => $entrega->numero_entrega ?? "ENT-{$entrega->id}",
                    'entrega_id' => $entrega->id,
                    'fecha_entrega' => $entrega->fecha_entrega?->toIso8601String(),
                    'mensaje' => "Entrega completada: {$entrega->numero_entrega}",
                ],
                [
                    'entrega_id' => $entrega->id,
                ]
            );

            Log::info('✅ Notificación de entrega completada guardada en BD', [
                'entrega_id' => $entrega->id,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('❌ Error notificando entrega completada', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
