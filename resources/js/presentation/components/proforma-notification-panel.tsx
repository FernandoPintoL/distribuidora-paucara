import { useProformaNotifications } from '@/application/hooks/use-proforma-notifications';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/presentation/components/ui/dropdown-menu';
import { Bell, Trash2, Volume2, VolumeX, BellRing, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProformaNotificationPanel() {
  console.log('🔔 ProformaNotificationPanel montado');

  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    soundEnabled,
    setSoundEnabled,
    notificationsEnabled,
    requestNotificationPermission,
  } = useProformaNotifications();

  console.log(`🔔 Notificaciones actuales: ${notifications.length}, unreadCount: ${unreadCount}`);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADA':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADA':
        return 'bg-red-100 text-red-800';
      case 'CONVERTIDA':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusEmoji = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return '📋';
      case 'APROBADA':
        return '✅';
      case 'RECHAZADA':
        return '❌';
      case 'CONVERTIDA':
        return '🎉';
      default:
        return '📨';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notificaciones de proformas"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold text-sm">Notificaciones de Proformas</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Opciones de configuración */}
        <div className="px-4 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">Sonido</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-6 w-6 p-0"
            >
              {soundEnabled ? '✓' : '✕'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notificationsEnabled ? (
                <BellRing className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">Notificaciones Push</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={requestNotificationPermission}
              className="h-6 w-6 p-0"
            >
              {notificationsEnabled ? '✓' : '✕'}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 border-b last:border-0 cursor-pointer transition"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getStatusEmoji(notification.estado)}
                      </span>
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        {notification.numero}
                      </span>
                      <Badge
                        className={`text-xs ${getStatusColor(
                          notification.estado
                        )}`}
                        variant="outline"
                      >
                        {notification.estado}
                      </Badge>
                    </div>

                    <p className="text-sm mt-1">
                      <span className="font-medium">
                        {notification.cliente.nombre}
                        {notification.cliente.apellido &&
                          ` ${notification.cliente.apellido}`}
                      </span>
                    </p>

                    {notification.total > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Total: <span className="font-semibold">Bs. {notification.total.toFixed(2)}</span>
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(
                        new Date(notification.timestamp),
                        {
                          addSuffix: true,
                          locale: es,
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
