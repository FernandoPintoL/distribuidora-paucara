<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Envio extends Model
{
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
    ];

    protected $casts = [
        'fecha_programada' => 'datetime',
        'fecha_salida' => 'datetime',
        'fecha_entrega' => 'datetime',
        'coordenadas_lat' => 'decimal:8',
        'coordenadas_lng' => 'decimal:8',
    ];

    // Estados del envío
    const PROGRAMADO = 'PROGRAMADO';

    const EN_PREPARACION = 'EN_PREPARACION';

    const EN_RUTA = 'EN_RUTA';

    const ENTREGADO = 'ENTREGADO';

    const CANCELADO = 'CANCELADO';

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

    public function estaEnRuta(): bool
    {
        return $this->estado === self::EN_RUTA;
    }

    public function estaEntregado(): bool
    {
        return $this->estado === self::ENTREGADO;
    }

    // Generar número de envío
    public static function generarNumeroEnvio(): string
    {
        $fecha = now()->format('Ymd');
        $ultimo = self::whereDate('created_at', now()->toDateString())
            ->count() + 1;

        return "ENV-{$fecha}-".str_pad($ultimo, 4, '0', STR_PAD_LEFT);
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
