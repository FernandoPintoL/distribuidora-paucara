<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CuentaPorCobrar extends Model
{
    use HasFactory;

    protected $table = 'cuentas_por_cobrar';

    protected $fillable = [
        'venta_id',
        'cliente_id',
        'monto_original',
        'saldo_pendiente',
        'fecha_vencimiento',
        'dias_vencido',
        'estado',
    ];

    protected $casts = [
        'monto_original' => 'decimal:2',
        'saldo_pendiente' => 'decimal:2',
        'fecha_vencimiento' => 'date',
        'dias_vencido' => 'integer',
    ];

    // Relaciones
    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    // Scopes
    public function scopeVencidas($query)
    {
        return $query->where('fecha_vencimiento', '<', now());
    }

    public function scopePendientes($query)
    {
        return $query->where('saldo_pendiente', '>', 0);
    }
}
