<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVisitaPreventistaRequest;
use App\Models\VisitaPreventistaCliente;
use App\Services\VisitaPreventistaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
}
