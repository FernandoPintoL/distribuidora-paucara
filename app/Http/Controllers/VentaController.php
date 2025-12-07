<?php

namespace App\Http\Controllers;

use App\DTOs\Venta\CrearVentaDTO;
use App\Exceptions\DomainException;
use App\Exceptions\Stock\StockInsuficientException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Http\Requests\StoreVentaRequest;
use App\Http\Traits\ApiInertiaUnifiedResponse;
use App\Models\Almacen;
use App\Models\Cliente;
use App\Models\Moneda;
use App\Models\Producto;
use App\Services\Venta\VentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * VentaController - REFACTORIZADO (THIN Controller Pattern)
 *
 * CARACTERÍSTICAS:
 * ✅ THIN - Solo HTTP concerns
 * ✅ Delega lógica a VentaService
 * ✅ Reutilizable: Web + API + Mobile
 * ✅ Respuestas unificadas (Web vs API)
 * ✅ Cachea excepciones de negocio
 *
 * COMPARATIVA:
 * ANTES: 200+ líneas de lógica en Controller
 * DESPUÉS: 50+ líneas de orquestación HTTP
 */
class VentaController extends Controller
{
    use ApiInertiaUnifiedResponse;

    public function __construct(
        private VentaService $ventaService,
    ) {
        $this->middleware('permission:ventas.index')->only('index');
        $this->middleware('permission:ventas.show')->only('show');
        $this->middleware('permission:ventas.store')->only('store', 'create');
        $this->middleware('permission:ventas.update')->only('update', 'edit');
        $this->middleware('permission:ventas.destroy')->only('destroy');
    }

    /**
     * Listar ventas con paginación
     *
     * Usado por:
     * - Web: GET /ventas (Inertia)
     * - API: GET /api/ventas (JSON)
     */
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        try {
            // Extraer filtros del request
            $filtros = [
                'estado' => $request->input('estado'),
                'cliente_id' => $request->input('cliente_id'),
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
            ];

            // Delegar al Service
            $ventasPaginadas = $this->ventaService->listar(
                perPage: $request->input('per_page', 15),
                filtros: array_filter($filtros) // Solo filtros no vacíos
            );

            // Responder según cliente
            return $this->respondPaginated(
                $ventasPaginadas,
                'Ventas/Index',
                [
                    'filtros' => $filtros,
                    'clientes' => Cliente::activo()->get(['id', 'nombre']),
                ]
            );

        } catch (\Exception $e) {
            return $this->respondError('Error al obtener ventas: ' . $e->getMessage());
        }
    }

    /**
     * Mostrar formulario de creación
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('Ventas/Create', [
            'clientes' => Cliente::activo()->select('id', 'nombre', 'nit')->get(),
            'productos' => Producto::activo()->select('id', 'nombre', 'codigo_barras')->get(),
            'almacenes' => Almacen::activo()->select('id', 'nombre')->get(),
            'monedas' => Moneda::activo()->select('id', 'codigo', 'nombre', 'simbolo')->get(),
        ]);
    }

    /**
     * Crear una venta
     *
     * Flujo:
     * 1. Validación (Form Request)
     * 2. Crear DTO
     * 3. Delegar a Service
     * 4. Adaptar respuesta
     */
    public function store(StoreVentaRequest $request): JsonResponse|RedirectResponse
    {
        try {
            // 1. Validación hecha por Form Request

            // 2. Crear DTO desde Request
            $dto = CrearVentaDTO::fromRequest($request);

            // 3. Delegar al Service (ÚNICA lógica de negocio)
            $ventaDTO = $this->ventaService->crear($dto);

            // 4. Responder según cliente
            return $this->respondSuccess(
                data: $ventaDTO,
                message: 'Venta creada exitosamente',
                redirectTo: route('ventas.show', $ventaDTO->id),
                statusCode: 201,
            );

        } catch (StockInsuficientException $e) {
            // Excepción específica de negocio
            return $this->respondError(
                message: $e->getMessage(),
                errors: $e->getErrors(),
                statusCode: $e->getHttpStatusCode(),
            );

        } catch (DomainException $e) {
            // Excepción genérica de negocio
            return $this->respondError(
                message: $e->getMessage(),
                errors: $e->getErrors(),
                statusCode: $e->getHttpStatusCode(),
            );

        } catch (\Exception $e) {
            // Error inesperado
            \Illuminate\Support\Facades\Log::error('Error al crear venta', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->respondError(
                message: 'Error al crear venta',
                statusCode: 500,
            );
        }
    }

    /**
     * Mostrar detalle de venta
     */
    public function show(int $id): JsonResponse|InertiaResponse
    {
        try {
            $ventaDTO = $this->ventaService->obtener($id);

            return $this->respondShow(
                data: $ventaDTO,
                inertiaComponent: 'Ventas/Show',
            );

        } catch (\Exception $e) {
            return $this->respondNotFound('Venta no encontrada');
        }
    }

    /**
     * Mostrar formulario de edición
     */
    public function edit(int $id): InertiaResponse
    {
        try {
            $ventaDTO = $this->ventaService->obtener($id);

            return Inertia::render('Ventas/Edit', [
                'venta' => $ventaDTO->toArray(),
                'clientes' => Cliente::activo()->select('id', 'nombre')->get(),
                'productos' => Producto::activo()->select('id', 'nombre')->get(),
            ]);

        } catch (\Exception $e) {
            return back()->with('error', 'Venta no encontrada');
        }
    }

    /**
     * Actualizar venta (solo si está en estado PENDIENTE)
     */
    public function update(StoreVentaRequest $request, int $id): JsonResponse|RedirectResponse
    {
        try {
            // TODO: Implementar UpdateVentaService si es necesario
            // Por ahora, solo informar que solo se pueden editar ventas PENDIENTE

            return $this->respondError(
                message: 'Actualización de ventas no soportada aún',
                statusCode: 422,
            );

        } catch (DomainException $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Eliminar venta
     *
     * Solo si está en estado PENDIENTE
     */
    public function destroy(int $id): JsonResponse|RedirectResponse
    {
        try {
            // TODO: Implementar DeleteVentaService si es necesario

            return $this->respondError(
                message: 'Eliminación de ventas no soportada',
                statusCode: 422,
            );

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Aprobar una venta (acción personalizada)
     *
     * POST /ventas/{id}/aprobar
     */
    public function aprobar(int $id): JsonResponse|RedirectResponse
    {
        try {
            $ventaDTO = $this->ventaService->aprobar($id);

            return $this->respondSuccess(
                data: $ventaDTO,
                message: 'Venta aprobada exitosamente',
                redirectTo: route('ventas.show', $id),
            );

        } catch (EstadoInvalidoException $e) {
            return $this->respondError(
                message: $e->getMessage(),
                statusCode: $e->getHttpStatusCode(),
            );

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Rechazar una venta (acción personalizada)
     *
     * POST /ventas/{id}/rechazar
     */
    public function rechazar(int $id): JsonResponse|RedirectResponse
    {
        try {
            $motivo = request()->input('motivo', '');

            $ventaDTO = $this->ventaService->rechazar($id, $motivo);

            return $this->respondSuccess(
                data: $ventaDTO,
                message: 'Venta rechazada',
                redirectTo: route('ventas.index'),
            );

        } catch (DomainException $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Registrar pago en una venta
     *
     * POST /ventas/{id}/pagos
     */
    public function registrarPago(Request $request, int $id): JsonResponse|RedirectResponse
    {
        try {
            $monto = (float) $request->input('monto');

            if ($monto <= 0) {
                throw new \InvalidArgumentException('Monto debe ser mayor a 0');
            }

            $ventaDTO = $this->ventaService->registrarPago($id, $monto);

            return $this->respondSuccess(
                data: $ventaDTO,
                message: 'Pago registrado exitosamente',
                redirectTo: route('ventas.show', $id),
            );

        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }
}
