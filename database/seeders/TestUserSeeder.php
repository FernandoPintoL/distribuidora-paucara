<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Usuario Prueba API',
            'usernick' => 'testuser',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'activo' => true,
        ])->assignRole('Vendedor');
    }
}
