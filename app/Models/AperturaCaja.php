<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AperturaCaja extends Model
{
    use HasFactory;

    protected $table = 'aperturas_caja';

    protected $fillable = [
        'caja_id',
        'user_id',
        'fecha',
        'monto_apertura',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto_apertura' => 'decimal:2',
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

    public function cierre()
    {
        return $this->hasOne(CierreCaja::class);
    }

    // Scopes
    public function scopeDelDia($query, $fecha = null)
    {
        $fecha = $fecha ?? today();

        return $query->whereDate('fecha', $fecha);
    }

    public function scopeAbiertas($query)
    {
        return $query->whereDoesntHave('cierre');
    }
}
