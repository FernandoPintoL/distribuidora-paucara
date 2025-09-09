import { useState } from 'react';
import { Link } from '@inertiajs/react';
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
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

interface NavMainProps {
    items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
    // Estado para controlar qué elementos están expandidos
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
            {/*<SidebarGroupLabel></SidebarGroupLabel>*/}
            <SidebarMenu>
                {items.map((item) => {
                    const isExpanded = expandedItems.has(item.title);
                    const hasChildren = item.children && item.children.length > 0;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild={!hasChildren}
                                onClick={hasChildren ? () => toggleExpanded(item.title) : undefined}
                                className={cn(
                                    hasChildren && "cursor-pointer",
                                    "group flex items-center justify-between w-full"
                                )}
                            >
                                {hasChildren ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 transition-transform" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 transition-transform" />
                                        )}
                                    </div>
                                ) : (
                                    <Link href={item.href}>
                                        {item.icon && <item.icon className="h-4 w-4" />}
                                        <span>{item.title}</span>
                                    </Link>
                                )}
                            </SidebarMenuButton>

                            {hasChildren && isExpanded && (
                                <SidebarMenuSub>
                                    {item.children!.map((child) => (
                                        <SidebarMenuSubItem key={child.title}>
                                            <SidebarMenuSubButton asChild>
                                                <Link href={child.href}>
                                                    {child.icon && <child.icon className="h-4 w-4" />}
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
