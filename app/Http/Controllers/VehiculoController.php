<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\VehiculoRequest;
use App\Models\Empleado;
use App\Models\Vehiculo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VehiculoController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->string('q');
        $activo = $request->query('activo');
        $orderBy = $request->string('order_by', 'placa');
        $orderDir = $request->string('order_dir', 'asc');

        // Validar columnas permitidas para ordenamiento
        $allowedOrderColumns = ['id', 'placa', 'marca', 'modelo', 'anho', 'capacidad_kg'];
        if (!in_array($orderBy, $allowedOrderColumns)) {
            $orderBy = 'placa';
        }

        $items = Vehiculo::query()
            ->when($q, fn($qq) => $qq->where(function($query) use ($q) {
                $query->where('placa', 'ilike', "%{$q}%")
                      ->orWhere('marca', 'ilike', "%{$q}%")
                      ->orWhere('modelo', 'ilike', "%{$q}%");
            }))
            ->when($activo !== null, fn($qq) => $qq->where('activo', $activo === '1'))
            ->orderBy($orderBy, $orderDir)
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('inventario/vehiculos/index', [
            'vehiculos' => $items,
            'filters'   => [
                'q' => $q,
                'activo' => $activo,
                'order_by' => $orderBy,
                'order_dir' => $orderDir,
            ],
        ]);
    }

    public function create(): Response
    {
        // Obtener choferes desde empleados activos con rol de Chofer
        $choferesEmpleados = Empleado::query()
            ->with(['user', 'user.roles'])
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) => $e->user !== null && $e->esChofer())
            ->map(fn($e) => [
                'value' => $e->id,
                'label' => $e->user->name ?? $e->nombre,
            ]);

        // También buscar usuarios con rol de Chofer que no estén en empleados
        $choferesUsuarios = \App\Models\User::query()
            ->whereHas('roles', fn($q) => $q->where('name', 'Chofer'))
            ->whereDoesntHave('empleado')
            ->get()
            ->map(fn($u) => [
                'value' => $u->id,
                'label' => $u->name . ' (Usuario)',
            ]);

        // Combinar ambas listas
        $choferes = $choferesEmpleados->merge($choferesUsuarios)->values();

        return Inertia::render('inventario/vehiculos/form', [
            'entity'   => null,
            'choferes' => $choferes,
        ]);
    }

    public function store(VehiculoRequest $request): RedirectResponse
    {
        $data           = $request->validated();
        $data['activo'] = $data['activo'] ?? true;

        Vehiculo::create($data);

        return redirect()->route('inventario.vehiculos.index')->with('success', 'Vehículo creado');
    }

    public function edit(Vehiculo $vehiculo): Response
    {
        // Obtener choferes desde empleados activos con rol de Chofer
        $choferesEmpleados = Empleado::query()
            ->with(['user', 'user.roles'])
            ->where('estado', 'activo')
            ->get()
            ->filter(fn($e) => $e->user !== null && $e->esChofer())
            ->map(fn($e) => [
                'value' => $e->id,
                'label' => $e->user->name ?? $e->nombre,
            ]);

        // También buscar usuarios con rol de Chofer que no estén en empleados
        $choferesUsuarios = \App\Models\User::query()
            ->whereHas('roles', fn($q) => $q->where('name', 'Chofer'))
            ->whereDoesntHave('empleado')
            ->get()
            ->map(fn($u) => [
                'value' => $u->id,
                'label' => $u->name . ' (Usuario)',
            ]);

        // Combinar ambas listas
        $choferes = $choferesEmpleados->merge($choferesUsuarios)->values();

        return Inertia::render('inventario/vehiculos/form', [
            'entity'   => $vehiculo,
            'choferes' => $choferes,
        ]);
    }

    public function update(VehiculoRequest $request, Vehiculo $vehiculo): RedirectResponse
    {
        $vehiculo->update($request->validated());

        return redirect()->route('inventario.vehiculos.index')->with('success', 'Vehículo actualizado');
    }

    public function destroy(Vehiculo $vehiculo): RedirectResponse
    {
        // En lugar de borrar, marcar inactivo por seguridad
        $vehiculo->update(['activo' => false]);

        return redirect()->route('inventario.vehiculos.index')->with('success', 'Vehículo desactivado');
    }

    // API
    public function apiIndex()
    {
        $vehiculos = Vehiculo::activos()->get();

        return ApiResponse::success($vehiculos);
    }

    public function apiShow(Vehiculo $vehiculo)
    {
        return ApiResponse::success($vehiculo);
    }
}
