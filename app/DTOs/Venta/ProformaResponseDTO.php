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
        public array $cliente,
        public string $estado,
        public string $fecha,
        public string $fecha_vencimiento,
        public float $subtotal,
        public float $descuento,
        public float $impuesto,
        public float $total,
        public ?string $observaciones = null,
        public string $canal = 'PRESENCIAL',
        public ?string $fecha_entrega_solicitada = null,
        public ?string $hora_entrega_solicitada = null,
        public ?string $fecha_entrega_confirmada = null,
        public ?string $hora_entrega_confirmada = null,
        public array $detalles = [],
        public string $created_at = '',
        public string $updated_at = '',
    ) {}

    /**
     * Factory: Crear desde Model
     */
    public static function fromModel($model): static
    {
        /** @var Proforma $model */
        return new self(
            id: $model->id,
            numero: $model->numero,
            cliente_id: $model->cliente_id,
            cliente_nombre: $model->cliente->nombre ?? 'N/A',
            cliente: [
                'id' => $model->cliente->id,
                'nombre' => $model->cliente->nombre,
                'email' => $model->cliente->email ?? null,
                'telefono' => $model->cliente->telefono ?? null,
                'direccion' => $model->cliente->direccion ?? null,
            ],
            estado: $model->estado,
            fecha: $model->fecha->toDateString(),
            fecha_vencimiento: $model->fecha_vencimiento->toDateString(),
            subtotal: (float) $model->subtotal,
            descuento: (float) $model->descuento,
            impuesto: (float) $model->impuesto,
            total: (float) $model->total,
            observaciones: $model->observaciones,
            canal: $model->canal ?? 'PRESENCIAL',
            fecha_entrega_solicitada: $model->fecha_entrega_solicitada?->toDateString(),
            hora_entrega_solicitada: $model->hora_entrega_solicitada,
            fecha_entrega_confirmada: $model->fecha_entrega_confirmada?->toDateString(),
            hora_entrega_confirmada: $model->hora_entrega_confirmada,
            detalles: $model->detalles->map(fn($det) => [
                'id' => $det->id,
                'producto_id' => $det->producto_id,
                'producto_nombre' => $det->producto->nombre ?? 'N/A',
                'cantidad' => $det->cantidad,
                'precio_unitario' => (float) $det->precio_unitario,
                'subtotal' => (float) $det->subtotal,
            ])->toArray(),
            created_at: $model->created_at->toIso8601String(),
            updated_at: $model->updated_at->toIso8601String(),
        );
    }
}
