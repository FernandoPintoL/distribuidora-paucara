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
        public ?string $tipo_entrega = null,
        public ?string $estado_pago = 'PENDIENTE',
        public ?array $moneda = null,
        public ?string $fecha_entrega_solicitada = null,
        public ?string $hora_entrega_solicitada = null,
        public ?string $hora_entrega_solicitada_fin = null,
        public ?string $fecha_entrega_confirmada = null,
        public ?string $hora_entrega_confirmada = null,
        public ?string $hora_entrega_confirmada_fin = null,
        public ?array $direccion_solicitada = null,
        public ?array $direccion_confirmada = null,
        public array $detalles = [],
        public ?string $politica_pago = 'CONTRA_ENTREGA',
        public ?string $canal_origen = null,
        public int $items_count = 0,
        public string $created_at = '',
        public string $updated_at = '',
        public ?int $usuario_creador_id = null,
        public ?array $usuario_creador = null,
        // ✅ CRÍTICO: Incluir datos completos del estado logístico para Show.tsx
        public ?array $estado_logistica = null,
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
                'limite_credito' => (float) ($model->cliente->limite_credito ?? 0),
                'puede_tener_credito' => $model->cliente->puede_tener_credito ?? false,
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
            tipo_entrega: $model->tipo_entrega ?? null,
            estado_pago: $model->estado_pago ?? 'PENDIENTE',
            moneda: $model->relationLoaded('moneda') && $model->moneda ? [
                'id' => $model->moneda->id,
                'codigo' => $model->moneda->codigo,
                'nombre' => $model->moneda->nombre,
                'simbolo' => $model->moneda->simbolo ?? 'Bs.',
            ] : null,
            fecha_entrega_solicitada: $model->fecha_entrega_solicitada?->toDateString(),
            hora_entrega_solicitada: self::extractTimeFromField($model->hora_entrega_solicitada),
            hora_entrega_solicitada_fin: self::extractTimeFromField($model->hora_entrega_solicitada_fin),
            fecha_entrega_confirmada: $model->fecha_entrega_confirmada?->toDateString(),
            hora_entrega_confirmada: self::extractTimeFromField($model->hora_entrega_confirmada),
            hora_entrega_confirmada_fin: self::extractTimeFromField($model->hora_entrega_confirmada_fin),
            direccion_solicitada: $model->relationLoaded('direccionSolicitada') && $model->direccionSolicitada ? [
                'id' => $model->direccionSolicitada->id,
                'direccion' => $model->direccionSolicitada->direccion,
                'latitud' => (float) ($model->direccionSolicitada->latitud ?? 0),
                'longitud' => (float) ($model->direccionSolicitada->longitud ?? 0),
                'ciudad' => $model->direccionSolicitada->ciudad ?? null,
                'departamento' => $model->direccionSolicitada->departamento ?? null,
            ] : null,
            direccion_confirmada: $model->relationLoaded('direccionConfirmada') && $model->direccionConfirmada ? [
                'id' => $model->direccionConfirmada->id,
                'direccion' => $model->direccionConfirmada->direccion,
                'latitud' => (float) ($model->direccionConfirmada->latitud ?? 0),
                'longitud' => (float) ($model->direccionConfirmada->longitud ?? 0),
                'ciudad' => $model->direccionConfirmada->ciudad ?? null,
                'departamento' => $model->direccionConfirmada->departamento ?? null,
            ] : null,
            detalles: $model->detalles->map(fn($det) => [
                'id' => $det->id,
                'producto_id' => $det->producto_id,
                'producto_nombre' => $det->producto->nombre ?? 'N/A',
                'cantidad' => $det->cantidad,
                'precio_unitario' => (float) $det->precio_unitario,
                'subtotal' => (float) $det->subtotal,
                // ✅ NUEVO: Agregar información adicional del producto
                'sku' => $det->producto->sku ?? null,
                'peso' => (float) ($det->producto->peso ?? 0),
                'categoria' => $det->producto->categoria?->nombre ?? null,
                // ✅ MEJORADO (2026-02-11): Consolidar stock de múltiples lotes
                // Suma TODOS los lotes del almacén principal, no solo el primero
                'cantidad_total' => (int) ($det->producto->stock?->sum('cantidad') ?? 0),
                'cantidad_disponible' => (int) ($det->producto->stock?->sum('cantidad_disponible') ?? 0),
                'cantidad_reservada' => (int) ($det->producto->stock?->sum('cantidad_reservada') ?? 0),
                // Alias para compatibilidad
                'stock_disponible' => (int) ($det->producto->stock?->sum('cantidad_disponible') ?? 0),
                'stock_total' => (int) ($det->producto->stock?->sum('cantidad') ?? 0),
                'stock_reservado' => (int) ($det->producto->stock?->sum('cantidad_reservada') ?? 0),
                // ✅ NUEVO: Límite de venta del producto
                'limite_venta' => $det->producto->limite_venta ? (int) $det->producto->limite_venta : null,
            ])->toArray(),
            politica_pago: $model->politica_pago ?? 'CONTRA_ENTREGA',
            canal_origen: $model->canal_origen ?? $model->canal ?? null,
            items_count: $model->detalles->count(),
            created_at: $model->created_at->toIso8601String(),
            updated_at: $model->updated_at->toIso8601String(),
            usuario_creador_id: $model->usuario_creador_id,
            usuario_creador: $model->relationLoaded('usuarioCreador') && $model->usuarioCreador ? [
                'id' => $model->usuarioCreador->id,
                'name' => $model->usuarioCreador->name,
                'email' => $model->usuarioCreador->email,
            ] : null,
            // ✅ CRÍTICO: Incluir datos del estado logístico para que Show.tsx muestre icon/nombre/color
            estado_logistica: $model->relationLoaded('estadoLogistica') && $model->estadoLogistica ? [
                'id' => $model->estadoLogistica->id,
                'codigo' => $model->estadoLogistica->codigo,
                'nombre' => $model->estadoLogistica->nombre,
                'icono' => $model->estadoLogistica->icono ?? null,
                'color' => $model->estadoLogistica->color ?? null,
                'categoria' => $model->estadoLogistica->categoria,
                'descripcion' => $model->estadoLogistica->descripcion ?? null,
                'activo' => $model->estadoLogistica->activo,
            ] : null,
        );
    }

    /**
     * Extraer la hora en formato HH:mm de un campo que puede ser:
     * - Null
     * - Una hora simple (HH:mm:ss)
     * - Un timestamp completo (YYYY-MM-DD HH:mm:ss)
     * - Un objeto Carbon
     */
    private static function extractTimeFromField($value): ?string
    {
        if (!$value) {
            return null;
        }

        // Si es una cadena de texto
        if (is_string($value)) {
            // Si contiene espacio, es un timestamp completo (YYYY-MM-DD HH:mm:ss)
            if (str_contains($value, ' ')) {
                return substr($value, 11, 5); // Extrae HH:mm
            }
            // Si no contiene espacio, es una hora simple (HH:mm:ss)
            return substr($value, 0, 5); // Extrae HH:mm
        }

        // Si es un objeto Carbon o DateTime
        if (method_exists($value, 'format')) {
            return $value->format('H:i');
        }

        return null;
    }
}
