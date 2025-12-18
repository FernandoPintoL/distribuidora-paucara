<?php

namespace App\Services\Notifications;

use App\Models\Proforma;
use App\Models\Venta;
use App\Models\User;
use App\Services\WebSocket\ProformaWebSocketService;
use Illuminate\Support\Collection;

/**
 * Servicio orquestador de notificaciones de proformas
 *
 * Este servicio coordina entre:
 * - Notificaciones en BD (DatabaseNotificationService)
 * - Notificaciones en tiempo real (ProformaWebSocketService)
 *
 * Responsabilidad única: Lógica de negocio de notificaciones de proformas
 */
class ProformaNotificationService
{
    protected DatabaseNotificationService $dbNotificationService;
    protected ProformaWebSocketService $wsService;

    public function __construct(
        DatabaseNotificationService $dbNotificationService,
        ProformaWebSocketService $wsService
    ) {
        $this->dbNotificationService = $dbNotificationService;
        $this->wsService = $wsService;
    }

    /**
     * Notificar creación de proforma
     * - Guarda en BD para todos los usuarios relevantes
     * - Envía notificación en tiempo real vía WebSocket
     */
    public function notifyCreated(Proforma $proforma): bool
    {
        // 1. Obtener usuarios a notificar
        $users = $this->getUsersForCreated($proforma);
        $userIds = $users->pluck('id')->toArray();

        // 2. Guardar en BD (persistente)
        $this->dbNotificationService->create($userIds, 'proforma.creada', [
            'proforma_numero' => $proforma->numero,
            'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
            'cliente_id' => $proforma->cliente_id,
            'total' => (float) $proforma->total,
            'items_count' => $proforma->detalles->count(),
            'estado' => $proforma->estado,
        ], [
            'proforma_id' => $proforma->id,
        ]);

        // 3. Enviar notificación en tiempo real vía WebSocket
        return $this->wsService->notifyCreated($proforma);
    }

    /**
     * Notificar aprobación de proforma
     */
    public function notifyApproved(Proforma $proforma): bool
    {
        // 1. Obtener usuarios a notificar
        $users = $this->getUsersForApproved($proforma);
        $userIds = $users->pluck('id')->toArray();

        // 2. Guardar en BD
        $this->dbNotificationService->create($userIds, 'proforma.aprobada', [
            'proforma_numero' => $proforma->numero,
            'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
            'cliente_id' => $proforma->cliente_id,
            'total' => (float) $proforma->total,
            'aprobador' => $proforma->usuarioAprobador->name ?? 'Sistema',
            'estado' => $proforma->estado,
        ], [
            'proforma_id' => $proforma->id,
        ]);

        // 3. WebSocket
        return $this->wsService->notifyApproved($proforma);
    }

    /**
     * Notificar rechazo de proforma
     */
    public function notifyRejected(Proforma $proforma, string $reason = ''): bool
    {
        // 1. Obtener usuarios a notificar
        $users = $this->getUsersForRejected($proforma);
        $userIds = $users->pluck('id')->toArray();

        // 2. Guardar en BD
        $this->dbNotificationService->create($userIds, 'proforma.rechazada', [
            'proforma_numero' => $proforma->numero,
            'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
            'cliente_id' => $proforma->cliente_id,
            'total' => (float) $proforma->total,
            'motivo_rechazo' => $reason,
            'rechazador' => auth()->user()->name ?? 'Sistema',
            'estado' => $proforma->estado,
        ], [
            'proforma_id' => $proforma->id,
        ]);

        // 3. WebSocket
        return $this->wsService->notifyRejected($proforma, $reason);
    }

    /**
     * Notificar conversión de proforma a venta
     */
    public function notifyConverted(Proforma $proforma, Venta $venta): bool
    {
        // 1. Obtener usuarios a notificar
        $users = $this->getUsersForConverted($proforma);
        $userIds = $users->pluck('id')->toArray();

        // 2. Guardar en BD
        $this->dbNotificationService->create($userIds, 'proforma.convertida', [
            'proforma_numero' => $proforma->numero,
            'venta_numero' => $venta->numero ?? null,
            'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
            'cliente_id' => $proforma->cliente_id,
            'total' => (float) $venta->total ?? (float) $proforma->total,
            'estado' => $proforma->estado,
        ], [
            'proforma_id' => $proforma->id,
            'venta_id' => $venta->id,
        ]);

        // 3. WebSocket
        return $this->wsService->notifyConverted($proforma, $venta);
    }

    /**
     * Notificar actualización de coordinación de entrega
     */
    public function notifyCoordination(Proforma $proforma, int $usuarioId): bool
    {
        // 1. Obtener usuarios a notificar
        $users = $this->getUsersForCoordination($proforma);
        $userIds = $users->pluck('id')->toArray();

        // 2. Guardar en BD
        $this->dbNotificationService->create($userIds, 'proforma.coordinacion.actualizada', [
            'proforma_numero' => $proforma->numero,
            'cliente_nombre' => $proforma->cliente->nombre ?? 'Cliente',
            'cliente_id' => $proforma->cliente_id,
            'usuario_actualizo' => User::find($usuarioId)->name ?? 'Sistema',
            'fecha_entrega_confirmada' => $proforma->fecha_entrega_confirmada?->format('d/m/Y'),
            'hora_entrega_confirmada' => $proforma->hora_entrega_confirmada,
            'entregado_en' => $proforma->entregado_en?->format('d/m/Y H:i'),
            'entregado_a' => $proforma->entregado_a,
            'numero_intentos' => $proforma->numero_intentos_contacto,
        ], [
            'proforma_id' => $proforma->id,
        ]);

        // 3. WebSocket
        return $this->wsService->notifyCoordination($proforma, $usuarioId);
    }

    // ========================================
    // MÉTODOS PRIVADOS - LÓGICA DE USUARIOS
    // ========================================

    /**
     * Usuarios para notificar cuando se ACTUALIZA coordinación
     * Criterio: Preventistas, Managers, Admins, Creador y Cliente
     */
    private function getUsersForCoordination(Proforma $proforma): Collection
    {
        $users = collect();

        // 1. Preventistas, managers y admins
        $staffUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['preventista', 'manager', 'admin']);
        })->where('activo', true)->get();
        $users = $users->merge($staffUsers);

        // 2. Usuario que creó la proforma
        if ($proforma->usuario_creador_id) {
            $creador = User::where('id', $proforma->usuario_creador_id)
                ->where('activo', true)
                ->first();
            if ($creador) {
                $users->push($creador);
            }
        }

        // 3. Cliente (usuario asociado al cliente, si existe)
        if ($proforma->cliente && $proforma->cliente->user_id) {
            $clienteUser = User::where('id', $proforma->cliente->user_id)
                ->where('activo', true)
                ->first();
            if ($clienteUser) {
                $users->push($clienteUser);
            }
        }

        return $users->unique('id');
    }

    /**
     * Usuarios para notificar cuando se CREA una proforma
     * Criterio: Preventistas, Cajeros y Admins
     */
    private function getUsersForCreated(Proforma $proforma): Collection
    {
        return User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['preventista', 'cajero', 'admin', 'manager']);
        })->where('activo', true)->get();
    }

    /**
     * Usuarios para notificar cuando se APRUEBA una proforma
     * Criterio: Creador de la proforma, Cliente asociado, Admins
     */
    private function getUsersForApproved(Proforma $proforma): Collection
    {
        $users = collect();

        // 1. Admins y managers
        $adminUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['admin', 'manager']);
        })->where('activo', true)->get();
        $users = $users->merge($adminUsers);

        // 2. Usuario que creó la proforma
        if ($proforma->usuario_creador_id) {
            $creador = User::where('id', $proforma->usuario_creador_id)
                ->where('activo', true)
                ->first();
            if ($creador) {
                $users->push($creador);
            }
        }

        // 3. Cliente (usuario asociado al cliente, si existe)
        if ($proforma->cliente && $proforma->cliente->user_id) {
            $clienteUser = User::where('id', $proforma->cliente->user_id)
                ->where('activo', true)
                ->first();
            if ($clienteUser) {
                $users->push($clienteUser);
            }
        }

        return $users->unique('id');
    }

    /**
     * Usuarios para notificar cuando se RECHAZA una proforma
     * Criterio: Creador de la proforma (MUY IMPORTANTE), Cliente asociado, Admins
     */
    private function getUsersForRejected(Proforma $proforma): Collection
    {
        $users = collect();

        // 1. Admins y managers
        $adminUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['admin', 'manager']);
        })->where('activo', true)->get();
        $users = $users->merge($adminUsers);

        // 2. Usuario que creó la proforma (debe saber que fue rechazada)
        if ($proforma->usuario_creador_id) {
            $creador = User::where('id', $proforma->usuario_creador_id)
                ->where('activo', true)
                ->first();
            if ($creador) {
                $users->push($creador);
            }
        }

        // 3. Cliente (usuario asociado al cliente)
        if ($proforma->cliente && $proforma->cliente->user_id) {
            $clienteUser = User::where('id', $proforma->cliente->user_id)
                ->where('activo', true)
                ->first();
            if ($clienteUser) {
                $users->push($clienteUser);
            }
        }

        return $users->unique('id');
    }

    /**
     * Usuarios para notificar cuando se CONVIERTE una proforma a venta
     * Criterio: Logística, Cobradores, Creador, Cliente, Admins
     */
    private function getUsersForConverted(Proforma $proforma): Collection
    {
        $users = collect();

        // 1. Logística, cobradores y admins
        $logisticaUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['logistica', 'cobrador', 'admin', 'manager']);
        })->where('activo', true)->get();
        $users = $users->merge($logisticaUsers);

        // 2. Usuario que creó la proforma
        if ($proforma->usuario_creador_id) {
            $creador = User::where('id', $proforma->usuario_creador_id)
                ->where('activo', true)
                ->first();
            if ($creador) {
                $users->push($creador);
            }
        }

        // 3. Cliente (usuario asociado al cliente)
        if ($proforma->cliente && $proforma->cliente->user_id) {
            $clienteUser = User::where('id', $proforma->cliente->user_id)
                ->where('activo', true)
                ->first();
            if ($clienteUser) {
                $users->push($clienteUser);
            }
        }

        return $users->unique('id');
    }
}
