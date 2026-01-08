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
 * ✅ NUEVO: Venta dentro de una Entrega agrupada
 *
 * Representa una venta individual dentro de una entrega consolidada
 * Incluye información del cliente y metadatos del pivot
 */
export interface VentaEnEntrega {
    id: Id;
    numero: string;
    cliente: {
        id: Id;
        nombre: string;
        telefono?: string;
    };
    total: number;
    estado_logistico?: string;
    fecha_entrega_comprometida?: string;
    cantidad_items: number;
    // Metadatos del pivot (orden, confirmación)
    orden: number;
    confirmado_por?: Id;
    fecha_confirmacion?: string;
    notas?: string;
}

/**
 * Información consolidada del Chofer y Vehículo
 */
export interface ChoferEntregaInfo {
    id: Id;
    nombre: string;
    telefono?: string;
}

export interface VehiculoEntregaInfo {
    id: Id;
    placa: string;
    marca: string;
}

/**
 * Ubicación actual durante la entrega
 */
export interface UbicacionActualEntrega {
    latitud: number;
    longitud: number;
    velocidad?: number;
    timestamp: string;
}

/**
 * Entrega desde vista de logística (EN TRÁNSITO)
 *
 * ✅ ACTUALIZADO: Ahora representa una entrega consolidada con múltiples ventas
 *
 * ANTES (Deprecated):
 * - Una entrega = Una venta
 * - Difícil trackear múltiples clientes
 *
 * AHORA (Correcto):
 * - Una entrega = Múltiples ventas (1:N)
 * - Una Entrega es un viaje con múltiples paradas (clientes)
 * - Un Chofer + Vehículo = Una Entrega
 */
export interface EntregaLogistica extends BaseEntity {
    id: Id;
    numero_entrega?: string;

    // Estado de la entrega consolidada
    estado: EstadoEntrega;

    // ✅ NUEVO: Información consolidada de ventas
    /** Array de todas las ventas en esta entrega */
    ventas: VentaEnEntrega[];

    /** Total consolidado de todas las ventas */
    total_consolidado: number;

    /** Cantidad de ventas en esta entrega */
    cantidad_ventas: number;

    /** Nombres de clientes únicos (para resumen rápido) */
    clientes_nombres: string[];

    // Recursos asignados
    chofer: ChoferEntregaInfo;
    vehiculo: VehiculoEntregaInfo;

    // Ubicación en tiempo real
    ubicacion_actual?: UbicacionActualEntrega | null;

    // Fechas
    fecha_inicio?: string;
    fecha_llegada?: string;

    // Legacy
    proforma_id?: Id;
    chofer_id?: Id;
    vehiculo_id?: Id;
    fecha_asignacion?: string;
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
