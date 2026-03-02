<?php

namespace App\Http\Controllers\Api;

use App\Models\StockProducto;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

/**
 * StockDisponiblePdfController - Generar PDF de stock disponible para preventistas
 *
 * RESPONSABILIDADES:
 * ✓ Consultar stock disponible agrupado por producto
 * ✓ Obtener precios de venta, descuento y especial para cada producto
 * ✓ Generar PDF con tabla formateada
 * ✓ Retornar como descarga binaria para app móvil
 */
class StockDisponiblePdfController
{
    /**
     * Generar y descargar PDF con listado de stock disponible
     *
     * GET /api/app/stock/pdf
     * Requiere: auth:sanctum,web + platform
     *
     * Lógica:
     * - Consulta StockProducto::disponible() (cantidad_disponible > 0)
     * - Agrupa por producto_id, sumando cantidad_disponible
     * - Extrae precios VENTA, DESCUENTO, ESPECIAL de cada producto
     * - Ordena alfabéticamente por nombre de producto
     *
     * @return Response PDF como descarga binaria
     */
    public function generar()
    {
        try {
            // ==========================================
            // 1️⃣ CONSULTA: Stock disponible agrupado
            // ==========================================
            $stocks = StockProducto::disponible()
                ->with([
                    'producto:id,nombre,sku',
                    'producto.precios' => fn($q) => $q->activos()->with('tipoPrecio:id,codigo'),
                ])
                ->selectRaw('producto_id, SUM(cantidad_disponible) as total_disponible')
                ->groupBy('producto_id')
                ->get();

            // ==========================================
            // 2️⃣ MAPEO: Extraer datos y precios
            // ==========================================
            $filas = $stocks->map(function ($s) {
                $p = $s->producto;
                return [
                    'nombre'           => $p->nombre,
                    'sku'              => $p->sku ?? '-',
                    'precio_venta'     => $p->obtenerPrecio('VENTA')?->precio ?? $p->obtenerPrecio('VENTA_NORMAL')?->precio,
                    'precio_descuento' => $p->obtenerPrecio('DESCUENTO')?->precio,
                    'precio_especial'  => $p->obtenerPrecio('ESPECIAL')?->precio,
                    'stock_disponible' => $s->total_disponible,
                ];
            })->sortBy('nombre')->values();

            // ==========================================
            // 3️⃣ PREPARAR DATOS para la vista
            // ==========================================
            $data = [
                'filas'               => $filas,
                'total_productos'     => count($filas),
                'fecha_generacion'    => now()->format('d/m/Y H:i'),
                'empresa'             => config('app.name', 'Distribuidora Paucara'),
            ];

            // ==========================================
            // 4️⃣ GENERAR PDF
            // ==========================================
            $pdf = Pdf::loadView('pdf.stock-disponible-preventista', $data)
                ->setPaper('A4', 'portrait')
                ->setOption('margin-top', 10)
                ->setOption('margin-bottom', 10)
                ->setOption('margin-left', 10)
                ->setOption('margin-right', 10);

            // ==========================================
            // 5️⃣ RETORNAR como stream binario
            // ==========================================
            return $pdf->stream('stock-disponible.pdf');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error generando PDF stock disponible', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error generando PDF',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
