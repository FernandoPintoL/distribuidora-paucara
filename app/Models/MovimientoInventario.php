<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MovimientoInventario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'movimientos_inventario';

    public $timestamps = true; // Habilitar created_at y updated_at automáticos

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    /**
     * Nombre del campo deleted_at para soft deletes
     */
    const DELETED_AT = 'deleted_at';

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
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'cantidad'           => 'integer',
            'cantidad_anterior'  => 'integer',
            'cantidad_posterior' => 'integer',
            'fecha'              => 'datetime',
            'created_at'         => 'datetime',
            'updated_at'         => 'datetime',
            'deleted_at'         => 'datetime', // ✓ Para SoftDeletes
        ];
    }

    // Constantes para tipos de movimiento
    const TIPO_ENTRADA_AJUSTE = 'ENTRADA_AJUSTE';
    const TIPO_SALIDA_AJUSTE = 'SALIDA_AJUSTE';
    const TIPO_AJUSTE = 'AJUSTE'; // Tipo genérico de ajuste
    const TIPO_SALIDA_MERMA = 'SALIDA_MERMA';
    const TIPO_SALIDA_VENTA = 'SALIDA_VENTA';
    const TIPO_ENTRADA_COMPRA = 'ENTRADA_COMPRA';
    const TIPO_TRANSFERENCIA = 'TRANSFERENCIA'; // Para transferencias entre almacenes

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
        return $this->belongsTo(TipoAjusteInventario::class, 'tipo_ajuste_inventario_id');
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
        // Tipos genéricos que necesitan LIKE
        $tiposGenericos = ['ENTRADA', 'SALIDA', 'AJUSTE'];

        // Si es un tipo genérico (ENTRADA, SALIDA, AJUSTE), buscar con LIKE
        if (in_array($tipo, $tiposGenericos)) {
            return $query->where('tipo', 'LIKE', $tipo . '_%');
        }

        // Para tipos específicos (TRANSFERENCIA, etc), buscar exacto
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

    /**
     * Scope para búsqueda flexible de productos
     * Busca por: ID, SKU, nombre y código de barras
     */
    public function scopePorProductoBusqueda($query, string $busqueda)
    {
        $busquedaNormalizada = strtolower($busqueda);
        $esNumero = is_numeric($busqueda);

        return $query->whereHas('stockProducto.producto', function ($q) use ($busqueda, $busquedaNormalizada, $esNumero) {
            $q->where(function ($subQuery) use ($busqueda, $busquedaNormalizada, $esNumero) {
                // Búsqueda por ID (si es número)
                if ($esNumero) {
                    $subQuery->where('id', (int)$busqueda)
                             ->orWhere('sku', 'LIKE', '%' . $busqueda . '%')
                             ->orWhereRaw('LOWER(sku) LIKE ?', ['%' . $busquedaNormalizada . '%'])
                             ->orWhere('nombre', 'LIKE', '%' . $busqueda . '%')
                             ->orWhereRaw('LOWER(nombre) LIKE ?', ['%' . $busquedaNormalizada . '%']);
                } else {
                    // Si no es número, buscar en SKU y nombre (case-insensitive)
                    $subQuery->where('sku', 'LIKE', '%' . $busqueda . '%')
                             ->orWhereRaw('LOWER(sku) LIKE ?', ['%' . $busquedaNormalizada . '%'])
                             ->orWhere('nombre', 'LIKE', '%' . $busqueda . '%')
                             ->orWhereRaw('LOWER(nombre) LIKE ?', ['%' . $busquedaNormalizada . '%']);
                }
            });

            // Búsqueda por código de barras (case-insensitive)
            $q->orWhereHas('codigosBarra', function ($barQuery) use ($busqueda, $busquedaNormalizada) {
                $barQuery->where('codigo', 'LIKE', '%' . $busqueda . '%')
                         ->orWhereRaw('LOWER(codigo) LIKE ?', ['%' . $busquedaNormalizada . '%']);
            });
        });
    }

    /**
     * Scope para filtrar por observaciones
     */
    public function scopePorObservaciones($query, string $observaciones)
    {
        return $query->where('observacion', 'LIKE', '%' . $observaciones . '%');
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
     * Crear movimiento de inventario automáticamente (método principal)
     *
     * NOTA IMPORTANTE: Para operaciones críticas de venta y compra,
     * se recomienda usar StockService que tiene mejor manejo de race conditions.
     *
     * Este método actualiza tanto cantidad como cantidad_disponible,
     * manteniendo el invariante: cantidad = cantidad_disponible + cantidad_reservada
     *
     * @deprecated Para ventas/compras usar StockService::procesarSalidaVenta() o procesarEntradaCompra()
     */
    public static function registrar(
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
        $cantidadDisponibleAnterior = $stockProducto->cantidad_disponible;

        // Actualizar usando UPDATE atómico para evitar race conditions
        $affected = \Illuminate\Support\Facades\DB::table('stock_productos')
            ->where('id', $stockProducto->id)
            ->update([
                'cantidad' => \Illuminate\Support\Facades\DB::raw("cantidad + ({$cantidadMovimiento})"),
                'cantidad_disponible' => \Illuminate\Support\Facades\DB::raw("cantidad_disponible + ({$cantidadMovimiento})"),
                'fecha_actualizacion' => now(),
            ]);

        if ($affected === 0) {
            throw new \Exception("Error al actualizar stock para stock_producto_id {$stockProducto->id}");
        }

        // Actualizar modelo en memoria
        $stockProducto->cantidad += $cantidadMovimiento;
        $stockProducto->cantidad_disponible += $cantidadMovimiento;
        $stockProducto->fecha_actualizacion = now();

        // Validar que no quede negativo (BLOQUEAR si es negativo)
        if ($stockProducto->cantidad < 0) {
            // Log del error
            \Illuminate\Support\Facades\Log::error('Intento de dejar stock negativo', [
                'stock_producto_id' => $stockProducto->id,
                'producto_id' => $stockProducto->producto_id,
                'cantidad_actual' => $stockProducto->cantidad - $cantidadMovimiento,
                'cantidad_movimiento' => $cantidadMovimiento,
                'cantidad_final' => $stockProducto->cantidad,
                'tipo' => $tipo,
            ]);

            // Revertir la operación
            \Illuminate\Support\Facades\DB::table('stock_productos')
                ->where('id', $stockProducto->id)
                ->update([
                    'cantidad' => \Illuminate\Support\Facades\DB::raw("cantidad - ({$cantidadMovimiento})"),
                    'cantidad_disponible' => \Illuminate\Support\Facades\DB::raw("cantidad_disponible - ({$cantidadMovimiento})"),
                ]);

            throw new \Exception(
                "Stock insuficiente. Stock actual: " . ($stockProducto->cantidad - $cantidadMovimiento) .
                ", cantidad solicitada: " . abs($cantidadMovimiento) .
                " (stock_producto_id: {$stockProducto->id})"
            );
        }

        if ($stockProducto->cantidad_disponible < 0) {
            // Log del error
            \Illuminate\Support\Facades\Log::error('Intento de dejar stock disponible negativo', [
                'stock_producto_id' => $stockProducto->id,
                'producto_id' => $stockProducto->producto_id,
                'cantidad_disponible_actual' => $stockProducto->cantidad_disponible - $cantidadMovimiento,
                'cantidad_movimiento' => $cantidadMovimiento,
                'cantidad_disponible_final' => $stockProducto->cantidad_disponible,
                'tipo' => $tipo,
            ]);

            // Revertir la operación
            \Illuminate\Support\Facades\DB::table('stock_productos')
                ->where('id', $stockProducto->id)
                ->update([
                    'cantidad' => \Illuminate\Support\Facades\DB::raw("cantidad - ({$cantidadMovimiento})"),
                    'cantidad_disponible' => \Illuminate\Support\Facades\DB::raw("cantidad_disponible - ({$cantidadMovimiento})"),
                ]);

            throw new \Exception(
                "Stock disponible insuficiente. Stock disponible actual: " . ($stockProducto->cantidad_disponible - $cantidadMovimiento) .
                ", cantidad solicitada: " . abs($cantidadMovimiento) .
                " (stock_producto_id: {$stockProducto->id})"
            );
        }

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
     * Alias para compatibilidad con código existente
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
        return self::registrar(
            $stockProducto,
            $cantidadMovimiento,
            $tipo,
            $observacion,
            $numeroDocumento,
            $userId,
            $tipoAjusteInventarioId,
            $tipoMermaId,
            $estadoMermaId,
            $referenciaTipo,
            $referenciaId,
            $ipDispositivo
        );
    }

    /**
     * Obtener todos los tipos de movimientos disponibles desde la base de datos
     */
    public static function getTipos(): array
    {
        $tipos = [];

        // Tipos de ajuste de inventario
        $tiposAjuste = TipoAjusteInventario::where('activo', true)
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
