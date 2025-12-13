<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    protected $fillable = [
        'cuenta_por_pagar_id',
        'venta_id', // Mantener para compatibilidad con ventas
        'tipo_pago_id',
        'monto',
        'fecha',
        'fecha_pago',
        'numero_recibo',
        'numero_transferencia',
        'numero_cheque',
        'observaciones',
        'usuario_id',
        'moneda_id',
    ];

    protected function casts(): array
    {
        return [
            'monto'      => 'decimal:2',
            'fecha'      => 'datetime',
            'fecha_pago' => 'date',
        ];
    }

    // Relaciones
    public function cuentaPorPagar()
    {
        return $this->belongsTo(CuentaPorPagar::class);
    }

    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class);
    }

    // Scopes
    public function scopePorTipoPago($query, $tipoPagoId)
    {
        return $query->where('tipo_pago_id', $tipoPagoId);
    }

    public function scopePorFechaRango($query, $fechaDesde, $fechaHasta)
    {
        return $query->whereBetween('fecha_pago', [$fechaDesde, $fechaHasta]);
    }

    public function scopePorMes($query, $mes = null, $año = null)
    {
        $mes  = $mes ?? now()->month;
        $año = $año ?? now()->year;

        return $query->whereMonth('fecha_pago', $mes)
            ->whereYear('fecha_pago', $año);
    }

    // Métodos auxiliares
    public function getNumeroTransaccionAttribute()
    {
        return $this->numero_recibo ?? $this->numero_transferencia ?? $this->numero_cheque;
    }
}
