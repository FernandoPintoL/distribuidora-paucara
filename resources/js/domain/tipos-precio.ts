// Domain: Tipos de precio domain types
import type { BaseEntity, BaseFormData } from '@/domain/generic';

export interface TipoPrecio extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  color: string;
  es_ganancia: boolean;
  es_precio_base: boolean;
  orden: number;
  activo: boolean;
  es_sistema: boolean;
  precios_count: number;
  configuracion: {
    icono?: string;
    tooltip?: string;
  };
}

export interface TipoPrecioFormData extends BaseFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  color: string;
  es_ganancia: boolean;
  es_precio_base: boolean;
  orden: number;
  activo: boolean;
}
