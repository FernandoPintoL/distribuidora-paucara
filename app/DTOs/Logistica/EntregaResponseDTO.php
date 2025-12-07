<?php

namespace App\DTOs\Logistica;

use App\DTOs\BaseDTO;
use App\Models\Entrega;

/**
 * DTO para respuesta de Entrega
 */
class EntregaResponseDTO extends BaseDTO
{
    public function __construct(
        public int $id,
        public int $venta_id,
        public ?int $chofer_id,
        public ?int $vehiculo_id,
        public string $estado,
        public string $direccion,
        public ?string $fecha_programada = null,
        public ?string $fecha_inicio = null,
        public ?string $fecha_entrega = null,
        public ?string $razon_rechazo = null,
        public ?string $chofer_nombre = null,
        public ?string $vehiculo_placa = null,
        public array $ubicaciones = [],
        public string $created_at = '',
    ) {}

    /**
     * Factory: Crear desde Model
     */
    public static function fromModel(Entrega $entrega): self
    {
        return new self(
            id: $entrega->id,
            venta_id: $entrega->venta_id,
            chofer_id: $entrega->chofer_id,
            vehiculo_id: $entrega->vehiculo_id,
            estado: $entrega->estado,
            direccion: $entrega->direccion,
            fecha_programada: $entrega->fecha_programada?->toDateString(),
            fecha_inicio: $entrega->fecha_inicio?->toIso8601String(),
            fecha_entrega: $entrega->fecha_entrega?->toIso8601String(),
            razon_rechazo: $entrega->razon_rechazo,
            chofer_nombre: $entrega->chofer?->nombre,
            vehiculo_placa: $entrega->vehiculo?->placa,
            ubicaciones: $entrega->ubicaciones?->toArray() ?? [],
            created_at: $entrega->created_at->toIso8601String(),
        );
    }
}
