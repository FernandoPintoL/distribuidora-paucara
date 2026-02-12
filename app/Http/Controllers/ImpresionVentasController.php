<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\Response;
use App\Models\Empresa;

class ImpresionVentasController extends Controller
{
    /**
     * Renderizar reporte de ventas
     */
    public function imprimir(Request $request)
    {
        try {
            $ventas = collect(session('ventas_impresion', []));
            $filtros = session('ventas_filtros', []);

            // Obtener empresa del usuario autenticado
            $empresa = auth()->user()->empresa ?? Empresa::first();

            \Log::info('🖨️ [ImpresionVentasController] Renderizando reporte', [
                'cantidad_ventas' => $ventas->count(),
                'filtros' => $filtros,
                'empresa_id' => $empresa?->id,
            ]);

            // ✅ NUEVO: Log detallado de estructura de datos
            if ($ventas->count() > 0) {
                $primeraVenta = $ventas->first();
                $estructura = [
                    'es_array' => is_array($primeraVenta),
                    'es_objeto' => is_object($primeraVenta),
                    'tipo' => is_object($primeraVenta) ? get_class($primeraVenta) : 'array',
                ];

                // Si es array, mostrar keys
                if (is_array($primeraVenta)) {
                    $estructura['keys'] = array_keys($primeraVenta);
                    $estructura['muestra'] = [
                        'id' => $primeraVenta['id'] ?? 'N/A',
                        'numero' => $primeraVenta['numero'] ?? 'N/A',
                        'total' => $primeraVenta['total'] ?? 'N/A',
                        'cliente' => $primeraVenta['cliente'] ?? 'N/A',
                        'estadoDocumento' => $primeraVenta['estadoDocumento'] ?? 'N/A',
                        'tipoPago' => $primeraVenta['tipoPago'] ?? 'N/A',
                    ];
                } elseif (is_object($primeraVenta)) {
                    // Si es objeto, mostrar atributos
                    $estructura['atributos'] = array_keys($primeraVenta->getAttributes());
                    $estructura['muestra'] = [
                        'id' => $primeraVenta->id ?? 'N/A',
                        'numero' => $primeraVenta->numero ?? 'N/A',
                        'total' => $primeraVenta->total ?? 'N/A',
                        'cliente_nombre' => $primeraVenta->cliente?->nombre ?? 'N/A',
                        'estadoDocumento_nombre' => $primeraVenta->estadoDocumento?->nombre ?? 'N/A',
                        'tipoPago_nombre' => $primeraVenta->tipoPago?->nombre ?? 'N/A',
                        'detalles_count' => $primeraVenta->detalles?->count() ?? 0,
                    ];
                }

                \Log::info('📊 [ImpresionVentasController] Estructura de PRIMERA VENTA', $estructura);
            }

            $formato = $request->get('formato', 'A4');
            $accion = $request->get('accion', 'download');

            $vistaMap = [
                'A4' => 'impresion.ventas.hoja-completa-ventas',
                'TICKET_80' => 'impresion.ventas.ticket-80',
                'TICKET_58' => 'impresion.ventas.ticket-58',
            ];

            $vista = $vistaMap[$formato] ?? 'impresion.ventas.hoja-completa-ventas';

            // Renderizar vista
            $html = view($vista, [
                'ventas' => $ventas,
                'filtros' => $filtros,
                'empresa' => $empresa,
            ])->render();

            // Limpiar sesión
            session()->forget(['ventas_impresion', 'ventas_filtros']);

            if ($accion === 'download') {
                return response()->streamDownload(
                    fn () => print($html),
                    'reporte-ventas-' . now()->format('YmdHis') . '.html',
                    ['Content-Type' => 'text/html; charset=utf-8']
                );
            }

            // Retornar HTML para visualización en navegador
            return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);

        } catch (\Exception $e) {
            \Log::error('❌ Error al imprimir ventas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response("Error al generar el reporte: " . $e->getMessage(), 500);
        }
    }
}
