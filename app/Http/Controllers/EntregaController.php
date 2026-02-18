<?php
namespace App\Http\Controllers;

use App\Exceptions\Venta\EstadoInvalidoException;
use App\Http\Traits\ApiInertiaUnifiedResponse;
use App\Models\Empleado;
use App\Models\Entrega;
use App\Models\EstadoLogistica;
use App\Models\Venta;
use App\Models\Vehiculo;
use App\Services\ImpresionEntregaService;
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
        private ImpresionEntregaService $impresionService,
    ) {
        $this->middleware('permission:entregas.index')->only('index');
        $this->middleware('permission:entregas.show')->only('show');
        $this->middleware('permission:entregas.create')->only(['create', 'store']);
        $this->middleware('permission:entregas.manage')->only([
            'asignarChoferVehiculo',
            'iniciar',
            'confirmar',
            'confirmarCarga',
            'marcarListoParaEntrega',
            'iniciarTransito', // ✅ FASE 1: Necesita permiso de manejo
            'registrarLlegada',
            'reportarNovedad',
            'rechazar',
        ]);
    }

    /**
     * Listar entregas - Vista unificada (simple + dashboard)
     *
     * PARÁMETROS DE FILTRADO (TODO AL BACKEND):
     * - ?view=simple|dashboard (default: 'simple')
     * - ?estado=... (filtro estado entrega)
     * - ?fecha_desde=... (filtro fecha programada desde)
     * - ?fecha_hasta=... (filtro fecha programada hasta)
     * - ?chofer_id=... (filtro por chofer)
     * - ?vehiculo_id=... (filtro por vehículo)
     * - ?localidad_id=... (filtro por zona/localidad)
     * - ?estado_logistica_id=... (filtro por estado logístico)
     * - ?search=... (búsqueda general)
     * - ?per_page=15 (paginación)
     *
     * La vista dashboard carga stats vía hook (lazy load) para mejor performance
     */
    public function index(Request $request): InertiaResponse
    {
        $perPage = $request->input('per_page', 15);
        $view    = $request->input('view', 'simple'); // Detectar vista solicitada

        $filtros = [
            'estado'              => $request->input('estado'),
            'fecha_desde'         => $request->input('fecha_desde'),
            'fecha_hasta'         => $request->input('fecha_hasta'),
            'chofer_id'           => $request->input('chofer_id'),
            'vehiculo_id'         => $request->input('vehiculo_id'),
            'localidad_id'        => $request->input('localidad_id'),
            'estado_logistica_id' => $request->input('estado_logistica_id'),
            'search'              => $request->input('search'),
            'view'                => $view, // ✅ NUEVO: Pasar vista actual al frontend
        ];

        // 🔍 DEBUG: Logging de parámetros recibidos
        \Log::info('📋 [EntregaController::index] Parámetros recibidos:', [
            'fecha_desde' => $filtros['fecha_desde'],
            'fecha_hasta' => $filtros['fecha_hasta'],
            'estado' => $filtros['estado'],
            'todos_filtros' => $filtros,
            'fecha_hoy' => today()->toDateString(),
        ]);

        $entregas = \App\Models\Entrega::query()
            ->with(['ventas.cliente', 'vehiculo', 'chofer', 'entregador', 'localidad'])
            // ✅ CORRECCIÓN: Si hay rango de fechas, filtrar por fecha_programada. Si no, mostrar solo HOY
            ->when(
                !$filtros['fecha_desde'] && !$filtros['fecha_hasta'],
                fn($q) => $q->whereDate('created_at', today()),  // Default: solo entregas creadas HOY
                fn($q) => $q  // Si hay fechas, continuar sin filtro de created_at
            )
            ->when($filtros['estado'], fn($q, $estado) => $q->where('estado', $estado))
            ->when($filtros['fecha_desde'], function ($q, $fecha) {
                \Log::info('📅 Filtrando por fecha_desde: ' . $fecha . ' (>= este valor)');
                return $q->whereDate('fecha_programada', '>=', $fecha);
            })
            ->when($filtros['fecha_hasta'], function ($q, $fecha) {
                \Log::info('📅 Filtrando por fecha_hasta: ' . $fecha . ' (<= este valor)');
                return $q->whereDate('fecha_programada', '<=', $fecha);
            })
            ->when($filtros['chofer_id'], fn($q, $choferId) => $q->where('chofer_id', $choferId))
            ->when($filtros['vehiculo_id'], fn($q, $vehiculoId) => $q->where('vehiculo_id', $vehiculoId))
            ->when($filtros['localidad_id'], fn($q, $localidadId) => $q->where('zona_id', $localidadId))
            ->when($filtros['estado_logistica_id'], fn($q, $estadoId) => $q->where('estado_entrega_id', $estadoId))
            ->when($filtros['search'], function ($q, $search) {
                $searchLower = strtolower($search);
                // ✅ CASE INSENSITIVE: Buscar en clientes de TODAS las ventas, número de venta, placa, chofer
                $q->where(function ($query) use ($searchLower) {
                    // 1️⃣ Buscar en datos del cliente de CUALQUIERA de las ventas asociadas a la entrega
                    // Una entrega tiene muchas ventas (1:N), cada venta tiene un cliente (N:1)
                    $query->whereHas('ventas', function ($ventaQuery) use ($searchLower) {
                        $ventaQuery->whereHas('cliente', function ($clienteQuery) use ($searchLower) {
                            $clienteQuery->where(function ($q) use ($searchLower) {
                                // Buscar en nombre del cliente
                                $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$searchLower}%"])
                                // Buscar en teléfono del cliente
                                ->orWhereRaw('LOWER(telefono) LIKE ?', ["%{$searchLower}%"])
                                // Buscar en NIT del cliente
                                ->orWhereRaw('LOWER(nit) LIKE ?', ["%{$searchLower}%"]);
                            });
                        });
                    })
                    // 2️⃣ Buscar en número de cualquiera de las ventas
                    ->orWhereHas('ventas', fn($q) =>
                        $q->whereRaw('LOWER(numero) LIKE ?', ["%{$searchLower}%"])
                    )
                    // 3️⃣ Buscar en placa del vehículo
                    ->orWhereHas('vehiculo', fn($q) =>
                        $q->whereRaw('LOWER(placa) LIKE ?', ["%{$searchLower}%"])
                    )
                    // 4️⃣ Buscar en nombre del chofer
                    ->orWhereHas('chofer', fn($q) =>
                        $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                    );
                });
            })
            ->orderBy('created_at', 'desc') // ✅ Ordenar por fecha de creación (más nuevo primero)
            ->paginate($perPage);

        // 🔍 DEBUG: Logging de resultados
        \Log::info('📊 [EntregaController::index] Resultados de consulta:', [
            'total_entregas_encontradas' => $entregas->total(),
            'entregas_en_pagina' => $entregas->count(),
            'pagina_actual' => $entregas->currentPage(),
            'ultima_pagina' => $entregas->lastPage(),
            'primera_entrega_fecha_programada' => $entregas->first()?->fecha_programada,
            'sql_query' => (string) $entregas->getCollection()->getQueueableConnection(),
        ]);

        // Cargar vehículos y choferes para optimización
        $vehiculos = Vehiculo::disponibles()
            ->with('choferAsignado') // 🔧 Cargar relación de chofer asignado (User)
            ->get(['id', 'placa', 'marca', 'modelo', 'capacidad_kg', 'chofer_asignado_id']);

        // Obtener solo empleados que son choferes activos
        // ✅ ARREGLADO: Transformar en array con solo id y nombre
        // ✅ CASO-INSENSITIVE: Busca "Chofer" o "chofer"
        $choferes = Empleado::query()
            ->with('user.roles')
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) =>
                $e->user !== null &&
                $e->user->roles->some(fn($role) => strtolower($role->name) === 'chofer')
            )
            ->map(fn($e) => [
                'id' => $e->user->id,
                'nombre' => $e->user->name
            ])
            ->values()
            ->toArray();

        // ✅ NUEVO: Obtener localidades para filtro (todas, sin filtro de activo)
        $localidades = \App\Models\Localidad::orderBy('nombre')
            ->get(['id', 'nombre', 'codigo'])
            ->toArray();


        // ✅ NUEVO: Obtener estados logísticos para filtro (todos, sin filtro de activo)
        $estadosLogisticos = \App\Models\EstadoLogistica::where('categoria', 'entrega')
            ->orderBy('orden')
            ->get(['id', 'codigo', 'nombre', 'color', 'icono'])
            ->toArray();


        return Inertia::render('logistica/entregas/index', [
            'entregas'          => $entregas,
            'filtros'           => $filtros,
            'vehiculos'         => $vehiculos,
            'choferes'          => $choferes,
            'localidades'       => $localidades,
            'estadosLogisticos' => $estadosLogisticos,
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
                'id'       => $v->id,
                'numero'   => $v->numero,
                'cliente'  => $v->cliente?->nombre,
                'detalles' => $v->detalles?->count(),
                'total'    => $v->total,
            ]);

        return response()->json([
            'ventas_con_entregas' => count($ventasConEntregas),
            'ventas_sin_entregas' => count($ventasSinEntregas),
            'ids_con_entregas'    => $ventasConEntregas,
            'ventas_disponibles'  => $ventasSinEntregas,
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        // 1. Detectar modo basado en parámetro (opcional)
        $ventaPreseleccionada = $request->input('venta_id');

        // 2. Obtener ventas sin entregas asignadas - PAGINADAS
        // Phase 3: Solo mostrar ventas que no tienen entrega_id asignado (FK)
        // Una venta puede estar en múltiples entregas consolidadas (pivot),
        // pero solo si no tiene una entrega principal asignada
        // ✅ NUEVO: Paginar para evitar carga inicial lenta
        // ✅ NUEVO: Solo ventas APROBADAS (estado_documento_id = 3)
        $perPage = 25; // Mostrar 25 ventas por página
        $ventasQuery = \App\Models\Venta::query()
            ->with([
                'cliente.direcciones', // Cargar direcciones del cliente (fallback)
                'cliente.localidad',   // Cargar localidad del cliente para agrupar
                'detalles.producto',
                'estadoDocumento',
                'direccionCliente', // Dirección específica de la venta (prioridad)
            ])
            ->whereNull('entrega_id')       // ✅ Phase 3: No tiene entrega principal asignada
            ->where('requiere_envio', true) // ✅ Solo ventas que requieren envío
            ->where('estado_documento_id', 3) // ✅ NUEVO: Solo ventas APROBADAS (ID 3)
            ->where('tipo_entrega', 'DELIVERY')    // ✅ NUEVO: Solo ventas DELIVERY
            ->whereDate('created_at', today())     // ✅ NUEVO: Solo ventas creadas hoy
            ->whereNotNull('cliente_id')    // Debe tener cliente
            ->whereHas('detalles')          // Debe tener detalles de productos
            ->latest();

        // Paginar en lugar de obtener todo
        $ventasPaginated = $ventasQuery->paginate($perPage);

        $ventas = $ventasPaginated->getCollection()
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
                    $dirPrincipal = $venta->cliente->direcciones->firstWhere('es_principal', true) ?? $venta->cliente->direcciones->first();
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
                    'id'           => $venta->id,
                    'numero_venta' => $venta->numero ?? "V-{$venta->id}",
                    'numero'                     => $venta->numero,
                    'subtotal'                   => (float) $venta->subtotal,                   // ✅ NUEVO: Sin impuesto
                    'peso_total_estimado'        => (float) ($venta->peso_total_estimado ?? 0), // ✅ NUEVO: Peso pre-calculado
                    'peso_estimado'              => (float) ($venta->peso_total_estimado ?? 0), // Fallback para compatibilidad
                    'fecha_venta'                => $venta->fecha?->format('Y-m-d'),
                    'fecha'                      => $venta->fecha?->format('Y-m-d'),
                    'created_at'                 => $venta->created_at?->format('Y-m-d H:i'), // ✅ NUEVO: Fecha y hora de creación
                    'estado'                     => $venta->estadoDocumento?->nombre ?? 'Sin estado',
                    'cliente'                    => [
                        'id'        => $venta->cliente?->id,
                        'nombre'    => $venta->cliente?->nombre ?? 'Cliente no disponible',
                        'telefono'  => $venta->cliente?->telefono,
                        'localidad' => [
                            'id'     => $venta->cliente?->localidad?->id,
                            'nombre' => $venta->cliente?->localidad?->nombre ?? 'Sin localidad',
                        ],
                    ],
                    // Dirección de entrega (desde proforma/confirmada o fallback a cliente)
                    'direccionCliente'           => $direccionCliente,
                    // Datos de entrega comprometida (heredados de proforma)
                    'fecha_entrega_comprometida' => $venta->fecha_entrega_comprometida?->format('Y-m-d'),
                    'hora_entrega_comprometida'  => $venta->hora_entrega_comprometida?->format('H:i'),
                    'ventana_entrega_ini'        => $venta->ventana_entrega_ini?->format('H:i'),
                    'ventana_entrega_fin'        => $venta->ventana_entrega_fin?->format('H:i'),
                    // Datos para batch UI
                    'cantidad_items'             => $venta->detalles?->count() ?? 0,
                    'detalles'                   => $venta->detalles?->toArray() ?? [],
                ];
            });

        // 3. Obtener todos los vehículos SIN restricción de estado (usuario puede seleccionar cualquiera)
        $vehiculos = Vehiculo::query()
            ->with('choferAsignado') // 🔧 Cargar relación de chofer asignado (User)
            ->orderBy('placa')
            ->get()
            ->map(fn($v) => [
                'id'                 => $v->id,
                'placa'              => $v->placa,
                'marca'              => $v->marca,
                'modelo'             => $v->modelo,
                'anho'               => $v->anho,
                'capacidad_carga'    => $v->capacidad_kg,
                'capacidad_kg'       => $v->capacidad_kg,
                'estado'             => $v->estado,
                'activo'             => $v->activo,
                'chofer_asignado_id' => $v->chofer_asignado_id, // 🔧 Incluir ID del chofer
                                                                // 🔧 Incluir datos del chofer si existe (User)
                'chofer'             => $v->choferAsignado ? [
                    'id'     => $v->choferAsignado->id,
                    'name'   => $v->choferAsignado->name,
                    'nombre' => $v->choferAsignado->name,
                    'email'  => $v->choferAsignado->email,
                ] : null,
            ]);

        // 4. Obtener choferes activos (solo empleados con rol Chofer)
        // ✅ IMPORTANTE: Devolver user_id (no empleado.id) porque CrearEntregaPorLocalidadService::validarChofer()
        //    espera recibir el ID del User, no del Empleado
        $choferes = Empleado::query()
            ->with('user.roles')
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) => $e->user !== null && $e->user->hasRole('Chofer'))
            ->map(fn($e) => [
                'id'             => $e->user_id,  // ✅ CAMBIO: user_id en lugar de empleado.id
                'empleado_id'    => $e->id,       // ✅ NUEVO: Incluir empleado.id como referencia
                'name'           => $e->user->name ?? $e->nombre,
                'nombre'         => $e->user->name ?? $e->nombre,
                'email'          => $e->user->email ?? $e->email,
                'telefono'       => $e->telefono,
                'tiene_licencia' => $e->licencia ? true : false,
            ])
            ->values();

        // 5. Renderizar con una sola página unificada
        // ✅ NUEVO: Incluir información de paginación
        return Inertia::render('logistica/entregas/create', [
            'ventas'               => $ventas,
            'paginacion'           => [
                'current_page' => $ventasPaginated->currentPage(),
                'per_page'     => $ventasPaginated->perPage(),
                'total'        => $ventasPaginated->total(),
                'last_page'    => $ventasPaginated->lastPage(),
                'has_more'     => $ventasPaginated->hasMorePages(),
            ],
            'vehiculos'            => $vehiculos,
            'choferes'             => $choferes,
            'ventaPreseleccionada' => $ventaPreseleccionada,
        ]);
    }

    /**
     * EDITAR entrega existente
     * GET /logistica/entregas/{id}/edit
     *
     * Reutiliza el mismo formulario que create pero con datos preacargados
     * Permite:
     * - Ver ventas actualmente asignadas
     * - Agregar más ventas
     * - Cambiar vehículo
     * - Cambiar chofer
     */
    public function edit(Entrega $entrega): InertiaResponse
    {
        // 1. Obtener ventas ACTUALMENTE ASIGNADAS a esta entrega
        $ventasAsignadas = $entrega->ventas()
            ->with([
                'cliente.direcciones',
                'cliente.localidad',
                'detalles.producto',
                'estadoDocumento',
                'direccionCliente',
            ])
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
                    $dirPrincipal = $venta->cliente->direcciones->firstWhere('es_principal', true) ?? $venta->cliente->direcciones->first();
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
                    'id'                          => $venta->id,
                    'numero_venta'                => $venta->numero ?? "V-{$venta->id}",
                    'numero'                      => $venta->numero,
                    'subtotal'                    => (float) $venta->subtotal,
                    'peso_total_estimado'         => (float) ($venta->peso_total_estimado ?? 0),
                    'peso_estimado'               => (float) ($venta->peso_total_estimado ?? 0),
                    'fecha_venta'                 => $venta->fecha?->format('Y-m-d'),
                    'fecha'                       => $venta->fecha?->format('Y-m-d'),
                    'estado'                      => $venta->estadoDocumento?->nombre ?? 'Sin estado',
                    'cliente'                     => [
                        'id'        => $venta->cliente?->id,
                        'nombre'    => $venta->cliente?->nombre ?? 'Cliente no disponible',
                        'telefono'  => $venta->cliente?->telefono,
                        'localidad' => [
                            'id'     => $venta->cliente?->localidad?->id,
                            'nombre' => $venta->cliente?->localidad?->nombre ?? 'Sin localidad',
                        ],
                    ],
                    'direccionCliente'            => $direccionCliente,
                    'fecha_entrega_comprometida'  => $venta->fecha_entrega_comprometida?->format('Y-m-d'),
                    'hora_entrega_comprometida'   => $venta->hora_entrega_comprometida?->format('H:i'),
                    'ventana_entrega_ini'         => $venta->ventana_entrega_ini?->format('H:i'),
                    'ventana_entrega_fin'         => $venta->ventana_entrega_fin?->format('H:i'),
                    'cantidad_items'              => $venta->detalles?->count() ?? 0,
                    'detalles'                    => $venta->detalles?->toArray() ?? [],
                    'created_at'                  => $venta->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        // 2. Obtener ventas sin entrega (para agregar más)
        $perPage = 25;
        $ventasDisponiblesQuery = \App\Models\Venta::query()
            ->with([
                'cliente.direcciones',
                'cliente.localidad',
                'detalles.producto',
                'estadoDocumento',
                'direccionCliente',
            ])
            ->whereNull('entrega_id')
            ->where('requiere_envio', true)
            ->where('estado_documento_id', 3) // Solo APROBADAS
            ->whereNotNull('cliente_id')
            ->whereHas('detalles')
            ->whereDate('created_at', today()) // ✅ NUEVO: Solo ventas creadas HOY por defecto
            ->latest();

        $ventasDisponiblesPaginated = $ventasDisponiblesQuery->paginate($perPage);

        $ventasDisponibles = $ventasDisponiblesPaginated->getCollection()
            ->map(function ($venta) {
                $direccionCliente = null;
                if ($venta->direccionCliente) {
                    $direccionCliente = [
                        'id'        => $venta->direccionCliente->id,
                        'direccion' => $venta->direccionCliente->direccion,
                        'latitud'   => $venta->direccionCliente->latitud,
                        'longitud'  => $venta->direccionCliente->longitud,
                    ];
                } elseif ($venta->cliente?->direcciones?->count()) {
                    $dirPrincipal = $venta->cliente->direcciones->firstWhere('es_principal', true) ?? $venta->cliente->direcciones->first();
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
                    'id'                          => $venta->id,
                    'numero_venta'                => $venta->numero ?? "V-{$venta->id}",
                    'numero'                      => $venta->numero,
                    'subtotal'                    => (float) $venta->subtotal,
                    'peso_total_estimado'         => (float) ($venta->peso_total_estimado ?? 0),
                    'peso_estimado'               => (float) ($venta->peso_total_estimado ?? 0),
                    'fecha_venta'                 => $venta->fecha?->format('Y-m-d'),
                    'fecha'                       => $venta->fecha?->format('Y-m-d'),
                    'estado'                      => $venta->estadoDocumento?->nombre ?? 'Sin estado',
                    'cliente'                     => [
                        'id'        => $venta->cliente?->id,
                        'nombre'    => $venta->cliente?->nombre ?? 'Cliente no disponible',
                        'telefono'  => $venta->cliente?->telefono,
                        'localidad' => [
                            'id'     => $venta->cliente?->localidad?->id,
                            'nombre' => $venta->cliente?->localidad?->nombre ?? 'Sin localidad',
                        ],
                    ],
                    'direccionCliente'            => $direccionCliente,
                    'fecha_entrega_comprometida'  => $venta->fecha_entrega_comprometida?->format('Y-m-d'),
                    'hora_entrega_comprometida'   => $venta->hora_entrega_comprometida?->format('H:i'),
                    'ventana_entrega_ini'         => $venta->ventana_entrega_ini?->format('H:i'),
                    'ventana_entrega_fin'         => $venta->ventana_entrega_fin?->format('H:i'),
                    'cantidad_items'              => $venta->detalles?->count() ?? 0,
                    'detalles'                    => $venta->detalles?->toArray() ?? [],
                    'created_at'                  => $venta->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        // 3. Obtener solo vehículos ACTIVOS en modo edición
        // ✅ NUEVO (2026-02-12): En edit mode, mostrar SOLO vehículos activos
        $vehiculos = Vehiculo::query()
            ->where('activo', true)  // ✅ Solo vehículos activos
            ->with('choferAsignado')
            ->orderBy('placa')
            ->get()
            ->map(fn($v) => [
                'id'                 => $v->id,
                'placa'              => $v->placa,
                'marca'              => $v->marca,
                'modelo'             => $v->modelo,
                'anho'               => $v->anho,
                'capacidad_carga'    => $v->capacidad_kg,
                'capacidad_kg'       => $v->capacidad_kg,
                'estado'             => $v->estado,
                'activo'             => $v->activo,
                'chofer_asignado_id' => $v->chofer_asignado_id,
                'chofer'             => $v->choferAsignado ? [
                    'id'     => $v->choferAsignado->id,
                    'name'   => $v->choferAsignado->name,
                    'nombre' => $v->choferAsignado->name,
                    'email'  => $v->choferAsignado->email,
                ] : null,
            ]);

        // 4. Obtener choferes activos
        $choferes = Empleado::query()
            ->with('user.roles')
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) => $e->user !== null && $e->user->hasRole('Chofer'))
            ->map(fn($e) => [
                'id'             => $e->user_id,
                'empleado_id'    => $e->id,
                'name'           => $e->user->name ?? $e->nombre,
                'nombre'         => $e->user->name ?? $e->nombre,
                'email'          => $e->user->email ?? $e->email,
                'telefono'       => $e->telefono,
                'tiene_licencia' => $e->licencia ? true : false,
            ])
            ->values();

        // 5. Renderizar con modo edición
        return Inertia::render('logistica/entregas/create', [
            'modo'                   => 'editar',  // 🔧 Nuevo: indicar que estamos en modo edición
            'entrega'                => [
                'id'                 => $entrega->id,
                'numero_entrega'     => $entrega->numero_entrega,
                'estado'             => $entrega->estado,
                'fecha_programada'   => $entrega->fecha_programada?->format('Y-m-d'),
                'vehiculo_id'        => $entrega->vehiculo_id,
                'chofer_id'          => $entrega->chofer_id,
                'entregador_id'      => $entrega->entregador_id,
                'peso_kg'            => $entrega->peso_kg,
                'volumen_m3'         => $entrega->volumen_m3,
            ],
            'ventasAsignadas'        => $ventasAsignadas,  // 🔧 Nuevo: ventas actuales
            'ventas'                 => $ventasDisponibles,  // Ventas disponibles para agregar
            'paginacion'             => [
                'current_page' => $ventasDisponiblesPaginated->currentPage(),
                'per_page'     => $ventasDisponiblesPaginated->perPage(),
                'total'        => $ventasDisponiblesPaginated->total(),
                'last_page'    => $ventasDisponiblesPaginated->lastPage(),
                'has_more'     => $ventasDisponiblesPaginated->hasMorePages(),
            ],
            'vehiculos'              => $vehiculos,
            'choferes'               => $choferes,
            'ventaPreseleccionada'   => null,
        ]);
    }

    /**
     * Buscar ventas por criterios (para búsqueda en BD)
     *
     * GET /api/entregas/ventas/search?q=...&fecha_desde=...&fecha_hasta=...
     *
     * Parámetros:
     * - q: término de búsqueda (venta, cliente, localidad)
     * - fecha_desde: filtrar desde fecha
     * - fecha_hasta: filtrar hasta fecha
     * - page: número de página (default: 1)
     *
     * ✅ NUEVO: Búsqueda en la base de datos, no client-side
     */
    public function searchVentas(Request $request): JsonResponse
    {
        $searchTerm = $request->input('q', '');
        $fechaDesde = $request->input('fecha_desde');
        $fechaHasta = $request->input('fecha_hasta');
        $page = $request->input('page', 1);
        $perPage = 25;

        $query = \App\Models\Venta::query()
            ->with([
                'cliente.direcciones',
                'cliente.localidad',
                'detalles.producto',
                'estadoDocumento',
                'direccionCliente',
            ])
            ->whereNull('entrega_id')
            ->where('requiere_envio', true)
            ->where('estado_documento_id', 3) // ✅ NUEVO: Solo ventas APROBADAS
            ->whereNotNull('cliente_id')
            ->whereHas('detalles');

        // Aplicar búsqueda si existe término
        if ($searchTerm) {
            $searchLower = strtolower($searchTerm);
            $query->where(function ($q) use ($searchLower) {
                // ✅ Buscar en ID de venta (número)
                $q->where('id', $searchLower)
                    // ✅ Buscar en número de venta
                    ->orWhereRaw('LOWER(numero) LIKE ?', ["%{$searchLower}%"])
                    // ✅ Buscar en nombre del cliente
                    ->orWhereHas('cliente', fn($clienteQ) =>
                        $clienteQ->whereRaw('LOWER(nombre) LIKE ?', ["%{$searchLower}%"])
                    )
                    // ✅ NUEVO: Buscar en teléfono del cliente
                    ->orWhereHas('cliente', fn($clienteQ) =>
                        $clienteQ->whereRaw('LOWER(telefono) LIKE ?', ["%{$searchLower}%"])
                    )
                    // ✅ NUEVO: Buscar en NIT del cliente
                    ->orWhereHas('cliente', fn($clienteQ) =>
                        $clienteQ->whereRaw('LOWER(nit) LIKE ?', ["%{$searchLower}%"])
                    )
                    // ✅ Buscar en localidad del cliente
                    ->orWhereHas('cliente.localidad', fn($localidadQ) =>
                        $localidadQ->whereRaw('LOWER(nombre) LIKE ?', ["%{$searchLower}%"])
                    );
            });
        }

        // Aplicar filtros de fecha
        if ($fechaDesde) {
            $query->whereDate('fecha', '>=', $fechaDesde);
        }
        if ($fechaHasta) {
            $query->whereDate('fecha', '<=', $fechaHasta);
        }

        // Paginar resultados
        $ventasPaginated = $query->latest()->paginate($perPage, ['*'], 'page', $page);

        // Transformar datos
        $ventas = $ventasPaginated->getCollection()->map(function ($venta) {
            $direccionCliente = null;
            if ($venta->direccionCliente) {
                $direccionCliente = [
                    'id'        => $venta->direccionCliente->id,
                    'direccion' => $venta->direccionCliente->direccion,
                    'latitud'   => $venta->direccionCliente->latitud,
                    'longitud'  => $venta->direccionCliente->longitud,
                ];
            } elseif ($venta->cliente?->direcciones?->count()) {
                $dirPrincipal = $venta->cliente->direcciones->firstWhere('es_principal', true) ?? $venta->cliente->direcciones->first();
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
                'id'                             => $venta->id,
                'numero_venta'                   => $venta->numero ?? "V-{$venta->id}",
                'numero'                         => $venta->numero,
                'subtotal'                       => (float) $venta->subtotal,
                'peso_total_estimado'            => (float) ($venta->peso_total_estimado ?? 0),
                'peso_estimado'                  => (float) ($venta->peso_total_estimado ?? 0),
                'fecha_venta'                    => $venta->fecha?->format('Y-m-d'),
                'fecha'                          => $venta->fecha?->format('Y-m-d'),
                'estado'                         => $venta->estadoDocumento?->nombre ?? 'Sin estado',
                'cliente'                        => [
                    'id'        => $venta->cliente?->id,
                    'nombre'    => $venta->cliente?->nombre ?? 'Cliente no disponible',
                    'telefono'  => $venta->cliente?->telefono,
                    'localidad' => [
                        'id'     => $venta->cliente?->localidad?->id,
                        'nombre' => $venta->cliente?->localidad?->nombre ?? 'Sin localidad',
                    ],
                ],
                'direccionCliente'               => $direccionCliente,
                'fecha_entrega_comprometida'     => $venta->fecha_entrega_comprometida?->format('Y-m-d'),
                'hora_entrega_comprometida'      => $venta->hora_entrega_comprometida?->format('H:i'),
                'ventana_entrega_ini'            => $venta->ventana_entrega_ini?->format('H:i'),
                'ventana_entrega_fin'            => $venta->ventana_entrega_fin?->format('H:i'),
                'cantidad_items'                 => $venta->detalles?->count() ?? 0,
                'detalles'                       => $venta->detalles?->toArray() ?? [],
            ];
        });

        return response()->json([
            'data'         => $ventas,
            'pagination'   => [
                'current_page' => $ventasPaginated->currentPage(),
                'per_page'     => $ventasPaginated->perPage(),
                'total'        => $ventasPaginated->total(),
                'last_page'    => $ventasPaginated->lastPage(),
                'has_more'     => $ventasPaginated->hasMorePages(),
            ],
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
                    if (! $fechaPrograma) {
                        return false;
                    }

                    $ahora = new \DateTime('now');
                    $hoy   = new \DateTime('today');

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
                    'chofer_id'         => 'required|exists:users,id',
                    'entregador_id'     => 'nullable|integer|exists:users,id',
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

            // ✅ NUEVO: Obtener el estado inicial desde estados_logistica tabla
            // Estado inicial: PREPARACION_CARGA (preparar la carga antes de enviar)
            $estadoInicial = \App\Models\EstadoLogistica::where('categoria', 'entrega')
                ->where('codigo', 'PREPARACION_CARGA')
                ->firstOrFail();

            // Crear entrega con todos los datos disponibles
            $entrega = \App\Models\Entrega::create([
                'venta_id'             => $validated['venta_id'],
                'vehiculo_id'          => $validated['vehiculo_id'],
                'chofer_id'            => $validated['chofer_id'],
                'entregador_id'        => $validated['entregador_id'] ?? null, // ✅ FK a users con rol chofer
                'fecha_programada'     => $validated['fecha_programada'],
                'direccion_entrega'    => $validated['direccion_entrega'] ?? $venta->direccionCliente?->direccion ?? null,
                'direccion_cliente_id' => $venta->direccion_cliente_id, // ✅ Asignar dirección del cliente
                'peso_kg'              => $validated['peso_kg'],
                'observaciones'        => $validated['observaciones'] ?? null,
                'estado'               => $estadoInicial->codigo, // ✅ Enum (legacy compatibility)
                'estado_entrega_id'    => $estadoInicial->id,     // ✅✅ FK a estados_logistica (CRITICAL)
            ]);

            // ✅ DEBUG: Log para verificar que la entrega se creó con el estado correcto
            \Log::info('✅ Entrega creada con estado inicial', [
                'entrega_id'              => $entrega->id,
                'estado'                  => $entrega->estado,
                'estado_logistico_codigo' => $estadoInicial->codigo,
                'estado_logistico_nombre' => $estadoInicial->nombre,
            ]);

            // ✅ DIFERENCIADO: Respuesta API vs Web
            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Entrega creada exitosamente',
                    'data'    => $entrega,
                ], 201);
            }

            // Para solicitudes web, redirigir
            return redirect()
                ->route('logistica.entregas.show', $entrega->id)
                ->with('success', 'Entrega creada exitosamente');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Error de validación en EntregaController::store', [
                'errors' => $e->errors(),
                'data'   => $request->all(),
            ]);

            // ✅ DIFERENCIADO: Errores en API vs Web
            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors'  => $e->errors(),
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
        // Cargar relaciones necesarias
        $entrega->load([
            'estadoEntrega', // ✅ NUEVO: Para acceder a estado_entrega_codigo
            'ventas.cliente',
            'ventas.tipoPago',                 // ✅ NUEVO: Mostrar tipo de pago en la tabla
            'ventas.direccionCliente',         // ✅ NUEVO: Para coordenadas del mapa
            'ventas.estadoLogistica',          // ✅ NUEVO: Estado logístico de cada venta
            'ventas.detalles.producto.unidad', // ✅ ACTUALIZADO: Incluir unidad (correcta relación) para obtenerProductosGenerico()
            'chofer',
            'entregador',      // ✅ NUEVO (2026-02-12): Mostrar entregador en show
            'vehiculo',
            'localidad',
            'reportes',        // Reportes asociados (Many-to-Many)
            'reporteEntregas', // Pivot con metadata (orden, incluida_en_carga, notas)
            'confirmacionesVentas.venta.cliente',  // ✅ FIXED (2026-02-17): Eager load venta y cliente para ConfirmacionesEntregaSection
        ]);

        // 🔍 DEBUG: Verificar si confirmacionesVentas se cargó
        \Illuminate\Support\Facades\Log::info('📦 [ENTREGA SHOW DEBUG] Confirmaciones Cargadas', [
            'entrega_id' => $entrega->id,
            'confirmacionesVentas_count' => $entrega->confirmacionesVentas->count(),
            'confirmacionesVentas_data' => $entrega->confirmacionesVentas->toArray(),
        ]);

        // 🔍 DEBUG: Verificar si es API request
        $isApiRoute = request()->is('api/*');
        $wantsJson  = request()->wantsJson();
        Log::info('📦 [SHOW_ENTREGA] Verificando tipo de request', [
            'path'           => request()->path(),
            'is_api_route'   => $isApiRoute,
            'wants_json'     => $wantsJson,
            'is_api_request' => $this->isApiRequest(),
        ]);

        // API/JSON - Ser más explícito: si la ruta comienza con /api/, retornar JSON
        if ($this->isApiRequest() || $isApiRoute) {
            // ✅ NUEVO: Obtener lista genérica de productos de la entrega
            $productosGenerico = $this->impresionService->obtenerProductosGenerico($entrega);

            // 🔍 DEBUG: Verificar que los productos se están obteniendo
            Log::info('📦 [API_ENTREGA] Obteniendo productos genéricos', [
                'entrega_id'         => $entrega->id,
                'cantidad_productos' => $productosGenerico->count(),
                'ventas_asignadas'   => $entrega->ventas->count(),
            ]);

            return response()->json([
                'success'   => true,
                'data'      => $entrega,
                'productos' => $productosGenerico->toArray(), // ✅ Convertir Collection a array
            ]);
        }

        // Web (Inertia)
        // Convertir a array - toArray() ya incluye todas las relaciones cargadas
        $entregaData = $entrega->toArray();

        // Agregar explícitamente accessors que toArray() podría no incluir
        $entregaData['estado_entrega_codigo'] = $entrega->estado_entrega_codigo;
        $entregaData['estado_entrega_nombre'] = $entrega->estado_entrega_nombre;
        $entregaData['estado_entrega_color']  = $entrega->estado_entrega_color;
        $entregaData['estado_entrega_icono']  = $entrega->estado_entrega_icono;

        // ✅ CRITICAL FIX (2026-02-17): toArray() no incluye automáticamente relaciones cargadas
        // Agregar explícitamente las confirmacionesVentas que fueron cargadas con load()
        $entregaData['confirmacionesVentas'] = $entrega->confirmacionesVentas->toArray();

        return Inertia::render('logistica/entregas/Show', [
            'entrega' => $entregaData,
            'tiposPago' => \App\Models\TipoPago::where('activo', true)->get(),
        ]);
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
     * Confirmar carga (cambiar a EN_CARGA)
     *
     * POST /entregas/{id}/confirmar-carga
     *
     * Marca que la carga ha sido confirmada y lista para salir
     */
    public function confirmarCarga(int $id): JsonResponse | RedirectResponse
    {
        try {
            $entregaDTO = $this->entregaService->confirmarCarga($id);

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Carga confirmada exitosamente',
                redirectTo: route('entregas.show', $id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Marcar entrega como lista para entrega (cambiar a LISTO_PARA_ENTREGA)
     *
     * POST /entregas/{id}/listo-para-entrega
     */
    public function marcarListoParaEntrega(int $id): JsonResponse | RedirectResponse
    {
        try {
            $entregaDTO = $this->entregaService->marcarListoParaEntrega($id);

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Entrega lista para partida',
                redirectTo: route('entregas.show', $id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Iniciar tránsito de entrega con GPS - FLUJO PRINCIPAL FASE 1
     *
     * ENDPOINT: POST /entregas/{id}/iniciar-transito
     *
     * TRANSICIÓN DE ESTADO:
     * - Estado anterior: LISTO_PARA_ENTREGA (carga confirmada)
     * - Estado nuevo: EN_TRANSITO (activa seguimiento GPS)
     *
     * ACCIONES AUTOMÁTICAS:
     * ✅ Valida transición dinámicamente (desde estados_logistica)
     * ✅ Registra ubicación GPS inicial del chofer
     * ✅ Sincroniza todas las ventas a EN_TRANSITO
     * ✅ Dispara evento EntregaEstadoCambiado (WebSocket)
     * ✅ Notifica a admin, chofer y cliente
     *
     * REQUEST:
     * {
     *   "latitud": -17.3895,
     *   "longitud": -66.1568
     * }
     *
     * RESPONSE:
     * {
     *   "success": true,
     *   "data": { ...EntregaDTO },
     *   "message": "Tránsito iniciado"
     * }
     *
     * ERRORES:
     * - 422: Transición inválida o coordenadas faltantes
     * - 404: Entrega no encontrada
     *
     * @param Request $request Con campos: latitud, longitud
     * @param int $id ID de la entrega
     */
    public function iniciarTransito(Request $request, int $id): JsonResponse | RedirectResponse
    {
        try {
            $latitud  = $request->input('latitud');
            $longitud = $request->input('longitud');

            if (! $latitud || ! $longitud) {
                throw new \InvalidArgumentException('Latitud y longitud son requeridas');
            }

            $entregaDTO = $this->entregaService->iniciarTransito($id, (float) $latitud, (float) $longitud);

            return $this->respondSuccess(
                data: $entregaDTO,
                message: 'Tránsito iniciado',
                redirectTo: route('entregas.show', $id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\InvalidArgumentException $e) {
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
     *
     * ✅ MEJORADO: Usa estados finales dinámicos desde BD
     * ✅ MEJORADO: Calcula tiempos con campos correctos (fecha_salida, fecha_entrega)
     * ✅ MEJORADO: Agrupa correctamente por zonas
     */
    public function dashboardStats(): JsonResponse
    {
        try {
            // Obtener todas las entregas con relaciones necesarias
            $entregas = \App\Models\Entrega::with([
                'ventas.cliente',
                'chofer', // chofer es directamente User, no tiene relación .user
                'entregador', // entregador es directamente User
                'vehiculo',
                'localidad',
            ])->get();

            // ✅ MEJORA 1: Obtener códigos de estados FINALES dinámicamente desde BD
            $estadosFinales = \App\Models\EstadoLogistica::where('categoria', 'entrega')
                ->where('es_estado_final', true)
                ->pluck('codigo')
                ->toArray();

            // 1. CONTAR POR ESTADO (dinámico desde estados_logistica tabla)
            $estadosLogistica = \App\Models\EstadoLogistica::where('categoria', 'entrega')
                ->orderBy('orden')
                ->get();

            $estados = [];
            foreach ($estadosLogistica as $estado) {
                $estados[$estado->codigo] = $entregas->where('estado', $estado->codigo)->count();
            }

            // 2. ENTREGAS POR LOCALIDAD
            // ✅ MEJORADO: zona_id es FK a tabla localidades (localidades son las ciudades/pueblos de entrega)
            // Localidades: Ciudades/pueblos donde se entregan (tabla: localidades)
            // Relación: Localidad ←M-M→ Zona (via tabla localidad_zona)
            $porZona = $entregas
                ->groupBy(function ($entrega) {
                    // Usar zona_id de entrega (FK a localidades)
                    if ($entrega->zona_id) {
                        return $entrega->zona_id;
                    }

                    // Fallback: obtener localidad del cliente de la primera venta
                    $primeraVenta = $entrega->ventas?->first();
                    $cliente      = $primeraVenta?->cliente;
                    if ($cliente && $cliente->localidad_id) {
                        return $cliente->localidad_id;
                    }
                    return 'Sin localidad';
                })
                ->map(function ($grupo, $localidadId) use ($estadosFinales) {
                    $total = $grupo->count();

                    // ✅ MEJORA 2: Usar estados finales dinámicos desde BD (en lugar de ['ENTREGADO'])
                    // Esto incluye automáticamente: ENTREGADO, CANCELADA, RECHAZADO
                    $completadas = $grupo->whereIn('estado', $estadosFinales)->count();

                    // ✅ MEJORA 3: Calcular tiempo promedio usando fecha_salida (no fecha_inicio)
                    // fecha_salida: Momento cuando el vehículo partió con la carga
                    // fecha_entrega: Momento cuando se confirmó la entrega
                    $tiempoPromedio    = 0;
                    $entregasConTiempo = $grupo->filter(function ($e) {
                        return $e->fecha_salida && $e->fecha_entrega;
                    });

                    if ($entregasConTiempo->count() > 0) {
                        $tiempoTotal = $entregasConTiempo->sum(function ($e) {
                            return $e->fecha_entrega->diffInMinutes($e->fecha_salida);
                        });
                        $tiempoPromedio = (int) ($tiempoTotal / $entregasConTiempo->count());
                    }

                    // ✅ MEJORA 4: Obtener nombre de la localidad desde tabla localidades
                    $nombreLocalidad = 'Sin localidad';
                    if ($localidadId !== 'Sin localidad') {
                        $localidad       = \App\Models\Localidad::find($localidadId);
                        $nombreLocalidad = $localidad?->nombre ?? "Localidad {$localidadId}";
                    }

                    return [
                        'zona_id'                 => $localidadId === 'Sin localidad' ? null : $localidadId,
                        'nombre'                  => $nombreLocalidad,
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
                ->map(function ($grupo) use ($estadosFinales) {
                    $chofer = $grupo->first()->chofer;
                    if (! $chofer) {
                        return null;
                    }

                    $total = $grupo->count();

                    // ✅ MEJORA 4: Usar estados finales dinámicos en lugar de ['ENTREGADO']
                    $completadas = $grupo->whereIn('estado', $estadosFinales)->count();
                    $eficiencia  = $total > 0 ? round(($completadas / $total) * 100, 2) : 0;

                    return [
                        'chofer_id'             => $chofer->id,
                        'nombre'                => $chofer->name ?? 'Sin nombre',
                        'email'                 => $chofer->email,
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
                    // Obtener cliente de la primera venta asociada
                    $primeraVenta = $entrega->ventas?->first();
                    $cliente      = $primeraVenta?->cliente;

                    return [
                        'id'               => $entrega->id,
                        'estado'           => $entrega->estado,
                        'cliente_nombre'   => $cliente?->nombre ?? 'Sin cliente',
                        'chofer_nombre'    => $entrega->chofer?->name ?? 'Sin asignar',
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
                    'id'           => $venta->id,
                    'numero_venta' => $venta->numero ?? "V-{$venta->id}",
                    'subtotal'       => (float) $venta->subtotal,
                    'fecha_venta'    => $venta->fecha?->format('Y-m-d'),
                    'cliente'        => [
                        'id'     => $venta->cliente?->id,
                        'nombre' => $venta->cliente?->nombre ?? 'Cliente no disponible',
                    ],
                    'cantidad_items' => $venta->detalles?->count() ?? 0,
                    'peso_estimado'  => $venta->detalles?->sum(fn($det) => $det->cantidad * 2) ?? 10,
                ];
            });

        // Obtener vehículos disponibles
        $vehiculos = Vehiculo::disponibles()
            ->with('choferAsignado') // 🔧 Cargar relación de chofer asignado (User)
            ->get()
            ->map(fn($v) => [
                'id'                 => $v->id,
                'placa'              => $v->placa,
                'marca'              => $v->marca,
                'modelo'             => $v->modelo,
                'anho'               => $v->anho,
                'capacidad_kg'       => $v->capacidad_kg,
                'estado'             => $v->estado,
                'activo'             => $v->activo,
                'chofer_asignado_id' => $v->chofer_asignado_id, // 🔧 Incluir ID del chofer
                                                                // 🔧 Incluir datos del chofer si existe (User)
                'chofer'             => $v->choferAsignado ? [
                    'id'     => $v->choferAsignado->id,
                    'name'   => $v->choferAsignado->name,
                    'nombre' => $v->choferAsignado->name,
                    'email'  => $v->choferAsignado->email,
                ] : null,
            ]);

        // Obtener choferes activos (solo empleados con rol Chofer)
        $choferes = Empleado::query()
            ->with('user.roles')
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) => $e->user !== null && $e->user->hasRole('Chofer'))
            ->map(fn($e) => [
                'id'             => $e->id,
                'nombre'         => $e->user?->name ?? $e->nombre,
                'email'          => $e->user?->email,
                'telefono'       => $e->telefono,
                'tiene_licencia' => $e->licencia ? true : false,
            ])
            ->values();

        return Inertia::render('logistica/entregas/create-batch', [
            'ventas'    => $ventas,
            'vehiculos' => $vehiculos,
            'choferes'  => $choferes,
        ]);
    }

    /**
     * Desvincular una venta de una entrega
     *
     * DELETE /api/entregas/{entrega}/ventas/{venta}
     *
     * Establece entrega_id = null en la venta y devuelve estado logístico a SIN_ENTREGA
     */
    public function desvincularVenta(Entrega $entrega, Venta $venta): JsonResponse
    {
        try {
            // Verificar que la venta pertenece a la entrega
            if ($venta->entrega_id !== $entrega->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'La venta no pertenece a esta entrega',
                ], 422);
            }

            // Desvincular venta
            $venta->update([
                'entrega_id' => null,
            ]);

            // Devolver estado logístico a SIN_ENTREGA
            $estadoSinEntrega = EstadoLogistica::where('codigo', 'SIN_ENTREGA')->first();
            if ($estadoSinEntrega) {
                $venta->update([
                    'estado_logistico_id' => $estadoSinEntrega->id,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Venta #{$venta->numero} desvinculada correctamente",
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al desvincular venta de entrega', [
                'entrega_id' => $entrega->id,
                'venta_id' => $venta->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al desvincular la venta: ' . $e->getMessage(),
            ], 500);
        }
    }
}
