// Domain: Sectores
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Sector extends BaseEntity {
  id: Id;
  almacen_id: Id;
  nombre: string;
  es_generico: boolean;
  descripcion?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SectorFormData extends BaseFormData {
  id?: Id;
  almacen_id: Id;
  nombre: string;
  es_generico?: boolean;
  descripcion?: string | null;
}

// Para mostrar nombre formateado en selects
export interface SectorSelect extends Sector {
  label?: string;
  value?: Id;
}
