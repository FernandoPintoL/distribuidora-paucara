// Domain: Compras
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

// =============== INTERFACES BÁSICAS ===============

export interface EstadoDocumento extends BaseEntity {
    id: Id;
    nombre: string;
}

export interface Usuario extends BaseEntity {
    id: Id;
    name: string;
    email?: string;
}

export interface Moneda extends BaseEntity {
    id: Id;
    codigo: string;
    nombre: string;
    simbolo: string;
}

export interface TipoPago extends BaseEntity {
    id: Id;
    codigo: string;
    nombre: string;
}

export interface Proveedor extends BaseEntity {
    id: Id;
    nombre: string;
    razon_social?: string;
    nit?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    contacto?: string;
}

export interface Producto extends BaseEntity {
    id: Id;
    nombre: string;
    codigo?: string;
    descripcion?: string;
    precio_base?: number;
    stock?: number;
}

// =============== ENTIDADES PRINCIPALES ===============

export interface DetalleCompra extends BaseEntity {
    id: Id;
    compra_id: Id;
    producto_id: Id;
    producto: Producto;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    lote?: string | null;
    fecha_vencimiento?: string | null;
}

export interface Compra extends BaseEntity {
    id: Id;
    numero: string;
    fecha: string;
    numero_factura?: string | null;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    observaciones?: string | null;

    // Relaciones
    proveedor_id: Id;
    proveedor?: Proveedor;
    usuario_id: Id;
    usuario?: Usuario;
    estado_documento_id: Id;
    estado_documento?: EstadoDocumento;
    moneda_id: Id;
    moneda?: Moneda;
    tipo_pago_id?: Id | null;
    tipo_pago?: TipoPago | null;

    // Detalles
    detalles?: DetalleCompra[];

    // Timestamps
    created_at?: string;
    updated_at?: string;
}

// =============== FORMULARIOS ===============

export interface DetalleCompraForm {
    producto_id: Id | string;
    cantidad: number | string;
    precio_unitario: number | string;
    lote?: string;
    fecha_vencimiento?: string;
}

export interface CompraFormData extends BaseFormData {
    id?: Id;
    numero?: string;
    fecha: string;
    numero_factura?: string;
    proveedor_id: Id | string;
    estado_documento_id: Id | string;
    moneda_id: Id | string;
    tipo_pago_id?: Id | string;
    observaciones?: string;
    detalles: DetalleCompraForm[];
}

// =============== FILTROS Y BUSQUEDAS ===============

export interface FiltrosCompras {
    q?: string;
    proveedor_id?: string;
    estado_documento_id?: string;
    moneda_id?: string;
    tipo_pago_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    sort_by?: string;
    sort_dir?: string;
}

export interface DatosParaFiltrosCompras {
    proveedores: Proveedor[];
    estados: EstadoDocumento[];
    monedas: Moneda[];
    tipos_pago: TipoPago[];
}

// =============== ESTADÍSTICAS ===============

export interface EstadisticasCompras {
    total_compras: number;
    monto_total: number;
    promedio_compra: number;
    compras_por_estado: Array<{
        nombre: string;
        cantidad: number;
        monto_total: number;
    }>;
    mes_actual: {
        compras: number;
        monto: number;
        variacion_compras: number;
        variacion_monto: number;
    };
}

// =============== RESPUESTAS DE API ===============

export interface ComprasIndexResponse {
    compras: {
        data: Compra[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filtros: FiltrosCompras;
    datosParaFiltros: DatosParaFiltrosCompras;
    estadisticas: EstadisticasCompras;
}

export interface ComprasCreateResponse {
    proveedores: Proveedor[];
    productos: Producto[];
    estados_documento: EstadoDocumento[];
    monedas: Moneda[];
}

export interface ComprasShowResponse {
    compra: Compra;
}
