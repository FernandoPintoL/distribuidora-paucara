<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoInventario extends Model
{
    use HasFactory;

    protected $table = 'movimientos_inventario';

    public $timestamps = false; // La tabla maneja 'fecha' manualmente

    protected $fillable = [
        'stock_producto_id',
        'cantidad_anterior',
        'cantidad',
        'cantidad_posterior',
        'fecha',
        'observacion',
        'numero_documento',
        'tipo',
        'user_id',
        'tipo_ajuste_inventario_id',
        'tipo_merma_id',
        'estado_merma_id',
        'anulado',
        'motivo_anulacion',
        'user_anulacion_id',
        'fecha_anulacion',
        'referencia_tipo',
        'referencia_id',
        'ip_dispositivo',
        'deleted_at',
    ];

    protected $casts = [
        'cantidad'           => 'integer',
        'cantidad_anterior'  => 'integer',
        'cantidad_posterior' => 'integer',
        'fecha'              => 'datetime',
    ];

    // Constantes para tipos de movimiento
    const TIPO_ENTRADA_AJUSTE = 'ENTRADA_AJUSTE';

    const TIPO_SALIDA_AJUSTE = 'SALIDA_AJUSTE';

    const TIPO_SALIDA_MERMA = 'SALIDA_MERMA';

    const TIPO_SALIDA_VENTA = 'SALIDA_VENTA';

    const TIPO_ENTRADA_COMPRA = 'ENTRADA_COMPRA';

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

    /**
     * Relación con el tipo de ajuste
     */
    public function tipoAjusteInventario(): BelongsTo
    {
        return $this->belongsTo(TipoAjustInventario::class, 'tipo_ajuste_inventario_id');
    }

    public function tipoMerma(): BelongsTo
    {
        return $this->belongsTo(TipoMerma::class, 'tipo_merma_id');
    }

    public function estadoMerma(): BelongsTo
    {
        return $this->belongsTo(EstadoMerma::class, 'estado_merma_id');
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

    /**
     * Crear movimiento de inventario automáticamente
     */
    public static function registrarStockProducto(
        StockProducto $stockProducto,
        int $cantidadMovimiento,
        string $tipo,
        ?string $observacion = null,
        ?string $numeroDocumento = null,
        ?int $userId = null,
        ?int $tipoAjusteInventarioId = null,
        ?int $tipoMermaId = null,
        ?int $estadoMermaId = null,
        ?string $referenciaTipo = null,
        ?int $referenciaId = null,
        ?string $ipDispositivo = null
    ): self {
        $cantidadAnterior = $stockProducto->cantidad;

        // Actualizar el stock
        $stockProducto->cantidad += $cantidadMovimiento;
        $stockProducto->fecha_actualizacion = now();
        $stockProducto->save();

        // Crear el movimiento
        return self::create([
            'stock_producto_id'         => $stockProducto->id,
            'cantidad'                  => $cantidadMovimiento,
            'fecha'                     => now(),
            'observacion'               => $observacion,
            'numero_documento'          => $numeroDocumento,
            'cantidad_anterior'         => $cantidadAnterior,
            'cantidad_posterior'        => $stockProducto->cantidad,
            'tipo'                      => $tipo,
            'user_id'                   => $userId ?? (\Illuminate\Support\Facades\Auth::check() ? \Illuminate\Support\Facades\Auth::id() : null),
            'tipo_ajuste_inventario_id' => $tipoAjusteInventarioId,
            'tipo_merma_id'             => $tipoMermaId,
            'estado_merma_id'           => $estadoMermaId,
            'referencia_tipo'           => $referenciaTipo,
            'referencia_id'             => $referenciaId,
            'ip_dispositivo'            => $ipDispositivo,
        ]);
    }

    /**
     * Obtener todos los tipos de movimientos disponibles desde la base de datos
     */
    public static function getTipos(): array
    {
        $tipos = [];

        // Tipos de ajuste de inventario
        $tiposAjuste = TipoAjustInventario::where('activo', true)
            ->orderBy('label')
            ->get(['clave', 'label', 'descripcion', 'color', 'bg_color', 'text_color']);

        foreach ($tiposAjuste as $tipo) {
            $tipos['ENTRADA_AJUSTE_' . $tipo->clave] = $tipo->label . ' (Entrada)';
            $tipos['SALIDA_AJUSTE_' . $tipo->clave]  = $tipo->label . ' (Salida)';
        }

        // Tipos de merma
        $tiposMerma = TipoMerma::where('activo', true)
            ->orderBy('label')
            ->get(['clave', 'label', 'descripcion', 'color', 'bg_color', 'text_color']);

        foreach ($tiposMerma as $tipo) {
            $tipos['SALIDA_MERMA_' . $tipo->clave] = $tipo->label;
        }

        // Tipos fijos del sistema
        $tipos['SALIDA_VENTA']   = 'Venta';
        $tipos['ENTRADA_COMPRA'] = 'Compra';

        return $tipos;
    }
}
