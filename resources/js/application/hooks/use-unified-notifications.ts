/**
 * Unified Notifications Hook
 * Listens to ALL WebSocket events and manages them centrally
 * Supports role-based filtering and notification persistence
 */

import { useEffect, useCallback, useRef } from 'react';
import websocketService from '@/infrastructure/services/websocket.service';
import {
  BaseNotification,
  NotificationType,
  EVENT_ROLE_MAPPING,
  getEventCategory,
  WebSocketEvent,
} from '@/domain/entities/websocket-events';

interface UseUnifiedNotificationsOptions {
  userRoles?: string[];
  onNotification?: (notification: BaseNotification) => void;
  onError?: (error: Error) => void;
  filterByRoles?: boolean;
  autoSubscribePublic?: boolean;
  autoSubscribeUser?: boolean;
  userId?: number;
  orgId?: number;
}

export const useUnifiedNotifications = (options: UseUnifiedNotificationsOptions = {}) => {
  const {
    userRoles = [],
    onNotification,
    onError,
    filterByRoles = true,
    autoSubscribePublic = true,
    autoSubscribeUser = true,
    userId,
    orgId,
  } = options;

  const notificationsRef = useRef<Map<string, BaseNotification>>(new Map());
  const listenersRef = useRef<Map<string, () => void>>(new Map());

  /**
   * Check if current user should receive this notification
   */
  const shouldReceiveNotification = useCallback((eventName: string): boolean => {
    if (!filterByRoles) return true;

    const allowedRoles = EVENT_ROLE_MAPPING[eventName];
    if (!allowedRoles) return true; // If no role mapping, allow all

    return userRoles.some(role => allowedRoles.includes(role));
  }, [userRoles, filterByRoles]);

  /**
   * Create notification object from event data
   */
  const createNotification = useCallback((
    eventName: string,
    data: any
  ): BaseNotification => {
    const timestamp = new Date().toISOString();
    const id = `${eventName}-${timestamp}`;

    // Map event names to titles and messages
    const notificationMap: Record<string, { title: string; message: (data: any) => string }> = {
      'proforma.creada': {
        title: '📋 Nueva Proforma',
        message: (d) => `${d.clienteNombre} - ${d.numero}`,
      },
      'proforma.aprobada': {
        title: '✅ Proforma Aprobada',
        message: (d) => `${d.clienteNombre} - ${d.numero}`,
      },
      'proforma.rechazada': {
        title: '❌ Proforma Rechazada',
        message: (d) => `${d.clienteNombre} - ${d.numero}`,
      },
      'proforma.convertida': {
        title: '🔄 Proforma Convertida',
        message: (d) => `${d.clienteNombre} - Venta ${d.ventaNumero}`,
      },
      'proforma.coordinacion-actualizada': {
        title: '📝 Coordinación Actualizada',
        message: (d) => `Proforma ${d.numero}`,
      },
      'entrega.asignada': {
        title: '🚗 Entrega Asignada',
        message: (d) => `${d.choferNombre} - ${d.clienteNombre}`,
      },
      'entrega.en-camino': {
        title: '🚗 Entrega en Camino',
        message: (d) => `${d.choferNombre} - ${d.numero}`,
      },
      'entrega.confirmada': {
        title: '✔️ Entrega Confirmada',
        message: (d) => `${d.clienteNombre} - ${d.numero}`,
      },
      'entrega.completada': {
        title: '✅ Entrega Completada',
        message: (d) => `${d.clienteNombre} - ${d.choferNombre}`,
      },
      'entrega.creada': {
        title: '📦 Nueva Entrega',
        message: (d) => `${d.clienteNombre} - ${d.numero}`,
      },
      'entrega.rechazada': {
        title: '❌ Entrega Rechazada',
        message: (d) => `${d.clienteNombre} - ${d.razon}`,
      },
      'ubicacion.actualizada': {
        title: '📍 Ubicación Actualizada',
        message: (d) => `${d.choferNombre} - En ruta`,
      },
      'ubicacion.llegada-confirmada': {
        title: '📍 Llegada Confirmada',
        message: (d) => `${d.choferNombre} - ${d.clienteNombre}`,
      },
      'ruta.planificada': {
        title: '🗺️ Ruta Planificada',
        message: (d) => `Chofer ${d.choferNombre} - ${d.cantidadParadas} paradas`,
      },
      'ruta.detalle-actualizado': {
        title: '🗺️ Detalle de Ruta Actualizado',
        message: (d) => `Ruta ${d.rutaId} actualizada`,
      },
      'ruta.modificada': {
        title: '🗺️ Ruta Modificada',
        message: (d) => `${d.numero} - ${d.razonModificacion}`,
      },
      'novedad.reportada': {
        title: '⚠️ Novedad Reportada',
        message: (d) => `${d.tipo} - ${d.descripcion}`,
      },
      'novedad.entrega-reportada': {
        title: '⚠️ Novedad en Entrega',
        message: (d) => `${d.tipo} - ${d.entregaNumero}`,
      },
      'chofer.en-camino': {
        title: '🚗 Chofer en Camino',
        message: (d) => `${d.choferNombre} - Ruta ${d.rutaId}`,
      },
      'chofer.llego': {
        title: '🚗 Chofer Llegó',
        message: (d) => `${d.choferNombre} - ${d.clienteNombre}`,
      },
      'pedido.entregado': {
        title: '📦 Pedido Entregado',
        message: (d) => `${d.clienteNombre} - ${d.pedidoNumero}`,
      },
      'dashboard.metrics-updated': {
        title: '📊 Dashboard Actualizado',
        message: () => 'Métricas de negocio actualizadas',
      },
    };

    const config = notificationMap[eventName];
    const title = config?.title || `Evento: ${eventName}`;
    const message = config?.message(data) || JSON.stringify(data).substring(0, 100);

    return {
      id,
      type: getEventCategory(eventName),
      title,
      message,
      data,
      read: false,
      createdAt: timestamp,
      roles: EVENT_ROLE_MAPPING[eventName],
    };
  }, []);

  /**
   * Handle incoming notification
   */
  const handleNotification = useCallback((eventName: string) => {
    return (eventData: any) => {
      try {
        if (!shouldReceiveNotification(eventName)) {
          console.log(`⏭️ Notificación omitida (rol no permitido): ${eventName}`);
          return;
        }

        const notification = createNotification(eventName, eventData);
        notificationsRef.current.set(notification.id, notification);

        console.log(`📬 Notificación recibida: ${eventName}`, notification);

        // Play notification sound
        // playNotificationSound();  // Desactivado temporalmente

        // Call user callback
        if (onNotification) {
          onNotification(notification);
        }

        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: eventName,
          });
        }
      } catch (error) {
        console.error(`Error procesando evento ${eventName}:`, error);
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
  }, [shouldReceiveNotification, createNotification, onNotification, onError]);

  /**
   * Setup all event listeners
   */
  useEffect(() => {
    if (!websocketService.isSocketConnected()) {
      console.warn('WebSocket no conectado, esperando conexión...');
      return;
    }

    console.log('🔔 Configurando listeners de notificaciones unificadas...');

    // PROFORMA EVENTS
    const setupListener = (eventName: string) => {
      try {
        websocketService.on(eventName, handleNotification(eventName));
        listenersRef.current.set(eventName, () => {
          websocketService.off(eventName, handleNotification(eventName));
        });
      } catch (error) {
        console.error(`Error configurando listener para ${eventName}:`, error);
      }
    };

    // Setup all listeners
    const events = [
      'proforma.creada',
      'proforma.aprobada',
      'proforma.rechazada',
      'proforma.convertida',
      'proforma.coordinacion-actualizada',
      'entrega.asignada',
      'entrega.en-camino',
      'entrega.confirmada',
      'entrega.completada',
      'entrega.creada',
      'entrega.rechazada',
      'ubicacion.actualizada',
      'ubicacion.llegada-confirmada',
      'ruta.planificada',
      'ruta.detalle-actualizado',
      'ruta.modificada',
      'novedad.reportada',
      'novedad.entrega-reportada',
      'chofer.en-camino',
      'chofer.llego',
      'pedido.entregado',
      'dashboard.metrics-updated',
    ];

    events.forEach(setupListener);

    // Auto-subscribe to channels if configured
    if (autoSubscribePublic) {
      websocketService.subscribeToPublicProformas();
      websocketService.subscribeToPublicDeliveries();
      websocketService.subscribeToPublicRoutes();
      websocketService.subscribeToTracking();
    }

    if (autoSubscribeUser && userId) {
      websocketService.subscribeToUser(userId);
    }

    if (orgId) {
      websocketService.subscribeToOrganization(orgId);
    }

    console.log('✅ Listeners de notificaciones configurados exitosamente');

    // Cleanup
    return () => {
      console.log('🧹 Limpiando listeners de notificaciones...');
      listenersRef.current.forEach(cleanup => cleanup());
      listenersRef.current.clear();
    };
  }, [handleNotification, autoSubscribePublic, autoSubscribeUser, userId, orgId]);

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  /**
   * Play notification sound
   */
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch((error) => {
        console.log('No se pudo reproducir sonido de notificación:', error);
      });
    } catch (error) {
      console.log('Error reproduciendo sonido:', error);
    }
  }, []);

  /**
   * Get all notifications
   */
  const getNotifications = useCallback(() => {
    return Array.from(notificationsRef.current.values());
  }, []);

  /**
   * Clear notifications
   */
  const clearNotifications = useCallback(() => {
    notificationsRef.current.clear();
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    const notification = notificationsRef.current.get(notificationId);
    if (notification) {
      notification.read = true;
    }
  }, []);

  return {
    getNotifications,
    clearNotifications,
    markAsRead,
    requestNotificationPermission,
    notifications: Array.from(notificationsRef.current.values()),
    unreadCount: Array.from(notificationsRef.current.values()).filter(n => !n.read).length,
  };
};

export default useUnifiedNotifications;
