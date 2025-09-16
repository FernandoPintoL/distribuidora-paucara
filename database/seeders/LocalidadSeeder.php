<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class LocalidadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $localidades = [
            ['nombre' => 'Puerto Suarez', 'codigo' => 'PS', 'activo' => true],
            ['nombre' => 'Puerto Quijarro', 'codigo' => 'PQ', 'activo' => true],
            ['nombre' => 'Santa Cruz', 'codigo' => 'SC', 'activo' => true],
            ['nombre' => 'La Paz', 'codigo' => 'LP', 'activo' => true],
            ['nombre' => 'Cochabamba', 'codigo' => 'CB', 'activo' => true],
        ];

        foreach ($localidades as $localidad) {
            \App\Models\Localidad::create($localidad);
        }
    }
}
