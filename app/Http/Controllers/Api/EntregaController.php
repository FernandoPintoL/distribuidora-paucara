<?php

namespace App\Http\Controllers\Api;

use App\Events\UbicacionActualizada;
use App\Events\MarcarLlegadaConfirmada;
use App\Events\EntregaConfirmada;
use App\Events\NovedadEntregaReportada;
use App\Http\Controllers\Controller;
use App\Models\Entrega;
use App\Models\EstadoLogistica;
use App\Models\Proforma;
use App\Models\Venta;  // ✅ Importar modelo Venta
use App\Models\EntregaVentaConfirmacion;  // ✅ Importar modelo confirmaciones
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class EntregaController extends Controller
{
    /**
     * ENDPOINTS PARA CHOFER
     */

    /**
     * GET /api/chofer/trabajos
     * Obtener ENTREGAS + ENVIOS asignados al chofer (combinados)
     * Este es el endpoint recomendado para ver todas las cargas del chofer
     */
    public function misTrabjos(Request $request)
    {
        try {
            $user = Auth::user();

            // DEBUG: Log para verificar qué user.id está siendo usado
            Log::info('📱 [misTrabjos] User autenticado', [
                'user_id' => $user->id,
                'name' => $user->name,
                'usernick' => $user->usernick,
            ]);

            // DEBUG: Log de todas las entregas en la BD agrupadas por chofer_id
            $entregasPorChofer = Entrega::select('chofer_id')
                ->groupBy('chofer_id')
                ->selectRaw('chofer_id, COUNT(*) as cantidad')
                ->get();
            Log::info('📱 [misTrabjos] Entregas en BD por chofer_id', [
                'resumen' => $entregasPorChofer->toArray(),
            ]);

            // Obtener entregas asignadas al chofer (user actual)
            // FK chofer_id en entregas apunta a users.id
            $perPage = $request->per_page ?? 15;
            $page = $request->page ?? 1;
            $estado = $request->estado;

            // DEBUG: Log todas las entregas del chofer sin filtro
            $todasEntregas = Entrega::where('chofer_id', $user->id)
                ->get();

            Log::info('📱 [misTrabjos] Todas las entregas sin filtro', [
                'user_id' => $user->id,
                'chofer_id' => $user->id,
                'cantidad_total' => count($todasEntregas),
                'estados' => $todasEntregas->pluck('estado')->unique()->toArray(),
                'entregas_por_estado' => $todasEntregas->groupBy('estado')->map(fn($grupo) => count($grupo))->toArray(),
            ]);

            // Obtener entregas asignadas al chofer (user actual)
            // Seleccionar solo campos necesarios para la lista
            $entregas = Entrega::where('chofer_id', $user->id)
                ->select([
                    'id', 'numero_entrega', 'estado', 'estado_entrega_id',
                    'fecha_asignacion', 'fecha_entrega', 'observaciones',
                    'peso_kg', 'vehiculo_id', 'chofer_id'
                ])
                ->with([
                    'estadoEntrega:id,codigo,nombre,color,icono',  // Solo campos necesarios
                    'ventas:id,numero,subtotal,impuesto,total,estado_logistico_id,fecha_entrega_comprometida,cliente_id,direccion_cliente_id,entrega_id',
                    'ventas.cliente:id,nombre,telefono',
                    'ventas.direccionCliente:id,direccion,latitud,longitud',
                    'ventas.estadoLogistica:id,codigo,nombre,color,icono',
                    'vehiculo:id,placa,marca,modelo'
                ])
                ->when($estado, function ($q) use ($estado) {
                    return $q->where('estado', $estado);
                })
                ->get();

            // DEBUG: Log cantidad de entregas encontradas CON filtro
            Log::info('📱 [misTrabjos] Entregas encontradas CON FILTRO', [
                'user_id' => $user->id,
                'estado_filtro' => $estado,
                'cantidad' => count($entregas),
                'entregas' => $entregas->pluck('id')->toArray(),
            ]);

            // ✅ Transformar a estructura limpia (sin duplicación)
            $entregas = $entregas->map(function ($entrega) {
                // Calcular totales
                $subtotalTotal = $entrega->ventas->sum('subtotal');
                $impuestoTotal = $entrega->ventas->sum('impuesto');
                $totalGeneral = $entrega->ventas->sum('total');

                // Preparar ventas sin IDs redundantes ni visual
                $ventasLimpias = $entrega->ventas->map(function ($venta) {
                    return [
                        'id' => $venta->id,
                        'numero' => $venta->numero,
                        'subtotal' => $venta->subtotal,
                        'impuesto' => $venta->impuesto,
                        'total' => $venta->total,
                        'estado_logistico_id' => $venta->estado_logistico_id,
                        'fecha_entrega_comprometida' => $venta->fecha_entrega_comprometida,
                        'cliente' => $venta->cliente ? [
                            'id' => $venta->cliente->id,
                            'nombre' => $venta->cliente->nombre,
                            'telefono' => $venta->cliente->telefono,
                        ] : null,
                        'direccion_cliente' => $venta->direccionCliente ? [
                            'id' => $venta->direccionCliente->id,
                            'direccion' => $venta->direccionCliente->direccion,
                            'latitud' => $venta->direccionCliente->latitud,
                            'longitud' => $venta->direccionCliente->longitud,
                        ] : null,
                        'estado_logistica' => $venta->estadoLogistica ? [
                            'id' => $venta->estadoLogistica->id,
                            'codigo' => $venta->estadoLogistica->codigo,
                            'nombre' => $venta->estadoLogistica->nombre,
                            'color' => $venta->estadoLogistica->color,
                            'icono' => $venta->estadoLogistica->icono,
                        ] : null,
                    ];
                })->toArray();

                return [
                    'id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'estado' => $entrega->estado,
                    'estado_entrega_id' => $entrega->estado_entrega_id,
                    'estado_entrega' => $entrega->estadoEntrega ? [
                        'id' => $entrega->estadoEntrega->id,
                        'codigo' => $entrega->estadoEntrega->codigo,
                        'nombre' => $entrega->estadoEntrega->nombre,
                        'color' => $entrega->estadoEntrega->color,
                        'icono' => $entrega->estadoEntrega->icono,
                    ] : null,
                    'fecha_asignacion' => $entrega->fecha_asignacion,
                    'fecha_entrega' => $entrega->fecha_entrega,
                    'observaciones' => $entrega->observaciones,
                    'peso_kg' => $entrega->peso_kg,
                    'vehiculo' => $entrega->vehiculo ? [
                        'id' => $entrega->vehiculo->id,
                        'placa' => $entrega->vehiculo->placa,
                        'marca' => $entrega->vehiculo->marca,
                        'modelo' => $entrega->vehiculo->modelo,
                    ] : null,
                    'subtotal_total' => (float) $subtotalTotal,
                    'impuesto_total' => (float) $impuestoTotal,
                    'total_general' => (float) $totalGeneral,
                    'ventas' => $ventasLimpias,
                ];
            });

            // Combinar entregas (sin legacy envios, ya que fueron eliminados)
            $trabajos = $entregas
                ->sortByDesc('fecha_asignacion')
                ->values();

            // Aplicar paginación manual
            $total = count($trabajos);
            $items = $trabajos->slice(($page - 1) * $perPage, $perPage)->values();

            $paginado = new LengthAwarePaginator(
                $items,
                $total,
                $perPage,
                $page,
                [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $paginado->items(),
                'pagination' => [
                    'total' => $paginado->total(),
                    'per_page' => $paginado->perPage(),
                    'current_page' => $paginado->currentPage(),
                    'last_page' => $paginado->lastPage(),
                    'from' => $paginado->firstItem(),
                    'to' => $paginado->lastItem(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener trabajos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/chofer/entregas
     * Obtener entregas asignadas al chofer autenticado (solo entregas)
     */
    public function entregasAsignadas(Request $request)
    {
        try {
            $user = Auth::user();

            // Obtener entregas asignadas al chofer (user actual)
            // FK chofer_id en entregas apunta a users.id
            $entregas = Entrega::where('chofer_id', $user->id)
                ->with([
                    'ventas.cliente',
                    'ventas.direccionCliente',  // NUEVO: Cargar ubicación de entrega desde venta
                    'ventas.estadoLogistica',   // NUEVO: Cargar estado logístico de venta (tabla estados_logistica)
                    'vehiculo'
                ])
                ->when($request->estado, function ($q) use ($request) {
                    return $q->where('estado', $request->estado);
                })
                ->latest('fecha_asignacion')
                ->paginate($request->per_page ?? 15);

            return response()->json([
                'success' => true,
                'data' => $entregas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener entregas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/chofer/entregas/{id}
     * Obtener detalle de una entrega
     */
    public function showEntrega($id)
    {
        try {
            $user = Auth::user();
            $entrega = Entrega::with([
                'ventas.cliente',
                'ventas.direccionCliente',  // NUEVO: Cargar ubicación de entrega desde venta
                'ventas.estadoLogistica',   // NUEVO: Cargar estado logístico de venta (tabla estados_logistica)
                'ventas.detalles.producto',
                'chofer',  // FASE 3: chofer apunta a users.id, no a empleados.id
                'vehiculo',
                'reportes',
                'ubicaciones',
                'historialEstados',
                'estadoEntrega',  // NUEVO: Cargar estado logístico de entrega desde table estados_logistica
            ])->findOrFail($id);

            // Verificar autorización
            // Solo el chofer asignado o admin pueden ver la entrega
            // (En el futuro se pueden agregar más validaciones)
            if ($entrega->chofer_id !== $user->id && !auth()->user()->hasRole(['admin', 'Admin', 'ADMIN', 'manager', 'Manager', 'MANAGER'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $entrega,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Entrega no encontrada',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener entrega',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/iniciar-ruta
     * Marcar entrega como EN_CAMINO (legacy) o EN_TRANSITO (nuevo flujo)
     * Actualizar también todas las ventas a EN_TRANSITO
     */
    public function iniciarRuta($id)
    {
        try {
            $entrega = Entrega::findOrFail($id);

            // Aceptar tanto ASIGNADA (flujo legacy) como LISTO_PARA_ENTREGA (nuevo flujo)
            $estadosValidos = [
                Entrega::ESTADO_ASIGNADA,
                Entrega::ESTADO_LISTO_PARA_ENTREGA,
            ];

            if (!in_array($entrega->estado, $estadosValidos)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La entrega debe estar en estado ASIGNADA o LISTO_PARA_ENTREGA',
                ], 422);
            }

            // Determinar el próximo estado según el estado actual
            $nuevoEstado = $entrega->estado === Entrega::ESTADO_ASIGNADA
                ? Entrega::ESTADO_EN_CAMINO
                : Entrega::ESTADO_EN_TRANSITO;

            // Cambiar estado de la entrega
            $entrega->cambiarEstado(
                $nuevoEstado,
                'Chofer inició la ruta',
                Auth::user()
            );

            // Actualizar todas las ventas a EN_TRANSITO (cuando la entrega está en el flujo nuevo)
            if ($nuevoEstado === Entrega::ESTADO_EN_TRANSITO) {
                $estadoEnTransitoId = \App\Models\EstadoLogistica::where('codigo', 'EN_TRANSITO')
                    ->where('categoria', 'venta_logistica')
                    ->value('id');

                if ($estadoEnTransitoId) {
                    $ventasCount = $entrega->ventas()->update([
                        'estado_logistico_id' => $estadoEnTransitoId,
                    ]);

                    Log::info('✅ [INICIAR_RUTA] Ventas actualizadas a EN_TRANSITO', [
                        'entrega_id' => $entrega->id,
                        'ventas_actualizadas' => $ventasCount,
                        'estado_logistico_id' => $estadoEnTransitoId,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Entrega iniciada',
                'data' => $entrega->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar ruta',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/actualizar-estado
     * Actualizar estado de la entrega
     */
    public function actualizarEstado(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'estado' => 'required|in:EN_CAMINO,LLEGO,ENTREGADO,NOVEDAD,CANCELADA',
                'comentario' => 'nullable|string',
            ]);

            $entrega = Entrega::findOrFail($id);

            // Validar transición de estado
            $estadosValidos = [
                Entrega::ESTADO_ASIGNADA => [Entrega::ESTADO_EN_CAMINO, Entrega::ESTADO_CANCELADA],
                Entrega::ESTADO_EN_CAMINO => [Entrega::ESTADO_LLEGO, Entrega::ESTADO_NOVEDAD],
                Entrega::ESTADO_LLEGO => [Entrega::ESTADO_ENTREGADO, Entrega::ESTADO_NOVEDAD],
                Entrega::ESTADO_ENTREGADO => [],
                Entrega::ESTADO_NOVEDAD => [Entrega::ESTADO_EN_CAMINO],
                Entrega::ESTADO_CANCELADA => [],
            ];

            if (!isset($estadosValidos[$entrega->estado]) || !in_array($validated['estado'], $estadosValidos[$entrega->estado])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transición de estado no permitida',
                ], 422);
            }

            $entrega->cambiarEstado(
                $validated['estado'],
                $validated['comentario'] ?? null,
                Auth::user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado',
                'data' => $entrega->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar estado',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/marcar-llegada
     * Marcar que el chofer llegó al destino
     */
    public function marcarLlegada($id, Request $request)
    {
        try {
            $entrega = Entrega::findOrFail($id);

            if ($entrega->estado !== Entrega::ESTADO_EN_CAMINO) {
                return response()->json([
                    'success' => false,
                    'message' => 'La entrega debe estar EN_CAMINO',
                ], 422);
            }

            // Obtener coordenadas GPS del request
            $latitud = $request->input('latitud', null);
            $longitud = $request->input('longitud', null);

            $entrega->update([
                'estado' => Entrega::ESTADO_LLEGO,
                'fecha_llegada' => now(),
            ]);

            $entrega->cambiarEstado(
                Entrega::ESTADO_LLEGO,
                'Chofer llegó al destino',
                Auth::user()
            );

            // Emitir evento de broadcast para notificar en tiempo real
            event(new MarcarLlegadaConfirmada(
                $entrega->fresh(),
                [
                    'latitud' => $latitud,
                    'longitud' => $longitud,
                ]
            ));

            return response()->json([
                'success' => true,
                'message' => 'Llegada registrada',
                'data' => $entrega->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar llegada',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/confirmar-entrega
     * Confirmar entrega con firma y fotos
     */
    /**
     * POST /api/chofer/entregas/{id}/ventas/{venta_id}/confirmar-entrega
     * Confirmar UNA VENTA específica dentro de una entrega
     * Cuando todas las ventas estén entregadas, la entrega se marca como ENTREGADA automáticamente
     */
    /**
     * POST /api/chofer/entregas/{id}/ventas/{venta_id}/confirmar-entrega
     *
     * Confirmar entrega de UNA VENTA específica (venta por venta)
     * - Venta pasa de EN_TRANSITO → ENTREGADA
     * - Guarda foto y firma de la venta
     * - La entrega solo se finaliza cuando chofer ejecute endpoint separado
     */
    public function confirmarVentaEntregada(Request $request, $id, $venta_id)
    {
        try {
            $validated = $request->validate([
                'firma_digital_base64' => 'nullable|string',
                'fotos' => 'nullable|array',
                'fotos.*' => 'string',
                'observaciones' => 'nullable|string',
                // ✅ NUEVO: Contexto de entrega
                'tienda_abierta' => 'nullable|boolean',
                'cliente_presente' => 'nullable|boolean',
                'motivo_rechazo' => 'nullable|string|in:TIENDA_CERRADA,CLIENTE_AUSENTE,CLIENTE_RECHAZA,DIRECCION_INCORRECTA,CLIENTE_NO_IDENTIFICADO,OTRO',
                // ✅ FASE 1: Confirmación de Pago
                'estado_pago' => 'nullable|string|in:PAGADO,PARCIAL,NO_PAGADO',
                'monto_recibido' => 'nullable|numeric|min:0',
                'tipo_pago_id' => 'nullable|integer|exists:tipos_pago,id',
                'motivo_no_pago' => 'nullable|string|max:255',
                // ✅ FASE 2: Foto de comprobante
                'foto_comprobante' => 'nullable|string',
            ]);

            $entrega = Entrega::with('estadoEntrega')->findOrFail($id);
            $venta = Venta::with('estadoLogistica')
                ->where('entrega_id', $id)
                ->findOrFail($venta_id);

            // ✅ Validar que la entrega esté en estado permitido (EN_TRANSITO, EN_CAMINO, LLEGO)
            $estadosPermitidos = ['EN_CAMINO', 'EN_TRANSITO', 'LLEGO'];
            if (!$entrega->estadoEntrega || !in_array($entrega->estadoEntrega->codigo, $estadosPermitidos)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La entrega debe estar en tránsito para confirmar ventas',
                    'estado_actual' => $entrega->estadoEntrega?->codigo ?? $entrega->estado,
                ], 422);
            }

            // ✅ Obtener estado ENTREGADA para venta
            $estadoEntregada = EstadoLogistica::where('codigo', 'ENTREGADA')
                ->where('categoria', 'venta_logistica')
                ->firstOrFail();

            // ✅ Guardar firma y fotos
            $firmaUrl = null;
            if (!empty($validated['firma_digital_base64'])) {
                $firmaUrl = $this->guardarArchivoBase64($validated['firma_digital_base64'], 'firmas');
            }

            $fotosUrls = [];
            if (!empty($validated['fotos'])) {
                foreach ($validated['fotos'] as $foto) {
                    $fotoUrl = $this->guardarArchivoBase64($foto, 'entregas');
                    if ($fotoUrl) {
                        $fotosUrls[] = $fotoUrl;
                    }
                }
            }

            // ✅ FASE 2: Guardar foto de comprobante
            $fotoComprobanteUrl = null;
            if (!empty($validated['foto_comprobante'])) {
                $fotoComprobanteUrl = $this->guardarArchivoBase64(
                    $validated['foto_comprobante'],
                    'comprobantes'
                );
            }

            // ✅ CAMBIAR VENTA A ENTREGADA
            $venta->update([
                'estado_logistico_id' => $estadoEntregada->id,
            ]);

            // ✅ GUARDAR CONFIRMACIÓN EN TABLA SEPARADA
            $confirmacion = EntregaVentaConfirmacion::updateOrCreate(
                [
                    'entrega_id' => $id,
                    'venta_id' => $venta_id,
                ],
                [
                    'firma_digital_url' => $firmaUrl,
                    'fotos' => count($fotosUrls) > 0 ? $fotosUrls : null,
                    'observaciones' => $validated['observaciones'] ?? null,
                    'tienda_abierta' => $validated['tienda_abierta'] ?? null,
                    'cliente_presente' => $validated['cliente_presente'] ?? null,
                    'motivo_rechazo' => $validated['motivo_rechazo'] ?? null,
                    // ✅ FASE 1: Pago
                    'estado_pago' => $validated['estado_pago'] ?? null,
                    'monto_recibido' => $validated['monto_recibido'] ?? null,
                    'tipo_pago_id' => $validated['tipo_pago_id'] ?? null,
                    'motivo_no_pago' => $validated['motivo_no_pago'] ?? null,
                    // ✅ FASE 2: Foto de comprobante
                    'foto_comprobante' => $fotoComprobanteUrl,
                    'confirmado_por' => Auth::id(),
                    'confirmado_en' => now(),
                ]
            );

            // ✅ ACTUALIZAR ESTADO DE PAGO EN VENTA (si pagó)
            if (!empty($validated['estado_pago'])) {
                $estadoPago = $validated['estado_pago'];  // PAGADO, PARCIAL, NO_PAGADO
                $montoRecibido = $validated['monto_recibido'] ?? 0;

                // Calcular montos
                $montoTotal = $venta->total;
                $montoPendiente = $montoTotal - $montoRecibido;

                // Actualizar venta con información de pago
                $venta->update([
                    'estado_pago' => $estadoPago,
                    'monto_pagado' => $montoRecibido,
                    'monto_pendiente' => max(0, $montoPendiente),
                    'tipo_pago_id' => $validated['tipo_pago_id'] ?? null,
                ]);

                Log::info('✅ Venta actualizada con información de pago', [
                    'venta_id' => $venta_id,
                    'estado_pago' => $estadoPago,
                    'monto_recibido' => $montoRecibido,
                    'monto_pendiente' => $montoPendiente,
                ]);
            }

            Log::info('✅ Venta entregada y registrada', [
                'entrega_id' => $id,
                'venta_id' => $venta_id,
                'confirmacion_id' => $confirmacion->id,
                'fotos_guardadas' => count($fotosUrls),
            ]);

            // ✅ Recargar entrega con todas sus relaciones
            $entrega->refresh();
            $entrega->load([
                'ventas.estadoLogistica',
                'estadoEntrega',
                'chofer',
                'vehiculo',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Venta entregada correctamente',
                'data' => $entrega,  // ✅ Retornar Entrega completa
                'metadata' => [      // ✅ Metadatos de la confirmación
                    'venta_confirmada' => [
                        'venta_id' => $venta->id,
                        'venta_numero' => $venta->numero,
                        'confirmacion_id' => $confirmacion->id,
                    ],
                    'archivos' => [
                        'fotos_guardadas' => count($fotosUrls),
                        'firma_guardada' => $firmaUrl ? true : false,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error en confirmarVentaEntregada', [
                'entrega_id' => $id ?? null,
                'venta_id' => $venta_id ?? null,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar venta entregada',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/finalizar-entrega
     *
     * ✅ NUEVA FUNCIÓN: Finalizar entrega después de entregar todas las ventas
     *
     * El chofer hace clic aquí DESPUÉS de confirmar todas las ventas entregadas.
     * En este momento puede:
     * - Firmar documento de entrega
     * - Tomar foto final
     * - Contar dinero recolectado
     * - Registrar observaciones finales
     */
    public function finalizarEntrega(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'firma_digital_base64' => 'nullable|string',
                'fotos' => 'nullable|array',
                'fotos.*' => 'string',
                'observaciones' => 'nullable|string',
                'monto_recolectado' => 'nullable|numeric|min:0',  // ✅ Dinero recolectado
            ]);

            $entrega = Entrega::with('estadoEntrega', 'ventas.estadoLogistica')->findOrFail($id);

            // ✅ Validar que la entrega esté en estado permitido
            $estadosPermitidos = ['EN_CAMINO', 'EN_TRANSITO', 'LLEGO'];
            if (!$entrega->estadoEntrega || !in_array($entrega->estadoEntrega->codigo, $estadosPermitidos)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La entrega no está en estado para ser finalizada',
                    'estado_actual' => $entrega->estadoEntrega?->codigo ?? $entrega->estado,
                ], 422);
            }

            // ✅ Verificar que TODAS las ventas estén entregadas o canceladas
            $ventasNoCompletadas = $entrega->ventas()
                ->whereHas('estadoLogistica', function ($query) {
                    $query->where('categoria', 'venta_logistica')
                        ->whereNotIn('codigo', ['ENTREGADA', 'CANCELADA']);
                })
                ->count();

            if ($ventasNoCompletadas > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Hay {$ventasNoCompletadas} venta(s) aún no entregada(s)",
                    'ventas_pendientes' => $ventasNoCompletadas,
                ], 422);
            }

            // ✅ Obtener estados
            $estadoEntregado = EstadoLogistica::where('codigo', 'ENTREGADO')
                ->where('categoria', 'entrega')
                ->firstOrFail();

            // ✅ Guardar firma y fotos
            $firmaUrl = null;
            if (!empty($validated['firma_digital_base64'])) {
                $firmaUrl = $this->guardarArchivoBase64($validated['firma_digital_base64'], 'firmas');
            }

            $fotoUrl = null;
            if (!empty($validated['fotos'])) {
                $fotoUrl = $this->guardarArchivoBase64($validated['fotos'][0], 'entregas');
            }

            // ✅ Actualizar entrega (FINAL)
            $entrega->update([
                'estado' => Entrega::ESTADO_ENTREGADO,
                'estado_entrega_id' => $estadoEntregado->id,
                'fecha_entrega' => now(),
                'fecha_firma_entrega' => now(),
                'firma_digital_url' => $firmaUrl,
                'foto_entrega_url' => $fotoUrl,
                'observaciones' => $validated['observaciones'] ?? null,
                // ✅ Aquí podría guardar monto_recolectado si existe la columna
            ]);

            // ✅ Recargar entrega con todas sus relaciones
            $entrega->refresh();
            $entrega->load([
                'ventas.estadoLogistica',
                'estadoEntrega',
                'chofer',
                'vehiculo',
            ]);

            Log::info('✅ Entrega finalizada', [
                'entrega_id' => $id,
                'estado_nuevo' => $entrega->estado,
                'fecha_entrega' => $entrega->fecha_entrega,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Entrega finalizada correctamente',
                'data' => $entrega,  // ✅ Retornar Entrega completa
                'metadata' => [      // ✅ Metadatos de la finalización
                    'firma_guardada' => $firmaUrl ? true : false,
                    'foto_guardada' => $fotoUrl ? true : false,
                    'monto_recolectado' => $validated['monto_recolectado'] ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error al finalizar entrega', [
                'entrega_id' => $id,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al finalizar entrega',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/confirmar-entrega
     * Confirmar TODA la entrega (backward compatibility)
     */
    public function confirmarEntrega(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'firma_digital_base64' => 'nullable|string',
                'fotos' => 'nullable|array',
                'fotos.*' => 'string',
                'observaciones' => 'nullable|string',
            ]);

            $entrega = Entrega::findOrFail($id);

            if (!in_array($entrega->estado, [Entrega::ESTADO_LLEGO, Entrega::ESTADO_EN_CAMINO])) {
                return response()->json([
                    'success' => false,
                    'message' => 'La entrega debe estar en tránsito para ser entregada',
                ], 422);
            }

            // Guardar firma (en producción, esto iría a storage)
            $firmaUrl = null;
            if (!empty($validated['firma_digital_base64'])) {
                $firmaUrl = $this->guardarArchivoBase64($validated['firma_digital_base64'], 'firmas');
            }

            // Guardar fotos (en producción, esto iría a storage)
            $fotoUrl = null;
            if (!empty($validated['fotos'])) {
                $fotoUrl = $this->guardarArchivoBase64($validated['fotos'][0], 'entregas');
            }

            $entrega->update([
                'estado' => Entrega::ESTADO_ENTREGADO,
                'fecha_entrega' => now(),
                'fecha_firma_entrega' => now(),
                'firma_digital_url' => $firmaUrl,
                'foto_entrega_url' => $fotoUrl,
                'observaciones' => $validated['observaciones'] ?? null,
            ]);

            $entrega->cambiarEstado(
                Entrega::ESTADO_ENTREGADO,
                'Entrega confirmada' . ($fotoUrl ? ' con fotos' : '') . ($firmaUrl ? ' y firma digital' : ''),
                Auth::user()
            );

            $entregaFresh = $entrega->fresh();

            // Emitir evento de broadcast para notificar en tiempo real
            event(new EntregaConfirmada(
                $entregaFresh,
                $firmaUrl,
                $fotoUrl ? [$fotoUrl] : [],
                $validated['observaciones'] ?? null
            ));

            return response()->json([
                'success' => true,
                'message' => 'Entrega confirmada',
                'data' => $entregaFresh,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar entrega',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/reportar-novedad
     * Reportar novedad (problema) en la entrega
     */
    public function reportarNovedad(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'motivo' => 'required|string',
                'descripcion' => 'nullable|string',
                'foto' => 'nullable|string',
            ]);

            $entrega = Entrega::findOrFail($id);

            if ($entrega->estado === Entrega::ESTADO_ENTREGADO || $entrega->estado === Entrega::ESTADO_CANCELADA) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede reportar novedad en entregas finalizadas',
                ], 422);
            }

            $fotoUrl = null;
            if ($validated['foto'] ?? null) {
                $fotoUrl = $this->guardarArchivoBase64($validated['foto'], 'novedades');
            }

            $entrega->update([
                'estado' => Entrega::ESTADO_NOVEDAD,
                'motivo_novedad' => $validated['motivo'],
                'observaciones' => $validated['descripcion'] ?? null,
                'foto_entrega_url' => $fotoUrl,
            ]);

            $entrega->cambiarEstado(
                Entrega::ESTADO_NOVEDAD,
                "Novedad reportada: {$validated['motivo']}",
                Auth::user()
            );

            $entregaFresh = $entrega->fresh();

            // Emitir evento de broadcast para notificar en tiempo real
            event(new NovedadEntregaReportada(
                $entregaFresh,
                $validated['motivo'],
                $validated['descripcion'] ?? null,
                $fotoUrl
            ));

            return response()->json([
                'success' => true,
                'message' => 'Novedad reportada',
                'data' => $entregaFresh,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al reportar novedad',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/chofer/entregas/{id}/ubicacion
     * Registrar ubicación GPS del chofer
     */
    public function registrarUbicacion(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'latitud' => 'required|numeric|between:-90,90',
                'longitud' => 'required|numeric|between:-180,180',
                'velocidad' => 'nullable|numeric|min:0',
                'rumbo' => 'nullable|numeric|between:0,360',
                'altitud' => 'nullable|numeric',
                'precision' => 'nullable|numeric',
                'evento' => 'nullable|in:inicio_ruta,llegada,entrega',
            ]);

            $entrega = Entrega::findOrFail($id);

            // Verificar que el usuario tiene rol de chofer (verifica ambas variantes: chofer y Chofer)
            if (!Auth::user()->hasAnyRole(['chofer', 'Chofer'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene rol de chofer',
                ], 403);
            }

            // Actualizar o crear una sola ubicación por entrega
            $ubicacion = $entrega->ubicaciones()->updateOrCreate(
                [
                    'entrega_id' => $entrega->id,
                    'chofer_id' => Auth::user()->id,
                ],
                [
                    'latitud' => $validated['latitud'],
                    'longitud' => $validated['longitud'],
                    'velocidad' => $validated['velocidad'] ?? null,
                    'rumbo' => $validated['rumbo'] ?? null,
                    'altitud' => $validated['altitud'] ?? null,
                    'precision' => $validated['precision'] ?? null,
                    'timestamp' => now(),
                    'evento' => $validated['evento'] ?? null,
                ]
            );

            // Disparar evento de WebSocket en tiempo real
            try {
                event(new UbicacionActualizada(
                    $entrega->id,
                    $ubicacion->latitud,
                    $ubicacion->longitud,
                    $ubicacion->velocidad ?? 0,
                    $ubicacion->rumbo ?? 0,
                    $ubicacion->altitud ?? 0,
                    $ubicacion->precision ?? 0,
                    $ubicacion->timestamp->toIso8601String(),
                    Auth::user()->name ?? 'Desconocido',
                    $ubicacion->id
                ));
            } catch (\Exception $e) {
                Log::warning('Error broadcasting location update', ['error' => $e->getMessage()]);
                // No fallar si hay error en broadcast, la ubicación ya fue registrada
            }

            return response()->json([
                'success' => true,
                'message' => 'Ubicación registrada',
                'data' => $ubicacion,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar ubicación',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/chofer/historial
     * Obtener historial de entregas del chofer
     */
    public function historialEntregas(Request $request)
    {
        try {
            $user = Auth::user();

            // Obtener entregas completadas del chofer (user actual)
            // FK chofer_id en entregas apunta a users.id
            $entregas = Entrega::where('chofer_id', $user->id)
                ->where('estado', Entrega::ESTADO_ENTREGADO)
                ->with(['ventas.cliente', 'historialEstados'])
                ->latest('fecha_entrega')
                ->paginate($request->per_page ?? 15);

            return response()->json([
                'success' => true,
                'data' => $entregas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ENDPOINTS PARA CLIENTE
     */

    /**
     * GET /api/cliente/pedidos/{proformaId}/tracking
     * Obtener información de tracking de un pedido
     */
    public function obtenerTracking($proformaId)
    {
        try {
            $proforma = Proforma::with('cliente')->findOrFail($proformaId);

            // Verificar que el usuario sea cliente de la proforma
            if (Auth::user()->id !== $proforma->cliente->user_id && !Auth::user()->hasRole(['Admin', 'Manager'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 403);
            }

            $entrega = $proforma->entrega;

            if (!$entrega) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay entrega para este pedido',
                ], 404);
            }

            $ubicacionActual = $entrega->ultimaUbicacion();

            // Preparar datos del chofer
            $choferData = null;
            if ($entrega->chofer) {
                $choferData = [
                    'id' => $entrega->chofer->id,
                    'nombre' => $entrega->chofer->empleado?->nombre ?? $entrega->chofer->name,
                    'activo' => $entrega->chofer->activo,
                    'telefono' => $entrega->chofer->empleado?->telefono,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'entrega' => $entrega->only([
                        'id', 'estado', 'fecha_asignacion', 'fecha_inicio', 'fecha_llegada',
                        'fecha_entrega', 'observaciones', 'motivo_novedad',
                    ]),
                    'chofer' => $choferData,
                    'vehiculo' => $entrega->vehiculo ? $entrega->vehiculo->only([
                        'id', 'placa', 'marca', 'modelo',
                    ]) : null,
                    'ubicacion_actual' => $ubicacionActual ? $ubicacionActual->only([
                        'latitud', 'longitud', 'velocidad', 'timestamp',
                    ]) : null,
                    'ultimas_ubicaciones' => $entrega->ubicaciones()
                        ->latest('timestamp')
                        ->limit(50)
                        ->get()
                        ->only(['latitud', 'longitud', 'timestamp']),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tracking',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ENDPOINTS PARA ADMIN/ENCARGADO
     */

    /**
     * GET /api/admin/entregas
     * Listar todas las entregas con filtros
     */
    public function indexAdmin(Request $request)
    {
        try {
            $query = Entrega::with(['ventas.cliente', 'chofer', 'vehiculo'])
                ->when($request->estado, function ($q) use ($request) {
                    return $q->where('estado', $request->estado);
                })
                ->when($request->chofer_id, function ($q) use ($request) {
                    return $q->where('chofer_id', $request->chofer_id);
                })
                ->when($request->cliente_id, function ($q) use ($request) {
                    return $q->whereHas('ventas.cliente', function ($query) use ($request) {
                        $query->where('cliente_id', $request->cliente_id);
                    });
                });

            $entregas = $query->latest('fecha_asignacion')->paginate($request->per_page ?? 15);

            return response()->json([
                'success' => true,
                'data' => $entregas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar entregas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/admin/entregas/{id}/asignar
     * Asignar chofer y vehículo a una entrega
     */
    public function asignarEntrega(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'chofer_id' => 'required|exists:empleados,id',
                'vehiculo_id' => 'required|exists:vehiculos,id',
            ]);

            $entrega = Entrega::findOrFail($id);

            if ($entrega->estado !== Entrega::ESTADO_ASIGNADA) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden asignar entregas en estado ASIGNADA',
                ], 422);
            }

            $entrega->update([
                'chofer_id' => $validated['chofer_id'],
                'vehiculo_id' => $validated['vehiculo_id'],
                'fecha_asignacion' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Entrega asignada',
                'data' => $entrega->fresh()->load(['chofer', 'vehiculo']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar entrega',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/entregas/activas
     * Obtener entregas activas (en tránsito) con ubicación actual
     */
    public function entregasActivas()
    {
        try {
            $entregas = Entrega::whereIn('estado', [
                Entrega::ESTADO_EN_CAMINO,
                Entrega::ESTADO_LLEGO,
            ])
                ->with(['chofer.empleado', 'vehiculo', 'ubicaciones'])
                ->latest('fecha_inicio')
                ->get()
                ->map(function ($entrega) {
                    return [
                        'id' => $entrega->id,
                        'estado' => $entrega->estado,
                        'chofer' => $entrega->chofer,
                        'vehiculo' => $entrega->vehiculo,
                        'ubicacion_actual' => $entrega->ultimaUbicacion(),
                        'fecha_inicio' => $entrega->fecha_inicio,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $entregas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener entregas activas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/entregas/{id}/confirmar-carga
     * Confirmar carga de una entrega (cambiar a EN_CARGA)
     */
    public function confirmarCarga(int $id)
    {
        try {
            $entregaService = app(\App\Services\Logistica\EntregaService::class);
            $dto = $entregaService->confirmarCarga($id);

            return response()->json([
                'success' => true,
                'message' => 'Carga confirmada exitosamente',
                'data' => $dto,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error confirmando carga: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/entregas/{id}/listo-para-entrega
     * Marcar entrega como lista para partida (después de completar carga)
     */
    public function marcarListoParaEntrega(int $id)
    {
        try {
            $entregaService = app(\App\Services\Logistica\EntregaService::class);
            $dto = $entregaService->marcarListoParaEntrega($id);

            return response()->json([
                'success' => true,
                'message' => 'Entrega marcada como lista para partida',
                'data' => $dto,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error marcando como listo: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/entregas/{id}/iniciar-transito
     * Iniciar tránsito de entrega con coordenadas GPS
     */
    public function iniciarTransito(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'latitud' => 'required|numeric|between:-90,90',
                'longitud' => 'required|numeric|between:-180,180',
            ]);

            $entregaService = app(\App\Services\Logistica\EntregaService::class);
            $dto = $entregaService->iniciarTransito(
                $id,
                (float) $validated['latitud'],
                (float) $validated['longitud']
            );

            return response()->json([
                'success' => true,
                'message' => 'Tránsito iniciado exitosamente',
                'data' => $dto,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error iniciando tránsito: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * PATCH /api/entregas/{id}/ubicacion-gps
     * Actualizar ubicación GPS de una entrega en tránsito
     */
    public function actualizarUbicacionGPS(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'latitud' => 'required|numeric|between:-90,90',
                'longitud' => 'required|numeric|between:-180,180',
            ]);

            $entregaService = app(\App\Services\Logistica\EntregaService::class);
            $entregaService->actualizarUbicacionGPS(
                $id,
                (float) $validated['latitud'],
                (float) $validated['longitud']
            );

            return response()->json([
                'success' => true,
                'message' => 'Ubicación actualizada exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error actualizando ubicación: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════
     * FASE 4 - CONSOLIDACIÓN AUTOMÁTICA
     * ═════════════════════════════════════════════════════════════════
     */

    /**
     * POST /api/entregas/consolidar-automatico
     * Ejecutar consolidación automática de todas las ventas pendientes por zona
     *
     * No requiere parámetros en body
     * Retorna reporte detallado de entregas creadas y ventas pendientes
     */
    public function consolidarAutomatico()
    {
        try {
            $service = app(\App\Services\Logistica\ConsolidacionAutomaticaService::class);
            $reporte = $service->consolidarAutomatico();

            return response()->json($reporte);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en consolidación automática: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ═════════════════════════════════════════════════════════════════
     * FASE 3 - NUEVOS ENDPOINTS PARA ENTREGAS CONSOLIDADAS
     * ═════════════════════════════════════════════════════════════════
     */

    /**
     * POST /api/entregas/crear-consolidada
     * Crear una entrega consolidada con múltiples ventas
     *
     * Request body:
     * {
     *   "venta_ids": [1001, 1002, 1003],
     *   "vehiculo_id": 10,
     *   "chofer_id": 5,
     *   "zona_id": 3,
     *   "observaciones": "Entrega zona centro"
     * }
     */
    public function crearEntregaConsolidada(\Illuminate\Http\Request $request)
    {
        try {
            Log::info('📍 crearEntregaConsolidada request received', [
                'request_data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $validated = $request->validate([
                'venta_ids' => 'required|array|min:1',
                'venta_ids.*' => 'integer|exists:ventas,id',
                'vehiculo_id' => 'required|integer|exists:vehiculos,id',
                'chofer_id' => 'required|integer|exists:empleados,id',
                'zona_id' => 'nullable|integer|exists:localidades,id',
                'observaciones' => 'nullable|string|max:500',
            ]);

            Log::info('✅ Validation passed', ['validated' => $validated]);

            $service = app(\App\Services\Logistica\CrearEntregaPorLocalidadService::class);

            Log::info('🔧 Service instantiated, calling crearEntregaConsolidada...');

            $entrega = $service->crearEntregaConsolidada(
                ventaIds: $validated['venta_ids'],
                vehiculoId: $validated['vehiculo_id'],
                choferId: $validated['chofer_id'],
                zonaId: $validated['zona_id'],
                datos: [
                    'observaciones' => $validated['observaciones'] ?? null,
                    'usuario_id' => Auth::id(),
                ]
            );

            Log::info('✅ Service call successful', ['entrega_id' => $entrega->id ?? 'unknown']);

            // Cargar relaciones para la respuesta
            Log::info('📍 Loading relationships...', ['entrega_id' => $entrega->id]);
            $entrega->load(['vehiculo:id,placa', 'chofer:id,name']);  // FASE 3: chofer apunta a users, no empleados
            Log::info('✅ Relationships loaded');

            // Obtener ventas y sus clientes con query simple
            Log::info('📍 Fetching related sales...');
            $ventasCount = DB::table('entrega_venta')
                ->where('entrega_id', $entrega->id)
                ->count();

            Log::info('✅ Found sales', ['count' => $ventasCount]);

            $ventas = [];
            if ($ventasCount > 0) {
                $ventasQuery = DB::table('ventas')
                    ->join('entrega_venta', 'ventas.id', '=', 'entrega_venta.venta_id')
                    ->where('entrega_venta.entrega_id', $entrega->id)
                    ->select('ventas.id', 'ventas.numero', 'ventas.cliente_id', 'ventas.subtotal')
                    ->orderBy('entrega_venta.orden');

                Log::info('📍 Executing query:', ['query' => $ventasQuery->toSql()]);

                $ventasRaw = $ventasQuery->get();

                Log::info('✅ Query executed, mapping results...', ['raw_count' => $ventasRaw->count()]);

                $ventas = $ventasRaw->map(function ($venta) {
                    Log::info('📍 Processing venta', ['venta_id' => $venta->id, 'cliente_id' => $venta->cliente_id]);

                    try {
                        $cliente = \App\Models\Cliente::find($venta->cliente_id);
                        Log::info('✅ Cliente found', ['cliente_id' => $venta->cliente_id, 'cliente_nombre' => $cliente?->nombre]);
                    } catch (\Exception $e) {
                        Log::error('❌ Error finding cliente', [
                            'cliente_id' => $venta->cliente_id,
                            'error' => $e->getMessage(),
                        ]);
                        $cliente = null;
                    }

                    return [
                        'id' => $venta->id,
                        'numero' => $venta->numero,
                        'cliente' => $cliente?->nombre,
                        'subtotal' => $venta->subtotal,
                    ];
                })->all();

                Log::info('✅ Mapped all sales', ['count' => count($ventas)]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Entrega consolidada creada exitosamente',
                'data' => [
                    'id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'estado' => $entrega->estado,
                    'fecha_asignacion' => $entrega->fecha_asignacion,
                    'vehiculo' => [
                        'id' => $entrega->vehiculo?->id,
                        'placa' => $entrega->vehiculo?->placa,
                    ],
                    'chofer' => [
                        'id' => $entrega->chofer?->id,
                        'nombre' => $entrega->chofer?->user?->name,
                    ],
                    'ventas_count' => $ventasCount,
                    'ventas' => $ventas,
                    'peso_kg' => $entrega->peso_kg,
                    'volumen_m3' => $entrega->volumen_m3,
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('❌ Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            $errorDetails = [
                'exception_class' => get_class($e),
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ];

            Log::error('❌ Exception in crearEntregaConsolidada', $errorDetails);

            return response()->json([
                'success' => false,
                'message' => 'Error creando entrega consolidada',
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'debug' => [
                    'exception_class' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => explode("\n", $e->getTraceAsString()),
                ],
            ], 500);
        }
    }

    /**
     * POST /api/entregas/{id}/confirmar-venta/{venta_id}
     * Confirmar que una venta fue cargada en el vehículo
     *
     * Request body:
     * {
     *   "notas": "Confirmada sin problemas"
     * }
     */
    public function confirmarVentaCargada(\Illuminate\Http\Request $request, int $id, int $venta_id)
    {
        try {
            $entrega = Entrega::findOrFail($id);
            $venta = \App\Models\Venta::findOrFail($venta_id);

            // Validar que la venta pertenece a la entrega (buscar en ambas relaciones: nueva + legacy)
            $ventaEnEntrega = $entrega->ventas()->where('ventas.id', $venta_id)->exists()
                || $entrega->ventasLegacy()->where('ventas.id', $venta_id)->exists();

            if (!$ventaEnEntrega) {
                Log::warning('❌ [confirmarVentaCargada] Validación fallida', [
                    'entrega_id' => $id,
                    'venta_id' => $venta_id,
                    'ventas_en_relacion_nueva' => $entrega->ventas()->pluck('id')->toArray(),
                    'ventas_en_relacion_legacy' => $entrega->ventasLegacy()->pluck('id')->toArray(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'La venta no pertenece a esta entrega',
                ], 404);
            }

            $validated = $request->validate([
                'notas' => 'nullable|string|max:500',
            ]);

            $entrega->confirmarVentaCargada(
                $venta,
                Auth::user(),
                $validated['notas'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Venta confirmada como cargada',
                'data' => [
                    'entrega_id' => $entrega->id,
                    'venta_id' => $venta->id,
                    'confirmado_por' => Auth::user()->name,
                    'fecha_confirmacion' => now(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error confirmando venta: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/entregas/{id}/confirmar-venta/{venta_id}
     * Desmarcar una venta como cargada (remover confirmación)
     */
    public function desmarcarVentaCargada(int $id, int $venta_id)
    {
        try {
            $entrega = Entrega::findOrFail($id);
            $venta = \App\Models\Venta::findOrFail($venta_id);

            // Validar que la venta pertenece a la entrega (buscar en ambas relaciones: nueva + legacy)
            $ventaEnEntrega = $entrega->ventas()->where('ventas.id', $venta_id)->exists()
                || $entrega->ventasLegacy()->where('ventas.id', $venta_id)->exists();

            if (!$ventaEnEntrega) {
                Log::warning('❌ [desmarcarVentaCargada] Validación fallida', [
                    'entrega_id' => $id,
                    'venta_id' => $venta_id,
                    'ventas_en_relacion_nueva' => $entrega->ventas()->pluck('id')->toArray(),
                    'ventas_en_relacion_legacy' => $entrega->ventasLegacy()->pluck('id')->toArray(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'La venta no pertenece a esta entrega',
                ], 404);
            }

            $entrega->desmarcarVentaCargada($venta);

            return response()->json([
                'success' => true,
                'message' => 'Confirmación de venta removida',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error desmarcando venta: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/entregas/{id}/detalles
     * Obtener detalles de una entrega consolidada con todas sus ventas
     */
    public function obtenerDetalles(int $id)
    {
        try {
            $entrega = Entrega::with([
                'ventas' => function ($q) {
                    $q->with('cliente')->orderBy('entrega_venta.orden');
                },
                'vehiculo',
                'chofer',
            ])->findOrFail($id);

            $sincronizador = app(\App\Services\Logistica\SincronizacionVentaEntregaService::class);

            // Obtener detalles de entregas para cada venta
            $ventasDetalles = [];
            foreach ($entrega->ventas as $venta) {
                $detalles = $sincronizador->obtenerDetalleEntregas($venta);
                $ventasDetalles[] = [
                    'venta_id' => $venta->id,
                    'numero' => $venta->numero,
                    'cliente' => $venta->cliente->nombre,
                    'detalles' => $detalles,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'estado' => $entrega->estado,
                    'fecha_asignacion' => $entrega->fecha_asignacion,
                    'vehiculo' => [
                        'id' => $entrega->vehiculo->id,
                        'placa' => $entrega->vehiculo->placa,
                        'capacidad_kg' => $entrega->vehiculo->capacidad_kg,
                    ],
                    'chofer' => $entrega->chofer ? [
                        'id' => $entrega->chofer->id,
                        'nombre' => $entrega->chofer->empleado?->nombre ?? $entrega->chofer->name,
                    ] : null,
                    'peso_kg' => $entrega->peso_kg,
                    'volumen_m3' => $entrega->volumen_m3,
                    'porcentaje_utilizacion' => $entrega->obtenerPorcentajeUtilizacion(),
                    'ventas' => $ventasDetalles,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo detalles: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/entregas/{id}/progreso
     * Obtener progreso de confirmación de carga de una entrega
     */
    public function obtenerProgreso(int $id)
    {
        try {
            $entrega = Entrega::findOrFail($id);

            $progreso = $entrega->obtenerProgresoConfirmacion();

            return response()->json([
                'success' => true,
                'data' => [
                    'entrega_id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'estado' => $entrega->estado,
                    'confirmadas' => $progreso['confirmadas'],
                    'total' => $progreso['total'],
                    'pendientes' => $progreso['pendientes'],
                    'porcentaje' => $progreso['porcentaje'],
                    'completado' => $progreso['completado'],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo progreso: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Métodos auxiliares
     */

    /**
     * Guardar archivo desde base64
     */
    private function guardarArchivoBase64(string $base64, string $carpeta): string
    {
        // Por ahora retornamos una URL placeholder
        // En producción, esto guardaría en S3 o storage local
        return "placeholder://{$carpeta}/" . uniqid() . '.jpg';
    }
}
