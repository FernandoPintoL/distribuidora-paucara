<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleCompra extends Model
{
    protected $table = 'detalle_compras';

    protected $fillable = [
        'compra_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'descuento',
        'subtotal',
        'lote',
        'fecha_vencimiento',
        'unidad_medida_id',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'decimal:6',  // ✅ FIXED 2026-03-23: Cambié columna a DECIMAL(18,6) en migración. Laravel respeta los 6 decimales de BD
            'precio_unitario' => 'decimal:10',
            'descuento' => 'decimal:10',
            'subtotal' => 'decimal:10',
            'fecha_vencimiento' => 'date',
        ];
    }

    // Relaciones
    public function compra()
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function unidadMedida()
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_medida_id');
    }

    /**
     * ✅ NUEVO 2026-03-19: Accessores para remover ceros innecesarios
     * Guarda: 14.10 → Devuelve: "14.1"
     * Guarda: 15.202 → Devuelve: "15.202"
     */
    protected function cantidad(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }

    protected function precioUnitario(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }

    protected function descuento(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }

    protected function subtotal(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }
}
