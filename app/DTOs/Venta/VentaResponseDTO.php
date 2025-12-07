<?php

namespace App\DTOs\Venta;

use App\DTOs\BaseDTO;
use App\Models\Venta;

/**
 * DTO para respuesta de Venta
 *
 * Se retorna desde Service para ser consumido por Controllers
 * Controllers lo convierten a JSON, Inertia props, etc
 */
class VentaResponseDTO extends BaseDTO
{
    public function __construct(
        public int $id,
        public int $cliente_id,
        public string $cliente_nombre,
        public string $cliente_nit,
        public string $estado,
        public string $fecha,
        public float $subtotal,
        public float $impuesto,
        public float $total,
        public ?string $observaciones = null,
        public array $detalles = [],
        public string $created_at = '',
        public string $updated_at = '',
    ) {}

    /**
     * Factory: Crear desde Model Eloquent
     */
    public static function fromModel(Venta $venta): self
    {
        return new self(
            id: $venta->id,
            cliente_id: $venta->cliente_id,
            cliente_nombre: $venta->cliente->nombre ?? 'N/A',
            cliente_nit: $venta->cliente->nit ?? 'N/A',
            estado: $venta->estado,
            fecha: $venta->fecha->toDateString(),
            subtotal: (float) $venta->subtotal,
            impuesto: (float) $venta->impuesto,
            total: (float) $venta->total,
            observaciones: $venta->observaciones,
            detalles: $venta->detalles->map(fn($det) => [
                'id' => $det->id,
                'producto_id' => $det->producto_id,
                'producto_nombre' => $det->producto->nombre ?? 'N/A',
                'cantidad' => $det->cantidad,
                'precio_unitario' => (float) $det->precio_unitario,
                'subtotal' => (float) $det->subtotal,
            ])->toArray(),
            created_at: $venta->created_at->toIso8601String(),
            updated_at: $venta->updated_at->toIso8601String(),
        );
    }

    /**
     * Convertir a Inertia props (para Inertia::render)
     */
    public function toInertiaProps(): array
    {
        return $this->toArray();
    }

    /**
     * Convertir a JSON para API
     */
    public function toJsonResponse(): array
    {
        return [
            'success' => true,
            'message' => 'Venta obtenida exitosamente',
            'data' => $this->toArray(),
        ];
    }
}
