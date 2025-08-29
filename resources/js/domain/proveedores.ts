// Domain: Proveedores
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Proveedor extends BaseEntity {
  id: Id;
  nombre: string;
  ruc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  contacto?: string | null;
  activo: boolean;
}

export interface ProveedorFormData extends BaseFormData {
  id?: Id;
  nombre: string;
  ruc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  contacto?: string | null;
  activo?: boolean;
}
