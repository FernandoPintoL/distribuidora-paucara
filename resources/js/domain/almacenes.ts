// Domain: Almacenes
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Almacen extends BaseEntity {
  id: Id;
  nombre: string;
  codigo: string;
  direccion?: string | null;
  descripcion?: string | null;
  activo: boolean;
}

export interface AlmacenFormData extends BaseFormData {
  id?: Id;
  nombre: string;
  codigo: string;
  direccion?: string | null;
  descripcion?: string | null;
  activo?: boolean;
}
