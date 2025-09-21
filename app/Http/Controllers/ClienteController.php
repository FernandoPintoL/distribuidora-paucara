<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Cliente as ClienteModel;
use App\Models\Localidad;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    use \App\Http\Controllers\Traits\ApiInertiaResponseTrait;

    /**
     * Método privado para construir la query de clientes con filtros comunes
     */
    private function buildClientesQuery(Request $request, array $options = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $defaults = [
            'per_page'                 => 10,
            'include_email'            => false,
            'include_localidad_filter' => true,
            'include_order_options'    => true,
            'default_order_by'         => 'id',
            'default_order_dir'        => 'desc',
            'default_activo'           => null,
        ];

        $options = array_merge($defaults, $options);

        // Procesar parámetros de búsqueda
        $q           = (string) $request->string('q');
        $localidadId = $options['include_localidad_filter'] ? $request->input('localidad_id') : null;

        // Procesar parámetro activo
        $activoParam = $request->input('activo');
        $activo      = $options['default_activo'];

        if ($activoParam !== null && $activoParam !== '' && $activoParam !== 'all') {
            if ($activoParam === '1' || $activoParam === 1 || $activoParam === true || $activoParam === 'true') {
                $activo = true;
            } elseif ($activoParam === '0' || $activoParam === 0 || $activoParam === false || $activoParam === 'false') {
                $activo = false;
            }
        }

        // Procesar ordenamiento
        $orderBy  = $options['default_order_by'];
        $orderDir = $options['default_order_dir'];

        if ($options['include_order_options']) {
            $allowedOrderBy = ['id', 'nombre', 'fecha_registro'];
            $rawOrderBy     = (string) $request->string('order_by');
            $orderBy        = in_array($rawOrderBy, $allowedOrderBy, true) ? $rawOrderBy : $options['default_order_by'];

            $rawOrderDir = strtolower((string) $request->string('order_dir'));
            $orderDir    = in_array($rawOrderDir, ['asc', 'desc'], true) ? $rawOrderDir : $options['default_order_dir'];
        }

        // Construir query
        $query = ClienteModel::query()
            ->leftJoin('localidades', 'clientes.localidad_id', '=', 'localidades.id')
            ->when($q, function ($query) use ($q, $options) {
                $query->where(function ($sub) use ($q, $options) {
                    $sub->where('clientes.nombre', 'like', "%$q%")
                        ->orWhere('clientes.razon_social', 'like', "%$q%")
                        ->orWhere('clientes.nit', 'like', "%$q%")
                        ->orWhere('clientes.telefono', 'like', "%$q%")
                        ->orWhere('clientes.codigo_cliente', 'like', "%$q%")
                        ->orWhere('localidades.nombre', 'like', "%$q%");

                    if ($options['include_email']) {
                        $sub->orWhere('clientes.email', 'like', "%$q%");
                    }
                });
            })
            ->when($activo !== null, function ($query) use ($activo) {
                $query->where('clientes.activo', $activo);
            })
            ->when($localidadId && is_numeric($localidadId), function ($query) use ($localidadId) {
                $query->where('clientes.localidad_id', $localidadId);
            })
            ->select('clientes.*')
            ->orderBy('clientes.' . $orderBy, $orderDir);

        return $query->paginate($request->integer('per_page', $options['per_page']))->withQueryString();
    }

    public function index(Request $request): Response | \Symfony\Component\HttpFoundation\Response
    {
        $q           = (string) $request->string('q');
        $localidadId = $request->input('localidad_id');

        // Procesar parámetro activo para filtros
        $activoParam = $request->input('activo');
        $activo      = null;
        if ($activoParam !== null && $activoParam !== '' && $activoParam !== 'all') {
            if ($activoParam === '1' || $activoParam === 1 || $activoParam === true || $activoParam === 'true') {
                $activo = true;
            } elseif ($activoParam === '0' || $activoParam === 0 || $activoParam === false || $activoParam === 'false') {
                $activo = false;
            }
        }

        // Procesar ordenamiento para filtros
        $allowedOrderBy = ['id', 'nombre', 'fecha_registro'];
        $rawOrderBy     = (string) $request->string('order_by');
        $orderBy        = in_array($rawOrderBy, $allowedOrderBy, true) ? $rawOrderBy : 'id';

        $rawOrderDir = strtolower((string) $request->string('order_dir'));
        $orderDir    = in_array($rawOrderDir, ['asc', 'desc'], true) ? $rawOrderDir : 'desc';

        $items = $this->buildClientesQuery($request, [
            'per_page'                 => 10,
            'include_email'            => false,
            'include_localidad_filter' => true,
            'include_order_options'    => true,
            'default_order_by'         => 'id',
            'default_order_dir'        => 'desc',
            'default_activo'           => null,
        ]);

        if ($this->isApiRequest($request)) {
            // Cargar la relación localidad para la respuesta API
            $items->getCollection()->load('localidad');

            return $this->apiResponse([
                'data'         => $items->items(),
                'current_page' => $items->currentPage(),
                'last_page'    => $items->lastPage(),
                'per_page'     => $items->perPage(),
                'total'        => $items->total(),
            ], 'Clientes obtenidos exitosamente');
        }

        return Inertia::render('clientes/index', [
            'clientes'    => $items,
            'filters'     => [
                'q'            => $q,
                'activo'       => $activo !== null ? ($activo ? '1' : '0') : null,
                'localidad_id' => $localidadId,
                'order_by'     => $orderBy,
                'order_dir'    => $orderDir,
            ],
            'localidades' => Localidad::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo'])
                ->map(function ($localidad) {
                    return [
                        'id'     => $localidad->id,
                        'nombre' => $localidad->nombre,
                        'codigo' => $localidad->codigo,
                    ];
                }),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('clientes/form', [
            'cliente'     => null,
            'localidades' => Localidad::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo'])
                ->map(function ($localidad) {
                    return [
                        'id'     => $localidad->id,
                        'nombre' => $localidad->nombre,
                        'codigo' => $localidad->codigo,
                    ];
                }),
        ]);
    }

    public function store(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $isModalRequest = $this->isModalRequest($request);

        $validationRules = [
            'crear_usuario' => ['nullable', 'boolean'],
            'nombre'        => ['required', 'string', 'max:255'],
            'razon_social'  => ['nullable', 'string', 'max:255'],
            'nit'           => ['required', 'string', 'max:255'],
            'telefono'      => ['required', 'string', 'max:100', 'unique:clientes,telefono'],
            'email'         => ['nullable', 'email', 'max:255'],
            'localidad_id'  => ['nullable', 'exists:localidades,id'],
            'latitud'       => ['nullable', 'numeric', 'between:-90,90'],
            'longitud'      => ['nullable', 'numeric', 'between:-180,180'],
            'activo'        => ['boolean'],
        ];

        // Validaciones adicionales si se va a crear usuario
        if ($request->crear_usuario) {
            $validationRules = array_merge($validationRules, [
                'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            ]);
        }

        // Validar archivos solo si no es una petición de modal
        if (! $isModalRequest) {
            $validationRules = array_merge($validationRules, [
                'foto_perfil' => ['nullable', 'image', 'max:5120'],
                'ci_anverso'  => ['nullable', 'image', 'max:5120'],
                'ci_reverso'  => ['nullable', 'image', 'max:5120'],
            ]);
        }

        $data           = $request->validate($validationRules);
        $data['activo'] = $data['activo'] ?? true;

        // No procesar archivos aquí - handleClientCreation los maneja con rutas dinámicas

        return $this->handleCrudOperation(
            $request,
            function () use ($data, $request, $isModalRequest) {
                // Usar el método compartido para crear el cliente
                $cliente = $this->handleClientCreation($request, $data, true, false, ! $isModalRequest);

                // Si es modal request, devolver solo el cliente básico
                if ($isModalRequest) {
                    return ['cliente' => $cliente];
                }

                // Para requests normales, devolver con usuario si fue creado
                $user = $cliente->user;

                return ['cliente' => $cliente, 'usuario' => $user];
            },
            'Cliente creado exitosamente',
            'clientes.index'
        );
    }

    public function edit(ClienteModel $cliente): Response
    {
        return Inertia::render('clientes/form', [
            // Cargar relaciones necesarias para el formulario de edición
            'cliente'     => $cliente->load(['direcciones']),
            'localidades' => Localidad::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo'])
                ->map(function ($localidad) {
                    return [
                        'id'     => $localidad->id,
                        'nombre' => $localidad->nombre,
                        'codigo' => $localidad->codigo,
                    ];
                }),
        ]);
    }

    public function update(Request $request, ClienteModel $cliente): \Symfony\Component\HttpFoundation\Response
    {
        return $this->handleCrudOperation(
            $request,
            function () use ($request, $cliente) {
                $validationRules = [
                    'crear_usuario' => ['nullable', 'boolean'],
                    'nombre'        => ['required', 'string', 'max:255'],
                    'razon_social'  => ['nullable', 'string', 'max:255'],
                    'nit'           => ['nullable', 'string', 'max:255'],
                    'telefono'      => [
                        'required',
                        'string',
                        'max:100',
                        Rule::unique('clientes')->ignore($cliente->id),
                    ],
                    'email'         => ['nullable', 'email', 'max:255'],
                    'localidad_id'  => ['nullable', 'exists:localidades,id'],
                    'latitud'       => ['nullable', 'numeric', 'between:-90,90'],
                    'longitud'      => ['nullable', 'numeric', 'between:-180,180'],
                    'activo'        => ['boolean'],
                    'foto_perfil'   => ['nullable', 'image', 'max:5120'],
                    'ci_anverso'    => ['nullable', 'image', 'max:5120'],
                    'ci_reverso'    => ['nullable', 'image', 'max:5120'],
                ];

                // Validaciones adicionales si se va a crear o actualizar usuario
                if ($request->crear_usuario) {
                    $validationRules = array_merge($validationRules, [
                        'email' => [
                            'nullable',
                            'email',
                            'max:255',
                            $cliente->user_id ? Rule::unique('users')->ignore($cliente->user_id) : 'unique:users,email',
                        ],
                    ]);
                }

                $data = $request->validate($validationRules);

                $updates = $data;

                // Procesar archivos con ruta dinámica
                if ($request->hasFile('foto_perfil')) {
                    $folderName             = $this->generateClientFolderName($cliente);
                    $updates['foto_perfil'] = $request->file('foto_perfil')->store($folderName, 'public');
                }
                if ($request->hasFile('ci_anverso')) {
                    $folderName            = $this->generateClientFolderName($cliente);
                    $updates['ci_anverso'] = $request->file('ci_anverso')->store($folderName, 'public');
                }
                if ($request->hasFile('ci_reverso')) {
                    $folderName            = $this->generateClientFolderName($cliente);
                    $updates['ci_reverso'] = $request->file('ci_reverso')->store($folderName, 'public');
                }

                // Manejar usuario
                if ($request->crear_usuario) {
                    if ($cliente->user) {
                        // Actualizar usuario existente - mantener usernick y password actuales
                        // El cliente podrá cambiarlos desde su perfil posteriormente
                        $userUpdates = [
                            'name'  => $request->nombre,
                            'email' => $request->email,
                        ];

                        $cliente->user->update($userUpdates);
                    } else {
                        // Crear nuevo usuario usando teléfono como usernick y password
                        $telefono = $request->telefono;
                        $usernick = $this->generarUsernickUnico($telefono);

                        $userData = [
                            'name'     => $request->nombre,
                            'usernick' => $usernick,
                            'password' => Hash::make($telefono), // Usar teléfono como password
                            'activo'   => true,
                        ];

                        // Agregar email solo si se proporciona
                        if ($request->filled('email')) {
                            $userData['email']             = $request->email;
                            $userData['email_verified_at'] = now();
                        }

                        $user = User::create($userData);

                        $user->assignRole('Cliente');
                        $updates['user_id'] = $user->id;
                    }
                }

                $cliente->update($updates);

                return ['cliente' => $cliente->fresh(['user'])];
            },
            'Cliente actualizado exitosamente',
            'clientes.index'
        );
    }

    public function destroy(Request $request, ClienteModel $cliente): \Symfony\Component\HttpFoundation\Response
    {
        return $this->handleCrudOperation(
            $request,
            function () use ($cliente) {
                $cliente->delete();

                return null;
            },
            'Cliente eliminado exitosamente',
            'clientes.index'
        );
    }

    // ================================
    // MÉTODOS API
    // ================================

    /**
     * API: Listar clientes
     */
    public function indexApi(Request $request): JsonResponse
    {
        $clientes = $this->buildClientesQuery($request, [
            'per_page'                 => 20,
            'include_email'            => true,
            'include_localidad_filter' => false,
            'include_order_options'    => false,
            'default_order_by'         => 'nombre',
            'default_order_dir'        => 'asc',
            'default_activo'           => true,
        ]);

        // Cargar la relación localidad para incluirla en la respuesta
        $clientes->getCollection()->load('localidad');

        return ApiResponse::success($clientes);
    }

    /**
     * API: Mostrar cliente específico
     */
    public function showApi(ClienteModel $cliente): JsonResponse
    {
        $cliente->load(['direcciones', 'localidad', 'cuentasPorCobrar' => function ($query) {
            $query->where('saldo_pendiente', '>', 0)->orderByDesc('fecha_vencimiento');
        }]);

        return ApiResponse::success($cliente);
    }

    /**
     * API: Crear cliente
     */
    public function storeApi(Request $request): JsonResponse
    {
        // Preparar datos convirtiendo valores booleanos
        $data = $request->all();

        // Convertir valores booleanos que pueden venir como strings o números
        if (isset($data['activo'])) {
            $data['activo'] = $this->convertToBoolean($data['activo']);
        }

        if (isset($data['crear_usuario'])) {
            $data['crear_usuario'] = $this->convertToBoolean($data['crear_usuario']);
        }

        if (isset($data['direcciones']) && is_array($data['direcciones'])) {
            foreach ($data['direcciones'] as &$direccion) {
                if (isset($direccion['es_principal'])) {
                    $direccion['es_principal'] = $this->convertToBoolean($direccion['es_principal']);
                }
            }
        }

        $request->merge($data);

        $validated = $request->validate([
            'crear_usuario'               => ['nullable', 'boolean'],
            'nombre'                      => ['required', 'string', 'max:255'],
            'razon_social'                => ['nullable', 'string', 'max:255'],
            'nit'                         => ['nullable', 'string', 'max:50'],
            'email'                       => ['nullable', 'email', 'max:255'],
            'telefono'                    => ['nullable', 'string', 'max:20'],
            'whatsapp'                    => ['nullable', 'string', 'max:20'],
            'fecha_nacimiento'            => ['nullable', 'date'],
            'genero'                      => ['nullable', 'in:M,F,O'],
            'limite_credito'              => ['nullable', 'numeric', 'min:0'],
            'localidad_id'                => ['nullable', 'exists:localidades,id'],
            'latitud'                     => ['nullable', 'numeric', 'between:-90,90'],
            'longitud'                    => ['nullable', 'numeric', 'between:-180,180'],
            'activo'                      => ['boolean'],
            'observaciones'               => ['nullable', 'string'],
            // Archivos de imagen
            'foto_perfil'                 => ['nullable', 'image', 'max:5120'],
            'ci_anverso'                  => ['nullable', 'image', 'max:5120'],
            'ci_reverso'                  => ['nullable', 'image', 'max:5120'],
            // Direcciones opcionales
            'direcciones'                 => ['nullable', 'array'],
            'direcciones.*.direccion'     => ['required_with:direcciones', 'string', 'max:500'],
            'direcciones.*.ciudad'        => ['nullable', 'string', 'max:100'],
            'direcciones.*.departamento'  => ['nullable', 'string', 'max:100'],
            'direcciones.*.codigo_postal' => ['nullable', 'string', 'max:20'],
            'direcciones.*.es_principal'  => ['boolean'],
            'direcciones.*.activa'        => ['nullable', 'boolean'],
        ]);

        // Validaciones adicionales si se va a crear usuario
        if ($request->crear_usuario) {
            $request->validate([
                'telefono' => ['required', 'string', 'max:20', 'unique:clientes,telefono'],
                'email'    => ['nullable', 'email', 'max:255', 'unique:users,email'],
            ]);
        } else {
            $request->validate([
                'telefono' => ['nullable', 'string', 'max:20', 'unique:clientes,telefono'],
            ]);
        }

        try {
            // Usar el método compartido para crear el cliente
            $cliente = $this->handleClientCreation($request, $data, false, true, true);

            $responseData = [
                // Devolver el cliente con relaciones necesarias para que el frontend pueda usarlo de inmediato
                'cliente' => $cliente->load(['direcciones', 'localidad', 'user', 'fotosLugar']),
            ];

            if ($cliente->user) {
                $responseData['usuario'] = $cliente->user;
            }

            return ApiResponse::success(
                $responseData,
                'Cliente creado exitosamente',
                201
            );

        } catch (\Exception $e) {
            return ApiResponse::error('Error al crear cliente: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Método privado para manejar la creación de clientes con lógica compartida
     */
    private function handleClientCreation(Request $request, array $data, bool $requireNitTelefono = false, bool $handleDirecciones = false, bool $processFiles = true): ClienteModel
    {
        // Validaciones adicionales si se va a crear usuario
        if ($request->crear_usuario) {
            $request->validate([
                'telefono' => ['required', 'string', 'max:20', 'unique:clientes,telefono'],
                'email'    => ['nullable', 'email', 'max:255', 'unique:users,email'],
            ]);
        } elseif ($requireNitTelefono) {
            $request->validate([
                'telefono' => ['required', 'string', 'max:20', 'unique:clientes,telefono'],
            ]);
        }

        $user = null;

        // Crear usuario solo si se solicita
        if ($request->crear_usuario && $request->telefono) {
            // Usar teléfono como usernick y password
            $telefono = $request->telefono;
            $usernick = $this->generarUsernickUnico($telefono);

            $userData = [
                'name'     => $request->nombre,
                'usernick' => $usernick,
                'password' => Hash::make($telefono), // Usar teléfono como password
                'activo'   => true,
            ];

            // Agregar email solo si se proporciona
            if ($request->filled('email')) {
                $userData['email']             = $request->email;
                $userData['email_verified_at'] = now();
            }

            $user = User::create($userData);

            // Asignar rol de cliente
            $user->assignRole('Cliente');
        }

        $cliente = ClienteModel::create([
            'user_id'          => $user ? $user->id : null,
            'nombre'           => $data['nombre'],
            'razon_social'     => $data['razon_social'] ?? null,
            'nit'              => $data['nit'] ?? null,
            'email'            => $data['email'] ?? null,
            'telefono'         => $data['telefono'] ?? null,
            'whatsapp'         => $data['whatsapp'] ?? null,
            'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
            'genero'           => $data['genero'] ?? null,
            'limite_credito'   => $data['limite_credito'] ?? 0,
            'localidad_id'     => $data['localidad_id'] ?? null,
            'latitud'          => $data['latitud'] ?? null,
            'longitud'         => $data['longitud'] ?? null,
            'activo'           => $data['activo'] ?? true,
            'observaciones'    => $data['observaciones'] ?? null,
            'fecha_registro'   => now(),
        ]);

        // Crear direcciones si se proporcionaron y se deben manejar
        if ($handleDirecciones && isset($data['direcciones']) && is_array($data['direcciones'])) {
            foreach ($data['direcciones'] as $direccionData) {
                // Asegurar que tenga el campo activa con valor por defecto
                $direccionData['activa'] = $direccionData['activa'] ?? true;

                $cliente->direcciones()->create($direccionData);
            }
        }

        // Procesar archivos de imagen con ruta dinámica si se solicita
        if ($processFiles) {
            $updates = [];
            if ($request->hasFile('foto_perfil')) {
                $folderName             = $this->generateClientFolderName($cliente);
                $updates['foto_perfil'] = $request->file('foto_perfil')->store($folderName, 'public');
            }
            if ($request->hasFile('ci_anverso')) {
                $folderName            = $this->generateClientFolderName($cliente);
                $updates['ci_anverso'] = $request->file('ci_anverso')->store($folderName, 'public');
            }
            if ($request->hasFile('ci_reverso')) {
                $folderName            = $this->generateClientFolderName($cliente);
                $updates['ci_reverso'] = $request->file('ci_reverso')->store($folderName, 'public');
            }

            // Actualizar cliente con las rutas de las imágenes si se subieron
            if (! empty($updates)) {
                $cliente->update($updates);
                $cliente->refresh(); // Recargar el modelo con los nuevos datos
            }
        }

        return $cliente;
    }

    /**
     * API: Actualizar cliente
     */
    public function updateApi(Request $request, ClienteModel $cliente): JsonResponse
    {
        $data = $request->validate([
            'crear_usuario'    => ['nullable', 'boolean'],
            'nombre'           => ['sometimes', 'required', 'string', 'max:255'],
            'razon_social'     => ['nullable', 'string', 'max:255'],
            'nit'              => ['nullable', 'string', 'max:50'],
            'email'            => ['nullable', 'email', 'max:255'],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'whatsapp'         => ['nullable', 'string', 'max:20'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'genero'           => ['nullable', 'in:M,F,O'],
            'limite_credito'   => ['nullable', 'numeric', 'min:0'],
            'localidad_id'     => ['nullable', 'exists:localidades,id'],
            'latitud'          => ['nullable', 'numeric', 'between:-90,90'],
            'longitud'         => ['nullable', 'numeric', 'between:-180,180'],
            'activo'           => ['boolean'],
            'observaciones'    => ['nullable', 'string'],
            // Archivos de imagen
            'foto_perfil'      => ['nullable', 'image', 'max:5120'],
            'ci_anverso'       => ['nullable', 'image', 'max:5120'],
            'ci_reverso'       => ['nullable', 'image', 'max:5120'],
        ]);

        // Validaciones adicionales si se va a crear usuario
        if ($request->crear_usuario) {
            $request->validate([
                'telefono' => ['required', 'string', 'max:20', Rule::unique('clientes')->ignore($cliente->id)],
                'email'    => [
                    'nullable',
                    'email',
                    'max:255',
                    $cliente->user_id ? Rule::unique('users')->ignore($cliente->user_id) : 'unique:users,email',
                ],
            ]);
        } else {
            $request->validate([
                'telefono' => ['nullable', 'string', 'max:20', Rule::unique('clientes')->ignore($cliente->id)],
            ]);
        }

        try {
            $user = null;

            // Manejar usuario
            if ($request->crear_usuario) {
                if ($cliente->user) {
                    // Actualizar usuario existente - mantener usernick y password actuales
                    // El cliente podrá cambiarlos desde su perfil posteriormente
                    $userUpdates = [
                        'name'  => $request->nombre,
                        'email' => $request->email,
                    ];

                    $cliente->user->update($userUpdates);
                    $user = $cliente->user;
                } else {
                    // Crear nuevo usuario usando teléfono como usernick y password
                    if ($request->telefono) {
                        $telefono = $request->telefono;
                        $usernick = $this->generarUsernickUnico($telefono);

                        $userData = [
                            'name'     => $request->nombre,
                            'usernick' => $usernick,
                            'password' => Hash::make($telefono), // Usar teléfono como password
                            'activo'   => true,
                        ];

                        // Agregar email solo si se proporciona
                        if ($request->filled('email')) {
                            $userData['email']             = $request->email;
                            $userData['email_verified_at'] = now();
                        }

                        $user = User::create($userData);

                        // Asignar rol de cliente
                        $user->assignRole('Cliente');

                        // Actualizar el cliente con el user_id
                        $data['user_id'] = $user->id;
                    }
                }
            }

            $cliente->update($data);

            // Procesar archivos de imagen con ruta dinámica
            $updates = [];
            if ($request->hasFile('foto_perfil')) {
                $folderName             = $this->generateClientFolderName($cliente);
                $updates['foto_perfil'] = $request->file('foto_perfil')->store($folderName, 'public');
            }
            if ($request->hasFile('ci_anverso')) {
                $folderName            = $this->generateClientFolderName($cliente);
                $updates['ci_anverso'] = $request->file('ci_anverso')->store($folderName, 'public');
            }
            if ($request->hasFile('ci_reverso')) {
                $folderName            = $this->generateClientFolderName($cliente);
                $updates['ci_reverso'] = $request->file('ci_reverso')->store($folderName, 'public');
            }

            // Actualizar cliente con las rutas de las imágenes si se subieron
            if (! empty($updates)) {
                $cliente->update($updates);
                $cliente->refresh(); // Recargar el modelo con los nuevos datos
            }

            $responseData = [
                // Incluir relaciones habituales (direcciones y catálogo relacionado) en la respuesta
                'cliente' => $cliente->fresh(['direcciones', 'localidad', 'user', 'fotosLugar']),
            ];

            if ($user) {
                $responseData['usuario'] = $user;
            }

            return ApiResponse::success(
                $responseData,
                'Cliente actualizado exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error('Error al actualizar cliente: ' . $e->getMessage(), 500);
        }
    }

    /**
     * API: Eliminar cliente
     */
    public function destroyApi(ClienteModel $cliente): JsonResponse
    {
        try {
            // Verificar si tiene cuentas por cobrar pendientes
            $tieneCuentasPendientes = $cliente->cuentasPorCobrar()->where('saldo_pendiente', '>', 0)->exists();
            if ($tieneCuentasPendientes) {
                return ApiResponse::error('No se puede eliminar un cliente con cuentas por cobrar pendientes', 400);
            }

            // Verificar si tiene ventas registradas
            $tieneVentas = $cliente->ventas()->exists();
            if ($tieneVentas) {
                // Solo desactivar
                $cliente->update(['activo' => false]);

                return ApiResponse::success(null, 'Cliente desactivado (tiene historial de ventas)');
            }

            // Eliminar completamente
            $cliente->delete();

            return ApiResponse::success(null, 'Cliente eliminado exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al eliminar cliente: ' . $e->getMessage(), 500);
        }
    }

    /**
     * API: Buscar clientes para autocompletado
     */
    public function buscarApi(Request $request): JsonResponse
    {
        $q      = $request->string('q');
        $limite = $request->integer('limite', 10);

        if (! $q || strlen($q) < 2) {
            return ApiResponse::success([]);
        }

        $clientes = ClienteModel::select(['id', 'nombre', 'razon_social', 'nit', 'telefono', 'email'])
            ->where('activo', true)
            ->where(function ($query) use ($q) {
                $query->where('nombre', 'like', "%$q%")
                    ->orWhere('razon_social', 'like', "%$q%")
                    ->orWhere('nit', 'like', "%$q%")
                    ->orWhere('telefono', 'like', "%$q%");
            })
            ->limit($limite)
            ->get();

        return ApiResponse::success($clientes);
    }

    /**
     * API: Obtener saldo de cuentas por cobrar de un cliente
     */
    public function saldoCuentasPorCobrar(ClienteModel $cliente): JsonResponse
    {
        $cuentas = $cliente->cuentasPorCobrar()
            ->where('saldo_pendiente', '>', 0)
            ->orderByDesc('fecha_vencimiento')
            ->get(['id', 'venta_id', 'monto_original', 'saldo_pendiente', 'fecha_vencimiento', 'dias_vencido']);

        $saldoTotal      = $cuentas->sum('saldo_pendiente');
        $cuentasVencidas = $cuentas->where('dias_vencido', '>', 0)->count();

        return ApiResponse::success([
            'cliente'          => [
                'id'             => $cliente->id,
                'nombre'         => $cliente->nombre,
                'limite_credito' => $cliente->limite_credito,
            ],
            'saldo_total'      => $saldoTotal,
            'cuentas_vencidas' => $cuentasVencidas,
            'cuentas_detalle'  => $cuentas,
        ]);
    }

    /**
     * API: Historial de compras del cliente
     */
    public function historialVentas(ClienteModel $cliente, Request $request): JsonResponse
    {
        $perPage     = $request->integer('per_page', 10);
        $fechaInicio = $request->date('fecha_inicio');
        $fechaFin    = $request->date('fecha_fin');

        $ventas = $cliente->ventas()
            ->with(['estadoDocumento', 'moneda', 'detalles.producto:id,nombre'])
            ->when($fechaInicio, fn($q) => $q->whereDate('fecha', '>=', $fechaInicio))
            ->when($fechaFin, fn($q) => $q->whereDate('fecha', '<=', $fechaFin))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->paginate($perPage);

        return ApiResponse::success($ventas);
    }

    /**
     * Genera un usernick único basado en el teléfono del cliente
     * Si el teléfono ya existe como usernick, agrega un sufijo numérico
     */
    private function generarUsernickUnico(string $telefono): string
    {
        $baseUsernick = $telefono; // Usar teléfono directamente como base
        $usernick     = $baseUsernick;
        $counter      = 1;

        // Verificar si el usernick ya existe y agregar número si es necesario
        while (User::where('usernick', $usernick)->exists()) {
            $usernick = $baseUsernick . '_' . $counter;
            $counter++;
        }

        return $usernick;
    }

    /**
     * Permite a un cliente cambiar su usernick y contraseña
     */
    public function cambiarCredenciales(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'usernick'        => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password_actual' => ['required', 'string'],
            'password_nueva'  => ['required', 'string', 'min:8'],
            'email'           => ['nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        // Verificar que el usuario sea un cliente
        if (! $user->esCliente()) {
            return ApiResponse::error('Solo los clientes pueden cambiar sus credenciales desde este endpoint', 403);
        }

        // Verificar contraseña actual
        if (! Hash::check($request->password_actual, $user->password)) {
            return ApiResponse::error('La contraseña actual es incorrecta', 422);
        }

        // Preparar datos para actualizar
        $userUpdates = [
            'usernick' => $request->usernick,
            'password' => Hash::make($request->password_nueva),
        ];

        // Agregar email solo si se proporciona
        if ($request->filled('email')) {
            $userUpdates['email']             = $request->email;
            $userUpdates['email_verified_at'] = now();
        } elseif ($request->has('email') && $request->email === null) {
            // Si se envía email como null, quitar el email
            $userUpdates['email']             = null;
            $userUpdates['email_verified_at'] = null;
        }

        // Actualizar credenciales
        $user->update($userUpdates);

        return ApiResponse::success(null, 'Credenciales actualizadas exitosamente');
    }

    /**
     * Convierte diferentes formatos de valores booleanos a boolean real
     */
    private function convertToBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            $lowerValue = strtolower($value);

            return in_array($lowerValue, ['true', '1', 'yes', 'on']);
        }

        if (is_numeric($value)) {
            return $value == 1;
        }

        return false;
    }

    /**
     * Genera el nombre de carpeta para las imágenes del cliente
     * Formato: clientes/{idCliente}_{fechaRegistro}
     */
    private function generateClientFolderName(ClienteModel $cliente): string
    {
        $fechaRegistro = $cliente->fecha_registro->format('Y-m-d');

        return "clientes/{$cliente->id}_{$fechaRegistro}";
    }
}
