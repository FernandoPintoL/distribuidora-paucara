<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\PlantillaImpresion;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmpresaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear empresa principal
        $empresa = Empresa::create([
            'nombre_comercial' => 'Distribuidora Paucara',
            'razon_social' => 'Distribuidora Paucara S.R.L.',
            'nit' => '123456789',
            'telefono' => '+591 2 1234567',
            'email' => 'info@distribuidorapaucara.com',
            'sitio_web' => 'www.distribuidorapaucara.com',
            'direccion' => 'Av. Principal #123',
            'ciudad' => 'La Paz',
            'pais' => 'Bolivia',
            'mensaje_footer' => 'Gracias por su preferencia',
            'mensaje_legal' => 'Este documento es una representación impresa de un documento electrónico.',
            'activo' => true,
            'es_principal' => true,
            'configuracion_impresion' => [
                'formatos_soportados' => ['A4', 'TICKET_58', 'TICKET_80'],
                'formato_default' => 'A4',
                'margen_ticket' => '2mm',
                'margen_hoja' => '10mm',
                'mostrar_logo_ticket' => true,
                'mostrar_logo_hoja' => true,
                'fuente_ticket' => 'Courier New',
                'fuente_hoja' => 'Arial',
                'tamaño_fuente_ticket' => '8px',
                'tamaño_fuente_hoja' => '10px',
            ],
        ]);

        $this->command->info('✓ Empresa creada: ' . $empresa->nombre_comercial);

        // Crear plantillas para VENTAS
        $plantillasVentas = [
            [
                'codigo' => 'VENTA_A4',
                'nombre' => 'Factura Hoja Completa A4',
                'tipo_documento' => 'venta',
                'formato' => 'A4',
                'vista_blade' => 'impresion.ventas.hoja-completa',
                'es_default' => true,
                'orden' => 1,
            ],
            [
                'codigo' => 'VENTA_TICKET_80',
                'nombre' => 'Ticket de Venta 80mm',
                'tipo_documento' => 'venta',
                'formato' => 'TICKET_80',
                'vista_blade' => 'impresion.ventas.ticket-80',
                'es_default' => false,
                'orden' => 2,
            ],
            [
                'codigo' => 'VENTA_TICKET_58',
                'nombre' => 'Ticket de Venta 58mm',
                'tipo_documento' => 'venta',
                'formato' => 'TICKET_58',
                'vista_blade' => 'impresion.ventas.ticket-58',
                'es_default' => false,
                'orden' => 3,
            ],
        ];

        // Crear plantillas para PROFORMAS
        $plantillasProformas = [
            [
                'codigo' => 'PROFORMA_A4',
                'nombre' => 'Proforma Hoja Completa A4',
                'tipo_documento' => 'proforma',
                'formato' => 'A4',
                'vista_blade' => 'impresion.proformas.hoja-completa',
                'es_default' => true,
                'orden' => 1,
            ],
            [
                'codigo' => 'PROFORMA_TICKET_80',
                'nombre' => 'Proforma Ticket 80mm',
                'tipo_documento' => 'proforma',
                'formato' => 'TICKET_80',
                'vista_blade' => 'impresion.proformas.ticket-80',
                'es_default' => false,
                'orden' => 2,
            ],
        ];

        // Crear plantillas para ENVÍOS
        $plantillasEnvios = [
            [
                'codigo' => 'ENVIO_A4',
                'nombre' => 'Guía de Remisión A4',
                'tipo_documento' => 'envio',
                'formato' => 'A4',
                'vista_blade' => 'impresion.envios.guia-remision-a4',
                'es_default' => true,
                'orden' => 1,
            ],
            [
                'codigo' => 'ENVIO_TICKET_80',
                'nombre' => 'Guía de Remisión Ticket 80mm',
                'tipo_documento' => 'envio',
                'formato' => 'TICKET_80',
                'vista_blade' => 'impresion.envios.guia-remision-ticket',
                'es_default' => false,
                'orden' => 2,
            ],
        ];

        // Crear plantillas para REPORTES
        // NOTA: Cada tipo_documento + formato debe ser único por empresa
        // Por eso separamos los reportes en tipos diferentes
        $plantillasReportes = [
            [
                'codigo' => 'REPORTE_INVENTARIO_A4',
                'nombre' => 'Reporte de Inventario A4',
                'tipo_documento' => 'reporte_inventario',
                'formato' => 'A4',
                'vista_blade' => 'impresion.reportes.inventario-a4',
                'es_default' => true,
                'orden' => 1,
            ],
            [
                'codigo' => 'REPORTE_VENTAS_A4',
                'nombre' => 'Reporte de Ventas A4',
                'tipo_documento' => 'reporte_ventas',
                'formato' => 'A4',
                'vista_blade' => 'impresion.reportes.ventas-a4',
                'es_default' => true,
                'orden' => 1,
            ],
        ];

        // Unir todas las plantillas
        $todasPlantillas = array_merge(
            $plantillasVentas,
            $plantillasProformas,
            $plantillasEnvios,
            $plantillasReportes
        );

        // Crear todas las plantillas
        foreach ($todasPlantillas as $plantilla) {
            PlantillaImpresion::create(array_merge($plantilla, [
                'empresa_id' => $empresa->id,
                'activo' => true,
            ]));

            $this->command->info('  ✓ Plantilla creada: ' . $plantilla['nombre']);
        }

        $this->command->info('');
        $this->command->info('=================================================');
        $this->command->info('✓ Seeder completado exitosamente');
        $this->command->info('  - 1 Empresa creada');
        $this->command->info('  - ' . count($todasPlantillas) . ' Plantillas de impresión creadas');
        $this->command->info('=================================================');
    }
}
