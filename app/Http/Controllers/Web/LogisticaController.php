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
            'proformas_pendientes' => Proforma::where('estado', 'PENDIENTE')
                ->where('canal_origen', 'APP_EXTERNA')
                ->count(),
            'envios_en_transito' => Envio::where('estado', 'EN_TRANSITO')->count(),
            'envios_entregados_hoy' => Envio::whereDate('fecha_entrega_real', today())
                ->where('estado', 'ENTREGADO')
                ->count(),
            'total_envios_mes' => Envio::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        // Proformas recientes de app externa
        $proformasRecientes = Proforma::with(['cliente', 'usuarioCreador'])
            ->where('canal_origen', 'APP_EXTERNA')
            ->where('estado', 'PENDIENTE')
            ->orderBy('fecha', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($proforma) {
                return [
                    'id' => $proforma->id,
                    'numero' => $proforma->numero,
                    'cliente_nombre' => $proforma->cliente->nombre ?? 'N/A',
                    'total' => $proforma->total,
                    'fecha' => $proforma->fecha,
                    'estado' => $proforma->estado,
                    'canal_origen' => $proforma->canal_origen,
                    'usuario_creador_nombre' => $proforma->usuarioCreador->name ?? 'Sistema',
                ];
            });

        // Envíos activos
        $enviosActivos = Envio::with(['venta.cliente'])
            ->whereIn('estado', ['PENDIENTE', 'EN_TRANSITO'])
            ->orderBy('fecha_envio', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($envio) {
                return [
                    'id' => $envio->id,
                    'numero_seguimiento' => $envio->numero_seguimiento,
                    'cliente_nombre' => $envio->venta->cliente->nombre ?? 'N/A',
                    'estado' => $envio->estado,
                    'fecha_envio' => $envio->fecha_envio,
                    'fecha_entrega_estimada' => $envio->fecha_entrega_estimada,
                    'direccion_entrega' => $envio->direccion_entrega,
                ];
            });

        return Inertia::render('logistica/dashboard', [
            'estadisticas' => $estadisticas,
            'proformasRecientes' => $proformasRecientes,
            'enviosActivos' => $enviosActivos,
        ]);
    }

    /**
     * Página de seguimiento de envío
     */
    public function seguimiento(Envio $envio)
    {
        $envio->load(['venta.cliente', 'historialSeguimiento' => function ($query) {
            $query->orderBy('fecha', 'desc');
        }]);

        $envioData = [
            'id' => $envio->id,
            'numero_seguimiento' => $envio->numero_seguimiento,
            'estado' => $envio->estado,
            'fecha_envio' => $envio->fecha_envio?->format('Y-m-d H:i'),
            'fecha_entrega_estimada' => $envio->fecha_entrega_estimada?->format('Y-m-d H:i'),
            'direccion_entrega' => $envio->direccion_entrega,
            'cliente_nombre' => $envio->venta->cliente->nombre ?? 'N/A',
            'ubicacion_actual' => $envio->ubicacion_actual ? [
                'latitud' => $envio->latitud_actual,
                'longitud' => $envio->longitud_actual,
                'direccion' => $envio->ubicacion_actual,
            ] : null,
            'historial_seguimiento' => $envio->historialSeguimiento->map(function ($item) {
                return [
                    'estado' => $item->estado,
                    'fecha' => $item->fecha->format('Y-m-d H:i'),
                    'descripcion' => $item->descripcion,
                    'ubicacion' => $item->ubicacion,
                ];
            }),
        ];

        return Inertia::render('logistica/seguimiento', [
            'envio' => $envioData,
        ]);
    }
}
