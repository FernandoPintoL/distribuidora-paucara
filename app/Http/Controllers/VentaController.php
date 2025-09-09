<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreVentaRequest;
use App\Http\Requests\UpdateVentaRequest;
use App\Models\DetalleVenta;
use App\Models\MovimientoInventario;
use App\Models\Venta;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VentaController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:ventas.index')->only('index');
        $this->middleware('permission:ventas.show')->only('show');
        $this->middleware('permission:ventas.store')->only('store');
        $this->middleware('permission:ventas.update')->only('update');
        $this->middleware('permission:ventas.destroy')->only('destroy');
        $this->middleware('permission:ventas.verificar-stock')->only('verificarStock');
    }

    public function index()
    {
        $ventas = Venta::with([
            'cliente',
            'usuario',
            'estadoDocumento',
            'moneda',
            'detalles.producto',
        ])->get();

        return ApiResponse::success($ventas);
    }

    public function show($id)
    {
        $venta = Venta::with([
            'cliente',
            'usuario',
            'estadoDocumento',
            'moneda',
            'detalles.producto',
            'pagos',
            'cuentaPorCobrar',
        ])->findOrFail($id);

        return ApiResponse::success($venta);
    }

    public function store(StoreVentaRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            // Verificar disponibilidad de stock antes de crear la venta
            $this->verificarDisponibilidadStock($data['detalles']);

            // Crear la venta
            $venta = Venta::create($data);

            // Crear detalles y registrar movimientos de inventario
            foreach ($data['detalles'] as $detalle) {
                $detalleVenta = $venta->detalles()->create($detalle);

                // Registrar salida de inventario
                $this->registrarSalidaInventario($detalleVenta, $venta);
            }

            return ApiResponse::success(
                $venta->load(['detalles.producto']),
                'Venta creada exitosamente',
                Response::HTTP_CREATED
            );
        });
    }

    public function update(UpdateVentaRequest $request, $id)
    {
        $venta = Venta::findOrFail($id);
        $data  = $request->validated();

        return DB::transaction(function () use ($venta, $data) {
            $venta->update($data);

            // Si se modifican los detalles, ajustar el inventario
            if (isset($data['detalles'])) {
                $this->actualizarInventarioPorCambios($venta, $data['detalles']);
            }

            return ApiResponse::success($venta->fresh(['detalles.producto']), 'Venta actualizada');
        });
    }

    public function destroy($id)
    {
        $venta = Venta::findOrFail($id);

        return DB::transaction(function () use ($venta) {
            // Revertir movimientos de inventario antes de eliminar
            $this->revertirMovimientosInventario($venta);

            $venta->delete();

            return ApiResponse::success(null, 'Venta eliminada');
        });
    }

    /**
     * Verificar disponibilidad de stock antes de procesar venta
     */
    private function verificarDisponibilidadStock(array $detalles): void
    {
        $errores = [];

        foreach ($detalles as $detalle) {
            $producto        = \App\Models\Producto::findOrFail($detalle['producto_id']);
            $stockDisponible = $producto->stockTotal();

            if ($stockDisponible < $detalle['cantidad']) {
                $errores[] = "Stock insuficiente para {$producto->nombre}. Disponible: {$stockDisponible}, Requerido: {$detalle['cantidad']}";
            }
        }

        if (! empty($errores)) {
            throw new \Exception('Stock insuficiente: ' . implode('; ', $errores));
        }
    }

    /**
     * Registrar salida de inventario por venta
     */
    private function registrarSalidaInventario(DetalleVenta $detalle, Venta $venta): void
    {
        $producto = $detalle->producto;

        // Obtener el almacén principal o usar el primero disponible
        $almacenPrincipal = \App\Models\Almacen::where('activo', true)->first();

        if (! $almacenPrincipal) {
            Log::warning('No hay almacén disponible para registrar salida de inventario', [
                'venta_id'    => $venta->id,
                'producto_id' => $producto->id,
            ]);

            return;
        }

        try {
            // Usar el método mejorado del producto que maneja FIFO automáticamente
            $resultado = $producto->registrarMovimiento(
                almacenId: $almacenPrincipal->id,
                cantidad: -(int) $detalle->cantidad, // Negativo para salida
                tipo: MovimientoInventario::TIPO_SALIDA_VENTA,
                observacion: "Salida por venta #{$venta->numero}",
                numeroDocumento: $venta->numero,
                userId: $venta->usuario_id
            );

            if ($resultado) {
                Log::info('Movimiento de inventario registrado por venta', [
                    'venta_id'    => $venta->id,
                    'producto_id' => $producto->id,
                    'cantidad'    => $detalle->cantidad,
                    'almacen_id'  => $almacenPrincipal->id,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error al registrar movimiento de inventario por venta', [
                'venta_id'    => $venta->id,
                'producto_id' => $producto->id,
                'error'       => $e->getMessage(),
            ]);

            // Re-lanzar la excepción para detener la transacción
            throw $e;
        }
    }

    /**
     * Actualizar inventario por cambios en venta
     */
    private function actualizarInventarioPorCambios(Venta $venta, array $nuevosDetalles): void
    {
        // Esta funcionalidad es compleja y puede implementarse según necesidades específicas
        // Por ahora, registrar un log para implementación futura
        Log::info('Actualización de venta detectada - requiere ajuste manual de inventario', [
            'venta_id'   => $venta->id,
            'usuario_id' => Auth::id(),
        ]);

        // Una implementación básica sería:
        // 1. Calcular diferencias entre detalles originales y nuevos
        // 2. Aplicar ajustes de inventario según las diferencias
        // 3. Registrar movimientos de ajuste correspondientes
    }

    /**
     * Revertir movimientos de inventario al eliminar venta
     */
    private function revertirMovimientosInventario(Venta $venta): void
    {
        foreach ($venta->detalles as $detalle) {
            $producto         = $detalle->producto;
            $almacenPrincipal = \App\Models\Almacen::where('activo', true)->first();

            if (! $almacenPrincipal) {
                continue;
            }

            try {
                // Registrar entrada para revertir la salida original
                $producto->registrarMovimiento(
                    almacenId: $almacenPrincipal->id,
                    cantidad: (int) $detalle->cantidad, // Positivo para entrada
                    tipo: MovimientoInventario::TIPO_ENTRADA_AJUSTE,
                    observacion: "Reversión por eliminación de venta #{$venta->numero}",
                    numeroDocumento: $venta->numero,
                    userId: Auth::id()
                );

            } catch (\Exception $e) {
                Log::error('Error al revertir movimiento de inventario', [
                    'venta_id'    => $venta->id,
                    'producto_id' => $producto->id,
                    'error'       => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Verificar disponibilidad de producto específico
     */
    public function verificarStock($productoId)
    {
        $producto = \App\Models\Producto::with('stockProductos.almacen')->findOrFail($productoId);

        return response()->json([
            'producto_id'       => $producto->id,
            'nombre'            => $producto->nombre,
            'stock_total'       => $producto->stockTotal(),
            'stock_por_almacen' => $producto->stockProductos->map(function ($stock) {
                return [
                    'almacen'      => $stock->almacen->nombre,
                    'cantidad'     => $stock->cantidad_actual,
                    'stock_minimo' => $stock->stock_minimo,
                    'stock_maximo' => $stock->stock_maximo,
                ];
            }),
        ]);
    }
}
