<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVisitaPreventistaRequest;
use App\Models\VisitaPreventistaCliente;
use App\Models\Cliente;
use App\Models\Proforma;
use App\Services\VisitaPreventistaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class VisitaPreventistaController extends Controller
{
    protected VisitaPreventistaService $visitaService;

    public function __construct(VisitaPreventistaService $visitaService)
    {
        $this->visitaService = $visitaService;
        $this->middleware('auth:sanctum');
    }

    /**
     * POST /api/visitas
     * Registrar nueva visita
     */
    public function store(StoreVisitaPreventistaRequest $request)
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['preventista_id'] = auth()->user()->empleado->id;

            $visita = $this->visitaService->registrarVisita($data);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Visita registrada correctamente.',
                'data' => $visita->load(['cliente', 'preventista']),
                'advertencia' => !$visita->dentro_ventana_horaria
                    ? 'Visita registrada fuera del horario programado'
                    : null,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar visita: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/visitas
     * Listar mis visitas (preventista logueado)
     */
    public function index(Request $request)
    {
        try {
            $empleado = auth()->user()->empleado;

            if (!$empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario sin empleado asociado.',
                ], 403);
            }

            $query = VisitaPreventistaCliente::with(['cliente', 'ventanaEntrega'])
                ->where('preventista_id', $empleado->id);

            // Filtros
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->entreFechas($request->fecha_inicio, $request->fecha_fin);
            }

            if ($request->has('estado_visita')) {
                $query->where('estado_visita', $request->estado_visita);
            }

            if ($request->has('tipo_visita')) {
                $query->where('tipo_visita', $request->tipo_visita);
            }

            if ($request->has('cliente_id')) {
                $query->where('cliente_id', $request->cliente_id);
            }

            $visitas = $query->orderBy('fecha_hora_visita', 'desc')
                ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $visitas,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener visitas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/visitas/{id}
     * Ver detalle de visita
     */
    public function show(VisitaPreventistaCliente $visita)
    {
        $this->authorize('view', $visita);

        return response()->json([
            'success' => true,
            'data' => $visita->load(['cliente', 'preventista', 'ventanaEntrega']),
        ]);
    }

    /**
     * GET /api/visitas/estadisticas
     * Obtener estadísticas del preventista
     */
    public function estadisticas(Request $request)
    {
        try {
            $empleado = auth()->user()->empleado;

            if (!$empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario sin empleado asociado.',
                ], 403);
            }

            $estadisticas = $this->visitaService->obtenerEstadisticasPreventista(
                $empleado->id,
                $request->fecha_inicio,
                $request->fecha_fin
            );

            $desgloseTipo = $this->visitaService->obtenerDesgloseporTipo(
                $empleado->id,
                $request->fecha_inicio,
                $request->fecha_fin
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'estadisticas_generales' => $estadisticas,
                    'desglose_por_tipo' => $desgloseTipo,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ GET /api/visitas/dashboard-stats
     * Obtener estadísticas ligeras para el dashboard
     *
     * Retorna SOLO números/conteos (sin cargar listas completas):
     * - Total de proformas creadas por el usuario
     * - Proformas pendientes y aprobadas
     * - Para preventistas: clientes asignados (activos e inactivos)
     *
     * Funciona para cualquier rol (Preventista, Vendedor, Admin, etc.)
     * Esto reemplaza la necesidad de cargar listas completas en la pantalla de inicio
     */
    public function dashboardStats(Request $request)
    {
        try {
            $usuario = auth()->user();

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado.',
                ], 403);
            }

            // Total de proformas creadas por el usuario
            $totalProformas = Proforma::where('usuario_creador_id', $usuario->id)->count();

            // Proformas pendientes
            $totalProformasPendientes = Proforma::where('usuario_creador_id', $usuario->id)
                ->join('estados_logistica', 'proformas.estado_proforma_id', '=', 'estados_logistica.id')
                ->where('estados_logistica.codigo', 'PENDIENTE')
                ->count();

            // Proformas aprobadas
            $totalProformasAprobadas = Proforma::where('usuario_creador_id', $usuario->id)
                ->join('estados_logistica', 'proformas.estado_proforma_id', '=', 'estados_logistica.id')
                ->where('estados_logistica.codigo', 'APROBADA')
                ->count();

            // Si es preventista, incluir datos de clientes asignados
            $totalClientes = 0;
            $clientesActivos = 0;
            $clientesInactivos = 0;

            $empleado = $usuario->empleado;
            if ($empleado && $empleado->zona()) {
                $totalClientes = Cliente::where('preventista_id', $empleado->id)->count();
                $clientesActivos = Cliente::where('preventista_id', $empleado->id)
                    ->where('activo', 1)
                    ->count();
                $clientesInactivos = $totalClientes - $clientesActivos;
            }

            return response()->json([
                'success' => true,
                'message' => 'Estadísticas del dashboard obtenidas correctamente.',
                'data' => [
                    'total_proformas' => (int) $totalProformas,
                    'proformas_pendientes' => (int) $totalProformasPendientes,
                    'proformas_aprobadas' => (int) $totalProformasAprobadas,
                    'total_clientes' => (int) $totalClientes,
                    'clientes_activos' => (int) $clientesActivos,
                    'clientes_inactivos' => (int) $clientesInactivos,
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en dashboardStats: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas del dashboard: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/visitas/validar-horario
     * Validar si el cliente tiene ventana horaria ahora
     */
    public function validarHorario(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
        ]);

        $resultado = $this->visitaService->estaEnVentanaHoraria(
            $request->cliente_id,
            now()
        );

        return response()->json([
            'success' => true,
            'data' => $resultado,
        ]);
    }

    /**
     * ✅ NUEVO: GET /api/visitas/orden-del-dia
     * Obtener orden del día: clientes a visitar HOY según su ventana de entrega
     *
     * Retorna:
     * - Lista de clientes asignados al preventista para hoy
     * - Con horarios de visita programados
     * - Información de contacto y dirección
     * - Estado de visita (visitado/no visitado)
     */
    public function ordenDelDia(Request $request)
    {
        try {
            // Obtener el empleado (preventista) autenticado
            $user = Auth::user();

            if (!$user || !$user->empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario sin empleado asociado o no autenticado.',
                ], 403);
            }

            $preventista = $user->empleado;

            // ✅ PARAMETRIZADO: Aceptar fecha opcional (YYYY-MM-DD)
            // Si no se proporciona, usa HOY
            $fechaHoy = $request->get('fecha')
                ? date('Y-m-d', strtotime($request->get('fecha')))
                : now()->toDateString();

            $diaHoy = \Carbon\Carbon::createFromFormat('Y-m-d', $fechaHoy)->dayOfWeek;

            // ✅ QUERY: Obtener clientes del preventista que tienen ventana de entrega para HOY
            $clientesHoy = Cliente::where('preventista_id', $preventista->id)
                ->where('activo', true)
                ->with([
                    'ventanasEntrega' => function ($query) use ($diaHoy) {
                        // Filtrar ventanas que sean PARA HOY
                        $query->where('dia_semana', $diaHoy)
                            ->where('activo', true)
                            ->orderBy('hora_inicio');
                    },
                    'direcciones' => function ($query) {
                        // Cargar direcciones (principal primero)
                        $query->orderBy('es_principal', 'desc');
                    },
                    'localidad',
                ])
                ->get()
                // Filtrar solo clientes que tienen ventanas de entrega para hoy
                ->filter(function ($cliente) {
                    return $cliente->ventanasEntrega->isNotEmpty();
                })
                ->values(); // Re-indexar array

            // ✅ PROCESAR: Transformar datos para la orden del día
            $ordenDelDia = $clientesHoy->map(function ($cliente) use ($fechaHoy, $preventista) {
                $ventana = $cliente->ventanasEntrega->first(); // Primera ventana de hoy
                $direccion = $cliente->direcciones->first(); // Dirección principal

                // Verificar si ya fue visitado hoy
                $visitaHoy = VisitaPreventistaCliente::where('cliente_id', $cliente->id)
                    ->where('preventista_id', $preventista->id)
                    ->whereDate('fecha_hora_visita', $fechaHoy)
                    ->first();

                return [
                    'cliente_id' => $cliente->id,
                    'nombre' => $cliente->nombre,
                    'telefono' => $cliente->telefono,
                    'email' => $cliente->email,
                    'codigo_cliente' => $cliente->codigo_cliente,
                    'direccion' => [
                        'direccion' => $direccion?->direccion ?? 'N/A',
                        'ciudad' => $direccion?->ciudad ?? 'N/A',
                        'latitud' => $direccion?->latitud,
                        'longitud' => $direccion?->longitud,
                    ],
                    'ventana_horaria' => [
                        'hora_inicio' => $ventana->hora_inicio,
                        'hora_fin' => $ventana->hora_fin,
                        'dia_semana' => $ventana->dia_semana,
                    ],
                    'visitado' => $visitaHoy ? true : false,
                    'visitado_a_las' => $visitaHoy?->fecha_hora_visita?->format('H:i:s'),
                    'tipo_visita_realizada' => $visitaHoy?->tipo_visita,
                    'estado_visita' => $visitaHoy?->estado_visita,
                    'limite_credito' => $cliente->limite_credito,
                    'puede_tener_credito' => $cliente->puede_tener_credito,
                    'localidad' => $cliente->localidad ? [
                        'id' => $cliente->localidad->id,
                        'nombre' => $cliente->localidad->nombre,
                        'codigo' => $cliente->localidad->codigo,
                    ] : null,
                ];
            })
            ->sortBy('ventana_horaria.hora_inicio') // Ordenar por hora de inicio
            ->values();

            // ✅ ESTADÍSTICAS de la orden del día
            $visitadas = $ordenDelDia->filter(fn($v) => $v['visitado'])->count();
            $pendientes = $ordenDelDia->count() - $visitadas;

            // ✅ Mapeo de días en español (usando fecha parametrizada)
            $diasSemana = [
                'Domingo',
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
            ];
            $diaSemanaEspanol = $diasSemana[$diaHoy];

            return response()->json([
                'success' => true,
                'data' => [
                    'fecha' => $fechaHoy,
                    'dia_semana' => $diaSemanaEspanol,
                    'preventista' => [
                        'id' => $preventista->id,
                        'nombre' => $preventista->user->name ?? 'N/A',
                        'codigo' => $preventista->codigo_empleado,
                    ],
                    'clientes' => $ordenDelDia,
                    'resumen' => [
                        'total_clientes' => $ordenDelDia->count(),
                        'visitados' => $visitadas,
                        'pendientes' => $pendientes,
                        'porcentaje_completado' => $ordenDelDia->count() > 0
                            ? round(($visitadas / $ordenDelDia->count()) * 100, 2)
                            : 0,
                    ],
                ],
                'message' => sprintf(
                    'Orden del día: %d clientes (%d visitados, %d pendientes)',
                    $ordenDelDia->count(),
                    $visitadas,
                    $pendientes
                ),
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error en ordenDelDia: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener orden del día: ' . $e->getMessage(),
            ], 500);
        }
    }
}
