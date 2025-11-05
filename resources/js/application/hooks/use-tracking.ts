// Application Layer: Hook for real-time delivery tracking
import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from './use-websocket';

export interface UbicacionData {
  id: number;
  entrega_id: number;
  latitud: number;
  longitud: number;
  velocidad?: number;
  direccion?: string;
  timestamp: string;
}

export interface EntregaEstadoData {
  entrega_id: number;
  estado_anterior: string;
  estado_nuevo: string;
  motivo?: string;
  timestamp: string;
}

export interface EntregaNovedadData {
  entrega_id: number;
  tipo: string;
  descripcion: string;
  timestamp: string;
}

interface UseTrackingOptions {
  entregaId?: number;
  autoSubscribe?: boolean;
}

interface UseTrackingReturn {
  ubicacion: UbicacionData | null;
  estadoActual: string | null;
  novedades: EntregaNovedadData[];
  isTracking: boolean;
  startTracking: (entregaId: number) => void;
  stopTracking: (entregaId: number) => void;
  updateUbicacion: (ubicacion: UbicacionData) => void;
  clearNovedades: () => void;
}

/**
 * Hook para rastrear entregas en tiempo real
 *
 * Uso:
 * ```tsx
 * const { ubicacion, isTracking, startTracking } = useTracking({ entregaId: 123 });
 *
 * return (
 *   <>
 *     {ubicacion && (
 *       <div>
 *         Lat: {ubicacion.latitud}, Lng: {ubicacion.longitud}
 *       </div>
 *     )}
 *   </>
 * );
 * ```
 */
export function useTracking(options: UseTrackingOptions = {}): UseTrackingReturn {
  const { entregaId, autoSubscribe = true } = options;
  const { subscribeTo, unsubscribeFrom, on, off, isConnected } = useWebSocket({
    autoConnect: true,
  });

  const [ubicacion, setUbicacion] = useState<UbicacionData | null>(null);
  const [estadoActual, setEstadoActual] = useState<string | null>(null);
  const [novedades, setNovedades] = useState<EntregaNovedadData[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  // Iniciar rastreo de una entrega
  const startTracking = useCallback((id: number) => {
    if (!isConnected) {
      console.warn('WebSocket no está conectado');
      return;
    }

    const channelName = `entrega.${id}`;
    subscribeTo(channelName);
    setIsTracking(true);

    // Escuchar actualizaciones de ubicación
    on('ubicacion.actualizada', (data: any) => {
      if (data.data?.entrega_id === id) {
        setUbicacion(data.data);
      }
    });

    // Escuchar cambios de estado
    on('entrega.estado-cambio', (data: any) => {
      if (data.data?.entrega_id === id) {
        setEstadoActual(data.data.estado_nuevo);
      }
    });

    // Escuchar novedades
    on('novedad.reportada', (data: any) => {
      if (data.data?.entrega_id === id) {
        setNovedades(prev => [...prev, data.data]);
      }
    });

    // Escuchar eventos del chofer
    on('chofer.en-camino', (data: any) => {
      if (data.data?.entrega_id === id) {
        setEstadoActual('en_camino');
      }
    });

    on('chofer.llegada', (data: any) => {
      if (data.data?.entrega_id === id) {
        setEstadoActual('entregado');
      }
    });
  }, [isConnected, subscribeTo, on]);

  // Detener rastreo de una entrega
  const stopTracking = useCallback((id: number) => {
    const channelName = `entrega.${id}`;
    unsubscribeFrom(channelName);

    // Remover listeners
    off('ubicacion.actualizada');
    off('entrega.estado-cambio');
    off('novedad.reportada');
    off('chofer.en-camino');
    off('chofer.llegada');

    setIsTracking(false);
    setUbicacion(null);
    setEstadoActual(null);
    setNovedades([]);
  }, [unsubscribeFrom, off]);

  // Actualizar ubicación manualmente (útil para testing)
  const updateUbicacion = useCallback((newUbicacion: UbicacionData) => {
    setUbicacion(newUbicacion);
  }, []);

  // Limpiar novedades
  const clearNovedades = useCallback(() => {
    setNovedades([]);
  }, []);

  // Auto-suscribirse si se proporciona entregaId
  useEffect(() => {
    if (autoSubscribe && entregaId && isConnected) {
      startTracking(entregaId);

      return () => {
        stopTracking(entregaId);
      };
    }
  }, [autoSubscribe, entregaId, isConnected, startTracking, stopTracking]);

  return {
    ubicacion,
    estadoActual,
    novedades,
    isTracking,
    startTracking,
    stopTracking,
    updateUbicacion,
    clearNovedades,
  };
}
