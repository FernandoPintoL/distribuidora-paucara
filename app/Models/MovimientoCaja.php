<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MovimientoCaja extends Model
{
    use HasFactory;

    protected $table = 'movimientos_caja';

    public $timestamps = false;

    protected $fillable = [
        'caja_id',
        'user_id',
        'fecha',
        'monto',
        'observaciones',
        'numero_documento',
        'tipo_operacion_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
            'monto' => 'decimal:2',
        ];
    }

    // Relaciones
    public function caja()
    {
        return $this->belongsTo(Caja::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tipoOperacion()
    {
        return $this->belongsTo(TipoOperacionCaja::class, 'tipo_operacion_id');
    }

    // Scopes
    public function scopeIngresos($query)
    {
        return $query->where('monto', '>', 0);
    }

    public function scopeEgresos($query)
    {
        return $query->where('monto', '<', 0);
    }

    public function scopeDelDia($query, $fecha = null)
    {
        $fecha = $fecha ?? today();

        return $query->whereDate('fecha', $fecha);
    }
}
