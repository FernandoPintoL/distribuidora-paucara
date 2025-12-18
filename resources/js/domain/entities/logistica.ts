/**
 * Domain: Logística
 *
 * Centralized domain entities for logistics module
 * Includes: Proformas, Entregas, Dashboard stats, and related types
 */

import type { Id } from './shared';
import type { BaseEntity } from './generic';
import type { Direccion } from './proformas';

/**
 * Estados de Proforma para logística
 */
export type EstadoProformaLogistica =
    | 'PENDIENTE'    // Pendiente de aprobación
    | 'APROBADA'     // Aprobada por logística
    | 'RECHAZADA'    // Rechazada por logística
    | 'CONVERTIDA'   // Convertida en envío
    | 'VENCIDA';     // Proforma vencida

/**
 * Estados de Entrega para logística
 */
export type EstadoEntrega =
    | 'ASIGNADA'     // Asignada a chofer
    | 'EN_CAMINO'    // En camino
    | 'LLEGO'        // Llegó al destino
    | 'ENTREGADO'    // Entregado al cliente
    | 'NOVEDAD'      // Con novedad
    | 'CANCELADA';   // Cancelada

/**
 * Proforma desde vista de logística (App Externa)
 *
 * Representa una proforma con información específica
 * necesaria para el módulo de logística
 */
export interface ProformaAppExterna extends BaseEntity {
    id: Id;
    numero: string;
    cliente_nombre: string;
    total: number;
    estado: EstadoProformaLogistica;
    fecha: string;
    fecha_vencimiento?: string;
    usuario_creador_nombre: string;
    canal_origen?: 'APP_EXTERNA' | 'WEB' | 'PRESENCIAL';

    // Solicitud de entrega del cliente
    fecha_entrega_solicitada?: string;
    hora_entrega_solicitada?: string;
    direccion_entrega_solicitada_id?: Id;
    direccionSolicitada?: Direccion; // Relación a dirección solicitada

    // Confirmación de entrega
    fecha_entrega_confirmada?: string;
    hora_entrega_confirmada?: string;
    direccion_entrega_confirmada_id?: Id;
    direccionConfirmada?: Direccion; // Relación a dirección confirmada

    // Auditoría
    coordinacion_completada?: boolean;
    comentario_coordinacion?: string;
}

/**
 * Entrega desde vista de logística
 *
 * Representa una entrega en el sistema de logística
 */
export interface EntregaLogistica extends BaseEntity {
    id: Id;
    proforma_id: Id;
    chofer_id?: Id;
    vehiculo_id?: Id;
    estado: EstadoEntrega;
    fecha_asignacion?: string;
    fecha_inicio?: string;
    fecha_entrega?: string;
    observaciones?: string;
}

/**
 * Ubicación de Entrega en Tiempo Real
 *
 * Representa la posición GPS, velocidad y timestamp de una entrega
 * Utilizada por el sistema de rastreo en vivo (entregas en tránsito)
 */
export interface UbicacionEntrega extends BaseEntity {
    entrega_id: Id;
    latitud: number;
    longitud: number;
    velocidad?: number;
    timestamp: string;
}

/**
 * Envío para dashboard de logística
 * (similar a Entrega pero con información adicional)
 */
export interface EnvioLogistica extends BaseEntity {
    id: Id;
    numero_seguimiento: string;
    cliente_nombre: string;
    estado: 'PROGRAMADO' | 'EN_PREPARACION' | 'EN_RUTA' | 'ENTREGADO' | 'CANCELADO';
    fecha_programada: string;
    fecha_salida?: string;
    fecha_entrega?: string;
    direccion_entrega: string;
}

/**
 * Estadísticas del Dashboard de Logística
 */
export interface DashboardLogisticaStats extends BaseEntity {
    proformas_pendientes: number;
    envios_programados: number;
    envios_en_transito: number;
    envios_entregados_hoy: number;
}

/**
 * Respuesta paginada para Proformas
 */
export interface PaginatedProformas extends BaseEntity {
    data: ProformaAppExterna[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

/**
 * Respuesta paginada para Envíos
 */
export interface PaginatedEnvios extends BaseEntity {
    data: EnvioLogistica[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

/**
 * Filtros para búsqueda de Proformas
 */
export interface ProformaFilterParams {
    estado?: EstadoProformaLogistica | 'TODOS';
    search?: string;
    solo_vencidas?: boolean;
    page?: number;
}

/**
 * Filtros para búsqueda de Envíos
 */
export interface EnvioFilterParams {
    estado?: string;
    search?: string;
    page?: number;
}

/**
 * Datos para aprobar una proforma
 */
export interface AprobarProformaData {
    comentario?: string;
    fecha_entrega_confirmada?: string;
    hora_entrega_confirmada?: string;
    direccion_entrega_confirmada_id?: Id;
    comentario_coordinacion?: string;
}

/**
 * Datos para rechazar una proforma
 */
export interface RechazarProformaData {
    motivo: string;
    comentario?: string;
}

/**
 * Props para el componente Dashboard de Logística
 */
export interface DashboardLogisticaProps {
    estadisticas: DashboardLogisticaStats;
    proformasRecientes: PaginatedProformas;
    enviosActivos: PaginatedEnvios | EnvioLogistica[];
}
