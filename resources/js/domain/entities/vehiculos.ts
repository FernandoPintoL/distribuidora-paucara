// Domain: Vehiculos
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Vehiculo extends BaseEntity {
  id: Id;
  placa: string;
  modelo: string;
  marca?: string | null;
  año?: number | null;
  capacidad_carga?: number | null;
  activo: boolean;
  chofer_id?: Id;

  // Relaciones
  chofer?: Chofer;
}

export interface Chofer extends BaseEntity {
  id: Id;
  user_id: Id;
  telefono?: string | null;
  licencia?: string | null;
  tipo_licencia?: string | null;
  fecha_vencimiento_licencia?: string | null;

  // Relaciones
  user: {
    id: Id;
    name: string;
    email?: string;
  };
}

export interface VehiculoFormData extends BaseFormData {
  id?: Id;
  placa: string;
  modelo: string;
  marca?: string | null;
  año?: number | null;
  capacidad_carga?: number | null;
  activo?: boolean;
  chofer_id?: Id | '';
}

export interface ChoferFormData extends BaseFormData {
  id?: Id;
  user_id: Id | '';
  telefono?: string | null;
  licencia?: string | null;
  tipo_licencia?: string | null;
  fecha_vencimiento_licencia?: string | null;
}
