<?php

namespace App\Services\WebSocket;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DashboardWebSocketService extends BaseWebSocketService
{
    /**
     * Notificar actualizaciones de métricas del dashboard
     */
    public function notifyMetricsUpdated(array $metricas, string $periodo): bool
    {
        try {
            $success = $this->send('notify/dashboard-metrics', [
                'metricas' => $metricas,
                'periodo' => $periodo,
                'timestamp' => now()->toIso8601String(),
            ]);

            if ($success) {
                Log::info('Dashboard metrics notified via WebSocket', [
                    'periodo' => $periodo,
                    'timestamp' => now()->toIso8601String(),
                ]);
            }

            return $success;
        } catch (\Exception $e) {
            Log::error('Error notifying dashboard metrics:', [
                'error' => $e->getMessage(),
                'periodo' => $periodo,
            ]);

            return false;
        }
    }

    /**
     * Notificar alerta de stock bajo/crítico
     */
    public function notifyStockAlert(array $alertData): bool
    {
        try {
            $success = $this->send('notify/dashboard-stock-alert', [
                'stock_bajo' => $alertData['stock_bajo'] ?? [],
                'stock_critico' => $alertData['stock_critico'] ?? [],
                'productos_afectados' => $alertData['productos_afectados'] ?? 0,
                'timestamp' => now()->toIso8601String(),
            ]);

            if ($success) {
                Log::info('Stock alert notified via WebSocket', [
                    'productos_afectados' => $alertData['productos_afectados'] ?? 0,
                ]);
            }

            return $success;
        } catch (\Exception $e) {
            Log::error('Error notifying stock alert:', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
