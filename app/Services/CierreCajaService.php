<?php

namespace App\Services;

use App\Models\AperturaCaja;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use Illuminate\Support\Facades\DB;

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
    /**
     * Calcular TODOS los datos necesarios para cierre de caja
     *
     * @param AperturaCaja $aperturaCaja
     * @return array Datos con todos los cálculos
     */
    public function calcularDatos(AperturaCaja $aperturaCaja): array
    {
        // 1️⃣ Cargar movimientos del período
        $movimientos = $this->obtenerMovimientos($aperturaCaja);

        // 2️⃣ Obtener movimientos de venta específicamente
        $movimientosVenta = $this->obtenerMovimientosVenta($aperturaCaja);

        // 3️⃣ Calcular totales básicos
        $totalIngresos = $movimientos->where('monto', '>', 0)->sum('monto');
        $totalEgresos = abs($movimientos->where('monto', '<', 0)->sum('monto'));

        // 4️⃣ Agrupar movimientos por tipo de operación
        $movimientosAgrupados = $this->agruparPorTipoOperacion($movimientos);

        // 5️⃣ Ventas por tipo de pago
        $ventasPorTipoPago = $this->calcularVentasPorTipoPago($movimientos);

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
        $pagosCreditos = $movimientos->where('tipoOperacion.nombre', 'Pago de Crédito')->count();
        $montoPagosCreditos = $movimientos->where('tipoOperacion.nombre', 'Pago de Crédito')->sum('monto');
        $rangoPagos = $this->calcularRangoPagos($movimientos);

        // 🎯 Retornar todos los datos calculados
        return [
            'apertura'                => $aperturaCaja,
            'cierre'                  => $aperturaCaja->cierre,
            'movimientos'             => $movimientos,
            'movimientosAgrupados'    => $movimientosAgrupados,
            'ventasPorTipoPago'       => $ventasPorTipoPago,
            'movimientosPorTipoPago'  => $movimientosPorTipoPago,
            'pagosCreditoPorTipoPago' => $pagosCreditoPorTipoPago,
            'gastosPorTipoPago'       => $gastosPorTipoPago,
            'ventasPorEstado'         => $ventasPorEstado,
            'efectivoEsperado'        => $efectivoEsperado,
            'totalIngresos'           => $totalIngresos,
            'totalEgresos'            => $totalEgresos,
            'primeraVenta'            => $rangoFechas['primeraVenta'],
            'ultimaVenta'             => $rangoFechas['ultimaVenta'],
            'primerMovimiento'        => $rangoFechas['primerMovimiento'],
            'ultimoMovimiento'        => $rangoFechas['ultimoMovimiento'],
            'rangoVentasIds'          => $rangoVentasIds,
            'rangoCreditos'           => $rangoCreditos,
            'pagosCreditos'           => $pagosCreditos,
            'montoPagosCreditos'      => $montoPagosCreditos,
            'rangoPagos'              => $rangoPagos,
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
                $aperturaCaja->cierre->created_at,
            ])
            ->with(['tipoOperacion', 'comprobantes', 'tipoPago'])
            ->orderBy('fecha', 'asc')
            ->get();
    }

    /**
     * Obtener solo movimientos de venta
     */
    private function obtenerMovimientosVenta(AperturaCaja $aperturaCaja)
    {
        $tipoOperacionVentaId = TipoOperacionCaja::where('nombre', 'Venta')->first()?->id;

        if (!$tipoOperacionVentaId) {
            return collect();
        }

        return MovimientoCaja::where('caja_id', $aperturaCaja->caja_id)
            ->whereBetween('fecha', [
                $aperturaCaja->fecha,
                $aperturaCaja->cierre->created_at,
            ])
            ->where('tipo_operacion_id', $tipoOperacionVentaId)
            ->with(['tipoPago'])
            ->get();
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
     * Calcular ventas por tipo de pago (SOLO VENTAS)
     */
    private function calcularVentasPorTipoPago($movimientos)
    {
        return $movimientos
            ->where('tipoOperacion.nombre', 'Venta')
            ->groupBy(function ($movimiento) {
                return $movimiento->tipoPago?->nombre ?? 'Sin tipo de pago';
            })->map(function ($movimientosGrupo) {
                return [
                    'cantidad' => $movimientosGrupo->count(),
                    'total' => $movimientosGrupo->sum('monto'),
                ];
            });
    }

    /**
     * Calcular TODOS los movimientos por tipo de pago
     */
    private function calcularMovimientosPorTipoPago($movimientos)
    {
        return $movimientos->groupBy(function ($movimiento) {
            return $movimiento->tipoPago?->nombre ?? 'Sin tipo de pago';
        })->map(function ($movimientosGrupo) {
            return [
                'cantidad' => $movimientosGrupo->count(),
                'total' => $movimientosGrupo->sum('monto'),
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
                    'tipo' => $movimientosGrupo->first()?->tipoPago?->nombre ?? 'Sin tipo',
                    'cantidad' => $movimientosGrupo->count(),
                    'total' => $movimientosGrupo->sum('monto'),
                ];
            })->values();
    }

    /**
     * Calcular gastos por tipo de pago
     */
    private function calcularGastosPorTipoPago($movimientos)
    {
        return $movimientos
            ->where('tipoOperacion.nombre', 'Gastos')
            ->groupBy(function ($movimiento) {
                return $movimiento->tipoPago?->nombre ?? 'Sin tipo de pago';
            })->map(function ($movimientosGrupo) {
                return [
                    'tipo' => $movimientosGrupo->first()?->tipoPago?->nombre ?? 'Sin tipo',
                    'cantidad' => $movimientosGrupo->count(),
                    'total' => $movimientosGrupo->sum('monto'),
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
                $aperturaCaja->cierre->created_at,
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
                    'total' => (float)($group->total ?? 0),
                    'count' => (int)($group->cantidad ?? 0),
                ];
            });
    }

    /**
     * Calcular efectivo esperado en caja
     */
    private function calcularEfectivoEsperado(AperturaCaja $aperturaCaja, $movimientos)
    {
        $montoApertura = $aperturaCaja->monto_apertura ?? 0;
        $ventasEfectivo = $movimientos
            ->where('tipoOperacion.nombre', 'Venta')
            ->where('tipoPago.nombre', 'Efectivo')
            ->sum('monto');
        $pagosCreditoEfectivo = $movimientos
            ->where('tipoOperacion.nombre', 'Pago de Crédito')
            ->where('tipoPago.nombre', 'Efectivo')
            ->sum('monto');
        $gastos = abs($movimientos
            ->where('tipoOperacion.nombre', 'Gastos')
            ->sum('monto'));

        return [
            'apertura' => $montoApertura,
            'ventas_efectivo' => $ventasEfectivo + $pagosCreditoEfectivo,
            'pagos_credito' => $pagosCreditoEfectivo,
            'gastos' => $gastos,
            'total' => $montoApertura + $ventasEfectivo + $pagosCreditoEfectivo - $gastos,
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
        $pagosMovimientos = $movimientos->filter(function($mov) {
            $nombre = $mov->tipoOperacion->nombre ?? '';
            return stripos($nombre, 'Pago') !== false;
        });

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
}
