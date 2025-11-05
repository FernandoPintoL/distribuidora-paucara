<?php

namespace App\Policies;

use App\Models\Cliente;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ClientePolicy
{
    /**
     * REGLA FUNDAMENTAL:
     * - Rol "Gestor de Clientes": Empleado que CREA/EDITA clientes (NO es un cliente)
     * - Rol "Preventista": Empleado de prevención con gestión completa de clientes
     * - Rol "Vendedor": Empleado de ventas que puede crear/editar clientes
     * - Rol "Cliente": Usuario FINAL que accede como cliente (solo su perfil)
     * - Admin/Manager/Super Admin: Acceso total
     */

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Gestores de clientes, admins, managers, vendedores y preventistas pueden ver todos
        if ($user->hasAnyRole(['Gestor de Clientes', 'Admin', 'Manager', 'Super Admin', 'Vendedor', 'Preventista'])) {
            return true;
        }
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Cliente $cliente): bool
    {
        // Gestores pueden ver cualquier cliente
        if ($user->hasAnyRole(['Gestor de Clientes', 'Admin', 'Manager', 'Super Admin', 'Vendedor', 'Preventista'])) {
            return true;
        }

        // Cliente solo puede ver su propio perfil
        if ($user->hasRole('Cliente') && $cliente->user_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Solo gestores de clientes, vendedores, preventistas, choferes, cajeros y admins pueden crear clientes
        return $user->hasAnyRole(['Gestor de Clientes', 'Vendedor', 'Chofer', 'Cajero', 'Preventista', 'Admin', 'Manager', 'Super Admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Cliente $cliente): bool
    {
        // Gestores pueden editar cualquier cliente
        if ($user->hasAnyRole(['Gestor de Clientes', 'Admin', 'Manager', 'Super Admin', 'Preventista'])) {
            return true;
        }

        // Vendedores, choferes y cajeros pueden editar clientes que crearon
        if ($user->hasAnyRole(['Vendedor', 'Chofer', 'Cajero'])) {
            return true; // Podrías restrictar a clientes que creó agregando: && $cliente->usuario_creacion_id === $user->id
        }

        // Cliente solo puede editar su propio perfil
        if ($user->hasRole('Cliente') && $cliente->user_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Cliente $cliente): bool
    {
        // Solo admins y managers pueden eliminar clientes
        return $user->hasAnyRole(['Admin', 'Manager', 'Super Admin']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Cliente $cliente): bool
    {
        // Solo admins y managers pueden restaurar clientes
        return $user->hasAnyRole(['Admin', 'Manager', 'Super Admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Cliente $cliente): bool
    {
        // Solo super admin puede eliminar permanentemente
        return $user->hasRole('Super Admin');
    }
}
