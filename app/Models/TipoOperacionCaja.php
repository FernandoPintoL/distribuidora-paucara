<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoOperacionCaja extends Model
{
    use HasFactory;

    protected $table = 'tipo_operacion_caja';

    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'nombre',
    ];

    // Relaciones
    public function movimientos()
    {
        return $this->hasMany(MovimientoCaja::class, 'tipo_operacion_id');
    }

    // Constantes para los tipos
    const APERTURA = 'APERTURA';

    const CIERRE = 'CIERRE';

    const VENTA = 'VENTA';

    const COMPRA = 'COMPRA';

    const GASTO = 'GASTO';

    const INGRESO_EXTRA = 'INGRESO_EXTRA';
}
