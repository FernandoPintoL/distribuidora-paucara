<?php

namespace App\Http\Controllers\Api;

use App\Events\EntregaAsignada;
use App\Events\UbicacionActualizada;
use App\Events\MarcarLlegadaConfirmada;
use App\Events\EntregaConfirmada;
use App\Events\NovedadEntregaReportada;
use App\Events\EntregaCancelada;
use App\Http\Controllers\Controller;
use App\Models\Entrega;
use App\Models\EstadoLogistica;
use App\Models\Proforma;
use App\Models\Venta;  // ✅ Importar modelo Venta
use App\Models\EntregaVentaConfirmacion;  // ✅ Importar modelo confirmaciones
use App\Services\ImpresionEntregaService;  // ✅ NUEVO: Importar servicio de productos
use App\Services\WebSocket\EntregaWebSocketService;  // ✅ NUEVO: WebSocket service
use App\Services\EntregaLocalidadesService;  // ✅ NUEVO: Servicio de localidades de entrega
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Pagination\Paginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class EntregaController extends Controller
{
    private $impresionService;
    private $localidadesService;

    public function __construct(ImpresionEntregaService $impresionService, EntregaLocalidadesService $localidadesService)
    {
        $this->impresionService = $impresionService;
        $this->localidadesService = $localidadesService;
    }

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
            // Parámetros opcionales:
            // - fecha_asignacion: filtro de UN DÍA específico (legacy)
            // - created_desde: rango desde (created_at) - si no se proporciona, usa hoy
            // - created_hasta: rango hasta (created_at) - si no se proporciona, usa hoy
            $fechaFiltro = $request->fecha_asignacion;
            $search = $request->search;  // ✅ NUEVO: búsqueda case-insensitive
            $localidadId = $request->localidad_id;  // ✅ NUEVO: filtro por localidad

            // ✅ NUEVO: Filtro por rango de created_at (fecha de creación)
            $createdDesde = $request->created_desde ?? today()->toDateString();  // Por defecto: hoy
            $createdHasta = $request->created_hasta ?? today()->toDateString();  // Por defecto: hoy

            // Seleccionar solo campos necesarios para la lista
            $entregas = Entrega::where('chofer_id', $user->id)
                ->when($fechaFiltro, function ($q) use ($fechaFiltro) {
                    return $q->whereDate('fecha_asignacion', $fechaFiltro);  // ✅ FILTRA SOLO SI SE PROPORCIONA FECHA
                })
                // ✅ NUEVO: Filtro por rango de created_at (fecha de creación de la entrega)
                ->whereBetween('created_at', [
                    Carbon::parse($createdDesde)->startOfDay(),
                    Carbon::parse($createdHasta)->endOfDay()
                ])
                ->when($estado, function ($q) use ($estado) {
                    return $q->where('estado', $estado);
                })
                // ✅ NUEVO: Búsqueda case-insensitive por ID, número entrega, número venta, y cliente info
                ->when($search, function ($q) use ($search) {
                    $searchLower = strtolower($search);
                    return $q->where(function ($query) use ($searchLower, $search) {
                        // Buscar en el ID de la entrega
                        $query->where('id', $search);

                        // Buscar en número de entrega (case-insensitive)
                        $query->orWhereRaw('LOWER(numero_entrega) LIKE ?', ["%{$searchLower}%"]);

                        // Buscar en ventas relacionadas (número, cliente nombre, telefono)
                        $query->orWhereHas('ventas', function ($q) use ($searchLower, $search) {
                            // Número de venta
                            $q->whereRaw('LOWER(numero) LIKE ?', ["%{$searchLower}%"])
                              // Nombre del cliente (case-insensitive)
                              ->orWhereHas('cliente', function ($cq) use ($searchLower, $search) {
                                  $cq->whereRaw('LOWER(nombre) LIKE ?', ["%{$searchLower}%"])
                                    ->orWhereRaw('LOWER(nit) LIKE ?', ["%{$searchLower}%"])
                                    ->orWhereRaw('LOWER(telefono) LIKE ?', ["%{$searchLower}%"]);
                              });
                        });
                    });
                })
                // ✅ NUEVO: Filtrar por localidad
                ->when($localidadId, function ($q) use ($localidadId) {
                    return $q->whereHas('ventas.cliente.localidad', function ($query) use ($localidadId) {
                        $query->where('id', $localidadId);
                    });
                })
                ->select([
                    'id', 'numero_entrega', 'estado', 'estado_entrega_id',
                    'fecha_asignacion', 'fecha_entrega', 'observaciones',
                    'peso_kg', 'vehiculo_id', 'chofer_id'
                ])
                ->with([
                    'estadoEntrega:id,codigo,nombre,color,icono',  // Solo campos necesarios
                    'ventas:id,numero,subtotal,impuesto,total,estado_logistico_id,fecha_entrega_comprometida,cliente_id,direccion_cliente_id,entrega_id',
                    'ventas.cliente:id,nombre,nit,telefono,localidad_id',
                    'ventas.cliente.localidad:id,nombre,codigo',
                    'ventas.direccionCliente:id,direccion,latitud,longitud',
                    'ventas.estadoLogistica:id,codigo,nombre,color,icono',
                    'vehiculo:id,placa,marca,modelo'
                ])
                ->get();

            // DEBUG: Log cantidad de entregas encontradas CON filtro
            Log::info('📱 [misTrabjos] Entregas encontradas CON FILTRO', [
                'user_id' => $user->id,
                'fecha_asignacion_filtro' => $fechaFiltro,
                'created_desde' => $createdDesde,  // ✅ NUEVO
                'created_hasta' => $createdHasta,  // ✅ NUEVO
                'estado_filtro' => $estado,
                'search' => $search,
                'localidad_id' => $localidadId,
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
                            'nit' => $venta->cliente->nit,
                            'telefono' => $venta->cliente->telefono,
                            'localidad' => $venta->cliente->localidad ? [
                                'id' => $venta->cliente->localidad->id,
                                'nombre' => $venta->cliente->localidad->nombre,
                                'codigo' => $venta->cliente->localidad->codigo ?? null,
                            ] : null,
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

                // ✅ NUEVO: Obtener localidades de la entrega usando el service
                $localidadesResumen = $this->localidadesService->obtenerLocalidadesResumen($entrega);
                $localidades = $this->localidadesService->obtenerLocalidades($entrega);

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
                    'localidades' => $localidades->map(fn($loc) => [
                        'id' => $loc->id,
                        'nombre' => $loc->nombre,
                        'codigo' => $loc->codigo ?? null,
                    ])->toArray(),
                    'localidades_resumen' => $localidadesResumen,
                    'cantidad_localidades' => count($localidades),
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
     * GET /api/chofer/estadisticas
     * Obtener estadísticas rápidas del chofer para dashboard
     * Retorna: total, completadas, pendientes, en_ruta, tasa_exito, km_estimados, etc.
     * Endpoint optimizado para cargar rápido (sin ventas detalladas)
     * ✅ RELACIÓN CORRECTA: Usa FK estado_entrega_id → estados_logistica.id
     */
    public function estadisticasChofer(Request $request)
    {
        try {
            $user = Auth::user();
            $hoy = Carbon::today();

            // DEBUG: Loguear información del usuario
            Log::info('📊 [estadisticasChofer] Debug', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'hoy' => $hoy->toDateString(),
            ]);

            // Obtener todas las entregas del chofer (SIN filtro de fecha por ahora)
            // Usar with() para cargar relación estadoEntrega
            $entregas = Entrega::where('chofer_id', $user->id)
                // DEBUG: Quitamos el filtro de fecha temporalmente para ver si hay entregas
                // ->whereDate('fecha_asignacion', '>=', $hoy)
                ->select(['id', 'estado_entrega_id', 'numero_entrega', 'fecha_asignacion', 'fecha_entrega'])
                ->with(['estadoEntrega:id,codigo,es_estado_final', 'vehiculo:id,placa'])
                ->get();

            // DEBUG: Loguear entregas encontradas
            Log::info('📊 [estadisticasChofer] Entregas encontradas', [
                'cantidad' => $entregas->count(),
                'ids' => $entregas->pluck('id')->toArray(),
                'números' => $entregas->pluck('numero_entrega')->toArray(),
            ]);

            // Calcular estadísticas usando relación estadoEntrega
            $totalEntregas = $entregas->count();

            // ✅ ESTADOS AGRUPADOS PARA EL CHOFER (según tabla estados_logistica)
            // Estados de PREPARACIÓN (PREPARACION_CARGA + EN_CARGA)
            $entregasEnPreparacion = $entregas->filter(function ($e) {
                return $e->estadoEntrega &&
                       in_array($e->estadoEntrega->codigo, ['PREPARACION_CARGA', 'EN_CARGA']);
            })->count();

            // Estados LISTO PARA ENTREGA
            $entregasListasEntrega = $entregas->filter(function ($e) {
                return $e->estadoEntrega && $e->estadoEntrega->codigo === 'LISTO_PARA_ENTREGA';
            })->count();

            // Estados EN RUTA (EN_TRANSITO + EN_CAMINO + LLEGO)
            $entregasEnRuta = $entregas->filter(function ($e) {
                return $e->estadoEntrega &&
                       in_array($e->estadoEntrega->codigo, ['EN_TRANSITO', 'EN_CAMINO', 'LLEGO']);
            })->count();

            // Estados ENTREGADO (completadas con éxito)
            $entregasEntregadas = $entregas->filter(function ($e) {
                return $e->estadoEntrega && $e->estadoEntrega->codigo === 'ENTREGADO';
            })->count();

            // Entregas completadas: estado_final = true (ENTREGADO, RECHAZADO, CANCELADA)
            $entregasCompletadas = $entregas->filter(function ($e) {
                return $e->estadoEntrega && $e->estadoEntrega->es_estado_final;
            })->count();

            // Entregas pendientes: NOT estado_final
            $entregasPendientes = $entregas->filter(function ($e) {
                return !($e->estadoEntrega && $e->estadoEntrega->es_estado_final);
            })->count();

            $tasaExito = $totalEntregas > 0
                ? round(($entregasCompletadas / $totalEntregas) * 100, 2)
                : 0;

            // Obtener próxima entrega pendiente (para mostrar en dashboard)
            // Filtrar entregas que NO estén en estado final
            $proximaEntrega = Entrega::where('chofer_id', $user->id)
                ->whereHas('estadoEntrega', function ($q) {
                    // Solo entregas cuyo estado NO sea final
                    $q->where('es_estado_final', false);
                })
                ->orderBy('fecha_asignacion')
                ->select(['id', 'numero_entrega', 'estado_entrega_id', 'fecha_asignacion'])
                ->with(['vehiculo:id,placa', 'estadoEntrega:id,codigo,nombre'])
                ->first();

            // Calcular km estimados (sumar distancias de entregas pendientes)
            // Por ahora, usaremos aproximado basado en cantidad
            $kmEstimados = $entregasPendientes > 0 ? ($entregasPendientes * 15.5) : 0;

            // Calcular tiempo promedio de entrega (de las completadas hoy)
            $tiempoPromedio = 0;
            $entregasCompletadasHoy = Entrega::where('chofer_id', $user->id)
                ->whereDate('fecha_entrega', $hoy)
                ->whereHas('estadoEntrega', function ($q) {
                    // Solo entregas completadas (estado final)
                    $q->where('es_estado_final', true);
                })
                ->select(['fecha_asignacion', 'fecha_entrega'])
                ->get();

            if ($entregasCompletadasHoy->count() > 0) {
                $tiempoTotal = 0;
                foreach ($entregasCompletadasHoy as $entrega) {
                    if ($entrega->fecha_asignacion && $entrega->fecha_entrega) {
                        $tiempoTotal += $entrega->fecha_entrega->diffInMinutes($entrega->fecha_asignacion);
                    }
                }
                $tiempoPromedio = round($tiempoTotal / $entregasCompletadasHoy->count(), 0);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    // Contadores principales (totales)
                    'total_entregas' => $totalEntregas,
                    'entregas_completadas' => $entregasCompletadas,
                    'entregas_pendientes' => $entregasPendientes,

                    // ✅ ESTADOS PRINCIPALES DEL CHOFER (agrupados)
                    'entregas_en_preparacion' => $entregasEnPreparacion,     // PREPARACION_CARGA + EN_CARGA
                    'entregas_listas_entrega' => $entregasListasEntrega,     // LISTO_PARA_ENTREGA
                    'entregas_en_ruta' => $entregasEnRuta,                   // EN_TRANSITO + EN_CAMINO + LLEGO
                    'entregas_entregadas' => $entregasEntregadas,            // ENTREGADO

                    // KPIs
                    'tasa_exito' => $tasaExito,
                    'km_estimados' => round($kmEstimados, 2),
                    'tiempo_promedio_minutos' => $tiempoPromedio,

                    // Próxima entrega
                    'proxima_entrega' => $proximaEntrega ? [
                        'id' => $proximaEntrega->id,
                        'numero_entrega' => $proximaEntrega->numero_entrega,
                        'codigo_estado' => $proximaEntrega->estadoEntrega?->codigo,
                        'nombre_estado' => $proximaEntrega->estadoEntrega?->nombre,
                        'vehiculo' => $proximaEntrega->vehiculo ? [
                            'placa' => $proximaEntrega->vehiculo->placa,
                        ] : null,
                    ] : null,
                    'timestamp' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error en estadisticasChofer', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
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
                'ventas.tipoPago',  // ✅ NUEVO: Cargar tipo de pago de venta para mostrar en Flutter
                'ventas.detalles.producto.unidad',  // ✅ ACTUALIZADO: Incluir unidad (correcta relación) para obtenerProductosGenerico()
                'ventas.cliente.localidad',  // ✅ NUEVO: Cargar localidad del cliente
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

            // ✅ NUEVO: Obtener lista genérica de productos de la entrega
            $productosGenerico = $this->impresionService->obtenerProductosGenerico($entrega);

            // 🔍 DEBUG: Verificar que los productos se están obteniendo
            Log::info('📦 [API_SHOWENTREGA] Obteniendo productos genéricos', [
                'entrega_id' => $entrega->id,
                'cantidad_productos' => $productosGenerico->count(),
                'ventas_asignadas' => $entrega->ventas->count(),
            ]);

            // ✅ NUEVO: Obtener localidades de la entrega usando el servicio
            $localidadesService = new EntregaLocalidadesService();
            $localidades = $localidadesService->obtenerDatosCompletos($entrega);

            Log::info('📍 [API_SHOWENTREGA] Localidades obtenidas', [
                'entrega_id' => $entrega->id,
                'cantidad_localidades' => $localidades['cantidad_localidades'],
                'localidades' => array_column($localidades['localidades'], 'nombre'),
            ]);

            return response()->json([
                'success' => true,
                'data' => $entrega,
                'productos' => $productosGenerico->toArray(),  // ✅ Productos genéricos
                'localidades' => $localidades,  // ✅ NUEVO: Incluir localidades
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
     * GET /api/entregas/{id}/localidades
     * Obtener todas las localidades de los clientes en las ventas de esta entrega
     *
     * RELACIÓN:
     *   Entrega → Ventas → Cliente → Localidad
     *
     * RESPUESTA:
     * {
     *   "success": true,
     *   "data": {
     *     "localidades": [
     *       {
     *         "id": 1,
     *         "nombre": "La Paz",
     *         "codigo": "LP"
     *       },
     *       {
     *         "id": 2,
     *         "nombre": "Santa Cruz",
     *         "codigo": "SC"
     *       }
     *     ],
     *     "localidades_resumen": [
     *       {
     *         "localidad_id": 1,
     *         "localidad_nombre": "La Paz",
     *         "cantidad_ventas": 2,
     *         "clientes": ["Cliente A", "Cliente B"]
     *       }
     *     ],
     *     "cantidad_localidades": 2,
     *     "tiene_multiples_localidades": true
     *   }
     * }
     */
    public function obtenerLocalidades(Entrega $entrega, \App\Services\EntregaLocalidadesService $service)
    {
        try {
            Log::info('📍 Obteniendo localidades de entrega', [
                'entrega_id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
            ]);

            // ✅ NUEVO: Usar el servicio en lugar de métodos del modelo
            $datos = $service->obtenerDatosCompletos($entrega);

            Log::info('✅ Localidades obtenidas', [
                'entrega_id' => $entrega->id,
                'cantidad' => $datos['cantidad_localidades'],
                'localidades' => array_column($datos['localidades'], 'nombre'),
            ]);

            return response()->json([
                'success' => true,
                'data' => array_merge($datos, [
                    'tiene_multiples_localidades' => $datos['es_consolidada'],
                ]),
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo localidades', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener localidades',
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
                // ✅ NUEVO: Obtener IDs de estados EN_TRANSITO y PENDIENTE_ENVIO
                $estadoEnTransitoId = \App\Models\EstadoLogistica::where('codigo', 'EN_TRANSITO')
                    ->where('categoria', 'venta_logistica')
                    ->value('id');

                $estadoPendienteEnvioId = \App\Models\EstadoLogistica::where('codigo', 'PENDIENTE_ENVIO')
                    ->where('categoria', 'venta_logistica')
                    ->value('id');

                if ($estadoEnTransitoId && $estadoPendienteEnvioId) {
                    // ✅ MEJORADO: Solo actualizar ventas que están en PENDIENTE_ENVIO → EN_TRANSITO
                    $ventasCount = $entrega->ventas()
                        ->where('estado_logistico_id', $estadoPendienteEnvioId)
                        ->update([
                            'estado_logistico_id' => $estadoEnTransitoId,
                            'updated_at'          => now(),
                        ]);

                    Log::info('✅ [INICIAR_RUTA] Ventas actualizadas a EN_TRANSITO', [
                        'entrega_id'              => $entrega->id,
                        'ventas_actualizadas'    => $ventasCount,
                        'estado_anterior_id'     => $estadoPendienteEnvioId,
                        'estado_logistico_id'    => $estadoEnTransitoId,
                    ]);
                } elseif ($estadoEnTransitoId && !$estadoPendienteEnvioId) {
                    // Fallback: Si no encuentra PENDIENTE_ENVIO, actualiza todas
                    $ventasCount = $entrega->ventas()->update([
                        'estado_logistico_id' => $estadoEnTransitoId,
                        'updated_at'          => now(),
                    ]);

                    Log::warning('⚠️ [INICIAR_RUTA] Estado PENDIENTE_ENVIO no encontrado, se actualizaron todas las ventas', [
                        'entrega_id' => $entrega->id,
                        'ventas_actualizadas' => $ventasCount,
                    ]);
                }

                // ✅ NUEVO: Notificar a clientes, admins y cajeros sobre el cambio de estado
                try {
                    $entrega->load(['ventas.cliente', 'chofer', 'vehiculo']);
                    $notificationService = app(\App\Services\Notifications\EntregaNotificationService::class);
                    $notificationService->notificarClientesEnTransito($entrega);
                } catch (\Exception $e) {
                    Log::error('❌ Error notificando sobre inicio de tránsito', [
                        'entrega_id' => $entrega->id,
                        'error'      => $e->getMessage(),
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
            // ✅ MEJORADO: Soporta múltiples formas de pago + productos rechazados
            $validated = $request->validate([
                'fotos' => 'nullable|array',
                'fotos.*' => 'string',
                'observaciones' => 'nullable|string|max:500',
                'observaciones_logistica' => 'nullable|string|max:1000',
                'tienda_abierta' => 'nullable|boolean',
                'cliente_presente' => 'nullable|boolean',
                'motivo_rechazo' => 'nullable|string|in:TIENDA_CERRADA,CLIENTE_AUSENTE,CLIENTE_RECHAZA,DIRECCION_INCORRECTA,CLIENTE_NO_IDENTIFICADO,OTRO',

                // ✅ OPCIÓN A: Múltiples pagos (nuevo)
                'pagos' => 'nullable|array',
                'pagos.*.tipo_pago_id' => 'required_with:pagos|exists:tipos_pago,id',
                'pagos.*.monto' => 'required_with:pagos|numeric|min:0',
                'pagos.*.referencia' => 'nullable|string|max:100',

                // ✅ OPCIÓN B: Pago único (backward compatibility)
                'monto_recibido' => 'nullable|numeric|min:0',
                'tipo_pago_id' => 'nullable|exists:tipos_pago,id',

                // ✅ CAMBIO: Soporte para crédito como boolean (promesa de pago)
                'es_credito' => 'nullable|boolean',
                'tipo_confirmacion' => 'nullable|in:COMPLETA,CON_NOVEDAD',

                // ✅ NUEVO: Productos rechazados/devueltos (devolución parcial)
                'productos_rechazados' => 'nullable|array',
                'productos_rechazados.*.producto_id' => 'required_with:productos_rechazados|integer',
                'productos_rechazados.*.producto_nombre' => 'required_with:productos_rechazados|string|max:255',
                'productos_rechazados.*.cantidad' => 'required_with:productos_rechazados|numeric|min:0',
                'productos_rechazados.*.precio_unitario' => 'required_with:productos_rechazados|numeric|min:0',
                'productos_rechazados.*.subtotal' => 'required_with:productos_rechazados|numeric|min:0',
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

            // ✅ NUEVO: Procesar múltiples pagos o pago único
            $desglosePagos = null;
            $totalDineroRecibido = 0;
            $montoPendiente = 0;

            if (isset($validated['pagos']) && !empty($validated['pagos'])) {
                // Opción A: Múltiples pagos
                $desglosePagos = [];
                foreach ($validated['pagos'] as $pago) {
                    $tipoPago = \App\Models\TipoPago::find($pago['tipo_pago_id']);
                    $desglosePagos[] = [
                        'tipo_pago_id' => $pago['tipo_pago_id'],
                        'tipo_pago_nombre' => $tipoPago->nombre ?? 'Desconocido',
                        'monto' => (float) $pago['monto'],
                        'referencia' => $pago['referencia'] ?? null,
                    ];
                    $totalDineroRecibido += (float) $pago['monto'];
                }
                \Log::debug('💳 [MÚLTIPLES PAGOS] Recibidos ' . count($desglosePagos) . ' tipos de pago');
            } else if (isset($validated['monto_recibido']) && $validated['monto_recibido'] > 0) {
                // Opción B: Pago único (backward compatibility)
                $tipoPago = \App\Models\TipoPago::find($validated['tipo_pago_id']);
                $desglosePagos = [[
                    'tipo_pago_id' => $validated['tipo_pago_id'],
                    'tipo_pago_nombre' => $tipoPago->nombre ?? 'Desconocido',
                    'monto' => (float) $validated['monto_recibido'],
                    'referencia' => null,
                ]];
                $totalDineroRecibido = (float) $validated['monto_recibido'];
            }

            // Calcular monto pendiente (si hubo crédito o pago parcial)
            $montoPendiente = max(0, $venta->total - $totalDineroRecibido);

            // ✅ CAMBIO: Determinar estado de pago
            $estadoPago = 'NO_PAGADO';
            if (isset($validated['es_credito']) && $validated['es_credito']) {
                // Si es crédito, marca como CREDITO (promesa de pago, no dinero real)
                $estadoPago = 'CREDITO';
                $totalDineroRecibido = 0;  // NO entra dinero a caja
            } else if ($totalDineroRecibido >= $venta->total) {
                $estadoPago = 'PAGADO';
            } else if ($totalDineroRecibido > 0) {
                $estadoPago = 'PARCIAL';
            }

            \Log::debug('💰 [PAGO] Total recibido: $' . $totalDineroRecibido .
                      ' | Pendiente: $' . $montoPendiente .
                      ' | Estado: ' . $estadoPago);

            // ✅ NUEVO: Procesar productos rechazados (devolución parcial)
            $productosDevueltos = null;
            $montoDevuelto = 0;
            $montoAceptado = $venta->total;

            if (isset($validated['productos_rechazados']) && !empty($validated['productos_rechazados'])) {
                $productosDevueltos = [];
                foreach ($validated['productos_rechazados'] as $producto) {
                    $productosDevueltos[] = [
                        'producto_id' => (int) $producto['producto_id'],
                        'producto_nombre' => $producto['producto_nombre'],
                        'cantidad' => (float) $producto['cantidad'],
                        'precio_unitario' => (float) $producto['precio_unitario'],
                        'subtotal' => (float) $producto['subtotal'],
                    ];
                    $montoDevuelto += (float) $producto['subtotal'];
                }
                // Calcular lo que fue aceptado
                $montoAceptado = $venta->total - $montoDevuelto;
                $montoAceptado = max(0, $montoAceptado);  // No negativo

                \Log::debug('📦 [DEVOLUCIÓN PARCIAL] Productos rechazados: ' . count($productosDevueltos) .
                          ' | Monto devuelto: $' . $montoDevuelto .
                          ' | Monto aceptado: $' . $montoAceptado);
            }

            // ✅ SIMPLIFICADO: Guardar fotos opcionalmente
            $fotosUrls = [];
            if (!empty($validated['fotos'])) {
                foreach ($validated['fotos'] as $foto) {
                    $fotoUrl = $this->guardarArchivoBase64($foto, 'entregas');
                    if ($fotoUrl) {
                        $fotosUrls[] = $fotoUrl;
                    }
                }
            }

            // ✅ CAMBIAR VENTA A ENTREGADA
            $datosActualizacion = [
                'estado_logistico_id' => $estadoEntregada->id,
                'observaciones_logistica' => $validated['observaciones_logistica'] ?? null,  // ✅ NUEVO: Guardar observaciones de entrega
            ];

            // ✅ NUEVO: Si la entrega es completa, cambiar estado_pago a PAGADO
            if (($validated['observaciones_logistica'] ?? null) === 'Entrega completa') {
                $datosActualizacion['estado_pago'] = 'PAGADO';
                Log::info('💳 Estado de pago actualizado a PAGADO por entrega completa', [
                    'venta_id' => $venta_id,
                ]);
            }

            $venta->update($datosActualizacion);

            // ✅ MEJORADO: Usar tipo_confirmacion y tipo_novedad del frontend (no derivar de observaciones)
            $tipoEntrega = $validated['tipo_confirmacion'] ?? 'COMPLETA';
            $tipoNovedad = $validated['tipo_novedad'] ?? null;
            $tuvoProblema = $tipoEntrega === 'CON_NOVEDAD';  // Hay problema si no es COMPLETA

            // ✅ MEJORADO: Guardar la confirmación con soporte para múltiples pagos + productos rechazados
            $confirmacion = EntregaVentaConfirmacion::updateOrCreate(
                [
                    'entrega_id' => $id,
                    'venta_id' => $venta_id,
                ],
                [
                    'tipo_entrega' => $tipoEntrega,
                    'tipo_novedad' => $tipoNovedad,
                    'tuvo_problema' => $tuvoProblema,
                    'fotos' => count($fotosUrls) > 0 ? $fotosUrls : null,
                    'observaciones_logistica' => $validated['observaciones_logistica'] ?? null,
                    'observaciones' => $validated['observaciones'] ?? null,
                    'tienda_abierta' => $validated['tienda_abierta'] ?? null,
                    'cliente_presente' => $validated['cliente_presente'] ?? null,
                    'motivo_rechazo' => $validated['motivo_rechazo'] ?? null,

                    // ✅ NUEVO: Desglose de múltiples pagos
                    'desglose_pagos' => $desglosePagos,              // Array JSON de pagos
                    'total_dinero_recibido' => $totalDineroRecibido, // Total en efectivo/transferencia
                    'monto_pendiente' => $montoPendiente,            // Dinero pendiente de cobro
                    'tipo_confirmacion' => $validated['tipo_confirmacion'] ?? 'COMPLETA',

                    // ✅ NUEVO: Productos rechazados (devolución parcial)
                    'productos_devueltos' => $productosDevueltos,    // Array JSON de productos rechazados
                    'monto_devuelto' => $montoDevuelto > 0 ? $montoDevuelto : null,  // Total devuelto
                    'monto_aceptado' => $montoAceptado,              // Total aceptado por cliente

                    // Backward compatibility: guardar también el primer pago en campos antiguos
                    'monto_recibido' => $totalDineroRecibido > 0 ? $totalDineroRecibido : null,
                    'tipo_pago_id' => $desglosePagos ? $desglosePagos[0]['tipo_pago_id'] : null,
                    'estado_pago' => $estadoPago,

                    'confirmado_por' => Auth::id(),
                    'confirmado_en' => now(),
                ]
            );

            // ✅ SIMPLIFICADO: SIN LÓGICA DE PAGO NI MOVIMIENTOS DE CAJA
            // El pago se gestiona por separado, no aquí
            // Si necesita detallar pago, puede escribir en observaciones

            Log::info('✅ Venta entregada - Confirmación de pago registrada', [
                'entrega_id' => $id,
                'venta_id' => $venta_id,
                'confirmacion_id' => $confirmacion->id,
                'fotos_guardadas' => count($fotosUrls),
                'desglose_pagos' => $desglosePagos,
                'total_dinero_recibido' => $totalDineroRecibido,
                'monto_pendiente' => $montoPendiente,
                'estado_pago' => $estadoPago,
                'productos_devueltos' => count($productosDevueltos ?? []),
                'monto_devuelto' => $montoDevuelto,
                'monto_aceptado' => $montoAceptado,
            ]);

            // ✅ Recargar entrega con todas sus relaciones
            $entrega->refresh();
            $entrega->load([
                'ventas.estadoLogistica',
                'estadoEntrega',
                'chofer',
                'vehiculo',
            ]);

            // ✅ NUEVO: Notificar a cliente, admin y cajero que venta fue entregada
            try {
                $wsService = app(EntregaWebSocketService::class);
                $wsService->notifyVentaEntregada($venta, $entrega, $venta->cliente);
                Log::info('✅ Notificación WebSocket enviada sobre venta entregada');
            } catch (\Exception $e) {
                Log::warning('⚠️ No se pudo enviar notificación WebSocket sobre venta entregada', [
                    'venta_id' => $venta_id,
                    'error' => $e->getMessage(),
                ]);
                // No interrumpir el flujo si falla la notificación WebSocket
            }

            return response()->json([
                'success' => true,
                'message' => 'Venta entregada correctamente',
                'data' => $entrega,
                'metadata' => [
                    'venta_confirmada' => [
                        'venta_id' => $venta->id,
                        'venta_numero' => $venta->numero,
                        'confirmacion_id' => $confirmacion->id,
                        'estado_logistico' => 'ENTREGADA',
                    ],
                    'archivos' => [
                        'fotos_guardadas' => count($fotosUrls),
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
     * PUT /api/entregas/{id}/ventas/{venta_id}/confirmaciones/{confirmacion_id}
     *
     * ✅ NUEVO: Actualizar una confirmación de entrega existente
     * Utilizado cuando el chofer necesita editar los datos de una entrega ya confirmada
     */
    public function actualizarConfirmacionVenta(Request $request, $id, $venta_id, $confirmacion_id)
    {
        try {
            // ✅ Validar datos (misma validación que confirmarVentaEntregada)
            $validated = $request->validate([
                'fotos' => 'nullable|array',
                'fotos.*' => 'string',
                'observaciones' => 'nullable|string|max:500',
                'observaciones_logistica' => 'nullable|string|max:1000',
                'tienda_abierta' => 'nullable|boolean',
                'cliente_presente' => 'nullable|boolean',
                'motivo_rechazo' => 'nullable|string|in:TIENDA_CERRADA,CLIENTE_AUSENTE,CLIENTE_RECHAZA,DIRECCION_INCORRECTA,CLIENTE_NO_IDENTIFICADO,OTRO',

                // ✅ Múltiples pagos (nuevo)
                'pagos' => 'nullable|array',
                'pagos.*.tipo_pago_id' => 'required_with:pagos|exists:tipos_pago,id',
                'pagos.*.monto' => 'required_with:pagos|numeric|min:0',
                'pagos.*.referencia' => 'nullable|string|max:100',

                // ✅ Pago único (backward compatibility)
                'monto_recibido' => 'nullable|numeric|min:0',
                'tipo_pago_id' => 'nullable|exists:tipos_pago,id',

                // ✅ Tipo de confirmación
                'tipo_confirmacion' => 'nullable|in:COMPLETA,CON_NOVEDAD',
                'tipo_novedad' => 'nullable|string|in:CLIENTE_CERRADO,DEVOLUCION_PARCIAL,RECHAZADO,NO_CONTACTADO',

                // ✅ Productos devueltos (devolución parcial)
                'productos_devueltos' => 'nullable|array',
                'productos_devueltos.*.producto_id' => 'required_with:productos_devueltos|integer',
                'productos_devueltos.*.producto_nombre' => 'required_with:productos_devueltos|string|max:255',
                'productos_devueltos.*.cantidad' => 'required_with:productos_devueltos|numeric|min:0',
                'productos_devueltos.*.precio_unitario' => 'required_with:productos_devueltos|numeric|min:0',
                'productos_devueltos.*.subtotal' => 'required_with:productos_devueltos|numeric|min:0',
            ]);

            // ✅ Obtener la confirmación existente
            $confirmacion = EntregaVentaConfirmacion::findOrFail($confirmacion_id);

            if ($confirmacion->entrega_id != $id || $confirmacion->venta_id != $venta_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'La confirmación no coincide con la entrega y venta proporcionadas',
                ], 422);
            }

            $entrega = Entrega::findOrFail($id);
            $venta = Venta::findOrFail($venta_id);

            // ✅ Procesar múltiples pagos o pago único
            $desglosePagos = null;
            $totalDineroRecibido = 0;
            $montoPendiente = 0;

            if (isset($validated['pagos']) && !empty($validated['pagos'])) {
                // Opción A: Múltiples pagos
                $desglosePagos = [];
                foreach ($validated['pagos'] as $pago) {
                    $tipoPago = \App\Models\TipoPago::find($pago['tipo_pago_id']);
                    $desglosePagos[] = [
                        'tipo_pago_id' => $pago['tipo_pago_id'],
                        'tipo_pago_nombre' => $tipoPago->nombre ?? 'Desconocido',
                        'monto' => (float) $pago['monto'],
                        'referencia' => $pago['referencia'] ?? null,
                    ];
                    $totalDineroRecibido += (float) $pago['monto'];
                }
            } else if (isset($validated['monto_recibido']) && $validated['monto_recibido'] > 0) {
                // Opción B: Pago único
                $tipoPago = \App\Models\TipoPago::find($validated['tipo_pago_id']);
                $desglosePagos = [[
                    'tipo_pago_id' => $validated['tipo_pago_id'],
                    'tipo_pago_nombre' => $tipoPago->nombre ?? 'Desconocido',
                    'monto' => (float) $validated['monto_recibido'],
                    'referencia' => null,
                ]];
                $totalDineroRecibido = (float) $validated['monto_recibido'];
            }

            // Calcular monto pendiente
            $montoAjustado = $venta->total;
            if (isset($validated['productos_devueltos']) && !empty($validated['productos_devueltos'])) {
                foreach ($validated['productos_devueltos'] as $producto) {
                    $montoAjustado -= (float) $producto['subtotal'];
                }
            }
            $montoPendiente = max(0, $montoAjustado - $totalDineroRecibido);

            // ✅ Determinar estado de pago
            $estadoPago = 'NO_PAGADO';
            if ($totalDineroRecibido >= $montoAjustado) {
                $estadoPago = 'PAGADO';
            } else if ($totalDineroRecibido > 0) {
                $estadoPago = 'PARCIAL';
            }

            // ✅ Procesar productos devueltos
            $productosDevueltos = null;
            $montoDevuelto = 0;
            $montoAceptado = $venta->total;

            if (isset($validated['productos_devueltos']) && !empty($validated['productos_devueltos'])) {
                $productosDevueltos = [];
                foreach ($validated['productos_devueltos'] as $producto) {
                    $productosDevueltos[] = [
                        'producto_id' => (int) $producto['producto_id'],
                        'producto_nombre' => $producto['producto_nombre'],
                        'cantidad' => (float) $producto['cantidad'],
                        'precio_unitario' => (float) $producto['precio_unitario'],
                        'subtotal' => (float) $producto['subtotal'],
                    ];
                    $montoDevuelto += (float) $producto['subtotal'];
                }
                $montoAceptado = max(0, $venta->total - $montoDevuelto);
            }

            // ✅ Guardar fotos nuevas (opcionalmente)
            $fotosUrls = $confirmacion->fotos ?? [];
            if (!empty($validated['fotos'])) {
                $fotosUrls = [];  // Reemplazar fotos existentes
                foreach ($validated['fotos'] as $foto) {
                    // Si es una URL ya existente (starts with http), mantenerla
                    if (strpos($foto, 'http') === 0) {
                        $fotosUrls[] = $foto;
                    } else {
                        // Si es base64, guardarla como archivo
                        $fotoUrl = $this->guardarArchivoBase64($foto, 'entregas');
                        if ($fotoUrl) {
                            $fotosUrls[] = $fotoUrl;
                        }
                    }
                }
            }

            // ✅ Determinar tipo_entrega basado en tipo_confirmacion
            $tipoConfirmacionActualizado = $validated['tipo_confirmacion'] ?? $confirmacion->tipo_confirmacion ?? 'COMPLETA';
            $tipoNovedadActualizado = $validated['tipo_novedad'] ?? $confirmacion->tipo_novedad;

            // ✅ Actualizar la confirmación
            $confirmacion->update([
                'tipo_entrega' => $tipoConfirmacionActualizado,  // ✅ COMPLETA o CON_NOVEDAD
                'tipo_confirmacion' => $tipoConfirmacionActualizado,
                'tipo_novedad' => $tipoNovedadActualizado,
                'tienda_abierta' => $validated['tienda_abierta'] ?? $confirmacion->tienda_abierta,
                'cliente_presente' => $validated['cliente_presente'] ?? $confirmacion->cliente_presente,
                'motivo_rechazo' => $validated['motivo_rechazo'] ?? $confirmacion->motivo_rechazo,
                'observaciones_logistica' => $validated['observaciones_logistica'] ?? $confirmacion->observaciones_logistica,
                'observaciones' => $validated['observaciones'] ?? $confirmacion->observaciones,

                // Pagos
                'desglose_pagos' => $desglosePagos ?? $confirmacion->desglose_pagos,
                'total_dinero_recibido' => $totalDineroRecibido ?: $confirmacion->total_dinero_recibido,
                'monto_pendiente' => $montoPendiente,
                'estado_pago' => $estadoPago,
                'tipo_pago_id' => $desglosePagos ? $desglosePagos[0]['tipo_pago_id'] : $confirmacion->tipo_pago_id,
                'monto_recibido' => $totalDineroRecibido ?: $confirmacion->monto_recibido,

                // Devoluciones
                'productos_devueltos' => $productosDevueltos ?? $confirmacion->productos_devueltos,
                'monto_devuelto' => $montoDevuelto > 0 ? $montoDevuelto : $confirmacion->monto_devuelto,
                'monto_aceptado' => $montoAceptado,

                // Fotos
                'fotos' => count($fotosUrls) > 0 ? $fotosUrls : null,

                'confirmado_por' => Auth::id(),
                'confirmado_en' => now(),
            ]);

            Log::info('✅ Confirmación de entrega actualizada', [
                'entrega_id' => $id,
                'venta_id' => $venta_id,
                'confirmacion_id' => $confirmacion_id,
                'estado_pago' => $estadoPago,
                'total_dinero_recibido' => $totalDineroRecibido,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Confirmación actualizada correctamente',
                'confirmacion' => $confirmacion->fresh(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ Error en actualizarConfirmacionVenta', [
                'error' => $e->getMessage(),
                'confirmacion_id' => $confirmacion_id,
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
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

            // ✅ NUEVO: Notificar a admin/cajeros que la entrega fue finalizada
            try {
                $wsService = app(EntregaWebSocketService::class);
                $wsService->notifyAdminsEntregaFinalizada($entrega, $entrega->ventas);
                Log::info('✅ Notificación WebSocket enviada a admins/cajeros sobre entrega finalizada');
            } catch (\Exception $e) {
                Log::warning('⚠️ No se pudo enviar notificación WebSocket sobre entrega finalizada', [
                    'entrega_id' => $id,
                    'error' => $e->getMessage(),
                ]);
                // No interrumpir el flujo si falla la notificación WebSocket
            }

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
     *   "entregador_id": 7,
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
                // ✅ CORREGIDO: chofer_id apunta a users.id, no empleados.id
                'chofer_id' => 'required|integer|exists:users,id',
                'entregador_id' => 'nullable|integer|exists:users,id',
                'zona_id' => 'nullable|integer|exists:localidades,id',
                'observaciones' => 'nullable|string|max:500',
                // ✅ NUEVO: Campos opcionales para caso single (1 venta)
                'fecha_programada' => 'nullable|date_format:Y-m-d\TH:i',
                'direccion_entrega' => 'nullable|string|max:255',
            ]);

            Log::info('✅ Validation passed', ['validated' => $validated]);

            $service = app(\App\Services\Logistica\CrearEntregaPorLocalidadService::class);

            Log::info('🔧 Service instantiated, calling crearEntregaConsolidada...');

            // ✅ NUEVO: Construir observaciones incluyendo dirección si se proporciona
            $observacionesCompletas = $validated['observaciones'] ?? '';
            if (!empty($validated['direccion_entrega'])) {
                $observacionesCompletas = trim($observacionesCompletas ? "{$observacionesCompletas}\n📍 Dirección: {$validated['direccion_entrega']}" : "📍 Dirección: {$validated['direccion_entrega']}");
            }

            $entrega = $service->crearEntregaConsolidada(
                ventaIds: $validated['venta_ids'],
                vehiculoId: $validated['vehiculo_id'],
                choferId: $validated['chofer_id'],
                zonaId: $validated['zona_id'],
                datos: [
                    'observaciones' => !empty($observacionesCompletas) ? $observacionesCompletas : null,
                    // ✅ NUEVO: Parámetros opcionales para caso single (1 venta)
                    'fecha_programada' => $validated['fecha_programada'] ?? null,
                    'usuario_id' => Auth::id(),
                    // ✅ NUEVO: Campo entregador_id (relación a users)
                    'entregador_id' => $validated['entregador_id'] ?? null,
                ]
            );

            Log::info('✅ Service call successful', ['entrega_id' => $entrega->id ?? 'unknown']);

            // ✅ NUEVO: Disparar evento para notificar al chofer (igual que ProformaAprobada en línea 902)
            try {
                event(new EntregaAsignada($entrega));
                Log::info('📢 Evento EntregaAsignada disparado exitosamente', [
                    'entrega_id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'chofer_id' => $entrega->chofer_id,
                ]);
            } catch (Exception $broadcastError) {
                Log::warning('⚠️  Error al emitir evento de entrega asignada (no crítico)', [
                    'entrega_id' => $entrega->id,
                    'error' => $broadcastError->getMessage(),
                ]);
                // La entrega ya fue creada exitosamente, así que continuamos
            }

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
                    'entregador' => $entrega->entregador,
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
     * POST /api/entregas/{id}/cancelar
     * Cancelar una entrega consolidada sin afectar las ventas
     *
     * Request body:
     * {
     *   "motivo": "Falta disponibilidad del chofer",
     *   "reabrir_ventas": true
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Entrega cancelada exitosamente",
     *   "data": { ... }
     * }
     */
    public function cancelarEntrega(\Illuminate\Http\Request $request, int $id)
    {
        try {
            Log::info('📍 cancelarEntrega request received', [
                'entrega_id' => $id,
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
            ]);

            // ═══════════════════════════════════════════════════════════
            // VALIDAR ENTRADA
            // ═══════════════════════════════════════════════════════════
            $validated = $request->validate([
                'motivo' => 'required|string|max:500',
                'reabrir_ventas' => 'nullable|boolean',
            ]);

            Log::info('✅ Validation passed', ['validated' => $validated]);

            // ═══════════════════════════════════════════════════════════
            // INSTANCIAR SERVICIO
            // ═══════════════════════════════════════════════════════════
            $service = app(\App\Services\Logistica\CancelarEntregaService::class);

            Log::info('🔧 Service instantiated, calling cancelarEntrega...');

            // ═══════════════════════════════════════════════════════════
            // LLAMAR AL SERVICIO
            // ═══════════════════════════════════════════════════════════
            $entrega = $service->cancelarEntrega(
                entregaId: $id,
                motivo: $validated['motivo'],
                reabrirVentas: $validated['reabrir_ventas'] ?? false,
                usuarioId: Auth::id(),
            );

            Log::info('✅ Service call successful', ['entrega_id' => $id]);

            // ═══════════════════════════════════════════════════════════
            // DISPARAR EVENTO
            // ═══════════════════════════════════════════════════════════
            try {
                event(new EntregaCancelada($entrega, $validated['motivo']));
                Log::info('📢 Evento EntregaCancelada disparado exitosamente', [
                    'entrega_id' => $id,
                    'motivo' => $validated['motivo'],
                ]);
            } catch (\Exception $broadcastError) {
                Log::warning('⚠️ Error al emitir evento de cancelación (no crítico)', [
                    'entrega_id' => $id,
                    'error' => $broadcastError->getMessage(),
                ]);
                // La entrega ya fue cancelada exitosamente, así que continuamos
            }

            // ═══════════════════════════════════════════════════════════
            // CARGAR DATOS PARA RESPUESTA
            // ═══════════════════════════════════════════════════════════
            Log::info('📍 Loading relationships...', ['entrega_id' => $id]);
            $entrega->load(['vehiculo:id,placa', 'chofer:id,name']);
            Log::info('✅ Relationships loaded');

            // Obtener ventas desvinculadas
            Log::info('📍 Fetching related sales...');
            $ventasCount = DB::table('entrega_venta')
                ->where('entrega_id', $id)
                ->count();

            Log::info('✅ Sales count retrieved', ['count' => $ventasCount]);

            // ═══════════════════════════════════════════════════════════
            // RETORNAR RESPUESTA
            // ═══════════════════════════════════════════════════════════
            return response()->json([
                'success' => true,
                'message' => 'Entrega cancelada exitosamente',
                'data' => [
                    'id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'estado' => $entrega->estado,
                    'fecha_cancelacion' => $entrega->updated_at,
                    'vehiculo' => [
                        'id' => $entrega->vehiculo?->id,
                        'placa' => $entrega->vehiculo?->placa,
                    ],
                    'chofer' => [
                        'id' => $entrega->chofer?->id,
                        'nombre' => $entrega->chofer?->name,
                    ],
                    'ventas_desvinculadas' => $ventasCount,
                    'ventas_reabiertos_para_reasignacion' => $validated['reabrir_ventas'] ?? false,
                    'motivo_cancelacion' => $validated['motivo'],
                ],
            ], 200);

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

            Log::error('❌ Exception in cancelarEntrega', $errorDetails);

            return response()->json([
                'success' => false,
                'message' => 'Error cancelando entrega',
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
        // Validar que el usuario tiene uno de los roles permitidos
        $rolesPermitidos = ['admin', 'Admin', 'cajero', 'Cajero', 'chofer', 'Chofer'];
        if (!Auth::user()->hasAnyRole($rolesPermitidos)) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para confirmar ventas cargadas. Roles permitidos: ' . implode(', ', $rolesPermitidos),
            ], 403);
        }

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
     * ✅ NUEVO: Obtener resumen de pagos registrados en una entrega
     *
     * GET /api/chofer/entregas/{id}/resumen-pagos
     *
     * Agrupa todas las confirmaciones de ventas por tipo de pago
     * y calcula totales recibidos vs esperados
     */
    public function obtenerResumenPagos(int $id)
    {
        try {
            $entrega = Entrega::with(['ventas' => function ($q) {
                $q->select('id', 'entrega_id', 'numero', 'total', 'estado_logistico_id', 'estado_pago', 'tipo_pago_id')
                  ->with('tipoPago:id,codigo,nombre')
                  ->with(['detalles' => function ($d) {  // ✅ NUEVO: Incluir detalles de productos
                      $d->select('id', 'venta_id', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal')
                        ->with(['producto' => function ($p) {
                            $p->select('id', 'nombre')->with('codigoPrincipal:id,codigo');
                        }]);
                  }]);
            }])->findOrFail($id);

            // ✅ CRÍTICO: Filtrar SOLO ventas NO a crédito (excluir CREDITO del resumen)
            // Las ventas a crédito NO generan dinero en caja y se manejan separadamente
            $ventasParaResumen = $entrega->ventas->filter(function ($v) {
                return $v->estado_pago !== 'CREDITO';
            });

            // Obtener todas las confirmaciones de las ventas NO crédito de esta entrega
            $ventasIds = $ventasParaResumen->pluck('id')->toArray();

            // ✅ ACTUALIZADO 2026-02-17: Incluir TODOS los campos de entregas_venta_confirmaciones
            // NOTE: 'referencia' no es columna directa, está dentro de desglose_pagos JSON
            $confirmaciones = EntregaVentaConfirmacion::select(
                'id', 'entrega_id', 'venta_id', 'tipo_pago_id', 'monto_recibido',
                'fotos', 'firma_digital_url', 'observaciones_logistica',  // ✅ NUEVO: campos de confirmación
                'tipo_entrega', 'tipo_novedad', 'desglose_pagos',
                'total_dinero_recibido', 'monto_pendiente', 'tipo_confirmacion',
                'productos_devueltos', 'monto_devuelto', 'monto_aceptado',  // ✅ NUEVO 2026-02-18: campos de devolución
                'created_at'
            )
            ->with('tipoPago:id,codigo,nombre')
            ->whereIn('venta_id', $ventasIds)
            ->get();

            // Construir resumen con soporte para múltiples pagos
            // ✅ NOTA: total_esperado SOLO incluye ventas NO crédito
            $resumen = [
                'entrega_id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
                'total_esperado' => (float) $ventasParaResumen->sum('total'),  // ✅ Solo no-crédito
                'pagos' => [],
                'sin_registrar' => [],
                'total_recibido' => 0,
            ];

            // Procesar confirmaciones agrupadas por tipo de pago
            $porTipoPago = $confirmaciones->groupBy(function ($item) {
                // Si tiene desglose_pagos (múltiples pagos), agrupar por cada tipo en el desglose
                if (!empty($item->desglose_pagos)) {
                    return 'multiple';
                }
                // Si tiene tipo_pago_id único, agrupar por eso
                return $item->tipo_pago_id;
            });

            foreach ($porTipoPago as $grupoKey => $confirmacionesGrupo) {
                if ($grupoKey === 'multiple') {
                    // ✅ NUEVA 2026-02-12: Procesar múltiples pagos por desglose
                    foreach ($confirmacionesGrupo as $confirmacion) {
                        if (!empty($confirmacion->desglose_pagos)) {
                            foreach ($confirmacion->desglose_pagos as $pago) {
                                $tipoPagoNombre = $pago['tipo_pago_nombre'] ?? 'Desconocido';
                                $tipoPagoCodigo = $this->obtenerCodigoTipoPago($tipoPagoNombre);
                                $montoPago = (float) ($pago['monto'] ?? 0);

                                // Buscar si ya existe este tipo en el resumen
                                $existeIndex = null;
                                foreach ($resumen['pagos'] as $idx => $p) {
                                    if ($p['tipo_pago'] === $tipoPagoNombre) {
                                        $existeIndex = $idx;
                                        break;
                                    }
                                }

                                if ($existeIndex !== null) {
                                    // Actualizar existente
                                    $resumen['pagos'][$existeIndex]['total'] += $montoPago;
                                    $resumen['pagos'][$existeIndex]['cantidad_ventas']++;
                                    $resumen['pagos'][$existeIndex]['ventas'][] = [
                                        'venta_id' => $confirmacion->venta_id,
                                        'venta_numero' => $confirmacion->venta?->numero,
                                        'venta_total' => (float) ($confirmacion->venta?->total ?? 0),
                                        'monto_recibido' => $montoPago,
                                        'referencia' => $pago['referencia'] ?? null,
                                        'tipo_entrega' => $confirmacion->tipo_entrega,
                                        'tipo_novedad' => $confirmacion->tipo_novedad,
                                        // ✅ ACTUALIZADO 2026-02-17: Agregar información de confirmación de entrega
                                        // ✅ FIX 2026-02-26: fotos ya es array por casting en modelo, no decodificar
                                        'fotos' => is_array($confirmacion->fotos) ? $confirmacion->fotos : [],
                                        'firma_digital_url' => $confirmacion->firma_digital_url,
                                        'observaciones_logistica' => $confirmacion->observaciones_logistica,
                                        'detalles' => $confirmacion->venta?->detalles?->map(fn($d) => [  // ✅ NUEVO: Incluir productos
                                            'id' => $d->id,
                                            'producto_id' => $d->producto_id,
                                            'producto_nombre' => $d->producto?->nombre,
                                            'producto_codigo' => $d->producto?->codigoPrincipal?->codigo,
                                            'cantidad' => (float) $d->cantidad,
                                            'precio_unitario' => (float) $d->precio_unitario,
                                            'subtotal' => (float) $d->subtotal,
                                        ])->toArray() ?? [],
                                            // ✅ NUEVO 2026-02-18: Incluir productos devueltos para DEVOLUCION_PARCIAL
                                            'productos_devueltos' => $this->parseProductosDevueltos($confirmacion->productos_devueltos),
                                            'monto_devuelto' => (float) ($confirmacion->monto_devuelto ?? 0),
                                            'monto_aceptado' => (float) ($confirmacion->monto_aceptado ?? 0),
                                    ];
                                } else {
                                    // Crear nuevo tipo
                                    $resumen['pagos'][] = [
                                        'tipo_pago_id' => $pago['tipo_pago_id'] ?? null,
                                        'tipo_pago' => $tipoPagoNombre,
                                        'tipo_pago_codigo' => $tipoPagoCodigo,
                                        'total' => $montoPago,
                                        'cantidad_ventas' => 1,
                                        'ventas' => [[
                                            'venta_id' => $confirmacion->venta_id,
                                            'venta_numero' => $confirmacion->venta?->numero,
                                            'venta_total' => (float) ($confirmacion->venta?->total ?? 0),
                                            'monto_recibido' => $montoPago,
                                            'referencia' => $pago['referencia'] ?? null,
                                            'tipo_entrega' => $confirmacion->tipo_entrega,
                                            'tipo_novedad' => $confirmacion->tipo_novedad,
                                            // ✅ ACTUALIZADO 2026-02-17: Agregar información de confirmación de entrega
                                            // NOTE: fotos is already cast as array in model, so just use it directly
                                            'fotos' => is_array($confirmacion->fotos) ? $confirmacion->fotos : [],
                                            'firma_digital_url' => $confirmacion->firma_digital_url,
                                            'observaciones_logistica' => $confirmacion->observaciones_logistica,
                                            'detalles' => $confirmacion->venta?->detalles?->map(fn($d) => [  // ✅ NUEVO: Incluir productos
                                                'id' => $d->id,
                                                'producto_id' => $d->producto_id,
                                                'producto_nombre' => $d->producto?->nombre,
                                                'producto_codigo' => $d->producto?->codigoPrincipal?->codigo,
                                                'cantidad' => (float) $d->cantidad,
                                                'precio_unitario' => (float) $d->precio_unitario,
                                                'subtotal' => (float) $d->subtotal,
                                            ])->toArray() ?? [],
                                            // ✅ NUEVO 2026-02-18: Incluir productos devueltos para DEVOLUCION_PARCIAL
                                            'productos_devueltos' => $this->parseProductosDevueltos($confirmacion->productos_devueltos),
                                            'monto_devuelto' => (float) ($confirmacion->monto_devuelto ?? 0),
                                            'monto_aceptado' => (float) ($confirmacion->monto_aceptado ?? 0),
                                        ]],
                                    ];
                                }

                                $resumen['total_recibido'] += $montoPago;
                            }
                        }
                    }
                } else {
                    // Procesar pago único (backward compatible)
                    $tipoPago = $confirmacionesGrupo->first()?->tipoPago;
                    $totalPago = (float) $confirmacionesGrupo->sum('total_dinero_recibido');
                    if ($totalPago == 0) {
                        $totalPago = (float) $confirmacionesGrupo->sum('monto_recibido');
                    }
                    $cantidad = $confirmacionesGrupo->count();

                    $resumen['pagos'][] = [
                        'tipo_pago_id' => $grupoKey,
                        'tipo_pago' => $tipoPago?->nombre ?? 'Sin especificar',
                        'tipo_pago_codigo' => $tipoPago?->codigo ?? 'N/A',
                        'total' => $totalPago,
                        'cantidad_ventas' => $cantidad,
                        'ventas' => $confirmacionesGrupo->map(function ($c) {
                            return [
                                'venta_id' => $c->venta_id,
                                'venta_numero' => $c->venta?->numero,
                                'venta_total' => (float) ($c->venta?->total ?? 0),
                                'monto_recibido' => (float) ($c->total_dinero_recibido ?? $c->monto_recibido),
                                'tipo_entrega' => $c->tipo_entrega,
                                'tipo_novedad' => $c->tipo_novedad,
                                // ✅ ACTUALIZADO 2026-02-17: Agregar información de confirmación de entrega
                                // NOTE: fotos is already cast as array in model, so just use it directly
                                'fotos' => is_array($c->fotos) ? $c->fotos : [],
                                'firma_digital_url' => $c->firma_digital_url,
                                'observaciones_logistica' => $c->observaciones_logistica,
                                'detalles' => $c->venta?->detalles?->map(fn($d) => [  // ✅ NUEVO: Incluir productos
                                    'id' => $d->id,
                                    'producto_id' => $d->producto_id,
                                    'producto_nombre' => $d->producto?->nombre,
                                    'producto_codigo' => $d->producto?->codigoPrincipal?->codigo,
                                    'cantidad' => (float) $d->cantidad,
                                    'precio_unitario' => (float) $d->precio_unitario,
                                    'subtotal' => (float) $d->subtotal,
                                ])->toArray() ?? [],
                                // ✅ NUEVO 2026-02-18: Incluir productos devueltos para DEVOLUCION_PARCIAL
                                'productos_devueltos' => $this->parseProductosDevueltos($c->productos_devueltos),
                                'monto_devuelto' => (float) ($c->monto_devuelto ?? 0),
                                'monto_aceptado' => (float) ($c->monto_aceptado ?? 0),
                            ];
                        })->toArray(),
                    ];

                    $resumen['total_recibido'] += $totalPago;
                }
            }

            // Ventas sin confirmación de pago
            // ✅ CRÍTICO: Solo incluir ventas NO crédito en sin_registrar
            $ventasConfirmadas = $confirmaciones->pluck('venta_id')->unique()->toArray();
            $ventasSinPago = $ventasParaResumen->whereNotIn('id', $ventasConfirmadas);  // ✅ Usar ventasParaResumen (filtradas)

            // ✅ IMPORTANTE: Convertir a values() para que sea un array puro, no un map con índices
            if ($ventasSinPago->isNotEmpty()) {
                $resumen['sin_registrar'] = array_values(
                    $ventasSinPago->map(function ($v) {
                        return [
                            'venta_id' => $v->id,
                            'venta_numero' => $v->numero,
                            'monto' => (float) $v->total,
                            'tipo_pago_id' => $v->tipo_pago_id,
                            'tipo_pago' => $v->tipoPago?->nombre ?? 'N/A',
                            'tipo_pago_codigo' => $v->tipoPago?->codigo ?? 'N/A',
                        ];
                    })->toArray()
                );
            }

            // Calcular diferencia
            $resumen['diferencia'] = (float) ($resumen['total_esperado'] - $resumen['total_recibido']);
            $resumen['porcentaje_recibido'] = $resumen['total_esperado'] > 0
                ? round(($resumen['total_recibido'] / $resumen['total_esperado']) * 100, 2)
                : 0;

            return response()->json([
                'success' => true,
                'data' => $resumen,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Error en obtenerResumenPagos:', [
                'entrega_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen de pagos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /// ✅ NUEVA 2026-02-12: Helper para obtener código de tipo de pago por nombre
    private function obtenerCodigoTipoPago(string $nombre): string
    {
        $nombre = strtoupper($nombre);

        if (str_contains($nombre, 'EFECTIVO')) return 'EFECTIVO';
        if (str_contains($nombre, 'TRANSFERENCIA') || str_contains($nombre, 'QR')) return 'TRANSFERENCIA';
        if (str_contains($nombre, 'TARJETA')) return 'TARJETA';
        if (str_contains($nombre, 'CHEQUE')) return 'CHEQUE';
        if (str_contains($nombre, 'CRÉDITO')) return 'CREDITO';

        return 'OTRO';
    }

    /// ✅ NUEVA 2026-02-18: Helper para parsear productos devueltos (JSON) a array
    private function parseProductosDevueltos($productosDevueltosJson): array
    {
        if (empty($productosDevueltosJson)) {
            return [];
        }

        // Si es string (JSON), decodificar
        if (is_string($productosDevueltosJson)) {
            $productos = json_decode($productosDevueltosJson, true);
            return is_array($productos) ? $productos : [];
        }

        // Si ya es array, retornar directamente
        if (is_array($productosDevueltosJson)) {
            return $productosDevueltosJson;
        }

        return [];
    }

    /**
     * 🔧 NUEVO: Actualizar entrega consolidada (modo edición)
     * PATCH /api/entregas/{entrega_id}
     *
     * Reemplaza:
     * - Vehículo asignado
     * - Chofer asignado
     * - Lista de ventas asociadas
     */
    public function actualizarEntregaConsolidada(Request $request, Entrega $entrega)
    {
        try {
            Log::info('🔧 [Actualizar Entrega Consolidada] Request recibida', [
                'entrega_id' => $entrega->id,
                'venta_ids' => $request->input('venta_ids'),
                'vehiculo_id' => $request->input('vehiculo_id'),
                'chofer_id' => $request->input('chofer_id'),
            ]);

            // Validar datos
            $validated = $request->validate([
                'venta_ids' => 'required|array|min:1',
                'venta_ids.*' => 'integer|exists:ventas,id',
                'vehiculo_id' => 'required|integer|exists:vehiculos,id',
                'chofer_id' => 'required|integer|exists:users,id',
                'entregador_id' => 'nullable|integer|exists:users,id',
                'zona_id' => 'nullable|integer',
                'observaciones' => 'nullable|string|max:1000',
                'fecha_programada' => 'nullable|date_format:Y-m-d\TH:i',
                'direccion_entrega' => 'nullable|string|max:500',
            ]);

            // Validar que el vehículo existe
            $vehiculo = \App\Models\Vehiculo::findOrFail($validated['vehiculo_id']);

            // Iniciar transacción
            DB::beginTransaction();

            try {
                // Actualizar datos principales de la entrega
                $entrega->update([
                    'vehiculo_id' => $validated['vehiculo_id'],
                    'chofer_id' => $validated['chofer_id'],
                    'entregador_id' => $validated['entregador_id'] ?? $entrega->entregador_id,
                    'zona_id' => $validated['zona_id'] ?? $entrega->zona_id,
                    'observaciones' => $validated['observaciones'] ?? $entrega->observaciones,
                    'fecha_programada' => $validated['fecha_programada'] ?? $entrega->fecha_programada,
                    'direccion_entrega' => $validated['direccion_entrega'] ?? $entrega->direccion_entrega,
                ]);

                // Reemplazar ventas asociadas
                // Primero, obtener las ventas actuales
                $ventasActuales = $entrega->ventas()->pluck('id')->toArray();
                $ventasNuevas = $validated['venta_ids'];

                // Desasociar ventas que fueron removidas
                $ventasARemover = array_diff($ventasActuales, $ventasNuevas);
                if (!empty($ventasARemover)) {
                    Venta::whereIn('id', $ventasARemover)->update(['entrega_id' => null]);
                }

                // Asociar nuevas ventas
                $ventasAAgregar = array_diff($ventasNuevas, $ventasActuales);
                if (!empty($ventasAAgregar)) {
                    Venta::whereIn('id', $ventasAAgregar)->update(['entrega_id' => $entrega->id]);
                }

                DB::commit();

                Log::info('✅ [Actualizar Entrega] Exitoso', [
                    'entrega_id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'ventas_count' => count($ventasNuevas),
                ]);

                // Disparar evento de actualización
                event(new EntregaAsignada($entrega));

                return response()->json([
                    'success' => true,
                    'message' => 'Entrega actualizada correctamente',
                    'data' => [
                        'id' => $entrega->id,
                        'numero_entrega' => $entrega->numero_entrega,
                        'estado' => $entrega->estado,
                        'vehiculo' => [
                            'id' => $vehiculo->id,
                            'placa' => $vehiculo->placa,
                        ],
                        'chofer' => [
                            'id' => $entrega->chofer_id,
                            'nombre' => $entrega->chofer?->name ?? 'N/A',
                        ],
                        'entregador' => $entrega->entregador ? [
                            'id' => $entrega->entregador?->id,
                            'name' => $entrega->entregador?->name,
                        ] : null,
                        'ventas_count' => count($ventasNuevas),
                    ],
                ], 200);

            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('❌ [Actualizar Entrega] Validación fallida', [
                'entrega_id' => $entrega->id,
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            Log::error('❌ [Actualizar Entrega] Error', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar entrega: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Métodos auxiliares
     */

    /**
     * ✅ NUEVO: Corregir pagos en entrega ya confirmada
     * PATCH /api/entregas/{entrega}/ventas/{venta}/corregir-pago
     */
    public function corregirPagoConfirmacion(Request $request, int $entregaId, int $ventaId)
    {
        try {
            $request->validate([
                'desglose_pagos' => 'required|array',
                'desglose_pagos.*.tipo_pago_id' => 'required|integer|exists:tipos_pago,id',
                'desglose_pagos.*.tipo_pago_nombre' => 'required|string',
                'desglose_pagos.*.monto' => 'required|numeric|min:0',
                'desglose_pagos.*.referencia' => 'nullable|string',
                'observacion' => 'nullable|string|max:500',
            ]);

            $confirmacion = EntregaVentaConfirmacion::where('entrega_id', $entregaId)
                ->where('venta_id', $ventaId)
                ->firstOrFail();

            $venta = Venta::findOrFail($ventaId);
            $desglosePagos = $request->input('desglose_pagos');
            $observacion = $request->input('observacion', '');

            // Calcular nuevo total recibido
            $totalRecibido = collect($desglosePagos)->sum('monto');

            // Determinar nuevo estado_pago
            $esCredito = collect($desglosePagos)->contains(fn($p) =>
                str_contains(strtolower($p['tipo_pago_nombre']), 'crédito') ||
                str_contains(strtolower($p['tipo_pago_nombre']), 'credito')
            );

            if ($totalRecibido >= $venta->total) {
                $estadoPago = 'PAGADO';
            } elseif ($esCredito && $totalRecibido == 0) {
                $estadoPago = 'CREDITO';
            } elseif ($totalRecibido > 0) {
                $estadoPago = 'PARCIAL';
            } else {
                $estadoPago = 'NO_PAGADO';
            }

            $montoPendiente = max(0, $venta->total - $totalRecibido);

            // Construir nuevo texto de observación con timestamp
            $observacionNueva = $confirmacion->observaciones_logistica ?? '';
            if ($observacion) {
                $prefix = $observacionNueva ? ' | ' : '';
                $observacionNueva .= $prefix . '[CORRECCIÓN ' . now()->format('d/m/Y H:i') . '] ' . $observacion;
            }

            // Actualizar confirmación
            $confirmacion->update([
                'desglose_pagos' => $desglosePagos,
                'total_dinero_recibido' => $totalRecibido,
                'monto_recibido' => $totalRecibido,
                'estado_pago' => $estadoPago,
                'monto_pendiente' => $montoPendiente,
                'observaciones_logistica' => $observacionNueva,
            ]);

            // Log de auditoría
            \Log::channel('default')->info('Pagos corregidos en entrega', [
                'entrega_id' => $entregaId,
                'venta_id' => $ventaId,
                'total_anterior' => $totalRecibido,
                'nuevo_estado' => $estadoPago,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pagos corregidos exitosamente',
                'confirmacion' => $confirmacion->fresh(),
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error al corregir pagos', [
                'entrega_id' => $entregaId,
                'venta_id' => $ventaId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al corregir pagos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/ventas/{ventaId}/entrega
     * Obtener detalles de la entrega asociada a una venta (2026-02-17)
     *
     * Usado por: Flutter app venta_detalle_screen para mostrar info de entrega
     */
    public function obtenerEntregaPorVenta($ventaId)
    {
        try {
            $venta = Venta::find($ventaId);

            if (!$venta) {
                return response()->json([
                    'success' => false,
                    'message' => 'Venta no encontrada',
                ], 404);
            }

            // Buscar entrega que contenga esta venta
            $entrega = Entrega::whereHas('ventas', function ($q) use ($ventaId) {
                $q->where('ventas.id', $ventaId);
            })
            ->with([
                'chofer',
                'vehiculo',
                'estadoEntrega',
                'ventas.cliente',
                'ventas.tipoPago',
                'ventas.detalles.producto',
            ])
            ->first();

            // Si no hay entrega asignada, retornar null
            if (!$entrega) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'Venta sin entrega asignada',
                ]);
            }

            // Construir respuesta con datos de entrega
            $data = [
                'id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
                'estado' => $entrega->estado,
                'estado_codigo' => $entrega->estadoEntregaCodigo,
                'estado_nombre' => $entrega->estadoEntregaNombre,
                'estado_color' => $entrega->estadoEntregaColor,
                'estado_icono' => $entrega->estadoEntregaIcono,
                'fecha_asignacion' => $entrega->fecha_asignacion?->format('Y-m-d H:i'),
                'fecha_inicio' => $entrega->fecha_inicio?->format('Y-m-d H:i'),
                'fecha_entrega' => $entrega->fecha_entrega?->format('Y-m-d H:i'),
                'observaciones' => $entrega->observaciones,
                'motivo_novedad' => $entrega->motivo_novedad,
                'chofer' => $entrega->chofer ? [
                    'id' => $entrega->chofer->id,
                    'nombre' => $entrega->chofer->name,
                    'telefono' => $entrega->chofer->phone,
                ] : null,
                'vehiculo' => $entrega->vehiculo ? [
                    'id' => $entrega->vehiculo->id,
                    'placa' => $entrega->vehiculo->placa,
                    'marca' => $entrega->vehiculo->marca,
                    'modelo' => $entrega->vehiculo->modelo,
                ] : null,
                'cantidad_ventas' => $entrega->ventas->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Error al obtener entrega por venta', [
                'venta_id' => $ventaId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información de entrega',
            ], 500);
        }
    }

    /**
     * ✅ NUEVO 2026-02-21: Cambiar tipo de entrega de una venta
     * PATCH /api/entregas/{entrega}/ventas/{venta}/cambiar-tipo-entrega
     *
     * Permite cambiar el tipo de entrega (COMPLETA ↔ CON_NOVEDAD) de una venta ya confirmada
     *
     * @param Request $request
     * @param int $entregaId
     * @param int $ventaId
     * @return JsonResponse
     */
    public function cambiarTipoEntrega(Request $request, int $entregaId, int $ventaId)
    {
        try {
            $validated = $request->validate([
                'tipo_entrega' => 'required|in:COMPLETA,CON_NOVEDAD',
                'tipo_novedad' => 'required_if:tipo_entrega,CON_NOVEDAD|in:DEVOLUCION_PARCIAL,RECHAZADA,NO_CONTACTADO,CLIENTE_CERRADO',
            ]);

            $confirmacion = EntregaVentaConfirmacion::where('entrega_id', $entregaId)
                ->where('venta_id', $ventaId)
                ->firstOrFail();

            $tipoEntrega = $validated['tipo_entrega'];
            $tipoNovedad = $validated['tipo_novedad'] ?? null;

            // Actualizar confirmación con nuevo tipo de entrega
            $confirmacion->update([
                'tipo_entrega' => $tipoEntrega,
                'tipo_novedad' => $tipoNovedad,
            ]);

            // Log de auditoría
            Log::info('✅ Tipo de entrega actualizado', [
                'entrega_id' => $entregaId,
                'venta_id' => $ventaId,
                'tipo_entrega' => $tipoEntrega,
                'tipo_novedad' => $tipoNovedad,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => $tipoEntrega === 'COMPLETA'
                    ? 'Entrega marcada como completa'
                    : 'Entrega marcada con novedad',
                'data' => $confirmacion->fresh(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Confirmación de entrega no encontrada',
            ], 404);
        } catch (\Throwable $e) {
            \Log::error('Error al cambiar tipo de entrega', [
                'entrega_id' => $entregaId,
                'venta_id' => $ventaId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar tipo de entrega',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ MEJORADO: Guardar archivo desde Base64 en almacenamiento real
     *
     * Soporta:
     * - Storage local (storage/app/public/)
     * - S3 AWS (configuración en .env)
     *
     * @param string $base64 - Contenido en Base64
     * @param string $carpeta - Carpeta destino (entregas, firmas, novedades)
     * @return string - URL del archivo guardado
     */
    private function guardarArchivoBase64(string $base64, string $carpeta): string
    {
        try {
            // Decodificar Base64
            $imagenDecodificada = base64_decode(
                preg_replace('#^data:image/\w+;base64,#i', '', $base64),
                true
            );

            if ($imagenDecodificada === false) {
                Log::warning('❌ Error decodificando Base64 en guardarArchivoBase64', [
                    'carpeta' => $carpeta,
                    'base64_length' => strlen($base64),
                ]);
                return '';
            }

            // Generar nombre único
            $timestamp = now()->format('YmdHis');
            $random = substr(md5($base64), 0, 8);
            $nombreArchivo = "{$carpeta}/{$timestamp}_{$random}.jpg";

            // Guardar en storage
            \Storage::disk('public')->put($nombreArchivo, $imagenDecodificada);

            // Retornar URL completa
            $url = \Storage::disk('public')->url($nombreArchivo);

            Log::info('✅ Archivo guardado correctamente', [
                'carpeta' => $carpeta,
                'nombre' => $nombreArchivo,
                'url' => $url,
                'tamaño_bytes' => strlen($imagenDecodificada),
            ]);

            return $url;

        } catch (\Exception $e) {
            Log::error('❌ Error guardando archivo Base64', [
                'carpeta' => $carpeta,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return '';
        }
    }
}
