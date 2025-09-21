import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import React, { useEffect, useState, useCallback } from 'react';
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
    LucideIcon
} from 'lucide-react';
import AppLogo from './app-logo';

// Mapeo de nombres de iconos a componentes
const iconMap: Record<string, LucideIcon> = {
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

// Tipos para los módulos de la API
interface ModuloAPI {
    title: string;
    href: string;
    icon?: string;
    children?: ModuloAPI[];
}

// Hook personalizado para obtener módulos del sidebar
const useSidebarModules = () => {
    const [modules, setModules] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const processModules = useCallback((modules: ModuloAPI[]): NavItem[] => {
        return modules.map((module) => ({
            title: module.title,
            href: module.href,
            icon: module.icon && iconMap[module.icon] ? iconMap[module.icon] : null,
            children: module.children ? processModules(module.children) : undefined,
        }));
    }, []);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await fetch('/api/modulos-sidebar', { credentials: 'include' });
                if (!response.ok) {
                    throw new Error('Error al cargar módulos del sidebar');
                }
                const data: ModuloAPI[] = await response.json();

                const processedModules = processModules(data);
                setModules(processedModules);
            } catch (err) {
                console.error('Error fetching sidebar modules:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
                // Fallback a módulos vacíos en caso de error
                setModules([]);
            } finally {
                setLoading(false);
            }
        };

        fetchModules();
    }, [processModules]);

    return { modules, loading, error };
};

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { modules, loading, error } = useSidebarModules();

    // Mientras carga, mostrar esqueleto
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