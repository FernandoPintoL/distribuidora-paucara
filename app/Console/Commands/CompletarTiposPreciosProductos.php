<?php

namespace App\Console\Commands;

use App\Models\Producto;
use App\Models\TipoPrecio;
use App\Models\PrecioProducto;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CompletarTiposPreciosProductos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'productos:completar-tipos-precios {--dry-run : Simular sin guardar cambios}';

    /**
     * The name and description of the console command.
     *
     * @var string
     */
    protected $description = 'Completa todos los tipos de precios a los productos existentes en la BD';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->info('🚀 Iniciando proceso de completar tipos de precios...');
        $this->newLine();

        if ($dryRun) {
            $this->warn('⚠️  MODO SIMULACIÓN: Los cambios NO serán guardados');
            $this->newLine();
        }

        // Obtener productos activos
        $productos = Producto::where('activo', true)
            ->orderBy('nombre')
            ->get();

        $this->info("📦 Total de productos activos: {$productos->count()}");

        // Obtener tipos de precio activos
        $tiposPrecios = TipoPrecio::where('activo', true)
            ->orderBy('nombre')
            ->get();

        $this->info("💰 Total de tipos de precio activos: {$tiposPrecios->count()}");
        $this->newLine();

        $totalCreados = 0;
        $totalProductosActualizados = 0;

        // Progress bar
        $bar = $this->output->createProgressBar($productos->count());
        $bar->start();

        foreach ($productos as $producto) {
            // Obtener tipos de precio que ya tiene el producto
            $tiposExistentes = $producto->precios()
                ->pluck('tipo_precio_id')
                ->toArray();

            // Identificar tipos de precio faltantes
            $tiposFaltantes = $tiposPrecios
                ->whereNotIn('id', $tiposExistentes)
                ->values();

            if ($tiposFaltantes->isNotEmpty()) {
                $totalProductosActualizados++;

                if (!$dryRun) {
                    foreach ($tiposFaltantes as $tipoPrecio) {
                        PrecioProducto::create([
                            'producto_id'          => $producto->id,
                            'tipo_precio_id'       => $tipoPrecio->id,
                            'precio'               => 0,
                            'activo'               => true,
                            'es_precio_base'       => $tipoPrecio->es_precio_base,
                            'margen_ganancia'      => 0,
                            'porcentaje_ganancia'  => 0,
                            'motivo_cambio'        => 'Creado automáticamente al completar tipos de precios',
                        ]);
                        $totalCreados++;
                    }
                } else {
                    // En modo simulación, solo contar
                    $totalCreados += $tiposFaltantes->count();
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Resumen
        $this->info('✅ Proceso completado!');
        $this->newLine();
        $this->line("📊 Resumen:");
        $this->line("  • Productos actualizados: <fg=cyan>{$totalProductosActualizados}</>");
        $this->line("  • Precios creados: <fg=green>{$totalCreados}</>");
        $this->newLine();

        if ($dryRun) {
            $this->warn('ℹ️  Esto fue una SIMULACIÓN. Para guardar los cambios, ejecuta:');
            $this->info('   php artisan productos:completar-tipos-precios');
        } else {
            $this->info('🎉 Todos los tipos de precios han sido completados exitosamente!');
        }
    }
}
