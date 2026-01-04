<?php
namespace Database\Seeders;

use App\Models\ModuloSidebar;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ModuloSidebarSeeder extends Seeder
{
    /**
     * Seeder CENTRALIZADO para módulos del sidebar
     *
     * INCLUYE:
     * - Creación/actualización de TODOS los módulos
     * - Limpieza de duplicados
     * - Asignación de permisos a roles
     * - Configuración de Logística para Admin y Cajero
     */
    public function run(): void
    {
        $this->command->info('🔧 Iniciando configuración centralizada de módulos del sidebar...');
        $this->command->info('');

        // PASO 1: Limpiar duplicados
        $this->limpiarDuplicados();

        // PASO 2: Crear/actualizar todos los módulos
        $this->crearModulos();

        // PASO 3: Asignar permisos a roles
        $this->asignarPermisos();

        $this->command->info('');
        $this->command->info('✅ Configuración centralizada completada exitosamente');
        $this->command->info('');
    }

    /**
     * PASO 1: Limpiar módulos duplicados y malformados
     */
    private function limpiarDuplicados(): void
    {
        $this->command->info('🧹 Limpiando módulos duplicados...');

        // Eliminar Logística antigua (ID: 31) si existe
        $logisticaAntiga = ModuloSidebar::find(31);
        if ($logisticaAntiga) {
            ModuloSidebar::where('modulo_padre_id', 31)->delete();
            $logisticaAntiga->delete();
            $this->command->line('  ✓ Logística antigua eliminada');
        }

        // Eliminar proformas duplicados (IDs 37, 75)
        $proformasAntiguos = ModuloSidebar::whereIn('id', [37, 75])->get();
        foreach ($proformasAntiguos as $proforma) {
            ModuloSidebar::where('modulo_padre_id', $proforma->id)->delete();
            $proforma->delete();
        }
        if ($proformasAntiguos->count() > 0) {
            $this->command->line('  ✓ Proformas duplicados eliminados');
        }

        $this->command->line('');
    }

    /**
     * PASO 2: Crear/actualizar todos los módulos
     */
    private function crearModulos(): void
    {
        $this->command->info('📦 Creando/actualizando módulos...');

        // ===== MÓDULO: PRODUCTOS =====
        $productos = ModuloSidebar::updateOrCreate(
            ['titulo' => 'Productos', 'ruta' => '/productos', 'es_submenu' => false],
            [
                'icono' => 'Package',
                'descripcion' => 'Gestión de productos y catálogo',
                'orden' => 1,
                'categoria' => 'Inventario',
                'activo' => true,
                'permisos' => ['productos.manage'],
            ]
        );

        $submenuProductos = [
            ['titulo' => 'Productos', 'ruta' => '/productos', 'icono' => 'Package', 'orden' => 1, 'permisos' => ['productos.manage']],
            ['titulo' => 'Crear Producto', 'ruta' => '/productos/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['productos.manage']],
            ['titulo' => 'Carga Masiva', 'ruta' => '/productos/carga-masiva', 'icono' => 'Upload', 'orden' => 3, 'permisos' => ['productos.manage']],
            ['titulo' => 'Historial de Cargas', 'ruta' => '/productos/historial-cargas', 'icono' => 'History', 'orden' => 4, 'permisos' => ['productos.manage']],
            ['titulo' => 'Categorías', 'ruta' => '/categorias', 'icono' => 'FolderTree', 'orden' => 5, 'permisos' => ['categorias.manage']],
            ['titulo' => 'Marcas', 'ruta' => '/marcas', 'icono' => 'Tags', 'orden' => 6, 'permisos' => ['marcas.manage']],
            ['titulo' => 'Unidades', 'ruta' => '/unidades', 'icono' => 'Ruler', 'orden' => 7, 'permisos' => ['unidades.manage']],
            ['titulo' => 'Tipo Precios', 'ruta' => '/tipos-precio', 'icono' => 'DollarSign', 'orden' => 8, 'permisos' => ['tipos-precio.manage']],
        ];

        $this->crearSubmenu($productos, $submenuProductos);

        // ===== MÓDULO: INVENTARIO =====
        $inventario = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Inventario', 'ruta' => '/inventario/dashboard', 'es_submenu' => false],
            [
                'icono' => 'Boxes',
                'descripcion' => 'Control y gestión de inventario',
                'orden' => 2,
                'categoria' => 'Inventario',
                'activo' => true,
                'permisos' => ['inventario.dashboard'],
            ]
        );

        $submenuInventario = [
            ['titulo' => 'Dashboard', 'ruta' => '/inventario/dashboard', 'icono' => 'BarChart3', 'orden' => 1, 'permisos' => ['inventario.dashboard']],
            ['titulo' => 'Carga Inicial', 'ruta' => '/inventario/inventario-inicial', 'icono' => 'Upload', 'orden' => 2, 'permisos' => ['inventario.dashboard']],
            ['titulo' => 'Stock Bajo', 'ruta' => '/inventario/stock-bajo', 'icono' => 'TrendingDown', 'orden' => 3, 'permisos' => ['inventario.stock-bajo']],
            ['titulo' => 'Próximos a Vencer', 'ruta' => '/inventario/proximos-vencer', 'icono' => 'Calendar', 'orden' => 4, 'permisos' => ['inventario.proximos-vencer']],
            ['titulo' => 'Productos Vencidos', 'ruta' => '/inventario/vencidos', 'icono' => 'AlertTriangle', 'orden' => 5, 'permisos' => ['inventario.vencidos']],
            ['titulo' => 'Movimientos', 'ruta' => '/inventario/movimientos', 'icono' => 'ArrowUpDown', 'orden' => 6, 'permisos' => ['inventario.movimientos']],
            ['titulo' => 'Transferencias', 'ruta' => '/inventario/transferencias', 'icono' => 'ArrowRightLeft', 'orden' => 7, 'permisos' => ['inventario.transferencias.index']],
            ['titulo' => 'Mermas', 'ruta' => '/inventario/mermas', 'icono' => 'Package2', 'orden' => 8, 'permisos' => ['inventario.mermas.index']],
            ['titulo' => 'Ajustes', 'ruta' => '/inventario/ajuste', 'icono' => 'Settings', 'orden' => 9, 'permisos' => ['inventario.ajuste.form']],
            ['titulo' => 'Carga Masiva', 'ruta' => '/inventario/ajuste-masivo', 'icono' => 'FileUp', 'orden' => 10, 'permisos' => ['inventario.ajuste.form']],
            ['titulo' => 'Tipos de Ajuste', 'ruta' => '/inventario/tipos-ajuste-inventario', 'icono' => 'Sliders', 'orden' => 11, 'permisos' => ['inventario.tipos-ajuste.index']],
            ['titulo' => 'Reportes', 'ruta' => '/inventario/reportes', 'icono' => 'FileText', 'orden' => 12, 'permisos' => ['reportes.inventario.stock-actual']],
        ];

        $this->crearSubmenu($inventario, $submenuInventario);

        // ===== MÓDULO: VENTAS =====
        $ventas = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Ventas', 'ruta' => '/ventas', 'es_submenu' => false],
            [
                'icono' => 'ShoppingCart',
                'descripcion' => 'Gestión de ventas y facturación',
                'orden' => 3,
                'categoria' => 'Comercial',
                'activo' => true,
                'permisos' => ['ventas.index'],
            ]
        );

        $submenuVentas = [
            ['titulo' => 'Lista de Ventas', 'ruta' => '/ventas', 'icono' => 'List', 'orden' => 1, 'permisos' => ['ventas.index']],
            ['titulo' => 'Nueva Venta', 'ruta' => '/ventas/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['ventas.create']],
        ];

        $this->crearSubmenu($ventas, $submenuVentas);

        // ===== MÓDULO: COMPRAS =====
        $compras = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Compras', 'ruta' => '/compras', 'es_submenu' => false],
            [
                'icono' => 'Truck',
                'descripcion' => 'Gestión de compras y proveedores',
                'orden' => 4,
                'categoria' => 'Comercial',
                'activo' => true,
                'permisos' => ['compras.index'],
            ]
        );

        $submenuCompras = [
            ['titulo' => 'Lista de Compras', 'ruta' => '/compras', 'icono' => 'List', 'orden' => 1, 'permisos' => ['compras.index']],
            ['titulo' => 'Nueva Compra', 'ruta' => '/compras/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['compras.create']],
            ['titulo' => 'Cuentas por Pagar', 'ruta' => '/compras/cuentas-por-pagar', 'icono' => 'CreditCard', 'orden' => 3, 'permisos' => ['compras.cuentas-por-pagar.index']],
            ['titulo' => 'Pagos', 'ruta' => '/compras/pagos', 'icono' => 'DollarSign', 'orden' => 4, 'permisos' => ['compras.pagos.index']],
            ['titulo' => 'Lotes y Vencimientos', 'ruta' => '/compras/lotes-vencimientos', 'icono' => 'Calendar', 'orden' => 5, 'permisos' => ['compras.lotes-vencimientos.index']],
            ['titulo' => 'Reportes', 'ruta' => '/compras/reportes', 'icono' => 'FileText', 'orden' => 6, 'permisos' => ['compras.reportes.index']],
        ];

        $this->crearSubmenu($compras, $submenuCompras);

        // ===== MÓDULO: EMPLEADOS =====
        $empleados = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Empleados', 'ruta' => '/empleados', 'es_submenu' => false],
            [
                'icono' => 'Users',
                'descripcion' => 'Gestión de empleados',
                'orden' => 5,
                'categoria' => 'Recursos Humanos',
                'activo' => true,
                'permisos' => ['empleados.index'],
            ]
        );

        $submenuEmpleados = [
            ['titulo' => 'Lista de Empleados', 'ruta' => '/empleados', 'icono' => 'Users', 'orden' => 1, 'permisos' => ['empleados.index']],
            ['titulo' => 'Nuevo Empleado', 'ruta' => '/empleados/create', 'icono' => 'UserPlus', 'orden' => 2, 'permisos' => ['empleados.create']],
        ];

        $this->crearSubmenu($empleados, $submenuEmpleados);

        // ===== MÓDULO: LOGÍSTICA (CONFIGURADO CORRECTAMENTE) =====
        $logistica = ModuloSidebar::updateOrCreate(
            ['titulo' => 'Logística', 'ruta' => '/logistica/entregas', 'es_submenu' => false],
            [
                'icono' => 'Truck',
                'descripcion' => 'Gestión de entregas y logística',
                'orden' => 6,
                'categoria' => 'Logística',
                'activo' => true,
                'permisos' => ['entregas.index', 'logistica.dashboard', 'envios.index'],
            ]
        );

        $submenuLogistica = [
            ['titulo' => 'Dashboard Logística', 'ruta' => '/logistica/dashboard', 'icono' => 'BarChart3', 'orden' => 1, 'permisos' => ['logistica.dashboard']],
            ['titulo' => 'Dashboard Entregas', 'ruta' => '/logistica/entregas/dashboard', 'icono' => 'BarChart3', 'orden' => 2, 'permisos' => ['entregas.index']],
            ['titulo' => 'Entregas', 'ruta' => '/logistica/entregas', 'icono' => 'PackageCheck', 'orden' => 3, 'permisos' => ['entregas.index']],
            ['titulo' => 'Crear Entrega', 'ruta' => '/logistica/entregas/create', 'icono' => 'Plus', 'orden' => 4, 'permisos' => ['entregas.create']],
            ['titulo' => 'Entregas Asignadas', 'ruta' => '/logistica/entregas/asignadas', 'icono' => 'Users', 'orden' => 5, 'permisos' => ['entregas.asignar']],
            ['titulo' => 'Entregas en Tránsito', 'ruta' => '/logistica/entregas/en-transito', 'icono' => 'TrendingUp', 'orden' => 6, 'permisos' => ['entregas.tracking']],
            ['titulo' => 'Vehículos', 'ruta' => '/inventario/vehiculos', 'icono' => 'Truck', 'orden' => 7, 'permisos' => ['inventario.vehiculos.index']],
            ['titulo' => 'Crear Vehículo', 'ruta' => '/inventario/vehiculos/create', 'icono' => 'Plus', 'orden' => 8, 'permisos' => ['inventario.vehiculos.create']],
        ];

        $this->crearSubmenu($logistica, $submenuLogistica);

        // ===== MÓDULO: PROFORMAS =====
        $proformas = ModuloSidebar::updateOrCreate(
            ['titulo' => 'Proformas', 'ruta' => '/proformas', 'es_submenu' => false],
            [
                'icono' => 'FileText',
                'descripcion' => 'Gestión de proformas y cotizaciones',
                'orden' => 7,
                'categoria' => 'Ventas',
                'activo' => true,
                'permisos' => ['proformas.index'],
            ]
        );

        $submenuProformas = [
            ['titulo' => 'Proformas', 'ruta' => '/proformas', 'icono' => 'FileText', 'orden' => 1, 'permisos' => ['proformas.index']],
            ['titulo' => 'Nueva Proforma', 'ruta' => '/proformas/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['proformas.create']],
            ['titulo' => 'Aprobar Proforma', 'ruta' => '/proformas?estado=pendiente', 'icono' => 'CheckCircle', 'orden' => 3, 'permisos' => ['proformas.aprobar']],
            ['titulo' => 'Convertir a Venta', 'ruta' => '/proformas?conversion=pendiente', 'icono' => 'ArrowRight', 'orden' => 4, 'permisos' => ['proformas.convertir-venta']],
        ];

        $this->crearSubmenu($proformas, $submenuProformas);

        // ===== MÓDULO: REPORTES =====
        $reportes = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Reportes', 'ruta' => '/reportes/precios', 'es_submenu' => false],
            [
                'icono' => 'BarChart4',
                'descripcion' => 'Reportes y análisis',
                'orden' => 8,
                'categoria' => 'Reportes',
                'activo' => true,
                'permisos' => ['reportes.precios.index'],
            ]
        );

        $submenuReportes = [
            ['titulo' => 'Reportes de Precios', 'ruta' => '/reportes/precios', 'icono' => 'DollarSign', 'orden' => 1, 'permisos' => ['reportes.precios.index']],
            ['titulo' => 'Reportes de Ganancias', 'ruta' => '/reportes/ganancias', 'icono' => 'TrendingUp', 'orden' => 2, 'permisos' => ['reportes.ganancias.index']],
            ['titulo' => 'Reporte de Crédito', 'ruta' => '/reportes/credito', 'icono' => 'CreditCard', 'orden' => 3, 'permisos' => ['reportes.credito.index']],
            ['titulo' => 'Stock Actual', 'ruta' => '/reportes/inventario/stock-actual', 'icono' => 'Package', 'orden' => 4, 'permisos' => ['reportes.inventario.stock-actual']],
            ['titulo' => 'Movimientos', 'ruta' => '/reportes/inventario/movimientos', 'icono' => 'ArrowUpDown', 'orden' => 5, 'permisos' => ['reportes.inventario.movimientos']],
            ['titulo' => 'Rotación', 'ruta' => '/reportes/inventario/rotacion', 'icono' => 'RotateCcw', 'orden' => 6, 'permisos' => ['reportes.inventario.rotacion']],
            ['titulo' => 'Vencimientos', 'ruta' => '/reportes/inventario/vencimientos', 'icono' => 'Calendar', 'orden' => 7, 'permisos' => ['reportes.inventario.vencimientos']],
        ];

        $this->crearSubmenu($reportes, $submenuReportes);

        // ===== MÓDULOS PRINCIPALES SIN SUBMÓDULOS =====
        $modulosPrincipales = [
            ['titulo' => 'Gestión de Cajas', 'ruta' => '/cajas', 'icono' => 'Wallet', 'descripcion' => 'Control de cajas y tesorería', 'orden' => 10, 'categoria' => 'Finanzas', 'permisos' => ['cajas.index']],
            ['titulo' => 'Almacenes', 'ruta' => '/almacenes', 'icono' => 'Building2', 'descripcion' => 'Gestión de almacenes', 'orden' => 11, 'categoria' => 'Logística', 'permisos' => ['almacenes.manage']],
            ['titulo' => 'Proveedores', 'ruta' => '/proveedores', 'icono' => 'Users', 'descripcion' => 'Gestión de proveedores', 'orden' => 12, 'categoria' => 'Comercial', 'permisos' => ['proveedores.manage']],
            ['titulo' => 'Clientes', 'ruta' => '/clientes', 'icono' => 'UserCheck', 'descripcion' => 'Gestión de clientes', 'orden' => 13, 'categoria' => 'Comercial', 'permisos' => ['clientes.manage']],
            ['titulo' => 'Localidades', 'ruta' => '/localidades', 'icono' => 'MapPin', 'descripcion' => 'Gestión de localidades', 'orden' => 14, 'categoria' => 'Configuración', 'permisos' => ['localidades.manage']],
            ['titulo' => 'Monedas', 'ruta' => '/monedas', 'icono' => 'DollarSign', 'descripcion' => 'Gestión de monedas', 'orden' => 15, 'categoria' => 'Configuración', 'permisos' => ['monedas.manage']],
            ['titulo' => 'Tipo Pagos', 'ruta' => '/tipos-pago', 'icono' => 'CreditCard', 'descripcion' => 'Gestión de tipos de pago', 'orden' => 16, 'categoria' => 'Configuración', 'permisos' => ['tipos-pago.manage']],
            ['titulo' => 'Tipos de Documento', 'ruta' => '/tipos-documento', 'icono' => 'FileText', 'descripcion' => 'Gestión de tipos de documento', 'orden' => 17, 'categoria' => 'Configuración', 'permisos' => ['tipos_documento.manage']],
        ];

        foreach ($modulosPrincipales as $modulo) {
            ModuloSidebar::firstOrCreate(
                ['titulo' => $modulo['titulo'], 'ruta' => $modulo['ruta'], 'es_submenu' => false],
                [
                    'icono' => $modulo['icono'],
                    'descripcion' => $modulo['descripcion'],
                    'orden' => $modulo['orden'],
                    'categoria' => $modulo['categoria'],
                    'activo' => true,
                    'permisos' => $modulo['permisos'],
                ]
            );
        }

        // ===== MÓDULO: ADMINISTRACIÓN =====
        $administracion = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Administración', 'ruta' => '/usuarios', 'es_submenu' => false],
            [
                'icono' => 'Settings',
                'descripcion' => 'Configuración del sistema',
                'orden' => 99,
                'categoria' => 'Sistema',
                'activo' => true,
                'permisos' => ['usuarios.index'],
            ]
        );

        $submenuAdmin = [
            ['titulo' => 'Usuarios', 'ruta' => '/usuarios', 'icono' => 'Users', 'orden' => 1, 'permisos' => ['usuarios.index']],
            ['titulo' => 'Roles', 'ruta' => '/roles', 'icono' => 'Shield', 'orden' => 2, 'permisos' => ['roles.index']],
            ['titulo' => 'Permisos', 'ruta' => '/permisos', 'icono' => 'Lock', 'orden' => 3, 'permisos' => ['permisos.index']],
            ['titulo' => 'Empresas', 'ruta' => '/empresas', 'icono' => 'Building', 'orden' => 4, 'permisos' => ['empresas.index']],
        ];

        $this->crearSubmenu($administracion, $submenuAdmin);

        $this->command->line('  ✓ Todos los módulos creados/actualizados');
    }

    /**
     * Crear submódulos para un módulo padre
     */
    private function crearSubmenu($modulo, $submenu): void
    {
        foreach ($submenu as $item) {
            ModuloSidebar::updateOrCreate(
                [
                    'titulo' => $item['titulo'],
                    'ruta' => $item['ruta'],
                    'es_submenu' => true,
                    'modulo_padre_id' => $modulo->id,
                ],
                [
                    'icono' => $item['icono'],
                    'orden' => $item['orden'],
                    'activo' => true,
                    'permisos' => $item['permisos'],
                ]
            );
        }
    }

    /**
     * PASO 3: Asignar permisos a roles
     */
    private function asignarPermisos(): void
    {
        $this->command->info('🔐 Asignando permisos a roles...');

        // Obtener/crear roles
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin'], ['guard_name' => 'web']);
        $admin = Role::firstOrCreate(['name' => 'Admin'], ['guard_name' => 'web']);
        $cajero = Role::firstOrCreate(['name' => 'Cajero'], ['guard_name' => 'web']);

        // Permisos de Logística que deben estar disponibles
        $permisosLogistica = [
            'entregas.index',
            'entregas.create',
            'entregas.edit',
            'entregas.delete',
            'entregas.asignar',
            'entregas.tracking',
            'logistica.dashboard',
            'envios.index',
        ];

        // Permisos de Reportes
        $permisosReportes = [
            'reportes-carga.index',
            'reportes.view',
            'reportes.credito.index',
        ];

        // Crear/obtener permisos
        foreach (array_merge($permisosLogistica, $permisosReportes) as $permiso) {
            Permission::firstOrCreate(['name' => $permiso], ['guard_name' => 'web']);
        }

        // Asignar permisos a Admin
        $admin->syncPermissions(array_merge($permisosLogistica, $permisosReportes));
        $this->command->line('  ✓ Admin: permisos de Logística y Reportes asignados');

        // Asignar permisos a Cajero
        $cajero->syncPermissions(array_merge($permisosLogistica, $permisosReportes));
        $this->command->line('  ✓ Cajero: permisos de Logística y Reportes asignados');

        // Asignar todos los permisos a Super Admin
        $allPermissions = Permission::all();
        $superAdmin->syncPermissions($allPermissions);
        $this->command->line('  ✓ Super Admin: todos los permisos asignados');
    }
}
