<?php
namespace Database\Seeders;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class ChoferTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Asegurar que el rol Chofer existe
        $choferRole = Role::firstOrCreate(['name' => 'Chofer']);

        // Crear usuario chofer de prueba
        $chofer = User::firstOrCreate(
            ['email' => 'chofer@paucara.test'],
            [
                'name'              => 'Chofer de Prueba',
                'usernick'          => 'chofer',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Asignar rol Chofer
        if (! $chofer->hasRole('Chofer')) {
            $chofer->assignRole('Chofer');
        }

        // Crear empleado asociado al usuario chofer
        $empleado = Empleado::firstOrCreate(
            ['codigo_empleado' => 'CHO001'],
            [
                'user_id'               => $chofer->id,
                'ci'                    => '8888888',
                // 'cargo' => 'Chofer',
                // 'departamento' => 'Logística',
                'fecha_ingreso'         => now()->format('Y-m-d'),
                // 'tipo_contrato'         => 'indefinido',
                'estado'                => 'activo',
                // 'salario_base' => 3500.00,
                // 'bonos' => 200.00,
                'puede_acceder_sistema' => true,
                // 'fecha_nacimiento' => '1990-05-15',
                'telefono'              => '70888888',
                'direccion'             => 'Av. Logística 100, Santa Cruz',
                // 'contacto_emergencia_nombre' => 'Familia Chofer',
                // 'contacto_emergencia_telefono' => '71888888',
            ]
        );

        $this->command->info('Usuario chofer de prueba creado exitosamente.');
        $this->command->info('Credenciales:');
        $this->command->info('Email: chofer@paucara.test');
        $this->command->info('Usuario: chofer');
        $this->command->info('Contraseña: password');
        $this->command->info('');
        $this->command->info('Permisos disponibles:');
        $this->command->info('- Ver envíos (envios.index, envios.show)');
        $this->command->info('- Acceder al dashboard de logística');
        $this->command->info('- Ver seguimiento de envíos');
        $this->command->info('- Ver su perfil de empleado');
    }
}
