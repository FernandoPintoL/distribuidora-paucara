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

    /**
     * Configuración de fuentes disponibles para impresoras térmicas
     */
    protected const FUENTES_TERMICAS = [
        'consolas' => [
            'nombre' => 'Consolas (Recomendado)',
            'stack' => "'Consolas', 'Courier New', 'Courier', monospace",
            'descripcion' => 'Fuente monoespaciada clara, óptima para impresoras SAT',
        ],
        'courier' => [
            'nombre' => 'Courier New',
            'stack' => "'Courier New', 'Courier', monospace",
            'descripcion' => 'Fuente clásica monoespaciada',
        ],
        'monospace' => [
            'nombre' => 'Monospace Genérica',
            'stack' => "monospace",
            'descripcion' => 'Fuente monoespaciada del sistema',
        ],
        'ocr-a' => [
            'nombre' => 'OCR-A (ASCII Font A)',
            'stack' => "'OCR-A', 'Courier New', monospace",
            'descripcion' => 'Simula font A de impresoras térmicas',
        ],
        'roboto-mono' => [
            'nombre' => 'Roboto Mono',
            'stack' => "'Roboto Mono', 'Courier New', monospace",
            'descripcion' => 'Fuente moderna monoespaciada',
        ],
    ];

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
     * @param string $tipoDocumento 'venta'|'proforma'|'envio'|'reporte'|'compra'
     * @param mixed $documento Modelo (Venta, Proforma, Envio, Compra, etc.) o datos para reportes
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
        \Log::info('📝 [ImpresionService::generarPDF] INICIANDO', [
            'tipoDocumento' => $tipoDocumento,
            'formato' => $formato,
            'tipo_documento_class' => is_object($documento) ? get_class($documento) : gettype($documento),
        ]);

        try {
            // Obtener plantilla adecuada
            \Log::info('📝 [ImpresionService::generarPDF] Buscando plantilla', [
                'tipoDocumento' => $tipoDocumento,
                'formato' => $formato,
            ]);

            $plantilla = PlantillaImpresion::obtenerDefault($tipoDocumento, $formato);

            // Si no existe plantilla, intentar usar vistas hardcodeadas por defecto
            if (!$plantilla) {
                \Log::info('⚠️ [ImpresionService::generarPDF] No hay plantilla, buscando vista fallback', [
                    'tipoDocumento' => $tipoDocumento,
                    'formato' => $formato,
                ]);

                $vistaFallback = $this->obtenerVistaFallback($tipoDocumento, $formato);

                if (!$vistaFallback) {
                    \Log::error('❌ [ImpresionService::generarPDF] No se encontró vista fallback', [
                        'tipoDocumento' => $tipoDocumento,
                        'formato' => $formato,
                    ]);
                    throw new Exception(
                        "No existe plantilla activa para '{$tipoDocumento}'" .
                        ($formato ? " con formato '{$formato}'" : '') .
                        " y no hay vista por defecto disponible"
                    );
                }

                \Log::info('✅ [ImpresionService::generarPDF] Vista fallback encontrada', [
                    'tipoDocumento' => $tipoDocumento,
                    'formato' => $formato,
                    'vista' => $vistaFallback,
                ]);

            // Usar vista fallback
            $empresa = $this->empresa ?? Empresa::principal();

            // Convertir logos a base64 para embebimiento en PDF
            $logoPrincipalBase64 = $this->logoToBase64($empresa->logo_principal);
            $logoFooterBase64 = $this->logoToBase64($empresa->logo_footer);

            // Si el documento es un array, desglice sus datos
            $datosAdjuntos = is_array($documento) ? $documento : [];

            // Obtener fuente desde opciones o usar la por defecto
            $nombreFuente = $opciones['fuente'] ?? 'consolas';
            $fuente = $this->obtenerFuente($nombreFuente);

            $datos = array_merge([
                $tipoDocumento => $documento,
                'documento' => $documento,
                'empresa' => $empresa,
                'fecha_impresion' => now(),
                'usuario' => auth()->user() ?? 'Sistema',
                'opciones' => $opciones,
                'logo_principal_base64' => $logoPrincipalBase64,
                'logo_footer_base64' => $logoFooterBase64,
                'fuente_config' => $fuente,
                'fuentes_disponibles' => $this->obtenerFuentesDisponibles(),
            ], $datosAdjuntos);

            \Log::info('📝 [ImpresionService::generarPDF] Cargando vista fallback', [
                'vista' => $vistaFallback,
                'tipoDocumento' => $tipoDocumento,
            ]);

            $pdf = PDF::loadView($vistaFallback, $datos);

            \Log::info('📝 [ImpresionService::generarPDF] PDF cargado desde vista fallback', [
                'tipoDocumento' => $tipoDocumento,
            ]);

            $this->aplicarConfiguracionFormato($pdf, $formato ?? 'A4');

            \Log::info('✅ [ImpresionService::generarPDF] PDF generado exitosamente (fallback)', [
                'tipoDocumento' => $tipoDocumento,
                'formato' => $formato,
            ]);

            return $pdf;
        }

        // Preparar datos para la vista
        \Log::info('📝 [ImpresionService::generarPDF] Preparando datos para plantilla', [
            'tipoDocumento' => $tipoDocumento,
        ]);

        $datos = $this->prepararDatos($documento, $plantilla, $opciones);

        // Generar PDF usando la vista Blade especificada
        \Log::info('📝 [ImpresionService::generarPDF] Cargando vista de plantilla', [
            'vista' => $plantilla->vista_blade,
        ]);

        $pdf = PDF::loadView($plantilla->vista_blade, $datos);

        \Log::info('📝 [ImpresionService::generarPDF] PDF cargado desde plantilla', [
            'tipoDocumento' => $tipoDocumento,
        ]);

        // Aplicar configuración específica del formato
        $this->aplicarConfiguracionFormato($pdf, $plantilla->formato);

        \Log::info('✅ [ImpresionService::generarPDF] PDF generado exitosamente (plantilla)', [
            'tipoDocumento' => $tipoDocumento,
            'formato' => $plantilla->formato,
        ]);

        return $pdf;
        } catch (\Exception $e) {
            \Log::error('❌ [ImpresionService::generarPDF] ERROR CRÍTICO', [
                'tipoDocumento' => $tipoDocumento,
                'formato' => $formato,
                'error' => $e->getMessage(),
                'archivo' => $e->getFile(),
                'línea' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Obtener vista fallback para un tipo de documento
     *
     * @param string $tipoDocumento
     * @param string|null $formato
     * @return string|null
     */
    private function obtenerVistaFallback(string $tipoDocumento, ?string $formato = null): ?string
    {
        \Log::info('🔍 [ImpresionService::obtenerVistaFallback] Buscando vista fallback', [
            'tipoDocumento' => $tipoDocumento,
            'formato' => $formato,
        ]);

        $formato = $formato ?? 'A4';

        $fallbacks = [
            'venta' => [
                'A4' => 'impresion.ventas.hoja-completa',
                'TICKET_80' => 'impresion.ventas.ticket-80',
                'TICKET_58' => 'impresion.ventas.ticket-58',
            ],
            'compra' => [
                'A4' => 'impresion.compras.hoja-completa',
                'TICKET_80' => 'impresion.compras.ticket-80',
                'TICKET_58' => 'impresion.compras.ticket-58',
            ],
            'proforma' => [
                'A4' => 'impresion.proformas.hoja-completa',
                'TICKET_80' => 'impresion.proformas.ticket-80',
            ],
            'envio' => [
                'A4' => 'impresion.envios.hoja-completa',
            ],
            'cierre_caja' => [
                'A4' => 'impresion.cajas.cierre-diario-a4',
                'TICKET_80' => 'impresion.cajas.cierre-caja-ticket-80',
                'TICKET_58' => 'impresion.cajas.cierre-caja-ticket-58',
            ],
            'movimientos_caja' => [
                'A4' => 'impresion.cajas.movimientos-dia-a4',
                'TICKET_80' => 'impresion.cajas.movimientos-caja-ticket-80',
                'TICKET_58' => 'impresion.cajas.movimientos-caja-ticket-58',
            ],
            'cierre_diario_general' => [
                'A4' => 'impresion.cajas.cierre-diario-a4',
                'TICKET_80' => 'impresion.cajas.cierre-diario-ticket-80',
                'TICKET_58' => 'impresion.cajas.cierre-diario-ticket-58',
            ],
            'movimiento_individual' => [
                'A4' => 'impresion.cajas.movimiento-individual-a4',
                'TICKET_80' => 'impresion.cajas.movimiento-individual-ticket-80',
                'TICKET_58' => 'impresion.cajas.movimiento-individual-ticket-58',
            ],
            'cuenta-por-cobrar' => [
                'A4' => 'impresion.cuentas_por_cobrar.hoja-completa',
                'TICKET_80' => 'impresion.cuentas_por_cobrar.ticket-80',
                'TICKET_58' => 'impresion.cuentas_por_cobrar.ticket-58',
            ],
            'cuenta-por-pagar' => [
                'A4' => 'impresion.cuentas_por_pagar.hoja-completa',
                'TICKET_80' => 'impresion.cuentas_por_pagar.ticket-80',
                'TICKET_58' => 'impresion.cuentas_por_pagar.ticket-58',
            ],
        ];

        $vistaEncontrada = $fallbacks[$tipoDocumento][$formato] ?? null;

        if ($vistaEncontrada) {
            \Log::info('✅ [ImpresionService::obtenerVistaFallback] Vista fallback encontrada', [
                'tipoDocumento' => $tipoDocumento,
                'formato' => $formato,
                'vista' => $vistaEncontrada,
            ]);
        } else {
            \Log::warning('⚠️ [ImpresionService::obtenerVistaFallback] No se encontró vista fallback', [
                'tipoDocumento' => $tipoDocumento,
                'formato' => $formato,
                'tipos_disponibles' => array_keys($fallbacks),
            ]);
        }

        return $vistaEncontrada;
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

        // Convertir logos a base64 para embebimiento en PDF
        $logoPrincipalBase64 = $this->logoToBase64($empresa->logo_principal);
        $logoFooterBase64 = $this->logoToBase64($empresa->logo_footer);

        return [
            'documento' => $documento,
            'empresa' => $empresa,
            'plantilla' => $plantilla,
            'fecha_impresion' => now(),
            'usuario' => auth()->user()?->name ?? 'Sistema',
            'opciones' => $opciones,
            'logo_principal_base64' => $logoPrincipalBase64,
            'logo_footer_base64' => $logoFooterBase64,
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
     * Imprimir Compra
     *
     * @param \App\Models\Compra $compra
     * @param string|null $formato
     * @param array $opciones
     * @return \Barryvdh\DomPDF\PDF
     */
    public function imprimirCompra($compra, ?string $formato = 'A4', array $opciones = [])
    {
        // Cargar relaciones necesarias
        $compra->load([
            'proveedor',
            'detalles.producto',
            'usuario',
            'tipoPago',
            'moneda',
            'estadoDocumento',
            'almacen',
        ]);

        return $this->generarPDF('compra', $compra, $formato, $opciones);
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
            'detalles.producto.stock.almacen',
            'usuario',
            'tipoPago',
            'tipoDocumento',
            'moneda',
            'estadoDocumento',
            'movimientoCaja.caja',
            'proforma.usuarioCreador',
            'accessToken',
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
     * Imprimir Cuenta por Cobrar
     *
     * @param \App\Models\CuentaPorCobrar $cuentaPorCobrar
     * @param string|null $formato
     * @param array $opciones
     * @return \Barryvdh\DomPDF\PDF
     */
    public function imprimirCuentaPorCobrar($cuentaPorCobrar, ?string $formato = 'A4', array $opciones = [])
    {
        \Log::info('📝 [ImpresionService::imprimirCuentaPorCobrar] INICIANDO', [
            'cuenta_id' => $cuentaPorCobrar->id,
            'formato' => $formato,
            'opciones' => $opciones,
        ]);

        try {
            // Cargar relaciones necesarias
            \Log::info('📝 [ImpresionService::imprimirCuentaPorCobrar] Cargando relaciones', [
                'cuenta_id' => $cuentaPorCobrar->id,
            ]);

            $cuentaPorCobrar->load([
                'cliente',
                'venta',
                'usuario',
            ]);

            \Log::info('✅ [ImpresionService::imprimirCuentaPorCobrar] Relaciones cargadas exitosamente', [
                'cuenta_id' => $cuentaPorCobrar->id,
                'tiene_cliente' => !!$cuentaPorCobrar->cliente,
                'tiene_venta' => !!$cuentaPorCobrar->venta,
                'tiene_usuario' => !!$cuentaPorCobrar->usuario,
            ]);

            return $this->generarPDF('cuenta-por-cobrar', $cuentaPorCobrar, $formato, $opciones);
        } catch (\Exception $e) {
            \Log::error('❌ [ImpresionService::imprimirCuentaPorCobrar] ERROR', [
                'cuenta_id' => $cuentaPorCobrar->id,
                'formato' => $formato,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Imprimir Cuenta por Pagar
     *
     * @param \App\Models\CuentaPorPagar $cuentaPorPagar
     * @param string|null $formato
     * @param array $opciones
     * @return \Barryvdh\DomPDF\PDF
     */
    public function imprimirCuentaPorPagar($cuentaPorPagar, ?string $formato = 'A4', array $opciones = [])
    {
        \Log::info('📝 [ImpresionService::imprimirCuentaPorPagar] INICIANDO', [
            'cuenta_id' => $cuentaPorPagar->id,
            'formato' => $formato,
            'opciones' => $opciones,
        ]);

        try {
            // Cargar relaciones necesarias
            \Log::info('📝 [ImpresionService::imprimirCuentaPorPagar] Cargando relaciones', [
                'cuenta_id' => $cuentaPorPagar->id,
            ]);

            $cuentaPorPagar->load([
                'compra.proveedor',
                'usuario',
            ]);

            \Log::info('✅ [ImpresionService::imprimirCuentaPorPagar] Relaciones cargadas exitosamente', [
                'cuenta_id' => $cuentaPorPagar->id,
                'tiene_compra' => !!$cuentaPorPagar->compra,
                'tiene_proveedor' => !!$cuentaPorPagar->compra?->proveedor,
                'tiene_usuario' => !!$cuentaPorPagar->usuario,
            ]);

            return $this->generarPDF('cuenta-por-pagar', $cuentaPorPagar, $formato, $opciones);
        } catch (\Exception $e) {
            \Log::error('❌ [ImpresionService::imprimirCuentaPorPagar] ERROR', [
                'cuenta_id' => $cuentaPorPagar->id,
                'formato' => $formato,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
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
     * Obtener todas las fuentes disponibles para impresoras térmicas
     *
     * @return array
     */
    public function obtenerFuentesDisponibles(): array
    {
        return self::FUENTES_TERMICAS;
    }

    /**
     * Obtener la fuente actual según configuración
     * Por defecto retorna 'consolas'
     *
     * @param string $fuente Nombre de la fuente (consolas, courier, ocr-a, roboto-mono, monospace)
     * @return array|null
     */
    public function obtenerFuente(string $fuente = 'consolas'): ?array
    {
        return self::FUENTES_TERMICAS[$fuente] ?? self::FUENTES_TERMICAS['consolas'];
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
        } catch (Exception $e) {
            \Log::warning('Error al convertir logo a base64', [
                'error' => $e->getMessage(),
                'logo_url' => $logoUrl
            ]);
            return null;
        }
    }
}
