// Domain: Productos
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface Precio {
  id?: number;
  monto: number;
  tipo_precio_id: number;
  moneda?: string;
  motivo_cambio?: string;
  fecha_aplicacion?: string;
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
  sku?: string | null;
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
  proveedor_id?: Id;
  precio_base?: number | null; // Nuevo campo para index / tarjetas
  stock_total?: number; // Total consolidado de stock

  // Relaciones
  categoria?: { id: Id; nombre: string };
  marca?: { id: Id; nombre: string };
  proveedor?: { id: Id; nombre: string; razon_social?: string };
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
  sku?: string | null;
  descripcion?: string | null;
  peso?: number | null;
  unidad_medida_id?: Id | '';
  numero?: string | null;
  fecha_vencimiento?: string | null;
  categoria_id?: Id | '';
  marca_id?: Id | '';
  proveedor_id?: Id | '';
  proveedor?: { id: number; nombre: string; razon_social?: string } | null;
  stock_minimo?: number | null;
  stock_maximo?: number | null;
  activo?: boolean;
  perfil?: Imagen | undefined;
  galeria?: Imagen[] | undefined;
  precios: Precio[];
  codigos: CodigoBarra[];
  almacenes?: StockAlmacen[];
}

export interface HistorialPrecio {
  id: number;
  tipo_precio_id: number;
  tipo_precio_nombre: string;
  valor_anterior: number;
  valor_nuevo: number;
  fecha_cambio: string;
  motivo: string;
  usuario: string;
  porcentaje_cambio: number;
}

// Funciones utilitarias para cálculos de precios
export const calcularPrecioConGanancia = (precioCosto: number, porcentajeGanancia: number): number => {
  if (!Number.isFinite(precioCosto) || precioCosto < 0) return 0;
  if (!Number.isFinite(porcentajeGanancia)) return precioCosto;

  return Number((precioCosto * (1 + porcentajeGanancia / 100)).toFixed(2));
};

export const calcularPorcentajeGanancia = (precioVenta: number, precioCosto: number): number => {
  if (!Number.isFinite(precioVenta) || !Number.isFinite(precioCosto) || precioCosto <= 0) return 0;

  return Number((((precioVenta - precioCosto) / precioCosto) * 100).toFixed(2));
};

export const obtenerPrecioCosto = (precios: Precio[], tiposPrecio: Array<{ id?: number; value?: number; label?: string; nombre?: string; codigo?: string }>): number => {
  const tipoCosto = tiposPrecio.find(tp =>
    tp.label?.toLowerCase().includes('costo') ||
    tp.nombre?.toLowerCase().includes('costo') ||
    tp.codigo?.toLowerCase().includes('costo')
  );

  if (!tipoCosto) return 0;

  const precioCosto = precios.find(p =>
    p.tipo_precio_id === tipoCosto.value ||
    p.tipo_precio_id === tipoCosto.id
  );

  return precioCosto?.monto || 0;
};

// =============== FILTROS ===============

export interface FiltrosProductos {
  q?: string;
  categoria_id?: string;
  marca_id?: string;
  activo?: string;
  stock_minimo?: string;
  stock_maximo?: string;
  precio_desde?: string;
  precio_hasta?: string;
  sort_by?: string;
  sort_dir?: string;
  [key: string]: string | undefined;
}

export interface DatosParaFiltrosProductos {
  categorias: Array<{ id: Id; nombre: string }>;
  marcas: Array<{ id: Id; nombre: string }>;
}
