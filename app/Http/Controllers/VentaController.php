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
use App\Models\User;
use App\Models\Venta;
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
        private \App\Services\ImpresionService $impresionService,
    ) {
        $this->middleware('permission:ventas.index')->only('index');
        $this->middleware('permission:ventas.show')->only('show');
        $this->middleware('permission:ventas.store')->only('store', 'create');
        $this->middleware('permission:ventas.update')->only('update', 'edit');
        $this->middleware('permission:ventas.destroy')->only('destroy');

        // ✅ Validar que el usuario tiene caja abierta ANTES de crear ventas
        $this->middleware('caja.abierta')->only(['store']);
    }

    /**
     * Listar ventas con paginación
     *
     * Usado por:
     * - Web: GET /ventas (Inertia)
     * - API: GET /api/ventas (JSON)
     */
    public function index(Request $request): JsonResponse|InertiaResponse|RedirectResponse
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
            return Inertia::render('ventas/index', [
                'ventas' => $ventasPaginadas,
                'filtros' => $filtros,
                'estadisticas' => null, // TODO: Implementar estadísticas completas cuando sea necesario
                'datosParaFiltros' => [
                    'clientes' => Cliente::activos()->select('id', 'nombre')->get(),
                    'monedas' => Moneda::activos()->select('id', 'codigo', 'nombre')->get(),
                ],
            ]);

        } catch (\Exception $e) {
            return $this->respondError('Error al obtener ventas: ' . $e->getMessage());
        }
    }

    /**
     * Mostrar formulario de creación
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('ventas/create', [
            'clientes' => Cliente::activos()->select('id', 'nombre', 'nit')->get(),
            'productos' => Producto::activos()->select('id', 'nombre', 'codigo_barras')->get(),
            'almacenes' => Almacen::activos()->select('id', 'nombre')->get(),
            'monedas' => Moneda::activos()->select('id', 'codigo', 'nombre', 'simbolo')->get(),
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

            // ✅ 2.5 Obtener caja_id del middleware
            $cajaId = $request->attributes->get('caja_id');

            // 3. Delegar al Service (ÚNICA lógica de negocio)
            $ventaDTO = $this->ventaService->crear($dto, $cajaId);

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

            // Si es API, retornar JSON
            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => true,
                    'data' => $ventaDTO->toArray(),
                ]);
            }

            // Si es web (Inertia), renderizar con el prop correcto
            return \Inertia\Inertia::render('ventas/show', [
                'venta' => $ventaDTO->toArray(),
            ]);

        } catch (\Exception $e) {
            return $this->respondNotFound('Venta no encontrada');
        }
    }

    /**
     * Mostrar formulario de edición
     *
     * ✅ Solo se pueden editar ventas en estado PENDIENTE
     */
    public function edit(int $id): InertiaResponse|RedirectResponse
    {
        try {
            $ventaDTO = $this->ventaService->obtener($id);

            // Validar que la venta está en estado PENDIENTE
            if ($ventaDTO->estado !== 'PENDIENTE') {
                return back()->with('error', 'Solo se pueden editar ventas en estado PENDIENTE');
            }

            return Inertia::render('ventas/edit', [
                'venta' => $ventaDTO->toArray(),
                'clientes' => Cliente::activos()->select('id', 'nombre')->get(),
                'productos' => Producto::activos()->select('id', 'nombre')->get(),
            ]);

        } catch (\Exception $e) {
            return back()->with('error', 'Venta no encontrada');
        }
    }

    /**
     * Actualizar venta (solo si está en estado PENDIENTE)
     *
     * ✅ Validaciones:
     * - Solo se pueden editar ventas en estado PENDIENTE
     * - No se pueden cambiar si ya fueron aprobadas/generadas
     */
    public function update(StoreVentaRequest $request, int $id): JsonResponse|RedirectResponse
    {
        try {
            $ventaActual = Venta::findOrFail($id);

            // Validar que la venta está en estado PENDIENTE
            if ($ventaActual->estado !== 'PENDIENTE') {
                return $this->respondError(
                    message: "No se puede editar una venta en estado {$ventaActual->estado}. Solo se pueden editar ventas PENDIENTE.",
                    statusCode: 422,
                );
            }

            // TODO: Implementar UpdateVentaService para actualizar los detalles
            // Por ahora, retornar error hasta que se implemente

            return $this->respondError(
                message: 'Actualización de ventas no soportada aún (en desarrollo)',
                statusCode: 422,
            );

        } catch (DomainException $e) {
            return $this->respondError($e->getMessage());
        } catch (\Exception $e) {
            return $this->respondError('Error al actualizar venta');
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

    /**
     * Obtener productos con stock bajo
     *
     * GET /ventas/stock/bajo
     */
    public function productosStockBajo(): JsonResponse
    {
        try {
            $stockBajo = Producto::activos()
                ->whereRaw('(SELECT SUM(cantidad) FROM stock_productos WHERE producto_id = productos.id) <= stock_minimo')
                ->with(['stock', 'categoria', 'marca'])
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'nombre' => $p->nombre,
                    'sku' => $p->sku,
                    'stock_actual' => $p->stock->sum('cantidad') ?? 0,
                    'stock_minimo' => $p->stock_minimo,
                    'categoria' => $p->categoria?->nombre ?? 'Sin categoría',
                ]);

            return response()->json([
                'success' => true,
                'data' => $stockBajo,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener productos con stock bajo: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener stock de un producto específico
     *
     * GET /ventas/stock/producto/{producto}
     */
    public function obtenerStockProducto(Producto $producto): JsonResponse
    {
        try {
            $stockPorAlmacen = $producto->stock()
                ->with('almacen')
                ->get()
                ->map(fn($s) => [
                    'almacen_id' => $s->almacen_id,
                    'almacen_nombre' => $s->almacen?->nombre ?? 'Desconocido',
                    'cantidad' => $s->cantidad,
                ])
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'producto_id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'stock_total' => $producto->stock->sum('cantidad') ?? 0,
                    'stock_minimo' => $producto->stock_minimo,
                    'stock_maximo' => $producto->stock_maximo,
                    'por_almacen' => $stockPorAlmacen,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener stock del producto: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar stock disponible
     *
     * POST /ventas/stock/verificar
     */
    public function verificarStock(Request $request): JsonResponse
    {
        try {
            $detalles = $request->input('detalles', []);
            $almacenId = $request->input('almacen_id');

            $verificacion = [];
            foreach ($detalles as $detalle) {
                $producto = Producto::find($detalle['producto_id']);
                if (!$producto) {
                    $verificacion[] = [
                        'producto_id' => $detalle['producto_id'],
                        'disponible' => false,
                        'razon' => 'Producto no encontrado',
                    ];
                    continue;
                }

                $stockDisponible = $producto->stock()
                    ->when($almacenId, fn($q) => $q->where('almacen_id', $almacenId))
                    ->sum('cantidad') ?? 0;

                $verificacion[] = [
                    'producto_id' => $detalle['producto_id'],
                    'nombre' => $producto->nombre,
                    'cantidad_solicitada' => $detalle['cantidad'],
                    'stock_disponible' => $stockDisponible,
                    'disponible' => $stockDisponible >= $detalle['cantidad'],
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $verificacion,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar stock: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Imprimir venta en formato especificado
     *
     * @param Venta $venta
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function imprimir(Venta $venta, Request $request)
    {
        $formato = $request->input('formato', 'A4'); // A4, TICKET_80, TICKET_58
        $accion = $request->input('accion', 'download'); // download | stream

        try {
            $pdf = $this->impresionService->imprimirVenta($venta, $formato);

            $nombreArchivo = "venta_{$venta->numero}_{$formato}.pdf";

            return $accion === 'stream'
                ? $pdf->stream($nombreArchivo)
                : $pdf->download($nombreArchivo);
        } catch (\Exception $e) {
            return back()->with('error', 'Error al generar PDF: ' . $e->getMessage());
        }
    }

    /**
     * Preview de impresión (retorna HTML para vista previa)
     *
     * @param Venta $venta
     * @param Request $request
     * @return \Illuminate\View\View
     */
    public function preview(Venta $venta, Request $request)
    {
        $formato = $request->input('formato', 'A4');

        try {
            $plantilla = \App\Models\PlantillaImpresion::obtenerDefault('venta', $formato);

            if (!$plantilla) {
                abort(404, "No existe plantilla para el formato '{$formato}'");
            }

            $empresa = \App\Models\Empresa::principal();

            // Cargar relaciones necesarias
            $venta->load([
                'cliente',
                'detalles.producto',
                'usuario',
                'tipoPago',
                'tipoDocumento',
                'moneda',
                'estadoDocumento',
            ]);

            return view($plantilla->vista_blade, [
                'documento' => $venta,
                'empresa' => $empresa,
                'plantilla' => $plantilla,
                'fecha_impresion' => now(),
                'usuario' => auth()->user(),
                'opciones' => [],
            ]);
        } catch (\Exception $e) {
            abort(500, 'Error al generar preview: ' . $e->getMessage());
        }
    }

    /**
     * Obtener formatos de impresión disponibles para ventas
     *
     * @return JsonResponse
     */
    public function formatosDisponibles()
    {
        try {
            $formatos = $this->impresionService->obtenerFormatosDisponibles('venta');

            return response()->json([
                'success' => true,
                'data' => $formatos,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener formatos: ' . $e->getMessage(),
            ], 500);
        }
    }
}
