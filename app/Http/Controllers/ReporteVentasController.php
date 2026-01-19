<?php

namespace App\Http\Controllers;

use App\Services\ReporteVentasService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\User;

class ReporteVentasController extends Controller
{
    private ReporteVentasService $reporteService;

    public function __construct(ReporteVentasService $reporteService)
    {
        $this->reporteService = $reporteService;
    }

    /**
     * Reporte de ventas por período (día/semana/mes/año)
     */
    public function porPeriodo(Request $request): Response
    {
        $filtros = $request->validate([
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date'],
            'granularidad' => ['nullable', 'in:dia,semana,mes,año'],
            'moneda_id' => ['nullable', 'exists:monedas,id'],
        ]);

        $fechaInicio = $filtros['fecha_inicio'] ?? now()->subMonth();
        $fechaFin = $filtros['fecha_fin'] ?? now();

        // Obtener datos del reporte
        $ventasPorPeriodo = $this->reporteService->obtenerVentasPorPeriodo($filtros);

        // Obtener estadísticas generales
        $estadisticas = $this->reporteService->obtenerEstadisticas($filtros);

        return Inertia::render('reportes/ventas/por-periodo', [
            'ventasPorPeriodo' => $ventasPorPeriodo,
            'estadisticas' => $estadisticas,
            'filtros' => array_merge($filtros, [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin' => $fechaFin->format('Y-m-d'),
            ]),
        ]);
    }

    /**
     * Reporte de ventas por cliente y producto
     */
    public function porClienteProducto(Request $request): Response
    {
        $filtros = $request->validate([
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date'],
            'cliente_id' => ['nullable', 'exists:clientes,id'],
            'producto_id' => ['nullable', 'exists:productos,id'],
            'monto_minimo' => ['nullable', 'numeric', 'min:0'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $fechaInicio = $filtros['fecha_inicio'] ?? now()->subMonth();
        $fechaFin = $filtros['fecha_fin'] ?? now();

        // Obtener datos del reporte
        $ventasPorClienteProducto = $this->reporteService->obtenerVentasPorClienteProducto($filtros);

        // Obtener estadísticas generales
        $estadisticas = $this->reporteService->obtenerEstadisticas($filtros);

        return Inertia::render('reportes/ventas/por-cliente-producto', [
            'ventasPorClienteProducto' => $ventasPorClienteProducto,
            'estadisticas' => $estadisticas,
            'filtros' => array_merge($filtros, [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin' => $fechaFin->format('Y-m-d'),
            ]),
            'clientes' => Cliente::orderBy('nombre')->get(['id', 'nombre'])->toArray(),
            'productos' => Producto::orderBy('nombre')->get(['id', 'nombre'])->toArray(),
        ]);
    }

    /**
     * Reporte de ventas por vendedor y estado de pago
     */
    public function porVendedorEstadoPago(Request $request): Response
    {
        $filtros = $request->validate([
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date'],
            'usuario_id' => ['nullable', 'exists:users,id'],
            'estado_pago' => ['nullable', 'in:PAGADA,PENDIENTE,PARCIAL'],
        ]);

        $fechaInicio = $filtros['fecha_inicio'] ?? now()->subMonth();
        $fechaFin = $filtros['fecha_fin'] ?? now();

        // Obtener datos del reporte
        $ventasPorVendedorEstadoPago = $this->reporteService->obtenerVentasPorVendedorEstadoPago($filtros);

        // Obtener estadísticas generales
        $estadisticas = $this->reporteService->obtenerEstadisticas($filtros);

        return Inertia::render('reportes/ventas/por-vendedor-estado-pago', [
            'ventasPorVendedorEstadoPago' => $ventasPorVendedorEstadoPago,
            'estadisticas' => $estadisticas,
            'filtros' => array_merge($filtros, [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin' => $fechaFin->format('Y-m-d'),
            ]),
            'vendedores' => User::orderBy('name')->get(['id', 'name'])->toArray(),
            'estadosPago' => ['PAGADA', 'PENDIENTE', 'PARCIAL'],
        ]);
    }

    /**
     * Exportar reporte a Excel/PDF
     */
    public function export(Request $request)
    {
        $tipo = $request->string('tipo'); // 'por-periodo', 'por-cliente-producto', 'por-vendedor-estado-pago'
        $formato = $request->string('formato'); // 'excel', 'pdf-a4', 'pdf-80', 'pdf-58'
        $filtros = $request->validate([
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date'],
            'cliente_id' => ['nullable', 'exists:clientes,id'],
            'producto_id' => ['nullable', 'exists:productos,id'],
            'usuario_id' => ['nullable', 'exists:users,id'],
            'estado_pago' => ['nullable', 'in:PAGADA,PENDIENTE,PARCIAL'],
            'granularidad' => ['nullable', 'in:dia,semana,mes,año'],
            'monto_minimo' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Obtener los datos según el tipo de reporte
        $datos = match ($tipo) {
            'por-periodo' => $this->reporteService->obtenerVentasPorPeriodo($filtros),
            'por-cliente-producto' => $this->reporteService->obtenerVentasPorClienteProducto($filtros),
            'por-vendedor-estado-pago' => $this->reporteService->obtenerVentasPorVendedorEstadoPago($filtros),
            default => collect(),
        };

        // Retornar según el formato solicitado
        return match ($formato) {
            'excel' => $this->exportarExcel($tipo, $datos),
            'pdf-a4' => $this->exportarPdfA4($tipo, $datos),
            'pdf-80' => $this->exportarPdf80mm($tipo, $datos),
            'pdf-58' => $this->exportarPdf58mm($tipo, $datos),
            default => response()->json(['error' => 'Formato no válido'], 400),
        };
    }

    /**
     * Exportar a Excel
     */
    private function exportarExcel(string $tipo, $datos)
    {
        $exportClass = match ($tipo) {
            'por-periodo' => \App\Exports\VentasPorPeriodoExport::class,
            'por-cliente-producto' => \App\Exports\VentasPorClienteProductoExport::class,
            'por-vendedor-estado-pago' => \App\Exports\VentasPorVendedorEstadoPagoExport::class,
        };

        $filename = "reporte_ventas_{$tipo}_" . now()->format('Y-m-d_H-i-s') . '.xlsx';

        return \Maatwebsite\Excel\Facades\Excel::download(
            new $exportClass($datos),
            $filename
        );
    }

    /**
     * Exportar a PDF A4
     */
    private function exportarPdfA4(string $tipo, $datos)
    {
        $pdf = \Barryvdh\DomPDF\Facades\Pdf::loadView(
            "pdf.reportes.ventas.ventas-por-{$tipo}-a4",
            ['datos' => $datos]
        )->setPaper('a4', 'portrait');

        $filename = "reporte_ventas_{$tipo}_" . now()->format('Y-m-d_H-i-s') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Exportar a PDF 80mm (thermal)
     */
    private function exportarPdf80mm(string $tipo, $datos)
    {
        $pdf = \Barryvdh\DomPDF\Facades\Pdf::loadView(
            "pdf.reportes.ventas.ventas-por-{$tipo}-80",
            ['datos' => $datos]
        )->setPaper([0, 0, 226.77, 841.89], 'portrait');

        $filename = "reporte_ventas_{$tipo}_80mm_" . now()->format('Y-m-d_H-i-s') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Exportar a PDF 58mm (thermal compact)
     */
    private function exportarPdf58mm(string $tipo, $datos)
    {
        $pdf = \Barryvdh\DomPDF\Facades\Pdf::loadView(
            "pdf.reportes.ventas.ventas-por-{$tipo}-58",
            ['datos' => $datos]
        )->setPaper([0, 0, 164.41, 841.89], 'portrait');

        $filename = "reporte_ventas_{$tipo}_58mm_" . now()->format('Y-m-d_H-i-s') . '.pdf';

        return $pdf->download($filename);
    }
}
