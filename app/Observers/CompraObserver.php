<?php
namespace App\Observers;

use App\Models\Compra;
use App\Models\CuentaPorPagar;
use App\Models\TipoPago;
use Carbon\Carbon;

class CompraObserver
{
    /**
     * Handle the Compra "created" event.
     */
    public function created(Compra $compra): void
    {
        $this->manejarCuentaPorPagar($compra);
    }

    /**
     * Handle the Compra "updated" event.
     */
    public function updated(Compra $compra): void
    {
        // Si cambió el estado a RECIBIDO y es compra a crédito
        if ($compra->wasChanged('estado_documento_id')) {
            $estadoRecibido = \App\Models\EstadoDocumento::where('codigo', 'RECIBIDO')->first();

            if ($compra->estado_documento_id == $estadoRecibido?->id) {
                $this->manejarCuentaPorPagar($compra);
            }
        }
    }

    /**
     * Manejar la creación de cuenta por pagar para compras a crédito
     */
    private function manejarCuentaPorPagar(Compra $compra): void
    {
        // Solo crear cuenta por pagar si es compra a crédito y está en estado RECIBIDO
        $tipoPagoCredito = TipoPago::where('codigo', 'CREDITO')->first();
        $estadoRecibido  = \App\Models\EstadoDocumento::where('codigo', 'RECIBIDO')->first();

        if ($compra->tipo_pago_id == $tipoPagoCredito?->id &&
            $compra->estado_documento_id == $estadoRecibido?->id) {

            // Verificar si ya existe una cuenta por pagar
            if (! $compra->cuentaPorPagar) {
                CuentaPorPagar::create([
                    'compra_id'         => $compra->id,
                    'monto_original'    => $compra->total,
                    'saldo_pendiente'   => $compra->total,
                    'fecha_vencimiento' => $this->calcularFechaVencimiento($compra),
                    'estado'            => 'PENDIENTE',
                ]);
            }
        }
    }

    /**
     * Calcular fecha de vencimiento (30 días por defecto)
     */
    private function calcularFechaVencimiento(Compra $compra): Carbon
    {
        // Por defecto 30 días, pero se puede configurar según el proveedor
        return Carbon::parse($compra->fecha)->addDays(30);
    }
}
