/**
 * Utilities for Entregas (Deliveries)
 *
 * Helpers para estado visual, formateo y manejo de entregas
 * MIGRATED FROM: envios.utils.tsx
 */

import type { ReactNode } from 'react';
import type { EstadoEntrega } from '@/domain/entities/entregas';
import { AlertCircle, CheckCircle, Clock, Package, Truck, XCircle, MapPin } from 'lucide-react';

/**
 * Configuración visual de estados de entrega
 */
interface EstadoConfig {
    badge: 'default' | 'destructive' | 'outline' | 'secondary';
    color: string;
    bgColor: string;
    icon: ReactNode;
    label: string;
    descripcion: string;
}

/**
 * Mapeo de estados a configuración visual
 */
export const ESTADOS_CONFIG: Record<EstadoEntrega, EstadoConfig> = {
    'PROGRAMADO': {
        badge: 'secondary',
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700',
        icon: <Clock className="w-4 h-4" />,
        label: 'Programado',
        descripcion: 'Entrega programada, pendiente de preparación'
    },
    'EN_PREPARACION': {
        badge: 'default',
        color: 'text-yellow-700 dark:text-yellow-300',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700',
        icon: <Package className="w-4 h-4" />,
        label: 'En Preparación',
        descripcion: 'Stock reducido, preparando pedido'
    },
    'EN_RUTA': {
        badge: 'default',
        color: 'text-purple-700 dark:text-purple-300',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700',
        icon: <Truck className="w-4 h-4" />,
        label: 'En Ruta',
        descripcion: 'Vehículo en camino hacia el destino'
    },
    'EN_TRANSITO': {
        badge: 'default',
        color: 'text-indigo-700 dark:text-indigo-300',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-300 dark:border-indigo-700',
        icon: <Truck className="w-4 h-4" />,
        label: 'En Tránsito',
        descripcion: 'En tránsito hacia el destino'
    },
    'ASIGNADA': {
        badge: 'secondary',
        color: 'text-cyan-700 dark:text-cyan-300',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-300 dark:border-cyan-700',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Asignada',
        descripcion: 'Asignada a chofer'
    },
    'EN_CAMINO': {
        badge: 'default',
        color: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700',
        icon: <Truck className="w-4 h-4" />,
        label: 'En Camino',
        descripcion: 'En camino al destino'
    },
    'LLEGO': {
        badge: 'default',
        color: 'text-teal-700 dark:text-teal-300',
        bgColor: 'bg-teal-100 dark:bg-teal-900/40 border border-teal-300 dark:border-teal-700',
        icon: <MapPin className="w-4 h-4" />,
        label: 'Llegó',
        descripcion: 'Llegó al destino'
    },
    'ENTREGADO': {
        badge: 'default',
        color: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Entregado',
        descripcion: 'Entrega confirmada al cliente'
    },
    'NOVEDAD': {
        badge: 'outline',
        color: 'text-amber-700 dark:text-amber-300',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Novedad',
        descripcion: 'Con novedad en la entrega'
    },
    'CANCELADO': {
        badge: 'destructive',
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Cancelado',
        descripcion: 'Entrega cancelada, stock revertido'
    },
    'FALLIDO': {
        badge: 'destructive',
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Fallido',
        descripcion: 'Fallo en la entrega'
    }
};

/**
 * Obtiene la configuración visual para un estado de entrega
 */
export const getEstadoConfig = (estado: string | EstadoEntrega): EstadoConfig => {
    return ESTADOS_CONFIG[estado as EstadoEntrega] || ESTADOS_CONFIG['PROGRAMADO'];
};

/**
 * Obtiene el tipo de badge para un estado
 */
export const getEstadoBadgeVariant = (estado: string | EstadoEntrega): 'default' | 'destructive' | 'outline' | 'secondary' => {
    return getEstadoConfig(estado).badge;
};

/**
 * Obtiene el color del estado
 */
export const getEstadoColor = (estado: string | EstadoEntrega): string => {
    return getEstadoConfig(estado).color;
};

/**
 * Obtiene el color de fondo del estado
 */
export const getEstadoBgColor = (estado: string | EstadoEntrega): string => {
    return getEstadoConfig(estado).bgColor;
};

/**
 * Obtiene el ícono del estado
 */
export const getEstadoIcon = (estado: string | EstadoEntrega): ReactNode => {
    return getEstadoConfig(estado).icon;
};

/**
 * Obtiene la etiqueta legible del estado
 */
export const getEstadoLabel = (estado: string | EstadoEntrega): string => {
    return getEstadoConfig(estado).label;
};

/**
 * Obtiene la descripción del estado
 */
export const getEstadoDescripcion = (estado: string | EstadoEntrega): string => {
    return getEstadoConfig(estado).descripcion;
};

/**
 * Formatea una fecha a formato local
 */
export const formatearFecha = (fecha: string | undefined): string => {
    if (!fecha) return '-';
    try {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return fecha;
    }
};

/**
 * Formatea fecha y hora
 */
export const formatearFechaHora = (fecha: string | undefined): string => {
    if (!fecha) return '-';
    try {
        return new Date(fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return fecha;
    }
};

/**
 * Determina si una entrega puede ser editada basado en su estado
 */
export const puedeSerEditado = (estado: string | EstadoEntrega): boolean => {
    const estadosNoEditables = ['ENTREGADO', 'FALLIDO', 'CANCELADO'];
    return !estadosNoEditables.includes(estado);
};

/**
 * Determina si una entrega puede ser cancelada basado en su estado
 */
export const puedeSerCancelado = (estado: string | EstadoEntrega): boolean => {
    const estadosCancelables = ['PROGRAMADO', 'EN_PREPARACION', 'ASIGNADA'];
    return estadosCancelables.includes(estado);
};

/**
 * Obtiene mensajes de confirmación por acción
 */
export const getMensajeConfirmacion = (accion: 'ver' | 'editar' | 'cancelar'): string => {
    const mensajes: Record<string, string> = {
        'ver': '¿Deseas ver los detalles de esta entrega?',
        'editar': '¿Deseas editar esta entrega?',
        'cancelar': '¿Estás seguro de que deseas cancelar esta entrega? Esta acción revertirá el stock.'
    };
    return mensajes[accion] || '';
};

/**
 * Validación de fecha programada
 * Verifica que sea al menos 1 hora en el futuro
 */
export const validarFechaProgramada = (fecha: string): { valida: boolean; mensaje: string } => {
    if (!fecha) {
        return { valida: false, mensaje: 'La fecha es requerida' };
    }

    const fechaSeleccionada = new Date(fecha);
    const ahora = new Date();
    const unHoraEnFuturo = new Date(ahora.getTime() + 60 * 60 * 1000);

    if (isNaN(fechaSeleccionada.getTime())) {
        return { valida: false, mensaje: 'Formato de fecha inválido' };
    }

    if (fechaSeleccionada < unHoraEnFuturo) {
        return { valida: false, mensaje: 'La fecha debe ser al menos 1 hora en el futuro' };
    }

    return { valida: true, mensaje: '' };
};

/**
 * Genera fecha mínima permitida (1 hora desde ahora)
 * Retorna en formato para input datetime-local
 */
export const getMinDateTimeLocal = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
};

/**
 * Gestiona historial de choferes en localStorage
 */
export const ChoferHistorialService = {
    /**
     * Obtiene los IDs de últimos choferes usados
     */
    obtenerHistorial: (): number[] => {
        try {
            const historial = localStorage.getItem('entregas_ultimos_choferes');
            return historial ? JSON.parse(historial) : [];
        } catch {
            return [];
        }
    },

    /**
     * Guarda un chofer en el historial
     */
    guardarChofer: (choferId: number): void => {
        try {
            const historial = ChoferHistorialService.obtenerHistorial();
            const nuevoHistorial = [choferId, ...historial.filter(id => id !== choferId)].slice(0, 5);
            localStorage.setItem('entregas_ultimos_choferes', JSON.stringify(nuevoHistorial));
        } catch (error) {
            console.error('Error guardando historial de choferes:', error);
        }
    },

    /**
     * Limpia el historial
     */
    limpiarHistorial: (): void => {
        try {
            localStorage.removeItem('entregas_ultimos_choferes');
        } catch {
            // Ignorar errores al limpiar
        }
    }
};
