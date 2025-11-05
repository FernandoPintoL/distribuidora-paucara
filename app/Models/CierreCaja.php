<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CierreCaja extends Model
{
    use HasFactory;

    protected $table = 'cierres_caja';

    protected $fillable = [
        'caja_id',
        'user_id',
        'apertura_caja_id',
        'fecha',
        'monto_esperado',
        'monto_real',
        'diferencia',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto_esperado' => 'decimal:2',
        'monto_real' => 'decimal:2',
        'diferencia' => 'decimal:2',
    ];

    // Relaciones
    public function caja()
    {
        return $this->belongsTo(Caja::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function apertura()
    {
        return $this->belongsTo(AperturaCaja::class, 'apertura_caja_id');
    }

    // Scopes
    public function scopeDelDia($query, $fecha = null)
    {
        $fecha = $fecha ?? today();

        return $query->whereDate('fecha', $fecha);
    }

    public function scopeConDiferencias($query)
    {
        return $query->where('diferencia', '!=', 0);
    }
}
