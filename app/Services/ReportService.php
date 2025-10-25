<?php

namespace App\Services;

use App\Exports\EnviosExport;
use App\Exports\EntregasRechazadasExport;
use App\Models\Envio;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;
use PDF;

/**
 * Servicio Centralizado de Reportes
 *
 * Este servicio proporciona una interfaz consistente para generar
 * reportes en diferentes formatos (PDF y Excel) para distintos módulos.
 *
 * Uso:
 * $reportService = app(ReportService::class);
 * return $reportService->exportarEnviosPdf($envios, $filtros);
 */
class ReportService
{
    /**
     * Exportar envíos a PDF
     */
    public function exportarEnviosPdf(Collection $envios, array $filtros = []): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $pdf = PDF::loadView('exports.envios-pdf', [
            'envios' => $envios,
            'fecha_generacion' => now(),
            'filtros' => $filtros,
        ]);

        return $pdf->download('envios_' . now()->format('Y-m-d_His') . '.pdf');
    }

    /**
     * Exportar envíos a Excel
     */
    public function exportarEnviosExcel(Collection $envios): \Illuminate\Http\Response
    {
        return Excel::download(
            new EnviosExport($envios),
            'envios_' . now()->format('Y-m-d_His') . '.xlsx'
        );
    }

    /**
     * Exportar entregas rechazadas a Excel
     */
    public function exportarEntregasRechazadasExcel(Collection $envios): \Illuminate\Http\Response
    {
        return Excel::download(
            new EntregasRechazadasExport($envios),
            'entregas_rechazadas_' . now()->format('Y-m-d_His') . '.xlsx'
        );
    }

    /**
     * Obtener envíos rechazados con filtros opcionales
     */
    public function obtenerEnviosRechazados(array $filtros = []): Collection
    {
        $query = Envio::whereIn('estado_entrega', [
            Envio::ESTADO_ENTREGA_CLIENTE_AUSENTE,
            Envio::ESTADO_ENTREGA_TIENDA_CERRADA,
            Envio::ESTADO_ENTREGA_PROBLEMA,
        ])->with(['venta.cliente', 'chofer', 'vehiculo']);

        // Aplicar filtros si existen
        if (!empty($filtros['fecha_desde'])) {
            $query->whereDate('fecha_intento_entrega', '>=', $filtros['fecha_desde']);
        }

        if (!empty($filtros['fecha_hasta'])) {
            $query->whereDate('fecha_intento_entrega', '<=', $filtros['fecha_hasta']);
        }

        if (!empty($filtros['tipo_rechazo'])) {
            $query->where('estado_entrega', $filtros['tipo_rechazo']);
        }

        if (!empty($filtros['chofer_id'])) {
            $query->where('chofer_id', $filtros['chofer_id']);
        }

        if (!empty($filtros['search'])) {
            $query->where(function ($q) use ($filtros) {
                $q->where('numero_envio', 'like', '%' . $filtros['search'] . '%')
                  ->orWhereHas('venta.cliente', function ($clienteQ) use ($filtros) {
                      $clienteQ->where('nombre', 'like', '%' . $filtros['search'] . '%');
                  });
            });
        }

        return $query->orderBy('fecha_intento_entrega', 'desc')->get();
    }

    /**
     * Obtener estadísticas de entregas rechazadas
     */
    public function estadisticasEntregasRechazadas(): array
    {
        $totalRechazadas = Envio::whereIn('estado_entrega', [
            Envio::ESTADO_ENTREGA_CLIENTE_AUSENTE,
            Envio::ESTADO_ENTREGA_TIENDA_CERRADA,
            Envio::ESTADO_ENTREGA_PROBLEMA,
        ])->count();

        $clienteAusente = Envio::where('estado_entrega', Envio::ESTADO_ENTREGA_CLIENTE_AUSENTE)->count();
        $tiendaCerrada = Envio::where('estado_entrega', Envio::ESTADO_ENTREGA_TIENDA_CERRADA)->count();
        $otroProblema = Envio::where('estado_entrega', Envio::ESTADO_ENTREGA_PROBLEMA)->count();

        $tasaRechazo = Envio::count() > 0
            ? round(($totalRechazadas / Envio::count()) * 100, 2)
            : 0;

        return [
            'total_rechazadas' => $totalRechazadas,
            'cliente_ausente' => $clienteAusente,
            'tienda_cerrada' => $tiendaCerrada,
            'otro_problema' => $otroProblema,
            'tasa_rechazo_porcentaje' => $tasaRechazo,
            'ultimas_24_horas' => Envio::whereIn('estado_entrega', [
                Envio::ESTADO_ENTREGA_CLIENTE_AUSENTE,
                Envio::ESTADO_ENTREGA_TIENDA_CERRADA,
                Envio::ESTADO_ENTREGA_PROBLEMA,
            ])->where('fecha_intento_entrega', '>=', now()->subDay())->count(),
        ];
    }

    /**
     * Obtener envíos agrupados por estado
     */
    public function enviosPorEstado(): array
    {
        return [
            'programados' => Envio::where('estado', Envio::PROGRAMADO)->count(),
            'en_preparacion' => Envio::where('estado', Envio::EN_PREPARACION)->count(),
            'en_ruta' => Envio::where('estado', Envio::EN_RUTA)->count(),
            'entregados' => Envio::where('estado', Envio::ENTREGADO)->count(),
            'rechazados' => Envio::whereNotNull('estado_entrega')->count(),
            'cancelados' => Envio::where('estado', Envio::CANCELADO)->count(),
        ];
    }

    /**
     * Top de choferes con más entregas rechazadas
     */
    public function topChoforesRechazos(int $limite = 5): Collection
    {
        return Envio::select(
            'chofer_id',
            \Illuminate\Support\Facades\DB::raw('COUNT(*) as total_rechazos'),
            \Illuminate\Support\Facades\DB::raw('name as chofer_nombre')
        )
            ->whereIn('estado_entrega', [
                Envio::ESTADO_ENTREGA_CLIENTE_AUSENTE,
                Envio::ESTADO_ENTREGA_TIENDA_CERRADA,
                Envio::ESTADO_ENTREGA_PROBLEMA,
            ])
            ->join('users', 'envios.chofer_id', '=', 'users.id')
            ->groupBy('chofer_id', 'name')
            ->orderBy('total_rechazos', 'desc')
            ->limit($limite)
            ->get();
    }

    /**
     * Generar reporte completo de entregas (estadísticas + datos)
     */
    public function generarReporteCompleto(array $filtros = []): array
    {
        $envios = $this->obtenerEnviosRechazados($filtros);

        return [
            'estadisticas' => $this->estadisticasEntregasRechazadas(),
            'por_estado' => $this->enviosPorEstado(),
            'top_choferes' => $this->topChoforesRechazos(),
            'envios' => $envios,
            'fecha_generacion' => now(),
        ];
    }
}
