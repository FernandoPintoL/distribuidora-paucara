<?php
namespace App\Http\Controllers;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class EmpleadoController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:empleados.index')->only(['index', 'show']);
        $this->middleware('permission:empleados.create')->only(['create', 'store']);
        $this->middleware('permission:empleados.edit')->only(['edit', 'update']);
        $this->middleware('permission:empleados.destroy')->only('destroy');
        $this->middleware('permission:empleados.toggle-estado')->only('toggleEstado');
        $this->middleware('permission:empleados.toggle-acceso-sistema')->only('toggleAccesoSistema');
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
                    ->orWhere(function ($q2) use ($search) {
                        $q2->whereHas('user', function ($q3) use ($search) {
                            $q3->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })->orWhereDoesntHave('user');
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
        $supervisores  = Empleado::with('user')->whereHas('supervisados')->get();

        return Inertia::render('empleados/index', [
            'empleados'     => $empleados,
            'departamentos' => $departamentos,
            'supervisores'  => $supervisores,
            'filters'       => $request->only(['search', 'departamento', 'estado', 'acceso_sistema']),
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
                    'id'     => $empleado->id,
                    'nombre' => $empleado->user ? $empleado->user->name : $empleado->codigo_empleado,
                    'cargo'  => $empleado->cargo,
                ];
            });

        // Incluir todos los roles relevantes para empleados
        $roles = Role::whereIn('name', [
            'Vendedor', 'Cajero', 'Compras', 'Comprador', 'Inventario', 'Gestor de Almacén',
            'Logística', 'Chofer', 'Contabilidad', 'Gerente', 'Manager',
        ])->get();

        // Definir mapeo de cargos a roles sugeridos
        $cargoRoleMapping = [
            'Chofer'                   => 'Chofer',
            'Cajero'                   => 'Cajero',
            'Vendedor'                 => 'Vendedor',
            'Comprador'                => 'Comprador',
            'Gestor de Almacén'        => 'Gestor de Almacén',
            'Manager'                  => 'Manager',
            'Gerente'                  => 'Gerente',
            'Supervisor de Ventas'     => 'Vendedor',
            'Supervisor de Compras'    => 'Compras',
            'Supervisor de Inventario' => 'Inventario',
            'Contador'                 => 'Contabilidad',
            'Logístico'                => 'Logística',
        ];

        return Inertia::render('empleados/create', [
            'supervisores'     => $supervisores,
            'roles'            => $roles,
            'cargoRoleMapping' => $cargoRoleMapping,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'crear_usuario'                => 'nullable|boolean',
            'nombre'                       => 'required|string|max:255',
            'email'                        => 'nullable|string|email|max:255|unique:users',
            'ci'                           => 'required|string|max:20|unique:empleados',
            'fecha_nacimiento'             => 'required|date',
            'telefono'                     => 'nullable|string|max:20',
            'direccion'                    => 'nullable|string|max:500',
            'cargo'                        => 'required|string|max:100',
            'puesto'                       => 'nullable|string|max:100',
            'departamento'                 => 'required|string|max:100',
            'supervisor_id'                => 'nullable|exists:empleados,id',
            'fecha_ingreso'                => 'required|date',
            'tipo_contrato'                => 'required|in:indefinido,temporal,practicante',
            'salario_base'                 => 'required|numeric|min:0',
            'bonos'                        => 'nullable|numeric|min:0',
            'estado'                       => 'required|in:activo,inactivo,vacaciones,licencia',
            'puede_acceder_sistema'        => 'nullable|boolean',
            'contacto_emergencia_nombre'   => 'nullable|string|max:255',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'rol'                          => 'nullable|exists:roles,name',
            'asignar_rol_automatico'       => 'nullable|boolean',
        ]);

        // Validaciones condicionales si se crea usuario
        if ($request->crear_usuario) {
            $request->validate([
                'email'    => 'required|string|email|max:255|unique:users',
                'usernick' => 'nullable|string|max:255|unique:users',
            ]);
        }

        DB::transaction(function () use ($request) {
            $user = null;

            // Crear usuario solo si se solicita
            if ($request->crear_usuario) {
                // Generar usernick si no se proporciona
                $usernick = $request->usernick ?: $this->generarUsernickUnico($request->nombre);

                $user = User::create([
                    'name'              => $request->nombre,
                    'usernick'          => $usernick,
                    'email'             => $request->email,
                    'password'          => Hash::make('password123'), // Password temporal
                    'email_verified_at' => now(),
                    'activo'            => $request->puede_acceder_sistema ?? false,
                ]);

                // Lógica de asignación de roles
                $rolAsignado = $request->rol;

                // Si se solicita asignación automática o no se especifica rol
                if ($request->asignar_rol_automatico || ! $rolAsignado) {
                    $rolAsignado = $this->determinarRolPorCargo($request->cargo);
                }

                // Asignar rol si se determinó uno
                if ($rolAsignado) {
                    $user->assignRole($rolAsignado);
                }
            }

            // Crear empleado sin código inicialmente
            $empleado = Empleado::create([
                'user_id'                      => $user ? $user->id : null,
                'ci'                           => $request->ci,
                'fecha_nacimiento'             => $request->fecha_nacimiento,
                'telefono'                     => $request->telefono,
                'direccion'                    => $request->direccion,
                'cargo'                        => $request->cargo,
                'puesto'                       => $request->puesto,
                'departamento'                 => $request->departamento,
                'supervisor_id'                => $request->supervisor_id,
                'fecha_ingreso'                => $request->fecha_ingreso,
                'tipo_contrato'                => $request->tipo_contrato,
                'salario_base'                 => $request->salario_base,
                'bonos'                        => $request->bonos ?? 0,
                'estado'                       => $request->estado,
                'puede_acceder_sistema'        => $request->puede_acceder_sistema ?? false,
                'contacto_emergencia_nombre'   => $request->contacto_emergencia_nombre,
                'contacto_emergencia_telefono' => $request->contacto_emergencia_telefono,
            ]);

            // Generar código de empleado automáticamente
            $codigoGenerado = $this->generarCodigoEmpleado($empleado->id);
            $empleado->update([
                'codigo_empleado' => $codigoGenerado,
                'numero_empleado' => $codigoGenerado,
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
                    'id'     => $emp->id,
                    'nombre' => $emp->user ? $emp->user->name : $emp->codigo_empleado,
                    'cargo'  => $emp->cargo,
                ];
            });

        $roles = Role::whereIn('name', ['Gerente RRHH', 'Supervisor', 'Empleado', 'Gerente Administrativo'])->get();

        return Inertia::render('empleados/edit', [
            'empleado'     => $empleado,
            'supervisores' => $supervisores,
            'roles'        => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Empleado $empleado)
    {
        $request->validate([
            'nombre'                       => 'required|string|max:255',
            'email'                        => [
                'nullable',
                'string',
                'email',
                'max:255',
                $empleado->user_id ? Rule::unique('users')->ignore($empleado->user_id) : 'unique:users',
            ],
            'ci'                           => [
                'required',
                'string',
                'max:20',
                Rule::unique('empleados')->ignore($empleado->id),
            ],
            'fecha_nacimiento'             => 'required|date',
            'telefono'                     => 'nullable|string|max:20',
            'direccion'                    => 'nullable|string|max:500',
            'cargo'                        => 'required|string|max:100',
            'puesto'                       => 'nullable|string|max:100',
            'departamento'                 => 'required|string|max:100',
            'supervisor_id'                => 'nullable|exists:empleados,id',
            'fecha_ingreso'                => 'required|date',
            'tipo_contrato'                => 'required|in:indefinido,temporal,practicante',
            'salario_base'                 => 'required|numeric|min:0',
            'bonos'                        => 'nullable|numeric|min:0',
            'estado'                       => 'required|in:activo,inactivo,vacaciones,licencia',
            'puede_acceder_sistema'        => 'required|boolean',
            'contacto_emergencia_nombre'   => 'nullable|string|max:255',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'rol'                          => 'nullable|exists:roles,name',
            'usernick'                     => [
                'nullable',
                'string',
                'max:255',
                $empleado->user_id ? Rule::unique('users')->ignore($empleado->user_id) : 'unique:users',
            ],
        ]);

        DB::transaction(function () use ($request, $empleado) {
            // Actualizar usuario solo si existe
            if ($empleado->user) {
                $empleado->user->update([
                    'name'     => $request->nombre,
                    'usernick' => $request->usernick ?: $empleado->user->usernick,
                    'email'    => $request->email,
                ]);

                // Actualizar rol si se especifica
                if ($request->rol) {
                    $empleado->user->syncRoles([$request->rol]);
                }
            }

            // Actualizar empleado
            $empleado->update([
                'ci'                           => $request->ci,
                'fecha_nacimiento'             => $request->fecha_nacimiento,
                'telefono'                     => $request->telefono,
                'direccion'                    => $request->direccion,
                'cargo'                        => $request->cargo,
                'puesto'                       => $request->puesto,
                'departamento'                 => $request->departamento,
                'supervisor_id'                => $request->supervisor_id,
                'fecha_ingreso'                => $request->fecha_ingreso,
                'tipo_contrato'                => $request->tipo_contrato,
                'salario_base'                 => $request->salario_base,
                'bonos'                        => $request->bonos ?? 0,
                'estado'                       => $request->estado,
                'puede_acceder_sistema'        => $request->puede_acceder_sistema,
                'contacto_emergencia_nombre'   => $request->contacto_emergencia_nombre,
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
     * Determina el rol apropiado basado en el cargo del empleado
     */
    private function determinarRolPorCargo(string $cargo): ?string
    {
        $mapeoCargosRoles = [
            // Choferes
            'Chofer'                   => 'Chofer',
            'Conductor'                => 'Chofer',
            'Repartidor'               => 'Chofer',
            'Mensajero'                => 'Chofer',

            // Cajeros
            'Cajero'                   => 'Cajero',
            'Cajera'                   => 'Cajero',
            'Encargado de Caja'        => 'Cajero',

            // Gestores de Almacén
            'Gestor de Almacén'        => 'Gestor de Almacén',
            'Encargado de Almacén'     => 'Gestor de Almacén',
            'Almacenista'              => 'Gestor de Almacén',
            'Supervisor de Inventario' => 'Gestor de Almacén',

            // Compradores
            'Comprador'                => 'Comprador',
            'Compradora'               => 'Comprador',
            'Encargado de Compras'     => 'Comprador',
            'Supervisor de Compras'    => 'Compras',

            // Managers/Gerentes
            'Manager'                  => 'Manager',
            'Gerente'                  => 'Gerente',
            'Gerente General'          => 'Gerente',
            'Gerente de Ventas'        => 'Gerente',
            'Gerente de Operaciones'   => 'Manager',

            // Vendedores
            'Vendedor'                 => 'Vendedor',
            'Vendedora'                => 'Vendedor',
            'Asesor de Ventas'         => 'Vendedor',

            // Otros roles específicos
            'Contador'                 => 'Contabilidad',
            'Contadora'                => 'Contabilidad',
            'Logístico'                => 'Logística',
            'Encargado de Logística'   => 'Logística',
        ];

        return $mapeoCargosRoles[$cargo] ?? null;
    }

    /**
     * Método de conveniencia para crear empleado con rol automático
     */
    public function crearEmpleadoRapido(Request $request)
    {
        $request->validate([
            'nombre'        => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'usernick'      => 'nullable|string|max:255|unique:users',
            'ci'            => 'required|string|max:20|unique:empleados',
            'cargo'         => 'required|string|max:100',
            'departamento'  => 'required|string|max:100',
            'fecha_ingreso' => 'required|date',
            'salario_base'  => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {
            // Generar usernick si no se proporciona
            $usernick = $request->usernick ?: $this->generarUsernickUnico($request->nombre);

            // Crear usuario
            $user = User::create([
                'name'              => $request->nombre,
                'usernick'          => $usernick,
                'email'             => $request->email,
                'password'          => Hash::make('password123'),
                'email_verified_at' => now(),
                'activo'            => true,
            ]);

            // Determinar y asignar rol automáticamente
            $rolAsignado = $this->determinarRolPorCargo($request->cargo);
            if ($rolAsignado) {
                $user->assignRole($rolAsignado);
            }

            // Crear empleado sin código inicialmente
            $empleado = Empleado::create([
                'user_id'               => $user->id,
                'ci'                    => $request->ci,
                'cargo'                 => $request->cargo,
                'departamento'          => $request->departamento,
                'fecha_ingreso'         => $request->fecha_ingreso,
                'tipo_contrato'         => 'indefinido',
                'salario_base'          => $request->salario_base,
                'estado'                => 'activo',
                'puede_acceder_sistema' => true,
            ]);

            // Generar código de empleado automáticamente
            $codigoGenerado = $this->generarCodigoEmpleado($empleado->id);
            $empleado->update([
                'codigo_empleado' => $codigoGenerado,
                'numero_empleado' => $codigoGenerado,
            ]);
        });

        return response()->json([
            'success'      => true,
            'message'      => 'Empleado creado exitosamente con rol asignado automáticamente.',
            'rol_asignado' => $this->determinarRolPorCargo($request->cargo),
        ]);
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

    /**
     * Genera un usernick único basado en el código del empleado
     */
    private function generarUsernickUnico(string $codigoEmpleado): string
    {
        $baseUsernick = strtolower($codigoEmpleado);
        $usernick     = $baseUsernick;
        $counter      = 1;

        // Verificar si el usernick ya existe y agregar número si es necesario
        while (\App\Models\User::where('usernick', $usernick)->exists()) {
            $usernick = $baseUsernick . $counter;
            $counter++;
        }

        return $usernick;
    }

    /**
     * Genera un código de empleado automático basado en el ID
     * Formato: EMP + ID con padding de ceros (4 dígitos)
     * Ejemplos: EMP0001, EMP1000, EMP1001
     */
    private function generarCodigoEmpleado(int $id): string
    {
        return 'EMP' . str_pad($id, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Obtiene la lista de departamentos disponibles
     */
    public function getDepartamentos()
    {
        $departamentos = [
            ['value' => 'Ventas', 'label' => 'Ventas'],
            ['value' => 'Administración', 'label' => 'Administración'],
            ['value' => 'Logística', 'label' => 'Logística'],
            ['value' => 'Contabilidad', 'label' => 'Contabilidad'],
            ['value' => 'RRHH', 'label' => 'Recursos Humanos'],
            ['value' => 'Sistemas', 'label' => 'Sistemas'],
            ['value' => 'Compras', 'label' => 'Compras'],
        ];

        return response()->json($departamentos);
    }

    /**
     * Obtiene la lista de tipos de contrato disponibles
     */
    public function getTiposContrato()
    {
        $tiposContrato = [
            ['value' => 'indefinido', 'label' => 'Indefinido'],
            ['value' => 'temporal', 'label' => 'Temporal'],
            ['value' => 'practicante', 'label' => 'Practicante'],
        ];

        return response()->json($tiposContrato);
    }

    /**
     * Obtiene la lista de estados de empleado disponibles
     */
    public function getEstados()
    {
        $estados = [
            ['value' => 'activo', 'label' => 'Activo'],
            ['value' => 'inactivo', 'label' => 'Inactivo'],
            ['value' => 'vacaciones', 'label' => 'Vacaciones'],
            ['value' => 'licencia', 'label' => 'Licencia'],
        ];

        return response()->json($estados);
    }

    /**
     * Obtiene la lista de supervisores disponibles
     */
    public function getSupervisores()
    {
        try {
            $supervisores = Empleado::whereHas('user')
                ->with('user')
                ->where('estado', 'activo')
                ->where('puede_acceder_sistema', true)
                ->get()
                ->map(function ($empleado) {
                    // Verificar que el empleado tenga usuario y datos válidos
                    if (! $empleado->user || ! $empleado->user->name) {
                        return null;
                    }

                    return [
                        'value'       => $empleado->id,
                        'label'       => $empleado->user->name,
                        'description' => ($empleado->cargo ?? 'Sin cargo') . ' - ' . ($empleado->departamento ?? 'Sin departamento'),
                    ];
                })
                ->filter()   // Remover valores null
                ->values()   // Reindexar el array
                ->toArray(); // Convertir a array nativo

            // Agregar opción "Sin supervisor"
            array_unshift($supervisores, [
                'value'       => 'sin-supervisor',
                'label'       => 'Sin supervisor',
                'description' => 'Empleado sin supervisor asignado',
            ]);

            return response()->json($supervisores);
        } catch (\Exception $e) {
            // Log del error para debugging
            Log::error('Error en getSupervisores: ' . $e->getMessage());

            // Devolver respuesta de error controlada
            return response()->json([
                'error'   => 'Error interno del servidor',
                'message' => 'No se pudieron cargar los supervisores',
            ], 500);
        }
    }

    /**
     * Obtiene la lista de roles disponibles
     */
    public function getRoles()
    {
        try {
            $roles = Role::orderBy('name')
                ->get()
                ->map(function ($role) {
                    return [
                        'value'       => $role->name,
                        'label'       => $role->name,
                        'description' => 'Rol del sistema: ' . $role->name,
                    ];
                })
                ->toArray();

            return response()->json($roles);
        } catch (\Exception $e) {
            // Log del error para debugging
            Log::error('Error en getRoles: ' . $e->getMessage());

            // Devolver respuesta de error controlada
            return response()->json([
                'error'   => 'Error interno del servidor',
                'message' => 'No se pudieron cargar los roles',
            ], 500);
        }
    }
}
