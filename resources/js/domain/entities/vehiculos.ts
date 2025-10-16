import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Vehiculo extends BaseEntity {
    id: Id;
    placa: string;
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    capacidad_kg?: number | null;
    capacidad_volumen?: number | null;
    estado?: string | null;
    activo?: boolean;
    chofer_asignado_id?: number | null;
    observaciones?: string | null;
}

export interface VehiculoFormData extends BaseFormData {
    id?: Id;
    placa: string;
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    capacidad_kg?: number | null;
    capacidad_volumen?: number | null;
    estado?: string | null;
    activo?: boolean;
    chofer_asignado_id?: number | null;
    observaciones?: string | null;
}
