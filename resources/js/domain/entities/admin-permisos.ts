// Domain: Admin - Gestión de Permisos
import type { Id } from './shared';
import type { BaseEntity } from './generic';

export interface AdminUsuario {
    id: Id;
    name: string;
    email: string;
    roles?: string[];
    permissions_count?: number;
}

export interface AdminRol {
    id: Id;
    name: string;
    display_name: string;
    description?: string;
    permissions_count?: number;
}

export interface PermisoAudit extends BaseEntity {
    id: Id;
    admin: {
        id: Id;
        name: string;
        email: string;
    };
    target_type: string;
    target_id: Id;
    target_name: string;
    action: string;
    descripcion: string;
    permisos_changed: number;
    ip_address: string;
    created_at: string;
}

export interface Permission extends BaseEntity {
    id: Id;
    name: string;
    description?: string;
    guard_name: string;
    roles_count?: number;
    users_count?: number;
    created_at?: string;
    roles?: Array<{
        id: Id;
        name: string;
    }>;
}

export interface PermissionGroup {
    module: string;
    permissions: Permission[];
}

// =============== PAGE PROPS ===============

export interface AdminPermisosIndexPageProps {
    [key: string]: unknown;
}

export interface AdminPermisosUsuarioPageProps {
    usuario: AdminUsuario;
    permissions: Array<{
        id: Id;
        name: string;
        checked: boolean;
        category?: string;
    }>;
    [key: string]: unknown;
}

export interface AdminPermisosRolPageProps {
    rol: AdminRol;
    permissions: Array<{
        id: Id;
        name: string;
        checked: boolean;
        category?: string;
    }>;
    [key: string]: unknown;
}
