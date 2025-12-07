<?php

namespace App\DTOs\Venta;

use App\DTOs\BaseDTO;
use App\Models\Proforma;

/**
 * DTO para respuesta de Proforma
 */
class ProformaResponseDTO extends BaseDTO
{
    public function __construct(
        public int $id,
        public string $numero,
        public int $cliente_id,
        public string $cliente_nombre,
        public string $estado,
        public string $fecha,
        public string $fecha_vencimiento,
        public float $subtotal,
        public float $impuesto,
        public float $total,
        public ?string $observaciones = null,
        public string $canal = 'PRESENCIAL',
        public array $detalles = [],
        public string $created_at = '',
        public string $updated_at = '',
    ) {}

    /**
     * Factory: Crear desde Model
     */
    public static function fromModel(Proforma $proforma): self
    {
        return new self(
            id: $proforma->id,
            numero: $proforma->numero,
            cliente_id: $proforma->cliente_id,
            cliente_nombre: $proforma->cliente->nombre ?? 'N/A',
            estado: $proforma->estado,
            fecha: $proforma->fecha->toDateString(),
            fecha_vencimiento: $proforma->fecha_vencimiento->toDateString(),
            subtotal: (float) $proforma->subtotal,
            impuesto: (float) $proforma->impuesto,
            total: (float) $proforma->total,
            observaciones: $proforma->observaciones,
            canal: $proforma->canal ?? 'PRESENCIAL',
            detalles: $proforma->detalles->map(fn($det) => [
                'id' => $det->id,
                'producto_id' => $det->producto_id,
                'producto_nombre' => $det->producto->nombre ?? 'N/A',
                'cantidad' => $det->cantidad,
                'precio_unitario' => (float) $det->precio_unitario,
                'subtotal' => (float) $det->subtotal,
            ])->toArray(),
            created_at: $proforma->created_at->toIso8601String(),
            updated_at: $proforma->updated_at->toIso8601String(),
        );
    }
}
