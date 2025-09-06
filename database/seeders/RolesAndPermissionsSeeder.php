<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Define roles
        $roles = [
            'SUPERADMIN',
            'ADMINISTRADOR',
            'CLIENTE',
            'PROVEEDOR',
            'CHOFER',
            'CAJERO',
            'VENDEDOR',
        ];

        // Minimal permission set for now
        $permissions = [
            'categorias.view', 'categorias.create', 'categorias.update', 'categorias.delete',
            'marcas.view', 'marcas.create', 'marcas.update', 'marcas.delete',
            'almacenes.view', 'almacenes.create', 'almacenes.update', 'almacenes.delete',
            'proveedores.view', 'proveedores.create', 'proveedores.update', 'proveedores.delete',
            'productos.view', 'productos.create', 'productos.update', 'productos.delete',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Create roles
        $roleModels = [];
        foreach ($roles as $r) {
            $roleModels[$r] = Role::firstOrCreate(['name' => $r]);
        }

        // Grant all to SUPERADMIN
        $roleModels['SUPERADMIN']->givePermissionTo(Permission::all());
        // Grant all to ADMINISTRADOR for now (can be tailored later)
        $roleModels['ADMINISTRADOR']->givePermissionTo(Permission::all());

        // Grant typical permissions to VENDEDOR, CAJERO (view + some create/update)
        $roleModels['VENDEDOR']->givePermissionTo([
            'productos.view', 'productos.create', 'productos.update',
            'categorias.view', 'marcas.view',
            'proveedores.view',
        ]);
        $roleModels['CAJERO']->givePermissionTo([
            'productos.view', 'categorias.view', 'marcas.view', 'almacenes.view', 'proveedores.view',
        ]);

        // CHOFER minimal for now
        $roleModels['CHOFER']->givePermissionTo([]);
        $roleModels['CLIENTE']->givePermissionTo(['productos.view']);
        $roleModels['PROVEEDOR']->givePermissionTo([]);

        // Ensure default admin has SUPERADMIN
        $admin = User::query()->where('email', 'admin@paucara.test')->first();
        if ($admin) {
            $admin->assignRole('SUPERADMIN');
        }
    }
}
