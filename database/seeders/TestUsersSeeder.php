<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Usuario con rol SUPERADMIN - debería ver todos los módulos
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@test.com'],
            [
                'name'              => 'Super Admin',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $superAdminRole = Role::firstOrCreate(['name' => 'SUPERADMIN']);
        $superAdmin->assignRole($superAdminRole);

        // Usuario con rol ADMINISTRADOR - debería ver módulos de administración
        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name'              => 'Administrador',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $adminRole = Role::firstOrCreate(['name' => 'ADMINISTRADOR']);
        $admin->assignRole($adminRole);

        // Usuario con rol VENDEDOR - debería ver módulos de ventas
        $vendedor = User::firstOrCreate(
            ['email' => 'vendedor@test.com'],
            [
                'name'              => 'Vendedor',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $vendedorRole = Role::firstOrCreate(['name' => 'VENDEDOR']);
        $vendedor->assignRole($vendedorRole);

        // Usuario con rol EMPLEADO - debería ver módulos limitados
        $empleado = User::firstOrCreate(
            ['email' => 'empleado@test.com'],
            [
                'name'              => 'Empleado Básico',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $empleadoRole = Role::firstOrCreate(['name' => 'Empleado']);
        $empleado->assignRole($empleadoRole);

        // Usuario con rol PREVENTISTA - para supervisión y prevención
        $preventista = User::firstOrCreate(
            ['email' => 'preventista@test.com'],
            [
                'name'              => 'Preventista',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $preventistaRole = Role::firstOrCreate(['name' => 'Preventista']);
        $preventista->assignRole($preventistaRole);

        $this->command->info('Usuarios de prueba creados exitosamente.');
        $this->command->info('Credenciales de prueba:');
        $this->command->info('Super Admin: superadmin@test.com / password');
        $this->command->info('Admin: admin@test.com / password');
        $this->command->info('Vendedor: vendedor@test.com / password');
        $this->command->info('Empleado: empleado@test.com / password');
        $this->command->info('Preventista: preventista@test.com / password');
    }
}
