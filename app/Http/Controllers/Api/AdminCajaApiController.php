<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AperturaCaja;
use App\Models\Caja;
use App\Models\CierreCaja;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controller: AdminCajaApiController
 *
 * Responsabilidades:
 * ✅ Proporcionar datos en tiempo real del estado de cajas
 * ✅ Alertas de cajas abiertas/cerradas
 * ✅ Estadísticas de movimientos del día
 * ✅ Alertas de discrepancias
 *
 * Rutas:
 * - GET /api/admin/cajas/estado-general - Estado general de todas las cajas
 * - GET /api/admin/cajas/alertas - Alertas activas
 * - GET /api/admin/cajas/estadisticas - Estadísticas del día
 * - GET /api/admin/cajas/{id}/detalle - Detalle en tiempo real
 */
class AdminCajaApiController extends Controller
{
    /**
     * GET /api/admin/cajas/estado-general
     * Obtiene el estado general de todas las cajas
     */
    public function estadoGeneral()
    {
        $cajas = Caja::activas()
            ->with(['usuario', 'aperturas' => function ($query) {
                $query->whereDate('fecha', today())
                    ->with(['cierre']);
            }])
            ->get()
            ->map(function ($caja) {
                $aperturaHoy = $caja->aperturas->first();
                $estado = !$aperturaHoy ? 'cerrada' : ($aperturaHoy->cierre ? 'cerrada' : 'abierta');

                return [
                    'id' => $caja->id,
                    'nombre' => $caja->nombre,
                    'usuario' => $caja->usuario?->name,
                    'estado' => $estado,
                    'monto_actual' => $aperturaHoy ? ($aperturaHoy->cierre?->monto_real ?? $aperturaHoy->monto_apertura) : 0,
                    'hora_apertura' => $aperturaHoy?->created_at?->toIso8601String(),
                    'hora_cierre' => $aperturaHoy?->cierre?->created_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $cajas,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/admin/cajas/alertas
     * Obtiene alertas activas de cajas
     */
    public function obtenerAlertas()
    {
        $alertas = [];

        // Alerta 1: Cajas abiertas hace más de 8 horas
        $cajasAbiertas = AperturaCaja::whereDate('fecha', today())
            ->whereDoesntHave('cierre')
            ->with(['usuario', 'caja'])
            ->get()
            ->filter(function ($apertura) {
                return $apertura->created_at->diffInHours(now()) > 8;
            });

        foreach ($cajasAbiertas as $apertura) {
            $alertas[] = [
                'id' => 'caja-' . $apertura->id,
                'tipo' => 'CAJA_ABIERTA_PROLONGADO',
                'severidad' => 'media',
                'titulo' => 'Caja abierta por más de 8 horas',
                'descripcion' => "La caja {$apertura->caja->nombre} de {$apertura->usuario->name} ha estado abierta por {$apertura->created_at->diffInHours(now())} horas.",
                'usuario' => $apertura->usuario->name,
                'caja' => $apertura->caja->nombre,
                'fecha' => $apertura->created_at->toIso8601String(),
            ];
        }

        // Alerta 2: Discrepancias detectadas hoy
        $discrepancias = CierreCaja::whereDate('fecha', today())
            ->where('diferencia', '!=', 0)
            ->with(['apertura.usuario', 'apertura.caja'])
            ->get();

        foreach ($discrepancias as $cierre) {
            $alertas[] = [
                'id' => 'discrepancia-' . $cierre->id,
                'tipo' => 'DISCREPANCIA_DETECTADA',
                'severidad' => abs($cierre->diferencia) > 1000 ? 'alto' : 'medio',
                'titulo' => 'Discrepancia detectada',
                'descripcion' => "Diferencia de ${abs($cierre->diferencia)} en caja {$cierre->apertura->caja->nombre}",
                'usuario' => $cierre->apertura->usuario->name,
                'caja' => $cierre->apertura->caja->nombre,
                'diferencia' => $cierre->diferencia,
                'fecha' => $cierre->fecha->toIso8601String(),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $alertas,
            'total' => count($alertas),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/admin/cajas/estadisticas
     * Obtiene estadísticas en tiempo real del día
     */
    public function estadisticas()
    {
        $hoy = today();

        $aperturas = AperturaCaja::whereDate('fecha', $hoy)->count();
        $cierres = CierreCaja::whereDate('fecha', $hoy)->count();
        $abiertas = AperturaCaja::whereDate('fecha', $hoy)
            ->whereDoesntHave('cierre')
            ->count();

        // Totales de movimientos
        $totalIngresos = MovimientoCaja::whereDate('fecha', $hoy)
            ->where('monto', '>', 0)
            ->sum('monto');

        $totalEgresos = abs(MovimientoCaja::whereDate('fecha', $hoy)
            ->where('monto', '<', 0)
            ->sum('monto'));

        // Discrepancias
        $totalDiscrepancias = CierreCaja::whereDate('fecha', $hoy)
            ->where('diferencia', '!=', 0)
            ->count();

        $discrepanciasPositivas = CierreCaja::whereDate('fecha', $hoy)
            ->where('diferencia', '>', 0)
            ->sum('diferencia');

        $discrepanciasNegativas = abs(CierreCaja::whereDate('fecha', $hoy)
            ->where('diferencia', '<', 0)
            ->sum('diferencia'));

        // Movimientos por tipo
        $movimientosPorTipo = MovimientoCaja::whereDate('fecha', $hoy)
            ->select('tipo_operacion_id', DB::raw('COUNT(*) as total, SUM(monto) as monto_total'))
            ->groupBy('tipo_operacion_id')
            ->with('tipoOperacion')
            ->get()
            ->map(function ($item) {
                return [
                    'tipo' => $item->tipoOperacion->nombre,
                    'codigo' => $item->tipoOperacion->codigo,
                    'cantidad' => $item->total,
                    'monto_total' => (float) $item->monto_total,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'aperturas_hoy' => $aperturas,
                'cierres_hoy' => $cierres,
                'cajas_abiertas' => $abiertas,
                'total_ingresos' => (float) $totalIngresos,
                'total_egresos' => (float) $totalEgresos,
                'neto_dia' => (float) ($totalIngresos - $totalEgresos),
                'discrepancias_total' => $totalDiscrepancias,
                'discrepancias_positivas' => (float) $discrepanciasPositivas,
                'discrepancias_negativas' => (float) $discrepanciasNegativas,
                'movimientos_por_tipo' => $movimientosPorTipo,
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/admin/cajas/{id}/detalle
     * Obtiene detalle en tiempo real de una caja específica
     */
    public function detalleCaja($id)
    {
        $caja = Caja::with(['usuario'])->findOrFail($id);

        $aperturaHoy = AperturaCaja::where('caja_id', $id)
            ->whereDate('fecha', today())
            ->with(['cierre', 'usuario'])
            ->first();

        if (!$aperturaHoy) {
            return response()->json([
                'success' => true,
                'data' => [
                    'caja_id' => $caja->id,
                    'caja_nombre' => $caja->nombre,
                    'usuario' => $caja->usuario->name,
                    'estado' => 'cerrada',
                    'movimientos' => [],
                    'resumen' => [
                        'monto_apertura' => 0,
                        'total_ingresos' => 0,
                        'total_egresos' => 0,
                        'monto_esperado' => 0,
                        'monto_real' => 0,
                        'diferencia' => 0,
                    ],
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        // Obtener movimientos del día
        $movimientos = MovimientoCaja::where('caja_id', $id)
            ->where('user_id', $aperturaHoy->user_id)
            ->whereDate('fecha', today())
            ->with('tipoOperacion')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($mov) {
                return [
                    'id' => $mov->id,
                    'tipo' => $mov->tipoOperacion->nombre,
                    'descripcion' => $mov->descripcion,
                    'monto' => (float) $mov->monto,
                    'fecha' => $mov->fecha->toIso8601String(),
                ];
            });

        // Calcular totales
        $totalIngresos = $movimientos
            ->filter(fn($m) => $m['monto'] > 0)
            ->sum('monto');

        $totalEgresos = abs($movimientos
            ->filter(fn($m) => $m['monto'] < 0)
            ->sum('monto'));

        $montoEsperado = $aperturaHoy->monto_apertura + $totalIngresos - $totalEgresos;

        return response()->json([
            'success' => true,
            'data' => [
                'caja_id' => $caja->id,
                'caja_nombre' => $caja->nombre,
                'usuario' => $caja->usuario->name,
                'estado' => $aperturaHoy->cierre ? 'cerrada' : 'abierta',
                'movimientos' => $movimientos,
                'resumen' => [
                    'monto_apertura' => (float) $aperturaHoy->monto_apertura,
                    'total_ingresos' => (float) $totalIngresos,
                    'total_egresos' => (float) $totalEgresos,
                    'monto_esperado' => (float) $montoEsperado,
                    'monto_real' => $aperturaHoy->cierre ? (float) $aperturaHoy->cierre->monto_real : null,
                    'diferencia' => $aperturaHoy->cierre ? (float) $aperturaHoy->cierre->diferencia : null,
                ],
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/admin/gastos/resumen
     * Obtiene resumen de gastos del día
     */
    public function resumenGastos()
    {
        $hoy = today();

        $gastos = MovimientoCaja::whereDate('fecha', $hoy)
            ->whereHas('tipoOperacion', fn($q) => $q->where('codigo', 'GASTO'))
            ->with(['usuario', 'tipoOperacion'])
            ->get();

        $totalGastos = abs($gastos->sum('monto'));
        $cantidadGastos = $gastos->count();

        // Gastos por categoría
        $gastosPorCategoria = $gastos
            ->groupBy(function ($gasto) {
                preg_match('/\[([^\]]+)\]/', $gasto->descripcion, $matches);
                return $matches[1] ?? 'VARIOS';
            })
            ->map(function ($grupo, $categoria) {
                return [
                    'categoria' => $categoria,
                    'cantidad' => $grupo->count(),
                    'total' => (float) abs($grupo->sum('monto')),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'total_gastos' => $cantidadGastos,
                'monto_total' => (float) $totalGastos,
                'promedio' => $cantidadGastos > 0 ? (float) ($totalGastos / $cantidadGastos) : 0,
                'por_categoria' => $gastosPorCategoria,
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/admin/cierres/pendientes
     * Lista de cierres pendientes de verificación
     */
    public function cierresPendientes()
    {
        $cierres = CierreCaja::pendientes()
            ->with(['apertura.usuario', 'apertura.caja', 'estadoCierre'])
            ->orderBy('fecha', 'desc')
            ->get()
            ->map(function ($cierre) {
                return [
                    'id' => $cierre->id,
                    'caja' => $cierre->apertura->caja->nombre,
                    'usuario' => $cierre->apertura->usuario->name,
                    'fecha' => $cierre->fecha->toIso8601String(),
                    'monto_esperado' => (float)$cierre->monto_esperado,
                    'monto_real' => (float)$cierre->monto_real,
                    'diferencia' => (float)$cierre->diferencia,
                    'observaciones' => $cierre->observaciones,
                    'estado' => [
                        'codigo' => $cierre->estadoCierre->codigo,
                        'nombre' => $cierre->estadoCierre->nombre,
                        'color' => $cierre->estadoCierre->color,
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $cierres,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * POST /api/admin/cierres/{id}/consolidar
     * Consolidar un cierre de caja
     */
    public function consolidarCierre(Request $request, $id)
    {
        $request->validate([
            'observaciones' => 'nullable|string|max:500',
        ]);

        $cierre = CierreCaja::with(['apertura.usuario', 'apertura.caja'])->findOrFail($id);

        if (!$cierre->puedeConsolidar()) {
            return response()->json([
                'success' => false,
                'message' => 'El cierre no puede ser consolidado. Estado actual: ' . $cierre->estado,
            ], 422);
        }

        if ($cierre->consolidar(auth()->user(), $request->observaciones)) {
            return response()->json([
                'success' => true,
                'message' => 'Cierre consolidado exitosamente.',
                'data' => [
                    'cierre_id' => $cierre->id,
                    'caja' => $cierre->apertura->caja->nombre,
                    'usuario' => $cierre->apertura->usuario->name,
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Error al consolidar el cierre.',
        ], 500);
    }

    /**
     * POST /api/admin/cierres/{id}/rechazar
     * Rechazar un cierre de caja
     */
    public function rechazarCierre(Request $request, $id)
    {
        $request->validate([
            'motivo' => 'required|string|max:500',
            'requiere_reapertura' => 'boolean',
        ]);

        $cierre = CierreCaja::with(['apertura.usuario', 'apertura.caja'])->findOrFail($id);

        if (!$cierre->puedeRechazar()) {
            return response()->json([
                'success' => false,
                'message' => 'El cierre no puede ser rechazado. Estado actual: ' . $cierre->estado,
            ], 422);
        }

        if ($cierre->rechazar(auth()->user(), $request->motivo, $request->requiere_reapertura ?? false)) {
            return response()->json([
                'success' => true,
                'message' => 'Cierre rechazado. El cajero fue notificado.',
                'data' => [
                    'cierre_id' => $cierre->id,
                    'caja' => $cierre->apertura->caja->nombre,
                    'usuario' => $cierre->apertura->usuario->name,
                    'motivo' => $request->motivo,
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Error al rechazar el cierre.',
        ], 500);
    }

    /**
     * GET /api/admin/cierres/estadisticas
     * Estadísticas de cierres del día
     */
    public function estadisticasCierres()
    {
        $hoy = today();

        $stats = [
            'pendientes' => CierreCaja::pendientes()->whereDate('fecha', $hoy)->count(),
            'consolidadas' => CierreCaja::consolidadas()->whereDate('fecha', $hoy)->count(),
            'rechazadas' => CierreCaja::rechazadas()->whereDate('fecha', $hoy)->count(),
            'requieren_atencion' => CierreCaja::requierenAtencion()->count(),
            'con_diferencias' => CierreCaja::pendientes()
                ->whereDate('fecha', $hoy)
                ->conDiferencias()
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
