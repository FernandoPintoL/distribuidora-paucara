<?php

namespace App\Services\WebSocket;

/**
 * Servicio especializado para notificaciones WebSocket de entregas
 *
 * FASE 5: SINCRONIZACIÓN DE ESTADOS VENTA-ENTREGA
 *
 * Maneja todas las notificaciones en tiempo real relacionadas con entregas
 * y cambios de estado en el flujo de carga
 *
 * NUEVO EN FASE 5:
 * ✓ Notifica cambios de estado de VENTA también (no solo Entrega)
 * ✓ Envía mapeos automáticos (qué estado corresponde a venta)
 * ✓ Notificaciones para cliente sobre su venta específica
 * ✓ Incluye SLA y ventana de entrega en notificaciones
 * ✓ Auditoría de sincronización en tiempo real
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
    private \App\Services\Logistica\SincronizacionVentaEntregaService $sincronizador;

    public function __construct(
        \App\Services\Logistica\SincronizacionVentaEntregaService $sincronizador
    ) {
        $this->sincronizador = $sincronizador;
    }
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

    /**
     * NUEVO - FASE 5: Notificar cambio de estado SINCRONIZADO de Entrega y Ventas
     *
     * Cuando entrega cambia de estado → ventas se sincronizan automáticamente
     * Esta notificación informa a todos los clientes y admin sobre el cambio coordinado
     *
     * @param \App\Models\Entrega $entrega Entrega que cambió de estado
     * @param string $estadoNuevo Nuevo estado de entrega (código)
     * @param string|null $estadoAnterior Estado anterior (para auditoría)
     */
    public function notifyEstadoSincronizado(
        \App\Models\Entrega $entrega,
        string $estadoNuevo,
        ?string $estadoAnterior = null
    ): bool {
        // Obtener mapeo para saber qué estado tienen las ventas ahora
        $mapeo = \App\Models\MapeoEstado::query()
            ->where('categoria_origen', 'entrega_logistica')
            ->whereHas('estadoOrigen', function ($q) use ($estadoNuevo) {
                $q->where('codigo', $estadoNuevo);
            })
            ->where('categoria_destino', 'venta_logistica')
            ->first();

        $estadoVentaTarget = $mapeo?->estadoDestino?->codigo ?? null;

        // Obtener ventas sincronizadas
        $ventas = $entrega->ventas()->get()->map(function ($venta) {
            return [
                'id' => $venta->id,
                'numero' => $venta->numero,
                'cliente_id' => $venta->cliente_id,
                'cliente_nombre' => $venta->cliente?->nombre,
                'estado_logistico' => $venta->estadoLogistico?->codigo ?? 'DESCONOCIDO',
            ];
        });

        $payload = [
            'tipo_evento' => 'sincronizacion_estados',
            'entrega_id' => $entrega->id,
            'numero_entrega' => $entrega->numero ?? "#E-{$entrega->id}",
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo_entrega' => $estadoNuevo,
            'estado_nuevo_venta' => $estadoVentaTarget,
            'mapeo' => [
                'desde_categoria' => 'entrega_logistica',
                'desde_estado' => $estadoNuevo,
                'hacia_categoria' => 'venta_logistica',
                'hacia_estado' => $estadoVentaTarget,
            ],
            'ventas_sincronizadas' => $ventas,
            'cantidad_ventas' => $ventas->count(),
            'sla' => [
                'fecha_entrega_comprometida' => $entrega->fecha_entrega_comprometida?->toDateString(),
                'ventana_entrega_ini' => $entrega->ventana_entrega_ini?->format('H:i:s'),
                'ventana_entrega_fin' => $entrega->ventana_entrega_fin?->format('H:i:s'),
            ],
            'chofer' => $entrega->chofer ? [
                'id' => $entrega->chofer->id,
                'nombre' => $entrega->chofer->nombre,
                'telefono' => $entrega->chofer->telefono ?? null,
            ] : null,
            'vehiculo' => $entrega->vehiculo ? [
                'id' => $entrega->vehiculo->id,
                'placa' => $entrega->vehiculo->placa,
            ] : null,
            'timestamp' => now()->toIso8601String(),
        ];

        // Enviar a 3 canales
        return $this->send('notify/sincronizacion-entrega-venta', $payload)
            && $this->sendToClientes($entrega, $payload)
            && $this->sendToAdminLogistica($entrega, $payload);
    }

    /**
     * NUEVO - Notificar a CLIENTES sobre cambio en su venta específica
     *
     * Cada cliente recibe notificación de qué pasó con su venta
     * Incluye tracking, SLA, y estado actualizado
     */
    private function sendToClientes(\App\Models\Entrega $entrega, array $syncPayload): bool
    {
        $success = true;

        // Enviar a cada cliente una notificación específica de su venta
        foreach ($syncPayload['ventas_sincronizadas'] as $ventaData) {
            $venta = \App\Models\Venta::find($ventaData['id']);

            if (!$venta || !$venta->cliente_id) {
                continue;
            }

            $clientePayload = [
                'tipo_evento' => 'seguimiento_venta',
                'venta_id' => $venta->id,
                'numero_venta' => $venta->numero,
                'cliente_id' => $venta->cliente_id,
                'estado_logistico' => $ventaData['estado_logistico'],
                'entrega_numero' => $syncPayload['numero_entrega'],
                'chofer' => $syncPayload['chofer'],
                'sla' => $syncPayload['sla'],
                'ubicacion_chofer' => [
                    'latitud' => $entrega->latitud_actual,
                    'longitud' => $entrega->longitud_actual,
                    'timestamp' => $entrega->fecha_ultima_ubicacion?->toIso8601String(),
                ],
                'mensaje' => "Tu pedido #{$venta->numero} está {$this->getEstadoHumano($ventaData['estado_logistico'])}",
                'timestamp' => now()->toIso8601String(),
            ];

            // Enviar al cliente (usuario autenticado)
            $sent = $this->send(
                "cliente.{$venta->cliente_id}.seguimiento",
                $clientePayload
            );

            $success = $success && $sent;
        }

        return $success;
    }

    /**
     * NUEVO - Notificar a equipo de logística/admin
     */
    private function sendToAdminLogistica(\App\Models\Entrega $entrega, array $syncPayload): bool
    {
        return $this->send('notify/admin-sincronizacion-entrega', [
            'entrega_id' => $entrega->id,
            'numero_entrega' => $syncPayload['numero_entrega'],
            'estado_entrega_anterior' => $syncPayload['estado_anterior'],
            'estado_entrega_nuevo' => $syncPayload['estado_nuevo_entrega'],
            'estado_venta_nuevo' => $syncPayload['estado_nuevo_venta'],
            'ventas_sincronizadas' => $syncPayload['ventas_sincronizadas'],
            'cantidad_ventas' => $syncPayload['cantidad_ventas'],
            'chofer' => $syncPayload['chofer'],
            'vehiculo' => $syncPayload['vehiculo'],
            'timestamp' => $syncPayload['timestamp'],
        ]);
    }

    /**
     * Convertir código de estado a texto humano para clientes
     */
    private function getEstadoHumano(string $codigoEstado): string
    {
        return match ($codigoEstado) {
            'PENDIENTE_ENVIO' => 'pendiente de preparación',
            'PREPARANDO' => 'siendo preparado en almacén',
            'EN_PREPARACION' => 'completando preparación',
            'EN_TRANSITO' => 'en camino hacia ti',
            'ENTREGADO' => 'entregado',
            'PROBLEMAS' => 'con novedad, nos comunicaremos pronto',
            'CANCELADA' => 'cancelado',
            default => 'en proceso'
        };
    }

    /**
     * NUEVO - Notificar cambio de estado con sincronización de SLA
     *
     * Incluye validación de SLA (on-time vs delay) al cambiar de estado
     */
    public function notifyEstadoConValidacionSLA(
        \App\Models\Entrega $entrega,
        string $estadoNuevo
    ): bool {
        // Calcular si estamos on-time o con delay
        $ahora = now();
        $ventanaFin = $entrega->ventana_entrega_fin
            ? $entrega->fecha_entrega_comprometida?->copy()->setTimeFromTimeString($entrega->ventana_entrega_fin->format('H:i:s'))
            : null;

        $slaStatus = 'on_schedule';
        $minutoDelay = 0;

        if ($ventanaFin && $ahora->isAfter($ventanaFin)) {
            $slaStatus = 'delayed';
            $minutoDelay = $ahora->diffInMinutes($ventanaFin);
        }

        return $this->send('notify/estado-con-sla', [
            'entrega_id' => $entrega->id,
            'estado_nuevo' => $estadoNuevo,
            'sla_status' => $slaStatus,
            'minutos_delay' => $minutoDelay,
            'fecha_comprometida' => $entrega->fecha_entrega_comprometida?->toIso8601String(),
            'ventana_fin' => $ventanaFin?->toIso8601String(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
