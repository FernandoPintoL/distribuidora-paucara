<?php
namespace Database\Seeders;

use App\Models\ModuloSidebar;
use Illuminate\Database\Seeder;

class ModuloSidebarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Módulo de Productos
        $productos = ModuloSidebar::updateOrCreate(
            ['titulo' => 'Productos', 'ruta' => '/productos', 'es_submenu' => false],
            [
                'icono'       => 'Package',
                'descripcion' => 'Gestión de productos y catálogo',
                'orden'       => 1,
                'categoria'   => 'Inventario',
                'activo'      => true,
                'permisos'    => ['productos.manage'],
            ]
        );

        // Submódulos de Productos
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

        foreach ($submenuProductos as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $productos->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }

        // Módulo de Inventario
        $inventario = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Inventario', 'ruta' => '/inventario/dashboard', 'es_submenu' => false],
            [
                'icono'       => 'Boxes',
                'descripcion' => 'Control y gestión de inventario',
                'orden'       => 2,
                'categoria'   => 'Inventario',
                'activo'      => true,
                'permisos'    => ['inventario.dashboard'],
            ]
        );

        // Submódulos de Inventario
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

        foreach ($submenuInventario as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $inventario->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }

        // Módulo de Ventas
        $ventas = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Ventas', 'ruta' => '/ventas', 'es_submenu' => false],
            [
                'icono'       => 'ShoppingCart',
                'descripcion' => 'Gestión de ventas y facturación',
                'orden'       => 3,
                'categoria'   => 'Comercial',
                'activo'      => true,
                'permisos'    => ['ventas.index'],
            ]
        );

        // Submódulos de Ventas
        $submenuVentas = [
            ['titulo' => 'Lista de Ventas', 'ruta' => '/ventas', 'icono' => 'List', 'orden' => 1, 'permisos' => ['ventas.index']],
            ['titulo' => 'Nueva Venta', 'ruta' => '/ventas/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['ventas.create']],
        ];

        foreach ($submenuVentas as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $ventas->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }

        // Módulo de Compras
        $compras = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Compras', 'ruta' => '/compras', 'es_submenu' => false],
            [
                'icono'       => 'Truck',
                'descripcion' => 'Gestión de compras y proveedores',
                'orden'       => 4,
                'categoria'   => 'Comercial',
                'activo'      => true,
                'permisos'    => ['compras.index'],
            ]
        );

        // Submódulos de Compras
        $submenuCompras = [
            ['titulo' => 'Lista de Compras', 'ruta' => '/compras', 'icono' => 'List', 'orden' => 1, 'permisos' => ['compras.index']],
            ['titulo' => 'Nueva Compra', 'ruta' => '/compras/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['compras.create']],
            ['titulo' => 'Cuentas por Pagar', 'ruta' => '/compras/cuentas-por-pagar', 'icono' => 'CreditCard', 'orden' => 3, 'permisos' => ['compras.cuentas-por-pagar.index']],
            ['titulo' => 'Pagos', 'ruta' => '/compras/pagos', 'icono' => 'DollarSign', 'orden' => 4, 'permisos' => ['compras.pagos.index']],
            ['titulo' => 'Lotes y Vencimientos', 'ruta' => '/compras/lotes-vencimientos', 'icono' => 'Calendar', 'orden' => 5, 'permisos' => ['compras.lotes-vencimientos.index']],
            ['titulo' => 'Reportes', 'ruta' => '/compras/reportes', 'icono' => 'FileText', 'orden' => 6, 'permisos' => ['compras.reportes.index']],
        ];

        foreach ($submenuCompras as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $compras->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }

        // Módulo de Empleados
        $empleados = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Empleados', 'ruta' => '/empleados', 'es_submenu' => false],
            [
                'icono'       => 'Users',
                'descripcion' => 'Gestión de empleados',
                'orden'       => 5,
                'categoria'   => 'Recursos Humanos',
                'activo'      => true,
                'permisos'    => ['empleados.index'],
            ]
        );

        // Submódulos de Empleados
        $submenuEmpleados = [
            ['titulo' => 'Lista de Empleados', 'ruta' => '/empleados', 'icono' => 'Users', 'orden' => 1, 'permisos' => ['empleados.index']],
            ['titulo' => 'Nuevo Empleado', 'ruta' => '/empleados/create', 'icono' => 'UserPlus', 'orden' => 2, 'permisos' => ['empleados.create']],
        ];

        foreach ($submenuEmpleados as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $empleados->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }

        // Módulo de Logística (Consolidado: solo Entregas, sin legacy Envios)
        $logistica = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Logística', 'ruta' => '/logistica/entregas', 'es_submenu' => false],
            [
                'icono'       => 'Truck',
                'descripcion' => 'Gestión de entregas y logística',
                'orden'       => 6,
                'categoria'   => 'Logística',
                'activo'      => true,
                'permisos'    => ['entregas.index'],
            ]
        );

        // Submódulos de Logística (con ambos dashboards)
        $submenuLogistica = [
            ['titulo' => 'Dashboard Logística (Antiguo)', 'ruta' => '/logistica/dashboard', 'icono' => 'BarChart3', 'orden' => 1, 'permisos' => ['logistica.dashboard']],
            ['titulo' => 'Dashboard Entregas (Nuevo)', 'ruta' => '/logistica/entregas/dashboard', 'icono' => 'BarChart3', 'orden' => 2, 'permisos' => ['entregas.index']],
            ['titulo' => 'Entregas', 'ruta' => '/logistica/entregas', 'icono' => 'PackageCheck', 'orden' => 3, 'permisos' => ['entregas.index']],
            ['titulo' => 'Crear Entrega', 'ruta' => '/logistica/entregas/create', 'icono' => 'Plus', 'orden' => 4, 'permisos' => ['entregas.create']],
            ['titulo' => 'Entregas Asignadas', 'ruta' => '/logistica/entregas/asignadas', 'icono' => 'Users', 'orden' => 5, 'permisos' => ['entregas.asignar']],
            ['titulo' => 'Entregas en Tránsito', 'ruta' => '/logistica/entregas/en-transito', 'icono' => 'TrendingUp', 'orden' => 6, 'permisos' => ['entregas.tracking']],
            ['titulo' => 'Vehículos', 'ruta' => '/inventario/vehiculos', 'icono' => 'Truck', 'orden' => 7, 'permisos' => ['inventario.vehiculos.index']],
            ['titulo' => 'Crear Vehículo', 'ruta' => '/inventario/vehiculos/create', 'icono' => 'Plus', 'orden' => 8, 'permisos' => ['inventario.vehiculos.create']],
        ];

        foreach ($submenuLogistica as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $logistica->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }

        // Módulo de proformas
        $proformas = ModuloSidebar::firstOrCreate(
            ['titulo' => 'proformas', 'ruta' => '/proformas', 'es_submenu' => false],
            [
                'icono'       => 'FileText',
                'descripcion' => 'Gestión de proformas',
                'orden'       => 7,
                'categoria'   => 'Comercial',
                'activo'      => true,
                'permisos'    => ['proformas.index'],
            ]
        );

        // Módulo de Reportes
        $reportes = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Reportes', 'ruta' => '/reportes/precios', 'es_submenu' => false],
            [
                'icono'       => 'BarChart4',
                'descripcion' => 'Reportes y análisis',
                'orden'       => 8,
                'categoria'   => 'Reportes',
                'activo'      => true,
                'permisos'    => ['reportes.precios.index'],
            ]
        );

        // Submódulos de Reportes
        $submenuReportes = [
            ['titulo' => 'Reportes de Precios', 'ruta' => '/reportes/precios', 'icono' => 'DollarSign', 'orden' => 1, 'permisos' => ['reportes.precios.index']],
            ['titulo' => 'Reportes de Ganancias', 'ruta' => '/reportes/ganancias', 'icono' => 'TrendingUp', 'orden' => 2, 'permisos' => ['reportes.ganancias.index']],
            ['titulo' => 'Stock Actual', 'ruta' => '/reportes/inventario/stock-actual', 'icono' => 'Package', 'orden' => 3, 'permisos' => ['reportes.inventario.stock-actual']],
            ['titulo' => 'Movimientos', 'ruta' => '/reportes/inventario/movimientos', 'icono' => 'ArrowUpDown', 'orden' => 4, 'permisos' => ['reportes.inventario.movimientos']],
            ['titulo' => 'Rotación', 'ruta' => '/reportes/inventario/rotacion', 'icono' => 'RotateCcw', 'orden' => 5, 'permisos' => ['reportes.inventario.rotacion']],
            ['titulo' => 'Vencimientos', 'ruta' => '/reportes/inventario/vencimientos', 'icono' => 'Calendar', 'orden' => 6, 'permisos' => ['reportes.inventario.vencimientos']],
        ];

        foreach ($submenuReportes as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $reportes->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }

        // Módulo de Contabilidad
        /* $contabilidad = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Contabilidad', 'ruta' => '/contabilidad/asientos', 'es_submenu' => false],
            [
                'icono'       => 'Calculator',
                'descripcion' => 'Gestión contable',
                'orden'       => 9,
                'categoria'   => 'Finanzas',
                'activo'      => true,
            ]
        );

        // Submódulos de Contabilidad
        $submenuContabilidad = [
            ['titulo' => 'Asientos Contables', 'ruta' => '/contabilidad/asientos', 'icono' => 'BookOpen', 'orden' => 1],
            ['titulo' => 'Balance de Comprobación', 'ruta' => '/contabilidad/reportes/balance-comprobacion', 'icono' => 'Scale', 'orden' => 2],
            ['titulo' => 'Libro Mayor', 'ruta' => '/contabilidad/reportes/libro-mayor', 'icono' => 'Book', 'orden' => 3],
        ];

        foreach ($submenuContabilidad as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $contabilidad->id,
                ],
                [
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
                ]
            );
        } */

        // Módulos principales sin submódulos
        $modulosPrincipales = [
            [
                'titulo'      => 'Gestión de Cajas',
                'ruta'        => '/cajas',
                'icono'       => 'Wallet',
                'descripcion' => 'Control de cajas y tesorería',
                'orden'       => 10,
                'categoria'   => 'Finanzas',
                'permisos'    => ['cajas.index'],
            ],
            [
                'titulo'      => 'Almacenes',
                'ruta'        => '/almacenes',
                'icono'       => 'Building2',
                'descripcion' => 'Gestión de almacenes',
                'orden'       => 11,
                'categoria'   => 'Logística',
                'permisos'    => ['almacenes.manage'],
            ],
            [
                'titulo'      => 'Proveedores',
                'ruta'        => '/proveedores',
                'icono'       => 'Users',
                'descripcion' => 'Gestión de proveedores',
                'orden'       => 12,
                'categoria'   => 'Comercial',
                'permisos'    => ['proveedores.manage'],
            ],
            [
                'titulo'      => 'Clientes',
                'ruta'        => '/clientes',
                'icono'       => 'UserCheck',
                'descripcion' => 'Gestión de clientes',
                'orden'       => 13,
                'categoria'   => 'Comercial',
                'permisos'    => ['clientes.manage'],
            ],
            [
                'titulo'      => 'Localidades',
                'ruta'        => '/localidades',
                'icono'       => 'MapPin',
                'descripcion' => 'Gestión de localidades',
                'orden'       => 14,
                'categoria'   => 'Configuración',
                'permisos'    => ['localidades.manage'],
            ],
            [
                'titulo'      => 'Monedas',
                'ruta'        => '/monedas',
                'icono'       => 'DollarSign',
                'descripcion' => 'Gestión de monedas',
                'orden'       => 15,
                'categoria'   => 'Configuración',
                'permisos'    => ['monedas.manage'],
            ],
            [
                'titulo'      => 'Tipo Pagos',
                'ruta'        => '/tipos-pago',
                'icono'       => 'CreditCard',
                'descripcion' => 'Gestión de tipos de pago',
                'orden'       => 16,
                'categoria'   => 'Configuración',
                'permisos'    => ['tipos-pago.manage'],
            ],
            [
                'titulo'      => 'Tipos de Documento',
                'ruta'        => '/tipos-documento',
                'icono'       => 'FileText',
                'descripcion' => 'Gestión de tipos de documento',
                'orden'       => 17,
                'categoria'   => 'Configuración',
                'permisos'    => ['tipos_documento.manage'],
            ],
        ];

        foreach ($modulosPrincipales as $modulo) {
            ModuloSidebar::firstOrCreate(
                ['titulo' => $modulo['titulo'], 'ruta' => $modulo['ruta'], 'es_submenu' => false],
                [
                    'icono'       => $modulo['icono'],
                    'descripcion' => $modulo['descripcion'],
                    'orden'       => $modulo['orden'],
                    'categoria'   => $modulo['categoria'],
                    'activo'      => true,
                    'permisos'    => $modulo['permisos'],
                ]
            );
        }

        // Módulo de Administración
        $administracion = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Administración', 'ruta' => '/usuarios', 'es_submenu' => false],
            [
                'icono'       => 'Settings',
                'descripcion' => 'Configuración del sistema',
                'orden'       => 18,
                'categoria'   => 'Administración',
                'activo'      => true,
                'permisos'    => ['usuarios.index'],
            ]
        );

        // Submódulos de Administración
        $submenuAdministracion = [
            ['titulo' => 'Usuarios', 'ruta' => '/usuarios', 'icono' => 'Users', 'orden' => 1, 'permisos' => ['usuarios.index']],
            ['titulo' => 'Roles', 'ruta' => '/roles', 'icono' => 'Shield', 'orden' => 2, 'permisos' => ['roles.index']],
            ['titulo' => 'Permisos', 'ruta' => '/permisos', 'icono' => 'Key', 'orden' => 3, 'permisos' => ['permissions.index']],
            ['titulo' => 'Backup de Imágenes', 'ruta' => '/admin/image-backup', 'icono' => 'HardDrive', 'orden' => 4, 'permisos' => ['admin.image-backup.manage']],
            // ['titulo' => 'Módulos Sidebar', 'ruta' => '/modulos-sidebar', 'icono' => 'Layout', 'orden' => 5],
            // ['titulo' => 'Configuración Global', 'ruta' => '/configuracion-global', 'icono' => 'Cog', 'orden' => 6, 'permisos' => ['configuracion-global.index']],
        ];

        foreach ($submenuAdministracion as $submenu) {
            ModuloSidebar::firstOrCreate(
                [
                    'titulo'          => $submenu['titulo'],
                    'ruta'            => $submenu['ruta'],
                    'es_submenu'      => true,
                    'modulo_padre_id' => $administracion->id,
                ],
                [
                    'icono'    => $submenu['icono'],
                    'orden'    => $submenu['orden'],
                    'activo'   => true,
                    'permisos' => $submenu['permisos'],
                ]
            );
        }
    }
}
