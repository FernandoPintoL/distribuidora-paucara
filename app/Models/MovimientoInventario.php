<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MovimientoInventario extends Model
{
    use HasFactory;

    protected $table = 'movimientos_inventario';

    public $timestamps = false; // La tabla maneja 'fecha' manualmente

    protected $fillable = [
        'stock_producto_id',
        'cantidad',
        'fecha',
        'observacion',
        'numero_documento',
        'cantidad_anterior',
        'cantidad_posterior',
        'tipo',
        'user_id',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'cantidad_anterior' => 'integer',
        'cantidad_posterior' => 'integer',
        'fecha' => 'datetime',
    ];

    // Constantes para tipos de movimiento
    const TIPO_ENTRADA_COMPRA = 'ENTRADA_COMPRA';

    const TIPO_ENTRADA_AJUSTE = 'ENTRADA_AJUSTE';

    const TIPO_ENTRADA_DEVOLUCION = 'ENTRADA_DEVOLUCION';

    const TIPO_TRANSFERENCIA_ENTRADA = 'TRANSFERENCIA_ENTRADA';

    const TIPO_SALIDA_VENTA = 'SALIDA_VENTA';

    const TIPO_SALIDA_AJUSTE = 'SALIDA_AJUSTE';

    const TIPO_SALIDA_MERMA = 'SALIDA_MERMA';

    const TIPO_SALIDA_DEVOLUCION = 'SALIDA_DEVOLUCION';

    const TIPO_TRANSFERENCIA_SALIDA = 'TRANSFERENCIA_SALIDA';

    /**
     * Relaciones
     */
    public function stockProducto()
    {
        return $this->belongsTo(StockProducto::class, 'stock_producto_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function producto()
    {
        return $this->hasOneThrough(
            Producto::class,
            StockProducto::class,
            'id',                // Foreign key en stock_productos
            'id',                // Foreign key en productos
            'stock_producto_id', // Local key en movimientos_inventario
            'producto_id'        // Local key en stock_productos
        );
    }

    public function almacen()
    {
        return $this->hasOneThrough(
            Almacen::class,
            StockProducto::class,
            'id',                // Foreign key en stock_productos
            'id',                // Foreign key en almacenes
            'stock_producto_id', // Local key en movimientos_inventario
            'almacen_id'         // Local key en stock_productos
        );
    }

    /**
     * Scopes
     */
    public function scopePorTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    public function scopePorFecha($query, $fechaInicio, $fechaFin = null)
    {
        $query->whereDate('fecha', '>=', $fechaInicio);
        if ($fechaFin) {
            $query->whereDate('fecha', '<=', $fechaFin);
        }

        return $query;
    }

    public function scopePorProducto($query, $productoId)
    {
        return $query->whereHas('stockProducto', function ($q) use ($productoId) {
            $q->where('producto_id', $productoId);
        });
    }

    public function scopePorAlmacen($query, $almacenId)
    {
        return $query->whereHas('stockProducto', function ($q) use ($almacenId) {
            $q->where('almacen_id', $almacenId);
        });
    }

    public function scopeEntradas($query)
    {
        return $query->where('tipo', 'LIKE', 'ENTRADA_%');
    }

    public function scopeSalidas($query)
    {
        return $query->where('tipo', 'LIKE', 'SALIDA_%');
    }

    /**
     * Métodos auxiliares
     */
    public function esEntrada(): bool
    {
        return str_starts_with($this->tipo, 'ENTRADA_');
    }

    public function esSalida(): bool
    {
        return str_starts_with($this->tipo, 'SALIDA_');
    }

    public static function getTipos(): array
    {
        return [
            self::TIPO_ENTRADA_COMPRA => 'Entrada por Compra',
            self::TIPO_ENTRADA_AJUSTE => 'Entrada por Ajuste',
            self::TIPO_ENTRADA_DEVOLUCION => 'Entrada por Devolución',
            self::TIPO_TRANSFERENCIA_ENTRADA => 'Transferencia - Entrada',
            self::TIPO_SALIDA_VENTA => 'Salida por Venta',
            self::TIPO_SALIDA_AJUSTE => 'Salida por Ajuste',
            self::TIPO_SALIDA_MERMA => 'Salida por Merma',
            self::TIPO_SALIDA_DEVOLUCION => 'Salida por Devolución',
            self::TIPO_TRANSFERENCIA_SALIDA => 'Transferencia - Salida',
        ];
    }

    /**
     * Crear movimiento de inventario automáticamente
     */
    public static function registrar(
        StockProducto $stockProducto,
        int $cantidadMovimiento,
        string $tipo,
        ?string $observacion = null,
        ?string $numeroDocumento = null,
        ?int $userId = null
    ): self {
        $cantidadAnterior = $stockProducto->cantidad;

        // Actualizar el stock
        $stockProducto->cantidad += $cantidadMovimiento;
        $stockProducto->fecha_actualizacion = now();
        $stockProducto->save();

        // Crear el movimiento
        return self::create([
            'stock_producto_id' => $stockProducto->id,
            'cantidad' => $cantidadMovimiento,
            'fecha' => now(),
            'observacion' => $observacion,
            'numero_documento' => $numeroDocumento,
            'cantidad_anterior' => $cantidadAnterior,
            'cantidad_posterior' => $stockProducto->cantidad,
            'tipo' => $tipo,
            'user_id' => $userId ?? (\Illuminate\Support\Facades\Auth::check() ? \Illuminate\Support\Facades\Auth::id() : null),
        ]);
    }
}
