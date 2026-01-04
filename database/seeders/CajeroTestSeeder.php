<?php

namespace Database\Seeders;

use App\Models\Caja;
use App\Models\Empleado;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CajeroTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('👨‍💼 Creando cajeros de prueba...');

        // Asegurar que el rol Cajero existe
        $cajeroRole = Role::firstOrCreate(['name' => 'Cajero']);

        // Array de cajeros para crear
        $cajeros = [
            [
                'user' => [
                    'email' => 'cajero1@paucara.test',
                    'name' => 'Juana García',
                    'usernick' => 'cajero1',
                ],
                'empleado' => [
                    'codigo_empleado' => 'CAJ001',
                    'ci' => '9999999',
                    'telefono' => '70999999',
                    'direccion' => 'Av. Cajas 500, Cochabamba',
                ],
            ],
            [
                'user' => [
                    'email' => 'cajero2@paucara.test',
                    'name' => 'Sandra López',
                    'usernick' => 'cajero2',
                ],
                'empleado' => [
                    'codigo_empleado' => 'CAJ002',
                    'ci' => '8888888',
                    'telefono' => '71888888',
                    'direccion' => 'Calle Comercio 888, Cochabamba',
                ],
            ],
        ];

        foreach ($cajeros as $cajeroData) {
            // Crear usuario
            $user = User::firstOrCreate(
                ['email' => $cajeroData['user']['email']],
                [
                    'name' => $cajeroData['user']['name'],
                    'usernick' => $cajeroData['user']['usernick'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'can_access_web' => true,
                ]
            );

            // Asignar rol Cajero
            if (!$user->hasRole('Cajero')) {
                $user->assignRole('Cajero');
            }

            // Crear empleado asociado
            $empleado = Empleado::firstOrCreate(
                ['codigo_empleado' => $cajeroData['empleado']['codigo_empleado']],
                [
                    'user_id' => $user->id,
                    'ci' => $cajeroData['empleado']['ci'],
                    'fecha_ingreso' => now()->subMonths(rand(6, 24))->format('Y-m-d'),
                    'estado' => 'activo',
                    'puede_acceder_sistema' => true,
                    'telefono' => $cajeroData['empleado']['telefono'],
                    'direccion' => $cajeroData['empleado']['direccion'],
                ]
            );

            // Crear caja asociada al cajero
            $caja = Caja::firstOrCreate(
                ['codigo' => 'CAJA-' . $cajeroData['empleado']['codigo_empleado']],
                [
                    'descripcion' => 'Caja de ' . $cajeroData['user']['name'],
                    'empleado_id' => $empleado->id,
                    'saldo_inicial' => 5000.00,
                    'saldo_actual' => 5000.00,
                    'estado' => 'cerrada',
                    'fecha_apertura' => null,
                    'fecha_cierre' => null,
                ]
            );

            $estado = $user->wasRecentlyCreated ? '✅ Creado' : '⚠️  Ya existe';
            $this->command->info("  {$estado}: {$cajeroData['user']['name']} ({$cajeroData['user']['email']})");
        }

        $totalCajeros = User::role('Cajero')->count();

        $this->command->info('');
        $this->command->info('📊 Resumen de cajeros:');
        $this->command->info("  Total cajeros: {$totalCajeros}");
        $this->command->info('');
        $this->command->info('🔑 Credenciales de acceso:');
        $this->command->info('  Email: cajero[1-2]@paucara.test');
        $this->command->info('  Contraseña: password');
        $this->command->info('');
        $this->command->info('✓ Permisos disponibles:');
        $this->command->info('  - Ver dashboard de vendedor/cajero');
        $this->command->info('  - Gestionar cajas');
        $this->command->info('  - Registrar ventas');
    }
}
