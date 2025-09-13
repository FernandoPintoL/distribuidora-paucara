<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteInventarioApiController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:inventario.reportes')->only([
            'estadisticasGenerales',
            'stockBajo',
            'proximosVencer',
            'vencidos',
            'movimientosPorPeriodo',
            'productosMasMovidos',
        ]);
    }

    /**
     * Estadísticas generales de inventario
     */
    public function estadisticasGenerales(): JsonResponse
    {
        $estadisticas = [
            'total_productos'           => Producto::where('activo', true)->count(),
            'productos_stock_bajo'      => Producto::query()->stockBajo()->count(),
            'productos_proximos_vencer' => Producto::query()->proximosVencer(30)->count(),
            'productos_vencidos'        => Producto::query()->vencidos()->count(),
            'valor_total_inventario'    => StockProducto::join('productos', 'stock_productos.producto_id', '=', 'productos.id')
                ->selectRaw('SUM(stock_productos.cantidad * productos.precio_compra) as total')
                ->value('total') ?? 0,
            'stock_por_almacen'         => Almacen::withSum('stockProductos', 'cantidad')
                ->where('activo', true)
                ->get(['id', 'nombre'])
                ->map(function ($almacen) {
                    return [
                        'almacen_id'     => $almacen->id,
                        'almacen_nombre' => $almacen->nombre,
                        'stock_total'    => $almacen->stock_productos_sum_cantidad ?? 0,
                    ];
                }),
        ];

        return ApiResponse::success($estadisticas);
    }

    /**
     * Productos con stock bajo
     */
    public function stockBajo(Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');
        $perPage   = $request->integer('per_page', 20);

        $productos = Producto::query()->stockBajo()
            ->with(['categoria:id,nombre', 'marca:id,nombre'])
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->with('almacen:id,nombre');
            }])
            ->when($almacenId, function ($query) use ($almacenId) {
                $query->whereHas('stock', function ($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            })
            ->withCount(['stock as stock_total' => function ($query) {
                $query->select(DB::raw('COALESCE(SUM(cantidad), 0)'));
            }])
            ->paginate($perPage);

        return ApiResponse::success($productos);
    }

    /**
     * Productos próximos a vencer
     */
    public function proximosVencer(Request $request): JsonResponse
    {
        $dias      = $request->integer('dias', 30);
        $almacenId = $request->integer('almacen_id');
        $perPage   = $request->integer('per_page', 20);

        $productos = Producto::proximosVencer($dias)
            ->with(['categoria:id,nombre', 'marca:id,nombre'])
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->whereNotNull('fecha_vencimiento')
                    ->orderBy('fecha_vencimiento')
                    ->with('almacen:id,nombre');
            }])
            ->when($almacenId, function ($query) use ($almacenId) {
                $query->whereHas('stock', function ($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            })
            ->paginate($perPage);

        return ApiResponse::success($productos);
    }

    /**
     * Productos vencidos
     */
    public function vencidos(Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');
        $perPage   = $request->integer('per_page', 20);

        $productos = Producto::query()->vencidos()
            ->with(['categoria:id,nombre', 'marca:id,nombre'])
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->whereNotNull('fecha_vencimiento')
                    ->where('fecha_vencimiento', '<', now())
                    ->orderBy('fecha_vencimiento')
                    ->with('almacen:id,nombre');
            }])
            ->when($almacenId, function ($query) use ($almacenId) {
                $query->whereHas('stock', function ($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            })
            ->paginate($perPage);

        return ApiResponse::success($productos);
    }

    /**
     * Movimientos por período
     */
    public function movimientosPorPeriodo(Request $request): JsonResponse
    {
        $fechaInicio = $request->date('fecha_inicio', now()->subMonth());
        $fechaFin    = $request->date('fecha_fin', now());
        $almacenId   = $request->integer('almacen_id');
        $tipo        = $request->string('tipo');

        $movimientos = MovimientoInventario::with([
            'stockProducto.producto:id,nombre,codigo',
            'stockProducto.almacen:id,nombre',
            'user:id,name',
        ])
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->when($almacenId, function ($q) use ($almacenId) {
                $q->whereHas('stockProducto', fn($sq) => $sq->where('almacen_id', $almacenId));
            })
            ->when($tipo, fn($q) => $q->where('tipo', $tipo))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get();

        // Agrupar por tipo
        $resumenPorTipo = $movimientos->groupBy('tipo')->map(function ($items, $tipo) {
            return [
                'tipo'                 => $tipo,
                'cantidad_movimientos' => $items->count(),
                'cantidad_total'       => $items->sum('cantidad'),
                'valor_total'          => $items->sum(function ($mov) {
                    return abs($mov->cantidad) * ($mov->stockProducto->producto->precio_compra ?? 0);
                }),
            ];
        })->values();

        return ApiResponse::success([
            'movimientos'       => $movimientos,
            'resumen_por_tipo'  => $resumenPorTipo,
            'total_movimientos' => $movimientos->count(),
            'periodo'           => [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin'    => $fechaFin->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Productos más movidos en un período
     */
    public function productosMasMovidos(Request $request): JsonResponse
    {
        $fechaInicio = $request->date('fecha_inicio', now()->subMonth());
        $fechaFin    = $request->date('fecha_fin', now());
        $limite      = $request->integer('limite', 20);
        $almacenId   = $request->integer('almacen_id');

        $productos = DB::table('movimientos_inventario')
            ->select([
                'productos.id',
                'productos.nombre',
                'productos.codigo',
                DB::raw('COUNT(*) as total_movimientos'),
                DB::raw('SUM(ABS(movimientos_inventario.cantidad)) as cantidad_total'),
                DB::raw('AVG(ABS(movimientos_inventario.cantidad)) as promedio_movimiento'),
            ])
            ->join('stock_productos', 'movimientos_inventario.stock_producto_id', '=', 'stock_productos.id')
            ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
            ->whereBetween('movimientos_inventario.fecha', [$fechaInicio, $fechaFin])
            ->when($almacenId, fn($q) => $q->where('stock_productos.almacen_id', $almacenId))
            ->groupBy('productos.id', 'productos.nombre', 'productos.codigo')
            ->orderByDesc('total_movimientos')
            ->limit($limite)
            ->get();

        return ApiResponse::success([
            'productos' => $productos,
            'periodo'   => [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin'    => $fechaFin->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Valorización de inventario por almacén
     */
    public function valorizacionInventario(Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');

        $query = StockProducto::with(['producto:id,nombre,codigo,precio_compra,precio_venta', 'almacen:id,nombre'])
            ->where('cantidad', '>', 0);

        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        $stocks = $query->get();

        $valorizacion = $stocks->groupBy('almacen.nombre')->map(function ($items, $almacenNombre) {
            $valorCompra = $items->sum(function ($stock) {
                return $stock->cantidad * ($stock->producto->precio_compra ?? 0);
            });

            $valorVenta = $items->sum(function ($stock) {
                return $stock->cantidad * ($stock->producto->precio_venta ?? 0);
            });

            return [
                'almacen'         => $almacenNombre,
                'total_productos' => $items->count(),
                'cantidad_total'  => $items->sum('cantidad'),
                'valor_compra'    => $valorCompra,
                'valor_venta'     => $valorVenta,
                'margen_bruto'    => $valorVenta - $valorCompra,
                'productos'       => $items->map(function ($stock) {
                    return [
                        'producto_id'        => $stock->producto->id,
                        'producto_nombre'    => $stock->producto->nombre,
                        'producto_codigo'    => $stock->producto->codigo,
                        'cantidad'           => $stock->cantidad,
                        'precio_compra'      => $stock->producto->precio_compra,
                        'precio_venta'       => $stock->producto->precio_venta,
                        'valor_total_compra' => $stock->cantidad * ($stock->producto->precio_compra ?? 0),
                        'valor_total_venta'  => $stock->cantidad * ($stock->producto->precio_venta ?? 0),
                    ];
                }),
            ];
        });

        return ApiResponse::success($valorizacion);
    }
}
