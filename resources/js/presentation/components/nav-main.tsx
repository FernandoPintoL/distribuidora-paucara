import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/presentation/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { InertiaLinkProps } from '@inertiajs/react';

interface NavMainProps {
    items: NavItem[];
}

// Helper function to extract URL string from href
const getUrlString = (href: NonNullable<InertiaLinkProps['href']>): string => {
    if (typeof href === 'string') {
        return href;
    }
    // If it's an object with url property (UrlMethodPair)
    return href.url || '';
};

export function NavMain({ items }: NavMainProps) {
    const { url } = usePage();
    const { state } = useSidebar();
    // Estado para controlar qué elementos están expandidos
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Función para verificar si una URL está activa
    const isActive = (href: NonNullable<InertiaLinkProps['href']>) => {
        const urlString = getUrlString(href);
        if (urlString === '/') return url === '/';
        return url.startsWith(urlString);
    };

    // Función para verificar si un item padre debe estar activo
    const isParentActive = (item: NavItem) => {
        if (isActive(item.href)) return true;
        if (item.children) {
            return item.children.some(child => isActive(child.href));
        }
        return false;
    };

    // Expandir automáticamente los items activos al cargar
    useEffect(() => {
        const activeParents = new Set<string>();
        items.forEach(item => {
            if (item.children && item.children.some(child => {
                const childUrlString = getUrlString(child.href);
                if (childUrlString === '/') return url === '/';
                return url.startsWith(childUrlString);
            })) {
                activeParents.add(item.title);
            }
        });
        setExpandedItems(activeParents);
    }, [url, items]);

    const toggleExpanded = (title: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(title)) {
                newSet.delete(title);
            } else {
                newSet.add(title);
            }
            return newSet;
        });
    };

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Navegación Principal</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isExpanded = expandedItems.has(item.title);
                    const hasChildren = item.children && item.children.length > 0;
                    const itemActive = isParentActive(item);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild={!hasChildren}
                                onClick={hasChildren ? () => toggleExpanded(item.title) : undefined}
                                className={cn(
                                    "group flex items-center justify-between w-full transition-colors",
                                    hasChildren && "cursor-pointer hover:bg-sidebar-accent",
                                    itemActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                )}
                                data-active={itemActive}
                                tooltip={state === "collapsed" ? item.title : undefined}
                            >
                                {hasChildren ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            {item.icon && (
                                                <item.icon className={cn(
                                                    "h-4 w-4 transition-colors",
                                                    itemActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70"
                                                )} />
                                            )}
                                            <span className="font-medium">{item.title}</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 w-full",
                                            isActive(item.href) && "text-sidebar-accent-foreground font-medium"
                                        )}
                                    >
                                        {item.icon && (
                                            <item.icon className={cn(
                                                "h-4 w-4 transition-colors",
                                                isActive(item.href) ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70"
                                            )} />
                                        )}
                                        <span className="font-medium">{item.title}</span>
                                    </Link>
                                )}
                            </SidebarMenuButton>

                            {hasChildren && isExpanded && (
                                <SidebarMenuSub className="animate-in slide-in-from-top-1 duration-200">
                                    {item.children!.map((child) => (
                                        <SidebarMenuSubItem key={child.title}>
                                            <SidebarMenuSubButton
                                                asChild
                                                className={cn(
                                                    "transition-colors",
                                                    isActive(child.href) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                                )}
                                                data-active={isActive(child.href)}
                                            >
                                                <Link
                                                    href={child.href}
                                                    className="flex items-center gap-3"
                                                >
                                                    {child.icon && (
                                                        <child.icon className={cn(
                                                            "h-3.5 w-3.5 transition-colors",
                                                            isActive(child.href) ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/60"
                                                        )} />
                                                    )}
                                                    <span>{child.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
