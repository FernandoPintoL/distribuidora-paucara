<?php
namespace App\Services;

use App\Models\AperturaCaja;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CierreCajaService - Centraliza todos los cálculos de cierre de caja
 *
 * ✅ REFACTORIZADO (2026-02-10):
 * - Utiliza columna 'direccion' de tipo_operacion_caja
 * - Eliminada lógica hardcodeada
 * - Cálculos más simples y mantenibles
 * - SQL más eficiente
 *
 * Direcciones:
 * - ENTRADA: Ingresos (VENTA, PAGO)
 * - SALIDA: Egresos (COMPRA, GASTOS, PAGO_SUELDO, ANTICIPO, ANULACION)
 * - AJUSTE: Especiales (AJUSTE, CREDITO)
 * - ESPECIAL: Sistema (APERTURA, CIERRE)
 */
class CierreCajaService
{
    protected $fechaFin;

    /**
     * Calcular TODOS los datos necesarios para cierre de caja
     *
     * ✅ REFACTORIZADO: Usa columna 'direccion' en lugar de lógica hardcodeada
     *
     * @param AperturaCaja $aperturaCaja
     * @return array Datos con todos los cálculos
     */
    public function calcularDatos(AperturaCaja $aperturaCaja): array
    {
        $this->fechaFin = $aperturaCaja->cierre?->created_at ?? now();
        $movimientos = $this->obtenerMovimientos($aperturaCaja);
        $movimientosVenta = $this->obtenerMovimientosVenta($aperturaCaja);

        // Totales básicos usando DIRECCION
        $totalIngresos = $this->calcularTotalIngresos($movimientos);
        $totalEgresos = $this->calcularTotalEgresos($movimientos);

        return [
            'apertura'                  => $aperturaCaja,
            'cierre'                    => $aperturaCaja->cierre,
            'movimientos'               => $movimientos,
            'movimientosAgrupados'      => $this->agruparPorTipoOperacion($movimientos),
            'ventasPorTipoPago'         => $this->calcularVentasPorTipoPago($movimientos),
            'ventasPorTipoPagoCompleto' => $this->calcularVentasPorTipoPagoConTodos($this->calcularVentasPorTipoPago($movimientos)),
            'sumatoriasVentasPorTipoPago' => $this->calcularSumatoriasVentasPorTipoPago($movimientos),
            'movimientosPorTipoPago'    => $this->calcularMovimientosPorTipoPago($movimientos),
            'pagosCreditoPorTipoPago'   => $this->calcularPagosCreditoPorTipoPago($movimientos),
            'gastosPorTipoPago'         => $this->calcularGastosPorTipoPago($movimientos),
            'ventasPorEstado'           => $this->calcularVentasPorEstado($aperturaCaja),
            'efectivoEsperado'          => $this->calcularEfectivoEsperado($aperturaCaja, $movimientos),
            'totalIngresos'             => (float) $totalIngresos,
            'totalEgresos'              => (float) $totalEgresos,
            'primeraVenta'              => $this->calcularRangoFechas($movimientos, $movimientosVenta)['primeraVenta'],
            'ultimaVenta'               => $this->calcularRangoFechas($movimientos, $movimientosVenta)['ultimaVenta'],
            'primerMovimiento'          => $this->calcularRangoFechas($movimientos, $movimientosVenta)['primerMovimiento'],
            'ultimoMovimiento'          => $this->calcularRangoFechas($movimientos, $movimientosVenta)['ultimoMovimiento'],
            'rangoVentasIds'            => $this->calcularRangoVentasIds($movimientosVenta),
            'rangoCreditos'             => $this->calcularRangoCreditos($movimientosVenta),
            'pagosCreditos'             => $this->calcularRangoPagos($movimientos)['totalPagos'] ?? 0,
            'montoPagosCreditos'        => $this->calcularRangoPagos($movimientos)['montoPagos'] ?? 0,
            'rangoPagos'                => $this->calcularRangoPagos($movimientos),
            'sumatorialVentas'          => $this->calcularVentasAprobadasTotal($aperturaCaja),
            'ventasTotalAprobadas'      => $this->calcularVentasAprobadasTotal($aperturaCaja),
            'sumatorialVentasEfectivo'  => $this->calcularVentasAprobadasEfectivo($aperturaCaja),
            'sumatorialVentasCredito'   => $this->calcularVentasAprobadasCredito($aperturaCaja),
            'sumatorialGastos'          => $this->calcularSumaPorCodigo($movimientos, 'GASTOS'),
            'sumatorialPagosSueldo'     => $this->calcularSumaPorCodigo($movimientos, 'PAGO_SUELDO'),
            'sumatorialAnticipos'       => $this->calcularSumaPorCodigo($movimientos, 'ANTICIPO'),
            'sumatorialAnulaciones'     => $this->calcularSumaPorCodigo($movimientos, 'ANULACION'),
            'sumatorialVentasAnuladas'  => $this->calcularVentasAnuladas($aperturaCaja),
            'ventasTotales'             => $this->calcularVentasAprobadasEfectivo($aperturaCaja) + $this->calcularVentasAprobadasCredito($aperturaCaja),
        ];
    }

    /**
     * ✅ NUEVO: Calcular total de ingresos usando DIRECCION (ENTRADA)
     */
    private function calcularTotalIngresos($movimientos): float
    {
        return (float) $movimientos
            ->filter(fn($m) => $m->tipoOperacion?->direccion === 'ENTRADA' && $m->pago?->estado !== 'ANULADO')
            ->sum('monto');
    }

    /**
     * ✅ NUEVO: Calcular total de egresos usando DIRECCION (SALIDA)
     */
    private function calcularTotalEgresos($movimientos): float
    {
        return abs((float) $movimientos
            ->filter(fn($m) => $m->tipoOperacion?->direccion === 'SALIDA' && $m->pago?->estado !== 'ANULADO')
            ->sum('monto'));
    }

    /**
     * ✅ NUEVO: Obtener movimientos por dirección
     */
    private function obtenerMovimientosPorDireccion($movimientos, string $direccion)
    {
        return $movimientos->filter(fn($m) => $m->tipoOperacion?->direccion === $direccion);
    }

    /**
     * ✅ NUEVO: Calcular suma para un código específico
     */
    private function calcularSumaPorCodigo($movimientos, string $codigo): float
    {
        return abs((float) $movimientos
            ->where('tipoOperacion.codigo', $codigo)
            ->sum('monto'));
    }

    /**
     * Obtener movimientos del período
     */
    private function obtenerMovimientos(AperturaCaja $aperturaCaja)
    {
        return MovimientoCaja::where('caja_id', $aperturaCaja->caja_id)
            ->whereBetween('fecha', [$aperturaCaja->fecha, $this->fechaFin])
            ->with(['tipoOperacion', 'comprobantes', 'tipoPago', 'venta.estadoDocumento', 'pago'])
            ->orderBy('id', 'desc')
            ->get();
    }

    /**
     * Obtener solo movimientos de venta APROBADAS
     */
    private function obtenerMovimientosVenta(AperturaCaja $aperturaCaja)
    {
        $tipoOperacionVentaId = TipoOperacionCaja::where('codigo', 'VENTA')->first()?->id;

        if (!$tipoOperacionVentaId) {
            return collect();
        }

        return MovimientoCaja::where('caja_id', $aperturaCaja->caja_id)
            ->whereBetween('fecha', [$aperturaCaja->fecha, $this->fechaFin])
            ->where('tipo_operacion_id', $tipoOperacionVentaId)
            ->with(['tipoPago', 'venta.estadoDocumento'])
            ->get()
            ->filter(fn($m) => $m->venta?->estadoDocumento?->nombre === 'Aprobado');
    }

    /**
     * Agrupar movimientos por tipo de operación
     */
    private function agruparPorTipoOperacion($movimientos)
    {
        return $movimientos->groupBy(fn($m) => $m->tipoOperacion->nombre ?? 'Sin tipo');
    }

    /**
     * Calcular ventas por tipo de pago (VENTA + CREDITO aprobadas)
     */
    private function calcularVentasPorTipoPago($movimientos)
    {
        $resultado = $movimientos
            ->filter(function ($mov) {
                $estado = $mov->venta?->estadoDocumento?->nombre;
                if ($estado !== 'Aprobado') return false;

                $tipoOp = $mov->tipoOperacion?->codigo;
                return in_array($tipoOp, ['VENTA', 'CREDITO']);
            })
            ->groupBy(fn($m) => $m->tipoPago?->nombre ?? 'Sin tipo de pago')
            ->map(fn($grupo) => [
                'cantidad' => $grupo->count(),
                'total' => $grupo->sum('monto'),
            ]);

        Log::info('📊 [calcularVentasPorTipoPago]:', $resultado->toArray());
        return $resultado;
    }

    /**
     * Calcular movimientos por tipo de pago (filtrando por dirección y estado de pago)
     */
    private function calcularMovimientosPorTipoPago($movimientos)
    {
        return $movimientos
            ->filter(function ($m) {
                // Excluir pagos anulados
                if ($m->pago?->estado === 'ANULADO') return false;

                // Ventas: solo aprobadas
                if ($m->tipoOperacion->codigo === 'VENTA') {
                    return $m->venta?->estadoDocumento?->nombre === 'Aprobado';
                }

                // Pagos: solo registrados
                if ($m->tipoOperacion->codigo === 'PAGO') {
                    return $m->pago?->estado === 'REGISTRADO';
                }

                // Otros: incluir todos
                return true;
            })
            ->groupBy(fn($m) => $m->tipoPago?->nombre ?? 'Sin tipo de pago')
            ->map(fn($grupo) => [
                'cantidad' => $grupo->count(),
                'total' => $grupo->sum('monto'),
            ]);
    }

    /**
     * Calcular pagos de crédito por tipo de pago
     */
    private function calcularPagosCreditoPorTipoPago($movimientos)
    {
        return $movimientos
            ->where('tipoOperacion.codigo', 'PAGO')
            ->filter(fn($m) => $m->pago?->estado === 'REGISTRADO')
            ->groupBy(fn($m) => $m->tipoPago?->nombre ?? 'Sin tipo de pago')
            ->map(fn($grupo) => [
                'tipo' => $grupo->first()?->tipoPago?->nombre ?? 'Sin tipo',
                'cantidad' => $grupo->count(),
                'total' => $grupo->sum('monto'),
            ])
            ->values();
    }

    /**
     * Calcular gastos por tipo de pago
     */
    private function calcularGastosPorTipoPago($movimientos)
    {
        return $movimientos
            ->where('tipoOperacion.codigo', 'GASTOS')
            ->groupBy(fn($m) => $m->tipoPago?->nombre ?? 'Sin tipo de pago')
            ->map(fn($grupo) => [
                'tipo' => $grupo->first()?->tipoPago?->nombre ?? 'Sin tipo',
                'cantidad' => $grupo->count(),
                'total' => $grupo->sum('monto'),
            ])
            ->values();
    }

    /**
     * Calcular ventas agrupadas por estado de documento
     */
    private function calcularVentasPorEstado(AperturaCaja $aperturaCaja)
    {
        return DB::table('movimientos_caja')
            ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
            ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
            ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
            ->where('tipo_operacion_caja.codigo', 'VENTA')
            ->whereBetween('movimientos_caja.fecha', [$aperturaCaja->fecha, $this->fechaFin])
            ->groupBy('estados_documento.id', 'estados_documento.nombre')
            ->select(
                'estados_documento.nombre as estado',
                DB::raw('COUNT(DISTINCT ventas.id) as cantidad'),
                DB::raw('SUM(ventas.total) as total')
            )
            ->get()
            ->map(fn($g) => [
                'estado' => $g->estado ?? 'Sin estado',
                'total' => (float) ($g->total ?? 0),
                'count' => (int) ($g->cantidad ?? 0),
            ]);
    }

    /**
     * Calcular efectivo esperado en caja
     */
    private function calcularEfectivoEsperado(AperturaCaja $aperturaCaja, $movimientos)
    {
        $montoApertura = $aperturaCaja->monto_apertura ?? 0;

        $ventasEfectivo = $movimientos
            ->where('tipoOperacion.codigo', 'VENTA')
            ->where('tipoPago.nombre', 'Efectivo')
            ->filter(fn($m) => $m->venta?->estadoDocumento?->nombre === 'Aprobado')
            ->sum('monto');

        $ventasAnuladas = $movimientos
            ->where('tipoOperacion.codigo', 'VENTA')
            ->where('tipoPago.nombre', 'Efectivo')
            ->filter(fn($m) => $m->venta?->estadoDocumento?->nombre === 'Anulado')
            ->sum('monto');

        $pagosCreditoEfectivo = $movimientos
            ->where('tipoOperacion.codigo', 'PAGO')
            ->where('tipoPago.nombre', 'Efectivo')
            ->sum('monto');

        // Egresos por dirección SALIDA
        $gastos = abs($this->obtenerMovimientosPorDireccion($movimientos, 'SALIDA')
            ->where('tipoOperacion.codigo', 'GASTOS')
            ->sum('monto'));

        $pagosSueldo = abs($this->obtenerMovimientosPorDireccion($movimientos, 'SALIDA')
            ->where('tipoOperacion.codigo', 'PAGO_SUELDO')
            ->sum('monto'));

        $anticipos = abs($this->obtenerMovimientosPorDireccion($movimientos, 'SALIDA')
            ->where('tipoOperacion.codigo', 'ANTICIPO')
            ->sum('monto'));

        $anulaciones = abs($this->obtenerMovimientosPorDireccion($movimientos, 'SALIDA')
            ->where('tipoOperacion.codigo', 'ANULACION')
            ->sum('monto'));

        $totalEgresos = $gastos + $pagosSueldo + $anticipos + $anulaciones;

        return [
            'apertura' => $montoApertura,
            'ventas_efectivo' => $ventasEfectivo,
            'ventas_anuladas' => $ventasAnuladas,
            'pagos_credito' => $pagosCreditoEfectivo,
            'pagos_credito_all' => $pagosCreditoEfectivo,
            'gastos' => $gastos,
            'pagos_sueldo' => $pagosSueldo,
            'anticipos' => $anticipos,
            'anulaciones' => $anulaciones,
            'total_egresos' => $totalEgresos,
            'total' => $montoApertura + $ventasEfectivo + $pagosCreditoEfectivo - $totalEgresos,
        ];
    }

    /**
     * Calcular rango de fechas
     */
    private function calcularRangoFechas($movimientos, $movimientosVenta)
    {
        return [
            'primeraVenta' => $movimientosVenta->min('fecha'),
            'ultimaVenta' => $movimientosVenta->max('fecha'),
            'primerMovimiento' => $movimientos->min('fecha'),
            'ultimoMovimiento' => $movimientos->max('fecha'),
        ];
    }

    /**
     * Calcular rango de IDs de ventas
     */
    private function calcularRangoVentasIds($movimientosVenta)
    {
        $ventaIds = $movimientosVenta
            ->pluck('venta_id')
            ->filter(fn($id) => !empty($id) && $id > 0)
            ->unique()
            ->sort();

        return [
            'minId' => $ventaIds->isNotEmpty() ? $ventaIds->first() : null,
            'maxId' => $ventaIds->isNotEmpty() ? $ventaIds->last() : null,
            'totalVentas' => $ventaIds->count(),
        ];
    }

    /**
     * Calcular rango de créditos
     */
    private function calcularRangoCreditos($movimientosVenta)
    {
        $creditosIds = $movimientosVenta
            ->where('tipoPago.nombre', 'Crédito')
            ->pluck('venta_id')
            ->filter(fn($id) => !empty($id) && $id > 0)
            ->unique()
            ->sort();

        return [
            'minId' => $creditosIds->isNotEmpty() ? $creditosIds->first() : null,
            'maxId' => $creditosIds->isNotEmpty() ? $creditosIds->last() : null,
            'totalCreditos' => $creditosIds->count(),
            'montoCreditos' => $movimientosVenta
                ->where('tipoPago.nombre', 'Crédito')
                ->sum('monto'),
        ];
    }

    /**
     * Calcular rango de pagos
     */
    private function calcularRangoPagos($movimientos)
    {
        $pagosMovimientos = $movimientos->filter(fn($m) =>
            $m->tipoOperacion->codigo === 'PAGO' && $m->pago?->estado === 'REGISTRADO'
        );

        $pagosIds = $pagosMovimientos
            ->pluck('id')
            ->unique()
            ->sort();

        return [
            'minId' => $pagosIds->isNotEmpty() ? $pagosIds->first() : null,
            'maxId' => $pagosIds->isNotEmpty() ? $pagosIds->last() : null,
            'totalPagos' => $pagosIds->count(),
            'montoPagos' => $pagosMovimientos->sum('monto'),
        ];
    }

    /**
     * Calcular sumatoria TOTAL de ventas APROBADAS (todos los tipos de pago)
     */
    private function calcularVentasAprobadasTotal(AperturaCaja $aperturaCaja)
    {
        return DB::table('movimientos_caja')
            ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
            ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
            ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
            ->whereIn('tipo_operacion_caja.codigo', ['VENTA', 'CREDITO'])
            ->where('estados_documento.codigo', 'APROBADO')
            ->whereBetween('movimientos_caja.fecha', [$aperturaCaja->fecha, $this->fechaFin])
            ->sum('ventas.total');
    }

    /**
     * Calcular sumatoria de ventas APROBADAS en EFECTIVO
     */
    private function calcularVentasAprobadasEfectivo(AperturaCaja $aperturaCaja)
    {
        return DB::table('movimientos_caja')
            ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
            ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
            ->join('tipos_pago', 'movimientos_caja.tipo_pago_id', '=', 'tipos_pago.id')
            ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
            ->where('tipo_operacion_caja.codigo', 'VENTA')
            ->where('estados_documento.codigo', 'APROBADO')
            ->where('tipos_pago.codigo', 'EFECTIVO')
            ->whereBetween('movimientos_caja.fecha', [$aperturaCaja->fecha, $this->fechaFin])
            ->sum('ventas.total');
    }

    /**
     * Calcular sumatoria de ventas APROBADAS a CRÉDITO
     */
    private function calcularVentasAprobadasCredito(AperturaCaja $aperturaCaja)
    {
        try {
            $resultado = DB::table('movimientos_caja')
                ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
                ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
                ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
                ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
                ->where('tipo_operacion_caja.codigo', 'CREDITO')
                ->where('estados_documento.nombre', 'Aprobado')
                ->whereBetween('movimientos_caja.fecha', [$aperturaCaja->fecha, $this->fechaFin])
                ->sum('ventas.total');

            Log::info('💳 [calcularVentasAprobadasCredito]:', [
                'apertura_id' => $aperturaCaja->id,
                'total_credito' => $resultado,
            ]);

            return $resultado;
        } catch (\Exception $e) {
            Log::error('❌ [calcularVentasAprobadasCredito]:', [
                'apertura_id' => $aperturaCaja->id,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Calcular sumatoria de ventas anuladas
     */
    private function calcularVentasAnuladas(AperturaCaja $aperturaCaja)
    {
        return DB::table('movimientos_caja')
            ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
            ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
            ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
            ->where('tipo_operacion_caja.codigo', 'VENTA')
            ->where('estados_documento.codigo', 'ANULADO')
            ->whereBetween('movimientos_caja.fecha', [$aperturaCaja->fecha, $this->fechaFin])
            ->sum('ventas.total');
    }

    /**
     * ✅ Retorna ventas por tipo de pago incluyendo tipos de pago con $0
     */
    private function calcularVentasPorTipoPagoConTodos($ventasPorTipoPago)
    {
        try {
            $todosTiposPago = \App\Models\TipoPago::all()->pluck('nombre');

            $resultado = [];
            foreach ($todosTiposPago as $tipo) {
                $resultado[$tipo] = ['cantidad' => 0, 'total' => 0];
            }

            foreach ($ventasPorTipoPago as $tipo => $datos) {
                if (isset($resultado[$tipo])) {
                    $resultado[$tipo] = [
                        'cantidad' => $datos['cantidad'] ?? 0,
                        'total' => $datos['total'] ?? 0,
                    ];
                }
            }

            Log::info('✅ [calcularVentasPorTipoPagoConTodos]:', [
                'total_tipos' => count($resultado),
            ]);

            return $resultado;
        } catch (\Exception $e) {
            Log::error('❌ [calcularVentasPorTipoPagoConTodos]:', ['error' => $e->getMessage()]);
            return $ventasPorTipoPago;
        }
    }

    /**
     * ✅ NUEVO: Calcular sumatorias de ventas registradas en movimientos_caja por tipos de pago
     *
     * Agrupa las ventas APROBADAS por tipo de pago y retorna:
     * - cantidad: número de ventas
     * - total: suma de montos
     * - promedio_por_venta: total / cantidad
     */
    private function calcularSumatoriasVentasPorTipoPago($movimientos)
    {
        try {
            $resultado = $movimientos
                ->filter(function ($mov) {
                    // Solo ventas aprobadas
                    $estado = $mov->venta?->estadoDocumento?->nombre;
                    $tipoOp = $mov->tipoOperacion?->codigo;
                    return $estado === 'Aprobado' && $tipoOp === 'VENTA';
                })
                ->groupBy(fn($m) => $m->tipoPago?->nombre ?? 'Sin tipo de pago')
                ->map(function ($grupo) {
                    $cantidad = $grupo->count();
                    $total = (float) $grupo->sum('monto');
                    $promedio = $cantidad > 0 ? $total / $cantidad : 0;

                    return [
                        'tipo_pago' => $grupo->first()?->tipoPago?->nombre ?? 'Sin tipo de pago',
                        'cantidad' => $cantidad,
                        'total' => $total,
                        'promedio_por_venta' => round($promedio, 2),
                    ];
                })
                ->values();

            Log::info('✅ [calcularSumatoriasVentasPorTipoPago]:', [
                'tipos_pago' => $resultado->count(),
                'total_ventas' => $resultado->sum('cantidad'),
                'total_monto' => $resultado->sum('total'),
            ]);

            return $resultado;
        } catch (\Exception $e) {
            Log::error('❌ [calcularSumatoriasVentasPorTipoPago]:', ['error' => $e->getMessage()]);
            return collect();
        }
    }
}
