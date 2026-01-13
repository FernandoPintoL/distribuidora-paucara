<?php

namespace App\Http\Controllers;

use App\Models\Entrega;
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
                'ventas.detalles.producto',
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

            // Crear PDF con configuración según formato
            $viewName = $this->obtenerVistaEntrega($formato);
            $pdf = Pdf::loadView($viewName, $data);

            // Configurar papel y márgenes según formato
            match ($formato) {
                'TICKET_80' => $this->configurarTicket80($pdf),
                'TICKET_58' => $this->configurarTicket58($pdf),
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
                'ventas.detalles.producto',
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
     * Obtener vista Blade según el formato de entrega
     *
     * @param string $formato A4|TICKET_80|TICKET_58
     * @return string Vista Blade
     */
    private function obtenerVistaEntrega(string $formato): string
    {
        return match ($formato) {
            'TICKET_80' => 'impresion.entregas.ticket-80',
            'TICKET_58' => 'impresion.entregas.ticket-58',
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
}
