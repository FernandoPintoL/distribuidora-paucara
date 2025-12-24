<?php

namespace App\Services\WebSocket;

/**
 * Servicio especializado para notificaciones WebSocket de entregas
 *
 * Maneja todas las notificaciones en tiempo real relacionadas con entregas
 * y cambios de estado en el flujo de carga
 *
 * ESTADOS SOPORTADOS:
 * - PREPARACION_CARGA: Reporte generado, pendiente de confirmación
 * - EN_CARGA: Carga física en progreso
 * - LISTO_PARA_ENTREGA: Carga completada, lista para partida
 * - EN_TRANSITO: En ruta hacia cliente, GPS activo
 * - ENTREGADO: Entrega completada
 */
class EntregaWebSocketService extends BaseWebSocketService
{
    /**
     * Notificar creación de entrega
     */
    public function notifyCreated($entrega): bool
    {
        return $this->send('notify/entrega-created', [
            'id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'venta_id' => $entrega->venta_id,
            'chofer_id' => $entrega->chofer_id,
            'cliente_id' => $entrega->venta?->cliente_id,
            'estado' => $entrega->estado,
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
                'apellido' => $entrega->chofer->apellido ?? '',
                'telefono' => $entrega->chofer->telefono ?? null,
            ] : null,
            'cliente' => $entrega->venta?->cliente ? [
                'id' => $entrega->venta->cliente->id,
                'nombre' => $entrega->venta->cliente->nombre,
                'apellido' => $entrega->venta->cliente->apellido ?? '',
                'telefono' => $entrega->venta->cliente->telefono ?? null,
            ] : null,
            'vehiculo' => $entrega->vehiculo ? [
                'id' => $entrega->vehiculo->id,
                'placa' => $entrega->vehiculo->placa,
                'marca' => $entrega->vehiculo->marca,
                'modelo' => $entrega->vehiculo->modelo,
            ] : null,
            'fecha_programada' => $entrega->fecha_programada?->toIso8601String(),
            'direccion_entrega' => $entrega->direccion_entrega,
            'fecha_creacion' => $entrega->created_at?->toIso8601String(),
        ]);
    }

    /**
     * Notificar generación de reporte de carga
     * Transición: PROGRAMADO → PREPARACION_CARGA
     */
    public function notifyReporteCargoGenerado($entrega, $reporte): bool
    {
        return $this->send('notify/entrega-reporte-generado', [
            'entrega_id' => $entrega->id,
            'reporte_carga_id' => $reporte->id,
            'numero_reporte' => $reporte->numero_reporte,
            'estado_entrega' => 'PREPARACION_CARGA',
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
            ] : null,
            'cliente' => $entrega->venta?->cliente ? [
                'id' => $entrega->venta->cliente->id,
                'nombre' => $entrega->venta->cliente->nombre,
            ] : null,
            'peso_total_kg' => $reporte->peso_total_kg,
            'volumen_total_m3' => $reporte->volumen_total_m3,
            'fecha_generacion' => $reporte->created_at?->toIso8601String(),
        ]);
    }

    /**
     * Notificar confirmación de carga
     * Transición: PREPARACION_CARGA → EN_CARGA
     */
    public function notifyCargoConfirmado($entrega): bool
    {
        return $this->send('notify/entrega-carga-confirmada', [
            'entrega_id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado' => 'EN_CARGA',
            'estado_anterior' => 'PREPARACION_CARGA',
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
                'telefono' => $entrega->chofer->telefono ?? null,
            ] : null,
            'cliente' => $entrega->venta?->cliente ? [
                'id' => $entrega->venta->cliente->id,
                'nombre' => $entrega->venta->cliente->nombre,
                'apellido' => $entrega->venta->cliente->apellido ?? '',
            ] : null,
            'confirmado_por' => $entrega->confirmador?->name ?? 'Sistema',
            'confirmado_en' => $entrega->fecha_confirmacion_carga?->toIso8601String(),
            'mensaje' => 'La carga ha sido confirmada y se está iniciando el proceso de carga física',
        ]);
    }

    /**
     * Notificar que entrega está lista para partida
     * Transición: EN_CARGA → LISTO_PARA_ENTREGA
     */
    public function notifyListoParaEntrega($entrega): bool
    {
        return $this->send('notify/entrega-listo-para-entrega', [
            'entrega_id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado' => 'LISTO_PARA_ENTREGA',
            'estado_anterior' => 'EN_CARGA',
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
                'telefono' => $entrega->chofer->telefono ?? null,
            ] : null,
            'cliente' => $entrega->venta?->cliente ? [
                'id' => $entrega->venta->cliente->id,
                'nombre' => $entrega->venta->cliente->nombre,
            ] : null,
            'vehiculo' => $entrega->vehiculo ? [
                'id' => $entrega->vehiculo->id,
                'placa' => $entrega->vehiculo->placa,
                'marca' => $entrega->vehiculo->marca,
                'modelo' => $entrega->vehiculo->modelo,
            ] : null,
            'direccion_entrega' => $entrega->direccion_entrega,
            'fecha_listo' => now()->toIso8601String(),
            'mensaje' => 'Entrega completada y lista para que el chofer inicie viaje',
        ]);
    }

    /**
     * Notificar inicio de tránsito con ubicación GPS inicial
     * Transición: LISTO_PARA_ENTREGA → EN_TRANSITO
     */
    public function notifyInicioTransito($entrega, float $latitud, float $longitud): bool
    {
        return $this->send('notify/entrega-inicio-transito', [
            'entrega_id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado' => 'EN_TRANSITO',
            'estado_anterior' => 'LISTO_PARA_ENTREGA',
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
                'telefono' => $entrega->chofer->telefono ?? null,
            ] : null,
            'cliente' => $entrega->venta?->cliente ? [
                'id' => $entrega->venta->cliente->id,
                'nombre' => $entrega->venta->cliente->nombre,
                'telefono' => $entrega->venta->cliente->telefono ?? null,
            ] : null,
            'ubicacion_inicial' => [
                'latitud' => $latitud,
                'longitud' => $longitud,
                'timestamp' => now()->toIso8601String(),
            ],
            'direccion_destino' => $entrega->direccion_entrega,
            'vehiculo' => $entrega->vehiculo ? [
                'placa' => $entrega->vehiculo->placa,
                'marca' => $entrega->vehiculo->marca,
            ] : null,
            'mensaje' => 'Chofer ha iniciado el viaje - GPS activo',
        ]);
    }

    /**
     * Notificar actualización de ubicación GPS en tiempo real
     * Se utiliza mientras la entrega está EN_TRANSITO
     */
    public function notifyActualizacionUbicacion($entrega, float $latitud, float $longitud): bool
    {
        return $this->send('notify/entrega-ubicacion-actualizada', [
            'entrega_id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado' => 'EN_TRANSITO',
            'ubicacion_actual' => [
                'latitud' => $latitud,
                'longitud' => $longitud,
                'timestamp' => now()->toIso8601String(),
            ],
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
            ] : null,
            'cliente_id' => $entrega->venta?->cliente_id,
            'direccion_destino' => $entrega->direccion_entrega,
        ]);
    }

    /**
     * Notificar entrega completada
     * Transición: EN_TRANSITO → ENTREGADO
     */
    public function notifyEntregaCompletada($entrega, ?array $fotoUrl = null, ?array $firmaUrl = null): bool
    {
        return $this->send('notify/entrega-completada', [
            'entrega_id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado' => 'ENTREGADO',
            'estado_anterior' => 'EN_TRANSITO',
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
            ] : null,
            'cliente' => $entrega->venta?->cliente ? [
                'id' => $entrega->venta->cliente->id,
                'nombre' => $entrega->venta->cliente->nombre,
                'telefono' => $entrega->venta->cliente->telefono ?? null,
            ] : null,
            'fecha_entrega' => $entrega->fecha_entrega?->toIso8601String(),
            'ubicacion_final' => [
                'latitud' => $entrega->latitud_actual,
                'longitud' => $entrega->longitud_actual,
            ],
            'evidencia' => [
                'foto_entrega' => $fotoUrl,
                'firma_digital' => $firmaUrl,
            ],
            'mensaje' => 'Entrega completada exitosamente',
        ]);
    }

    /**
     * Notificar rechazo o novedad en entrega
     */
    public function notifyNovedad($entrega, string $motivo, bool $requiereReintento = true): bool
    {
        return $this->send('notify/entrega-novedad', [
            'entrega_id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado' => 'NOVEDAD',
            'motivo_novedad' => $motivo,
            'requiere_reintento' => $requiereReintento,
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
                'telefono' => $entrega->chofer->telefono ?? null,
            ] : null,
            'cliente' => $entrega->venta?->cliente ? [
                'id' => $entrega->venta->cliente->id,
                'nombre' => $entrega->venta->cliente->nombre,
                'telefono' => $entrega->venta->cliente->telefono ?? null,
            ] : null,
            'fecha_novedad' => now()->toIso8601String(),
            'ubicacion' => [
                'latitud' => $entrega->latitud_actual,
                'longitud' => $entrega->longitud_actual,
            ],
        ]);
    }

    /**
     * Notificar a roles específicos sobre cambios de entrega
     *
     * Útil para notificar equipos de logística sobre cambios en lote
     */
    public function notifyEquipoLogistica($entrega, string $tipo): bool
    {
        $mensaje = match ($tipo) {
            'carga_completada' => 'Una carga ha sido completada y está lista para entrega',
            'en_transito' => 'Una entrega ha iniciado su viaje',
            'entregada' => 'Una entrega ha sido completada exitosamente',
            'novedad' => 'Se ha reportado una novedad en una entrega',
            default => 'Actualización de entrega'
        };

        return $this->send('notify/entrega-equipo-logistica', [
            'entrega_id' => $entrega->id,
            'numero' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado' => $entrega->estado,
            'tipo_notificacion' => $tipo,
            'mensaje' => $mensaje,
            'venta_id' => $entrega->venta_id,
            'cliente' => $entrega->venta?->cliente ? [
                'nombre' => $entrega->venta->cliente->nombre,
            ] : null,
            'chofer' => $entrega->chofer ? [
                'nombre' => $entrega->chofer->nombre,
            ] : null,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
