<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entrega extends Model
{
    use HasFactory;

    protected $fillable = [
        // Asignación de recursos
        'chofer_id',
        'vehiculo_id',
        'zona_id',                  // FK a localidades

        // Identificadores
        'numero_entrega',           // ID legible (ENT-20251227-001)

        // Estados y flujo
        'estado',
        'fecha_asignacion',
        'fecha_inicio',
        'fecha_llegada',
        'fecha_entrega',
        'fecha_programada',

        // Información de entrega
        'peso_kg',                  // Suma de pesos de ventas
        'observaciones',
        'motivo_novedad',

        // Comprobantes
        'firma_digital_url',
        'foto_entrega_url',
        'fecha_firma_entrega',

        // Flujo de carga
        'confirmado_carga_por',
        'fecha_confirmacion_carga',
        'iniciada_entrega_por',
        'fecha_inicio_entrega',

        // GPS Tracking
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
     * Ventas asociadas a esta entrega (NUEVO - modelo consolidado)
     *
     * NUEVA ARQUITECTURA (FASE 1 REFACTORIZACIÓN):
     * Una entrega ahora puede contener múltiples ventas
     * Ejemplo: Entrega a zona centro con 3 clientes diferentes
     *
     * Uso:
     *   $entrega->ventas;  // Todas las ventas
     *   $entrega->ventas()->confirmadas()->get();  // Solo las confirmadas en almacén
     *   $entrega->ventas()->pendientes()->get();  // Pendientes de confirmar carga
     */
    public function ventas(): BelongsToMany
    {
        return $this->belongsToMany(
            Venta::class,
            'entrega_venta',      // tabla pivot
            'entrega_id',         // FK en pivot hacia entregas
            'venta_id'            // FK en pivot hacia ventas
        )
        ->withPivot([
            'orden',
            'confirmado_por',
            'fecha_confirmacion',
            'notas',
            'created_at',
            'updated_at',
        ])
        ->orderByPivot('orden');  // Ordenar por orden de carga (evita ambiguous column)
    }

    /**
     * Acceso directo a la tabla pivot (entrega_venta)
     * Útil para acceder a metadatos del vínculo
     */
    public function ventasAsociadas(): HasMany
    {
        return $this->hasMany(EntregaVenta::class);
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
     * Localidad/Zona de entrega
     */
    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class, 'zona_id');
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
     * Validaciones antes de crear/actualizar + Sincronización con Ventas
     *
     * CAMBIOS EN FASE 2:
     * - Removemos validación de venta_id (ahora via pivot entrega_venta)
     * - La sincronización ocurre a través del servicio CrearEntregaPorLocalidadService
     * - Cada entrega puede tener 0 o N ventas (se agregan después via pivot)
     */
    protected static function boot(): void
    {
        parent::boot();

        // Validar que siempre haya proforma_id O entregas estén siendo creadas sin venta_id
        // (Las ventas se agregan después via pivot entrega_venta)
        static::creating(function ($model) {
            // En la nueva arquitectura, venta_id no es requerido
            // Las ventas se asignan después via la tabla pivot entrega_venta
            // Solo validar proforma_id para compatibilidad legacy
            // (En la mayoría de casos nuevos, proforma_id será null)
        });

        // Ya no sincronizamos por venta_id simple
        // La sincronización ocurre en:
        // - CrearEntregaPorLocalidadService (al crear entrega con ventas)
        // - Al cambiar estado de entrega (sincroniza todas las ventas)

        // Sincronizar estado de TODAS las ventas cuando cambia estado de entrega
        static::updated(function ($model) {
            // Solo si cambió el estado
            if ($model->isDirty('estado')) {
                $estadoAnterior = $model->getOriginal('estado');
                $estadoNuevo = $model->estado;

                // Sincronizar todas las ventas asociadas a esta entrega
                if ($model->ventas()->count() > 0) {
                    $sincronizador = app(\App\Services\Logistica\SincronizacionVentaEntregaService::class);
                    foreach ($model->ventas as $venta) {
                        $sincronizador->alCambiarEstadoEntrega($model, $estadoAnterior, $estadoNuevo, $venta);
                    }
                }
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

    /**
     * ─────────────────────────────────────────────
     * MÉTODOS PARA CONFIRMACIÓN DE CARGA (FASE 2+)
     * ─────────────────────────────────────────────
     *
     * Flujo:
     * 1. Almacenero ve Entrega #100 con 3 ventas
     * 2. Confirma cada venta al cargarla al vehículo
     * 3. Sistema marca automáticamente Entrega como LISTA_PARA_ENTREGA
     *    cuando todas las ventas están confirmadas
     */

    /**
     * Obtener todas las ventas de esta entrega
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function obtenerVentas()
    {
        return $this->ventas()->orderBy('entrega_venta.orden')->get();
    }

    /**
     * Obtener las ventas confirmadas como cargadas
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function obtenerVentasConfirmadas()
    {
        return $this->ventasAsociadas()
            ->confirmed()
            ->get()
            ->map(fn($ev) => $ev->venta);
    }

    /**
     * Obtener las ventas pendientes de confirmación
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function obtenerVentasPendientes()
    {
        return $this->ventasAsociadas()
            ->pendientes()
            ->get()
            ->map(fn($ev) => $ev->venta);
    }

    /**
     * Confirmar una venta como cargada en el vehículo
     *
     * Uso:
     *   $entrega->confirmarVentaCargada($venta, auth()->user(), 'Notas...');
     *
     * @param \App\Models\Venta $venta
     * @param \App\Models\User|null $usuario Usuario que confirma (almacenero)
     * @param string|null $notas Observaciones
     * @return void
     * @throws \Exception Si la venta no pertenece a esta entrega
     */
    public function confirmarVentaCargada(Venta $venta, ?User $usuario = null, ?string $notas = null): void
    {
        // Verificar que la venta pertenece a esta entrega
        $entregaVenta = $this->ventasAsociadas()
            ->where('venta_id', $venta->id)
            ->first();

        if (!$entregaVenta) {
            throw new \InvalidArgumentException(
                "Venta #{$venta->id} no pertenece a Entrega #{$this->id}"
            );
        }

        // Confirmar la venta
        $entregaVenta->confirmarCarga($usuario, $notas);

        // Si todas las ventas están confirmadas, cambiar estado a LISTA_PARA_ENTREGA
        if ($this->todasVentasConfirmadas()) {
            try {
                if ($this->esTransicionValida(self::ESTADO_LISTO_PARA_ENTREGA)) {
                    $this->cambiarEstado(
                        self::ESTADO_LISTO_PARA_ENTREGA,
                        'Todas las ventas fueron confirmadas como cargadas',
                        $usuario
                    );
                }
            } catch (\Exception $e) {
                // Log pero no fallar si no se puede cambiar estado
                \Log::warning("No se pudo cambiar estado de entrega a LISTO_PARA_ENTREGA: " . $e->getMessage());
            }
        }
    }

    /**
     * Verificar si todas las ventas de esta entrega fueron confirmadas como cargadas
     *
     * @return bool
     */
    public function todasVentasConfirmadas(): bool
    {
        $total = $this->ventas()->count();
        if ($total === 0) {
            return false;  // Si no hay ventas, no está todo confirmado
        }

        $confirmadas = $this->ventasAsociadas()
            ->whereNotNull('fecha_confirmacion')
            ->count();

        return $confirmadas === $total;
    }

    /**
     * Obtener el progreso de confirmación de carga
     *
     * @return array ['confirmadas' => 2, 'total' => 3, 'porcentaje' => 66.67]
     */
    public function obtenerProgresoConfirmacion(): array
    {
        $total = $this->ventas()->count();
        $confirmadas = $this->ventasAsociadas()
            ->whereNotNull('fecha_confirmacion')
            ->count();

        return [
            'confirmadas' => $confirmadas,
            'total' => $total,
            'pendientes' => $total - $confirmadas,
            'porcentaje' => $total > 0 ? round(($confirmadas / $total) * 100, 2) : 0,
            'completado' => $confirmadas === $total,
        ];
    }

    /**
     * Desmarcar una venta como cargada
     * (En caso de error después de confirmar)
     *
     * @param \App\Models\Venta $venta
     * @param string|null $razon
     * @return void
     * @throws \Exception Si la venta no pertenece a esta entrega
     */
    public function desmarcarVentaCargada(Venta $venta, ?string $razon = null): void
    {
        $entregaVenta = $this->ventasAsociadas()
            ->where('venta_id', $venta->id)
            ->first();

        if (!$entregaVenta) {
            throw new \InvalidArgumentException(
                "Venta #{$venta->id} no pertenece a Entrega #{$this->id}"
            );
        }

        $entregaVenta->desmarcarCarga($razon ?? 'Desmarcado manualmente');
    }

    /**
     * Obtener el peso total de todas las ventas
     *
     * @return float
     */
    public function obtenerPesoTotal(): float
    {
        return $this->ventas()->sum('peso_estimado') ?? 0;
    }

    /**
     * Obtener el volumen total de todas las ventas
     *
     * @return float
     */
    public function obtenerVolumenTotal(): float
    {
        return $this->ventas()->sum('volumen_estimado') ?? 0;
    }

    /**
     * Verificar si la entrega cabe en el vehículo asignado
     *
     * @return bool
     */
    public function cabe_en_vehiculo(): bool
    {
        if (!$this->vehiculo) {
            return true;  // Sin vehículo asignado, asumir que cabe
        }

        $pesoTotal = $this->obtenerPesoTotal();
        return $pesoTotal <= ($this->vehiculo->capacidad_kg ?? PHP_INT_MAX);
    }

    /**
     * Obtener el porcentaje de utilización del vehículo
     *
     * @return float 0 a 100
     */
    public function obtenerPorcentajeUtilizacion(): float
    {
        if (!$this->vehiculo || !$this->vehiculo->capacidad_kg) {
            return 0;
        }

        $pesoTotal = $this->obtenerPesoTotal();
        return min(100, round(($pesoTotal / $this->vehiculo->capacidad_kg) * 100, 2));
    }

    /**
     * Agregar una venta a esta entrega
     *
     * Uso:
     *   $entrega->agregarVenta($venta, 4, 'Agregada posteriormente');
     *
     * @param \App\Models\Venta $venta
     * @param int|null $orden Orden de carga (si null, se agrega al final)
     * @param string|null $notas Notas
     * @return \App\Models\EntregaVenta
     */
    public function agregarVenta(Venta $venta, ?int $orden = null, ?string $notas = null)
    {
        // Obtener el orden si no se proporciona
        if ($orden === null) {
            $orden = ($this->ventas()->count() ?? 0) + 1;
        }

        // Verificar que la venta no esté ya en esta entrega
        if ($this->ventas()->where('venta_id', $venta->id)->exists()) {
            throw new \InvalidArgumentException(
                "Venta #{$venta->id} ya pertenece a Entrega #{$this->id}"
            );
        }

        // Agregar a la relación
        $this->ventas()->attach($venta->id, [
            'orden' => $orden,
            'notas' => $notas,
        ]);

        // Retornar el registro pivot
        return $this->ventasAsociadas()
            ->where('venta_id', $venta->id)
            ->first();
    }

    /**
     * Remover una venta de esta entrega
     *
     * @param \App\Models\Venta $venta
     * @return bool
     */
    public function removerVenta(Venta $venta): bool
    {
        return (bool)$this->ventas()->detach($venta->id);
    }

    /**
     * Accesores para alias de coordenadas
     * Mapea latitud_actual → latitud y longitud_actual → longitud
     */
    public function getLatitudAttribute(): ?float
    {
        return $this->latitud_actual;
    }

    public function getLongitudAttribute(): ?float
    {
        return $this->longitud_actual;
    }
}
