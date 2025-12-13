// Domain: Tipos de Pago
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface TipoPago extends BaseEntity {
  id: Id;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface TipoPagoFormData extends BaseFormData {
  id?: Id;
  codigo: string;
  nombre: string;
  activo?: boolean;
}
