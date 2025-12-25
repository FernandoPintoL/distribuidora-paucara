<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AssignReportesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the permission if it doesn't exist
        $permission = Permission::firstOrCreate(
            ['name' => 'reportes-carga.index'],
            ['guard_name' => 'web']
        );

        // Get Admin and Cajero roles (with correct case)
        $adminRole = Role::where('name', 'Admin')->first();
        $cajeroRole = Role::where('name', 'Cajero')->first();

        // Assign permission to Admin role
        if ($adminRole) {
            if (!$adminRole->hasPermissionTo($permission)) {
                $adminRole->givePermissionTo($permission);
                echo "✓ Permiso asignado a Admin\n";
            }
        }

        // Assign permission to Cajero role
        if ($cajeroRole) {
            if (!$cajeroRole->hasPermissionTo($permission)) {
                $cajeroRole->givePermissionTo($permission);
                echo "✓ Permiso asignado a Cajero\n";
            }
        }
    }
}
