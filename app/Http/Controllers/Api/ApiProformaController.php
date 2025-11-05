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
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

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

        $validator = Validator::make($requestData, [
            'cliente_id' => 'required|exists:clientes,id',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|exists:productos,id',
            'productos.*.cantidad' => 'required|numeric|min:1',
            // Solicitud de entrega del cliente (REQUERIDO)
            'fecha_entrega_solicitada' => 'required|date|after_or_equal:today',
            'hora_entrega_solicitada' => 'nullable|date_format:H:i',
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
                'direccion_entrega_solicitada_id' => $requestData['direccion_entrega_solicitada_id'],
            ]);

            // Crear detalles
            foreach ($productosValidados as $detalle) {
                $proforma->detalles()->create($detalle);
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

    public function index(Request $request)
    {
        $query = Proforma::query();

        // Si es un cliente, solo sus proformas
        if (Auth::user()->cliente_id) {
            $query->where('cliente_id', Auth::user()->cliente_id);
        }

        // Filtros
        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        if ($request->fecha_desde) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->fecha_hasta) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        $proformas = $query->with(['cliente', 'detalles.producto'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $proformas,
        ]);
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
            'direccion_entrega_confirmada_id' => 'nullable|exists:direcciones_cliente,id',
            'comentario_coordinacion' => 'nullable|string|max:1000',
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

            // Actualizar proforma con confirmación del vendedor
            $proforma->update([
                'fecha_entrega_confirmada' => $request->fecha_entrega_confirmada ?? $proforma->fecha_entrega_solicitada,
                'hora_entrega_confirmada' => $request->hora_entrega_confirmada ?? $proforma->hora_entrega_solicitada,
                'direccion_entrega_confirmada_id' => $request->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_solicitada_id,
                'coordinacion_completada' => true,
                'comentario_coordinacion' => $request->comentario_coordinacion,
            ]);

            $proforma->aprobar(request()->user(), $request->comentario);

            // ✅ Emitir evento para notificaciones WebSocket
            event(new ProformaAprobada($proforma, request()->user()->id));

            return response()->json([
                'success' => true,
                'message' => 'Proforma aprobada exitosamente',
                'data' => $proforma->fresh(['detalles.producto', 'cliente', 'direccionConfirmada', 'direccionSolicitada']),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al aprobar la proforma: '.$e->getMessage(),
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

            // ✅ Emitir evento para notificaciones WebSocket
            event(new ProformaRechazada($proforma, $request->comentario));

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
     * Listar proformas con filtros para el dashboard (método específico para dashboard)
     */
    public function listarParaDashboard(Request $request)
    {
        $query = Proforma::with(['cliente', 'usuarioCreador', 'detalles.producto']);

        // Filtros
        if ($request->canal_origen) {
            $query->where('canal_origen', $request->canal_origen);
        }

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        if ($request->fecha_desde) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->fecha_hasta) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        $proformas = $query->orderBy('fecha', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $proformas->items(),
            'meta' => [
                'current_page' => $proformas->currentPage(),
                'last_page' => $proformas->lastPage(),
                'per_page' => $proformas->perPage(),
                'total' => $proformas->total(),
            ],
        ]);
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
            try {
                app(\App\Services\WebSocketNotificationService::class)
                    ->notifyProformaCreated($proforma);
            } catch (\Exception $e) {
                // No fallar si WebSocket falla, solo loguear
                \Log::warning('Error enviando notificación WebSocket', [
                    'proforma_id' => $proforma->id,
                    'error' => $e->getMessage(),
                ]);
            }

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
            \Log::error('Error creando pedido desde app', [
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
     * ENDPOINT: HISTORIAL DE PEDIDOS DEL CLIENTE AUTENTICADO
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Retorna el historial de pedidos (proformas) del cliente autenticado.
     * Optimizado para la app móvil con paginación y filtros útiles.
     *
     * Filtros disponibles:
     * - estado: PENDIENTE, APROBADA, RECHAZADA, CONVERTIDA_A_VENTA
     * - fecha_desde: Y-m-d
     * - fecha_hasta: Y-m-d
     * - page: número de página (default: 1)
     * - per_page: items por página (default: 15, max: 50)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerHistorialPedidos(Request $request)
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

        // Validar parámetros
        $validator = Validator::make($request->all(), [
            'estado' => 'nullable|in:PENDIENTE,APROBADA,RECHAZADA,CONVERTIDA_A_VENTA',
            'fecha_desde' => 'nullable|date',
            'fecha_hasta' => 'nullable|date|after_or_equal:fecha_desde',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parámetros de filtro incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Construir query
        $query = Proforma::where('cliente_id', $cliente->id);

        // Aplicar filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        // Obtener pedidos con paginación
        $perPage = min($request->get('per_page', 15), 50);
        $pedidos = $query->with([
            'detalles.producto.categoria',
            'detalles.producto.marca',
            'reservasActivas',
        ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Transformar datos para la app
        $pedidosTransformados = $pedidos->map(function ($proforma) {
            return [
                'id' => $proforma->id,
                'codigo' => $proforma->numero,
                'fecha' => $proforma->fecha->format('Y-m-d'),
                'fecha_vencimiento' => $proforma->fecha_vencimiento?->format('Y-m-d'),
                'estado' => $proforma->estado,
                'total' => (float) $proforma->total,
                'moneda' => 'BOB', // Bolivianos
                'cantidad_items' => $proforma->detalles->count(),
                'total_productos' => (float) $proforma->detalles->sum('cantidad'),
                'tiene_reserva_activa' => $proforma->reservasActivas->count() > 0,
                'observaciones' => $proforma->observaciones,
                'observaciones_rechazo' => $proforma->observaciones_rechazo,
                // Resumen de items (primeros 3 productos)
                'items_preview' => $proforma->detalles->take(3)->map(function ($detalle) {
                    return [
                        'producto' => $detalle->producto->nombre,
                        'cantidad' => (float) $detalle->cantidad,
                    ];
                }),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'pedidos' => $pedidosTransformados,
                'paginacion' => [
                    'total' => $pedidos->total(),
                    'por_pagina' => $pedidos->perPage(),
                    'pagina_actual' => $pedidos->currentPage(),
                    'ultima_pagina' => $pedidos->lastPage(),
                    'desde' => $pedidos->firstItem(),
                    'hasta' => $pedidos->lastItem(),
                ],
                'resumen' => [
                    'total_pedidos' => $pedidos->total(),
                    'pendientes' => Proforma::where('cliente_id', $cliente->id)
                        ->where('estado', Proforma::PENDIENTE)
                        ->count(),
                    'aprobados' => Proforma::where('cliente_id', $cliente->id)
                        ->where('estado', Proforma::APROBADA)
                        ->count(),
                ],
            ],
        ]);
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
                try {
                    app(\App\Services\WebSocketNotificationService::class)
                        ->notifyProformaConfirmada($venta);
                } catch (\Exception $e) {
                    \Log::warning('Error enviando notificación WebSocket de confirmación', [
                        'venta_id' => $venta->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                \Log::info('Proforma confirmada como venta (API)', [
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

                \Log::error('Error al confirmar proforma como venta (API)', [
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
    public function convertirAVenta(Proforma $proforma)
    {
        return DB::transaction(function () use ($proforma) {
            try {
                // Validación 1: La proforma debe poder convertirse
                if (!$proforma->puedeConvertirseAVenta()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Esta proforma no puede convertirse a venta',
                        'estado_actual' => $proforma->estado,
                    ], 422);
                }

                // Validación 2: Verificar que tenga reservas activas
                $reservasActivas = $proforma->reservasActivas()->count();
                if ($reservasActivas === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No hay reservas de stock activas para esta proforma',
                    ], 422);
                }

                // Validación 3: Verificar que las reservas NO estén expiradas
                if ($proforma->tieneReservasExpiradas()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Las reservas de stock han expirado',
                    ], 422);
                }

                // Validación 4: Verificar disponibilidad de stock actual
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
                    // Estado del documento
                    'estado_documento_id' => \App\Models\EstadoDocumento::where('nombre', 'PENDIENTE')->first()?->id,
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

                // ✅ Emitir evento para notificaciones WebSocket
                event(new ProformaConvertida($proforma, $venta));

                \Log::info('Proforma convertida a venta exitosamente (API)', [
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

                \Log::error('Error al convertir proforma a venta (API)', [
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
                    'message' => 'Cliente no encontrado',
                    'data' => null,
                ], 404);
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
                    'message' => 'No hay carrito guardado',
                    'data' => null,
                ], 404);
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
            \Log::error('Error al obtener último carrito', [
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
}
