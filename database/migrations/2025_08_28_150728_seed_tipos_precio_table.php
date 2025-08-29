<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tiposPrecios = [
            [
                'codigo' => 'COSTO',
                'nombre' => 'Precio de Costo',
                'descripcion' => 'Precio de compra o costo del producto, base para calcular ganancias',
                'color' => 'blue',
                'es_ganancia' => false,
                'es_precio_base' => true,
                'orden' => 1,
                'activo' => true,
                'es_sistema' => true,
                'configuracion' => json_encode([
                    'icono' => '📦',
                    'tooltip' => 'Precio base para cálculos de ganancia'
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'VENTA',
                'nombre' => 'Precio de Venta',
                'descripcion' => 'Precio de venta al público general',
                'color' => 'green',
                'es_ganancia' => true,
                'es_precio_base' => false,
                'orden' => 2,
                'activo' => true,
                'es_sistema' => true,
                'configuracion' => json_encode([
                    'icono' => '💰',
                    'tooltip' => 'Precio de venta al público'
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'POR_MAYOR',
                'nombre' => 'Precio por Mayor',
                'descripcion' => 'Precio especial para ventas al por mayor',
                'color' => 'purple',
                'es_ganancia' => true,
                'es_precio_base' => false,
                'orden' => 3,
                'activo' => true,
                'es_sistema' => true,
                'configuracion' => json_encode([
                    'icono' => '📦',
                    'tooltip' => 'Precio para ventas mayoristas',
                    'cantidad_minima' => 10
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'FACTURADO',
                'nombre' => 'Precio Facturado',
                'descripcion' => 'Precio para ventas con factura fiscal',
                'color' => 'orange',
                'es_ganancia' => true,
                'es_precio_base' => false,
                'orden' => 4,
                'activo' => true,
                'es_sistema' => true,
                'configuracion' => json_encode([
                    'icono' => '🧾',
                    'tooltip' => 'Precio con factura fiscal',
                    'incluye_impuestos' => true
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'DISTRIBUIDOR',
                'nombre' => 'Precio Distribuidor',
                'descripcion' => 'Precio especial para distribuidores autorizados',
                'color' => 'indigo',
                'es_ganancia' => true,
                'es_precio_base' => false,
                'orden' => 5,
                'activo' => true,
                'es_sistema' => true,
                'configuracion' => json_encode([
                    'icono' => '🏢',
                    'tooltip' => 'Precio para distribuidores',
                    'requiere_autorizacion' => true
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'PROMOCIONAL',
                'nombre' => 'Precio Promocional',
                'descripcion' => 'Precio especial para promociones y ofertas',
                'color' => 'red',
                'es_ganancia' => true,
                'es_precio_base' => false,
                'orden' => 6,
                'activo' => true,
                'es_sistema' => false,
                'configuracion' => json_encode([
                    'icono' => '🎉',
                    'tooltip' => 'Precio promocional',
                    'temporal' => true
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('tipos_precio')->insert($tiposPrecios);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('tipos_precio')->whereIn('codigo', [
            'COSTO', 'VENTA', 'POR_MAYOR', 'FACTURADO', 'DISTRIBUIDOR', 'PROMOCIONAL'
        ])->delete();
    }
};
