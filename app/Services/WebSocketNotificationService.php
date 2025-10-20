<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Servicio para enviar notificaciones en tiempo real al servidor WebSocket
 *
 * Este servicio actúa como puente entre Laravel y el servidor Node.js WebSocket
 * permitiendo enviar notificaciones push a clientes conectados.
 */
class WebSocketNotificationService
{
    protected string $wsUrl;
    protected bool $enabled;
    protected bool $debug;
    protected int $timeout;
    protected array $retryConfig;

    public function __construct()
    {
        $this->wsUrl = config('websocket.url', 'http://localhost:3000');
        $this->enabled = config('websocket.enabled', true);
        $this->debug = config('websocket.debug', false);
        $this->timeout = config('websocket.timeout', 5);
        $this->retryConfig = config('websocket.retry', [
            'enabled' => true,
            'times' => 2,
            'sleep' => 100,
        ]);
    }

    /**
     * Verificar si el servicio WebSocket está habilitado
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Enviar notificación al servidor WebSocket
     */
    protected function send(string $endpoint, array $data): bool
    {
        if (!$this->enabled) {
            if ($this->debug) {
                Log::info('WebSocket deshabilitado, notificación omitida', [
                    'endpoint' => $endpoint,
                    'data' => $data,
                ]);
            }
            return false;
        }

        try {
            $url = rtrim($this->wsUrl, '/') . '/' . ltrim($endpoint, '/');

            if ($this->debug) {
                Log::info('Enviando notificación WebSocket', [
                    'url' => $url,
                    'data' => $data,
                ]);
            }

            $request = Http::timeout($this->timeout)->acceptJson();

            // Configurar reintentos si está habilitado
            if ($this->retryConfig['enabled']) {
                $request->retry(
                    $this->retryConfig['times'],
                    $this->retryConfig['sleep']
                );
            }

            $response = $request->post($url, $data);

            if ($response->successful()) {
                if ($this->debug) {
                    Log::info('Notificación WebSocket enviada exitosamente', [
                        'endpoint' => $endpoint,
                        'response' => $response->json(),
                    ]);
                }
                return true;
            } else {
                Log::warning('Error al enviar notificación WebSocket', [
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }
        } catch (Exception $e) {
            Log::error('Excepción al enviar notificación WebSocket', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    // ========================================
    // NOTIFICACIONES DE PROFORMAS
    // ========================================

    /**
     * Notificar creación de proforma
     */
    public function notifyProformaCreated($proforma): bool
    {
        return $this->send('notify/proforma-created', [
            'id' => $proforma->id,
            'numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'cliente' => [
                'id' => $proforma->cliente_id,
                'nombre' => $proforma->cliente->nombre ?? 'Cliente',
                'apellido' => $proforma->cliente->apellido ?? '',
                'telefono' => $proforma->cliente->telefono ?? null,
            ],
            'subtotal' => (float) $proforma->subtotal,
            'impuesto' => (float) $proforma->impuesto,
            'total' => (float) $proforma->total,
            'estado' => $proforma->estado,
            'items' => $proforma->items->map(function ($item) {
                return [
                    'producto_id' => $item->producto_id,
                    'producto_nombre' => $item->producto->nombre ?? 'Producto',
                    'cantidad' => $item->cantidad,
                    'precio_unitario' => (float) $item->precio_unitario,
                    'subtotal' => (float) $item->subtotal,
                ];
            })->toArray(),
            'fecha_creacion' => $proforma->fecha_creacion->toIso8601String(),
            'fecha_vencimiento' => $proforma->fecha_vencimiento?->toIso8601String(),
        ]);
    }

    /**
     * Notificar aprobación de proforma
     */
    public function notifyProformaApproved($proforma): bool
    {
        return $this->send('notify/proforma-approved', [
            'id' => $proforma->id,
            'numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'estado' => $proforma->estado,
            'total' => (float) $proforma->total,
            'usuario_aprobador' => [
                'id' => $proforma->usuario_aprobador_id,
                'name' => $proforma->usuarioAprobador->name ?? 'Sistema',
            ],
            'comentarios' => $proforma->comentarios_aprobacion,
            'fecha_aprobacion' => $proforma->fecha_aprobacion?->toIso8601String(),
        ]);
    }

    /**
     * Notificar rechazo de proforma
     */
    public function notifyProformaRejected($proforma, ?string $motivoRechazo = null): bool
    {
        return $this->send('notify/proforma-rejected', [
            'id' => $proforma->id,
            'numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'estado' => $proforma->estado,
            'usuario_rechazador' => [
                'id' => $proforma->usuario_aprobador_id ?? auth()->id(),
                'name' => $proforma->usuarioAprobador->name ?? auth()->user()->name ?? 'Sistema',
            ],
            'motivo_rechazo' => $motivoRechazo ?? 'Sin motivo especificado',
            'fecha_rechazo' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar conversión de proforma a venta
     */
    public function notifyProformaConverted($proforma, $venta): bool
    {
        return $this->send('notify/proforma-converted', [
            'proforma_id' => $proforma->id,
            'proforma_numero' => $proforma->numero,
            'venta_id' => $venta->id,
            'venta_numero' => $venta->numero ?? null,
            'cliente_id' => $proforma->cliente_id,
            'total' => (float) $proforma->total,
            'fecha_conversion' => now()->toIso8601String(),
        ]);
    }

    // ========================================
    // NOTIFICACIONES DE STOCK
    // ========================================

    /**
     * Notificar actualización de stock de producto
     */
    public function notifyStockUpdated($producto, ?int $stockAnterior = null): bool
    {
        return $this->send('notify/stock-updated', [
            'producto_id' => $producto->id,
            'nombre' => $producto->nombre,
            'sku' => $producto->sku ?? null,
            'stock_anterior' => $stockAnterior,
            'stock_nuevo' => $producto->stock_total ?? 0,
            'disponible' => ($producto->stock_total ?? 0) > 0,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar reserva de stock
     */
    public function notifyStockReserved($proforma): bool
    {
        return $this->send('notify/stock-reserved', [
            'proforma_id' => $proforma->id,
            'proforma_numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'items' => $proforma->items->map(function ($item) {
                return [
                    'producto_id' => $item->producto_id,
                    'producto_nombre' => $item->producto->nombre ?? 'Producto',
                    'cantidad_reservada' => $item->cantidad,
                ];
            })->toArray(),
            'fecha_reserva' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar que una reserva está por vencer
     */
    public function notifyReservationExpiring(array $reservationData): bool
    {
        return $this->send('notify/reservation-expiring', [
            'proforma_id' => $reservationData['proforma_id'],
            'proforma_numero' => $reservationData['proforma_numero'] ?? null,
            'cliente_id' => $reservationData['cliente_id'],
            'expires_at' => $reservationData['expires_at'],
            'minutes_remaining' => $reservationData['minutes_remaining'] ?? null,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    // ========================================
    // NOTIFICACIONES DE PAGOS
    // ========================================

    /**
     * Notificar pago recibido
     */
    public function notifyPaymentReceived($pago): bool
    {
        return $this->send('notify/payment-received', [
            'pago_id' => $pago->id,
            'cliente_id' => $pago->cliente_id ?? null,
            'monto' => (float) $pago->monto,
            'metodo_pago' => $pago->metodo_pago ?? null,
            'fecha_pago' => $pago->fecha_pago?->toIso8601String() ?? now()->toIso8601String(),
        ]);
    }

    // ========================================
    // NOTIFICACIONES GENÉRICAS
    // ========================================

    /**
     * Enviar notificación personalizada a un usuario
     */
    public function notifyUser(int $userId, string $event, array $data): bool
    {
        return $this->send('notify/user', [
            'user_id' => $userId,
            'event' => $event,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Enviar notificación a un grupo de usuarios (rol)
     */
    public function notifyRole(string $role, string $event, array $data): bool
    {
        return $this->send('notify/role', [
            'role' => $role,
            'event' => $event,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Broadcast a todos los usuarios conectados
     */
    public function broadcast(string $event, array $data): bool
    {
        return $this->send('notify/broadcast', [
            'event' => $event,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    // ========================================
    // NOTIFICACIONES DE ENVÍOS
    // ========================================

    /**
     * Notificar creación de envío
     */
    public function notifyEnvioProgramado($envio): bool
    {
        return $this->send('notify/envio-programado', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'venta_id' => $envio->venta_id,
            'venta_numero' => $envio->venta->numero ?? null,
            'cliente' => [
                'id' => $envio->venta->cliente_id ?? null,
                'nombre' => $envio->venta->cliente->nombre ?? 'Cliente',
            ],
            'vehiculo' => [
                'id' => $envio->vehiculo_id,
                'placa' => $envio->vehiculo->placa ?? null,
                'marca' => $envio->vehiculo->marca ?? null,
                'modelo' => $envio->vehiculo->modelo ?? null,
            ],
            'chofer' => [
                'id' => $envio->chofer_id,
                'name' => $envio->chofer->name ?? 'Chofer',
            ],
            'fecha_programada' => $envio->fecha_programada?->toIso8601String(),
            'direccion_entrega' => $envio->direccion_entrega,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar inicio de preparación de envío
     */
    public function notifyEnvioEnPreparacion($envio): bool
    {
        return $this->send('notify/envio-preparacion', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'chofer_id' => $envio->chofer_id,
            'vehiculo_id' => $envio->vehiculo_id,
            'mensaje' => 'Envío en preparación. Stock reducido.',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar salida de envío (en ruta)
     */
    public function notifyEnvioEnRuta($envio): bool
    {
        return $this->send('notify/envio-en-ruta', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'chofer_id' => $envio->chofer_id,
            'vehiculo' => [
                'id' => $envio->vehiculo_id,
                'placa' => $envio->vehiculo->placa ?? null,
            ],
            'fecha_salida' => $envio->fecha_salida?->toIso8601String(),
            'direccion_entrega' => $envio->direccion_entrega,
            'cliente_id' => $envio->venta->cliente_id ?? null,
            'mensaje' => '🚚 Vehículo en camino',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar actualización de ubicación GPS
     */
    public function notifyEnvioUbicacionActualizada($envio, float $lat, float $lng): bool
    {
        return $this->send('notify/envio-ubicacion', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'ubicacion' => [
                'latitud' => $lat,
                'longitud' => $lng,
            ],
            'cliente_id' => $envio->venta->cliente_id ?? null,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar entrega completada
     */
    public function notifyEnvioEntregado($envio): bool
    {
        return $this->send('notify/envio-entregado', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'venta_id' => $envio->venta_id,
            'cliente' => [
                'id' => $envio->venta->cliente_id ?? null,
                'nombre' => $envio->venta->cliente->nombre ?? 'Cliente',
            ],
            'receptor' => [
                'nombre' => $envio->receptor_nombre,
                'documento' => $envio->receptor_documento,
            ],
            'fecha_entrega' => $envio->fecha_entrega?->toIso8601String(),
            'chofer_id' => $envio->chofer_id,
            'mensaje' => '✅ Envío entregado exitosamente',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar cancelación de envío
     */
    public function notifyEnvioCancelado($envio, string $motivo): bool
    {
        return $this->send('notify/envio-cancelado', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'venta_id' => $envio->venta_id,
            'cliente_id' => $envio->venta->cliente_id ?? null,
            'chofer_id' => $envio->chofer_id,
            'motivo' => $motivo,
            'mensaje' => '❌ Envío cancelado',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar envío retrasado
     */
    public function notifyEnvioRetrasado($envio): bool
    {
        $horasRetraso = $envio->fecha_programada?->diffInHours(now()) ?? 0;

        return $this->send('notify/envio-retrasado', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'fecha_programada' => $envio->fecha_programada?->toIso8601String(),
            'horas_retraso' => $horasRetraso,
            'chofer_id' => $envio->chofer_id,
            'vehiculo_id' => $envio->vehiculo_id,
            'mensaje' => "⚠️ Envío retrasado ({$horasRetraso}h)",
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    // ========================================
    // HEALTH CHECK
    // ========================================

    /**
     * Verificar si el servidor WebSocket está disponible
     */
    public function checkHealth(): array
    {
        try {
            $response = Http::timeout(3)->get($this->wsUrl . '/health');

            if ($response->successful()) {
                return [
                    'available' => true,
                    'status' => 'online',
                    'data' => $response->json(),
                ];
            } else {
                return [
                    'available' => false,
                    'status' => 'error',
                    'message' => 'WebSocket server returned error: ' . $response->status(),
                ];
            }
        } catch (Exception $e) {
            return [
                'available' => false,
                'status' => 'offline',
                'message' => $e->getMessage(),
            ];
        }
    }
}
