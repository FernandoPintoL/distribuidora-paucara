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

    /**
     * ============================================
     * CONFIGURACIÓN CENTRALIZADA: Módulos del Sidebar
     * ============================================
     *
     * Define TODOS los módulos y submódulos en un formato centralizado.
     * Elimina duplicidad y facilita mantenimiento.
     */
    private function getModulesConfiguration(): array
    {
        return [
            // ===== MÓDULO: PRODUCTOS =====
            'productos' => [
                'modulo' => [
                    'titulo' => 'Productos',
                    'ruta' => '/productos',
                    'icono' => 'Package',
                    'descripcion' => 'Gestión de productos y catálogo',
                    'orden' => 1,
                    'categoria' => 'Inventario',
                    'permisos' => ['productos.manage'],
                ],
                'submenu' => [
                    ['titulo' => 'Productos', 'ruta' => '/productos', 'icono' => 'Package', 'orden' => 1, 'permisos' => ['productos.manage']],
                    ['titulo' => 'Crear Producto', 'ruta' => '/productos/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['productos.manage']],
                    ['titulo' => 'Carga Masiva', 'ruta' => '/productos/carga-masiva', 'icono' => 'Upload', 'orden' => 3, 'permisos' => ['productos.manage']],
                    ['titulo' => 'Historial de Cargas', 'ruta' => '/productos/historial-cargas', 'icono' => 'History', 'orden' => 4, 'permisos' => ['productos.manage']],
                    ['titulo' => 'Categorías', 'ruta' => '/categorias', 'icono' => 'FolderTree', 'orden' => 5, 'permisos' => ['categorias.manage']],
                    ['titulo' => 'Marcas', 'ruta' => '/marcas', 'icono' => 'Tags', 'orden' => 6, 'permisos' => ['marcas.manage']],
                    ['titulo' => 'Unidades', 'ruta' => '/unidades', 'icono' => 'Ruler', 'orden' => 7, 'permisos' => ['unidades.manage']],
                    ['titulo' => 'Tipo Precios', 'ruta' => '/tipos-precio', 'icono' => 'DollarSign', 'orden' => 8, 'permisos' => ['tipos-precio.manage']],
                    ['titulo' => 'Rangos de Precios', 'ruta' => '/precio-rango', 'icono' => 'TrendingDown', 'orden' => 9, 'permisos' => ['productos.manage']],
                ],
            ],

            // ===== MÓDULO: INVENTARIO =====
            'inventario' => [
                'modulo' => [
                    'titulo' => 'Inventario',
                    'ruta' => '/inventario/dashboard',
                    'icono' => 'Boxes',
                    'descripcion' => 'Control y gestión de inventario',
                    'orden' => 2,
                    'categoria' => 'Inventario',
                    'permisos' => ['inventario.manage', 'inventario.dashboard'],
                ],
                'submenu' => [
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
                ],
            ],

            // ===== MÓDULO: VENTAS =====
            'ventas' => [
                'modulo' => [
                    'titulo' => 'Ventas',
                    'ruta' => '/ventas',
                    'icono' => 'ShoppingCart',
                    'descripcion' => 'Gestión de ventas y facturación',
                    'orden' => 3,
                    'categoria' => 'Comercial',
                    'permisos' => ['ventas.index'],
                ],
                'submenu' => [
                    ['titulo' => 'Lista de Ventas', 'ruta' => '/ventas', 'icono' => 'List', 'orden' => 1, 'permisos' => ['ventas.index']],
                    ['titulo' => 'Nueva Venta', 'ruta' => '/ventas/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['ventas.create']],
                ],
            ],

            // ===== MÓDULO: COMPRAS =====
            'compras' => [
                'modulo' => [
                    'titulo' => 'Compras',
                    'ruta' => '/compras',
                    'icono' => 'Truck',
                    'descripcion' => 'Gestión de compras y proveedores',
                    'orden' => 4,
                    'categoria' => 'Comercial',
                    'permisos' => ['compras.index'],
                ],
                'submenu' => [
                    ['titulo' => 'Lista de Compras', 'ruta' => '/compras', 'icono' => 'List', 'orden' => 1, 'permisos' => ['compras.index']],
                    ['titulo' => 'Nueva Compra', 'ruta' => '/compras/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['compras.create']],
                    ['titulo' => 'Cuentas por Pagar', 'ruta' => '/compras/cuentas-por-pagar', 'icono' => 'CreditCard', 'orden' => 3, 'permisos' => ['compras.cuentas-por-pagar.index']],
                    ['titulo' => 'Pagos', 'ruta' => '/compras/pagos', 'icono' => 'DollarSign', 'orden' => 4, 'permisos' => ['compras.pagos.index']],
                    ['titulo' => 'Lotes y Vencimientos', 'ruta' => '/compras/lotes-vencimientos', 'icono' => 'Calendar', 'orden' => 5, 'permisos' => ['compras.lotes-vencimientos.index']],
                    ['titulo' => 'Reportes', 'ruta' => '/compras/reportes', 'icono' => 'FileText', 'orden' => 6, 'permisos' => ['compras.reportes.index']],
                ],
            ],

            // ===== MÓDULO: EMPLEADOS =====
            'empleados' => [
                'modulo' => [
                    'titulo' => 'Empleados',
                    'ruta' => '/empleados',
                    'icono' => 'Users',
                    'descripcion' => 'Gestión de empleados',
                    'orden' => 5,
                    'categoria' => 'Recursos Humanos',
                    'permisos' => ['empleados.index'],
                ],
                'submenu' => [
                    ['titulo' => 'Lista de Empleados', 'ruta' => '/empleados', 'icono' => 'Users', 'orden' => 1, 'permisos' => ['empleados.index']],
                    ['titulo' => 'Nuevo Empleado', 'ruta' => '/empleados/create', 'icono' => 'UserPlus', 'orden' => 2, 'permisos' => ['empleados.create']],
                ],
            ],

            // ===== MÓDULO: LOGÍSTICA =====
            'logistica' => [
                'modulo' => [
                    'titulo' => 'Logística',
                    'ruta' => '/logistica/entregas',
                    'icono' => 'Truck',
                    'descripcion' => 'Gestión de entregas y logística',
                    'orden' => 6,
                    'categoria' => 'Logística',
                    'permisos' => ['entregas.index', 'logistica.dashboard', 'envios.index'],
                ],
                'submenu' => [
                    ['titulo' => 'Dashboard Logística', 'ruta' => '/logistica/dashboard', 'icono' => 'BarChart3', 'orden' => 1, 'permisos' => ['logistica.dashboard']],
                    ['titulo' => 'Dashboard Entregas', 'ruta' => '/logistica/entregas/dashboard', 'icono' => 'BarChart3', 'orden' => 2, 'permisos' => ['entregas.index']],
                    ['titulo' => 'Entregas', 'ruta' => '/logistica/entregas', 'icono' => 'PackageCheck', 'orden' => 3, 'permisos' => ['entregas.index']],
                    ['titulo' => 'Crear Entrega', 'ruta' => '/logistica/entregas/create', 'icono' => 'Plus', 'orden' => 4, 'permisos' => ['entregas.create']],
                    ['titulo' => 'Entregas Asignadas', 'ruta' => '/logistica/entregas/asignadas', 'icono' => 'Users', 'orden' => 5, 'permisos' => ['entregas.asignar']],
                    ['titulo' => 'Entregas en Tránsito', 'ruta' => '/logistica/entregas/en-transito', 'icono' => 'TrendingUp', 'orden' => 6, 'permisos' => ['entregas.tracking']],
                    ['titulo' => 'Vehículos', 'ruta' => '/inventario/vehiculos', 'icono' => 'Truck', 'orden' => 7, 'permisos' => ['inventario.vehiculos.index']],
                    ['titulo' => 'Crear Vehículo', 'ruta' => '/inventario/vehiculos/create', 'icono' => 'Plus', 'orden' => 8, 'permisos' => ['inventario.vehiculos.create']],
                ],
            ],

            // ===== MÓDULO: PROFORMAS =====
            'proformas' => [
                'modulo' => [
                    'titulo' => 'Proformas',
                    'ruta' => '/proformas',
                    'icono' => 'FileText',
                    'descripcion' => 'Gestión de proformas y cotizaciones',
                    'orden' => 7,
                    'categoria' => 'Ventas',
                    'permisos' => ['proformas.index'],
                ],
                'submenu' => [
                    ['titulo' => 'Proformas', 'ruta' => '/proformas', 'icono' => 'FileText', 'orden' => 1, 'permisos' => ['proformas.index']],
                    ['titulo' => 'Nueva Proforma', 'ruta' => '/proformas/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['proformas.create']],
                    ['titulo' => 'Aprobar Proforma', 'ruta' => '/proformas?estado=pendiente', 'icono' => 'CheckCircle', 'orden' => 3, 'permisos' => ['proformas.aprobar']],
                    ['titulo' => 'Convertir a Venta', 'ruta' => '/proformas?conversion=pendiente', 'icono' => 'ArrowRight', 'orden' => 4, 'permisos' => ['proformas.convertir-venta']],
                ],
            ],

            // ===== MÓDULO: REPORTES =====
            'reportes' => [
                'modulo' => [
                    'titulo' => 'Reportes',
                    'ruta' => '/reportes/precios',
                    'icono' => 'BarChart4',
                    'descripcion' => 'Reportes y análisis',
                    'orden' => 8,
                    'categoria' => 'Reportes',
                    'permisos' => ['reportes.precios.index'],
                ],
                'submenu' => [
                    ['titulo' => 'Reportes de Precios', 'ruta' => '/reportes/precios', 'icono' => 'DollarSign', 'orden' => 1, 'permisos' => ['reportes.precios.index']],
                    ['titulo' => 'Reportes de Ganancias', 'ruta' => '/reportes/ganancias', 'icono' => 'TrendingUp', 'orden' => 2, 'permisos' => ['reportes.ganancias.index']],
                    ['titulo' => 'Reporte de Crédito', 'ruta' => '/reportes/credito', 'icono' => 'CreditCard', 'orden' => 3, 'permisos' => ['reportes.credito.index']],
                    ['titulo' => 'Stock Actual', 'ruta' => '/reportes/inventario/stock-actual', 'icono' => 'Package', 'orden' => 4, 'permisos' => ['reportes.inventario.stock-actual']],
                    ['titulo' => 'Movimientos', 'ruta' => '/reportes/inventario/movimientos', 'icono' => 'ArrowUpDown', 'orden' => 5, 'permisos' => ['reportes.inventario.movimientos']],
                    ['titulo' => 'Rotación', 'ruta' => '/reportes/inventario/rotacion', 'icono' => 'RotateCcw', 'orden' => 6, 'permisos' => ['reportes.inventario.rotacion']],
                    ['titulo' => 'Vencimientos', 'ruta' => '/reportes/inventario/vencimientos', 'icono' => 'Calendar', 'orden' => 7, 'permisos' => ['reportes.inventario.vencimientos']],
                ],
            ],

            // ===== MÓDULOS SIMPLES (sin submenu) =====
            'cajas' => [
                'modulo' => [
                    'titulo' => 'Gestión de Cajas',
                    'ruta' => '/cajas',
                    'icono' => 'Wallet',
                    'descripcion' => 'Control de cajas y tesorería',
                    'orden' => 10,
                    'categoria' => 'Finanzas',
                    'permisos' => ['cajas.index'],
                ],
            ],
            'almacenes' => [
                'modulo' => [
                    'titulo' => 'Almacenes',
                    'ruta' => '/almacenes',
                    'icono' => 'Building2',
                    'descripcion' => 'Gestión de almacenes',
                    'orden' => 11,
                    'categoria' => 'Logística',
                    'permisos' => ['almacenes.manage'],
                ],
            ],
            'proveedores' => [
                'modulo' => [
                    'titulo' => 'Proveedores',
                    'ruta' => '/proveedores',
                    'icono' => 'Users',
                    'descripcion' => 'Gestión de proveedores',
                    'orden' => 12,
                    'categoria' => 'Comercial',
                    'permisos' => ['proveedores.manage'],
                ],
            ],
            'clientes' => [
                'modulo' => [
                    'titulo' => 'Clientes',
                    'ruta' => '/clientes',
                    'icono' => 'UserCheck',
                    'descripcion' => 'Gestión de clientes',
                    'orden' => 13,
                    'categoria' => 'Comercial',
                    'permisos' => ['clientes.manage'],
                ],
            ],
            'localidades' => [
                'modulo' => [
                    'titulo' => 'Localidades',
                    'ruta' => '/localidades',
                    'icono' => 'MapPin',
                    'descripcion' => 'Gestión de localidades',
                    'orden' => 14,
                    'categoria' => 'Configuración',
                    'permisos' => ['localidades.manage'],
                ],
            ],
            'monedas' => [
                'modulo' => [
                    'titulo' => 'Monedas',
                    'ruta' => '/monedas',
                    'icono' => 'DollarSign',
                    'descripcion' => 'Gestión de monedas',
                    'orden' => 15,
                    'categoria' => 'Configuración',
                    'permisos' => ['monedas.manage'],
                ],
            ],
            'tipos_pago' => [
                'modulo' => [
                    'titulo' => 'Tipo Pagos',
                    'ruta' => '/tipos-pago',
                    'icono' => 'CreditCard',
                    'descripcion' => 'Gestión de tipos de pago',
                    'orden' => 16,
                    'categoria' => 'Configuración',
                    'permisos' => ['tipos-pago.manage'],
                ],
            ],
            'tipos_documento' => [
                'modulo' => [
                    'titulo' => 'Tipos de Documento',
                    'ruta' => '/tipos-documento',
                    'icono' => 'FileText',
                    'descripcion' => 'Gestión de tipos de documento',
                    'orden' => 17,
                    'categoria' => 'Configuración',
                    'permisos' => ['tipos_documento.manage'],
                ],
            ],

            // ===== MÓDULO: ADMINISTRACIÓN =====
            'administracion' => [
                'modulo' => [
                    'titulo' => 'Administración',
                    'ruta' => '/usuarios',
                    'icono' => 'Settings',
                    'descripcion' => 'Configuración del sistema',
                    'orden' => 99,
                    'categoria' => 'Sistema',
                    'permisos' => ['usuarios.index'],
                ],
                'submenu' => [
                    ['titulo' => 'Usuarios', 'ruta' => '/usuarios', 'icono' => 'Users', 'orden' => 1, 'permisos' => ['usuarios.index']],
                    ['titulo' => 'Roles', 'ruta' => '/roles', 'icono' => 'Shield', 'orden' => 2, 'permisos' => ['roles.index']],
                    ['titulo' => 'Permisos', 'ruta' => '/permisos', 'icono' => 'Lock', 'orden' => 3, 'permisos' => ['permisos.index']],
                    ['titulo' => 'Empresas', 'ruta' => '/empresas', 'icono' => 'Building', 'orden' => 4, 'permisos' => ['empresas.index']],
                ],
            ],
        ];
    }

    public function run(): void
    {
        $this->command->info('🔧 Iniciando configuración centralizada de módulos del sidebar...');
        $this->command->info('');

        // PASO 1: Limpiar duplicados
        // $this->limpiarDuplicados();

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
     * Utiliza configuración centralizada para evitar duplicidad
     */
    private function crearModulos(): void
    {
        $this->command->info('📦 Creando/actualizando módulos...');

        $config = $this->getModulesConfiguration();

        // Procesar cada módulo de la configuración
        foreach ($config as $moduloKey => $moduloData) {
            $modulo = ModuloSidebar::firstOrCreate(
                [
                    'titulo' => $moduloData['modulo']['titulo'],
                    'ruta' => $moduloData['modulo']['ruta'],
                    'es_submenu' => false,
                ],
                [
                    'icono' => $moduloData['modulo']['icono'],
                    'descripcion' => $moduloData['modulo']['descripcion'],
                    'orden' => $moduloData['modulo']['orden'],
                    'categoria' => $moduloData['modulo']['categoria'],
                    'activo' => true,
                    'permisos' => $moduloData['modulo']['permisos'],
                ]
            );

            // Si el módulo tiene submenu, crearlo
            if (isset($moduloData['submenu']) && !empty($moduloData['submenu'])) {
                $this->crearSubmenu($modulo, $moduloData['submenu']);
            }
        }

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
     * ============================================
     * PERMISOS: Configuración por rol
     * ============================================
     *
     * Extrae todos los permisos de la configuración de módulos
     * Agrupa por rol para asignación centralizada
     */
    private function getPermissionsByRole(): array
    {
        $config = $this->getModulesConfiguration();
        $permisosModulos = [];

        // Extraer todos los permisos de la configuración de módulos
        foreach ($config as $moduloData) {
            // Agregar permisos del módulo principal
            $permisosModulos = array_merge($permisosModulos, $moduloData['modulo']['permisos'] ?? []);

            // Agregar permisos del submenu
            if (isset($moduloData['submenu'])) {
                foreach ($moduloData['submenu'] as $subitem) {
                    $permisosModulos = array_merge($permisosModulos, $subitem['permisos'] ?? []);
                }
            }
        }

        // Permisos únicos de Logística y Reportes (adicionales)
        $permisosAdicionales = [
            'reportes-carga.index',
            'reportes.view',
        ];

        return [
            'Super Admin' => array_merge($permisosModulos, $permisosAdicionales),
            'Admin' => array_merge($permisosModulos, $permisosAdicionales),
            'Cajero' => array_merge($permisosModulos, $permisosAdicionales),
        ];
    }

    /**
     * PASO 3: Asignar permisos a roles
     * Utiliza configuración centralizada sin duplicidad
     */
    private function asignarPermisos(): void
    {
        $this->command->info('🔐 Asignando permisos a roles...');

        // Obtener permisos por rol
        $permisosPorRol = $this->getPermissionsByRole();

        // Obtener roles
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin'], ['guard_name' => 'web']);
        $admin = Role::firstOrCreate(['name' => 'Admin'], ['guard_name' => 'web']);
        $cajero = Role::firstOrCreate(['name' => 'Cajero'], ['guard_name' => 'web']);

        // Crear permisos en la BD (si no existen)
        $todosLosPermisos = array_unique(array_merge(...array_values($permisosPorRol)));
        foreach ($todosLosPermisos as $permiso) {
            Permission::firstOrCreate(['name' => $permiso], ['guard_name' => 'web']);
        }

        // Asignar permisos a cada rol
        $admin->syncPermissions($permisosPorRol['Admin']);
        $this->command->line('  ✓ Admin: permisos asignados');

        $cajero->syncPermissions($permisosPorRol['Cajero']);
        $this->command->line('  ✓ Cajero: permisos asignados');

        // Super Admin recibe todos los permisos
        $allPermissions = Permission::all();
        $superAdmin->syncPermissions($allPermissions);
        $this->command->line('  ✓ Super Admin: todos los permisos asignados');
    }
}
