export interface Moneda {
  id: number;
  nombre: string;
  codigo: string;
  simbolo: string;
  tasa_cambio: number;
  es_moneda_base: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MonedaFormData {
  nombre: string;
  codigo: string;
  simbolo: string;
  tasa_cambio: number;
  es_moneda_base: boolean;
  activo: boolean;
}

export interface ConversionRequest {
  monto: number;
  moneda_origen_id: number;
  moneda_destino_id: number;
}

export interface ConversionResponse {
  monto_original: number;
  monto_convertido: number;
  moneda_origen: {
    nombre: string;
    codigo: string;
    simbolo: string;
  };
  moneda_destino: {
    nombre: string;
    codigo: string;
    simbolo: string;
  };
}
