<?php
namespace Database\Seeders;

use App\Models\Vehiculo;
use Illuminate\Database\Seeder;

class VehiculoSeeder extends Seeder
{
    public function run(): void
    {
        // Actualizar vehículos existentes con campos de logística
        $vehiculosExistentes = Vehiculo::whereNull('capacidad_volumen')->get();
        foreach ($vehiculosExistentes as $vehiculo) {
            $vehiculo->update([
                'capacidad_volumen' => $vehiculo->placa === 'ABC-123' ? 12.50 : 8.00,
                'observaciones'     => $vehiculo->observaciones ?? 'Vehículo de la flota',
            ]);
        }

        // Agregar nuevos vehículos si no existen
        $vehiculosNuevos = [
            [
                'placa'             => 'DEF-456',
                'marca'             => 'Hyundai',
                'modelo'            => 'H100',
                'anho'              => 2019,
                'capacidad_kg'      => 1200.00,
                'capacidad_volumen' => 10.00,
                'estado'            => Vehiculo::DISPONIBLE,
                'activo'            => true,
                'observaciones'     => 'Vehículo para entregas locales',
            ],
            [
                'placa'             => 'GHI-789',
                'marca'             => 'Nissan',
                'modelo'            => 'NP300',
                'anho'              => 2021,
                'capacidad_kg'      => 800.00,
                'capacidad_volumen' => 6.00,
                'estado'            => Vehiculo::DISPONIBLE,
                'activo'            => true,
                'observaciones'     => 'Camioneta para entregas rápidas',
            ],
            [
                'placa'             => 'JKL-012',
                'marca'             => 'Mitsubishi',
                'modelo'            => 'Canter',
                'anho'              => 2018,
                'capacidad_kg'      => 3000.00,
                'capacidad_volumen' => 20.00,
                'estado'            => Vehiculo::MANTENIMIENTO,
                'activo'            => true,
                'observaciones'     => 'Camión para entregas grandes - En mantenimiento',
            ],
        ];

        foreach ($vehiculosNuevos as $vehiculoData) {
            Vehiculo::firstOrCreate(
                ['placa' => $vehiculoData['placa']],
                $vehiculoData
            );
        }
    }
}
