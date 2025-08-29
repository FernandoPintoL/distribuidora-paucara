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
        // Seed core catalogs
        $this->call(CoreCatalogSeeder::class);

        // Create a default admin user if not exists
        if (!User::query()->where('email', 'admin@paucara.test')->exists()) {
            User::factory()->create([
                'name' => 'Administrador',
                'email' => 'admin@paucara.test',
                'password' => Hash::make('password'),
            ]);
        }

        // Seed roles and permissions and assign to admin
        $this->call(RolesAndPermissionsSeeder::class);
    }
}
