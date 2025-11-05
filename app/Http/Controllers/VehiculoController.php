<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\VehiculoRequest;
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

        $items = Vehiculo::query()
            ->when($q, fn($qq) => $qq->where('placa', 'ilike', "%{$q}%"))
            ->orderBy('id', 'desc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('inventario/vehiculos/index', [
            'vehiculos' => $items,
            'filters'   => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventario/vehiculos/form', [
            'vehiculo' => null,
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
        return Inertia::render('inventario/vehiculos/form', [
            'vehiculo' => $vehiculo,
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
