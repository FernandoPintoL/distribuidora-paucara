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
        $productos = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Productos', 'ruta' => '/productos', 'es_submenu' => false],
            [
                'icono'       => 'Package',
                'descripcion' => 'Gestión de productos y catálogo',
                'orden'       => 1,
                'categoria'   => 'Inventario',
                'activo'      => true,
            ]
        );

        // Submódulos de Productos
        $submenuProductos = [
            ['titulo' => 'Listado de Productos', 'ruta' => '/productos', 'icono' => 'Package', 'orden' => 1],
            ['titulo' => 'Categorías', 'ruta' => '/categorias', 'icono' => 'FolderTree', 'orden' => 2],
            ['titulo' => 'Marcas', 'ruta' => '/marcas', 'icono' => 'Tags', 'orden' => 3],
            ['titulo' => 'Unidades', 'ruta' => '/unidades', 'icono' => 'Ruler', 'orden' => 4],
            ['titulo' => 'Tipo Precios', 'ruta' => '/tipos-precio', 'icono' => 'DollarSign', 'orden' => 5],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
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
            ]
        );

        // Submódulos de Inventario
        $submenuInventario = [
            ['titulo' => 'Dashboard', 'ruta' => '/inventario/dashboard', 'icono' => 'BarChart3', 'orden' => 1],
            ['titulo' => 'Stock Bajo', 'ruta' => '/inventario/stock-bajo', 'icono' => 'TrendingDown', 'orden' => 2],
            ['titulo' => 'Próximos a Vencer', 'ruta' => '/inventario/proximos-vencer', 'icono' => 'Calendar', 'orden' => 3],
            ['titulo' => 'Productos Vencidos', 'ruta' => '/inventario/vencidos', 'icono' => 'AlertTriangle', 'orden' => 4],
            ['titulo' => 'Movimientos', 'ruta' => '/inventario/movimientos', 'icono' => 'ArrowUpDown', 'orden' => 5],
            ['titulo' => 'Transferencias', 'ruta' => '/inventario/transferencias', 'icono' => 'ArrowRightLeft', 'orden' => 6],
            ['titulo' => 'Mermas', 'ruta' => '/inventario/mermas', 'icono' => 'Package2', 'orden' => 7],
            ['titulo' => 'Ajustes', 'ruta' => '/inventario/ajuste', 'icono' => 'Settings', 'orden' => 8],
            ['titulo' => 'Reportes', 'ruta' => '/inventario/reportes', 'icono' => 'FileText', 'orden' => 9],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
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
            ]
        );

        // Submódulos de Ventas
        $submenuVentas = [
            ['titulo' => 'Lista de Ventas', 'ruta' => '/ventas', 'icono' => 'List', 'orden' => 1],
            ['titulo' => 'Nueva Venta', 'ruta' => '/ventas/create', 'icono' => 'Plus', 'orden' => 2],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
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
            ]
        );

        // Submódulos de Compras
        $submenuCompras = [
            ['titulo' => 'Lista de Compras', 'ruta' => '/compras', 'icono' => 'List', 'orden' => 1],
            ['titulo' => 'Nueva Compra', 'ruta' => '/compras/create', 'icono' => 'Plus', 'orden' => 2],
            ['titulo' => 'Cuentas por Pagar', 'ruta' => '/compras/cuentas-por-pagar', 'icono' => 'CreditCard', 'orden' => 3],
            ['titulo' => 'Pagos', 'ruta' => '/compras/pagos', 'icono' => 'DollarSign', 'orden' => 4],
            ['titulo' => 'Lotes y Vencimientos', 'ruta' => '/compras/lotes-vencimientos', 'icono' => 'Calendar', 'orden' => 5],
            ['titulo' => 'Reportes', 'ruta' => '/compras/reportes', 'icono' => 'FileText', 'orden' => 6],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
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
            ]
        );

        // Submódulos de Empleados
        $submenuEmpleados = [
            ['titulo' => 'Lista de Empleados', 'ruta' => '/empleados', 'icono' => 'Users', 'orden' => 1],
            ['titulo' => 'Nuevo Empleado', 'ruta' => '/empleados/create', 'icono' => 'UserPlus', 'orden' => 2],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
                ]
            );
        }

        // Módulo de Logística
        $logistica = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Logística', 'ruta' => '/logistica/dashboard', 'es_submenu' => false],
            [
                'icono'       => 'Truck',
                'descripcion' => 'Gestión de envíos y logística',
                'orden'       => 6,
                'categoria'   => 'Logística',
                'activo'      => true,
            ]
        );

        // Submódulos de Logística
        $submenuLogistica = [
            ['titulo' => 'Dashboard Logística', 'ruta' => '/logistica/dashboard', 'icono' => 'BarChart3', 'orden' => 1],
            ['titulo' => 'Envíos', 'ruta' => '/envios', 'icono' => 'Package', 'orden' => 2],
            ['titulo' => 'Nuevo Envío', 'ruta' => '/envios/create', 'icono' => 'Plus', 'orden' => 3],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
                ]
            );
        }

        // Módulo de Proformas
        $proformas = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Proformas', 'ruta' => '/proformas', 'es_submenu' => false],
            [
                'icono'       => 'FileText',
                'descripcion' => 'Gestión de proformas',
                'orden'       => 7,
                'categoria'   => 'Comercial',
                'activo'      => true,
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
            ]
        );

        // Submódulos de Reportes
        $submenuReportes = [
            ['titulo' => 'Reportes de Precios', 'ruta' => '/reportes/precios', 'icono' => 'DollarSign', 'orden' => 1],
            ['titulo' => 'Reportes de Ganancias', 'ruta' => '/reportes/ganancias', 'icono' => 'TrendingUp', 'orden' => 2],
            ['titulo' => 'Stock Actual', 'ruta' => '/reportes/inventario/stock-actual', 'icono' => 'Package', 'orden' => 3],
            ['titulo' => 'Movimientos', 'ruta' => '/reportes/inventario/movimientos', 'icono' => 'ArrowUpDown', 'orden' => 4],
            ['titulo' => 'Rotación', 'ruta' => '/reportes/inventario/rotacion', 'icono' => 'RotateCcw', 'orden' => 5],
            ['titulo' => 'Vencimientos', 'ruta' => '/reportes/inventario/vencimientos', 'icono' => 'Calendar', 'orden' => 6],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
                ]
            );
        }

        // Módulo de Contabilidad
        $contabilidad = ModuloSidebar::firstOrCreate(
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
        }

        // Módulos principales sin submódulos
        $modulosPrincipales = [
            [
                'titulo'      => 'Gestión de Cajas',
                'ruta'        => '/cajas',
                'icono'       => 'Wallet',
                'descripcion' => 'Control de cajas y tesorería',
                'orden'       => 10,
                'categoria'   => 'Finanzas',
            ],
            [
                'titulo'      => 'Almacenes',
                'ruta'        => '/almacenes',
                'icono'       => 'Building2',
                'descripcion' => 'Gestión de almacenes',
                'orden'       => 11,
                'categoria'   => 'Logística',
            ],
            [
                'titulo'      => 'Proveedores',
                'ruta'        => '/proveedores',
                'icono'       => 'Users',
                'descripcion' => 'Gestión de proveedores',
                'orden'       => 12,
                'categoria'   => 'Comercial',
            ],
            [
                'titulo'      => 'Clientes',
                'ruta'        => '/clientes',
                'icono'       => 'UserCheck',
                'descripcion' => 'Gestión de clientes',
                'orden'       => 13,
                'categoria'   => 'Comercial',
            ],
            [
                'titulo'      => 'Monedas',
                'ruta'        => '/monedas',
                'icono'       => 'DollarSign',
                'descripcion' => 'Gestión de monedas',
                'orden'       => 14,
                'categoria'   => 'Configuración',
            ],
            [
                'titulo'      => 'Tipo Pagos',
                'ruta'        => '/tipos-pago',
                'icono'       => 'CreditCard',
                'descripcion' => 'Gestión de tipos de pago',
                'orden'       => 15,
                'categoria'   => 'Configuración',
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
                ]
            );
        }

        // Módulo de Administración
        $administracion = ModuloSidebar::firstOrCreate(
            ['titulo' => 'Administración', 'ruta' => '/usuarios', 'es_submenu' => false],
            [
                'icono'       => 'Settings',
                'descripcion' => 'Configuración del sistema',
                'orden'       => 16,
                'categoria'   => 'Administración',
                'activo'      => true,
            ]
        );

        // Submódulos de Administración
        $submenuAdministracion = [
            ['titulo' => 'Usuarios', 'ruta' => '/usuarios', 'icono' => 'Users', 'orden' => 1],
            ['titulo' => 'Roles', 'ruta' => '/roles', 'icono' => 'Shield', 'orden' => 2],
            ['titulo' => 'Permisos', 'ruta' => '/permissions', 'icono' => 'Key', 'orden' => 3],
            ['titulo' => 'Módulos Sidebar', 'ruta' => '/modulos-sidebar', 'icono' => 'Layout', 'orden' => 4],
            ['titulo' => 'Configuración Global', 'ruta' => '/configuracion-global', 'icono' => 'Cog', 'orden' => 5],
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
                    'icono'  => $submenu['icono'],
                    'orden'  => $submenu['orden'],
                    'activo' => true,
                ]
            );
        }
    }
}
