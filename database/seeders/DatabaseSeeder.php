<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(CoreCatalogSeeder::class);
        $this->call(AlmacenesUbicacionSeeder::class);
        // Seed roles and permissions FIRST
        $this->call(RolesAndPermissionsSeeder::class);

        // NUEVO: Permisos específicos del Sidebar
        $this->call(SidebarPermissionsSeeder::class);

        // COMENTADO: Mapeo de Capacidades a Permisos reales
        // Nota: Este seeder crea roles duplicados (preventista, chofer, cajero, etc.)
        // Usamos solo RolesAndPermissionsSeeder para roles y el sistema de Capabilities para UI
        // $this->call(CapabilityToRolePermissionsSeeder::class);

        $this->call(CajaSeeder::class);
        // $this->call(ClienteTestSeeder::class);
        $this->call(ClientesConUsuariosSeeder::class);
        $this->call(CuentaContableSeeder::class);
        $this->call(EmpleadoRolesSeeder::class);
        // $this->call(EmpleadosTestSeeder::class);
        // $this->call(EmpleadosSinUsuarioSeeder::class);
        // $this->call(SupervisoresSeeder::class);
        $this->call(EstadoDocumentoSeeder::class);
        $this->call(EstadoMermaSeeder::class);
        $this->call(ImpuestoSeeder::class);
        $this->call(ModuloSidebarSeeder::class);
        $this->call(MonedaSeeder::class);
        // $this->call(ProformaAppExternaSeeder::class);
        $this->call(TipoAjustInventarioSeeder::class);
        $this->call(TipoDocumentoSeeder::class);
        $this->call(TipoMermaSeeder::class);
        $this->call(TipoOperacionCajaSeeder::class);
        $this->call(TiposPrecioSeeder::class);
        // $this->call(\Database\Seeders\VehiculoSeeder::class);
        // $this->call(ProductosEjemploSeeder::class);
        $this->call(CategoriaClienteSeeder::class);
        $this->call(LocalidadSeeder::class);
        // Create a default admin user if not exists
        $admin = User::query()->where('email', 'admin@paucara.test')->first();
        if (! $admin) {
            $admin = User::factory()->create([
                'name' => 'Administrador',
                'usernick' => 'admin',
                'email' => 'admin@paucara.test',
                'password' => Hash::make('password'),
            ]);
        } else {
            // Ensure usernick is set for legacy records
            if (empty($admin->usernick)) {
                $admin->forceFill(['usernick' => 'admin'])->save();
            }
        }
        // Darle el rol de Super Admin al usuario admin principal
        $admin->assignRole('Super Admin');

        // Asegurar que el rol Super Admin tenga todos los permisos
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        if ($superAdminRole) {
            // Sincronizar todos los permisos disponibles al rol Super Admin
            $superAdminRole->syncPermissions(Permission::all());
        }

        // Crear usuario chofer de prueba
        $this->call(ChoferTestSeeder::class);
    }
}
