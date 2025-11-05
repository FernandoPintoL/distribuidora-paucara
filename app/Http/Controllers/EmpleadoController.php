<?php
namespace App\Http\Controllers;

use App\Http\Requests\EmpleadoRequest;
use App\Models\Empleado;
use App\Models\User;
use App\Services\RoleCompatibilityValidator;
use Exception;
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
        $query = Empleado::with(['user.roles']);

        // Filtros de búsqueda (soporte tanto 'q' como 'search' para compatibilidad)
        $searchTerm = $request->q ?? $request->search;
        if ($searchTerm) {
            // Convertir búsqueda a minúsculas para hacer búsqueda case-insensitive
            $searchLower = strtolower($searchTerm);
            $query->where(function ($q) use ($searchLower) {
                $q->whereRaw('LOWER(codigo_empleado) like ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(ci) like ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(telefono) like ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(cargo) like ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(departamento) like ?', ["%{$searchLower}%"])
                    ->orWhereHas('user', function ($q3) use ($searchLower) {
                        $q3->whereRaw('LOWER(name) like ?', ["%{$searchLower}%"])
                            ->orWhereRaw('LOWER(email) like ?', ["%{$searchLower}%"])
                            ->orWhereRaw('LOWER(usernick) like ?', ["%{$searchLower}%"]);
                    });
            });
        }

        // Filtro por estado
        if ($request->has('estado') && $request->estado) {
            $query->where('estado', $request->estado);
        }

        // Filtro por acceso al sistema (soporte ambos nombres para compatibilidad)
        $puedeAccederSistema = $request->puede_acceder_sistema ?? $request->acceso_sistema;
        if ($puedeAccederSistema !== null && $puedeAccederSistema !== '') {
            $query->where('puede_acceder_sistema', $puedeAccederSistema === '1' || $puedeAccederSistema === 1 || $puedeAccederSistema === true);
        }

        // Ordenamiento dinámico (soporte para modern-filters)
        $orderBy  = $request->order_by ?? 'nombre';
        $orderDir = $request->order_dir ?? 'asc';

        // Validar campo de ordenamiento
        $allowedOrderBy = ['id', 'nombre', 'codigo_empleado', 'ci', 'fecha_ingreso', 'created_at', 'estado'];
        if (! in_array($orderBy, $allowedOrderBy)) {
            $orderBy = 'nombre';
        }

        // Validar dirección de ordenamiento
        if (! in_array(strtolower($orderDir), ['asc', 'desc'])) {
            $orderDir = 'asc';
        }

        // Aplicar ordenamiento
        if ($orderBy === 'nombre') {
            // Para nombre, ordenar por el nombre del usuario relacionado
            $query->leftJoin('users', 'empleados.user_id', '=', 'users.id')
                ->select('empleados.*')
                ->orderBy('users.name', $orderDir);
        } else {
            $query->orderBy($orderBy, $orderDir);
        }

        $empleados = $query->paginate(15);

        return Inertia::render('empleados/index', [
            'empleados' => $empleados,
            'filters'   => $request->only(['q', 'search', 'estado', 'puede_acceder_sistema', 'acceso_sistema', 'order_by', 'order_dir']),
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

        // Obtener solo los roles que el usuario actual puede asignar
        $rolesPermitidos = $this->getRolesAsignablesPorUsuario();

        $roles = Role::orderBy('name')
            ->get()
            ->filter(function ($role) use ($rolesPermitidos) {
                // Solo incluir roles que el usuario tiene permiso de asignar
                return in_array($role->name, $rolesPermitidos);
            })
            ->map(function ($role) use ($rolesPermitidos) {
                $description = 'Rol del sistema: ' . $role->name;

                // Agregar indicador visual para roles privilegiados
                if (in_array($role->name, ['Super Admin', 'Admin'])) {
                    $description .= ' 🔒';
                }

                return [
                    'value'       => $role->name,
                    'label'       => $role->name,
                    'description' => $description,
                ];
            })
            ->values(); // Reindexar después del filtro

        return Inertia::render('empleados/create', [
            'supervisores' => $supervisores,
            'roles'        => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EmpleadoRequest $request)
    {
        // Validar roles como array
        $request->validate([
            'roles'   => 'nullable|array',
            'roles.*' => 'exists:roles,name',
        ]);

        // Validaciones adicionales según el tipo de empleado
        $rolesAsignados = $request->roles ?? [];

        // VALIDACIÓN CRÍTICA: Verificar que el usuario tenga permiso para asignar los roles solicitados
        if (! empty($rolesAsignados)) {
            try {
                $this->validarPermisosAsignacionRoles($rolesAsignados);
            } catch (Exception $e) {
                return back()->withErrors([
                    'roles' => $e->getMessage(),
                ])->withInput();
            }
        }

        // VALIDACIÓN: Verificar compatibilidad de roles
        if (! empty($rolesAsignados)) {
            try {
                $validador = new RoleCompatibilityValidator();
                $validador->validar($rolesAsignados);
            } catch (Exception $e) {
                return back()->withErrors([
                    'roles' => $e->getMessage(),
                ])->withInput();
            }
        }

        // Validaciones condicionales si se crea usuario
        if ($request->crear_usuario || $request->puede_acceder_sistema) {
            $request->validate([
                'email'    => 'nullable|string|email|max:255|unique:users',
                'usernick' => 'required|string|max:255|unique:users', // Usernick es requerido si puede acceder al sistema
                'password' => 'required|string|min:8|confirmed', // Password requerido al crear usuario
            ]);
        }

        DB::transaction(function () use ($request, $rolesAsignados) {
            $user = null;

            // Crear usuario solo si se solicita o puede acceder al sistema
            if ($request->crear_usuario || $request->puede_acceder_sistema) {
                // Generar usernick si no se proporciona
                $usernick = $request->usernick ?: $this->generarUsernickUnico($request->nombre);

                $user = User::create([
                    'name'              => $request->nombre,
                    'usernick'          => $usernick,
                    'email'             => $request->email,
                    'password'          => Hash::make($request->password), // Usar password del request
                    'email_verified_at' => now(),
                    'activo'            => $request->puede_acceder_sistema ?? false,
                ]);

                // Asignar múltiples roles
                if (! empty($rolesAsignados)) {
                    $user->syncRoles($rolesAsignados);
                }
            }

            // Preparar datos para el empleado con valores por defecto
            $empleadoData = [
                'user_id'                      => $user ? $user->id : null,
                'ci'                           => $request->ci,
                'fecha_nacimiento'             => $request->fecha_nacimiento,
                'telefono'                     => $request->telefono,
                'direccion'                    => $request->direccion,
                'cargo'                        => $request->cargo ?? 'Sin cargo',
                'departamento'                 => $request->departamento ?? 'Sin departamento',
                'supervisor_id'                => $request->supervisor_id,
                'fecha_ingreso'                => $request->fecha_ingreso,
                'tipo_contrato'                => $request->tipo_contrato ?? 'indefinido',
                'salario_base'                 => $request->salario_base ?? 0,
                'bonos'                        => $request->bonos ?? 0,
                'estado'                       => $request->estado ?? 'activo',
                'puede_acceder_sistema'        => $request->puede_acceder_sistema ?? false,
                'contacto_emergencia_nombre'   => $request->contacto_emergencia_nombre,
                'contacto_emergencia_telefono' => $request->contacto_emergencia_telefono,
                'latitud'                      => $request->latitud,
                'longitud'                     => $request->longitud,
            ];

            // Crear empleado sin código inicialmente
            $empleado = Empleado::create($empleadoData);

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

        // Obtener solo los roles que el usuario actual puede asignar
        $rolesPermitidos = $this->getRolesAsignablesPorUsuario();

        $roles = Role::orderBy('name')
            ->get()
            ->filter(function ($role) use ($rolesPermitidos) {
                // Solo incluir roles que el usuario tiene permiso de asignar
                return in_array($role->name, $rolesPermitidos);
            })
            ->map(function ($role) use ($rolesPermitidos) {
                $description = 'Rol del sistema: ' . $role->name;

                // Agregar indicador visual para roles privilegiados
                if (in_array($role->name, ['Super Admin', 'Admin'])) {
                    $description .= ' 🔒';
                }

                return [
                    'value'       => $role->name,
                    'label'       => $role->name,
                    'description' => $description,
                ];
            })
            ->values(); // Reindexar después del filtro

        return Inertia::render('empleados/edit', [
            'empleado'     => $empleado, // Los accessors automáticamente agregan nombre, email, usernick, roles
            'supervisores' => $supervisores,
            'roles'        => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Empleado $empleado)
    {
        // LOG TEMPORAL: Ver qué está llegando al backend
        Log::info('=== DATOS RECIBIDOS EN UPDATE ===');
        Log::info('Request all()', ['data' => $request->all()]);
        Log::info('Request input()', ['data' => $request->input()]);
        Log::info('Request query', ['data' => $request->query()]);
        Log::info('Request method', ['method' => $request->method()]);
        Log::info('Request Content-Type', ['content_type' => $request->header('Content-Type')]);
        Log::info('Request has files', ['has_photo' => $request->hasFile('photo')]);
        Log::info('=================================');

        // Validación solo de campos presentes en el request
        $rules = [];

        // Campos que si vienen, deben ser validados
        if ($request->has('nombre')) {
            $rules['nombre'] = 'required|string|max:255';
        }

        if ($request->has('email')) {
            $rules['email'] = [
                'nullable',
                'string',
                'email',
                'max:255',
                $empleado->user_id ? Rule::unique('users')->ignore($empleado->user_id) : 'unique:users',
            ];
        }

        if ($request->has('ci')) {
            $rules['ci'] = [
                'required',
                'string',
                'max:20',
                Rule::unique('empleados')->ignore($empleado->id),
            ];
        }

        if ($request->has('telefono')) {
            $rules['telefono'] = 'nullable|string|max:20';
        }

        if ($request->has('direccion')) {
            $rules['direccion'] = 'nullable|string|max:500';
        }

        if ($request->has('password')) {
            $rules['password'] = 'nullable|string|min:8|confirmed';
        }

        if ($request->has('fecha_ingreso')) {
            $rules['fecha_ingreso'] = 'required|date';
        }

        if ($request->has('puede_acceder_sistema')) {
            $rules['puede_acceder_sistema'] = 'required|boolean';
        }

        if ($request->has('usernick')) {
            $rules['usernick'] = [
                'nullable',
                'string',
                'max:255',
                $empleado->user_id ? Rule::unique('users')->ignore($empleado->user_id) : 'unique:users',
            ];
        }

        if ($request->has('roles')) {
            $rules['roles']   = 'nullable|array';
            $rules['roles.*'] = 'exists:roles,name';
        }

        // Validar solo los campos presentes
        $request->validate($rules);

        // VALIDACIÓN CRÍTICA: Verificar que el usuario tenga permiso para asignar los roles solicitados
        if ($request->has('roles') && is_array($request->roles) && ! empty($request->roles)) {
            try {
                $this->validarPermisosAsignacionRoles($request->roles);
            } catch (Exception $e) {
                return back()->withErrors([
                    'roles' => $e->getMessage(),
                ])->withInput();
            }
        }

        // VALIDACIÓN: Verificar compatibilidad de roles
        if ($request->has('roles') && is_array($request->roles) && ! empty($request->roles)) {
            try {
                $rolesActuales = $empleado->user?->roles->pluck('name')->toArray() ?? [];
                $rolActualPrincipal = count($rolesActuales) > 0 ? $rolesActuales[0] : null;

                $validador = new RoleCompatibilityValidator();
                $validador->validar($request->roles, $rolActualPrincipal);
            } catch (Exception $e) {
                return back()->withErrors([
                    'roles' => $e->getMessage(),
                ])->withInput();
            }
        }

        DB::transaction(function () use ($request, $empleado) {
            // Actualizar usuario solo si existe y vienen datos del usuario
            if ($empleado->user && $request->has('nombre')) {
                $user = $empleado->user;

                if ($request->has('nombre')) {
                    $user->name = $request->nombre;
                }

                if ($request->has('usernick') && $request->usernick) {
                    $user->usernick = $request->usernick;
                }

                if ($request->has('email')) {
                    $user->email = $request->email;
                }

                // Actualizar contraseña si se proporcionó
                if ($request->has('password') && $request->password) {
                    $user->password = Hash::make($request->password);
                }

                $user->save();

                // Actualizar roles si se especifican
                if ($request->has('roles') && is_array($request->roles)) {
                    $user->syncRoles($request->roles);
                }
            }

            // Preparar datos de actualización del empleado - SOLO campos presentes en request
            $datosActualizacion = [];

            if ($request->has('ci')) {
                $datosActualizacion['ci'] = $request->ci;
            }

            if ($request->has('telefono')) {
                $datosActualizacion['telefono'] = $request->telefono;
            }

            if ($request->has('direccion')) {
                $datosActualizacion['direccion'] = $request->direccion;
            }

            if ($request->has('fecha_ingreso')) {
                $datosActualizacion['fecha_ingreso'] = $request->fecha_ingreso;
            }

            if ($request->has('puede_acceder_sistema')) {
                $datosActualizacion['puede_acceder_sistema'] = $request->puede_acceder_sistema;
            }

            if ($request->has('latitud')) {
                $datosActualizacion['latitud'] = $request->latitud;
            }

            if ($request->has('longitud')) {
                $datosActualizacion['longitud'] = $request->longitud;
            }

            // Actualizar empleado SOLO si hay datos para actualizar
            if (! empty($datosActualizacion)) {
                $empleado->update($datosActualizacion);
            }
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
            // Guardar referencia al usuario antes de eliminar el empleado
            $usuario = $empleado->user;

            // Primero eliminar el empleado
            $empleado->delete();

            // Luego eliminar el usuario asociado si existe
            if ($usuario) {
                $usuario->delete();
            }
        });

        return redirect()->route('empleados.index')
            ->with('success', 'Empleado eliminado exitosamente.');
    }

    /**
     * Define la jerarquía de roles y qué roles puede asignar cada uno
     * Retorna un array con los roles que el usuario actual puede asignar
     */
    private function getRolesAsignablesPorUsuario(): array
    {
        $user = auth()->user();

        if (! $user) {
            return [];
        }

        // Definir jerarquía de roles
        $roleHierarchy = [
            'Super Admin' => [ // Puede asignar TODOS los roles
                'Super Admin',
                'Admin',
                'Manager',
                'Gerente',
                'Vendedor',
                'Compras',
                'Comprador',
                'Inventario',
                'Gestor de Almacén',
                'Logística',
                'Chofer',
                'Cajero',
                'Contabilidad',
                'Reportes',
                'Empleado',
                'Cliente',
            ],
            'Admin'       => [ // NO puede asignar Super Admin
                'Admin',
                'Manager',
                'Gerente',
                'Vendedor',
                'Compras',
                'Comprador',
                'Inventario',
                'Gestor de Almacén',
                'Logística',
                'Chofer',
                'Cajero',
                'Contabilidad',
                'Reportes',
                'Empleado',
                'Cliente',
            ],
            'Manager'     => [ // Solo roles operativos (Nivel 3 y 4)
                'Gerente',
                'Vendedor',
                'Compras',
                'Comprador',
                'Inventario',
                'Gestor de Almacén',
                'Logística',
                'Chofer',
                'Cajero',
                'Contabilidad',
                'Reportes',
                'Empleado',
                'Cliente',
            ],
        ];

        // Verificar qué roles puede asignar el usuario actual
        if ($user->hasRole('Super Admin')) {
            return $roleHierarchy['Super Admin'];
        }

        if ($user->hasRole('Admin')) {
            return $roleHierarchy['Admin'];
        }

        if ($user->hasRole('Manager')) {
            return $roleHierarchy['Manager'];
        }

        // Si no tiene un rol con permisos de asignación, no puede asignar ningún rol
        return [];
    }

    /**
     * Valida que el usuario actual pueda asignar los roles solicitados
     * Lanza una excepción si intenta asignar roles no permitidos
     */
    private function validarPermisosAsignacionRoles(array $rolesASolicitados): void
    {
        $rolesPermitidos = $this->getRolesAsignablesPorUsuario();

        if (empty($rolesPermitidos)) {
            throw new \Exception('No tiene permisos para asignar roles a empleados.');
        }

        foreach ($rolesASolicitados as $rol) {
            if (! in_array($rol, $rolesPermitidos)) {
                throw new \Exception("No tiene permisos para asignar el rol: {$rol}");
            }
        }
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
     * Método para crear o actualizar un chofer desde los datos de empleado
     */
    protected function gestionarChofer(Empleado $empleado, Request $request)
    {
        // Si el cargo es de chofer, verificar o crear licencia y datos específicos
        if (in_array($request->cargo, ['Chofer', 'Conductor', 'Repartidor', 'Mensajero'])) {
            // Validar datos específicos de chofer
            $request->validate([
                'licencia'                   => 'required|string|max:20',
                'fecha_vencimiento_licencia' => 'required|date|after:today',
            ], [
                'licencia.required'                   => 'La licencia de conducir es obligatoria para choferes',
                'fecha_vencimiento_licencia.required' => 'La fecha de vencimiento de licencia es obligatoria',
                'fecha_vencimiento_licencia.after'    => 'La fecha de vencimiento debe ser posterior a hoy',
            ]);

            // Asignar datos de chofer al empleado
            $empleado->update([
                'licencia'                   => $request->licencia,
                'fecha_vencimiento_licencia' => $request->fecha_vencimiento_licencia,
            ]);

            // Asegurarse de que el usuario tenga rol de Chofer
            if ($empleado->user && ! $empleado->user->hasRole('Chofer')) {
                $empleado->user->assignRole('Chofer');
            }
        }
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
     * Obtiene la lista de roles disponibles con descripción detallada de permisos
     */
    public function getRoles()
    {
        try {
            $rolesPermitidos = $this->getRolesAsignablesPorUsuario();

            $roles = Role::orderBy('name')
                ->get()
                ->filter(function ($role) use ($rolesPermitidos) {
                    return in_array($role->name, $rolesPermitidos);
                })
                ->map(function ($role) {
                    return [
                        'value'       => $role->name,
                        'label'       => $role->name,
                        'description' => $this->obtenerDescripcionRol($role->name),
                        'permisosCount' => $role->permissions->count(),
                        'permisos' => $this->obtenerPermisosResumenRol($role->name),
                        'capabilities' => $this->obtenerCapacidadesRol($role->name),
                    ];
                })
                ->values()
                ->toArray();

            return response()->json($roles);
        } catch (\Exception $e) {
            Log::error('Error en getRoles: ' . $e->getMessage());

            return response()->json([
                'error'   => 'Error interno del servidor',
                'message' => 'No se pudieron cargar los roles',
            ], 500);
        }
    }

    /**
     * Obtiene descripción detallada de un rol
     */
    private function obtenerDescripcionRol(string $rolName): string
    {
        $descripciones = [
            'Super Admin' => 'Acceso total al sistema, gestión de administradores y configuración crítica',
            'Admin' => 'Casi acceso total, excepto funciones críticas de sistema',
            'Manager' => 'Gestión de operaciones y personal operativo',
            'Gerente' => 'Supervisión de departamento y reportes',
            'Vendedor' => 'Gestión de clientes, creación de ventas y proformas',
            'Preventista' => 'Gestión de cartera de clientes, ventas, proformas y cajas',
            'Gestor de Clientes' => 'Gestión completa de base de clientes',
            'Comprador' => 'Gestión de compras y proveedores',
            'Compras' => 'Supervisión de procesos de compra',
            'Gestor de Inventario' => 'Control de stock y movimientos de inventario',
            'Gestor de Almacén' => 'Gestión de almacenes y transferencias',
            'Gestor de Logística' => 'Coordinación de envíos y entregas',
            'Chofer' => 'Gestión de entregas y viajes asignados',
            'Cajero' => 'Apertura, cierre y movimientos de cajas',
            'Contabilidad' => 'Registro de asientos contables y reportes',
            'Reportes' => 'Acceso a reportes y análisis del sistema',
            'Empleado' => 'Acceso básico al sistema',
            'Cliente' => 'Acceso portal de clientes (solo lectura)',
        ];

        return $descripciones[$rolName] ?? 'Rol del sistema: ' . $rolName;
    }

    /**
     * Obtiene un resumen de permisos principales de un rol
     */
    private function obtenerPermisosResumenRol(string $rolName): array
    {
        $permisosResumen = [
            'Super Admin' => [
                '✓ Todos los permisos del sistema',
                '✓ Gestión de administradores',
                '✓ Configuración crítica del sistema',
            ],
            'Admin' => [
                '✓ Casi todos los permisos',
                '✓ Gestión de usuarios y roles',
                '✗ Configuración crítica del sistema',
            ],
            'Vendedor' => [
                '✓ CRUD de clientes',
                '✓ Crear y editar ventas',
                '✓ Ver proformas y aprobar',
                '✗ Gestionar cajas',
                '✗ Compras',
            ],
            'Preventista' => [
                '✓ CRUD de clientes',
                '✓ CRUD de ventas',
                '✓ CRUD de proformas + Aprobar/Convertir',
                '✓ Gestión de cajas (Abrir/Cerrar)',
                '✓ Ver inventario y logística',
                '✗ Compras',
                '✗ Administración',
            ],
            'Gestor de Clientes' => [
                '✓ CRUD completo de clientes',
                '✓ Gestión de direcciones',
                '✓ Ventanas de entrega',
                '✓ Fotos y documentos',
            ],
            'Cajero' => [
                '✓ Abrir y cerrar cajas',
                '✓ Registrar transacciones',
                '✓ Ver movimientos del día',
                '✗ Crear ventas',
            ],
            'Chofer' => [
                '✓ Ver entregas asignadas',
                '✓ Confirmar entrega',
                '✓ Seguimiento de ruta',
                '✗ Crear documentos',
            ],
            'Gestor de Almacén' => [
                '✓ Ver stock disponible',
                '✓ Realizar transferencias',
                '✓ Registro de mermas',
                '✓ Ajustes de inventario',
            ],
        ];

        return $permisosResumen[$rolName] ?? [
            '✓ Acceso específico a funciones del rol',
        ];
    }

    /**
     * Obtiene capacidades principales de un rol (para display visual)
     */
    private function obtenerCapacidadesRol(string $rolName): array
    {
        $capacidades = [
            'Super Admin' => ['admin' => true, 'usuarios' => true, 'ventas' => true, 'compras' => true, 'inventario' => true],
            'Admin' => ['admin' => false, 'usuarios' => true, 'ventas' => true, 'compras' => true, 'inventario' => true],
            'Vendedor' => ['admin' => false, 'usuarios' => false, 'ventas' => true, 'compras' => false, 'inventario' => false],
            'Preventista' => ['admin' => false, 'usuarios' => false, 'ventas' => true, 'compras' => false, 'inventario' => false, 'cajas' => true],
            'Cajero' => ['admin' => false, 'usuarios' => false, 'ventas' => false, 'compras' => false, 'inventario' => false, 'cajas' => true],
            'Gestor de Almacén' => ['admin' => false, 'usuarios' => false, 'ventas' => false, 'compras' => false, 'inventario' => true],
        ];

        return $capacidades[$rolName] ?? [];
    }

    /**
     * Obtiene el rol sugerido automáticamente basado en el cargo del empleado
     */
    public function getRolSugeridoPorCargo(Request $request)
    {
        try {
            $request->validate([
                'cargo' => 'required|string|max:255',
            ]);

            $rolSugerido = $this->determinarRolPorCargo($request->cargo);

            if (!$rolSugerido) {
                return response()->json([
                    'rolSugerido' => null,
                    'mensaje' => 'No hay rol sugerido automáticamente. Selecciona uno manualmente.',
                ]);
            }

            // Obtener información detallada del rol sugerido
            $rol = Role::where('name', $rolSugerido)->first();

            return response()->json([
                'rolSugerido' => $rolSugerido,
                'descripcion' => $this->obtenerDescripcionRol($rolSugerido),
                'permisos' => $this->obtenerPermisosResumenRol($rolSugerido),
                'permisosCount' => $rol ? $rol->permissions->count() : 0,
                'mensaje' => "Rol sugerido: {$rolSugerido}",
            ]);
        } catch (\Exception $e) {
            Log::error('Error en getRolSugeridoPorCargo: ' . $e->getMessage());

            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => 'No se pudo determinar el rol sugerido',
            ], 500);
        }
    }
}
