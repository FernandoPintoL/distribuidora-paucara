<?php
namespace App\Models;

use App\Models\Traits\HasActiveScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehiculo extends Model
{
    use HasFactory, HasActiveScope;

    protected $fillable = [
        'placa',
        'marca',
        'modelo',
        'anho',
        'capacidad_kg',
        'capacidad_volumen',
        'estado',
        'activo',
        'chofer_asignado_id',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'anho'              => 'integer',
            'capacidad_kg'      => 'decimal:2',
            'capacidad_volumen' => 'decimal:2',
            'activo'            => 'boolean',
        ];
    }

    // Estados del vehículo
    const DISPONIBLE = 'DISPONIBLE';

    const EN_RUTA = 'EN_RUTA';

    const MANTENIMIENTO = 'MANTENIMIENTO';

    const FUERA_SERVICIO = 'FUERA_SERVICIO';

    // Relaciones
    public function choferAsignado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chofer_asignado_id');
    }

    public function envios(): HasMany
    {
        return $this->hasMany(Envio::class);
    }

    /**
     * Vehículos activos
     */

    /**
     * Vehículos disponibles
     */
    public function scopeDisponibles($query)
    {
        return $query->where('estado', self::DISPONIBLE)->where('activo', true);
    }

    /**
     * Vehículos en ruta
     */
    public function scopeEnRuta($query)
    {
        return $query->where('estado', self::EN_RUTA);
    }

    /**
     * Transferencias asignadas a este vehículo
     */
    public function transferencias(): HasMany
    {
        return $this->hasMany(TransferenciaInventario::class);
    }

    /**
     * Entregas asignadas a este vehículo
     */
    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class);
    }

    // Métodos de utilidad
    public function estaDisponible(): bool
    {
        return $this->estado === self::DISPONIBLE && $this->activo;
    }

    public function puedeAsignarse(): bool
    {
        return $this->estaDisponible();
    }
}
