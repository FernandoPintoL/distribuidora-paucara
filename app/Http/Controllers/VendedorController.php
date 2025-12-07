<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Controlador de Dashboard para Vendedor/Cajero
 * Muestra solo datos relevantes para vendedor/caja
 */
class VendedorController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Dashboard específico para Vendedor/Cajero
     */
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $periodo = $request->get('periodo', 'mes_actual');

        // Obtener métricas del sistema
        $metricas = $this->dashboardService->getMainMetrics($periodo);
        $graficoVentas = $this->dashboardService->getGraficoVentas($periodo);
        $productosMasVendidos = $this->dashboardService->getProductosMasVendidos(10);
        $alertasStock = $this->dashboardService->getAlertasStock();

        // Filtrar datos específicos para vendedor
        $metricasVendedor = [
            'ventas' => $metricas['ventas'] ?? [],
            'caja' => $metricas['caja'] ?? [],
            'clientes' => $metricas['clientes'] ?? [],
            'proformas' => $metricas['proformas'] ?? [],
        ];

        return Inertia::render('vendedor/dashboard', [
            'metricas' => $metricasVendedor,
            'graficoVentas' => $graficoVentas,
            'productosMasVendidos' => $productosMasVendidos,
            'alertasStock' => $alertasStock,
            'periodo' => $periodo,
            'titulo' => 'Dashboard Vendedor',
            'descripcion' => 'Resumen de ventas y caja',
        ]);
    }
}
