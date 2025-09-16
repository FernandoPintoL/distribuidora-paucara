// Domain: Clientes
import type { BaseEntity, BaseFormData } from './generic';
import type { Id } from './shared';

export interface Cliente extends BaseEntity {
    id: Id;
    nombre: string;
    razon_social?: string | null;
    nit?: string | null;
    telefono?: string | null;
    email?: string | null;
    foto_perfil?: string | null;
    ci_anverso?: string | null;
    ci_reverso?: string | null;
    localidad_id?: Id | null;
    latitud?: number | null;
    longitud?: number | null;
    codigo_cliente?: string | null;
    activo: boolean;
    localidad?: {
        id: Id;
        nombre: string;
        codigo: string;
    } | null;
}

export interface ClienteFormData extends BaseFormData {
    id?: Id;
    nombre: string;
    razon_social?: string | null;
    nit?: string | null;
    telefono?: string | null;
    email?: string | null;
    foto_perfil?: File | string | null;
    ci_anverso?: File | string | null;
    ci_reverso?: File | string | null;
    localidad_id?: Id | null;
    latitud?: number | null;
    longitud?: number | null;
    activo?: boolean;
}
