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
        'venta_id',
        'chofer_id',
        'vehiculo_id',
        'direccion_cliente_id',
        'estado',
        'peso_kg',
        'volumen_m3',
        'fecha_asignacion',
        'fecha_inicio',
        'fecha_llegada',
        'fecha_entrega',
        'fecha_programada',         // Nuevo campo para crear entregas
        'direccion_entrega',        // Nuevo campo para crear entregas
        'observaciones',
        'motivo_novedad',
        'firma_digital_url',
        'foto_entrega_url',
        'fecha_firma_entrega',
        // Campos para flujo de carga
        'reporte_carga_id',
        'confirmado_carga_por',
        'fecha_confirmacion_carga',
        'iniciada_entrega_por',
        'fecha_inicio_entrega',
        'latitud_actual',
        'longitud_actual',
        'fecha_ultima_ubicacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion' => 'datetime',
            'fecha_inicio' => 'datetime',
            'fecha_llegada' => 'datetime',
            'fecha_entrega' => 'datetime',
            'fecha_programada' => 'datetime',
            'fecha_firma_entrega' => 'datetime',
            'fecha_confirmacion_carga' => 'datetime',
            'fecha_inicio_entrega' => 'datetime',
            'fecha_ultima_ubicacion' => 'datetime',
            'latitud_actual' => 'decimal:8',
            'longitud_actual' => 'decimal:8',
        ];
    }

    // Estados de la entrega - Flujo original
    const ESTADO_PROGRAMADO = 'PROGRAMADO';     // Estado inicial
    const ESTADO_ASIGNADA = 'ASIGNADA';
    const ESTADO_EN_CAMINO = 'EN_CAMINO';
    const ESTADO_LLEGO = 'LLEGO';
    const ESTADO_ENTREGADO = 'ENTREGADO';
    const ESTADO_NOVEDAD = 'NOVEDAD';
    const ESTADO_CANCELADA = 'CANCELADA';

    // Estados de la entrega - Nuevo flujo de carga (PREPARACION_CARGA → EN_CARGA → LISTO_PARA_ENTREGA → EN_TRANSITO → ENTREGADO)
    const ESTADO_PREPARACION_CARGA = 'PREPARACION_CARGA';      // Reporte generado, awaiting physical loading
    const ESTADO_EN_CARGA = 'EN_CARGA';                        // Physical loading in progress
    const ESTADO_LISTO_PARA_ENTREGA = 'LISTO_PARA_ENTREGA';   // Ready to depart
    const ESTADO_EN_TRANSITO = 'EN_TRANSITO';                 // GPS tracking active
    const ESTADO_RECHAZADO = 'RECHAZADO';                     // Rejected at delivery

    /**
     * Relaciones
     */

    /**
     * Proforma asociada a esta entrega (LEGACY - para retrocompatibilidad)
     */
    public function proforma(): BelongsTo
    {
        return $this->belongsTo(Proforma::class);
    }

    /**
     * Venta asociada a esta entrega (NUEVO - modelo consolidado)
     */
    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
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
     * Reporte de carga asociado a esta entrega
     */
    public function reporteCarga(): BelongsTo
    {
        return $this->belongsTo(ReporteCarga::class);
    }

    /**
     * Usuario que confirmó la carga
     */
    public function confirmadorCarga(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmado_carga_por');
    }

    /**
     * Usuario que inició la entrega
     */
    public function iniciadorEntrega(): BelongsTo
    {
        return $this->belongsTo(User::class, 'iniciada_entrega_por');
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
