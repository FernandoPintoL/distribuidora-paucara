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
use Illuminate\Support\Facades\Validator;
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
        $vehiculos = Vehiculo::disponibles()
            ->with('choferAsignado')  // 🔧 Cargar relación de chofer asignado (User)
            ->get(['id', 'placa', 'marca', 'modelo', 'capacidad_kg', 'chofer_asignado_id']);
        $choferes  = Empleado::where('estado', 'activo')->get();

        return Inertia::render('logistica/entregas/index', [
            'entregas'  => $entregas,
            'filtros'   => $filtros,
            'vehiculos' => $vehiculos,
            'choferes'  => $choferes,
        ]);
    }

    /**
     * Mostrar formulario unificado de creación (1 o múltiples entregas)
     *
     * FASE UNIFICADA: Una sola ruta para crear entregas simples o en lote
     *
     * Parámetros opcionales:
     * - ?venta_id=N → Preselecciona una venta (modo single)
     * - Sin parámetros → Modo batch (seleccionar múltiples)
     *
     * El frontend decide dinámicamente:
     * - 1 venta → Muestra Wizard
     * - 2+ ventas → Muestra Batch UI con optimización
     */
    /**
     * DEBUG: Ver ventas disponibles para entregar
     */
    public function debugVentas(): JsonResponse
    {
        $ventasConEntregas = \App\Models\Venta::whereHas('entregas')->pluck('id')->toArray();
        $ventasSinEntregas = \App\Models\Venta::whereDoesntHave('entregas')
            ->whereNotNull('cliente_id')
            ->with('cliente', 'detalles')
            ->get()
            ->map(fn($v) => [
                'id' => $v->id,
                'numero' => $v->numero,
                'cliente' => $v->cliente?->nombre,
                'detalles' => $v->detalles?->count(),
                'total' => $v->total,
            ]);

        return response()->json([
            'ventas_con_entregas' => count($ventasConEntregas),
            'ventas_sin_entregas' => count($ventasSinEntregas),
            'ids_con_entregas' => $ventasConEntregas,
            'ventas_disponibles' => $ventasSinEntregas,
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        // 1. Detectar modo basado en parámetro (opcional)
        $ventaPreseleccionada = $request->input('venta_id');

        // 2. Obtener ventas sin entregas
        // Solo mostrar ventas que no tienen entregas creadas
        // Usar datos enriquecidos para soportar ambos flujos
        $ventas = \App\Models\Venta::query()
            ->with([
                'cliente.direcciones',  // Cargar direcciones del cliente (fallback)
                'cliente.localidad',    // Cargar localidad del cliente para agrupar
                'detalles.producto',
                'estadoDocumento',
                'direccionCliente'      // Dirección específica de la venta (prioridad)
            ])
            ->whereDoesntHave('entregas')  // Solo ventas sin entregas
            ->whereNotNull('cliente_id')    // Debe tener cliente
            ->whereHas('detalles')          // Debe tener detalles de productos
            ->latest()
            ->get()
            ->map(function ($venta) {
                // Obtener dirección: prioridad venta -> cliente principal -> primera dirección cliente
                $direccionCliente = null;
                if ($venta->direccionCliente) {
                    $direccionCliente = [
                        'id'        => $venta->direccionCliente->id,
                        'direccion' => $venta->direccionCliente->direccion,
                        'latitud'   => $venta->direccionCliente->latitud,
                        'longitud'  => $venta->direccionCliente->longitud,
                    ];
                } elseif ($venta->cliente?->direcciones?->count()) {
                    // Fallback: usar dirección principal del cliente
                    $dirPrincipal = $venta->cliente->direcciones->firstWhere('es_principal', true)
                        ?? $venta->cliente->direcciones->first();
                    if ($dirPrincipal) {
                        $direccionCliente = [
                            'id'        => $dirPrincipal->id,
                            'direccion' => $dirPrincipal->direccion,
                            'latitud'   => $dirPrincipal->latitud,
                            'longitud'  => $dirPrincipal->longitud,
                        ];
                    }
                }

                return [
                    // Datos para formulario wizard (simple)
                    'id'               => $venta->id,
                    'numero_venta'     => $venta->numero ?? "V-{$venta->id}",
                    'numero'           => $venta->numero,
                    'total'            => (float) $venta->total,
                    'fecha_venta'      => $venta->fecha?->format('Y-m-d'),
                    'fecha'            => $venta->fecha?->format('Y-m-d'),
                    'estado'           => $venta->estadoDocumento?->nombre ?? 'Sin estado',
                    'cliente'          => [
                        'id'       => $venta->cliente?->id,
                        'nombre'   => $venta->cliente?->nombre ?? 'Cliente no disponible',
                        'telefono' => $venta->cliente?->telefono,
                        'localidad' => [
                            'id'      => $venta->cliente?->localidad?->id,
                            'nombre'  => $venta->cliente?->localidad?->nombre ?? 'Sin localidad',
                        ],
                    ],
                    // Dirección de entrega (desde proforma/confirmada o fallback a cliente)
                    'direccionCliente' => $direccionCliente,
                    // Datos de entrega comprometida (heredados de proforma)
                    'fecha_entrega_comprometida' => $venta->fecha_entrega_comprometida?->format('Y-m-d'),
                    'hora_entrega_comprometida'  => $venta->hora_entrega_comprometida?->format('H:i'),
                    'ventana_entrega_ini'        => $venta->ventana_entrega_ini?->format('H:i'),
                    'ventana_entrega_fin'        => $venta->ventana_entrega_fin?->format('H:i'),
                    // Datos para batch UI
                    'cantidad_items'   => $venta->detalles?->count() ?? 0,
                    'peso_estimado'    => $venta->detalles?->sum(fn($det) => $det->cantidad * 2) ?? 10,
                    'detalles'         => $venta->detalles?->toArray() ?? [],
                ];
            });

        // 3. Obtener vehículos disponibles
        $vehiculos = Vehiculo::disponibles()
            ->with('choferAsignado')  // 🔧 Cargar relación de chofer asignado (User)
            ->get()
            ->map(fn($v) => [
                'id'              => $v->id,
                'placa'           => $v->placa,
                'marca'           => $v->marca,
                'modelo'          => $v->modelo,
                'anho'            => $v->anho,
                'capacidad_carga' => $v->capacidad_kg,
                'capacidad_kg'    => $v->capacidad_kg,
                'estado'          => $v->estado,
                'activo'          => $v->activo,
                'chofer_asignado_id' => $v->chofer_asignado_id,  // 🔧 Incluir ID del chofer
                // 🔧 Incluir datos del chofer si existe (User)
                'chofer' => $v->choferAsignado ? [
                    'id'    => $v->choferAsignado->id,
                    'name'  => $v->choferAsignado->name,
                    'nombre' => $v->choferAsignado->name,
                    'email' => $v->choferAsignado->email,
                ] : null,
            ]);

        // 4. Obtener choferes activos
        $choferes = Empleado::query()
            ->with('user')
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) => $e->user !== null)
            ->map(fn($e) => [
                'id'             => $e->id,
                'name'           => $e->user->name ?? $e->nombre,
                'nombre'         => $e->user->name ?? $e->nombre,
                'email'          => $e->user->email ?? $e->email,
                'tiene_licencia' => $e->licencia ? true : false,
            ])
            ->values();

        // 5. Renderizar con una sola página unificada
        return Inertia::render('logistica/entregas/create', [
            'ventas'                 => $ventas,
            'vehiculos'              => $vehiculos,
            'choferes'               => $choferes,
            'ventaPreseleccionada'   => $ventaPreseleccionada,
        ]);
    }

    /**
     * Crear nueva entrega
     *
     * POST /logistica/entregas (web form)
     * POST /api/entregas (API JSON)
     *
     * El peso se calcula automáticamente desde los detalles de la venta
     * si no se proporciona explícitamente.
     */
    public function store(Request $request): JsonResponse | RedirectResponse
    {
        try {
            // Definir validación personalizada para fecha_entrega_valida
            Validator::extend('fecha_entrega_valida', function ($attribute, $value, $parameters, $validator) {
                try {
                    $fechaPrograma = \DateTime::createFromFormat('Y-m-d\TH:i', $value);
                    if (!$fechaPrograma) {
                        return false;
                    }

                    $ahora = new \DateTime('now');
                    $hoy = new \DateTime('today');

                    // Permitir entregas de hoy si la hora es futura
                    // O entregas de días posteriores a cualquier hora
                    if ($fechaPrograma->format('Y-m-d') === $ahora->format('Y-m-d')) {
                        // Es hoy: verificar que la hora sea futura
                        return $fechaPrograma > $ahora;
                    } else {
                        // Es un día posterior: permitir
                        return $fechaPrograma > $hoy;
                    }
                } catch (\Exception $e) {
                    return false;
                }
            });

            $validated = $request->validate(
                [
                    'venta_id'          => 'required|exists:ventas,id',
                    'vehiculo_id'       => 'required|exists:vehiculos,id',
                    'chofer_id'         => 'required|exists:empleados,id',
                    'fecha_programada'  => 'required|date_format:Y-m-d\TH:i|fecha_entrega_valida',
                    'direccion_entrega' => 'nullable|string|max:500',
                    'peso_kg'           => 'nullable|numeric|min:0.01|max:50000',
                    'observaciones'     => 'nullable|string|max:1000',
                ],
                [
                    'fecha_programada.fecha_entrega_valida' => 'La fecha de entrega debe ser hoy (con hora futura) o posterior',
                ]
            );

            // ✅ NUEVO: Obtener peso de la venta si no se proporciona
            if (empty($validated['peso_kg'])) {
                $venta = \App\Models\Venta::with('detalles')->findOrFail($validated['venta_id']);
                // Calcular peso basado en detalles de la venta
                // Por defecto: cantidad * 2 (estimación)
                $validated['peso_kg'] = $venta->detalles?->sum(fn($det) => $det->cantidad * 2) ?? 10;
            }

            // Validar que el peso no exceda la capacidad del vehículo
            $vehiculo = Vehiculo::findOrFail($validated['vehiculo_id']);
            if ($validated['peso_kg'] > $vehiculo->capacidad_kg) {
                return $this->respondError(
                    "El peso ({$validated['peso_kg']} kg) excede la capacidad del vehículo ({$vehiculo->capacidad_kg} kg)",
                    statusCode: 422
                );
            }

            // Obtener la venta para completar datos adicionales
            $venta = \App\Models\Venta::with('direccionCliente')->findOrFail($validated['venta_id']);

            // Crear entrega con todos los datos disponibles
            $entrega = \App\Models\Entrega::create([
                'venta_id'              => $validated['venta_id'],
                'vehiculo_id'           => $validated['vehiculo_id'],
                'chofer_id'             => $validated['chofer_id'],
                'fecha_programada'      => $validated['fecha_programada'],
                'direccion_entrega'     => $validated['direccion_entrega'] ?? $venta->direccionCliente?->direccion ?? null,
                'direccion_cliente_id'  => $venta->direccion_cliente_id,  // ✅ Asignar dirección del cliente
                'peso_kg'               => $validated['peso_kg'],
                'observaciones'         => $validated['observaciones'] ?? null,
                'estado'                => 'PROGRAMADO',
            ]);

            // ✅ DIFERENCIADO: Respuesta API vs Web
            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Entrega creada exitosamente',
                    'data' => $entrega,
                ], 201);
            }

            // Para solicitudes web, redirigir
            return redirect()
                ->route('logistica.entregas.show', $entrega->id)
                ->with('success', 'Entrega creada exitosamente');

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Error de validación en EntregaController::store', [
                'errors' => $e->errors(),
                'data' => $request->all(),
            ]);

            // ✅ DIFERENCIADO: Errores en API vs Web
            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Para Inertia.js: redirigir atrás con los errores (Inertia maneja esto automáticamente)
            return redirect()
                ->back()
                ->withErrors($e->errors())
                ->withInput($request->except('peso_kg')); // No guardar peso en input para recalcularlo

        } catch (\Exception $e) {
            Log::error('Error creando entrega', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al crear entrega: ' . $e->getMessage(),
                ], 500);
            }

            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Mostrar detalle de entrega
     */
    public function show(\App\Models\Entrega $entrega): JsonResponse | InertiaResponse
    {
        try {
            // Cargar relaciones necesarias
            $entrega->load([
                'venta.cliente',
                'proforma.cliente',
                'chofer',
                'vehiculo',
            ]);

            // API/JSON
            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => true,
                    'data' => $entrega,
                ]);
            }

            // Web (Inertia)
            return Inertia::render('logistica/entregas/Show', [
                'entrega' => $entrega,
            ]);

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
            $tiempoTotal        = $this->trackingService->obtenerTiempoPromedio($id);

            return response()->json([
                'success'                => true,
                'data'                   => $ubicaciones,
                'total'                  => $ubicaciones->count(),
                'distancia_recorrida_km' => $distanciaRecorrida,
                'tiempo_total_minutos'   => $tiempoTotal,
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
                'proforma.cliente',
            ])->get();

            // 1. CONTAR POR ESTADO
            $estados = [
                'PROGRAMADO' => $entregas->where('estado', 'PROGRAMADO')->count(),
                'ASIGNADA'   => $entregas->where('estado', 'ASIGNADA')->count(),
                'EN_CAMINO'  => $entregas->where('estado', 'EN_CAMINO')->count(),
                'LLEGO'      => $entregas->where('estado', 'LLEGO')->count(),
                'ENTREGADO'  => $entregas->where('estado', 'ENTREGADO')->count(),
                'NOVEDAD'    => $entregas->where('estado', 'NOVEDAD')->count(),
                'CANCELADA'  => $entregas->where('estado', 'CANCELADA')->count(),
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
                    $total       = $grupo->count();
                    $completadas = $grupo->whereIn('estado', ['ENTREGADO'])->count();

                    // Calcular tiempo promedio de entrega en minutos
                    $tiempoPromedio    = 0;
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
                        $zona       = \App\Models\Zona::find($zonaId);
                        $nombreZona = $zona?->nombre ?? "Zona {$zonaId}";
                    }

                    return [
                        'zona_id'                 => $zonaId === 'Sin zona' ? null : $zonaId,
                        'nombre'                  => $nombreZona,
                        'total'                   => $total,
                        'completadas'             => $completadas,
                        'porcentaje'              => $total > 0 ? round(($completadas / $total) * 100, 2) : 0,
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
                    if (! $chofer) {
                        return null;
                    }

                    $total       = $grupo->count();
                    $completadas = $grupo->where('estado', 'ENTREGADO')->count();
                    $eficiencia  = $total > 0 ? round(($completadas / $total) * 100, 2) : 0;

                    return [
                        'chofer_id'             => $chofer->id,
                        'nombre'                => $chofer->user?->name ?? $chofer->nombre,
                        'email'                 => $chofer->user?->email,
                        'entregas_total'        => $total,
                        'entregas_completadas'  => $completadas,
                        'eficiencia_porcentaje' => $eficiencia,
                    ];
                })
                ->filter()
                ->sortByDesc('entregas_completadas')
                ->take(5)
                ->values();

            // 4. ENTREGAS ÚLTIMOS 7 DÍAS
            $fechaInicio  = now()->subDays(7)->startOfDay();
            $ultimos7Dias = collect();

            for ($i = 6; $i >= 0; $i--) {
                $fecha         = now()->subDays($i)->format('Y-m-d');
                $cantidadFecha = $entregas
                    ->filter(function ($e) use ($i) {
                        return $e->fecha_entrega &&
                        $e->fecha_entrega->format('Y-m-d') === now()->subDays($i)->format('Y-m-d');
                    })
                    ->count();

                $ultimos7Dias->push([
                    'fecha'    => $fecha,
                    'dia'      => now()->subDays($i)->format('D'),
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
                        'id'               => $entrega->id,
                        'estado'           => $entrega->estado,
                        'cliente_nombre'   => $cliente?->nombre ?? 'Sin cliente',
                        'chofer_nombre'    => $entrega->chofer?->user?->name ?? 'Sin asignar',
                        'fecha_entrega'    => $entrega->fecha_entrega?->format('Y-m-d H:i'),
                        'fecha_programada' => $entrega->fecha_programada?->format('Y-m-d H:i'),
                        'peso_kg'          => $entrega->peso_kg,
                        'vehiculo_placa'   => $entrega->vehiculo?->placa ?? 'Sin vehículo',
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data'    => [
                    'estados'            => $estados,
                    'estados_total'      => array_sum($estados),
                    'por_zona'           => $porZona,
                    'top_choferes'       => $topChoferes,
                    'ultimos_7_dias'     => $ultimos7Dias,
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

    /**
     * ⚠️ DEPRECATED: Usar create() en su lugar
     *
     * Este método ha sido reemplazado por create() que soporta
     * tanto entregas simples como en lote en una sola interfaz unificada.
     *
     * FASE UNIFICADA: La ruta /logistica/entregas/create ahora maneja
     * ambos flujos (single + batch) dinámicamente según la selección del usuario.
     *
     * Mantener por backward compatibility temporalmente.
     * Será eliminado en próximo sprint.
     *
     * @deprecated Use GET /logistica/entregas/create instead
     * @see \App\Http\Controllers\EntregaController::create()
     */
    public function createBatch(): InertiaResponse
    {
        // Obtener ventas sin entrega
        $ventas = \App\Models\Venta::query()
            ->with(['cliente', 'detalles', 'estadoDocumento'])
            ->whereDoesntHave('entregas')
            ->latest()
            ->get()
            ->map(function ($venta) {
                return [
                    'id'            => $venta->id,
                    'numero_venta'  => $venta->numero ?? "V-{$venta->id}",
                    'total'         => (float) $venta->total,
                    'fecha_venta'   => $venta->fecha?->format('Y-m-d'),
                    'cliente'       => [
                        'id'     => $venta->cliente?->id,
                        'nombre' => $venta->cliente?->nombre ?? 'Cliente no disponible',
                    ],
                    'cantidad_items' => $venta->detalles?->count() ?? 0,
                    'peso_estimado'  => $venta->detalles?->sum(fn($det) => $det->cantidad * 2) ?? 10,
                ];
            });

        // Obtener vehículos disponibles
        $vehiculos = Vehiculo::disponibles()
            ->with('choferAsignado')  // 🔧 Cargar relación de chofer asignado (User)
            ->get()
            ->map(fn($v) => [
                'id'           => $v->id,
                'placa'        => $v->placa,
                'marca'        => $v->marca,
                'modelo'       => $v->modelo,
                'anho'         => $v->anho,
                'capacidad_kg' => $v->capacidad_kg,
                'estado'       => $v->estado,
                'activo'       => $v->activo,
                'chofer_asignado_id' => $v->chofer_asignado_id,  // 🔧 Incluir ID del chofer
                // 🔧 Incluir datos del chofer si existe (User)
                'chofer' => $v->choferAsignado ? [
                    'id'    => $v->choferAsignado->id,
                    'name'  => $v->choferAsignado->name,
                    'nombre' => $v->choferAsignado->name,
                    'email' => $v->choferAsignado->email,
                ] : null,
            ]);

        // Obtener choferes activos
        $choferes = Empleado::query()
            ->with('user')
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) => $e->user !== null)
            ->map(fn($e) => [
                'id'     => $e->id,
                'nombre' => $e->user?->name ?? $e->nombre,
                'email'  => $e->user?->email,
            ])
            ->values();

        return Inertia::render('logistica/entregas/create-batch', [
            'ventas'    => $ventas,
            'vehiculos' => $vehiculos,
            'choferes'  => $choferes,
        ]);
    }
}
