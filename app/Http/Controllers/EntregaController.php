<?php
namespace App\Http\Controllers;

use App\Exceptions\Venta\EstadoInvalidoException;
use App\Http\Traits\ApiInertiaUnifiedResponse;
use App\Models\Empleado;
use App\Models\Vehiculo;
use App\Services\Logistica\EntregaService;
use App\Services\Logistica\TrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * EntregaController - REFACTORIZADO (THIN Controller Pattern)
 *
 * Responsabilidades:
 * ✓ Manejo de HTTP
 * ✓ Autenticación/Autorización (middleware)
 * ✓ Adaptación de respuestas
 *
 * Delegadas a EntregaService:
 * ✗ Cambios de estado
 * ✗ Asignación de recursos
 * ✗ Confirmación de entregas
 */
class EntregaController extends Controller
{
    use ApiInertiaUnifiedResponse;

    public function __construct(
        private EntregaService $entregaService,
        private TrackingService $trackingService,
    ) {
        $this->middleware('permission:entregas.index')->only('index');
        $this->middleware('permission:entregas.show')->only('show');
        $this->middleware('permission:entregas.create')->only(['create', 'store']);
        $this->middleware('permission:entregas.manage')->only('asignarChoferVehiculo');
    }

    /**
     * Listar entregas
     */
    public function index(Request $request): InertiaResponse
    {
        $perPage = $request->input('per_page', 15);

        $filtros = [
            'estado'      => $request->input('estado'),
            'fecha_desde' => $request->input('fecha_desde'),
            'fecha_hasta' => $request->input('fecha_hasta'),
            'search'      => $request->input('search'),
        ];

        $entregas = \App\Models\Entrega::query()
            ->with(['venta.cliente', 'proforma.cliente', 'vehiculo', 'chofer'])
            ->when($filtros['estado'], fn($q, $estado) => $q->where('estado', $estado))
            ->when($filtros['fecha_desde'], fn($q, $fecha) => $q->whereDate('fecha_programada', '>=', $fecha))
            ->when($filtros['fecha_hasta'], fn($q, $fecha) => $q->whereDate('fecha_programada', '<=', $fecha))
            ->when($filtros['search'], function ($q, $search) {
                $q->whereHas('venta.cliente', fn($q) => $q->where('nombre', 'like', "%{$search}%"))
                    ->orWhereHas('proforma.cliente', fn($q) => $q->where('nombre', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate($perPage);

        // Cargar vehículos y choferes para optimización
        $vehiculos = Vehiculo::disponibles()->get(['id', 'placa', 'marca', 'modelo', 'capacidad_kg']);
        $choferes  = Empleado::where('estado', 'activo')->get();

        return Inertia::render('logistica/entregas/index', [
            'entregas'  => $entregas,
            'filtros'   => $filtros,
            'vehiculos' => $vehiculos,
            'choferes'  => $choferes,
        ]);
    }

    /**
     * Mostrar formulario de creación
     */
    public function create(): InertiaResponse
    {
        // DEBUG: Contar ventas disponibles
        $totalVentas       = \App\Models\Venta::count();
        $ventasSinEntregas = \App\Models\Venta::whereDoesntHave('entregas')->count();
        Log::info("DEBUG Entregas Create - Total ventas: {$totalVentas}, Sin entregas: {$ventasSinEntregas}");

        // Obtener ventas sin entrega asignada (sin filtro de estado por ahora para testing)
        // Pueden filtrarse manualmente las ventas que requieren entrega
        $ventas = \App\Models\Venta::query()
            ->with(['cliente', 'estadoDocumento'])
            ->whereDoesntHave('entregas')
        // Temporalmente comentado para permitir todas las ventas sin entrega
        // ->whereHas('estadoDocumento', function($q) {
        //     $q->whereIn('nombre', ['CONFIRMADO', 'CONFIRMADA', 'APROBADO', 'APROBADA']);
        // })
            ->latest()
            ->get()
            ->map(function ($venta) {
                return [
                    'id'           => $venta->id,
                    'numero_venta' => $venta->numero ?? "V-{$venta->id}",
                    'numero'      => $venta->numero,
                    'total'       => (float) $venta->total,
                    'fecha_venta' => $venta->fecha?->format('Y-m-d'),
                    'fecha'       => $venta->fecha?->format('Y-m-d'),
                    'estado'      => $venta->estadoDocumento?->nombre ?? 'Sin estado',
                    'cliente'     => [
                        'id'       => $venta->cliente?->id,
                        'nombre'   => $venta->cliente?->nombre ?? 'Cliente no disponible',
                        'telefono' => $venta->cliente?->telefono,
                    ],
                ];
            });

        Log::info("DEBUG Entregas Create - Ventas encontradas: " . $ventas->count());

        // Obtener vehículos disponibles
        $vehiculos = Vehiculo::disponibles()
            ->get()
            ->map(fn($v) => [
                'id'              => $v->id,
                'placa'           => $v->placa,
                'marca'           => $v->marca,
                'modelo'          => $v->modelo,
                'capacidad_carga' => $v->capacidad_kg,
                'capacidad_kg'    => $v->capacidad_kg,
            ]);

        // Obtener choferes activos con licencia vigente
        $totalEmpleados       = Empleado::where('estado', 'activo')->count();
        $empleadosConLicencia = Empleado::whereNotNull('licencia')->count();
        Log::info("DEBUG Entregas Create - Empleados activos: {$totalEmpleados}, Con licencia: {$empleadosConLicencia}");

        // Obtener empleados activos (relajar requisito de licencia temporalmente)
        // En producción, descomentar validación de licencia
        $empleadosQuery = Empleado::query()
            ->with('user')
            ->where('estado', 'activo')
            ->get();

        Log::info("DEBUG - Empleados antes de filtrar: " . $empleadosQuery->count());
        Log::info("DEBUG - Empleados sin user: " . $empleadosQuery->filter(fn($e) => $e->user === null)->count());

        $choferes = $empleadosQuery
            ->filter(fn($e) => $e->user !== null) // Asegurar que tengan usuario asociado
            ->map(fn($e) => [
                'id'             => $e->id,
                'name'           => $e->user->name ?? $e->nombre,
                'nombre'         => $e->user->name ?? $e->nombre,
                'email'          => $e->user->email ?? $e->email,
                'tiene_licencia' => $e->licencia ? true : false,
            ])
            ->values();

        Log::info("DEBUG Entregas Create - Choferes encontrados: " . $choferes->count());
        Log::info("DEBUG - Choferes data: " . json_encode($choferes->take(2)));

        return Inertia::render('logistica/entregas/create', [
            'ventas'    => $ventas,
            'vehiculos' => $vehiculos,
            'choferes'  => $choferes,
        ]);
    }

    /**
     * Crear nueva entrega
     */
    public function store(Request $request): JsonResponse | RedirectResponse
    {
        try {
            $validated = $request->validate([
                'venta_id'          => 'required|exists:ventas,id',
                'vehiculo_id'       => 'required|exists:vehiculos,id',
                'chofer_id'         => 'required|exists:empleados,id',
                'fecha_programada'  => 'required|date|after:now',
                'direccion_entrega' => 'required|string|max:500',
                'peso_kg'           => 'required|numeric|min:0.01|max:50000',
                'observaciones'     => 'nullable|string|max:1000',
            ]);

            // Validar que el peso no exceda la capacidad del vehículo
            $vehiculo = Vehiculo::findOrFail($validated['vehiculo_id']);
            if ($validated['peso_kg'] > $vehiculo->capacidad_kg) {
                return $this->respondError(
                    "El peso ({$validated['peso_kg']} kg) excede la capacidad del vehículo ({$vehiculo->capacidad_kg} kg)",
                    statusCode: 422
                );
            }

            // Crear entrega
            $entrega = \App\Models\Entrega::create([
                'venta_id'          => $validated['venta_id'],
                'vehiculo_id'       => $validated['vehiculo_id'],
                'chofer_id'         => $validated['chofer_id'],
                'fecha_programada'  => $validated['fecha_programada'],
                'direccion_entrega' => $validated['direccion_entrega'],
                'peso_kg'           => $validated['peso_kg'],
                'observaciones'     => $validated['observaciones'] ?? null,
                'estado'            => 'PROGRAMADO',
            ]);

            return $this->respondSuccess(
                data: $entrega,
                message: 'Entrega creada exitosamente',
                redirectTo: route('logistica.entregas.show', $entrega->id),
            );

        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->respondError('Error de validación', statusCode: 422, errors: $e->errors());

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Mostrar detalle de entrega
     */
    public function show(int $id): JsonResponse | InertiaResponse
    {
        try {
            $entregaDTO = $this->entregaService->obtener($id);

            return $this->respondShow(
                data: $entregaDTO,
                inertiaComponent: 'Entregas/Show',
            );

        } catch (\Exception $e) {
            return $this->respondNotFound('Entrega no encontrada');
        }
    }

    /**
     * Asignar chofer y vehículo a entrega
     *
     * POST /entregas/{id}/asignar
     */
    public function asignarChoferVehiculo(Request $request, int $id): JsonResponse | RedirectResponse
    {
        try {
            $choferId   = $request->input('chofer_id');
            $vehiculoId = $request->input('vehiculo_id');

            if (! $choferId || ! $vehiculoId) {
                throw new \InvalidArgumentException('Chofer y vehículo son requeridos');
            }

            $entregaDTO = $this->entregaService->asignarChoferVehiculo(
                $id,
                (int) $choferId,
                (int) $vehiculoId,
            );

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Entrega asignada exitosamente',
                redirectTo: route('entregas.show', $id),
            );

        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Iniciar entrega (marcar como EN_CAMINO)
     *
     * POST /entregas/{id}/iniciar
     */
    public function iniciar(int $id): JsonResponse | RedirectResponse
    {
        try {
            $entregaDTO = $this->entregaService->iniciarEntrega($id);

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Entrega iniciada',
                redirectTo: route('entregas.show', $id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Confirmar entrega (éxito)
     *
     * POST /entregas/{id}/confirmar
     *
     * Body:
     * {
     *   "firma": "base64_string",
     *   "fotos": ["url1", "url2"]
     * }
     */
    public function confirmar(Request $request, int $id): JsonResponse | RedirectResponse
    {
        try {
            $firma = $request->input('firma');
            $fotos = $request->input('fotos', []);

            $entregaDTO = $this->entregaService->confirmar($id, $firma, $fotos);

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Entrega confirmada exitosamente',
                redirectTo: route('entregas.show', $id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Rechazar entrega (fallo)
     *
     * POST /entregas/{id}/rechazar
     *
     * Body:
     * {
     *   "razon": "Cliente rechazó"
     * }
     */
    public function rechazar(Request $request, int $id): JsonResponse | RedirectResponse
    {
        try {
            $razon = $request->input('razon', '');

            if (! $razon) {
                throw new \InvalidArgumentException('Motivo del rechazo es requerido');
            }

            $entregaDTO = $this->entregaService->rechazar($id, $razon);

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Entrega rechazada',
                redirectTo: route('entregas.show', $id),
            );

        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Registrar ubicación actual (tracking GPS)
     *
     * POST /logistica/entregas/{id}/ubicacion
     *
     * Body:
     * {
     *   "latitud": -34.123,
     *   "longitud": -58.456,
     *   "velocidad": 45.5,           (opcional)
     *   "rumbo": 90.0,               (opcional)
     *   "altitud": 100.5,            (opcional)
     *   "precision": 5.0,            (opcional)
     *   "evento": "tracking"         (opcional: tracking, inicio_ruta, llegada, entrega)
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Ubicación registrada",
     *   "data": {
     *     "id": 123,
     *     "entrega_id": 1,
     *     "chofer_id": 5,
     *     "latitud": -34.123,
     *     "longitud": -58.456,
     *     "velocidad": 45.5,
     *     "timestamp": "2024-12-22T14:30:00Z"
     *   }
     * }
     */
    public function registrarUbicacion(Request $request, int $id): JsonResponse
    {
        try {
            // Validar datos de entrada
            $validated = $request->validate([
                'latitud'   => 'required|numeric|min:-90|max:90',
                'longitud'  => 'required|numeric|min:-180|max:180',
                'velocidad' => 'nullable|numeric|min:0',
                'rumbo'     => 'nullable|numeric|min:0|max:360',
                'altitud'   => 'nullable|numeric',
                'precision' => 'nullable|numeric|min:0',
                'evento'    => 'nullable|in:tracking,inicio_ruta,llegada,entrega',
            ]);

            // Registrar ubicación usando TrackingService
            $ubicacion = $this->trackingService->registrarUbicacion(
                $id,
                (float) $validated['latitud'],
                (float) $validated['longitud'],
                isset($validated['velocidad']) ? (float) $validated['velocidad'] : null,
                isset($validated['rumbo']) ? (float) $validated['rumbo'] : null,
                isset($validated['altitud']) ? (float) $validated['altitud'] : null,
                isset($validated['precision']) ? (float) $validated['precision'] : null,
                $validated['evento'] ?? 'tracking'
            );

            return response()->json([
                'success' => true,
                'message' => 'Ubicación registrada exitosamente',
                'data'    => $ubicacion,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error registrando ubicación', [
                'entrega_id' => $id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar ubicación',
            ], 500);
        }
    }

    /**
     * Obtener historial de ubicaciones de una entrega
     *
     * GET /logistica/entregas/{id}/ubicaciones?limite=100
     *
     * Response:
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 1,
     *       "entrega_id": 1,
     *       "latitud": -34.123,
     *       "longitud": -58.456,
     *       "velocidad": 45.5,
     *       "rumbo": 90.0,
     *       "altitud": 100.0,
     *       "precision": 5.0,
     *       "timestamp": "2024-12-22T14:30:00Z"
     *     }
     *   ],
     *   "total": 150,
     *   "distancia_recorrida_km": 12.5,
     *   "tiempo_total_minutos": 25
     * }
     */
    public function obtenerUbicaciones(Request $request, int $id): JsonResponse
    {
        try {
            $limite = $request->input('limite', 100);
            $limite = min(intval($limite), 500); // Máximo 500 registros

            // Obtener historial de ubicaciones
            $ubicaciones = $this->trackingService->obtenerHistorial($id, $limite);

            // Obtener métricas adicionales
            $distanciaRecorrida = $this->trackingService->obtenerDistanciaRecorrida($id);
            $tiempoTotal = $this->trackingService->obtenerTiempoPromedio($id);

            return response()->json([
                'success'                  => true,
                'data'                     => $ubicaciones,
                'total'                    => $ubicaciones->count(),
                'distancia_recorrida_km'   => $distanciaRecorrida,
                'tiempo_total_minutos'     => $tiempoTotal,
            ]);

        } catch (\Exception $e) {
            Log::error('Error obteniendo ubicaciones de entrega', [
                'entrega_id' => $id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ubicaciones',
            ], 500);
        }
    }

    /**
     * Optimizar asignación masiva de entregas
     *
     * POST /logistica/entregas/optimizar
     * Body: { "entrega_ids": [1, 2, 3, ...], "capacidad_vehiculo": 1000 }
     */
    public function optimizarRutas(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'entrega_ids'        => 'required|array|min:1',
                'entrega_ids.*'      => 'integer|exists:entregas,id',
                'capacidad_vehiculo' => 'nullable|numeric|min:1',
            ]);

            $capacidadVehiculo = $validated['capacidad_vehiculo'] ?? 1000;

            $resultado = $this->entregaService->optimizarAsignacionMasiva(
                $validated['entrega_ids'],
                $capacidadVehiculo
            );

            return response()->json([
                'success' => true,
                'message' => 'Rutas optimizadas exitosamente',
                'data'    => $resultado,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al optimizar rutas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Registrar llegada del chofer
     *
     * POST /logistica/entregas/{id}/llego
     */
    public function registrarLlegada(int $id): JsonResponse | RedirectResponse
    {
        try {
            $entregaDTO = $this->entregaService->registrarLlegada($id);

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Llegada registrada exitosamente',
            );

        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError('Error al registrar llegada: ' . $e->getMessage());
        }
    }

    /**
     * Reportar novedad en entrega
     *
     * POST /logistica/entregas/{id}/novedad
     * Body: { "motivo_novedad": "...", "devolver_stock": false }
     */
    public function reportarNovedad(Request $request, int $id): JsonResponse | RedirectResponse
    {
        try {
            $validated = $request->validate([
                'motivo_novedad' => 'required|string|max:1000',
                'devolver_stock' => 'nullable|boolean',
            ]);

            $entregaDTO = $this->entregaService->reportarNovedad(
                $id,
                $validated['motivo_novedad'],
                $validated['devolver_stock'] ?? false
            );

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Novedad reportada exitosamente',
            );

        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError('Error al reportar novedad: ' . $e->getMessage());
        }
    }

    /**
     * Obtener estadísticas del dashboard de entregas
     *
     * GET /api/logistica/entregas/dashboard-stats
     */
    public function dashboardStats(): JsonResponse
    {
        try {
            // Obtener todas las entregas con relaciones necesarias
            $entregas = \App\Models\Entrega::with([
                'venta.cliente',
                'chofer.user',
                'vehiculo',
                'proforma.cliente'
            ])->get();

            // 1. CONTAR POR ESTADO
            $estados = [
                'PROGRAMADO' => $entregas->where('estado', 'PROGRAMADO')->count(),
                'ASIGNADA' => $entregas->where('estado', 'ASIGNADA')->count(),
                'EN_CAMINO' => $entregas->where('estado', 'EN_CAMINO')->count(),
                'LLEGO' => $entregas->where('estado', 'LLEGO')->count(),
                'ENTREGADO' => $entregas->where('estado', 'ENTREGADO')->count(),
                'NOVEDAD' => $entregas->where('estado', 'NOVEDAD')->count(),
                'CANCELADA' => $entregas->where('estado', 'CANCELADA')->count(),
            ];

            // 2. ENTREGAS POR ZONA (vía Venta -> Cliente -> Zona si existe)
            // Para esta fase, agruparemos por zona del cliente
            $porZona = $entregas
                ->groupBy(function ($entrega) {
                    // Obtener zona del cliente asociado a la venta
                    $cliente = $entrega->venta?->cliente ?? $entrega->proforma?->cliente;
                    if ($cliente && $cliente->zona_id) {
                        return $cliente->zona_id;
                    }
                    return 'Sin zona';
                })
                ->map(function ($grupo, $zonaId) {
                    $total = $grupo->count();
                    $completadas = $grupo->whereIn('estado', ['ENTREGADO'])->count();

                    // Calcular tiempo promedio de entrega en minutos
                    $tiempoPromedio = 0;
                    $entregasConTiempo = $grupo->filter(function ($e) {
                        return $e->fecha_inicio && $e->fecha_entrega;
                    });

                    if ($entregasConTiempo->count() > 0) {
                        $tiempoTotal = $entregasConTiempo->sum(function ($e) {
                            return $e->fecha_entrega->diffInMinutes($e->fecha_inicio);
                        });
                        $tiempoPromedio = (int) ($tiempoTotal / $entregasConTiempo->count());
                    }

                    $nombreZona = 'Sin zona';
                    if ($zonaId !== 'Sin zona') {
                        $zona = \App\Models\Zona::find($zonaId);
                        $nombreZona = $zona?->nombre ?? "Zona {$zonaId}";
                    }

                    return [
                        'zona_id' => $zonaId === 'Sin zona' ? null : $zonaId,
                        'nombre' => $nombreZona,
                        'total' => $total,
                        'completadas' => $completadas,
                        'porcentaje' => $total > 0 ? round(($completadas / $total) * 100, 2) : 0,
                        'tiempo_promedio_minutos' => $tiempoPromedio,
                    ];
                })
                ->sortByDesc('total')
                ->values();

            // 3. TOP 5 CHOFERES
            $topChoferes = $entregas
                ->groupBy('chofer_id')
                ->map(function ($grupo) {
                    $chofer = $grupo->first()->chofer;
                    if (!$chofer) {
                        return null;
                    }

                    $total = $grupo->count();
                    $completadas = $grupo->where('estado', 'ENTREGADO')->count();
                    $eficiencia = $total > 0 ? round(($completadas / $total) * 100, 2) : 0;

                    return [
                        'chofer_id' => $chofer->id,
                        'nombre' => $chofer->user?->name ?? $chofer->nombre,
                        'email' => $chofer->user?->email,
                        'entregas_total' => $total,
                        'entregas_completadas' => $completadas,
                        'eficiencia_porcentaje' => $eficiencia,
                    ];
                })
                ->filter()
                ->sortByDesc('entregas_completadas')
                ->take(5)
                ->values();

            // 4. ENTREGAS ÚLTIMOS 7 DÍAS
            $fechaInicio = now()->subDays(7)->startOfDay();
            $ultimos7Dias = collect();

            for ($i = 6; $i >= 0; $i--) {
                $fecha = now()->subDays($i)->format('Y-m-d');
                $cantidadFecha = $entregas
                    ->filter(function ($e) use ($i) {
                        return $e->fecha_entrega &&
                               $e->fecha_entrega->format('Y-m-d') === now()->subDays($i)->format('Y-m-d');
                    })
                    ->count();

                $ultimos7Dias->push([
                    'fecha' => $fecha,
                    'dia' => now()->subDays($i)->format('D'),
                    'entregas' => $cantidadFecha,
                ]);
            }

            // 5. ENTREGAS RECIENTES (últimas 10)
            $entregasRecientes = $entregas
                ->sortByDesc('created_at')
                ->take(10)
                ->map(function ($entrega) {
                    $cliente = $entrega->venta?->cliente ?? $entrega->proforma?->cliente;
                    return [
                        'id' => $entrega->id,
                        'estado' => $entrega->estado,
                        'cliente_nombre' => $cliente?->nombre ?? 'Sin cliente',
                        'chofer_nombre' => $entrega->chofer?->user?->name ?? 'Sin asignar',
                        'fecha_entrega' => $entrega->fecha_entrega?->format('Y-m-d H:i'),
                        'fecha_programada' => $entrega->fecha_programada?->format('Y-m-d H:i'),
                        'peso_kg' => $entrega->peso_kg,
                        'vehiculo_placa' => $entrega->vehiculo?->placa ?? 'Sin vehículo',
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'estados' => $estados,
                    'estados_total' => array_sum($estados),
                    'por_zona' => $porZona,
                    'top_choferes' => $topChoferes,
                    'ultimos_7_dias' => $ultimos7Dias,
                    'entregas_recientes' => $entregasRecientes,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error en dashboardStats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage(),
            ], 500);
        }
    }
}
