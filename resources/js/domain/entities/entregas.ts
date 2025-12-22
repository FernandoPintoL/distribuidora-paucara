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
 * IMPORTANTE: Estos estados deben coincidir exactamente con las constantes
 * definidas en app/Models/Entrega.php
 */
export type EstadoEntrega =
    | 'PROGRAMADO'      // Entrega programada
    | 'EN_PREPARACION'  // Stock reducido, en preparación
    | 'EN_RUTA'         // Vehículo en camino
    | 'EN_TRANSITO'     // En tránsito
    | 'ASIGNADA'        // Asignada a chofer (legacy)
    | 'EN_CAMINO'       // En camino (legacy)
    | 'LLEGO'           // Llegó al destino (legacy)
    | 'ENTREGADO'       // Entrega confirmada
    | 'NOVEDAD'         // Con novedad
    | 'CANCELADO'       // Entrega cancelada
    | 'FALLIDO';        // Entrega fallida

/**
 * Interfaces para relaciones de Entrega
 * Definidas aquí para evitar dependencias circulares
 */
export interface ClienteEntrega {
    id: Id;
    nombre: string;
    email?: string;
    telefono?: string;
}

export interface VentaEntrega {
    id: Id;
    numero: string;
    cliente: ClienteEntrega;
    total?: number;
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
    total: number;
    fecha_venta: string;
    cliente: ClienteEntrega;
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
}

export interface VehiculoCompleto extends VehiculoEntrega {
    capacidad_carga?: number;
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

// Legacy compatibility exports
export type EstadoEnvio = EstadoEntrega;
export type Envio = Entrega;
export type EnvioFormData = EntregaFormData;
