<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVisitaPreventistaRequest;
use App\Models\VisitaPreventistaCliente;
use App\Models\Cliente;
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

            // Obtener día de la semana actual (0=domingo, 1=lunes, ..., 6=sábado)
            $diaHoy = now()->dayOfWeek;
            $fechaHoy = now()->toDateString();

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
                ];
            })
            ->sortBy('ventana_horaria.hora_inicio') // Ordenar por hora de inicio
            ->values();

            // ✅ ESTADÍSTICAS de la orden del día
            $visitadas = $ordenDelDia->filter(fn($v) => $v['visitado'])->count();
            $pendientes = $ordenDelDia->count() - $visitadas;

            // ✅ Mapeo de días en español
            $diasSemana = [
                'Domingo',
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
            ];
            $diaSemanaEspanol = $diasSemana[now()->dayOfWeek];

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
