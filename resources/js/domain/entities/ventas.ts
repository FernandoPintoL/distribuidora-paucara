// Domain: Ventas
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';
import type { TipoPago } from './tipos-pago';
import type { TipoDocumento } from './tipos-documento';
import type { Proforma } from './proformas';
import type { Envio } from './envios';

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

export interface Cliente extends BaseEntity {
    id: Id;
    nombre: string;
    nit?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
}

export interface Producto extends BaseEntity {
    id: Id;
    nombre: string;
    codigo?: string;
    descripcion?: string;
    precio_venta?: number;
    stock?: number;
}

// =============== ENTIDADES PRINCIPALES ===============

export interface DetalleVenta extends BaseEntity {
    id: Id;
    venta_id: Id;
    producto_id: Id;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
    producto?: Producto;
}

export interface Venta extends BaseEntity {
    id: Id;
    numero: string;
    fecha: string;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    observaciones?: string;
    cliente_id: Id;
    usuario_id: Id;
    estado_documento_id: Id;
    moneda_id: Id;
    proforma_id?: Id;
    tipo_pago_id?: Id;
    tipo_documento_id?: Id;
    requiere_envio?: boolean;
    canal_origen?: 'APP_EXTERNA' | 'WEB' | 'PRESENCIAL';
    estado_logistico?: 'PENDIENTE_ENVIO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO';

    // Relaciones
    cliente?: Cliente;
    usuario?: Usuario;
    estado_documento?: EstadoDocumento;
    moneda?: Moneda;
    tipo_pago?: TipoPago;
    tipo_documento?: TipoDocumento;
    proforma?: Proforma;
    envio?: Envio;
    detalles?: DetalleVenta[];

    // Timestamps
    created_at: string;
    updated_at: string;
}

// =============== FORMULARIOS ===============

export interface DetalleVentaFormData extends BaseFormData {
    id?: Id;
    producto_id: Id;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
}

export interface VentaFormData extends BaseFormData {
    id?: Id;
    numero: string;
    fecha: string;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    observaciones?: string;
    cliente_id: Id;
    usuario_id: Id;
    estado_documento_id: Id;
    moneda_id: Id;
    proforma_id?: Id;
    tipo_pago_id?: Id;
    tipo_documento_id?: Id;
    requiere_envio?: boolean;
    canal_origen?: 'APP_EXTERNA' | 'WEB' | 'PRESENCIAL';
    estado_logistico?: 'PENDIENTE_ENVIO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO';
    detalles: DetalleVentaFormData[];
}

// =============== FILTROS ===============

export interface FiltrosVentas {
    search?: string;
    numero?: string;
    cliente_id?: Id | null;
    estado_documento_id?: Id | null;
    moneda_id?: Id | null;
    usuario_id?: Id | null;
    fecha_desde?: string;
    fecha_hasta?: string;
    monto_min?: number;
    monto_max?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

// =============== ESTADÍSTICAS ===============

export interface EstadisticasVentas {
    total_ventas: number;
    ventas_hoy: number;
    ventas_mes: number;
    monto_total: number;
    monto_hoy: number;
    monto_mes: number;
    promedio_venta: number;
    productos_vendidos: number;
    clientes_activos: number;
    ventas_por_estado: {
        estado: string;
        cantidad: number;
        porcentaje: number;
    }[];
    ventas_por_mes: {
        mes: string;
        cantidad: number;
        monto: number;
    }[];
    top_productos: {
        producto: string;
        cantidad_vendida: number;
        monto_total: number;
    }[];
    top_clientes: {
        cliente: string;
        total_compras: number;
        monto_total: number;
    }[];
}

// =============== DATOS PARA FILTROS ===============

export interface DatosParaFiltrosVentas {
    clientes: Cliente[];
    estados_documento: EstadoDocumento[];
    monedas: Moneda[];
    usuarios: Usuario[];
}

// =============== DATOS PARA FORMULARIOS ===============

export interface DatosParaFormularioVentas {
    clientes: Cliente[];
    productos: Producto[];
    estados_documento: EstadoDocumento[];
    monedas: Moneda[];
}

// =============== RESPUESTAS DE API ===============

export interface VentaResponse {
    venta: Venta;
    message?: string;
}

export interface VentasListResponse {
    ventas: Venta[];
    pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
    filtros?: FiltrosVentas;
    estadisticas?: EstadisticasVentas;
    datosParaFiltros?: DatosParaFiltrosVentas;
}

// =============== VALIDACIONES ===============

export interface VentaValidationErrors {
    numero?: string[];
    fecha?: string[];
    cliente_id?: string[];
    moneda_id?: string[];
    estado_documento_id?: string[];
    subtotal?: string[];
    descuento?: string[];
    impuesto?: string[];
    total?: string[];
    observaciones?: string[];
    detalles?: string[];
    'detalles.*.producto_id'?: string[];
    'detalles.*.cantidad'?: string[];
    'detalles.*.precio_unitario'?: string[];
    'detalles.*.descuento'?: string[];
    'detalles.*.subtotal'?: string[];
}

// =============== EVENTOS ===============

export interface VentaEvents {
    onVentaCreated: (venta: Venta) => void;
    onVentaUpdated: (venta: Venta) => void;
    onVentaDeleted: (ventaId: Id) => void;
    onDetalleAdded: (detalle: DetalleVenta) => void;
    onDetalleUpdated: (detalle: DetalleVenta) => void;
    onDetalleRemoved: (detalleId: Id) => void;
}
