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
        'firma_digital_url',
        'fotos',
        'observaciones',
        'tienda_abierta',
        'cliente_presente',
        'motivo_rechazo',
        // ✅ FASE 1: Confirmación de Pago
        'estado_pago',
        'monto_recibido',
        'tipo_pago_id',
        'motivo_no_pago',
        // ✅ FASE 2: Foto de comprobante
        'foto_comprobante',
        'confirmado_por',
        'confirmado_en',
    ];

    protected $casts = [
        'fotos' => 'array',                    // Convertir JSON a array
        'tienda_abierta' => 'boolean',
        'cliente_presente' => 'boolean',
        'confirmado_en' => 'datetime',
        'monto_recibido' => 'decimal:2',       // ✅ Dinero recibido con 2 decimales
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
}
