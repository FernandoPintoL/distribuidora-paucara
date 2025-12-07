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
                'Proformas/Index',
                ['filtros' => $filtros]
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
        return Inertia::render('Proformas/Create', [
            'clientes' => Cliente::activo()->select('id', 'nombre', 'nit')->get(),
            'productos' => Producto::activo()->select('id', 'nombre', 'codigo_barras')->get(),
            'almacenes' => Almacen::activo()->select('id', 'nombre')->get(),
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
    public function show(int $id): JsonResponse|InertiaResponse
    {
        try {
            $proformaDTO = $this->proformaService->obtener($id);

            return $this->respondShow(
                data: $proformaDTO,
                inertiaComponent: 'Proformas/Show',
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
    public function aprobar(int $id): JsonResponse|RedirectResponse
    {
        try {
            $proformaDTO = $this->proformaService->aprobar($id);

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
    public function rechazar(int $id): JsonResponse|RedirectResponse
    {
        try {
            $motivo = request()->input('motivo', '');

            $proformaDTO = $this->proformaService->rechazar($id, $motivo);

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
    public function convertirAVenta(int $id): JsonResponse|RedirectResponse
    {
        try {
            $ventaDTO = $this->proformaService->convertirAVenta($id);

            return $this->respondSuccess(
                data: $ventaDTO,
                message: 'Proforma convertida a venta exitosamente',
                redirectTo: route('ventas.show', $ventaDTO->id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Extender validez de proforma
     *
     * POST /proformas/{id}/extender
     */
    public function extenderValidez(int $id): JsonResponse|RedirectResponse
    {
        try {
            $dias = (int) request()->input('dias', 15);

            if ($dias <= 0) {
                throw new \InvalidArgumentException('Días debe ser mayor a 0');
            }

            $proformaDTO = $this->proformaService->extenderValidez($id, $dias);

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
