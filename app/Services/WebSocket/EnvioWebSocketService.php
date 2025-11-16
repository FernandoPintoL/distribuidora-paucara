<?php

namespace App\Services\WebSocket;

/**
 * Servicio especializado para notificaciones WebSocket de Envíos/Logística
 *
 * Maneja todas las notificaciones en tiempo real relacionadas con envíos
 */
class EnvioWebSocketService extends BaseWebSocketService
{
    /**
     * Notificar creación de envío programado
     */
    public function notifyProgramado($envio): bool
    {
        return $this->send('notify/envio-programado', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'venta_id' => $envio->venta_id,
            'venta_numero' => $envio->venta?->numero ?? null,
            'cliente' => [
                'id' => $envio->venta?->cliente_id ?? null,
                'nombre' => $envio->venta?->cliente?->nombre ?? 'Cliente',
            ],
            'vehiculo' => [
                'id' => $envio->vehiculo_id,
                'placa' => $envio->vehiculo?->placa ?? null,
                'marca' => $envio->vehiculo?->marca ?? null,
                'modelo' => $envio->vehiculo?->modelo ?? null,
            ],
            'chofer' => [
                'id' => $envio->chofer_id,
                'name' => $envio->chofer?->name ?? 'Chofer',
            ],
            'fecha_programada' => $envio->fecha_programada?->toIso8601String(),
            'direccion_entrega' => $envio->direccion_entrega,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar inicio de preparación de envío
     */
    public function notifyEnPreparacion($envio): bool
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
    public function notifyEnRuta($envio): bool
    {
        return $this->send('notify/envio-en-ruta', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'chofer_id' => $envio->chofer_id,
            'vehiculo' => [
                'id' => $envio->vehiculo_id,
                'placa' => $envio->vehiculo?->placa ?? null,
            ],
            'fecha_salida' => $envio->fecha_salida?->toIso8601String(),
            'direccion_entrega' => $envio->direccion_entrega,
            'cliente_id' => $envio->venta?->cliente_id ?? null,
            'mensaje' => 'Vehículo en camino',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar actualización de ubicación GPS
     */
    public function notifyUbicacionActualizada($envio, float $lat, float $lng): bool
    {
        return $this->send('notify/envio-ubicacion', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'ubicacion' => [
                'latitud' => $lat,
                'longitud' => $lng,
            ],
            'cliente_id' => $envio->venta?->cliente_id ?? null,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar entrega completada
     */
    public function notifyEntregado($envio): bool
    {
        return $this->send('notify/envio-entregado', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'venta_id' => $envio->venta_id,
            'cliente' => [
                'id' => $envio->venta?->cliente_id ?? null,
                'nombre' => $envio->venta?->cliente?->nombre ?? 'Cliente',
            ],
            'receptor' => [
                'nombre' => $envio->receptor_nombre,
                'documento' => $envio->receptor_documento,
            ],
            'fecha_entrega' => $envio->fecha_entrega?->toIso8601String(),
            'chofer_id' => $envio->chofer_id,
            'mensaje' => 'Envío entregado exitosamente',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar cancelación de envío
     */
    public function notifyCancelado($envio, string $motivo): bool
    {
        return $this->send('notify/envio-cancelado', [
            'envio_id' => $envio->id,
            'numero_envio' => $envio->numero_envio,
            'estado' => $envio->estado,
            'venta_id' => $envio->venta_id,
            'cliente_id' => $envio->venta?->cliente_id ?? null,
            'chofer_id' => $envio->chofer_id,
            'motivo' => $motivo,
            'mensaje' => 'Envío cancelado',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
