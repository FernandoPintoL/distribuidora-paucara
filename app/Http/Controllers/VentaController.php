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
        // Si es petición API, devolver JSON
        if (request()->expectsJson() || request()->is('api/*')) {
            $ventas = Venta::with([
                'cliente',
                'usuario',
                'estadoDocumento',
                'moneda',
                'detalles.producto',
            ])->get();

            return ApiResponse::success($ventas);
        }

        // Para peticiones web, devolver vista Inertia
        $ventas = Venta::with([
            'cliente',
            'usuario',
            'estadoDocumento',
            'moneda',
        ])->latest('fecha')->get();

        return Inertia::render('ventas/index', [
            'ventas' => $ventas,
        ]);
    }

    public function create()
    {
        $productos = \App\Models\Producto::select('id', 'nombre', 'codigo_barras')
            ->where('activo', true)
            ->with(['precios' => function ($query) {
                $query->where('activo', true)->orderBy('created_at', 'desc');
            }])
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                return [
                    'id'           => $producto->id,
                    'nombre'       => $producto->nombre,
                    'codigo'       => $producto->codigo_barras,
                    'precio_venta' => $producto->precios->first()?->precio ?? 0,
                ];
            });

        return Inertia::render('ventas/create', [
            'clientes'  => \App\Models\Cliente::select('id', 'nombre', 'nit')->orderBy('nombre')->get(),
            'productos' => $productos,
            'monedas'   => \App\Models\Moneda::select('id', 'codigo', 'nombre', 'simbolo')->where('activo', true)->get(),
            'estados'   => \App\Models\EstadoDocumento::select('id', 'nombre')->get(),
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

        $productos = \App\Models\Producto::select('id', 'nombre', 'codigo_barras')
            ->where('activo', true)
            ->with(['precios' => function ($query) {
                $query->where('activo', true)->orderBy('created_at', 'desc');
            }])
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                return [
                    'id'           => $producto->id,
                    'nombre'       => $producto->nombre,
                    'codigo'       => $producto->codigo_barras,
                    'precio_venta' => $producto->precios->first()?->precio ?? 0,
                ];
            });

        return Inertia::render('ventas/create', [
            'venta'     => $venta,
            'clientes'  => \App\Models\Cliente::select('id', 'nombre', 'nit')->orderBy('nombre')->get(),
            'productos' => $productos,
            'monedas'   => \App\Models\Moneda::select('id', 'codigo', 'nombre', 'simbolo')->where('activo', true)->get(),
            'estados'   => \App\Models\EstadoDocumento::select('id', 'nombre')->get(),
        ]);
    }

    public function store(StoreVentaRequest $request)
    {
        $data         = $request->validated();
        $stockService = app(StockService::class);

        return DB::transaction(function () use ($data, $request, $stockService) {
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
}
