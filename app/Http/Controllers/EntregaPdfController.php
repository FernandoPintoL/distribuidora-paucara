<?php

namespace App\Http\Controllers;

use App\Models\Entrega;
use App\Services\ExcelExportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * EntregaPdfController - Generar PDFs de entregas
 *
 * RESPONSABILIDADES:
 * ✓ Generar PDF de entrega en diferentes formatos (A4, TICKET_80, TICKET_58)
 * ✓ Soportar descarga y vista previa
 * ✓ Manejar diferentes acciones (download, stream)
 */
class EntregaPdfController extends Controller
{
    /**
     * Debug - Ver datos de entrega
     */
    public function debug(Entrega $entrega)
    {
        $entrega->load([
            'ventas.cliente',
            'ventas.detalles.producto',
            'chofer',
            'vehiculo',
            'localidad',
            'reportes',
        ]);

        return response()->json([
            'entrega' => $entrega,
            'numero_entrega' => $entrega->numero_entrega,
            'peso_kg' => $entrega->peso_kg,
            'ventas_count' => $entrega->ventas?->count(),
            'vistas_disponibles' => [
                'A4' => view()->exists('impresion.entregas.hoja-completa'),
                'B1' => view()->exists('impresion.entregas.b1'),
                'TICKET_80' => view()->exists('impresion.entregas.ticket-80'),
                'TICKET_58' => view()->exists('impresion.entregas.ticket-58'),
            ],
        ]);
    }

    /**
     * Descargar o ver preview de PDF de entrega con formato variable
     *
     * GET /api/entregas/{entrega}/descargar?formato={formato}&accion={accion}
     * GET /api/entregas/{entrega}/preview?formato={formato}
     *
     * @param Entrega $entrega
     * @param Request $request
     * @return Response PDF
     */
    public function descargar(Entrega $entrega, Request $request)
    {
        try {
            $formato = $request->query('formato', 'A4');
            $accion = $request->query('accion', 'download');

            // Cargar relaciones necesarias
            $entrega->load([
                'ventas.cliente',
                'ventas.detalles.producto.unidad',
                'chofer',
                'vehiculo',
                'localidad',
                'reportes',
            ]);

            // 🔍 DEBUG: Loguear información de la entrega para inspección
            \Log::info('📦 [EntregaPdfController::descargar] Datos de entrega para imprimir', [
                'entrega_id'            => $entrega->id,
                'entrega_numero'        => $entrega->numero_entrega,
                'fecha_asignacion'      => $entrega->fecha_asignacion,
                'estado'                => $entrega->estado,
                'peso_kg'               => $entrega->peso_kg,
                'chofer_id'             => $entrega->chofer_id,
                'chofer_tipo'           => gettype($entrega->chofer),
                'chofer_es_null'        => $entrega->chofer === null,
                'chofer_nombre'         => $entrega->chofer?->nombre ?? 'NULL',
                'chofer_email'          => $entrega->chofer?->email ?? 'NULL',
                'chofer_phone'          => $entrega->chofer?->phone ?? 'NULL',
                'chofer_full_data'      => $entrega->chofer ? [
                    'id' => $entrega->chofer->id,
                    'name' => $entrega->chofer->name ?? $entrega->chofer->nombre ?? null,
                    'email' => $entrega->chofer->email,
                    'phone' => $entrega->chofer->phone ?? null,
                ] : 'SIN CHOFER',
                'vehiculo_id'           => $entrega->vehiculo_id,
                'vehiculo_placa'        => $entrega->vehiculo?->placa ?? 'NULL',
                'vehiculo_marca'        => $entrega->vehiculo?->marca ?? 'NULL',
                'vehiculo_modelo'       => $entrega->vehiculo?->modelo ?? 'NULL',
                'vehiculo_capacidad'    => $entrega->vehiculo?->capacidad_kg ?? 'NULL',
                'ventas_count'          => $entrega->ventas?->count(),
                'formato'               => $formato,
                'accion'                => $accion,
            ]);

            // Obtener empresa principal
            $empresa = \App\Models\Empresa::principal();
            if (!$empresa) {
                throw new \Exception('No hay empresa configurada');
            }

            // Convertir logos a base64 para embebimiento en PDF
            $logoPrincipalBase64 = $this->logoToBase64($empresa->logo_principal);
            $logoFooterBase64 = $this->logoToBase64($empresa->logo_footer);

            $data = [
                'entrega' => $entrega,
                'fecha_generacion' => now()->format('d/m/Y H:i'),
                'fecha_impresion' => now(),
                'empresa' => $empresa,
                'usuario' => auth()->user(),
                'formato' => $formato,
                'logo_principal_base64' => $logoPrincipalBase64,
                'logo_footer_base64' => $logoFooterBase64,
            ];

            // Crear PDF con configuración según formato
            $viewName = $this->obtenerVistaEntrega($formato);
            $pdf = Pdf::loadView($viewName, $data);

            // Configurar papel y márgenes según formato
            match ($formato) {
                'TICKET_80' => $this->configurarTicket80($pdf),
                'TICKET_58' => $this->configurarTicket58($pdf),
                'B1' => $this->configurarB1($pdf),
                default => $this->configurarA4($pdf),
            };

            // Retornar según acción
            if ($accion === 'stream') {
                return $pdf->stream("entrega-{$entrega->numero_entrega}.pdf");
            }

            return $pdf->download("entrega-{$entrega->numero_entrega}.pdf");
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generando PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Vista previa del PDF en el navegador
     *
     * GET /api/entregas/{entrega}/preview?formato={formato}
     *
     * @param Entrega $entrega
     * @param Request $request
     * @return Response PDF para ver en navegador
     */
    public function preview(Entrega $entrega, Request $request)
    {
        try {
            $formato = $request->query('formato', 'A4');

            // Cargar relaciones necesarias
            $entrega->load([
                'ventas.cliente',
                'ventas.detalles.producto.unidad',
                'chofer',
                'vehiculo',
                'localidad',
                'reportes',
            ]);

            // Obtener empresa principal
            $empresa = \App\Models\Empresa::principal();
            if (!$empresa) {
                throw new \Exception('No hay empresa configurada');
            }

            // Convertir logos a base64 para embebimiento en PDF
            $logoPrincipalBase64 = $this->logoToBase64($empresa->logo_principal);
            $logoFooterBase64 = $this->logoToBase64($empresa->logo_footer);

            $data = [
                'entrega' => $entrega,
                'fecha_generacion' => now()->format('d/m/Y H:i'),
                'fecha_impresion' => now(),
                'empresa' => $empresa,
                'usuario' => auth()->user(),
                'formato' => $formato,
                'logo_principal_base64' => $logoPrincipalBase64,
                'logo_footer_base64' => $logoFooterBase64,
            ];

            // Crear PDF
            $viewName = $this->obtenerVistaEntrega($formato);
            $pdf = Pdf::loadView($viewName, $data);

            // Configurar papel y márgenes según formato
            match ($formato) {
                'TICKET_80' => $this->configurarTicket80($pdf),
                'TICKET_58' => $this->configurarTicket58($pdf),
                'B1' => $this->configurarB1($pdf),
                default => $this->configurarA4($pdf),
            };

            // Retornar como stream (abre en navegador)
            return $pdf->stream("entrega-{$entrega->numero_entrega}.pdf");
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generando vista previa',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Configurar PDF para formato A4
     */
    private function configurarA4($pdf)
    {
        return $pdf
            ->setPaper('A4')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10);
    }

    /**
     * Configurar PDF para formato TICKET 80mm
     */
    private function configurarTicket80($pdf)
    {
        return $pdf
            ->setPaper([0, 0, 227, 1000], 'portrait')  // 80mm = 227pt
            ->setOption('margin-top', 5)
            ->setOption('margin-bottom', 5)
            ->setOption('margin-left', 5)
            ->setOption('margin-right', 5);
    }

    /**
     * Configurar PDF para formato TICKET 58mm
     */
    private function configurarTicket58($pdf)
    {
        return $pdf
            ->setPaper([0, 0, 164, 1000], 'portrait')  // 58mm = 164pt
            ->setOption('margin-top', 5)
            ->setOption('margin-bottom', 5)
            ->setOption('margin-left', 5)
            ->setOption('margin-right', 5);
    }

    /**
     * Configurar PDF para formato B1 (1000mm × 707mm - Landscape)
     */
    private function configurarB1($pdf)
    {
        return $pdf
            ->setPaper([0, 0, 2834, 2004], 'landscape')  // B1 = 1000mm × 707mm (≈ 2834 × 2004 pt)
            ->setOption('margin-top', 20)
            ->setOption('margin-bottom', 20)
            ->setOption('margin-left', 20)
            ->setOption('margin-right', 20);
    }

    /**
     * Obtener vista Blade según el formato de entrega
     *
     * @param string $formato A4|TICKET_80|TICKET_58|B1
     * @return string Vista Blade
     */
    private function obtenerVistaEntrega(string $formato): string
    {
        return match ($formato) {
            'TICKET_80' => 'impresion.entregas.ticket-80',
            'TICKET_58' => 'impresion.entregas.ticket-58',
            'B1' => 'impresion.entregas.b1',
            default => 'impresion.entregas.hoja-completa',
        };
    }

    /**
     * Convertir URL de logo a data URI base64
     *
     * @param string|null $logoUrl URL de la imagen (ej: /storage/logos/logo.png)
     * @return string|null Data URI para uso en HTML/CSS
     */
    private function logoToBase64(?string $logoUrl): ?string
    {
        if (!$logoUrl) {
            return null;
        }

        try {
            // Si ya es un data URI, devolverlo tal cual
            if (str_starts_with($logoUrl, 'data:')) {
                return $logoUrl;
            }

            // Resolver la ruta absoluta
            $logoPath = public_path($logoUrl);

            if (!file_exists($logoPath)) {
                \Log::warning('Logo no encontrado: ' . $logoPath);
                return null;
            }

            $imageData = file_get_contents($logoPath);
            $base64 = base64_encode($imageData);

            // Detectar el tipo MIME desde la extensión del archivo
            $extension = strtolower(pathinfo($logoPath, PATHINFO_EXTENSION));
            $mimeTypes = [
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                'svg' => 'image/svg+xml',
            ];
            $mimeType = $mimeTypes[$extension] ?? 'image/png';

            return "data:{$mimeType};base64,{$base64}";
        } catch (\Exception $e) {
            \Log::warning('Error al convertir logo a base64', [
                'error' => $e->getMessage(),
                'logo_url' => $logoUrl
            ]);
            return null;
        }
    }

    /**
     * Obtener logo convertido a base64 para incrustar en PDF
     */
    private function getLogoBase64(): ?string
    {
        try {
            $logoPng = config('branding.png', '/logo.png');
            $logoPath = public_path($logoPng);

            if (!file_exists($logoPath)) {
                return null;
            }

            $imageData = file_get_contents($logoPath);
            $base64 = base64_encode($imageData);

            // Detectar el tipo MIME
            $mimeType = mime_content_type($logoPath) ?: 'image/png';

            return "data:{$mimeType};base64,{$base64}";
        } catch (\Exception $e) {
            \Log::warning('Error al convertir logo a base64', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Obtener productos agrupados de una entrega
     *
     * Agrupa productos de todas las ventas consolidando cantidades
     *
     * GET /api/entregas/{entrega}/productos-agrupados
     *
     * @param Entrega $entrega
     * @return \Illuminate\Http\JsonResponse
     *
     * EJEMPLO DE RESPUESTA:
     * {
     *   "success": true,
     *   "data": {
     *     "entrega_id": 10,
     *     "numero_entrega": "ENT-20260121-10",
     *     "productos": [
     *       {
     *         "producto_id": 1,
     *         "producto_nombre": "Agua Alma 500ml (BOLSITA)",
     *         "codigo_producto": "A500B",
     *         "cantidad_total": 4,
     *         "precio_unitario": "15.00",
     *         "subtotal": "60.00",
     *         "unidad_medida": "Paquete",
     *         "ventas": [
     *           {
     *             "venta_id": 20,
     *             "venta_numero": "VEN20260121-0004",
     *             "cantidad": 1,
     *             "cliente_id": 27,
     *             "cliente_nombre": "Fernando Pinto"
     *           },
     *           {
     *             "venta_id": 19,
     *             "venta_numero": "VEN20260121-0003",
     *             "cantidad": 3,
     *             "cliente_id": 27,
     *             "cliente_nombre": "Fernando Pinto"
     *           }
     *         ]
     *       }
     *     ],
     *     "total_items": 1,
     *     "cantidad_total": 4
     *   }
     * }
     */
    public function obtenerProductosAgrupados(Entrega $entrega)
    {
        try {
            // Cargar relaciones necesarias
            $entrega->load([
                'ventas.cliente',
                'ventas.detalles.producto.unidad',
            ]);

            // Agrupar productos consolidando cantidades
            $productosAgrupados = [];
            $cantidadTotal = 0;

            foreach ($entrega->ventas as $venta) {
                foreach ($venta->detalles as $detalle) {
                    $productoId = $detalle->producto_id;

                    // Si el producto ya existe en el array, sumar cantidad
                    if (isset($productosAgrupados[$productoId])) {
                        $productosAgrupados[$productoId]['cantidad_total'] += (float) $detalle->cantidad;
                        $productosAgrupados[$productoId]['subtotal'] = bcadd(
                            $productosAgrupados[$productoId]['subtotal'],
                            bcmul($detalle->cantidad, $detalle->precio_unitario, 2),
                            2
                        );
                        // Agregar venta a la lista
                        $productosAgrupados[$productoId]['ventas'][] = [
                            'venta_id' => $venta->id,
                            'venta_numero' => $venta->numero,
                            'cantidad' => (float) $detalle->cantidad,
                            'cliente_id' => $venta->cliente_id,
                            'cliente_nombre' => $venta->cliente?->nombre ?? 'Sin cliente',
                        ];
                    } else {
                        // Crear nuevo producto en el array
                        $productosAgrupados[$productoId] = [
                            'producto_id' => $productoId,
                            'producto_nombre' => $detalle->producto?->nombre ?? 'Producto desconocido',
                            'codigo_producto' => $detalle->producto?->codigo_barras ?? '',
                            'cantidad_total' => (float) $detalle->cantidad,
                            'precio_unitario' => (float) $detalle->precio_unitario,
                            'subtotal' => bcmul($detalle->cantidad, $detalle->precio_unitario, 2),
                            'unidad_medida' => $detalle->producto?->unidad?->nombre ?? 'Unidad',
                            'ventas' => [
                                [
                                    'venta_id' => $venta->id,
                                    'venta_numero' => $venta->numero,
                                    'cantidad' => (float) $detalle->cantidad,
                                    'cliente_id' => $venta->cliente_id,
                                    'cliente_nombre' => $venta->cliente?->nombre ?? 'Sin cliente',
                                ]
                            ]
                        ];
                    }

                    $cantidadTotal += (float) $detalle->cantidad;
                }
            }

            // Reindexar array para que sea una lista en lugar de object
            $productosAgrupados = array_values($productosAgrupados);

            return response()->json([
                'success' => true,
                'data' => [
                    'entrega_id' => $entrega->id,
                    'numero_entrega' => $entrega->numero_entrega,
                    'productos' => $productosAgrupados,
                    'total_items' => count($productosAgrupados),
                    'cantidad_total' => $cantidadTotal,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo productos agrupados',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exportar entrega a Excel
     *
     * GET /api/entregas/{entrega}/exportar-excel
     *
     * @param Entrega $entrega
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function exportarExcel(Entrega $entrega)
    {
        try {
            $excelService = new ExcelExportService();
            return $excelService->exportarEntrega($entrega);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generando Excel',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
