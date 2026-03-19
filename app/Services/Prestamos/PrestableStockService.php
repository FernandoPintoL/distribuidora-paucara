<?php

namespace App\Services\Prestamos;

use App\Models\Prestable;
use App\Models\PrestableStock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PrestableStockService
 *
 * Gestiona el stock de canastillas/embases:
 * - cantidad_disponible: puedo vender o prestar
 * - cantidad_en_prestamo_cliente: en poder del cliente
 * - cantidad_en_prestamo_proveedor: debo al proveedor
 * - cantidad_vendida: cliente compró (no se devuelve)
 */
class PrestableStockService
{
    /**
     * Obtener o crear registro de stock
     */
    public function obtenerStock(int $prestableId, int $almacenId): PrestableStock
    {
        return PrestableStock::firstOrCreate(
            [
                'prestable_id' => $prestableId,
                'almacen_id' => $almacenId,
            ],
            [
                'cantidad_disponible' => 0,
                'cantidad_en_prestamo_cliente' => 0,
                'cantidad_en_prestamo_proveedor' => 0,
                'cantidad_vendida' => 0,
            ]
        );
    }

    /**
     * Obtener cantidad total real de un prestable
     * total = disponible + en_prestamo_cliente + en_prestamo_proveedor + vendida
     */
    public function obtenerCantidadTotal(int $prestableId, int $almacenId): int
    {
        $stock = $this->obtenerStock($prestableId, $almacenId);

        return $stock->cantidad_disponible +
               $stock->cantidad_en_prestamo_cliente +
               $stock->cantidad_en_prestamo_proveedor +
               $stock->cantidad_vendida;
    }

    /**
     * Prestar canastillas a cliente
     *
     * Reduce: cantidad_disponible
     * Incrementa: cantidad_en_prestamo_cliente
     */
    public function prestarAlCliente(int $prestableId, int $almacenId, int $cantidad): bool
    {
        $stock = $this->obtenerStock($prestableId, $almacenId);

        // Validar que hay suficiente disponible
        if ($stock->cantidad_disponible < $cantidad) {
            Log::warning('❌ Stock insuficiente para prestar', [
                'prestable_id' => $prestableId,
                'almacen_id' => $almacenId,
                'disponible' => $stock->cantidad_disponible,
                'solicitado' => $cantidad,
            ]);
            return false;
        }

        DB::transaction(function () use ($stock, $cantidad) {
            $stock->update([
                'cantidad_disponible' => $stock->cantidad_disponible - $cantidad,
                'cantidad_en_prestamo_cliente' => $stock->cantidad_en_prestamo_cliente + $cantidad,
            ]);

            Log::info('✅ Canastillas prestadas al cliente', [
                'prestable_id' => $stock->prestable_id,
                'almacen_id' => $stock->almacen_id,
                'cantidad' => $cantidad,
            ]);
        });

        return true;
    }

    /**
     * Devolver canastillas del cliente
     *
     * Parámetros:
     * - $cantidadDevuelta: cantidad en buen estado
     * - $cantidadDañadaParcial: cantidad con daño reparable
     * - $cantidadDañadaTotal: cantidad inutilizable
     */
    public function devolverDelCliente(
        int $prestableId,
        int $almacenId,
        int $cantidadDevuelta,
        int $cantidadDañadaParcial = 0,
        int $cantidadDañadaTotal = 0
    ): bool {
        $stock = $this->obtenerStock($prestableId, $almacenId);
        $cantidadTotal = $cantidadDevuelta + $cantidadDañadaParcial + $cantidadDañadaTotal;

        // Validar que no devuelve más de lo que pidió prestado
        if ($stock->cantidad_en_prestamo_cliente < $cantidadTotal) {
            Log::warning('❌ Intento de devolución inválida', [
                'prestable_id' => $prestableId,
                'almacen_id' => $almacenId,
                'en_prestamo' => $stock->cantidad_en_prestamo_cliente,
                'intenta_devolver' => $cantidadTotal,
            ]);
            return false;
        }

        DB::transaction(function () use ($stock, $cantidadDevuelta, $cantidadDañadaParcial, $cantidadDañadaTotal) {
            // Lo devuelto en buen estado vuelve a disponible
            $nuevoDisponible = $stock->cantidad_disponible + $cantidadDevuelta;

            // Lo dañado parcial vuelve a disponible (se puede reparar)
            $nuevoDisponible += $cantidadDañadaParcial;

            // Lo dañado total se pierden (se reponen desde garantía)
            // No vuelven a disponible

            $stock->update([
                'cantidad_disponible' => $nuevoDisponible,
                'cantidad_en_prestamo_cliente' => $stock->cantidad_en_prestamo_cliente -
                                                  ($cantidadDevuelta + $cantidadDañadaParcial + $cantidadDañadaTotal),
            ]);

            Log::info('✅ Canastillas devueltas por cliente', [
                'prestable_id' => $stock->prestable_id,
                'almacen_id' => $stock->almacen_id,
                'devueltas_buen_estado' => $cantidadDevuelta,
                'devueltas_daño_parcial' => $cantidadDañadaParcial,
                'devueltas_daño_total' => $cantidadDañadaTotal,
            ]);
        });

        return true;
    }

    /**
     * Vender canastillas al cliente
     *
     * Reduce: cantidad_disponible
     * Incrementa: cantidad_vendida
     */
    public function venderAlCliente(int $prestableId, int $almacenId, int $cantidad): bool
    {
        $stock = $this->obtenerStock($prestableId, $almacenId);

        if ($stock->cantidad_disponible < $cantidad) {
            Log::warning('❌ Stock insuficiente para vender', [
                'prestable_id' => $prestableId,
                'almacen_id' => $almacenId,
                'disponible' => $stock->cantidad_disponible,
                'solicitado' => $cantidad,
            ]);
            return false;
        }

        DB::transaction(function () use ($stock, $cantidad) {
            $stock->update([
                'cantidad_disponible' => $stock->cantidad_disponible - $cantidad,
                'cantidad_vendida' => $stock->cantidad_vendida + $cantidad,
            ]);

            Log::info('✅ Canastillas vendidas al cliente', [
                'prestable_id' => $stock->prestable_id,
                'almacen_id' => $stock->almacen_id,
                'cantidad' => $cantidad,
            ]);
        });

        return true;
    }

    /**
     * Registrar préstamo de proveedor
     *
     * Incrementa: cantidad_en_prestamo_proveedor (deuda)
     * Incrementa: cantidad_disponible (me llega stock)
     */
    public function recibirPrestamoProveedor(int $prestableId, int $almacenId, int $cantidad): bool
    {
        $stock = $this->obtenerStock($prestableId, $almacenId);

        DB::transaction(function () use ($stock, $cantidad) {
            $stock->update([
                'cantidad_disponible' => $stock->cantidad_disponible + $cantidad,
                'cantidad_en_prestamo_proveedor' => $stock->cantidad_en_prestamo_proveedor + $cantidad,
            ]);

            Log::info('✅ Préstamo de proveedor registrado', [
                'prestable_id' => $stock->prestable_id,
                'almacen_id' => $stock->almacen_id,
                'cantidad' => $cantidad,
            ]);
        });

        return true;
    }

    /**
     * Devolver canastillas al proveedor
     *
     * Reduce: cantidad_disponible
     * Reduce: cantidad_en_prestamo_proveedor
     */
    public function devolverAlProveedor(int $prestableId, int $almacenId, int $cantidad): bool
    {
        $stock = $this->obtenerStock($prestableId, $almacenId);

        // Validar que tenemos para devolver
        if ($stock->cantidad_en_prestamo_proveedor < $cantidad) {
            Log::warning('❌ Intento de devolución a proveedor inválida', [
                'prestable_id' => $prestableId,
                'almacen_id' => $almacenId,
                'en_prestamo' => $stock->cantidad_en_prestamo_proveedor,
                'intenta_devolver' => $cantidad,
            ]);
            return false;
        }

        // También validar que tenemos disponible
        if ($stock->cantidad_disponible < $cantidad) {
            Log::warning('❌ Stock disponible insuficiente para devolver al proveedor', [
                'prestable_id' => $prestableId,
                'almacen_id' => $almacenId,
                'disponible' => $stock->cantidad_disponible,
                'solicitado' => $cantidad,
            ]);
            return false;
        }

        DB::transaction(function () use ($stock, $cantidad) {
            $stock->update([
                'cantidad_disponible' => $stock->cantidad_disponible - $cantidad,
                'cantidad_en_prestamo_proveedor' => $stock->cantidad_en_prestamo_proveedor - $cantidad,
            ]);

            Log::info('✅ Canastillas devueltas al proveedor', [
                'prestable_id' => $stock->prestable_id,
                'almacen_id' => $stock->almacen_id,
                'cantidad' => $cantidad,
            ]);
        });

        return true;
    }

    /**
     * Incrementar stock inicial (compra a proveedor)
     */
    public function incrementarStockInicial(int $prestableId, int $almacenId, int $cantidad): bool
    {
        $stock = $this->obtenerStock($prestableId, $almacenId);

        DB::transaction(function () use ($stock, $cantidad) {
            $stock->update([
                'cantidad_disponible' => $stock->cantidad_disponible + $cantidad,
            ]);

            Log::info('✅ Stock inicial incrementado', [
                'prestable_id' => $stock->prestable_id,
                'almacen_id' => $stock->almacen_id,
                'cantidad' => $cantidad,
            ]);
        });

        return true;
    }

    /**
     * Obtener resumen de stock
     */
    public function obtenerResumen(int $prestableId, int $almacenId): array
    {
        $stock = $this->obtenerStock($prestableId, $almacenId);
        $total = $this->obtenerCantidadTotal($prestableId, $almacenId);

        return [
            'cantidad_disponible' => $stock->cantidad_disponible,
            'cantidad_en_prestamo_cliente' => $stock->cantidad_en_prestamo_cliente,
            'cantidad_en_prestamo_proveedor' => $stock->cantidad_en_prestamo_proveedor,
            'cantidad_vendida' => $stock->cantidad_vendida,
            'cantidad_total' => $total,
        ];
    }
}
