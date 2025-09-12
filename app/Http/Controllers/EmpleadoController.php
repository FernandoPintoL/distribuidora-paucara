<?php

namespace App\Http\Controllers;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class EmpleadoController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:empleados.ver')->only(['index', 'show']);
        $this->middleware('permission:empleados.crear')->only(['create', 'store']);
        $this->middleware('permission:empleados.editar')->only(['edit', 'update']);
        $this->middleware('permission:empleados.eliminar')->only('destroy');
        $this->middleware('permission:empleados.cambiar_estado')->only('toggleEstado');
        $this->middleware('permission:empleados.gestionar_acceso_sistema')->only('toggleAccesoSistema');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Empleado::with(['user', 'supervisor.user']);

        // Filtros de búsqueda
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo_empleado', 'like', "%{$search}%")
                    ->orWhere('ci', 'like', "%{$search}%")
                    ->orWhere('cargo', 'like', "%{$search}%")
                    ->orWhere('departamento', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filtro por departamento
        if ($request->has('departamento') && $request->departamento) {
            $query->where('departamento', $request->departamento);
        }

        // Filtro por estado
        if ($request->has('estado') && $request->estado) {
            $query->where('estado', $request->estado);
        }

        // Filtro por acceso al sistema
        if ($request->has('acceso_sistema') && $request->acceso_sistema !== '') {
            $query->where('puede_acceder_sistema', $request->acceso_sistema === '1');
        }

        $empleados = $query->orderBy('created_at', 'desc')->paginate(15);

        // Obtener datos para filtros
        $departamentos = Empleado::distinct('departamento')->pluck('departamento')->filter();
        $supervisores = Empleado::with('user')->whereHas('supervisados')->get();

        return Inertia::render('empleados/index', [
            'empleados' => $empleados,
            'departamentos' => $departamentos,
            'supervisores' => $supervisores,
            'filters' => $request->only(['search', 'departamento', 'estado', 'acceso_sistema']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $supervisores = Empleado::with('user')
            ->activos()
            ->get()
            ->map(function ($empleado) {
                return [
                    'id' => $empleado->id,
                    'nombre' => $empleado->user->name,
                    'cargo' => $empleado->cargo,
                ];
            });

        $roles = Role::whereIn('name', ['Gerente RRHH', 'Supervisor', 'Empleado', 'Gerente Administrativo'])->get();

        return Inertia::render('empleados/create', [
            'supervisores' => $supervisores,
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'codigo_empleado' => 'required|string|max:50|unique:empleados',
            'ci' => 'required|string|max:20|unique:empleados',
            'fecha_nacimiento' => 'required|date',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:500',
            'cargo' => 'required|string|max:100',
            'puesto' => 'nullable|string|max:100',
            'departamento' => 'required|string|max:100',
            'supervisor_id' => 'nullable|exists:empleados,id',
            'fecha_ingreso' => 'required|date',
            'tipo_contrato' => 'required|in:indefinido,temporal,practicante',
            'salario_base' => 'required|numeric|min:0',
            'bonos' => 'nullable|numeric|min:0',
            'estado' => 'required|in:activo,inactivo,vacaciones,licencia',
            'puede_acceder_sistema' => 'required|boolean',
            'contacto_emergencia_nombre' => 'nullable|string|max:255',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'rol' => 'nullable|exists:roles,name',
        ]);

        DB::transaction(function () use ($request) {
            // Crear usuario
            $user = User::create([
                'name' => $request->nombre,
                'email' => $request->email,
                'password' => Hash::make('password123'), // Password temporal
                'email_verified_at' => now(),
            ]);

            // Asignar rol si se especifica
            if ($request->rol) {
                $user->assignRole($request->rol);
            }

            // Crear empleado
            Empleado::create([
                'user_id' => $user->id,
                'codigo_empleado' => $request->codigo_empleado,
                'numero_empleado' => $request->codigo_empleado,
                'ci' => $request->ci,
                'fecha_nacimiento' => $request->fecha_nacimiento,
                'telefono' => $request->telefono,
                'direccion' => $request->direccion,
                'cargo' => $request->cargo,
                'puesto' => $request->puesto,
                'departamento' => $request->departamento,
                'supervisor_id' => $request->supervisor_id,
                'fecha_ingreso' => $request->fecha_ingreso,
                'tipo_contrato' => $request->tipo_contrato,
                'salario_base' => $request->salario_base,
                'bonos' => $request->bonos ?? 0,
                'estado' => $request->estado,
                'puede_acceder_sistema' => $request->puede_acceder_sistema,
                'contacto_emergencia_nombre' => $request->contacto_emergencia_nombre,
                'contacto_emergencia_telefono' => $request->contacto_emergencia_telefono,
            ]);
        });

        return redirect()->route('empleados.index')
            ->with('success', 'Empleado creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Empleado $empleado)
    {
        $empleado->load(['user.roles', 'supervisor.user', 'supervisados.user']);

        return Inertia::render('empleados/show', [
            'empleado' => $empleado,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Empleado $empleado)
    {
        $empleado->load(['user.roles']);

        $supervisores = Empleado::with('user')
            ->activos()
            ->where('id', '!=', $empleado->id) // No puede ser supervisor de sí mismo
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'nombre' => $emp->user->name,
                    'cargo' => $emp->cargo,
                ];
            });

        $roles = Role::whereIn('name', ['Gerente RRHH', 'Supervisor', 'Empleado', 'Gerente Administrativo'])->get();

        return Inertia::render('empleados/edit', [
            'empleado' => $empleado,
            'supervisores' => $supervisores,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Empleado $empleado)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($empleado->user_id),
            ],
            'codigo_empleado' => [
                'required',
                'string',
                'max:50',
                Rule::unique('empleados')->ignore($empleado->id),
            ],
            'ci' => [
                'required',
                'string',
                'max:20',
                Rule::unique('empleados')->ignore($empleado->id),
            ],
            'fecha_nacimiento' => 'required|date',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:500',
            'cargo' => 'required|string|max:100',
            'puesto' => 'nullable|string|max:100',
            'departamento' => 'required|string|max:100',
            'supervisor_id' => 'nullable|exists:empleados,id',
            'fecha_ingreso' => 'required|date',
            'tipo_contrato' => 'required|in:indefinido,temporal,practicante',
            'salario_base' => 'required|numeric|min:0',
            'bonos' => 'nullable|numeric|min:0',
            'estado' => 'required|in:activo,inactivo,vacaciones,licencia',
            'puede_acceder_sistema' => 'required|boolean',
            'contacto_emergencia_nombre' => 'nullable|string|max:255',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'rol' => 'nullable|exists:roles,name',
        ]);

        DB::transaction(function () use ($request, $empleado) {
            // Actualizar usuario
            $empleado->user->update([
                'name' => $request->nombre,
                'email' => $request->email,
            ]);

            // Actualizar rol si se especifica
            if ($request->rol) {
                $empleado->user->syncRoles([$request->rol]);
            }

            // Actualizar empleado
            $empleado->update([
                'codigo_empleado' => $request->codigo_empleado,
                'numero_empleado' => $request->codigo_empleado,
                'ci' => $request->ci,
                'fecha_nacimiento' => $request->fecha_nacimiento,
                'telefono' => $request->telefono,
                'direccion' => $request->direccion,
                'cargo' => $request->cargo,
                'puesto' => $request->puesto,
                'departamento' => $request->departamento,
                'supervisor_id' => $request->supervisor_id,
                'fecha_ingreso' => $request->fecha_ingreso,
                'tipo_contrato' => $request->tipo_contrato,
                'salario_base' => $request->salario_base,
                'bonos' => $request->bonos ?? 0,
                'estado' => $request->estado,
                'puede_acceder_sistema' => $request->puede_acceder_sistema,
                'contacto_emergencia_nombre' => $request->contacto_emergencia_nombre,
                'contacto_emergencia_telefono' => $request->contacto_emergencia_telefono,
            ]);
        });

        return redirect()->route('empleados.index')
            ->with('success', 'Empleado actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Empleado $empleado)
    {
        DB::transaction(function () use ($empleado) {
            // Primero eliminar el empleado
            $empleado->delete();

            // Luego eliminar el usuario asociado
            $empleado->user->delete();
        });

        return redirect()->route('empleados.index')
            ->with('success', 'Empleado eliminado exitosamente.');
    }

    /**
     * Toggle estado del empleado
     */
    public function toggleEstado(Request $request, Empleado $empleado)
    {
        $request->validate([
            'estado' => 'required|in:activo,inactivo,vacaciones,licencia',
        ]);

        $empleado->update(['estado' => $request->estado]);

        return back()->with('success', 'Estado del empleado actualizado exitosamente.');
    }

    /**
     * Toggle acceso al sistema del empleado
     */
    public function toggleAccesoSistema(Empleado $empleado)
    {
        $empleado->update([
            'puede_acceder_sistema' => ! $empleado->puede_acceder_sistema,
        ]);

        $mensaje = $empleado->puede_acceder_sistema
            ? 'El empleado ahora puede acceder al sistema.'
            : 'Se revocó el acceso al sistema del empleado.';

        return back()->with('success', $mensaje);
    }
}
