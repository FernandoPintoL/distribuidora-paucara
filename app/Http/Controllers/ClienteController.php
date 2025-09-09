<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    public function index(Request $request): Response
    {
        $q = (string) $request->string('q');

        $activoParam = $request->input('activo');
        $activo = null;
        if ($activoParam !== null && $activoParam !== '' && $activoParam !== 'all') {
            if ($activoParam === '1' || $activoParam === 1 || $activoParam === true || $activoParam === 'true') {
                $activo = true;
            } elseif ($activoParam === '0' || $activoParam === 0 || $activoParam === false || $activoParam === 'false') {
                $activo = false;
            }
        }

        $allowedOrderBy = ['id', 'nombre', 'fecha_registro'];
        $rawOrderBy = (string) $request->string('order_by');
        $orderBy = in_array($rawOrderBy, $allowedOrderBy, true) ? $rawOrderBy : 'id';

        $rawOrderDir = strtolower((string) $request->string('order_dir'));
        $orderDir = in_array($rawOrderDir, ['asc', 'desc'], true) ? $rawOrderDir : 'desc';

        $items = Cliente::query()
            ->when($q, function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('nombre', 'ilike', "%$q%")
                        ->orWhere('razon_social', 'ilike', "%$q%")
                        ->orWhere('nit', 'ilike', "%$q%")
                        ->orWhere('telefono', 'ilike', "%$q%");
                });
            })
            ->when($activo !== null, function ($query) use ($activo) {
                $query->where('activo', $activo);
            })
            ->orderBy($orderBy, $orderDir)
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('clientes/index', [
            'clientes' => $items,
            'filters' => [
                'q' => $q,
                'activo' => $activo !== null ? ($activo ? '1' : '0') : null,
                'order_by' => $orderBy,
                'order_dir' => $orderDir,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('clientes/form', [
            'cliente' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'activo' => ['boolean'],
            'foto_perfil' => ['nullable', 'image', 'max:5120'],
            'ci_anverso' => ['nullable', 'image', 'max:5120'],
            'ci_reverso' => ['nullable', 'image', 'max:5120'],
        ]);
        $data['activo'] = $data['activo'] ?? true;

        if ($request->hasFile('foto_perfil')) {
            $data['foto_perfil'] = $request->file('foto_perfil')->store('clientes', 'public');
        }
        if ($request->hasFile('ci_anverso')) {
            $data['ci_anverso'] = $request->file('ci_anverso')->store('clientes', 'public');
        }
        if ($request->hasFile('ci_reverso')) {
            $data['ci_reverso'] = $request->file('ci_reverso')->store('clientes', 'public');
        }

        Cliente::create($data);

        return redirect()->route('clientes.index')->with('success', 'Cliente creado');
    }

    public function edit(Cliente $cliente): Response
    {
        return Inertia::render('clientes/form', [
            'cliente' => $cliente,
        ]);
    }

    public function update(Request $request, Cliente $cliente): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'activo' => ['boolean'],
            'foto_perfil' => ['nullable', 'image', 'max:5120'],
            'ci_anverso' => ['nullable', 'image', 'max:5120'],
            'ci_reverso' => ['nullable', 'image', 'max:5120'],
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

        return redirect()->route('clientes.index')->with('success', 'Cliente actualizado');
    }

    public function destroy(Cliente $cliente): RedirectResponse
    {
        $cliente->delete();

        return redirect()->route('clientes.index')->with('success', 'Cliente eliminado');
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
        $q = $request->string('q');
        $activo = $request->boolean('activo', true);

        $clientes = Cliente::query()
            ->when($q, function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('nombre', 'ilike', "%$q%")
                        ->orWhere('razon_social', 'ilike', "%$q%")
                        ->orWhere('nit', 'ilike', "%$q%")
                        ->orWhere('telefono', 'ilike', "%$q%")
                        ->orWhere('email', 'ilike', "%$q%");
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
    public function showApi(Cliente $cliente): JsonResponse
    {
        $cliente->load(['direcciones', 'cuentasPorCobrar' => function ($query) {
            $query->where('saldo', '>', 0)->orderByDesc('fecha_vencimiento');
        }]);

        return ApiResponse::success($cliente);
    }

    /**
     * API: Crear cliente
     */
    public function storeApi(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'whatsapp' => ['nullable', 'string', 'max:20'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'genero' => ['nullable', 'in:M,F,O'],
            'limite_credito' => ['nullable', 'numeric', 'min:0'],
            'activo' => ['boolean'],
            'observaciones' => ['nullable', 'string'],
            // Direcciones opcionales
            'direcciones' => ['nullable', 'array'],
            'direcciones.*.direccion' => ['required_with:direcciones', 'string', 'max:500'],
            'direcciones.*.ciudad' => ['nullable', 'string', 'max:100'],
            'direcciones.*.departamento' => ['nullable', 'string', 'max:100'],
            'direcciones.*.codigo_postal' => ['nullable', 'string', 'max:20'],
            'direcciones.*.es_principal' => ['boolean'],
        ]);

        try {
            $cliente = Cliente::create([
                'nombre' => $data['nombre'],
                'razon_social' => $data['razon_social'] ?? null,
                'nit' => $data['nit'] ?? null,
                'email' => $data['email'] ?? null,
                'telefono' => $data['telefono'] ?? null,
                'whatsapp' => $data['whatsapp'] ?? null,
                'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                'genero' => $data['genero'] ?? null,
                'limite_credito' => $data['limite_credito'] ?? 0,
                'activo' => $data['activo'] ?? true,
                'observaciones' => $data['observaciones'] ?? null,
                'fecha_registro' => now(),
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
    public function updateApi(Request $request, Cliente $cliente): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:255'],
            'razon_social' => ['nullable', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'whatsapp' => ['nullable', 'string', 'max:20'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'genero' => ['nullable', 'in:M,F,O'],
            'limite_credito' => ['nullable', 'numeric', 'min:0'],
            'activo' => ['boolean'],
            'observaciones' => ['nullable', 'string'],
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
    public function destroyApi(Cliente $cliente): JsonResponse
    {
        try {
            // Verificar si tiene cuentas por cobrar pendientes
            $tieneCuentasPendientes = $cliente->cuentasPorCobrar()->where('saldo', '>', 0)->exists();
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
        $q = $request->string('q');
        $limite = $request->integer('limite', 10);

        if (!$q || strlen($q) < 2) {
            return ApiResponse::success([]);
        }

        $clientes = Cliente::select(['id', 'nombre', 'razon_social', 'nit', 'telefono', 'email'])
            ->where('activo', true)
            ->where(function ($query) use ($q) {
                $query->where('nombre', 'ilike', "%$q%")
                      ->orWhere('razon_social', 'ilike', "%$q%")
                      ->orWhere('nit', 'ilike', "%$q%")
                      ->orWhere('telefono', 'ilike', "%$q%");
            })
            ->limit($limite)
            ->get();

        return ApiResponse::success($clientes);
    }

    /**
     * API: Obtener saldo de cuentas por cobrar de un cliente
     */
    public function saldoCuentasPorCobrar(Cliente $cliente): JsonResponse
    {
        $cuentas = $cliente->cuentasPorCobrar()
            ->where('saldo', '>', 0)
            ->orderByDesc('fecha_vencimiento')
            ->get(['id', 'numero_documento', 'monto_total', 'saldo', 'fecha_vencimiento', 'dias_vencimiento']);

        $saldoTotal = $cuentas->sum('saldo');
        $cuentasVencidas = $cuentas->where('dias_vencimiento', '>', 0)->count();

        return ApiResponse::success([
            'cliente' => [
                'id' => $cliente->id,
                'nombre' => $cliente->nombre,
                'limite_credito' => $cliente->limite_credito,
            ],
            'saldo_total' => $saldoTotal,
            'cuentas_vencidas' => $cuentasVencidas,
            'cuentas_detalle' => $cuentas
        ]);
    }

    /**
     * API: Historial de compras del cliente
     */
    public function historialVentas(Cliente $cliente, Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 10);
        $fechaInicio = $request->date('fecha_inicio');
        $fechaFin = $request->date('fecha_fin');

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
