<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\Response;
use App\Models\Empresa;

class ImpresionVentasController extends Controller
{
    /**
     * Renderizar reporte de ventas
     */
    public function imprimir(Request $request): View | Response
    {
        try {
            $ventas = collect(session('ventas_impresion', []));
            $filtros = session('ventas_filtros', []);

            // Obtener empresa del usuario autenticado
            $empresa = auth()->user()->empresa ?? Empresa::first();

            \Log::info('🖨️ [ImpresionVentasController] Renderizando reporte', [
                'cantidad_ventas' => $ventas->count(),
                'filtros' => $filtros,
                'empresa_id' => $empresa?->id,
            ]);

            $formato = $request->get('formato', 'A4');
            $accion = $request->get('accion', 'download');

            $vistaMap = [
                'A4' => 'impresion.ventas.hoja-completa-ventas',
                'TICKET_80' => 'impresion.ventas.ticket-80',
                'TICKET_58' => 'impresion.ventas.ticket-58',
            ];

            $vista = $vistaMap[$formato] ?? 'impresion.ventas.hoja-completa-ventas';

            // Renderizar vista
            $html = view($vista, [
                'ventas' => $ventas,
                'filtros' => $filtros,
                'empresa' => $empresa,
            ])->render();

            // Limpiar sesión
            session()->forget(['ventas_impresion', 'ventas_filtros']);

            if ($accion === 'download') {
                return response()->streamDownload(
                    fn () => print($html),
                    'reporte-ventas-' . now()->format('YmdHis') . '.html',
                    ['Content-Type' => 'text/html; charset=utf-8']
                );
            }

            // Retornar HTML para visualización en navegador
            return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);

        } catch (\Exception $e) {
            \Log::error('❌ Error al imprimir ventas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response("Error al generar el reporte: " . $e->getMessage(), 500);
        }
    }
}
