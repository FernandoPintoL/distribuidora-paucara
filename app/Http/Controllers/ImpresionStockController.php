<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ImpresionStockController extends Controller
{
    /**
     * Imprimir listado de stock en diferentes formatos
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function imprimir(Request $request)
    {
        // Obtener datos del filtro y stock de la sesión
        $stock = session('stock_impresion', []);
        $almacenFiltro = session('almacen_filtro', null);
        $busquedaFiltro = session('busqueda_filtro', null);

        // Convertir a Collection para poder usar métodos como sum()
        $stock = collect($stock);

        // Obtener empresa del usuario autenticado
        $empresa = auth()->user()->empresa ?? Empresa::first();

        // Obtener formato solicitado
        $formato = $request->get('formato', 'A4');
        $accion = $request->get('accion', 'download');

        // Mapear formato a vista
        $vistaMap = [
            'A4'        => 'impresion.stock.hoja-completa',
            'TICKET_80' => 'impresion.stock.ticket-80',
            'TICKET_58' => 'impresion.stock.ticket-58',
        ];

        $vista = $vistaMap[$formato] ?? 'impresion.stock.hoja-completa';

        // Datos para la vista
        $datos = [
            'stock'            => $stock,
            'almacenFiltro'    => $almacenFiltro,
            'busquedaFiltro'   => $busquedaFiltro,
            'empresa'          => $empresa,
            'fecha_impresion'  => now(),
            'usuario'          => auth()->user()->name ?? null,
        ];

        // Limpiar sesión después de usar los datos
        session()->forget(['stock_impresion', 'almacen_filtro', 'busqueda_filtro']);

        // Renderizar vista
        $html = view($vista, $datos)->render();

        // Si es stream, mostrar en navegador; si es download, forzar descarga
        if ($accion === 'stream') {
            return response($html)
                ->header('Content-Type', 'text/html; charset=utf-8');
        } else {
            return response($html)
                ->header('Content-Type', 'text/html; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename="stock-' . now()->format('Ymd-His') . '.html"');
        }
    }

    /**
     * Vista previa del listado de stock
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function preview(Request $request)
    {
        $request->merge(['accion' => 'stream']);
        return $this->imprimir($request);
    }
}
