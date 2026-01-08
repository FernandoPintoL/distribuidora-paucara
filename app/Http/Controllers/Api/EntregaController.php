<?php

namespace App\Http\Controllers\Api;

use App\Events\UbicacionActualizada;
use App\Events\MarcarLlegadaConfirmada;
use App\Events\EntregaConfirmada;
use App\Events\NovedadEntregaReportada;
use App\Http\Controllers\Controller;
use App\Models\Entrega;
use App\Models\Proforma;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;

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

            // Verificar que sea chofer (mediante Empleado)
            if (!$user->empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene perfil de chofer',
                ], 404);
            }

            $chofer = $user->empleado;
            $perPage = $request->per_page ?? 15;
            $page = $request->page ?? 1;
            $estado = $request->estado;

            // Obtener entregas asignadas al chofer
            $entregas = $chofer->entregas()
                ->with(['ventas.cliente', 'vehiculo'])
                ->when($estado, function ($q) use ($estado) {
                    return $q->where('estado', $estado);
                })
                ->get()
                ->map(function ($entrega) {
                    $primeraVenta = $entrega->ventas?->first();
                    return [
                        'id' => $entrega->id,
                        'type' => 'entrega',  // Tipo para identificar en app
                        'numero' => $primeraVenta?->numero ?? 'N/A',
                        'cliente' => $primeraVenta?->cliente?->nombre ?? 'N/A',
                        'estado' => $entrega->estado,
                        'fecha_asignacion' => $entrega->fecha_asignacion,
                        'fecha_entrega' => $entrega->fecha_entrega,
                        'direccion' => $primeraVenta?->direccion ?? 'N/A',
                        'observaciones' => $entrega->observaciones,
                        'data' => $entrega,
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
            $chofer = Auth::user()->empleado;

            if (!$chofer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene perfil de chofer',
                ], 404);
            }

            $entregas = $chofer->entregas()
                ->with(['ventas.cliente', 'vehiculo'])
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
            $entrega = Entrega::with([
                'ventas.cliente',
                'ventas.detalles.producto',
                'chofer.user',
                'vehiculo',
                'reportes',
                'ubicaciones',
                'historialEstados',
            ])->findOrFail($id);

            // Verificar autorización
            $chofer = Auth::user()->empleado;
            if ($chofer && $entrega->chofer_id !== $chofer->id && !Auth::user()->hasRole(['admin', 'encargado'])) {
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
     * Marcar entrega como EN_CAMINO
     */
    public function iniciarRuta($id)
    {
        try {
            $entrega = Entrega::findOrFail($id);

            if ($entrega->estado !== Entrega::ESTADO_ASIGNADA) {
                return response()->json([
                    'success' => false,
                    'message' => 'La entrega debe estar en estado ASIGNADA',
                ], 422);
            }

            $entrega->cambiarEstado(
                Entrega::ESTADO_EN_CAMINO,
                'Chofer inició la ruta',
                Auth::user()
            );

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
    public function confirmarEntrega(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'firma_digital_base64' => 'required|string',
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
            if ($validated['firma_digital_base64']) {
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
                'Entrega confirmada con firma y fotos',
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

            // Verificar que el usuario tiene perfil de empleado/chofer
            if (!Auth::user()->empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene perfil de chofer',
                ], 404);
            }

            $ubicacion = $entrega->ubicaciones()->create([
                'chofer_id' => Auth::user()->empleado->id,
                'latitud' => $validated['latitud'],
                'longitud' => $validated['longitud'],
                'velocidad' => $validated['velocidad'] ?? null,
                'rumbo' => $validated['rumbo'] ?? null,
                'altitud' => $validated['altitud'] ?? null,
                'precision' => $validated['precision'] ?? null,
                'timestamp' => now(),
                'evento' => $validated['evento'] ?? null,
            ]);

            // Disparar evento de WebSocket en tiempo real
            UbicacionActualizada::dispatch($ubicacion);

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
            $chofer = Auth::user()->empleado;

            if (!$chofer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene perfil de chofer',
                ], 404);
            }

            $entregas = $chofer->entregas()
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
            if (Auth::user()->id !== $proforma->cliente->user_id && !Auth::user()->hasRole(['admin', 'encargado'])) {
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

            return response()->json([
                'success' => true,
                'data' => [
                    'entrega' => $entrega->only([
                        'id', 'estado', 'fecha_asignacion', 'fecha_inicio', 'fecha_llegada',
                        'fecha_entrega', 'observaciones', 'motivo_novedad',
                    ]),
                    'chofer' => $entrega->chofer ? $entrega->chofer->load('user')->only([
                        'id', 'telefono', 'activo', 'user.nombre', 'user.apellidos',
                    ]) : null,
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
                ->with(['chofer', 'vehiculo', 'ubicaciones'])
                ->latest('fecha_inicio')
                ->get()
                ->map(function ($entrega) {
                    return [
                        'id' => $entrega->id,
                        'estado' => $entrega->estado,
                        'chofer' => $entrega->chofer->load('user'),
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
            \Log::info('📍 crearEntregaConsolidada request received', [
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

            \Log::info('✅ Validation passed', ['validated' => $validated]);

            $service = app(\App\Services\Logistica\CrearEntregaPorLocalidadService::class);

            \Log::info('🔧 Service instantiated, calling crearEntregaConsolidada...');

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

            \Log::info('✅ Service call successful', ['entrega_id' => $entrega->id ?? 'unknown']);

            // Cargar relaciones para la respuesta
            \Log::info('📍 Loading relationships...', ['entrega_id' => $entrega->id]);
            $entrega->load(['vehiculo:id,placa', 'chofer.user:id,name']);
            \Log::info('✅ Relationships loaded');

            // Obtener ventas y sus clientes con query simple
            \Log::info('📍 Fetching related sales...');
            $ventasCount = DB::table('entrega_venta')
                ->where('entrega_id', $entrega->id)
                ->count();

            \Log::info('✅ Found sales', ['count' => $ventasCount]);

            $ventas = [];
            if ($ventasCount > 0) {
                $ventasQuery = DB::table('ventas')
                    ->join('entrega_venta', 'ventas.id', '=', 'entrega_venta.venta_id')
                    ->where('entrega_venta.entrega_id', $entrega->id)
                    ->select('ventas.id', 'ventas.numero', 'ventas.cliente_id', 'ventas.total')
                    ->orderBy('entrega_venta.orden');

                \Log::info('📍 Executing query:', ['query' => $ventasQuery->toSql()]);

                $ventasRaw = $ventasQuery->get();

                \Log::info('✅ Query executed, mapping results...', ['raw_count' => $ventasRaw->count()]);

                $ventas = $ventasRaw->map(function ($venta) {
                    \Log::info('📍 Processing venta', ['venta_id' => $venta->id, 'cliente_id' => $venta->cliente_id]);

                    try {
                        $cliente = \App\Models\Cliente::find($venta->cliente_id);
                        \Log::info('✅ Cliente found', ['cliente_id' => $venta->cliente_id, 'cliente_nombre' => $cliente?->nombre]);
                    } catch (\Exception $e) {
                        \Log::error('❌ Error finding cliente', [
                            'cliente_id' => $venta->cliente_id,
                            'error' => $e->getMessage(),
                        ]);
                        $cliente = null;
                    }

                    return [
                        'id' => $venta->id,
                        'numero' => $venta->numero,
                        'cliente' => $cliente?->nombre,
                        'total' => $venta->total,
                    ];
                })->all();

                \Log::info('✅ Mapped all sales', ['count' => count($ventas)]);
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
            \Log::warning('❌ Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('❌ Exception in crearEntregaConsolidada', [
                'exception_class' => get_class($e),
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error creando entrega consolidada: ' . $e->getMessage(),
                'error_code' => $e->getCode(),
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

            // Validar que la venta pertenece a la entrega
            if (!$entrega->ventas()->where('ventas.id', $venta_id)->exists()) {
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

            // Validar que la venta pertenece a la entrega
            if (!$entrega->ventas()->where('ventas.id', $venta_id)->exists()) {
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
                    'chofer' => [
                        'id' => $entrega->chofer->id,
                        'nombre' => $entrega->chofer->nombre,
                    ],
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
