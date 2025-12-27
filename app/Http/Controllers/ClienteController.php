<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\ChangeClienteCredentialsRequest;
use App\Http\Requests\StoreClienteRequest;
use App\Http\Requests\UpdateClienteRequest;
use App\Http\Traits\ApiInertiaUnifiedResponse;
use App\Models\Cliente as ClienteModel;
use App\Models\Localidad;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ClienteController extends Controller
{
    use ApiInertiaUnifiedResponse;

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
            ->forCurrentUser()  // ✅ NUEVO: Filtrar por usuario actual (Preventista ve solo sus clientes)
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
            // ✅ Autorizar: Solo roles permitidos pueden ver listado de clientes
            $this->authorize('viewAny', ClienteModel::class);

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

            // Agregar URLs de fotos de perfil para el listado
            $clientes->getCollection()->transform(function ($cliente) {
                $cliente->foto_perfil_url = $cliente->foto_perfil ? Storage::url($cliente->foto_perfil) : null;
                return $cliente;
            });

            // 🔍 DEBUG: Log para ver qué datos se están enviando
            Log::info('🔍 DEBUG CLIENTES INDEX', [
                'is_api_request' => $this->isApiRequest(),
                'total_clientes' => $clientes->total(),
                'primer_cliente' => $clientes->first() ? [
                    'id'                => $clientes->first()->id,
                    'nombre'            => $clientes->first()->nombre,
                    'localidad_id'      => $clientes->first()->localidad_id,
                    'localidad_cargada' => $clientes->first()->relationLoaded('localidad'),
                    'localidad_data'    => $clientes->first()->localidad ? [
                        'id'     => $clientes->first()->localidad->id,
                        'nombre' => $clientes->first()->localidad->nombre,
                        'codigo' => $clientes->first()->localidad->codigo,
                    ] : null,
                    'toArray'           => $clientes->first()->toArray(),
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
            // ✅ Autorizar: Solo roles que pueden crear clientes
            $this->authorize('create', ClienteModel::class);

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

    public function store(StoreClienteRequest $request)
    {
        // ✅ Autorizar: Solo roles que pueden crear clientes
        $this->authorize('create', ClienteModel::class);

        try {
            // Data ya validado por StoreClienteRequest
            $data = $request->validated();

            // Determinar si se deben manejar direcciones
            $handleDirecciones = $this->isApiRequest() || $request->has('direcciones');

            // Usar el método compartido para crear el cliente
            // ✅ FIX: Always process files ($processFiles = true) for both API and web requests
            $cliente = $this->handleClientCreation($request, $data, false, $handleDirecciones, true);

            // Guardar ventanas de entrega (tanto para web como API)
            $this->syncVentanasEntrega($cliente, isset($data['ventanas_entrega']) ? (array) $data['ventanas_entrega'] : null);

            // Guardar categorías (tanto para web como API)
            $this->syncCategorias($cliente, isset($data['categorias_ids']) ? (array) $data['categorias_ids'] : null);

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
            // ✅ Autorizar: Solo roles que pueden editar este cliente
            $this->authorize('update', $cliente);

            return $this->dataResponse('clientes/form', [
                'cliente'     => $cliente->load(['localidad', 'direcciones', 'ventanasEntrega']),
                'localidades' => Localidad::where('activo', true)
                    ->orderBy('nombre')
                    ->get(['id', 'nombre', 'codigo']),
            ]);

        } catch (\Exception $e) {
            return $this->handleException($e, 'cargar formulario de edición');
        }
    }

    public function update(UpdateClienteRequest $request, ClienteModel $cliente)
    {
        // ✅ Autorizar: Solo roles que pueden editar este cliente
        $this->authorize('update', $cliente);

        // Data already validated and prepared by UpdateClienteRequest
        $data = $request->validated();

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

            // Sincronizar ventanas de entrega (tanto para web como API)
            $this->syncVentanasEntrega($cliente, $request->has('ventanas_entrega') ? (array) $request->input('ventanas_entrega', []) : null);

            // Sincronizar categorías (tanto para web como API)
            $this->syncCategorias($cliente, $request->has('categorias_ids') ? (array) $request->input('categorias_ids') : null);

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
            // ✅ Autorizar: Solo admins y managers pueden eliminar clientes
            $this->authorize('delete', $cliente);

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
     * API: Mostrar cliente específico con TODAS sus relaciones
     * Endpoint: GET /api/clientes/{id}
     * Retorna: Cliente completo con direcciones, categorías, ventanas de entrega, etc.
     */
    public function showApi(ClienteModel $cliente): JsonResponse
    {
        // ✅ Autorizar: Solo roles que pueden ver este cliente
        $this->authorize('view', $cliente);

        // Cargar TODAS las relaciones del cliente de una sola vez
        $cliente->load([
            'user'             => function ($query) {
                $query->select('id', 'name', 'email', 'usernick', 'activo');
            },
            'direcciones',
            'localidad',
            'categorias'       => function ($query) {
                $query->select('categorias_cliente.id', 'categorias_cliente.clave', 'categorias_cliente.nombre', 'categorias_cliente.descripcion', 'categorias_cliente.activo');
            },
            'ventanasEntrega'  => function ($query) {
                $query->select('ventanas_entrega_cliente.id', 'ventanas_entrega_cliente.cliente_id', 'ventanas_entrega_cliente.dia_semana', 'ventanas_entrega_cliente.hora_inicio', 'ventanas_entrega_cliente.hora_fin', 'ventanas_entrega_cliente.activo')
                    ->orderBy('dia_semana');
            },
            'cuentasPorCobrar' => function ($query) {
                $query->where('saldo_pendiente', '>', 0)->orderByDesc('fecha_vencimiento');
            },
        ]);

        Log::info('📡 API: Cliente cargado completamente', [
            'cliente_id'        => $cliente->id,
            'nombre'            => $cliente->nombre,
            'categorias_count'  => $cliente->categorias->count(),
            'ventanas_count'    => $cliente->ventanasEntrega->count(),
            'direcciones_count' => $cliente->direcciones->count(),
        ]);

        return ApiResponse::success($cliente);
    }

    /**
     * API: Obtener el perfil del cliente autenticado (su propio cliente)
     * Endpoint: GET /api/clientes/mi-perfil
     * No requiere pasar ID, acceso directo al cliente vinculado al usuario actual
     */
    public function miPerfil(): JsonResponse
    {
        $user = Auth::user();

        // Si no está autenticado, retornar error
        if (! $user) {
            return ApiResponse::error('No autenticado', 401);
        }

        // Si es Cliente, obtener su cliente vinculado
        if ($user->hasRole('Cliente')) {
            $cliente = $user->cliente;

            if (! $cliente) {
                return ApiResponse::error('El usuario no tiene un cliente vinculado', 404);
            }

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

        // Si es un rol administrativo/vendedor, no pueden acceder a este endpoint
        return ApiResponse::error('Solo los clientes pueden acceder a su perfil desde este endpoint', 403);
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

        // ✅ NUEVO: Obtener el preventista (empleado) asociado al usuario autenticado
        $preventista   = Auth::user()?->empleado;
        $preventistaId = $preventista?->id;

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
            'preventista_id'      => $preventistaId, // ✅ NUEVO
            'estado'              => 'prospecto',    // ✅ NUEVO
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

            Log::info('📸 Procesando archivos del cliente', [
                'cliente_id'   => $cliente->id,
                'has_foto'     => $request->hasFile('foto_perfil'),
                'has_ci_anverso' => $request->hasFile('ci_anverso'),
                'has_ci_reverso' => $request->hasFile('ci_reverso'),
            ]);

            if ($request->hasFile('foto_perfil') && $request->file('foto_perfil')->isValid()) {
                $folderName             = $this->generateClientFolderName($cliente);
                $updates['foto_perfil'] = $request->file('foto_perfil')->store($folderName, 'public');
                Log::info('✅ Foto de perfil guardada', ['path' => $updates['foto_perfil']]);
            }
            if ($request->hasFile('ci_anverso') && $request->file('ci_anverso')->isValid()) {
                $folderName            = $this->generateClientFolderName($cliente);
                $updates['ci_anverso'] = $request->file('ci_anverso')->store($folderName, 'public');
                Log::info('✅ CI anverso guardado', ['path' => $updates['ci_anverso']]);
            }
            if ($request->hasFile('ci_reverso') && $request->file('ci_reverso')->isValid()) {
                $folderName            = $this->generateClientFolderName($cliente);
                $updates['ci_reverso'] = $request->file('ci_reverso')->store($folderName, 'public');
                Log::info('✅ CI reverso guardado', ['path' => $updates['ci_reverso']]);
            }

            // Actualizar cliente con las rutas de las imágenes si se subieron
            if (! empty($updates)) {
                Log::info('💾 Actualizando cliente con archivos', ['updates' => array_keys($updates)]);
                $cliente->update($updates);
                $cliente->refresh(); // Recargar el modelo con los nuevos datos
            }
        } else {
            Log::warning('⚠️ Procesamiento de archivos deshabilitado', ['cliente_id' => $cliente->id]);
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
        $clientes    = ClienteModel::forCurrentUser()  // ✅ NUEVO: Filtrar por usuario actual
            ->select(['id', 'nombre', 'razon_social', 'nit', 'telefono', 'email'])
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
        // ✅ Autorizar: Solo el Preventista del cliente o Admin pueden ver el saldo
        $this->authorize('view', $cliente);

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
        // ✅ Autorizar: Solo el Preventista del cliente o Admin pueden ver el historial
        $this->authorize('view', $cliente);

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
    public function cambiarCredenciales(ChangeClienteCredentialsRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        // Data already validated by ChangeClienteCredentialsRequest
        $validated = $request->validated();

        // Preparar datos para actualizar
        $userUpdates = [
            'usernick' => $validated['usernick'],
            'password' => Hash::make($validated['password_nueva']),
        ];

        // Agregar email solo si se proporciona
        if ($request->filled('email')) {
            $userUpdates['email']             = $validated['email'];
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
