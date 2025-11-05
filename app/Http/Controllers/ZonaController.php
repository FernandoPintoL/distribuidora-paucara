<?php

namespace App\Http\Controllers;

use App\Models\Zona;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ZonaController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:maestros.manage')->only(['index', 'show', 'create', 'store', 'edit', 'update', 'destroy']);
    }

    /**
     * Listar todas las zonas
     */
    public function index(Request $request)
    {
        $query = Zona::query();

        // Búsqueda
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nombre) like ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(codigo) like ?', ["%{$search}%"]);
            });
        }

        // Filtro por estado
        if ($request->has('activa') && $request->activa !== '') {
            $query->where('activa', $request->activa === '1' || $request->activa === true);
        }

        $zonas = $query->with(['preventista.user'])
            ->orderBy('nombre')
            ->paginate(15);

        return Inertia::render('zonas/index', [
            'zonas' => $zonas,
            'filters' => $request->only(['search', 'activa']),
        ]);
    }

    /**
     * Formulario de creación
     */
    public function create()
    {
        $preventistas = Empleado::whereHasRole('Preventista')
            ->activos()
            ->with('user')
            ->get(['id']);

        return Inertia::render('zonas/create', [
            'preventistas' => $preventistas,
        ]);
    }

    /**
     * Guardar nueva zona
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|unique:zonas,nombre',
            'codigo' => 'nullable|string|unique:zonas,codigo',
            'descripcion' => 'nullable|string',
            'localidades' => 'nullable|array',
            'latitud_centro' => 'nullable|numeric|between:-90,90',
            'longitud_centro' => 'nullable|numeric|between:-180,180',
            'tiempo_estimado_entrega' => 'nullable|integer|min:0',
            'preventista_id' => 'nullable|exists:empleados,id',
            'activa' => 'boolean',
        ]);

        $zona = Zona::create([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo ?: strtoupper(substr($request->nombre, 0, 2)),
            'descripcion' => $request->descripcion,
            'localidades' => $request->localidades,
            'latitud_centro' => $request->latitud_centro,
            'longitud_centro' => $request->longitud_centro,
            'tiempo_estimado_entrega' => $request->tiempo_estimado_entrega,
            'preventista_id' => $request->preventista_id,
            'activa' => $request->activa ?? true,
        ]);

        return redirect()->route('zonas.show', $zona)
            ->with('success', 'Zona creada correctamente.');
    }

    /**
     * Ver detalles de zona
     */
    public function show(Zona $zona)
    {
        $zona->load(['preventista.user', 'rutas', 'clientes']);

        $estadisticas = [
            'total_clientes' => $zona->cantidadClientes(),
            'total_rutas' => $zona->rutas()->count(),
            'rutas_completadas_hoy' => $zona->rutas()
                ->whereDate('fecha_ruta', today())
                ->where('estado', 'completada')
                ->count(),
        ];

        return Inertia::render('zonas/show', [
            'zona' => $zona,
            'estadisticas' => $estadisticas,
        ]);
    }

    /**
     * Formulario de edición
     */
    public function edit(Zona $zona)
    {
        $preventistas = Empleado::whereHasRole('Preventista')
            ->activos()
            ->with('user')
            ->get(['id']);

        return Inertia::render('zonas/edit', [
            'zona' => $zona,
            'preventistas' => $preventistas,
        ]);
    }

    /**
     * Actualizar zona
     */
    public function update(Request $request, Zona $zona)
    {
        $request->validate([
            'nombre' => 'required|string|unique:zonas,nombre,' . $zona->id,
            'codigo' => 'nullable|string|unique:zonas,codigo,' . $zona->id,
            'descripcion' => 'nullable|string',
            'localidades' => 'nullable|array',
            'latitud_centro' => 'nullable|numeric|between:-90,90',
            'longitud_centro' => 'nullable|numeric|between:-180,180',
            'tiempo_estimado_entrega' => 'nullable|integer|min:0',
            'preventista_id' => 'nullable|exists:empleados,id',
            'activa' => 'boolean',
        ]);

        $zona->update([
            'nombre' => $request->nombre,
            'codigo' => $request->codigo ?: $zona->codigo,
            'descripcion' => $request->descripcion,
            'localidades' => $request->localidades,
            'latitud_centro' => $request->latitud_centro,
            'longitud_centro' => $request->longitud_centro,
            'tiempo_estimado_entrega' => $request->tiempo_estimado_entrega,
            'preventista_id' => $request->preventista_id,
            'activa' => $request->activa,
        ]);

        return back()->with('success', 'Zona actualizada correctamente.');
    }

    /**
     * Eliminar zona (soft delete)
     */
    public function destroy(Zona $zona)
    {
        if ($zona->rutas()->count() > 0) {
            return back()->withErrors([
                'error' => 'No se puede eliminar una zona con rutas asignadas.'
            ]);
        }

        $zona->delete();

        return redirect()->route('zonas.index')
            ->with('success', 'Zona eliminada correctamente.');
    }

    /**
     * API: Obtener clientes por zona
     */
    public function clientesPorZona(Zona $zona)
    {
        $clientes = $zona->clientes()
            ->select(['id', 'nombre', 'direccion', 'latitud', 'longitud'])
            ->get();

        return response()->json($clientes);
    }

    /**
     * API: Obtener localidades de una zona
     */
    public function localidades(Zona $zona)
    {
        return response()->json([
            'localidades' => $zona->localidades,
        ]);
    }

    /**
     * API: Asignar preventista a zona
     */
    public function asignarPreventista(Request $request, Zona $zona)
    {
        $request->validate([
            'preventista_id' => 'required|exists:empleados,id',
        ]);

        $zona->update([
            'preventista_id' => $request->preventista_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Preventista asignado correctamente.',
            'zona' => $zona,
        ]);
    }

    /**
     * API: Obtener estadísticas de zona
     */
    public function estadisticas(Zona $zona)
    {
        $hoy = today();

        return response()->json([
            'zona' => $zona->nombre,
            'total_clientes' => $zona->cantidadClientes(),
            'rutas_hoy' => $zona->rutas()->whereDate('fecha_ruta', $hoy)->count(),
            'rutas_completadas_hoy' => $zona->rutas()
                ->whereDate('fecha_ruta', $hoy)
                ->where('estado', 'completada')
                ->count(),
            'entregas_completadas_hoy' => $zona->rutas()
                ->whereDate('fecha_ruta', $hoy)
                ->with('detalles')
                ->get()
                ->flatMap->detalles
                ->filter(fn($d) => $d->estado === 'entregado')
                ->count(),
            'preventista' => $zona->preventista?->user?->name,
        ]);
    }
}
