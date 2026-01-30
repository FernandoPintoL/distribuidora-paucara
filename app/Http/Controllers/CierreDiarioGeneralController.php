<?php

namespace App\Http\Controllers;

use App\Models\CierreDiarioGeneral;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CierreDiarioGeneralController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:cajas.index');
    }

    /**
     * Mostrar historial de cierres diarios generales
     * GET /cajas/admin/reportes-diarios
     */
    public function index(Request $request)
    {
        $query = CierreDiarioGeneral::with(['usuario'])
            ->recientes();

        // Filtro por fecha
        if ($request->filled('fecha')) {
            $query->porFecha($request->fecha);
        }

        // Filtro por rango de fechas
        if ($request->filled('desde') && $request->filled('hasta')) {
            $query->entreFechas(
                $request->desde . ' 00:00:00',
                $request->hasta . ' 23:59:59'
            );
        }

        // Filtro por usuario
        if ($request->filled('usuario_id')) {
            $query->porUsuario($request->usuario_id);
        }

        // Filtro por discrepancias
        if ($request->boolean('solo_discrepancias')) {
            $query->conDiscrepancias();
        }

        $cierres = $query->paginate(20);

        // Estadísticas generales
        $estadisticas = [
            'total_cierres' => CierreDiarioGeneral::count(),
            'total_cajas_cerradas' => CierreDiarioGeneral::sum('total_cajas_cerradas'),
            'total_monto_procesado' => CierreDiarioGeneral::sum('total_monto_real'),
            'cierres_con_discrepancias' => CierreDiarioGeneral::where('total_cajas_con_discrepancia', '>', 0)->count(),
        ];

        // Usuarios disponibles para filtro
        $usuarios = \App\Models\User::whereHas('cajas')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Cajas/ReportesDiarios', [
            'cierres' => $cierres,
            'estadisticas' => $estadisticas,
            'usuarios' => $usuarios,
            'filtros' => [
                'fecha' => $request->fecha,
                'desde' => $request->desde,
                'hasta' => $request->hasta,
                'usuario_id' => $request->usuario_id,
                'solo_discrepancias' => $request->boolean('solo_discrepancias'),
            ],
        ]);
    }

    /**
     * Ver detalles completos de un cierre diario
     * GET /cajas/admin/reportes-diarios/{id}
     */
    public function show(CierreDiarioGeneral $cierreDiarioGeneral)
    {
        $cierreDiarioGeneral->load(['usuario']);

        return Inertia::render('Cajas/ReportesDiariosDetalle', [
            'cierre' => $cierreDiarioGeneral,
            'resumen' => $cierreDiarioGeneral->obtenerResumen(),
        ]);
    }

    /**
     * Descargar PDF del resumen diario
     * GET /cajas/admin/reportes-diarios/{id}/descargar?formato=A4|TICKET_58|TICKET_80
     */
    public function descargar(CierreDiarioGeneral $cierreDiarioGeneral, Request $request)
    {
        $formato = $request->query('formato', 'A4');
        $accion = $request->query('accion', 'download');
        $fuente = $request->query('fuente', 'consolas');

        $cierreDiarioGeneral->load(['usuario']);

        // Preparar datos para el servicio
        $datos = [
            'cierre' => $cierreDiarioGeneral,
            'resumen' => $cierreDiarioGeneral->obtenerResumen(),
            'cajas_procesadas' => $cierreDiarioGeneral->detalle_cajas ?? [],
        ];

        // Usar ImpresionService para generar el PDF
        $impresionService = app(\App\Services\ImpresionService::class);
        $pdf = $impresionService->generarPDF('cierre_diario_general', $datos, $formato, ['fuente' => $fuente]);

        $nombreArchivo = 'cierre-diario-' . $cierreDiarioGeneral->fecha_ejecucion->format('Y-m-d-His') . '.pdf';

        if ($accion === 'stream') {
            return $pdf->stream($nombreArchivo);
        }

        return $pdf->download($nombreArchivo);
    }

}
