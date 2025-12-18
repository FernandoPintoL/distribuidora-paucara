// Domain: Envios
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

/**
 * Estados del envío
 *
 * IMPORTANTE: Estos estados deben coincidir exactamente con las constantes
 * definidas en app/Models/Envio.php
 *
 * @see app/Models/Envio.php:39-47
 */
export type EstadoEnvio =
    | 'PROGRAMADO'      // Envio::PROGRAMADO - Envío programado
    | 'EN_PREPARACION'  // Envio::EN_PREPARACION - Stock reducido, en preparación
    | 'EN_RUTA'         // Envio::EN_RUTA - Vehículo en camino
    | 'EN_TRANSITO'     // Envio::EN_TRANSITO - En tránsito
    | 'ENTREGADO'       // Envio::ENTREGADO - Entrega confirmada
    | 'CANCELADO'       // Envio::CANCELADO - Envío cancelado
    | 'FALLIDO';        // Envio::FALLIDO - Entrega fallida

/**
 * Interfaces para relaciones de Envio
 * Definidas aquí para evitar dependencias circulares
 */
export interface ClienteEnvio {
    id: Id;
    nombre: string;
    email?: string;
    telefono?: string;
}

export interface VentaEnvio {
    id: Id;
    numero: string;
    cliente: ClienteEnvio;
    total?: number;
}

export interface VehiculoEnvio {
    id: Id;
    placa: string;
    marca: string;
    modelo: string;
    estado?: string;
}

export interface ChoferEnvio {
    id: Id;
    name: string;
    email?: string;
    telefono?: string;
}

/**
 * Configuración visual y descripción de cada estado de envío
 *
 * IMPORTANTE: Las claves de este objeto deben coincidir con EstadoEnvio
 */
export const ESTADOS_ENVIO: Record<EstadoEnvio, {
    label: string;
    color: string;
    icon: string;
    descripcion: string;
}> = {
    PROGRAMADO: {
        label: 'Programado',
        color: 'text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
        icon: '📅',
        descripcion: 'Envío programado, esperando preparación'
    },
    EN_PREPARACION: {
        label: 'En Preparación',
        color: 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
        icon: '📦',
        descripcion: 'Stock reducido, preparando pedido'
    },
    EN_RUTA: {
        label: 'En Ruta',
        color: 'text-purple-800 bg-purple-100 dark:bg-purple-900 dark:text-purple-200',
        icon: '🚚',
        descripcion: 'Vehículo en camino hacia el destino'
    },
    ENTREGADO: {
        label: 'Entregado',
        color: 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200',
        icon: '✅',
        descripcion: 'Envío entregado al cliente'
    },
    CANCELADO: {
        label: 'Cancelado',
        color: 'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200',
        icon: '❌',
        descripcion: 'Envío cancelado, stock revertido'
    }
};

export interface Envio extends BaseEntity {
    id: Id;
    numero_envio: string;
    venta_id: Id;
    vehiculo_id?: Id;
    chofer_id?: Id;
    fecha_programada: string;
    fecha_salida?: string;
    fecha_entrega?: string;
    direccion_entrega: string;
    coordenadas_lat?: number;
    coordenadas_lng?: number;
    estado: EstadoEnvio;
    observaciones?: string;
    foto_entrega?: string;
    firma_cliente?: string;
    receptor_nombre?: string;
    receptor_documento?: string;

    // Relaciones
    venta: VentaEnvio;
    vehiculo?: VehiculoEnvio;
    chofer?: ChoferEnvio;
    seguimientos?: SeguimientoEnvio[];

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface SeguimientoEnvio {
    id: Id;
    envio_id: Id;
    estado: EstadoEnvio;
    fecha_hora: string;
    coordenadas_lat?: number;
    coordenadas_lng?: number;
    observaciones?: string;
    foto?: string;
    user_id?: Id;
    created_at: string;
    updated_at: string;
}

export interface EnvioFormData extends BaseFormData {
    id?: Id;
    numero_envio?: string;
    venta_id: Id;
    vehiculo_id?: Id;
    chofer_id?: Id;
    fecha_programada: string;
    direccion_entrega: string;
    observaciones?: string;
}

export interface ProgramarEnvioFormData extends BaseFormData {
    vehiculo_id: Id;
    chofer_id: Id;
    fecha_programada: string;
    direccion_entrega?: string;
    observaciones?: string;
}

export interface ConfirmarEntregaFormData extends BaseFormData {
    receptor_nombre: string;
    receptor_documento?: string;
    foto_entrega?: File;
    observaciones_entrega?: string;
}

export interface CancelarEnvioFormData extends BaseFormData {
    motivo_cancelacion: string;
}

export interface ActualizarUbicacionFormData extends BaseFormData {
    latitud: number;
    longitud: number;
}

/**
 * Interfaces expandidas para crear/editar envíos
 * Incluyen relaciones completas para el formulario
 */
export interface VentaConDetalles {
    id: Id;
    numero_venta: string;
    total: number;
    fecha_venta: string;
    cliente: ClienteEnvio;
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

export interface VehiculoCompleto extends VehiculoEnvio {
    capacidad_carga: number;
}

/**
 * Props para página de crear envío
 */
export interface EnviosCreatePageProps {
    ventas: VentaConDetalles[];
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEnvio[];
    ventaPreseleccionada?: Id;
}
