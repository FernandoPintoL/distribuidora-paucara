<?php

namespace App\Services\Prestamos;

use App\Models\PrestamoProveedor;
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
                // Crear registro de préstamo
                $prestamo = PrestamoProveedor::create([
                    'prestable_id' => $datos['prestable_id'],
                    'proveedor_id' => $datos['proveedor_id'],
                    'cantidad' => $datos['cantidad'],
                    'es_compra' => $datos['es_compra'],
                    'precio_unitario' => $datos['precio_unitario'] ?? null,
                    'numero_documento' => $datos['numero_documento'] ?? null,
                    'fecha_prestamo' => $datos['fecha_prestamo'],
                    'fecha_esperada_devolucion' => $datos['fecha_esperada_devolucion'] ?? null,
                    'estado' => 'ACTIVO',
                ]);

                // Actualizar stock
                $almacenId = auth()->user()->empresa->almacen_id ?? 1;
                $this->stockService->recibirPrestamoProveedor(
                    $datos['prestable_id'],
                    $almacenId,
                    $datos['cantidad']
                );

                Log::info('✅ Préstamo de proveedor registrado', [
                    'prestamo_id' => $prestamo->id,
                    'proveedor_id' => $datos['proveedor_id'],
                    'cantidad' => $datos['cantidad'],
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
     *   'prestamo_proveedor_id': int,
     *   'cantidad_devuelta': int,
     *   'observaciones': ?string,
     *   'fecha_devolucion': date,
     * }
     */
    public function registrarDevolucion(array $datos): DevolucionProveedorPrestamo|false
    {
        try {
            return DB::transaction(function () use ($datos) {
                $prestamo = PrestamoProveedor::find($datos['prestamo_proveedor_id']);

                if (!$prestamo) {
                    throw new \Exception('Préstamo de proveedor no encontrado');
                }

                // Validar cantidad
                if ($datos['cantidad_devuelta'] > $prestamo->cantidad) {
                    throw new \Exception('Cantidad devuelta excede cantidad prestada');
                }

                // Crear devolución
                $devolucion = DevolucionProveedorPrestamo::create([
                    'prestamo_proveedor_id' => $datos['prestamo_proveedor_id'],
                    'cantidad_devuelta' => $datos['cantidad_devuelta'],
                    'observaciones' => $datos['observaciones'] ?? null,
                    'fecha_devolucion' => $datos['fecha_devolucion'],
                ]);

                // Actualizar stock
                $almacenId = auth()->user()->empresa->almacen_id ?? 1;
                $this->stockService->devolverAlProveedor(
                    $prestamo->prestable_id,
                    $almacenId,
                    $datos['cantidad_devuelta']
                );

                // Actualizar estado del préstamo
                $totalDevuelto = DevolucionProveedorPrestamo::where('prestamo_proveedor_id', $datos['prestamo_proveedor_id'])
                    ->sum('cantidad_devuelta');

                if ($totalDevuelto >= $prestamo->cantidad) {
                    $prestamo->update(['estado' => 'COMPLETAMENTE_DEVUELTO']);
                } else {
                    $prestamo->update(['estado' => 'PARCIALMENTE_DEVUELTO']);
                }

                Log::info('✅ Devolución al proveedor registrada', [
                    'devolucion_id' => $devolucion->id,
                    'prestamo_id' => $datos['prestamo_proveedor_id'],
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
            ->with(['prestable', 'devoluciones'])
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
            ->with('devoluciones')
            ->get();

        $deudaTotal = 0;

        foreach ($prestamosActivos as $prestamo) {
            // Cantidad aún pendiente de devolver
            $totalDevuelto = $prestamo->devoluciones->sum('cantidad_devuelta');
            $pendiente = $prestamo->cantidad - $totalDevuelto;

            // Si es compra, se cobra por cada canastilla
            if ($prestamo->es_compra && $prestamo->precio_unitario) {
                $deudaTotal += $pendiente * $prestamo->precio_unitario;
            }
        }

        return $deudaTotal;
    }

    /**
     * Obtener resumen de préstamo
     */
    public function obtenerResumen(int $prestamoId): array|false
    {
        $prestamo = PrestamoProveedor::find($prestamoId);

        if (!$prestamo) {
            return false;
        }

        $totalDevuelto = DevolucionProveedorPrestamo::where('prestamo_proveedor_id', $prestamoId)
            ->sum('cantidad_devuelta');

        $pendiente = $prestamo->cantidad - $totalDevuelto;

        return [
            'prestamo' => $prestamo,
            'cantidad_original' => $prestamo->cantidad,
            'cantidad_devuelta' => $totalDevuelto,
            'cantidad_pendiente' => $pendiente,
            'devoluciones' => $prestamo->devoluciones,
            'estado' => $prestamo->estado,
            'monto_deuda' => $prestamo->es_compra ? $pendiente * ($prestamo->precio_unitario ?? 0) : 0,
        ];
    }
}
