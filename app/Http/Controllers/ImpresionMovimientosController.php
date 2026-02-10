<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ImpresionMovimientosController extends Controller
{
    /**
     * Imprimir listado de movimientos de inventario en diferentes formatos
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function imprimir(Request $request)
    {
        // Obtener datos de movimientos de la sesión
        $movimientos = session('movimientos_impresion', []);
        $filtros = session('movimientos_filtros', []);

        // Convertir a Collection
        $movimientos = collect($movimientos);

        // Obtener empresa del usuario autenticado
        $empresa = auth()->user()->empresa ?? Empresa::first();

        // Obtener formato solicitado
        $formato = $request->get('formato', 'A4');
        $accion = $request->get('accion', 'download');

        // Mapear formato a vista
        $vistaMap = [
            'A4'        => 'impresion.movimientos.hoja-completa',
            'TICKET_80' => 'impresion.movimientos.ticket-80',
            'TICKET_58' => 'impresion.movimientos.ticket-58',
        ];

        $vista = $vistaMap[$formato] ?? 'impresion.movimientos.hoja-completa';

        // Datos para la vista
        $datos = [
            'movimientos'      => $movimientos,
            'filtros'          => $filtros,
            'empresa'          => $empresa,
            'fecha_impresion'  => now(),
            'usuario'          => auth()->user()->name ?? null,
        ];

        // Limpiar sesión después de usar los datos
        session()->forget(['movimientos_impresion', 'movimientos_filtros']);

        // Renderizar vista
        $html = view($vista, $datos)->render();

        // Si es stream, mostrar en navegador; si es download, forzar descarga
        if ($accion === 'stream') {
            return response($html)
                ->header('Content-Type', 'text/html; charset=utf-8');
        } else {
            return response($html)
                ->header('Content-Type', 'text/html; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename="movimientos-' . now()->format('Ymd-His') . '.html"');
        }
    }

    /**
     * Vista previa del listado de movimientos
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
