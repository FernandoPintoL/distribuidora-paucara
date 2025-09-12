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
        // Reset cached roles and permissions
        app()['cache.store']->forget('spatie.permission.cache');

        // Define permissions grouped by domain
        $permissions = [
            // Compras
            'compras.index', 'compras.create', 'compras.store', 'compras.show', 'compras.edit', 'compras.update', 'compras.destroy',
            'compras.detalles.index', 'compras.detalles.store', 'compras.detalles.update', 'compras.detalles.destroy',

            // Ventas
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show', 'ventas.edit', 'ventas.update', 'ventas.destroy',
            'ventas.detalles.index', 'ventas.detalles.store', 'ventas.detalles.update', 'ventas.detalles.destroy',
            'ventas.verificar-stock',

            // Contabilidad
            'contabilidad.manage', 'contabilidad.asientos.index', 'contabilidad.asientos.show', 'contabilidad.reportes.libro-mayor', 'contabilidad.reportes.balance-comprobacion',

            // Inventario
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos', 'inventario.ajuste.form', 'inventario.ajuste.procesar', 'inventario.api.buscar-productos', 'inventario.api.stock-producto',

            // Reportes
            'reportes.precios.index', 'reportes.precios.export', 'reportes.ganancias.index', 'reportes.ganancias.export', 'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion', 'reportes.inventario.movimientos', 'reportes.inventario.export',

            // Maestros (ejemplos): categorias, marcas, almacenes, proveedores, clientes, productos, unidades, tipos-precio, tipos-pago, monedas
            'categorias.manage', 'marcas.manage', 'almacenes.manage', 'proveedores.manage', 'clientes.manage', 'productos.manage', 'unidades.manage', 'tipos-precio.manage', 'tipos-pago.manage', 'monedas.manage',
        ];

        foreach ($permissions as $name) {
            Permission::findOrCreate($name);
        }

        // Create roles
        $admin = Role::findOrCreate('Admin');
        $vendedor = Role::findOrCreate('Vendedor');
        $compras = Role::findOrCreate('Compras');
        $inventario = Role::findOrCreate('Inventario');
        $reportes = Role::findOrCreate('Reportes');

        // Assign permissions to roles
        $admin->givePermissionTo(Permission::all());

        $vendedorPerms = [
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show', 'ventas.edit', 'ventas.update', 'ventas.destroy',
            'ventas.detalles.index', 'ventas.detalles.store', 'ventas.detalles.update', 'ventas.detalles.destroy',
            'ventas.verificar-stock',
            'clientes.manage',
            'productos.manage', // opcional, si vendedores pueden ver productos
        ];
        $vendedor->syncPermissions($vendedorPerms);

        $comprasPerms = [
            'compras.index', 'compras.create', 'compras.store', 'compras.show', 'compras.edit', 'compras.update', 'compras.destroy',
            'compras.detalles.index', 'compras.detalles.store', 'compras.detalles.update', 'compras.detalles.destroy',
            'proveedores.manage', 'productos.manage', 'monedas.manage',
        ];
        $compras->syncPermissions($comprasPerms);

        $inventarioPerms = [
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos', 'inventario.ajuste.form', 'inventario.ajuste.procesar', 'inventario.api.buscar-productos', 'inventario.api.stock-producto',
            'productos.manage', 'almacenes.manage',
        ];
        $inventario->syncPermissions($inventarioPerms);

        $reportesPerms = [
            'reportes.precios.index', 'reportes.precios.export', 'reportes.ganancias.index', 'reportes.ganancias.export', 'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion', 'reportes.inventario.movimientos', 'reportes.inventario.export',
        ];
        $reportes->syncPermissions($reportesPerms);

        // Optionally assign Admin role to the first user
        $firstUser = User::query()->orderBy('id')->first();
        if ($firstUser !== null && ! $firstUser->hasRole('Admin')) {
            $firstUser->assignRole('Admin');
        }
    }
}
