/**
 * Utilities for Envios (Shipments)
 *
 * Helpers para estado visual, formateo y manejo de envios
 */

import type { ReactNode } from 'react';
import type { EstadoEnvio } from '@/domain/entities/envios';
import { AlertCircle, CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react';

/**
 * Configuración visual de estados de envío
 */
interface EstadoConfig {
    badge: 'default' | 'destructive' | 'outline' | 'secondary';
    color: string;
    icon: ReactNode;
    label: string;
    descripcion: string;
}

/**
 * Mapeo de estados a configuración visual
 */
export const ESTADOS_CONFIG: Record<EstadoEnvio, EstadoConfig> = {
    'PROGRAMADO': {
        badge: 'secondary',
        color: 'text-blue-600 dark:text-blue-400',
        icon: <Clock className="w-4 h-4" />,
        label: 'Programado',
        descripcion: 'Envío programado, pendiente de preparación'
    },
    'EN_PREPARACION': {
        badge: 'default',
        color: 'text-yellow-600 dark:text-yellow-400',
        icon: <Package className="w-4 h-4" />,
        label: 'En Preparación',
        descripcion: 'Stock reducido, preparando pedido'
    },
    'EN_RUTA': {
        badge: 'default',
        color: 'text-purple-600 dark:text-purple-400',
        icon: <Truck className="w-4 h-4" />,
        label: 'En Ruta',
        descripcion: 'Vehículo en camino hacia el destino'
    },
    'EN_TRANSITO': {
        badge: 'default',
        color: 'text-indigo-600 dark:text-indigo-400',
        icon: <Truck className="w-4 h-4" />,
        label: 'En Tránsito',
        descripcion: 'En tránsito hacia el destino'
    },
    'ENTREGADO': {
        badge: 'default',
        color: 'text-green-600 dark:text-green-400',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Entregado',
        descripcion: 'Envío entregado al cliente'
    },
    'CANCELADO': {
        badge: 'destructive',
        color: 'text-red-600 dark:text-red-400',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Cancelado',
        descripcion: 'Envío cancelado, stock revertido'
    },
    'FALLIDO': {
        badge: 'destructive',
        color: 'text-red-600 dark:text-red-400',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Fallido',
        descripcion: 'Fallo en la entrega'
    }
};

/**
 * Obtiene la configuración visual para un estado de envío
 */
export const getEstadoConfig = (estado: string | EstadoEnvio): EstadoConfig => {
    return ESTADOS_CONFIG[estado as EstadoEnvio] || ESTADOS_CONFIG['PROGRAMADO'];
};

/**
 * Obtiene el tipo de badge para un estado
 */
export const getEstadoBadgeVariant = (estado: string | EstadoEnvio): 'default' | 'destructive' | 'outline' | 'secondary' => {
    return getEstadoConfig(estado).badge;
};

/**
 * Obtiene el color del estado
 */
export const getEstadoColor = (estado: string | EstadoEnvio): string => {
    return getEstadoConfig(estado).color;
};

/**
 * Obtiene el ícono del estado
 */
export const getEstadoIcon = (estado: string | EstadoEnvio): ReactNode => {
    return getEstadoConfig(estado).icon;
};

/**
 * Obtiene la etiqueta legible del estado
 */
export const getEstadoLabel = (estado: string | EstadoEnvio): string => {
    return getEstadoConfig(estado).label;
};

/**
 * Obtiene la descripción del estado
 */
export const getEstadoDescripcion = (estado: string | EstadoEnvio): string => {
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
 * Determina si un envío puede ser editado basado en su estado
 */
export const puedeSerEditado = (estado: string | EstadoEnvio): boolean => {
    const estadosNoEditables = ['ENTREGADO', 'FALLIDO', 'CANCELADO'];
    return !estadosNoEditables.includes(estado);
};

/**
 * Determina si un envío puede ser cancelado basado en su estado
 */
export const puedeSercancelado = (estado: string | EstadoEnvio): boolean => {
    const estadosCancelables = ['PROGRAMADO', 'EN_PREPARACION'];
    return estadosCancelables.includes(estado);
};

/**
 * Obtiene mensajes de confirmación por acción
 */
export const getMensajeConfirmacion = (accion: 'ver' | 'editar' | 'cancelar'): string => {
    const mensajes: Record<string, string> = {
        'ver': '¿Deseas ver los detalles de este envío?',
        'editar': '¿Deseas editar este envío?',
        'cancelar': '¿Estás seguro de que deseas cancelar este envío? Esta acción revertirá el stock.'
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
export const ChofererHistorialService = {
    /**
     * Obtiene los IDs de últimos choferes usados
     */
    obtenerHistorial: (): number[] => {
        try {
            const historial = localStorage.getItem('envios_ultimos_choferes');
            return historial ? JSON.parse(historial) : [];
        } catch {
            return [];
        }
    },

    /**
     * Guarda un chofer en el historial
     */
    guardarChofer: (choforId: number): void => {
        try {
            const historial = ChofererHistorialService.obtenerHistorial();
            const nuevoHistorial = [choforId, ...historial.filter(id => id !== choforId)].slice(0, 5);
            localStorage.setItem('envios_ultimos_choferes', JSON.stringify(nuevoHistorial));
        } catch (error) {
            console.error('Error guardando historial de choferes:', error);
        }
    },

    /**
     * Limpia el historial
     */
    limpiarHistorial: (): void => {
        try {
            localStorage.removeItem('envios_ultimos_choferes');
        } catch {
            // Ignorar errores al limpiar
        }
    }
};
