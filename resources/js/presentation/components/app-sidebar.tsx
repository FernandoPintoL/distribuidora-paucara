import { NavFooter } from '@/presentation/components/nav-footer';
import { NavMain } from '@/presentation/components/nav-main';
import { NavUser } from '@/presentation/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/presentation/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import React, { useEffect, useState, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppLogo from './app-logo';

// Mapeo dinámico de TODOS los iconos de Lucide
// Simplemente asignamos todo lo que se exporta de lucide-react como LucideIcon
const iconMap = LucideIcons as unknown as Record<string, LucideIcon>;

// Debug: Ver cuántos iconos se cargaron y qué tipo son
const availableIcons = Object.keys(iconMap).filter(key =>
    key[0] === key[0].toUpperCase() && // Empieza con mayúscula
    !['Icon', 'createLucideIcon', 'default'].includes(key) // No es helper
);

/* console.log('[AppSidebar] Total de iconos disponibles:', availableIcons.length);
console.log('[AppSidebar] Primeros 10 iconos disponibles:', availableIcons.slice(0, 10));
console.log('[AppSidebar] Ejemplo de icono (Package):', iconMap['Package']);
console.log('[AppSidebar] Tipo de Package:', typeof iconMap['Package']); */

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
        return modules.map((module) => {
            // Debug: Ver qué icono se está buscando
            if (module.icon) {
                const iconFound = iconMap[module.icon];
                // console.log(`[AppSidebar] Módulo "${module.title}" - Icono buscado: "${module.icon}" - ${iconFound ? '✅ Encontrado' : '❌ NO ENCONTRADO'}`);
                if (!iconFound) {
                    console.log(`[AppSidebar] Iconos disponibles que empiezan con "${module.icon[0]}":`, Object.keys(iconMap).filter(k => k.startsWith(module.icon[0])).slice(0, 5));
                }
            }

            return {
                title: module.title,
                href: module.href,
                icon: module.icon && iconMap[module.icon] ? iconMap[module.icon] : null,
                children: module.children ? processModules(module.children) : undefined,
            };
        });
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
