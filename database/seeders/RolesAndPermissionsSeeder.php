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
            'compras.cuentas-por-pagar.index', 'compras.cuentas-por-pagar.show', 'compras.cuentas-por-pagar.actualizar-estado', 'compras.cuentas-por-pagar.export',
            'compras.pagos.index', 'compras.pagos.create', 'compras.pagos.store', 'compras.pagos.show', 'compras.pagos.destroy', 'compras.pagos.export',
            'compras.lotes-vencimientos.index', 'compras.lotes-vencimientos.export', 'compras.lotes-vencimientos.actualizar-estado', 'compras.lotes-vencimientos.actualizar-cantidad',
            'compras.reportes.index', 'compras.reportes.export', 'compras.reportes.export-pdf',

            // Ventas
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show', 'ventas.edit', 'ventas.update', 'ventas.destroy',
            'ventas.detalles.index', 'ventas.detalles.store', 'ventas.detalles.update', 'ventas.detalles.destroy',
            'ventas.verificar-stock', 'ventas.stock.bajo', 'ventas.stock.producto', 'ventas.stock.verificar', 'ventas.stock.resumen',

            // Proformas
            'proformas.index', 'proformas.show', 'proformas.aprobar', 'proformas.rechazar', 'proformas.convertir-venta',

            // Cajas
            'cajas.index', 'cajas.abrir', 'cajas.cerrar', 'cajas.estado', 'cajas.movimientos',

            // Envíos/Logística
            'envios.index', 'envios.create', 'envios.store', 'envios.show', 'envios.edit', 'envios.update', 'envios.destroy',
            'envios.programar', 'envios.cancelar', 'envios.confirmar-entrega', 'envios.confirmar-salida', 'envios.iniciar-preparacion',
            'envios.choferes-disponibles', 'envios.vehiculos-disponibles',
            'logistica.dashboard', 'logistica.envios.seguimiento',

            // Contabilidad
            'contabilidad.manage', 'contabilidad.asientos.index', 'contabilidad.asientos.show', 'contabilidad.reportes.libro-mayor', 'contabilidad.reportes.balance-comprobacion',

            // Inventario
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos',
            'inventario.ajuste.form', 'inventario.ajuste.procesar', 'inventario.api.buscar-productos', 'inventario.api.stock-producto',
            'inventario.reportes', 'inventario.mermas.index', 'inventario.mermas.registrar', 'inventario.mermas.store', 'inventario.mermas.show',
            'inventario.mermas.aprobar', 'inventario.mermas.rechazar',

            // Transferencias de inventario
            'inventario.transferencias.index', 'inventario.transferencias.crear', 'inventario.transferencias.ver', 'inventario.transferencias.edit',
            'inventario.transferencias.enviar', 'inventario.transferencias.recibir', 'inventario.transferencias.cancelar',

            // Vehículos (logística/inventario)
            'inventario.vehiculos.manage', 'inventario.vehiculos.index', 'inventario.vehiculos.create', 'inventario.vehiculos.store', 'inventario.vehiculos.ver', 'inventario.vehiculos.edit', 'inventario.vehiculos.update', 'inventario.vehiculos.destroy',

            // Reportes
            'reportes.precios.index', 'reportes.precios.export', 'reportes.ganancias.index', 'reportes.ganancias.export',
            'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion',
            'reportes.inventario.movimientos', 'reportes.inventario.export',

            // Gestión de usuarios, roles y permisos
            'usuarios.index', 'usuarios.create', 'usuarios.store', 'usuarios.show', 'usuarios.edit', 'usuarios.update', 'usuarios.destroy',
            'usuarios.assign-role', 'usuarios.remove-role', 'usuarios.assign-permission', 'usuarios.remove-permission',
            'roles.index', 'roles.create', 'roles.store', 'roles.show', 'roles.edit', 'roles.update', 'roles.destroy',
            'roles.assign-permission', 'roles.remove-permission',
            'permissions.index', 'permissions.create', 'permissions.store', 'permissions.show', 'permissions.edit', 'permissions.update', 'permissions.destroy',

            // Empleados
            'empleados.index', 'empleados.create', 'empleados.store', 'empleados.show', 'empleados.edit', 'empleados.update', 'empleados.destroy',
            'empleados.toggle-estado', 'empleados.toggle-acceso-sistema',

            // Configuración del sistema
            'modulos-sidebar.index', 'modulos-sidebar.create', 'modulos-sidebar.store', 'modulos-sidebar.show', 'modulos-sidebar.edit',
            'modulos-sidebar.update', 'modulos-sidebar.destroy', 'modulos-sidebar.actualizar-orden', 'modulos-sidebar.toggle-activo',
            'configuracion-global.index', 'configuracion-global.store', 'configuracion-global.show', 'configuracion-global.update',
            'configuracion-global.reset', 'configuracion-global.ganancias', 'configuracion-global.ganancias.update',

            // Maestros: categorias, marcas, almacenes, proveedores, clientes, productos, unidades, tipos-precio, tipos-pago, monedas
            'categorias.manage', 'marcas.manage', 'almacenes.manage', 'proveedores.manage', 'clientes.manage', 'productos.manage',
            'unidades.manage', 'tipos-precio.manage', 'tipos-pago.manage', 'monedas.manage',

            // Admin específicos
            'admin.config', 'admin.system',
        ];
        foreach ($permissions as $name) {
            Permission::findOrCreate($name);
        }

        // Create roles
        $admin        = Role::findOrCreate('Admin');
        $vendedor     = Role::findOrCreate('Vendedor');
        $compras      = Role::findOrCreate('Compras');
        $inventario   = Role::findOrCreate('Inventario');
        $reportes     = Role::findOrCreate('Reportes');
        $logistica    = Role::findOrCreate('Logística');
        $contabilidad = Role::findOrCreate('Contabilidad');
        $gerente      = Role::findOrCreate('Gerente');
        $cajero       = Role::findOrCreate('Cajero');
        $cliente      = Role::findOrCreate('Cliente');

        // Nuevos roles para tipos de empleados específicos
        $chofer        = Role::findOrCreate('Chofer');
        $gestorAlmacen = Role::findOrCreate('Gestor de Almacén');
        $comprador     = Role::findOrCreate('Comprador');
        $manager       = Role::findOrCreate('Manager');

        // Assign permissions to roles
        $admin->givePermissionTo(Permission::all());

        $vendedorPerms = [
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show', 'ventas.edit', 'ventas.update', 'ventas.destroy',
            'ventas.detalles.index', 'ventas.detalles.store', 'ventas.detalles.update', 'ventas.detalles.destroy',
            'ventas.verificar-stock', 'ventas.stock.bajo', 'ventas.stock.producto', 'ventas.stock.verificar', 'ventas.stock.resumen',
            'proformas.index', 'proformas.show', 'proformas.aprobar', 'proformas.rechazar', 'proformas.convertir-venta',
            'clientes.manage', 'productos.manage',
        ];
        $vendedor->syncPermissions($vendedorPerms);

        $comprasPerms = [
            'compras.index', 'compras.create', 'compras.store', 'compras.show', 'compras.edit', 'compras.update', 'compras.destroy',
            'compras.detalles.index', 'compras.detalles.store', 'compras.detalles.update', 'compras.detalles.destroy',
            'compras.cuentas-por-pagar.index', 'compras.cuentas-por-pagar.show', 'compras.cuentas-por-pagar.actualizar-estado', 'compras.cuentas-por-pagar.export',
            'compras.pagos.index', 'compras.pagos.create', 'compras.pagos.store', 'compras.pagos.show', 'compras.pagos.destroy', 'compras.pagos.export',
            'compras.lotes-vencimientos.index', 'compras.lotes-vencimientos.export', 'compras.lotes-vencimientos.actualizar-estado', 'compras.lotes-vencimientos.actualizar-cantidad',
            'compras.reportes.index', 'compras.reportes.export', 'compras.reportes.export-pdf',
            'proveedores.manage', 'productos.manage', 'monedas.manage',
        ];
        $compras->syncPermissions($comprasPerms);

        $inventarioPerms = [
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos',
            'inventario.ajuste.form', 'inventario.ajuste.procesar', 'inventario.api.buscar-productos', 'inventario.api.stock-producto',
            'inventario.reportes', 'inventario.mermas.index', 'inventario.mermas.registrar', 'inventario.mermas.store', 'inventario.mermas.show',
            'inventario.mermas.aprobar', 'inventario.mermas.rechazar',
            'inventario.transferencias.index', 'inventario.transferencias.crear', 'inventario.transferencias.ver', 'inventario.transferencias.edit',
            'inventario.transferencias.enviar', 'inventario.transferencias.recibir', 'inventario.transferencias.cancelar',
            'productos.manage', 'almacenes.manage',
        ];
        $inventario->syncPermissions($inventarioPerms);

        $reportesPerms = [
            'reportes.precios.index', 'reportes.precios.export', 'reportes.ganancias.index', 'reportes.ganancias.export',
            'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion',
            'reportes.inventario.movimientos', 'reportes.inventario.export',
        ];
        $reportes->syncPermissions($reportesPerms);

        $logisticaPerms = [
            'envios.index', 'envios.create', 'envios.store', 'envios.show', 'envios.edit', 'envios.update', 'envios.destroy',
            'envios.programar', 'envios.cancelar', 'envios.confirmar-entrega', 'envios.confirmar-salida', 'envios.iniciar-preparacion',
            'envios.choferes-disponibles', 'envios.vehiculos-disponibles',
            'logistica.dashboard', 'logistica.envios.seguimiento',
        ];
        $logistica->syncPermissions($logisticaPerms);

        $contabilidadPerms = [
            'contabilidad.manage', 'contabilidad.asientos.index', 'contabilidad.asientos.show',
            'contabilidad.reportes.libro-mayor', 'contabilidad.reportes.balance-comprobacion',
        ];
        $contabilidad->syncPermissions($contabilidadPerms);

        $gerentePerms = [
            // Acceso a reportes
            'reportes.precios.index', 'reportes.precios.export', 'reportes.ganancias.index', 'reportes.ganancias.export',
            'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion',
            'reportes.inventario.movimientos', 'reportes.inventario.export',
            // Supervisión de módulos principales
            'ventas.index', 'ventas.show', 'compras.index', 'compras.show', 'inventario.dashboard',
            'empleados.index', 'empleados.show',
            // Configuración limitada
            'configuracion-global.ganancias',
        ];
        $gerente->syncPermissions($gerentePerms);

        $cajeroPerms = [
            'cajas.index', 'cajas.abrir', 'cajas.cerrar', 'cajas.estado', 'cajas.movimientos',
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show',
            'clientes.manage',
        ];
        $cajero->syncPermissions($cajeroPerms);

        // Nuevos roles - Asignar permisos específicos
        $choferPerms = [
            'envios.index', 'envios.show',
            'logistica.dashboard', 'logistica.envios.seguimiento',
            'empleados.show',  // Para ver su propio perfil
            'clientes.manage', // Para registrar clientes durante entregas
        ];
        $chofer->syncPermissions($choferPerms);

        $clientePerms = [
                               // Permisos limitados para clientes
            'clientes.manage', // Gestionar su propio perfil
        ];
        $cliente->syncPermissions($clientePerms);

        $gestorAlmacenPerms = [
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos',
            'inventario.ajuste.form', 'inventario.ajuste.procesar',
            'inventario.transferencias.index', 'inventario.transferencias.crear', 'inventario.transferencias.ver',
            'inventario.transferencias.enviar', 'inventario.transferencias.recibir',
            'inventario.mermas.index', 'inventario.mermas.registrar', 'inventario.mermas.store', 'inventario.mermas.show',
            'almacenes.manage',
            'productos.manage', // Para gestionar productos en almacén
            'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.movimientos',
        ];
        $gestorAlmacen->syncPermissions($gestorAlmacenPerms);

        $compradorPerms = [
            'compras.index', 'compras.create', 'compras.store', 'compras.show', 'compras.edit', 'compras.update',
            'compras.detalles.index', 'compras.detalles.store', 'compras.detalles.update', 'compras.detalles.destroy',
            'compras.cuentas-por-pagar.index', 'compras.cuentas-por-pagar.show',
            'compras.pagos.index', 'compras.pagos.create', 'compras.pagos.store', 'compras.pagos.show',
            'compras.lotes-vencimientos.index', 'compras.lotes-vencimientos.actualizar-estado', 'compras.lotes-vencimientos.actualizar-cantidad',
            'proveedores.manage',
            'productos.manage', // Para gestionar productos que compra
            'reportes.precios.index', 'reportes.precios.export',
        ];
        $comprador->syncPermissions($compradorPerms);

        $managerPerms = [
            // Supervisión completa de operaciones
            'ventas.index', 'ventas.show', 'compras.index', 'compras.show',
            'inventario.dashboard', 'cajas.index', 'cajas.estado',
            'empleados.index', 'empleados.show',
            // Reportes gerenciales
            'reportes.precios.index', 'reportes.precios.export',
            'reportes.ganancias.index', 'reportes.ganancias.export',
            'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion',
            'reportes.inventario.movimientos', 'reportes.inventario.export',
            // Configuración limitada
            'configuracion-global.ganancias',
            // Gestión de usuarios básica (solo ver)
            'usuarios.index', 'usuarios.show',
        ];
        $manager->syncPermissions($managerPerms);
        $firstUser = User::query()->orderBy('id')->first();
        if ($firstUser !== null && ! $firstUser->hasRole('Admin')) {
            $firstUser->assignRole('Admin');
        }
    }
}
