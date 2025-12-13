/**
 * Tipos del dominio de Módulos
 * Centralizados en un único lugar para evitar duplicación
 */

export interface ModuloSidebar {
    id: number;
    titulo: string;
    ruta: string;
    icono?: string;
    descripcion?: string;
    orden: number;
    activo: boolean;
    es_submenu: boolean;
    modulo_padre_id?: number;
    categoria?: string;
    color?: string;
    visible_dashboard?: boolean;
    permisos?: string[];
    submodulos_count: number;
    padre?: {
        id: number;
        titulo: string;
    };
}

export interface FiltrosModulo {
    busqueda: string;
    tipo: 'todos' | 'principal' | 'submenu';
    estado: 'todos' | 'activo' | 'inactivo';
    categoria: string;
    rolRequerido: string;
}

export type VistaActual = 'tabla' | 'agrupada' | 'lista';

export interface ModuloFormData {
    titulo: string;
    ruta: string;
    icono: string;
    descripcion: string;
    orden: number;
    activo: boolean;
    es_submenu: boolean;
    modulo_padre_id: string;
    categoria: string;
    visible_dashboard: boolean;
    permisos: string[];
    color?: string;
}

export interface ModulosProps {
    modulos: ModuloSidebar[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: string;
    children?: NavItem[];
}
