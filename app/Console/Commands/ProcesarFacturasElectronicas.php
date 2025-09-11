<?php
namespace App\Console\Commands;

use App\Services\FacturacionElectronicaService;
use Illuminate\Console\Command;

class ProcesarFacturasElectronicas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facturacion:procesar-pendientes
                           {--verificar : Solo verificar estado de facturas enviadas}
                           {--limite=50 : Límite de facturas a procesar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Procesa facturas electrónicas pendientes de envío al SIN';

    private FacturacionElectronicaService $facturacionService;

    public function __construct(FacturacionElectronicaService $facturacionService)
    {
        parent::__construct();
        $this->facturacionService = $facturacionService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧾 Iniciando procesamiento de facturas electrónicas...');

        if ($this->option('verificar')) {
            return $this->verificarEstadoFacturas();
        }

        $resultados = $this->facturacionService->procesarFacturasPendientes();

        $this->newLine();
        $this->info('📊 Resumen del procesamiento:');
        $this->table(
            ['Concepto', 'Cantidad'],
            [
                ['Facturas procesadas', $resultados['procesadas']],
                ['Enviadas exitosamente', $resultados['exitosas']],
                ['Con errores', $resultados['con_errores']],
            ]
        );

        if ($resultados['con_errores'] > 0) {
            $this->warn("⚠️  {$resultados['con_errores']} facturas presentaron errores");
            $this->info('💡 Revisa los logs para más detalles');
        }

        if ($resultados['exitosas'] > 0) {
            $this->info("✅ {$resultados['exitosas']} facturas enviadas correctamente al SIN");
        }

        return Command::SUCCESS;
    }

    /**
     * Verificar estado de facturas ya enviadas
     */
    private function verificarEstadoFacturas()
    {
        $this->info('🔍 Verificando estado de facturas en el SIN...');

        // Obtener facturas enviadas pero no procesadas
        $facturas = \App\Models\FacturaElectronica::where('estado', 'enviado')
            ->whereNotNull('codigo_recepcion')
            ->whereNull('fecha_procesamiento_sin')
            ->limit($this->option('limite'))
            ->get();

        $this->info("📋 Encontradas {$facturas->count()} facturas para verificar");

        $procesadas = 0;
        $vigentes   = 0;
        $observadas = 0;

        foreach ($facturas as $factura) {
            $this->info("Verificando factura CUF: {$factura->cuf}");

            if ($this->facturacionService->verificarEstadoFactura($factura)) {
                $vigentes++;
                $this->line("  ✅ Factura vigente");
            } else {
                $observadas++;
                $this->line("  ⚠️  Factura observada o con errores");
            }

            $procesadas++;
        }

        $this->newLine();
        $this->info('📊 Resumen de verificación:');
        $this->table(
            ['Estado', 'Cantidad'],
            [
                ['Facturas verificadas', $procesadas],
                ['Vigentes', $vigentes],
                ['Observadas', $observadas],
            ]
        );

        return Command::SUCCESS;
    }
}
