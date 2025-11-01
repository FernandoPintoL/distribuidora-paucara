// Application Layer: WebSocket hook for real-time communication
import { useEffect, useCallback, useState, useRef } from 'react';
import websocketService from '@/infrastructure/services/websocket.service';
import { useAuth } from './use-auth';

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  channels?: string[];
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  isConnected: boolean;
  socketId: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeTo: (channel: string) => void;
  unsubscribeFrom: (channel: string) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
  subscribedChannels: string[];
}

/**
 * Hook para manejar la conexión WebSocket y eventos en tiempo real
 *
 * Uso básico:
 * ```tsx
 * const { status, isConnected, subscribeTo } = useWebSocket();
 *
 * useEffect(() => {
 *   if (isConnected) {
 *     subscribeTo('entrega.123');
 *   }
 * }, [isConnected]);
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, channels = [] } = options;
  const { user } = useAuth();

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [socketId, setSocketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>(channels);
  const connectionAttemptRef = useRef(false);

  // Conectar al WebSocket
  const connect = useCallback(async () => {
    if (connectionAttemptRef.current || status === 'connected') {
      return;
    }

    connectionAttemptRef.current = true;
    setStatus('connecting');
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await websocketService.connect({
        url: import.meta.env.VITE_WEBSOCKET_URL,
        auth: {
          token,
          userId: user?.id,
        },
      });

      setStatus('connected');
      setSocketId(websocketService.getSocketId());

      // Suscribirse a canales iniciales
      channels.forEach(channel => {
        websocketService.subscribeTo(channel);
      });

      // Escuchar eventos de conexión
      websocketService.on('websocket:connected', (data: any) => {
        setSocketId(data.socketId);
      });

      websocketService.on('websocket:disconnected', () => {
        setStatus('disconnected');
        setSocketId(null);
      });

      websocketService.on('websocket:error', (data: any) => {
        setStatus('error');
        setError(data.error);
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setStatus('error');
      setError(errorMessage);
      console.error('WebSocket connection error:', err);
    } finally {
      connectionAttemptRef.current = false;
    }
  }, [status, user?.id, channels]);

  // Desconectar
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setStatus('disconnected');
    setSocketId(null);
    setSubscribedChannels([]);
  }, []);

  // Suscribirse a un canal
  const subscribeTo = useCallback((channel: string) => {
    if (!websocketService.isSocketConnected()) {
      console.warn('WebSocket no está conectado');
      return;
    }

    websocketService.subscribeTo(channel);
    setSubscribedChannels(prev =>
      prev.includes(channel) ? prev : [...prev, channel]
    );
  }, []);

  // Desuscribirse de un canal
  const unsubscribeFrom = useCallback((channel: string) => {
    websocketService.unsubscribeFrom(channel);
    setSubscribedChannels(prev => prev.filter(c => c !== channel));
  }, []);

  // Escuchar evento
  const on = useCallback((event: string, callback: (data: any) => void) => {
    websocketService.on(event, callback);
  }, []);

  // Dejar de escuchar evento
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    websocketService.off(event, callback);
  }, []);

  // Emitir evento
  const emit = useCallback((event: string, data: any) => {
    websocketService.emit(event, data);
  }, []);

  // Conectar automáticamente al montar el componente
  useEffect(() => {
    if (autoConnect && user) {
      connect();
    }

    return () => {
      // No desconectar automáticamente al desmontar para mantener la conexión global
      // disconnect();
    };
  }, [autoConnect, user, connect]);

  return {
    status,
    isConnected: status === 'connected',
    socketId,
    error,
    connect,
    disconnect,
    subscribeTo,
    unsubscribeFrom,
    on,
    off,
    emit,
    subscribedChannels,
  };
}
