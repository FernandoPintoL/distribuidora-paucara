<?php
namespace App\Services\WebSocket;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Servicio base abstracto para comunicación con el servidor WebSocket
 *
 * Todas las clases de notificación WebSocket deben extender esta clase
 * para heredar la funcionalidad común de conexión HTTP
 */
abstract class BaseWebSocketService
{
    protected string $wsUrl = 'http://localhost:3001';
    protected bool $enabled = false;
    protected bool $debug = false;
    protected int $timeout = 5;
    protected array $retryConfig = [
        'enabled' => true,
        'times' => 2,
        'sleep' => 100,
    ];

    public function __construct()
    {
        try {
            $this->wsUrl       = config('websocket.url', 'http://localhost:3001') ?? 'http://localhost:3001';
            $this->enabled     = (bool) (config('websocket.enabled') !== false);
            $this->debug       = (bool) config('websocket.debug', false);
            $this->timeout     = (int) config('websocket.timeout', 5);
            $this->retryConfig = config('websocket.retry') ?? [
                'enabled' => true,
                'times'   => 2,
                'sleep'   => 100,
            ];
        } catch (\Throwable $e) {
            Log::warning('Error initializing WebSocketService, using defaults', [
                'error' => $e->getMessage(),
            ]);

            // Valores por defecto seguros
            $this->wsUrl       = 'http://localhost:3001';
            $this->enabled     = false;
            $this->debug       = false;
            $this->timeout     = 5;
            $this->retryConfig = [
                'enabled' => true,
                'times'   => 2,
                'sleep'   => 100,
            ];
        }
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
     *
     * @param string $endpoint Endpoint relativo (ej: 'notify/proforma-created')
     * @param array $data Datos a enviar
     * @return bool True si se envió exitosamente
     */
    protected function send(string $endpoint, array $data): bool
    {
        if (! $this->enabled) {
            if ($this->debug) {
                Log::info('WebSocket deshabilitado, notificación omitida', [
                    'endpoint' => $endpoint,
                    'data'     => $data,
                ]);
            }
            return false;
        }

        try {
            $url = rtrim($this->wsUrl, '/') . '/' . ltrim($endpoint, '/');

            if ($this->debug) {
                Log::info('Enviando notificación WebSocket', [
                    'url'  => $url,
                    'data' => $data,
                ]);
            }

            $request = Http::timeout($this->timeout)
                ->acceptJson()
                ->withHeaders([
                    'X-Backend-Secret' => config('websocket.secret', env('WS_SECRET', 'cobrador-websocket-secret-key-2025')),
                ]);

            // Configurar reintentos si está habilitado
            if ($this->retryConfig['enabled']) {
                $request->retry(
                    $this->retryConfig['times'],
                    $this->retryConfig['sleep']
                );
            }

            $response = $request->post($url, $data);

            Log::info('🔍 [BaseWebSocketService::send] POST response', [
                'endpoint' => $endpoint,
                'url' => $url,
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                if ($this->debug) {
                    Log::info('Notificación WebSocket enviada exitosamente', [
                        'endpoint' => $endpoint,
                        'response' => $response->json(),
                    ]);
                }
                return true;
            } else {
                Log::warning('❌ Error al enviar notificación WebSocket', [
                    'endpoint' => $endpoint,
                    'status'   => $response->status(),
                    'body'     => $response->body(),
                ]);
                return false;
            }
        } catch (Exception $e) {
            Log::error('Excepción al enviar notificación WebSocket', [
                'endpoint' => $endpoint,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Enviar notificación personalizada a un usuario específico
     */
    public function notifyUser(int $userId, string $event, array $data): bool
    {
        return $this->send('notify/user', [
            'user_id'   => $userId,
            'event'     => $event,
            'data'      => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Enviar notificación a un grupo de usuarios (rol)
     */
    public function notifyRole(string $role, string $event, array $data): bool
    {
        return $this->send('notify/role', [
            'role'      => $role,
            'event'     => $event,
            'data'      => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Broadcast a todos los usuarios conectados
     */
    public function broadcast(string $event, array $data): bool
    {
        return $this->send('notify/broadcast', [
            'event'     => $event,
            'data'      => $data,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

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
                    'status'    => 'online',
                    'data'      => $response->json(),
                ];
            } else {
                return [
                    'available' => false,
                    'status'    => 'error',
                    'message'   => 'WebSocket server returned error: ' . $response->status(),
                ];
            }
        } catch (Exception $e) {
            return [
                'available' => false,
                'status'    => 'offline',
                'message'   => $e->getMessage(),
            ];
        }
    }
}
