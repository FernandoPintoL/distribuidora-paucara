<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:roles.index')->only(['index', 'show']);
        $this->middleware('permission:roles.create')->only(['create', 'store']);
        $this->middleware('permission:roles.edit')->only(['edit', 'update']);
        $this->middleware('permission:roles.destroy')->only('destroy');
    }

    /**
     * Mostrar la lista de roles
     */
    public function index(Request $request)
    {
        $query = Role::query();

        // Filtros de búsqueda
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $roles = $query->withCount('permissions')
            ->withCount('users')
            ->paginate($request->perPage ?? 10)
            ->withQueryString();

        return Inertia::render('roles/index', [
            'roles'   => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Mostrar el formulario para crear un nuevo rol
     */
    public function create()
    {
        $permissions = Permission::all()->map(function ($permission) {
            $group = explode('.', $permission->name)[0];
            return [
                'id'    => $permission->id,
                'name'  => $permission->name,
                'group' => $group,
            ];
        })->groupBy('group');

        return Inertia::render('roles/create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Almacenar un nuevo rol
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                => 'required|string|max:255|unique:roles,name',
            'permissions'         => 'required|array',
            'crear_funcionalidad' => 'boolean',
        ]);

        // Crear el rol
        $role = Role::create([
            'name'       => $request->name,
            'guard_name' => 'web',
        ]);

        // Asignar permisos
        $role->syncPermissions($request->permissions);

        // Crear trait si se solicita (OPCIONAL)
        if ($request->crear_funcionalidad) {
            try {
                Artisan::call('empleados:registrar-rol', [
                    'nombre'        => $request->name,
                    '--crear-trait' => true,
                ]);

                $output = Artisan::output();
                Log::info("Trait creado para rol {$request->name}: " . $output);
            } catch (\Exception $e) {
                Log::error("Error al crear trait para rol {$request->name}: " . $e->getMessage());
            }
        }

        return redirect()->route('roles.index')
            ->with('success', "Rol '{$request->name}' creado exitosamente");
    }

    /**
     * Mostrar un rol específico
     */
    public function show(Role $role)
    {
        $role->load('permissions');

        return Inertia::render('roles/show', [
            'role' => $role,
        ]);
    }

    /**
     * Mostrar el formulario para editar un rol
     */
    public function edit(Role $role)
    {
        $role->load('permissions');

        $permissions = Permission::all()->map(function ($permission) {
            $group = explode('.', $permission->name)[0];
            return [
                'id'    => $permission->id,
                'name'  => $permission->name,
                'group' => $group,
            ];
        })->groupBy('group');

        return Inertia::render('roles/edit', [
            'role'        => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Actualizar un rol
     */
    public function update(Request $request, Role $role)
    {
        $request->validate([
            'name'        => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('roles')->ignore($role->id),
            ],
            'permissions' => 'required|array',
        ]);

        // Actualizar nombre solo si ha cambiado
        if ($role->name !== $request->name) {
            $role->name = $request->name;
            $role->save();
        }

        // Sincronizar permisos
        $role->syncPermissions($request->permissions);

        return redirect()->route('roles.index')
            ->with('success', "Rol actualizado exitosamente");
    }

    /**
     * Eliminar un rol
     */
    public function destroy(Role $role)
    {
        // Verificar si hay usuarios con este rol
        $usersCount = $role->users()->count();

        if ($usersCount > 0) {
            return redirect()->route('roles.index')
                ->with('error', "No se puede eliminar el rol porque está asignado a {$usersCount} usuarios");
        }

        $rolName = $role->name;

        // Eliminar el rol
        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', "Rol '{$rolName}' eliminado exitosamente");
    }

    /**
     * Crear funcionalidad para un rol existente
     */
    public function crearFuncionalidad(Role $role)
    {
        try {
            Artisan::call('empleados:registrar-rol', [
                'nombre'        => $role->name,
                '--crear-trait' => true,
            ]);

            $output = Artisan::output();
            Log::info("Trait creado para rol {$role->name}: " . $output);

            return redirect()->route('roles.show', $role)
                ->with('success', "Funcionalidad creada para el rol '{$role->name}'");

        } catch (\Exception $e) {
            Log::error("Error al crear trait para rol {$role->name}: " . $e->getMessage());

            return redirect()->route('roles.show', $role)
                ->with('error', "Error al crear funcionalidad: " . $e->getMessage());
        }
    }
}
