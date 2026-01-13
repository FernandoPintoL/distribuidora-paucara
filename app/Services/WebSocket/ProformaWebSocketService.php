<?php

namespace App\Services\WebSocket;

/**
 * Servicio especializado para notificaciones WebSocket de proformas
 *
 * Maneja todas las notificaciones en tiempo real relacionadas con proformas
 */
class ProformaWebSocketService extends BaseWebSocketService
{
    /**
     * Notificar creación de proforma
     */
    public function notifyCreated($proforma): bool
    {
        return $this->send('notify/proforma-created', [
            'id' => $proforma->id,
            'numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'cliente' => [
                'id' => $proforma->cliente_id,
                'nombre' => $proforma->cliente?->nombre ?? 'Cliente',
                'apellido' => $proforma->cliente?->apellido ?? '',
                'telefono' => $proforma->cliente?->telefono ?? null,
            ],
            'subtotal' => (float) $proforma->subtotal,
            'impuesto' => (float) $proforma->impuesto,
            'total' => (float) $proforma->total,
            'estado' => $proforma->estado,
            'items' => ($proforma->detalles ?? collect())->map(function ($item) {
                return [
                    'producto_id' => $item->producto_id,
                    'producto_nombre' => $item->producto?->nombre ?? 'Producto',
                    'cantidad' => $item->cantidad,
                    'precio_unitario' => (float) $item->precio_unitario,
                    'subtotal' => (float) $item->subtotal,
                ];
            })->toArray(),
            'fecha_creacion' => $proforma->created_at?->toIso8601String(),
            'fecha_vencimiento' => $proforma->fecha_vencimiento?->toIso8601String(),
        ]);
    }

    /**
     * Notificar aprobación de proforma
     */
    public function notifyApproved($proforma): bool
    {
        return $this->send('notify/proforma-approved', [
            'id' => $proforma->id,
            'numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'estado' => $proforma->estado,
            'total' => (float) $proforma->total,
            'usuario_aprobador' => [
                'id' => $proforma->usuario_aprobador_id,
                'name' => $proforma->usuarioAprobador?->name ?? 'Sistema',
            ],
            'comentarios' => $proforma->comentario_aprobacion,
            'fecha_aprobacion' => $proforma->fecha_aprobacion?->toIso8601String(),
        ]);
    }

    /**
     * Notificar rechazo de proforma
     */
    public function notifyRejected($proforma, ?string $motivoRechazo = null): bool
    {
        return $this->send('notify/proforma-rejected', [
            'id' => $proforma->id,
            'numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'estado' => $proforma->estado,
            'usuario_rechazador' => [
                'id' => $proforma->usuario_aprobador_id ?? auth()->id(),
                'name' => $proforma->usuarioAprobador?->name ?? auth()->user()?->name ?? 'Sistema',
            ],
            'motivo_rechazo' => $motivoRechazo ?? 'Sin motivo especificado',
            'fecha_rechazo' => now()->toIso8601String(),
        ]);
    }

    /**
     * Notificar conversión de proforma a venta
     */
    public function notifyConverted($proforma, $venta): bool
    {
        return $this->send('notify/proforma-converted', [
            'proforma_id' => $proforma->id,
            'proforma_numero' => $proforma->numero,
            'venta_id' => $venta->id,
            'venta_numero' => $venta->numero ?? null,
            'cliente_id' => $proforma->cliente_id,
            'total' => (float) $proforma->total,
            'fecha_conversion' => now()->toIso8601String(),
        ]);
    }

    /**
     * ✅ NUEVO: Notificar directamente al cliente cuando su proforma se convierte a venta
     * Se envía independientemente de si tiene user_id o no
     */
    public function notifyClientConverted($proforma, $venta): bool
    {
        return $this->send('notify/cliente-proforma-converted', [
            'cliente_id' => $proforma->cliente_id,
            'cliente_nombre' => $proforma->cliente?->nombre ?? 'Cliente',
            'proforma_id' => $proforma->id,
            'proforma_numero' => $proforma->numero,
            'venta_id' => $venta->id,
            'venta_numero' => $venta->numero ?? null,
            'total' => (float) $venta->total ?? (float) $proforma->total,
            'fecha_conversion' => now()->toIso8601String(),
            'tipo_notificacion' => 'cliente', // Identificar que es para el cliente
        ]);
    }

    /**
     * Notificar actualización de coordinación de entrega
     */
    public function notifyCoordination($proforma, int $usuarioId): bool
    {
        return $this->send('notify/proforma-coordination', [
            'id' => $proforma->id,
            'numero' => $proforma->numero,
            'cliente_id' => $proforma->cliente_id,
            'usuario_actualizo' => [
                'id' => $usuarioId,
                'name' => \App\Models\User::find($usuarioId)?->name ?? 'Sistema',
            ],
            'coordinacion_actualizada_en' => $proforma->coordinacion_actualizada_en?->toIso8601String(),
            'numero_intentos_contacto' => $proforma->numero_intentos_contacto ?? 0,
            'resultado_ultimo_intento' => $proforma->resultado_ultimo_intento,
            'fecha_entrega_confirmada' => $proforma->fecha_entrega_confirmada?->toIso8601String(),
            'hora_entrega_confirmada' => $proforma->hora_entrega_confirmada,
            'entregado_en' => $proforma->entregado_en?->toIso8601String(),
            'entregado_a' => $proforma->entregado_a,
            'observaciones_entrega' => $proforma->observaciones_entrega,
        ]);
    }
}
