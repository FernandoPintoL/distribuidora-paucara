// Domain: Envios
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Envio extends BaseEntity {
    id: Id;
    numero_envio: string;
    venta_id: Id;
    vehiculo_id?: Id;
    chofer_id?: Id;
    fecha_programada: string;
    fecha_entrega?: string;
    direccion_entrega: string;
    estado: 'PROGRAMADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';
    observaciones?: string;

    // Relaciones
    venta?: unknown; // Evitar dependencias circulares con Venta
    vehiculo?: unknown;
    chofer?: unknown;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface EnvioFormData extends BaseFormData {
    id?: Id;
    numero_envio: string;
    venta_id: Id;
    vehiculo_id?: Id;
    chofer_id?: Id;
    fecha_programada: string;
    fecha_entrega?: string;
    direccion_entrega: string;
    estado: 'PROGRAMADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';
    observaciones?: string;
}