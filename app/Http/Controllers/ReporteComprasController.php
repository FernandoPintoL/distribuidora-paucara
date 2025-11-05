<?php

namespace App\Http\Controllers;

use App\Models\Compra;
use App\Models\CuentaPorPagar;
use App\Models\LoteVencimiento;
use App\Models\Pago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReporteComprasController extends Controller
{
    public function index(Request $request)
    {
        $reportes = [
            'compras_por_periodo' => [
                'titulo' => 'Reporte de Compras por Período',
                'descripcion' => 'Análisis detallado de compras realizadas en un período específico',
                'filtros' => ['fecha_desde', 'fecha_hasta', 'proveedor_id'],
            ],
            'cuentas_por_pagar' => [
                'titulo' => 'Reporte de Cuentas por Pagar',
                'descripcion' => 'Estado actual de las cuentas pendientes de pago',
                'filtros' => ['estado', 'proveedor_id', 'dias_vencimiento'],
            ],
            'pagos_realizados' => [
                'titulo' => 'Reporte de Pagos Realizados',
                'descripcion' => 'Historial de pagos efectuados a proveedores',
                'filtros' => ['fecha_desde', 'fecha_hasta', 'tipo_pago_id', 'proveedor_id'],
            ],
            'productos_vencimiento' => [
                'titulo' => 'Reporte de Productos por Vencer',
                'descripcion' => 'Control de inventario por fechas de vencimiento',
                'filtros' => ['dias_vencimiento', 'categoria_id', 'proveedor_id'],
            ],
            'analisis_proveedores' => [
                'titulo' => 'Análisis de Proveedores',
                'descripcion' => 'Estadísticas de compras y pagos por proveedor',
                'filtros' => ['fecha_desde', 'fecha_hasta'],
            ],
        ];

        return Inertia::render('compras/reportes/index', [
            'reportes' => $reportes,
        ]);
    }

    public function export(Request $request)
    {
        $tipoReporte = $request->get('tipo');
        $fechaDesde = $request->get('fecha_desde');
        $fechaHasta = $request->get('fecha_hasta');

        switch ($tipoReporte) {
            case 'compras_por_periodo':
                return $this->reporteComprasPorPeriodo($request);
            case 'cuentas_por_pagar':
                return $this->reporteCuentasPorPagar($request);
            case 'pagos_realizados':
                return $this->reportePagosRealizados($request);
            case 'productos_vencimiento':
                return $this->reporteProductosVencimiento($request);
            case 'analisis_proveedores':
                return $this->reporteAnalisisProveedores($request);
            default:
                return response()->json(['error' => 'Tipo de reporte no válido'], 400);
        }
    }

    public function exportPdf(Request $request)
    {
        // Similar al método export pero generando PDF
        $tipoReporte = $request->get('tipo');

        // Por ahora retornamos JSON, pero aquí implementarías la generación de PDF
        return $this->export($request);
    }

    private function reporteComprasPorPeriodo(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = Compra::with(['proveedor', 'detalleCompras.producto'])
            ->when($request->fecha_desde && $request->fecha_hasta, function ($q) use ($request) {
                $q->whereBetween('fecha_compra', [$request->fecha_desde, $request->fecha_hasta]);
            })
            ->when($request->proveedor_id, function ($q) use ($request) {
                $q->where('proveedor_id', $request->proveedor_id);
            });

        $compras = $query->get();

        $resumen = [
            'total_compras' => $compras->count(),
            'monto_total' => $compras->sum('total'),
            'promedio_compra' => $compras->avg('total'),
            'compras_por_proveedor' => $compras->groupBy('proveedor.nombre')
                ->map(function ($grupo) {
                    return [
                        'cantidad' => $grupo->count(),
                        'total' => $grupo->sum('total'),
                    ];
                }),
        ];

        return response()->json([
            'compras' => $compras,
            'resumen' => $resumen,
        ]);
    }

    private function reporteCuentasPorPagar(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = CuentaPorPagar::with(['compra.proveedor'])
            ->when($request->estado, function ($q) use ($request) {
                $q->where('estado', $request->estado);
            })
            ->when($request->proveedor_id, function ($q) use ($request) {
                $q->whereHas('compra', function ($compraQ) use ($request) {
                    $compraQ->where('proveedor_id', $request->proveedor_id);
                });
            })
            ->when($request->dias_vencimiento, function ($q) use ($request) {
                $diasVencimiento = (int) $request->dias_vencimiento;
                $fechaLimite = now()->addDays($diasVencimiento);
                $q->where('fecha_vencimiento', '<=', $fechaLimite);
            });

        $cuentas = $query->get();

        $resumen = [
            'total_cuentas' => $cuentas->count(),
            'monto_total_pendiente' => $cuentas->sum('saldo_pendiente'),
            'cuentas_vencidas' => $cuentas->filter(function ($cuenta) {
                return $cuenta->fecha_vencimiento < now();
            })->count(),
            'por_estado' => $cuentas->groupBy('estado')
                ->map(function ($grupo) {
                    return [
                        'cantidad' => $grupo->count(),
                        'monto' => $grupo->sum('saldo_pendiente'),
                    ];
                }),
        ];

        return response()->json([
            'cuentas' => $cuentas,
            'resumen' => $resumen,
        ]);
    }

    private function reportePagosRealizados(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = Pago::with(['cuentaPorPagar.compra.proveedor', 'tipoPago'])
            ->whereNotNull('cuenta_por_pagar_id')
            ->when($request->fecha_desde && $request->fecha_hasta, function ($q) use ($request) {
                $q->whereBetween('fecha_pago', [$request->fecha_desde, $request->fecha_hasta]);
            })
            ->when($request->tipo_pago_id, function ($q) use ($request) {
                $q->where('tipo_pago_id', $request->tipo_pago_id);
            })
            ->when($request->proveedor_id, function ($q) use ($request) {
                $q->whereHas('cuentaPorPagar.compra', function ($compraQ) use ($request) {
                    $compraQ->where('proveedor_id', $request->proveedor_id);
                });
            });

        $pagos = $query->get();

        $resumen = [
            'total_pagos' => $pagos->count(),
            'monto_total_pagado' => $pagos->sum('monto'),
            'promedio_pago' => $pagos->avg('monto'),
            'por_tipo_pago' => $pagos->groupBy('tipoPago.nombre')
                ->map(function ($grupo) {
                    return [
                        'cantidad' => $grupo->count(),
                        'monto' => $grupo->sum('monto'),
                    ];
                }),
        ];

        return response()->json([
            'pagos' => $pagos,
            'resumen' => $resumen,
        ]);
    }

    private function reporteProductosVencimiento(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = LoteVencimiento::with(['detalleCompra.producto', 'detalleCompra.compra.proveedor'])
            ->when($request->dias_vencimiento, function ($q) use ($request) {
                $diasVencimiento = (int) $request->dias_vencimiento;
                $fechaLimite = now()->addDays($diasVencimiento);
                $q->where('fecha_vencimiento', '<=', $fechaLimite);
            })
            ->when($request->proveedor_id, function ($q) use ($request) {
                $q->whereHas('detalleCompra.compra', function ($compraQ) use ($request) {
                    $compraQ->where('proveedor_id', $request->proveedor_id);
                });
            })
            ->where('estado', 'ACTIVO');

        $lotes = $query->get();

        $resumen = [
            'total_lotes' => $lotes->count(),
            'cantidad_productos' => $lotes->sum('cantidad_disponible'),
            'valor_inventario' => $lotes->sum(function ($lote) {
                return $lote->cantidad_disponible * $lote->precio_unitario;
            }),
            'por_categoria' => $lotes->groupBy('detalleCompra.producto.categoria.nombre')
                ->map(function ($grupo) {
                    return [
                        'cantidad_lotes' => $grupo->count(),
                        'cantidad_productos' => $grupo->sum('cantidad_disponible'),
                        'valor' => $grupo->sum(function ($lote) {
                            return $lote->cantidad_disponible * $lote->precio_unitario;
                        }),
                    ];
                }),
        ];

        return response()->json([
            'lotes' => $lotes,
            'resumen' => $resumen,
        ]);
    }

    private function reporteAnalisisProveedores(Request $request): \Illuminate\Http\JsonResponse
    {
        $fechaDesde = $request->fecha_desde ?? now()->subMonths(6);
        $fechaHasta = $request->fecha_hasta ?? now();

        // Estadísticas por proveedor
        $analisisProveedores = DB::select('
            SELECT
                p.id,
                p.nombre,
                COUNT(DISTINCT c.id) as total_compras,
                COALESCE(SUM(c.total), 0) as monto_total_compras,
                COALESCE(AVG(c.total), 0) as promedio_compra,
                COUNT(DISTINCT pag.id) as total_pagos,
                COALESCE(SUM(pag.monto), 0) as monto_total_pagos,
                COALESCE(SUM(cpp.saldo_pendiente), 0) as saldo_pendiente
            FROM proveedores p
            LEFT JOIN compras c ON p.id = c.proveedor_id
                AND c.fecha_compra BETWEEN ? AND ?
            LEFT JOIN cuentas_por_pagar cpp ON c.id = cpp.compra_id
            LEFT JOIN pagos pag ON cpp.id = pag.cuenta_por_pagar_id
            WHERE p.activo = true
            GROUP BY p.id, p.nombre
            HAVING total_compras > 0
            ORDER BY monto_total_compras DESC
        ', [$fechaDesde, $fechaHasta]);

        return response()->json([
            'analisis_proveedores' => $analisisProveedores,
            'periodo' => [
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
            ],
        ]);
    }
}
