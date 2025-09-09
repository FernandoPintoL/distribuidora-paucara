// Domain: Proveedores
import type { BaseEntity, BaseFormData } from './generic';
import type { Id } from './shared';

export interface Proveedor extends BaseEntity {
    id: Id;
    nombre: string;
    razon_social: string;
    nit?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    contacto?: string | null;
    foto_perfil?: string | null;
    ci_anverso?: string | null;
    ci_reverso?: string | null;
    activo: boolean;
}

export interface ProveedorFormData extends BaseFormData {
    id?: Id;
    nombre: string;
    razon_social: string;
    nit?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    contacto?: string | null;
    foto_perfil?: File | string | null;
    ci_anverso?: File | string | null;
    ci_reverso?: File | string | null;
    activo?: boolean;
}
