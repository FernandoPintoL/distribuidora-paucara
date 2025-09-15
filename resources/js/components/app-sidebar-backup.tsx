import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import AppLogo from './app-logo';
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
    ClipboardList,
} from 'lucide-react';

// Componente para mostrar iconos dinámicos
const DynamicIcon = ({ iconName, ...props }: { iconName?: string;[key: string]: unknown }) => {
    if (!iconName) return null;

    // Mapeo de nombres de iconos a componentes
    const iconMap: Record<string, React.ComponentType> = {
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
        ClipboardList,
    };

    const IconComponent = iconMap[iconName];
    if (!IconComponent) return null;

    return <IconComponent {...props} />;
};

// Hook personalizado para obtener módulos del sidebar
const useSidebarModules = () => {
    const [modules, setModules] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await fetch('/api/modulos-sidebar');
                if (!response.ok) {
                    throw new Error('Error al cargar módulos del sidebar');
                }
                const data = await response.json();

                // Convertir los iconos de string a componentes
                const processedModules = data.map((module: {
                    title: string;
                    href: string;
                    icon: string;
                    children?: Array<{
                        title: string;
                        href: string;
                        icon: string;
                    }>;
                }) => ({
                    ...module,
                    icon: module.icon ? DynamicIcon : undefined,
                    iconName: module.icon,
                    children: module.children?.map((child: {
                        title: string;
                        href: string;
                        icon: string;
                    }) => ({
                        ...child,
                        icon: child.icon ? DynamicIcon : undefined,
                        iconName: child.icon,
                    }))
                }));

                setModules(processedModules);
            } catch (err) {
                console.error('Error fetching sidebar modules:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
                // Fallback a módulos estáticos en caso de error
                setModules([]);
            } finally {
                setLoading(false);
            }
        };

        fetchModules();
    }, []);

    return { modules, loading, error };
};

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
    const { modules, loading, error } = useSidebarModules();

    // Mientras carga, mostrar esqueleto o spinner
    if (loading) {
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
                    <div className="space-y-2 p-2">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ))}
                    </div>
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        );
    }

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
                {error ? (
                    <div className="p-4 text-sm text-red-600 dark:text-red-400">
                        <p>Error al cargar módulos:</p>
                        <p className="text-xs">{error}</p>
                    </div>
                ) : (
                    <NavMain items={modules} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
