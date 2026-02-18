<?php
namespace App\Models;

use App\Models\Traits\GeneratesSequentialCode;
use App\Models\Traits\ManageEstadosLogisticos;
use App\Services\StockService;
use Exception;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;

class Venta extends Model
{
    use HasFactory, GeneratesSequentialCode, ManageEstadosLogisticos;

    protected $fillable = [
        'numero',
        'fecha',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'peso_total_estimado',  // ✅ NUEVO: Peso total en kg (cantidad * peso_producto)
        'observaciones',
        'observaciones_logistica',  // ✅ NUEVO: Observaciones sobre entrega (completa, incidentes, etc.)
        'cliente_id',
        'usuario_id',
        'estado_documento_id',
        'moneda_id',
        'proforma_id',
        'tipo_pago_id',
        'tipo_documento_id',
        'direccion_cliente_id',
        'caja_id',  // ✅ NUEVO: Caja en la que se realizó la venta
        // Campos para logística
        'requiere_envio',
        'canal_origen',
        'tipo_entrega',  // NUEVO: DELIVERY o PICKUP
        'estado_logistico_id',
        'empresa_logistica_id',  // ✅ NUEVO: Empresa de logística seleccionada
        'entrega_id',    // NUEVO - FASE 3: FK a entregas (relación 1:N)
        // Campos para confirmación de pickup
        'pickup_confirmado_cliente_en',      // NUEVO
        'pickup_confirmado_cliente_por_id',  // NUEVO
        'pickup_confirmado_empleado_en',     // NUEVO
        'pickup_confirmado_empleado_por_id', // NUEVO
        // Campos de política de pago
        'politica_pago',
        'estado_pago',
        'monto_pagado',
        'monto_pendiente',
        // Campos de SLA y compromisos de entrega
        'fecha_entrega_comprometida',
        'hora_entrega_comprometida',
        'ventana_entrega_ini',
        'ventana_entrega_fin',
        'idempotency_key',
        'fue_on_time',
        'minutos_retraso',
    ];

    protected function casts(): array
    {
        return [
            'fecha'          => 'date',
            'subtotal'       => 'decimal:2',
            'descuento'      => 'decimal:2',
            'impuesto'       => 'decimal:2',
            'total'          => 'decimal:2',
            'peso_total_estimado' => 'decimal:2',  // ✅ NUEVO: Peso en kg con 2 decimales
            'requiere_envio' => 'boolean',
            'monto_pagado'   => 'decimal:2',
            'monto_pendiente' => 'decimal:2',
            'fecha_entrega_comprometida' => 'date',
            'hora_entrega_comprometida' => 'datetime:H:i:s',
            'ventana_entrega_ini' => 'datetime:H:i:s',
            'ventana_entrega_fin' => 'datetime:H:i:s',
            'fue_on_time' => 'boolean',
            // Casts para confirmación de pickup
            'pickup_confirmado_cliente_en' => 'datetime',
            'pickup_confirmado_empleado_en' => 'datetime',
        ];
    }

    /**
     * ✅ NUEVO: Accessor para obtener el código de estado logístico desde la relación
     *
     * Convierte estado_logistico_id (FK) a estado_logistico (código)
     * Permite que el frontend acceda a $venta->estado_logistico
     * en lugar de $venta->estadoLogistica->codigo
     */
    protected function estadoLogistico(): Attribute
    {
        return Attribute::make(
            get: function () {
                // Acceder a la relación estadoLogistica (no a este accessor para evitar recursión)
                $relacion = $this->getAttribute('estadoLogistica');
                if ($relacion) {
                    return $relacion->codigo ?? 'SIN_ENTREGA';
                }
                return 'SIN_ENTREGA';
            }
        );
    }

    /**
     * ✅ Accessor para obtener el nombre del estado desde la relación estadoDocumento
     *
     * Convierte estado_documento_id (FK) a estado (nombre)
     * Permite acceder a $venta->estado en lugar de $venta->estadoDocumento->nombre
     */
    protected function estado(): Attribute
    {
        return Attribute::make(
            get: function () {
                // Acceder a la relación estadoDocumento
                $relacion = $this->getAttribute('estadoDocumento');
                if ($relacion) {
                    return $relacion->nombre;
                }
                return null;
            }
        );
    }

    protected static function booted()
    {
        // Después de crear una venta, generar movimientos automáticamente
        static::created(function ($venta) {
            // ⚠️ CAMBIO CRÍTICO: Solo procesar stock si:
            // 1. NO requiere envío (para ventas con envío, se procesa al iniciar preparación)
            // 2. NO viene de una proforma (el stock ya fue consumido al convertir)
            //
            // IMPORTANTE: Si viene de proforma, las reservas ya se consumieron
            // en ProformaController::convertirAVenta() mediante $proforma->consumirReservas()
            if (!$venta->requiere_envio && !$venta->proforma_id) {
                $venta->procesarMovimientosStock();
            }

            // TODO: Generar movimientos contables cuando CuentaContable esté completamente configurado
            // Por ahora, solo generar movimientos de caja
            // $venta->generarAsientoContable();

            // Generar movimiento de caja
            try {
                $venta->generarMovimientoCaja();
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Error generando movimiento de caja para venta {$venta->numero}: " . $e->getMessage());
            }
        });

        // Antes de eliminar una venta, revertir movimientos
        static::deleting(function ($venta) {
            $venta->revertirMovimientosStock();
            $venta->eliminarAsientoContable();
        });
    }

    // Relaciones
    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }

    public function estadoDocumento()
    {
        return $this->belongsTo(EstadoDocumento::class);
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class);
    }

    public function proforma()
    {
        return $this->belongsTo(Proforma::class);
    }

    public function caja()
    {
        return $this->belongsTo(Caja::class);
    }

    public function detalles()
    {
        return $this->hasMany(DetalleVenta::class);
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }

    public function cuentaPorCobrar()
    {
        return $this->hasOne(CuentaPorCobrar::class);
    }

    public function movimientoCaja()
    {
        return $this->hasOne(MovimientoCaja::class, 'numero_documento', 'numero');
    }

    public function asientoContable()
    {
        return $this->morphOne(AsientoContable::class, 'asientable');
    }

    /**
     * Entregas asociadas a esta venta (NUEVA ARQUITECTURA - FASE 3)
     *
     * RELACIÓN 1:N: Una venta pertenece a UNA entrega
     *
     * MIGRACIÓN:
     * - FASE 1: N:M via pivot table (entrega_venta) ← LEGACY
     * - FASE 3: 1:N via FK entrega_id (relación actual) ← ACTUAL
     *
     * USO:
     *   $venta->entrega              // Obtener entrega asignada
     *   $venta->entrega->estado      // Estado actual
     *   $venta->entrega->chofer      // Chofer asignado
     *
     * NOTA: El método legacy $venta->entregas() (N:M) se mantiene
     *       para compatibilidad temporal pero será deprecado en FASE 3b
     */
    public function entrega()
    {
        return $this->belongsTo(Entrega::class, 'entrega_id');
    }

    /**
     * ✅ NUEVA FASE 3: Entregas asociadas a esta venta (N:M via pivot)
     *
     * Relación N:M via pivot table entrega_venta
     * Una venta puede estar en múltiples entregas consolidadas
     *
     * Se usa para:
     * - Sincronizar estados cuando entrega cambia
     * - Rastrear múltiples entregas de una venta
     * - Consolidar cargas (múltiples ventas en una entrega)
     */
    public function entregas()
    {
        return $this->belongsToMany(
            Entrega::class,
            'entrega_venta',      // tabla pivot
            'venta_id',           // FK en pivot hacia ventas
            'entrega_id'          // FK en pivot hacia entregas
        )
        ->withPivot([
            'orden',
            'confirmado_por',
            'fecha_confirmacion',
            'notas',
            'created_at',
            'updated_at',
        ])
        ->orderByPivot('orden');  // Usar orderByPivot para evitar ambiguous column
    }

    /**
     * Entregas asociadas a esta venta (LEGACY - FASE 1)
     *
     * ⚠️ DEPRECADO en FASE 3: Usar $venta->entregas() en su lugar
     *
     * Relación N:M via pivot table entrega_venta
     * Se mantiene por compatibilidad durante transición
     *
     * SERÁ ELIMINADA cuando se dropee tabla pivot en FASE 3b
     */
    public function entregasLegacy()
    {
        return $this->entregas();  // Redirigir a la relación nueva
    }

    /**
     * Dirección de cliente asociada a esta venta
     */
    public function direccionCliente()
    {
        return $this->belongsTo(\App\Models\DireccionCliente::class, 'direccion_cliente_id');
    }

    /**
     * Usuario que confirmó el pickup desde el cliente (app)
     */
    public function pickupConfirmadoClientePor()
    {
        return $this->belongsTo(User::class, 'pickup_confirmado_cliente_por_id');
    }

    /**
     * Usuario que confirmó el pickup desde el empleado (almacén)
     */
    public function pickupConfirmadoEmpleadoPor()
    {
        return $this->belongsTo(User::class, 'pickup_confirmado_empleado_por_id');
    }

    /**
     * Relación con el estado logístico (FK)
     */
    public function estadoLogistica()
    {
        return $this->belongsTo(EstadoLogistica::class, 'estado_logistico_id');
    }

    /**
     * ✅ NUEVO: Relación con la empresa de logística
     */
    public function empresaLogistica()
    {
        return $this->belongsTo(Empresa::class, 'empresa_logistica_id');
    }

    /**
     * Relación con el token de acceso público
     */
    public function accessToken()
    {
        return $this->hasOne(VentaAccessToken::class);
    }

    /**
     * Métodos de Utilidad para Logística
     */

    /**
     * Obtener información de entregas y estado logístico
     */
    public function obtenerDetalleLogistico(): array
    {
        $sincronizador = app(\App\Services\Logistica\SincronizacionVentaEntregaService::class);
        return $sincronizador->obtenerDetalleEntregas($this);
    }

    /**
     * Verificar si la venta está siendo entregada
     */
    public function estaBeingDelivered(): bool
    {
        return in_array($this->estado_logistico, [
            'EN_PREPARACION',
            'EN_TRANSITO',
        ]);
    }

    /**
     * Verificar si la entrega fue completada
     */
    public function wasDelivered(): bool
    {
        return $this->estado_logistico === 'ENTREGADA';
    }

    /**
     * Verificar si hay problemas en la entrega
     */
    public function hasDeliveryProblems(): bool
    {
        return $this->estado_logistico === 'PROBLEMAS';
    }

    /**
     * Obtener estado logístico legible
     */
    public function getEstadoLogisticoLabel(): string
    {
        $labels = [
            'SIN_ENTREGA' => 'Sin Entrega',
            'PROGRAMADO' => 'Programado',
            'EN_PREPARACION' => 'En Preparación',
            'EN_TRANSITO' => 'En Tránsito',
            'ENTREGADA' => 'Entregada',
            'PROBLEMAS' => 'Con Problemas',
            'CANCELADA' => 'Cancelada',
        ];

        return $labels[$this->estado_logistico] ?? 'Desconocido';
    }

    /**
     * Obtener color para representar estado logístico
     */
    public function getEstadoLogisticoColor(): string
    {
        $colors = [
            'SIN_ENTREGA' => 'gray',
            'PROGRAMADO' => 'blue',
            'EN_PREPARACION' => 'yellow',
            'EN_TRANSITO' => 'purple',
            'ENTREGADA' => 'green',
            'PROBLEMAS' => 'red',
            'CANCELADA' => 'dark',
        ];

        return $colors[$this->estado_logistico] ?? 'gray';
    }

    // Constantes para el nuevo sistema
    const CANAL_APP_EXTERNA = 'APP_EXTERNA';

    const CANAL_WEB = 'WEB';

    const CANAL_PRESENCIAL = 'PRESENCIAL';

    // Tipos de entrega
    const TIPO_DELIVERY = 'DELIVERY';

    const TIPO_PICKUP = 'PICKUP';

    // Políticas de pago
    const POLITICA_CONTRA_ENTREGA = 'CONTRA_ENTREGA';

    const POLITICA_ANTICIPADO_100 = 'ANTICIPADO_100';

    const POLITICA_MEDIO_MEDIO = 'MEDIO_MEDIO';

    const POLITICA_CREDITO = 'CREDITO';

    // Estados Logísticos
    const ESTADO_LOGISTICO_SIN_ENTREGA = 'SIN_ENTREGA';
    const ESTADO_LOGISTICO_PROGRAMADO = 'PROGRAMADO';
    const ESTADO_LOGISTICO_EN_PREPARACION = 'EN_PREPARACION';
    const ESTADO_LOGISTICO_EN_TRANSITO = 'EN_TRANSITO';
    const ESTADO_LOGISTICO_ENTREGADA = 'ENTREGADA';
    const ESTADO_LOGISTICO_PROBLEMAS = 'PROBLEMAS';
    const ESTADO_LOGISTICO_CANCELADA = 'CANCELADA';

    // Estados específicos para PICKUP
    const ESTADO_LOGISTICO_PENDIENTE_RETIRO = 'PENDIENTE_RETIRO';
    const ESTADO_LOGISTICO_RETIRADO = 'RETIRADO';

    const ESTADO_PENDIENTE_ENVIO = 'PENDIENTE_ENVIO';

    const ESTADO_PREPARANDO = 'PREPARANDO';

    const ESTADO_ENVIADO = 'ENVIADO';

    const ESTADO_ENTREGADO = 'ENTREGADO';

    // Nuevos métodos para logística
    public function puedeEnviarse(): bool
    {
        return $this->requiere_envio &&
        $this->estado_logistico === self::ESTADO_PENDIENTE_ENVIO &&
        $this->estadoDocumento &&
        $this->estadoDocumento->nombre === 'CONFIRMADO';
    }

    public function programarEnvio(array $datos): Envio
    {
        return Envio::create([
            'numero_envio'      => Envio::generarNumeroEnvio(),
            'venta_id'          => $this->id,
            'vehiculo_id'       => $datos['vehiculo_id'],
            'chofer_id'         => $datos['chofer_id'],
            'fecha_programada'  => $datos['fecha_programada'],
            'direccion_entrega' => $this->cliente->direccion ?? $datos['direccion_entrega'],
            'estado'            => Envio::PROGRAMADO,
        ]);
    }

    public function esDeAppExterna(): bool
    {
        return $this->canal_origen === self::CANAL_APP_EXTERNA;
    }

    public function esPickup(): bool
    {
        return $this->tipo_entrega === self::TIPO_PICKUP;
    }

    public function esDelivery(): bool
    {
        return $this->tipo_entrega === self::TIPO_DELIVERY;
    }

    // ✅ Helpers para política de pago
    public function esContraEntrega(): bool
    {
        return $this->politica_pago === self::POLITICA_CONTRA_ENTREGA;
    }

    public function esAnticipadoCompleto(): bool
    {
        return $this->politica_pago === self::POLITICA_ANTICIPADO_100;
    }

    public function esMedioMedio(): bool
    {
        return $this->politica_pago === self::POLITICA_MEDIO_MEDIO;
    }

    public function solicitaCredito(): bool
    {
        return $this->politica_pago === self::POLITICA_CREDITO;
    }

    public function puedeConfirmarsePickupPorCliente(): bool
    {
        return $this->esPickup()
            && $this->estado_logistico === self::ESTADO_LOGISTICO_PENDIENTE_RETIRO
            && !$this->pickup_confirmado_cliente_en;
    }

    public function puedeConfirmarsePickupPorEmpleado(): bool
    {
        return $this->esPickup()
            && $this->estado_logistico === self::ESTADO_LOGISTICO_PENDIENTE_RETIRO
            && !$this->pickup_confirmado_empleado_en;
    }

    public function pickupCompletamenteConfirmado(): bool
    {
        return $this->pickup_confirmado_cliente_en !== null
            && $this->pickup_confirmado_empleado_en !== null;
    }

    // Scopes para el nuevo sistema
    public function scopeQueRequierenEnvio($query)
    {
        return $query->where('requiere_envio', true);
    }

    public function scopeDeAppExterna($query)
    {
        return $query->where('canal_origen', self::CANAL_APP_EXTERNA);
    }

    public function scopePendientesDeEnvio($query)
    {
        return $query->where('estado_logistico', self::ESTADO_PENDIENTE_ENVIO);
    }

    /**
     * Generar número automático para la venta con protección contra race conditions
     *
     * ✅ CONSOLIDADO: Usa GeneratesSequentialCode trait
     * Formato: VEN + FECHA_ACTUAL + SECUENCIAL (6 dígitos)
     * Ejemplo: VEN20250000001
     */
    public static function generarNumero(): string
    {
        return static::generateSequentialCode('VEN', 'numero', true, 'Ymd', 6);
    }

    /**
     * Validar stock disponible antes de crear la venta
     */
    public function validarStock(int $almacenId = 1): array
    {
        $stockService = app(StockService::class);

        $productos = $this->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad'    => $detalle->cantidad,
            ];
        })->toArray();

        return $stockService->validarStockDisponible($productos, $almacenId);
    }

    /**
     * Procesar movimientos de stock automáticamente
     *
     * IMPORTANTE: No validar stock aquí - procesarSalidaVenta() ya lo hace CON LOCK
     * Eliminar la validación previa previene race conditions TOC/TOU
     */
    public function procesarMovimientosStock(int $almacenId = 1): void
    {
        if ($this->detalles->isEmpty()) {
            return;
        }

        $stockService = app(StockService::class);

        $productos = $this->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad'    => $detalle->cantidad,
            ];
        })->toArray();

        // Después de construir $productos y antes del try:
        $productosParaStock = $stockService->expandirCombos($productos);

        try {
            // ✅ CORRECCIÓN CR#1: NO validar stock aquí
            // La validación ocurre DENTRO de procesarSalidaVenta() con lockForUpdate()
            // Esto previene race conditions TOC/TOU

            // Procesar salida de stock (incluye validación con lock)
            $stockService->procesarSalidaVenta($productosParaStock, $this->numero, $almacenId);

        } catch (Exception $e) {
            Log::error("Error procesando stock para venta {$this->numero}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Revertir movimientos de stock al eliminar venta
     *
     * IMPORTANTE: Actualiza tanto cantidad como cantidad_disponible
     */
    public function revertirMovimientosStock(): void
    {
        // ✅ CORREGIDO (2026-02-10): Buscar AMBOS tipos de movimiento
        // - SALIDA_VENTA: Ventas creadas directamente (sin proforma)
        // - CONSUMO_RESERVA: Ventas convertidas desde proforma
        // ✅ CORREGIDO (2026-02-11): Agregado lockForUpdate() para prevenir race conditions
        $movimientos = MovimientoInventario::where('numero_documento', $this->numero)
            ->whereIn('tipo', [
                MovimientoInventario::TIPO_SALIDA_VENTA,
                'CONSUMO_RESERVA'  // ✅ Agregar este tipo para proformas convertidas a venta
            ])
            ->lockForUpdate()  // ✅ Previene race conditions en actualizaciones concurrentes
            ->get();

        DB::beginTransaction();

        try {
            foreach ($movimientos as $movimiento) {
                $stockProducto = $movimiento->stockProducto;
                $cantidadADevolver = abs($movimiento->cantidad);
                $cantidadAnterior = $stockProducto->cantidad;
                $cantidadDisponibleAnterior = $stockProducto->cantidad_disponible;

                // ✅ DEBUG: Log ANTES de actualizar
                Log::debug('🔄 [ANULAR VENTA - STOCK REVERT] ANTES DE ACTUALIZAR', [
                    'venta' => $this->numero,
                    'stock_producto_id' => $stockProducto->id,
                    'producto_id' => $stockProducto->producto_id,
                    'lote' => $stockProducto->lote,
                    'cantidad_a_devolver' => $cantidadADevolver,
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                ]);

                // ✅ CORREGIDO: Actualizar stock usando UPDATE atómico
                // Usar parámetros vinculados para evitar inyección SQL y asegurar que cantidad_disponible se actualiza
                // ✅ CORREGIDO (2026-02-16): Cast a (float) para preservar decimales en productos fraccionados
                $affected = DB::table('stock_productos')
                    ->where('id', $stockProducto->id)
                    ->update([
                        'cantidad' => DB::raw("cantidad + " . (float)$cantidadADevolver),
                        'cantidad_disponible' => DB::raw("cantidad_disponible + " . (float)$cantidadADevolver),
                        'fecha_actualizacion' => DB::raw('CURRENT_TIMESTAMP'),
                    ]);

                if ($affected === 0) {
                    throw new Exception("Error al revertir stock para stock_producto_id {$stockProducto->id}");
                }

                // ✅ CORREGIDO: Obtener los valores REALES de BD después de actualizar
                $stockActualizado = \App\Models\StockProducto::find($stockProducto->id);
                $cantidadNueva = $stockActualizado->cantidad;
                $cantidadDisponibleNueva = $stockActualizado->cantidad_disponible;

                // ✅ DEBUG: Log DESPUÉS de actualizar
                Log::debug('✅ [ANULAR VENTA - STOCK REVERT] DESPUÉS DE ACTUALIZAR', [
                    'venta' => $this->numero,
                    'stock_producto_id' => $stockProducto->id,
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_nueva' => $cantidadNueva,
                    'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                    'cantidad_disponible_nueva' => $cantidadDisponibleNueva,
                    'diferencia_cantidad' => $cantidadNueva - $cantidadAnterior,
                    'diferencia_disponible' => $cantidadDisponibleNueva - $cantidadDisponibleAnterior,
                ]);

                // Crear movimiento de reversión
                MovimientoInventario::create([
                    'stock_producto_id' => $stockProducto->id,
                    'cantidad'          => $cantidadADevolver,
                    'fecha'             => now(),
                    'observacion'       => "Reversión de venta #{$this->numero}",
                    'numero_documento'  => $this->numero . '-REV',
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_posterior' => $cantidadNueva,  // ✅ Ahora con valor real de BD
                    'tipo'              => MovimientoInventario::TIPO_ENTRADA_AJUSTE,
                    'user_id'           => Auth::id() ?? 1,  // ✅ CORREGIDO: Fallback a usuario 1 si no hay autenticación
                ]);

                // Si el lote queda en cantidad 0 o negativo, eliminarlo completamente (hard delete)
                if ($cantidadNueva <= 0) {
                    Log::info('Eliminando lote completamente por anulación de venta', [
                        'venta' => $this->numero,
                        'stock_producto_id' => $stockProducto->id,
                        'producto_id' => $stockProducto->producto_id,
                        'lote' => $stockProducto->lote,
                        'almacen_id' => $stockProducto->almacen_id,
                        'cantidad_final' => $cantidadNueva,
                    ]);

                    // ✅ Primero eliminar los movimientos de inventario asociados (para evitar FK constraint)
                    \App\Models\MovimientoInventario::where('stock_producto_id', $stockProducto->id)
                        ->forceDelete();

                    // ✅ Luego eliminar el stock_producto - Hard delete
                    $stockProducto->forceDelete();
                }

                Log::info('✅ Stock revertido por anulación de venta', [
                    'venta' => $this->numero,
                    'stock_producto_id' => $stockProducto->id,
                    'producto_id' => $stockProducto->producto_id,
                    'lote' => $stockProducto->lote,
                    'cantidad_devuelta' => $cantidadADevolver,
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_final' => $cantidadNueva,
                    'cantidad_disponible_anterior' => $cantidadDisponibleAnterior,
                    'cantidad_disponible_final' => $cantidadDisponibleNueva,
                    'movimiento_revercion_registrado' => $this->numero . '-REV',
                ]);
            }

            DB::commit();

            Log::info('✅ Movimientos de venta revertidos exitosamente (incluye CONSUMO_RESERVA)', [
                'venta' => $this->numero,
                'movimientos_revertidos' => $movimientos->count(),
                'tipos_revertidos' => $movimientos->pluck('tipo')->unique()->toArray(),
            ]);

        } catch (Exception $e) {
            DB::rollBack();

            Log::error('❌ Error al revertir movimientos de venta (CONSUMO_RESERVA + SALIDA_VENTA)', [
                'venta' => $this->numero,
                'error' => $e->getMessage(),
                'movimientos_encontrados' => $movimientos->count() ?? 0,
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Revertir movimiento de caja al anular venta
     *
     * Crea un movimiento de egreso (monto negativo) para compensar el ingreso original
     */
    public function revertirMovimientoCaja(): void
    {
        if (!$this->movimientoCaja) {
            return;
        }

        try {
            $movimientoOriginal = $this->movimientoCaja;

            // Obtener el tipo de operación ANULACION para la reversión
            $tipoOperacionAnulacion = TipoOperacionCaja::where('codigo', 'ANULACION')->firstOrFail();

            // Crear movimiento de reversión con monto negativo
            MovimientoCaja::create([
                'caja_id'             => $movimientoOriginal->caja_id,
                'user_id'             => Auth::id(),
                'fecha'               => now(),
                'monto'               => -abs($movimientoOriginal->monto), // Negativo para restar
                'observaciones'       => "Anulación de venta #{$this->numero}",
                'numero_documento'    => $this->numero . '-ANU',
                'tipo_operacion_id'   => $tipoOperacionAnulacion->id,
                'tipo_pago_id'        => $movimientoOriginal->tipo_pago_id, // Mantener mismo tipo de pago
                'venta_id'            => $this->id,
            ]);

            Log::info('Movimiento de caja revertido por anulación de venta', [
                'venta'                  => $this->numero,
                'movimiento_original_id' => $movimientoOriginal->id,
                'monto_original'         => $movimientoOriginal->monto,
                'monto_reversa'          => -abs($movimientoOriginal->monto),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al revertir movimiento de caja para venta ' . $this->numero, [
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Obtener resumen de stock afectado
     */
    public function obtenerResumenStock(): array
    {
        $movimientos = MovimientoInventario::where('numero_documento', $this->numero)
            ->with(['stockProducto.producto', 'stockProducto.almacen'])
            ->get();

        return $movimientos->map(function ($movimiento) {
            return [
                'producto'        => $movimiento->stockProducto->producto->nombre,
                'almacen'         => $movimiento->stockProducto->almacen->nombre,
                'cantidad_movida' => abs($movimiento->cantidad),
                'stock_anterior'  => $movimiento->cantidad_anterior,
                'stock_actual'    => $movimiento->cantidad_posterior,
            ];
        })->toArray();
    }

    /**
     * Generar asiento contable automático
     */
    public function generarAsientoContable(): void
    {
        try {
            // No crear asiento si ya existe
            if ($this->asientoContable) {
                return;
            }

            AsientoContable::crearParaVenta($this);

            Log::info("Asiento contable generado para venta {$this->numero}");
        } catch (Exception $e) {
            Log::error("Error generando asiento contable para venta {$this->numero}: " . $e->getMessage());
        }
    }

    /**
     * Eliminar asiento contable
     */
    public function eliminarAsientoContable(): void
    {
        try {
            if ($this->asientoContable) {
                $this->asientoContable->delete();
                Log::info("Asiento contable eliminado para venta {$this->numero}");
            }
        } catch (Exception $e) {
            Log::error("Error eliminando asiento contable para venta {$this->numero}: " . $e->getMessage());
        }
    }

    /**
     * Generar movimiento de caja automático
     *
     * ✅ MEJORADO: Ahora acepta cajaId desde el controller via _caja_id attribute
     * Si no se proporciona, busca automáticamente la caja abierta del usuario
     */
    public function generarMovimientoCaja(): void
    {
        try {
            // Solo generar movimiento para ventas al contado
            if ($this->tipoPago?->codigo !== 'CONTADO') {
                return;
            }

            // No crear movimiento si ya existe
            if ($this->movimientoCaja) {
                return;
            }

            // ✅ Obtener cajaId: primero del controller (via _caja_id), luego de la base de datos
            $cajaId = $this->getAttribute('_caja_id');

            if (!$cajaId) {
                // Fallback: Obtener caja abierta (usar user_id como en el modelo)
                $cajaAbierta = AperturaCaja::where('user_id', $this->usuario_id)
                    ->whereDate('fecha', $this->fecha)
                    ->first();

                if (!$cajaAbierta) {
                    Log::warning("No hay caja abierta para generar movimiento de venta {$this->numero}");

                    return;
                }

                $cajaId = $cajaAbierta->caja_id;
            }

            // Obtener tipo de operación para venta
            $tipoOperacion = TipoOperacionCaja::where('codigo', 'VENTA')->first();

            if (! $tipoOperacion) {
                Log::warning('No existe tipo de operación VENTA para movimiento de caja');

                return;
            }

            MovimientoCaja::create([
                'caja_id'           => $cajaId,
                'tipo_operacion_id' => $tipoOperacion->id,
                'numero_documento'  => $this->numero,
                'descripcion'       => "Venta #{$this->numero} - Cliente: {$this->cliente?->nombre}",
                'monto'             => $this->total,
                'fecha'             => $this->fecha,
                'user_id'           => $this->usuario_id,
                'venta_id'          => $this->id,              // ✅ Asignar ID de venta
                'tipo_pago_id'      => $this->tipo_pago_id,    // ✅ Asignar tipo de pago
            ]);

            Log::info("Movimiento de caja generado para venta {$this->numero}");
        } catch (Exception $e) {
            Log::error("Error generando movimiento de caja para venta {$this->numero}: " . $e->getMessage());
        }
    }

    // ========== NUEVAS RELACIONES ==========

    /**
     * Relación con tipo de pago
     */
    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class);
    }

    /**
     * Relación con tipo de documento
     */
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumento::class);
    }

    /**
     * Relación many-to-many con impuestos
     */
    public function impuestos()
    {
        return $this->belongsToMany(Impuesto::class, 'venta_impuestos')
            ->withPivot(['base_imponible', 'porcentaje_aplicado', 'monto_impuesto'])
            ->withTimestamps();
    }

    /**
     * Relación hasMany con venta_impuestos (tabla pivot)
     */
    public function ventaImpuestos()
    {
        return $this->hasMany(VentaImpuesto::class);
    }

    /**
     * Relación con libro de ventas IVA
     */
    public function libroVentasIva()
    {
        return $this->hasOne(LibroVentasIva::class);
    }

    /**
     * Relación con factura electrónica
     */
    public function facturaElectronica()
    {
        return $this->hasOne(FacturaElectronica::class);
    }

    /**
     * Confirmaciones de entrega para esta venta
     *
     * Registros de confirmación de esta venta cuando fue entregada
     * Incluye fotos, firma digital, contexto de entrega (tienda abierta, cliente presente)
     * y motivos de rechazo si aplica
     *
     * Uso:
     *   $venta->confirmaciones              // Todas las confirmaciones
     *   $venta->confirmaciones()->first()   // Última confirmación (o la principal)
     */
    public function confirmaciones()
    {
        return $this->hasMany(EntregaVentaConfirmacion::class);
    }
}
