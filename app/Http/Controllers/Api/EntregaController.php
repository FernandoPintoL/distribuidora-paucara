<?php

namespace App\Http\Controllers\Api;

use App\Events\UbicacionActualizada;
use App\Http\Controllers\Controller;
use App\Models\Entrega;
use App\Models\Proforma;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EntregaController extends Controller
{
    /**
     * ENDPOINTS PARA CHOFER
     */

    /**
     * GET /api/chofer/entregas
     * Obtener entregas asignadas al chofer autenticado
     */
    public function entregasAsignadas(Request $request)
    {
        try {
            $chofer = Auth::user()->chofer;

            if (!$chofer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene perfil de chofer',
                ], 404);
            }

            $entregas = $chofer->entregas()
                ->with(['proforma', 'vehiculo', 'direccionCliente'])
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
                'proforma',
                'proforma.cliente',
                'proforma.detalles',
                'chofer',
                'vehiculo',
                'direccionCliente',
                'ubicaciones',
                'historialEstados',
            ])->findOrFail($id);

            // Verificar autorización
            $chofer = Auth::user()->chofer;
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
    public function marcarLlegada($id)
    {
        try {
            $entrega = Entrega::findOrFail($id);

            if ($entrega->estado !== Entrega::ESTADO_EN_CAMINO) {
                return response()->json([
                    'success' => false,
                    'message' => 'La entrega debe estar EN_CAMINO',
                ], 422);
            }

            $entrega->update([
                'estado' => Entrega::ESTADO_LLEGO,
                'fecha_llegada' => now(),
            ]);

            $entrega->cambiarEstado(
                Entrega::ESTADO_LLEGO,
                'Chofer llegó al destino',
                Auth::user()
            );

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

            return response()->json([
                'success' => true,
                'message' => 'Entrega confirmada',
                'data' => $entrega->fresh(),
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

            return response()->json([
                'success' => true,
                'message' => 'Novedad reportada',
                'data' => $entrega->fresh(),
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

            $ubicacion = $entrega->ubicaciones()->create([
                'chofer_id' => Auth::user()->chofer->id,
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
            $chofer = Auth::user()->chofer;

            if (!$chofer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene perfil de chofer',
                ], 404);
            }

            $entregas = $chofer->entregas()
                ->where('estado', Entrega::ESTADO_ENTREGADO)
                ->with(['proforma', 'historialEstados'])
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
            $query = Entrega::with(['proforma', 'chofer', 'vehiculo'])
                ->when($request->estado, function ($q) use ($request) {
                    return $q->where('estado', $request->estado);
                })
                ->when($request->chofer_id, function ($q) use ($request) {
                    return $q->where('chofer_id', $request->chofer_id);
                })
                ->when($request->cliente_id, function ($q) use ($request) {
                    return $q->whereHas('proforma', function ($query) use ($request) {
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
                'chofer_id' => 'required|exists:choferes_legacy,id',
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
