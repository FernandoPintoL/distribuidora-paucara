<?php

namespace App\Http\Controllers\Prestamos;

use App\Http\Controllers\Controller;
use App\Models\Almacen;
use App\Models\PrestableStock;
use Inertia\Inertia;

class StockController extends Controller
{
    /**
     * GET /prestamos/stock
     * Página de stock y distribución
     */
    public function stock()
    {
        $almacenCanastillasEmbases = 3; // Almacén fijo para prestables

        // Obtener items de stock del almacén 3 (canastillas y embases)
        $items = PrestableStock::where('almacen_id', $almacenCanastillasEmbases)
            ->with(['prestable', 'almacen'])
            ->get()
            ->map(function ($stock) {
                return [
                    'prestable_id' => $stock->prestable_id,
                    'prestable_nombre' => $stock->prestable->nombre,
                    'prestable_codigo' => $stock->prestable->codigo,
                    'almacen_nombre' => $stock->almacen->nombre,
                    'cantidad_disponible' => $stock->cantidad_disponible,
                    'cantidad_en_prestamo_cliente' => $stock->cantidad_en_prestamo_cliente,
                    'cantidad_en_prestamo_proveedor' => $stock->cantidad_en_prestamo_proveedor,
                    'cantidad_vendida' => $stock->cantidad_vendida,
                    'cantidad_total' => $stock->cantidad_disponible +
                        $stock->cantidad_en_prestamo_cliente +
                        $stock->cantidad_en_prestamo_proveedor +
                        $stock->cantidad_vendida,
                ];
            });

        // Calcular resumen
        $resumen = [
            'total_disponible' => $items->sum('cantidad_disponible'),
            'total_en_prestamo_cliente' => $items->sum('cantidad_en_prestamo_cliente'),
            'total_en_prestamo_proveedor' => $items->sum('cantidad_en_prestamo_proveedor'),
            'total_vendido' => $items->sum('cantidad_vendida'),
            'total_general' => $items->sum('cantidad_total'),
        ];

        // Obtener lista de almacenes para filtros
        $almacenes = Almacen::select('id', 'nombre')
            ->orderBy('nombre')
            ->get()
            ->toArray();

        return Inertia::render('prestamos/stock', [
            'items' => $items->values(),
            'resumen' => $resumen,
            'almacenes' => $almacenes,
        ]);
    }
}
