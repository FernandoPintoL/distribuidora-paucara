<?php

namespace App\Http\Controllers;

use App\Services\PermissionService;
use App\Services\AuditService;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends Controller
{
    public function __construct(
        private PermissionService $permissionService
    ) {}

    /**
     * ✅ PANEL UNIFICADO: Centro de permisos y roles
     * Renderiza el nuevo panel con tabs para usuarios y roles
     */
    public function index()
    {
        $this->authorize('permissions.index');

        // El nuevo componente React carga los datos dinámicamente via API
        return Inertia::render('admin/permisos/index');
    }

    /**
     * ✅ PANEL WEB: Editar permisos de un usuario específico
     */
    public function editarUsuario(User $user)
    {
        $this->authorize('usuarios.assign-permission');

        $permisosActuales = $user->getAllPermissions()->pluck('id')->toArray();
        $todosLosPermisos = $this->permissionService->getPermissionsForUI();
        $rolesActuales = $user->roles->pluck('name')->toArray();

        return Inertia::render('admin/permisos/usuario', [
            'usuario' => $user,
            'permisosActuales' => $permisosActuales,
            'rolesActuales' => $rolesActuales,
            'todosLosPermisos' => $todosLosPermisos,
        ]);
    }

    /**
     * ✅ API: Actualizar permisos de un usuario
     * Usado por: Panel web + APP móvil
     */
    public function actualizarUsuario(Request $request, User $user)
    {
        $this->authorize('usuarios.assign-permission');

        $validated = $request->validate([
            'permisos' => 'array',
            'permisos.*' => 'exists:permissions,id',
        ]);

        // Actualizar en BD
        $this->permissionService->assignPermissionsToUser($user, $validated['permisos'] ?? []);

        return response()->json([
            'success' => true,
            'message' => 'Permisos actualizados correctamente',
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
        ]);
    }

    /**
     * ✅ PANEL WEB: Editar permisos de un rol
     */
    public function editarRol(Role $role)
    {
        $this->authorize('roles.assign-permission');

        $permisosActuales = $role->permissions()->pluck('id')->toArray();
        $todosLosPermisos = $this->permissionService->getPermissionsForUI();

        return Inertia::render('admin/permisos/rol', [
            'rol' => $role,
            'permisosActuales' => $permisosActuales,
            'todosLosPermisos' => $todosLosPermisos,
        ]);
    }

    /**
     * ✅ API: Actualizar permisos de un rol
     */
    public function actualizarRol(Request $request, Role $role)
    {
        $this->authorize('roles.assign-permission');

        $validated = $request->validate([
            'permisos' => 'array',
            'permisos.*' => 'exists:permissions,id',
        ]);

        $this->permissionService->assignPermissionsToRole($role, $validated['permisos'] ?? []);

        return response()->json([
            'success' => true,
            'message' => 'Permisos del rol actualizados correctamente',
            'permissions' => $role->permissions()->pluck('name')->toArray(),
        ]);
    }

    /**
     * ✅ API: Obtener estructura de permisos (para dropdown/selector en UI)
     */
    public function getStructure()
    {
        $this->authorize('permissions.index');

        return response()->json([
            'success' => true,
            'permissions' => $this->permissionService->getPermissionsForUI(),
            'total' => Permission::count(),
        ]);
    }

    /**
     * ✅ API: Obtener permisos agrupados
     */
    public function getGrouped()
    {
        $this->authorize('permissions.index');

        return response()->json([
            'success' => true,
            'grouped' => $this->permissionService->getPermissionsGrouped(),
        ]);
    }

    /**
     * ✅ API: Obtener lista de usuarios para el panel central
     * Soporta búsqueda por nombre/email y filtrado por rol
     */
    public function getUsuarios(Request $request)
    {
        $this->authorize('permissions.index');

        $search = $request->query('search');
        $rol = $request->query('rol');
        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 50);

        $result = $this->permissionService->obtenerUsuariosPaginados(
            page: $page,
            perPage: $perPage,
            search: $search,
            rol: $rol
        );

        $usuarios = $result->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray(),
                'permissions_count' => $user->getAllPermissions()->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $usuarios,
            'pagination' => [
                'current_page' => $result->currentPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'last_page' => $result->lastPage(),
            ],
        ]);
    }

    /**
     * ✅ API: Obtener lista de roles para el panel central
     * Soporta búsqueda por nombre
     */
    public function getRoles(Request $request)
    {
        $this->authorize('permissions.index');

        $search = $request->query('search');
        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 50);

        $result = $this->permissionService->obtenerRolesPaginados(
            page: $page,
            perPage: $perPage,
            search: $search
        );

        $roles = $result->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name ?? $role->name,
                'permissions_count' => $role->permissions()->count(),
                'description' => $role->description ?? '',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $roles,
            'pagination' => [
                'current_page' => $result->currentPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'last_page' => $result->lastPage(),
            ],
        ]);
    }

    /**
     * ✅ API: Obtener historial de auditoría
     * Usado por: Panel de historial y auditoría
     */
    public function getHistorial(Request $request)
    {
        $this->authorize('permissions.index');

        $targetType = $request->query('target_type'); // 'usuario' o 'rol'
        $targetId = $request->query('target_id');
        $action = $request->query('action'); // 'crear', 'editar', 'eliminar'
        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 50);

        $historial = AuditService::obtenerHistorial(
            perPage: $perPage,
            targetType: $targetType,
            targetId: $targetId ? (int)$targetId : null,
            action: $action
        );

        $datos = $historial->map(function ($audit) {
            return [
                'id' => $audit->id,
                'admin' => [
                    'id' => $audit->admin->id,
                    'name' => $audit->admin->name,
                    'email' => $audit->admin->email,
                ],
                'target_type' => $audit->target_type,
                'target_id' => $audit->target_id,
                'target_name' => $audit->target_name,
                'action' => $audit->action,
                'descripcion' => $audit->descripcion,
                'permisos_changed' => $audit->permisos_changed,
                'ip_address' => $audit->ip_address,
                'created_at' => $audit->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Obtener estadísticas
        $estadisticas = AuditService::obtenerEstadisticas();

        return response()->json([
            'success' => true,
            'data' => $datos,
            'pagination' => [
                'current_page' => $historial->currentPage(),
                'per_page' => $historial->perPage(),
                'total' => $historial->total(),
                'last_page' => $historial->lastPage(),
            ],
            'estadisticas' => $estadisticas,
        ]);
    }

    /**
     * ✅ API: Bulk edit de permisos
     * Asignar los mismos permisos a múltiples usuarios o roles
     */
    public function bulkEdit(Request $request)
    {
        $this->authorize('permissions.index');

        $validated = $request->validate([
            'tipo' => 'required|in:usuario,rol',
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:' . ($request->input('tipo') === 'usuario' ? 'users' : 'roles') . ',id',
            'permisos' => 'required|array|min:1',
            'permisos.*' => 'required|integer|exists:permissions,id',
            'accion' => 'required|in:reemplazar,agregar,eliminar', // reemplazar todos, agregar a existentes, eliminar de existentes
        ]);

        $tipo = $validated['tipo'];
        $ids = $validated['ids'];
        $permisos = $validated['permisos'];
        $accion = $validated['accion'];

        try {
            foreach ($ids as $id) {
                if ($tipo === 'usuario') {
                    $usuario = User::find($id);
                    if (!$usuario) continue;

                    $permisosAnteriores = $usuario->getAllPermissions()->pluck('id')->toArray();
                    $permisosNuevos = match ($accion) {
                        'reemplazar' => $permisos,
                        'agregar' => array_unique(array_merge($permisosAnteriores, $permisos)),
                        'eliminar' => array_diff($permisosAnteriores, $permisos),
                    };

                    $this->permissionService->assignPermissionsToUser($usuario, $permisosNuevos);
                } else {
                    $role = Role::find($id);
                    if (!$role) continue;

                    $permisosAnteriores = $role->permissions()->pluck('id')->toArray();
                    $permisosNuevos = match ($accion) {
                        'reemplazar' => $permisos,
                        'agregar' => array_unique(array_merge($permisosAnteriores, $permisos)),
                        'eliminar' => array_diff($permisosAnteriores, $permisos),
                    };

                    $this->permissionService->assignPermissionsToRole($role, $permisosNuevos);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Permisos asignados a " . count($ids) . " " . ($tipo === 'usuario' ? 'usuarios' : 'roles'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en asignación en lote: ' . $e->getMessage(),
            ], 400);
        }
    }
}
