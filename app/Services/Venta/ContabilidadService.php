<?php

namespace App\Services\Venta;

use App\Models\AsientoContable;
use App\Models\DetalleAsientoContable;
use App\Models\Venta;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Illuminate\Support\Facades\Auth;

/**
 * ContabilidadService - Registros contables de operaciones
 *
 * Responsable de crear asientos contables para:
 * - Ventas
 * - Devoluciones
 * - Ajustes
 *
 * NOTA: No recibe transacción porque el caller ya está en una
 */
class ContabilidadService
{
    use ManagesTransactions, LogsOperations;

    /**
     * Crear asiento contable para una venta
     *
     * DEBE ser llamado DENTRO de una transacción
     *
     * Asiento típico de venta:
     * DEBE: Cuentas por Cobrar
     * HABER: Ingresos por Venta
     */
    public function crearAsientoVenta(Venta $venta): AsientoContable
    {
        // Obtener cuentas contables
        $cuentaPorCobrar = \App\Models\CuentaContable::where('codigo', '1205')->firstOrFail();
        $ingresoVenta = \App\Models\CuentaContable::where('codigo', '4105')->firstOrFail();

        // Crear asiento
        $asiento = AsientoContable::create([
            'numero' => $this->generarNumeroAsiento(),
            'fecha' => now(),
            'descripcion' => "Venta #{$venta->id}",
            'venta_id' => $venta->id,
            'usuario_id' => Auth::id(),
        ]);

        // Detalle DEBE: Cuentas por Cobrar
        DetalleAsientoContable::create([
            'asiento_contable_id' => $asiento->id,
            'cuenta_contable_id' => $cuentaPorCobrar->id,
            'tipo' => 'DEBE',
            'monto' => $venta->total,
        ]);

        // Detalle HABER: Ingresos por Venta
        DetalleAsientoContable::create([
            'asiento_contable_id' => $asiento->id,
            'cuenta_contable_id' => $ingresoVenta->id,
            'tipo' => 'HABER',
            'monto' => $venta->total,
        ]);

        $this->logSuccess('Asiento contable creado para venta', [
            'asiento_id' => $asiento->id,
            'venta_id' => $venta->id,
        ]);

        return $asiento;
    }

    /**
     * Generar número secuencial de asiento
     */
    private function generarNumeroAsiento(): string
    {
        $ultimo = AsientoContable::max('numero');
        $numero = (int) ($ultimo ?? 0) + 1;

        return str_pad($numero, 6, '0', STR_PAD_LEFT);
    }
}
