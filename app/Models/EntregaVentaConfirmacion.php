<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntregaVentaConfirmacion extends Model
{
    protected $table = 'entregas_venta_confirmaciones';

    protected $fillable = [
        'entrega_id',
        'venta_id',
        'tipo_entrega',        // ✅ NUEVO: COMPLETA o NOVEDAD
        'tipo_novedad',        // ✅ NUEVO: CLIENTE_CERRADO, DEVOLUCION_PARCIAL, RECHAZADO
        'tuvo_problema',       // ✅ NUEVO: Flag para reportes
        'firma_digital_url',
        'fotos',
        'observaciones_logistica',  // ✅ 2026-02-12: Renombrado de observaciones
        'tienda_abierta',
        'cliente_presente',
        'motivo_rechazo',
        // ✅ FASE 1: Confirmación de Pago (SIMPLE - Single pago)
        'estado_pago',
        'monto_recibido',
        'tipo_pago_id',
        'motivo_no_pago',
        // ✅ FASE 2: Foto de comprobante
        'foto_comprobante',
        'confirmado_por',
        'confirmado_en',
        // ✅ FASE 3: Múltiples Formas de Pago (2026-02-12)
        'desglose_pagos',           // JSON array de pagos: [{tipo_pago_id, tipo_pago_nombre, monto, referencia}, ...]
        'total_dinero_recibido',    // Total de dinero en efectivo/transferencia recibido
        'monto_pendiente',          // Dinero pendiente si fue pago parcial o crédito
        'tipo_confirmacion',        // COMPLETA, CON_NOVEDAD
        // ✅ FASE 4: Devoluciones Parciales (2026-02-15)
        'productos_devueltos',      // JSON array de productos rechazados
        'monto_devuelto',           // Total del monto devuelto
        'monto_aceptado',           // Total del monto aceptado
    ];

    protected $casts = [
        'fotos' => 'array',                         // Convertir JSON a array
        'tienda_abierta' => 'boolean',
        'cliente_presente' => 'boolean',
        'tuvo_problema' => 'boolean',               // ✅ NUEVO: Cast boolean
        'confirmado_en' => 'datetime',
        'monto_recibido' => 'decimal:2',            // ✅ Dinero recibido con 2 decimales
        // ✅ NUEVA 2026-02-12: Casts para múltiples formas de pago
        'desglose_pagos' => 'array',                // JSON array → PHP array
        'total_dinero_recibido' => 'decimal:2',     // Total dinero recibido
        'monto_pendiente' => 'decimal:2',           // Dinero pendiente
        // ✅ NUEVA 2026-02-15: Casts para devoluciones parciales
        'productos_devueltos' => 'array',           // JSON array → PHP array
        'monto_devuelto' => 'decimal:2',            // Total devuelto con 2 decimales
        'monto_aceptado' => 'decimal:2',            // Total aceptado con 2 decimales
    ];

    // ===== RELACIONES =====

    /**
     * La entrega asociada
     */
    public function entrega(): BelongsTo
    {
        return $this->belongsTo(Entrega::class);
    }

    /**
     * La venta asociada
     */
    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    /**
     * El usuario (chofer) que confirmó
     */
    public function confirmadobPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmado_por');
    }

    /**
     * ✅ FASE 1: Tipo de pago usado
     */
    public function tipoPago(): BelongsTo
    {
        return $this->belongsTo(TipoPago::class, 'tipo_pago_id');
    }

    // ===== HELPERS =====

    /**
     * ¿Fue entregada exitosamente?
     */
    public function fueEntregada(): bool
    {
        return $this->confirmado_en !== null && $this->motivo_rechazo === null;
    }

    /**
     * ¿Fue rechazada?
     */
    public function fueRechazada(): bool
    {
        return $this->motivo_rechazo !== null;
    }

    /**
     * Obtener descripción legible del rechazo
     */
    public function obtenerDescripcionRechazo(): string
    {
        return match ($this->motivo_rechazo) {
            'TIENDA_CERRADA' => '🏪 Tienda Cerrada',
            'CLIENTE_AUSENTE' => '👤 Cliente Ausente',
            'CLIENTE_RECHAZA' => '🚫 Cliente Rechaza',
            'DIRECCION_INCORRECTA' => '📍 Dirección Incorrecta',
            'CLIENTE_NO_IDENTIFICADO' => '🆔 Cliente No Identificado',
            'OTRO' => '❓ Otro Motivo',
            default => 'Desconocido',
        };
    }

    /**
     * Contar fotos asociadas
     */
    public function contarFotos(): int
    {
        return is_array($this->fotos) ? count($this->fotos) : 0;
    }

    /**
     * ✅ NUEVA 2026-02-12: Obtener cantidad de métodos de pago usados
     */
    public function contarMetodosPago(): int
    {
        return is_array($this->desglose_pagos) ? count($this->desglose_pagos) : 0;
    }

    /**
     * ✅ NUEVA 2026-02-12: ¿Fue pagado completamente?
     */
    public function fuePagadoCompletamente(): bool
    {
        return $this->estado_pago === 'PAGADO';
    }

    /**
     * ✅ NUEVA 2026-02-12: ¿Fue pago parcial?
     */
    public function fuePagoParcial(): bool
    {
        return $this->estado_pago === 'PARCIAL';
    }

    /**
     * ✅ NUEVA 2026-02-12: ¿Fue a crédito total?
     */
    public function fueCredito(): bool
    {
        return $this->estado_pago === 'CREDITO';
    }

    /**
     * ✅ NUEVA 2026-02-12: Obtener descripción del estado de pago
     */
    public function obtenerDescripcionEstadoPago(): string
    {
        return match ($this->estado_pago) {
            'PAGADO' => '✅ Pagado Completamente',
            'PARCIAL' => '⚠️ Pago Parcial',
            'CREDITO' => '💳 Crédito Total',
            'NO_PAGADO' => '❌ No Pagado',
            default => 'Desconocido',
        };
    }

    /**
     * ✅ NUEVA 2026-02-12: Obtener desglose de pagos formateado
     * @return array Array de pagos con formato legible
     */
    public function obtenerDesglosPagosFormateado(): array
    {
        if (!is_array($this->desglose_pagos)) {
            return [];
        }

        return collect($this->desglose_pagos)->map(function ($pago) {
            return [
                'tipo' => $pago['tipo_pago_nombre'] ?? 'Desconocido',
                'monto' => $pago['monto'] ?? 0,
                'referencia' => $pago['referencia'] ?? null,
                'montoFormato' => '$' . number_format($pago['monto'] ?? 0, 2),
            ];
        })->toArray();
    }

    /**
     * ✅ NUEVA 2026-02-15: ¿Hubo devolución parcial?
     */
    public function tuvoDevolucionParcial(): bool
    {
        return is_array($this->productos_devueltos) && count($this->productos_devueltos) > 0;
    }

    /**
     * ✅ NUEVA 2026-02-15: Contar productos devueltos
     */
    public function contarProductosDevueltos(): int
    {
        return is_array($this->productos_devueltos) ? count($this->productos_devueltos) : 0;
    }

    /**
     * ✅ NUEVA 2026-02-15: Obtener productos devueltos formateados
     */
    public function obtenerProductosDevueltosFormateado(): array
    {
        if (!is_array($this->productos_devueltos)) {
            return [];
        }

        return collect($this->productos_devueltos)->map(function ($producto) {
            return [
                'nombre' => $producto['producto_nombre'] ?? 'Desconocido',
                'cantidad' => $producto['cantidad'] ?? 0,
                'precio_unitario' => $producto['precio_unitario'] ?? 0,
                'subtotal' => $producto['subtotal'] ?? 0,
                'subtotalFormato' => '$' . number_format($producto['subtotal'] ?? 0, 2),
            ];
        })->toArray();
    }

    /**
     * ✅ NUEVA 2026-02-15: Obtener porcentaje devuelto
     */
    public function obtenerPorcentajeDevuelto(): float
    {
        if (!$this->venta || $this->venta->total == 0) {
            return 0;
        }

        return round(($this->monto_devuelto / $this->venta->total) * 100, 2);
    }
}
