<?php

namespace App\Http\Controllers;

use App\Models\DetalleVenta;
use App\Models\Producto;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReporteController extends Controller
{
    /**
     * Reporte de ventas por producto
     * Muestra todas las ventas de un producto con filtros por fecha
     */
    public function ventasPorProducto(Request $request)
    {
        $productos = Producto::orderBy('nombre')->get();

        $productoId = $request->input('producto_id');
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin = $request->input('fecha_fin');
        $fechaEspecifica = $request->input('fecha_especifica');

        $ventas = collect();
        $totalProducto = [
            'cantidad_vendida' => 0,
            'cantidad_devuelta' => 0,
            'cantidad_neta' => 0,
            'monto_total' => 0,
            'monto_devuelto' => 0,
            'monto_neto' => 0,
        ];

        if ($productoId) {
            // Validar que el producto exista
            $producto = Producto::findOrFail($productoId);

            // Base query para detalles de venta
            $query = DetalleVenta::with([
                'venta' => fn($q) => $q->with('cliente'),
                'producto'
            ])
                ->where('producto_id', $productoId);

            // Aplicar filtro de fechas
            if ($fechaEspecifica) {
                // Una fecha específica
                $fecha = Carbon::parse($fechaEspecifica)->startOfDay();
                $query->whereDate('created_at', $fecha);
            } elseif ($fechaInicio && $fechaFin) {
                // Rango de fechas
                $inicio = Carbon::parse($fechaInicio)->startOfDay();
                $fin = Carbon::parse($fechaFin)->endOfDay();
                $query->whereBetween('created_at', [$inicio, $fin]);
            }

            $detalles = $query->orderByDesc('created_at')->get();

            // Procesar detalles para obtener el resumen
            foreach ($detalles as $detalle) {
                $cantidadDevuelta = (float) ($detalle->cantidad_devuelta ?? 0);
                $cantidadVendida = (float) $detalle->cantidad;
                $cantidadNeta = $cantidadVendida - $cantidadDevuelta;

                $montoDevuelto = $cantidadDevuelta * (float) $detalle->precio_unitario;
                $montoVendido = $cantidadVendida * (float) $detalle->precio_unitario;
                $montoNeto = $cantidadNeta * (float) $detalle->precio_unitario;

                $ventas->push([
                    'detalle_id' => $detalle->id,
                    'numero_venta' => $detalle->venta->numero,
                    'venta_id' => $detalle->venta->id,
                    'cliente' => $detalle->venta->cliente->nombre ?? 'N/A',
                    'fecha' => $detalle->venta->created_at->format('d/m/Y H:i'),
                    'cantidad_vendida' => $cantidadVendida,
                    'cantidad_devuelta' => $cantidadDevuelta,
                    'cantidad_neta' => $cantidadNeta,
                    'precio_unitario' => (float) $detalle->precio_unitario,
                    'monto_vendido' => round($montoVendido, 2),
                    'monto_devuelto' => round($montoDevuelto, 2),
                    'monto_neto' => round($montoNeto, 2),
                    'estado' => $detalle->venta->estado ?? 'N/A',
                ]);

                // Acumular totales
                $totalProducto['cantidad_vendida'] += $cantidadVendida;
                $totalProducto['cantidad_devuelta'] += $cantidadDevuelta;
                $totalProducto['cantidad_neta'] += $cantidadNeta;
                $totalProducto['monto_total'] += round($montoVendido, 2);
                $totalProducto['monto_devuelto'] += round($montoDevuelto, 2);
                $totalProducto['monto_neto'] += round($montoNeto, 2);
            }
        }

        return Inertia::render('reportes/ventas-por-producto', [
            'productos' => $productos,
            'productoSeleccionado' => $productoId ? Producto::find($productoId) : null,
            'ventas' => $ventas,
            'filtros' => [
                'producto_id' => $productoId,
                'fecha_especifica' => $fechaEspecifica,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
            ],
            'totalProducto' => $totalProducto,
        ]);
    }
}
