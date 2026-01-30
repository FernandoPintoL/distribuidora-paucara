// Domain: Ventas
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';
import type { TipoPago } from './tipos-pago';
import type { TipoDocumento } from './tipos-documento';
import type { Proforma } from './proformas';

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

export interface ConversionVenta {
    unidad_destino_id: Id;
    unidad_destino_nombre?: string;
    factor_conversion: number;
    es_conversion_principal?: boolean;
}

export interface Producto extends BaseEntity {
    id: Id;
    nombre: string;
    codigo?: string;
    codigo_barras?: string;
    descripcion?: string;
    precio_venta?: number;
    precio_costo?: number; // ✅ NUEVO: Precio de costo registrado
    precio_compra?: number; // ✅ NUEVO: Precio de compra (usado en compras)
    stock?: number;
    peso?: number; // ✅ NUEVO: Peso del producto en kg
    codigos_barras?: string[]; // ✅ NUEVO: Array de códigos de barras
    // ✅ NUEVO: Campos para productos fraccionados
    es_fraccionado?: boolean;
    unidad_medida_id?: Id;
    unidad_medida_nombre?: string;
    conversiones?: ConversionVenta[];
}

// =============== ENTIDADES PRINCIPALES ===============

export interface Pago extends BaseEntity {
    id: Id;
    monto: number;
    fecha: string;
    numero_comprobante?: string;
    observaciones?: string;
    tipo_pago: {
        id: Id;
        nombre: string;
    };
}

export interface CuentaPorCobrar extends BaseEntity {
    id: Id;
    monto: number;
    saldo: number;
    fecha_vencimiento?: string;
    estado: string;
}

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

export interface EstadoLogistica extends BaseEntity {
    id: Id;
    codigo: string;
    nombre?: string;
    categoria?: string;
}

export interface Venta extends BaseEntity {
    id: Id;
    numero: string;
    fecha: string;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    peso_total_estimado?: number;  // ✅ NUEVO: Peso total en kg
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
    estado_logistico?: 'SIN_ENTREGA' | 'PENDIENTE_ENVIO' | 'PROGRAMADO' | 'EN_PREPARACION' | 'PREPARANDO' | 'EN_TRANSITO' | 'ENVIADO' | 'ENTREGADA' | 'ENTREGADO' | 'PROBLEMAS' | 'CANCELADA' | 'CANCELADO' | 'PENDIENTE_RETIRO' | 'RETIRADO';
    estado_logistico_id?: Id;  // ✅ NUEVO: FK al estado logístico

    // Relaciones
    cliente?: Cliente;
    usuario?: Usuario;
    estado_documento?: EstadoDocumento;
    moneda?: Moneda;
    tipo_pago?: TipoPago;
    tipo_documento?: TipoDocumento;
    proforma?: Proforma;
    estadoLogistica?: EstadoLogistica;  // ✅ NUEVO: Relación con EstadoLogistica
    detalles?: DetalleVenta[];
    pagos?: Pago[];
    cuenta_por_cobrar?: CuentaPorCobrar;
    direccionCliente?: DireccionCliente;  // ✅ NUEVO: Relación con DireccionCliente

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
    // ✅ NUEVO: Campos para productos fraccionados
    es_fraccionado?: boolean;
    unidad_medida_id?: Id;
    unidad_medida_nombre?: string;
    unidad_venta_id?: Id;
    conversiones?: ConversionVenta[];
}

export interface VentaFormData extends BaseFormData {
    id?: Id;
    numero: string;
    fecha: string;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    peso_total_estimado?: number;  // ✅ NUEVO: Peso total en kg
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
    estado_logistico?: 'SIN_ENTREGA' | 'PENDIENTE_ENVIO' | 'PROGRAMADO' | 'EN_PREPARACION' | 'PREPARANDO' | 'EN_TRANSITO' | 'ENVIADO' | 'ENTREGADA' | 'ENTREGADO' | 'PROBLEMAS' | 'CANCELADA' | 'CANCELADO' | 'PENDIENTE_RETIRO' | 'RETIRADO';
    detalles: DetalleVentaFormData[];
}

// =============== FILTROS ===============

export interface FiltrosVentas {
    search?: string;
    id?: number;
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

// =============== PAGE PROPS ===============

export interface DetalleVentaShow extends DetalleVenta {
    producto: Producto; // Obligatorio en show
}

export interface DireccionCliente extends BaseEntity {
    id: Id;
    direccion: string;
    referencias?: string;
    localidad?: string;
    localidad_id?: Id;
    latitud?: number;           // ✅ NUEVO: Coordenada para mapas
    longitud?: number;          // ✅ NUEVO: Coordenada para mapas
    es_principal?: boolean;
    activa?: boolean;
}

export interface VentaShow extends Venta {
    cliente: Cliente; // Obligatorio en show
    usuario: Usuario; // Obligatorio en show
    estado_documento: EstadoDocumento; // Obligatorio en show
    moneda: Moneda; // Obligatorio en show
    detalles: DetalleVentaShow[]; // Obligatorio en show con productos completos
    tipo_pago?: TipoPago;
    direccion_cliente?: DireccionCliente;
}

export interface VentaShowPageProps {
    venta: VentaShow;
}
