<?php

namespace App\Services\Prestamos;

use App\Models\PrestamoCliente;
use App\Models\PrestamoClienteDetalle;
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
     * Crear préstamo a cliente con múltiples detalles
     *
     * @param array $datos
     * {
     *   'cliente_id': int,
     *   'venta_id': ?int,
     *   'chofer_id': ?int,
     *   'es_venta': bool,
     *   'es_evento': ?bool,
     *   'monto_garantia': ?float,
     *   'fecha_prestamo': date,
     *   'fecha_esperada_devolucion': ?date,
     *   'observaciones': ?string,
     *   'detalles': [
     *     {
     *       'prestable_id': int,
     *       'cantidad': int,
     *       'precio_unitario': ?float,
     *       'precio_prestamo': ?float,
     *     },
     *     ...
     *   ]
     * }
     */
    public function crearPrestamo(array $datos): PrestamoCliente|false
    {
        try {
            return DB::transaction(function () use ($datos) {
                // Usar monto de garantía enviado por el usuario
                $montoGarantia = (float) ($datos['monto_garantia'] ?? 0);

                // Crear registro encabezado de préstamo
                $prestamo = PrestamoCliente::create([
                    'cliente_id' => $datos['cliente_id'],
                    'venta_id' => $datos['venta_id'] ?? null,
                    'chofer_id' => $datos['chofer_id'] ?? null,
                    'es_venta' => $datos['es_venta'],
                    'es_evento' => $datos['es_evento'] ?? false,
                    'monto_garantia' => $montoGarantia,
                    'fecha_prestamo' => $datos['fecha_prestamo'],
                    'fecha_esperada_devolucion' => $datos['fecha_esperada_devolucion'] ?? null,
                    'observaciones' => $datos['observaciones'] ?? null,
                    'estado' => 'ACTIVO',
                ]);

                // Crear detalles y actualizar stock
                $almacenId = 3; // Almacén para canastillas
                $detalles = $datos['detalles'] ?? [];

                foreach ($detalles as $detalle) {
                    PrestamoClienteDetalle::create([
                        'prestamo_cliente_id' => $prestamo->id,
                        'prestable_id' => $detalle['prestable_id'],
                        'cantidad_prestada' => $detalle['cantidad'],
                        'precio_unitario' => $detalle['precio_unitario'] ?? null,
                        'precio_prestamo' => $detalle['precio_prestamo'] ?? null,
                        'estado' => 'ACTIVO',
                    ]);

                    // Actualizar stock para cada detalle
                    if ($datos['es_venta']) {
                        $this->stockService->venderAlCliente(
                            $detalle['prestable_id'],
                            $almacenId,
                            $detalle['cantidad']
                        );
                    } else {
                        $this->stockService->prestarAlCliente(
                            $detalle['prestable_id'],
                            $almacenId,
                            $detalle['cantidad']
                        );
                    }
                }

                Log::info('✅ Préstamo creado', [
                    'prestamo_id' => $prestamo->id,
                    'cliente_id' => $datos['cliente_id'],
                    'cantidad_detalles' => count($detalles),
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
     * Registrar devolución (parcial o total) por detalle
     *
     * @param array $datos
     * {
     *   'prestamo_cliente_detalle_id': int,
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
                $detalle = PrestamoClienteDetalle::find($datos['prestamo_cliente_detalle_id']);

                if (!$detalle) {
                    throw new \Exception('Detalle de préstamo no encontrado');
                }

                $cantidadDañadaParcial = $datos['cantidad_dañada_parcial'] ?? 0;
                $cantidadDañadaTotal = $datos['cantidad_dañada_total'] ?? 0;
                $cantidadTotal = $datos['cantidad_devuelta'] + $cantidadDañadaParcial + $cantidadDañadaTotal;

                // Validar que no devuelve más de lo que pidió
                if ($cantidadTotal > $detalle->cantidad_prestada) {
                    throw new \Exception('Cantidad devuelta excede cantidad prestada');
                }

                // Obtener condiciones para calcular montos por daño
                $condicion = PrestableCondicion::where('prestable_id', $detalle->prestable_id)->first();
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
                    'prestamo_cliente_detalle_id' => $datos['prestamo_cliente_detalle_id'],
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
                    $detalle->prestable_id,
                    auth()->user()->empresa->almacen_id,
                    $datos['cantidad_devuelta'],
                    $cantidadDañadaParcial,
                    $cantidadDañadaTotal
                );

                // Actualizar estado del detalle
                if ($cantidadTotal == $detalle->cantidad_prestada) {
                    $detalle->update(['estado' => 'COMPLETAMENTE_DEVUELTO']);
                } else {
                    $detalle->update(['estado' => 'PARCIALMENTE_DEVUELTO']);
                }

                // Actualizar estado del encabezado si todos los detalles están devueltos
                $prestamo = $detalle->prestamo;
                $todosDevueltos = $prestamo->detalles()
                    ->where('estado', '!=', 'COMPLETAMENTE_DEVUELTO')
                    ->count() === 0;

                if ($todosDevueltos) {
                    $prestamo->update(['estado' => 'COMPLETAMENTE_DEVUELTO']);
                } else {
                    $prestamo->update(['estado' => 'PARCIALMENTE_DEVUELTO']);
                }

                Log::info('✅ Devolución registrada', [
                    'devolucion_id' => $devolucion->id,
                    'detalle_id' => $datos['prestamo_cliente_detalle_id'],
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
            ->with(['detalles.prestable', 'devoluciones'])
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
            ->with(['cliente', 'detalles.prestable', 'devoluciones'])
            ->orderBy('fecha_esperada_devolucion')
            ->get()
            ->toArray();
    }

    /**
     * Obtener resumen de préstamo (por detalle)
     */
    public function obtenerResumenDetalle(int $detalleId): array|false
    {
        $detalle = PrestamoClienteDetalle::find($detalleId);

        if (!$detalle) {
            return false;
        }

        $cantidadDevuelta = $detalle->devoluciones()
            ->sum('cantidad_devuelta');

        $cantidadPendiente = $detalle->cantidad_prestada - $cantidadDevuelta;

        return [
            'detalle' => $detalle,
            'cantidad_original' => $detalle->cantidad_prestada,
            'cantidad_devuelta' => $cantidadDevuelta,
            'cantidad_pendiente' => $cantidadPendiente,
            'devoluciones' => $detalle->devoluciones,
            'estado' => $detalle->estado,
        ];
    }

    /**
     * Obtener resumen de préstamo (encabezado, con todos sus detalles)
     */
    public function obtenerResumenPrestamo(int $prestamoId): array|false
    {
        $prestamo = PrestamoCliente::with(['detalles.devoluciones'])->find($prestamoId);

        if (!$prestamo) {
            return false;
        }

        $cantidadTotalOriginal = 0;
        $cantidadTotalDevuelta = 0;
        $detallesResumen = [];

        foreach ($prestamo->detalles as $detalle) {
            $cantidadDevueltaDetalle = $detalle->devoluciones->sum('cantidad_devuelta');
            $cantidadTotalOriginal += $detalle->cantidad_prestada;
            $cantidadTotalDevuelta += $cantidadDevueltaDetalle;

            $detallesResumen[] = [
                'detalle' => $detalle,
                'cantidad_devuelta' => $cantidadDevueltaDetalle,
                'cantidad_pendiente' => $detalle->cantidad_prestada - $cantidadDevueltaDetalle,
                'devoluciones' => $detalle->devoluciones,
            ];
        }

        return [
            'prestamo' => $prestamo,
            'cantidad_total_original' => $cantidadTotalOriginal,
            'cantidad_total_devuelta' => $cantidadTotalDevuelta,
            'cantidad_total_pendiente' => $cantidadTotalOriginal - $cantidadTotalDevuelta,
            'detalles_resumen' => $detallesResumen,
            'estado' => $prestamo->estado,
        ];
    }

    /**
     * Anular préstamo - cancela y devuelve stock al almacén
     *
     * @param int $prestamoId
     * @param ?string $razonAnulacion
     */
    public function anularPrestamo(int $prestamoId, ?string $razonAnulacion = null): PrestamoCliente|false
    {
        try {
            return DB::transaction(function () use ($prestamoId, $razonAnulacion) {
                $prestamo = PrestamoCliente::with('detalles')->find($prestamoId);

                if (!$prestamo) {
                    throw new \Exception('Préstamo no encontrado');
                }

                if ($prestamo->estado === 'CANCELADO') {
                    throw new \Exception('El préstamo ya está cancelado');
                }

                // Devolver stock para cada detalle
                $almacenId = 3; // Almacén para canastillas

                foreach ($prestamo->detalles as $detalle) {
                    // Si el detalle aún no está completamente devuelto, devolver lo que falta
                    if ($detalle->estado !== 'COMPLETAMENTE_DEVUELTO') {
                        // Calcular cantidad pendiente de devolver
                        $cantidadDevuelta = $detalle->devoluciones()
                            ->sum('cantidad_devuelta');
                        $cantidadPendiente = $detalle->cantidad_prestada - $cantidadDevuelta;

                        if ($cantidadPendiente > 0) {
                            // Devolver como cantidad en buen estado
                            $this->stockService->devolverDelCliente(
                                $detalle->prestable_id,
                                $almacenId,
                                $cantidadPendiente,
                                0, // sin daño parcial
                                0  // sin daño total
                            );
                        }
                    }

                    // Cambiar estado del detalle a CANCELADO
                    $detalle->update(['estado' => 'CANCELADO']);
                }

                // Actualizar observaciones con razón de anulación si se proporciona
                if ($razonAnulacion) {
                    $observacionesActuales = $prestamo->observaciones ?? '';
                    $nuevasObservaciones = trim($observacionesActuales . " [ANULADO: $razonAnulacion]");
                    $prestamo->update([
                        'estado' => 'CANCELADO',
                        'observaciones' => $nuevasObservaciones,
                    ]);
                } else {
                    $prestamo->update(['estado' => 'CANCELADO']);
                }

                Log::info('✅ Préstamo anulado', [
                    'prestamo_id' => $prestamo->id,
                    'cliente_id' => $prestamo->cliente_id,
                    'cantidad_detalles' => count($prestamo->detalles),
                    'razon_anulacion' => $razonAnulacion,
                ]);

                return $prestamo;
            });
        } catch (\Exception $e) {
            Log::error('❌ Error anulando préstamo', [
                'error' => $e->getMessage(),
                'prestamo_id' => $prestamoId,
            ]);
            return false;
        }
    }
}
