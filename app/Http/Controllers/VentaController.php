<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreVentaRequest;
use App\Http\Requests\UpdateVentaRequest;
use App\Models\Venta;
use App\Services\StockService;
use App\Services\WebSocketNotificationService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class VentaController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:ventas.index')->only('index');
        $this->middleware('permission:ventas.show')->only('show');
        $this->middleware('permission:ventas.store')->only('store');
        $this->middleware('permission:ventas.update')->only('update');
        $this->middleware('permission:ventas.destroy')->only('destroy');
        $this->middleware('permission:ventas.create')->only('create');
        $this->middleware('permission:ventas.edit')->only('edit');
        $this->middleware('permission:ventas.verificar-stock')->only('verificarStock');
    }

    public function index()
    {
        // Si es petición API, devolver JSON con paginación
        if (request()->expectsJson() || request()->is('api/*')) {
            $query = Venta::with([
                'cliente:id,nombre,nit',
                'usuario:id,name',
                'estadoDocumento:id,nombre',
                'moneda:id,codigo,nombre,simbolo',
                'detalles.producto:id,nombre,codigo_barras',
            ])->select([
                'id',
                'numero',
                'fecha',
                'cliente_id',
                'usuario_id',
                'estado_documento_id',
                'moneda_id',
                'total',
                'created_at',
            ]);

            // Aplicar filtros si existen
            if ($search = request('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('numero', 'like', "%{$search}%")
                        ->orWhereHas('cliente', function ($clienteQuery) use ($search) {
                            $clienteQuery->where('nombre', 'like', "%{$search}%")
                                ->orWhere('nit', 'like', "%{$search}%");
                        });
                });
            }

            $ventas = $query->latest('fecha')->paginate(15);

            return ApiResponse::success($ventas);
        }

        // Para peticiones web, devolver vista Inertia con datos optimizados
        $ventas = Venta::with([
            'cliente:id,nombre,nit',
            'usuario:id,name',
            'estadoDocumento:id,nombre',
            'moneda:id,codigo,nombre,simbolo',
        ])->select([
            'id',
            'numero',
            'fecha',
            'cliente_id',
            'usuario_id',
            'estado_documento_id',
            'moneda_id',
            'total',
        ])->latest('fecha')->limit(50)->get();

        return Inertia::render('ventas/index', [
            'ventas' => $ventas,
        ]);
    }

    public function create()
    {
        // FASE 3: Optimización - solo cargar datos activos y ordenados
        return Inertia::render('ventas/create', [
            'clientes'          => \App\Models\Cliente::activo()
                                        ->select('id', 'nombre', 'nit')
                                        ->orderBy('nombre')
                                        ->get(),
            'productos'         => $this->prepararProductosParaFormulario(),
            'monedas'           => \App\Models\Moneda::where('activo', true)
                                        ->select('id', 'codigo', 'nombre', 'simbolo')
                                        ->orderBy('codigo')
                                        ->get(),
            'estados_documento' => \App\Models\EstadoDocumento::select('id', 'nombre')
                                        ->orderBy('nombre')
                                        ->get(),
            'tipos_pago'        => \App\Models\TipoPago::where('activo', true)
                                        ->select('id', 'codigo', 'nombre')
                                        ->orderBy('nombre')
                                        ->get(),
            'tipos_documento'   => \App\Models\TipoDocumento::where('activo', true)
                                        ->select('id', 'codigo', 'nombre')
                                        ->orderBy('nombre')
                                        ->get(),
        ]);
    }

    public function show($id)
    {
        $venta = Venta::with([
            'cliente',
            'usuario',
            'estadoDocumento',
            'moneda',
            'detalles.producto',
            'pagos.tipoPago',
            'cuentaPorCobrar',
        ])->findOrFail($id);

        // Si es petición API, devolver JSON
        if (request()->expectsJson() || request()->is('api/*')) {
            return ApiResponse::success($venta);
        }

        // Para peticiones web, devolver vista Inertia
        return Inertia::render('ventas/show', [
            'venta' => $venta,
        ]);
    }

    public function edit($id)
    {
        // FASE 3: Optimización - eager loading eficiente
        $venta = Venta::with([
            'detalles.producto:id,nombre,codigo_barras,sku',
            'cliente:id,nombre,nit',
            'moneda:id,codigo,nombre,simbolo',
        ])->findOrFail($id);

        return Inertia::render('ventas/create', [
            'venta'             => $venta,
            'clientes'          => \App\Models\Cliente::activo()
                                        ->select('id', 'nombre', 'nit')
                                        ->orderBy('nombre')
                                        ->get(),
            'productos'         => $this->prepararProductosParaFormulario(),
            'monedas'           => \App\Models\Moneda::where('activo', true)
                                        ->select('id', 'codigo', 'nombre', 'simbolo')
                                        ->orderBy('codigo')
                                        ->get(),
            'estados_documento' => \App\Models\EstadoDocumento::select('id', 'nombre')
                                        ->orderBy('nombre')
                                        ->get(),
            'tipos_pago'        => \App\Models\TipoPago::where('activo', true)
                                        ->select('id', 'codigo', 'nombre')
                                        ->orderBy('nombre')
                                        ->get(),
            'tipos_documento'   => \App\Models\TipoDocumento::where('activo', true)
                                        ->select('id', 'codigo', 'nombre')
                                        ->orderBy('nombre')
                                        ->get(),
        ]);
    }

    public function store(StoreVentaRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $request) {
            // Generar número automáticamente si no se proporciona
            if (empty($data['numero'])) {
                $data['numero'] = Venta::generarNumero();
            }

            // Establecer moneda por defecto (BOB - ID 1) si no se proporciona
            if (empty($data['moneda_id'])) {
                $data['moneda_id'] = 1; // BOB
            }

            // ✅ VALIDACIÓN ELIMINADA: Ahora ocurre dentro de StockService::procesarSalidaVenta()
            // con bloqueo pesimista (lockForUpdate), eliminando la condición de carrera TOC/TOU

            // Crear la venta
            $venta = Venta::create($data);

            // Crear los detalles
            foreach ($data['detalles'] as $detalle) {
                $venta->detalles()->create($detalle);
            }

            // Los movimientos de stock se crean automáticamente por el model event
            // Si hay error de stock insuficiente, se lanzará una excepción desde el Observer
            $venta->load(['detalles.producto', 'cliente', 'usuario', 'estadoDocumento', 'moneda']);

            // Notificar vía WebSocket sobre nueva venta (sin afectar la respuesta si falla)
            try {
                $webSocketService = app(WebSocketNotificationService::class);
                // Cargar relaciones completas para la notificación
                $venta->load([
                    'cliente',
                    'detalles.producto',
                    'usuario',
                    'proforma',
                    'envio',
                ]);

                // Enviar notificación con datos completos de la venta
                $webSocketService->notifyUser(
                    $venta->usuario_id ?? auth()->id(),
                    'venta_creada',
                    [
                        'venta_id' => $venta->id,
                        'venta_numero' => $venta->numero,
                        'cliente_id' => $venta->cliente_id,
                        'cliente_nombre' => $venta->cliente?->nombre,
                        'total' => $venta->total,
                        'subtotal' => $venta->subtotal,
                        'moneda' => $venta->moneda?->codigo,
                        'estado_documento' => $venta->estadoDocumento?->nombre,
                        'requiere_envio' => $venta->requiere_envio,
                        'canal_origen' => $venta->canal_origen,
                        'fecha' => $venta->fecha,
                        'timestamp' => now(),
                    ]
                );

                // Notificar a managers sobre nueva venta
                $webSocketService->notifyRole(
                    'manager',
                    'nueva_venta_registrada',
                    [
                        'venta_id' => $venta->id,
                        'venta_numero' => $venta->numero,
                        'cliente_nombre' => $venta->cliente?->nombre,
                        'total' => $venta->total,
                        'usuario_creador' => $venta->usuario?->name,
                        'timestamp' => now(),
                    ]
                );
            } catch (\Exception $e) {
                Log::warning('Error enviando notificación WebSocket de venta creada', [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'error' => $e->getMessage(),
                ]);
            }

            // Si es petición API, devolver JSON
            if ($request->expectsJson() || $request->is('api/*')) {
                return ApiResponse::success(
                    $venta,
                    'Venta creada exitosamente',
                    Response::HTTP_CREATED
                );
            }

            // Para peticiones web, redirigir con mensaje
            return redirect()->route('ventas.index')
                ->with('success', 'Venta creada exitosamente')
                ->with('stockInfo', $venta->obtenerResumenStock());
        });
    }

    public function update(UpdateVentaRequest $request, $id)
    {
        $venta = Venta::findOrFail($id);
        $data  = $request->validated();

        return DB::transaction(function () use ($venta, $data, $request) {
            // ✅ CORRECCIÓN CR#3 y CR#4: Separar lógica de detalles de la actualización de venta

            // Extraer detalles si existen
            $detalles = $data['detalles'] ?? null;
            unset($data['detalles']); // ✅ CR#3: Eliminar 'detalles' del array de actualización

            // Actualizar solo los campos de la venta (sin detalles)
            $venta->update($data);

            // Si se modifican los detalles, actualizar inventario
            if ($detalles !== null) {
                // 1. Revertir inventario de detalles actuales
                $this->revertirInventarioDetalles($venta);

                // 2. Borrar detalles viejos
                $venta->detalles()->delete();

                // 3. Crear nuevos detalles
                foreach ($detalles as $detalle) {
                    $venta->detalles()->create($detalle);
                }

                // 4. Procesar inventario para nuevos detalles
                // IMPORTANTE: Debe llamarse DESPUÉS de crear detalles
                // procesarMovimientosStock() obtiene los detalles de $venta->detalles
                $venta->refresh(); // Recargar para obtener los nuevos detalles
                $venta->procesarMovimientosStock();
            }

            // Recargar la venta con todas sus relaciones actualizadas
            $venta->refresh();
            $venta->load(['detalles.producto', 'cliente', 'usuario', 'estadoDocumento', 'moneda']);

            // Si es petición API, devolver JSON
            if ($request->expectsJson() || $request->is('api/*')) {
                return ApiResponse::success($venta, 'Venta actualizada');
            }

            // Para peticiones web, redirigir con mensaje
            return redirect()->route('ventas.index')->with('success', 'Venta actualizada exitosamente');
        });
    }

    public function destroy($id)
    {
        $venta = Venta::findOrFail($id);

        return DB::transaction(function () use ($venta) {
            // Problema #17: Validar integridad referencial antes de eliminar
            $this->validarIntegridadReferencial($venta);

            // Cargar datos completos antes de eliminar para notificación
            $venta->load(['cliente', 'usuario', 'estadoDocumento']);
            $ventaData = [
                'venta_id' => $venta->id,
                'venta_numero' => $venta->numero,
                'cliente_nombre' => $venta->cliente?->nombre,
                'total' => $venta->total,
                'usuario_creador' => $venta->usuario?->name,
                'timestamp' => now(),
            ];

            // Los movimientos de stock se revierten automáticamente por el model event
            $venta->delete();

            // Notificar vía WebSocket sobre venta eliminada (sin afectar la respuesta si falla)
            try {
                $webSocketService = app(WebSocketNotificationService::class);

                // Notificar al usuario que creó la venta
                $webSocketService->notifyUser(
                    $venta->usuario_id ?? auth()->id(),
                    'venta_eliminada',
                    array_merge($ventaData, [
                        'motivo' => 'Venta cancelada por usuario',
                    ])
                );

                // Notificar a managers
                $webSocketService->notifyRole(
                    'manager',
                    'venta_cancelada',
                    array_merge($ventaData, [
                        'usuario_que_cancelo' => auth()->user()?->name,
                    ])
                );
            } catch (\Exception $e) {
                Log::warning('Error enviando notificación WebSocket de venta eliminada', [
                    'venta_numero' => $ventaData['venta_numero'],
                    'error' => $e->getMessage(),
                ]);
            }

            // Si es petición API, devolver JSON
            if (request()->expectsJson() || request()->is('api/*')) {
                return ApiResponse::success(null, 'Venta eliminada exitosamente');
            }

            // Para peticiones web, redirigir con mensaje
            return redirect()->route('ventas.index')->with('success', 'Venta eliminada exitosamente');
        });
    }

    /**
     * Problema #17: Validar integridad referencial antes de eliminar
     *
     * Lanza una excepción si la venta tiene dependencias que impiden su eliminación
     */
    private function validarIntegridadReferencial(Venta $venta): void
    {
        $errores = [];

        // 1. Verificar si tiene pagos
        if ($venta->pagos()->exists()) {
            $cantidadPagos = $venta->pagos()->count();
            $errores[] = "La venta tiene {$cantidadPagos} pago(s) asociado(s)";
        }

        // 2. Verificar si tiene envío
        if ($venta->envio()->exists()) {
            $envio = $venta->envio;
            $errores[] = "La venta tiene un envío asociado (#{$envio->numero_envio}) en estado {$envio->estado}";
        }

        // 3. Verificar si tiene cuenta por cobrar con saldo pendiente
        if ($venta->cuentaPorCobrar()->exists()) {
            $cuenta = $venta->cuentaPorCobrar;
            if ($cuenta->saldo_pendiente > 0) {
                $errores[] = "La venta tiene una cuenta por cobrar con saldo pendiente de " .
                    number_format($cuenta->saldo_pendiente, 2);
            }
        }

        // 4. Verificar si tiene factura electrónica
        if ($venta->facturaElectronica()->exists()) {
            $factura = $venta->facturaElectronica;
            $errores[] = "La venta tiene una factura electrónica asociada (CUF: {$factura->cuf})";
        }

        // 5. Verificar si tiene asiento contable
        if ($venta->asientoContable()->exists()) {
            $asiento = $venta->asientoContable;
            if ($asiento->cerrado) {
                $errores[] = "La venta tiene un asiento contable cerrado que no puede revertirse";
            }
        }

        // 6. Verificar estado logístico
        if ($venta->estado_logistico === Venta::ESTADO_ENTREGADO) {
            $errores[] = "La venta ya fue entregada y no puede eliminarse";
        }

        if ($venta->estado_logistico === Venta::ESTADO_ENVIADO) {
            $errores[] = "La venta está en tránsito y no puede eliminarse";
        }

        // Si hay errores, lanzar excepción
        if (!empty($errores)) {
            throw new Exception(
                "No se puede eliminar la venta #{$venta->numero}:\n" .
                implode("\n", array_map(fn($e) => "- {$e}", $errores))
            );
        }
    }

    /**
     * Verificar stock disponible para múltiples productos
     */
    public function verificarStock(Request $request)
    {
        $request->validate([
            'productos'               => 'required|array',
            'productos.*.producto_id' => 'required|integer|exists:productos,id',
            'productos.*.cantidad'    => 'required|integer|min:1',
            'almacen_id'              => 'integer|exists:almacenes,id',
        ]);

        $stockService = app(StockService::class);
        $almacenId    = $request->get('almacen_id', 1);

        try {
            $validacion = $stockService->validarStockDisponible($request->productos, $almacenId);

            return ApiResponse::success([
                'valido'   => $validacion['valido'],
                'errores'  => $validacion['errores'],
                'detalles' => $validacion['detalles'],
            ]);

        } catch (Exception $e) {
            return ApiResponse::error('Error verificando stock: ' . $e->getMessage());
        }
    }

    /**
     * Obtener stock disponible de un producto específico
     */
    public function obtenerStockProducto(Request $request, int $productoId)
    {
        $request->validate([
            'almacen_id' => 'integer|exists:almacenes,id',
        ]);

        $stockService = app(StockService::class);
        $almacenId    = $request->get('almacen_id', 1);

        try {
            $stockDisponible = $stockService->obtenerStockDisponible($productoId, $almacenId);
            $stockPorLotes   = $stockService->obtenerStockPorLotes($productoId, $almacenId);

            return ApiResponse::success([
                'producto_id' => $productoId,
                'almacen_id'  => $almacenId,
                'stock_total' => $stockDisponible,
                'lotes'       => $stockPorLotes->map(function ($stock) {
                    return [
                        'id'                => $stock->id,
                        'lote'              => $stock->lote,
                        'cantidad'          => $stock->cantidad,
                        'fecha_vencimiento' => $stock->fecha_vencimiento,
                        'dias_vencimiento'  => $stock->diasParaVencer(),
                    ];
                }),
            ]);

        } catch (Exception $e) {
            return ApiResponse::error('Error obteniendo stock: ' . $e->getMessage());
        }
    }

    /**
     * Obtener productos con stock bajo
     */
    public function productosStockBajo()
    {
        $stockService = app(StockService::class);

        try {
            $productosStockBajo = $stockService->obtenerProductosStockBajo();

            return ApiResponse::success($productosStockBajo->map(function ($producto) {
                return [
                    'id'           => $producto->id,
                    'nombre'       => $producto->nombre,
                    'stock_minimo' => $producto->stock_minimo,
                    'stock_actual' => $producto->stocks->sum('cantidad'),
                    'almacenes'    => $producto->stocks->map(function ($stock) {
                        return [
                            'almacen'  => $stock->almacen->nombre,
                            'cantidad' => $stock->cantidad,
                        ];
                    }),
                ];
            }));

        } catch (Exception $e) {
            return ApiResponse::error('Error obteniendo productos con stock bajo: ' . $e->getMessage());
        }
    }

    /**
     * Obtener resumen de stock de una venta
     */
    public function obtenerResumenStock(int $ventaId)
    {
        try {
            $venta   = Venta::findOrFail($ventaId);
            $resumen = $venta->obtenerResumenStock();

            return ApiResponse::success($resumen);

        } catch (Exception $e) {
            return ApiResponse::error('Error obteniendo resumen de stock: ' . $e->getMessage());
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ENDPOINT: REGISTRAR PAGO EN UNA VENTA
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Registra un pago parcial o completo en una venta.
     * Actualiza automáticamente los campos de pago de la venta.
     *
     * Validaciones:
     * 1. La venta debe existir
     * 2. El monto no puede ser negativo
     * 3. El monto no puede exceder el monto pendiente
     * 4. Actualiza: monto_pagado, monto_pendiente, estado_pago
     *
     * Parámetros:
     * - monto: Monto a pagar (decimal)
     * - tipo_pago: TRANSFERENCIA, EFECTIVO, TARJETA, CHEQUE (opcional)
     * - numero_referencia: Número de referencia de pago (opcional)
     * - observaciones: Observaciones sobre el pago (opcional)
     *
     * @param Venta $venta
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function registrarPago(Venta $venta, Request $request)
    {
        // Validar parámetros de entrada
        $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'tipo_pago' => 'nullable|in:TRANSFERENCIA,EFECTIVO,TARJETA,CHEQUE',
            'numero_referencia' => 'nullable|string|max:100',
            'observaciones' => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($venta, $request) {
            try {
                // Validación 1: La venta debe tener política de pago
                if (!$venta->politica_pago) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La venta no tiene una política de pago configurada',
                    ], 422);
                }

                // Validación 2: El monto debe ser positivo
                $montoAPagar = (float) $request->monto;
                if ($montoAPagar <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El monto debe ser mayor a 0',
                    ], 422);
                }

                // Validación 3: El monto no puede exceder el pendiente
                $montoPendiente = (float) $venta->monto_pendiente;
                if ($montoAPagar > $montoPendiente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El monto a pagar no puede exceder el monto pendiente',
                        'monto_pendiente' => $montoPendiente,
                        'monto_solicitado' => $montoAPagar,
                        'diferencia' => $montoAPagar - $montoPendiente,
                    ], 422);
                }

                // Crear registro de pago
                $pago = $venta->pagos()->create([
                    'monto' => $montoAPagar,
                    'tipo_pago_id' => $this->obtenerTipoPagoId($request->tipo_pago),
                    'numero_transaccion' => $request->numero_referencia,
                    'observaciones' => $request->observaciones,
                    'fecha' => now(),
                ]);

                // Actualizar montos en la venta
                $montoPagadoNuevo = (float) $venta->monto_pagado + $montoAPagar;
                $montoPendienteNuevo = (float) $venta->monto_total - $montoPagadoNuevo;

                // Determinar nuevo estado de pago
                if ($montoPendienteNuevo <= 0) {
                    $estadoPagoNuevo = 'PAGADO';
                } elseif ($montoPagadoNuevo > 0) {
                    $estadoPagoNuevo = 'PARCIALMENTE_PAGADO';
                } else {
                    $estadoPagoNuevo = 'PENDIENTE';
                }

                // Actualizar venta
                $venta->update([
                    'monto_pagado' => $montoPagadoNuevo,
                    'monto_pendiente' => max(0, $montoPendienteNuevo),
                    'estado_pago' => $estadoPagoNuevo,
                ]);

                \Log::info('Pago registrado en venta', [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'pago_id' => $pago->id,
                    'monto_pagado' => $montoAPagar,
                    'estado_pago_nuevo' => $estadoPagoNuevo,
                    'usuario_id' => auth()->id(),
                ]);

                // Enviar notificación WebSocket
                try {
                    app(WebSocketNotificationService::class)
                        ->notifyPagoRecibido($venta, $pago);
                } catch (Exception $e) {
                    \Log::warning('Error enviando notificación WebSocket de pago', [
                        'venta_id' => $venta->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => "Pago de {$montoAPagar} registrado exitosamente",
                    'data' => [
                        'pago' => [
                            'id' => $pago->id,
                            'monto' => (float) $pago->monto,
                            'tipo_pago' => $request->tipo_pago,
                            'numero_referencia' => $pago->numero_transaccion,
                            'fecha' => $pago->fecha->format('Y-m-d H:i:s'),
                        ],
                        'venta_actualizada' => [
                            'id' => $venta->id,
                            'numero' => $venta->numero,
                            'monto_total' => (float) $venta->monto_total,
                            'monto_pagado' => (float) $montoPagadoNuevo,
                            'monto_pendiente' => (float) max(0, $montoPendienteNuevo),
                            'estado_pago' => $estadoPagoNuevo,
                            'porcentaje_pagado' => round(($montoPagadoNuevo / $venta->monto_total) * 100, 2),
                        ],
                    ],
                ], 201);

            } catch (Exception $e) {
                DB::rollBack();

                \Log::error('Error registrando pago en venta', [
                    'venta_id' => $venta->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Error al registrar el pago: ' . $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * Helper: Obtener ID de tipo de pago
     */
    private function obtenerTipoPagoId($tipoPago = null)
    {
        if (!$tipoPago) {
            // Retornar tipo de pago por defecto si existe
            return \App\Models\TipoPago::where('codigo', 'TRANSFERENCIA')->first()?->id ?? 1;
        }

        return \App\Models\TipoPago::where('codigo', $tipoPago)->first()?->id ?? 1;
    }

    /**
     * Preparar productos para formulario (create/edit)
     */
    private function prepararProductosParaFormulario()
    {
        return \App\Models\Producto::with([
            'precios'      => function ($query) {
                $query->where('activo', true)
                    ->with(['tipoPrecio:id,codigo,nombre']);
            },
            'categoria:id,nombre',
            'marca:id,nombre',
            'unidad:id,codigo,nombre',
            'codigosBarra' => function ($query) {
                $query->where('activo', true)
                    ->select('id', 'producto_id', 'codigo', 'es_principal');
            },
        ])
            ->where('activo', true)
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                // Mapear precios por tipo
                $preciosMapeados = [];
                foreach ($producto->precios as $precio) {
                    $codigo = $precio->tipoPrecio?->codigo;
                    if ($codigo) {
                        $preciosMapeados[$codigo] = $precio->precio;
                    }
                }

                // Obtener todos los códigos de barra activos
                $codigosBarra = $producto->codigosBarra->pluck('codigo')->toArray();

                // Obtener código principal o usar el de la tabla productos
                $codigoPrincipal = $producto->codigosBarra->where('es_principal', true)->first()?->codigo
                    ?: $producto->codigo_barras;

                return [
                    'id'             => $producto->id,
                    'nombre'         => $producto->nombre,
                    'codigo'         => $codigoPrincipal,
                    'codigo_barras'  => $codigoPrincipal,
                    'codigos_barras' => $codigosBarra, // Array con todos los códigos de barra
                    'precio_compra'  => $preciosMapeados['COSTO'] ?? 0,
                    'precio_venta'   => $preciosMapeados['VENTA_PUBLICO'] ?? 0,
                    'categoria'      => $producto->categoria?->nombre,
                    'marca'          => $producto->marca?->nombre,
                    'unidad'         => $producto->unidad?->nombre,
                    'stock_minimo'   => $producto->stock_minimo,
                    'stock_maximo'   => $producto->stock_maximo,
                ];
            });
    }

    /**
     * Revertir inventario de todos los detalles de una venta
     *
     * Problema #13: Método para revertir inventario antes de borrar detalles
     */
    private function revertirInventarioDetalles(Venta $venta): void
    {
        // Revertir movimientos de stock usando el método del modelo
        $venta->revertirMovimientosStock();
    }

    /**
     * Actualizar inventario por cambios en detalles de venta
     *
     * NOTA: Este método ya no se usa después del Problema #13
     * Se prefiere borrar todos los detalles y recrearlos
     */
    private function actualizarInventarioPorCambios(Venta $venta, array $nuevosDetalles)
    {
        $stockService = app(StockService::class);

        // Obtener detalles actuales
        $detallesActuales = $venta->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad'    => $detalle->cantidad,
            ];
        })->toArray();

        // Calcular diferencias
        $productosParaRevertir = [];
        $productosParaAgregar  = [];

        // Crear mapa de nuevos detalles por producto_id
        $nuevosPorProducto = [];
        foreach ($nuevosDetalles as $detalle) {
            $nuevosPorProducto[$detalle['producto_id']] = $detalle['cantidad'];
        }

        // Comparar con detalles actuales
        foreach ($detallesActuales as $actual) {
            $productoId     = $actual['producto_id'];
            $cantidadActual = $actual['cantidad'];
            $cantidadNueva  = $nuevosPorProducto[$productoId] ?? 0;

            if ($cantidadNueva < $cantidadActual) {
                // Reducir cantidad - devolver stock
                $productosParaRevertir[] = [
                    'producto_id' => $productoId,
                    'cantidad'    => $cantidadActual - $cantidadNueva,
                ];
            } elseif ($cantidadNueva > $cantidadActual) {
                // Aumentar cantidad - verificar stock disponible
                $productosParaAgregar[] = [
                    'producto_id' => $productoId,
                    'cantidad'    => $cantidadNueva - $cantidadActual,
                ];
            }
            // Si son iguales, no hacer nada
            unset($nuevosPorProducto[$productoId]);
        }

        // Productos completamente nuevos
        foreach ($nuevosPorProducto as $productoId => $cantidad) {
            $productosParaAgregar[] = [
                'producto_id' => $productoId,
                'cantidad'    => $cantidad,
            ];
        }

        // Revertir stock de productos reducidos
        if (! empty($productosParaRevertir)) {
            $this->revertirMovimientosEspecificos($venta, $productosParaRevertir);
        }

        // Agregar stock de productos nuevos/aumentados
        // ✅ VALIDACIÓN ELIMINADA: Ahora ocurre dentro de procesarSalidaVenta() con lock
        if (! empty($productosParaAgregar)) {
            // La validación de stock ocurre automáticamente dentro de procesarSalidaVenta()
            // con bloqueo pesimista, eliminando race conditions
            $stockService->procesarSalidaVenta($productosParaAgregar, $venta->numero . '-UPDATE');
        }
    }

    /**
     * Revertir movimientos específicos de stock
     *
     * IMPORTANTE: Este método debe ejecutarse dentro de una transacción DB (manejada por el caller)
     * Usa UPDATE atómico para evitar race conditions
     */
    private function revertirMovimientosEspecificos(Venta $venta, array $productosParaRevertir)
    {
        foreach ($productosParaRevertir as $item) {
            $productoId = $item['producto_id'];
            $cantidad   = $item['cantidad'];

            // Obtener movimientos de salida para este producto en esta venta
            $movimientos = \App\Models\MovimientoInventario::where('numero_documento', $venta->numero)
                ->where('tipo', \App\Models\MovimientoInventario::TIPO_SALIDA_VENTA)
                ->whereHas('stockProducto', function ($query) use ($productoId) {
                    $query->where('producto_id', $productoId);
                })
                ->get();

            $cantidadRevertida = 0;
            foreach ($movimientos as $movimiento) {
                if ($cantidadRevertida >= $cantidad) {
                    break;
                }

                $cantidadTomar = min($cantidad - $cantidadRevertida, abs($movimiento->cantidad));
                $stockProducto = $movimiento->stockProducto;

                // Obtener cantidad anterior antes de UPDATE
                $cantidadAnterior = $stockProducto->cantidad;

                // Actualizar stock usando UPDATE atómico para evitar race conditions
                // IMPORTANTE: Actualiza tanto cantidad como cantidad_disponible (invariante)
                $affected = DB::table('stock_productos')
                    ->where('id', $stockProducto->id)
                    ->update([
                        'cantidad' => DB::raw("cantidad + {$cantidadTomar}"),
                        'cantidad_disponible' => DB::raw("cantidad_disponible + {$cantidadTomar}"),
                        'fecha_actualizacion' => now(),
                    ]);

                if ($affected === 0) {
                    throw new Exception("Error al revertir stock para stock_producto_id {$stockProducto->id}");
                }

                // Actualizar modelo en memoria para el registro de movimiento
                $stockProducto->cantidad += $cantidadTomar;
                $stockProducto->cantidad_disponible += $cantidadTomar;
                $stockProducto->fecha_actualizacion = now();

                // Crear movimiento de reversión
                \App\Models\MovimientoInventario::create([
                    'stock_producto_id' => $stockProducto->id,
                    'cantidad'          => $cantidadTomar,
                    'fecha'             => now(),
                    'observacion'       => "Reversión parcial de venta #{$venta->numero}",
                    'numero_documento'   => $venta->numero . '-REV',
                    'cantidad_anterior'  => $cantidadAnterior,
                    'cantidad_posterior' => $stockProducto->cantidad,
                    'tipo'               => \App\Models\MovimientoInventario::TIPO_ENTRADA_AJUSTE,
                ]);

                \Illuminate\Support\Facades\Log::info('Stock revertido por actualización de venta', [
                    'venta' => $venta->numero,
                    'producto_id' => $productoId,
                    'stock_producto_id' => $stockProducto->id,
                    'cantidad_revertida' => $cantidadTomar,
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_posterior' => $stockProducto->cantidad,
                ]);

                $cantidadRevertida += $cantidadTomar;
            }
        }
    }

    // ✅ MÉTODO ELIMINADO: validarStockParaActualizacion()
    // Ya no es necesario porque la validación ocurre dentro de
    // StockService::procesarSalidaVenta() con bloqueo pesimista
}
