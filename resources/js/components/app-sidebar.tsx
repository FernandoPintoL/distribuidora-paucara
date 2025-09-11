import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Package,
    Boxes,
    Users,
    Truck,
    Wallet,
    CreditCard,
    ShoppingCart,
    TrendingUp,
    BarChart3,
    Settings,
    FolderTree,
    Tags,
    Ruler,
    DollarSign,
    Building2,
    ClipboardList
} from 'lucide-react';
import AppLogo from './app-logo';

import Controllers from '@/actions/App/Http/Controllers';

const mainNavItems: NavItem[] = [
    {
        title: 'Productos',
        href: Controllers.ProductoController.index().url,
        icon: Package,
        children: [
            { title: 'Productos', href: Controllers.ProductoController.index().url, icon: Package },
            { title: 'Categorías', href: Controllers.CategoriaController.index().url, icon: FolderTree },
            { title: 'Marcas', href: Controllers.MarcaController.index().url, icon: Tags },
            { title: 'Unidades', href: Controllers.UnidadMedidaController.index().url, icon: Ruler },
            { title: 'Tipo Precios', href: Controllers.TipoPrecioController.index().url, icon: DollarSign },
        ],
    },
    {
        title: 'Inventario',
        href: Controllers.InventarioController.dashboard().url,
        icon: Boxes,
        children: [
            { title: 'Dashboard', href: Controllers.InventarioController.dashboard().url, icon: BarChart3 },
            { title: 'Stock Bajo', href: Controllers.InventarioController.stockBajo().url, icon: TrendingUp },
            { title: 'Próximos a Vencer', href: Controllers.InventarioController.proximosVencer().url, icon: ClipboardList },
            { title: 'Productos Vencidos', href: Controllers.InventarioController.vencidos().url, icon: ClipboardList },
            { title: 'Movimientos', href: Controllers.InventarioController.movimientos().url, icon: TrendingUp },
            { title: 'Ajustes', href: Controllers.InventarioController.ajusteForm().url, icon: Settings },
        ],
    },
    {
        title: 'Ventas',
        href: '/ventas',
        icon: ShoppingCart,
        children: [
            { title: 'Lista de Ventas', href: '/ventas', icon: ShoppingCart },
            { title: 'Nueva Venta', href: '/ventas/create', icon: ShoppingCart },
        ],
    },
    {
        title: 'Compras',
        href: '/compras',
        icon: Truck,
        children: [
            { title: 'Lista de Compras', href: '/compras', icon: Truck },
            { title: 'Nueva Compra', href: '/compras/create', icon: Truck },
        ],
    },
    { title: 'Almacenes', href: Controllers.AlmacenController.index().url, icon: Building2 },
    { title: 'Proveedores', href: Controllers.ProveedorController.index().url, icon: Truck },
    { title: 'Clientes', href: Controllers.ClienteController.index().url, icon: Users },
    { title: 'Monedas', href: Controllers.MonedaController.index().url, icon: Wallet },
    { title: 'Tipo Pagos', href: Controllers.TipoPagoController.index().url, icon: CreditCard },
];

const footerNavItems: NavItem[] = [
    /* {
        title: 'Configuración',
        href: Controllers.ConfiguracionGlobalController.index().url,
        icon: Settings,
    }, */
    /*{
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },*/
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
