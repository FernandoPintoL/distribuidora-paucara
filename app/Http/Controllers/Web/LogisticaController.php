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
        // Estadísticas de rutas planificadas
        $rutasStats = [
            'planificadas'  => \App\Models\Ruta::where('estado', 'planificada')->whereDate('fecha_ruta', today())->count(),
            'en_progreso'   => \App\Models\Ruta::where('estado', 'en_progreso')->whereDate('fecha_ruta', today())->count(),
            'completadas'   => \App\Models\Ruta::where('estado', 'completada')->whereDate('fecha_ruta', today())->count(),
            'total_distancia' => (float) \App\Models\Ruta::whereDate('fecha_ruta', today())->sum('distancia_km'),
        ];

        // Estadísticas del dashboard - Consistent with API endpoints
        $estadisticas = [
            'proformas_pendientes'  => Proforma::where('estado', 'PENDIENTE')->count(),  // Count ALL pending, not just APP_EXTERNA
            'envios_programados'    => Envio::where('estado', 'PROGRAMADO')->count(),
            'envios_en_transito'    => Envio::where('estado', 'EN_RUTA')->count(),
            'envios_entregados_hoy' => Envio::whereDate('fecha_entrega', today())
                ->where('estado', 'ENTREGADO')
                ->count(),
            'rutas' => $rutasStats,
        ];

        // proformas recientes con paginación y filtros
        // Mostrar TODAS las proformas, no solo APP_EXTERNA
        $query = Proforma::with(['cliente', 'usuarioCreador', 'direccionSolicitada']);

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

        // Envíos activos con paginación (FIXED: was hardcoded limit(10))
        $enviosQuery = Envio::with(['venta.cliente'])
            ->whereIn('estado', ['PROGRAMADO', 'EN_PREPARACION', 'EN_RUTA'])
            ->orderBy('fecha_programada', 'desc');

        // Apply search filter for envios
        if (request()->has('search_envios') && request('search_envios') !== '') {
            $searchEnvios = request('search_envios');
            $enviosQuery->where(function ($q) use ($searchEnvios) {
                $q->where('numero_envio', 'like', "%{$searchEnvios}%")
                  ->orWhereHas('venta.cliente', function ($clienteQuery) use ($searchEnvios) {
                      $clienteQuery->where('nombre', 'like', "%{$searchEnvios}%");
                  });
            });
        }

        // Apply estado filter for envios
        if (request()->has('estado_envios') && request('estado_envios') !== 'TODOS') {
            $enviosQuery->where('estado', request('estado_envios'));
        }

        $enviosPaginados = $enviosQuery->paginate(15, ['*'], 'page_envios'); // Paginate with 15 per page

        $enviosActivos = [
            'data' => $enviosPaginados->map(function ($envio) {
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
            }),
            'current_page' => $enviosPaginados->currentPage(),
            'last_page'    => $enviosPaginados->lastPage(),
            'per_page'     => $enviosPaginados->perPage(),
            'total'        => $enviosPaginados->total(),
            'from'         => $enviosPaginados->firstItem(),
            'to'           => $enviosPaginados->lastItem(),
        ];

        // Rutas del día
        $rutasDelDia = \App\Models\Ruta::with(['localidad', 'chofer.user', 'vehiculo'])
            ->whereDate('fecha_ruta', today())
            ->orderBy('codigo', 'asc')
            ->paginate(10, ['*'], 'page_rutas');

        $rutasData = [
            'data' => $rutasDelDia->map(function ($ruta) {
                return [
                    'id'              => $ruta->id,
                    'codigo'          => $ruta->codigo,
                    'localidad_nombre' => $ruta->localidad->nombre ?? 'N/A',
                    'chofer_nombre'   => $ruta->chofer?->user?->name ?? 'N/A',
                    'vehiculo_placa'  => $ruta->vehiculo?->placa ?? 'N/A',
                    'estado'          => $ruta->estado,
                    'paradas'         => $ruta->cantidad_paradas ?? 0,
                    'distancia_km'    => $ruta->distancia_km ?? 0,
                ];
            }),
            'current_page' => $rutasDelDia->currentPage(),
            'last_page'    => $rutasDelDia->lastPage(),
            'per_page'     => $rutasDelDia->perPage(),
            'total'        => $rutasDelDia->total(),
            'from'         => $rutasDelDia->firstItem(),
            'to'           => $rutasDelDia->lastItem(),
        ];

        return Inertia::render('logistica/dashboard', [
            'estadisticas'       => $estadisticas,
            'proformasRecientes' => $proformasRecientes,
            'enviosActivos'      => $enviosActivos,
            'rutasDelDia'        => $rutasData,
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
