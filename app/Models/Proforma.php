<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Proforma extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'fecha',
        'fecha_vencimiento',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'observaciones',
        'observaciones_rechazo',
        'estado',
        'canal_origen',
        'cliente_id',
        'usuario_creador_id',
        'usuario_aprobador_id',
        'fecha_aprobacion',
        'moneda_id',
        // Solicitud de entrega del cliente
        'fecha_entrega_solicitada',
        'hora_entrega_solicitada',
        'direccion_entrega_solicitada_id',
        // Confirmación de entrega del vendedor
        'fecha_entrega_confirmada',
        'hora_entrega_confirmada',
        'direccion_entrega_confirmada_id',
        // Auditoría de coordinación
        'coordinacion_completada',
        'comentario_coordinacion',
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_vencimiento' => 'date',
        'fecha_aprobacion' => 'datetime',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuesto' => 'decimal:2',
        'total' => 'decimal:2',
        // Solicitud de entrega del cliente
        'fecha_entrega_solicitada' => 'date',
        'hora_entrega_solicitada' => 'datetime:H:i',
        // Confirmación de entrega del vendedor
        'fecha_entrega_confirmada' => 'date',
        'hora_entrega_confirmada' => 'datetime:H:i',
        'coordinacion_completada' => 'boolean',
    ];

    // Estados de la proforma
    const PENDIENTE = 'PENDIENTE';

    const APROBADA = 'APROBADA';

    const RECHAZADA = 'RECHAZADA';

    const CONVERTIDA = 'CONVERTIDA';

    const VENCIDA = 'VENCIDA';

    // Canales de origen
    const CANAL_APP_EXTERNA = 'APP_EXTERNA';

    const CANAL_WEB = 'WEB';

    const CANAL_PRESENCIAL = 'PRESENCIAL';

    // Relaciones
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function usuarioCreador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_creador_id');
    }

    public function usuarioAprobador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_aprobador_id');
    }

    public function moneda(): BelongsTo
    {
        return $this->belongsTo(Moneda::class);
    }

    /**
     * Dirección de entrega solicitada por el cliente
     */
    public function direccionSolicitada(): BelongsTo
    {
        return $this->belongsTo(DireccionCliente::class, 'direccion_entrega_solicitada_id');
    }

    /**
     * Dirección de entrega confirmada por el vendedor
     */
    public function direccionConfirmada(): BelongsTo
    {
        return $this->belongsTo(DireccionCliente::class, 'direccion_entrega_confirmada_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleProforma::class);
    }

    public function venta(): HasOne
    {
        return $this->hasOne(Venta::class);
    }

    public function reservas(): HasMany
    {
        return $this->hasMany(ReservaProforma::class);
    }

    public function reservasActivas(): HasMany
    {
        return $this->reservas()->activas();
    }

    public function entrega(): HasOne
    {
        return $this->hasOne(Entrega::class);
    }

    // Métodos de utilidad
    public function puedeAprobarse(): bool
    {
        return $this->estado === self::PENDIENTE && ! $this->estaVencida();
    }

    public function puedeRechazarse(): bool
    {
        return $this->estado === self::PENDIENTE;
    }

    public function puedeConvertirseAVenta(): bool
    {
        return $this->estado === self::APROBADA && ! $this->venta;
    }

    public function estaVencida(): bool
    {
        return $this->fecha_vencimiento && $this->fecha_vencimiento->isPast();
    }

    public function esDeAppExterna(): bool
    {
        return $this->canal_origen === self::CANAL_APP_EXTERNA;
    }

    // Generar número de proforma
    public static function generarNumeroProforma(): string
    {
        $fecha = now()->format('Ymd');
        $ultimo = self::whereDate('created_at', now()->toDateString())
            ->count() + 1;

        return "PRO-{$fecha}-".str_pad($ultimo, 4, '0', STR_PAD_LEFT);
    }

    // Scopes
    public function scopePendientes($query)
    {
        return $query->where('estado', self::PENDIENTE);
    }

    public function scopeAprobadas($query)
    {
        return $query->where('estado', self::APROBADA);
    }

    public function scopeDeAppExterna($query)
    {
        return $query->where('canal_origen', self::CANAL_APP_EXTERNA);
    }

    public function scopeVigentes($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('fecha_vencimiento')
                ->orWhere('fecha_vencimiento', '>=', now()->toDateString());
        });
    }

    // Aprobar proforma
    public function aprobar(User $usuario, ?string $observaciones = null): bool
    {
        if (! $this->puedeAprobarse()) {
            return false;
        }

        $this->update([
            'estado' => self::APROBADA,
            'usuario_aprobador_id' => $usuario->id,
            'fecha_aprobacion' => now(),
            'observaciones' => $observaciones ?? $this->observaciones,
        ]);

        // Enviar notificación WebSocket en tiempo real
        try {
            app(\App\Services\WebSocketNotificationService::class)
                ->notifyProformaApproved($this->fresh('usuarioAprobador'));
        } catch (\Exception $e) {
            \Log::warning('Error enviando notificación WebSocket de aprobación', [
                'proforma_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
        }

        return true;
    }

    // Rechazar proforma
    public function rechazar(User $usuario, string $motivo): bool
    {
        if (! $this->puedeRechazarse()) {
            return false;
        }

        $this->update([
            'estado' => self::RECHAZADA,
            'usuario_aprobador_id' => $usuario->id,
            'fecha_aprobacion' => now(),
            'observaciones_rechazo' => $motivo,
        ]);

        // Enviar notificación WebSocket en tiempo real
        try {
            app(\App\Services\WebSocketNotificationService::class)
                ->notifyProformaRejected($this->fresh('usuarioAprobador'), $motivo);
        } catch (\Exception $e) {
            \Log::warning('Error enviando notificación WebSocket de rechazo', [
                'proforma_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
        }

        return true;
    }

    // Marcar como convertida
    public function marcarComoConvertida(): bool
    {
        if (! $this->puedeConvertirseAVenta()) {
            return false;
        }

        $this->update(['estado' => self::CONVERTIDA]);

        return true;
    }

    /**
     * Gestión de reservas de stock
     */
    /**
     * Reservar stock para la proforma con protección contra race conditions
     *
     * IMPORTANTE: Este método maneja su propia transacción
     */
    public function reservarStock(): bool
    {
        // Si ya tiene reservas activas, no hacer nada
        if ($this->reservasActivas()->count() > 0) {
            \Illuminate\Support\Facades\Log::info('Proforma ya tiene reservas activas', [
                'proforma_id' => $this->id,
            ]);
            return true;
        }

        \Illuminate\Support\Facades\DB::beginTransaction();

        try {
            foreach ($this->detalles as $detalle) {
                // Buscar stock disponible con BLOQUEO PESIMISTA para evitar race conditions
                $stocksDisponibles = StockProducto::where('producto_id', $detalle->producto_id)
                    ->where('cantidad_disponible', '>', 0)
                    ->orderBy('fecha_vencimiento', 'asc')
                    ->orderBy('id', 'asc') // FIFO como criterio secundario
                    ->lockForUpdate() // 🔒 BLOQUEO PESIMISTA
                    ->get();

                $cantidadPendiente = $detalle->cantidad;

                foreach ($stocksDisponibles as $stock) {
                    if ($cantidadPendiente <= 0) {
                        break;
                    }

                    $cantidadAReservar = min($cantidadPendiente, $stock->cantidad_disponible);

                    // Reservar el stock (ya está bloqueado)
                    if ($stock->reservar($cantidadAReservar)) {
                        // Crear registro de reserva
                        ReservaProforma::create([
                            'proforma_id' => $this->id,
                            'stock_producto_id' => $stock->id,
                            'cantidad_reservada' => $cantidadAReservar,
                            'fecha_reserva' => now(),
                            'fecha_expiracion' => now()->addHours(24), // 24 horas para aprobar
                            'estado' => ReservaProforma::ACTIVA,
                        ]);

                        $cantidadPendiente -= $cantidadAReservar;

                        \Illuminate\Support\Facades\Log::info('Stock reservado para proforma', [
                            'proforma_id' => $this->id,
                            'producto_id' => $detalle->producto_id,
                            'stock_producto_id' => $stock->id,
                            'cantidad_reservada' => $cantidadAReservar,
                            'cantidad_pendiente' => $cantidadPendiente,
                        ]);
                    } else {
                        \Illuminate\Support\Facades\Log::warning('Fallo al reservar stock individual', [
                            'proforma_id' => $this->id,
                            'producto_id' => $detalle->producto_id,
                            'stock_producto_id' => $stock->id,
                            'cantidad_solicitada' => $cantidadAReservar,
                        ]);
                    }
                }

                // Si no se pudo reservar toda la cantidad
                if ($cantidadPendiente > 0) {
                    \Illuminate\Support\Facades\Log::warning('Stock insuficiente para reservar proforma completa', [
                        'proforma_id' => $this->id,
                        'producto_id' => $detalle->producto_id,
                        'cantidad_requerida' => $detalle->cantidad,
                        'cantidad_faltante' => $cantidadPendiente,
                    ]);

                    // Rollback automático de la transacción
                    \Illuminate\Support\Facades\DB::rollBack();
                    return false;
                }
            }

            // Todo exitoso, confirmar transacción
            \Illuminate\Support\Facades\DB::commit();

            \Illuminate\Support\Facades\Log::info('Stock reservado completamente para proforma', [
                'proforma_id' => $this->id,
                'numero_detalles' => $this->detalles->count(),
            ]);

            return true;

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();

            \Illuminate\Support\Facades\Log::error('Error al reservar stock para proforma', [
                'proforma_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Liberar todas las reservas activas de la proforma
     *
     * IMPORTANTE: Este método debe llamarse dentro de una transacción DB
     * Devuelve las cantidades reservadas a cantidad_disponible
     *
     * @return bool True si se liberaron reservas exitosamente
     */
    public function liberarReservas(): bool
    {
        $reservasActivas = $this->reservasActivas;

        if ($reservasActivas->isEmpty()) {
            \Illuminate\Support\Facades\Log::info('No hay reservas activas para liberar', [
                'proforma_id' => $this->id,
                'numero' => $this->numero,
            ]);
            return true; // No hay nada que hacer, pero no es un error
        }

        $reservasLiberadas = 0;
        $errores = [];

        foreach ($reservasActivas as $reserva) {
            try {
                if ($reserva->liberar()) {
                    $reservasLiberadas++;
                } else {
                    $errores[] = "Reserva ID {$reserva->id} no pudo liberarse";
                }
            } catch (\Exception $e) {
                $errores[] = "Reserva ID {$reserva->id}: {$e->getMessage()}";

                \Illuminate\Support\Facades\Log::error('Error al liberar reserva', [
                    'proforma_id' => $this->id,
                    'reserva_id' => $reserva->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        \Illuminate\Support\Facades\Log::info('Reservas liberadas', [
            'proforma_id' => $this->id,
            'numero' => $this->numero,
            'reservas_liberadas' => $reservasLiberadas,
            'errores' => count($errores),
        ]);

        return $reservasLiberadas > 0;
    }

    /**
     * Consumir todas las reservas activas de la proforma
     *
     * IMPORTANTE: Este método debe llamarse dentro de una transacción DB
     * Consume las reservas en orden, reduciendo la cantidad física del stock
     *
     * @throws \Exception Si alguna reserva falla al consumirse
     * @return bool True si todas las reservas se consumieron exitosamente
     */
    public function consumirReservas(): bool
    {
        // Validación: Debe tener reservas activas
        $reservasActivas = $this->reservasActivas;

        if ($reservasActivas->isEmpty()) {
            \Illuminate\Support\Facades\Log::warning('Intento de consumir reservas en proforma sin reservas activas', [
                'proforma_id' => $this->id,
                'numero' => $this->numero,
            ]);
            return false;
        }

        // Validación: Las reservas NO deben estar expiradas
        if ($this->tieneReservasExpiradas()) {
            \Illuminate\Support\Facades\Log::error('Intento de consumir reservas expiradas', [
                'proforma_id' => $this->id,
                'numero' => $this->numero,
            ]);
            throw new \Exception('No se pueden consumir reservas expiradas');
        }

        $reservasConsumidas = 0;
        $errores = [];

        foreach ($reservasActivas as $reserva) {
            try {
                if (!$reserva->consumir()) {
                    $errores[] = "Reserva ID {$reserva->id} falló al consumirse";

                    \Illuminate\Support\Facades\Log::error('Fallo al consumir reserva individual', [
                        'proforma_id' => $this->id,
                        'reserva_id' => $reserva->id,
                        'stock_producto_id' => $reserva->stock_producto_id,
                        'cantidad_reservada' => $reserva->cantidad_reservada,
                    ]);
                } else {
                    $reservasConsumidas++;
                }
            } catch (\Exception $e) {
                $errores[] = "Reserva ID {$reserva->id}: {$e->getMessage()}";

                \Illuminate\Support\Facades\Log::error('Excepción al consumir reserva', [
                    'proforma_id' => $this->id,
                    'reserva_id' => $reserva->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        // Si alguna reserva falló, lanzar excepción
        if (!empty($errores)) {
            throw new \Exception('Error al consumir reservas: ' . implode('; ', $errores));
        }

        \Illuminate\Support\Facades\Log::info('Todas las reservas consumidas exitosamente', [
            'proforma_id' => $this->id,
            'numero' => $this->numero,
            'reservas_consumidas' => $reservasConsumidas,
        ]);

        return true;
    }

    public function extenderReservas(int $horas = 24): bool
    {
        $nuevaFechaExpiracion = now()->addHours($horas);

        foreach ($this->reservasActivas as $reserva) {
            $reserva->update(['fecha_expiracion' => $nuevaFechaExpiracion]);
        }

        return true;
    }

    public function tieneReservasExpiradas(): bool
    {
        return $this->reservas()->expiradas()->count() > 0;
    }

    public function verificarDisponibilidadStock(): array
    {
        $disponibilidad = [];

        foreach ($this->detalles as $detalle) {
            $stockTotal = StockProducto::where('producto_id', $detalle->producto_id)
                ->sum('cantidad_disponible');

            $disponibilidad[] = [
                'producto_id' => $detalle->producto_id,
                'producto_nombre' => $detalle->producto->nombre,
                'cantidad_requerida' => $detalle->cantidad,
                'cantidad_disponible' => $stockTotal,
                'disponible' => $stockTotal >= $detalle->cantidad,
            ];
        }

        return $disponibilidad;
    }

    /**
     * Validar integridad de datos antes de convertir a venta
     *
     * Verifica que todos los requisitos para la conversión estén cumplidos
     * y que los datos sean consistentes
     *
     * @throws \Exception Si la validación falla
     * @return array Resultado de las validaciones
     */
    public function validarIntegridadParaConversion(): array
    {
        $errores = [];
        $advertencias = [];

        // 1. Validar estado de la proforma
        if (!$this->puedeConvertirseAVenta()) {
            $errores[] = "Estado inválido: {$this->estado}. Debe ser APROBADA.";
        }

        // 2. Validar que no tenga venta asociada
        if ($this->venta) {
            $errores[] = "La proforma ya tiene una venta asociada (Venta #{$this->venta->numero})";
        }

        // 3. Validar detalles
        if ($this->detalles->isEmpty()) {
            $errores[] = "La proforma no tiene detalles";
        }

        // 4. Validar cliente
        if (!$this->cliente) {
            $errores[] = "La proforma no tiene cliente asociado";
        } elseif (!$this->cliente->activo) {
            $advertencias[] = "El cliente está inactivo";
        }

        // 5. Validar moneda
        if (!$this->moneda) {
            $errores[] = "La proforma no tiene moneda asociada";
        }

        // 6. Validar totales
        if ($this->total <= 0) {
            $errores[] = "El total de la proforma debe ser mayor a 0";
        }

        // Validar que subtotal + impuesto = total
        $totalCalculado = $this->subtotal + $this->impuesto - ($this->descuento ?? 0);
        if (abs($totalCalculado - $this->total) > 0.01) {
            $advertencias[] = "Los totales no coinciden (calculado: {$totalCalculado}, registrado: {$this->total})";
        }

        // 7. Validar reservas
        $reservasActivas = $this->reservasActivas()->count();
        if ($reservasActivas === 0) {
            $errores[] = "No hay reservas de stock activas";
        }

        // 8. Validar que las reservas NO estén expiradas
        if ($this->tieneReservasExpiradas()) {
            $errores[] = "Las reservas de stock han expirado";
        }

        // 9. Validar disponibilidad actual de stock
        $disponibilidad = $this->verificarDisponibilidadStock();
        $stockInsuficiente = array_filter($disponibilidad, fn($item) => !$item['disponible']);

        if (!empty($stockInsuficiente)) {
            foreach ($stockInsuficiente as $item) {
                $errores[] = "Stock insuficiente para {$item['producto_nombre']}: requerido {$item['cantidad_requerida']}, disponible {$item['cantidad_disponible']}";
            }
        }

        // 10. Validar que cada detalle tenga producto activo
        foreach ($this->detalles as $detalle) {
            if (!$detalle->producto) {
                $errores[] = "Detalle ID {$detalle->id} no tiene producto asociado";
            } elseif (!$detalle->producto->activo) {
                $advertencias[] = "Producto {$detalle->producto->nombre} está inactivo";
            }

            if ($detalle->cantidad <= 0) {
                $errores[] = "Cantidad inválida en detalle ID {$detalle->id}";
            }

            if ($detalle->precio_unitario <= 0) {
                $errores[] = "Precio inválido en detalle ID {$detalle->id}";
            }
        }

        // 11. Validar fecha de vencimiento
        if ($this->estaVencida()) {
            $advertencias[] = "La proforma ha vencido (fecha vencimiento: {$this->fecha_vencimiento})";
        }

        return [
            'valido' => empty($errores),
            'errores' => $errores,
            'advertencias' => $advertencias,
            'puede_convertir' => empty($errores),
            'validaciones' => [
                'estado' => $this->puedeConvertirseAVenta(),
                'sin_venta' => !$this->venta,
                'tiene_detalles' => !$this->detalles->isEmpty(),
                'tiene_cliente' => (bool) $this->cliente,
                'tiene_reservas' => $reservasActivas > 0,
                'reservas_vigentes' => !$this->tieneReservasExpiradas(),
                'stock_disponible' => empty($stockInsuficiente),
            ],
        ];
    }
}
