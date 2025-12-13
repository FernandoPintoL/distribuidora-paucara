<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entrega extends Model
{
    use HasFactory;

    protected $fillable = [
        'proforma_id',
        'chofer_id',
        'vehiculo_id',
        'direccion_cliente_id',
        'estado',
        'fecha_asignacion',
        'fecha_inicio',
        'fecha_llegada',
        'fecha_entrega',
        'observaciones',
        'motivo_novedad',
        'firma_digital_url',
        'foto_entrega_url',
        'fecha_firma_entrega',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion' => 'datetime',
            'fecha_inicio' => 'datetime',
            'fecha_llegada' => 'datetime',
            'fecha_entrega' => 'datetime',
            'fecha_firma_entrega' => 'datetime',
        ];
    }

    // Estados de la entrega
    const ESTADO_ASIGNADA = 'ASIGNADA';
    const ESTADO_EN_CAMINO = 'EN_CAMINO';
    const ESTADO_LLEGO = 'LLEGO';
    const ESTADO_ENTREGADO = 'ENTREGADO';
    const ESTADO_NOVEDAD = 'NOVEDAD';
    const ESTADO_CANCELADA = 'CANCELADA';

    /**
     * Relaciones
     */

    /**
     * Proforma asociada a esta entrega
     */
    public function proforma(): BelongsTo
    {
        return $this->belongsTo(Proforma::class);
    }

    /**
     * Chofer (Empleado) asignado a esta entrega
     */
    public function chofer(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'chofer_id');
    }

    /**
     * Vehículo asignado a esta entrega
     */
    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class);
    }

    /**
     * Dirección de entrega del cliente
     */
    public function direccionCliente(): BelongsTo
    {
        return $this->belongsTo(DireccionCliente::class, 'direccion_cliente_id');
    }

    /**
     * Ubicaciones de tracking de esta entrega
     */
    public function ubicaciones(): HasMany
    {
        return $this->hasMany(UbicacionTracking::class);
    }

    /**
     * Historial de cambios de estado
     */
    public function historialEstados(): HasMany
    {
        return $this->hasMany(EntregaEstadoHistorial::class);
    }

    /**
     * Métodos útiles
     */

    /**
     * Obtener la última ubicación registrada
     */
    public function ultimaUbicacion()
    {
        return $this->ubicaciones()->latest('timestamp')->first();
    }

    /**
     * Cambiar estado de la entrega
     */
    public function cambiarEstado(string $nuevoEstado, ?string $comentario = null, ?\Illuminate\Foundation\Auth\User $usuario = null): void
    {
        // Registrar en historial
        $this->historialEstados()->create([
            'estado_anterior' => $this->estado,
            'estado_nuevo' => $nuevoEstado,
            'comentario' => $comentario,
            'usuario_id' => $usuario?->id,
            'metadata' => null,
        ]);

        // Actualizar estado
        $this->update(['estado' => $nuevoEstado]);
    }

    /**
     * Verificar si la entrega ha sido entregada
     */
    public function esEntregada(): bool
    {
        return $this->estado === self::ESTADO_ENTREGADO;
    }

    /**
     * Verificar si está en tránsito
     */
    public function estaEnTransito(): bool
    {
        return in_array($this->estado, [self::ESTADO_EN_CAMINO, self::ESTADO_LLEGO]);
    }

    /**
     * Verificar si fue cancelada
     */
    public function fueCancelada(): bool
    {
        return $this->estado === self::ESTADO_CANCELADA;
    }
}
