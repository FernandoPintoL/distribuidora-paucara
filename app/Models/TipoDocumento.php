<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoDocumento extends Model
{
    use HasFactory;

    protected $table = 'tipos_documento';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'genera_inventario',
        'requiere_autorizacion',
        'formato_numeracion',
        'siguiente_numero',
        'activo',
    ];

    protected $casts = [
        'genera_inventario' => 'boolean',
        'requiere_autorizacion' => 'boolean',
        'siguiente_numero' => 'integer',
        'activo' => 'boolean',
    ];

    /**
     * Relación con ventas
     */
    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class);
    }

    /**
     * Relación con el libro de ventas IVA
     */
    public function libroVentasIva(): HasMany
    {
        return $this->hasMany(LibroVentasIva::class);
    }

    /**
     * Scope para tipos de documento activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Obtener el siguiente número para auto-numeración
     */
    public function obtenerSiguienteNumero(): string
    {
        $numero = $this->siguiente_numero;
        $this->increment('siguiente_numero');

        if ($this->formato_numeracion) {
            return str_replace(
                ['{YYYY}', '{####}'],
                [date('Y'), str_pad($numero, 4, '0', STR_PAD_LEFT)],
                $this->formato_numeracion
            );
        }

        return str_pad($numero, 6, '0', STR_PAD_LEFT);
    }
}
