<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\PlantillaImpresion;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;

/**
 * Servicio Centralizado de Impresión
 *
 * Este servicio proporciona una interfaz unificada para generar
 * documentos PDF en diferentes formatos (A4, tickets térmicos, etc.)
 * para distintos tipos de documentos (ventas, proformas, envíos, reportes).
 *
 * Características:
 * - Multi-formato (A4, TICKET_80, TICKET_58, CUSTOM)
 * - Multi-documento (ventas, proformas, envíos, reportes)
 * - Multi-empresa (soporte para cambio de empresa)
 * - Plantillas dinámicas configurables
 *
 * Uso:
 * ```php
 * $impresionService = app(ImpresionService::class);
 * $pdf = $impresionService->imprimirVenta($venta, 'TICKET_80');
 * return $pdf->download('ticket.pdf');
 * ```
 */
class ImpresionService
{
    protected ?Empresa $empresa = null;

    public function __construct()
    {
        try {
            $this->empresa = Empresa::principal();
        } catch (Exception $e) {
            // Si no existe la tabla o hay error, empresa será null
            \Log::warning('No se pudo cargar empresa principal para impresión', [
                'error' => $e->getMessage()
            ]);
            $this->empresa = null;
        }
    }

    /**
     * Generar PDF genérico para cualquier tipo de documento
     *
     * @param string $tipoDocumento 'venta'|'proforma'|'envio'|'reporte'
     * @param mixed $documento Modelo (Venta, Proforma, Envio, etc.) o datos para reportes
     * @param string|null $formato 'A4'|'TICKET_80'|'TICKET_58'|null (usa default)
     * @param array $opciones Opciones adicionales para el template
     * @return \Barryvdh\DomPDF\PDF
     * @throws Exception
     */
    public function generarPDF(
        string $tipoDocumento,
        $documento,
        ?string $formato = null,
        array $opciones = []
    ) {
        // Obtener plantilla adecuada
        $plantilla = PlantillaImpresion::obtenerDefault($tipoDocumento, $formato);

        if (!$plantilla) {
            throw new Exception(
                "No existe plantilla activa para '{$tipoDocumento}'" .
                ($formato ? " con formato '{$formato}'" : '')
            );
        }

        // Preparar datos para la vista
        $datos = $this->prepararDatos($documento, $plantilla, $opciones);

        // Generar PDF usando la vista Blade especificada
        $pdf = PDF::loadView($plantilla->vista_blade, $datos);

        // Aplicar configuración específica del formato
        $this->aplicarConfiguracionFormato($pdf, $plantilla->formato);

        return $pdf;
    }

    /**
     * Preparar datos comunes para todas las vistas
     *
     * @param mixed $documento
     * @param PlantillaImpresion $plantilla
     * @param array $opciones
     * @return array
     */
    private function prepararDatos($documento, PlantillaImpresion $plantilla, array $opciones): array
    {
        // Asegurar que tenemos una empresa
        $empresa = $this->empresa ?? Empresa::principal();

        if (!$empresa) {
            throw new Exception('No hay empresa configurada para generar documentos');
        }

        return [
            'documento' => $documento,
            'empresa' => $empresa,
            'plantilla' => $plantilla,
            'fecha_impresion' => now(),
            'usuario' => auth()->user(),
            'opciones' => $opciones,
        ];
    }

    /**
     * Aplicar configuración de tamaño de papel según el formato
     *
     * @param \Barryvdh\DomPDF\PDF $pdf
     * @param string $formato
     * @return void
     */
    private function aplicarConfiguracionFormato($pdf, string $formato): void
    {
        $config = match($formato) {
            'A4' => [
                'paper' => 'A4',
                'orientation' => 'portrait',
            ],
            'TICKET_80' => [
                // 80mm de ancho, altura automática (muy largo para permitir contenido variable)
                'paper' => [0, 0, 226.77, 841.89], // 80mm x 297mm en puntos
                'orientation' => 'portrait',
            ],
            'TICKET_58' => [
                // 58mm de ancho, altura automática
                'paper' => [0, 0, 164.41, 841.89], // 58mm x 297mm en puntos
                'orientation' => 'portrait',
            ],
            'CUSTOM' => [
                // Tamaño personalizado desde configuración de empresa
                'paper' => $this->obtenerTamañoCustom(),
                'orientation' => 'portrait',
            ],
            default => [
                'paper' => 'A4',
                'orientation' => 'portrait',
            ]
        };

        $pdf->setPaper($config['paper'], $config['orientation']);
    }

    /**
     * Obtener tamaño de papel personalizado desde configuración
     *
     * @return array
     */
    private function obtenerTamañoCustom(): array
    {
        $empresa = $this->empresa ?? Empresa::principal();
        $anchoMm = $empresa?->configuracion_impresion['ancho_ticket_custom'] ?? 80;

        // Convertir mm a puntos (1mm = 2.83465 puntos)
        $anchoPuntos = $anchoMm * 2.83465;

        return [0, 0, $anchoPuntos, 841.89]; // Altura fija A4
    }

    /**
     * Imprimir Venta/Factura
     *
     * @param \App\Models\Venta $venta
     * @param string|null $formato
     * @param array $opciones
     * @return \Barryvdh\DomPDF\PDF
     */
    public function imprimirVenta($venta, ?string $formato = 'A4', array $opciones = [])
    {
        // Cargar relaciones necesarias
        $venta->load([
            'cliente',
            'detalles.producto',
            'usuario',
            'tipoPago',
            'tipoDocumento',
            'moneda',
            'estadoDocumento',
        ]);

        return $this->generarPDF('venta', $venta, $formato, $opciones);
    }

    /**
     * Imprimir Proforma/Cotización
     *
     * @param \App\Models\Proforma $proforma
     * @param string|null $formato
     * @param array $opciones
     * @return \Barryvdh\DomPDF\PDF
     */
    public function imprimirProforma($proforma, ?string $formato = 'A4', array $opciones = [])
    {
        // Cargar relaciones necesarias
        $proforma->load([
            'cliente',
            'detalles.producto',
            'usuarioCreador',
            'usuarioAprobador',
            'moneda',
        ]);

        return $this->generarPDF('proforma', $proforma, $formato, $opciones);
    }

    /**
     * Imprimir Guía de Remisión/Envío
     *
     * @param \App\Models\Envio $envio
     * @param string|null $formato
     * @param array $opciones
     * @return \Barryvdh\DomPDF\PDF
     */
    public function imprimirEnvio($envio, ?string $formato = 'A4', array $opciones = [])
    {
        // Cargar relaciones necesarias
        $envio->load([
            'venta.cliente',
            'venta.detalles.producto',
            'venta.usuario',
            'vehiculo',
            'chofer',
        ]);

        return $this->generarPDF('envio', $envio, $formato, $opciones);
    }

    /**
     * Imprimir Reporte
     *
     * @param string $tipoReporte Tipo específico de reporte (inventario, ventas, etc.)
     * @param mixed $datos Datos del reporte
     * @param string|null $formato
     * @param array $opciones
     * @return \Barryvdh\DomPDF\PDF
     */
    public function imprimirReporte(string $tipoReporte, $datos, ?string $formato = 'A4', array $opciones = [])
    {
        // Agregar tipo de reporte a las opciones
        $opciones['tipo_reporte'] = $tipoReporte;

        return $this->generarPDF('reporte', $datos, $formato, $opciones);
    }

    /**
     * Obtener lista de formatos disponibles para un tipo de documento
     *
     * @param string $tipoDocumento
     * @return \Illuminate\Support\Collection
     */
    public function obtenerFormatosDisponibles(string $tipoDocumento)
    {
        try {
            $plantillas = PlantillaImpresion::obtenerPorTipo($tipoDocumento);

            // Si no hay plantillas configuradas, retornar formatos por defecto
            if ($plantillas->isEmpty()) {
                return collect([
                    [
                        'formato' => 'A4',
                        'nombre' => 'Hoja Completa (A4)',
                        'descripcion' => 'Formato estándar A4',
                    ],
                    [
                        'formato' => 'TICKET_80',
                        'nombre' => 'Ticket 80mm',
                        'descripcion' => 'Impresora térmica 80mm',
                    ],
                    [
                        'formato' => 'TICKET_58',
                        'nombre' => 'Ticket 58mm',
                        'descripcion' => 'Impresora térmica 58mm',
                    ],
                ]);
            }

            return $plantillas->map(fn($plantilla) => [
                'codigo' => $plantilla->codigo,
                'nombre' => $plantilla->nombre,
                'formato' => $plantilla->formato,
                'descripcion' => $plantilla->nombre,
                'es_default' => $plantilla->es_default,
            ]);
        } catch (Exception $e) {
            // En caso de error (tabla no existe, etc.), retornar formatos por defecto
            \Log::warning('Error al obtener formatos de impresión', [
                'tipo_documento' => $tipoDocumento,
                'error' => $e->getMessage(),
            ]);

            return collect([
                [
                    'formato' => 'A4',
                    'nombre' => 'Hoja Completa (A4)',
                    'descripcion' => 'Formato estándar A4',
                ],
                [
                    'formato' => 'TICKET_80',
                    'nombre' => 'Ticket 80mm',
                    'descripcion' => 'Impresora térmica 80mm',
                ],
            ]);
        }
    }

    /**
     * Cambiar empresa activa para impresión (útil para multi-tenant)
     *
     * @param Empresa $empresa
     * @return self
     */
    public function conEmpresa(Empresa $empresa): self
    {
        $this->empresa = $empresa;
        return $this;
    }
}
