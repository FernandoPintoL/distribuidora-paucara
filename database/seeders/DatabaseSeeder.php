<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(MonedaSeeder::class);
        $this->call(EstadoDocumentoSeeder::class);
        // Seed core catalogs
        $this->call(CoreCatalogSeeder::class);
        // Seed roles and permissions and assign to admin
        $this->call(RolesAndPermissionsSeeder::class);
        // Create a default admin user if not exists
        $admin = User::query()->where('email', 'admin@paucara.test')->first();
        if (! $admin) {
            $admin = User::factory()->create([
                'name'     => 'Administrador',
                'usernick' => 'admin',
                'email'    => 'admin@paucara.test',
                'password' => Hash::make('password'),
            ]);
        } else {
            // Ensure usernick is set for legacy records
            if (empty($admin->usernick)) {
                $admin->forceFill(['usernick' => 'admin'])->save();
            }
        }
        // darle el rol de admin a $admin
        $admin->assignRole('Admin');

    }
}
