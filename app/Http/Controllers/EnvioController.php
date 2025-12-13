<?php
namespace App\Http\Controllers;

use App\Http\Requests\ActualizarUbicacionRequest;
use App\Http\Requests\CancelarEnvioRequest;
use App\Http\Requests\ConfirmarEntregaRequest;
use App\Http\Requests\ProgramarEnvioRequest;
use App\Http\Requests\RechazarEntregaRequest;
use App\Http\Requests\StoreEnvioRequest;
use App\Models\Envio;
use App\Models\Proforma;
use App\Models\User;
use App\Models\Vehiculo;
use App\Models\Venta;
use App\Services\ReportService;
use App\Services\StockService;
use App\Services\WebSocketNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EnvioController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', config('inventario.paginacion.por_pagina_default', 20));
        $perPage = min($perPage, config('inventario.paginacion.por_pagina_max', 100));

        $query = Envio::with(['venta.cliente', 'vehiculo', 'chofer']);

        // Filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('vehiculo_id')) {
            $query->where('vehiculo_id', $request->vehiculo_id);
        }

        if ($request->filled('chofer_id')) {
            $query->where('chofer_id', $request->chofer_id);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_programada', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_programada', '<=', $request->fecha_hasta);
        }

        // Búsqueda por número de envío
        if ($request->filled('search')) {
            $query->where('numero_envio', 'like', '%' . $request->search . '%');
        }

        // Ordenamiento
        $sortBy  = $request->input('sort_by', 'fecha_programada');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $envios = $query->paginate($perPage);

        return Inertia::render('Envios/Index', [
            'envios'  => $envios,
            'filters' => $request->only(['estado', 'vehiculo_id', 'chofer_id', 'fecha_desde', 'fecha_hasta', 'search']),
        ]);
    }

    public function create(): Response
    {
        // Obtener ventas confirmadas que requieren envío
        $ventas = Venta::with(['cliente', 'detalles.producto'])
            ->whereIn('estado_documento_id', [3, 4]) // APROBADO o FACTURADO
            ->where('requiere_envio', true)
            ->whereDoesntHave('envio')
            ->orderBy('created_at', 'desc')
            ->get();

        // Obtener vehículos disponibles
        $vehiculos = Vehiculo::where('activo', true)
            ->orderBy('placa')
            ->get();

        // Obtener choferes disponibles (usuarios con rol de Logística o todos los usuarios activos)
        $choferes = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Logística', 'Empleado']);
        })->orWhere(function ($query) {
            // Fallback: usuarios activos sin roles específicos
            $query->whereDoesntHave('roles');
        })->orderBy('name')->get();

        return Inertia::render('Envios/Create', [
            'ventas'    => $ventas,
            'vehiculos' => $vehiculos,
            'choferes'  => $choferes,
        ]);
    }

    public function store(StoreEnvioRequest $request)
    {
        DB::beginTransaction();
        try {
            // Crear el envío
            $envio = Envio::create([
                'numero_envio'      => Envio::generarNumeroEnvio(),
                'venta_id'          => $request->venta_id,
                'vehiculo_id'       => $request->vehiculo_id,
                'chofer_id'         => $request->chofer_id,
                'fecha_programada'  => $request->fecha_programada,
                'direccion_entrega' => $request->direccion_entrega,
                'observaciones'     => $request->observaciones,
                'estado'            => Envio::PROGRAMADO,
            ]);

            DB::commit();

            // Notificar vía WebSocket
            app(WebSocketNotificationService::class)->notifyEnvioProgramado($envio);

            return redirect()->route('envios.show', $envio)
                ->with('success', 'Envío creado correctamente.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Error al crear el envío: ' . $e->getMessage()]);
        }
    }

    public function show(Envio $envio)
    {
        $envio->load([
            'venta.cliente',
            'venta.detalles.producto',
            'vehiculo',
            'chofer',
            'seguimientos.usuario',
        ]);

        return Inertia::render('Envios/Show', [
            'envio' => $envio,
        ]);
    }

    public function programar(Venta $venta, ProgramarEnvioRequest $request)
    {
        if (! $venta->puedeEnviarse()) {
            return back()->withErrors(['error' => 'Esta venta no puede enviarse']);
        }

        // ✅ VALIDACIÓN: Verificar que el pago cumpla con la política de pago
        $validacionPago = $this->validarPagoParaEnvio($venta);
        if (!$validacionPago['valido']) {
            return back()->withErrors(['error' => $validacionPago['mensaje']]);
        }

        DB::beginTransaction();
        try {
            // Crear el envío
            $envio = Envio::create([
                'numero_envio'      => Envio::generarNumeroEnvio(),
                'venta_id'          => $venta->id,
                'vehiculo_id'       => $request->vehiculo_id,
                'chofer_id'         => $request->chofer_id,
                'fecha_programada'  => $request->fecha_programada,
                'direccion_entrega' => $request->direccion_entrega ?? $venta->cliente->direccion,
                'observaciones'     => $request->observaciones,
                'estado'            => Envio::PROGRAMADO,
            ]);

            // Actualizar estado de venta
            $venta->update(['estado_logistico' => Venta::ESTADO_PREPARANDO]);

            // Crear seguimiento inicial
            $envio->agregarSeguimiento(Envio::PROGRAMADO, [
                'observaciones' => 'Envío programado para ' . $request->fecha_programada,
            ]);

            DB::commit();

            // Notificar vía WebSocket
            app(WebSocketNotificationService::class)->notifyEnvioProgramado($envio);

            return redirect()->route('envios.show', $envio)
                ->with('success', 'Envío programado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al programar el envío: ' . $e->getMessage()]);
        }
    }

    public function iniciarPreparacion(Envio $envio)
    {
        if (! $envio->puedeIniciarPreparacion()) {
            return back()->withErrors(['error' => 'Este envío no puede iniciar preparación']);
        }

        DB::beginTransaction();
        try {
            // ⚠️ PUNTO CRÍTICO: Aquí es donde se reduce el stock
            $this->reducirStockParaEnvio($envio);

            // Actualizar estado del envío
            $envio->update(['estado' => Envio::EN_PREPARACION]);

            // Actualizar estado del vehículo
            $envio->vehiculo->update(['estado' => Vehiculo::EN_RUTA]);

            // Crear seguimiento
            $envio->agregarSeguimiento('EN_PREPARACION', [
                'observaciones' => 'Iniciada la preparación del pedido',
            ]);

            DB::commit();

            // Notificar vía WebSocket
            app(WebSocketNotificationService::class)->notifyEnvioEnPreparacion($envio);

            return back()->with('success', 'Preparación iniciada. Stock reducido correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al iniciar preparación: ' . $e->getMessage()]);
        }
    }

    public function confirmarSalida(Envio $envio, Request $request)
    {
        if (! $envio->puedeConfirmarSalida()) {
            return back()->withErrors(['error' => 'Este envío no puede confirmar salida']);
        }

        $envio->update([
            'estado'       => Envio::EN_RUTA,
            'fecha_salida' => now(),
        ]);

        $envio->venta->update(['estado_logistico' => Venta::ESTADO_ENVIADO]);

        // Crear seguimiento
        $envio->agregarSeguimiento('EN_RUTA', [
            'observaciones' => 'Vehículo salió del almacén',
        ]);

        // Notificar vía WebSocket
        app(WebSocketNotificationService::class)->notifyEnvioEnRuta($envio);

        return back()->with('success', 'Salida confirmada. El envío está en ruta.');
    }

    public function confirmarEntrega(Envio $envio, ConfirmarEntregaRequest $request)
    {
        if (! $envio->puedeConfirmarEntrega()) {
            return back()->withErrors(['error' => 'Este envío no puede confirmar entrega']);
        }

        DB::beginTransaction();
        try {
            $fotoPath = null;
            if ($request->hasFile('foto_entrega')) {
                $fotoPath = $request->file('foto_entrega')->store('entregas', 'public');
            }

            $envio->update([
                'estado'             => Envio::ENTREGADO,
                'fecha_entrega'      => now(),
                'receptor_nombre'    => $request->receptor_nombre,
                'receptor_documento' => $request->receptor_documento,
                'foto_entrega'       => $fotoPath,
            ]);

            $envio->venta->update(['estado_logistico' => Venta::ESTADO_ENTREGADO]);

            // Liberar vehículo
            $envio->vehiculo->update(['estado' => Vehiculo::DISPONIBLE]);

            // Crear seguimiento final
            $envio->agregarSeguimiento(Envio::ENTREGADO, [
                'observaciones' => 'Entregado a: ' . $request->receptor_nombre . '. ' . ($request->observaciones_entrega ?? ''),
            ]);

            DB::commit();

            // Notificar vía WebSocket
            app(WebSocketNotificationService::class)->notifyEnvioEntregado($envio);

            return back()->with('success', 'Entrega confirmada exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al confirmar entrega: ' . $e->getMessage()]);
        }
    }

    // ✅ NUEVO: Rechazar entrega (chofer/cliente reporte problema)
    public function rechazarEntrega(Envio $envio, RechazarEntregaRequest $request)
    {
        // Data already validated by RechazarEntregaRequest
        $data = $request->validated();

        DB::beginTransaction();
        try {
            $fotosPath = [];

            // Procesar fotos
            if ($request->hasFile('fotos')) {
                foreach ($request->file('fotos') as $foto) {
                    $path        = $foto->store('rechazos-entregas', 'public');
                    $fotosPath[] = $path;
                }
            }

            // Determinar tipo de rechazo y marcar
            $tipoRechazo = $request->tipo_rechazo;
            $motivo      = '';

            switch ($tipoRechazo) {
                case 'cliente_ausente':
                    $envio->marcarClienteAusente($fotosPath);
                    $motivo = 'Cliente no se encontraba en el lugar';
                    break;
                case 'tienda_cerrada':
                    $envio->marcarTiendaCerrada($fotosPath);
                    $motivo = 'Tienda cerrada';
                    break;
                case 'otro_problema':
                    $motivo = $request->motivo_detallado ?? 'Otro problema reportado';
                    $envio->marcarConProblema($motivo, $fotosPath);
                    break;
            }

            // Crear seguimiento detallado
            $envio->agregarSeguimiento('INTENTO_ENTREGA_FALLIDO', [
                'observaciones' => "Intento fallido - {$motivo}. Fotos: " . count($fotosPath),
            ]);

            // Actualizar estado de la venta
            $envio->venta->update(['estado_logistico' => Venta::ESTADO_PENDIENTE_ENVIO]);

            DB::commit();

            // Notificar vía WebSocket
            try {
                app(WebSocketNotificationService::class)->notifyRole(
                    'manager',
                    'entrega_rechazada',
                    [
                        'envio_id'       => $envio->id,
                        'envio_numero'   => $envio->numero_envio,
                        'tipo_rechazo'   => $tipoRechazo,
                        'motivo'         => $motivo,
                        'fotos_cantidad' => count($fotosPath),
                        'chofer'         => $envio->chofer?->name,
                        'cliente'        => $envio->venta->cliente?->nombre,
                        'timestamp'      => now(),
                    ]
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Error notificando rechazo de entrega', [
                    'envio_id' => $envio->id,
                    'error'    => $e->getMessage(),
                ]);
            }

            return back()->with('success', 'Rechazo de entrega registrado. El envío requiere acción adicional.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Error al rechazar entrega: ' . $e->getMessage()]);
        }
    }

    public function cancelar(Envio $envio, CancelarEnvioRequest $request)
    {
        DB::beginTransaction();
        try {
            // Si ya se había reducido stock, revertirlo
            if ($envio->estado === Envio::EN_PREPARACION || $envio->estado === Envio::EN_RUTA) {
                $this->revertirStockDelEnvio($envio);
            }

            $envio->update(['estado' => Envio::CANCELADO]);
            $envio->venta->update(['estado_logistico' => Venta::ESTADO_PENDIENTE_ENVIO]);

            // Liberar vehículo
            $envio->vehiculo->update(['estado' => Vehiculo::DISPONIBLE]);

            // Crear seguimiento
            $envio->agregarSeguimiento(Envio::CANCELADO, [
                'observaciones' => 'Cancelado: ' . $request->motivo_cancelacion,
            ]);

            DB::commit();

            // Notificar vía WebSocket
            app(WebSocketNotificationService::class)->notifyEnvioCancelado($envio, $request->motivo_cancelacion);

            return back()->with('success', 'Envío cancelado y stock revertido');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al cancelar envío: ' . $e->getMessage()]);
        }
    }

    public function obtenerVehiculosDisponibles()
    {
        try {
            $vehiculos = Vehiculo::where('estado', Vehiculo::DISPONIBLE)
                ->select('id', 'placa', 'marca', 'modelo', 'estado')
                ->get();

            return response()->json($vehiculos);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener vehículos disponibles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function obtenerChoferesDisponibles()
    {
        try {
            // Obtener empleados con rol de chofer que estén activos
            $choferes = User::whereHas('roles', function ($query) {
                $query->where('name', 'chofer');
            })
            ->where('activo', true)
            ->select('id', 'nombre', 'email', 'telefono')
            ->get()
            ->map(function ($chofer) {
                return [
                    'id' => $chofer->id,
                    'nombre' => $chofer->nombre,
                    'email' => $chofer->email,
                    'telefono' => $chofer->telefono,
                ];
            });

            return response()->json($choferes);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener choferes disponibles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Procesar operaciones de stock para envíos
     *
     * @param Envio $envio
     * @param string $operacion 'reducir' | 'restaurar'
     * @return void
     */
    private function procesarStock(Envio $envio, string $operacion): void
    {
        $stockService = app(StockService::class);

        $productos = $envio->venta->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad'    => $detalle->cantidad,
            ];
        })->toArray();

        $numeroEnvio = $envio->numero_envio ?? 'ENV-' . $envio->id;
        $almacenId   = $this->obtenerAlmacenParaEnvio($envio);

        if ($operacion === 'reducir') {
            $stockService->procesarSalidaEnvio($productos, $numeroEnvio, $almacenId);
        } elseif ($operacion === 'restaurar') {
            $stockService->procesarEntradaCancelacionEnvio($productos, $numeroEnvio, $almacenId);
        }
    }

    /**
     * Obtener el ID del almacén a usar para el envío
     *
     * Prioridad:
     * 1. Almacén asociado a la venta (si existe)
     * 2. Almacén principal configurado en sistema
     * 3. Primer almacén activo (fallback)
     *
     * @param Envio $envio
     * @return int
     */
    private function obtenerAlmacenParaEnvio(Envio $envio): int
    {
        // 1. Intentar obtener almacén de la venta
        if ($envio->venta && isset($envio->venta->almacen_id)) {
            return $envio->venta->almacen_id;
        }

        // 2. Obtener almacén principal desde configuración
        $almacenPrincipalId = config('inventario.almacen_principal_id');
        if ($almacenPrincipalId) {
            return $almacenPrincipalId;
        }

        // 3. Fallback: primer almacén activo
        $almacen = \App\Models\Almacen::where('activo', true)->first();

        return $almacen ? $almacen->id : 1;
    }

    private function reducirStockParaEnvio(Envio $envio): void
    {
        $this->procesarStock($envio, 'reducir');
    }

    private function revertirStockDelEnvio(Envio $envio): void
    {
        $this->procesarStock($envio, 'restaurar');
    }

    // ==========================================
    // 📊 MÉTODOS PARA DASHBOARD DE LOGÍSTICA
    // ==========================================

    /**
     * Obtener estadísticas para el dashboard de logística
     */
    public function dashboardStats(): JsonResponse
    {
        $hoy        = today();
        $estaSemana = now()->startOfWeek();
        $esteMes    = now()->startOfMonth();

        $stats = [
            // Métricas de Envíos
            'envios'          => [
                'programados'       => Envio::where('estado', Envio::PROGRAMADO)->count(),
                'en_preparacion'    => Envio::where('estado', Envio::EN_PREPARACION)->count(),
                'en_ruta'           => Envio::where('estado', Envio::EN_RUTA)->count(),
                'entregados_hoy'    => Envio::where('estado', Envio::ENTREGADO)
                    ->whereDate('fecha_entrega', $hoy)
                    ->count(),
                'entregados_semana' => Envio::where('estado', Envio::ENTREGADO)
                    ->where('fecha_entrega', '>=', $estaSemana)
                    ->count(),
                'entregados_mes'    => Envio::where('estado', Envio::ENTREGADO)
                    ->where('fecha_entrega', '>=', $esteMes)
                    ->count(),
                'cancelados_mes'    => Envio::where('estado', Envio::CANCELADO)
                    ->where('updated_at', '>=', $esteMes)
                    ->count(),
                'total_activos'     => Envio::whereIn('estado', [
                    Envio::PROGRAMADO,
                    Envio::EN_PREPARACION,
                    Envio::EN_RUTA,
                ])->count(),
            ],

            // Métricas de Vehículos
            'vehiculos'       => [
                'disponibles'   => Vehiculo::where('estado', Vehiculo::DISPONIBLE)
                    ->where('activo', true)
                    ->count(),
                'en_ruta'       => Vehiculo::where('estado', Vehiculo::EN_RUTA)->count(),
                'total_activos' => Vehiculo::where('activo', true)->count(),
            ],

            // Métricas de proformas (si existe la tabla)
            'proformas'       => [
                'pendientes' => Proforma::where('estado', 'PENDIENTE')->count(), // Count ALL, not just APP_EXTERNA
                'aprobadas'  => Proforma::where('estado', 'APROBADA')->count(), // Count ALL, not just APP_EXTERNA
            ],

            // Métricas de Performance
            'performance'     => [
                'tiempo_promedio_entrega' => $this->calcularTiempoPromedioEntrega(),
                'tasa_cumplimiento'       => $this->calcularTasaCumplimiento(),
                'envios_retrasados'       => $this->contarEnviosRetrasados(),
            ],

            // Próximos envíos (hoy y mañana)
            'proximos_envios' => [
                'hoy'    => Envio::whereDate('fecha_programada', $hoy)
                    ->whereIn('estado', [Envio::PROGRAMADO, Envio::EN_PREPARACION])
                    ->count(),
                'manana' => Envio::whereDate('fecha_programada', now()->addDay())
                    ->whereIn('estado', [Envio::PROGRAMADO, Envio::EN_PREPARACION])
                    ->count(),
            ],

            // Top choferes (por entregas este mes)
            'top_choferes'    => User::select('users.id', 'users.name', DB::raw('COUNT(envios.id) as entregas'))
                ->join('envios', 'users.id', '=', 'envios.chofer_id')
                ->where('envios.estado', Envio::ENTREGADO)
                ->where('envios.fecha_entrega', '>=', $esteMes)
                ->groupBy('users.id', 'users.name')
                ->orderBy('entregas', 'desc')
                ->limit(5)
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Calcular tiempo promedio de entrega (en horas)
     */
    private function calcularTiempoPromedioEntrega(): float
    {
        $enviosEntregados = Envio::where('estado', Envio::ENTREGADO)
            ->where('fecha_entrega', '>=', now()->subDays(30))
            ->whereNotNull('fecha_salida')
            ->whereNotNull('fecha_entrega')
            ->get();

        if ($enviosEntregados->isEmpty()) {
            return 0;
        }

        $totalHoras = $enviosEntregados->sum(function ($envio) {
            return $envio->fecha_salida->diffInHours($envio->fecha_entrega);
        });

        return round($totalHoras / $enviosEntregados->count(), 1);
    }

    /**
     * Calcular tasa de cumplimiento (%)
     */
    private function calcularTasaCumplimiento(): float
    {
        $totalEnvios = Envio::whereIn('estado', [Envio::ENTREGADO, Envio::CANCELADO])
            ->where('updated_at', '>=', now()->subDays(30))
            ->count();

        if ($totalEnvios === 0) {
            return 100;
        }

        $enviosEntregados = Envio::where('estado', Envio::ENTREGADO)
            ->where('fecha_entrega', '>=', now()->subDays(30))
            ->count();

        return round(($enviosEntregados / $totalEnvios) * 100, 1);
    }

    /**
     * Contar envíos retrasados
     */
    private function contarEnviosRetrasados(): int
    {
        return Envio::whereIn('estado', [Envio::PROGRAMADO, Envio::EN_PREPARACION, Envio::EN_RUTA])
            ->where('fecha_programada', '<', now())
            ->count();
    }

    /**
     * Obtener seguimiento detallado de un envío para API
     */
    public function seguimiento(Envio $envio): JsonResponse
    {
        $envio->load([
            'venta.cliente',
            'venta.detalles.producto',
            'vehiculo',
            'chofer',
            'seguimientos.usuario',
        ]);

        return response()->json($envio);
    }

    /**
     * Actualizar estado de un envío desde API
     */
    public function actualizarEstado(Envio $envio, Request $request): JsonResponse
    {
        $request->validate([
            'estado'             => 'required|in:PROGRAMADO,EN_PREPARACION,EN_TRANSITO,ENTREGADO,FALLIDO',
            'descripcion'        => 'required|string|max:500',
            'ubicacion'          => 'nullable|array',
            'ubicacion.latitud'  => 'nullable|numeric',
            'ubicacion.longitud' => 'nullable|numeric',
        ]);

        DB::beginTransaction();
        try {
            $estadoAnterior = $envio->estado;

            // Actualizar estado del envío
            $envio->update(['estado' => $request->estado]);

            // Crear registro de seguimiento
            $envio->seguimientos()->create([
                'estado'      => $request->estado,
                'descripcion' => $request->descripcion,
                'ubicacion'   => $request->ubicacion,
                'usuario_id'  => Auth::id(),
                'fecha'       => now(),
            ]);

            // Lógica específica según el estado
            switch ($request->estado) {
                case 'EN_PREPARACION':
                    if ($estadoAnterior === 'PROGRAMADO') {
                        $this->reducirStockPreparacion($envio);
                    }
                    break;

                case 'ENTREGADO':
                    $this->marcarVentaComoEntregada($envio);
                    break;

                case 'FALLIDO':
                    $this->restaurarStockFallido($envio);
                    break;
            }

            DB::commit();

            return response()->json([
                'message' => 'Estado actualizado correctamente',
                'envio'   => $envio->fresh(['seguimientos']),
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'message' => 'Error al actualizar el estado',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener envíos para cliente específico (API)
     */
    public function enviosCliente(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Obtener parámetros de paginación
        $perPage = $request->input('per_page', config('inventario.paginacion.por_pagina_default', 20));
        $perPage = min($perPage, config('inventario.paginacion.por_pagina_max', 100));

        // Si es un cliente desde la app externa, buscar por cliente_app_id
        $envios = Envio::whereHas('venta', function ($query) use ($user) {
            $query->whereHas('cliente', function ($q) use ($user) {
                $q->where('email', $user->email);
            });
        })
            ->with(['venta.cliente', 'vehiculo', 'chofer', 'seguimientos'])
            ->orderBy('fecha_programada', 'desc')
            ->paginate($perPage);

        return response()->json($envios);
    }

    /**
     * API para seguimiento público (sin autenticación)
     */
    public function seguimientoApi(Envio $envio): JsonResponse
    {
        $envio->load([
            'venta'         => function ($query) {
                $query->select('id', 'numero', 'total', 'cliente_id');
            },
            'venta.cliente' => function ($query) {
                $query->select('id', 'nombre', 'telefono');
            },
            'vehiculo'      => function ($query) {
                $query->select('id', 'placa', 'marca', 'modelo');
            },
            'chofer'        => function ($query) {
                $query->select('id', 'name');
            },
            'seguimientos'  => function ($query) {
                $query->orderBy('fecha', 'desc');
            },
        ]);

        return response()->json($envio);
    }

    /**
     * Actualizar ubicación desde app móvil
     */
    public function actualizarUbicacion(Envio $envio, ActualizarUbicacionRequest $request): JsonResponse
    {
        $envio->seguimientos()->create([
            'estado'          => $envio->estado,
            'fecha_hora'      => now(),
            'coordenadas_lat' => $request->latitud,
            'coordenadas_lng' => $request->longitud,
            'observaciones'   => 'Actualización de ubicación automática',
            'user_id'         => Auth::id(),
        ]);

        // Notificar vía WebSocket (tracking en tiempo real)
        app(WebSocketNotificationService::class)->notifyEnvioUbicacionActualizada(
            $envio,
            $request->latitud,
            $request->longitud
        );

        return response()->json(['message' => 'Ubicación actualizada']);
    }

    private function marcarVentaComoEntregada(Envio $envio): void
    {
        $envio->venta->update([
            'entregado'     => true,
            'fecha_entrega' => now(),
        ]);
    }

    private function restaurarStockFallido(Envio $envio): void
    {
        // Si el envío falló, restaurar el stock
        if ($envio->estado === 'EN_PREPARACION' || $envio->estado === 'EN_TRANSITO') {
            $this->restaurarStock($envio);
        }
    }

    /**
     * Reducir stock cuando se inicia la preparación
     */
    private function reducirStockPreparacion(Envio $envio): void
    {
        $this->procesarStock($envio, 'reducir');
    }

    /**
     * Restaurar stock cuando un envío falla o se cancela
     */
    private function restaurarStock(Envio $envio): void
    {
        $this->procesarStock($envio, 'restaurar');
    }

    // ==========================================
    // 📊 MÉTODOS DE EXPORTACIÓN
    // ==========================================

    /**
     * ✅ NUEVO: Exportar envíos a PDF (usando ReportService)
     */
    public function exportPdf(Request $request)
    {
        $reportService = app(ReportService::class);
        $query = $this->aplicarFiltros(Envio::with(['venta.cliente', 'vehiculo', 'chofer']), $request);
        $envios = $query->orderBy('fecha_programada', 'desc')->get();

        return $reportService->exportarEnviosPdf(
            $envios,
            $request->only(['estado', 'vehiculo_id', 'chofer_id', 'fecha_desde', 'fecha_hasta'])
        );
    }

    /**
     * ✅ NUEVO: Exportar envíos a Excel (usando ReportService)
     */
    public function exportExcel(Request $request)
    {
        $reportService = app(ReportService::class);
        $query = $this->aplicarFiltros(Envio::with(['venta.cliente', 'vehiculo', 'chofer']), $request);
        $envios = $query->orderBy('fecha_programada', 'desc')->get();

        return $reportService->exportarEnviosExcel($envios);
    }

    /**
     * ✅ NUEVO: Exportar entregas rechazadas a Excel
     */
    public function exportEntregasRechazadas(Request $request)
    {
        $reportService = app(ReportService::class);

        $filtros = [
            'fecha_desde' => $request->input('fecha_desde'),
            'fecha_hasta' => $request->input('fecha_hasta'),
            'tipo_rechazo' => $request->input('tipo_rechazo'),
            'chofer_id' => $request->input('chofer_id'),
            'search' => $request->input('search'),
        ];

        $envios = $reportService->obtenerEnviosRechazados($filtros);

        return $reportService->exportarEntregasRechazadasExcel($envios);
    }

    /**
     * Aplicar filtros a la consulta de envíos
     */
    private function aplicarFiltros($query, Request $request)
    {
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('vehiculo_id')) {
            $query->where('vehiculo_id', $request->vehiculo_id);
        }

        if ($request->filled('chofer_id')) {
            $query->where('chofer_id', $request->chofer_id);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_programada', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_programada', '<=', $request->fecha_hasta);
        }

        if ($request->filled('search')) {
            $query->where('numero_envio', 'like', '%' . $request->search . '%');
        }

        return $query;
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * VALIDACIÓN: Verificar que el pago cumple la política de pago
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Valida que una venta haya pagado el mínimo requerido según su política de pago:
     * - ANTICIPADO_100: Debe estar 100% pagada
     * - MEDIO_MEDIO: Debe estar al menos 50% pagada
     * - CONTRA_ENTREGA: No requiere validación previa
     *
     * @param Venta $venta
     * @return array ['valido' => bool, 'mensaje' => string]
     */
    private function validarPagoParaEnvio(\App\Models\Venta $venta): array
    {
        // Si no tiene política de pago, asumir CONTRA_ENTREGA (sin validación)
        if (!$venta->politica_pago) {
            return ['valido' => true, 'mensaje' => ''];
        }

        $montoPagado = (float) $venta->monto_pagado;
        $montoTotal = (float) $venta->monto_total;
        $estadoPago = $venta->estado_pago;

        // Validar según política de pago
        return match ($venta->politica_pago) {
            'ANTICIPADO_100' => [
                // Debe estar 100% pagada
                'valido' => $estadoPago === 'PAGADO',
                'mensaje' => $estadoPago !== 'PAGADO'
                    ? "Esta venta requiere pago 100% anticipado. Pagado: {$montoPagado} de {$montoTotal}"
                    : '',
            ],
            'MEDIO_MEDIO' => [
                // Debe tener al menos 50% pagado
                'valido' => $montoPagado >= ($montoTotal * 0.5),
                'mensaje' => $montoPagado < ($montoTotal * 0.5)
                    ? "Esta venta requiere mínimo 50% pagado. Pagado: " . round(($montoPagado / $montoTotal) * 100, 2) . "% ({$montoPagado} de {$montoTotal})"
                    : '',
            ],
            'CONTRA_ENTREGA', 'DESPUES_ENTREGA' => [
                // No requiere validación previa
                'valido' => true,
                'mensaje' => '',
            ],
            default => [
                // Cualquier otra política (fallback)
                'valido' => true,
                'mensaje' => '',
            ],
        };
    }
}
