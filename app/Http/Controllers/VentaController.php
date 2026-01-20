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
use App\Models\EstadoDocumento;
use App\Models\Moneda;
use App\Models\Producto;
use App\Models\TipoDocumento;
use App\Models\TipoPago;
use App\Models\User;
use App\Models\Venta;
use App\Services\Venta\VentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
        private \App\Services\PrinterService $printerService,
    ) {
        // ✅ ACTUALIZADO: Permisos solo para peticiones web, NO para API
        // Los clientes móviles acceden a sus propias ventas (filtradas por cliente_id autenticado)
        // sin necesidad de permisos de administrador

        $this->middleware(function ($request, $next) {
            $isApiRequest = $request->expectsJson() || str_starts_with($request->path(), 'api/');

            // Aplicar permisos SOLO a peticiones WEB
            if (!$isApiRequest) {
                // Para web, aplicar validaciones de permisos en el método si es necesario
                // Por ahora permitir acceso con autenticación
            }

            return $next($request);
        });

        // ✅ Validar que el usuario tiene caja abierta ANTES de crear ventas
        $this->middleware('caja.abierta')->only(['store']);
    }

    /**
     * Listar ventas con paginación
     *
     * Usado por:
     * - Web: GET /ventas (Inertia)
     * - API: GET /api/ventas (JSON) - FILTRA POR CLIENTE AUTENTICADO
     */
    public function index(Request $request): JsonResponse | InertiaResponse | RedirectResponse
    {
        try {
            // ✅ NUEVO: Si es API request, filtrar por cliente autenticado
            $isApiRequest = $request->expectsJson() || str_starts_with($request->path(), 'api/');

            // Extraer filtros del request
            $filtros = [
                'estado'              => $request->input('estado'),
                'estado_documento_id' => $request->input('estado_documento_id'),
                'cliente_id'          => $request->input('cliente_id'),
                'usuario_id'          => $request->input('usuario_id'),
                'fecha_desde'         => $request->input('fecha_desde'),
                'fecha_hasta'         => $request->input('fecha_hasta'),
                'numero'              => $request->input('numero'),
                'search'              => $request->input('search') ?? $request->input('busqueda'), // Soportar busqueda del app
                'monto_min'           => $request->input('monto_min'),
                'monto_max'           => $request->input('monto_max'),
                'moneda_id'           => $request->input('moneda_id'),
                'tipo_venta'          => $request->input('tipo_venta'),
                'estado_pago'         => $request->input('estado_pago'),      // ✅ NUEVO: Para filtro de estado de pago
                'estado_logistico'    => $request->input('estado_logistico'), // ✅ NUEVO: Para filtro de estado logístico
            ];

            // ✅ NUEVO: Si es API, filtrar por cliente autenticado
            if ($isApiRequest && auth()->check()) {
                $user = auth()->user();
                // Obtener el cliente asociado al usuario autenticado
                if ($user->cliente_id) {
                    $filtros['cliente_id'] = $user->cliente_id;
                    Log::debug('📋 API Ventas - Filtrando por cliente autenticado', [
                        'user_id'    => $user->id,
                        'cliente_id' => $user->cliente_id,
                    ]);
                }
            }

            // Delegar al Service
            $ventasPaginadas = $this->ventaService->listar(
                perPage: $request->input('per_page', 15),
                filtros: array_filter($filtros) // Solo filtros no vacíos
            );

            // ✅ NUEVO: Transformar datos para asegurar que Inertia tenga acceso a todas las relaciones
            // Convertir modelos a arrays incluyendo explícitamente las relaciones
            Log::debug('📦 VentaController::index - Transformando ventas', [
                'total'                         => $ventasPaginadas->total(),
                'primera_venta_id'              => $ventasPaginadas->first()?->id,
                'primera_venta_tiene_direccion' => $ventasPaginadas->first()?->direccionCliente ? 'SÍ' : 'NO',
                'primera_venta_direccion'       => $ventasPaginadas->first()?->direccionCliente?->direccion ?? 'N/A',
                'primera_venta_latitud'         => $ventasPaginadas->first()?->direccionCliente?->latitud ?? 'N/A',
            ]);

            $ventasPaginadas->getCollection()->transform(function ($venta) {
                return [
                    'id'                         => $venta->id,
                    'numero'                     => $venta->numero,
                    'fecha'                      => $venta->fecha,
                    'subtotal'                   => $venta->subtotal,
                    'descuento'                  => $venta->descuento,
                    'impuesto'                   => $venta->impuesto,
                    'total'                      => $venta->total,
                    'peso_total_estimado'        => $venta->peso_total_estimado,
                    'observaciones'              => $venta->observaciones,
                    'requiere_envio'             => $venta->requiere_envio,
                    'canal_origen'               => $venta->canal_origen,
                    'estado'                     => $venta->estado,
                    'estado_logistico'           => $venta->estado_logistico,
                    'estado_logistico_id'        => $venta->estado_logistico_id,
                    'fecha_entrega_comprometida' => $venta->fecha_entrega_comprometida,
                    'hora_entrega_comprometida'  => $venta->hora_entrega_comprometida,
                    'cliente_id'                 => $venta->cliente_id,
                    'usuario_id'                 => $venta->usuario_id,
                    'estado_documento_id'        => $venta->estado_documento_id,
                    'moneda_id'                  => $venta->moneda_id,
                    'direccion_cliente_id'       => $venta->direccion_cliente_id,
                    'proforma_id'                => $venta->proforma_id,
                    'created_at'                 => $venta->created_at,
                    'updated_at'                 => $venta->updated_at,
                    // ✅ RELACIONES - Incluir explícitamente
                    'cliente'                    => $venta->cliente ? [
                        'id'       => $venta->cliente->id,
                        'nombre'   => $venta->cliente->nombre,
                        'nit'      => $venta->cliente->nit,
                        'email'    => $venta->cliente->email,
                        'telefono' => $venta->cliente->telefono,
                    ] : null,
                    'usuario'                    => $venta->usuario ? [
                        'id'    => $venta->usuario->id,
                        'name'  => $venta->usuario->name,
                        'email' => $venta->usuario->email,
                    ] : null,
                    'estado_documento'           => $venta->estadoDocumento ? [
                        'id'     => $venta->estadoDocumento->id,
                        'codigo' => $venta->estadoDocumento->codigo,
                        'nombre' => $venta->estadoDocumento->nombre,
                    ] : null,
                    'moneda'                     => $venta->moneda ? [
                        'id'     => $venta->moneda->id,
                        'codigo' => $venta->moneda->codigo,
                        'nombre' => $venta->moneda->nombre,
                    ] : null,
                    'direccionCliente'           => $venta->direccionCliente ? [
                        'id'           => $venta->direccionCliente->id,
                        'direccion'    => $venta->direccionCliente->direccion,
                        'referencias'  => $venta->direccionCliente->observaciones,
                        'localidad_id' => $venta->direccionCliente->localidad_id,
                        'localidad'    => $venta->direccionCliente->localidad?->nombre ?? null,
                        'latitud'      => (float) ($venta->direccionCliente->latitud ?? 0),
                        'longitud'     => (float) ($venta->direccionCliente->longitud ?? 0),
                        'es_principal' => $venta->direccionCliente->es_principal,
                        'activa'       => $venta->direccionCliente->activa,
                    ] : null,
                    'estadoLogistica'            => $venta->estadoLogistica ? [
                        'id'        => $venta->estadoLogistica->id,
                        'codigo'    => $venta->estadoLogistica->codigo,
                        'nombre'    => $venta->estadoLogistica->nombre,
                        'categoria' => $venta->estadoLogistica->categoria,
                    ] : null,
                ];
            });

            // ✅ NUEVO: Responder diferente según si es API o Web
            if ($isApiRequest) {
                // API Response - Para Flutter app
                return response()->json([
                    'success'      => true,
                    'message'      => 'Ventas obtenidas exitosamente',
                    'data'         => $ventasPaginadas->items(),
                    'total'        => $ventasPaginadas->total(),
                    'per_page'     => $ventasPaginadas->perPage(),
                    'current_page' => $ventasPaginadas->currentPage(),
                    'last_page'    => $ventasPaginadas->lastPage(),
                ], 200);
            }

            // Web Response - Inertia para navegador
            return Inertia::render('ventas/index', [
                'ventas'           => $ventasPaginadas,
                'filtros'          => $filtros,
                'estadisticas'     => null, // TODO: Implementar estadísticas completas cuando sea necesario
                'datosParaFiltros' => [
                    'clientes'          => Cliente::activos()->select('id', 'nombre', 'nit')->get(),
                    'estados_documento' => EstadoDocumento::select('id', 'nombre', 'codigo')->get(),
                    'usuarios'          => User::select('id', 'name')->orderBy('name')->get(),
                    'monedas'           => Moneda::activos()->select('id', 'codigo', 'nombre')->get(),
                ],
            ]);

        } catch (\Exception $e) {
            if ($isApiRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al obtener ventas: ' . $e->getMessage(),
                ], 500);
            }
            return $this->respondError('Error al obtener ventas: ' . $e->getMessage());
        }
    }

    /**
     * Mostrar formulario de creación
     */
    public function create(): InertiaResponse
    {
        // Obtener tipos de pago con sus iconos
        $tiposPago = TipoPago::activos()->select('id', 'nombre', 'codigo')->get()->map(fn($tipo) => [
            'id'     => $tipo->id,
            'nombre' => $tipo->nombre,
            'icono'  => $tipo->getIcon(),
        ])->toArray();

        return Inertia::render('ventas/create', [
            'clientes'        => Cliente::activos()->select('id', 'nombre', 'nit')->get(),
            'productos'       => Producto::activos()->select('id', 'nombre', 'codigo_barras')->get(),
            'almacenes'       => Almacen::activos()->select('id', 'nombre')->get(),
            'monedas'         => Moneda::activos()->select('id', 'codigo', 'nombre', 'simbolo')->get(),
            'tipos_documento' => TipoDocumento::activos()->select('id', 'codigo', 'nombre')->get(),
            'tipos_pago'      => $tiposPago,
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
    public function store(StoreVentaRequest $request): JsonResponse | RedirectResponse
    {
        try {
            // 1. Validación hecha por Form Request

            // 2. Crear DTO desde Request
            $dto = CrearVentaDTO::fromRequest($request);

            // ✅ 2.5 Obtener caja_id del middleware
            $cajaId = $request->attributes->get('caja_id');

            // 3. Delegar al Service (ÚNICA lógica de negocio)
            $ventaDTO = $this->ventaService->crear($dto, $cajaId);

            // 3.5 Imprimir ticket en impresora térmica
            try {
                $venta = Venta::with(['cliente', 'detalles', 'tipoPago'])->findOrFail($ventaDTO->id);

                $datosTicket = [
                    'numero'         => $venta->numero,
                    'cliente_nombre' => $venta->cliente?->nombre ?? 'Cliente',
                    'cliente_nit'    => $venta->cliente?->nit ?? '',
                    'fecha'          => $venta->fecha,
                    'detalles'       => $venta->detalles->map(fn($d) => [
                        'producto' => $d->producto?->nombre ?? 'Producto',
                        'cantidad' => $d->cantidad,
                        'precio'   => $d->precio_unitario,
                        'subtotal' => $d->subtotal,
                    ])->toArray(),
                    'subtotal'       => $venta->subtotal,
                    'descuento'      => $venta->descuento,
                    'total'          => $venta->total,
                    'tipo_pago'      => $venta->tipoPago?->nombre ?? 'Contado',
                ];

                $this->printerService->printTicket($datosTicket);
            } catch (\Exception $e) {
                // Log error pero no fallar la creación de venta
                \Illuminate\Support\Facades\Log::warning('Advertencia al imprimir ticket', [
                    'venta_id' => $ventaDTO->id,
                    'error'    => $e->getMessage(),
                ]);
            }

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
    public function show(int $id): JsonResponse | InertiaResponse
    {
        try {
            $ventaDTO = $this->ventaService->obtener($id);

            // Si es API, retornar JSON
            if ($this->isApiRequest()) {
                return response()->json([
                    'success' => true,
                    'data'    => $ventaDTO->toArray(),
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
    public function edit(int $id): InertiaResponse | RedirectResponse
    {
        try {
            $ventaDTO = $this->ventaService->obtener($id);

            // Validar que la venta está en estado PENDIENTE
            if ($ventaDTO->estado !== 'PENDIENTE') {
                return back()->with('error', 'Solo se pueden editar ventas en estado PENDIENTE');
            }

            return Inertia::render('ventas/edit', [
                'venta'     => $ventaDTO->toArray(),
                'clientes'  => Cliente::activos()->select('id', 'nombre')->get(),
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
    public function update(StoreVentaRequest $request, int $id): JsonResponse | RedirectResponse
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
    public function destroy(int $id): JsonResponse | RedirectResponse
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
     * Anular una venta (cambiar estado a ANULADA)
     *
     * POST /ventas/{id}/anular
     */
    public function anular(Request $request, int $id): JsonResponse
    {
        try {
            // Verificar permiso
            if (! auth()->user()->hasRole('Admin')) {
                return $this->respondForbidden('No tienes permiso para anular ventas');
            }

            $venta = Venta::findOrFail($id);

            // Validar que la venta pueda ser anulada
            if ($venta->estado === 'ANULADA') {
                return $this->respondError('Esta venta ya está anulada', 422);
            }

            // Actualizar estado
            $venta->update([
                'estado'        => 'ANULADA',
                'observaciones' => ($venta->observaciones ?? '') . "\n[ANULADA] " . ($request->input('motivo') ?? 'Sin motivo especificado') . " - " . now()->toDateTimeString(),
            ]);

            \Illuminate\Support\Facades\Log::info('Venta anulada', [
                'venta_id'     => $venta->id,
                'venta_numero' => $venta->numero,
                'usuario_id'   => auth()->id(),
                'motivo'       => $request->input('motivo'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Venta anulada exitosamente',
                'data'    => $venta,
            ], 200);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al anular venta', [
                'venta_id' => $id,
                'error'    => $e->getMessage(),
            ]);
            return $this->respondError('Error al anular venta: ' . $e->getMessage());
        }
    }

    /**
     * Aprobar una venta (acción personalizada)
     *
     * POST /ventas/{id}/aprobar
     */
    public function aprobar(int $id): JsonResponse | RedirectResponse
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
    public function rechazar(int $id): JsonResponse | RedirectResponse
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
    public function registrarPago(Request $request, int $id): JsonResponse | RedirectResponse
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
                    'id'           => $p->id,
                    'nombre'       => $p->nombre,
                    'sku'          => $p->sku,
                    'stock_actual' => $p->stock->sum('cantidad') ?? 0,
                    'stock_minimo' => $p->stock_minimo,
                    'categoria'    => $p->categoria?->nombre ?? 'Sin categoría',
                ]);

            return response()->json([
                'success' => true,
                'data'    => $stockBajo,
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
                    'almacen_id'     => $s->almacen_id,
                    'almacen_nombre' => $s->almacen?->nombre ?? 'Desconocido',
                    'cantidad'       => $s->cantidad,
                ])
                ->toArray();

            return response()->json([
                'success' => true,
                'data'    => [
                    'producto_id'  => $producto->id,
                    'nombre'       => $producto->nombre,
                    'stock_total'  => $producto->stock->sum('cantidad') ?? 0,
                    'stock_minimo' => $producto->stock_minimo,
                    'stock_maximo' => $producto->stock_maximo,
                    'por_almacen'  => $stockPorAlmacen,
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
            $detalles  = $request->input('detalles', []);
            $almacenId = $request->input('almacen_id');

            $verificacion = [];
            foreach ($detalles as $detalle) {
                $producto = Producto::find($detalle['producto_id']);
                if (! $producto) {
                    $verificacion[] = [
                        'producto_id' => $detalle['producto_id'],
                        'disponible'  => false,
                        'razon'       => 'Producto no encontrado',
                    ];
                    continue;
                }

                $stockDisponible = $producto->stock()
                    ->when($almacenId, fn($q) => $q->where('almacen_id', $almacenId))
                    ->sum('cantidad') ?? 0;

                $verificacion[] = [
                    'producto_id'         => $detalle['producto_id'],
                    'nombre'              => $producto->nombre,
                    'cantidad_solicitada' => $detalle['cantidad'],
                    'stock_disponible'    => $stockDisponible,
                    'disponible'          => $stockDisponible >= $detalle['cantidad'],
                ];
            }

            return response()->json([
                'success' => true,
                'data'    => $verificacion,
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
        // ✅ DEBUG: Verificar que el método se está llamando
        \Log::info('🖨️ [VentaController::imprimir] Método llamado', [
            'venta_id' => $venta->id,
            'user_id' => auth()->id(),
            'formato' => $request->input('formato'),
        ]);

        $user = auth()->user();

        // ✅ AUTORIZACIÓN: Validar que el usuario tiene permiso para descargar esta venta
        // - Super Admin y Admin: acceso a todas las ventas
        // - Chofer: solo ventas asignadas a sus entregas
        // - Cliente: solo sus propias ventas
        if (!$this->userCanAccessVenta($user, $venta)) {
            \Log::warning('❌ [VentaController::imprimir] Autorización fallida', [
                'user_id' => $user->id,
                'user_roles' => $user->getRoleNames()->toArray(),
                'venta_id' => $venta->id,
            ]);
            return response()->json([
                'message' => 'No tiene permiso para descargar esta venta',
            ], 403);
        }

        \Log::info('✅ [VentaController::imprimir] Autorización exitosa', [
            'user_id' => $user->id,
            'venta_id' => $venta->id,
        ]);

        $formato = $request->input('formato', 'A4');      // A4, TICKET_80, TICKET_58
        $accion  = $request->input('accion', 'download'); // download | stream

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
        $user = auth()->user();

        // ✅ AUTORIZACIÓN: Validar que el usuario tiene permiso para ver preview de esta venta
        if (!$this->userCanAccessVenta($user, $venta)) {
            abort(403, 'No tiene permiso para ver el preview de esta venta');
        }

        $formato = $request->input('formato', 'A4');

        try {
            $plantilla = \App\Models\PlantillaImpresion::obtenerDefault('venta', $formato);

            if (! $plantilla) {
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
                'accessToken',
            ]);

            return view($plantilla->vista_blade, [
                'documento'       => $venta,
                'empresa'         => $empresa,
                'plantilla'       => $plantilla,
                'fecha_impresion' => now(),
                'usuario'         => auth()->user(),
                'opciones'        => [],
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
                'data'    => $formatos,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener formatos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ AUTORIZACIÓN: Verificar si el usuario tiene permiso para acceder a una venta
     *
     * Reglas:
     * - Super Admin y Admin: acceso a todas las ventas
     * - Chofer: solo ventas asignadas a sus entregas
     * - Cliente: solo sus propias ventas
     *
     * @param \App\Models\User $user
     * @param \App\Models\Venta $venta
     * @return bool
     */
    private function userCanAccessVenta($user, Venta $venta): bool
    {
        \Log::debug('🔐 [userCanAccessVenta] Verificando autorización', [
            'user_id' => $user->id,
            'user_roles' => $user->getRoleNames()->toArray(),
            'venta_id' => $venta->id,
        ]);

        // Super Admin y Admin: acceso a todas las ventas
        if ($user->hasRole(['Super Admin', 'Admin', 'admin'])) {
            \Log::debug('✅ [userCanAccessVenta] Admin/Super Admin access granted');
            return true;
        }

        // Cliente: solo puede acceder a sus propias ventas
        // ✅ Verificar ambas variaciones de rol: 'Cliente' y 'cliente'
        if ($user->hasRole(['Cliente', 'cliente'])) {
            $canAccess = $venta->cliente_id === $user->cliente_id;
            \Log::debug('🔐 [userCanAccessVenta] Cliente check', [
                'user_cliente_id' => $user->cliente_id,
                'venta_cliente_id' => $venta->cliente_id,
                'can_access' => $canAccess,
            ]);
            return $canAccess;
        }

        // Chofer: puede acceder a ventas asignadas a sus entregas
        // ✅ Verificar ambas variaciones de rol: 'Chofer' y 'chofer'
        if ($user->hasRole(['Chofer', 'chofer'])) {
            \Log::debug('🔐 [userCanAccessVenta] Checking chofer entregas...');

            // ✅ CORREGIDO: Relación es 1:N directa (Venta.entrega_id -> Entrega.id)
            // NO es many-to-many via tabla pivot
            $canAccess = $venta->entrega_id &&
                        $venta->entrega &&
                        $venta->entrega->chofer_id === $user->id;

            \Log::debug('🔐 [userCanAccessVenta] Chofer entrega check', [
                'user_chofer_id' => $user->id,
                'venta_entrega_id' => $venta->entrega_id,
                'entrega_chofer_id' => $venta->entrega?->chofer_id,
                'can_access' => $canAccess,
            ]);

            return $canAccess;
        }

        \Log::debug('❌ [userCanAccessVenta] No matching role found');
        // Si no es Super Admin, Admin, Cliente o Chofer, denegar acceso
        return false;
    }
}
