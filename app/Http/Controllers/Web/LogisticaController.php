<?php
namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Envio;
use App\Models\Proforma;
use Inertia\Inertia;

class LogisticaController extends Controller
{
    /**
     * Dashboard principal de logística
     */
    public function dashboard()
    {
        // Estadísticas del dashboard
        $estadisticas = [
            'proformas_pendientes'  => Proforma::where('estado', 'PENDIENTE')
                ->where('canal_origen', 'APP_EXTERNA')
                ->count(),
            'envios_programados'    => Envio::where('estado', 'PROGRAMADO')->count(),
            'envios_en_transito'    => Envio::where('estado', 'EN_RUTA')->count(),
            'envios_entregados_hoy' => Envio::whereDate('fecha_entrega', today())
                ->where('estado', 'ENTREGADO')
                ->count(),
        ];

        // Proformas recientes de app externa con paginación y filtros
        $query = Proforma::with(['cliente', 'usuarioCreador', 'direccionSolicitada'])
            ->where('canal_origen', 'APP_EXTERNA');

        // Aplicar filtros desde query params
        if (request()->has('estado') && request('estado') !== 'TODOS') {
            $query->where('estado', request('estado'));
        }

        if (request()->has('search') && request('search') !== '') {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhereHas('cliente', function ($clienteQuery) use ($search) {
                      $clienteQuery->where('nombre', 'like', "%{$search}%");
                  });
            });
        }

        if (request()->has('solo_vencidas') && request('solo_vencidas') === 'true') {
            $query->where('fecha_vencimiento', '<', now())
                  ->whereNotIn('estado', ['RECHAZADA', 'CONVERTIDA']);
        }

        $proformasPaginated = $query->orderBy('fecha', 'desc')
            ->paginate(15); // 15 por página

        $proformasRecientes = [
            'data' => $proformasPaginated->map(function ($proforma) {
                return [
                    'id'                              => $proforma->id,
                    'numero'                          => $proforma->numero,
                    'cliente_nombre'                  => $proforma->cliente->nombre ?? 'N/A',
                    'total'                           => $proforma->total,
                    'fecha'                           => $proforma->fecha,
                    'estado'                          => $proforma->estado,
                    'canal_origen'                    => $proforma->canal_origen,
                    'usuario_creador_nombre'          => $proforma->usuarioCreador->name ?? 'Sistema',
                    'fecha_vencimiento'               => $proforma->fecha_vencimiento,
                    // Datos de solicitud
                    'fecha_entrega_solicitada'        => $proforma->fecha_entrega_solicitada,
                    'hora_entrega_solicitada'         => $proforma->hora_entrega_solicitada,
                    'direccion_entrega_solicitada_id' => $proforma->direccion_entrega_solicitada_id,
                    'direccionSolicitada'             => $proforma->direccionSolicitada ? [
                        'id'         => $proforma->direccionSolicitada->id,
                        'direccion'  => $proforma->direccionSolicitada->direccion,
                        'latitud'    => $proforma->direccionSolicitada->latitud,
                        'longitud'   => $proforma->direccionSolicitada->longitud,
                        'referencia' => $proforma->direccionSolicitada->referencia,
                    ] : null,
                ];
            }),
            'current_page' => $proformasPaginated->currentPage(),
            'last_page'    => $proformasPaginated->lastPage(),
            'per_page'     => $proformasPaginated->perPage(),
            'total'        => $proformasPaginated->total(),
            'from'         => $proformasPaginated->firstItem(),
            'to'           => $proformasPaginated->lastItem(),
        ];

        // Envíos activos
        $enviosActivos = Envio::with(['venta.cliente'])
            ->whereIn('estado', ['PROGRAMADO', 'EN_PREPARACION', 'EN_RUTA'])
            ->orderBy('fecha_programada', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($envio) {
                return [
                    'id'                 => $envio->id,
                    'numero_seguimiento' => $envio->numero_envio,
                    'cliente_nombre'     => $envio->venta->cliente->nombre ?? 'N/A',
                    'estado'             => $envio->estado,
                    'fecha_programada'   => $envio->fecha_programada,
                    'fecha_salida'       => $envio->fecha_salida,
                    'fecha_entrega'      => $envio->fecha_entrega,
                    'direccion_entrega'  => $envio->direccion_entrega,
                ];
            });

        return Inertia::render('logistica/dashboard', [
            'estadisticas'       => $estadisticas,
            'proformasRecientes' => $proformasRecientes,
            'enviosActivos'      => $enviosActivos,
        ]);
    }

    /**
     * Página de seguimiento de envío
     */
    public function seguimiento(Envio $envio)
    {
        $envio->load(['venta.cliente', 'seguimientos' => function ($query) {
            $query->orderBy('fecha_hora', 'desc');
        }]);

        $envioData = [
            'id'                    => $envio->id,
            'numero_seguimiento'    => $envio->numero_envio,
            'estado'                => $envio->estado,
            'fecha_programada'      => $envio->fecha_programada?->format('Y-m-d H:i'),
            'fecha_salida'          => $envio->fecha_salida?->format('Y-m-d H:i'),
            'fecha_entrega'         => $envio->fecha_entrega?->format('Y-m-d H:i'),
            'direccion_entrega'     => $envio->direccion_entrega,
            'cliente_nombre'        => $envio->venta->cliente->nombre ?? 'N/A',
            'ubicacion_actual'      => ($envio->coordenadas_lat && $envio->coordenadas_lng) ? [
                'latitud'   => $envio->coordenadas_lat,
                'longitud'  => $envio->coordenadas_lng,
                'direccion' => $envio->direccion_entrega,
            ] : null,
            'historial_seguimiento' => $envio->seguimientos->map(function ($item) {
                return [
                    'estado'      => $item->estado,
                    'fecha'       => $item->fecha_hora->format('Y-m-d H:i'),
                    'descripcion' => $item->observaciones ?? '',
                    'ubicacion'   => ($item->coordenadas_lat && $item->coordenadas_lng)
                        ? "Lat: {$item->coordenadas_lat}, Lng: {$item->coordenadas_lng}"
                        : '',
                ];
            }),
        ];

        return Inertia::render('logistica/seguimiento', [
            'envio' => $envioData,
        ]);
    }
}
