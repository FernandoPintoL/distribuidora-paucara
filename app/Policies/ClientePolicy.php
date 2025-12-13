<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Cliente;
use App\Services\AbacService;

/**
 * ============================================
 * FASE 4: POLÍTICAS CON ABAC
 * ClientePolicy - Control de acceso a Clientes
 * ============================================
 *
 * Ejemplifica cómo usar ABAC para autorización.
 * Un usuario solo puede ver clientes de su zona de venta.
 */
class ClientePolicy
{
    protected AbacService $abacService;

    public function __construct(AbacService $abacService)
    {
        $this->abacService = $abacService;
    }

    /**
     * Super Admin puede hacer cualquier cosa
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        return null;
    }

    /**
     * Ver un cliente individual
     * Requiere que el cliente esté en la zona del usuario
     */
    public function view(User $user, Cliente $cliente): bool
    {
        // Cliente puede ver sus propios datos
        if ($user->cliente && $user->cliente->id === $cliente->id) {
            return true;
        }

        // Verificar atributo zona
        return $this->abacService->puedeAcceder($user, 'cliente', $cliente->zona_id ?? $cliente->zona);
    }

    /**
     * Listar clientes
     * Devuelve solo clientes de la zona del usuario
     */
    public function viewAny(User $user): bool
    {
        // Todos los empleados pueden listar clientes
        return $user->esEmpleado();
    }

    /**
     * Crear cliente
     * Solo managers y admins pueden crear
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['Admin', 'Manager']);
    }

    /**
     * Editar cliente
     * Debe estar en la misma zona que el usuario
     */
    public function update(User $user, Cliente $cliente): bool
    {
        // Admins y managers siempre pueden
        if ($user->hasRole(['Admin', 'Manager'])) {
            return true;
        }

        // Vendedores solo pueden editar de su zona
        return $this->abacService->puedeAcceder($user, 'cliente', $cliente->zona_id ?? $cliente->zona);
    }

    /**
     * Eliminar cliente
     * Solo Admin
     */
    public function delete(User $user, Cliente $cliente): bool
    {
        return $user->hasRole('Admin');
    }
}
