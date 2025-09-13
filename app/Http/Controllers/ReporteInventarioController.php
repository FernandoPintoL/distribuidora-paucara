<?php
namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReporteInventarioController extends Controller
{
    /**
     * Reporte de stock actual por almacén
     */
    public function stockActual(Request $request): Response
    {
        $filtros = $request->validate([
            'almacen_id'   => ['nullable', 'exists:almacenes,id'],
            'categoria_id' => ['nullable', 'exists:categorias,id'],
            'stock_bajo'   => ['nullable', 'boolean'],
            'stock_alto'   => ['nullable', 'boolean'],
        ]);

        $query = StockProducto::with(['producto.categoria', 'almacen'])
            ->where('cantidad', '>', 0);

        // Aplicar filtros
        if (! empty($filtros['almacen_id'])) {
            $query->where('almacen_id', $filtros['almacen_id']);
        }

        if (! empty($filtros['categoria_id'])) {
            $query->whereHas('producto', function ($q) use ($filtros) {
                $q->where('categoria_id', $filtros['categoria_id']);
            });
        }

        if (! empty($filtros['stock_bajo'])) {
            $query->whereHas('producto', function ($q) {
                $q->whereColumn('stock_minimo', '>', 0)
                    ->whereRaw('(SELECT COALESCE(SUM(cantidad), 0) FROM stock_productos sp WHERE sp.producto_id = productos.id) < stock_minimo');
            });
        }

        if (! empty($filtros['stock_alto'])) {
            $query->whereHas('producto', function ($q) {
                $q->whereColumn('stock_maximo', '>', 0)
                    ->whereRaw('(SELECT COALESCE(SUM(cantidad), 0) FROM stock_productos sp WHERE sp.producto_id = productos.id) > stock_maximo');
            });
        }

        $stock = $query->orderBy('cantidad', 'desc')->paginate(50)->withQueryString();

        // Estadísticas generales
        $estadisticas = [
            'total_productos'        => StockProducto::distinct('producto_id')->count(),
            'total_stock'            => StockProducto::sum('cantidad'),
            'productos_stock_bajo'   => Producto::query()->stockBajo()->count(),
            'productos_stock_alto'   => Producto::query()->stockAlto()->count(),
            'valor_total_inventario' => $this->calcularValorInventario($filtros),
        ];

        return Inertia::render('reportes/inventario/stock-actual', [
            'stock'        => $stock,
            'estadisticas' => $estadisticas,
            'filtros'      => $filtros,
            'almacenes'    => Almacen::orderBy('nombre')->get(['id', 'nombre']),
            'categorias'   => \App\Models\Categoria::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    /**
     * Reporte de productos vencidos y próximos a vencer
     */
    public function vencimientos(Request $request): Response
    {
        $filtros = $request->validate([
            'almacen_id'        => ['nullable', 'exists:almacenes,id'],
            'dias_anticipacion' => ['nullable', 'integer', 'min:1', 'max:365'],
            'solo_vencidos'     => ['nullable', 'boolean'],
        ]);

        $diasAnticipacion = $filtros['dias_anticipacion'] ?? 30;
        $soloVencidos     = $filtros['solo_vencidos'] ?? false;

        $query = StockProducto::with(['producto.categoria', 'almacen'])
            ->whereNotNull('fecha_vencimiento')
            ->where('cantidad', '>', 0);

        if ($soloVencidos) {
            $query->where('fecha_vencimiento', '<', now());
        } else {
            $fechaLimite = now()->addDays($diasAnticipacion);
            $query->where('fecha_vencimiento', '<=', $fechaLimite);
        }

        if (! empty($filtros['almacen_id'])) {
            $query->where('almacen_id', $filtros['almacen_id']);
        }

        $productos = $query->orderBy('fecha_vencimiento')->paginate(50)->withQueryString();

        // Estadísticas
        $estadisticas = [
            'productos_vencidos'        => StockProducto::whereNotNull('fecha_vencimiento')
                ->where('fecha_vencimiento', '<', now())
                ->where('cantidad', '>', 0)
                ->count(),
            'productos_proximos_vencer' => StockProducto::whereNotNull('fecha_vencimiento')
                ->where('fecha_vencimiento', '<=', now()->addDays($diasAnticipacion))
                ->where('fecha_vencimiento', '>=', now())
                ->where('cantidad', '>', 0)
                ->count(),
            'valor_productos_vencidos'  => $this->calcularValorVencidos(),
        ];

        return Inertia::render('reportes/inventario/vencimientos', [
            'productos'    => $productos,
            'estadisticas' => $estadisticas,
            'filtros'      => $filtros,
            'almacenes'    => Almacen::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    /**
     * Reporte de rotación de inventario
     */
    public function rotacion(Request $request): Response
    {
        $filtros = $request->validate([
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin'    => ['nullable', 'date'],
            'almacen_id'   => ['nullable', 'exists:almacenes,id'],
            'categoria_id' => ['nullable', 'exists:categorias,id'],
        ]);

        $fechaInicio = $filtros['fecha_inicio'] ?? now()->subMonths(3);
        $fechaFin    = $filtros['fecha_fin'] ?? now();

        // Productos con más salidas (mayor rotación)
        $rotacionQuery = MovimientoInventario::select([
            'stock_productos.producto_id',
            DB::raw("COUNT(CASE WHEN movimientos_inventario.tipo LIKE 'SALIDA_%' THEN 1 END) as total_salidas"),
            DB::raw("SUM(CASE WHEN movimientos_inventario.tipo LIKE 'SALIDA_%' THEN ABS(movimientos_inventario.cantidad) ELSE 0 END) as cantidad_vendida"),
            DB::raw('AVG(stock_productos.cantidad) as stock_promedio'),
            DB::raw("CASE WHEN AVG(stock_productos.cantidad) > 0 THEN SUM(CASE WHEN movimientos_inventario.tipo LIKE 'SALIDA_%' THEN ABS(movimientos_inventario.cantidad) ELSE 0 END) / AVG(stock_productos.cantidad) ELSE 0 END as indice_rotacion"),
        ])
            ->join('stock_productos', 'movimientos_inventario.stock_producto_id', '=', 'stock_productos.id')
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->groupBy('stock_productos.producto_id');

        if (! empty($filtros['almacen_id'])) {
            $rotacionQuery->where('stock_productos.almacen_id', $filtros['almacen_id']);
        }

        // Para evitar problemas con count() en consultas complejas, obtenemos el total primero
        $totalQuery         = clone $rotacionQuery;
        $totalResultados    = $totalQuery->havingRaw("COUNT(CASE WHEN movimientos_inventario.tipo LIKE 'SALIDA_%' THEN 1 END) > 0")->get();
        $totalConMovimiento = $totalResultados->count();

        $rotacion = $rotacionQuery->havingRaw("COUNT(CASE WHEN movimientos_inventario.tipo LIKE 'SALIDA_%' THEN 1 END) > 0")
            ->orderByDesc('indice_rotacion')
            ->paginate(50)
            ->withQueryString();

        // Cargar productos para cada resultado
        $rotacion->getCollection()->transform(function ($item) {
            $producto       = Producto::find($item->producto_id);
            $item->producto = $producto ? $producto->only(['id', 'nombre']) : null;
            return $item;
        });

        // Estadísticas de rotación
        $estadisticas = [
            'productos_con_movimiento' => $totalConMovimiento,
            'productos_sin_movimiento' => Producto::whereDoesntHave('movimientos', function ($q) use ($fechaInicio, $fechaFin) {
                $q->whereBetween('fecha', [$fechaInicio, $fechaFin]);
            })->count(),
            'rotacion_promedio'        => $totalResultados->avg('indice_rotacion') ?? 0,
        ];

        return Inertia::render('reportes/inventario/rotacion', [
            'rotacion'     => $rotacion,
            'estadisticas' => $estadisticas,
            'filtros'      => $filtros,
            'almacenes'    => Almacen::orderBy('nombre')->get(['id', 'nombre']),
            'categorias'   => \App\Models\Categoria::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    /**
     * Reporte de movimientos de inventario
     */
    public function movimientos(Request $request): Response
    {
        $filtros = $request->validate([
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin'    => ['nullable', 'date'],
            'tipo'         => ['nullable', 'string'],
            'almacen_id'   => ['nullable', 'exists:almacenes,id'],
            'producto_id'  => ['nullable', 'exists:productos,id'],
        ]);

        $fechaInicio = $filtros['fecha_inicio'] ?? now()->subMonth();
        $fechaFin    = $filtros['fecha_fin'] ?? now();

        $movimientos = MovimientoInventario::with([
            'stockProducto.producto:id,nombre',
            'stockProducto.almacen:id,nombre',
            'user:id,name',
        ])
            ->whereBetween('fecha', [$fechaInicio, $fechaFin]);

        // Aplicar filtros adicionales
        if (! empty($filtros['tipo'])) {
            $movimientos->where('tipo', $filtros['tipo']);
        }

        if (! empty($filtros['almacen_id'])) {
            $movimientos->whereHas('stockProducto', function ($q) use ($filtros) {
                $q->where('almacen_id', $filtros['almacen_id']);
            });
        }

        if (! empty($filtros['producto_id'])) {
            $movimientos->whereHas('stockProducto', function ($q) use ($filtros) {
                $q->where('producto_id', $filtros['producto_id']);
            });
        }

        $movimientos = $movimientos->orderByDesc('fecha')->paginate(100)->withQueryString();

        // Estadísticas de movimientos
        $estadisticas = [
            'total_entradas'       => MovimientoInventario::entradas()
                ->whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->sum('cantidad'),
            'total_salidas'        => MovimientoInventario::salidas()
                ->whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->sum(DB::raw('ABS(cantidad)')),
            'movimientos_por_tipo' => $this->obtenerMovimientosPorTipo($fechaInicio, $fechaFin),
        ];

        return Inertia::render('reportes/inventario/movimientos', [
            'movimientos'  => $movimientos,
            'estadisticas' => $estadisticas,
            'filtros'      => $filtros,
            'tipos'        => MovimientoInventario::getTipos(),
            'almacenes'    => Almacen::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    /**
     * Exportar reporte a Excel/CSV
     */
    public function export(Request $request): JsonResponse
    {
        $tipo = $request->string('tipo'); // 'stock-actual', 'vencimientos', 'rotacion', 'movimientos'

        // Aquí puedes implementar la exportación usando Laravel Excel o similar
        // Por ahora retornamos los datos para que puedan ser procesados en el frontend

        switch ($tipo) {
            case 'stock-actual':
                $datos = $this->obtenerDatosStockActual($request->all());
                break;
            case 'vencimientos':
                $datos = $this->obtenerDatosVencimientos($request->all());
                break;
            case 'rotacion':
                $datos = $this->obtenerDatosRotacion($request->all());
                break;
            case 'movimientos':
                $datos = $this->obtenerDatosMovimientos($request->all());
                break;
            default:
                return response()->json(['error' => 'Tipo de reporte no válido'], 400);
        }

        return response()->json([
            'data'     => $datos,
            'filename' => "reporte_inventario_{$tipo}_" . now()->format('Y-m-d_H-i-s') . '.xlsx',
        ]);
    }

    /**
     * Métodos auxiliares privados
     */
    private function calcularValorInventario(array $filtros): float
    {
                    // Implementar cálculo del valor total del inventario
                    // usando precios de costo de los productos
        return 0.0; // Placeholder
    }

    private function calcularValorVencidos(): float
    {
                    // Implementar cálculo del valor de productos vencidos
        return 0.0; // Placeholder
    }

    private function obtenerMovimientosPorTipo(string $fechaInicio, string $fechaFin): array
    {
        return MovimientoInventario::select('tipo', DB::raw('COUNT(*) as cantidad'))
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->groupBy('tipo')
            ->pluck('cantidad', 'tipo')
            ->toArray();
    }

    private function obtenerDatosStockActual(array $filtros): array
    {
                   // Implementar obtención de datos para exportación
        return []; // Placeholder
    }

    private function obtenerDatosVencimientos(array $filtros): array
    {
                   // Implementar obtención de datos para exportación
        return []; // Placeholder
    }

    private function obtenerDatosRotacion(array $filtros): array
    {
                   // Implementar obtención de datos para exportación
        return []; // Placeholder
    }

    private function obtenerDatosMovimientos(array $filtros): array
    {
                   // Implementar obtención de datos para exportación
        return []; // Placeholder
    }
}
