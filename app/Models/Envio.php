<?php

namespace App\Models;

use App\Models\Traits\GeneratesSequentialCode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Envio extends Model
{
    use GeneratesSequentialCode;
    protected $fillable = [
        'numero_envio',
        'venta_id',
        'vehiculo_id',
        'chofer_id',
        'fecha_programada',
        'fecha_salida',
        'fecha_entrega',
        'estado',
        'direccion_entrega',
        'coordenadas_lat',
        'coordenadas_lng',
        'observaciones',
        'foto_entrega',
        'firma_cliente',
        'receptor_nombre',
        'receptor_documento',
        // ✅ NUEVO: Campos para rechazos y problemas de entrega
        'motivo_rechazo',
        'fotos_rechazo',
        'fecha_intento_entrega',
        'estado_entrega', // EXITOSA, RECHAZADA, CLIENTE_AUSENTE, TIENDA_CERRADA, OTRO_PROBLEMA
    ];

    protected function casts(): array
    {
        return [
            'fecha_programada' => 'datetime',
            'fecha_salida' => 'datetime',
            'fecha_entrega' => 'datetime',
            'fecha_intento_entrega' => 'datetime',
            'coordenadas_lat' => 'decimal:8',
            'coordenadas_lng' => 'decimal:8',
            'fotos_rechazo' => 'array', // JSON array de URLs de fotos
        ];
    }

    // Estados del envío
    const PROGRAMADO = 'PROGRAMADO';

    const EN_PREPARACION = 'EN_PREPARACION';

    const EN_RUTA = 'EN_RUTA';

    const ENTREGADO = 'ENTREGADO';

    const CANCELADO = 'CANCELADO';

    // ✅ NUEVO: Estados de resultado de entrega
    const ESTADO_ENTREGA_EXITOSA = 'EXITOSA';
    const ESTADO_ENTREGA_RECHAZADA = 'RECHAZADA';
    const ESTADO_ENTREGA_CLIENTE_AUSENTE = 'CLIENTE_AUSENTE';
    const ESTADO_ENTREGA_TIENDA_CERRADA = 'TIENDA_CERRADA';
    const ESTADO_ENTREGA_PROBLEMA = 'OTRO_PROBLEMA';

    // Relaciones
    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class);
    }

    public function chofer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chofer_id');
    }

    public function seguimientos(): HasMany
    {
        return $this->hasMany(SeguimientoEnvio::class);
    }

    // Métodos de utilidad
    public function puedeIniciarPreparacion(): bool
    {
        return $this->estado === self::PROGRAMADO;
    }

    public function puedeConfirmarSalida(): bool
    {
        return $this->estado === self::EN_PREPARACION;
    }

    public function puedeConfirmarEntrega(): bool
    {
        return $this->estado === self::EN_RUTA;
    }

    // ✅ NUEVO: Validar si puede rechazar entrega
    public function puedeRechazarEntrega(): bool
    {
        return $this->estado === self::EN_RUTA && $this->estado_entrega === null;
    }

    // ✅ NUEVO: Marcar como rechazada
    public function marcarComoRechazada(string $motivo, array $fotos = []): bool
    {
        return $this->update([
            'estado_entrega' => self::ESTADO_ENTREGA_RECHAZADA,
            'motivo_rechazo' => $motivo,
            'fotos_rechazo' => $fotos,
            'fecha_intento_entrega' => now(),
        ]);
    }

    // ✅ NUEVO: Marcar como cliente ausente
    public function marcarClienteAusente(array $fotos = []): bool
    {
        return $this->update([
            'estado_entrega' => self::ESTADO_ENTREGA_CLIENTE_AUSENTE,
            'motivo_rechazo' => 'Cliente no se encontraba en el lugar',
            'fotos_rechazo' => $fotos,
            'fecha_intento_entrega' => now(),
        ]);
    }

    // ✅ NUEVO: Marcar como tienda cerrada
    public function marcarTiendaCerrada(array $fotos = []): bool
    {
        return $this->update([
            'estado_entrega' => self::ESTADO_ENTREGA_TIENDA_CERRADA,
            'motivo_rechazo' => 'Tienda cerrada',
            'fotos_rechazo' => $fotos,
            'fecha_intento_entrega' => now(),
        ]);
    }

    // ✅ NUEVO: Marcar como problema general
    public function marcarConProblema(string $motivo, array $fotos = []): bool
    {
        return $this->update([
            'estado_entrega' => self::ESTADO_ENTREGA_PROBLEMA,
            'motivo_rechazo' => $motivo,
            'fotos_rechazo' => $fotos,
            'fecha_intento_entrega' => now(),
        ]);
    }

    // ✅ NUEVO: Marcar como entregada exitosamente
    public function marcarComoEntregada(string $receptorNombre, ?string $receptorDocumento = null, ?string $firma = null): bool
    {
        return $this->update([
            'estado' => self::ENTREGADO,
            'estado_entrega' => self::ESTADO_ENTREGA_EXITOSA,
            'fecha_entrega' => now(),
            'receptor_nombre' => $receptorNombre,
            'receptor_documento' => $receptorDocumento,
            'firma_cliente' => $firma,
        ]);
    }

    public function estaEnRuta(): bool
    {
        return $this->estado === self::EN_RUTA;
    }

    public function estaEntregado(): bool
    {
        return $this->estado === self::ENTREGADO;
    }

    /**
     * Generar número de envío con protección contra race conditions
     * ✅ CONSOLIDADO: Usa GeneratesSequentialCode trait
     */
    public static function generarNumeroEnvio(): string
    {
        return static::generateSequentialCode('ENV', 'numero_envio', true, 'Ymd', 6);
    }

    // Agregar seguimiento
    public function agregarSeguimiento(string $estado, array $datos = []): SeguimientoEnvio
    {
        return $this->seguimientos()->create([
            'estado' => $estado,
            'fecha_hora' => now(),
            'coordenadas_lat' => $datos['lat'] ?? null,
            'coordenadas_lng' => $datos['lng'] ?? null,
            'observaciones' => $datos['observaciones'] ?? null,
            'foto' => $datos['foto'] ?? null,
            'user_id' => auth()->id(),
        ]);
    }

    // Scope para filtros
    public function scopeEnRuta($query)
    {
        return $query->where('estado', self::EN_RUTA);
    }

    public function scopeProgramados($query)
    {
        return $query->where('estado', self::PROGRAMADO);
    }

    public function scopeEntregados($query)
    {
        return $query->where('estado', self::ENTREGADO);
    }

    public function scopeDeChofer($query, $choferId)
    {
        return $query->where('chofer_id', $choferId);
    }
}
