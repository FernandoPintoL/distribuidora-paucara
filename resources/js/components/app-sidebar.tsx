import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Folder } from 'lucide-react';
import AppLogo from './app-logo';

import Controllers from '@/actions/App/Http/Controllers';

const mainNavItems: NavItem[] = [
    {
        title: 'Productos',
        href: Controllers.ProductoController.index().url,
        icon: Folder,
        children: [
            { title: 'Productos', href: Controllers.ProductoController.index().url, icon: Folder },
            { title: 'Categorías', href: Controllers.CategoriaController.index().url, icon: Folder },
            { title: 'Marcas', href: Controllers.MarcaController.index().url, icon: Folder },
            { title: 'Unidades', href: Controllers.UnidadMedidaController.index().url, icon: Folder },
            { title: 'Tipo Precios', href: Controllers.TipoPrecioController.index().url, icon: Folder },
        ],
    },
    { title: 'Almacenes', href: Controllers.AlmacenController.index().url, icon: Folder },
    { title: 'Proveedores', href: Controllers.ProveedorController.index().url, icon: Folder },
    { title: 'Monedas', href: Controllers.MonedaController.index().url, icon: Folder },
];

const footerNavItems: NavItem[] = [
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
