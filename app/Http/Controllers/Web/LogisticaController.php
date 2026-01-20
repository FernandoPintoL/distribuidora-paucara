<?php
namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Entrega;
use App\Models\Proforma;
use App\Models\Localidad;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LogisticaController extends Controller
{
    /**
     * Dashboard principal de logística
     */
    public function dashboard()
    {

        // proformas recientes con paginación y filtros
        // Mostrar TODAS las proformas, no solo APP_EXTERNA
        $query = Proforma::with(['cliente.localidad', 'usuarioCreador', 'estadoLogistica', 'direccionSolicitada']);

        // Aplicar filtros desde query params
        if (request()->has('estado') && request('estado') !== 'TODOS') {
            // Mapear código de estado a ID
            $estadoCodigo = request('estado');
            $estadoId     = Proforma::obtenerIdEstado($estadoCodigo, 'proforma');
            if ($estadoId) {
                $query->where('estado_proforma_id', $estadoId);
            }
        }

        // ✅ Búsqueda case-insensitive: número, cliente, CI, teléfono, código_cliente, preventista
        if (request()->has('search') && request('search') !== '') {
            $search = strtolower(request('search'));
            $query->where(function ($q) use ($search) {
                // Búsqueda en número de proforma
                $q->whereRaw('LOWER(numero) like ?', ["%{$search}%"])
                    // Búsqueda en cliente (nombre, CI, teléfono, código_cliente)
                    ->orWhereHas('cliente', function ($clienteQuery) use ($search) {
                        $clienteQuery->where(function ($innerQuery) use ($search) {
                            $innerQuery->whereRaw('LOWER(nombre) like ?', ["%{$search}%"])
                                ->orWhereRaw('LOWER(ci) like ?', ["%{$search}%"])
                                ->orWhereRaw('LOWER(telefono) like ?', ["%{$search}%"])
                                ->orWhereRaw('LOWER(codigo_cliente) like ?', ["%{$search}%"]);
                        });
                    })
                    // Búsqueda en preventista (usuario que creó la proforma)
                    ->orWhereHas('usuarioCreador', function ($preventistaQuery) use ($search) {
                        $preventistaQuery->whereRaw('LOWER(name) like ?', ["%{$search}%"]);
                    });
            });
        }

        // ✅ Filtro por localidad
        if (request()->has('localidad_id') && request('localidad_id') !== '' && request('localidad_id') !== '0') {
            $localidadId = request('localidad_id');
            $query->whereHas('cliente', function ($clienteQuery) use ($localidadId) {
                $clienteQuery->where('localidad_id', $localidadId);
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
            'data'         => $proformasPaginated->map(function ($proforma) {
                return [
                    'id'                              => $proforma->id,
                    'numero'                          => $proforma->numero,
                    'cliente_nombre'                  => $proforma->cliente->nombre ?? 'N/A',
                    'localidad_id'                    => $proforma->cliente->localidad_id,
                    'localidad_nombre'                => $proforma->cliente->localidad->nombre ?? 'N/A',
                    'total'                           => $proforma->subtotal,
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

        // ✅ Obtener lista de localidades para el filtro
        $localidades = Localidad::select('id', 'nombre')
            ->orderBy('nombre', 'asc')
            ->get()
            ->map(function ($localidad) {
                return [
                    'id'   => $localidad->id,
                    'nombre' => $localidad->nombre,
                ];
            });

        return Inertia::render('logistica/dashboard', [
            'proformasRecientes' => $proformasRecientes,
            'localidades'        => $localidades,
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
        $cliente      = $primeraVenta?->cliente;

        $entregaData = [
            'id'                    => $entrega->id,
            'numero_referencia'     => $primeraVenta?->numero ?? 'N/A',
            'estado'                => $entrega->estado,
            'fecha_programada'      => $entrega->fecha_programada?->format('Y-m-d H:i'),
            'fecha_entrega'         => $entrega->fecha_entrega?->format('Y-m-d H:i'),
            'cliente_nombre'        => $cliente?->nombre ?? 'N/A',
            'historial_ubicaciones' => $entrega->ubicacionesTracking->map(function ($item) {
                return [
                    'fecha'     => $item->created_at->format('Y-m-d H:i'),
                    'latitud'   => $item->latitud,
                    'longitud'  => $item->longitud,
                    'precicion' => $item->presicion,
                ];
            }),
        ];

        return Inertia::render('logistica/seguimiento', [
            'entrega' => $entregaData,
        ]);
    }
}
