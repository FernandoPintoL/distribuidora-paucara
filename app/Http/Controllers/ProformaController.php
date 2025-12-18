<?php

namespace App\Http\Controllers;

use App\DTOs\Venta\CrearProformaDTO;
use App\Exceptions\DomainException;
use App\Exceptions\Stock\StockInsuficientException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Http\Requests\StoreProformaRequest;
use App\Http\Traits\ApiInertiaUnifiedResponse;
use App\Models\Almacen;
use App\Models\Cliente;
use App\Models\Producto;
use App\Services\Venta\ProformaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * ProformaController - REFACTORIZADO (THIN Controller Pattern)
 *
 * RESPONSABILIDADES:
 * ✓ Manejo de HTTP (request/response)
 * ✓ Validación de formulario
 * ✓ Adaptación de respuestas (Web vs API)
 *
 * NO RESPONSABILIDADES:
 * ✗ Lógica de negocio (eso es ProformaService)
 * ✗ Acceso directo a DB
 */
class ProformaController extends Controller
{
    use ApiInertiaUnifiedResponse;

    public function __construct(
        private ProformaService $proformaService,
    ) {
        $this->middleware('permission:proformas.index')->only('index');
        $this->middleware('permission:proformas.show')->only('show');
        $this->middleware('permission:proformas.create')->only('create', 'store');
    }

    /**
     * Listar proformas
     */
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        try {
            $filtros = [
                'estado' => $request->input('estado'),
                'cliente_id' => $request->input('cliente_id'),
            ];

            $proformasPaginadas = $this->proformaService->listar(
                perPage: $request->input('per_page', 15),
                filtros: array_filter($filtros)
            );

            return $this->respondPaginated(
                $proformasPaginadas,
                'proformas/Index',
                ['proformas' => $proformasPaginadas, 'filtros' => $filtros]
            );

        } catch (\Exception $e) {
            return $this->respondError('Error al obtener proformas');
        }
    }

    /**
     * Mostrar formulario de creación
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('proformas/create', [
            'clientes' => Cliente::activos()->select('id', 'nombre', 'nit')->get(),
            'productos' => Producto::activos()->select('id', 'nombre', 'codigo_barras')->get(),
            'almacenes' => Almacen::activos()->select('id', 'nombre')->get(),
        ]);
    }

    /**
     * Crear una proforma
     *
     * FLUJO:
     * 1. Validar datos (Form Request)
     * 2. Crear DTO
     * 3. ProformaService::crear() → RESERVA stock
     * 4. Retornar respuesta
     */
    public function store(StoreProformaRequest $request): JsonResponse|RedirectResponse
    {
        try {
            $dto = CrearProformaDTO::fromRequest($request);

            $proformaDTO = $this->proformaService->crear($dto);

            return $this->respondSuccess(
                data: $proformaDTO,
                message: 'Proforma creada exitosamente',
                redirectTo: route('proformas.show', $proformaDTO->id),
                statusCode: 201,
            );

        } catch (StockInsuficientException $e) {
            return $this->respondError(
                message: $e->getMessage(),
                errors: $e->getErrors(),
                statusCode: 422,
            );

        } catch (DomainException $e) {
            return $this->respondError($e->getMessage());

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al crear proforma', [
                'error' => $e->getMessage(),
            ]);

            return $this->respondError('Error al crear proforma');
        }
    }

    /**
     * Mostrar detalle de proforma
     */
    public function show(string $id): JsonResponse|InertiaResponse|RedirectResponse
    {
        try {
            $proformaDTO = $this->proformaService->obtener((int)$id);

            return $this->respondShow(
                data: $proformaDTO,
                inertiaComponent: 'proformas/Show',
            );

        } catch (\Exception $e) {
            return $this->respondNotFound('Proforma no encontrada');
        }
    }

    /**
     * Aprobar una proforma
     *
     * POST /proformas/{id}/aprobar
     *
     * Mantiene la reserva de stock (no la consume)
     */
    public function aprobar(string $id): JsonResponse|RedirectResponse
    {
        try {
            $proformaDTO = $this->proformaService->aprobar((int)$id);

            return $this->respondSuccess(
                data: $proformaDTO,
                message: 'Proforma aprobada',
                redirectTo: route('proformas.show', $id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Rechazar una proforma
     *
     * POST /proformas/{id}/rechazar
     *
     * Libera la reserva de stock
     */
    public function rechazar(string $id): JsonResponse|RedirectResponse
    {
        try {
            $motivo = request()->input('motivo', '');

            $proformaDTO = $this->proformaService->rechazar((int)$id, $motivo);

            return $this->respondSuccess(
                data: $proformaDTO,
                message: 'Proforma rechazada',
                redirectTo: route('proformas.index'),
            );

        } catch (DomainException $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Convertir proforma a venta
     *
     * POST /proformas/{id}/convertir-venta
     *
     * FLUJO:
     * 1. ProformaService::convertirAVenta()
     * 2. Adentro: VentaService::crear() consume reserva
     * 3. Retorna VentaResponseDTO
     */
    public function convertirAVenta(string $id): JsonResponse|RedirectResponse
    {
        try {
            \Log::info('🔄 [ProformaController::convertirAVenta] Iniciando conversión de proforma', [
                'proforma_id' => $id,
                'timestamp' => now()->toIso8601String(),
            ]);

            $ventaDTO = $this->proformaService->convertirAVenta((int)$id);

            \Log::info('✅ [ProformaController::convertirAVenta] Conversión exitosa', [
                'proforma_id' => $id,
                'venta_id' => $ventaDTO->id,
                'venta_numero' => $ventaDTO->numero,
                'timestamp' => now()->toIso8601String(),
            ]);

            // Retornar respuesta con redirección
            // El frontend manejará la redirección después de recibir la respuesta exitosa
            return response()->json([
                'success' => true,
                'message' => 'Proforma convertida a venta exitosamente',
                'data' => $ventaDTO->toArray(),
                'redirect_to' => route('ventas.show', $ventaDTO->id),
            ], 200, [
                'X-Inertia' => true,
                'X-Inertia-Version' => \Illuminate\Support\Facades\Session::token(),
            ]);

        } catch (EstadoInvalidoException $e) {
            \Log::warning('⚠️ [ProformaController::convertirAVenta] Estado inválido', [
                'proforma_id' => $id,
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ]);
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            \Log::error('❌ [ProformaController::convertirAVenta] Error general', [
                'proforma_id' => $id,
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'timestamp' => now()->toIso8601String(),
            ]);
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Extender validez de proforma
     *
     * POST /proformas/{id}/extender
     */
    public function extenderValidez(string $id): JsonResponse|RedirectResponse
    {
        try {
            $dias = (int) request()->input('dias', 15);

            if ($dias <= 0) {
                throw new \InvalidArgumentException('Días debe ser mayor a 0');
            }

            $proformaDTO = $this->proformaService->extenderValidez((int)$id, $dias);

            return $this->respondSuccess(
                data: $proformaDTO,
                message: "Validez extendida {$dias} días",
                redirectTo: route('proformas.show', $id),
            );

        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }
}
