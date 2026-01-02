/**
 * Entidades para Estados Logísticos Centralizados
 *
 * Este módulo define las estructuras de tipos para el sistema
 * de estados centralizados en la base de datos Laravel.
 *
 * Fase 3: Frontend React/TypeScript Integration
 *
 * @module domain/entities/estados-centralizados
 */

/**
 * Categorías de Estados disponibles en el sistema
 * Corresponde a las categorías en la tabla estados_logistica
 */
export type CategoriaEstado =
    | 'proforma'
    | 'venta_logistica'
    | 'entrega'
    | 'vehiculo'
    | 'pago';

/**
 * Interfaz para un Estado Logístico
 *
 * Representa una fila de la tabla estados_logistica con todos
 * sus atributos y metadatos.
 */
export interface Estado {
    id: number;
    categoria: CategoriaEstado;
    codigo: string;
    nombre: string;
    descripcion?: string;
    color: string;
    icono?: string;
    orden: number;
    es_estado_final: boolean;
    permite_edicion: boolean;
    requiere_aprobacion: boolean;
    metadatos?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

/**
 * Respuesta de API para estados de una categoría
 * Incluye metadatos sobre la categoría y timestamp
 */
export interface EstadosCategoriaResponse {
    data: Estado[];
    meta: {
        categoria: CategoriaEstado;
        total: number;
        timestamp: string;
    };
}

/**
 * Respuesta genérica de API para operaciones de estados
 */
export interface EstadoResponse {
    data: Estado;
    message?: string;
}

/**
 * Respuesta de validación de transición de estado
 */
export interface ValidarTransicionResponse {
    data: {
        valida: boolean;
        razon?: string;
        estado_siguiente?: Estado;
    };
    message?: string;
}

/**
 * Estructura interna de cache en localStorage
 * Almacena todos los estados de todas las categorías con TTL
 */
export interface EstadosCache {
    categorias: Partial<Record<CategoriaEstado, Estado[]>>;
    timestamp: number;
    ttl: number;
}

/**
 * Opciones para el hook useEstados
 */
export interface UseEstadosOptions {
    fallback?: Estado[];
    onlyActive?: boolean;
}

/**
 * Retorno del hook useEstados
 */
export interface UseEstadosReturn {
    estados: Estado[];
    isLoading: boolean;
    error: Error | null;
    getEstadoPorCodigo: (codigo: string) => Estado | undefined;
    getEstadoLabel: (codigo: string) => string;
    getEstadoColor: (codigo: string) => string | undefined;
    isEstadoFinal: (codigo: string) => boolean;
}

/**
 * Contexto de Estados para React Context API
 */
export interface EstadosContextState {
    estados: Partial<Record<CategoriaEstado, Estado[]>>;
    isLoading: boolean;
    isInitialized: boolean;
    error: Error | null;
    refreshEstados: () => Promise<void>;
    clearCache: () => void;
    getEstadosPorCategoria: (categoria: CategoriaEstado) => Estado[];
    getEstadoPorCodigo: (categoria: CategoriaEstado, codigo: string) => Estado | undefined;
}

/**
 * Mapeo de categorías a sus estados permitidos
 * Usado para type-checking en tiempo de compilación
 */
export interface CategoriasEstadosMap {
    proforma: Estado[];
    venta_logistica: Estado[];
    entrega: Estado[];
    vehiculo: Estado[];
    pago: Estado[];
}

/**
 * Fallback estados para PROFORMA
 * Se usa como respaldo cuando la API no está disponible
 */
export const FALLBACK_ESTADOS_PROFORMA: Estado[] = [
    {
        id: 1,
        categoria: 'proforma',
        codigo: 'PENDIENTE',
        nombre: 'Pendiente',
        color: '#6B7280',
        orden: 1,
        es_estado_final: false,
        permite_edicion: true,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 2,
        categoria: 'proforma',
        codigo: 'APROBADA',
        nombre: 'Aprobada',
        color: '#10B981',
        orden: 2,
        es_estado_final: false,
        permite_edicion: true,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 3,
        categoria: 'proforma',
        codigo: 'RECHAZADA',
        nombre: 'Rechazada',
        color: '#EF4444',
        orden: 3,
        es_estado_final: true,
        permite_edicion: false,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 4,
        categoria: 'proforma',
        codigo: 'CONVERTIDA',
        nombre: 'Convertida a Venta',
        color: '#3B82F6',
        orden: 4,
        es_estado_final: true,
        permite_edicion: false,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 5,
        categoria: 'proforma',
        codigo: 'VENCIDA',
        nombre: 'Vencida',
        color: '#F59E0B',
        orden: 5,
        es_estado_final: true,
        permite_edicion: false,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
];

/**
 * Fallback estados para ENTREGA
 * Se usa como respaldo cuando la API no está disponible
 */
export const FALLBACK_ESTADOS_ENTREGA: Estado[] = [
    {
        id: 1,
        categoria: 'entrega',
        codigo: 'PROGRAMADA',
        nombre: 'Programada',
        color: '#3B82F6',
        orden: 1,
        es_estado_final: false,
        permite_edicion: true,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 2,
        categoria: 'entrega',
        codigo: 'EN_PREPARACION',
        nombre: 'En Preparación',
        color: '#F59E0B',
        orden: 2,
        es_estado_final: false,
        permite_edicion: true,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 3,
        categoria: 'entrega',
        codigo: 'EN_TRANSITO',
        nombre: 'En Tránsito',
        color: '#10B981',
        orden: 3,
        es_estado_final: false,
        permite_edicion: true,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 4,
        categoria: 'entrega',
        codigo: 'ENTREGADA',
        nombre: 'Entregada',
        color: '#22C55E',
        orden: 4,
        es_estado_final: true,
        permite_edicion: false,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
    {
        id: 5,
        categoria: 'entrega',
        codigo: 'CANCELADA',
        nombre: 'Cancelada',
        color: '#EF4444',
        orden: 5,
        es_estado_final: true,
        permite_edicion: false,
        requiere_aprobacion: false,
        created_at: '',
        updated_at: '',
    },
];
