// Domain: Productos
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Precio {
  id?: number;
  nombre: string;
  monto: number;
  tipo_precio_id?: number; // Agregado para resolver errores
  tipo_precio?: string;   // Agregado para resolver errores
  moneda?: string;        // Agregado para resolver errores
}

export interface CodigoBarra {
  id?: number;
  codigo: string;
  tipo?: string;
  es_principal?: boolean;
}

export interface Imagen {
  id?: number;
  url?: string;
  file?: File | null;
}

export interface StockAlmacen {
  almacen_id: number | string;
  almacen_nombre?: string;
  stock: number;
  lote?: string | null;
  fecha_vencimiento?: string | null;
}

export interface Producto extends BaseEntity {
  id: Id;
  nombre: string;
  descripcion?: string | null;
  peso?: number | null;
  unidad_medida_id?: Id;
  codigo_barras?: string | null;
  codigo_qr?: string | null;
  stock_minimo?: number;
  stock_maximo?: number;
  activo: boolean;
  fecha_creacion?: string | null;
  es_alquilable?: boolean;
  categoria_id?: Id;
  marca_id?: Id;

  // Relaciones
  categoria?: { id: Id; nombre: string };
  marca?: { id: Id; nombre: string };
  unidad?: { id: Id; codigo: string; nombre: string };

  // Campos complejos del frontend
  perfil?: Imagen | null;
  galeria?: Imagen[];
  precios?: Precio[];
  codigos?: CodigoBarra[];
  almacenes?: StockAlmacen[];
}

export interface ProductoFormData extends BaseFormData {
  id?: Id;
  nombre: string;
  descripcion?: string | null;
  peso?: number | null;
  unidad_medida_id?: Id | '';
  numero?: string | null;
  fecha_vencimiento?: string | null;
  categoria_id?: Id | '';
  marca_id?: Id | '';
  activo?: boolean;
  perfil?: Imagen | null;
  galeria?: Imagen[];
  precios: Precio[];
  codigos: CodigoBarra[];
  almacenes?: StockAlmacen[];
}
