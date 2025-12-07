<?php

namespace App\Http\Controllers;

use App\Exceptions\DomainException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Http\Traits\ApiInertiaUnifiedResponse;
use App\Models\Empleado;
use App\Models\Vehiculo;
use App\Services\Logistica\EntregaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
    ) {
        $this->middleware('permission:entregas.index')->only('index');
        $this->middleware('permission:entregas.show')->only('show');
        $this->middleware('permission:entregas.asignar')->only('asignarChoferVehiculo');
    }

    /**
     * Listar entregas pendientes o asignadas
     */
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        try {
            $filtros = [
                'estado' => $request->input('estado', 'PENDIENTE'),
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
            ];

            // Delegado a Service si tiene método listar
            // Por ahora, solo mostrar UI

            return Inertia::render('Entregas/Index', [
                'filtros' => $filtros,
            ]);

        } catch (\Exception $e) {
            return $this->respondError('Error al obtener entregas');
        }
    }

    /**
     * Mostrar detalle de entrega
     */
    public function show(int $id): JsonResponse|InertiaResponse
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
    public function asignarChoferVehiculo(Request $request, int $id): JsonResponse|RedirectResponse
    {
        try {
            $choferId = $request->input('chofer_id');
            $vehiculoId = $request->input('vehiculo_id');

            if (!$choferId || !$vehiculoId) {
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
    public function iniciar(int $id): JsonResponse|RedirectResponse
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
    public function confirmar(Request $request, int $id): JsonResponse|RedirectResponse
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
    public function rechazar(Request $request, int $id): JsonResponse|RedirectResponse
    {
        try {
            $razon = $request->input('razon', '');

            if (!$razon) {
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
     * Registrar ubicación actual (tracking)
     *
     * POST /entregas/{id}/ubicacion
     *
     * Body:
     * {
     *   "latitud": -34.123,
     *   "longitud": -58.456,
     *   "descripcion": "Llegando a cliente"
     * }
     */
    public function registrarUbicacion(Request $request, int $id): JsonResponse
    {
        try {
            $latitud = $request->input('latitud');
            $longitud = $request->input('longitud');

            if (!$latitud || !$longitud) {
                throw new \InvalidArgumentException('Latitud y longitud requeridas');
            }

            // TODO: Delegado a TrackingService
            // $trackingDTO = $this->trackingService->registrar($id, $latitud, $longitud);

            return response()->json([
                'success' => true,
                'message' => 'Ubicación registrada',
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
