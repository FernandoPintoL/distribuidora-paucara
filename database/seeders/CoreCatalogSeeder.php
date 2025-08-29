<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CoreCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // Estados de documento
        $estadosDocumento = [
            ['codigo' => 'BORRADOR', 'nombre' => 'Borrador'],
            ['codigo' => 'PENDIENTE', 'nombre' => 'Pendiente'],
            ['codigo' => 'APROBADO', 'nombre' => 'Aprobado'],
            ['codigo' => 'RECHAZADO', 'nombre' => 'Rechazado'],
            ['codigo' => 'CANCELADO', 'nombre' => 'Cancelado'],
            ['codigo' => 'FACTURADO', 'nombre' => 'Facturado'],
        ];
        DB::table('estados_documento')->upsert($estadosDocumento, ['codigo'], ['nombre']);

        // Tipos de pago
        $tiposPago = [
            ['codigo' => 'EFECTIVO', 'nombre' => 'Efectivo'],
            ['codigo' => 'TRANSFERENCIA', 'nombre' => 'Transferencia'],
            ['codigo' => 'CREDITO', 'nombre' => 'Crédito'],
            ['codigo' => 'TARJETA', 'nombre' => 'Tarjeta'],
        ];
        DB::table('tipos_pago')->upsert($tiposPago, ['codigo'], ['nombre']);

        // Tipo operación de caja
        $tiposOpCaja = [
            ['codigo' => 'APERTURA', 'nombre' => 'Apertura'],
            ['codigo' => 'CIERRE', 'nombre' => 'Cierre'],
            ['codigo' => 'VENTA', 'nombre' => 'Venta'],
            ['codigo' => 'COMPRA', 'nombre' => 'Compra'],
            ['codigo' => 'GASTO', 'nombre' => 'Gasto'],
            ['codigo' => 'INGRESO_EXTRA', 'nombre' => 'Ingreso extra'],
        ];
        DB::table('tipo_operacion_caja')->upsert($tiposOpCaja, ['codigo'], ['nombre']);

        // Estados de pedido
        $estadosPedido = [
            ['codigo' => 'SOLICITADO', 'nombre' => 'Solicitado'],
            ['codigo' => 'CONFIRMADO', 'nombre' => 'Confirmado'],
            ['codigo' => 'PREPARANDO', 'nombre' => 'Preparando'],
            ['codigo' => 'LISTO_PARA_ENVIO', 'nombre' => 'Listo para envío'],
            ['codigo' => 'EN_CAMINO', 'nombre' => 'En camino'],
            ['codigo' => 'ENTREGADO', 'nombre' => 'Entregado'],
            ['codigo' => 'CANCELADO', 'nombre' => 'Cancelado'],
        ];
        DB::table('estados_pedido')->upsert($estadosPedido, ['codigo'], ['nombre']);

        // Monedas básicas
        /*$monedas = [

        ];
        DB::table('monedas')->upsert($monedas, ['codigo'], ['nombre','simbolo','decimales','es_principal','activa']);*/
    }
}
