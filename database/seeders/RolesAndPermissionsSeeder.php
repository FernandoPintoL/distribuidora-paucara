<?php
namespace Database\Seeders;

use App\Models\Capability;
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

        // ============================================
        // FASE 1: DEFINIR CAPACIDADES Y SUS PERMISOS
        // ============================================
        $capabilities = $this->defineCapabilities();

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

            // proformas
            'proformas.index', 'proformas.create', 'proformas.store', 'proformas.show', 'proformas.edit', 'proformas.update',
            'proformas.aprobar', 'proformas.rechazar', 'proformas.convertir-venta',

            // Cajas
            'cajas.index', 'cajas.create', 'cajas.store', 'cajas.show', 'cajas.edit', 'cajas.update',
            'cajas.abrir', 'cajas.cerrar', 'cajas.transacciones',

            // Envíos/Logística
            'envios.index', 'envios.create', 'envios.store', 'envios.show', 'envios.edit', 'envios.update', 'envios.destroy',
            'envios.programar', 'envios.cancelar', 'envios.confirmar-entrega', 'envios.confirmar-salida', 'envios.iniciar-preparacion',
            'envios.choferes-disponibles', 'envios.vehiculos-disponibles',
            'logistica.dashboard', 'logistica.envios.seguimiento',

            // Entregas (Flujo de carga)
            'entregas.index', 'entregas.create', 'entregas.store', 'entregas.show', 'entregas.view', 'entregas.edit', 'entregas.update', 'entregas.delete', 'entregas.destroy',
            'entregas.confirmar-carga', 'entregas.listo-para-entrega', 'entregas.iniciar-transito', 'entregas.actualizar-ubicacion',

            // Reportes de Carga
            'reportes-carga.crear', 'reportes-carga.show', 'reportes-carga.view', 'reportes-carga.actualizar-detalle', 'reportes-carga.verificar-detalle',
            'reportes-carga.confirmar', 'reportes-carga.listo-para-entrega', 'reportes-carga.cancelar', 'reportes-carga.delete',

            // Contabilidad
            'contabilidad.manage', 'contabilidad.asientos.index', 'contabilidad.asientos.show', 'contabilidad.reportes.libro-mayor', 'contabilidad.reportes.balance-comprobacion',

            // Inventario
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos',
            'inventario.ajuste.form', 'inventario.ajuste.procesar', 'inventario.api.buscar-productos', 'inventario.api.stock-producto',
            'inventario.reportes', 'inventario.mermas.index', 'inventario.mermas.registrar', 'inventario.mermas.store', 'inventario.mermas.show',
            'inventario.mermas.aprobar', 'inventario.mermas.rechazar',
            'inventario.tipos-ajuste.manage', 'inventario.tipos-ajuste.index', 'inventario.tipos-ajuste.create', 'inventario.tipos-ajuste.store', 'inventario.tipos-ajuste.edit', 'inventario.tipos-ajuste.update', 'inventario.tipos-ajuste.destroy',

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

            // Clientes - Tablas relacionales y específicas
            'clientes.direcciones.index', 'clientes.direcciones.create', 'clientes.direcciones.store',
            'clientes.direcciones.edit', 'clientes.direcciones.update', 'clientes.direcciones.destroy',
            'clientes.ventanas-entrega.index', 'clientes.ventanas-entrega.create', 'clientes.ventanas-entrega.store',
            'clientes.ventanas-entrega.edit', 'clientes.ventanas-entrega.update', 'clientes.ventanas-entrega.destroy',
            'clientes.fotos.index', 'clientes.fotos.store', 'clientes.fotos.destroy',
            'clientes.cuentas-por-cobrar.index', 'clientes.cuentas-por-cobrar.view',

            // Configuración del sistema
            'modulos-sidebar.index', 'modulos-sidebar.create', 'modulos-sidebar.store', 'modulos-sidebar.show', 'modulos-sidebar.edit',
            'modulos-sidebar.update', 'modulos-sidebar.destroy', 'modulos-sidebar.actualizar-orden', 'modulos-sidebar.toggle-activo',
            'configuracion-global.index', 'configuracion-global.store', 'configuracion-global.show', 'configuracion-global.update',
            'configuracion-global.reset', 'configuracion-global.ganancias', 'configuracion-global.ganancias.update',

            // Maestros: categorias, marcas, almacenes, proveedores, clientes, productos, unidades, tipos-precio, tipos-pago, monedas, localidades, tipos-documento
            'categorias.manage', 'marcas.manage', 'almacenes.manage', 'proveedores.manage', 'clientes.manage', 'productos.manage',
            'unidades.manage', 'tipos-precio.manage', 'tipos-pago.manage', 'tipos_documento.manage', 'monedas.manage', 'localidades.manage',

            // Admin específicos
            'admin.config', 'admin.system', 'admin.image-backup.manage',
        ];

        // Crear permisos y asignarles capacidades
        foreach ($permissions as $name) {
            Permission::findOrCreate($name);
        }

        // Asignar capacidades a los permisos
        $this->assignCapabilitiesToPermissions($capabilities);

        // Create roles - Jerarquía clara
        // Nivel 1: Super Admin (acceso total + gestión de admins)
        $superAdmin = Role::findOrCreate('Super Admin');

        // Nivel 2: Admin/Manager (casi todo, excepto crear Super Admins)
        $admin   = Role::findOrCreate('Admin');
        $manager = Role::findOrCreate('Manager');

        // Nivel 3: Roles departamentales/funcionales
        $gerente        = Role::findOrCreate('Gerente');
        $vendedor       = Role::findOrCreate('Vendedor');
        $compras        = Role::findOrCreate('Compras');
        $comprador      = Role::findOrCreate('Comprador');
        $inventario     = Role::findOrCreate('Gestor de Inventario'); // REFACTORIZADO: Nuevo patrón "Gestor de X"
        $gestorAlmacen  = Role::findOrCreate('Gestor de Almacén');
        $logistica      = Role::findOrCreate('Gestor de Logística'); // REFACTORIZADO: Nuevo patrón "Gestor de X"
        $chofer         = Role::findOrCreate('Chofer');
        $cajero         = Role::findOrCreate('Cajero');
        $contabilidad   = Role::findOrCreate('Contabilidad');
        $reportes       = Role::findOrCreate('Reportes');
        $gestorClientes = Role::findOrCreate('Gestor de Clientes'); // NUEVO: Para empleados que gestionen clientes
        $preventista    = Role::findOrCreate('Preventista');        // NUEVO: Para empleados de prevención

        // Nivel 4: Roles de acceso limitado
        $empleado = Role::findOrCreate('Empleado');
        $cliente  = Role::findOrCreate('Cliente');

        // ============================================
        // NIVEL 1: Super Admin - Acceso Total
        // ============================================
        $superAdmin->givePermissionTo(Permission::all());

        // ============================================
        // NIVEL 2: Admin - Casi todos los permisos
        // (NO puede gestionar Super Admins)
        // ============================================
        $adminPerms = Permission::all()->reject(function ($permission) {
            // Excluir permisos críticos del sistema que solo Super Admin debe tener
            return in_array($permission->name, [
                'admin.system', // Configuraciones críticas del sistema
            ]);
        });
        $admin->syncPermissions($adminPerms);

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
            'inventario.tipos-ajuste.manage', 'inventario.tipos-ajuste.index', 'inventario.tipos-ajuste.create', 'inventario.tipos-ajuste.store', 'inventario.tipos-ajuste.edit', 'inventario.tipos-ajuste.update', 'inventario.tipos-ajuste.destroy',
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
            // Entregas - Nuevo flujo de carga
            'entregas.index', 'entregas.create', 'entregas.store', 'entregas.show', 'entregas.view', 'entregas.edit', 'entregas.update',
            'entregas.confirmar-carga', 'entregas.listo-para-entrega', 'entregas.iniciar-transito', 'entregas.actualizar-ubicacion',
            // Reportes de Carga
            'reportes-carga.crear', 'reportes-carga.show', 'reportes-carga.view', 'reportes-carga.actualizar-detalle', 'reportes-carga.verificar-detalle',
            'reportes-carga.confirmar', 'reportes-carga.listo-para-entrega',
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
            // === GESTIÓN DE CAJAS ===
            'cajas.index', 'cajas.show', 'cajas.abrir', 'cajas.cerrar', 'cajas.transacciones',
            'cajas.create', 'cajas.store',

            // === GESTIÓN DE VENTAS ===
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show',
            'ventas.edit', 'ventas.update',

            // === GESTIÓN COMPLETA DE PROFORMAS ===
            'proformas.index', 'proformas.create', 'proformas.store', 'proformas.show',
            'proformas.edit', 'proformas.update', 'proformas.aprobar', 'proformas.rechazar',
            'proformas.convertir-venta',

            // === GESTIÓN DE CLIENTES ===
            'clientes.manage',

            // === GESTIÓN COMPLETA DE LOGÍSTICA (SISTEMA ANTIGUO) ===
            'envios.index', 'envios.create', 'envios.store', 'envios.show', 'envios.edit', 'envios.update', 'envios.destroy',
            'envios.programar', 'envios.cancelar', 'envios.confirmar-entrega', 'envios.confirmar-salida', 'envios.iniciar-preparacion',
            'envios.choferes-disponibles', 'envios.vehiculos-disponibles',
            'logistica.dashboard', 'logistica.envios.seguimiento',

            // === NUEVO FLUJO DE ENTREGAS Y REPORTES DE CARGA ===
            'entregas.index', 'entregas.create', 'entregas.store', 'entregas.show', 'entregas.view', 'entregas.edit', 'entregas.update',
            'entregas.asignar', // Permite asignar choferes y vehículos
            'entregas.confirmar-carga', 'entregas.listo-para-entrega', 'entregas.iniciar-transito', 'entregas.actualizar-ubicacion',
            'reportes-carga.crear', 'reportes-carga.show', 'reportes-carga.view', 'reportes-carga.actualizar-detalle', 'reportes-carga.verificar-detalle',
            'reportes-carga.confirmar', 'reportes-carga.listo-para-entrega',
        ];
        $cajero->syncPermissions($cajeroPerms);

        // ============================================
        // NUEVO ROL: Gestor de Clientes
        // Empleados que crean y modifican clientes
        // (NO es un rol para usuarios-cliente)
        // ============================================
        $gestorClientesPerms = [
            'clientes.manage',             // Puede crear, editar, ver clientes
            'productos.manage',            // Puede ver productos para vender
            'ventas.index', 'ventas.show', // Puede ver ventas a sus clientes
        ];
        $gestorClientes->syncPermissions($gestorClientesPerms);

        // Nuevos roles - Asignar permisos específicos
        $choferPerms = [
            // === LOGÍSTICA Y ENVÍOS (VIEW) ===
            'envios.index', 'envios.show',
            'logistica.dashboard', 'logistica.envios.seguimiento',

            // === OPERACIONES DE ENTREGA ===
            'envios.confirmar-entrega', 'envios.confirmar-salida', 'envios.iniciar-preparacion',

            // === NUEVAS ENTREGAS - FLUJO DE CARGA ===
            'entregas.index', 'entregas.show', 'entregas.view', 'entregas.edit',
            'entregas.update', // FASE 2: Permite confirmar ventas cargadas
            'entregas.confirmar-carga', // Marcar entrega en carga
            'entregas.listo-para-entrega', // Transición a listo para entrega
            'entregas.iniciar-transito', // Iniciar tránsito
            'entregas.actualizar-ubicacion', // Actualizar GPS

            // === REPORTES DE CARGA (READ & UPDATE) ===
            'reportes-carga.show', 'reportes-carga.view', 'reportes-carga.actualizar-detalle', 'reportes-carga.verificar-detalle',
            'reportes-carga.confirmar', // Permitir confirmar reportes de carga

            // === GESTIÓN DE CAJA PROPIA ===
            'cajas.index', 'cajas.show', 'cajas.abrir', 'cajas.cerrar', 'cajas.transacciones',

            // === REGISTRO DE PAGOS ===
            'ventas.index', 'ventas.show',

            // === ACCESO A CLIENTES ===
            'clientes.manage',

            // === PERFIL PROPIO ===
            'empleados.show',
            // NOTA: Si necesita crear clientes, asignarle el rol "Gestor de Clientes" además
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
            'inventario.tipos-ajuste.index', 'inventario.tipos-ajuste.manage',
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

        // ============================================
        // NIVEL 2: Manager - Gestión operativa completa
        // (Similar a Admin pero más enfocado en operaciones)
        // ============================================
        $managerPerms = [
            // === GESTIÓN COMPLETA DE OPERACIONES ===
            // Ventas
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show', 'ventas.edit', 'ventas.update', 'ventas.destroy',
            'ventas.detalles.index', 'ventas.detalles.store', 'ventas.detalles.update', 'ventas.detalles.destroy',
            'ventas.verificar-stock', 'ventas.stock.bajo', 'ventas.stock.producto', 'ventas.stock.verificar', 'ventas.stock.resumen',
            'proformas.index', 'proformas.show', 'proformas.aprobar', 'proformas.rechazar', 'proformas.convertir-venta',

            // Compras
            'compras.index', 'compras.create', 'compras.store', 'compras.show', 'compras.edit', 'compras.update', 'compras.destroy',
            'compras.detalles.index', 'compras.detalles.store', 'compras.detalles.update', 'compras.detalles.destroy',
            'compras.cuentas-por-pagar.index', 'compras.cuentas-por-pagar.show', 'compras.cuentas-por-pagar.actualizar-estado', 'compras.cuentas-por-pagar.export',
            'compras.pagos.index', 'compras.pagos.create', 'compras.pagos.store', 'compras.pagos.show', 'compras.pagos.destroy', 'compras.pagos.export',
            'compras.lotes-vencimientos.index', 'compras.lotes-vencimientos.export', 'compras.lotes-vencimientos.actualizar-estado', 'compras.lotes-vencimientos.actualizar-cantidad',
            'compras.reportes.index', 'compras.reportes.export', 'compras.reportes.export-pdf',

            // Inventario
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos',
            'inventario.ajuste.form', 'inventario.ajuste.procesar', 'inventario.api.buscar-productos', 'inventario.api.stock-producto',
            'inventario.reportes', 'inventario.mermas.index', 'inventario.mermas.registrar', 'inventario.mermas.store', 'inventario.mermas.show',
            'inventario.mermas.aprobar', 'inventario.mermas.rechazar',
            'inventario.transferencias.index', 'inventario.transferencias.crear', 'inventario.transferencias.ver', 'inventario.transferencias.edit',
            'inventario.transferencias.enviar', 'inventario.transferencias.recibir', 'inventario.transferencias.cancelar',
            'inventario.tipos-ajuste.manage', 'inventario.tipos-ajuste.index', 'inventario.tipos-ajuste.create', 'inventario.tipos-ajuste.store', 'inventario.tipos-ajuste.edit', 'inventario.tipos-ajuste.update', 'inventario.tipos-ajuste.destroy',
            'inventario.vehiculos.manage', 'inventario.vehiculos.index', 'inventario.vehiculos.create', 'inventario.vehiculos.store',
            'inventario.vehiculos.ver', 'inventario.vehiculos.edit', 'inventario.vehiculos.update', 'inventario.vehiculos.destroy',

            // Logística y Envíos
            'envios.index', 'envios.create', 'envios.store', 'envios.show', 'envios.edit', 'envios.update', 'envios.destroy',
            'envios.programar', 'envios.cancelar', 'envios.confirmar-entrega', 'envios.confirmar-salida', 'envios.iniciar-preparacion',
            'envios.choferes-disponibles', 'envios.vehiculos-disponibles',
            'logistica.dashboard', 'logistica.envios.seguimiento',

            // Cajas
            'cajas.index', 'cajas.show', 'cajas.create', 'cajas.store', 'cajas.edit', 'cajas.update',
            'cajas.abrir', 'cajas.cerrar', 'cajas.transacciones',

            // Contabilidad
            'contabilidad.manage', 'contabilidad.asientos.index', 'contabilidad.asientos.show',
            'contabilidad.reportes.libro-mayor', 'contabilidad.reportes.balance-comprobacion',

            // === REPORTES COMPLETOS ===
            'reportes.precios.index', 'reportes.precios.export',
            'reportes.ganancias.index', 'reportes.ganancias.export',
            'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion',
            'reportes.inventario.movimientos', 'reportes.inventario.export',

            // === GESTIÓN DE PERSONAL ===
            'empleados.index', 'empleados.create', 'empleados.store', 'empleados.show', 'empleados.edit', 'empleados.update',
            'empleados.toggle-estado', 'empleados.toggle-acceso-sistema',

            // === GESTIÓN DE USUARIOS (limitada) ===
            'usuarios.index', 'usuarios.create', 'usuarios.store', 'usuarios.show', 'usuarios.edit', 'usuarios.update',
            'usuarios.assign-role', 'usuarios.remove-role',
            // NO puede: destroy usuarios ni gestionar Super Admins

            // === MAESTROS ===
            'categorias.manage', 'marcas.manage', 'almacenes.manage', 'proveedores.manage', 'clientes.manage',
            'productos.manage', 'unidades.manage', 'tipos-precio.manage', 'tipos-pago.manage', 'monedas.manage',

            // === CONFIGURACIÓN (limitada) ===
            'configuracion-global.index', 'configuracion-global.show', 'configuracion-global.store', 'configuracion-global.update',
            'configuracion-global.ganancias', 'configuracion-global.ganancias.update',
            'modulos-sidebar.index', 'modulos-sidebar.show',
            'admin.config', // Puede acceder a configuraciones generales
                            // NO puede: admin.system (configuraciones críticas)
        ];
        $manager->syncPermissions($managerPerms);

        // ============================================
        // NIVEL 3: Empleado Base - Acceso mínimo
        // ============================================
        $empleadoPerms = [
            'empleados.show', // Solo puede ver su propio perfil
        ];
        $empleado->syncPermissions($empleadoPerms);

        // ============================================
        // NUEVO ROL: Preventista
        // Empleados de prevención y seguridad con gestión completa de clientes
        // ============================================
        $preventistaPerms = [
                               // === GESTIÓN COMPLETA DE CLIENTES ===
                               // Clientes (CRUD completo)
            'clientes.manage', // Permiso base que cubre index, create, store, edit, update
                               // ⚠️ NOTA: NO incluimos usuarios.* porque Preventista NO debe acceder a Administración

            // === TABLAS RELACIONALES DE CLIENTES ===
            // Direcciones (CRUD completo)
            'clientes.direcciones.index', 'clientes.direcciones.create', 'clientes.direcciones.store',
            'clientes.direcciones.edit', 'clientes.direcciones.update', 'clientes.direcciones.destroy',

            // Categorías de clientes
            'categorias.manage',

            // Ventanas de entrega (horarios)
            'clientes.ventanas-entrega.index', 'clientes.ventanas-entrega.create', 'clientes.ventanas-entrega.store',
            'clientes.ventanas-entrega.edit', 'clientes.ventanas-entrega.update', 'clientes.ventanas-entrega.destroy',

            // Fotos/documentos del cliente
            'clientes.fotos.index', 'clientes.fotos.store', 'clientes.fotos.destroy',

            // Cuentas por cobrar del cliente
            'clientes.cuentas-por-cobrar.index', 'clientes.cuentas-por-cobrar.view',

            // === ACCESO A ENVÍOS Y LOGÍSTICA PARA SUPERVISAR ===
            'envios.index', 'envios.show',
            'logistica.dashboard', 'logistica.envios.seguimiento',

            // === GESTIÓN COMPLETA DE VENTAS ===
            'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show', 'ventas.edit', 'ventas.update', 'ventas.destroy',

            // === GESTIÓN COMPLETA DE PROFORMAS ===
            'proformas.index', 'proformas.create', 'proformas.store', 'proformas.show', 'proformas.edit', 'proformas.update',
            'proformas.aprobar', 'proformas.rechazar', 'proformas.convertir-venta',

            // === GESTIÓN DE CAJAS ===
            'cajas.index', 'cajas.create', 'cajas.store', 'cajas.show', 'cajas.edit', 'cajas.update',
            'cajas.abrir', 'cajas.cerrar', 'cajas.transacciones',

            // === ACCESO A REPORTES ===
            'reportes.inventario.stock-actual', 'reportes.inventario.movimientos',
            'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer',

            // === ACCESO A INFORMACIÓN DE EMPLEADOS (SUPERVISIÓN) ===
            'empleados.index', 'empleados.show',

            // === ACCESO A PRODUCTOS Y MAESTROS ===
            'productos.manage',
            'localidades.manage', // Para asignar localidades a clientes
        ];
        $preventista->syncPermissions($preventistaPerms);

        // Asignar Super Admin al primer usuario
        $firstUser = User::query()->orderBy('id')->first();
        if ($firstUser !== null && ! $firstUser->hasRole('Super Admin')) {
            $firstUser->assignRole('Super Admin');
        }

        // Crear usuario Cajero para testing/uso por defecto
        if (! User::where('email', 'cajero@distribuidora.com')->exists()) {
            $cajeroUser = User::create([
                'name'     => 'Cajero Principal',
                'email'    => 'cajero@distribuidora.com',
                'usernick' => 'cajero',
                'password' => bcrypt('password'),
                'activo'   => true,
            ]);
            $cajeroUser->assignRole('Cajero');
        }
    }

    /**
     * ============================================
     * FASE 1: DEFINIR CAPACIDADES
     * Organiza permisos por CAPACIDADES (funcionalidades)
     * ============================================
     *
     * Las capacidades agrupan permisos relacionados
     * Ejemplo: Capacidad "Ventas" contiene todos los permisos de ventas
     */
    private function defineCapabilities(): array
    {
        $capabilities = [
            // Capacidad: Gestión de Ventas
            'ventas'         => [
                'name'        => 'ventas',
                'label'       => 'Vender (Crear proformas y ventas)',
                'description' => 'Capacidad para crear, editar y gestionar ventas y proformas',
                'icon'        => '💰',
                'permissions' => [
                    'ventas.index', 'ventas.create', 'ventas.store', 'ventas.show', 'ventas.edit', 'ventas.update', 'ventas.destroy',
                    'ventas.detalles.index', 'ventas.detalles.store', 'ventas.detalles.update', 'ventas.detalles.destroy',
                    'ventas.verificar-stock', 'ventas.stock.bajo', 'ventas.stock.producto', 'ventas.stock.verificar', 'ventas.stock.resumen',
                    'proformas.index', 'proformas.create', 'proformas.store', 'proformas.show', 'proformas.edit', 'proformas.update',
                    'proformas.aprobar', 'proformas.rechazar', 'proformas.convertir-venta',
                ],
            ],

            // Capacidad: Gestión de Compras
            'compras'        => [
                'name'        => 'compras',
                'label'       => 'Comprar (Gestionar compras a proveedores)',
                'description' => 'Capacidad para crear y gestionar órdenes de compra',
                'icon'        => '📦',
                'permissions' => [
                    'compras.index', 'compras.create', 'compras.store', 'compras.show', 'compras.edit', 'compras.update', 'compras.destroy',
                    'compras.detalles.index', 'compras.detalles.store', 'compras.detalles.update', 'compras.detalles.destroy',
                    'compras.cuentas-por-pagar.index', 'compras.cuentas-por-pagar.show', 'compras.cuentas-por-pagar.actualizar-estado', 'compras.cuentas-por-pagar.export',
                    'compras.pagos.index', 'compras.pagos.create', 'compras.pagos.store', 'compras.pagos.show', 'compras.pagos.destroy', 'compras.pagos.export',
                    'compras.lotes-vencimientos.index', 'compras.lotes-vencimientos.export', 'compras.lotes-vencimientos.actualizar-estado', 'compras.lotes-vencimientos.actualizar-cantidad',
                    'compras.reportes.index', 'compras.reportes.export', 'compras.reportes.export-pdf',
                ],
            ],

            // Capacidad: Gestión de Clientes (CRUD de la entidad Cliente)
            'clientes'       => [
                'name'        => 'clientes',
                'label'       => 'Gestionar Clientes (Crear/editar datos maestros)',
                'description' => 'Capacidad para administrar información de clientes, direcciones, ventanas de entrega',
                'icon'        => '👥',
                'permissions' => [
                    'clientes.manage',
                    'clientes.direcciones.index', 'clientes.direcciones.create', 'clientes.direcciones.store',
                    'clientes.direcciones.edit', 'clientes.direcciones.update', 'clientes.direcciones.destroy',
                    'clientes.ventanas-entrega.index', 'clientes.ventanas-entrega.create', 'clientes.ventanas-entrega.store',
                    'clientes.ventanas-entrega.edit', 'clientes.ventanas-entrega.update', 'clientes.ventanas-entrega.destroy',
                    'clientes.fotos.index', 'clientes.fotos.store', 'clientes.fotos.destroy',
                    'clientes.cuentas-por-cobrar.index', 'clientes.cuentas-por-cobrar.view',
                ],
            ],

            // Capacidad: Gestión de Inventario
            'inventario'     => [
                'name'        => 'inventario',
                'label'       => 'Gestionar Inventario (Stock, ajustes, transferencias)',
                'description' => 'Capacidad para controlar stock, hacer ajustes, transferencias y ver mermas',
                'icon'        => '📊',
                'permissions' => [
                    'inventario.dashboard', 'inventario.stock-bajo', 'inventario.proximos-vencer', 'inventario.vencidos', 'inventario.movimientos',
                    'inventario.ajuste.form', 'inventario.ajuste.procesar', 'inventario.api.buscar-productos', 'inventario.api.stock-producto',
                    'inventario.reportes', 'inventario.mermas.index', 'inventario.mermas.registrar', 'inventario.mermas.store', 'inventario.mermas.show',
                    'inventario.mermas.aprobar', 'inventario.mermas.rechazar',
                    'inventario.transferencias.index', 'inventario.transferencias.crear', 'inventario.transferencias.ver', 'inventario.transferencias.edit',
                    'inventario.transferencias.enviar', 'inventario.transferencias.recibir', 'inventario.transferencias.cancelar',
                    'inventario.tipos-ajuste.manage', 'inventario.tipos-ajuste.index', 'inventario.tipos-ajuste.create', 'inventario.tipos-ajuste.store', 'inventario.tipos-ajuste.edit', 'inventario.tipos-ajuste.update', 'inventario.tipos-ajuste.destroy',
                    'inventario.vehiculos.manage', 'inventario.vehiculos.index', 'inventario.vehiculos.create', 'inventario.vehiculos.store', 'inventario.vehiculos.ver', 'inventario.vehiculos.edit', 'inventario.vehiculos.update', 'inventario.vehiculos.destroy',
                ],
            ],

            // Capacidad: Gestión de Envíos y Logística
            'logistica'      => [
                'name'        => 'logistica',
                'label'       => 'Gestionar Envíos (Programar, entregar, seguimiento)',
                'description' => 'Capacidad para gestionar envíos, asignar choferes y seguimiento de entregas',
                'icon'        => '🚚',
                'permissions' => [
                    'envios.index', 'envios.create', 'envios.store', 'envios.show', 'envios.edit', 'envios.update', 'envios.destroy',
                    'envios.programar', 'envios.cancelar', 'envios.confirmar-entrega', 'envios.confirmar-salida', 'envios.iniciar-preparacion',
                    'envios.choferes-disponibles', 'envios.vehiculos-disponibles',
                    'logistica.dashboard', 'logistica.envios.seguimiento',
                ],
            ],

            // Capacidad: Gestión de Cajas/Cobranza
            'cajas'          => [
                'name'        => 'cajas',
                'label'       => 'Gestionar Cajas (Cobros, aperturas, cierres)',
                'description' => 'Capacidad para operar cajas, registrar cobros y transacciones',
                'icon'        => '💳',
                'permissions' => [
                    'cajas.index', 'cajas.create', 'cajas.store', 'cajas.show', 'cajas.edit', 'cajas.update',
                    'cajas.abrir', 'cajas.cerrar', 'cajas.transacciones',
                ],
            ],

            // Capacidad: Reportes y Analytics
            'reportes'       => [
                'name'        => 'reportes',
                'label'       => 'Ver Reportes (Ventas, inventario, ganancias)',
                'description' => 'Capacidad para acceder a reportes y análisis de datos',
                'icon'        => '📈',
                'permissions' => [
                    'reportes.precios.index', 'reportes.precios.export', 'reportes.ganancias.index', 'reportes.ganancias.export',
                    'reportes.inventario.stock-actual', 'reportes.inventario.vencimientos', 'reportes.inventario.rotacion',
                    'reportes.inventario.movimientos', 'reportes.inventario.export',
                ],
            ],

            // Capacidad: Contabilidad
            'contabilidad'   => [
                'name'        => 'contabilidad',
                'label'       => 'Gestionar Contabilidad (Asientos, libros, balance)',
                'description' => 'Capacidad para registro contable y reportes financieros',
                'icon'        => '📚',
                'permissions' => [
                    'contabilidad.manage', 'contabilidad.asientos.index', 'contabilidad.asientos.show',
                    'contabilidad.reportes.libro-mayor', 'contabilidad.reportes.balance-comprobacion',
                ],
            ],

            // Capacidad: Gestión de Usuarios y Roles
            'admin_usuarios' => [
                'name'        => 'admin_usuarios',
                'label'       => 'Administrar Usuarios (CRUD, asignar roles)',
                'description' => 'Capacidad para crear, editar usuarios y asignar roles',
                'icon'        => '👤',
                'permissions' => [
                    'usuarios.index', 'usuarios.create', 'usuarios.store', 'usuarios.show', 'usuarios.edit', 'usuarios.update', 'usuarios.destroy',
                    'usuarios.assign-role', 'usuarios.remove-role', 'usuarios.assign-permission', 'usuarios.remove-permission',
                ],
            ],

            // Capacidad: Administración de Roles y Permisos
            'admin_roles'    => [
                'name'        => 'admin_roles',
                'label'       => 'Administrar Roles (CRUD, permisos)',
                'description' => 'Capacidad para crear, editar y asignar permisos a roles',
                'icon'        => '🔑',
                'permissions' => [
                    'roles.index', 'roles.create', 'roles.store', 'roles.show', 'roles.edit', 'roles.update', 'roles.destroy',
                    'roles.assign-permission', 'roles.remove-permission',
                    'permissions.index', 'permissions.create', 'permissions.store', 'permissions.show', 'permissions.edit', 'permissions.update', 'permissions.destroy',
                ],
            ],

            // Capacidad: Gestión de Maestros (Datos referencia)
            'maestros'       => [
                'name'        => 'maestros',
                'label'       => 'Gestionar Maestros (Categorías, marcas, proveedores)',
                'description' => 'Capacidad para editar datos maestros del sistema',
                'icon'        => '⚙️',
                'permissions' => [
                    'categorias.manage', 'marcas.manage', 'almacenes.manage', 'proveedores.manage', 'productos.manage',
                    'unidades.manage', 'tipos-precio.manage', 'tipos-pago.manage', 'monedas.manage', 'localidades.manage',
                ],
            ],

            // Capacidad: Configuración del Sistema
            'admin_config'   => [
                'name'        => 'admin_config',
                'label'       => 'Configurar Sistema (Configuración global)',
                'description' => 'Capacidad para cambiar configuraciones del sistema',
                'icon'        => '⚙️',
                'permissions' => [
                    'modulos-sidebar.index', 'modulos-sidebar.create', 'modulos-sidebar.store', 'modulos-sidebar.show', 'modulos-sidebar.edit',
                    'modulos-sidebar.update', 'modulos-sidebar.destroy', 'modulos-sidebar.actualizar-orden', 'modulos-sidebar.toggle-activo',
                    'configuracion-global.index', 'configuracion-global.store', 'configuracion-global.show', 'configuracion-global.update',
                    'configuracion-global.reset', 'configuracion-global.ganancias', 'configuracion-global.ganancias.update',
                    'admin.config',
                ],
            ],

            // Capacidad: Administración Crítica del Sistema (solo Super Admin)
            'admin_system'   => [
                'name'        => 'admin_system',
                'label'       => 'Admin del Sistema (Crítico - Solo Super Admin)',
                'description' => 'Capacidad para cambios críticos del sistema',
                'icon'        => '🛡️',
                'permissions' => [
                    'admin.system', 'admin.image-backup.manage',
                ],
            ],

            // Capacidad: Gestión de Empleados
            'empleados'      => [
                'name'        => 'empleados',
                'label'       => 'Gestionar Empleados (CRUD)',
                'description' => 'Capacidad para crear, editar y administrar empleados',
                'icon'        => '👨‍💼',
                'permissions' => [
                    'empleados.index', 'empleados.create', 'empleados.store', 'empleados.show', 'empleados.edit', 'empleados.update', 'empleados.destroy',
                    'empleados.toggle-estado', 'empleados.toggle-acceso-sistema',
                ],
            ],
        ];

        // Crear/actualizar Capabilities en BD
        foreach ($capabilities as $capName => $capData) {
            Capability::updateOrCreate(
                ['name' => $capName],
                [
                    'label'       => $capData['label'],
                    'description' => $capData['description'],
                    'icon'        => $capData['icon'] ?? null,
                ]
            );
        }

        return $capabilities;
    }

    /**
     * Asignar capacidades a los permisos individuales
     */
    private function assignCapabilitiesToPermissions(array $capabilities): void
    {
        foreach ($capabilities as $capName => $capData) {
            $capability = Capability::where('name', $capName)->first();

            if ($capability) {
                foreach ($capData['permissions'] as $permissionName) {
                    $permission = Permission::where('name', $permissionName)->first();
                    if ($permission) {
                        $permission->update(['capability' => $capName]);
                    }
                }
            }
        }
    }
}
