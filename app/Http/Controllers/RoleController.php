<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:roles.index')->only('index');
        $this->middleware('permission:roles.show')->only('show');
        $this->middleware('permission:roles.create')->only(['create', 'store']);
        $this->middleware('permission:roles.edit')->only(['edit', 'update']);
        $this->middleware('permission:roles.delete')->only('destroy');
        $this->middleware('permission:roles.manage-permissions')->only(['assignPermission', 'removePermission']);
    }

    public function index(Request $request)
    {
        $query = Role::withCount(['users', 'permissions']);

        // Filtros de búsqueda
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function create()
    {
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('roles/create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles'],
            'guard_name' => ['required', 'string', 'max:255'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        // Asignar permisos
        if (isset($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->pluck('name');
            $role->syncPermissions($permissions);
        }

        return redirect()->route('roles.index')
            ->with('success', 'Rol creado exitosamente.');
    }

    public function show(Role $role)
    {
        $role->load(['permissions', 'users']);

        return Inertia::render('roles/show', [
            'role' => $role,
            'rolePermissions' => $role->permissions,
            'roleUsers' => $role->users,
        ]);
    }

    public function edit(Role $role)
    {
        $role->load('permissions');
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('roles/edit', [
            'role' => $role,
            'permissions' => $permissions,
            'rolePermissions' => $role->permissions->pluck('id'),
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,'.$role->id],
            'guard_name' => ['required', 'string', 'max:255'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role->update([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        // Sincronizar permisos
        if (isset($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->pluck('name');
            $role->syncPermissions($permissions);
        } else {
            $role->syncPermissions([]);
        }

        return redirect()->route('roles.index')
            ->with('success', 'Rol actualizado exitosamente.');
    }

    public function destroy(Role $role)
    {
        // Evitar eliminar roles con usuarios asignados
        if ($role->users()->count() > 0) {
            return back()->with('error', 'No puedes eliminar un rol que tiene usuarios asignados.');
        }

        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Rol eliminado exitosamente.');
    }

    public function assignPermission(Request $request, Role $role)
    {
        $request->validate([
            'permission' => ['required', 'exists:permissions,name'],
        ]);

        $role->givePermissionTo($request->permission);

        return back()->with('success', 'Permiso asignado exitosamente.');
    }

    public function removePermission(Request $request, Role $role)
    {
        $request->validate([
            'permission' => ['required', 'exists:permissions,name'],
        ]);

        $role->revokePermissionTo($request->permission);

        return back()->with('success', 'Permiso removido exitosamente.');
    }
}
