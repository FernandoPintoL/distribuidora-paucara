<?php

namespace App\Listeners;

use App\Events\ProformaCreada;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Listener que envía notificaciones de proforma creada al servidor WebSocket
 *
 * Se ejecuta automáticamente y síncronamente cuando se dispara el evento ProformaCreada
 * No implementa ShouldQueue porque queremos ejecución inmediata
 */
class SendProformaCreatedNotification
{
    /**
     * Handle the event.
     *
     * Envía una notificación HTTP al servidor WebSocket Node.js
     * cuando se crea una nueva proforma.
     */
    public function handle(ProformaCreada $event): void
    {
        try {
            $proforma = $event->proforma;

            \Log::info('🔔 SendProformaCreatedNotification - Listener disparado', [
                'proforma_id' => $proforma->id,
                'proforma_numero' => $proforma->numero,
            ]);

            // URL del servidor WebSocket (Node.js)
            $websocketUrl = env('WEBSOCKET_NOTIFY_URL', 'http://localhost:3001/notify/proforma-created');

            \Log::info('🌐 WebSocket URL configurada', [
                'url' => $websocketUrl,
            ]);

            // Cargar detalles si no están cargados
            if (!$proforma->relationLoaded('detalles')) {
                $proforma->load(['detalles.producto']);
            }

            // Datos a enviar
            $payload = [
                'id' => $proforma->id,
                'numero' => $proforma->numero,
                'cliente_id' => $proforma->cliente_id,
                'cliente' => [
                    'id' => $proforma->cliente?->id,
                    'nombre' => $proforma->cliente?->nombre,
                    'apellido' => $proforma->cliente?->apellido,
                ],
                'usuario_creador' => [
                    'id' => $proforma->usuarioCreador?->id,
                    'nombre' => $proforma->usuarioCreador?->name,
                ],
                'total' => (float) $proforma->total,
                'estado' => $proforma->estado,
                'fecha_creacion' => $proforma->created_at?->toIso8601String(),
                'fecha_vencimiento' => $proforma->fecha_vencimiento?->toIso8601String(),
                'canal_origen' => $proforma->canal_origen,
                'direccion_entrega_solicitada_id' => $proforma->direccion_entrega_solicitada_id,
                'items' => $proforma->detalles->map(function ($detalle) {
                    return [
                        'id' => $detalle->id,
                        'producto_id' => $detalle->producto_id,
                        'producto_nombre' => $detalle->producto?->nombre,
                        'cantidad' => (float) $detalle->cantidad,
                        'precio_unitario' => (float) $detalle->precio_unitario,
                        'subtotal' => (float) $detalle->subtotal,
                    ];
                })->toArray(),
            ];

            // Enviar notificación al servidor WebSocket con autenticación
            \Log::info('📤 Enviando HTTP POST al WebSocket', [
                'url' => $websocketUrl,
                'payload' => $payload,
            ]);

            $wsSecret = env('WS_SECRET', 'cobrador-websocket-secret-key-2025');

            $response = Http::timeout(5)
                ->withHeader('x-ws-secret', $wsSecret)
                ->post($websocketUrl, $payload);

            \Log::info('📥 Respuesta recibida del WebSocket', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            if ($response->successful()) {
                \Log::info('✅ Notificación de proforma enviada al WebSocket', [
                    'proforma_id' => $proforma->id,
                    'proforma_numero' => $proforma->numero,
                    'websocket_url' => $websocketUrl,
                ]);
            } else {
                \Log::warning('⚠️ Respuesta inesperada del servidor WebSocket', [
                    'status' => $response->status(),
                    'proforma_id' => $proforma->id,
                    'response' => $response->json(),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('❌ Error enviando notificación al WebSocket', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
