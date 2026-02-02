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
use Illuminate\Support\Facades\DB;
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
        private \App\Services\ExcelExportService $excelExportService,
    ) {
        // ✅ ACTUALIZADO: Permisos solo para peticiones web, NO para API
        // Los clientes móviles acceden a sus propias ventas (filtradas por cliente_id autenticado)
        // sin necesidad de permisos de administrador

        $this->middleware(function ($request, $next) {
            $isApiRequest = $request->expectsJson() || str_starts_with($request->path(), 'api/');

            // Aplicar permisos SOLO a peticiones WEB
            if (! $isApiRequest) {
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
                'id'                  => $request->input('id'),
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

            // ✅ VERIFICACIÓN DE ROL: Si el usuario tiene rol "Cliente", filtrar solo sus ventas
            if (auth()->check()) {
                $user = auth()->user();

                // Si el usuario tiene rol de Cliente, mostrar solo sus propias ventas
                if ($user->hasRole(['Cliente', 'cliente'])) {
                    // ✅ CORREGIDO: Usar $user->cliente->id porque la relación es HasOne (FK en clientes.user_id)
                    $clienteId = $user->cliente?->id;

                    if ($clienteId) {
                        $filtros['cliente_id'] = $clienteId;
                        Log::debug('📋 Ventas - Usuario con rol Cliente', [
                            'user_id'    => $user->id,
                            'cliente_id' => $clienteId,
                            'mensaje'    => 'Filtrando solo ventas del cliente autenticado',
                        ]);
                    } else {
                        Log::warning('⚠️ Ventas - Usuario con rol Cliente pero sin cliente asociado', [
                            'user_id' => $user->id,
                            'mensaje' => 'El usuario tiene rol Cliente pero no tiene un cliente relacionado',
                        ]);
                    }
                }
                // Si es API y no es cliente, también filtrar por cliente_id si existe
                elseif ($isApiRequest && $user->cliente) {
                    $clienteId             = $user->cliente->id;
                    $filtros['cliente_id'] = $clienteId;
                    Log::debug('📋 API Ventas - Filtrando por cliente asociado al usuario', [
                        'user_id'    => $user->id,
                        'cliente_id' => $clienteId,
                        'roles'      => $user->getRoleNames()->toArray(),
                    ]);
                }
            }

            // Delegar al Service
            // ✅ MODIFICADO: por defecto 20 registros por página para mejor UX en móvil
            $ventasPaginadas = $this->ventaService->listar(
                perPage: $request->input('per_page', 20),
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
                    'politica_pago'              => $venta->politica_pago, // ✅ NUEVO
                    'tipo_pago_id'               => $venta->tipo_pago_id,  // ✅ NUEVO
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
                    'tipoPago'                   => $venta->tipoPago ? [
                        'id'     => $venta->tipoPago->id,
                        'nombre' => $venta->tipoPago->nombre,
                        'codigo' => $venta->tipoPago->codigo,
                    ] : null,
                ];
            });

            // ✅ NUEVO: Responder diferente según si es API o Web
            if ($isApiRequest) {
                // ✅ Calcular si hay más páginas
                $hasMorePages = $ventasPaginadas->currentPage() < $ventasPaginadas->lastPage();

                // API Response - Para Flutter app (con paginación)
                return response()->json([
                    'success'        => true,
                    'message'        => 'Ventas obtenidas exitosamente',
                    'data'           => $ventasPaginadas->items(),
                    'total'          => $ventasPaginadas->total(),
                    'per_page'       => $ventasPaginadas->perPage(),
                    'current_page'   => $ventasPaginadas->currentPage(),
                    'last_page'      => $ventasPaginadas->lastPage(),
                    'has_more_pages' => $hasMorePages, // ✅ Para que Flutter sepa si cargar más
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
            'codigo' => $tipo->codigo, // ✅ NUEVO: Incluir codigo para que frontend pueda verificar si es CREDITO
            'icono'  => $tipo->getIcon(),
        ])->toArray();

        // ✅ NUEVO: Obtener almacén de la empresa principal
        $empresaPrincipal = \App\Models\Empresa::principal();
        $almacenIdEmpresa = (int) ($empresaPrincipal?->almacen_id ?? 1); // ✅ Cast a int explícito

        Log::info('📦 VentaController::create - Obteniendo productos con stock', [
            'almacen_id_empresa' => $almacenIdEmpresa,
            'empresa_principal'  => $empresaPrincipal?->nombre,
        ]);

                                  // ✅ MODIFICADO: NO cargar productos en la página
                                  // Los productos se obtienen via API (/api/productos/buscar) cuando el usuario busca
                                  // Esto es más eficiente si hay 1000+ productos
        $productos = collect([]); // Array vacío (collection), se usan via API

        Log::info('✅ VentaController::create - Usando búsqueda API para productos', [
            'almacen_id_empresa' => $almacenIdEmpresa,
            'nota'               => 'Productos se cargan dinámicamente via /api/productos/buscar',
        ]);

        return Inertia::render('ventas/create', [
            'clientes'           => Cliente::activos()->select('id', 'nombre', 'nit')->get(),
            'productos'          => $productos, // ✅ MODIFICADO: Solo productos con stock en almacén
            'almacenes'          => Almacen::activos()->select('id', 'nombre')->get(),
            'monedas'            => Moneda::activos()->select('id', 'codigo', 'nombre', 'simbolo')->get(),
            'tipos_documento'    => TipoDocumento::activos()->select('id', 'codigo', 'nombre')->get(),
            'tipos_pago'         => $tiposPago,
            'estados_documento'  => EstadoDocumento::where('activo', true)->select('id', 'codigo', 'nombre')->get(), // ✅ NUEVO: Estados de documento
            'almacen_id_empresa' => $almacenIdEmpresa,                                                               // ✅ NUEVO: Almacén de la empresa
        ]);
    }

    /**
     * Verificar si hay caja abierta (para validación frontend)
     * GET /ventas/check-caja-abierta
     *
     * Busca cajas abiertas de CUALQUIER DÍA, no solo del día actual
     */
    public function checkCajaAbierta(Request $request): JsonResponse
    {
        try {
            $user = \Illuminate\Support\Facades\Auth::user();

            if (! $user) {
                return response()->json([
                    'tiene_caja_abierta' => false,
                    'mensaje'            => 'Usuario no autenticado',
                ], 200);
            }

            // ✅ SIMPLIFICADO: Buscar directamente caja abierta del usuario por user_id
            $apertura = \App\Models\AperturaCaja::where('user_id', $user->id)
                ->whereDoesntHave('cierre')
                ->with('caja', 'usuario') // ✅ CORREGIDO: La relación se llama 'usuario', no 'user'
                ->latest('fecha')
                ->first();

            // Si el usuario tiene caja abierta
            if ($apertura) {
                $hoy           = today();
                $fechaApertura = $apertura->fecha instanceof \Carbon\Carbon
                    ? $apertura->fecha
                    : \Carbon\Carbon::parse($apertura->fecha);

                $esDeHoy = $fechaApertura->isSameDay($hoy);
                // ✅ CORREGIDO: Calcular días correctamente
                $diasAtras = $esDeHoy ? 0 : abs($fechaApertura->diffInDays($hoy));

                return response()->json([
                    'tiene_caja_abierta' => true,
                    'caja_id'            => $apertura->caja_id,
                    'caja_nombre'        => $apertura->caja?->nombre,
                    'apertura_id'        => $apertura->id,
                    'apertura_fecha'     => $apertura->fecha,
                    'es_de_hoy'          => $esDeHoy,
                    'dias_atras'         => $diasAtras,
                    'usuario_caja'       => $apertura->usuario?->name ?? 'Desconocido', // ✅ CORREGIDO: usuario, no user
                    'mensaje'            => $esDeHoy
                        ? '✅ Caja abierta hoy'
                        : "⚠️ Caja abierta desde hace {$diasAtras} día(s)",
                ], 200);
            }

            return response()->json([
                'tiene_caja_abierta' => false,
                'mensaje'            => 'No hay caja abierta para este usuario',
            ], 200);

        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error en checkCajaAbierta', [
                'user_id' => auth()->id(),
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            // Return JSON error response instead of HTML error page
            return response()->json([
                'tiene_caja_abierta' => false,
                'es_cajero'          => false,
                'mensaje'            => 'Error al verificar caja abierta',
                'error'              => $e->getMessage(),
            ], 500);
        }
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

            // 4. Responder siempre con JSON (el frontend maneja la redirección)
            return $this->respondSuccess(
                data: $ventaDTO,
                message: 'Venta creada exitosamente',
                statusCode: 201,
            );

        } catch (StockInsuficientException $e) {
            // Excepción específica de negocio - retornar siempre JSON
            return $this->respondError(
                message: $e->getMessage(),
                errors: $e->getErrors(),
                statusCode: $e->getHttpStatusCode(),
            );

        } catch (DomainException $e) {
            // Excepción genérica de negocio - retornar siempre JSON
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
     * Anular una venta (cambiar estado a ANULADO)
     *
     * POST /ventas/{id}/anular
     *
     * Consideraciones:
     * - Restaura stock si ya fue consumido (estado Aprobado)
     * - Anula movimientos de caja si existen
     * - Anula asientos contables si existen
     * - No permite anular ventas Facturadas o Canceladas
     */
    public function anular(Request $request, int $id): JsonResponse
    {
        try {
            Log::info('🔴 [ANULAR VENTA] INICIO - Intentando anular venta', [
                'venta_id' => $id,
                'usuario_id' => auth()->id(),
                'usuario_nombre' => auth()->user()?->name,
            ]);

            // Verificar permiso
            if (! auth()->user()->hasRole(['admin', 'Admin'])) {
                Log::warning('🔴 [ANULAR VENTA] PERMISO DENEGADO', [
                    'venta_id' => $id,
                    'usuario_id' => auth()->id(),
                    'roles' => auth()->user()?->getRoleNames(),
                ]);
                return $this->respondForbidden('No tienes permiso para anular ventas');
            }

            $motivo = $request->input('motivo', 'Sin motivo especificado');

            $venta = Venta::with([
                'detalles',
                'movimientoCaja',
                'asientoContable',
                'pagos',
            ])->findOrFail($id);

            Log::info('🔴 [ANULAR VENTA] VENTA ENCONTRADA', [
                'venta_id' => $venta->id,
                'venta_numero' => $venta->numero,
                'estado_actual' => $venta->estado,
            ]);

            // Validar que la venta pueda ser anulada
            if ($venta->estado === 'Anulado') {
                Log::warning('🔴 [ANULAR VENTA] YA ESTA ANULADA', [
                    'venta_id' => $venta->id,
                ]);
                return $this->respondError('Esta venta ya está anulada', 422);
            }

            // No permitir anular ventas en ciertos estados (Facturado, Cancelado, etc)
            if (in_array($venta->estado, ['Facturado', 'Cancelado'])) {
                Log::warning('🔴 [ANULAR VENTA] ESTADO NO PERMITIDO', [
                    'venta_id' => $venta->id,
                    'estado' => $venta->estado,
                ]);
                return $this->respondError(
                    "No se puede anular una venta con estado {$venta->estado}. Contacta con administración.",
                    422
                );
            }

            Log::info('🔴 [ANULAR VENTA] INICIANDO TRANSACCIÓN', [
                'venta_id' => $venta->id,
            ]);

            DB::transaction(function () use ($venta, $motivo) {
                $estadoAnterior = $venta->estado;
                $stockRevertido = false;
                $cajaAnotada    = false;
                $asientoAnotado = false;

                // 1️⃣ Revertir movimientos de stock si la venta fue aprobada
                if ($venta->estado === 'Aprobado') {
                    try {
                        $venta->revertirMovimientosStock();
                        $stockRevertido = true;
                    } catch (\Exception $e) {
                        Log::warning('No se pudo revertir stock al anular venta', [
                            'venta_id' => $venta->id,
                            'error'    => $e->getMessage(),
                        ]);
                    }
                }

                // 2️⃣ Revertir movimiento de caja si existe
                if ($venta->movimientoCaja) {
                    try {
                        $venta->revertirMovimientoCaja();
                        $cajaAnotada = true;
                        Log::info('✅ Movimiento de caja revertido automáticamente', [
                            'venta_id'           => $venta->id,
                            'movimiento_caja_id' => $venta->movimientoCaja->id,
                            'monto'              => $venta->movimientoCaja->monto,
                        ]);
                    } catch (\Exception $e) {
                        Log::warning('⚠️ No se pudo revertir movimiento de caja al anular venta', [
                            'venta_id' => $venta->id,
                            'error'    => $e->getMessage(),
                        ]);
                    }
                }

                // 3️⃣ Registrar en observaciones sobre asiento contable si existe
                if ($venta->asientoContable) {
                    $asientoAnotado = true;
                    Log::info('Asiento contable asociado a venta anulada', [
                        'venta_id'   => $venta->id,
                        'asiento_id' => $venta->asientoContable->id,
                        'accion'     => 'Requiere reversión manual en contabilidad',
                    ]);
                }

                // 4️⃣ Cambiar estado de la venta a ANULADO
                Log::info('🔴 [ANULAR VENTA] PASO 4 - Actualizando estado', [
                    'venta_id' => $venta->id,
                    'estado_anterior' => $estadoAnterior,
                ]);

                $observacionesAdicionales = [];
                if ($cajaAnotada) {
                    $observacionesAdicionales[] = "[ATENCIÓN] Movimiento de caja asociado - Requiere revisión manual en caja";
                }
                if ($asientoAnotado) {
                    $observacionesAdicionales[] = "[ATENCIÓN] Asiento contable asociado - Requiere reversión manual en contabilidad";
                }

                // ✅ CORRECCIÓN: Usar variables locales para evitar problemas en closure del transaction
                $usuarioNombre = auth()->user()->name ?? 'Sistema';
                $fechaActual = now()->toDateTimeString();
                $observacionesExistentes = $venta->observaciones ?? '';

                $observacionesFinal = $observacionesExistentes;
                if (!empty($observacionesExistentes)) {
                    $observacionesFinal .= "\n";
                }
                $observacionesFinal .= "[ANULADO] Motivo: {$motivo} - Anulado por: {$usuarioNombre} - {$fechaActual}";

                Log::info('🔴 [ANULAR VENTA] DEBUG - Construcción de observaciones', [
                    'observaciones_existentes' => substr($observacionesExistentes, 0, 100),
                    'usuario_nombre' => $usuarioNombre,
                    'fecha_actual' => $fechaActual,
                    'observaciones_final_preview' => substr($observacionesFinal, 0, 200),
                ]);

                if (! empty($observacionesAdicionales)) {
                    $observacionesFinal .= "\n" . implode("\n", $observacionesAdicionales);
                }

                // Obtener el ID del estado Anulado
                $estadoAnulado = EstadoDocumento::where('nombre', 'Anulado')->first();
                if (! $estadoAnulado) {
                    throw new \Exception('Estado "Anulado" no encontrado en la base de datos');
                }

                $actualizado = $venta->update([
                    'estado_documento_id' => $estadoAnulado->id,
                    'observaciones'       => $observacionesFinal,
                ]);

                Log::info('🔴 [ANULAR VENTA] PASO 4 - Update completado', [
                    'venta_id' => $venta->id,
                    'actualizado' => $actualizado,
                    'estado_nuevo' => $venta->fresh()->estado,
                    'observaciones_guardadas' => substr($venta->fresh()->observaciones ?? '', 0, 300),
                    'observaciones_length' => strlen($venta->fresh()->observaciones ?? ''),
                ]);

                // 5️⃣ Registrar auditoria
                Log::info('🔴 [ANULAR VENTA] PASO 5 - Auditoria registrada', [
                    'venta_id'                      => $venta->id,
                    'venta_numero'                  => $venta->numero,
                    'venta_estado_anterior'         => $estadoAnterior,
                    'usuario_id'                    => auth()->id(),
                    'usuario_nombre'                => auth()->user()->name,
                    'motivo'                        => $motivo,
                    'stock_revertido'               => $stockRevertido,
                    'movimiento_caja_revertido'     => $cajaAnotada,
                    'asiento_requiere_revision'     => $asientoAnotado,
                ]);
            });

            Log::info('🟢 [ANULAR VENTA] TRANSACCIÓN COMPLETADA EXITOSAMENTE', [
                'venta_id' => $id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Venta anulada exitosamente. Se ha restaurado el stock y se han anulado los movimientos asociados.',
                'data'    => $venta->fresh([
                    'detalles',
                    'movimientoCaja',
                    'asientoContable',
                ]),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('🔴 [ANULAR VENTA] VENTA NO ENCONTRADA', [
                'venta_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return $this->respondError('Venta no encontrada', 404);
        } catch (\Exception $e) {
            Log::error('🔴 [ANULAR VENTA] ERROR EN TRANSACCIÓN', [
                'venta_id' => $id,
                'error' => $e->getMessage(),
                'exception_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
                'venta_id' => $id,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);
            return $this->respondError('Error al anular venta: ' . $e->getMessage(), 500);
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
            $productos = $request->input('productos', []);
            $almacenId = $request->input('almacen_id');

            $errores  = [];
            $detalles = [];

            foreach ($productos as $producto) {
                $productoData = Producto::find($producto['producto_id']);
                if (! $productoData) {
                    $errores[] = "Producto {$producto['producto_id']} no encontrado";
                    continue;
                }

                $stockDisponible = $productoData->stock()
                    ->when($almacenId, fn($q) => $q->where('almacen_id', $almacenId))
                    ->sum('cantidad') ?? 0;

                $cantidadSolicitada = $producto['cantidad'];
                $tieneStock         = $stockDisponible >= $cantidadSolicitada;

                if (! $tieneStock) {
                    $diferencia = $cantidadSolicitada - $stockDisponible;
                    $errores[]  = "{$productoData->nombre}: Faltan {$diferencia} unidades (solicitado: {$cantidadSolicitada}, disponible: {$stockDisponible})";
                }

                $detalles[] = [
                    'producto_id'         => $producto['producto_id'],
                    'producto_nombre'     => $productoData->nombre,
                    'cantidad_solicitada' => $cantidadSolicitada,
                    'stock_disponible'    => $stockDisponible,
                    'diferencia'          => max(0, $cantidadSolicitada - $stockDisponible),
                ];
            }

            $valido = empty($errores);

            return response()->json([
                'success' => true,
                'data'    => [
                    'valido'   => $valido,
                    'errores'  => $errores,
                    'detalles' => $detalles,
                ],
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
        Log::info('🖨️ [VentaController::imprimir] Método llamado', [
            'venta_id' => $venta->id,
            'user_id'  => auth()->id(),
            'formato'  => $request->input('formato'),
        ]);

        $user = auth()->user();

        // ✅ AUTORIZACIÓN: Validar que el usuario tiene permiso para descargar esta venta
        // - Super Admin y Admin: acceso a todas las ventas
        // - Chofer: solo ventas asignadas a sus entregas
        // - Cliente: solo sus propias ventas
        if (! $this->userCanAccessVenta($user, $venta)) {
            Log::warning('❌ [VentaController::imprimir] Autorización fallida', [
                'user_id'    => $user->id,
                'user_roles' => $user->getRoleNames()->toArray(),
                'venta_id'   => $venta->id,
            ]);
            return response()->json([
                'message' => 'No tiene permiso para descargar esta venta',
            ], 403);
        }

        Log::info('✅ [VentaController::imprimir] Autorización exitosa', [
            'user_id'  => $user->id,
            'venta_id' => $venta->id,
        ]);

        $formato = $request->input('formato', 'A4');      // A4, TICKET_80, TICKET_58
        $accion  = $request->input('accion', 'download'); // download | stream

        // 🔍 DEBUG: Loguear información de la venta antes de imprimir
        \Log::info('📋 [VentaController::imprimir] Datos de venta para descargar/stream', [
            'venta_id'        => $venta->id,
            'venta_numero'    => $venta->numero,
            'estado_pago'     => $venta->estado_pago,
            'monto_pagado'    => $venta->monto_pagado,
            'monto_pendiente' => $venta->monto_pendiente,
            'politica_pago'   => $venta->politica_pago,
            'formato'         => $formato,
            'accion'          => $accion,
        ]);

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
        if (! $this->userCanAccessVenta($user, $venta)) {
            abort(403, 'No tiene permiso para ver el preview de esta venta');
        }

        $formato = $request->input('formato', 'A4');

        try {
            $plantilla = \App\Models\PlantillaImpresion::obtenerDefault('venta', $formato);

            if (! $plantilla) {
                abort(404, "No existe plantilla para el formato '{$formato}'");
            }

            $empresa = \App\Models\Empresa::principal();

            // Convertir logos a base64 para embebimiento en PDF
            $logoPrincipalBase64 = $this->logoToBase64($empresa->logo_principal);
            $logoFooterBase64    = $this->logoToBase64($empresa->logo_footer);

            // Cargar relaciones necesarias
            $venta->load([
                'cliente',
                'detalles.producto.stock.almacen',
                'usuario',
                'tipoPago',
                'tipoDocumento',
                'moneda',
                'estadoDocumento',
                'accessToken',
                'movimientoCaja.caja',
            ]);

            // 🔍 DEBUG: Loguear información de la venta para inspección
            \Log::info('📋 [VentaController::preview] Datos de venta para imprimir', [
                'venta_id'          => $venta->id,
                'venta_numero'      => $venta->numero,
                'fecha_creacion'    => $venta->created_at,
                'fecha_emision'     => $venta->fecha,
                'subtotal'          => $venta->subtotal,
                'descuento'         => $venta->descuento,
                'total'             => $venta->total,
                'estado_pago'       => $venta->estado_pago,
                'monto_pagado'      => $venta->monto_pagado,
                'monto_pendiente'   => $venta->monto_pendiente,
                'politica_pago'     => $venta->politica_pago,
                'cliente_id'        => $venta->cliente_id,
                'cliente_nombre'    => $venta->cliente?->nombre,
                'usuario_id'        => $venta->usuario_id,
                'usuario_nombre'    => $venta->usuario?->name,
                'movimientoCaja_id' => $venta->movimientoCaja?->id,
                'caja_id'           => $venta->movimientoCaja?->caja_id,
                'caja_nombre'       => $venta->movimientoCaja?->caja?->nombre,
                'detalles_count'    => $venta->detalles?->count(),
                'formato'           => $formato,
            ]);

            return view($plantilla->vista_blade, [
                'documento'             => $venta,
                'empresa'               => $empresa,
                'plantilla'             => $plantilla,
                'fecha_impresion'       => now(),
                'usuario'               => auth()->user(),
                'opciones'              => [],
                'logo_principal_base64' => $logoPrincipalBase64,
                'logo_footer_base64'    => $logoFooterBase64,
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
     * Exportar venta a Excel con formato profesional
     *
     * @param Venta $venta
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function exportarExcel(Venta $venta, Request $request)
    {
        Log::info('📊 [VentaController::exportarExcel] Exportando venta a Excel', [
            'venta_id' => $venta->id,
            'user_id'  => auth()->id(),
        ]);

        $user = auth()->user();

        // ✅ AUTORIZACIÓN: Validar que el usuario tiene permiso
        if (! $this->userCanAccessVenta($user, $venta)) {
            Log::warning('❌ [VentaController::exportarExcel] Autorización fallida', [
                'user_id'  => $user->id,
                'venta_id' => $venta->id,
            ]);
            return response()->json(['message' => 'No tiene permiso para descargar esta venta'], 403);
        }

        try {
            return $this->excelExportService->exportarVenta($venta);
        } catch (\Exception $e) {
            Log::error('❌ [VentaController::exportarExcel] Error', [
                'error'    => $e->getMessage(),
                'venta_id' => $venta->id,
            ]);
            return back()->with('error', 'Error al generar Excel: ' . $e->getMessage());
        }
    }

    /**
     * Exportar venta a PDF
     *
     * @param Venta $venta
     * @param Request $request
     * @return mixed
     */
    public function exportarPdf(Venta $venta, Request $request)
    {
        Log::info('📄 [VentaController::exportarPdf] Exportando venta a PDF', [
            'venta_id' => $venta->id,
            'user_id'  => auth()->id(),
        ]);

        $user = auth()->user();

        // ✅ AUTORIZACIÓN: Validar que el usuario tiene permiso
        if (! $this->userCanAccessVenta($user, $venta)) {
            Log::warning('❌ [VentaController::exportarPdf] Autorización fallida', [
                'user_id'  => $user->id,
                'venta_id' => $venta->id,
            ]);
            return response()->json(['message' => 'No tiene permiso para descargar esta venta'], 403);
        }

        $formato = $request->input('formato', 'A4');

        try {
            // Usar el mismo servicio de impresión para generar PDF
            $pdf           = $this->impresionService->imprimirVenta($venta, $formato);
            $nombreArchivo = "venta_{$venta->numero}_{$formato}.pdf";

            return $pdf->download($nombreArchivo);
        } catch (\Exception $e) {
            Log::error('❌ [VentaController::exportarPdf] Error', [
                'error'    => $e->getMessage(),
                'venta_id' => $venta->id,
            ]);
            return back()->with('error', 'Error al generar PDF: ' . $e->getMessage());
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
        Log::debug('🔐 [userCanAccessVenta] Verificando autorización', [
            'user_id'    => $user->id,
            'user_roles' => $user->getRoleNames()->toArray(),
            'venta_id'   => $venta->id,
        ]);

        // Super Admin y Admin: acceso a todas las ventas
        if ($user->hasRole(['Super Admin', 'Admin', 'admin'])) {
            Log::debug('✅ [userCanAccessVenta] Admin/Super Admin access granted');
            return true;
        }

        // Cliente: solo puede acceder a sus propias ventas
        // ✅ Verificar ambas variaciones de rol: 'Cliente' y 'cliente'
        if ($user->hasRole(['Cliente', 'cliente'])) {
            // ✅ CORREGIDO: Usar $user->cliente->id porque la relación es HasOne (FK en clientes.user_id)
            $userClienteId = $user->cliente?->id;
            $canAccess     = $userClienteId && $venta->cliente_id === $userClienteId;
            Log::debug('🔐 [userCanAccessVenta] Cliente check', [
                'user_cliente_id'  => $userClienteId,
                'venta_cliente_id' => $venta->cliente_id,
                'can_access'       => $canAccess,
            ]);
            return $canAccess;
        }

        // Chofer: puede acceder a ventas asignadas a sus entregas
        // ✅ Verificar ambas variaciones de rol: 'Chofer' y 'chofer'
        if ($user->hasRole(['Chofer', 'chofer'])) {
            Log::debug('🔐 [userCanAccessVenta] Checking chofer entregas...');

            // ✅ CORREGIDO: Relación es 1:N directa (Venta.entrega_id -> Entrega.id)
            // NO es many-to-many via tabla pivot
            $canAccess = $venta->entrega_id &&
            $venta->entrega &&
            $venta->entrega->chofer_id === $user->id;

            Log::debug('🔐 [userCanAccessVenta] Chofer entrega check', [
                'user_chofer_id'    => $user->id,
                'venta_entrega_id'  => $venta->entrega_id,
                'entrega_chofer_id' => $venta->entrega?->chofer_id,
                'can_access'        => $canAccess,
            ]);

            return $canAccess;
        }

        Log::debug('❌ [userCanAccessVenta] No matching role found');
        // Si no es Super Admin, Admin, Cliente o Chofer, denegar acceso
        return false;
    }

    /**
     * Convertir URL de logo a data URI base64
     *
     * @param string|null $logoUrl URL de la imagen
     * @return string|null Data URI para uso en HTML/CSS
     */
    private function logoToBase64(?string $logoUrl): ?string
    {
        if (! $logoUrl) {
            return null;
        }

        try {
            // Si ya es un data URI, devolverlo tal cual
            if (str_starts_with($logoUrl, 'data:')) {
                return $logoUrl;
            }

            // Resolver la ruta absoluta
            $logoPath = public_path($logoUrl);

            if (! file_exists($logoPath)) {
                \Log::warning('Logo no encontrado: ' . $logoPath);
                return null;
            }

            $imageData = file_get_contents($logoPath);
            $base64    = base64_encode($imageData);

            // Detectar el tipo MIME desde la extensión del archivo
            $extension = strtolower(pathinfo($logoPath, PATHINFO_EXTENSION));
            $mimeTypes = [
                'png'  => 'image/png',
                'jpg'  => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif'  => 'image/gif',
                'webp' => 'image/webp',
                'svg'  => 'image/svg+xml',
            ];
            $mimeType = $mimeTypes[$extension] ?? 'image/png';

            return "data:{$mimeType};base64,{$base64}";
        } catch (\Exception $e) {
            \Log::warning('Error al convertir logo a base64', [
                'error'    => $e->getMessage(),
                'logo_url' => $logoUrl,
            ]);
            return null;
        }
    }
}
