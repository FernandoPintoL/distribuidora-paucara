<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TestPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Crear permisos si no existen
        $permissions = [
            // Productos
            'productos.manage',
            // Inventario
            'inventario.dashboard.index', 'inventario.stock-bajo.index', 'inventario.vencimientos.index',
            'inventario.movimientos.index', 'inventario.transferencias.index', 'inventario.mermas.index',
            'inventario.ajustes.index', 'reportes.inventario.stock-actual',
            // Ventas
            'ventas.index', 'ventas.create',
            // Compras
            'compras.index', 'compras.create', 'compras.cuentas-por-pagar.index',
            'compras.pagos.index', 'compras.lotes-vencimientos.index', 'compras.reportes.index',
            // Empleados - Permisos completos
            'empleados.index', 'empleados.create', 'empleados.editar', 'empleados.eliminar',
            'empleados.ver', 'empleados.gestionar_acceso_sistema',
            // Administración
            'usuarios.index', 'usuarios.create', 'usuarios.edit', 'usuarios.delete', 'usuarios.show',
            'roles.index', 'roles.create', 'roles.edit', 'roles.delete', 'roles.show',
            'permissions.index', 'permissions.create', 'permissions.edit', 'permissions.delete', 'permissions.show',
            'configuracion-global.index',
            // Reportes
            'reportes.precios.index', 'reportes.ganancias.index', 'reportes.inventario.stock-actual',
            'reportes.inventario.movimientos', 'reportes.inventario.rotacion', 'reportes.inventario.vencimientos',
            // Logística
            'envios.index', 'envios.create',
            // Proformas
            'proformas.index',
            // Módulos principales
            'cajas.index', 'almacenes.manage', 'proveedores.manage', 'clientes.manage',
            'localidades.manage', 'monedas.manage', 'tipos-pago.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Asignar permisos a roles

        // SUPERADMIN - Todos los permisos
        $superAdminRole = Role::where('name', 'SUPERADMIN')->first();
        if ($superAdminRole) {
            $superAdminRole->syncPermissions($permissions);
        }

        // ADMINISTRADOR - Módulos de administración y algunos operativos
        $adminPermissions = [
            'productos.manage', 'inventario.dashboard.index', 'ventas.index', 'compras.index',
            'empleados.index', 'empleados.create', 'empleados.editar', 'empleados.eliminar',
            'empleados.ver', 'empleados.gestionar_acceso_sistema',
            'usuarios.index', 'usuarios.create', 'usuarios.edit', 'usuarios.delete', 'usuarios.show',
            'roles.index', 'roles.create', 'roles.edit', 'roles.delete', 'roles.show',
            'permissions.index', 'permissions.create', 'permissions.edit', 'permissions.delete', 'permissions.show',
            'configuracion-global.index', 'reportes.precios.index', 'reportes.ganancias.index',
        ];
        $adminRole = Role::where('name', 'ADMINISTRADOR')->first();
        if ($adminRole) {
            $adminRole->syncPermissions($adminPermissions);
        }

        // VENDEDOR - Solo módulos de ventas y algunos de inventario
        $vendedorPermissions = [
            'productos.manage', 'inventario.dashboard.index', 'inventario.stock-bajo.index',
            'ventas.index', 'ventas.create', 'reportes.precios.index', 'proformas.index',
        ];
        $vendedorRole = Role::where('name', 'VENDEDOR')->first();
        if ($vendedorRole) {
            $vendedorRole->syncPermissions($vendedorPermissions);
        }

        // EMPLEADO - Permisos muy limitados
        $empleadoPermissions = [
            'productos.manage', 'inventario.dashboard.index',
        ];
        $empleadoRole = Role::where('name', 'Empleado')->first();
        if ($empleadoRole) {
            $empleadoRole->syncPermissions($empleadoPermissions);
        }

        $this->command->info('Permisos asignados a roles de prueba exitosamente.');
    }
}
