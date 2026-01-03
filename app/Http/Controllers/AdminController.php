<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Controlador de Dashboard para Admin
 * Muestra resumen completo del sistema
 */
class AdminController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $periodo = $request->get('periodo', 'ultimos_30_dias');

        // Obtener todas las métricas para el admin
        $metricas = $this->dashboardService->getMainMetrics($periodo);
        $graficoVentas = $this->dashboardService->getGraficoVentas($periodo);
        $productosMasVendidos = $this->dashboardService->getProductosMasVendidos(10);
        $alertasStock = $this->dashboardService->getAlertasStock();
        $ventasPorCanal = $this->dashboardService->getVentasPorCanal($periodo);

        return Inertia::render('admin/dashboard', [
            'metricas' => $metricas,
            'graficoVentas' => $graficoVentas,
            'productosMasVendidos' => $productosMasVendidos,
            'alertasStock' => $alertasStock,
            'ventasPorCanal' => $ventasPorCanal,
            'periodo' => $periodo,
            'titulo' => 'Dashboard Administrativo',
            'descripcion' => 'Resumen completo del sistema',
        ]);
    }
}
