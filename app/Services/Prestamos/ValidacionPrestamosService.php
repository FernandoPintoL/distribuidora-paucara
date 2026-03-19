<?php

namespace App\Services\Prestamos;

use App\Models\Prestable;
use App\Models\PrestableStock;
use App\Models\PrestamoCliente;
use App\Models\PrestableCondicion;

/**
 * ValidacionPrestamosService
 *
 * Valida operaciones de préstamos antes de ejecutarlas
 */
class ValidacionPrestamosService
{
    /**
     * Validar si se puede prestar cantidad a cliente
     */
    public function puedoPrestar(int $prestableId, int $almacenId, int $cantidad): array
    {
        $stock = PrestableStock::where('prestable_id', $prestableId)
            ->where('almacen_id', $almacenId)
            ->first();

        if (!$stock) {
            return [
                'valido' => false,
                'mensaje' => 'Stock no encontrado',
            ];
        }

        if ($stock->cantidad_disponible < $cantidad) {
            return [
                'valido' => false,
                'mensaje' => "Stock insuficiente. Disponible: {$stock->cantidad_disponible}, solicitado: {$cantidad}",
            ];
        }

        return [
            'valido' => true,
            'mensaje' => 'OK',
            'stock' => $stock,
        ];
    }

    /**
     * Validar si se puede vender cantidad a cliente
     */
    public function puedoVender(int $prestableId, int $almacenId, int $cantidad): array
    {
        return $this->puedoPrestar($prestableId, $almacenId, $cantidad);
    }

    /**
     * Validar si se puede devolver cantidad
     */
    public function puedoDevolver(
        int $prestamoId,
        int $cantidadDevuelta,
        int $cantidadDañadaParcial = 0,
        int $cantidadDañadaTotal = 0
    ): array {
        $prestamo = PrestamoCliente::find($prestamoId);

        if (!$prestamo) {
            return [
                'valido' => false,
                'mensaje' => 'Préstamo no encontrado',
            ];
        }

        $cantidadTotal = $cantidadDevuelta + $cantidadDañadaParcial + $cantidadDañadaTotal;

        if ($cantidadTotal > $prestamo->cantidad) {
            return [
                'valido' => false,
                'mensaje' => "Cantidad total devuelta ({$cantidadTotal}) excede cantidad prestada ({$prestamo->cantidad})",
            ];
        }

        return [
            'valido' => true,
            'mensaje' => 'OK',
            'prestamo' => $prestamo,
        ];
    }

    /**
     * Validar si prestable existe y está activo
     */
    public function prestableValido(int $prestableId): array
    {
        $prestable = Prestable::find($prestableId);

        if (!$prestable) {
            return [
                'valido' => false,
                'mensaje' => 'Prestable no encontrado',
            ];
        }

        if (!$prestable->activo) {
            return [
                'valido' => false,
                'mensaje' => 'Prestable inactivo',
            ];
        }

        return [
            'valido' => true,
            'mensaje' => 'OK',
            'prestable' => $prestable,
        ];
    }

    /**
     * Validar condiciones (garantía, daños)
     */
    public function condicionesValidas(int $prestableId): array
    {
        $condicion = PrestableCondicion::where('prestable_id', $prestableId)
            ->where('activo', true)
            ->first();

        if (!$condicion) {
            return [
                'valido' => false,
                'mensaje' => 'Condiciones no configuradas para este prestable',
            ];
        }

        if ($condicion->monto_garantia <= 0) {
            return [
                'valido' => false,
                'mensaje' => 'Monto de garantía no configurado',
            ];
        }

        return [
            'valido' => true,
            'mensaje' => 'OK',
            'condicion' => $condicion,
        ];
    }

    /**
     * Obtener montos a cobrar por daño
     */
    public function obtenerMontosDaño(
        int $prestableId,
        int $cantidadDañadaParcial = 0,
        int $cantidadDañadaTotal = 0
    ): array {
        $condicion = PrestableCondicion::where('prestable_id', $prestableId)
            ->where('activo', true)
            ->first();

        if (!$condicion) {
            return [
                'monto_daño_parcial_total' => 0,
                'monto_daño_total_total' => 0,
                'monto_total_daño' => 0,
            ];
        }

        $montoDañoParcialTotal = $cantidadDañadaParcial * $condicion->monto_daño_parcial;
        $montoDañoTotalTotal = $cantidadDañadaTotal * $condicion->monto_daño_total;

        return [
            'monto_daño_parcial_total' => $montoDañoParcialTotal,
            'monto_daño_total_total' => $montoDañoTotalTotal,
            'monto_total_daño' => $montoDañoParcialTotal + $montoDañoTotalTotal,
        ];
    }

    /**
     * Validar datos para crear préstamo
     */
    public function datosCreacionPrestamo(array $datos): array
    {
        $errores = [];

        // Validar prestable
        if (!isset($datos['prestable_id'])) {
            $errores[] = 'prestable_id requerido';
        } else {
            $prestableId = is_string($datos['prestable_id']) ? intval($datos['prestable_id']) : $datos['prestable_id'];
            $validacion = $this->prestableValido($prestableId);
            if (!$validacion['valido']) {
                $errores[] = $validacion['mensaje'];
            }
        }

        // Validar cliente
        if (!isset($datos['cliente_id'])) {
            $errores[] = 'cliente_id requerido';
        } else {
            $clienteId = is_string($datos['cliente_id']) ? intval($datos['cliente_id']) : $datos['cliente_id'];
            if (!is_int($clienteId) || $clienteId <= 0) {
                $errores[] = 'cliente_id debe ser un número entero válido';
            }
        }

        // Validar cantidad
        if (!isset($datos['cantidad'])) {
            $errores[] = 'cantidad requerida';
        } else {
            $cantidad = is_string($datos['cantidad']) ? intval($datos['cantidad']) : $datos['cantidad'];
            if ($cantidad <= 0) {
                $errores[] = 'cantidad debe ser > 0';
            }
        }

        // Validar tipos
        if (!isset($datos['es_venta'])) {
            $errores[] = 'es_venta requerido';
        } else {
            // Aceptar boolean, string "true"/"false", o número 0/1
            $esVenta = $datos['es_venta'];
            if (is_string($esVenta)) {
                $esVenta = filter_var($esVenta, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($esVenta === null) {
                    $errores[] = 'es_venta debe ser boolean';
                }
            } elseif (!is_bool($esVenta) && !is_int($esVenta)) {
                $errores[] = 'es_venta debe ser boolean';
            }
        }

        // Validar fecha
        if (!isset($datos['fecha_prestamo'])) {
            $errores[] = 'fecha_prestamo requerida';
        }

        // Validar es_evento (opcional)
        if (isset($datos['es_evento'])) {
            $esEvento = $datos['es_evento'];
            if (is_string($esEvento)) {
                $esEvento = filter_var($esEvento, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($esEvento === null) {
                    $errores[] = 'es_evento debe ser boolean';
                }
            } elseif (!is_bool($esEvento) && !is_int($esEvento)) {
                $errores[] = 'es_evento debe ser boolean';
            }
        }

        return [
            'valido' => count($errores) === 0,
            'errores' => $errores,
        ];
    }

    /**
     * Validar datos para registrar devolución
     */
    public function datosDevolucion(array $datos): array
    {
        $errores = [];

        // Validar préstamo
        if (!isset($datos['prestamo_cliente_id'])) {
            $errores[] = 'prestamo_cliente_id requerido';
        } else {
            if (!PrestamoCliente::find($datos['prestamo_cliente_id'])) {
                $errores[] = 'Préstamo no encontrado';
            }
        }

        // Validar cantidad devuelta
        if (!isset($datos['cantidad_devuelta']) || $datos['cantidad_devuelta'] < 0) {
            $errores[] = 'cantidad_devuelta requerida y debe ser >= 0';
        }

        // Validar cantidades de daño
        if (!isset($datos['cantidad_dañada_parcial'])) {
            $datos['cantidad_dañada_parcial'] = 0;
        }
        if (!isset($datos['cantidad_dañada_total'])) {
            $datos['cantidad_dañada_total'] = 0;
        }

        if ($datos['cantidad_dañada_parcial'] < 0 || $datos['cantidad_dañada_total'] < 0) {
            $errores[] = 'Cantidades de daño no pueden ser negativas';
        }

        // Validar fecha
        if (!isset($datos['fecha_devolucion'])) {
            $errores[] = 'fecha_devolucion requerida';
        }

        return [
            'valido' => count($errores) === 0,
            'errores' => $errores,
        ];
    }
}
