<?php
namespace App\Models;

use App\Models\AperturaCaja;
use App\Models\AsientoContable;
use App\Models\FacturaElectronica;
use App\Models\Impuesto;
use App\Models\LibroVentasIva;
use App\Models\MovimientoCaja;
use App\Models\TipoDocumento;
use App\Models\TipoOperacionCaja;
use App\Models\TipoPago;
use App\Models\VentaImpuesto;
use App\Services\StockService;
use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Venta extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'fecha',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'observaciones',
        'cliente_id',
        'usuario_id',
        'estado_documento_id',
        'moneda_id',
        'proforma_id',
        'tipo_pago_id',
        'tipo_documento_id',
    ];

    protected $casts = [
        'fecha'     => 'date',
        'subtotal'  => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuesto'  => 'decimal:2',
        'total'     => 'decimal:2',
    ];

    protected static function booted()
    {
        // Después de crear una venta, procesar automatizaciones
        static::created(function ($venta) {
            $venta->procesarMovimientosStock();
            $venta->generarAsientoContable();
            $venta->generarMovimientoCaja();
        });

        // Antes de eliminar una venta, revertir movimientos
        static::deleting(function ($venta) {
            $venta->revertirMovimientosStock();
            $venta->eliminarAsientoContable();
        });
    }

    // Relaciones
    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }

    public function estadoDocumento()
    {
        return $this->belongsTo(EstadoDocumento::class);
    }

    public function moneda()
    {
        return $this->belongsTo(Moneda::class);
    }

    public function proforma()
    {
        return $this->belongsTo(Proforma::class);
    }

    public function detalles()
    {
        return $this->hasMany(DetalleVenta::class);
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }

    public function cuentaPorCobrar()
    {
        return $this->hasOne(CuentaPorCobrar::class);
    }

    public function movimientoCaja()
    {
        return $this->hasOne(MovimientoCaja::class, 'numero_documento', 'numero');
    }

    public function asientoContable()
    {
        return $this->morphOne(AsientoContable::class, 'asientable');
    }

    /**
     * Validar stock disponible antes de crear la venta
     */
    public function validarStock(int $almacenId = 1): array
    {
        $stockService = app(StockService::class);

        $productos = $this->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad'    => $detalle->cantidad,
            ];
        })->toArray();

        return $stockService->validarStockDisponible($productos, $almacenId);
    }

    /**
     * Procesar movimientos de stock automáticamente
     */
    public function procesarMovimientosStock(int $almacenId = 1): void
    {
        if ($this->detalles->isEmpty()) {
            return;
        }

        $stockService = app(StockService::class);

        $productos = $this->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad'    => $detalle->cantidad,
            ];
        })->toArray();

        try {
            // Validar stock antes de procesar
            $validacion = $stockService->validarStockDisponible($productos, $almacenId);

            if (! $validacion['valido']) {
                throw new Exception('Stock insuficiente: ' . implode(', ', $validacion['errores']));
            }

            // Procesar salida de stock
            $stockService->procesarSalidaVenta($productos, $this->numero, $almacenId);

        } catch (Exception $e) {
            Log::error("Error procesando stock para venta {$this->numero}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Revertir movimientos de stock al eliminar venta
     */
    public function revertirMovimientosStock(): void
    {
        // Obtener todos los movimientos relacionados con esta venta
        $movimientos = MovimientoInventario::where('numero_documento', $this->numero)
            ->where('tipo', MovimientoInventario::TIPO_SALIDA_VENTA)
            ->get();

        DB::beginTransaction();

        try {
            foreach ($movimientos as $movimiento) {
                // Revertir el stock (agregar la cantidad que se había restado)
                $stockProducto = $movimiento->stockProducto;
                $stockProducto->cantidad += abs($movimiento->cantidad);
                $stockProducto->fecha_actualizacion = now();
                $stockProducto->save();

                // Crear movimiento de reversión
                MovimientoInventario::create([
                    'stock_producto_id' => $stockProducto->id,
                    'cantidad'          => abs($movimiento->cantidad),
                    'fecha'             => now(),
                    'observacion'       => "Reversión de venta #{$this->numero}",
                    'numero_documento'   => $this->numero . '-REV',
                    'cantidad_anterior'  => $stockProducto->cantidad - abs($movimiento->cantidad),
                    'cantidad_posterior' => $stockProducto->cantidad,
                    'tipo'               => MovimientoInventario::TIPO_ENTRADA_AJUSTE,
                    'user_id'            => Auth::id(),
                ]);
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Obtener resumen de stock afectado
     */
    public function obtenerResumenStock(): array
    {
        $movimientos = MovimientoInventario::where('numero_documento', $this->numero)
            ->with(['stockProducto.producto', 'stockProducto.almacen'])
            ->get();

        return $movimientos->map(function ($movimiento) {
            return [
                'producto'        => $movimiento->stockProducto->producto->nombre,
                'almacen'         => $movimiento->stockProducto->almacen->nombre,
                'cantidad_movida' => abs($movimiento->cantidad),
                'stock_anterior'  => $movimiento->cantidad_anterior,
                'stock_actual'    => $movimiento->cantidad_posterior,
            ];
        })->toArray();
    }

    /**
     * Generar asiento contable automático
     */
    public function generarAsientoContable(): void
    {
        try {
            // No crear asiento si ya existe
            if ($this->asientoContable) {
                return;
            }

            AsientoContable::crearParaVenta($this);

            Log::info("Asiento contable generado para venta {$this->numero}");
        } catch (Exception $e) {
            Log::error("Error generando asiento contable para venta {$this->numero}: " . $e->getMessage());
        }
    }

    /**
     * Eliminar asiento contable
     */
    public function eliminarAsientoContable(): void
    {
        try {
            if ($this->asientoContable) {
                $this->asientoContable->delete();
                Log::info("Asiento contable eliminado para venta {$this->numero}");
            }
        } catch (Exception $e) {
            Log::error("Error eliminando asiento contable para venta {$this->numero}: " . $e->getMessage());
        }
    }

    /**
     * Generar movimiento de caja automático
     */
    public function generarMovimientoCaja(): void
    {
        try {
            // Solo generar movimiento para ventas al contado
            if ($this->tipoPago?->codigo !== 'CONTADO') {
                return;
            }

            // No crear movimiento si ya existe
            if ($this->movimientoCaja) {
                return;
            }

            // Obtener caja abierta (usar user_id como en el modelo)
            $cajaAbierta = AperturaCaja::where('user_id', $this->usuario_id)
                ->whereDate('fecha', $this->fecha)
                ->first();

            if (! $cajaAbierta) {
                Log::warning("No hay caja abierta para generar movimiento de venta {$this->numero}");
                return;
            }

            // Obtener tipo de operación para venta
            $tipoOperacion = TipoOperacionCaja::where('codigo', 'VENTA')->first();

            if (! $tipoOperacion) {
                Log::warning("No existe tipo de operación VENTA para movimiento de caja");
                return;
            }

            MovimientoCaja::create([
                'caja_id'           => $cajaAbierta->caja_id,
                'tipo_operacion_id' => $tipoOperacion->id,
                'numero_documento'  => $this->numero,
                'descripcion'       => "Venta #{$this->numero} - Cliente: {$this->cliente?->nombre}",
                'monto'   => $this->total,
                'fecha'   => $this->fecha,
                'user_id' => $this->usuario_id,
            ]);

            Log::info("Movimiento de caja generado para venta {$this->numero}");
        } catch (Exception $e) {
            Log::error("Error generando movimiento de caja para venta {$this->numero}: " . $e->getMessage());
        }
    }

    // ========== NUEVAS RELACIONES ==========

    /**
     * Relación con tipo de pago
     */
    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class);
    }

    /**
     * Relación con tipo de documento
     */
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumento::class);
    }

    /**
     * Relación many-to-many con impuestos
     */
    public function impuestos()
    {
        return $this->belongsToMany(Impuesto::class, 'venta_impuestos')
            ->withPivot(['base_imponible', 'porcentaje_aplicado', 'monto_impuesto'])
            ->withTimestamps();
    }

    /**
     * Relación hasMany con venta_impuestos (tabla pivot)
     */
    public function ventaImpuestos()
    {
        return $this->hasMany(VentaImpuesto::class);
    }

    /**
     * Relación con libro de ventas IVA
     */
    public function libroVentasIva()
    {
        return $this->hasOne(LibroVentasIva::class);
    }

    /**
     * Relación con factura electrónica
     */
    public function facturaElectronica()
    {
        return $this->hasOne(FacturaElectronica::class);
    }
}
