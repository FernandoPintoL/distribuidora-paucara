/**
 * Domain: Entregas (Deliveries)
 *
 * CONSOLIDATED ENTITY - Replaces legacy Envio model
 * Supports both proforma_id (legacy) and venta_id (new flow)
 *
 * @see app/Models/Entrega.php
 */

import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

/**
 * Estados de Entrega
 *
 * SINCRONIZADO con EstadosLogisticaSeeder.php (línea 45-58)
 * IMPORTANTE: Estos estados deben coincidir exactamente con los códigos
 * definidos en la tabla estados_logistica con categoría 'entrega'
 */
export type EstadoEntrega =
    | 'PROGRAMADO'           // Entrega programada, pendiente de preparación
    | 'ASIGNADA'             // Asignada a chofer
    | 'PREPARACION_CARGA'    // Preparación de Carga
    | 'EN_CARGA'             // En Carga
    | 'LISTO_PARA_ENTREGA'   // Listo para Entrega
    | 'EN_CAMINO'            // En camino al destino
    | 'EN_TRANSITO'          // En tránsito hacia el destino
    | 'LLEGO'                // Llegó a Destino
    | 'ENTREGADO'            // Entregado
    | 'NOVEDAD'              // Con Novedad
    | 'RECHAZADO'            // Rechazado
    | 'CANCELADA';           // Cancelada

/**
 * Interfaces para relaciones de Entrega
 * Definidas aquí para evitar dependencias circulares
 */
export interface LocalidadCliente {
    id: Id;
    nombre: string;
}

export interface ClienteEntrega {
    id: Id;
    nombre: string;
    email?: string;
    telefono?: string;
    localidad?: LocalidadCliente;
}

export interface DetalleVentaEntrega {
    id: Id;
    cantidad: number;
    precio_unitario: number | string;
    subtotal: number | string;
    producto?: {
        id: Id;
        nombre: string;
        codigo?: string;
        peso?: number;
    };
}

export interface EstadoLogistico {
    id: Id;
    codigo: string;
    categoria: string;
    nombre: string;
    color?: string;
    icono?: string;
    descripcion?: string;
}

export interface VentaEntrega {
    id: Id;
    numero: string;
    cliente: ClienteEntrega;
    total?: number;
    subtotal?: number;
    estado_logistico?: string;
    estado_logistico_id?: number;
    estado_logistica?: EstadoLogistico;
    fecha_entrega_comprometida?: string;
    direccion_entrega?: string;
    direccion_cliente?: DireccionClienteEntrega;
    peso_estimado?: number;
    peso_total_estimado?: number;
    detalles?: DetalleVentaEntrega[];
}

export interface ProformaEntrega {
    id: Id;
    numero: string;
    cliente: ClienteEntrega;
    total?: number;
}

export interface VehiculoEntrega {
    id: Id;
    placa: string;
    marca: string;
    modelo: string;
    estado?: string;
    capacidad_kg?: number;
}

export interface ChoferEntrega {
    id: Id;
    name: string;
    nombre?: string;
    email?: string;
    telefono?: string;
    licencia?: string;
}

export interface DireccionClienteEntrega {
    id: Id;
    direccion: string;
    latitud?: number;
    longitud?: number;
}

/**
 * Pivot metadata: Vínculo entre Reporte y Entrega
 */
export interface ReporteCargaEntregaPivot {
    orden: number;                      // Posición en el reporte
    incluida_en_carga: boolean;         // Fue incluida físicamente
    notas: string | null;               // Observaciones
    created_at: string;
    updated_at: string;
}

/**
 * Entrega principal - Modelo consolidado
 */
export interface Entrega extends BaseEntity {
    id: Id;
    numero_entrega?: string;
    numero_envio?: string; // Legacy field (alias)

    // Referencias - soporte para flujo nuevo y legacy
    venta_id?: Id;
    proforma_id?: Id;
    vehiculo_id?: Id;
    chofer_id?: Id;

    // Información de entrega
    fecha_programada: string;
    fecha_salida?: string;
    fecha_entrega?: string;
    direccion_entrega: string;
    coordenadas_lat?: number;
    coordenadas_lng?: number;
    latitud?: number;  // Alias
    longitud?: number; // Alias

    // Peso y volumen (nuevos campos)
    peso_kg?: number;
    volumen_m3?: number;

    // Estado y observaciones
    estado: EstadoEntrega;
    observaciones?: string;

    // ✅ NUEVO: Estado logístico normalizado desde tabla estados_logistica
    estado_entrega_id?: number;           // FK a estados_logistica
    estado_entrega_codigo?: string;       // Código del estado (ej: 'EN_TRANSITO')
    estado_entrega_nombre?: string;       // Nombre legible (ej: 'En Tránsito')
    estado_entrega_color?: string;        // Color en hex (ej: '#8B5CF6')
    estado_entrega_icono?: string;        // Icono/emoji (ej: '🚚')
    estado_entrega?: EstadoLogistico;     // Relación completa con estados_logistica

    // Confirmación de entrega
    foto_entrega?: string;
    firma_cliente?: string;
    receptor_nombre?: string;
    receptor_documento?: string;

    // Relaciones
    venta?: VentaEntrega;
    proforma?: ProformaEntrega;
    vehiculo?: VehiculoEntrega;
    chofer?: ChoferEntrega;
    seguimientos?: SeguimientoEntrega[];

    // ✅ NUEVO: Reportes Many-to-Many
    reportes?: ReporteCarga[];                          // Todos los reportes donde está esta entrega
    reporteEntregas?: ReporteCargaEntregaPivot[];       // Pivot metadata con orden, incluida_en_carga, notas

    // ✅ NUEVO: Ventas Many-to-Many (Entregas consolidadas)
    ventas?: VentaEntrega[];                            // Todas las ventas en esta entrega consolidada
    fecha_asignacion?: string;                          // Fecha cuando se asignó la entrega

    // Timestamps
    created_at: string;
    updated_at: string;
}

/**
 * Seguimiento de Entrega
 */
export interface SeguimientoEntrega {
    id: Id;
    entrega_id: Id;
    estado: EstadoEntrega;
    fecha_hora: string;
    coordenadas_lat?: number;
    coordenadas_lng?: number;
    observaciones?: string;
    foto?: string;
    user_id?: Id;
    created_at: string;
    updated_at: string;
}

/**
 * Ubicación de Entrega en Tiempo Real
 */
export interface UbicacionEntrega extends BaseEntity {
    entrega_id: Id;
    latitud: number;
    longitud: number;
    velocidad?: number;
    timestamp: string;
}

/**
 * Form Data para crear/editar entrega
 */
export interface EntregaFormData extends BaseFormData {
    id?: Id;
    numero_entrega?: string;
    venta_id?: Id;
    proforma_id?: Id;
    vehiculo_id?: Id;
    chofer_id?: Id;
    fecha_programada: string;
    direccion_entrega: string;
    peso_kg?: number;
    volumen_m3?: number;
    observaciones?: string;
}

/**
 * Form Data para programar entrega
 */
export interface ProgramarEntregaFormData extends BaseFormData {
    vehiculo_id: Id;
    chofer_id: Id;
    fecha_programada: string;
    direccion_entrega?: string;
    observaciones?: string;
}

/**
 * Form Data para confirmar entrega
 */
export interface ConfirmarEntregaFormData extends BaseFormData {
    receptor_nombre: string;
    receptor_documento?: string;
    foto_entrega?: File;
    observaciones_entrega?: string;
}

/**
 * Form Data para cancelar entrega
 */
export interface CancelarEntregaFormData extends BaseFormData {
    motivo_cancelacion: string;
}

/**
 * Form Data para actualizar ubicación
 */
export interface ActualizarUbicacionFormData extends BaseFormData {
    latitud: number;
    longitud: number;
}

/**
 * Interfaces expandidas para crear/editar entregas
 */
export interface VentaConDetalles {
    id: Id;
    numero_venta: string;
    subtotal: number;                       // ✅ NUEVO: Subtotal sin impuesto
    impuesto?: number;                      // ✅ NUEVO: Impuesto (si aplica)
    total: number;                          // Total de la venta
    fecha_venta: string;
    cliente: ClienteEntrega;

    // Campos de entrega comprometida (heredados de proforma)
    fecha_entrega_comprometida?: string;    // Ej: "2025-12-25"
    hora_entrega_comprometida?: string;     // Ej: "14:30"
    ventana_entrega_ini?: string;           // Ej: "08:00"
    ventana_entrega_fin?: string;           // Ej: "17:00"
    direccion_entrega?: string;             // Dirección heredada de proforma (legacy)
    direccionCliente?: DireccionClienteEntrega; // Dirección del cliente (FK)
    peso_estimado?: number;                 // Peso calculado de detalles (legacy)
    peso_total_estimado?: number;           // ✅ NUEVO: Peso total calculado al crear venta (en kg)

    // Detalles de los productos
    detalles: Array<{
        id: Id;
        cantidad: number;
        precio_unitario: number;
        producto: {
            id: Id;
            nombre: string;
            codigo: string;
        };
    }>;

    // Información adicional
    cantidad_items?: number;                // Total de items en la venta
}

export interface VehiculoCompleto extends VehiculoEntrega {
    capacidad_carga?: number;
    chofer_id?: Id;           // Chofer asociado al vehículo
    chofer?: ChoferEntrega;   // Relación con datos del chofer
}

/**
 * Props para página de crear entrega
 */
export interface EntregasCreatePageProps {
    ventas: VentaConDetalles[];
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEntrega[];
    ventaPreseleccionada?: Id;
}

/**
 * ReporteCarga - Gestión de reportes de carga
 *
 * Estados: PENDIENTE → CONFIRMADO → ENTREGADO / CANCELADO
 */
export type EstadoReporteCarga = 'PENDIENTE' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';

/**
 * Tipo de Reporte de Carga en Batch Mode
 *
 * - individual: 1 reporte por entrega (tracking granular)
 * - consolidado: 1 reporte para todas las entregas (simplificado)
 */
export type TipoReporteCarga = 'individual' | 'consolidado';

export interface ProductoReporteCarga {
    id: Id;
    nombre: string;
    codigo?: string;
    peso_kg?: number;
}

export interface DetalleReporteCarga extends BaseEntity {
    id: Id;
    reporte_carga_id: Id;
    detalle_venta_id?: Id;
    producto_id: Id;
    producto?: ProductoReporteCarga;

    // Cantidades
    cantidad_solicitada: number;
    cantidad_cargada: number;
    diferencia?: number;
    porcentaje_cargado?: number;

    // Peso
    peso_kg?: number;

    // Verificación
    verificado: boolean;
    verificado_por?: Id;
    fecha_verificacion?: string;
    notas?: string;

    created_at: string;
    updated_at: string;
}

export interface ResumenReporteCarga {
    total_lineas: number;
    total_solicitado: number;
    total_cargado: number;
    lineas_verificadas: number;
    peso_total_cargado?: number;
    porcentaje_carga: number;
}

export interface ReporteCarga extends BaseEntity {
    id: Id;
    numero_reporte: string;
    entrega_id?: Id;
    vehiculo_id?: Id;
    venta_id?: Id;

    // Información
    descripcion?: string;
    peso_total_kg: number;
    volumen_total_m3?: number;

    // Auditoria
    generado_por?: string;
    confirmado_por?: string;
    fecha_generacion: string;
    fecha_confirmacion?: string;

    // Estado
    estado: EstadoReporteCarga;
    porcentaje_cargado?: number;

    // Relaciones
    detalles?: DetalleReporteCarga[];
    resumen?: ResumenReporteCarga;
    vehiculo?: VehiculoEntrega;             // Vehículo del reporte

    // ✅ NUEVO: Entregas Many-to-Many
    entregas?: Entrega[];                   // Todas las entregas en este reporte
    entregas_count?: number;                // Contador de entregas (si se usa withCount)

    created_at: string;
    updated_at: string;
}

export interface GenerarReporteFormData extends BaseFormData {
    entrega_id: Id;
    vehiculo_id?: Id;
    descripcion?: string;
    peso_total_kg?: number;
    volumen_total_m3?: number;
}

export interface ActualizarDetalleReporteCargaFormData extends BaseFormData {
    cantidad_cargada: number;
    notas?: string;
}

// Legacy compatibility exports
export type EstadoEnvio = EstadoEntrega;
export type Envio = Entrega;
export type EnvioFormData = EntregaFormData;
