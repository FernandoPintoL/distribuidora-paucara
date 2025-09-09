<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class InventarioController extends Controller
{
    /**
     * Dashboard principal de inventario
     */
    public function dashboard(): Response
    {
        // Estadísticas generales
        $totalProductos = Producto::where('activo', true)->count();
        $productosStockBajo = Producto::stockBajo()->count();
        $productosProximosVencer = Producto::proximosVencer(30)->count();
        $productosVencidos = Producto::vencidos()->count();

        // Stock total por almacén
        $stockPorAlmacen = Almacen::withSum('stockProductos', 'cantidad')
            ->where('activo', true)
            ->get()
            ->map(function ($almacen) {
                return [
                    'nombre' => $almacen->nombre,
                    'stock_total' => $almacen->stock_productos_sum_cantidad ?? 0,
                ];
            });

        // Movimientos recientes (últimos 7 días)
        $movimientosRecientes = MovimientoInventario::with(['stockProducto.producto', 'stockProducto.almacen', 'user'])
            ->whereBetween('fecha', [now()->subDays(7), now()])
            ->orderByDesc('fecha')
            ->limit(10)
            ->get();

        // Top productos con más movimientos en el mes
        $productosMasMovidos = MovimientoInventario::select([
                'stock_productos.producto_id',
                DB::raw('COUNT(*) as total_movimientos'),
                DB::raw('SUM(ABS(movimientos_inventario.cantidad)) as cantidad_total')
            ])
            ->join('stock_productos', 'movimientos_inventario.stock_producto_id', '=', 'stock_productos.id')
            ->whereBetween('fecha', [now()->startOfMonth(), now()])
            ->groupBy('stock_productos.producto_id')
            ->orderByDesc('total_movimientos')
            ->limit(10)
            ->with('producto:id,nombre')
            ->get();

        return Inertia::render('inventario/dashboard', [
            'estadisticas' => [
                'total_productos' => $totalProductos,
                'productos_stock_bajo' => $productosStockBajo,
                'productos_proximos_vencer' => $productosProximosVencer,
                'productos_vencidos' => $productosVencidos,
            ],
            'stock_por_almacen' => $stockPorAlmacen,
            'movimientos_recientes' => $movimientosRecientes,
            'productos_mas_movidos' => $productosMasMovidos,
        ]);
    }

    /**
     * Productos con stock bajo
     */
    public function stockBajo(Request $request): Response
    {
        $q = (string) $request->string('q');
        $almacenId = $request->integer('almacen_id');

        $productos = Producto::stockBajo()
            ->with(['categoria', 'marca'])
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->with('almacen');
            }])
            ->when($q, function ($query) use ($q) {
                $query->where('nombre', 'ilike', "%$q%");
            })
            ->when($almacenId, function ($query) use ($almacenId) {
                $query->whereHas('stock', function ($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            })
            ->withCount(['stock as stock_total' => function ($query) {
                $query->select(DB::raw('COALESCE(SUM(cantidad), 0)'));
            }])
            ->paginate(20)
            ->withQueryString();

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/stock-bajo', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters' => [
                'q' => $q,
                'almacen_id' => $almacenId,
            ],
        ]);
    }

    /**
     * Productos próximos a vencer
     */
    public function proximosVencer(Request $request): Response
    {
        $diasAnticipacion = $request->integer('dias', 30);
        $almacenId = $request->integer('almacen_id');

        $productos = Producto::proximosVencer($diasAnticipacion)
            ->with(['categoria', 'marca'])
            ->with(['stock' => function ($query) use ($almacenId, $diasAnticipacion) {
                $fechaLimite = now()->addDays($diasAnticipacion);
                $query->whereNotNull('fecha_vencimiento')
                    ->where('fecha_vencimiento', '<=', $fechaLimite)
                    ->where('cantidad', '>', 0)
                    ->with('almacen');

                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }

                $query->orderBy('fecha_vencimiento');
            }])
            ->paginate(20)
            ->withQueryString();

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/proximos-vencer', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters' => [
                'dias' => $diasAnticipacion,
                'almacen_id' => $almacenId,
            ],
        ]);
    }

    /**
     * Productos vencidos
     */
    public function vencidos(Request $request): Response
    {
        $almacenId = $request->integer('almacen_id');

        $productos = Producto::vencidos()
            ->with(['categoria', 'marca'])
            ->with(['stock' => function ($query) use ($almacenId) {
                $query->whereNotNull('fecha_vencimiento')
                    ->where('fecha_vencimiento', '<', now()->toDateString())
                    ->where('cantidad', '>', 0)
                    ->with('almacen');

                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }

                $query->orderBy('fecha_vencimiento');
            }])
            ->paginate(20)
            ->withQueryString();

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/vencidos', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters' => [
                'almacen_id' => $almacenId,
            ],
        ]);
    }

    /**
     * Historial de movimientos
     */
    public function movimientos(Request $request): Response
    {
        $fechaInicio = $request->date('fecha_inicio', now()->subMonth());
        $fechaFin = $request->date('fecha_fin', now());
        $tipo = $request->string('tipo');
        $almacenId = $request->integer('almacen_id');
        $productoId = $request->integer('producto_id');

        $movimientos = MovimientoInventario::with([
                'stockProducto.producto:id,nombre',
                'stockProducto.almacen:id,nombre',
                'user:id,name'
            ])
            ->porFecha($fechaInicio, $fechaFin)
            ->when($tipo, fn($q) => $q->porTipo($tipo))
            ->when($almacenId, fn($q) => $q->porAlmacen($almacenId))
            ->when($productoId, fn($q) => $q->porProducto($productoId))
            ->orderByDesc('fecha')
            ->paginate(50)
            ->withQueryString();

        $tipos = MovimientoInventario::getTipos();
        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/movimientos', [
            'movimientos' => $movimientos,
            'tipos' => $tipos,
            'almacenes' => $almacenes,
            'filters' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'tipo' => $tipo,
                'almacen_id' => $almacenId,
                'producto_id' => $productoId,
            ],
        ]);
    }

    /**
     * Formulario de ajuste de inventario
     */
    public function ajusteForm(Request $request): Response
    {
        $almacenId = $request->integer('almacen_id');
        
        $stockProductos = collect();
        if ($almacenId) {
            $stockProductos = StockProducto::where('almacen_id', $almacenId)
                ->with(['producto:id,nombre', 'almacen:id,nombre'])
                ->orderBy('cantidad', 'desc')
                ->get();
        }

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/ajuste-form', [
            'almacenes' => $almacenes,
            'stock_productos' => $stockProductos,
            'almacen_seleccionado' => $almacenId,
        ]);
    }

    /**
     * Procesar ajuste de inventario
     */
    public function procesarAjuste(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ajustes' => ['required', 'array'],
            'ajustes.*.stock_producto_id' => ['required', 'exists:stock_productos,id'],
            'ajustes.*.nueva_cantidad' => ['required', 'integer', 'min:0'],
            'ajustes.*.observacion' => ['nullable', 'string', 'max:500'],
        ]);

        $movimientos = [];
        
        DB::transaction(function () use ($data, &$movimientos) {
            foreach ($data['ajustes'] as $ajuste) {
                $stockProducto = StockProducto::find($ajuste['stock_producto_id']);
                $observacion = $ajuste['observacion'] ?? 'Ajuste masivo de inventario';

                if ($stockProducto && $stockProducto->cantidad != $ajuste['nueva_cantidad']) {
                    $diferencia = $ajuste['nueva_cantidad'] - $stockProducto->cantidad;
                    $tipo = $diferencia >= 0 ? 
                        MovimientoInventario::TIPO_ENTRADA_AJUSTE : 
                        MovimientoInventario::TIPO_SALIDA_AJUSTE;

                    $movimiento = MovimientoInventario::registrar(
                        $stockProducto,
                        $diferencia,
                        $tipo,
                        $observacion
                    );

                    $movimientos[] = $movimiento;
                }
            }
        });

        return redirect()->route('inventario.ajuste.form')
            ->with('success', 'Se procesaron ' . count($movimientos) . ' ajustes de inventario');
    }

    /**
     * API: Procesar ajuste de inventario
     */
    public function procesarAjusteApi(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ajustes' => ['required', 'array'],
            'ajustes.*.stock_producto_id' => ['required', 'exists:stock_productos,id'],
            'ajustes.*.nueva_cantidad' => ['required', 'integer', 'min:0'],
            'ajustes.*.observacion' => ['nullable', 'string', 'max:500'],
        ]);

        $movimientos = [];
        
        try {
            DB::transaction(function () use ($data, &$movimientos) {
                foreach ($data['ajustes'] as $ajuste) {
                    $stockProducto = StockProducto::find($ajuste['stock_producto_id']);
                    $observacion = $ajuste['observacion'] ?? 'Ajuste masivo de inventario';

                    if ($stockProducto && $stockProducto->cantidad != $ajuste['nueva_cantidad']) {
                        $diferencia = $ajuste['nueva_cantidad'] - $stockProducto->cantidad;
                        $tipo = $diferencia >= 0 ? 
                            MovimientoInventario::TIPO_ENTRADA_AJUSTE : 
                            MovimientoInventario::TIPO_SALIDA_AJUSTE;

                        $movimiento = MovimientoInventario::registrar(
                            $stockProducto,
                            $diferencia,
                            $tipo,
                            $observacion
                        );

                        $movimientos[] = $movimiento;
                    }
                }
            });

            return ApiResponse::success(
                $movimientos, 
                'Se procesaron ' . count($movimientos) . ' ajustes de inventario'
            );

        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al procesar ajustes: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * API: Listar movimientos de inventario
     */
    public function movimientosApi(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);
        $almacenId = $request->integer('almacen_id');
        $productoId = $request->integer('producto_id');
        $tipo = $request->string('tipo');
        $fechaInicio = $request->date('fecha_inicio');
        $fechaFin = $request->date('fecha_fin');

        $movimientos = MovimientoInventario::with([
                'stockProducto.producto:id,nombre,codigo', 
                'stockProducto.almacen:id,nombre',
                'user:id,name'
            ])
            ->when($almacenId, fn($q) => $q->whereHas('stockProducto', fn($sq) => $sq->where('almacen_id', $almacenId)))
            ->when($productoId, fn($q) => $q->whereHas('stockProducto', fn($sq) => $sq->where('producto_id', $productoId)))
            ->when($tipo, fn($q) => $q->where('tipo', $tipo))
            ->when($fechaInicio, fn($q) => $q->whereDate('fecha', '>=', $fechaInicio))
            ->when($fechaFin, fn($q) => $q->whereDate('fecha', '<=', $fechaFin))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->paginate($perPage);

        return ApiResponse::success($movimientos);
    }

    /**
     * API: Crear movimiento manual de inventario
     */
    public function crearMovimiento(Request $request): JsonResponse
    {
        $data = $request->validate([
            'stock_producto_id' => ['required', 'exists:stock_productos,id'],
            'cantidad' => ['required', 'integer', 'not_in:0'],
            'tipo' => ['required', 'in:entrada_ajuste,salida_ajuste'],
            'observacion' => ['required', 'string', 'max:500'],
        ]);

        try {
            $stockProducto = StockProducto::findOrFail($data['stock_producto_id']);
            
            $movimiento = MovimientoInventario::registrar(
                $stockProducto,
                $data['cantidad'],
                $data['tipo'],
                $data['observacion']
            );

            return ApiResponse::success(
                $movimiento->load(['stockProducto.producto', 'stockProducto.almacen', 'user']), 
                'Movimiento registrado exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al registrar movimiento: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * API: Buscar productos para ajustes
     */
    public function buscarProductos(Request $request): JsonResponse
    {
        $q = $request->string('q');
        $almacenId = $request->integer('almacen_id');

        if (!$q || strlen($q) < 2) {
            return ApiResponse::success([]);
        }

        $productos = Producto::where('nombre', 'ilike', "%$q%")
            ->where('activo', true)
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->with('almacen');
            }])
            ->limit(20)
            ->get();

    return ApiResponse::success($productos);
    }

    /**
     * API: Obtener stock de un producto específico
     */
    public function stockProducto(Producto $producto, Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');
        
        $stock = $producto->stock()
            ->when($almacenId, fn($q) => $q->where('almacen_id', $almacenId))
            ->with('almacen')
            ->get();

        return ApiResponse::success([
            'producto' => [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'stock_minimo' => $producto->stock_minimo,
                'stock_maximo' => $producto->stock_maximo,
                'stock_total' => $producto->stockTotal(),
                'stock_bajo' => $producto->stockBajo(),
            ],
            'stock_por_almacen' => $stock
        ]);
    }
}
