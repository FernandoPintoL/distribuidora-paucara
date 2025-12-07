<?php

namespace App\Services;

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionService
{
    /**
     * ✅ Obtener todos los permisos agrupados por módulo
     * Usado por: Panel web, API mobile, etc.
     */
    public function getPermissionsGrouped()
    {
        $permissions = Permission::all();

        // Agrupar por prefijo de módulo (ej: 'ventas.', 'compras.', etc.)
        return $permissions->groupBy(function ($permission) {
            $parts = explode('.', $permission->name);
            return $parts[0] ?? 'general';
        })->map(function ($group, $module) {
            return [
                'module' => $module,
                'count' => $group->count(),
                'permissions' => $group->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'label' => str_replace('.', ' → ', $permission->name),
                    ];
                })->values(),
            ];
        })->values();
    }

    /**
     * ✅ Obtener permisos de un rol
     */
    public function getRolePermissions(Role $role)
    {
        return $role->permissions()->pluck('name')->toArray();
    }

    /**
     * ✅ Asignar múltiples permisos a un usuario
     * Usado por: Panel de admin, API, Web
     */
    public function assignPermissionsToUser(User $user, array $permissionIds)
    {
        // Obtener permisos anteriores para auditoría
        $permisosAnteriores = $user->getAllPermissions()->pluck('id')->toArray();

        $permissions = Permission::whereIn('id', $permissionIds)->pluck('name')->toArray();
        $user->syncPermissions($permissions);

        // ✅ Registrar en auditoría
        AuditService::registrarCambioUsuario(
            $user,
            $permisosAnteriores,
            $permissionIds,
            request()
        );

        return true;
    }

    /**
     * ✅ Asignar múltiples permisos a un rol
     */
    public function assignPermissionsToRole(Role $role, array $permissionIds)
    {
        // Obtener permisos anteriores para auditoría
        $permisosAnteriores = $role->permissions()->pluck('id')->toArray();

        $permissions = Permission::whereIn('id', $permissionIds)->pluck('name')->toArray();
        $role->syncPermissions($permissions);

        // ✅ Registrar en auditoría
        AuditService::registrarCambioRol(
            $role,
            $permisosAnteriores,
            $permissionIds,
            request()
        );

        return true;
    }

    /**
     * ✅ Obtener estructura de permisos para UI
     * Agrupa permisos por módulo para presentarlos mejor
     */
    public function getPermissionsForUI()
    {
        $permissions = Permission::all();

        return $permissions->groupBy(function ($permission) {
            $parts = explode('.', $permission->name);
            return $parts[0] ?? 'general';
        })
        ->map(function ($group, $module) {
            return [
                'module' => $module,
                'module_label' => $this->formatModuleLabel($module),
                'permissions' => $group->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'label' => str_replace('.', ' - ', $p->name),
                ])->values(),
            ];
        })
        ->sortBy('module')
        ->values();
    }

    /**
     * ✅ Formatear etiqueta del módulo
     */
    private function formatModuleLabel(string $module): string
    {
        $labels = [
            'ventas' => '💼 Ventas',
            'compras' => '📥 Compras',
            'inventario' => '📦 Inventario',
            'clientes' => '👥 Clientes',
            'empleados' => '👔 Empleados',
            'usuarios' => '👤 Usuarios',
            'roles' => '🔐 Roles',
            'permissions' => '🔑 Permisos',
            'proformas' => '📋 proformas',
            'envios' => '🚚 Envíos',
            'logistica' => '📍 Logística',
            'cajas' => '💰 Cajas',
            'contabilidad' => '📊 Contabilidad',
            'reportes' => '📈 Reportes',
            'configuracion' => '⚙️ Configuración',
            'admin' => '🛡️ Administración',
        ];

        return $labels[$module] ?? ucfirst($module);
    }

    /**
     * ✅ Obtener permisos de un usuario (desde usuario directo + roles)
     */
    public function getUserPermissions(User $user)
    {
        return $user->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * ✅ Verificar si usuario tiene permiso específico
     */
    public function hasPermission(User $user, string $permission): bool
    {
        return $user->hasPermissionTo($permission);
    }

    /**
     * ✅ Obtener todos los permisos para un rol (directo + heredado)
     */
    public function getRoleAllPermissions(Role $role)
    {
        return $role->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * ✅ NUEVO: Buscar usuarios por nombre o email
     */
    public function buscarUsuarios(string $query, int $limit = 20)
    {
        return User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->with('roles')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'permissions_count' => $user->getAllPermissions()->count(),
                ];
            });
    }

    /**
     * ✅ NUEVO: Buscar roles por nombre
     */
    public function buscarRoles(string $query, int $limit = 20)
    {
        return Role::where('name', 'like', "%{$query}%")
            ->orWhere('display_name', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'permissions_count' => $role->permissions()->count(),
                ];
            });
    }

    /**
     * ✅ NUEVO: Filtrar usuarios por rol
     */
    public function filtrarUsuariosPorRol(string $rol)
    {
        $role = Role::where('name', $rol)->first();

        if (!$role) {
            return collect([]);
        }

        return $role->users()
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'permissions_count' => $user->getAllPermissions()->count(),
                ];
            });
    }

    /**
     * ✅ NUEVO: Obtener usuarios con paginación y búsqueda
     */
    public function obtenerUsuariosPaginados(
        int $page = 1,
        int $perPage = 50,
        ?string $search = null,
        ?string $rol = null
    ) {
        $query = User::with('roles');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($rol) {
            $query->whereHas('roles', function ($q) use ($rol) {
                $q->where('name', $rol);
            });
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * ✅ NUEVO: Obtener roles con paginación y búsqueda
     */
    public function obtenerRolesPaginados(
        int $page = 1,
        int $perPage = 50,
        ?string $search = null
    ) {
        $query = Role::with('permissions');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('display_name', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}
