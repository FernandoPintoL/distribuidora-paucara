<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReporteCarga extends Model
{
    use HasFactory;

    protected $table = 'reporte_cargas';

    protected $fillable = [
        'entrega_id',
        'vehiculo_id',
        'venta_id',
        'numero_reporte',
        'descripcion',
        'peso_total_kg',
        'volumen_total_m3',
        'generado_por',
        'confirmado_por',
        'fecha_generacion',
        'fecha_confirmacion',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'peso_total_kg' => 'decimal:2',
            'volumen_total_m3' => 'decimal:2',
            'fecha_generacion' => 'datetime',
            'fecha_confirmacion' => 'datetime',
        ];
    }

    // Estados del reporte
    const ESTADO_PENDIENTE = 'PENDIENTE';
    const ESTADO_CONFIRMADO = 'CONFIRMADO';
    const ESTADO_ENTREGADO = 'ENTREGADO';
    const ESTADO_CANCELADO = 'CANCELADO';

    /**
     * Relaciones
     */

    /**
     * Entrega asociada a este reporte
     */
    public function entrega(): BelongsTo
    {
        return $this->belongsTo(Entrega::class);
    }

    /**
     * Vehículo en el que se carga la mercancía
     */
    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class);
    }

    /**
     * Venta asociada a este reporte
     */
    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    /**
     * Usuario que generó el reporte
     */
    public function generador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generado_por');
    }

    /**
     * Usuario que confirmó el reporte
     */
    public function confirmador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmado_por');
    }

    /**
     * Detalles del reporte (productos a cargar)
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(ReporteCargaDetalle::class);
    }

    /**
     * Métodos útiles
     */

    /**
     * Generar número único para el reporte
     */
    public static function generarNumeroReporte(): string
    {
        $fecha = now()->format('Ymd');
        $secuencial = str_pad(
            (static::whereDate('fecha_generacion', now())->max('id') ?? 0) + 1,
            6,
            '0',
            STR_PAD_LEFT
        );
        return "REP{$fecha}{$secuencial}";
    }

    /**
     * Verificar si todas las líneas han sido cargadas
     */
    public function estanTodosCargados(): bool
    {
        return $this->detalles()
            ->where('cantidad_cargada', '<', $this->detalles()->avg('cantidad_solicitada'))
            ->doesntExist();
    }

    /**
     * Calcular porcentaje de carga completado
     */
    public function getPorcentajeCargadoAttribute(): float
    {
        $detalles = $this->detalles;

        if ($detalles->isEmpty()) {
            return 0;
        }

        $totalSolicitado = $detalles->sum('cantidad_solicitada');
        $totalCargado = $detalles->sum('cantidad_cargada');

        return $totalSolicitado > 0 ? round(($totalCargado / $totalSolicitado) * 100, 2) : 0;
    }

    /**
     * Obtener resumen de carga
     */
    public function obtenerResumenCarga(): array
    {
        $detalles = $this->detalles()->with('producto')->get();

        return [
            'total_lineas' => $detalles->count(),
            'total_solicitado' => $detalles->sum('cantidad_solicitada'),
            'total_cargado' => $detalles->sum('cantidad_cargada'),
            'lineas_verificadas' => $detalles->where('verificado', true)->count(),
            'peso_total_cargado' => $detalles->sum('peso_kg'),
            'porcentaje_carga' => $this->porcentaje_cargado,
        ];
    }
}
