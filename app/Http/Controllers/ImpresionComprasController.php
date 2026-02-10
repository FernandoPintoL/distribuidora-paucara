<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\Response;
use App\Models\Empresa;

class ImpresionComprasController extends Controller
{
    /**
     * Renderizar reporte de compras
     */
    public function imprimir(Request $request): View | Response
    {
        try {
            $compras = collect(session('compras_impresion', []));
            $filtros = session('compras_filtros', []);

            // Obtener empresa del usuario autenticado
            $empresa = auth()->user()->empresa ?? Empresa::first();

            \Log::info('🖨️ [ImpresionComprasController] Renderizando reporte', [
                'cantidad_compras' => $compras->count(),
                'filtros' => $filtros,
                'empresa_id' => $empresa?->id,
            ]);

            $formato = $request->get('formato', 'A4');
            $accion = $request->get('accion', 'download');

            $vistaMap = [
                'A4' => 'impresion.compras.hoja-completa-compras',
                'TICKET_80' => 'impresion.compras.ticket-80',
                'TICKET_58' => 'impresion.compras.ticket-58',
            ];

            $vista = $vistaMap[$formato] ?? 'impresion.compras.hoja-completa-compras';

            // Renderizar vista
            $html = view($vista, [
                'compras' => $compras,
                'filtros' => $filtros,
                'empresa' => $empresa,
            ])->render();

            // Limpiar sesión
            session()->forget(['compras_impresion', 'compras_filtros']);

            if ($accion === 'download') {
                return response()->streamDownload(
                    fn () => print($html),
                    'reporte-compras-' . now()->format('YmdHis') . '.html',
                    ['Content-Type' => 'text/html; charset=utf-8']
                );
            }

            // Retornar HTML para visualización en navegador
            return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);

        } catch (\Exception $e) {
            \Log::error('❌ Error al imprimir compras', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response("Error al generar el reporte: " . $e->getMessage(), 500);
        }
    }
}
