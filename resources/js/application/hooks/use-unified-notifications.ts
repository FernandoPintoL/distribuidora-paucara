/**
 * Unified Notifications Hook
 * Listens to ALL WebSocket events and manages them centrally
 * Supports role-based filtering and notification persistence
 */

import { useEffect, useCallback, useRef, useState } from 'react';
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

  // ✅ CRITICAL: Usar state en lugar de ref para trigger re-renders cuando lleguen notificaciones
  const [notifications, setNotifications] = useState<BaseNotification[]>([]);
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
        message: (d) => `${d.clienteNombre || d.cliente?.nombre || 'Cliente'} - ${d.numero || d.proforma_numero}`,
      },
      'proforma.aprobada': {
        title: '✅ Proforma Aprobada',
        message: (d) => `${d.clienteNombre || d.cliente?.nombre || 'Cliente'} - ${d.numero || d.proforma_numero}`,
      },
      'proforma.rechazada': {
        title: '❌ Proforma Rechazada',
        message: (d) => `${d.clienteNombre || d.cliente?.nombre || 'Cliente'} - ${d.numero || d.proforma_numero}`,
      },
      'proforma.convertida': {
        title: '🔄 Proforma Convertida',
        message: (d) => `${d.clienteNombre || d.cliente?.nombre || 'Cliente'} - Venta ${d.ventaNumero}`,
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
      'venta.preparacion-carga': {
        title: '📦 Venta en Preparación',
        message: (d) => `${d.cantidad_ventas || 1} venta${d.cantidad_ventas > 1 ? 's' : ''} en preparación - ${d.numero_entrega || 'Entrega'}`,
      },
      'venta.listo-para-entrega': {
        title: '✅ Venta Lista para Entrega',
        message: (d) => `${d.cantidad_ventas || 1} venta${d.cantidad_ventas > 1 ? 's' : ''} lista${d.cantidad_ventas > 1 ? 's' : ''} para envío - ${d.numero_entrega || 'Entrega'}`,
      },
      'venta.listo-para-entrega-admin': {
        title: '📦 Ventas Listas para Envío',
        message: (d) => `${d.cantidad_ventas || 1} venta${d.cantidad_ventas > 1 ? 's' : ''} de ${d.clientes_unicos || 1} cliente${d.clientes_unicos > 1 ? 's' : ''} - Entrega ${d.numero_entrega || 'N/A'}`,
      },
      'venta.en-transito': {
        title: '🚚 Venta en Tránsito',
        message: (d) => `${d.cantidad_ventas || 1} venta${d.cantidad_ventas > 1 ? 's' : ''} en camino - Chofer: ${d.chofer?.nombre || 'N/A'}`,
      },
      'venta.entregada': {
        title: '✅ Venta Entregada',
        message: (d) => `Tu venta ${d.venta_numero} ha sido entregada`,
      },
      'venta.entregada-admin': {
        title: '✅ Venta Entregada',
        message: (d) => `Venta ${d.venta_numero} de ${d.cliente_nombre} ha sido entregada`,
      },
      'entrega.en-transito-admin': {
        title: '🚚 Entrega en Tránsito',
        message: (d) => `${d.cantidad_ventas || 1} venta${d.cantidad_ventas > 1 ? 's' : ''} de ${d.clientes_unicos || 1} cliente${d.clientes_unicos > 1 ? 's' : ''} en camino`,
      },
      'entrega.finalizada-admin': {
        title: '✅ Entrega Finalizada',
        message: (d) => `Entrega ${d.numero_entrega} completada - ${d.cantidad_ventas || 1} venta${d.cantidad_ventas > 1 ? 's' : ''} entregada${d.cantidad_ventas > 1 ? 's' : ''}`,
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
      'credito.vencido': {
        title: '⚠️ Crédito Vencido',
        message: (d) => `${d.cliente_nombre} - Deuda: Bs. ${d.saldo_pendiente}`,
      },
      'credito.critico': {
        title: '🔴 Crédito Crítico',
        message: (d) => `${d.cliente_nombre} - ${d.porcentaje_utilizado}% utilizado`,
      },
      'credito.pago-registrado': {
        title: '✅ Pago Registrado',
        message: (d) => `Bs. ${d.monto} - ${d.tipo_pago}`,
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

        // ✅ DEDUPLICACIÓN: Evitar notificaciones duplicadas
        // Si ya existe una notificación con el mismo evento + datos en los últimos 500ms, ignorarla
        const eventKey = `${eventName}:${eventData.id || eventData.proforma_id || eventData.numero}`;
        const lastNotifTime = (window as any).__lastNotificationEvents?.[eventKey] || 0;
        const now = Date.now();

        if (now - lastNotifTime < 500) { // Si llegó en menos de 500ms, es duplicada
          console.log(`⏭️ Notificación duplicada ignorada: ${eventName} (misma dentro de 500ms)`);
          return;
        }

        // Registrar que recibimos este evento
        if (!(window as any).__lastNotificationEvents) {
          (window as any).__lastNotificationEvents = {};
        }
        (window as any).__lastNotificationEvents[eventKey] = now;

        const notification = createNotification(eventName, eventData);
        notificationsRef.current.set(notification.id, notification);

        // ✅ CRITICAL: Actualizar state para trigger re-render del componente
        setNotifications(Array.from(notificationsRef.current.values()));

        console.log(`📬 Notificación recibida: ${eventName}`, notification);
        console.log(`🔔 Total de notificaciones: ${notificationsRef.current.size}, No leídas: ${Array.from(notificationsRef.current.values()).filter(n => !n.read).length}`);

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

  // ✅ Rastrear si ya se han configurado los listeners para evitar reconfiguración
  const listenersConfiguredRef = useRef(false);

  /**
   * Setup all event listeners
   */
  useEffect(() => {
    if (!websocketService.isSocketConnected()) {
      console.warn('WebSocket no conectado, esperando conexión...');
      // Reset flag si desconecta
      listenersConfiguredRef.current = false;
      return;
    }

    // ✅ IMPORTANTE: Evitar reconfiguración múltiple de listeners
    // Solo configurar UNA VEZ cuando el WebSocket se conecta
    if (listenersConfiguredRef.current) {
      console.log('ℹ️ Listeners ya configurados, omitiendo reconfiguración');
      return;
    }

    console.log('🔔 Configurando listeners de notificaciones unificadas...');

    // PROFORMA EVENTS
    const setupListener = (eventName: string) => {
      try {
        const listener = handleNotification(eventName);
        websocketService.on(eventName, listener);
        listenersRef.current.set(eventName, () => {
          websocketService.off(eventName, listener);
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
      'venta.preparacion-carga',
      'venta.listo-para-entrega',
      'venta.listo-para-entrega-admin',
      'venta.en-transito',
      'venta.entregada',
      'venta.entregada-admin',
      'entrega.en-transito-admin',
      'entrega.finalizada-admin',
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
      'credito.vencido',
      'credito.critico',
      'credito.pago-registrado',
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

    // ✅ Marcar que los listeners ya están configurados
    listenersConfiguredRef.current = true;

    console.log('✅ Listeners de notificaciones configurados exitosamente');

    // Cleanup
    return () => {
      console.log('🧹 Limpiando listeners de notificaciones...');
      listenersConfiguredRef.current = false;
      listenersRef.current.forEach(cleanup => cleanup());
      listenersRef.current.clear();
    };
  }, []); // ✅ Dependencias vacías - solo se ejecuta una vez en mount

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
    // ✅ Actualizar state para re-render
    setNotifications([]);
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    const notification = notificationsRef.current.get(notificationId);
    if (notification) {
      notification.read = true;
      // ✅ Actualizar state para re-render
      setNotifications(Array.from(notificationsRef.current.values()));
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    getNotifications,
    clearNotifications,
    markAsRead,
    requestNotificationPermission,
    notifications, // ✅ Ahora es state, causa re-renders
    unreadCount, // ✅ Calcula desde state
  };
};

export default useUnifiedNotifications;
