<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Cliente as ClienteModel;
use App\Models\Localidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    use \App\Http\Controllers\Traits\ApiInertiaResponseTrait;

    public function index(Request $request): Response | \Symfony\Component\HttpFoundation\Response
    {
        $q = (string) $request->string('q');

        $localidadId = $request->input('localidad_id');

        $activoParam = $request->input('activo');
        $activo      = null;
        if ($activoParam !== null && $activoParam !== '' && $activoParam !== 'all') {
            if ($activoParam === '1' || $activoParam === 1 || $activoParam === true || $activoParam === 'true') {
                $activo = true;
            } elseif ($activoParam === '0' || $activoParam === 0 || $activoParam === false || $activoParam === 'false') {
                $activo = false;
            }
        }
        $allowedOrderBy = ['id', 'nombre', 'fecha_registro'];
        $rawOrderBy     = (string) $request->string('order_by');
        $orderBy        = in_array($rawOrderBy, $allowedOrderBy, true) ? $rawOrderBy : 'id';

        $rawOrderDir = strtolower((string) $request->string('order_dir'));
        $orderDir    = in_array($rawOrderDir, ['asc', 'desc'], true) ? $rawOrderDir : 'desc';

        $items = ClienteModel::query()
            ->when($q, function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('nombre', 'like', "%$q%")
                        ->orWhere('razon_social', 'like', "%$q%")
                        ->orWhere('nit', 'like', "%$q%")
                        ->orWhere('telefono', 'like', "%$q%");
                });
            })
            ->when($activo !== null, function ($query) use ($activo) {
                $query->where('activo', $activo);
            })
            ->when($localidadId && is_numeric($localidadId), function ($query) use ($localidadId) {
                $query->where('localidad_id', $localidadId);
            })
            ->orderBy($orderBy, $orderDir)
            ->paginate(10)
            ->withQueryString();

        if ($this->isApiRequest($request)) {
            return $this->apiResponse($items->toArray(), 'Clientes obtenidos exitosamente');
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
            'nombre'       => ['required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit'          => ['required', 'string', 'max:255'],
            'telefono'     => ['nullable', 'string', 'max:100'],
            'email'        => ['nullable', 'email', 'max:255'],
            'localidad_id' => ['nullable', 'exists:localidades,id'],
            'latitud'      => ['nullable', 'numeric', 'between:-90,90'],
            'longitud'     => ['nullable', 'numeric', 'between:-180,180'],
            'activo'       => ['boolean'],
        ];

        // Solo validar archivos si no es una petición de modal
        if (! $isModalRequest) {
            $validationRules = array_merge($validationRules, [
                'foto_perfil' => ['nullable', 'image', 'max:5120'],
                'ci_anverso'  => ['nullable', 'image', 'max:5120'],
                'ci_reverso'  => ['nullable', 'image', 'max:5120'],
            ]);
        }

        $data           = $request->validate($validationRules);
        $data['activo'] = $data['activo'] ?? true;

        // Procesar archivos solo si no es una petición de modal
        if (! $isModalRequest) {
            if ($request->hasFile('foto_perfil')) {
                $data['foto_perfil'] = $request->file('foto_perfil')->store('clientes', 'public');
            }
            if ($request->hasFile('ci_anverso')) {
                $data['ci_anverso'] = $request->file('ci_anverso')->store('clientes', 'public');
            }
            if ($request->hasFile('ci_reverso')) {
                $data['ci_reverso'] = $request->file('ci_reverso')->store('clientes', 'public');
            }
        }

        return $this->handleCrudOperation(
            $request,
            function () use ($data) {
                $cliente = ClienteModel::create($data);

                return ['cliente' => $cliente];
            },
            'Cliente creado exitosamente',
            'clientes.index'
        );
    }

    public function edit(ClienteModel $cliente): Response
    {
        return Inertia::render('clientes/form', [
            'cliente'     => $cliente,
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
                $data = $request->validate([
                    'nombre'       => ['required', 'string', 'max:255'],
                    'razon_social' => ['nullable', 'string', 'max:255'],
                    'nit'          => ['nullable', 'string', 'max:255'],
                    'telefono'     => ['nullable', 'string', 'max:100'],
                    'email'        => ['nullable', 'email', 'max:255'],
                    'localidad_id' => ['nullable', 'exists:localidades,id'],
                    'latitud'      => ['nullable', 'numeric', 'between:-90,90'],
                    'longitud'     => ['nullable', 'numeric', 'between:-180,180'],
                    'activo'       => ['boolean'],
                    'foto_perfil'  => ['nullable', 'image', 'max:5120'],
                    'ci_anverso'   => ['nullable', 'image', 'max:5120'],
                    'ci_reverso'   => ['nullable', 'image', 'max:5120'],
                ]);

                $updates = $data;
                if ($request->hasFile('foto_perfil')) {
                    $updates['foto_perfil'] = $request->file('foto_perfil')->store('clientes', 'public');
                }
                if ($request->hasFile('ci_anverso')) {
                    $updates['ci_anverso'] = $request->file('ci_anverso')->store('clientes', 'public');
                }
                if ($request->hasFile('ci_reverso')) {
                    $updates['ci_reverso'] = $request->file('ci_reverso')->store('clientes', 'public');
                }

                $cliente->update($updates);

                return ['cliente' => $cliente->fresh()];
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
        $perPage = $request->integer('per_page', 20);
        $q       = $request->string('q');
        $activo  = $request->boolean('activo', true);

        $clientes = ClienteModel::query()
            ->when($q, function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('nombre', 'like', "%$q%")
                        ->orWhere('razon_social', 'like', "%$q%")
                        ->orWhere('nit', 'like', "%$q%")
                        ->orWhere('telefono', 'like', "%$q%")
                        ->orWhere('email', 'like', "%$q%");
                });
            })
            ->where('activo', $activo)
            ->orderBy('nombre')
            ->paginate($perPage);

        return ApiResponse::success($clientes);
    }

    /**
     * API: Mostrar cliente específico
     */
    public function showApi(ClienteModel $cliente): JsonResponse
    {
        $cliente->load(['direcciones', 'cuentasPorCobrar' => function ($query) {
            $query->where('saldo_pendiente', '>', 0)->orderByDesc('fecha_vencimiento');
        }]);

        return ApiResponse::success($cliente);
    }

    /**
     * API: Crear cliente
     */
    public function storeApi(Request $request): JsonResponse
    {
        $data = $request->validate([
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
            // Direcciones opcionales
            'direcciones'                 => ['nullable', 'array'],
            'direcciones.*.direccion'     => ['required_with:direcciones', 'string', 'max:500'],
            'direcciones.*.ciudad'        => ['nullable', 'string', 'max:100'],
            'direcciones.*.departamento'  => ['nullable', 'string', 'max:100'],
            'direcciones.*.codigo_postal' => ['nullable', 'string', 'max:20'],
            'direcciones.*.es_principal'  => ['boolean'],
        ]);

        try {
            $cliente = ClienteModel::create([
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

            // Crear direcciones si se proporcionaron
            if (isset($data['direcciones']) && is_array($data['direcciones'])) {
                foreach ($data['direcciones'] as $direccionData) {
                    $cliente->direcciones()->create($direccionData);
                }
            }

            return ApiResponse::success(
                $cliente->load('direcciones'),
                'Cliente creado exitosamente',
                201
            );

        } catch (\Exception $e) {
            return ApiResponse::error('Error al crear cliente: ' . $e->getMessage(), 500);
        }
    }

    /**
     * API: Actualizar cliente
     */
    public function updateApi(Request $request, ClienteModel $cliente): JsonResponse
    {
        $data = $request->validate([
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
        ]);

        try {
            $cliente->update($data);

            return ApiResponse::success(
                $cliente->fresh('direcciones'),
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
}
