<?php
namespace App\Models;

use App\Models\Traits\HasActiveScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Almacen extends Model
{
    use HasFactory, HasActiveScope;

    protected $table = 'almacenes';

    protected $fillable = [
        'nombre',
        'direccion',
        'ubicacion_fisica',
        'requiere_transporte_externo',
        'responsable',
        'telefono',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo'                      => 'boolean',
            'requiere_transporte_externo' => 'boolean',
        ];
    }

    public function stockProductos()
    {
        return $this->hasMany(StockProducto::class, 'almacen_id');
    }

    /**
     * Determina si la transferencia hacia otro almacén requiere transporte
     */
    public function requiereTransporteHacia(Almacen $destino): bool
    {
        // Si cualquiera de los almacenes está marcado como requiere transporte externo
        if ($this->requiere_transporte_externo || $destino->requiere_transporte_externo) {
            return true;
        }

        // Si tienen ubicaciones físicas diferentes (no están en el mismo lugar)
        if ($this->ubicacion_fisica && $destino->ubicacion_fisica) {
            return $this->ubicacion_fisica !== $destino->ubicacion_fisica;
        }

        // Si uno tiene ubicación física definida y el otro no, asumir que requiere transporte
        if ($this->ubicacion_fisica || $destino->ubicacion_fisica) {
            return true;
        }

        // Si ambos no tienen ubicación física definida, usar lógica por defecto (almacenes diferentes)
        return $this->id !== $destino->id;
    }
}
