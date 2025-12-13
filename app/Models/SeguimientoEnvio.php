<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeguimientoEnvio extends Model
{
    protected $fillable = [
        'envio_id',
        'estado',
        'coordenadas_lat',
        'coordenadas_lng',
        'fecha_hora',
        'observaciones',
        'foto',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha_hora' => 'datetime',
            'coordenadas_lat' => 'decimal:8',
            'coordenadas_lng' => 'decimal:8',
        ];
    }

    // Relaciones
    public function envio(): BelongsTo
    {
        return $this->belongsTo(Envio::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Scope para ordenar por fecha
    public function scopeOrdenadoPorFecha($query)
    {
        return $query->orderBy('fecha_hora', 'desc');
    }
}
