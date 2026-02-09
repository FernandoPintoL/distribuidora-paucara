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

    /**
     * ✅ NUEVO: Notificar a CLIENTES que sus ventas están en preparación de carga
     *
     * Se ejecuta cuando se crea una entrega consolidada
     * - Obtiene todas las ventas de la entrega
     * - Agrupa por cliente
     * - Para cada cliente, obtiene su user_id (cliente.user_id, NO cliente_id)
     * - Notifica al cliente vía BD + WebSocket
     *
     * @param Entrega $entrega La entrega creada
     * @return bool True si todas las notificaciones se enviaron correctamente
     */
    public function notificarClientesEntregaEnPreparacion(Entrega $entrega): bool
    {
        try {
            // 1. Obtener todas las ventas de la entrega con sus clientes
            $ventas = $entrega->ventas()->with('cliente')->get();

            if ($ventas->isEmpty()) {
                Log::warning('⚠️  Entrega sin ventas asociadas', [
                    'entrega_id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                ]);
                return false;
            }

            Log::info('📋 Notificando clientes - Entregas en preparación', [
                'entrega_id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
                'total_ventas' => $ventas->count(),
            ]);

            // 2. Agrupar ventas por cliente_id
            $ventasPorCliente = $ventas->groupBy('cliente_id');
            $clientesNotificados = 0;
            $clientesSinUserID = 0;

            // 3. Para cada cliente, notificar
            foreach ($ventasPorCliente as $clienteId => $ventasCliente) {
                $cliente = $ventasCliente->first()?->cliente;

                // ✅ CRÍTICO: Verificar que cliente existe y tiene user_id
                // cliente_id es tabla clientes.id, pero WebSocket necesita cliente.user_id (users.id)
                if (!$cliente) {
                    Log::warning('⚠️  Cliente no encontrado', [
                        'cliente_id' => $clienteId,
                        'entrega_id' => $entrega->id,
                    ]);
                    continue;
                }

                if (!$cliente->user_id) {
                    Log::warning('⚠️  Cliente sin user_id asociado - No se puede notificar', [
                        'cliente_id' => $cliente->id,
                        'cliente_nombre' => $cliente->nombre,
                        'entrega_id' => $entrega->id,
                    ]);
                    $clientesSinUserID++;
                    continue;
                }

                try {
                    // Preparar datos de notificación
                    $ventasNumeros = $ventasCliente->pluck('numero')->toArray();
                    $ventasIds = $ventasCliente->pluck('id')->toArray();

                    Log::info('📬 Notificando cliente - Venta en preparación', [
                        'cliente_id' => $cliente->id,
                        'cliente_nombre' => $cliente->nombre,
                        'user_id' => $cliente->user_id,  // ✅ Esto es lo que WebSocket necesita
                        'ventas_count' => $ventasCliente->count(),
                        'ventas_numeros' => $ventasNumeros,
                        'entrega_numero' => $entrega->numero_entrega,
                    ]);

                    // ✅ 1. Guardar notificación en BD (persistente)
                    $this->dbNotificationService->create(
                        $cliente->user_id,  // ✅ user_id, no cliente_id
                        'venta.preparacion_carga',
                        [
                            'entrega_id' => $entrega->id,
                            'entrega_numero' => $entrega->numero_entrega,
                            'cliente_id' => $cliente->id,
                            'cliente_nombre' => $cliente->nombre,
                            'ventas_ids' => $ventasIds,
                            'ventas_numeros' => $ventasNumeros,
                            'cantidad_ventas' => $ventasCliente->count(),
                            'peso_kg' => $entrega->peso_kg,
                            'volumen_m3' => $entrega->volumen_m3,
                            'mensaje' => count($ventasNumeros) === 1
                                ? "Tu venta {$ventasNumeros[0]} está en preparación de carga - Entrega {$entrega->numero_entrega}"
                                : "Tus " . count($ventasNumeros) . " ventas están en preparación de carga - Entrega {$entrega->numero_entrega}",
                        ],
                        [
                            'entrega_id' => $entrega->id,
                            'cliente_id' => $cliente->id,
                        ]
                    );

                    Log::info('✅ Notificación guardada en BD para cliente', [
                        'cliente_id' => $cliente->id,
                        'user_id' => $cliente->user_id,
                        'entrega_id' => $entrega->id,
                    ]);

                    // ✅ 2. Enviar notificación en tiempo real vía WebSocket
                    $this->wsService->notifyClienteVentasEnPreparacion(
                        $cliente->user_id,  // ✅ user_id para WebSocket
                        $entrega,
                        $ventasCliente
                    );

                    $clientesNotificados++;

                } catch (\Exception $e) {
                    Log::error('❌ Error notificando cliente individual', [
                        'cliente_id' => $cliente->id,
                        'user_id' => $cliente->user_id,
                        'entrega_id' => $entrega->id,
                        'error' => $e->getMessage(),
                    ]);
                    continue;
                }
            }

            Log::info('📊 Resumen de notificaciones a clientes', [
                'entrega_id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
                'clientes_notificados' => $clientesNotificados,
                'clientes_sin_user_id' => $clientesSinUserID,
                'total_clientes' => $ventasPorCliente->count(),
            ]);

            return $clientesNotificados > 0;

        } catch (\Exception $e) {
            Log::error('❌ Error procesando notificaciones a clientes', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * ✅ NUEVO: Notificar a clientes, admins y cajeros cuando sus ventas pasan de EN_PREPARACION a PENDIENTE_ENVIO
     * (cuando la entrega está lista para partir)
     *
     * Flujo:
     * 1. Obtener todas las ventas de la entrega
     * 2. Agrupar por cliente
     * 3. Para cada cliente, notificar del cambio de estado
     * 4. Notificar a admins y cajeros
     * 5. Guardar en BD (persistente)
     * 6. Enviar vía WebSocket (tiempo real)
     */
    public function notificarClientesListoParaEntrega(Entrega $entrega): bool
    {
        try {
            // 1. Obtener todas las ventas de la entrega con sus clientes
            $ventas = $entrega->ventas()
                ->with('cliente.user')
                ->get();

            if ($ventas->isEmpty()) {
                Log::warning('⚠️ Entrega sin ventas para notificar', [
                    'entrega_id' => $entrega->id,
                ]);
                return false;
            }

            // 2. Agrupar ventas por cliente_id
            $ventasPorCliente = $ventas->groupBy('cliente_id');
            $clientesNotificados = 0;
            $clientesSinUserID = 0;

            // Resumen para admins/cajeros
            $totalVentasEnPreparacion = $ventas->count();
            $ventasNumeros = $ventas->pluck('numero_venta')->filter()->join(', ');

            // 3. Iterar sobre cada cliente y notificar
            foreach ($ventasPorCliente as $clienteId => $ventasDelCliente) {
                try {
                    // Obtener el cliente y su user_id
                    $cliente = $ventasDelCliente->first()?->cliente;

                    if (!$cliente || !$cliente->user_id) {
                        Log::warning('⚠️ Cliente sin user_id, omitiendo notificación', [
                            'entrega_id' => $entrega->id,
                            'cliente_id' => $clienteId,
                        ]);
                        $clientesSinUserID++;
                        continue;
                    }

                    $userId = $cliente->user_id;
                    $ventasNumerosPorCliente = $ventasDelCliente->pluck('numero_venta')->filter()->join(', ');
                    $cantidadVentas = $ventasDelCliente->count();

                    // 4. Guardar en BD (persistente) para el CLIENTE
                    $this->dbNotificationService->create(
                        $userId,
                        'venta.estado_logistico_cambio',
                        [
                            'tipo_cambio' => 'PENDIENTE_ENVIO',
                            'estado_anterior' => 'EN_PREPARACION',
                            'estado_nuevo' => 'PENDIENTE_ENVIO',
                            'entrega_id' => $entrega->id,
                            'numero_entrega' => $entrega->numero_entrega ?? "ENT-{$entrega->id}",
                            'cantidad_ventas' => $cantidadVentas,
                            'ventas_numeros' => $ventasNumerosPorCliente,
                            'cliente_nombre' => $cliente->nombre_completo,
                            'mensaje' => $cantidadVentas === 1
                                ? "Tu venta {$ventasNumerosPorCliente} está lista para ser enviada (Entrega {$entrega->numero_entrega})"
                                : "Tus {$cantidadVentas} ventas están listas para ser enviadas (Entrega {$entrega->numero_entrega})",
                        ],
                        [
                            'entrega_id' => $entrega->id,
                            'cliente_id' => $clienteId,
                        ]
                    );

                    Log::info('📬 Notificación de cambio de estado logístico guardada en BD (CLIENTE)', [
                        'entrega_id' => $entrega->id,
                        'usuario_id' => $userId,
                        'cliente_id' => $clienteId,
                        'cliente_nombre' => $cliente->nombre_completo,
                        'cantidad_ventas' => $cantidadVentas,
                        'estado_nuevo' => 'PENDIENTE_ENVIO',
                    ]);

                    // 5. Enviar vía WebSocket (tiempo real) al CLIENTE
                    $this->wsService->notifyClienteVentasListoParaEntrega(
                        $userId,
                        $entrega,
                        $ventasDelCliente->toArray()
                    );

                    $clientesNotificados++;

                } catch (\Exception $e) {
                    Log::error('❌ Error notificando a cliente individual', [
                        'entrega_id' => $entrega->id,
                        'cliente_id' => $clienteId,
                        'error' => $e->getMessage(),
                    ]);
                    continue;
                }
            }

            // ✅ NUEVO: Notificar también a ADMINS Y CAJEROS
            try {
                Log::info('📢 Enviando notificación a admins y cajeros', [
                    'entrega_id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'total_ventas' => $totalVentasEnPreparacion,
                ]);

                $this->wsService->notifyAdminsListoParaEntrega($entrega, $ventas);

            } catch (\Exception $e) {
                Log::error('❌ Error notificando a admins/cajeros', [
                    'entrega_id' => $entrega->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('📊 Resumen: clientes, admins y cajeros notificados de cambio de estado logístico', [
                'entrega_id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
                'clientes_notificados' => $clientesNotificados,
                'clientes_sin_user_id' => $clientesSinUserID,
                'total_clientes' => $ventasPorCliente->count(),
                'nuevo_estado' => 'PENDIENTE_ENVIO',
                'admins_y_cajeros' => 'NOTIFICADOS',
            ]);

            return $clientesNotificados > 0;

        } catch (\Exception $e) {
            Log::error('❌ Error procesando notificaciones de cambio de estado logístico', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * ✅ NUEVO: Notificar a clientes, admins y cajeros cuando la entrega pasa a EN_TRANSITO
     * (ventas cambian de PENDIENTE_ENVIO a EN_TRANSITO)
     *
     * Flujo:
     * 1. Notificar a cada cliente individualmente
     * 2. Notificar a admins y cajeros con resumen
     * 3. Guardar en BD (persistente)
     * 4. Enviar vía WebSocket (tiempo real)
     */
    public function notificarClientesEnTransito(Entrega $entrega): bool
    {
        try {
            // 1. Obtener todas las ventas de la entrega con sus clientes
            $ventas = $entrega->ventas()
                ->with('cliente.user')
                ->get();

            if ($ventas->isEmpty()) {
                Log::warning('⚠️ Entrega sin ventas para notificar', [
                    'entrega_id' => $entrega->id,
                ]);
                return false;
            }

            // 2. Agrupar ventas por cliente_id
            $ventasPorCliente = $ventas->groupBy('cliente_id');
            $clientesNotificados = 0;
            $clientesSinUserID = 0;

            // Resumen para admins/cajeros
            $totalVentasEnTransito = $ventas->count();
            $ventasNumeros = $ventas->pluck('numero_venta')->filter()->join(', ');

            // 3. Iterar sobre cada cliente y notificar
            foreach ($ventasPorCliente as $clienteId => $ventasDelCliente) {
                try {
                    // Obtener el cliente y su user_id
                    $cliente = $ventasDelCliente->first()?->cliente;

                    if (!$cliente || !$cliente->user_id) {
                        Log::warning('⚠️ Cliente sin user_id, omitiendo notificación', [
                            'entrega_id' => $entrega->id,
                            'cliente_id' => $clienteId,
                        ]);
                        $clientesSinUserID++;
                        continue;
                    }

                    $userId = $cliente->user_id;
                    $ventasNumerosPorCliente = $ventasDelCliente->pluck('numero_venta')->filter()->join(', ');
                    $cantidadVentas = $ventasDelCliente->count();

                    // 4. Guardar en BD (persistente) para el CLIENTE
                    $this->dbNotificationService->create(
                        $userId,
                        'venta.en_transito',
                        [
                            'tipo_cambio' => 'EN_TRANSITO',
                            'estado_anterior' => 'PENDIENTE_ENVIO',
                            'estado_nuevo' => 'EN_TRANSITO',
                            'entrega_id' => $entrega->id,
                            'numero_entrega' => $entrega->numero_entrega ?? "ENT-{$entrega->id}",
                            'cantidad_ventas' => $cantidadVentas,
                            'ventas_numeros' => $ventasNumerosPorCliente,
                            'cliente_nombre' => $cliente->nombre_completo,
                            'chofer' => $entrega->chofer?->name,
                            'mensaje' => $cantidadVentas === 1
                                ? "Tu venta {$ventasNumerosPorCliente} está en tránsito - Chofer: {$entrega->chofer?->name}"
                                : "Tus {$cantidadVentas} ventas están en tránsito - Chofer: {$entrega->chofer?->name}",
                        ],
                        [
                            'entrega_id' => $entrega->id,
                            'cliente_id' => $clienteId,
                        ]
                    );

                    Log::info('📬 Notificación de en tránsito guardada en BD (CLIENTE)', [
                        'entrega_id' => $entrega->id,
                        'usuario_id' => $userId,
                        'cliente_id' => $clienteId,
                        'cantidad_ventas' => $cantidadVentas,
                    ]);

                    // 5. Enviar vía WebSocket (tiempo real) al CLIENTE
                    $this->wsService->notifyClienteEnTransito(
                        $userId,
                        $entrega,
                        $ventasDelCliente->toArray()
                    );

                    $clientesNotificados++;

                } catch (\Exception $e) {
                    Log::error('❌ Error notificando a cliente individual', [
                        'entrega_id' => $entrega->id,
                        'cliente_id' => $clienteId,
                        'error' => $e->getMessage(),
                    ]);
                    continue;
                }
            }

            // ✅ NUEVO: Notificar también a ADMINS Y CAJEROS
            try {
                Log::info('📢 Enviando notificación a admins y cajeros sobre entrega en tránsito', [
                    'entrega_id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'total_ventas' => $totalVentasEnTransito,
                ]);

                $this->wsService->notifyAdminsEnTransito($entrega, $ventas);

            } catch (\Exception $e) {
                Log::error('❌ Error notificando a admins/cajeros sobre en tránsito', [
                    'entrega_id' => $entrega->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('📊 Resumen: clientes, admins y cajeros notificados de entrega en tránsito', [
                'entrega_id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
                'clientes_notificados' => $clientesNotificados,
                'clientes_sin_user_id' => $clientesSinUserID,
                'total_clientes' => $ventasPorCliente->count(),
            ]);

            return $clientesNotificados > 0;

        } catch (\Exception $e) {
            Log::error('❌ Error procesando notificaciones de entrega en tránsito', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }
}
