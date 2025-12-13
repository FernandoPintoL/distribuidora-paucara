<?php

namespace App\Http\Controllers;

use App\Models\ModuloSidebar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModuloSidebarController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $modulos = ModuloSidebar::with(['padre', 'submodulos'])
            ->ordenados()
            ->get()
            ->map(function ($modulo) {
                return [
                    'id' => $modulo->id,
                    'titulo' => $modulo->titulo,
                    'ruta' => $modulo->ruta,
                    'icono' => $modulo->icono,
                    'descripcion' => $modulo->descripcion,
                    'orden' => $modulo->orden,
                    'activo' => $modulo->activo,
                    'es_submenu' => $modulo->es_submenu,
                    'categoria' => $modulo->categoria,
                    'color' => $modulo->color,
                    'visible_dashboard' => $modulo->visible_dashboard,
                    'padre' => $modulo->padre ? [
                        'id' => $modulo->padre->id,
                        'titulo' => $modulo->padre->titulo,
                    ] : null,
                    'submodulos_count' => $modulo->submodulos->count(),
                    'permisos' => $modulo->permisos,
                ];
            });

        return Inertia::render('ModulosSidebar/Index', [
            'modulos' => $modulos,
            'categorias' => ModuloSidebar::select('categoria')
                ->distinct()
                ->whereNotNull('categoria')
                ->pluck('categoria'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $modulosPadre = ModuloSidebar::principales()
            ->activos()
            ->ordenados()
            ->get(['id', 'titulo']);

        return Inertia::render('ModulosSidebar/Form', [
            'modulosPadre' => $modulosPadre,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'ruta' => 'required|string|max:500',
            'icono' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'orden' => 'integer|min:0',
            'activo' => 'boolean',
            'es_submenu' => 'boolean',
            'modulo_padre_id' => 'nullable|exists:modulos_sidebar,id',
            'permisos' => 'nullable|array',
            'permisos.*' => 'string',
            'color' => 'nullable|string|max:50',
            'categoria' => 'nullable|string|max:100',
            'visible_dashboard' => 'boolean',
        ]);

        $modulo = ModuloSidebar::create($validated);

        return redirect()->route('modulos-sidebar.index')
            ->with('success', 'Módulo creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ModuloSidebar $moduloSidebar): Response
    {
        $moduloSidebar->load(['padre', 'submodulos']);

        return Inertia::render('ModulosSidebar/Show', [
            'modulo' => $moduloSidebar,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ModuloSidebar $moduloSidebar): Response
    {
        $modulosPadre = ModuloSidebar::principales()
            ->activos()
            ->where('id', '!=', $moduloSidebar->id)
            ->ordenados()
            ->get(['id', 'titulo']);

        return Inertia::render('ModulosSidebar/Form', [
            'modulo' => $moduloSidebar,
            'modulosPadre' => $modulosPadre,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ModuloSidebar $moduloSidebar)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'ruta' => 'required|string|max:500',
            'icono' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'orden' => 'integer|min:0',
            'activo' => 'boolean',
            'es_submenu' => 'boolean',
            'modulo_padre_id' => 'nullable|exists:modulos_sidebar,id',
            'permisos' => 'nullable|array',
            'permisos.*' => 'string',
            'color' => 'nullable|string|max:50',
            'categoria' => 'nullable|string|max:100',
            'visible_dashboard' => 'boolean',
        ]);

        // Evitar que un módulo se asigne a sí mismo como padre
        if ($validated['modulo_padre_id'] == $moduloSidebar->id) {
            $validated['modulo_padre_id'] = null;
        }

        $moduloSidebar->update($validated);

        return redirect()->route('modulos-sidebar.index')
            ->with('success', 'Módulo actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ModuloSidebar $moduloSidebar)
    {
        // Verificar si tiene submódulos
        if ($moduloSidebar->submodulos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar un módulo que tiene submódulos.');
        }

        $moduloSidebar->delete();

        return redirect()->route('modulos-sidebar.index')
            ->with('success', 'Módulo eliminado exitosamente.');
    }

    /**
     * Obtener módulos para el sidebar (API)
     */
    public function obtenerParaSidebar()
    {
        $modulos = ModuloSidebar::obtenerParaSidebar()
            ->filter(function ($modulo) {
                return $modulo->usuarioTienePermiso();
            })
            ->map(function ($modulo) {
                return $modulo->toNavItem();
            })
            ->values();

        return response()->json($modulos);
    }

    /**
     * Actualizar orden de los módulos
     */
    public function actualizarOrden(Request $request)
    {
        $validated = $request->validate([
            'modulos' => 'required|array',
            'modulos.*.id' => 'required|exists:modulos_sidebar,id',
            'modulos.*.orden' => 'required|integer|min:0',
        ]);

        foreach ($validated['modulos'] as $moduloData) {
            ModuloSidebar::where('id', $moduloData['id'])
                ->update(['orden' => $moduloData['orden']]);
        }

        return response()->json(['message' => 'Orden actualizado exitosamente.']);
    }

    /**
     * Alternar estado activo/inactivo
     */
    public function toggleActivo(ModuloSidebar $moduloSidebar)
    {
        $moduloSidebar->update(['activo' => ! $moduloSidebar->activo]);

        return back()->with('success', 'Estado del módulo actualizado.');
    }

    /**
     * API endpoint para obtener módulos del sidebar
     */
    public function apiIndex()
    {
        $modulos = ModuloSidebar::where('activo', true)
            ->where('visible_dashboard', true)
            ->with(['submodulos' => function ($query) {
                $query->where('activo', true)
                    ->where('visible_dashboard', true)
                    ->orderBy('orden');
            }])
            ->whereNull('padre_id') // Solo módulos padre
            ->orderBy('orden')
            ->get()
            ->filter(function ($modulo) {
                // Filtrar módulos padre por permisos
                return $modulo->usuarioTienePermiso();
            })
            ->map(function ($modulo) {
                $navItem = $modulo->toNavItem();

                // Filtrar submódulos por permisos
                if (isset($navItem['children'])) {
                    $navItem['children'] = collect($navItem['children'])
                        ->filter(function ($child) {
                            // Los children ya están filtrados en toNavItem()
                            return true;
                        })
                        ->values()
                        ->toArray();
                }

                return $navItem;
            })
            ->values()
            ->toArray();

        return response()->json($modulos);
    }

    /**
     * Obtener permisos disponibles para asignar a módulos
     */
    public function getPermisosDisponibles()
    {
        $permisos = \Spatie\Permission\Models\Permission::all()
            ->sortBy('name')
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'value' => $permission->name,
                    'label' => $permission->name,
                ];
            })
            ->values();

        return response()->json($permisos);
    }

    /**
     * Obtener matriz de acceso rol-módulo
     * Devuelve qué roles tienen acceso a qué módulos
     */
    public function getMatrizAcceso()
    {
        // Obtener todos los roles
        $roles = \Spatie\Permission\Models\Role::all()
            ->sortBy('name')
            ->values();

        // Obtener todos los módulos principales (no submódulos)
        $modulos = ModuloSidebar::where('activo', true)
            ->whereNull('modulo_padre_id')
            ->orderBy('orden')
            ->with('submodulos')
            ->get();

        // Construir la matriz de acceso
        $matriz = [];

        foreach ($modulos as $modulo) {
            $moduloData = [
                'id' => $modulo->id,
                'titulo' => $modulo->titulo,
                'ruta' => $modulo->ruta,
                'categoria' => $modulo->categoria,
                'permisos_requeridos' => $modulo->permisos ?? [],
                'roles_acceso' => [],
                'submodulos' => [],
            ];

            // Verificar acceso de cada rol a este módulo
            foreach ($roles as $role) {
                $tieneAcceso = $this->rolTieneAccesoAlModulo($role, $modulo);
                if ($tieneAcceso) {
                    $moduloData['roles_acceso'][] = $role->name;
                }
            }

            // Procesar submódulos
            foreach ($modulo->submodulos as $submodulo) {
                $submoduloData = [
                    'id' => $submodulo->id,
                    'titulo' => $submodulo->titulo,
                    'ruta' => $submodulo->ruta,
                    'permisos_requeridos' => $submodulo->permisos ?? [],
                    'roles_acceso' => [],
                ];

                foreach ($roles as $role) {
                    $tieneAcceso = $this->rolTieneAccesoAlModulo($role, $submodulo);
                    if ($tieneAcceso) {
                        $submoduloData['roles_acceso'][] = $role->name;
                    }
                }

                $moduloData['submodulos'][] = $submoduloData;
            }

            $matriz[] = $moduloData;
        }

        return response()->json([
            'roles' => $roles->pluck('name')->toArray(),
            'modulos' => $matriz,
        ]);
    }

    /**
     * Verificar si un rol tiene acceso a un módulo
     */
    private function rolTieneAccesoAlModulo($role, $modulo)
    {
        $permisosRequeridos = $modulo->permisos ?? [];

        // Si no hay permisos requeridos, todos tienen acceso
        if (empty($permisosRequeridos)) {
            return true;
        }

        // Verificar si el rol tiene al menos uno de los permisos requeridos
        foreach ($permisosRequeridos as $permiso) {
            if ($role->hasPermissionTo($permiso)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Vista previa del sidebar para un rol específico
     */
    public function previewPorRol($rolName)
    {
        $role = \Spatie\Permission\Models\Role::where('name', $rolName)->first();

        if (!$role) {
            return response()->json(['error' => 'Rol no encontrado'], 404);
        }

        // Obtener módulos activos para el dashboard
        $modulos = ModuloSidebar::where('activo', true)
            ->where('visible_dashboard', true)
            ->with(['submodulos' => function ($query) {
                $query->where('activo', true)
                    ->where('visible_dashboard', true)
                    ->orderBy('orden');
            }])
            ->whereNull('modulo_padre_id')
            ->orderBy('orden')
            ->get()
            ->filter(function ($modulo) use ($role) {
                return $this->rolTieneAccesoAlModulo($role, $modulo);
            })
            ->map(function ($modulo) use ($role) {
                $navItem = $modulo->toNavItem();

                // Filtrar submódulos por permisos del rol
                if (isset($navItem['children']) && is_array($navItem['children'])) {
                    $navItem['children'] = collect($navItem['children'])
                        ->filter(function ($child) use ($role) {
                            // Encontrar el módulo original para verificar permisos
                            $submodulo = ModuloSidebar::find($child['id'] ?? null);
                            if (!$submodulo) return false;
                            return $this->rolTieneAccesoAlModulo($role, $submodulo);
                        })
                        ->values()
                        ->toArray();
                }

                return $navItem;
            })
            ->values()
            ->toArray();

        return response()->json([
            'rol' => [
                'name' => $role->name,
                'display_name' => $role->display_order ?? $role->name,
            ],
            'modulos' => $modulos,
            'total_modulos' => count($modulos),
        ]);
    }

    /**
     * Obtener lista de todos los roles para selector
     */
    public function obtenerRoles()
    {
        $roles = \Spatie\Permission\Models\Role::orderBy('name')
            ->get(['id', 'name'])
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => ucfirst(str_replace('-', ' ', $role->name)),
                ];
            });

        return response()->json($roles);
    }
}
