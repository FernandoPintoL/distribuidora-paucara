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
 * Este servicio encapsula TODA la lógica de cálculos para que pueda ser
 * reutilizada desde controladores, vistas, APIs, componentes React, etc.
 *
 * USO:
 *   $servicio = new CierreCajaService();
 *   $datos = $servicio->calcularDatos($aperturaCaja);
 *   // $datos contiene todos los totales, agrupaciones, rangos, etc.
 */
class CierreCajaService
{
    protected $fechaFin;

    /**
     * Calcular TODOS los datos necesarios para cierre de caja
     *
     * @param AperturaCaja $aperturaCaja
     * @return array Datos con todos los cálculos
     */
    public function calcularDatos(AperturaCaja $aperturaCaja): array
    {
        // ✅ Calcular fecha fin (con cierre o fecha actual si aún está abierto)
        $this->fechaFin = $aperturaCaja->cierre?->created_at ?? now();

        // 1️⃣ Cargar movimientos del período
        $movimientos = $this->obtenerMovimientos($aperturaCaja);

        // 2️⃣ Obtener movimientos de venta específicamente
        $movimientosVenta = $this->obtenerMovimientosVenta($aperturaCaja);

        // 3️⃣ Calcular totales básicos
        // ✅ TotalIngresos: Ventas aprobadas (sin crédito) + Pagos de crédito realizados
        $ventasAprobadasEfectivo = $this->calcularVentasAprobadasEfectivo($aperturaCaja);
        $pagosCreditoTotales     = $movimientos->where('tipoOperacion.nombre', 'Pago de Crédito')->sum('monto');
        $totalIngresos           = $ventasAprobadasEfectivo + $pagosCreditoTotales;
        $totalEgresos            = abs($movimientos->where('monto', '<', 0)->sum('monto'));

        // 4️⃣ Agrupar movimientos por tipo de operación
        $movimientosAgrupados = $this->agruparPorTipoOperacion($movimientos);

        // 5️⃣ Ventas por tipo de pago
        $ventasPorTipoPago = $this->calcularVentasPorTipoPago($movimientos);

        // 5️⃣B ✅ Ventas por tipo de pago (INCLUYENDO CEROS)
        $ventasPorTipoPagoCompleto = $this->calcularVentasPorTipoPagoConTodos($ventasPorTipoPago);

        // 6️⃣ TODOS los movimientos por tipo de pago
        $movimientosPorTipoPago = $this->calcularMovimientosPorTipoPago($movimientos);

        // 7️⃣ Pagos de crédito por tipo de pago
        $pagosCreditoPorTipoPago = $this->calcularPagosCreditoPorTipoPago($movimientos);

        // 8️⃣ Gastos por tipo de pago
        $gastosPorTipoPago = $this->calcularGastosPorTipoPago($movimientos);

        // 9️⃣ Ventas por estado de documento
        $ventasPorEstado = $this->calcularVentasPorEstado($aperturaCaja);

        // 🔟 Efectivo esperado en caja
        $efectivoEsperado = $this->calcularEfectivoEsperado($aperturaCaja, $movimientos);

        // 1️⃣1️⃣ Rangos de fechas
        $rangoFechas = $this->calcularRangoFechas($movimientos, $movimientosVenta);

        // 1️⃣2️⃣ Rangos de IDs de ventas
        $rangoVentasIds = $this->calcularRangoVentasIds($movimientosVenta);

        // 1️⃣3️⃣ Rangos de créditos
        $rangoCreditos = $this->calcularRangoCreditos($movimientosVenta);

        // 1️⃣4️⃣ Rangos de pagos
        $pagosCreditos      = $movimientos->where('tipoOperacion.nombre', 'Pago de Crédito')->count();
        $montoPagosCreditos = $movimientos->where('tipoOperacion.nombre', 'Pago de Crédito')->sum('monto');
        $rangoPagos         = $this->calcularRangoPagos($movimientos);

        // 1️⃣5️⃣ SUMATORIA TOTAL DE VENTAS APROBADAS (todos los tipos de pago)
        $sumatorialVentas = $this->calcularVentasAprobadasTotal($aperturaCaja);

        // 1️⃣5️⃣B SUMATORIA DE VENTAS APROBADAS EN EFECTIVO (excluyendo crédito)
        $sumatorialVentasEfectivo = $this->calcularVentasAprobadasEfectivo($aperturaCaja);

        // 1️⃣5️⃣C SUMATORIA DE VENTAS APROBADAS A CRÉDITO
        $sumatorialVentasCredito = $this->calcularVentasAprobadasCredito($aperturaCaja);

        // 1️⃣6️⃣ SUMATORIA TOTAL DE GASTOS (sin agrupación)
        $sumatorialGastos = abs($movimientos
                ->where('tipoOperacion.nombre', 'Gastos')
                ->sum('monto'));

        // 1️⃣7️⃣ SUMATORIA DE VENTAS ANULADAS
        $sumatorialVentasAnuladas = $this->calcularVentasAnuladas($aperturaCaja);

        // 🎯 Retornar todos los datos calculados
        return [
            'apertura'                 => $aperturaCaja,
            'cierre'                   => $aperturaCaja->cierre,
            'movimientos'              => $movimientos,
            'movimientosAgrupados'     => $movimientosAgrupados,
            'ventasPorTipoPago'        => $ventasPorTipoPago,
            'ventasPorTipoPagoCompleto' => $ventasPorTipoPagoCompleto, // ✅ Incluye ceros
            'movimientosPorTipoPago'   => $movimientosPorTipoPago,
            'pagosCreditoPorTipoPago'  => $pagosCreditoPorTipoPago,
            'gastosPorTipoPago'        => $gastosPorTipoPago,
            'ventasPorEstado'          => $ventasPorEstado,
            'efectivoEsperado'         => $efectivoEsperado,
            'totalIngresos'            => $totalIngresos,
            'totalEgresos'             => $totalEgresos,
            'primeraVenta'             => $rangoFechas['primeraVenta'],
            'ultimaVenta'              => $rangoFechas['ultimaVenta'],
            'primerMovimiento'         => $rangoFechas['primerMovimiento'],
            'ultimoMovimiento'         => $rangoFechas['ultimoMovimiento'],
            'rangoVentasIds'           => $rangoVentasIds,
            'rangoCreditos'            => $rangoCreditos,
            'pagosCreditos'            => $pagosCreditos,
            'montoPagosCreditos'       => $montoPagosCreditos,
            'rangoPagos'               => $rangoPagos,
            // 💰 SUMATORIAS TOTALES (sin agrupación)
            'sumatorialVentas'                    => $sumatorialVentas,
            'ventasTotalAprobadas'                => $sumatorialVentas, // ✅ Alias explícito
            'sumatorialVentasEfectivo'            => $sumatorialVentasEfectivo,
            'sumatorialVentasCredito'             => $sumatorialVentasCredito,
            'sumatorialGastos'                    => $sumatorialGastos,
            'sumatorialVentasAnuladas'            => $sumatorialVentasAnuladas,
            'ventasTotales'                       => $sumatorialVentasEfectivo + $sumatorialVentasCredito,
        ];
    }

    /**
     * Obtener movimientos del período
     */
    private function obtenerMovimientos(AperturaCaja $aperturaCaja)
    {
        return MovimientoCaja::where('caja_id', $aperturaCaja->caja_id)
            ->whereBetween('fecha', [
                $aperturaCaja->fecha,
                $this->fechaFin,
            ])
            ->with(['tipoOperacion', 'comprobantes', 'tipoPago', 'venta.estadoDocumento'])
            ->orderBy('fecha', 'asc')
            ->get();
    }

    /**
     * Obtener solo movimientos de venta APROBADAS
     */
    private function obtenerMovimientosVenta(AperturaCaja $aperturaCaja)
    {
        $tipoOperacionVentaId = TipoOperacionCaja::where('nombre', 'Venta')->first()?->id;

        if (! $tipoOperacionVentaId) {
            return collect();
        }

        return MovimientoCaja::where('caja_id', $aperturaCaja->caja_id)
            ->whereBetween('fecha', [
                $aperturaCaja->fecha,
                $this->fechaFin,
            ])
            ->where('tipo_operacion_id', $tipoOperacionVentaId)
            ->with(['tipoPago', 'venta.estadoDocumento'])
            ->get()
            ->filter(function ($movimiento) {
                // ✅ Solo ventas aprobadas
                $estado = $movimiento->venta?->estadoDocumento?->nombre;
                return $estado === 'Aprobado';
            });
    }

    /**
     * Agrupar movimientos por tipo de operación
     */
    private function agruparPorTipoOperacion($movimientos)
    {
        return $movimientos->groupBy(function ($mov) {
            return $mov->tipoOperacion->nombre ?? 'Sin tipo';
        });
    }

    /**
     * Calcular ventas por tipo de pago (SOLO VENTAS APROBADAS)
     */
    private function calcularVentasPorTipoPago($movimientos)
    {
        // ✅ MEJORADO: Incluye VENTA y CREDITO (ambos tipos de operación)
        $resultado = $movimientos
            ->filter(function ($movimiento) {
                // ✅ Solo ventas APROBADAS (excluye anuladas, pendientes, etc.)
                $estado = $movimiento->venta?->estadoDocumento?->nombre;
                if ($estado !== 'Aprobado') {
                    return false;
                }

                // ✅ Incluye tanto VENTA como CREDITO
                $tipoOp = $movimiento->tipoOperacion?->nombre;
                return in_array($tipoOp, ['Venta', 'Crédito Otorgado']);
            })
            ->groupBy(function ($movimiento) {
                return $movimiento->tipoPago?->nombre ?? 'Sin tipo de pago';
            })->map(function ($movimientosGrupo) {
            return [
                'cantidad' => $movimientosGrupo->count(),
                'total'    => $movimientosGrupo->sum('monto'),
            ];
        });

        Log::info('📊 [calcularVentasPorTipoPago] Desglose (VENTA + CREDITO):', $resultado->toArray());

        return $resultado;
    }

    /**
     * Calcular movimientos por tipo de pago (SOLO VENTAS APROBADAS + PAGOS + GASTOS)
     */
    private function calcularMovimientosPorTipoPago($movimientos)
    {
        return $movimientos->filter(function ($movimiento) {
            // ✅ Para ventas: solo aprobadas
            // ✅ Para otros movimientos (Pagos, Gastos): todos
            if ($movimiento->tipoOperacion->nombre === 'Venta') {
                $estado = $movimiento->venta?->estadoDocumento?->nombre;
                return $estado === 'Aprobado';
            }
            return true; // Pagos, Gastos, etc. se incluyen todos
        })->groupBy(function ($movimiento) {
            return $movimiento->tipoPago?->nombre ?? 'Sin tipo de pago';
        })->map(function ($movimientosGrupo) {
            return [
                'cantidad' => $movimientosGrupo->count(),
                'total'    => $movimientosGrupo->sum('monto'),
            ];
        });
    }

    /**
     * Calcular pagos de crédito por tipo de pago
     */
    private function calcularPagosCreditoPorTipoPago($movimientos)
    {
        return $movimientos
            ->where('tipoOperacion.nombre', 'Pago de Crédito')
            ->groupBy(function ($movimiento) {
                return $movimiento->tipoPago?->nombre ?? 'Sin tipo de pago';
            })->map(function ($movimientosGrupo) {
            return [
                'tipo'     => $movimientosGrupo->first()?->tipoPago?->nombre ?? 'Sin tipo',
                'cantidad' => $movimientosGrupo->count(),
                'total'    => $movimientosGrupo->sum('monto'),
            ];
        })->values();
    }

    /**
     * Calcular gastos por tipo de pago
     */
    private function calcularGastosPorTipoPago($movimientos)
    {
        return $movimientos
            ->where('tipoOperacion.codigo', 'GASTOS')
            ->groupBy(function ($movimiento) {
                return $movimiento->tipoPago?->nombre ?? 'Sin tipo de pago';
            })->map(function ($movimientosGrupo) {
            return [
                'tipo'     => $movimientosGrupo->first()?->tipoPago?->nombre ?? 'Sin tipo',
                'cantidad' => $movimientosGrupo->count(),
                'total'    => $movimientosGrupo->sum('monto'),
            ];
        })->values();
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
            ->whereBetween('movimientos_caja.fecha', [
                $aperturaCaja->fecha,
                $this->fechaFin,
            ])
            ->groupBy('estados_documento.id', 'estados_documento.nombre')
            ->select(
                'estados_documento.nombre as estado',
                DB::raw('COUNT(DISTINCT ventas.id) as cantidad'),
                DB::raw('SUM(ventas.total) as total')
            )
            ->get()
            ->map(function ($group) {
                return [
                    'estado' => $group->estado ?? 'Sin estado',
                    'total'  => (float) ($group->total ?? 0),
                    'count'  => (int) ($group->cantidad ?? 0),
                ];
            });
    }

    /**
     * Calcular efectivo esperado en caja
     */
    private function calcularEfectivoEsperado(AperturaCaja $aperturaCaja, $movimientos)
    {
        $montoApertura = $aperturaCaja->monto_apertura ?? 0;

        // ✅ Solo ventas APROBADAS en efectivo
        $ventasEfectivo = $movimientos
            ->where('tipoOperacion.codigo', 'VENTA')
            ->where('tipoPago.nombre', 'Efectivo')
            ->filter(function ($movimiento) {
                $estado = $movimiento->venta?->estadoDocumento?->nombre;
                return $estado === 'Aprobado';
            })
            ->sum('monto');

        $ventasAnuladas = $movimientos
            ->where('tipoOperacion.codigo', 'VENTA')
            ->where('tipoPago.nombre', 'Efectivo')
            ->filter(function ($movimiento) {
                $estado = $movimiento->venta?->estadoDocumento?->nombre;
                return $estado === 'Anulado';
            })
            ->sum('monto');
        // pagos de credito
        $pagosCreditoAll = $movimientos
            ->where('tipoOperacion.codigo', 'PAGO')
            ->sum('monto');

        $pagosCreditoEfectivo = $movimientos
            ->where('tipoOperacion.codigo', 'PAGO')
            ->where('tipoPago.nombre', 'Efectivo')
            ->sum('monto');

        $gastos = abs($movimientos
                ->where('tipoOperacion.codigo', 'GASTOS')
                ->sum('monto'));

        return [
            'apertura'          => $montoApertura,
            'ventas_efectivo'   => $ventasEfectivo,
            'ventas_anuladas'   => $ventasAnuladas,
            'pagos_credito'     => $pagosCreditoEfectivo,
            'pagos_credito_all' => $pagosCreditoAll,
            'gastos'            => $gastos,
            'total'             => $montoApertura + $ventasEfectivo + $pagosCreditoEfectivo - $gastos,
        ];
    }

    /**
     * Calcular rango de fechas
     */
    private function calcularRangoFechas($movimientos, $movimientosVenta)
    {
        return [
            'primeraVenta'     => $movimientosVenta->min('fecha'),
            'ultimaVenta'      => $movimientosVenta->max('fecha'),
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
            ->filter(fn($id) => ! empty($id) && $id > 0)
            ->unique()
            ->sort();

        return [
            'minId'       => $ventaIds->isNotEmpty() ? $ventaIds->first() : null,
            'maxId'       => $ventaIds->isNotEmpty() ? $ventaIds->last() : null,
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
            ->filter(fn($id) => ! empty($id) && $id > 0)
            ->unique()
            ->sort();

        return [
            'minId'         => $creditosIds->isNotEmpty() ? $creditosIds->first() : null,
            'maxId'         => $creditosIds->isNotEmpty() ? $creditosIds->last() : null,
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
        $pagosMovimientos = $movimientos->filter(function ($mov) {
            $nombre = $mov->tipoOperacion->nombre ?? '';
            return stripos($nombre, 'Pago') !== false;
        });

        $pagosIds = $pagosMovimientos
            ->pluck('id')
            ->unique()
            ->sort();

        return [
            'minId'      => $pagosIds->isNotEmpty() ? $pagosIds->first() : null,
            'maxId'      => $pagosIds->isNotEmpty() ? $pagosIds->last() : null,
            'totalPagos' => $pagosIds->count(),
            'montoPagos' => $pagosMovimientos->sum('monto'),
        ];
    }

    /**
     * Calcular sumatoria TOTAL de ventas APROBADAS (todos los tipos de pago)
     */
    private function calcularVentasAprobadasTotal(AperturaCaja $aperturaCaja)
    {
        // ✅ MEJORADO: Incluye VENTA directa + CRÉDITO (ambos tipos de operación)
        return DB::table('movimientos_caja')
            ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
            ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
            ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
            ->whereIn('tipo_operacion_caja.codigo', ['VENTA', 'CREDITO']) // ← INCLUYE AMBOS
            ->where('estados_documento.nombre', 'Aprobado') // ← SOLO APROBADAS
            ->whereBetween('movimientos_caja.fecha', [
                $aperturaCaja->fecha,
                $this->fechaFin,
            ])
            ->sum('ventas.total');
    }

    /**
     * Calcular sumatoria de ventas APROBADAS en EFECTIVO (excluyendo crédito)
     */
    private function calcularVentasAprobadasEfectivo(AperturaCaja $aperturaCaja)
    {
        // ✅ MEJORADO: Solo VENTA en EFECTIVO (no CREDITO)
        return DB::table('movimientos_caja')
            ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
            ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
            ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
            ->join('tipos_pago', 'movimientos_caja.tipo_pago_id', '=', 'tipos_pago.id')
            ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
            ->where('tipo_operacion_caja.codigo', 'VENTA')    // ← SOLO VENTA DIRECTA
            ->where('estados_documento.nombre', 'Aprobado')   // ← SOLO APROBADAS
            ->where('tipos_pago.nombre', 'Efectivo')          // ← SOLO EFECTIVO
            ->whereBetween('movimientos_caja.fecha', [
                $aperturaCaja->fecha,
                $this->fechaFin,
            ])
            ->sum('ventas.total');
    }

    /**
     * Calcular sumatoria de ventas APROBADAS a CRÉDITO
     */
    private function calcularVentasAprobadasCredito(AperturaCaja $aperturaCaja)
    {
        try {
            // ✅ MEJORADO: Busca por tipo de operación CREDITO (no VENTA)
            $resultado = DB::table('movimientos_caja')
                ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
                ->join('tipo_operacion_caja', 'movimientos_caja.tipo_operacion_id', '=', 'tipo_operacion_caja.id')
                ->join('estados_documento', 'ventas.estado_documento_id', '=', 'estados_documento.id')
                ->where('movimientos_caja.caja_id', $aperturaCaja->caja_id)
                ->where('tipo_operacion_caja.codigo', 'CREDITO')  // ← BUSCA CREDITO, NO VENTA
                ->where('estados_documento.nombre', 'Aprobado')   // ← SOLO APROBADAS
                ->whereBetween('movimientos_caja.fecha', [
                    $aperturaCaja->fecha,
                    $this->fechaFin,
                ])
                ->sum('ventas.total');

            Log::info('💳 [calcularVentasAprobadasCredito] Resultado:', [
                'apertura_id'   => $aperturaCaja->id,
                'total_credito' => $resultado,
                'fecha_inicio'  => $aperturaCaja->fecha,
                'fecha_fin'     => $this->fechaFin,
            ]);

            return $resultado;
        } catch (\Exception $e) {
            Log::error('❌ [calcularVentasAprobadasCredito] ERROR:', [
                'apertura_id' => $aperturaCaja->id,
                'error'       => $e->getMessage(),
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
            ->where('estados_documento.nombre', 'Anulado') // ← SOLO ANULADAS
            ->whereBetween('movimientos_caja.fecha', [
                $aperturaCaja->fecha,
                $this->fechaFin,
            ])
            ->sum('ventas.total');
    }

    /**
     * ✅ NUEVO: Retorna ventas por tipo de pago incluyendo tipos de pago con $0
     *
     * @param Collection $ventasPorTipoPago Datos con solo tipos de pago que tienen ventas
     * @return array Todos los tipos de pago (incluyendo ceros)
     */
    private function calcularVentasPorTipoPagoConTodos($ventasPorTipoPago)
    {
        try {
            // 1️⃣ Obtener TODOS los tipos de pago disponibles de la BD
            $todosTiposPago = \App\Models\TipoPago::all()->pluck('nombre');

            // 2️⃣ Crear array con todos los tipos y sus valores (defaulteando a 0)
            $resultado = [];
            foreach ($todosTiposPago as $tipo) {
                $resultado[$tipo] = [
                    'cantidad' => 0,
                    'total'    => 0,
                ];
            }

            // 3️⃣ Llenar con los valores reales donde existan
            foreach ($ventasPorTipoPago as $tipo => $datos) {
                if (isset($resultado[$tipo])) {
                    $resultado[$tipo] = [
                        'cantidad' => $datos['cantidad'] ?? 0,
                        'total'    => $datos['total'] ?? 0,
                    ];
                }
            }

            Log::info('✅ [calcularVentasPorTipoPagoConTodos] Todos los tipos de pago:', [
                'total_tipos' => count($resultado),
                'datos' => $resultado,
            ]);

            return $resultado;
        } catch (\Exception $e) {
            Log::error('❌ [calcularVentasPorTipoPagoConTodos] ERROR:', [
                'error' => $e->getMessage(),
            ]);

            // En caso de error, retornar lo que se pueda
            return $ventasPorTipoPago;
        }
    }
}
