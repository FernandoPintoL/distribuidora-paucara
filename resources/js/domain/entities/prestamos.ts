// Domain: Préstamos de Canastillas y Embases
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

// ============================================
// TIPOS ENUM
// ============================================

export type TipoPrestable = 'CANASTILLA' | 'EMBASES' | 'OTRO';
export type EstadoPrestamo = 'ACTIVO' | 'COMPLETAMENTE_DEVUELTO' | 'PARCIALMENTE_DEVUELTO';
export type TipoPrecio = 'VENTA' | 'PRESTAMO';

// ============================================
// ENTIDADES PRINCIPALES
// ============================================

export interface PrestablePrice extends BaseEntity {
    id: Id;
    prestable_id: Id;
    tipo: TipoPrecio;
    precio: number;
    activo: boolean;
}

export interface PrestableCondicion extends BaseEntity {
    id: Id;
    prestable_id: Id;
    monto_garantia: number;
    monto_daño_parcial: number;
    monto_daño_total: number;
}

export interface PrestableStock extends BaseEntity {
    id: Id;
    prestable_id: Id;
    almacen_id: Id;
    cantidad_disponible: number;
    cantidad_en_prestamo_cliente: number;
    cantidad_en_prestamo_proveedor: number;
    cantidad_vendida: number;
}

export interface Prestable extends BaseEntity {
    id: Id;
    nombre: string;
    codigo: string;
    tipo: TipoPrestable;
    capacidad?: number | null;
    activo: boolean;
    precios: PrestablePrice[];
    condiciones: PrestableCondicion;
    stocks: PrestableStock[];
}

export interface DevolucionCliente extends BaseEntity {
    id: Id;
    prestamo_cliente_id: Id;
    cantidad_devuelta: number;
    cantidad_dañada_parcial: number;
    cantidad_dañada_total: number;
    monto_cobrado_daño: number;
    fecha_devolucion: string;
    observaciones?: string | null;
}

export interface PrestamoCliente extends BaseEntity {
    id: Id;
    prestable_id: Id;
    cliente_id: Id;
    chofer_id?: Id | null;
    venta_id?: Id | null;
    cantidad: number;
    es_venta: boolean;
    es_evento?: boolean;
    monto_garantia: number;
    fecha_prestamo: string;
    fecha_esperada_devolucion?: string | null;
    estado: EstadoPrestamo;
    devoluciones: DevolucionCliente[];
    // Relaciones
    prestable: Prestable;
    cliente: {
        id: Id;
        razon_social: string;
        nombre?: string;
    };
    chofer?: {
        id: Id;
        nombre: string;
    } | null;
}

export interface DevolucionProveedor extends BaseEntity {
    id: Id;
    prestamo_proveedor_id: Id;
    cantidad_devuelta: number;
    fecha_devolucion: string;
    observaciones?: string | null;
}

export interface PrestamoProveedor extends BaseEntity {
    id: Id;
    prestable_id: Id;
    proveedor_id: Id;
    cantidad: number;
    es_compra: boolean;
    precio_unitario?: number | null;
    fecha_prestamo: string;
    numero_documento?: string | null;
    estado: EstadoPrestamo;
    devoluciones: DevolucionProveedor[];
    // Relaciones
    prestable: Prestable;
    proveedor: {
        id: Id;
        nombre: string;
    };
}

export interface ReporteResumen {
    total_canastillas: number;
    disponible: number;
    en_prestamo_clientes: number;
    deuda_proveedores: number;
    vendido: number;
    prestamos_activos_clientes: number;
    prestamos_activos_proveedores: number;
}

// ============================================
// FORMULARIOS
// ============================================

export interface NuevoPrestable extends BaseFormData {
    nombre: string;
    codigo: string;
    tipo: TipoPrestable;
    capacidad?: number;
    precios: {
        tipo: TipoPrecio;
        precio: number;
    }[];
    condiciones: {
        monto_garantia: number;
        monto_daño_parcial: number;
        monto_daño_total: number;
    };
}

export interface NuevoPrestamoCliente extends BaseFormData {
    prestable_id: Id;
    cliente_id: Id;
    chofer_id?: Id;
    venta_id?: Id;
    cantidad: number;
    es_venta: boolean;
    es_evento?: boolean;
    fecha_prestamo: string;
    fecha_esperada_devolucion?: string;
    monto_garantia?: number;
}

export interface NuevoPrestamoProveedor extends BaseFormData {
    prestable_id: Id;
    proveedor_id: Id;
    cantidad: number;
    es_compra: boolean;
    precio_unitario?: number;
    fecha_prestamo: string;
    numero_documento?: string;
}

export interface DatosDevolucionCliente extends BaseFormData {
    cantidad_devuelta: number;
    cantidad_dañada_parcial?: number;
    cantidad_dañada_total?: number;
    observaciones?: string;
    fecha_devolucion: string;
}

export interface DatosDevolucionProveedor extends BaseFormData {
    cantidad_devuelta: number;
    observaciones?: string;
    fecha_devolucion: string;
}

// ============================================
// FILTROS
// ============================================

export interface FiltrosPrestamosCliente {
    estado?: EstadoPrestamo;
    cliente_id?: Id;
    prestable_id?: Id;
    fecha_desde?: string;
    fecha_hasta?: string;
}

export interface FiltrosPrestamosProveedor {
    estado?: EstadoPrestamo;
    proveedor_id?: Id;
    prestable_id?: Id;
    fecha_desde?: string;
    fecha_hasta?: string;
}
