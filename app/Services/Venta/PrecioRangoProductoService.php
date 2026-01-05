<?php

namespace App\Services\Venta;

use App\Models\Empresa;
use App\Models\Precio;
use App\Models\PrecioProducto;
use App\Models\PrecioRangoCantidadProducto;
use App\Models\Producto;
use App\Models\TipoPrecio;

class PrecioRangoProductoService
{
    /**
     * Calcular precio unitario de un producto considerando rango de cantidad
     */
    public function calcularPrecioUnitario(
        Producto $producto,
        int $cantidad,
        ?int $empresaId = null
    ): ?float {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id ?? 1;

        return $producto->obtenerPrecioConRango($cantidad, $empresaId);
    }

    /**
     * Calcular información completa de precio: unitario, subtotal, rango, ahorro
     */
    public function calcularPrecioCompleto(
        Producto $producto,
        int $cantidad,
        ?int $empresaId = null
    ): array {
        return $producto->obtenerPrecioConDetallesRango($cantidad, $empresaId);
    }

    /**
     * Calcular todos los items del carrito con sus precios
     */
    public function calcularCarrito(
        array $items,
        ?int $empresaId = null
    ): array {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id ?? 1;
        $detalles = [];
        $totalGeneral = 0;

        foreach ($items as $item) {
            $producto = Producto::find($item['producto_id']);

            if (!$producto) {
                continue;
            }

            $cantidad = (int) $item['cantidad'];
            $precioInfo = $this->calcularPrecioCompleto($producto, $cantidad, $empresaId);

            $detalles[] = [
                'producto_id' => $producto->id,
                'producto_nombre' => $producto->nombre,
                'producto_sku' => $producto->sku,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioInfo['precio_unitario'],
                'subtotal' => $precioInfo['subtotal'],
                'rango_aplicado' => $precioInfo['rango_aplicado'],
                'proximo_rango' => $precioInfo['proximo_rango'],
                'ahorro_proximo' => $precioInfo['ahorro_proximo'],
            ];

            $totalGeneral += $precioInfo['subtotal'];
        }

        return [
            'detalles' => $detalles,
            'total' => $totalGeneral,
            'cantidad_items' => count($detalles),
        ];
    }

    /**
     * Obtener todos los rangos configurados para un producto
     */
    public function obtenerRangosProducto(
        Producto $producto,
        ?int $empresaId = null
    ): \Illuminate\Database\Eloquent\Collection {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id ?? 1;

        return $producto->obtenerRangosActivos($empresaId);
    }

    /**
     * Crear un nuevo rango de precio para un producto
     */
    public function crearRango(
        Producto $producto,
        int $cantidadMinima,
        ?int $cantidadMaxima,
        TipoPrecio $tipoPrecio,
        ?int $empresaId = null,
        ?\DateTime $fechaVigenciaInicio = null,
        ?\DateTime $fechaVigenciaFin = null
    ): PrecioRangoCantidadProducto {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id ?? 1;

        // Validar que no exista solapamiento
        if (!PrecioRangoCantidadProducto::validarNoSolapamiento(
            $empresaId,
            $producto->id,
            $cantidadMinima,
            $cantidadMaxima
        )) {
            throw new \InvalidArgumentException(
                "El rango [{$cantidadMinima}-{$cantidadMaxima}] se superpone con rangos existentes"
            );
        }

        // Validar que exista precio para el tipo especificado
        $precioProducto = $producto->obtenerPrecio($tipoPrecio->id);
        if (!$precioProducto) {
            throw new \InvalidArgumentException(
                "El producto no tiene precio configurado para el tipo: {$tipoPrecio->nombre}"
            );
        }

        return PrecioRangoCantidadProducto::create([
            'empresa_id' => $empresaId,
            'producto_id' => $producto->id,
            'tipo_precio_id' => $tipoPrecio->id,
            'cantidad_minima' => $cantidadMinima,
            'cantidad_maxima' => $cantidadMaxima,
            'fecha_vigencia_inicio' => $fechaVigenciaInicio,
            'fecha_vigencia_fin' => $fechaVigenciaFin,
            'activo' => true,
        ]);
    }

    /**
     * Actualizar un rango de precio existente
     */
    public function actualizarRango(
        PrecioRangoCantidadProducto $rango,
        array $datos = []
    ): PrecioRangoCantidadProducto {
        $cantidadMinima = $datos['cantidad_minima'] ?? $rango->cantidad_minima;
        $cantidadMaxima = $datos['cantidad_maxima'] ?? $rango->cantidad_maxima;

        // Validar que no exista solapamiento (excluyendo el rango actual)
        if (!PrecioRangoCantidadProducto::validarNoSolapamiento(
            $rango->empresa_id,
            $rango->producto_id,
            $cantidadMinima,
            $cantidadMaxima,
            $rango->id
        )) {
            throw new \InvalidArgumentException(
                "El rango [{$cantidadMinima}-{$cantidadMaxima}] se superpone con rangos existentes"
            );
        }

        $rango->update($datos);

        return $rango->fresh();
    }

    /**
     * Desactivar un rango de precio
     */
    public function desactivarRango(PrecioRangoCantidadProducto $rango): bool
    {
        return $rango->update(['activo' => false]);
    }

    /**
     * Eliminar un rango de precio (eliminación real)
     */
    public function eliminarRango(PrecioRangoCantidadProducto $rango): bool
    {
        return $rango->delete();
    }

    /**
     * Validar que los rangos de un producto no tengan solapamientos
     */
    public function validarIntegridad(
        Producto $producto,
        ?int $empresaId = null
    ): array {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id ?? 1;
        $rangos = $producto->rangosPrecios()
            ->where('empresa_id', $empresaId)
            ->activos()
            ->orderBy('cantidad_minima', 'asc')
            ->get();

        $problemas = [];

        foreach ($rangos as $i => $rango) {
            // Validar que cantidad_minima sea mayor a 0
            if ($rango->cantidad_minima <= 0) {
                $problemas[] = "Rango #{$rango->id}: cantidad_minima debe ser > 0";
            }

            // Validar que cantidad_maxima (si existe) sea >= cantidad_minima
            if ($rango->cantidad_maxima && $rango->cantidad_maxima < $rango->cantidad_minima) {
                $problemas[] = "Rango #{$rango->id}: cantidad_maxima ({$rango->cantidad_maxima}) < cantidad_minima ({$rango->cantidad_minima})";
            }

            // Validar continuidad entre rangos consecutivos
            if ($i < count($rangos) - 1) {
                $rangoSiguiente = $rangos[$i + 1];

                if ($rango->cantidad_maxima) {
                    $esperadoMin = $rango->cantidad_maxima + 1;
                    if ($rangoSiguiente->cantidad_minima !== $esperadoMin) {
                        $problemas[] = "Rango #{$rango->id} a #{$rangoSiguiente->id}: gap entre {$rango->cantidad_maxima} y {$rangoSiguiente->cantidad_minima}";
                    }
                }
            }
        }

        return [
            'es_valido' => empty($problemas),
            'problemas' => $problemas,
            'cantidad_rangos' => count($rangos),
        ];
    }

    /**
     * Obtener resumen de rangos para visualización
     */
    public function obtenerResumenRangos(
        Producto $producto,
        ?int $empresaId = null
    ): array {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id ?? 1;
        $rangos = $this->obtenerRangosProducto($producto, $empresaId);

        return $rangos->map(function ($rango) {
            $precio = $rango->producto->obtenerPrecio($rango->tipo_precio_id);

            return [
                'id' => $rango->id,
                'cantidad_minima' => $rango->cantidad_minima,
                'cantidad_maxima' => $rango->cantidad_maxima,
                'rango_texto' => $rango->cantidad_maxima
                    ? "{$rango->cantidad_minima}-{$rango->cantidad_maxima}"
                    : "{$rango->cantidad_minima}+",
                'tipo_precio' => [
                    'id' => $rango->tipoPrecio->id,
                    'nombre' => $rango->tipoPrecio->nombre,
                    'codigo' => $rango->tipoPrecio->codigo,
                ],
                'precio_unitario' => $precio?->precio,
                'activo' => $rango->activo,
                'vigente' => now()->between(
                    $rango->fecha_vigencia_inicio ?? now()->subYear(),
                    $rango->fecha_vigencia_fin ?? now()->addYear()
                ),
            ];
        })->toArray();
    }
}
