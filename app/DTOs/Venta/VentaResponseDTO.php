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
        public int $id = 0,
        public string $numero = '',
        public int $cliente_id = 0,
        public string $cliente_nombre = '',
        public string $cliente_nit = '',
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
        public ?bool $requiere_envio = null,
        public ?string $estado_logistico = null,
        public ?int $estado_logistico_id = null,  // ✅ NUEVO: ID del estado logístico
        public ?array $estadoLogistica = null,    // ✅ NUEVO: Objeto con id, codigo, nombre
        public ?string $canal_origen = null,
        public ?array $tipo_pago = null,
        public ?string $politica_pago = 'CONTRA_ENTREGA',
        public ?string $estado_pago = null,  // ✅ NUEVO: Estado de pago
        public ?array $proforma = null,
        public ?array $direccion_cliente = null,
    ) {}

    /**
     * Factory: Crear desde Model Eloquent
     */
    public static function fromModel($venta): static
    {
        // ✅ ACTUALIZADO: Cargar todas las relaciones necesarias
        if (!isset($venta->estadoDocumento)) {
            $venta->load('estadoDocumento');
        }
        if (!isset($venta->moneda)) {
            $venta->load('moneda');
        }
        if (!isset($venta->usuario)) {
            $venta->load('usuario');
        }
        if (!isset($venta->tipoPago)) {
            $venta->load('tipoPago');
        }
        if (!isset($venta->proforma)) {
            $venta->load('proforma');
        }
        if (!isset($venta->direccionCliente)) {
            $venta->load('direccionCliente.localidad');  // ✅ Cargar con localidad para mapas
        } elseif (!isset($venta->direccionCliente->localidad)) {
            // Si direccionCliente existe pero no localidad, cargar solo localidad
            $venta->direccionCliente->load('localidad');
        }
        if (!isset($venta->estadoLogistica)) {
            $venta->load('estadoLogistica');  // ✅ NUEVO: Cargar estado logístico
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
                    'es_combo' => $det->producto->es_combo ?? false,  // ✅ NUEVO: Para saber si es combo
                ] : null,
                'cantidad' => $det->cantidad,
                'precio_unitario' => (float) $det->precio_unitario,
                'subtotal' => (float) $det->subtotal,
                'combo_items_seleccionados' => $det->combo_items_seleccionados ?? [],  // ✅ NUEVO: Items del combo seleccionados
            ])->toArray(),
            created_at: $venta->created_at->toIso8601String(),
            updated_at: $venta->updated_at->toIso8601String(),
            requiere_envio: $venta->requiere_envio,
            estado_logistico: $venta->estado_logistico,
            estado_logistico_id: $venta->estado_logistico_id,  // ✅ NUEVO: ID de la FK
            estadoLogistica: $venta->estadoLogistica ? [       // ✅ NUEVO: Relación completa
                'id' => $venta->estadoLogistica->id,
                'codigo' => $venta->estadoLogistica->codigo,
                'nombre' => $venta->estadoLogistica->nombre ?? null,
                'categoria' => $venta->estadoLogistica->categoria ?? null,
            ] : null,
            canal_origen: $venta->canal_origen,
            tipo_pago: $venta->tipoPago ? [
                'id' => $venta->tipoPago->id,
                'nombre' => $venta->tipoPago->nombre,
            ] : null,
            politica_pago: $venta->politica_pago ?? 'CONTRA_ENTREGA',
            estado_pago: $venta->estado_pago ?? 'PENDIENTE',  // ✅ NUEVO: Estado de pago
            proforma: $venta->proforma ? [
                'id' => $venta->proforma->id,
                'numero' => $venta->proforma->numero,
            ] : null,
            direccion_cliente: $venta->direccionCliente ? [
                'id' => $venta->direccionCliente->id,
                'direccion' => $venta->direccionCliente->direccion,
                'referencias' => $venta->direccionCliente->observaciones ?? null,
                'localidad' => $venta->direccionCliente->localidad?->nombre ?? null,
                'localidad_id' => $venta->direccionCliente->localidad_id,
                'latitud' => (float) ($venta->direccionCliente->latitud ?? 0),    // ✅ NUEVO: Para mapas
                'longitud' => (float) ($venta->direccionCliente->longitud ?? 0), // ✅ NUEVO: Para mapas
                'es_principal' => $venta->direccionCliente->es_principal ?? false,
                'activa' => $venta->direccionCliente->activa ?? true,
            ] : null,
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
