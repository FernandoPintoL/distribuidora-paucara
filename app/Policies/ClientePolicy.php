<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Cliente;
use App\Services\AbacService;

/**
 * ============================================
 * POLÍTICAS DE CLIENTE - CONTROL DE ACCESO GRANULAR
 * ============================================
 *
 * Control de acceso basado en:
 * - Super-Admin: Acceso total
 * - Admin: Ver todos (lectura)
 * - Preventista: Ver/editar solo SUS clientes (preventista_id)
 * - Cliente: Ver solo su propio registro
 */
class ClientePolicy
{
    protected AbacService $abacService;

    public function __construct(AbacService $abacService)
    {
        $this->abacService = $abacService;
    }

    /**
     * ✅ ACTUALIZADO: Super Admin y Admin pueden hacer casi cualquier cosa
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole(['super-admin', 'Super Admin'])) {
            return true;
        }

        // Admin: puede ver todo pero no editar
        if ($user->hasRole(['admin', 'Admin']) && in_array($ability, ['view', 'viewAny', 'audit'])) {
            return true;
        }

        return null;
    }

    /**
     * ✅ Ver un cliente individual
     */
    public function view(User $user, Cliente $cliente): bool
    {
        // Cliente puede ver sus propios datos (si tiene usuario asociado)
        if ($user->cliente && $user->cliente->id === $cliente->id) {
            return true;
        }

        // Preventista: ver solo SUS clientes (por preventista_id)
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->empleado?->id === $cliente->preventista_id;
        }

        // Fallback a ABAC (zona) si no tiene preventista_id
        $zona = $cliente->zona_id ?? $cliente->zona;
        if ($zona) {
            return $this->abacService->puedeAcceder($user, 'cliente', $zona);
        }

        return $user->esEmpleado() ?? false;
    }

    /**
     * ✅ Listar clientes
     */
    public function viewAny(User $user): bool
    {
        // Preventista, Admin, Super-Admin pueden listar
        return $user->hasRole(['Preventista', 'preventista', 'admin', 'Admin', 'super-admin', 'Super Admin']) ||
               $user->esEmpleado() ?? false;
    }

    /**
     * ✅ Crear cliente
     * Solo Preventista y Super-Admin pueden crear
     */
    public function create(User $user): bool
    {
        // Super-Admin siempre
        if ($user->hasRole(['super-admin', 'Super Admin'])) {
            return true;
        }

        // Preventista con permiso
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->hasPermissionTo('clientes.create');
        }

        // Admin NO puede crear
        return false;
    }

    /**
     * ✅ Editar cliente
     * Preventista: solo SUS clientes
     * Admin: NO puede editar
     */
    public function update(User $user, Cliente $cliente): bool
    {
        // Preventista: editar solo SUS clientes
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->hasPermissionTo('clientes.edit-own') &&
                   $user->empleado?->id === $cliente->preventista_id;
        }

        // Admin NO puede editar
        if ($user->hasRole(['admin', 'Admin'])) {
            return false;
        }

        return false;
    }

    /**
     * ✅ Eliminar cliente
     * Solo Super-Admin o Preventista (el creador)
     */
    public function delete(User $user, Cliente $cliente): bool
    {
        // Preventista: eliminar solo SUS clientes
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->hasPermissionTo('clientes.delete-own') &&
                   $user->empleado?->id === $cliente->preventista_id;
        }

        return false;
    }

    /**
     * ✅ NUEVO: Bloquear cliente
     */
    public function block(User $user, Cliente $cliente): bool
    {
        // Preventista: bloquear solo SUS clientes
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->hasPermissionTo('clientes.block-own') &&
                   $user->empleado?->id === $cliente->preventista_id;
        }

        return false;
    }

    /**
     * ✅ NUEVO: Ver auditoría
     */
    public function audit(User $user, Cliente $cliente): bool
    {
        // Preventista: ver auditoría solo de SUS clientes
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->hasPermissionTo('clientes.audit-own') &&
                   $user->empleado?->id === $cliente->preventista_id;
        }

        // Admin: ver auditoría de cualquiera
        if ($user->hasRole(['admin', 'Admin'])) {
            return $user->hasPermissionTo('clientes.audit');
        }

        return false;
    }

    /**
     * ✅ NUEVO: Cambiar estado
     */
    public function changeState(User $user, Cliente $cliente): bool
    {
        // Preventista: cambiar estado solo de SUS clientes
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->empleado?->id === $cliente->preventista_id;
        }

        return false;
    }

    /**
     * ✅ NUEVO: Restaurar cliente eliminado
     */
    public function restore(User $user, Cliente $cliente): bool
    {
        // Preventista: restaurar solo SUS clientes
        if ($user->hasRole(['Preventista', 'preventista'])) {
            return $user->empleado?->id === $cliente->preventista_id;
        }

        return false;
    }

    /**
     * ✅ NUEVO: Eliminar permanentemente
     */
    public function forceDelete(User $user, Cliente $cliente): bool
    {
        // Solo Super-Admin
        return $user->hasRole(['super-admin', 'Super Admin']);
    }
}
