<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoPago extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'tipos_pago';

    protected $fillable = [
        'codigo', 'nombre', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    // Relaciones
    public function pagos()
    {
        return $this->hasMany(Pago::class, 'tipo_pago_id');
    }

    public function compras()
    {
        return $this->hasMany(Compra::class, 'tipo_pago_id');
    }

    /**
     * Scope para obtener solo tipos de pago activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
