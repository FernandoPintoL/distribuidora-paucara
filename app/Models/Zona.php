<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zona extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'localidades',
        'latitud_centro',
        'longitud_centro',
        'tiempo_estimado_entrega',
        'activa',
        'preventista_id',
    ];

    protected $casts = [
        'localidades' => 'array', // JSON a array
        'latitud_centro' => 'decimal:8',
        'longitud_centro' => 'decimal:8',
        'activa' => 'boolean',
        'tiempo_estimado_entrega' => 'integer',
    ];

    /**
     * Preventista responsable de la zona
     */
    public function preventista(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'preventista_id');
    }

    /**
     * Clientes en esta zona
     */
    public function clientes()
    {
        // Asume que clientes tienen localidad/zona
        return $this->hasMany(Cliente::class, 'zona_id');
    }

    /**
     * Rutas en esta zona
     */
    public function rutas(): HasMany
    {
        return $this->hasMany(Ruta::class);
    }

    /**
     * Scope para zonas activas
     */
    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }

    /**
     * Obtener localidades como array
     */
    public function getLocalidadesAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    /**
     * Convertir localidades a JSON al guardar
     */
    public function setLocalidadesAttribute($value)
    {
        $this->attributes['localidades'] = is_array($value) ? json_encode($value) : $value;
    }

    /**
     * Obtener cantidad de clientes en zona
     */
    public function cantidadClientes(): int
    {
        return Cliente::where('zona_id', $this->id)->count();
    }

    /**
     * Verificar si la zona tiene preventista asignado
     */
    public function tienePreventista(): bool
    {
        return $this->preventista_id !== null;
    }
}
