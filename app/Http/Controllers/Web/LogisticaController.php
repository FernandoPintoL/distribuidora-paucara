<?php
namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Entrega;
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
            'proformas_pendientes'  => Proforma::where('estado_proforma_id', 1)->count(),  // ID 1 = PENDIENTE
            'entregas_programadas'    => Entrega::where('estado', 'PROGRAMADO')->count(),
            'entregas_en_transito'    => Entrega::where('estado', 'EN_CAMINO')->count(),
            'entregas_entregadas_hoy' => Entrega::whereDate('fecha_entrega', today())
                ->where('estado', 'ENTREGADO')
                ->count(),
            'rutas' => $rutasStats,
        ];

        // proformas recientes con paginación y filtros
        // Mostrar TODAS las proformas, no solo APP_EXTERNA
        $query = Proforma::with(['cliente', 'usuarioCreador', 'estadoLogistica', 'direccionSolicitada']);

        // Aplicar filtros desde query params
        if (request()->has('estado') && request('estado') !== 'TODOS') {
            // Mapear código de estado a ID
            $estadoCodigo = request('estado');
            $estadoId = Proforma::obtenerIdEstado($estadoCodigo, 'proforma');
            if ($estadoId) {
                $query->where('estado_proforma_id', $estadoId);
            }
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
            // ID 3 = RECHAZADA, ID 4 = CONVERTIDA
            $query->where('fecha_vencimiento', '<', now())
                  ->whereNotIn('estado_proforma_id', [3, 4]);
        }

        $proformasPaginated = $query->orderBy('id', 'desc')
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

        // Entregas activas con paginación
        $entregasQuery = Entrega::with(['ventas.cliente'])
            ->whereIn('estado', ['PROGRAMADO', 'ASIGNADA', 'EN_CAMINO'])
            ->orderBy('fecha_programada', 'desc');

        // Apply search filter for entregas
        if (request()->has('search_entregas') && request('search_entregas') !== '') {
            $searchEntregas = request('search_entregas');
            $entregasQuery->where(function ($q) use ($searchEntregas) {
                $q->orWhereHas('ventas.cliente', function ($clienteQuery) use ($searchEntregas) {
                    $clienteQuery->where('nombre', 'like', "%{$searchEntregas}%");
                })->orWhereHas('proforma.cliente', function ($clienteQuery) use ($searchEntregas) {
                    $clienteQuery->where('nombre', 'like', "%{$searchEntregas}%");
                });
            });
        }

        // Apply estado filter for entregas
        if (request()->has('estado_entregas') && request('estado_entregas') !== 'TODOS') {
            $entregasQuery->where('estado', request('estado_entregas'));
        }

        $entregasPaginadas = $entregasQuery->paginate(15, ['*'], 'page_entregas'); // Paginate with 15 per page

        $entregasActivas = [
            'data' => $entregasPaginadas->map(function ($entrega) {
                $primeraVenta = $entrega->ventas?->first();
                $cliente = $primeraVenta?->cliente;
                return [
                    'id'                 => $entrega->id,
                    'numero_referencia'  => $primeraVenta?->numero ?? 'N/A',
                    'cliente_nombre'     => $cliente?->nombre ?? 'N/A',
                    'estado'             => $entrega->estado,
                    'fecha_programada'   => $entrega->fecha_programada,
                    'fecha_entrega'      => $entrega->fecha_entrega,
                ];
            }),
            'current_page' => $entregasPaginadas->currentPage(),
            'last_page'    => $entregasPaginadas->lastPage(),
            'per_page'     => $entregasPaginadas->perPage(),
            'total'        => $entregasPaginadas->total(),
            'from'         => $entregasPaginadas->firstItem(),
            'to'           => $entregasPaginadas->lastItem(),
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
            'entregasActivas'    => $entregasActivas,
            'rutasDelDia'        => $rutasData,
        ]);
    }

    /**
     * Página de seguimiento de entrega (DEPRECATED)
     * Esta ruta sigue existiendo para compatibilidad pero debería usar /logistica/entregas/{id} en su lugar
     */
    public function seguimiento(Entrega $entrega)
    {
        $entrega->load(['ventas.cliente', 'ubicacionesTracking' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]);

        $primeraVenta = $entrega->ventas?->first();
        $cliente = $primeraVenta?->cliente;

        $entregaData = [
            'id'                    => $entrega->id,
            'numero_referencia'     => $primeraVenta?->numero ?? 'N/A',
            'estado'                => $entrega->estado,
            'fecha_programada'      => $entrega->fecha_programada?->format('Y-m-d H:i'),
            'fecha_entrega'         => $entrega->fecha_entrega?->format('Y-m-d H:i'),
            'cliente_nombre'        => $cliente?->nombre ?? 'N/A',
            'historial_ubicaciones' => $entrega->ubicacionesTracking->map(function ($item) {
                return [
                    'fecha'       => $item->created_at->format('Y-m-d H:i'),
                    'latitud'     => $item->latitud,
                    'longitud'    => $item->longitud,
                    'precicion'   => $item->presicion,
                ];
            }),
        ];

        return Inertia::render('logistica/seguimiento', [
            'entrega' => $entregaData,
        ]);
    }
}
