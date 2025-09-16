<?php
namespace Database\Seeders;

use App\Models\Caja;
use Illuminate\Database\Seeder;

class CajaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cajas = [
            [
                'nombre'            => 'Caja Principal',
                'ubicacion'         => 'Mostrador Principal',
                'monto_inicial_dia' => 1000.00,
                'activa'            => true,
            ],
            /* [
                'nombre' => 'Caja Secundaria',
                'ubicacion' => 'Mostrador 2',
                'monto_inicial_dia' => 500.00,
                'activa' => true,
            ],
            [
                'nombre' => 'Caja Almacén',
                'ubicacion' => 'Área de Almacén',
                'monto_inicial_dia' => 200.00,
                'activa' => true,
            ], */
        ];

        foreach ($cajas as $caja) {
            Caja::updateOrCreate(
                ['nombre' => $caja['nombre']],
                $caja
            );
        }
    }
}
