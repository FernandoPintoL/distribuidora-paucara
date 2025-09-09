<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompraRequest;
use App\Http\Requests\UpdateCompraRequest;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\MovimientoInventario;
use Illuminate\Http\Response;
use App\Helpers\ApiResponse;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:compras.index')->only('index');
        $this->middleware('permission:compras.show')->only('show');
        $this->middleware('permission:compras.store')->only('store');
        $this->middleware('permission:compras.update')->only('update');
        $this->middleware('permission:compras.destroy')->only('destroy');
    }


    public function index()
    {
        $compras = Compra::with(['proveedor', 'usuario', 'estadoDocumento', 'moneda', 'detalles.producto'])->get();
        return ApiResponse::success($compras);
    }

    public function show($id)
    {
        $compra = Compra::with(['proveedor', 'usuario', 'estadoDocumento', 'moneda', 'detalles.producto'])->findOrFail($id);
        return ApiResponse::success($compra);
    }

    public function store(StoreCompraRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            $compra = Compra::create($data);

            foreach ($data['detalles'] as $detalle) {
                $detalleCompra = $compra->detalles()->create($detalle);
                $this->registrarEntradaInventario($detalleCompra, $compra);
            }

            return ApiResponse::success(
                $compra->load(['detalles.producto']),
                'Compra creada exitosamente',
                Response::HTTP_CREATED
            );
        });
    }

    public function update(UpdateCompraRequest $request, $id)
    {
        $compra = Compra::findOrFail($id);
        $data = $request->validated();

        return DB::transaction(function () use ($compra, $data) {
            $compra->update($data);

            if (isset($data['detalles'])) {
                $this->actualizarInventarioPorCambios($compra, $data['detalles']);
            }

            return ApiResponse::success($compra->fresh(['detalles.producto']), 'Compra actualizada');
        });
    }

    public function destroy($id)
    {
        $compra = Compra::findOrFail($id);

        return DB::transaction(function () use ($compra) {
            $this->revertirMovimientosInventario($compra);
            $compra->delete();
            return ApiResponse::success(null, 'Compra eliminada');
        });
    }

    /**
     * Registrar entrada de inventario por compra
     */
    private function registrarEntradaInventario(DetalleCompra $detalle, Compra $compra): void
    {
        $producto = $detalle->producto;

        // Obtener el almacén principal o usar el primero disponible
        $almacenPrincipal = \App\Models\Almacen::where('activo', true)->first();

        if (! $almacenPrincipal) {
            \Log::warning('No hay almacén disponible para registrar entrada de inventario', [
                'compra_id' => $compra->id,
                'producto_id' => $producto->id,
            ]);

            return;
        }

        try {
            $producto->registrarMovimiento(
                almacenId: $almacenPrincipal->id,
                cantidad: (int) $detalle->cantidad,
                tipo: MovimientoInventario::TIPO_ENTRADA_COMPRA,
                observacion: "Entrada por compra #{$compra->numero}",
                numeroDocumento: $compra->numero_factura,
                lote: $detalle->lote,
                fechaVencimiento: $detalle->fecha_vencimiento ?
                    \Carbon\Carbon::parse($detalle->fecha_vencimiento) : null,
                userId: $compra->usuario_id
            );

            \Log::info('Movimiento de inventario registrado por compra', [
                'compra_id' => $compra->id,
                'producto_id' => $producto->id,
                'cantidad' => $detalle->cantidad,
                'almacen_id' => $almacenPrincipal->id,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al registrar movimiento de inventario por compra', [
                'compra_id' => $compra->id,
                'producto_id' => $producto->id,
                'error' => $e->getMessage(),
            ]);

            // No detener la transacción, solo registrar el error
        }
    }

    /**
     * Actualizar inventario por cambios en compra
     */
    private function actualizarInventarioPorCambios(Compra $compra, array $nuevosDetalles): void
    {
        // Esta funcionalidad es compleja y puede implementarse según necesidades específicas
        // Por ahora, registrar un log para implementación futura
        \Log::info('Actualización de compra detectada - requiere ajuste manual de inventario', [
            'compra_id' => $compra->id,
            'usuario_id' => auth()->id(),
        ]);
    }

    /**
     * Revertir movimientos de inventario al eliminar compra
     */
    private function revertirMovimientosInventario(Compra $compra): void
    {
        foreach ($compra->detalles as $detalle) {
            $producto = $detalle->producto;
            $almacenPrincipal = \App\Models\Almacen::where('activo', true)->first();

            if (! $almacenPrincipal) {
                continue;
            }

            try {
                // Registrar salida para revertir la entrada original
                $producto->registrarMovimiento(
                    almacenId: $almacenPrincipal->id,
                    cantidad: -(int) $detalle->cantidad, // Negativo para salida
                    tipo: MovimientoInventario::TIPO_SALIDA_AJUSTE,
                    observacion: "Reversión por eliminación de compra #{$compra->numero}",
                    numeroDocumento: $compra->numero_factura,
                    userId: auth()->id()
                );

            } catch (\Exception $e) {
                \Log::error('Error al revertir movimiento de inventario', [
                    'compra_id' => $compra->id,
                    'producto_id' => $producto->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
