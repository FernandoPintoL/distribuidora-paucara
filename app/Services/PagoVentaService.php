<?php

namespace App\Services;

use App\Models\DetallePagoVenta;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;

class PagoVentaService
{
    public function registrarPagos(Venta $venta, array $pagos): array
    {
        return DB::transaction(function () use ($venta, $pagos) {
            // Validar que la suma de pagos coincida con el total
            $totalPagos = array_sum(array_column($pagos, 'monto'));

            if ($totalPagos != $venta->total) {
                throw new \Exception(
                    "Suma de pagos ({$totalPagos}) no coincide con el total de la venta ({$venta->total})"
                );
            }

            // Limpiar pagos anteriores si existen
            $venta->detallesPagoVenta()->delete();

            // Registrar nuevos pagos
            $detallesPago = [];
            foreach ($pagos as $pago) {
                $detallePago = DetallePagoVenta::create([
                    'venta_id' => $venta->id,
                    'tipo_pago_id' => $pago['tipo_pago_id'],
                    'monto' => $pago['monto'],
                    'referencia' => $pago['referencia'] ?? null,
                    'fecha_pago' => $pago['fecha_pago'] ?? now(),
                    'comprobante' => $pago['comprobante'] ?? null,
                    'observaciones' => $pago['observaciones'] ?? null,
                ]);

                $detallesPago[] = $detallePago;
            }

            // Actualizar monto_pagado en la venta
            $venta->update([
                'monto_pagado' => $totalPagos,
                'monto_pendiente' => $venta->total - $totalPagos,
            ]);

            return [
                'venta_id' => $venta->id,
                'total_venta' => $venta->total,
                'total_pagado' => $totalPagos,
                'monto_pendiente' => 0,
                'detalles_pago' => $detallesPago,
            ];
        });
    }

    public function obtenerResumenPagos(Venta $venta): array
    {
        $pagos = $venta->detallesPagoVenta()->with('tipoPago')->get();

        $resumen = [];
        foreach ($pagos as $pago) {
            if (!isset($resumen[$pago->tipoPago->codigo])) {
                $resumen[$pago->tipoPago->codigo] = [
                    'tipo_pago' => $pago->tipoPago->nombre,
                    'codigo' => $pago->tipoPago->codigo,
                    'cantidad' => 0,
                    'monto_total' => 0,
                ];
            }

            $resumen[$pago->tipoPago->codigo]['cantidad']++;
            $resumen[$pago->tipoPago->codigo]['monto_total'] += $pago->monto;
        }

        return array_values($resumen);
    }

    public function validarPagos(array $pagos): array
    {
        $errores = [];

        if (empty($pagos)) {
            $errores[] = 'Debe registrar al menos un método de pago';
        }

        foreach ($pagos as $index => $pago) {
            if (!isset($pago['tipo_pago_id'])) {
                $errores[] = "Pago {$index}: tipo_pago_id es requerido";
            }

            if (!isset($pago['monto']) || $pago['monto'] <= 0) {
                $errores[] = "Pago {$index}: monto debe ser mayor a 0";
            }
        }

        return $errores;
    }

    public function obtenerReporteCaja($fechaDesde, $fechaHasta): array
    {
        $pagos = DetallePagoVenta::whereHas('venta', function ($query) use ($fechaDesde, $fechaHasta) {
            $query->whereBetween('fecha', [$fechaDesde, $fechaHasta]);
        })
        ->with(['tipoPago', 'venta'])
        ->get();

        $reporte = [
            'fecha_desde' => $fechaDesde,
            'fecha_hasta' => $fechaHasta,
            'total_general' => 0,
            'por_tipo_pago' => [],
            'detalles' => [],
        ];

        foreach ($pagos as $pago) {
            $codigo = $pago->tipoPago->codigo;

            if (!isset($reporte['por_tipo_pago'][$codigo])) {
                $reporte['por_tipo_pago'][$codigo] = [
                    'tipo_pago' => $pago->tipoPago->nombre,
                    'total' => 0,
                    'cantidad_transacciones' => 0,
                ];
            }

            $reporte['por_tipo_pago'][$codigo]['total'] += $pago->monto;
            $reporte['por_tipo_pago'][$codigo]['cantidad_transacciones']++;
            $reporte['total_general'] += $pago->monto;

            $reporte['detalles'][] = [
                'venta_numero' => $pago->venta->numero,
                'tipo_pago' => $pago->tipoPago->nombre,
                'monto' => $pago->monto,
                'referencia' => $pago->referencia,
                'fecha_pago' => $pago->fecha_pago,
                'observaciones' => $pago->observaciones,
            ];
        }

        return $reporte;
    }
}
