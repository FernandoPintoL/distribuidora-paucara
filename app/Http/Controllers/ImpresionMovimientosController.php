<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ImpresionMovimientosController extends Controller
{
    /**
     * Imprimir listado de movimientos de inventario en diferentes formatos (PDF)
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function imprimir(Request $request)
    {
        try {
            // Aumentar límite de memoria para DomPDF
            // PHP restaura automáticamente después de la request
            ini_set('memory_limit', '3072M');

            // Obtener datos de movimientos de la sesión
            $movimientos = session('movimientos_impresion', []);
            $filtros = session('movimientos_filtros', []);

            // Convertir a Collection
            $movimientos = collect($movimientos);

            // Obtener empresa del usuario autenticado
            $empresa = auth()->user()->empresa ?? Empresa::first();

            \Log::info('🖨️ [ImpresionMovimientosController::imprimir] Generando reporte de movimientos', [
                'cantidad_movimientos' => $movimientos->count(),
                'filtros' => $filtros,
                'empresa_id' => $empresa?->id,
                'memory_limit_actual' => ini_get('memory_limit'),
            ]);

            // Obtener formato solicitado
            $formato = $request->get('formato', 'A4');
            $accion = $request->get('accion', 'download');

            // Mapear formato a vista
            $vistaMap = [
                'A4'        => 'impresion.movimientos.hoja-completa',
                'TICKET_80' => 'impresion.movimientos.ticket-80',
                'TICKET_58' => 'impresion.movimientos.ticket-58',
            ];

            $vista = $vistaMap[$formato] ?? 'impresion.movimientos.hoja-completa';

            // Datos para la vista
            $datos = [
                'movimientos'      => $movimientos,
                'filtros'          => $filtros,
                'empresa'          => $empresa,
                'fecha_impresion'  => now(),
                'usuario'          => auth()->user()->name ?? null,
            ];

            // Limpiar sesión después de usar los datos
            session()->forget(['movimientos_impresion', 'movimientos_filtros']);

            // Renderizar vista HTML
            $html = view($vista, $datos)->render();

            // Convertir HTML a PDF usando DomPDF con opciones optimizadas
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            $pdf->getDomPDF()->setBasePath(public_path());

            // Optimizaciones para memoria
            $dompdf = $pdf->getDomPDF();
            $options = $dompdf->getOptions();
            $options->setChroot(public_path());
            $options->setLogOutputFile(storage_path('logs/dompdf.log'));

            $nombreArchivo = 'reporte-movimientos-' . now()->format('YmdHis') . '.pdf';

            // Si es stream, mostrar en navegador; si es download, forzar descarga
            if ($accion === 'stream') {
                return $pdf->stream($nombreArchivo);
            } else {
                return $pdf->download($nombreArchivo);
            }

        } catch (\Exception $e) {
            \Log::error('❌ Error al imprimir reporte de movimientos', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response("Error al generar el reporte: " . $e->getMessage(), 500);
        }
    }

    /**
     * Vista previa del listado de movimientos
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function preview(Request $request)
    {
        $request->merge(['accion' => 'stream']);
        return $this->imprimir($request);
    }
}
