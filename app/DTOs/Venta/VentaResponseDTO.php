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
        public string $numero = '',
        public int $cliente_id,
        public string $cliente_nombre,
        public string $cliente_nit,
        public ?array $cliente = null,
        public ?string $estado = null,
        public ?array $estado_documento = null,
        public string $fecha = '',
        public float $subtotal = 0,
        public float $impuesto = 0,
        public float $total = 0,
        public ?array $moneda = null,
        public ?array $usuario = null,
        public ?string $observaciones = null,
        public array $detalles = [],
        public string $created_at = '',
        public string $updated_at = '',
    ) {}

    /**
     * Factory: Crear desde Model Eloquent
     */
    public static function fromModel($venta): static
    {
        // Cargar relaciones si existen
        if (!isset($venta->estadoDocumento)) {
            $venta->load('estadoDocumento');
        }
        if (!isset($venta->moneda)) {
            $venta->load('moneda');
        }
        if (!isset($venta->usuario)) {
            $venta->load('usuario');
        }

        return new self(
            id: $venta->id,
            numero: $venta->numero ?? '',
            cliente_id: $venta->cliente_id,
            cliente_nombre: $venta->cliente->nombre ?? 'N/A',
            cliente_nit: $venta->cliente->nit ?? 'N/A',
            cliente: $venta->cliente ? [
                'id' => $venta->cliente->id,
                'nombre' => $venta->cliente->nombre,
                'nit' => $venta->cliente->nit,
                'email' => $venta->cliente->email ?? null,
                'telefono' => $venta->cliente->telefono ?? null,
                'foto_perfil' => $venta->cliente->foto_perfil ?? null,
            ] : null,
            estado: $venta->estado ?? 'PENDIENTE',
            estado_documento: $venta->estadoDocumento ? [
                'id' => $venta->estadoDocumento->id,
                'codigo' => $venta->estadoDocumento->codigo,
                'nombre' => $venta->estadoDocumento->nombre,
                'descripcion' => $venta->estadoDocumento->descripcion,
            ] : null,
            fecha: $venta->fecha->toDateString(),
            subtotal: (float) $venta->subtotal,
            impuesto: (float) $venta->impuesto,
            total: (float) $venta->total,
            moneda: $venta->moneda ? [
                'id' => $venta->moneda->id,
                'codigo' => $venta->moneda->codigo,
                'nombre' => $venta->moneda->nombre,
            ] : null,
            usuario: $venta->usuario ? [
                'id' => $venta->usuario->id,
                'name' => $venta->usuario->name,
                'email' => $venta->usuario->email,
            ] : null,
            observaciones: $venta->observaciones,
            detalles: $venta->detalles->map(fn($det) => [
                'id' => $det->id,
                'producto_id' => $det->producto_id,
                'producto' => $det->producto ? [
                    'id' => $det->producto->id,
                    'nombre' => $det->producto->nombre ?? 'N/A',
                    'codigo' => $det->producto->codigo ?? null,
                    'descripcion' => $det->producto->descripcion ?? null,
                ] : null,
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
