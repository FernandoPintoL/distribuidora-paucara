<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:permissions.index')->only('index');
        $this->middleware('permission:permissions.show')->only('show');
        $this->middleware('permission:permissions.create')->only(['create', 'store']);
        $this->middleware('permission:permissions.edit')->only(['edit', 'update']);
        $this->middleware('permission:permissions.delete')->only('destroy');
    }

    public function index(Request $request)
    {
        $query = Permission::withCount(['roles', 'users']);

        // Filtros de búsqueda
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('module') && $request->module) {
            $module = $request->module;
            $query->where('name', 'like', "{$module}.%");
        }

        $permissions = $query->orderBy('name')->paginate(20);

        // Obtener módulos únicos para el filtro
        $modules = Permission::select('name')
            ->get()
            ->map(function ($permission) {
                return explode('.', $permission->name)[0];
            })
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('permissions/index', [
            'permissions' => $permissions,
            'modules' => $modules,
            'filters' => [
                'search' => $request->search,
                'module' => $request->module,
            ],
        ]);
    }

    public function create()
    {
        $roles = Role::all();

        return Inertia::render('permissions/create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions'],
            'guard_name' => ['required', 'string', 'max:255'],
            'roles' => ['array'],
            'roles.*' => ['exists:roles,id'],
        ]);

        $permission = Permission::create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        // Asignar a roles
        if (isset($validated['roles'])) {
            $roles = Role::whereIn('id', $validated['roles'])->get();
            foreach ($roles as $role) {
                $role->givePermissionTo($permission);
            }
        }

        return redirect()->route('permissions.index')
            ->with('success', 'Permiso creado exitosamente.');
    }

    public function show(Permission $permission)
    {
        $permission->load(['roles', 'users']);

        return Inertia::render('permissions/show', [
            'permission' => $permission,
            'permissionRoles' => $permission->roles,
            'permissionUsers' => $permission->users,
        ]);
    }

    public function edit(Permission $permission)
    {
        $permission->load('roles');
        $roles = Role::all();

        return Inertia::render('permissions/edit', [
            'permission' => $permission,
            'roles' => $roles,
            'permissionRoles' => $permission->roles->pluck('id'),
        ]);
    }

    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name,'.$permission->id],
            'guard_name' => ['required', 'string', 'max:255'],
            'roles' => ['array'],
            'roles.*' => ['exists:roles,id'],
        ]);

        $permission->update([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        // Sincronizar roles
        if (isset($validated['roles'])) {
            $roles = Role::whereIn('id', $validated['roles'])->get();

            // Primero remover el permiso de todos los roles
            foreach ($permission->roles as $role) {
                $role->revokePermissionTo($permission);
            }

            // Luego asignar a los roles seleccionados
            foreach ($roles as $role) {
                $role->givePermissionTo($permission);
            }
        } else {
            // Remover de todos los roles
            foreach ($permission->roles as $role) {
                $role->revokePermissionTo($permission);
            }
        }

        return redirect()->route('permissions.index')
            ->with('success', 'Permiso actualizado exitosamente.');
    }

    public function destroy(Permission $permission)
    {
        // Evitar eliminar permisos críticos
        $criticalPermissions = [
            'usuarios.index',
            'roles.index',
            'permissions.index',
        ];

        if (in_array($permission->name, $criticalPermissions)) {
            return back()->with('error', 'No puedes eliminar permisos críticos del sistema.');
        }

        $permission->delete();

        return redirect()->route('permissions.index')
            ->with('success', 'Permiso eliminado exitosamente.');
    }
}
