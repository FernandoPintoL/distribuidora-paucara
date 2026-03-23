<?php

namespace App\Services\Prestamos;

use App\Models\PrestamoProveedor;
use App\Models\PrestamoProveedorDetalle;
use App\Models\DevolucionProveedorPrestamo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PrestamoProveedorService
 *
 * Gestiona préstamos y compras de canastillas/embases de proveedores
 */
class PrestamoProveedorService
{
    private PrestableStockService $stockService;

    public function __construct(PrestableStockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Registrar préstamo/compra de proveedor
     *
     * @param array $datos
     * {
     *   'prestable_id': int,
     *   'proveedor_id': int,
     *   'cantidad': int,
     *   'es_compra': bool,
     *   'precio_unitario': ?float,
     *   'numero_documento': ?string,
     *   'fecha_prestamo': date,
     *   'fecha_esperada_devolucion': ?date,
     * }
     */
    public function crearPrestamo(array $datos): PrestamoProveedor|false
    {
        try {
            return DB::transaction(function () use ($datos) {
                // ✅ NUEVO: Crear registro encabezado de préstamo (sin prestable_id ni cantidad)
                $prestamo = PrestamoProveedor::create([
                    'proveedor_id' => $datos['proveedor_id'],
                    'compra_id' => $datos['compra_id'] ?? null,
                    'es_compra' => $datos['es_compra'],
                    'monto_garantia' => $datos['monto_garantia'] ?? 0,
                    'fecha_prestamo' => $datos['fecha_prestamo'],
                    'fecha_esperada_devolucion' => $datos['fecha_esperada_devolucion'] ?? null,
                    'observaciones' => $datos['observaciones'] ?? null,
                    'estado' => 'ACTIVO',
                ]);

                // ✅ NUEVO: Procesar detalles (múltiples prestables)
                $almacenId = auth()->user()->empresa->almacen_id ?? 1;
                $detalles = $datos['detalles'] ?? [];

                foreach ($detalles as $detalle) {
                    // ✅ NUEVO: Crear detalle del préstamo
                    PrestamoProveedorDetalle::create([
                        'prestamo_proveedor_id' => $prestamo->id,
                        'prestable_id' => $detalle['prestable_id'],
                        'cantidad_prestada' => $detalle['cantidad'],
                        'estado' => 'ACTIVO',
                    ]);

                    // Actualizar stock para cada detalle
                    $this->stockService->recibirPrestamoProveedor(
                        $detalle['prestable_id'],
                        $almacenId,
                        $detalle['cantidad']
                    );

                    Log::info('✅ Detalle de préstamo de proveedor registrado', [
                        'prestamo_id' => $prestamo->id,
                        'prestable_id' => $detalle['prestable_id'],
                        'cantidad' => $detalle['cantidad'],
                    ]);
                }

                Log::info('✅ Préstamo de proveedor registrado', [
                    'prestamo_id' => $prestamo->id,
                    'proveedor_id' => $datos['proveedor_id'],
                    'cantidad_detalles' => count($detalles),
                    'es_compra' => $datos['es_compra'],
                ]);

                return $prestamo;
            });
        } catch (\Exception $e) {
            Log::error('❌ Error registrando préstamo de proveedor', [
                'error' => $e->getMessage(),
                'datos' => $datos,
            ]);
            return false;
        }
    }

    /**
     * Registrar devolución al proveedor (parcial o total)
     *
     * @param array $datos
     * {
     *   'prestamo_proveedor_detalle_id': int,
     *   'cantidad_devuelta': int,
     *   'observaciones': ?string,
     *   'fecha_devolucion': date,
     * }
     */
    public function registrarDevolucion(array $datos): DevolucionProveedorPrestamo|false
    {
        try {
            return DB::transaction(function () use ($datos) {
                // ✅ NUEVO: Buscar el detalle, no el encabezado
                $detalle = PrestamoProveedorDetalle::find($datos['prestamo_proveedor_detalle_id']);

                if (!$detalle) {
                    throw new \Exception('Detalle del préstamo de proveedor no encontrado');
                }

                // Validar cantidad contra el detalle
                $cantidadYaDevuelta = $detalle->devoluciones()->sum('cantidad_devuelta');
                if ($cantidadYaDevuelta + $datos['cantidad_devuelta'] > $detalle->cantidad_prestada) {
                    throw new \Exception('Cantidad devuelta excede cantidad prestada en este detalle');
                }

                // Crear devolución
                $devolucion = DevolucionProveedorPrestamo::create([
                    'prestamo_proveedor_detalle_id' => $datos['prestamo_proveedor_detalle_id'],
                    'cantidad_devuelta' => $datos['cantidad_devuelta'],
                    'observaciones' => $datos['observaciones'] ?? null,
                    'fecha_devolucion' => $datos['fecha_devolucion'],
                ]);

                // Actualizar stock del prestable
                $almacenId = auth()->user()->empresa->almacen_id ?? 1;
                $this->stockService->devolverAlProveedor(
                    $detalle->prestable_id,
                    $almacenId,
                    $datos['cantidad_devuelta']
                );

                // ✅ NUEVO: Actualizar estado del detalle
                $totalDevueltoDetalle = $detalle->devoluciones()->sum('cantidad_devuelta') + $datos['cantidad_devuelta'];

                if ($totalDevueltoDetalle >= $detalle->cantidad_prestada) {
                    $detalle->update(['estado' => 'COMPLETAMENTE_DEVUELTO']);
                } else {
                    $detalle->update(['estado' => 'PARCIALMENTE_DEVUELTO']);
                }

                // ✅ NUEVO: Actualizar estado del encabezado basado en todos sus detalles
                $prestamo = $detalle->prestamo;
                $detallesCompletamenteDevueltos = $prestamo->detalles()
                    ->where('estado', 'COMPLETAMENTE_DEVUELTO')
                    ->count();
                $totalDetalles = $prestamo->detalles()->count();

                if ($detallesCompletamenteDevueltos === $totalDetalles) {
                    $prestamo->update(['estado' => 'COMPLETAMENTE_DEVUELTO']);
                } else {
                    $prestamo->update(['estado' => 'PARCIALMENTE_DEVUELTO']);
                }

                Log::info('✅ Devolución al proveedor registrada', [
                    'devolucion_id' => $devolucion->id,
                    'prestamo_detalle_id' => $datos['prestamo_proveedor_detalle_id'],
                    'prestamo_id' => $prestamo->id,
                    'cantidad_devuelta' => $datos['cantidad_devuelta'],
                ]);

                return $devolucion;
            });
        } catch (\Exception $e) {
            Log::error('❌ Error registrando devolución al proveedor', [
                'error' => $e->getMessage(),
                'datos' => $datos,
            ]);
            return false;
        }
    }

    /**
     * Obtener préstamos activos de un proveedor
     */
    public function obtenerPrestamosActivos(int $proveedorId): array
    {
        return PrestamoProveedor::where('proveedor_id', $proveedorId)
            ->where('estado', 'ACTIVO')
            ->with(['detalles.prestable', 'detalles.devoluciones'])
            ->get()
            ->toArray();
    }

    /**
     * Obtener deuda total a un proveedor
     */
    public function obtenerDeudaTotal(int $proveedorId): float
    {
        $prestamosActivos = PrestamoProveedor::where('proveedor_id', $proveedorId)
            ->whereIn('estado', ['ACTIVO', 'PARCIALMENTE_DEVUELTO'])
            ->with(['detalles.devoluciones'])
            ->get();

        $deudaTotal = 0;

        foreach ($prestamosActivos as $prestamo) {
            // ✅ NUEVO: Iterar detalles para calcular deuda
            foreach ($prestamo->detalles as $detalle) {
                // Cantidad aún pendiente de devolver en este detalle
                $totalDevueltoDetalle = $detalle->devoluciones->sum('cantidad_devuelta');
                $pendiente = $detalle->cantidad_prestada - $totalDevueltoDetalle;

                // Si es compra, se cobra por cada canastilla
                if ($prestamo->es_compra && $detalle->precio_unitario) {
                    $deudaTotal += $pendiente * $detalle->precio_unitario;
                }
            }
        }

        return $deudaTotal;
    }

    /**
     * Obtener resumen de préstamo
     */
    public function obtenerResumen(int $prestamoId): array|false
    {
        $prestamo = PrestamoProveedor::with(['detalles.devoluciones', 'detalles.prestable'])->find($prestamoId);

        if (!$prestamo) {
            return false;
        }

        // ✅ NUEVO: Calcular totales de todos los detalles
        $cantidadTotal = 0;
        $totalDevuelto = 0;
        $montoDeuda = 0;

        foreach ($prestamo->detalles as $detalle) {
            $cantidadTotal += $detalle->cantidad_prestada;
            $totalDevueltoDetalle = $detalle->devoluciones->sum('cantidad_devuelta');
            $totalDevuelto += $totalDevueltoDetalle;
            $pendiente = $detalle->cantidad_prestada - $totalDevueltoDetalle;

            if ($prestamo->es_compra && $detalle->precio_unitario) {
                $montoDeuda += $pendiente * $detalle->precio_unitario;
            }
        }

        $pendiente = $cantidadTotal - $totalDevuelto;

        return [
            'prestamo' => $prestamo,
            'cantidad_original' => $cantidadTotal,
            'cantidad_devuelta' => $totalDevuelto,
            'cantidad_pendiente' => $pendiente,
            'devoluciones' => $prestamo->detalles->flatMap(fn($d) => $d->devoluciones),
            'estado' => $prestamo->estado,
            'monto_deuda' => $montoDeuda,
        ];
    }
}
