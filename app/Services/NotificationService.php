<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Proforma;
use App\Models\Venta;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Servicio para manejar notificaciones persistentes en BD
 *
 * Guarda todas las notificaciones en la tabla 'notifications'
 * para acceso posterior y auditoría
 */
class NotificationService
{
    /**
     * Crear notificación de proforma creada
     */
    public function notifyProformaCreated(Proforma $proforma): bool
    {
        try {
            // Obtener usuarios que deben recibir la notificación
            // Criterio: Preventistas, Cajeros y Admins
            $users = $this->getUsersForProformaNotification($proforma, 'created');

            foreach ($users as $user) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'proforma.creada',
                    'proforma_id' => $proforma->id,
                    'data' => [
                        'proforma_numero' => $proforma->numero,
                        'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
                        'cliente_id' => $proforma->cliente_id,
                        'total' => (float) $proforma->total,
                        'items_count' => $proforma->items->count(),
                        'estado' => $proforma->estado,
                    ],
                ]);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Error al crear notificación de proforma creada', [
                'proforma_id' => $proforma->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Crear notificación de proforma aprobada
     */
    public function notifyProformaApproved(Proforma $proforma): bool
    {
        try {
            $users = $this->getUsersForProformaNotification($proforma, 'approved');

            foreach ($users as $user) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'proforma.aprobada',
                    'proforma_id' => $proforma->id,
                    'data' => [
                        'proforma_numero' => $proforma->numero,
                        'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
                        'cliente_id' => $proforma->cliente_id,
                        'total' => (float) $proforma->total,
                        'aprobador' => $proforma->usuarioAprobador->name ?? 'Sistema',
                        'estado' => $proforma->estado,
                    ],
                ]);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Error al crear notificación de proforma aprobada', [
                'proforma_id' => $proforma->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Crear notificación de proforma rechazada
     */
    public function notifyProformaRejected(Proforma $proforma, string $reason = ''): bool
    {
        try {
            $users = $this->getUsersForProformaNotification($proforma, 'rejected');

            foreach ($users as $user) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'proforma.rechazada',
                    'proforma_id' => $proforma->id,
                    'data' => [
                        'proforma_numero' => $proforma->numero,
                        'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
                        'cliente_id' => $proforma->cliente_id,
                        'total' => (float) $proforma->total,
                        'motivo_rechazo' => $reason,
                        'rechazador' => auth()->user()->name ?? 'Sistema',
                        'estado' => $proforma->estado,
                    ],
                ]);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Error al crear notificación de proforma rechazada', [
                'proforma_id' => $proforma->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Crear notificación de proforma convertida a venta
     */
    public function notifyProformaConverted(Proforma $proforma, Venta $venta): bool
    {
        try {
            $users = $this->getUsersForProformaNotification($proforma, 'converted');

            foreach ($users as $user) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'proforma.convertida',
                    'proforma_id' => $proforma->id,
                    'venta_id' => $venta->id,
                    'data' => [
                        'proforma_numero' => $proforma->numero,
                        'venta_numero' => $venta->numero ?? null,
                        'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
                        'cliente_id' => $proforma->cliente_id,
                        'total' => (float) $venta->total ?? (float) $proforma->total,
                        'estado' => $proforma->estado,
                    ],
                ]);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Error al crear notificación de proforma convertida', [
                'proforma_id' => $proforma->id,
                'venta_id' => $venta->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Obtener usuarios que deben recibir notificación sobre una proforma
     *
     * Lógica:
     * - Cuando se CREA: Notifica a todos los preventistas, cajeros y admins
     * - Cuando se APRUEBA: Notifica al cliente y otros vendedores
     * - Cuando se RECHAZA: Notifica al cliente que creó
     * - Cuando se CONVIERTE: Notifica a logística y cobradores
     */
    private function getUsersForProformaNotification(Proforma $proforma, string $event): Collection
    {
        switch ($event) {
            case 'created':
                // Notificar a preventistas (vendedores), cajeros y admins
                return User::whereHas('roles', function ($q) {
                    $q->whereIn('name', ['preventista', 'cajero', 'admin', 'manager']);
                })->active()->get();

            case 'approved':
                // Notificar al cliente que creó la proforma y a admins
                $users = User::whereHas('roles', function ($q) {
                    $q->whereIn('name', ['admin', 'manager']);
                })->active()->get();

                // Si hay cliente vinculado, agregarlo también
                if ($proforma->cliente && $proforma->cliente->user) {
                    $users->push($proforma->cliente->user);
                }

                return $users;

            case 'rejected':
                // Notificar al cliente y admins
                $users = User::whereHas('roles', function ($q) {
                    $q->whereIn('name', ['admin', 'manager']);
                })->active()->get();

                if ($proforma->cliente && $proforma->cliente->user) {
                    $users->push($proforma->cliente->user);
                }

                return $users;

            case 'converted':
                // Notificar a logística, cobradores y admins
                return User::whereHas('roles', function ($q) {
                    $q->whereIn('name', ['logistica', 'cobrador', 'admin', 'manager']);
                })->active()->get();

            default:
                return collect();
        }
    }

    /**
     * Obtener notificaciones no leídas del usuario autenticado
     */
    public function getUnreadNotifications(User $user): Collection
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->latest()
            ->limit(50)
            ->get();
    }

    /**
     * Obtener todas las notificaciones del usuario
     */
    public function getAllNotifications(User $user, int $limit = 50): Collection
    {
        return Notification::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Marcar notificación como leída
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    public function markAllAsRead(User $user): void
    {
        Notification::where('user_id', $user->id)
            ->unread()
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Eliminar notificación
     */
    public function deleteNotification(Notification $notification): void
    {
        $notification->delete();
    }

    /**
     * Eliminar todas las notificaciones de un usuario
     */
    public function deleteAllNotifications(User $user): int
    {
        return Notification::where('user_id', $user->id)->delete();
    }

    /**
     * Obtener estadísticas de notificaciones
     */
    public function getNotificationStats(User $user): array
    {
        return [
            'total' => Notification::where('user_id', $user->id)->count(),
            'unread' => Notification::where('user_id', $user->id)->unread()->count(),
            'read' => Notification::where('user_id', $user->id)->read()->count(),
        ];
    }
}
