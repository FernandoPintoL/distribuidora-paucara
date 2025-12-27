<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Proforma;
use App\Events\ProformaCreada;
use App\Events\ProformaAprobada;
use App\Events\ProformaRechazada;
use App\Events\ProformaConvertida;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class ApiProformaController extends Controller
{
    public function store(Request $request)
    {
        // Primero normalizar los campos del Flutter ANTES de validar
        $requestData = $request->all();

        // Si viene fecha_programada (timestamp ISO8601), convertir a fecha
        if ($request->filled('fecha_programada') && !$request->filled('fecha_entrega_solicitada')) {
            try {
                $requestData['fecha_entrega_solicitada'] = \Carbon\Carbon::parse($request->fecha_programada)->format('Y-m-d');
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Formato de fecha_programada inválido',
                ], 422);
            }
        }

        // Si viene hora_inicio_preferida, usar como hora_entrega_solicitada
        if ($request->filled('hora_inicio_preferida') && !$request->filled('hora_entrega_solicitada')) {
            $requestData['hora_entrega_solicitada'] = $request->hora_inicio_preferida;
        }

        // Si viene hora_fin_preferida, usar como hora_entrega_solicitada_fin
        if ($request->filled('hora_fin_preferida') && !$request->filled('hora_entrega_solicitada_fin')) {
            $requestData['hora_entrega_solicitada_fin'] = $request->hora_fin_preferida;
        }

        $validator = Validator::make($requestData, [
            'cliente_id' => 'required|exists:clientes,id',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|exists:productos,id',
            'productos.*.cantidad' => 'required|numeric|min:1',
            // Solicitud de entrega del cliente (REQUERIDO)
            'fecha_entrega_solicitada' => 'required|date|after_or_equal:today',
            'hora_entrega_solicitada' => 'nullable|date_format:H:i',
            'hora_entrega_solicitada_fin' => 'nullable|date_format:H:i',
            // Dirección de entrega solicitada (REQUERIDO - debe venir desde Flutter)
            'direccion_entrega_solicitada_id' => 'required|exists:direcciones_cliente,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Usar datos normalizados
        $fechaEntrega = $requestData['fecha_entrega_solicitada'] ?? null;
        $horaEntrega = $requestData['hora_entrega_solicitada'] ?? null;
        $horaEntregaFin = $requestData['hora_entrega_solicitada_fin'] ?? null;

        // Validar que si se proporciona dirección, pertenece al cliente
        if ($request->filled('direccion_entrega_solicitada_id')) {
            $direccion = \App\Models\DireccionCliente::findOrFail($request->direccion_entrega_solicitada_id);
            if ($direccion->cliente_id !== $request->cliente_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'La dirección seleccionada no pertenece al cliente',
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Obtener el cliente (por cliente_id, no por usuario autenticado)
            $cliente = Cliente::findOrFail($request->cliente_id);

            // Obtener el usuario del cliente (user_id) para asociar como creador
            // IMPORTANTE: usuario_creador_id debe ser el user_id del cliente, NO el cliente_id
            $usuarioCreador = $cliente->user_id; // El usuario que representa al cliente

            // Calcular totales y verificar stock
            $subtotal = 0;
            $productosValidados = [];
            $stockInsuficiente = [];

            foreach ($requestData['productos'] as $item) {
                $producto = Producto::with('stock')->findOrFail($item['producto_id']);
                $cantidad = $item['cantidad'];

                // El precio viene desde el Flutter app
                $precio = $item['precio_unitario'] ?? 0;

                if ($precio <= 0) {
                    throw new \Exception("El producto {$producto->nombre} no tiene precio definido");
                }

                // Verificar disponibilidad de stock
                $stockDisponible = $producto->stock()->sum('cantidad_disponible');

                if ($stockDisponible < $cantidad) {
                    $stockInsuficiente[] = [
                        'producto' => $producto->nombre,
                        'requerido' => $cantidad,
                        'disponible' => $stockDisponible,
                        'faltante' => $cantidad - $stockDisponible,
                    ];
                }

                $subtotalItem = $cantidad * $precio;
                $subtotal += $subtotalItem;

                $productosValidados[] = [
                    'producto_id' => $producto->id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precio,
                    'subtotal' => $subtotalItem,
                ];
            }

            // Si hay productos con stock insuficiente, retornar error
            if (! empty($stockInsuficiente)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock insuficiente para algunos productos',
                    'productos_sin_stock' => $stockInsuficiente,
                ], 422);
            }

            // Calcular impuestos (13% IVA) - Por ahora no se suma al total
            $impuesto = $subtotal * 0.13;
            $total = $subtotal; // Sin impuestos por ahora

            // Crear proforma con solicitud de entrega del cliente
            $proforma = Proforma::create([
                'numero' => Proforma::generarNumeroProforma(),
                'fecha' => now(),
                'fecha_vencimiento' => now()->addDays(7),
                'cliente_id' => $requestData['cliente_id'],
                'estado' => Proforma::PENDIENTE,
                'canal_origen' => Proforma::CANAL_APP_EXTERNA,
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'moneda_id' => 1, // Bolivianos por defecto
                // Usuario creador: el usuario asociado al cliente
                // IMPORTANTE: esto es user_id, NO cliente_id
                'usuario_creador_id' => $usuarioCreador,
                // Solicitud de entrega del cliente (usa campos normalizados)
                'fecha_entrega_solicitada' => $fechaEntrega,
                'hora_entrega_solicitada' => $horaEntrega,
                'hora_entrega_solicitada_fin' => $horaEntregaFin,
                'direccion_entrega_solicitada_id' => $requestData['direccion_entrega_solicitada_id'],
            ]);

            // Crear detalles
            foreach ($productosValidados as $detalle) {
                $proforma->detalles()->create($detalle);
            }

            // ✅ RESERVAR STOCK AHORA que los detalles existen
            $reservaExitosa = $proforma->reservarStock();
            if (!$reservaExitosa) {
                \Log::warning('⚠️  No se pudieron reservar todos los productos para proforma ' . $proforma->numero);
            }

            // Cargar relaciones para respuesta
            $proforma->load(['detalles.producto', 'cliente', 'direccionSolicitada', 'direccionConfirmada']);

            DB::commit();

            // ✅ Emitir evento para notificaciones WebSocket
            event(new ProformaCreada($proforma));

            return response()->json([
                'success' => true,
                'message' => 'Proforma creada exitosamente. Será revisada por nuestro equipo.',
                'data' => [
                    'proforma' => $proforma,
                    'numero' => $proforma->numero,
                    'total' => $proforma->total,
                    'estado' => $proforma->estado,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error creando proforma',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Proforma $proforma)
    {
        // Verificar que la proforma pertenece al cliente autenticado
        if (Auth::user()->cliente_id && $proforma->cliente_id !== Auth::user()->cliente_id) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para ver esta proforma',
            ], 403);
        }

        $proforma->load(['detalles.producto', 'cliente', 'usuarioCreador', 'usuarioAprobador']);

        return response()->json([
            'success' => true,
            'data' => $proforma,
        ]);
    }

    /**
     * Listar proformas (método inteligente según rol del usuario)
     *
     * Este método unificado reemplaza:
     * - index() original
     * - listarParaDashboard()
     * - obtenerHistorialPedidos()
     *
     * Filtra automáticamente según el rol:
     * - Cliente: Solo sus proformas
     * - Preventista: Solo las que él creó
     * - Logística/Admin/Cajero: Todas las proformas
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // ========================================
        // VALIDACIÓN MEJORADA DE AUTENTICACIÓN
        // ========================================
        if (!$user) {
            \Log::warning('API Index Proformas: No authenticated user found', [
                'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
                'auth_header' => $request->header('Authorization') ? 'present' : 'missing',
                'user_agent' => $request->userAgent(),
                'client_ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No autenticado. El token de acceso no es válido o ha expirado.',
                'debug' => [
                    'token_present' => (bool)$request->bearerToken(),
                    'auth_method' => auth()->guard(),
                ],
            ], 401);
        }

        if (!$user->activo) {
            \Log::warning('API Index Proformas: User inactive', [
                'user_id' => $user->id,
                'user_name' => $user->name,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Usuario inactivo. Contacte al administrador.',
            ], 403);
        }

        // Validar parámetros opcionales
        $validator = Validator::make($request->all(), [
            'estado' => 'nullable|in:PENDIENTE,APROBADA,RECHAZADA,CONVERTIDA_A_VENTA',
            'canal_origen' => 'nullable|string',
            'fecha_desde' => 'nullable|date',
            'fecha_hasta' => 'nullable|date|after_or_equal:fecha_desde',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'format' => 'nullable|in:default,app', // Formato de respuesta
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parámetros de filtro incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Construir query base
        $query = Proforma::query();

        // ========================================
        // FILTRADO POR ROL DE USUARIO
        // ========================================

        // Verificar rol del usuario (case-insensitive)
        $userRoles = $user->roles->pluck('name')->map(fn($role) => strtolower($role))->toArray();

        if (in_array('cliente', $userRoles)) {
            // CLIENTE: Solo sus propias proformas
            // Buscar el cliente asociado al usuario autenticado
            $cliente = $user->cliente; // Relación HasOne en el modelo User

            if (!$cliente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene un cliente asociado',
                ], 403);
            }

            $query->where('cliente_id', $cliente->id);
        }
        elseif (in_array('preventista', $userRoles)) {
            // PREVENTISTA: Solo las proformas que él creó
            $query->where('usuario_creador_id', $user->id);
        }
        elseif (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado', 'chofer'], $userRoles)) {
            // DASHBOARD: Todas las proformas (sin filtro adicional)
            // Opcionalmente se puede filtrar por canal_origen, estado, etc.
        }
        else {
            // Usuario sin rol reconocido: sin acceso
            return response()->json([
                'success' => false,
                'message' => 'No tiene permisos para ver proformas',
            ], 403);
        }

        // ========================================
        // FILTROS OPCIONALES (Query String)
        // ========================================

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('canal_origen')) {
            $query->where('canal_origen', $request->canal_origen);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        // Búsqueda por número de proforma
        if ($request->filled('numero')) {
            $query->where('numero', 'like', '%' . $request->numero . '%');
        }

        // ========================================
        // RELACIONES Y ORDENAMIENTO
        // ========================================

        $query->with([
            'cliente',
            'usuarioCreador',
            'detalles.producto.categoria',
            'detalles.producto.marca',
            'direccionSolicitada',
            'direccionConfirmada',
        ]);

        $query->orderBy('created_at', 'desc');

        // ========================================
        // PAGINACIÓN
        // ========================================

        $perPage = min($request->get('per_page', 20), 100);
        $proformas = $query->paginate($perPage);

        // ========================================
        // FORMATO DE RESPUESTA
        // ========================================

        // Formato para app móvil (simplificado)
        if ($request->format === 'app') {
            return response()->json([
                'success' => true,
                'data' => [
                    'pedidos' => $proformas->map(function ($proforma) {
                        return [
                            'id' => $proforma->id,
                            'codigo' => $proforma->numero,
                            'fecha' => $proforma->fecha?->format('Y-m-d'),
                            'fecha_vencimiento' => $proforma->fecha_vencimiento?->format('Y-m-d'),
                            'estado' => $proforma->estado,
                            'total' => (float) $proforma->total,
                            'moneda' => 'BOB',
                            'cantidad_items' => $proforma->detalles->count(),
                            'total_productos' => (float) $proforma->detalles->sum('cantidad'),
                            'tiene_reserva_activa' => $proforma->reservasActivas()->count() > 0,
                            'observaciones' => $proforma->observaciones,
                            'observaciones_rechazo' => $proforma->observaciones_rechazo,
                            'items_preview' => $proforma->detalles->take(3)->map(function ($detalle) {
                                return [
                                    'producto' => $detalle->producto->nombre ?? 'Producto',
                                    'cantidad' => (float) $detalle->cantidad,
                                ];
                            }),
                        ];
                    }),
                    'paginacion' => [
                        'total' => $proformas->total(),
                        'por_pagina' => $proformas->perPage(),
                        'pagina_actual' => $proformas->currentPage(),
                        'ultima_pagina' => $proformas->lastPage(),
                        'desde' => $proformas->firstItem(),
                        'hasta' => $proformas->lastItem(),
                    ],
                ],
            ]);
        }

        // Formato default (dashboard web)
        return response()->json([
            'success' => true,
            'data' => $proformas->items(),
            'meta' => [
                'current_page' => $proformas->currentPage(),
                'last_page' => $proformas->lastPage(),
                'per_page' => $proformas->perPage(),
                'total' => $proformas->total(),
                'from' => $proformas->firstItem(),
                'to' => $proformas->lastItem(),
            ],
        ]);
    }

    /**
     * Obtener estadísticas de proformas del usuario autenticado
     *
     * GET /api/proformas/estadisticas
     *
     * Retorna contadores agrupados por estado, total de montos, etc.
     * Filtrado automático según el rol del usuario (igual que index())
     */
    public function stats(Request $request)
    {
        $user = Auth::user();

        // ========================================
        // VALIDACIÓN MEJORADA DE AUTENTICACIÓN
        // ========================================
        if (!$user) {
            // Log detallado para debugging
            \Log::warning('API Stats: No authenticated user found', [
                'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
                'auth_header' => $request->header('Authorization') ? 'present' : 'missing',
                'user_agent' => $request->userAgent(),
                'method' => $request->method(),
                'path' => $request->path(),
                'client_ip' => $request->ip(),
                'timestamp' => now()->toIso8601String(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No autenticado. El token de acceso no es válido o ha expirado.',
                'debug' => [
                    'token_present' => (bool)$request->bearerToken(),
                    'auth_method' => auth()->guard(),
                    'timestamp' => now(),
                ],
            ], 401);
        }

        // Validación adicional: verificar que el usuario está activo
        if (!$user->activo) {
            \Log::warning('API Stats: User inactive', [
                'user_id' => $user->id,
                'user_name' => $user->name,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Usuario inactivo. Contacte al administrador.',
            ], 403);
        }

        // Construir query base
        $query = Proforma::query();

        // ========================================
        // FILTRADO POR ROL DE USUARIO (misma lógica que index)
        // ========================================

        $userRoles = $user->roles->pluck('name')->map(fn($role) => strtolower($role))->toArray();

        // Verificar permisos en orden: admin/logistica primero (mayor prioridad)
        if (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado', 'chofer'], $userRoles)) {
            // DASHBOARD: Todas las proformas
        }
        elseif (in_array('cliente', $userRoles)) {
            // CLIENTE: Solo sus propias proformas
            $cliente = $user->cliente;

            if (!$cliente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene un cliente asociado',
                ], 403);
            }

            $query->where('cliente_id', $cliente->id);
        }
        elseif (in_array('preventista', $userRoles)) {
            // PREVENTISTA: Solo las proformas que él creó
            $query->where('usuario_creador_id', $user->id);
        }
        else {
            return response()->json([
                'success' => false,
                'message' => 'No tiene permisos para ver estadísticas de proformas',
            ], 403);
        }

        // ========================================
        // CALCULAR ESTADÍSTICAS
        // ========================================

        try {
            // Total general
            $total = $query->count();

            // Por estado
            $porEstado = (clone $query)
                ->selectRaw('estado, COUNT(*) as cantidad, SUM(total) as monto_total')
                ->groupBy('estado')
                ->get()
                ->keyBy('estado');

            // Por canal origen
            $porCanal = (clone $query)
                ->selectRaw('canal_origen, COUNT(*) as cantidad')
                ->groupBy('canal_origen')
                ->get()
                ->keyBy('canal_origen');

            // proformas vencidas (PENDIENTE o APROBADA con fecha_vencimiento < now)
            $vencidas = (clone $query)
                ->whereIn('estado', [Proforma::PENDIENTE, Proforma::APROBADA])
                ->where('fecha_vencimiento', '<', now())
                ->count();

            // proformas por vencer (próximos 2 días)
            $porVencer = (clone $query)
                ->whereIn('estado', [Proforma::PENDIENTE, Proforma::APROBADA])
                ->whereBetween('fecha_vencimiento', [now(), now()->addDays(2)])
                ->count();

            // Monto total por estado
            $montoTotal = $query->sum('total');

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'por_estado' => [
                        'pendiente' => $porEstado->get(Proforma::PENDIENTE)?->cantidad ?? 0,
                        'aprobada' => $porEstado->get(Proforma::APROBADA)?->cantidad ?? 0,
                        'rechazada' => $porEstado->get(Proforma::RECHAZADA)?->cantidad ?? 0,
                        'convertida' => $porEstado->get(Proforma::CONVERTIDA)?->cantidad ?? 0,
                        'vencida' => $porEstado->get(Proforma::VENCIDA)?->cantidad ?? 0,
                    ],
                    'montos_por_estado' => [
                        'pendiente' => (float) ($porEstado->get(Proforma::PENDIENTE)?->monto_total ?? 0),
                        'aprobada' => (float) ($porEstado->get(Proforma::APROBADA)?->monto_total ?? 0),
                        'rechazada' => (float) ($porEstado->get(Proforma::RECHAZADA)?->monto_total ?? 0),
                        'convertida' => (float) ($porEstado->get(Proforma::CONVERTIDA)?->monto_total ?? 0),
                        'vencida' => (float) ($porEstado->get(Proforma::VENCIDA)?->monto_total ?? 0),
                    ],
                    'por_canal' => [
                        'app_externa' => $porCanal->get(Proforma::CANAL_APP_EXTERNA)?->cantidad ?? 0,
                        'web' => $porCanal->get(Proforma::CANAL_WEB)?->cantidad ?? 0,
                        'presencial' => $porCanal->get(Proforma::CANAL_PRESENCIAL)?->cantidad ?? 0,
                    ],
                    'alertas' => [
                        'vencidas' => $vencidas,
                        'por_vencer' => $porVencer,
                    ],
                    'monto_total' => (float) $montoTotal,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error obteniendo estadísticas de proformas', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de proformas',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function verificarEstado(Proforma $proforma)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'numero' => $proforma->numero,
                'estado' => $proforma->estado,
                'fecha' => $proforma->fecha,
                'total' => $proforma->total,
                'observaciones' => $proforma->observaciones,
                'observaciones_rechazo' => $proforma->observaciones_rechazo,
                'fecha_aprobacion' => $proforma->fecha_aprobacion,
                'puede_convertir_a_venta' => $proforma->puedeConvertirseAVenta(),
            ],
        ]);
    }

    public function obtenerProductosDisponibles(Request $request)
    {
        $query = Producto::query()
            ->where('activo', true)
            ->with(['categoria', 'marca', 'stockProductos']);

        // Filtro por búsqueda
        if ($request->buscar) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'ilike', "%{$buscar}%")
                    ->orWhere('codigo', 'ilike', "%{$buscar}%");
            });
        }

        // Filtro por categoría
        if ($request->categoria_id) {
            $query->where('categoria_id', $request->categoria_id);
        }

        // Solo productos con stock
        if ($request->con_stock) {
            $query->whereHas('stockProductos', function ($q) {
                $q->where('cantidad_disponible', '>', 0);
            });
        }

        $productos = $query->orderBy('nombre')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $productos,
        ]);
    }

    /**
     * Aprobar una proforma desde el dashboard
     */
    public function aprobar(Proforma $proforma, Request $request)
    {
        $request->validate([
            'comentario' => 'nullable|string|max:500',
            // Confirmación de entrega del vendedor después de coordinación
            'fecha_entrega_confirmada' => 'nullable|date|after_or_equal:today',
            'hora_entrega_confirmada' => 'nullable|date_format:H:i',
            'hora_entrega_confirmada_fin' => 'nullable|date_format:H:i',
            'direccion_entrega_confirmada_id' => 'nullable|exists:direcciones_cliente,id',
            'comentario_coordinacion' => 'nullable|string|max:1000',
            // Datos de intentos de contacto
            'numero_intentos_contacto' => 'nullable|integer|min:0',
            'fecha_ultimo_intento' => 'nullable|date',
            'resultado_ultimo_intento' => 'nullable|string|max:500',
            'notas_llamada' => 'nullable|string|max:1000',
        ]);

        try {
            if ($proforma->estado !== 'PENDIENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden aprobar proformas pendientes',
                ], 400);
            }

            // Validar que si se proporciona dirección confirmada, pertenece al cliente
            if ($request->filled('direccion_entrega_confirmada_id')) {
                $direccion = \App\Models\DireccionCliente::findOrFail($request->direccion_entrega_confirmada_id);
                if ($direccion->cliente_id !== $proforma->cliente_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La dirección seleccionada no pertenece al cliente de la proforma',
                    ], 422);
                }
            }

            // Validar que la hora confirmada está dentro de las ventanas del cliente (si existen)
            if ($request->filled('hora_entrega_confirmada') && $request->filled('fecha_entrega_confirmada')) {
                $horaConfirmada = \Carbon\Carbon::createFromFormat('H:i', $request->hora_entrega_confirmada);
                $fechaConfirmada = \Carbon\Carbon::parse($request->fecha_entrega_confirmada);
                $diaSemana = $fechaConfirmada->dayOfWeek;

                // Obtener ventanas del cliente
                $ventanas = $proforma->cliente->ventanasEntrega()
                    ->where('dia_semana', $diaSemana)
                    ->where('activo', true)
                    ->first();

                if ($ventanas) {
                    $horaInicio = \Carbon\Carbon::createFromFormat('H:i', $ventanas->hora_inicio);
                    $horaFin = \Carbon\Carbon::createFromFormat('H:i', $ventanas->hora_fin);

                    if (!($horaConfirmada->gte($horaInicio) && $horaConfirmada->lte($horaFin))) {
                        return response()->json([
                            'success' => false,
                            'message' => 'La hora confirmada está fuera de las ventanas de entrega disponibles para el cliente',
                            'ventanas_disponibles' => [
                                'hora_inicio' => $ventanas->hora_inicio,
                                'hora_fin' => $ventanas->hora_fin,
                                'dia_semana' => $diaSemana,
                            ],
                        ], 422);
                    }
                }
            }

            // Actualizar proforma con confirmación del vendedor y datos de contacto
            $proforma->update([
                'fecha_entrega_confirmada' => $request->fecha_entrega_confirmada ?? $proforma->fecha_entrega_solicitada,
                'hora_entrega_confirmada' => $request->hora_entrega_confirmada ?? $proforma->hora_entrega_solicitada,
                'hora_entrega_confirmada_fin' => $request->hora_entrega_confirmada_fin ?? $proforma->hora_entrega_solicitada_fin,
                'direccion_entrega_confirmada_id' => $request->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_solicitada_id,
                'coordinacion_completada' => true,
                'comentario_coordinacion' => $request->comentario_coordinacion,
                // Datos de intentos de contacto (se envían desde la pantalla principal)
                'numero_intentos_contacto' => $request->numero_intentos_contacto ?? $proforma->numero_intentos_contacto,
                // Si no se proporciona fecha_ultimo_intento, se genera automáticamente la de hoy
                'fecha_ultimo_intento' => $request->fecha_ultimo_intento ?? ($request->numero_intentos_contacto ? now()->toDateString() : $proforma->fecha_ultimo_intento),
                'resultado_ultimo_intento' => $request->resultado_ultimo_intento ?? $proforma->resultado_ultimo_intento,
                'notas_llamada' => $request->notas_llamada ?? $proforma->notas_llamada,
            ]);

            // Obtener usuario autenticado
            $usuario = request()->user();
            if ($usuario === null) {
                $usuario = auth()->user();
            }

            // Aprobar la proforma
            $aprobada = $proforma->aprobar($usuario, $request->comentario);

            if (!$aprobada) {
                return response()->json([
                    'success' => false,
                    'message' => $proforma->estaVencida()
                        ? 'No se puede aprobar una proforma vencida (venció el ' . $proforma->fecha_vencimiento->format('d/m/Y') . ')'
                        : 'No se puede aprobar la proforma en su estado actual',
                ], 400);
            }

            // ✅ Emitir eventos para notificaciones y dashboard (envuelto en try-catch para evitar fallos de broadcast)
            try {
                event(new ProformaAprobada($proforma, $usuario?->id));
                // Actualizar métricas del dashboard
                event(new \App\Events\DashboardMetricsUpdated(
                    app(\App\Services\DashboardService::class)->getMainMetrics('mes_actual')
                ));
            } catch (\Exception $broadcastError) {
                Log::warning('⚠️  Error al emitir evento de aprobación (no crítico)', [
                    'proforma_id' => $proforma->id,
                    'error' => $broadcastError->getMessage(),
                ]);
                // El evento falló, pero la aprobación ya fue exitosa, así que continuamos
            }

            return response()->json([
                'success' => true,
                'message' => 'Proforma aprobada exitosamente',
                'data' => $proforma->fresh(['detalles.producto', 'cliente', 'direccionConfirmada', 'direccionSolicitada']),
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al aprobar proforma', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'proforma_id' => $proforma->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al aprobar la proforma: '.$e->getMessage(),
                'error_details' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Rechazar una proforma desde el dashboard
     */
    public function rechazar(Proforma $proforma, Request $request)
    {
        $request->validate([
            'comentario' => 'required|string|max:500',
        ]);

        try {
            if ($proforma->estado !== 'PENDIENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden rechazar proformas pendientes',
                ], 400);
            }

            $proforma->rechazar(request()->user(), $request->comentario);

            // ✅ Emitir eventos para notificaciones y dashboard
            try {
                event(new ProformaRechazada($proforma, $request->comentario));
                // Actualizar métricas del dashboard
                event(new \App\Events\DashboardMetricsUpdated(
                    app(\App\Services\DashboardService::class)->getMainMetrics('mes_actual')
                ));
            } catch (\Exception $broadcastError) {
                Log::warning('⚠️  Error al emitir evento de rechazo (no crítico)', [
                    'proforma_id' => $proforma->id,
                    'error' => $broadcastError->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Proforma rechazada',
                'data' => $proforma->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al rechazar la proforma: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Guardar coordinación de entrega de una proforma
     *
     * Endpoint para confirmar/actualizar los detalles de coordinación de entrega
     * sin necesidad de aprobar la proforma. Los datos se guardan para referencia
     * durante el proceso de aprobación.
     */
    public function coordinarEntrega(Proforma $proforma, Request $request)
    {
        $request->validate([
            // Campos existentes
            'fecha_entrega_confirmada' => 'nullable|date|after_or_equal:today',
            'hora_entrega_confirmada' => 'nullable|date_format:H:i',
            'hora_entrega_confirmada_fin' => 'nullable|date_format:H:i',
            'direccion_entrega_confirmada_id' => 'nullable|exists:direcciones_cliente,id',
            'comentario_coordinacion' => 'nullable|string|max:1000',
            'notas_llamada' => 'nullable|string|max:500',

            // Nuevos campos de control de intentos
            'numero_intentos_contacto' => 'nullable|integer|min:0|max:255',
            'resultado_ultimo_intento' => 'nullable|string|in:Aceptado,No contactado,Rechazado,Reagendar',

            // Nuevos campos de entrega realizada
            'entregado_en' => 'nullable|date_format:Y-m-d\TH:i',
            'entregado_a' => 'nullable|string|max:255',
            'observaciones_entrega' => 'nullable|string|max:1000',
        ]);

        try {
            // Validar que si se proporciona dirección confirmada, pertenece al cliente
            if ($request->filled('direccion_entrega_confirmada_id')) {
                $direccion = \App\Models\DireccionCliente::findOrFail($request->direccion_entrega_confirmada_id);
                if ($direccion->cliente_id !== $proforma->cliente_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La dirección seleccionada no pertenece al cliente de la proforma',
                    ], 422);
                }
            }

            // Combinar comentario de coordinación y notas de llamada
            $comentarioFinal = $request->comentario_coordinacion ?? '';
            if ($request->filled('notas_llamada')) {
                $comentarioFinal = $comentarioFinal
                    ? "{$comentarioFinal}\n\nNotas de llamada: {$request->notas_llamada}"
                    : "Notas de llamada: {$request->notas_llamada}";
            }

            // Preparar datos a actualizar
            $datosActualizar = [
                'fecha_entrega_confirmada' => $request->fecha_entrega_confirmada ?? $proforma->fecha_entrega_confirmada,
                'hora_entrega_confirmada' => $request->hora_entrega_confirmada ?? $proforma->hora_entrega_confirmada,
                'hora_entrega_confirmada_fin' => $request->hora_entrega_confirmada_fin ?? $proforma->hora_entrega_confirmada_fin,
                'direccion_entrega_confirmada_id' => $request->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_confirmada_id,
                'comentario_coordinacion' => $comentarioFinal ?: $proforma->comentario_coordinacion,
                'coordinacion_completada' => true,

                // Nuevos campos de control
                'coordinacion_actualizada_en' => now(),
                'coordinacion_actualizada_por_id' => auth()->id(),
                'numero_intentos_contacto' => $request->numero_intentos_contacto ?? $proforma->numero_intentos_contacto ?? 0,
                'resultado_ultimo_intento' => $request->resultado_ultimo_intento ?? $proforma->resultado_ultimo_intento,
                'entregado_en' => $request->entregado_en ?? $proforma->entregado_en,
                'entregado_a' => $request->entregado_a ?? $proforma->entregado_a,
                'observaciones_entrega' => $request->observaciones_entrega ?? $proforma->observaciones_entrega,
            ];

            // Actualizar proforma con todos los datos
            $proforma->update($datosActualizar);

            // Disparar evento de coordinación actualizada
            event(new \App\Events\ProformaCoordinacionActualizada($proforma, auth()->id()));

            // Log de coordinación actualizada
            Log::info('Coordinación de proforma actualizada', [
                'proforma_id' => $proforma->id,
                'proforma_numero' => $proforma->numero,
                'usuario_id' => auth()->id(),
                'datos_actualizados' => array_keys($datosActualizar),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Coordinación guardada exitosamente',
                'data' => $proforma->fresh([
                    'cliente',
                    'usuarioCreador',
                    'coordinacionActualizadaPor',
                    'direccionSolicitada',
                    'direccionConfirmada',
                ]),
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al guardar coordinación de proforma', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'proforma_id' => $proforma->id,
                'usuario_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la coordinación: '.$e->getMessage(),
                'error_details' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Extender fecha de vencimiento de una proforma
     */
    public function extenderVencimiento(Proforma $proforma, Request $request)
    {
        $request->validate([
            'dias' => 'nullable|integer|min:1|max:30',
        ]);

        try {
            $dias = $request->input('dias', 7); // Por defecto 7 días

            $extendida = $proforma->extenderVencimiento($dias);

            if (!$extendida) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede extender el vencimiento. Solo se permite para proformas PENDIENTES o APROBADAS.',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => "Fecha de vencimiento extendida {$dias} días",
                'data' => [
                    'proforma' => $proforma->fresh(),
                    'nueva_fecha_vencimiento' => $proforma->fecha_vencimiento->format('Y-m-d'),
                    'dias_extendidos' => $dias,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al extender vencimiento de proforma', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'proforma_id' => $proforma->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al extender el vencimiento: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar disponibilidad de stock para productos
     */
    public function verificarStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|exists:productos,id',
            'productos.*.cantidad' => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        $verificacion = [];
        $todoDisponible = true;

        foreach ($request->productos as $item) {
            $producto = Producto::with('stockProductos')->findOrFail($item['producto_id']);
            $cantidadRequerida = $item['cantidad'];

            $stockTotal = $producto->stockProductos()->sum('cantidad_disponible');

            $disponible = $stockTotal >= $cantidadRequerida;

            if (! $disponible) {
                $todoDisponible = false;
            }

            $verificacion[] = [
                'producto_id' => $producto->id,
                'producto_nombre' => $producto->nombre,
                'cantidad_requerida' => $cantidadRequerida,
                'cantidad_disponible' => $stockTotal,
                'disponible' => $disponible,
                'diferencia' => $stockTotal - $cantidadRequerida,
            ];
        }

        return response()->json([
            'success' => true,
            'todo_disponible' => $todoDisponible,
            'verificacion' => $verificacion,
        ]);
    }

    /**
     * Verificar estado de reservas de una proforma
     */
    public function verificarReservas(Proforma $proforma)
    {
        $reservas = $proforma->reservasActivas()->with('stockProducto.producto')->get();
        $expiradas = $proforma->tieneReservasExpiradas();

        return response()->json([
            'success' => true,
            'data' => [
                'proforma_id' => $proforma->id,
                'tiene_reservas' => $reservas->count() > 0,
                'reservas_expiradas' => $expiradas,
                'reservas' => $reservas->map(function ($reserva) {
                    return [
                        'id' => $reserva->id,
                        'producto_nombre' => $reserva->stockProducto->producto->nombre,
                        'cantidad_reservada' => $reserva->cantidad_reservada,
                        'fecha_expiracion' => $reserva->fecha_expiracion,
                        'expirada' => $reserva->estaExpirada(),
                    ];
                }),
            ],
        ]);
    }

    /**
     * Extender tiempo de reservas
     */
    public function extenderReservas(Proforma $proforma, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'horas' => 'required|integer|min:1|max:168', // Máximo 7 días
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($proforma->extenderReservas($request->horas)) {
            return response()->json([
                'success' => true,
                'message' => "Reservas extendidas por {$request->horas} horas",
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No se pudieron extender las reservas',
        ], 400);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ENDPOINT ESPECÍFICO PARA CREAR PEDIDOS DESDE LA APP DEL CLIENTE
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Este endpoint permite que los clientes autenticados creen pedidos (proformas)
     * directamente desde la aplicación móvil Flutter.
     *
     * Diferencias con store():
     * - No requiere cliente_id (usa el cliente autenticado)
     * - Requiere/valida dirección de entrega
     * - Reserva stock automáticamente
     * - Retorna código de seguimiento
     * - Incluye validaciones específicas para la app
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function crearPedidoDesdeApp(Request $request)
    {
        // Validaciones
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,id',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'direccion_id' => 'nullable|exists:direcciones_cliente,id',
            'observaciones' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // 1. Obtener el cliente autenticado
            $user = Auth::user();

            if (! $user || ! $user->cliente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene un cliente asociado',
                ], 403);
            }

            $cliente = $user->cliente;

            // 2. Validar dirección de entrega
            $direccion = null;

            if ($request->filled('direccion_id')) {
                // Validar que la dirección pertenece al cliente y está activa
                $direccion = $cliente->direcciones()
                    ->where('id', $request->direccion_id)
                    ->where('activa', true)
                    ->first();

                if (! $direccion) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La dirección seleccionada no existe o no está activa',
                    ], 422);
                }
            } else {
                // Usar dirección principal si no se especifica
                $direccion = $cliente->direcciones()
                    ->where('es_principal', true)
                    ->where('activa', true)
                    ->first();

                if (! $direccion) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No tienes una dirección de entrega configurada. Por favor agrega una dirección antes de crear un pedido.',
                        'requiere_direccion' => true,
                    ], 422);
                }
            }

            // 3. Validar stock y calcular totales
            $subtotal = 0;
            $productosValidados = [];
            $stockInsuficiente = [];

            foreach ($request->items as $item) {
                $producto = Producto::with('stockProductos')->findOrFail($item['producto_id']);
                $cantidad = $item['cantidad'];

                // Verificar que el producto esté activo
                if (! $producto->activo) {
                    return response()->json([
                        'success' => false,
                        'message' => "El producto {$producto->nombre} no está disponible",
                    ], 422);
                }

                // Obtener precio actual del producto
                $precio = $producto->precio_venta ?? 0;

                if ($precio <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "El producto {$producto->nombre} no tiene precio definido",
                    ], 422);
                }

                // Verificar disponibilidad de stock
                $stockDisponible = $producto->stockProductos()->sum('cantidad_disponible');

                if ($stockDisponible < $cantidad) {
                    $stockInsuficiente[] = [
                        'producto_id' => $producto->id,
                        'producto' => $producto->nombre,
                        'requerido' => $cantidad,
                        'disponible' => $stockDisponible,
                        'faltante' => $cantidad - $stockDisponible,
                    ];
                }

                $subtotalItem = $cantidad * $precio;
                $subtotal += $subtotalItem;

                $productosValidados[] = [
                    'producto_id' => $producto->id,
                    'producto' => $producto,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precio,
                    'subtotal' => $subtotalItem,
                ];
            }

            // Si hay productos con stock insuficiente, retornar error detallado
            if (! empty($stockInsuficiente)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock insuficiente para algunos productos',
                    'productos_sin_stock' => $stockInsuficiente,
                ], 422);
            }

            // 4. Calcular impuestos (13% IVA en Bolivia) - Por ahora no se suma al total
            $impuesto = $subtotal * 0.13;
            $total = $subtotal; // Sin impuestos por ahora

            // 5. Crear la proforma
            $proforma = Proforma::create([
                'numero' => Proforma::generarNumeroProforma(),
                'fecha' => now(),
                'fecha_vencimiento' => now()->addDays(7), // 7 días para aprobar
                'cliente_id' => $cliente->id,
                'estado' => Proforma::PENDIENTE,
                'canal_origen' => Proforma::CANAL_APP_EXTERNA,
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'moneda_id' => 1, // Bolivianos por defecto
                'observaciones' => $request->observaciones,
                'usuario_creador_id' => $user->id,
            ]);

            // 6. Crear detalles de la proforma
            foreach ($productosValidados as $detalle) {
                $proforma->detalles()->create([
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal' => $detalle['subtotal'],
                ]);
            }

            // 7. Reservar stock automáticamente
            $reservaExitosa = $proforma->reservarStock();

            if (! $reservaExitosa) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo reservar el stock para este pedido. Algunos productos pueden haber sido vendidos recientemente.',
                    'error_code' => 'RESERVA_FALLIDA',
                ], 422);
            }

            // 8. Cargar relaciones para la respuesta
            $proforma->load([
                'detalles.producto.categoria',
                'detalles.producto.marca',
                'cliente.localidad',
                'reservasActivas.stockProducto.almacen',
            ]);

            DB::commit();

            // 8.5. Enviar notificación WebSocket en tiempo real
            // NOTA: Las notificaciones WebSocket ahora se envían a través de los Events/Listeners
            // Ver: ProformaCreada event → SendProformaCreatedNotification listener

            // 9. Retornar respuesta exitosa con toda la información necesaria
            return response()->json([
                'success' => true,
                'message' => 'Pedido creado exitosamente. Será revisado por nuestro equipo en las próximas horas.',
                'data' => [
                    'pedido' => [
                        'id' => $proforma->id,
                        'codigo' => $proforma->numero,
                        'fecha' => $proforma->fecha->format('Y-m-d'),
                        'fecha_vencimiento' => $proforma->fecha_vencimiento->format('Y-m-d'),
                        'estado' => $proforma->estado,
                        'canal' => $proforma->canal_origen,
                        'subtotal' => (float) $proforma->subtotal,
                        'impuesto' => (float) $proforma->impuesto,
                        'total' => (float) $proforma->total,
                        'observaciones' => $proforma->observaciones,
                        'items' => $proforma->detalles->map(function ($detalle) {
                            return [
                                'producto_id' => $detalle->producto_id,
                                'producto' => $detalle->producto->nombre,
                                'cantidad' => (float) $detalle->cantidad,
                                'precio_unitario' => (float) $detalle->precio_unitario,
                                'subtotal' => (float) $detalle->subtotal,
                            ];
                        }),
                    ],
                    'direccion_entrega' => [
                        'id' => $direccion->id,
                        'direccion' => $direccion->direccion,
                        'latitud' => $direccion->latitud,
                        'longitud' => $direccion->longitud,
                        'observaciones' => $direccion->observaciones,
                    ],
                    'stock_reservado' => [
                        'cantidad_reservas' => $proforma->reservasActivas->count(),
                        'fecha_expiracion' => $proforma->reservasActivas->first()?->fecha_expiracion,
                        'tiempo_restante_horas' => $proforma->reservasActivas->first()
                            ? now()->diffInHours($proforma->reservasActivas->first()->fecha_expiracion, false)
                            : null,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            // Log del error para debugging
            Log::error('Error creando pedido desde app', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el pedido. Por favor intenta nuevamente.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }


    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ENDPOINT: DETALLE COMPLETO DE UN PEDIDO
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Retorna toda la información detallada de un pedido específico.
     * Incluye items, dirección de entrega, reservas de stock, etc.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerDetallePedido($id)
    {
        // Validar que el usuario tiene un cliente asociado
        $user = Auth::user();

        if (! $user || ! $user->cliente) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no tiene un cliente asociado',
            ], 403);
        }

        $cliente = $user->cliente;

        // Buscar el pedido
        $proforma = Proforma::with([
            'detalles.producto.categoria',
            'detalles.producto.marca',
            'detalles.producto.unidad',
            'cliente.direcciones' => function ($query) {
                $query->where('activa', true);
            },
            'reservasActivas.stockProducto.almacen',
            'usuarioCreador',
            'usuarioAprobador',
        ])->find($id);

        if (! $proforma) {
            return response()->json([
                'success' => false,
                'message' => 'Pedido no encontrado',
            ], 404);
        }

        // Verificar que el pedido pertenece al cliente autenticado
        if ($proforma->cliente_id !== $cliente->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para ver este pedido',
            ], 403);
        }

        // Obtener dirección de entrega (la principal por defecto)
        $direccionEntrega = $cliente->direcciones()->where('es_principal', true)->first();

        // Construir respuesta detallada
        return response()->json([
            'success' => true,
            'data' => [
                'pedido' => [
                    'id' => $proforma->id,
                    'codigo' => $proforma->numero,
                    'fecha' => $proforma->fecha->format('Y-m-d H:i'),
                    'fecha_vencimiento' => $proforma->fecha_vencimiento?->format('Y-m-d'),
                    'estado' => $proforma->estado,
                    'canal_origen' => $proforma->canal_origen,
                    'subtotal' => (float) $proforma->subtotal,
                    'impuesto' => (float) $proforma->impuesto,
                    'total' => (float) $proforma->total,
                    'moneda' => 'BOB',
                    'observaciones' => $proforma->observaciones,
                    'observaciones_rechazo' => $proforma->observaciones_rechazo,
                    'fecha_aprobacion' => $proforma->fecha_aprobacion?->format('Y-m-d H:i'),
                    'puede_cancelar' => $proforma->estado === Proforma::PENDIENTE,
                    'puede_extender_reserva' => $proforma->reservasActivas->count() > 0 &&
                                                $proforma->estado === Proforma::PENDIENTE,
                ],
                'items' => $proforma->detalles->map(function ($detalle) {
                    return [
                        'id' => $detalle->id,
                        'producto_id' => $detalle->producto_id,
                        'producto' => $detalle->producto->nombre,
                        'codigo_producto' => $detalle->producto->codigo,
                        'categoria' => $detalle->producto->categoria?->nombre,
                        'marca' => $detalle->producto->marca?->nombre,
                        'unidad_medida' => $detalle->producto->unidad?->abreviacion,
                        'cantidad' => (float) $detalle->cantidad,
                        'precio_unitario' => (float) $detalle->precio_unitario,
                        'subtotal' => (float) $detalle->subtotal,
                        'imagen_url' => $detalle->producto->imagen_url,
                    ];
                }),
                'direccion_entrega' => $direccionEntrega ? [
                    'id' => $direccionEntrega->id,
                    'direccion' => $direccionEntrega->direccion,
                    'latitud' => $direccionEntrega->latitud,
                    'longitud' => $direccionEntrega->longitud,
                    'observaciones' => $direccionEntrega->observaciones,
                    'es_principal' => $direccionEntrega->es_principal,
                ] : null,
                'reservas_stock' => $proforma->reservasActivas->count() > 0 ? [
                    'tiene_reservas' => true,
                    'cantidad_reservas' => $proforma->reservasActivas->count(),
                    'fecha_expiracion' => $proforma->reservasActivas->first()?->fecha_expiracion?->format('Y-m-d H:i'),
                    'tiempo_restante_horas' => $proforma->reservasActivas->first()
                        ? now()->diffInHours($proforma->reservasActivas->first()->fecha_expiracion, false)
                        : null,
                    'detalles_por_almacen' => $proforma->reservasActivas->groupBy('stockProducto.almacen.nombre')->map(function ($reservas, $almacen) {
                        return [
                            'almacen' => $almacen,
                            'productos_reservados' => $reservas->count(),
                        ];
                    })->values(),
                ] : [
                    'tiene_reservas' => false,
                ],
                'seguimiento' => [
                    'creado_por' => $proforma->usuarioCreador?->name,
                    'fecha_creacion' => $proforma->created_at->format('Y-m-d H:i'),
                    'aprobado_por' => $proforma->usuarioAprobador?->name,
                    'fecha_aprobacion' => $proforma->fecha_aprobacion?->format('Y-m-d H:i'),
                ],
            ],
        ]);
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ENDPOINT: ESTADO ACTUAL DEL PEDIDO (LIGERO)
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Endpoint ligero para verificar solo el estado actual de un pedido.
     * Útil para actualizaciones rápidas en la app sin cargar todo el detalle.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerEstadoPedido($id)
    {
        // Validar que el usuario tiene un cliente asociado
        $user = Auth::user();

        if (! $user || ! $user->cliente) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no tiene un cliente asociado',
            ], 403);
        }

        $cliente = $user->cliente;

        // Buscar el pedido (sin relaciones para ser más rápido)
        $proforma = Proforma::select([
            'id',
            'numero',
            'cliente_id',
            'estado',
            'fecha',
            'fecha_vencimiento',
            'fecha_aprobacion',
            'total',
            'observaciones',
            'observaciones_rechazo',
        ])->find($id);

        if (! $proforma) {
            return response()->json([
                'success' => false,
                'message' => 'Pedido no encontrado',
            ], 404);
        }

        // Verificar que el pedido pertenece al cliente autenticado
        if ($proforma->cliente_id !== $cliente->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para ver este pedido',
            ], 403);
        }

        // Verificar si tiene reservas activas
        $tieneReservasActivas = $proforma->reservasActivas()->exists();
        $reserva = $tieneReservasActivas ? $proforma->reservasActivas()->first() : null;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $proforma->id,
                'codigo' => $proforma->numero,
                'estado' => $proforma->estado,
                'fecha' => $proforma->fecha->format('Y-m-d'),
                'total' => (float) $proforma->total,
                'observaciones' => $proforma->observaciones,
                'estado_detalle' => [
                    'descripcion' => $this->obtenerDescripcionEstado($proforma->estado),
                    'color' => $this->obtenerColorEstado($proforma->estado),
                    'icono' => $this->obtenerIconoEstado($proforma->estado),
                ],
                'fecha_aprobacion' => $proforma->fecha_aprobacion?->format('Y-m-d H:i'),
                'observaciones_rechazo' => $proforma->observaciones_rechazo,
                'tiene_reserva_activa' => $tieneReservasActivas,
                'reserva_info' => $reserva ? [
                    'fecha_expiracion' => $reserva->fecha_expiracion->format('Y-m-d H:i'),
                    'tiempo_restante_horas' => now()->diffInHours($reserva->fecha_expiracion, false),
                ] : null,
            ],
        ]);
    }

    /**
     * Helper: Obtener descripción del estado para la app
     */
    private function obtenerDescripcionEstado($estado)
    {
        return match ($estado) {
            Proforma::PENDIENTE => 'Tu pedido está siendo revisado por nuestro equipo',
            Proforma::APROBADA => 'Tu pedido ha sido aprobado y está listo para ser procesado',
            Proforma::RECHAZADA => 'Lo sentimos, tu pedido no pudo ser procesado',
            Proforma::CONVERTIDA_A_VENTA => 'Tu pedido ha sido confirmado y está en proceso de entrega',
            default => 'Estado desconocido',
        };
    }

    /**
     * Helper: Obtener color del estado para la UI
     */
    private function obtenerColorEstado($estado)
    {
        return match ($estado) {
            Proforma::PENDIENTE => '#FFA500', // Naranja
            Proforma::APROBADA => '#4CAF50', // Verde
            Proforma::RECHAZADA => '#F44336', // Rojo
            Proforma::CONVERTIDA_A_VENTA => '#2196F3', // Azul
            default => '#9E9E9E', // Gris
        };
    }

    /**
     * Helper: Obtener icono del estado para la UI
     */
    private function obtenerIconoEstado($estado)
    {
        return match ($estado) {
            Proforma::PENDIENTE => 'clock',
            Proforma::APROBADA => 'check-circle',
            Proforma::RECHAZADA => 'x-circle',
            Proforma::CONVERTIDA_A_VENTA => 'truck',
            default => 'help-circle',
        };
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ENDPOINT: CONFIRMAR PROFORMA → CREAR VENTA CON POLÍTICA DE PAGO
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Convierte una proforma APROBADA en una VENTA con política de pago específica.
     * Este es el endpoint usado por Flutter cuando el cliente confirma su pedido.
     *
     * Validaciones:
     * 1. Proforma debe estar APROBADA
     * 2. Debe tener mínimo 5 productos diferentes
     * 3. Debe tener reservas de stock activas
     * 4. Las reservas NO deben estar expiradas
     *
     * Parámetros:
     * - politica_pago: ANTICIPADO_100, MEDIO_MEDIO, CONTRA_ENTREGA
     *
     * @param Proforma $proforma
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirmarProforma(Proforma $proforma, Request $request)
    {
        // Validar parámetros de entrada
        $validator = Validator::make($request->all(), [
            'politica_pago' => 'required|in:ANTICIPADO_100,MEDIO_MEDIO,CONTRA_ENTREGA',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parámetros de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        return DB::transaction(function () use ($proforma, $request) {
            try {
                // Validación 1: La proforma debe estar APROBADA
                if ($proforma->estado !== Proforma::APROBADA) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La proforma debe estar aprobada para confirmarla',
                        'estado_actual' => $proforma->estado,
                    ], 422);
                }

                // Validación 2: Debe tener mínimo 5 productos diferentes
                $cantidadProductos = $proforma->detalles()->count();
                if ($cantidadProductos < 5) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Debe solicitar mínimo 5 productos diferentes',
                        'productos_solicitados' => $cantidadProductos,
                        'productos_requeridos' => 5,
                    ], 422);
                }

                // Validación 3: Verificar que tenga reservas activas
                $reservasActivas = $proforma->reservasActivas()->count();
                if ($reservasActivas === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No hay reservas de stock activas para esta proforma',
                    ], 422);
                }

                // Validación 4: Verificar que las reservas NO estén expiradas
                if ($proforma->tieneReservasExpiradas()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Las reservas de stock han expirado. Por favor crea un nuevo pedido.',
                    ], 422);
                }

                // Validación 5: Verificar disponibilidad de stock actual
                $disponibilidad = $proforma->verificarDisponibilidadStock();
                $stockInsuficiente = array_filter($disponibilidad, fn($item) => !$item['disponible']);

                if (!empty($stockInsuficiente)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Stock insuficiente para algunos productos',
                        'productos_sin_stock' => $stockInsuficiente,
                    ], 422);
                }

                // Preparar datos para la venta desde la proforma
                $politicaPago = $request->politica_pago;
                $montoTotal = $proforma->total;

                $datosVenta = [
                    'numero' => \App\Models\Venta::generarNumero(),
                    'fecha' => now()->toDateString(),
                    'subtotal' => $proforma->subtotal,
                    'descuento' => $proforma->descuento ?? 0,
                    'impuesto' => $proforma->impuesto,
                    'total' => $proforma->total,
                    'monto_total' => $montoTotal,
                    'monto_pagado' => 0,
                    'monto_pendiente' => $montoTotal,
                    'politica_pago' => $politicaPago,
                    'estado_pago' => 'PENDIENTE',
                    'observaciones' => $proforma->observaciones,
                    'cliente_id' => $proforma->cliente_id,
                    'usuario_id' => request()->user()->id,
                    'moneda_id' => $proforma->moneda_id,
                    'proforma_id' => $proforma->id,
                    // Campos de logística
                    'requiere_envio' => $proforma->esDeAppExterna(),
                    'canal_origen' => $proforma->canal_origen,
                    'estado_logistico' => $proforma->esDeAppExterna()
                        ? \App\Models\Venta::ESTADO_PENDIENTE_ENVIO
                        : null,
                    // Estado del documento
                    'estado_documento_id' => \App\Models\EstadoDocumento::where('nombre', 'PENDIENTE')->first()?->id,
                ];

                // Crear la venta
                $venta = \App\Models\Venta::create($datosVenta);

                // Crear detalles de la venta desde los detalles de la proforma
                foreach ($proforma->detalles as $detalleProforma) {
                    $venta->detalles()->create([
                        'producto_id' => $detalleProforma->producto_id,
                        'cantidad' => $detalleProforma->cantidad,
                        'precio_unitario' => $detalleProforma->precio_unitario,
                        'subtotal' => $detalleProforma->subtotal,
                    ]);
                }

                // Marcar la proforma como convertida
                if (!$proforma->marcarComoConvertida()) {
                    throw new \Exception('Error al marcar la proforma como convertida');
                }

                // Cargar relaciones para la respuesta
                $venta->load(['cliente', 'detalles.producto']);

                // Enviar notificación WebSocket
                // NOTA: Las notificaciones WebSocket ahora se envían a través de los Events/Listeners
                // Ver: ProformaConvertida event → SendProformaConvertedNotification listener

                Log::info('Proforma confirmada como venta (API)', [
                    'proforma_id' => $proforma->id,
                    'proforma_numero' => $proforma->numero,
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'politica_pago' => $politicaPago,
                    'usuario_id' => request()->user()->id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Proforma {$proforma->numero} confirmada como venta {$venta->numero}",
                    'data' => [
                        'venta' => [
                            'id' => $venta->id,
                            'numero' => $venta->numero,
                            'fecha' => $venta->fecha,
                            'monto_total' => (float) $venta->monto_total,
                            'monto_pagado' => (float) $venta->monto_pagado,
                            'monto_pendiente' => (float) $venta->monto_pendiente,
                            'politica_pago' => $venta->politica_pago,
                            'estado_pago' => $venta->estado_pago,
                            'estado_logistico' => $venta->estado_logistico,
                        ],
                        'cliente' => [
                            'id' => $venta->cliente->id,
                            'nombre' => $venta->cliente->nombre,
                        ],
                        'items_count' => $venta->detalles->count(),
                    ],
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();

                Log::error('Error al confirmar proforma como venta (API)', [
                    'proforma_id' => $proforma->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Error al confirmar la proforma: ' . $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * ENDPOINT: CONVERTIR PROFORMA A VENTA
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Convierte una proforma aprobada a una venta, consumiendo las reservas de stock.
     * Este es el flujo completo:
     * 1. Valida que la proforma puede convertirse (estado APROBADA, sin venta asociada)
     * 2. Verifica que tenga reservas activas y NO expiradas
     * 3. Crea la venta con los datos de la proforma
     * 4. Marca la proforma como CONVERTIDA (esto dispara el Observer que consume reservas)
     * 5. Retorna la venta creada
     *
     * @param Proforma $proforma
     * @return \Illuminate\Http\JsonResponse
     */
    public function convertirAVenta(Proforma $proforma, Request $request)
    {
        // Validar datos de pago si se proporcionan
        if ($request->input('con_pago')) {
            $request->validate([
                'tipo_pago_id' => 'required|exists:tipos_pago,id',
                'politica_pago' => 'required|in:CONTRA_ENTREGA,ANTICIPADO_100,MEDIO_MEDIO',
                'monto_pagado' => 'nullable|numeric|min:0',
            ]);
        }

        return DB::transaction(function () use ($proforma, $request) {
            try {
                // Validación 1: La proforma debe poder convertirse
                if (!$proforma->puedeConvertirseAVenta()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Esta proforma no puede convertirse a venta',
                        'estado_actual' => $proforma->estado,
                    ], 422);
                }

                // Validación 2: Si hay reservas activas, verificar que no estén expiradas
                $reservasActivas = $proforma->reservasActivas()->count();

                if ($reservasActivas > 0) {
                    // Hay reservas: verificar que NO estén expiradas
                    if ($proforma->tieneReservasExpiradas()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Las reservas de stock han expirado',
                        ], 422);
                    }

                    // Verificar disponibilidad de stock con respecto a reservas
                    $disponibilidad = $proforma->verificarDisponibilidadStock();
                    $stockInsuficiente = array_filter($disponibilidad, fn($item) => !$item['disponible']);

                    if (!empty($stockInsuficiente)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Stock insuficiente para algunos productos',
                            'productos_sin_stock' => $stockInsuficiente,
                        ], 422);
                    }
                } else {
                    // NO hay reservas: intentar crearlas automáticamente
                    \Log::info('⚠️  No hay reservas para proforma ' . $proforma->numero . ', intentando crearlas...');

                    $reservasCreadas = $proforma->reservarStock();

                    if (!$reservasCreadas) {
                        return response()->json([
                            'success' => false,
                            'message' => 'No se pudieron crear reservas de stock. Verifique la disponibilidad de inventario.',
                        ], 422);
                    }

                    \Log::info('✅ Reservas creadas automáticamente para proforma ' . $proforma->numero);
                }

                // Calcular estado de pago si se proporcionan datos
                $montoPagado = (float) ($request->input('monto_pagado') ?? 0);
                $total = (float) $proforma->total;
                $politica = $request->input('politica_pago') ?? 'CONTRA_ENTREGA';

                $estadoPago = match($politica) {
                    'ANTICIPADO_100' => 'PAGADO',
                    'MEDIO_MEDIO' => ($montoPagado >= $total) ? 'PAGADO' : 'PARCIAL',
                    'CONTRA_ENTREGA' => 'PENDIENTE',
                    default => 'PENDIENTE',
                };

                // Preparar datos para la venta desde la proforma
                $datosVenta = [
                    'numero' => \App\Models\Venta::generarNumero(),
                    'fecha' => now()->toDateString(),
                    'subtotal' => $proforma->subtotal,
                    'descuento' => $proforma->descuento ?? 0,
                    'impuesto' => $proforma->impuesto,
                    'total' => $proforma->total,
                    'observaciones' => $proforma->observaciones,
                    'cliente_id' => $proforma->cliente_id,
                    'usuario_id' => request()->user()->id,
                    'moneda_id' => $proforma->moneda_id,
                    'proforma_id' => $proforma->id,
                    // Campos de logística
                    'requiere_envio' => $proforma->esDeAppExterna(),
                    'canal_origen' => $proforma->canal_origen,
                    'estado_logistico' => $proforma->esDeAppExterna()
                        ? \App\Models\Venta::ESTADO_PENDIENTE_ENVIO
                        : null,
                    // Campos de entrega comprometida (desde coordinación de proforma)
                    'direccion_cliente_id' => $proforma->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_solicitada_id,
                    'fecha_entrega_comprometida' => $proforma->fecha_entrega_confirmada,
                    'hora_entrega_comprometida' => $proforma->hora_entrega_confirmada, // Hora SLA (inicio del rango)
                    'ventana_entrega_ini' => $proforma->hora_entrega_confirmada, // Inicio del rango de entrega
                    'ventana_entrega_fin' => $proforma->hora_entrega_confirmada_fin, // Fin del rango de entrega
                    'idempotency_key' => \Illuminate\Support\Str::uuid()->toString(),
                    // Campos de pago
                    'tipo_pago_id' => $request->input('tipo_pago_id'),
                    'politica_pago' => $politica,
                    'estado_pago' => $estadoPago,
                    'monto_pagado' => $montoPagado,
                    'monto_pendiente' => $total - $montoPagado,
                    // Estado del documento
                    'estado_documento_id' => \App\Models\EstadoDocumento::where('nombre', 'Pendiente')->first()?->id ?? 2,
                ];

                // Crear la venta
                // IMPORTANTE: NO se procesa stock aquí, se hace al consumir reservas
                $venta = \App\Models\Venta::create($datosVenta);

                // Crear detalles de la venta desde los detalles de la proforma
                foreach ($proforma->detalles as $detalleProforma) {
                    $venta->detalles()->create([
                        'producto_id' => $detalleProforma->producto_id,
                        'cantidad' => $detalleProforma->cantidad,
                        'precio_unitario' => $detalleProforma->precio_unitario,
                        'subtotal' => $detalleProforma->subtotal,
                    ]);
                }

                // Marcar la proforma como convertida
                // IMPORTANTE: Esto dispara ProformaObserver::updated() que automáticamente
                // consume las reservas (reduce cantidad física del stock)
                if (!$proforma->marcarComoConvertida()) {
                    throw new \Exception('Error al marcar la proforma como convertida');
                }

                // Cargar relaciones para la respuesta
                $venta->load(['cliente', 'detalles.producto', 'moneda', 'estadoDocumento']);

                // ✅ Emitir eventos para notificaciones y dashboard (envuelto en try-catch para evitar fallos de broadcast)
                try {
                    event(new ProformaConvertida($proforma, $venta));
                    // Actualizar métricas del dashboard
                    event(new \App\Events\DashboardMetricsUpdated(
                        app(\App\Services\DashboardService::class)->getMainMetrics('mes_actual')
                    ));
                } catch (\Exception $broadcastError) {
                    Log::warning('⚠️  Error al emitir evento de conversión (no crítico)', [
                        'proforma_id' => $proforma->id,
                        'error' => $broadcastError->getMessage(),
                    ]);
                    // El evento falló, pero la conversión ya fue exitosa, así que continuamos
                }

                Log::info('Proforma convertida a venta exitosamente (API)', [
                    'proforma_id' => $proforma->id,
                    'proforma_numero' => $proforma->numero,
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'reservas_consumidas' => $reservasActivas,
                    'usuario_id' => request()->user()->id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Proforma {$proforma->numero} convertida exitosamente a venta {$venta->numero}",
                    'data' => [
                        'venta' => [
                            'id' => $venta->id,
                            'numero' => $venta->numero,
                            'fecha' => $venta->fecha->format('Y-m-d'),
                            'total' => (float) $venta->total,
                            'cliente' => [
                                'id' => $venta->cliente->id,
                                'nombre' => $venta->cliente->nombre,
                            ],
                            'estado_documento' => $venta->estadoDocumento?->nombre,
                            'requiere_envio' => $venta->requiere_envio,
                            'estado_logistico' => $venta->estado_logistico,
                        ],
                        'proforma' => [
                            'id' => $proforma->id,
                            'numero' => $proforma->numero,
                            'estado' => $proforma->estado,
                        ],
                    ],
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();

                Log::error('Error al convertir proforma a venta (API)', [
                    'proforma_id' => $proforma->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Error al convertir la proforma a venta: ' . $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * Obtener el último carrito (proforma pendiente) del usuario
     *
     * Este endpoint obtiene la proforma más reciente que está en estado PENDIENTE
     * para que el cliente pueda continuar su compra anterior.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerUltimoCarrito(Request $request)
    {
        try {
            $usuarioId = $request->route('usuarioId');

            // Validar que el usuario autenticado sea el propietario
            $usuarioActual = Auth::user();
            if ($usuarioActual->id !== (int)$usuarioId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado para acceder a este carrito',
                ], 403);
            }

            // Obtener el cliente del usuario autenticado
            $cliente = Cliente::where('user_id', $usuarioId)->first();
            if (!$cliente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene un cliente asociado',
                    'data' => null,
                ], 200);
            }

            // Obtener la proforma más reciente en estado PENDIENTE
            $proforma = Proforma::where('cliente_id', $cliente->id)
                ->where('estado', 'PENDIENTE')
                ->orderBy('created_at', 'desc')
                ->with([
                    'detalles',
                    'detalles.producto',
                    'cliente',
                    'direccionSolicitada',
                ])
                ->first();

            if (!$proforma) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay carrito guardado para este usuario',
                    'data' => null,
                ], 200);
            }

            return response()->json([
                'success' => true,
                'message' => 'Carrito recuperado exitosamente',
                'data' => [
                    'id' => $proforma->id,
                    'numero' => $proforma->numero,
                    'fecha' => $proforma->fecha,
                    'subtotal' => $proforma->subtotal,
                    'descuento' => $proforma->descuento,
                    'impuesto' => $proforma->impuesto,
                    'total' => $proforma->total,
                    'estado' => $proforma->estado,
                    'observaciones' => $proforma->observaciones,
                    'canal_origen' => $proforma->canal_origen,
                    'requiere_envio' => $proforma->requiere_envio,
                    // Información de entrega
                    'fecha_entrega_solicitada' => $proforma->fecha_entrega_solicitada,
                    'hora_entrega_solicitada' => $proforma->hora_entrega_solicitada,
                    'direccion_entrega_solicitada_id' => $proforma->direccion_entrega_solicitada_id,
                    'direccionSolicitada' => $proforma->direccionSolicitada ? [
                        'id' => $proforma->direccionSolicitada->id,
                        'direccion' => $proforma->direccionSolicitada->direccion,
                        'latitud' => $proforma->direccionSolicitada->latitud,
                        'longitud' => $proforma->direccionSolicitada->longitud,
                    ] : null,
                    // Detalles de la proforma
                    'detalles' => $proforma->detalles->map(function ($detalle) {
                        return [
                            'id' => $detalle->id,
                            'producto_id' => $detalle->producto_id,
                            'cantidad' => $detalle->cantidad,
                            'precio_unitario' => $detalle->precio_unitario,
                            'descuento' => $detalle->descuento,
                            'subtotal' => $detalle->subtotal,
                            'producto' => [
                                'id' => $detalle->producto->id,
                                'nombre' => $detalle->producto->nombre,
                                'codigo' => $detalle->producto->codigo,
                                'precio_venta' => $detalle->producto->precio_venta,
                            ],
                        ];
                    })->toArray(),
                    'created_at' => $proforma->created_at->toIso8601String(),
                    'updated_at' => $proforma->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al obtener último carrito', [
                'usuario_id' => $request->route('usuarioId'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al recuperar el carrito: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ==========================================
    // MÉTODOS PARA VISTAS INERTIA
    // ==========================================

    /**
     * Renderizar vista Inertia de lista de proformas
     *
     * Este método usa el mismo index() pero devuelve una vista Inertia
     * en lugar de JSON cuando es llamado desde rutas web.
     */
    public function indexInertia(Request $request): Response
    {
        // Reutilizar la lógica del método index() pero devolver Inertia
        $user = Auth::user();

        // Construir query base
        $query = Proforma::query();

        // Filtrado por rol (mismo código que index())
        if ($user->hasRole('cliente') || $user->cliente_id) {
            $clienteId = $user->cliente_id ?? $user->cliente->id ?? null;

            if (!$clienteId) {
                return Inertia::render('Error', [
                    'message' => 'Usuario no tiene un cliente asociado',
                    'status' => 403
                ]);
            }

            $query->where('cliente_id', $clienteId);
        }
        elseif ($user->hasRole('preventista')) {
            $query->where('usuario_creador_id', $user->id);
        }
        elseif ($user->hasAnyRole(['logistica', 'admin', 'cajero', 'manager', 'encargado', 'chofer'])) {
            // Dashboard: todas las proformas
        }
        else {
            return Inertia::render('Error', [
                'message' => 'No tiene permisos para ver proformas',
                'status' => 403
            ]);
        }

        // Aplicar filtros opcionales
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('canal_origen')) {
            $query->where('canal_origen', $request->canal_origen);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        // Eager loading y paginación
        $proformas = $query->with([
            'cliente',
            'usuarioCreador',
            'detalles.producto',
            'direccionSolicitada',
            'direccionConfirmada'
        ])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('proformas/Index', [
            'proformas' => $proformas,
        ]);
    }

    /**
     * Renderizar vista Inertia de detalle de proforma
     *
     * Este método usa el mismo show() pero devuelve una vista Inertia
     * en lugar de JSON cuando es llamado desde rutas web.
     */
    public function showInertia(Proforma $proforma): Response
    {
        $proforma->load([
            'cliente',
            'usuarioCreador',
            'detalles.producto.marca',
            'detalles.producto.categoria',
            'direccionSolicitada',
            'direccionConfirmada',
        ]);

        return Inertia::render('proformas/Show', [
            'proforma' => $proforma,
        ]);
    }
}
