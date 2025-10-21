// Domain: Clientes
import type { BaseEntity, BaseFormData } from './generic';
import type { Id } from './shared';

export interface VentanaEntregaCliente {
    id?: Id;
    cliente_id?: Id;
    dia_semana: number; // 0 = domingo, 1 = lunes ... 6 = sábado
    hora_inicio: string; // Format: HH:mm
    hora_fin: string; // Format: HH:mm
    activo?: boolean;
}

export interface Cliente extends BaseEntity {
    id: Id;
    nombre: string;
    razon_social?: string | null;
    nit?: string | null;
    telefono?: string | null;
    email?: string | null;
    foto_perfil?: string | null;
    foto_perfil_url?: string | null; // URL generada para mostrar en el listado
    ci_anverso?: string | null;
    ci_reverso?: string | null;
    localidad_id?: Id | null;
    codigo_cliente?: string | null;
    activo: boolean;
    localidad?: {
        id: Id;
        nombre: string;
        codigo: string;
    } | null;
    direcciones?: Array<{
        id?: Id;
        direccion: string;
        latitud: number;
        longitud: number;
        observaciones?: string | null;
        es_principal?: boolean;
        activa?: boolean;
    }>;
    ventanas_entrega?: VentanaEntregaCliente[];
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
    activo?: boolean;
    // Direcciones anidadas del cliente
    direcciones?: Array<{
        id?: Id;
        direccion: string;
        latitud: number;
        longitud: number;
        observaciones?: string | null;
        es_principal?: boolean;
        activa?: boolean;
    }>;
    // Ventanas de entrega del cliente
    ventanas_entrega?: VentanaEntregaCliente[];
}
