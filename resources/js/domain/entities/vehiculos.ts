// Domain: Vehiculos
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Vehiculo extends BaseEntity {
  id: Id;
  placa: string;
  modelo: string;
  marca?: string | null;
  anho?: string | null;
  capacidad_kg?: number | null;
  capacidad_volumen?: number | null;
  estado?: string;
  activo: boolean;
  chofer_asignado_id?: Id | null;
  observaciones?: string | null;

  // Relaciones
  choferAsignado?: {
    id: Id;
    name: string;
  };
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
  anho?: string | null;
  capacidad_kg?: number | null;
  capacidad_volumen?: number | null;
  estado?: string;
  activo?: boolean;
  chofer_asignado_id?: Id | null;
  observaciones?: string | null;
}

export interface ChoferFormData extends BaseFormData {
  id?: Id;
  user_id: Id | '';
  telefono?: string | null;
  licencia?: string | null;
  tipo_licencia?: string | null;
  fecha_vencimiento_licencia?: string | null;
}

/**
 * Recomendación de Vehículo basada en Peso Total
 */
export interface VehiculoRecomendado {
  id: Id;
  placa: string;
  marca: string;
  modelo: string;
  anho?: string;
  capacidad_kg: number;
  porcentaje_uso: number; // 0-100%
  estado: 'recomendado' | 'disponible' | 'excede_capacidad';
  choferAsignado?: {
    id: Id;
    name: string;
    nombre?: string;
    telefono?: string | null;
  } | null;
}

export interface VehicleRecommendationResponse {
  success: boolean;
  message: string;
  data: {
    recomendado: VehiculoRecomendado | null;
    peso_total: number;
    disponibles: VehiculoRecomendado[];
    alerta?: string;
  };
}
