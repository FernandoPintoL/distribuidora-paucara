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
            'view_exists' => view()->exists('entregas.entrega-pdf'),
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

            // Preparar datos para el PDF
            $logoBase64 = $this->getLogoBase64();

            $data = [
                'entrega' => $entrega,
                'fecha_generacion' => now()->format('d/m/Y H:i'),
                'empresa' => config('app.name', 'Distribuidora Paucara'),
                'formato' => $formato,
                'logo' => $logoBase64,
            ];

            // Crear PDF con configuración según formato
            $pdf = Pdf::loadView('entregas.entrega-pdf', $data);

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

            // Preparar datos para el PDF
            $logoBase64 = $this->getLogoBase64();

            $data = [
                'entrega' => $entrega,
                'fecha_generacion' => now()->format('d/m/Y H:i'),
                'empresa' => config('app.name', 'Distribuidora Paucara'),
                'formato' => $formato,
                'logo' => $logoBase64,
            ];

            // Crear PDF
            $pdf = Pdf::loadView('entregas.entrega-pdf', $data);

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
