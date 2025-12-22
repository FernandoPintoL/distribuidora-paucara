<?php
namespace Database\Seeders;

use App\Models\Vehiculo;
use App\Models\Empleado;
use Illuminate\Database\Seeder;

class VehiculoSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚚 Creando vehículos de prueba...');

        // Obtener choferes disponibles para asignar
        $choferes = Empleado::whereHas('user.roles', function ($query) {
            $query->where('name', 'Chofer');
        })->get();

        // Actualizar vehículos existentes con campos de logística
        $vehiculosExistentes = Vehiculo::whereNull('capacidad_volumen')->get();
        foreach ($vehiculosExistentes as $vehiculo) {
            $vehiculo->update([
                'capacidad_volumen' => $vehiculo->placa === 'ABC-123' ? 12.50 : 8.00,
                'observaciones'     => $vehiculo->observaciones ?? 'Vehículo de la flota',
            ]);
        }

        // Vehículos completos de prueba
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
                'observaciones'     => 'Vehículo para entregas locales - Zona Norte',
                'chofer_asignado_id' => $choferes->get(0)->id ?? null,
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
                'observaciones'     => 'Camioneta para entregas rápidas - Zona Sur',
                'chofer_asignado_id' => $choferes->get(1)->id ?? null,
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
                'chofer_asignado_id' => null,
            ],
            [
                'placa'             => 'MNO-345',
                'marca'             => 'Toyota',
                'modelo'            => 'Hilux',
                'anho'              => 2020,
                'capacidad_kg'      => 1000.00,
                'capacidad_volumen' => 8.00,
                'estado'            => Vehiculo::DISPONIBLE,
                'activo'            => true,
                'observaciones'     => 'Camioneta 4x4 para zonas rurales',
                'chofer_asignado_id' => $choferes->get(2)->id ?? null,
            ],
            [
                'placa'             => 'PQR-678',
                'marca'             => 'Isuzu',
                'modelo'            => 'ELF',
                'anho'              => 2017,
                'capacidad_kg'      => 2500.00,
                'capacidad_volumen' => 18.00,
                'estado'            => Vehiculo::DISPONIBLE,
                'activo'            => true,
                'observaciones'     => 'Camión mediano para distribución regional',
                'chofer_asignado_id' => $choferes->get(3)->id ?? null,
            ],
            [
                'placa'             => 'STU-901',
                'marca'             => 'Chevrolet',
                'modelo'            => 'N300',
                'anho'              => 2022,
                'capacidad_kg'      => 650.00,
                'capacidad_volumen' => 5.00,
                'estado'            => Vehiculo::DISPONIBLE,
                'activo'            => true,
                'observaciones'     => 'Furgoneta pequeña para entregas urbanas rápidas',
                'chofer_asignado_id' => $choferes->get(4)->id ?? null,
            ],
        ];

        foreach ($vehiculosNuevos as $vehiculoData) {
            $vehiculo = Vehiculo::firstOrCreate(
                ['placa' => $vehiculoData['placa']],
                $vehiculoData
            );

            $estado = $vehiculo->wasRecentlyCreated ? '✅ Creado' : '⚠️  Ya existe';
            $this->command->info("  {$estado}: {$vehiculoData['placa']} - {$vehiculoData['marca']} {$vehiculoData['modelo']}");
        }

        $totalVehiculos = Vehiculo::count();
        $disponibles = Vehiculo::where('estado', Vehiculo::DISPONIBLE)->count();
        $enMantenimiento = Vehiculo::where('estado', Vehiculo::MANTENIMIENTO)->count();

        $this->command->info('');
        $this->command->info("📊 Resumen de vehículos:");
        $this->command->info("  Total: {$totalVehiculos}");
        $this->command->info("  Disponibles: {$disponibles}");
        $this->command->info("  En mantenimiento: {$enMantenimiento}");
        $this->command->info("  Con chofer asignado: " . Vehiculo::whereNotNull('chofer_asignado_id')->count());
    }
}
