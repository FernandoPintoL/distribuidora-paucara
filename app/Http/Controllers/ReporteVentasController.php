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
     * Ranking de clientes por ventas aprobadas/anuladas y productos
     * GET /reportes/ventas/ranking-clientes
     */
    public function rankingClientes(Request $request): InertiaResponse
    {
        try {
            $user = auth()->user();
            $limite = $request->integer('limite', 20);

            // Validar fechas - default último mes
            $fechaDesde = $request->filled('fecha_desde')
                ? $request->date('fecha_desde')
                : now()->subMonth();
            $fechaHasta = $request->filled('fecha_hasta')
                ? $request->date('fecha_hasta')
                : now();

            // Estados
            $estadoAprobadoId = EstadoDocumento::where('codigo', 'APROBADO')->value('id');
            $estadoAnuladoId = EstadoDocumento::where('codigo', 'ANULADO')->value('id');

            // Query 1: TOP ventas aprobadas por cliente
            $topAprobadas = DB::table('ventas')
                ->join('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                ->select(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.codigo_cliente',
                    DB::raw('COUNT(ventas.id) as total_ventas'),
                    DB::raw('SUM(CAST(ventas.total AS DECIMAL(15,2))) as monto_total')
                )
                ->where('ventas.estado_documento_id', $estadoAprobadoId)
                ->where('clientes.codigo_cliente', '!=', 'GENERAL')
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.codigo_cliente')
                ->orderByDesc('total_ventas')
                ->limit($limite)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->nombre,
                        'codigo_cliente' => $item->codigo_cliente,
                        'total_ventas' => (int) $item->total_ventas,
                        'monto_total' => (float) $item->monto_total,
                    ];
                });

            // Query 2: TOP ventas anuladas por cliente
            $topAnuladas = DB::table('ventas')
                ->join('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                ->select(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.codigo_cliente',
                    DB::raw('COUNT(ventas.id) as total_ventas'),
                    DB::raw('SUM(CAST(ventas.total AS DECIMAL(15,2))) as monto_total')
                )
                ->where('ventas.estado_documento_id', $estadoAnuladoId)
                ->where('clientes.codigo_cliente', '!=', 'GENERAL')
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.codigo_cliente')
                ->orderByDesc('total_ventas')
                ->limit($limite)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->nombre,
                        'codigo_cliente' => $item->codigo_cliente,
                        'total_ventas' => (int) $item->total_ventas,
                        'monto_total' => (float) $item->monto_total,
                    ];
                });

            // Query 3: TOP productos comprados por cliente
            $topProductos = DB::table('clientes')
                ->join('ventas', 'clientes.id', '=', 'ventas.cliente_id')
                ->join('proformas', 'ventas.proforma_id', '=', 'proformas.id')
                ->join('detalle_proformas', 'proformas.id', '=', 'detalle_proformas.proforma_id')
                ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
                ->select(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.codigo_cliente',
                    DB::raw('COUNT(DISTINCT ventas.id) as total_ventas'),
                    DB::raw('SUM(CAST(detalle_proformas.cantidad AS DECIMAL(15,2))) as total_productos'),
                    DB::raw('SUM(CAST(detalle_proformas.subtotal AS DECIMAL(15,2))) as monto_total')
                )
                ->where('estados_documento.codigo', 'APROBADO')
                ->where('clientes.codigo_cliente', '!=', 'GENERAL')
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->whereNotNull('ventas.proforma_id')
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.codigo_cliente')
                ->orderByDesc('total_productos')
                ->limit($limite)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->nombre,
                        'codigo_cliente' => $item->codigo_cliente,
                        'total_ventas' => (int) $item->total_ventas,
                        'total_productos' => (float) $item->total_productos,
                        'monto_total' => (float) $item->monto_total,
                    ];
                });

            // Query 4: MENOS productos comprados por cliente
            $menosProductos = DB::table('clientes')
                ->join('ventas', 'clientes.id', '=', 'ventas.cliente_id')
                ->join('proformas', 'ventas.proforma_id', '=', 'proformas.id')
                ->join('detalle_proformas', 'proformas.id', '=', 'detalle_proformas.proforma_id')
                ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
                ->select(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.codigo_cliente',
                    DB::raw('COUNT(DISTINCT ventas.id) as total_ventas'),
                    DB::raw('SUM(CAST(detalle_proformas.cantidad AS DECIMAL(15,2))) as total_productos'),
                    DB::raw('SUM(CAST(detalle_proformas.subtotal AS DECIMAL(15,2))) as monto_total')
                )
                ->where('estados_documento.codigo', 'APROBADO')
                ->where('clientes.codigo_cliente', '!=', 'GENERAL')
                ->whereDate('ventas.created_at', '>=', $fechaDesde)
                ->whereDate('ventas.created_at', '<=', $fechaHasta)
                ->whereNotNull('ventas.proforma_id')
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.codigo_cliente')
                ->orderBy('total_productos')
                ->limit($limite)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->nombre,
                        'codigo_cliente' => $item->codigo_cliente,
                        'total_ventas' => (int) $item->total_ventas,
                        'total_productos' => (float) $item->total_productos,
                        'monto_total' => (float) $item->monto_total,
                    ];
                });

            $filtros = [
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
                'limite' => $limite,
            ];

            return Inertia::render('reportes/ventas/ranking-clientes', [
                'topAprobadas' => $topAprobadas,
                'topAnuladas' => $topAnuladas,
                'topProductos' => $topProductos,
                'menosProductos' => $menosProductos,
                'filtros' => $filtros,
                'fecha_desde' => $fechaDesde->format('Y-m-d'),
                'fecha_hasta' => $fechaHasta->format('Y-m-d'),
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en ReporteVentasController::rankingClientes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Inertia::render('reportes/ventas/ranking-clientes', [
                'topAprobadas' => [],
                'topAnuladas' => [],
                'topProductos' => [],
                'menosProductos' => [],
                'filtros' => [],
                'error' => 'Error al generar reporte: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Entregas por chofer
     * GET /reportes/ventas/entregas-por-chofer
     */
    public function entregasPorChofer(Request $request): InertiaResponse
    {
        try {
            // Validar fechas - default último mes
            $fechaDesde = $request->filled('fecha_desde')
                ? $request->date('fecha_desde')
                : now()->subMonth();
            $fechaHasta = $request->filled('fecha_hasta')
                ? $request->date('fecha_hasta')
                : now();

            // Query principal: Resumen por chofer
            $choferes = DB::table('users')
                ->leftJoin('entregas', 'entregas.chofer_id', '=', 'users.id')
                ->leftJoin('entregas_venta_confirmaciones', 'entregas_venta_confirmaciones.entrega_id', '=', 'entregas.id')
                ->select(
                    'users.id as chofer_id',
                    'users.name as chofer_nombre',
                    DB::raw('COUNT(DISTINCT entregas_venta_confirmaciones.id) as total_confirmaciones'),
                    DB::raw("COUNT(DISTINCT CASE WHEN entregas_venta_confirmaciones.tipo_confirmacion = 'COMPLETA' THEN entregas_venta_confirmaciones.id END) as completas"),
                    DB::raw("COUNT(DISTINCT CASE WHEN entregas_venta_confirmaciones.tipo_confirmacion = 'CON_NOVEDAD' THEN entregas_venta_confirmaciones.id END) as con_novedad"),
                    DB::raw("COUNT(DISTINCT CASE WHEN entregas_venta_confirmaciones.tuvo_problema = true THEN entregas_venta_confirmaciones.id END) as con_problemas"),
                    DB::raw('SUM(CAST(COALESCE(entregas_venta_confirmaciones.total_dinero_recibido, 0) AS DECIMAL(15,2))) as dinero_recibido')
                )
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '>=', $fechaDesde)
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '<=', $fechaHasta)
                ->whereNotNull('users.id');

            // Filtrar por chofer específico si se proporciona
            if ($request->filled('chofer_id')) {
                $choferes->where('users.id', $request->integer('chofer_id'));
            }

            $choferes = $choferes->groupBy('users.id', 'users.name')
                ->orderByDesc('total_confirmaciones')
                ->get()
                ->map(function ($item) {
                    return [
                        'chofer_id' => $item->chofer_id,
                        'chofer_nombre' => $item->chofer_nombre,
                        'total_confirmaciones' => (int) $item->total_confirmaciones,
                        'completas' => (int) $item->completas,
                        'con_novedad' => (int) $item->con_novedad,
                        'con_problemas' => (int) $item->con_problemas,
                        'dinero_recibido' => (float) ($item->dinero_recibido ?? 0),
                    ];
                });

            // Calcular totales
            $totales = [
                'total_confirmaciones' => $choferes->sum('total_confirmaciones'),
                'total_completas' => $choferes->sum('completas'),
                'total_novedad' => $choferes->sum('con_novedad'),
                'total_dinero' => $choferes->sum('dinero_recibido'),
            ];

            // Obtener lista de choferes para el select
            $choferesList = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['Chofer', 'chofer', 'driver']);
            })->select('id', 'name')->orderBy('name')->get();

            $filtros = [
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
                'chofer_id' => $request->input('chofer_id'),
            ];

            return Inertia::render('reportes/ventas/entregas-por-chofer', [
                'choferes' => $choferes,
                'totales' => $totales,
                'filtros' => $filtros,
                'choferesList' => $choferesList,
                'fecha_desde' => $fechaDesde->format('Y-m-d'),
                'fecha_hasta' => $fechaHasta->format('Y-m-d'),
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en ReporteVentasController::entregasPorChofer', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Inertia::render('reportes/ventas/entregas-por-chofer', [
                'choferes' => [],
                'totales' => [
                    'total_confirmaciones' => 0,
                    'total_completas' => 0,
                    'total_novedad' => 0,
                    'total_dinero' => 0,
                ],
                'filtros' => [],
                'choferesList' => [],
                'error' => 'Error al generar reporte: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Entregas por cliente (completas, rechazadas, tienda cerrada)
     * GET /reportes/ventas/entregas-por-cliente
     */
    public function entregarsPorCliente(Request $request): InertiaResponse
    {
        try {
            $limite = $request->integer('limite', 20);

            // Validar fechas - default último mes
            $fechaDesde = $request->filled('fecha_desde')
                ? $request->date('fecha_desde')
                : now()->subMonth();
            $fechaHasta = $request->filled('fecha_hasta')
                ? $request->date('fecha_hasta')
                : now();

            // Query 1: Clientes con más entregas COMPLETAS
            $completasQuery = DB::table('entregas_venta_confirmaciones')
                ->join('ventas', 'entregas_venta_confirmaciones.venta_id', '=', 'ventas.id')
                ->join('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                ->select(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.codigo_cliente',
                    DB::raw('COUNT(DISTINCT entregas_venta_confirmaciones.id) as total_entregas'),
                    DB::raw('SUM(CAST(COALESCE(entregas_venta_confirmaciones.total_dinero_recibido, 0) AS DECIMAL(15,2))) as dinero_recibido')
                )
                ->where('entregas_venta_confirmaciones.tipo_confirmacion', 'COMPLETA')
                ->where('clientes.codigo_cliente', '!=', 'GENERAL')
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '>=', $fechaDesde)
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '<=', $fechaHasta)
                ->whereNotNull('entregas_venta_confirmaciones.confirmado_en')
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.codigo_cliente')
                ->orderByDesc('total_entregas')
                ->limit($limite)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->nombre,
                        'codigo_cliente' => $item->codigo_cliente,
                        'total_entregas' => (int) $item->total_entregas,
                        'dinero_recibido' => (float) $item->dinero_recibido,
                    ];
                });

            // Query 2: Clientes con más entregas RECHAZADAS
            $rechazadasQuery = DB::table('entregas_venta_confirmaciones')
                ->join('ventas', 'entregas_venta_confirmaciones.venta_id', '=', 'ventas.id')
                ->join('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                ->select(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.codigo_cliente',
                    DB::raw('COUNT(DISTINCT entregas_venta_confirmaciones.id) as total_entregas'),
                    DB::raw('SUM(CAST(COALESCE(ventas.total, 0) AS DECIMAL(15,2))) as monto_rechazado')
                )
                ->where('clientes.codigo_cliente', '!=', 'GENERAL')
                ->whereNotNull('entregas_venta_confirmaciones.motivo_rechazo')
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '>=', $fechaDesde)
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '<=', $fechaHasta)
                ->whereNotNull('entregas_venta_confirmaciones.confirmado_en')
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.codigo_cliente')
                ->orderByDesc('total_entregas')
                ->limit($limite)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->nombre,
                        'codigo_cliente' => $item->codigo_cliente,
                        'total_entregas' => (int) $item->total_entregas,
                        'monto_rechazado' => (float) $item->monto_rechazado,
                    ];
                });

            // Query 3: Clientes donde TIENDA ESTABA CERRADA
            $tiendaCerradaQuery = DB::table('entregas_venta_confirmaciones')
                ->join('ventas', 'entregas_venta_confirmaciones.venta_id', '=', 'ventas.id')
                ->join('clientes', 'ventas.cliente_id', '=', 'clientes.id')
                ->select(
                    'clientes.id',
                    'clientes.nombre',
                    'clientes.codigo_cliente',
                    DB::raw('COUNT(DISTINCT entregas_venta_confirmaciones.id) as total_entregas'),
                    DB::raw('SUM(CAST(COALESCE(ventas.total, 0) AS DECIMAL(15,2))) as monto_intento')
                )
                ->where('clientes.codigo_cliente', '!=', 'GENERAL')
                ->where('entregas_venta_confirmaciones.tienda_abierta', false)
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '>=', $fechaDesde)
                ->whereDate('entregas_venta_confirmaciones.confirmado_en', '<=', $fechaHasta)
                ->whereNotNull('entregas_venta_confirmaciones.confirmado_en')
                ->groupBy('clientes.id', 'clientes.nombre', 'clientes.codigo_cliente')
                ->orderByDesc('total_entregas')
                ->limit($limite)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nombre' => $item->nombre,
                        'codigo_cliente' => $item->codigo_cliente,
                        'total_entregas' => (int) $item->total_entregas,
                        'monto_intento' => (float) $item->monto_intento,
                    ];
                });

            $filtros = [
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
                'limite' => $limite,
            ];

            return Inertia::render('reportes/ventas/entregas-por-cliente', [
                'completadas' => $completasQuery,
                'rechazadas' => $rechazadasQuery,
                'tiendaCerrada' => $tiendaCerradaQuery,
                'filtros' => $filtros,
                'fecha_desde' => $fechaDesde->format('Y-m-d'),
                'fecha_hasta' => $fechaHasta->format('Y-m-d'),
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en ReporteVentasController::entregarsPorCliente', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Inertia::render('reportes/ventas/entregas-por-cliente', [
                'completadas' => [],
                'rechazadas' => [],
                'tiendaCerrada' => [],
                'filtros' => [],
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
