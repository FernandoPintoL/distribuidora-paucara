<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Traits\UnifiedResponseTrait;
use App\Models\Cliente as ClienteModel;
use App\Models\Localidad;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ClienteController extends Controller
{
    use UnifiedResponseTrait;

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
                // Convertir búsqueda a minúsculas para hacer búsqueda case-insensitive
                $searchLower = strtolower($q);
                $query->where(function ($sub) use ($searchLower, $options) {
                    $sub->whereRaw('LOWER(clientes.nombre) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(clientes.razon_social) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(clientes.nit) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(clientes.telefono) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(clientes.codigo_cliente) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(localidades.nombre) like ?', ["%$searchLower%"]);

                    if ($options['include_email']) {
                        $sub->orWhereRaw('LOWER(clientes.email) like ?', ["%$searchLower%"]);
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

    public function index(Request $request)
    {
        try {
            // Configurar opciones según el tipo de request
            $options = $this->isApiRequest() ? [
                'per_page'                 => 20,
                'include_email'            => true,
                'include_localidad_filter' => false,
                'include_order_options'    => false,
                'default_order_by'         => 'nombre',
                'default_order_dir'        => 'asc',
                'default_activo'           => true,
            ] : [
                'per_page'                 => 15,
                'include_email'            => false,
                'include_localidad_filter' => true,
                'include_order_options'    => true,
                'default_order_by'         => 'id',
                'default_order_dir'        => 'desc',
                'default_activo'           => null,
            ];

            $clientes = $this->buildClientesQuery($request, $options);

            // Cargar relaciones según el tipo de request
            if ($this->isApiRequest()) {
                $clientes->getCollection()->load('localidad', 'categorias', 'direcciones', 'user');
            } else {
                $clientes->getCollection()->load('localidad');
            }

            // 🔍 DEBUG: Log para ver qué datos se están enviando
            \Log::info('🔍 DEBUG CLIENTES INDEX', [
                'is_api_request' => $this->isApiRequest(),
                'total_clientes' => $clientes->total(),
                'primer_cliente' => $clientes->first() ? [
                    'id' => $clientes->first()->id,
                    'nombre' => $clientes->first()->nombre,
                    'localidad_id' => $clientes->first()->localidad_id,
                    'localidad_cargada' => $clientes->first()->relationLoaded('localidad'),
                    'localidad_data' => $clientes->first()->localidad ? [
                        'id' => $clientes->first()->localidad->id,
                        'nombre' => $clientes->first()->localidad->nombre,
                        'codigo' => $clientes->first()->localidad->codigo,
                    ] : null,
                    'toArray' => $clientes->first()->toArray(),
                ] : null,
            ]);

            // Preparar datos adicionales para web
            $additionalData = [];
            if (! $this->isApiRequest()) {
                $additionalData = [
                    'filters'     => $request->only(['q', 'activo', 'localidad_id', 'order_by', 'order_dir']),
                    'localidades' => Localidad::where('activo', true)
                        ->orderBy('nombre')
                        ->get(['id', 'nombre', 'codigo']),
                ];
            }

            return $this->paginatedResponse(
                $clientes,
                $this->isApiRequest() ? null : 'clientes/index',
                'clientes',
                $additionalData
            );

        } catch (\Exception $e) {
            return $this->handleException($e, 'obtener clientes');
        }
    }

    public function create()
    {
        try {
            $data = [
                'cliente'     => null,
                'localidades' => Localidad::where('activo', true)
                    ->orderBy('nombre')
                    ->get(['id', 'nombre', 'codigo']),
            ];

            return $this->dataResponse('clientes/form', $data);

        } catch (\Exception $e) {
            return $this->handleException($e, 'cargar formulario de creación');
        }
    }

    public function store(Request $request)
    {
        // Preparar datos convirtiendo valores booleanos para API
        $data = $request->all();
        if ($this->isApiRequest()) {
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
        }

        // Filtrar direcciones vacías o incompletas antes de validar
        if (isset($data['direcciones']) && is_array($data['direcciones'])) {
            $data['direcciones'] = array_filter($data['direcciones'], function ($direccion) {
                // Solo mantener direcciones que tengan al menos dirección, latitud o longitud
                return !empty($direccion['direccion']) ||
                       !empty($direccion['latitud']) || !empty($direccion['longitud']);
            });

            // Reindexar el array para evitar índices no consecutivos
            $data['direcciones'] = array_values($data['direcciones']);

            // Si el array quedó vacío, eliminarlo completamente
            if (empty($data['direcciones'])) {
                unset($data['direcciones']);
            }

            $request->merge($data);
        }

        // Validaciones base
        $validated = $request->validate([
            'nombre'                         => 'required|string|max:255',
            'razon_social'                   => 'nullable|string|max:255',
            'nit'                            => 'nullable|string|max:50',
            'email'                          => 'nullable|email|max:255',
            'telefono'                       => 'nullable|string|max:20',
            'limite_credito'                 => 'nullable|numeric|min:0',
            'localidad_id'                   => 'nullable|exists:localidades,id',
            'activo'                         => 'nullable|boolean',
            'observaciones'                  => 'nullable|string',
            'crear_usuario'                  => 'nullable|boolean',
            'password'                       => 'required_if:crear_usuario,true|nullable|string|min:8',
            // Campos de imagen (opcionales)
            'foto_perfil'                    => 'nullable|sometimes|image|mimes:jpeg,jpg,png,gif|max:5120',
            'ci_anverso'                     => 'nullable|sometimes|image|mimes:jpeg,jpg,png,gif|max:5120',
            'ci_reverso'                     => 'nullable|sometimes|image|mimes:jpeg,jpg,png,gif|max:5120',
            // Direcciones
            'direcciones'                    => 'nullable|array',
            'direcciones.*.direccion'        => 'required_with:direcciones|string|max:500',
            'direcciones.*.latitud'          => 'required_with:direcciones|numeric|between:-90,90',
            'direcciones.*.longitud'         => 'required_with:direcciones|numeric|between:-180,180',
            'direcciones.*.observaciones'    => 'nullable|string|max:1000',
            'direcciones.*.es_principal'     => 'nullable|boolean',
            'direcciones.*.activa'           => 'nullable|boolean',
            // Ventanas de entrega (solo API)
            'ventanas_entrega'               => 'nullable|array',
            'ventanas_entrega.*.dia_semana'  => 'required_with:ventanas_entrega|integer|between:0,6',
            'ventanas_entrega.*.hora_inicio' => 'required_with:ventanas_entrega|date_format:H:i',
            'ventanas_entrega.*.hora_fin'    => 'required_with:ventanas_entrega|date_format:H:i',
            'ventanas_entrega.*.activo'      => 'nullable|boolean',
            // Categorías (solo API)
            'categorias_ids'                 => 'nullable|array',
            'categorias_ids.*'               => 'integer|exists:categorias_cliente,id',
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
            // Determinar si se deben manejar direcciones
            $handleDirecciones = $this->isApiRequest() || $request->has('direcciones');

            // Usar el método compartido para crear el cliente
            $cliente = $this->handleClientCreation($request, $data, false, $handleDirecciones, !$this->isApiRequest());

            // Guardar ventanas de entrega y categorías para API
            if ($this->isApiRequest()) {
                $this->syncVentanasEntrega($cliente, isset($data['ventanas_entrega']) ? (array) $data['ventanas_entrega'] : null);
                $this->syncCategorias($cliente, isset($data['categorias_ids']) ? (array) $data['categorias_ids'] : null);
            }

            // Preparar respuesta según el tipo de request
            if ($this->isApiRequest()) {
                $responseData = [
                    'cliente' => $cliente->load(['direcciones', 'localidad', 'user', 'ventanasEntrega', 'categorias']),
                ];
                if ($cliente->user) {
                    $responseData['usuario'] = $cliente->user;
                }
                return $this->resourceResponse($responseData, 'Cliente creado exitosamente', null, [], 201);
            } else {
                return $this->resourceResponse(
                    $cliente->load('localidad'),
                    'Cliente creado exitosamente',
                    'clientes.index',
                    [],
                    201
                );
            }

        } catch (\Exception $e) {
            return $this->handleException($e, 'crear cliente');
        }
    }

    public function edit(ClienteModel $cliente)
    {
        try {
            return $this->dataResponse('clientes/form', [
                'cliente'     => $cliente->load(['localidad', 'direcciones']),
                'localidades' => Localidad::where('activo', true)
                    ->orderBy('nombre')
                    ->get(['id', 'nombre', 'codigo']),
            ]);

        } catch (\Exception $e) {
            return $this->handleException($e, 'cargar formulario de edición');
        }
    }

    public function update(Request $request, ClienteModel $cliente)
    {
        // Preparar datos convirtiendo valores booleanos para API
        $data = $request->all();
        if ($this->isApiRequest()) {
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
        }

        // Filtrar direcciones vacías o incompletas antes de validar
        if (isset($data['direcciones']) && is_array($data['direcciones'])) {
            $data['direcciones'] = array_filter($data['direcciones'], function ($direccion) {
                // Solo mantener direcciones que tengan al menos dirección, latitud o longitud
                return !empty($direccion['direccion']) ||
                       !empty($direccion['latitud']) || !empty($direccion['longitud']);
            });

            // Reindexar el array para evitar índices no consecutivos
            $data['direcciones'] = array_values($data['direcciones']);

            // Si el array quedó vacío, eliminarlo completamente
            if (empty($data['direcciones'])) {
                unset($data['direcciones']);
            }

            $request->merge($data);
        }

        // Validaciones base
        $validated = $request->validate([
            'crear_usuario'                  => 'nullable|boolean',
            'nombre'                         => 'sometimes|required|string|max:255',
            'razon_social'                   => 'nullable|string|max:255',
            'nit'                            => 'nullable|string|max:50',
            'email'                          => 'nullable|email|max:255',
            'telefono'                       => 'nullable|string|max:20',
            'limite_credito'                 => 'nullable|numeric|min:0',
            'localidad_id'                   => 'nullable|exists:localidades,id',
            'activo'                         => 'nullable|boolean',
            'observaciones'                  => 'nullable|string',
            // Archivos de imagen (opcionales)
            'foto_perfil'                    => 'nullable|sometimes|image|mimes:jpeg,jpg,png,gif|max:5120',
            'ci_anverso'                     => 'nullable|sometimes|image|mimes:jpeg,jpg,png,gif|max:5120',
            'ci_reverso'                     => 'nullable|sometimes|image|mimes:jpeg,jpg,png,gif|max:5120',
            // Direcciones opcionales
            'direcciones'                    => 'nullable|array',
            'direcciones.*.direccion'        => 'required_with:direcciones|string|max:500',
            'direcciones.*.latitud'          => 'required_with:direcciones|numeric|between:-90,90',
            'direcciones.*.longitud'         => 'required_with:direcciones|numeric|between:-180,180',
            'direcciones.*.observaciones'    => 'nullable|string|max:1000',
            'direcciones.*.es_principal'     => 'nullable|boolean',
            'direcciones.*.activa'           => 'nullable|boolean',
            // Ventanas de entrega preferidas (opcional)
            'ventanas_entrega'               => 'nullable|array',
            'ventanas_entrega.*.dia_semana'  => 'required_with:ventanas_entrega|integer|between:0,6',
            'ventanas_entrega.*.hora_inicio' => 'required_with:ventanas_entrega|date_format:H:i',
            'ventanas_entrega.*.hora_fin'    => 'required_with:ventanas_entrega|date_format:H:i',
            'ventanas_entrega.*.activo'      => 'nullable|boolean',
            // Categorías del cliente (opcional)
            'categorias_ids'                 => 'nullable|array',
            'categorias_ids.*'               => 'integer|exists:categorias_cliente,id',
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
                    // Actualizar usuario existente
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
                            'password' => Hash::make($telefono),
                            'activo'   => true,
                        ];

                        if ($request->filled('email')) {
                            $userData['email']             = $request->email;
                            $userData['email_verified_at'] = now();
                        }

                        $user = User::create($userData);
                        $user->assignRole('Cliente');
                        $data['user_id'] = $user->id;
                    }
                }
            }

            // Procesar archivos de imagen (tanto para web como API)
            $updates = [];
            if ($request->hasFile('foto_perfil') && $request->file('foto_perfil')->isValid()) {
                if ($cliente->foto_perfil) {
                    Storage::disk('public')->delete($cliente->foto_perfil);
                }
                $folderName             = $this->generateClientFolderName($cliente);
                $path                   = $request->file('foto_perfil')->store($folderName, 'public');
                $data['foto_perfil']    = $path;
                $updates['foto_perfil'] = $path;
            }
            if ($request->hasFile('ci_anverso') && $request->file('ci_anverso')->isValid()) {
                if ($cliente->ci_anverso) {
                    Storage::disk('public')->delete($cliente->ci_anverso);
                }
                $folderName            = $this->generateClientFolderName($cliente);
                $path                  = $request->file('ci_anverso')->store($folderName, 'public');
                $data['ci_anverso']    = $path;
                $updates['ci_anverso'] = $path;
            }
            if ($request->hasFile('ci_reverso') && $request->file('ci_reverso')->isValid()) {
                if ($cliente->ci_reverso) {
                    Storage::disk('public')->delete($cliente->ci_reverso);
                }
                $folderName            = $this->generateClientFolderName($cliente);
                $path                  = $request->file('ci_reverso')->store($folderName, 'public');
                $data['ci_reverso']    = $path;
                $updates['ci_reverso'] = $path;
            }

            // Actualizar el cliente
            $cliente->update($data);
            $cliente->refresh();

            // Sincronizar direcciones si vienen en la petición
            if ($request->has('direcciones')) {
                // Eliminar direcciones existentes
                $cliente->direcciones()->delete();

                // Crear nuevas direcciones
                if (is_array($data['direcciones']) && count($data['direcciones']) > 0) {
                    foreach ($data['direcciones'] as $direccionData) {
                        $direccionData['activa'] = $direccionData['activa'] ?? true;
                        $cliente->direcciones()->create($direccionData);
                    }
                }
            }

            // Sincronizar ventanas de entrega y categorías para API
            if ($this->isApiRequest()) {
                $this->syncVentanasEntrega($cliente, $request->has('ventanas_entrega') ? (array) $request->input('ventanas_entrega', []) : null);
                $this->syncCategorias($cliente, $request->has('categorias_ids') ? (array) $request->input('categorias_ids') : null);
            }

            // Preparar respuesta según el tipo de request
            if ($this->isApiRequest()) {
                $responseData = [
                    'cliente' => $cliente->fresh(['direcciones', 'localidad', 'user', 'ventanasEntrega', 'categorias']),
                ];
                if ($user) {
                    $responseData['usuario'] = $user;
                }
                return $this->resourceResponse($responseData, 'Cliente actualizado exitosamente');
            } else {
                return $this->resourceResponse(
                    $cliente->load('localidad'),
                    'Cliente actualizado exitosamente',
                    'clientes.index'
                );
            }

        } catch (\Exception $e) {
            return $this->handleException($e, 'actualizar cliente');
        }
    }

    public function destroy(ClienteModel $cliente)
    {
        try {
            // Verificar si tiene cuentas por cobrar pendientes
            $tieneCuentasPendientes = $cliente->cuentasPorCobrar()->where('saldo_pendiente', '>', 0)->exists();
            if ($tieneCuentasPendientes) {
                return $this->errorResponse('No se puede eliminar un cliente con cuentas por cobrar pendientes', null, null, [], 400);
            }

            // Verificar si tiene ventas registradas
            $tieneVentas = $cliente->ventas()->exists();
            if ($tieneVentas) {
                // Solo desactivar para API, mostrar error para web
                if ($this->isApiRequest()) {
                    $cliente->update(['activo' => false]);
                    return $this->deleteResponse('Cliente desactivado (tiene historial de ventas)');
                } else {
                    return $this->errorResponse('No se puede eliminar el cliente porque tiene ventas registradas');
                }
            }

            // Eliminar completamente
            $cliente->delete();

            return $this->deleteResponse(
                'Cliente eliminado exitosamente',
                $this->isApiRequest() ? null : 'clientes.index'
            );

        } catch (\Exception $e) {
            return $this->handleException($e, 'eliminar cliente');
        }
    }

    // ================================
    // MÉTODOS API
    // ================================

    /**
     * API: Mostrar cliente específico
     */
    public function showApi(ClienteModel $cliente): JsonResponse
    {
        $cliente->load([
            'user',
            'direcciones',
            'localidad',
            'categorias',
            'ventanasEntrega',
            'cuentasPorCobrar' => function ($query) {
                $query->where('saldo_pendiente', '>', 0)->orderByDesc('fecha_vencimiento');
            },
        ]);

        return ApiResponse::success($cliente);
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

        // Obtener el ID del usuario autenticado que está creando el cliente
        $usuarioCreacionId = Auth::id();

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
            'user_id'             => $user ? $user->id : null,
            'nombre'              => $data['nombre'],
            'razon_social'        => $data['razon_social'] ?? null,
            'nit'                 => $data['nit'] ?? null,
            'email'               => $data['email'] ?? null,
            'telefono'            => $data['telefono'] ?? null,
            'genero'              => $data['genero'] ?? null,
            'limite_credito'      => $data['limite_credito'] ?? 0,
            'localidad_id'        => $data['localidad_id'] ?? null,
            'activo'              => $data['activo'] ?? true,
            'fecha_registro'      => now(),
            'usuario_creacion_id' => $usuarioCreacionId,
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
            if ($request->hasFile('foto_perfil') && $request->file('foto_perfil')->isValid()) {
                $folderName             = $this->generateClientFolderName($cliente);
                $updates['foto_perfil'] = $request->file('foto_perfil')->store($folderName, 'public');
            }
            if ($request->hasFile('ci_anverso') && $request->file('ci_anverso')->isValid()) {
                $folderName            = $this->generateClientFolderName($cliente);
                $updates['ci_anverso'] = $request->file('ci_anverso')->store($folderName, 'public');
            }
            if ($request->hasFile('ci_reverso') && $request->file('ci_reverso')->isValid()) {
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
     * API: Buscar clientes para autocompletado
     */
    public function buscarApi(Request $request): JsonResponse
    {
        $q      = $request->string('q');
        $limite = $request->integer('limite', 10);

        if (! $q || strlen($q) < 2) {
            return ApiResponse::success([]);
        }

        // Convertir búsqueda a minúsculas para hacer búsqueda case-insensitive
        $searchLower = strtolower($q);
        $clientes = ClienteModel::select(['id', 'nombre', 'razon_social', 'nit', 'telefono', 'email'])
            ->where('activo', true)
            ->where(function ($query) use ($searchLower) {
                $query->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(razon_social) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(nit) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(telefono) like ?', ["%$searchLower%"]);
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

        // Verificar si el usernick ya existe y agregar número si es necesario
        while (User::where('usernick', $usernick)->exists()) {
            $usernick = $baseUsernick;
        }

        return $usernick;
    }

    /**
     * Permite a un cliente cambiar su usernick y contraseña
     */
    public function cambiarCredenciales(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $request->validate([
            'usernick'        => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password_actual' => ['required', 'string'],
            'password_nueva'  => ['required', 'string', 'min:8'],
            'email'           => ['nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        // Verificar que el usuario sea un cliente
        if (! $user || ! $user->esCliente()) {
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
        if ($user) {
            $user->update($userUpdates);
        }

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

    /**
     * Sincroniza las ventanas de entrega del cliente.
     * Si se envía el arreglo, reemplaza las existentes por simplicidad.
     */
    private function syncVentanasEntrega(ClienteModel $cliente, ?array $ventanas): void
    {
        if ($ventanas === null) {
            return;
        }

        // Reemplazar existentes
        $cliente->ventanasEntrega()->delete();

        foreach ($ventanas as $ventana) {
            if (isset($ventana['hora_inicio'], $ventana['hora_fin']) && $ventana['hora_inicio'] >= $ventana['hora_fin']) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'ventanas_entrega' => ['La hora de inicio debe ser menor a la hora de fin.'],
                ]);
            }
            if (! isset($ventana['dia_semana'])) {
                continue;
            }

            $cliente->ventanasEntrega()->create([
                'dia_semana'  => (int) $ventana['dia_semana'],
                'hora_inicio' => $ventana['hora_inicio'],
                'hora_fin'    => $ventana['hora_fin'],
                'activo'      => isset($ventana['activo']) ? (bool) $ventana['activo'] : true,
            ]);
        }
    }

    /**
     * Sincroniza las categorías del cliente si se envían.
     */
    private function syncCategorias(ClienteModel $cliente, ?array $categoriasIds): void
    {
        if ($categoriasIds === null) {
            return;
        }

        $cliente->categorias()->sync($categoriasIds);
    }

    /**
     * Crea un usuario asociado al cliente
     */
    private function createUserForCliente(ClienteModel $cliente, string $password): void
    {
        $usernick = $this->generarUsernickUnico($cliente->telefono);

        $userData = [
            'name'     => $cliente->nombre,
            'usernick' => $usernick,
            'password' => Hash::make($password),
            'activo'   => true,
        ];

        if ($cliente->email) {
            $userData['email']             = $cliente->email;
            $userData['email_verified_at'] = now();
        }

        $user = User::create($userData);
        $user->assignRole('Cliente');

        // Actualizar el cliente con el user_id
        $cliente->update(['user_id' => $user->id]);
    }

    /**
     * Aplica filtros a la query de clientes
     */
    private function applyFilters($query, Request $request): void
    {
        // Filtro de búsqueda (case-insensitive)
        if ($request->filled('q')) {
            $searchLower = strtolower($request->string('q'));
            $query->where(function ($subQuery) use ($searchLower) {
                $subQuery->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(razon_social) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(nit) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(telefono) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(codigo_cliente) like ?', ["%$searchLower%"]);
            });
        }

        // Filtro de estado activo
        if ($request->has('activo') && $request->activo !== 'all') {
            $query->where('activo', $request->boolean('activo'));
        }

        // Filtro de localidad
        if ($request->filled('localidad_id')) {
            $query->where('localidad_id', $request->integer('localidad_id'));
        }

        // Ordenamiento
        $orderBy  = $request->string('order_by', 'id');
        $orderDir = $request->string('order_dir', 'desc');

        $allowedOrderBy = ['id', 'nombre', 'fecha_registro'];
        if (in_array($orderBy, $allowedOrderBy)) {
            $query->orderBy($orderBy, in_array($orderDir, ['asc', 'desc']) ? $orderDir : 'desc');
        }
    }
}
