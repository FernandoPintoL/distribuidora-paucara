<?php

namespace App\Http\Controllers;

use App\Models\Proforma;
use App\Models\Venta;
use App\Models\User;
use App\Models\EstadoDocumento;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\DB;

class ReporteVentasController extends Controller
{
    /**
     * Mostrar reporte de productos vendidos
     * GET /ventas/reporte-productos-vendidos
     */
    public function productosVendidos(Request $request): InertiaResponse
    {
        try {
            $user = auth()->user();

            // Validar fechas
            $fechaDesde = $request->filled('fecha_desde') ? $request->date('fecha_desde') : now()->subMonth();
            $fechaHasta = $request->filled('fecha_hasta') ? $request->date('fecha_hasta') : now();

            // Obtener el ID del estado APROBADO
            // ✅ CORREGIDO: La tabla EstadoDocumento solo tiene columna 'codigo', no 'categoria'
            $estadoAprobadoId = EstadoDocumento::where('codigo', 'APROBADO')
                ->value('id');

            // Construir query para obtener productos vendidos
            // ✅ CORREGIDO: La relación es ventas.proforma_id (no proformas.venta_id)
            // ✅ CORREGIDO: La tabla es detalle_proformas (no proforma_detalles)
            $query = DB::table('proformas')
                ->join('ventas', 'ventas.proforma_id', '=', 'proformas.id')
                ->join('detalle_proformas', 'proformas.id', '=', 'detalle_proformas.proforma_id')
                ->join('productos', 'detalle_proformas.producto_id', '=', 'productos.id')
                ->select(
                    'productos.id',
                    'productos.nombre as producto_nombre',
                    'productos.sku as producto_codigo',
                    DB::raw('SUM(CAST(detalle_proformas.cantidad AS DECIMAL(15,2))) as cantidad_total'),
                    DB::raw('AVG(CAST(detalle_proformas.precio_unitario AS DECIMAL(15,2))) as precio_promedio'),
                    DB::raw('SUM(CAST(detalle_proformas.subtotal AS DECIMAL(15,2))) as total_venta'),
                    'proformas.usuario_creador_id'
                )
                ->where('ventas.estado_documento_id', $estadoAprobadoId)
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->whereNotNull('ventas.proforma_id');

            // Filtro por usuario creador
            if ($request->filled('usuario_creador_id')) {
                $query->where('proformas.usuario_creador_id', $request->usuario_creador_id);
            } elseif ($user->hasRole('Preventista')) {
                $query->where('proformas.usuario_creador_id', $user->id);
            }

            // Filtro por cliente
            if ($request->filled('cliente_id')) {
                $query->where('proformas.cliente_id', $request->cliente_id);
            }

            $productos = $query->groupBy('productos.id', 'productos.nombre', 'productos.sku', 'proformas.usuario_creador_id')
                ->orderBy('productos.nombre', 'asc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->producto_nombre,
                        'codigo' => $item->producto_codigo,
                        'cantidad_total' => (float) $item->cantidad_total,
                        'precio_promedio' => (float) $item->precio_promedio,
                        'total_venta' => (float) $item->total_venta,
                        'usuario_creador_id' => $item->usuario_creador_id,
                    ];
                });

            // Calcular totales
            $totales = [
                'cantidad_productos' => $productos->count(),
                'cantidad_total_vendida' => $productos->sum('cantidad_total'),
                'total_venta_general' => $productos->sum('total_venta'),
                'precio_promedio_general' => $productos->count() > 0
                    ? $productos->sum('total_venta') / $productos->sum('cantidad_total')
                    : 0,
            ];

            // Obtener usuarios para el filtro
            $usuarios = User::whereHas('roles', function ($query) {
                $query->where('name', 'preventista');
            })->select('id', 'name', 'email')->get();

            // Obtener clientes para el filtro
            $clientes = \App\Models\Cliente::activos()->select('id', 'nombre', 'email')->get();

            // Obtener las ventas aprobadas que se usaron en el reporte
            $ventasQuery = DB::table('ventas')
                ->join('proformas', 'ventas.proforma_id', '=', 'proformas.id')
                ->join('clientes', 'proformas.cliente_id', '=', 'clientes.id')
                ->join('users', 'proformas.usuario_creador_id', '=', 'users.id')
                ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
                ->leftJoin('entregas', 'ventas.entrega_id', '=', 'entregas.id')
                ->leftJoin('estados_logistica', 'entregas.estado_entrega_id', '=', 'estados_logistica.id')
                ->leftJoin('entregas_venta_confirmaciones', 'ventas.id', '=', 'entregas_venta_confirmaciones.venta_id')
                ->select(
                    'ventas.id as venta_id',
                    'ventas.numero as numero_venta',
                    'proformas.id as proforma_id',
                    'proformas.numero as numero_proforma',
                    'proformas.created_at as fecha_proforma',
                    'clientes.nombre as cliente_nombre',
                    'users.name as usuario_nombre',
                    'ventas.total',
                    'ventas.created_at as fecha_venta',
                    'estados_documento.codigo as estado_codigo',
                    'estados_logistica.codigo as estado_entrega',
                    'entregas_venta_confirmaciones.motivo_rechazo as motivo_entrega',
                    'entregas_venta_confirmaciones.tienda_abierta',
                    'entregas_venta_confirmaciones.cliente_presente',
                    'entregas_venta_confirmaciones.observaciones_logistica',
                    'entregas_venta_confirmaciones.tipo_entrega',
                    'entregas_venta_confirmaciones.tipo_novedad',
                    'entregas_venta_confirmaciones.tuvo_problema',
                    'entregas_venta_confirmaciones.estado_pago',
                    'entregas_venta_confirmaciones.total_dinero_recibido',
                    'entregas_venta_confirmaciones.monto_pendiente',
                    'entregas_venta_confirmaciones.confirmado_en'
                )
                ->where('ventas.estado_documento_id', $estadoAprobadoId)
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->whereNotNull('ventas.proforma_id');

            // Aplicar los mismos filtros a las ventas
            if ($request->filled('usuario_creador_id')) {
                $ventasQuery->where('proformas.usuario_creador_id', $request->usuario_creador_id);
            } elseif ($user->hasRole('Preventista')) {
                $ventasQuery->where('proformas.usuario_creador_id', $user->id);
            }

            if ($request->filled('cliente_id')) {
                $ventasQuery->where('proformas.cliente_id', $request->cliente_id);
            }

            $ventas = $ventasQuery->orderByDesc('ventas.id')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->venta_id,
                        'numero' => $item->numero_venta,
                        'proforma_id' => $item->proforma_id,
                        'proforma_numero' => $item->numero_proforma,
                        'proforma_fecha' => $item->fecha_proforma,
                        'cliente' => $item->cliente_nombre,
                        'usuario' => $item->usuario_nombre,
                        'total' => (float) $item->total,
                        'fecha' => $item->fecha_venta,
                        'estado' => $item->estado_codigo,
                        'estado_entrega' => $item->estado_entrega,
                        'motivo_entrega' => $item->motivo_entrega,
                        'tienda_abierta' => $item->tienda_abierta,
                        'cliente_presente' => $item->cliente_presente,
                        'observaciones_logistica' => $item->observaciones_logistica,
                        'tipo_entrega' => $item->tipo_entrega,
                        'tipo_novedad' => $item->tipo_novedad,
                        'tuvo_problema' => $item->tuvo_problema,
                        'estado_pago' => $item->estado_pago,
                        'total_dinero_recibido' => (float) ($item->total_dinero_recibido ?? 0),
                        'monto_pendiente' => (float) ($item->monto_pendiente ?? 0),
                        'confirmado_en' => $item->confirmado_en,
                    ];
                });

            $filtros = [
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
                'usuario_creador_id' => $request->input('usuario_creador_id'),
                'cliente_id' => $request->input('cliente_id'),
            ];

            return Inertia::render('ventas/reporte-productos-vendidos', [
                'productos' => $productos,
                'totales' => $totales,
                'ventas' => $ventas,
                'filtros' => $filtros,
                'usuarios' => $usuarios,
                'clientes' => $clientes,
                'fecha_desde' => $fechaDesde->format('Y-m-d'),
                'fecha_hasta' => $fechaHasta->format('Y-m-d'),
                'es_preventista' => $user->hasRole('Preventista'),
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en ReporteVentasController::productosVendidos', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Inertia::render('ventas/reporte-productos-vendidos', [
                'productos' => [],
                'totales' => [
                    'cantidad_productos' => 0,
                    'cantidad_total_vendida' => 0,
                    'total_venta_general' => 0,
                ],
                'ventas' => [],
                'filtros' => [],
                'usuarios' => [],
                'clientes' => [],
                'error' => 'Error al generar reporte: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Imprimir reporte de productos vendidos
     * GET /ventas/reporte-productos-vendidos/imprimir
     */
    public function imprimirReporte(Request $request)
    {
        try {
            $user = auth()->user();
            $formato = $request->input('formato', 'A4');
            $accion = $request->input('accion', 'stream');

            // Validar fechas
            $fechaDesde = $request->filled('fecha_desde') ? $request->date('fecha_desde') : now()->subMonth();
            $fechaHasta = $request->filled('fecha_hasta') ? $request->date('fecha_hasta') : now();

            // Obtener el ID del estado APROBADO
            $estadoAprobadoId = EstadoDocumento::where('codigo', 'APROBADO')->value('id');

            // Construir query para obtener productos vendidos (igual al método anterior)
            $query = DB::table('proformas')
                ->join('ventas', 'ventas.proforma_id', '=', 'proformas.id')
                ->join('detalle_proformas', 'proformas.id', '=', 'detalle_proformas.proforma_id')
                ->join('productos', 'detalle_proformas.producto_id', '=', 'productos.id')
                ->select(
                    'productos.id',
                    'productos.nombre as producto_nombre',
                    'productos.sku as producto_codigo',
                    DB::raw('SUM(CAST(detalle_proformas.cantidad AS DECIMAL(15,2))) as cantidad_total'),
                    DB::raw('AVG(CAST(detalle_proformas.precio_unitario AS DECIMAL(15,2))) as precio_promedio'),
                    DB::raw('SUM(CAST(detalle_proformas.subtotal AS DECIMAL(15,2))) as total_venta'),
                    'proformas.usuario_creador_id'
                )
                ->where('ventas.estado_documento_id', $estadoAprobadoId)
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->whereNotNull('ventas.proforma_id');

            // Filtro por usuario creador
            if ($request->filled('usuario_creador_id')) {
                $query->where('proformas.usuario_creador_id', $request->usuario_creador_id);
            } elseif ($user->hasRole('Preventista')) {
                $query->where('proformas.usuario_creador_id', $user->id);
            }

            // Filtro por cliente
            if ($request->filled('cliente_id')) {
                $query->where('proformas.cliente_id', $request->cliente_id);
            }

            $productos = $query->groupBy('productos.id', 'productos.nombre', 'productos.sku', 'proformas.usuario_creador_id')
                ->orderBy('productos.nombre', 'asc')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->producto_nombre,
                        'codigo' => $item->producto_codigo,
                        'cantidad_total' => (float) $item->cantidad_total,
                        'precio_promedio' => (float) $item->precio_promedio,
                        'total_venta' => (float) $item->total_venta,
                        'usuario_creador_id' => $item->usuario_creador_id,
                    ];
                });

            // Calcular totales
            $totales = [
                'cantidad_productos' => $productos->count(),
                'cantidad_total_vendida' => $productos->sum('cantidad_total'),
                'total_venta_general' => $productos->sum('total_venta'),
                'precio_promedio_general' => $productos->count() > 0
                    ? $productos->sum('total_venta') / $productos->sum('cantidad_total')
                    : 0,
            ];

            // Obtener las ventas aprobadas que se usaron en el reporte
            $ventasQuery = DB::table('ventas')
                ->join('proformas', 'ventas.proforma_id', '=', 'proformas.id')
                ->join('clientes', 'proformas.cliente_id', '=', 'clientes.id')
                ->join('users', 'proformas.usuario_creador_id', '=', 'users.id')
                ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
                ->leftJoin('entregas', 'ventas.entrega_id', '=', 'entregas.id')
                ->leftJoin('estados_logistica', 'entregas.estado_entrega_id', '=', 'estados_logistica.id')
                ->leftJoin('entregas_venta_confirmaciones', 'ventas.id', '=', 'entregas_venta_confirmaciones.venta_id')
                ->select(
                    'ventas.id as venta_id',
                    'ventas.numero as numero_venta',
                    'proformas.id as proforma_id',
                    'proformas.numero as numero_proforma',
                    'proformas.created_at as fecha_proforma',
                    'clientes.nombre as cliente_nombre',
                    'users.name as usuario_nombre',
                    'ventas.total',
                    'ventas.created_at as fecha_venta',
                    'estados_documento.codigo as estado_codigo',
                    'estados_logistica.codigo as estado_entrega',
                    'entregas_venta_confirmaciones.motivo_rechazo as motivo_entrega',
                    'entregas_venta_confirmaciones.tienda_abierta',
                    'entregas_venta_confirmaciones.cliente_presente',
                    'entregas_venta_confirmaciones.observaciones_logistica',
                    'entregas_venta_confirmaciones.tipo_entrega',
                    'entregas_venta_confirmaciones.tipo_novedad',
                    'entregas_venta_confirmaciones.tuvo_problema',
                    'entregas_venta_confirmaciones.estado_pago',
                    'entregas_venta_confirmaciones.total_dinero_recibido',
                    'entregas_venta_confirmaciones.monto_pendiente',
                    'entregas_venta_confirmaciones.confirmado_en'
                )
                ->where('ventas.estado_documento_id', $estadoAprobadoId)
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->whereNotNull('ventas.proforma_id');

            // Aplicar los mismos filtros a las ventas
            if ($request->filled('usuario_creador_id')) {
                $ventasQuery->where('proformas.usuario_creador_id', $request->usuario_creador_id);
            } elseif ($user->hasRole('Preventista')) {
                $ventasQuery->where('proformas.usuario_creador_id', $user->id);
            }

            if ($request->filled('cliente_id')) {
                $ventasQuery->where('proformas.cliente_id', $request->cliente_id);
            }

            $ventas = $ventasQuery->orderByDesc('ventas.id')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->venta_id,
                        'numero' => $item->numero_venta,
                        'proforma_numero' => $item->numero_proforma,
                        'proforma_fecha' => $item->fecha_proforma,
                        'cliente' => $item->cliente_nombre,
                        'usuario' => $item->usuario_nombre,
                        'total' => (float) $item->total,
                        'fecha' => $item->fecha_venta,
                        'estado' => $item->estado_codigo,
                        'estado_entrega' => $item->estado_entrega,
                        'motivo_entrega' => $item->motivo_entrega,
                        'tienda_abierta' => $item->tienda_abierta,
                        'cliente_presente' => $item->cliente_presente,
                        'observaciones_logistica' => $item->observaciones_logistica,
                        'tipo_entrega' => $item->tipo_entrega,
                        'tipo_novedad' => $item->tipo_novedad,
                        'tuvo_problema' => $item->tuvo_problema,
                        'estado_pago' => $item->estado_pago,
                        'total_dinero_recibido' => (float) ($item->total_dinero_recibido ?? 0),
                        'monto_pendiente' => (float) ($item->monto_pendiente ?? 0),
                        'confirmado_en' => $item->confirmado_en,
                    ];
                })
                ->sortBy('id')
                ->values();

            // Obtener información del usuario si está filtrado
            $usuarioNombre = null;
            if ($request->filled('usuario_creador_id')) {
                $usuarioNombre = User::find($request->usuario_creador_id)?->name;
            }

            // Renderizar vista HTML
            $html = view('reportes.reporte-productos-vendidos-print', [
                'productos' => $productos,
                'ventas' => $ventas,
                'totales' => $totales,
                'fechaDesde' => $fechaDesde->format('d/m/Y'),
                'fechaHasta' => $fechaHasta->format('d/m/Y'),
                'usuarioNombre' => $usuarioNombre,
                'formato' => $formato,
            ])->render();

            // Generar PDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)
                ->setPaper($formato === 'TICKET_80' ? array(0, 0, 226, 999999) : 'A4', 'portrait');

            // Retornar según la acción
            if ($accion === 'download') {
                return $pdf->download('reporte-productos-vendidos-' . now()->format('Y-m-d-H-i-s') . '.pdf');
            } else {
                return $pdf->stream();
            }

        } catch (\Exception $e) {
            \Log::error('Error en ReporteVentasController::imprimirReporte', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Error al generar reporte: ' . $e->getMessage()], 500);
        }
    }
}
