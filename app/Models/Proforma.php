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
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_vencimiento' => 'date',
        'fecha_aprobacion' => 'datetime',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuesto' => 'decimal:2',
        'total' => 'decimal:2',
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
    public function reservarStock(): bool
    {
        // Si ya tiene reservas activas, no hacer nada
        if ($this->reservasActivas()->count() > 0) {
            return true;
        }

        foreach ($this->detalles as $detalle) {
            // Buscar stock disponible en todos los almacenes
            $stocksDisponibles = StockProducto::where('producto_id', $detalle->producto_id)
                ->where('cantidad_disponible', '>', 0)
                ->orderBy('fecha_vencimiento', 'asc')
                ->get();

            $cantidadPendiente = $detalle->cantidad;

            foreach ($stocksDisponibles as $stock) {
                if ($cantidadPendiente <= 0) {
                    break;
                }

                $cantidadAReservar = min($cantidadPendiente, $stock->cantidad_disponible);

                // Reservar el stock
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
                }
            }

            // Si no se pudo reservar toda la cantidad
            if ($cantidadPendiente > 0) {
                // Liberar todas las reservas hechas para esta proforma
                $this->liberarReservas();

                return false;
            }
        }

        return true;
    }

    public function liberarReservas(): bool
    {
        $reservasLiberadas = 0;

        foreach ($this->reservasActivas as $reserva) {
            if ($reserva->liberar()) {
                $reservasLiberadas++;
            }
        }

        return $reservasLiberadas > 0;
    }

    public function consumirReservas(): bool
    {
        foreach ($this->reservasActivas as $reserva) {
            if (! $reserva->consumir()) {
                return false;
            }
        }

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
}
