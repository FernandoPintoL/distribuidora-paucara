<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Mostrar el dashboard principal
     */
    public function index(Request $request)
    {
        $periodo = $request->get('periodo', 'mes_actual');

        $metricas = $this->dashboardService->getMainMetrics($periodo);
        $graficoVentas = $this->dashboardService->getGraficoVentas($periodo);
        $productosMasVendidos = $this->dashboardService->getProductosMasVendidos(10, $periodo);
        $alertasStock = $this->dashboardService->getAlertasStock();
        $ventasPorCanal = $this->dashboardService->getVentasPorCanal($periodo);

        return Inertia::render('dashboard', [
            'metricas' => $metricas,
            'graficoVentas' => $graficoVentas,
            'productosMasVendidos' => $productosMasVendidos,
            'alertasStock' => $alertasStock,
            'ventasPorCanal' => $ventasPorCanal,
            'periodo' => $periodo,
        ]);
    }

    /**
     * Obtener métricas del dashboard via API
     */
    public function metricas(Request $request)
    {
        $periodo = $request->get('periodo', 'mes_actual');

        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getMainMetrics($periodo),
        ]);
    }

    /**
     * Obtener datos para gráficos via API
     */
    public function graficos(Request $request)
    {
        $tipo = $request->get('tipo', 'ventas');
        $dias = $request->get('dias', 30);

        $data = match ($tipo) {
            'ventas' => $this->dashboardService->getGraficoVentas('diario', $dias),
            default => []
        };

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Obtener productos más vendidos via API
     */
    public function productosMasVendidos(Request $request)
    {
        $limite = $request->get('limite', 10);

        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getProductosMasVendidos($limite),
        ]);
    }

    /**
     * Obtener alertas de stock via API
     */
    public function alertasStock()
    {
        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getAlertasStock(),
        ]);
    }

    /**
     * Obtener ventas por canal via API
     */
    public function ventasPorCanal(Request $request)
    {
        $periodo = $request->get('periodo', 'mes_actual');

        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getVentasPorCanal($periodo),
        ]);
    }
}
