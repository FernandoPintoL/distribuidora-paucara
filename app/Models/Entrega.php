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
     * Reporte de carga asociado a esta entrega (legacy - para compatibilidad)
     * NOTA: Preferir usar reportes() para acceder a todos los reportes
     */
    public function reporteCarga(): BelongsTo
    {
        return $this->belongsTo(ReporteCarga::class);
    }

    /**
     * Reportes de carga asociados a esta entrega (Many-to-Many)
     *
     * NUEVA RELACIÓN: Una entrega puede estar en múltiples reportes
     * - Si se divide una entrega entre varios reportes
     * - O si se recrea un reporte
     */
    public function reportes()
    {
        return $this->belongsToMany(
            ReporteCarga::class,
            'reporte_carga_entregas',
            'entrega_id',
            'reporte_carga_id'
        )->withPivot(['orden', 'incluida_en_carga', 'notas'])
         ->withTimestamps()
         ->orderBy('reporte_carga_entregas.created_at', 'desc');
    }

    /**
     * Acceso directo a la tabla pivot (reporte_carga_entregas)
     * Útil para acceder a metadatos del vínculo (orden, incluida_en_carga, notas)
     */
    public function reporteEntregas(): HasMany
    {
        return $this->hasMany(ReporteCargaEntrega::class);
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
     * Boot del modelo
     * Validaciones antes de crear/actualizar + Sincronización con Venta
     */
    protected static function boot(): void
    {
        parent::boot();

        // Validar que siempre haya proforma_id o venta_id
        static::creating(function ($model) {
            if (!$model->proforma_id && !$model->venta_id) {
                throw new \InvalidArgumentException(
                    'Entrega debe tener al menos proforma_id o venta_id. ' .
                    'Nueva política: entregas pueden venir de venta (nuevo flujo) o proforma (legacy).'
                );
            }
        });

        static::updating(function ($model) {
            if (!$model->proforma_id && !$model->venta_id) {
                throw new \InvalidArgumentException(
                    'Entrega debe tener al menos proforma_id o venta_id.'
                );
            }
        });

        // Sincronizar estado de venta cuando se crea entrega
        static::created(function ($model) {
            if ($model->venta_id) {
                $sincronizador = app(\App\Services\Logistica\SincronizacionVentaEntregaService::class);
                $sincronizador->alCrearEntrega($model);
            }
        });

        // Sincronizar estado de venta cuando cambia estado de entrega
        static::updated(function ($model) {
            // Solo si cambió el estado
            if ($model->isDirty('estado') && $model->venta_id) {
                $estadoAnterior = $model->getOriginal('estado');
                $estadoNuevo = $model->estado;

                $sincronizador = app(\App\Services\Logistica\SincronizacionVentaEntregaService::class);
                $sincronizador->alCambiarEstadoEntrega($model, $estadoAnterior, $estadoNuevo);
            }
        });
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
     * Definir transiciones válidas de estados
     *
     * Estados antiguos (legacy):
     *   PROGRAMADO → ASIGNADA → EN_CAMINO → LLEGO → ENTREGADO
     *
     * Estados nuevos (flujo de carga):
     *   PROGRAMADO → PREPARACION_CARGA → EN_CARGA → LISTO_PARA_ENTREGA → EN_TRANSITO → ENTREGADO
     *
     * Ambos flujos pueden ir a CANCELADA, NOVEDAD o RECHAZADO en cualquier momento
     */
    private function obtenerTransicionesValidas(): array
    {
        return [
            // Estado inicial
            self::ESTADO_PROGRAMADO => [
                self::ESTADO_ASIGNADA,              // Flujo legacy
                self::ESTADO_PREPARACION_CARGA,     // Flujo nuevo de carga
                self::ESTADO_CANCELADA,             // Cancelar desde inicio
            ],
            // Flujo legacy
            self::ESTADO_ASIGNADA => [
                self::ESTADO_EN_CAMINO,
                self::ESTADO_CANCELADA,
                self::ESTADO_NOVEDAD,
            ],
            self::ESTADO_EN_CAMINO => [
                self::ESTADO_LLEGO,
                self::ESTADO_NOVEDAD,
            ],
            self::ESTADO_LLEGO => [
                self::ESTADO_ENTREGADO,
                self::ESTADO_NOVEDAD,
                self::ESTADO_RECHAZADO,
            ],
            // Flujo nuevo de carga
            self::ESTADO_PREPARACION_CARGA => [
                self::ESTADO_EN_CARGA,
                self::ESTADO_CANCELADA,
            ],
            self::ESTADO_EN_CARGA => [
                self::ESTADO_LISTO_PARA_ENTREGA,
                self::ESTADO_CANCELADA,
            ],
            self::ESTADO_LISTO_PARA_ENTREGA => [
                self::ESTADO_EN_TRANSITO,
                self::ESTADO_CANCELADA,
            ],
            self::ESTADO_EN_TRANSITO => [
                self::ESTADO_ENTREGADO,
                self::ESTADO_NOVEDAD,
                self::ESTADO_RECHAZADO,
            ],
            // Estados finales/excepcionales
            self::ESTADO_ENTREGADO => [],          // Terminal
            self::ESTADO_CANCELADA => [],          // Terminal
            self::ESTADO_NOVEDAD => [
                self::ESTADO_ENTREGADO,
                self::ESTADO_CANCELADA,
            ],
            self::ESTADO_RECHAZADO => [
                self::ESTADO_CANCELADA,
            ],
        ];
    }

    /**
     * Validar si una transición de estado es permitida
     */
    public function esTransicionValida(string $nuevoEstado): bool
    {
        $transiciones = $this->obtenerTransicionesValidas();
        $estadoActual = $this->estado;

        if (!isset($transiciones[$estadoActual])) {
            return false;
        }

        return in_array($nuevoEstado, $transiciones[$estadoActual]);
    }

    /**
     * Obtener los estados a los que puede transicionar
     */
    public function obtenerEstadosSiguientes(): array
    {
        $transiciones = $this->obtenerTransicionesValidas();
        return $transiciones[$this->estado] ?? [];
    }

    /**
     * Cambiar estado de la entrega con validación
     */
    public function cambiarEstado(string $nuevoEstado, ?string $comentario = null, ?\Illuminate\Foundation\Auth\User $usuario = null): void
    {
        // Validar que la transición sea válida
        if (!$this->esTransicionValida($nuevoEstado)) {
            $estadoActual = $this->estado;
            $estadosSiguientes = $this->obtenerEstadosSiguientes();
            $estados = implode(', ', $estadosSiguientes);
            throw new \InvalidArgumentException(
                "No se puede transicionar de '{$estadoActual}' a '{$nuevoEstado}'. " .
                "Estados válidos: {$estados}"
            );
        }

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
     * Obtener la fuente de la entrega (Venta o Proforma)
     */
    public function obtenerFuente()
    {
        if ($this->venta_id) {
            return $this->venta;
        }
        return $this->proforma;
    }

    /**
     * Obtener el nombre de la fuente
     */
    public function obtenerNombreFuente(): string
    {
        return $this->venta_id ? 'Venta' : 'Proforma';
    }

    /**
     * Verificar si está en el flujo nuevo de carga
     */
    public function estaEnFlujoDeCargas(): bool
    {
        return in_array($this->estado, [
            self::ESTADO_PREPARACION_CARGA,
            self::ESTADO_EN_CARGA,
            self::ESTADO_LISTO_PARA_ENTREGA,
            self::ESTADO_EN_TRANSITO,
        ]);
    }

    /**
     * Verificar si está en el flujo legacy
     */
    public function estaEnFlujoLegacy(): bool
    {
        return in_array($this->estado, [
            self::ESTADO_ASIGNADA,
            self::ESTADO_EN_CAMINO,
            self::ESTADO_LLEGO,
        ]);
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
        return in_array($this->estado, [self::ESTADO_EN_CAMINO, self::ESTADO_LLEGO, self::ESTADO_EN_TRANSITO]);
    }

    /**
     * Verificar si fue cancelada
     */
    public function fueCancelada(): bool
    {
        return $this->estado === self::ESTADO_CANCELADA;
    }

    /**
     * Verificar si tiene reporte de carga
     */
    public function tieneReporteDeCarga(): bool
    {
        return $this->reporte_carga_id !== null;
    }
}
