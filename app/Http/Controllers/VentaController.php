<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreVentaRequest;
use App\Http\Requests\UpdateVentaRequest;
use App\Models\Venta;
use App\Services\StockService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
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
        return Inertia::render('ventas/create', [
            'clientes'          => \App\Models\Cliente::select('id', 'nombre', 'nit')->orderBy('nombre')->get(),
            'productos'         => $this->prepararProductosParaFormulario(),
            'monedas'           => \App\Models\Moneda::select('id', 'codigo', 'nombre', 'simbolo')->where('activo', true)->get(),
            'estados_documento' => \App\Models\EstadoDocumento::select('id', 'nombre')->get(),
            'tipos_pago'        => \App\Models\TipoPago::select('id', 'codigo', 'nombre')->where('activo', true)->orderBy('nombre')->get(),
            'tipos_documento'   => \App\Models\TipoDocumento::select('id', 'codigo', 'nombre')->where('activo', true)->get(),
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
        $venta = Venta::with([
            'detalles.producto',
        ])->findOrFail($id);

        return Inertia::render('ventas/create', [
            'venta'             => $venta,
            'clientes'          => \App\Models\Cliente::select('id', 'nombre', 'nit')->orderBy('nombre')->get(),
            'productos'         => $this->prepararProductosParaFormulario(),
            'monedas'           => \App\Models\Moneda::select('id', 'codigo', 'nombre', 'simbolo')->where('activo', true)->get(),
            'estados_documento' => \App\Models\EstadoDocumento::select('id', 'nombre')->get(),
            'tipos_pago'        => \App\Models\TipoPago::select('id', 'codigo', 'nombre')->where('activo', true)->orderBy('nombre')->get(),
            'tipos_documento'   => \App\Models\TipoDocumento::select('id', 'codigo', 'nombre')->where('activo', true)->get(),
        ]);
    }

    public function store(StoreVentaRequest $request)
    {
        $data         = $request->validated();
        $stockService = app(StockService::class);

        return DB::transaction(function () use ($data, $request, $stockService) {
            // Generar número automáticamente si no se proporciona
            if (empty($data['numero'])) {
                $data['numero'] = Venta::generarNumero();
            }

            // Establecer moneda por defecto (BOB - ID 1) si no se proporciona
            if (empty($data['moneda_id'])) {
                $data['moneda_id'] = 1; // BOB
            }

            // Validar stock antes de crear la venta
            $productosParaValidar = array_map(function ($detalle) {
                return [
                    'producto_id' => $detalle['producto_id'],
                    'cantidad'    => $detalle['cantidad'],
                ];
            }, $data['detalles']);

            $validacionStock = $stockService->validarStockDisponible($productosParaValidar);

            if (! $validacionStock['valido']) {
                throw new Exception('Stock insuficiente: ' . implode(', ', $validacionStock['errores']));
            }

            // Crear la venta
            $venta = Venta::create($data);

            // Crear los detalles
            foreach ($data['detalles'] as $detalle) {
                $venta->detalles()->create($detalle);
            }

            // Los movimientos de stock se crean automáticamente por el model event
            $venta->load(['detalles.producto', 'cliente', 'usuario', 'estadoDocumento', 'moneda']);

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
            // Validar stock antes de actualizar si se modifican los detalles
            if (isset($data['detalles'])) {
                $this->validarStockParaActualizacion($venta, $data['detalles']);
            }

            // Actualizar la venta
            $venta->update($data);

            // Si se modifican los detalles, ajustar el inventario
            if (isset($data['detalles'])) {
                $this->actualizarInventarioPorCambios($venta, $data['detalles']);
            }

            $venta->fresh(['detalles.producto']);

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
            // Los movimientos de stock se revierten automáticamente por el model event
            $venta->delete();

            // Si es petición API, devolver JSON
            if (request()->expectsJson() || request()->is('api/*')) {
                return ApiResponse::success(null, 'Venta eliminada exitosamente');
            }

            // Para peticiones web, redirigir con mensaje
            return redirect()->route('ventas.index')->with('success', 'Venta eliminada exitosamente');
        });
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
     * Actualizar inventario por cambios en detalles de venta
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

        // Validar y agregar stock de productos nuevos/aumentados
        if (! empty($productosParaAgregar)) {
            $validacion = $stockService->validarStockDisponible($productosParaAgregar);
            if (! $validacion['valido']) {
                throw new Exception('Stock insuficiente para actualización: ' . implode(', ', $validacion['errores']));
            }

            $stockService->procesarSalidaVenta($productosParaAgregar, $venta->numero . '-UPDATE');
        }
    }

    /**
     * Revertir movimientos específicos de stock
     */
    private function revertirMovimientosEspecificos(Venta $venta, array $productosParaRevertir)
    {
        DB::beginTransaction();

        try {
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

                    // Revertir el stock
                    $stockProducto = $movimiento->stockProducto;
                    $stockProducto->cantidad += $cantidadTomar;
                    $stockProducto->fecha_actualizacion = now();
                    $stockProducto->save();

                    // Crear movimiento de reversión
                    \App\Models\MovimientoInventario::create([
                        'stock_producto_id' => $stockProducto->id,
                        'cantidad'          => $cantidadTomar,
                        'fecha'             => now(),
                        'observacion'       => "Reversión parcial de venta #{$venta->numero}",
                        'numero_documento'   => $venta->numero . '-REV',
                        'cantidad_anterior'  => $stockProducto->cantidad - $cantidadTomar,
                        'cantidad_posterior' => $stockProducto->cantidad,
                        'tipo'               => \App\Models\MovimientoInventario::TIPO_ENTRADA_AJUSTE,
                    ]);

                    $cantidadRevertida += $cantidadTomar;
                }
            }

            DB::commit();

        } catch (Exception $e) {
            DB::rollBack();
            throw new Exception('Error revirtiendo movimientos de stock: ' . $e->getMessage());
        }
    }

    private function validarStockParaActualizacion(Venta $venta, array $nuevosDetalles)
    {
        $stockService = app(StockService::class);

        // Obtener detalles actuales
        $detallesActuales = $venta->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad'    => $detalle->cantidad,
            ];
        })->toArray();

        // Crear mapa de nuevos detalles por producto_id
        $nuevosPorProducto = [];
        foreach ($nuevosDetalles as $detalle) {
            $nuevosPorProducto[$detalle['producto_id']] = $detalle['cantidad'];
        }

        // Calcular productos que necesitan validación
        $productosParaValidar = [];
        foreach ($nuevosPorProducto as $productoId => $cantidadNueva) {
            $cantidadActual = 0;
            foreach ($detallesActuales as $actual) {
                if ($actual['producto_id'] == $productoId) {
                    $cantidadActual = $actual['cantidad'];
                    break;
                }
            }

            if ($cantidadNueva > $cantidadActual) {
                $productosParaValidar[] = [
                    'producto_id' => $productoId,
                    'cantidad'    => $cantidadNueva - $cantidadActual,
                ];
            }
        }

        // Productos completamente nuevos
        foreach ($nuevosPorProducto as $productoId => $cantidad) {
            $existe = false;
            foreach ($detallesActuales as $actual) {
                if ($actual['producto_id'] == $productoId) {
                    $existe = true;
                    break;
                }
            }
            if (! $existe) {
                $productosParaValidar[] = [
                    'producto_id' => $productoId,
                    'cantidad'    => $cantidad,
                ];
            }
        }

        if (! empty($productosParaValidar)) {
            $validacion = $stockService->validarStockDisponible($productosParaValidar);
            if (! $validacion['valido']) {
                throw new Exception('Stock insuficiente: ' . implode(', ', $validacion['errores']));
            }
        }
    }
}
