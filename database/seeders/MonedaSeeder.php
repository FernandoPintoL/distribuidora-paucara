<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Moneda;

class MonedaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $monedas = [
            [
                'codigo' => 'BOB',
                'nombre' => 'Boliviano',
                'simbolo' => 'Bs',
                'decimales' => 2,
                'tasa_cambio' => 1.00,
                'es_moneda_base' => true,
                'activo' => true
            ],
            [
                'codigo' => 'USD',
                'nombre' => 'Dólar',
                'simbolo' => '$',
                'decimales' => 2,
                'tasa_cambio' => 6.97,
                'es_moneda_base' => false,
                'activo' => true
            ],
            [
                'nombre' => 'Real Brasileño',
                'codigo' => 'RS',
                'simbolo' => 'R$',
                'tasa_cambio' => 70.000000, // Ejemplo de tasa de cambio
                'es_moneda_base' => false,
                'activo' => true
            ]
            /*[
                'nombre' => 'Peso Argentino',
                'codigo' => 'ARS',
                'simbolo' => '$',
                'tasa_cambio' => 1.000000,
                'es_moneda_base' => true,
                'activo' => true
            ],
            [
                'nombre' => 'Dólar Estadounidense',
                'codigo' => 'USD',
                'simbolo' => 'US$',
                'tasa_cambio' => 350.000000, // Ejemplo de tasa de cambio
                'es_moneda_base' => false,
                'activo' => true
            ],
            [
                'nombre' => 'Euro',
                'codigo' => 'EUR',
                'simbolo' => '€',
                'tasa_cambio' => 380.000000, // Ejemplo de tasa de cambio
                'es_moneda_base' => false,
                'activo' => true
            ],*/

        ];

        foreach ($monedas as $moneda) {
            Moneda::create($moneda);
        }
    }
}
