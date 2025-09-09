<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Caja extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'ubicacion',
        'monto_inicial_dia',
        'activa',
    ];

    protected $casts = [
        'monto_inicial_dia' => 'decimal:2',
        'activa' => 'boolean',
    ];

    // Relaciones
    public function movimientos()
    {
        return $this->hasMany(MovimientoCaja::class);
    }

    public function aperturas()
    {
        return $this->hasMany(AperturaCaja::class);
    }

    public function cierres()
    {
        return $this->hasMany(CierreCaja::class);
    }

    // Scopes
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }

    // Métodos de negocio
    public function obtenerSaldoActual()
    {
        return $this->movimientos()
            ->whereDate('fecha', today())
            ->sum('monto');
    }

    public function estaAbierta()
    {
        return $this->aperturas()
            ->whereDate('fecha', today())
            ->whereDoesntHave('cierre')
            ->exists();
    }
}
