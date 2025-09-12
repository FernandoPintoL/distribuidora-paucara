<?php

namespace App\Observers;

use App\Models\Compra;
use App\Models\CuentaPorPagar;
use App\Models\TipoPago;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        // Si cambió el estado a RECIBIDO
        if ($compra->wasChanged('estado_documento_id')) {
            $estadoRecibido = \App\Models\EstadoDocumento::where('codigo', 'RECIBIDO')->first();

            if ($compra->estado_documento_id == $estadoRecibido?->id) {
                // Manejar cuenta por pagar para créditos
                $this->manejarCuentaPorPagar($compra);

                // 🔥 ACTUALIZAR STOCK AL RECIBIR LA MERCADERÍA
                $this->actualizarStockAlRecibir($compra);
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
        $estadoRecibido = \App\Models\EstadoDocumento::where('codigo', 'RECIBIDO')->first();

        if ($compra->tipo_pago_id == $tipoPagoCredito?->id &&
            $compra->estado_documento_id == $estadoRecibido?->id) {

            // Verificar si ya existe una cuenta por pagar
            if (! $compra->cuentaPorPagar) {
                CuentaPorPagar::create([
                    'compra_id' => $compra->id,
                    'monto_original' => $compra->total,
                    'saldo_pendiente' => $compra->total,
                    'fecha_vencimiento' => $this->calcularFechaVencimiento($compra),
                    'estado' => 'PENDIENTE',
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

    /**
     * 🔥 ACTUALIZAR STOCK AL RECIBIR MERCADERÍA
     */
    private function actualizarStockAlRecibir(Compra $compra): void
    {
        try {
            DB::transaction(function () use ($compra) {
                foreach ($compra->detalleCompras as $detalle) {
                    $this->actualizarStockProducto($detalle);
                }
            });
        } catch (\Exception $e) {
            Log::error('Error actualizando stock al recibir compra: '.$e->getMessage(), [
                'compra_id' => $compra->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Actualizar stock de un producto específico
     */
    private function actualizarStockProducto($detalleCompra): void
    {
        $producto = $detalleCompra->producto;

        // Obtener almacén de destino (puedes hacer esto configurable)
        $almacenPrincipal = \App\Models\Almacen::where('nombre', 'LIKE', '%principal%')
            ->orWhere('nombre', 'LIKE', '%general%')
            ->first();

        if (! $almacenPrincipal) {
            $almacenPrincipal = \App\Models\Almacen::first();
        }

        if (! $almacenPrincipal) {
            throw new \Exception('No hay almacenes configurados');
        }

        // Buscar o crear registro de stock
        $stockProducto = \App\Models\StockProducto::firstOrCreate(
            [
                'producto_id' => $producto->id,
                'almacen_id' => $almacenPrincipal->id,
                'lote' => $detalleCompra->lote ?? '',
            ],
            [
                'cantidad' => 0,
                'cantidad_disponible' => 0,
                'cantidad_reservada' => 0,
                'fecha_vencimiento' => $detalleCompra->fecha_vencimiento,
                'fecha_actualizacion' => now(),
            ]
        );

        // Guardar cantidad anterior para el movimiento
        $cantidadAnterior = $stockProducto->cantidad;

        // Actualizar cantidades
        $stockProducto->cantidad += $detalleCompra->cantidad;
        $stockProducto->cantidad_disponible += $detalleCompra->cantidad;
        $stockProducto->fecha_actualizacion = now();

        // Si hay fecha de vencimiento en el detalle, actualizarla
        if ($detalleCompra->fecha_vencimiento) {
            $stockProducto->fecha_vencimiento = $detalleCompra->fecha_vencimiento;
        }

        $stockProducto->save();

        // 📝 REGISTRAR MOVIMIENTO DE INVENTARIO
        \App\Models\MovimientoInventario::create([
            'stock_producto_id' => $stockProducto->id,
            'cantidad' => $detalleCompra->cantidad,
            'cantidad_anterior' => $cantidadAnterior,
            'cantidad_posterior' => $stockProducto->cantidad,
            'tipo' => 'ENTRADA_COMPRA',
            'observacion' => "Entrada por compra #{$detalleCompra->compra->numero}",
            'numero_documento' => $detalleCompra->compra->numero,
            'user_id' => Auth::id() ?? $detalleCompra->compra->usuario_id,
            'fecha' => now(),
        ]);
    }
}
