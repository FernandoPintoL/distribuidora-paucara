<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Compra;
use App\Models\MovimientoCaja;
use App\Models\Producto;
use App\Models\Proforma;
use App\Models\StockProducto;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Obtener métricas principales del dashboard
     */
    public function getMainMetrics(string $periodo = 'mes_actual'): array
    {
        $fechas = $this->getFechasPeriodo($periodo);

        return [
            'ventas' => $this->getMetricasVentas($fechas),
            'compras' => $this->getMetricasCompras($fechas),
            'inventario' => $this->getMetricasInventario(),
            'caja' => $this->getMetricasCaja($fechas),
            'clientes' => $this->getMetricasClientes($fechas),
            'proformas' => $this->getMetricasProformas($fechas),
        ];
    }

    /**
     * Obtener datos para gráficos de ventas por período
     */
    public function getGraficoVentas(string $tipo = 'diario', int $dias = 30): array
    {
        $fechaInicio = Carbon::now()->subDays($dias);

        $ventas = Venta::select(
            DB::raw('DATE(fecha) as fecha'),
            DB::raw('COUNT(*) as total_ventas'),
            DB::raw('SUM(total) as monto_total'),
            DB::raw('AVG(total) as promedio_venta')
        )
            ->where('fecha', '>=', $fechaInicio)
            ->whereHas('estadoDocumento', function ($query) {
                $query->where('es_estado_final', true);
            })
            ->groupBy(DB::raw('DATE(fecha)'))
            ->orderBy('fecha')
            ->get();

        return [
            'labels' => $ventas->pluck('fecha')->map(function ($fecha) {
                return Carbon::parse($fecha)->format('d/m');
            })->toArray(),
            'datasets' => [
                [
                    'label' => 'Monto de Ventas (Bs)',
                    'data' => $ventas->pluck('monto_total')->toArray(),
                    'backgroundColor' => 'rgba(59, 130, 246, 0.5)',
                    'borderColor' => 'rgb(59, 130, 246)',
                    'tension' => 0.1,
                ],
                [
                    'label' => 'Cantidad de Ventas',
                    'data' => $ventas->pluck('total_ventas')->toArray(),
                    'backgroundColor' => 'rgba(16, 185, 129, 0.5)',
                    'borderColor' => 'rgb(16, 185, 129)',
                    'tension' => 0.1,
                    'yAxisID' => 'y1',
                ],
            ],
        ];
    }

    /**
     * Obtener productos más vendidos
     */
    public function getProductosMasVendidos(int $limite = 10): array
    {
        return DB::table('detalle_ventas')
            ->join('productos', 'detalle_ventas.producto_id', '=', 'productos.id')
            ->join('ventas', 'detalle_ventas.venta_id', '=', 'ventas.id')
            ->whereDate('ventas.fecha', '>=', Carbon::now()->subDays(30))
            ->select(
                'productos.nombre',
                DB::raw('SUM(detalle_ventas.cantidad) as total_vendido'),
                DB::raw('SUM(detalle_ventas.subtotal) as ingresos_total')
            )
            ->groupBy('productos.id', 'productos.nombre')
            ->orderBy('total_vendido', 'desc')
            ->limit($limite)
            ->get()
            ->toArray();
    }

    /**
     * Obtener alertas de stock bajo
     */
    public function getAlertasStock(): array
    {
        $stockBajo = StockProducto::with(['producto', 'almacen'])
            ->whereColumn('cantidad', '<=', DB::raw('productos.stock_minimo'))
            ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
            ->where('productos.activo', true)
            ->select('stock_productos.*')
            ->get();

        $stockCritico = $stockBajo->where('cantidad', '<=', function ($item) {
            return $item->producto->stock_minimo * 0.5;
        });

        return [
            'stock_bajo' => $stockBajo->count(),
            'stock_critico' => $stockCritico->count(),
            'productos_afectados' => $stockBajo->take(5)->map(function ($stock) {
                return [
                    'producto' => $stock->producto->nombre,
                    'almacen' => $stock->almacen->nombre,
                    'cantidad_actual' => $stock->cantidad,
                    'stock_minimo' => $stock->producto->stock_minimo,
                ];
            }),
        ];
    }

    /**
     * Obtener distribución de ventas por canal
     */
    public function getVentasPorCanal(string $periodo = 'mes_actual'): array
    {
        $fechas = $this->getFechasPeriodo($periodo);

        return Venta::select('canal_origen', DB::raw('COUNT(*) as total'), DB::raw('SUM(total) as monto'))
            ->whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])
            ->groupBy('canal_origen')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->canal_origen => [
                    'total' => $item->total,
                    'monto' => $item->monto,
                ]];
            })
            ->toArray();
    }

    /**
     * Obtener métricas de ventas
     */
    private function getMetricasVentas(array $fechas): array
    {
        $ventasActuales = Venta::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->sum('total');
        $ventasAnteriores = Venta::whereBetween('fecha', [$fechas['inicio_anterior'], $fechas['fin_anterior']])->sum('total');

        $cambio = $ventasAnteriores > 0 ? (($ventasActuales - $ventasAnteriores) / $ventasAnteriores) * 100 : 0;

        return [
            'total' => $ventasActuales,
            'cantidad' => Venta::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->count(),
            'promedio' => Venta::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->avg('total') ?? 0,
            'cambio_porcentual' => round($cambio, 2),
        ];
    }

    /**
     * Obtener métricas de compras
     */
    private function getMetricasCompras(array $fechas): array
    {
        $comprasActuales = Compra::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->sum('total');
        $comprasAnteriores = Compra::whereBetween('fecha', [$fechas['inicio_anterior'], $fechas['fin_anterior']])->sum('total');

        $cambio = $comprasAnteriores > 0 ? (($comprasActuales - $comprasAnteriores) / $comprasAnteriores) * 100 : 0;

        return [
            'total' => $comprasActuales,
            'cantidad' => Compra::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->count(),
            'promedio' => Compra::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->avg('total') ?? 0,
            'cambio_porcentual' => round($cambio, 2),
        ];
    }

    /**
     * Obtener métricas de inventario
     */
    private function getMetricasInventario(): array
    {
        $totalProductos = Producto::where('activo', true)->count();
        $stockTotal = StockProducto::sum('cantidad');
        $valorInventario = DB::table('stock_productos')
            ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
            ->join('precios_producto', function ($join) {
                $join->on('productos.id', '=', 'precios_producto.producto_id')
                    ->where('precios_producto.es_precio_base', true)
                    ->where('precios_producto.activo', true);
            })
            ->sum(DB::raw('stock_productos.cantidad * precios_producto.precio'));

        return [
            'total_productos' => $totalProductos,
            'stock_total' => $stockTotal,
            'valor_inventario' => $valorInventario,
            'productos_sin_stock' => StockProducto::where('cantidad', '<=', 0)->count(),
        ];
    }

    /**
     * Obtener métricas de caja
     */
    private function getMetricasCaja(array $fechas): array
    {
        $ingresos = MovimientoCaja::join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->where('tipo_operacion_caja.codigo', 'INGRESO')
            ->whereBetween('movimientos_caja.fecha', [$fechas['inicio'], $fechas['fin']])
            ->sum('movimientos_caja.monto');

        $egresos = MovimientoCaja::join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->where('tipo_operacion_caja.codigo', 'EGRESO')
            ->whereBetween('movimientos_caja.fecha', [$fechas['inicio'], $fechas['fin']])
            ->sum('movimientos_caja.monto');

        return [
            'ingresos' => $ingresos,
            'egresos' => $egresos,
            'saldo' => $ingresos - $egresos,
            'total_movimientos' => MovimientoCaja::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->count(),
        ];
    }

    /**
     * Obtener métricas de clientes
     */
    private function getMetricasClientes(array $fechas): array
    {
        $clientesNuevos = Cliente::whereBetween('fecha_registro', [$fechas['inicio'], $fechas['fin']])->count();
        $clientesActivos = Cliente::whereHas('ventas', function ($query) use ($fechas) {
            $query->whereBetween('fecha', [$fechas['inicio'], $fechas['fin']]);
        })->count();

        return [
            'total' => Cliente::where('activo', true)->count(),
            'nuevos' => $clientesNuevos,
            'activos' => $clientesActivos,
            'con_credito' => Cliente::where('limite_credito', '>', 0)->count(),
        ];
    }

    /**
     * Obtener métricas de proformas
     */
    private function getMetricasProformas(array $fechas): array
    {
        $total = Proforma::whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->count();
        $aprobadas = Proforma::where('estado', 'APROBADA')->whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->count();
        $pendientes = Proforma::where('estado', 'PENDIENTE')->whereBetween('fecha', [$fechas['inicio'], $fechas['fin']])->count();

        return [
            'total' => $total,
            'aprobadas' => $aprobadas,
            'pendientes' => $pendientes,
            'tasa_aprobacion' => $total > 0 ? round(($aprobadas / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Obtener fechas para el período especificado
     */
    private function getFechasPeriodo(string $periodo): array
    {
        switch ($periodo) {
            case 'hoy':
                $inicio = Carbon::today();
                $fin = Carbon::today()->endOfDay();
                $inicioAnterior = Carbon::yesterday();
                $finAnterior = Carbon::yesterday()->endOfDay();
                break;

            case 'semana_actual':
                $inicio = Carbon::now()->startOfWeek();
                $fin = Carbon::now()->endOfWeek();
                $inicioAnterior = Carbon::now()->subWeek()->startOfWeek();
                $finAnterior = Carbon::now()->subWeek()->endOfWeek();
                break;

            case 'mes_actual':
            default:
                $inicio = Carbon::now()->startOfMonth();
                $fin = Carbon::now()->endOfMonth();
                $inicioAnterior = Carbon::now()->subMonth()->startOfMonth();
                $finAnterior = Carbon::now()->subMonth()->endOfMonth();
                break;

            case 'año_actual':
                $inicio = Carbon::now()->startOfYear();
                $fin = Carbon::now()->endOfYear();
                $inicioAnterior = Carbon::now()->subYear()->startOfYear();
                $finAnterior = Carbon::now()->subYear()->endOfYear();
                break;
        }

        return [
            'inicio' => $inicio,
            'fin' => $fin,
            'inicio_anterior' => $inicioAnterior,
            'fin_anterior' => $finAnterior,
        ];
    }
}
