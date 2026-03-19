<?php

namespace App\Services\Prestamos;

use App\Models\PrestamoCliente;
use App\Models\DevolucionClientePrestamo;
use App\Models\PrestableCondicion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PrestamoClienteService
 *
 * Gestiona préstamos y devoluciones de canastillas/embases a clientes
 */
class PrestamoClienteService
{
    private PrestableStockService $stockService;

    public function __construct(PrestableStockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Crear préstamo a cliente
     *
     * @param array $datos
     * {
     *   'prestable_id': int,
     *   'cliente_id': int,
     *   'venta_id': ?int,
     *   'chofer_id': ?int,
     *   'cantidad': int,
     *   'es_venta': bool,
     *   'precio_unitario': ?float,
     *   'precio_prestamo': ?float,
     *   'fecha_prestamo': date,
     *   'fecha_esperada_devolucion': ?date,
     * }
     */
    public function crearPrestamo(array $datos): PrestamoCliente|false
    {
        try {
            return DB::transaction(function () use ($datos) {
                // Obtener monto de garantía
                $montoGarantia = 0;
                if (!$datos['es_venta']) {
                    $condicion = PrestableCondicion::where('prestable_id', $datos['prestable_id'])->first();
                    if ($condicion) {
                        $montoGarantia = $datos['cantidad'] * $condicion->monto_garantia;
                    }
                }

                // Crear registro de préstamo
                $prestamo = PrestamoCliente::create([
                    'prestable_id' => $datos['prestable_id'],
                    'cliente_id' => $datos['cliente_id'],
                    'venta_id' => $datos['venta_id'] ?? null,
                    'chofer_id' => $datos['chofer_id'] ?? null,
                    'cantidad' => $datos['cantidad'],
                    'es_venta' => $datos['es_venta'],
                    'es_evento' => $datos['es_evento'] ?? false,
                    'precio_unitario' => $datos['precio_unitario'] ?? null,
                    'precio_prestamo' => $datos['precio_prestamo'] ?? null,
                    'monto_garantia' => $montoGarantia,
                    'fecha_prestamo' => $datos['fecha_prestamo'],
                    'fecha_esperada_devolucion' => $datos['fecha_esperada_devolucion'] ?? null,
                    'estado' => 'ACTIVO',
                ]);

                // Actualizar stock - Usar almacén 3 para canastillas
                $almacenId = 3;
                if ($datos['es_venta']) {
                    $this->stockService->venderAlCliente(
                        $datos['prestable_id'],
                        $almacenId,
                        $datos['cantidad']
                    );
                } else {
                    $this->stockService->prestarAlCliente(
                        $datos['prestable_id'],
                        $almacenId,
                        $datos['cantidad']
                    );
                }

                Log::info('✅ Préstamo creado', [
                    'prestamo_id' => $prestamo->id,
                    'cliente_id' => $datos['cliente_id'],
                    'cantidad' => $datos['cantidad'],
                    'es_venta' => $datos['es_venta'],
                ]);

                return $prestamo;
            });
        } catch (\Exception $e) {
            Log::error('❌ Error creando préstamo', [
                'error' => $e->getMessage(),
                'datos' => $datos,
            ]);
            return false;
        }
    }

    /**
     * Registrar devolución (parcial o total)
     *
     * @param array $datos
     * {
     *   'prestamo_cliente_id': int,
     *   'cantidad_devuelta': int,
     *   'cantidad_dañada_parcial': ?int = 0,
     *   'cantidad_dañada_total': ?int = 0,
     *   'observaciones': ?string,
     *   'chofer_id': ?int,
     *   'fecha_devolucion': date,
     * }
     */
    public function registrarDevolucion(array $datos): DevolucionClientePrestamo|false
    {
        try {
            return DB::transaction(function () use ($datos) {
                $prestamo = PrestamoCliente::find($datos['prestamo_cliente_id']);

                if (!$prestamo) {
                    throw new \Exception('Préstamo no encontrado');
                }

                $cantidadDañadaParcial = $datos['cantidad_dañada_parcial'] ?? 0;
                $cantidadDañadaTotal = $datos['cantidad_dañada_total'] ?? 0;
                $cantidadTotal = $datos['cantidad_devuelta'] + $cantidadDañadaParcial + $cantidadDañadaTotal;

                // Validar que no devuelve más de lo que pidió
                if ($cantidadTotal > $prestamo->cantidad) {
                    throw new \Exception('Cantidad devuelta excede cantidad prestada');
                }

                // Obtener condiciones para calcular montos por daño
                $condicion = PrestableCondicion::where('prestable_id', $prestamo->prestable_id)->first();
                $montoCobraDaño = 0;
                $montoGarantiaDevuelta = 0;

                if ($condicion) {
                    $montoCobraDaño = ($cantidadDañadaParcial * $condicion->monto_daño_parcial) +
                                      ($cantidadDañadaTotal * $condicion->monto_daño_total);

                    // Garantía devuelta solo para lo que está en buen estado
                    if ($datos['cantidad_devuelta'] > 0) {
                        $montoGarantiaDevuelta = $datos['cantidad_devuelta'] * $condicion->monto_garantia;
                    }
                }

                // Crear devolución
                $devolucion = DevolucionClientePrestamo::create([
                    'prestamo_cliente_id' => $datos['prestamo_cliente_id'],
                    'cantidad_devuelta' => $datos['cantidad_devuelta'],
                    'cantidad_dañada_parcial' => $cantidadDañadaParcial,
                    'cantidad_dañada_total' => $cantidadDañadaTotal,
                    'monto_cobrado_daño' => $montoCobraDaño,
                    'monto_garantia_devuelta' => $montoGarantiaDevuelta,
                    'observaciones' => $datos['observaciones'] ?? null,
                    'chofer_id' => $datos['chofer_id'] ?? null,
                    'fecha_devolucion' => $datos['fecha_devolucion'],
                ]);

                // Actualizar stock
                $this->stockService->devolverDelCliente(
                    $prestamo->prestable_id,
                    auth()->user()->empresa->almacen_id,
                    $datos['cantidad_devuelta'],
                    $cantidadDañadaParcial,
                    $cantidadDañadaTotal
                );

                // Actualizar estado del préstamo
                if ($cantidadTotal == $prestamo->cantidad) {
                    $prestamo->update(['estado' => 'COMPLETAMENTE_DEVUELTO']);
                } else {
                    $prestamo->update(['estado' => 'PARCIALMENTE_DEVUELTO']);
                }

                Log::info('✅ Devolución registrada', [
                    'devolucion_id' => $devolucion->id,
                    'prestamo_id' => $datos['prestamo_cliente_id'],
                    'cantidad_devuelta' => $datos['cantidad_devuelta'],
                    'daño_parcial' => $cantidadDañadaParcial,
                    'daño_total' => $cantidadDañadaTotal,
                    'cobro_daño' => $montoCobraDaño,
                ]);

                return $devolucion;
            });
        } catch (\Exception $e) {
            Log::error('❌ Error registrando devolución', [
                'error' => $e->getMessage(),
                'datos' => $datos,
            ]);
            return false;
        }
    }

    /**
     * Obtener préstamos activos de un cliente
     */
    public function obtenerPrestamosActivos(int $clienteId): array
    {
        return PrestamoCliente::where('cliente_id', $clienteId)
            ->where('estado', 'ACTIVO')
            ->with(['prestable', 'devoluciones'])
            ->get()
            ->toArray();
    }

    /**
     * Obtener devoluciones pendientes (sin registrar completamente)
     */
    public function obtenerPrestamosParaDevolver(int $choferId): array
    {
        return PrestamoCliente::where('chofer_id', $choferId)
            ->whereIn('estado', ['ACTIVO', 'PARCIALMENTE_DEVUELTO'])
            ->with(['cliente', 'prestable', 'devoluciones'])
            ->orderBy('fecha_esperada_devolucion')
            ->get()
            ->toArray();
    }

    /**
     * Obtener resumen de préstamo
     */
    public function obtenerResumen(int $prestamoId): array|false
    {
        $prestamo = PrestamoCliente::find($prestamoId);

        if (!$prestamo) {
            return false;
        }

        $cantidadDevuelta = DevolucionClientePrestamo::where('prestamo_cliente_id', $prestamoId)
            ->sum('cantidad_devuelta');

        $cantidadPendiente = $prestamo->cantidad - $cantidadDevuelta;

        return [
            'prestamo' => $prestamo,
            'cantidad_original' => $prestamo->cantidad,
            'cantidad_devuelta' => $cantidadDevuelta,
            'cantidad_pendiente' => $cantidadPendiente,
            'devoluciones' => $prestamo->devoluciones,
            'estado' => $prestamo->estado,
        ];
    }
}
