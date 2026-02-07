<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Proforma;
use App\Models\AperturaCaja;
use App\Models\CierreCaja;
use App\Events\ProformaCreada;
use App\Events\ProformaAprobada;
use App\Events\ProformaRechazada;
use App\Events\ProformaConvertida;
use App\Services\Venta\PrecioRangoProductoService;
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

        // NUEVO: Normalizar tipo_entrega (default: DELIVERY si no viene)
        if (!isset($requestData['tipo_entrega'])) {
            $requestData['tipo_entrega'] = 'DELIVERY';
        }

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

        // ✅ NUEVO: Normalizar política de pago (default: CONTRA_ENTREGA)
        if (!isset($requestData['politica_pago'])) {
            $requestData['politica_pago'] = 'CONTRA_ENTREGA';
        }

        $validator = Validator::make($requestData, [
            'cliente_id' => 'required|exists:clientes,id',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|exists:productos,id',
            'productos.*.cantidad' => 'required|numeric|min:1',
            // NUEVO: tipo_entrega es requerido
            'tipo_entrega' => 'required|in:DELIVERY,PICKUP',
            // ✅ NUEVO: Validación de política de pago
            'politica_pago' => 'sometimes|string|in:CONTRA_ENTREGA,ANTICIPADO_100,MEDIO_MEDIO,CREDITO',
            // Solicitud de entrega del cliente (REQUERIDO)
            'fecha_entrega_solicitada' => 'required|date|after_or_equal:today',
            'hora_entrega_solicitada' => 'nullable|date_format:H:i',
            'hora_entrega_solicitada_fin' => 'nullable|date_format:H:i',
            // MODIFICADO: Dirección solo requerida para DELIVERY
            'direccion_entrega_solicitada_id' => 'required_if:tipo_entrega,DELIVERY|nullable|exists:direcciones_cliente,id',
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

        // MODIFICADO: Validación condicional de dirección según tipo_entrega
        if ($requestData['tipo_entrega'] === 'DELIVERY') {
            // Para DELIVERY, la dirección es OBLIGATORIA
            if (!$request->filled('direccion_entrega_solicitada_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'La dirección de entrega es requerida para pedidos de tipo DELIVERY',
                ], 422);
            }

            // Validar que la dirección pertenece al cliente
            $direccion = \App\Models\DireccionCliente::findOrFail($request->direccion_entrega_solicitada_id);
            if ($direccion->cliente_id !== $request->cliente_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'La dirección seleccionada no pertenece al cliente',
                ], 422);
            }
        }
        // Para PICKUP, no se valida dirección (es null)

        DB::beginTransaction();
        try {
            // Obtener el cliente (por cliente_id, no por usuario autenticado)
            $cliente = Cliente::findOrFail($request->cliente_id);

            // ✅ NUEVO: Validar política de pago (si es CREDITO, validar permisos del cliente)
            if ($requestData['politica_pago'] === 'CREDITO') {
                if (!$cliente->puede_tener_credito) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre}' no tiene permiso para solicitar crédito",
                    ], 422);
                }

                if (!$cliente->limite_credito || $cliente->limite_credito <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre}' no tiene límite de crédito configurado",
                    ], 422);
                }
            }

            // ✅ Obtener el usuario autenticado que está creando la proforma
            // IMPORTANTE: usuario_creador_id debe ser el usuario autenticado ACTUAL, no el user_id del cliente
            $usuarioCreador = Auth::id(); // El usuario que CREA la proforma (quien hace la solicitud API)

            // ✅ NUEVO: Instanciar servicio de precios con rangos
            $precioRangoService = app(PrecioRangoProductoService::class);
            $empresaId = $cliente->empresa_id ?? auth()->user()->empresa_id ?? 1;

            // Calcular totales y verificar stock
            $subtotal = 0;
            $productosValidados = [];
            $stockInsuficiente = [];
            $detallesConRangos = [];

            foreach ($requestData['productos'] as $item) {
                $producto = Producto::with('stock')->findOrFail($item['producto_id']);
                $cantidad = (int) $item['cantidad'];

                // ✅ NUEVO: CALCULAR PRECIO EN BACKEND, considerando rangos de cantidad
                // El precio NO viene del cliente, se calcula en backend por seguridad
                $precioUnitario = $producto->obtenerPrecioConRango($cantidad, $empresaId);

                if (!$precioUnitario || $precioUnitario <= 0) {
                    throw new \Exception("El producto {$producto->nombre} no tiene precio definido para esta cantidad");
                }

                // Obtener información completa del rango (para logging y auditoría)
                $detallesRango = $producto->obtenerPrecioConDetallesRango($cantidad, $empresaId);

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

                $subtotalItem = $cantidad * $precioUnitario;
                $subtotal += $subtotalItem;

                $productosValidados[] = [
                    'producto_id' => $producto->id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotalItem,
                ];

                // ✅ Guardar detalles del rango para auditoría
                $detallesConRangos[] = array_merge($detallesRango, [
                    'producto_nombre' => $producto->nombre,
                ]);
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
                'estado_proforma_id' => 1, // ID del estado PENDIENTE en estados_logistica
                'canal_origen' => Proforma::CANAL_APP_EXTERNA,
                'tipo_entrega' => $requestData['tipo_entrega'], // NUEVO: DELIVERY o PICKUP
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'moneda_id' => 1, // Bolivianos por defecto
                // Usuario creador: el usuario asociado al cliente
                // IMPORTANTE: esto es user_id, NO cliente_id
                'usuario_creador_id' => $usuarioCreador,
                // ✅ NUEVO: Política de pago
                'politica_pago' => $requestData['politica_pago'],
                // Solicitud de entrega del cliente (usa campos normalizados)
                'fecha_entrega_solicitada' => $fechaEntrega,
                'hora_entrega_solicitada' => $horaEntrega,
                'hora_entrega_solicitada_fin' => $horaEntregaFin,
                // MODIFICADO: Dirección solo para DELIVERY (null para PICKUP)
                'direccion_entrega_solicitada_id' => $requestData['tipo_entrega'] === 'DELIVERY'
                    ? $requestData['direccion_entrega_solicitada_id']
                    : null,
            ]);

            // Crear detalles
            foreach ($productosValidados as $detalle) {
                $proforma->detalles()->create($detalle);
            }

            // ✅ RESERVAR STOCK AHORA que los detalles existen
            $reservaExitosa = $proforma->reservarStock();
            if (!$reservaExitosa) {
                Log::warning('⚠️  No se pudieron reservar todos los productos para proforma ' . $proforma->numero);
            }

            // Cargar relaciones para respuesta
            $proforma->load(['detalles.producto.imagenes', 'cliente.localidad', 'direccionSolicitada', 'direccionConfirmada']);

            DB::commit();

            // ✅ Emitir evento para notificaciones WebSocket
            event(new ProformaCreada($proforma));

            // ✅ NUEVO: Incluir información de rangos de precios en la respuesta
            return response()->json([
                'success' => true,
                'message' => 'Proforma creada exitosamente. Será revisada por nuestro equipo.',
                'data' => [
                    'proforma' => $proforma,
                    'numero' => $proforma->numero,
                    'total' => $proforma->total,
                    'estado' => $proforma->estado,
                    'politica_pago' => $proforma->politica_pago,  // ✅ Incluir política de pago en respuesta
                    'detalles_rangos' => $detallesConRangos,  // ✅ Información de rangos aplicados
                    'subtotal' => $subtotal,
                    'impuesto' => $impuesto,
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

        $proforma->load([
            'detalles.producto.imagenes',  // ✅ AGREGADO: Cargar imágenes del producto
            'cliente.localidad',  // ✅ ACTUALIZADO: Cargar localidad del cliente
            'usuarioCreador',
            'usuarioAprobador',
            'estadoLogistica',  // ✅ AGREGADO: Cargar relación de estado
            'venta'  // ✅ NUEVO: Cargar venta relacionada (cuando está CONVERTIDA)
        ]);

        return response()->json([
            'success' => true,
            'data' => $proforma,
        ]);
    }

    // ✅ NUEVO: Actualizar una proforma existente (PUT)
    public function update(Request $request, Proforma $proforma)
    {
        // Verificar que la proforma pertenece al cliente autenticado
        if (Auth::user()->cliente_id && $proforma->cliente_id !== Auth::user()->cliente_id) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para actualizar esta proforma',
            ], 403);
        }

        // Validar que la proforma está en estado PENDIENTE
        if ($proforma->estado !== 'PENDIENTE') {
            return response()->json([
                'success' => false,
                'message' => "No se puede actualizar una proforma en estado {$proforma->estado}. Solo se pueden actualizar proformas PENDIENTES.",
            ], 422);
        }

        // Normalizar los datos del request
        $requestData = $request->all();

        // Normalizar tipo_entrega (default: DELIVERY si no viene)
        if (!isset($requestData['tipo_entrega'])) {
            $requestData['tipo_entrega'] = $proforma->tipo_entrega ?? 'DELIVERY';
        }

        // Si viene fecha_programada, convertir a fecha_entrega_solicitada
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

        // Si viene hora_inicio_preferida
        if ($request->filled('hora_inicio_preferida') && !$request->filled('hora_entrega_solicitada')) {
            $requestData['hora_entrega_solicitada'] = $request->hora_inicio_preferida;
        }

        // Si viene hora_fin_preferida
        if ($request->filled('hora_fin_preferida') && !$request->filled('hora_entrega_solicitada_fin')) {
            $requestData['hora_entrega_solicitada_fin'] = $request->hora_fin_preferida;
        }

        // Normalizar política de pago
        if (!isset($requestData['politica_pago'])) {
            $requestData['politica_pago'] = $proforma->politica_pago ?? 'CONTRA_ENTREGA';
        }

        $validator = Validator::make($requestData, [
            'cliente_id' => 'sometimes|exists:clientes,id',
            'productos' => 'sometimes|array|min:1',
            'productos.*.producto_id' => 'required_with:productos|exists:productos,id',
            'productos.*.cantidad' => 'required_with:productos|numeric|min:1',
            'tipo_entrega' => 'sometimes|in:DELIVERY,PICKUP',
            'politica_pago' => 'sometimes|string|in:CONTRA_ENTREGA,ANTICIPADO_100,MEDIO_MEDIO,CREDITO',
            'fecha_entrega_solicitada' => 'sometimes|date',
            'hora_entrega_solicitada' => 'nullable|date_format:H:i',
            'hora_entrega_solicitada_fin' => 'nullable|date_format:H:i',
            'direccion_entrega_solicitada_id' => 'required_if:tipo_entrega,DELIVERY|nullable|exists:direcciones_cliente,id',
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
            // Obtener el cliente (puede ser el mismo o uno nuevo)
            $clienteId = $requestData['cliente_id'] ?? $proforma->cliente_id;
            $cliente = Cliente::findOrFail($clienteId);

            // Validar política de pago si es CREDITO
            if ($requestData['politica_pago'] === 'CREDITO') {
                if (!$cliente->puede_tener_credito) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre}' no tiene permiso para solicitar crédito",
                    ], 422);
                }

                if (!$cliente->limite_credito || $cliente->limite_credito <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre}' no tiene límite de crédito configurado",
                    ], 422);
                }
            }

            // Validación condicional de dirección según tipo_entrega
            if ($requestData['tipo_entrega'] === 'DELIVERY') {
                if (!$request->filled('direccion_entrega_solicitada_id')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La dirección de entrega es requerida para pedidos de tipo DELIVERY',
                    ], 422);
                }

                // Validar que la dirección pertenece al cliente
                $direccion = \App\Models\DireccionCliente::findOrFail($request->direccion_entrega_solicitada_id);
                if ($direccion->cliente_id !== $clienteId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La dirección seleccionada no pertenece al cliente',
                    ], 422);
                }
            }

            // Servicio de precios con rangos
            $precioRangoService = app(PrecioRangoProductoService::class);
            $empresaId = $cliente->empresa_id ?? auth()->user()->empresa_id ?? 1;

            // Calcular totales con los nuevos productos
            $subtotal = 0;
            $productosValidados = [];
            $stockInsuficiente = [];

            if ($request->filled('productos')) {
                foreach ($requestData['productos'] as $item) {
                    $producto = Producto::with('stock')->findOrFail($item['producto_id']);
                    $cantidad = (int) $item['cantidad'];

                    // Calcular precio con rangos
                    $precioUnitario = $producto->obtenerPrecioConRango($cantidad, $empresaId);

                    if (!$precioUnitario || $precioUnitario <= 0) {
                        throw new \Exception("El producto {$producto->nombre} no tiene precio definido para esta cantidad");
                    }

                    // Verificar stock disponible
                    // NOTA: Al actualizar, sumamos el stock de la proforma antigua
                    $stockDisponible = $producto->stock()->sum('cantidad_disponible');
                    // Agregar de vuelta la cantidad que ya estaba reservada en esta proforma
                    $cantidadReservadaAnterior = $proforma->detalles()
                        ->where('producto_id', $producto->id)
                        ->sum('cantidad');
                    $stockDisponible += $cantidadReservadaAnterior;

                    if ($stockDisponible < $cantidad) {
                        $stockInsuficiente[] = [
                            'producto' => $producto->nombre,
                            'requerido' => $cantidad,
                            'disponible' => $stockDisponible,
                            'faltante' => $cantidad - $stockDisponible,
                        ];
                    }

                    $subtotalItem = $cantidad * $precioUnitario;
                    $subtotal += $subtotalItem;

                    $productosValidados[] = [
                        'producto_id' => $producto->id,
                        'cantidad' => $cantidad,
                        'precio_unitario' => $precioUnitario,
                        'subtotal' => $subtotalItem,
                    ];
                }

                if (!empty($stockInsuficiente)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Stock insuficiente para algunos productos',
                        'productos_sin_stock' => $stockInsuficiente,
                    ], 422);
                }
            } else {
                // Si no vienen productos, mantener los existentes
                foreach ($proforma->detalles as $detalle) {
                    $subtotal += $detalle->subtotal;
                    $productosValidados[] = [
                        'producto_id' => $detalle->producto_id,
                        'cantidad' => $detalle->cantidad,
                        'precio_unitario' => $detalle->precio_unitario,
                        'subtotal' => $detalle->subtotal,
                    ];
                }
            }

            // Calcular impuestos
            $impuesto = $subtotal * 0.13;
            $total = $subtotal;

            // Actualizar campos de cabecera
            $proforma->update([
                'cliente_id' => $clienteId,
                'tipo_entrega' => $requestData['tipo_entrega'],
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'politica_pago' => $requestData['politica_pago'],
                'observaciones' => $requestData['observaciones'] ?? $proforma->observaciones,
            ]);

            // Actualizar información de entrega solicitada
            if ($request->filled('fecha_entrega_solicitada')) {
                $proforma->fecha_entrega_solicitada = $requestData['fecha_entrega_solicitada'];
            }
            if ($request->filled('hora_entrega_solicitada')) {
                $proforma->hora_entrega_solicitada = $requestData['hora_entrega_solicitada'];
            }
            if ($request->filled('hora_entrega_solicitada_fin')) {
                $proforma->hora_entrega_solicitada_fin = $requestData['hora_entrega_solicitada_fin'];
            }

            // Actualizar dirección solo si es DELIVERY
            if ($requestData['tipo_entrega'] === 'DELIVERY' && $request->filled('direccion_entrega_solicitada_id')) {
                $proforma->direccion_entrega_solicitada_id = $requestData['direccion_entrega_solicitada_id'];
            } elseif ($requestData['tipo_entrega'] === 'PICKUP') {
                $proforma->direccion_entrega_solicitada_id = null;
            }

            $proforma->save();

            // Actualizar detalles: eliminar viejos y crear nuevos (solo si vienen productos)
            if ($request->filled('productos')) {
                $proforma->detalles()->delete();
                foreach ($productosValidados as $detalle) {
                    $proforma->detalles()->create($detalle);
                }

                // Liberar y regenerar reservas de stock
                $proforma->liberarReservas();
                $reservaExitosa = $proforma->reservarStock();
                if (!$reservaExitosa) {
                    \Log::warning('⚠️  No se pudieron reservar todos los productos para proforma ' . $proforma->numero);
                }
            }

            // Cargar relaciones para respuesta
            $proforma->load(['detalles.producto.imagenes', 'cliente.localidad', 'direccionSolicitada', 'direccionConfirmada']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proforma actualizada exitosamente',
                'data' => [
                    'proforma' => $proforma,
                    'numero' => $proforma->numero,
                    'total' => $proforma->total,
                    'estado' => $proforma->estado,
                    'politica_pago' => $proforma->politica_pago,
                    'subtotal' => $subtotal,
                    'impuesto' => $impuesto,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error actualizando proforma',
                'error' => $e->getMessage(),
            ], 500);
        }
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
            Log::warning('API Index Proformas: No authenticated user found', [
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
            Log::warning('API Index Proformas: User inactive', [
                'user_id' => $user->id,
                'user_name' => $user->name,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Usuario inactivo. Contacte al administrador.',
            ], 403);
        }

        // Validar parámetros opcionales
        // 🔑 ARREGLADO: Usar validación dinámica basada en estados_logistica
        $estadosValidos = DB::table('estados_logistica')
            ->where('categoria', 'proforma')
            ->pluck('codigo')
            ->implode(',');

        $validator = Validator::make($request->all(), [
            'estado' => 'nullable|in:' . $estadosValidos,
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

        // 🔑 ARREGLADO: Buscar dinámicamente en estados_logistica por código
        if ($request->filled('estado')) {
            $estadoCode = strtoupper($request->estado);

            // Buscar el estado en la tabla estados_logistica
            // Soporta cualquier estado: PENDIENTE, APROBADA, EN_RUTA, etc.
            $estadoId = DB::table('estados_logistica')
                ->where('codigo', $estadoCode)
                ->where('categoria', 'proforma')
                ->value('id');

            if ($estadoId) {
                $query->where('estado_proforma_id', $estadoId);
            }
            // Si no existe el estado, simplemente no aplica el filtro
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
            'estadoLogistica',
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
                            // ✅ MODIFICADO: Devolver objeto estado completo en lugar de solo código
                            'estado' => $proforma->estadoLogistica ? [
                                'id' => $proforma->estadoLogistica->id,
                                'codigo' => $proforma->estadoLogistica->codigo,
                                'nombre' => $proforma->estadoLogistica->nombre,
                                'color' => $proforma->estadoLogistica->color,
                                'icono' => $proforma->estadoLogistica->icono,
                                'categoria' => $proforma->estadoLogistica->categoria,
                            ] : null,
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
            Log::warning('API Stats: No authenticated user found', [
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
            Log::warning('API Stats: User inactive', [
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
        if (array_intersect(['Gestor Logística', 'admin', 'Admin', 'Cajero', 'Manager', 'encargado', 'Chofer'], $userRoles)) {
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

            // Por estado (usando FK estado_proforma_id)
            $porEstado = (clone $query)
                ->selectRaw('estado_proforma_id, COUNT(*) as cantidad, SUM(total) as monto_total')
                ->groupBy('estado_proforma_id')
                ->with('estadoLogistica')
                ->get()
                ->keyBy('estado_proforma_id');

            // Por canal origen
            $porCanal = (clone $query)
                ->selectRaw('canal_origen, COUNT(*) as cantidad')
                ->groupBy('canal_origen')
                ->get()
                ->keyBy('canal_origen');

            // Obtener IDs de estados PENDIENTE y APROBADA
            $estadoPendiente = Proforma::obtenerIdEstado('PENDIENTE', 'proforma');
            $estadoAprobada = Proforma::obtenerIdEstado('APROBADA', 'proforma');

            // Construir array de estados válidos (filtrar nulls)
            $estadosActivos = array_filter([$estadoPendiente, $estadoAprobada]);

            // proformas vencidas (PENDIENTE o APROBADA con fecha_vencimiento < now)
            $vencidas = (clone $query)
                ->whereIn('estado_proforma_id', $estadosActivos)
                ->where('fecha_vencimiento', '<', now())
                ->count();

            // proformas por vencer (próximos 2 días)
            $porVencer = (clone $query)
                ->whereIn('estado_proforma_id', $estadosActivos)
                ->whereBetween('fecha_vencimiento', [now(), now()->addDays(2)])
                ->count();

            // Monto total por estado
            $montoTotal = $query->sum('total');

            // Obtener IDs de estados para mapeo
            $estadoIds = [
                'pendiente' => Proforma::obtenerIdEstado('PENDIENTE', 'proforma'),
                'aprobada' => Proforma::obtenerIdEstado('APROBADA', 'proforma'),
                'rechazada' => Proforma::obtenerIdEstado('RECHAZADA', 'proforma'),
                'convertida' => Proforma::obtenerIdEstado('CONVERTIDA', 'proforma'),
                'vencida' => Proforma::obtenerIdEstado('VENCIDA', 'proforma'),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'por_estado' => [
                        'pendiente' => $porEstado->get($estadoIds['pendiente'])?->cantidad ?? 0,
                        'aprobada' => $porEstado->get($estadoIds['aprobada'])?->cantidad ?? 0,
                        'rechazada' => $porEstado->get($estadoIds['rechazada'])?->cantidad ?? 0,
                        'convertida' => $porEstado->get($estadoIds['convertida'])?->cantidad ?? 0,
                        'vencida' => $porEstado->get($estadoIds['vencida'])?->cantidad ?? 0,
                    ],
                    'montos_por_estado' => [
                        'pendiente' => (float) ($porEstado->get($estadoIds['pendiente'])?->monto_total ?? 0),
                        'aprobada' => (float) ($porEstado->get($estadoIds['aprobada'])?->monto_total ?? 0),
                        'rechazada' => (float) ($porEstado->get($estadoIds['rechazada'])?->monto_total ?? 0),
                        'convertida' => (float) ($porEstado->get($estadoIds['convertida'])?->monto_total ?? 0),
                        'vencida' => (float) ($porEstado->get($estadoIds['vencida'])?->monto_total ?? 0),
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
                'estado_codigo' => $proforma->estadoLogistica?->codigo,
                'estado_nombre' => $proforma->estadoLogistica?->nombre,
                'estado_id' => $proforma->estado_proforma_id,
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
        // 🔧 Cargar la relación estadoLogistica para el accessor
        $proforma->load('estadoLogistica');

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
                // 🔧 Soportar ambos formatos H:i y H:i:s
                $horaRequestFormat = str_contains($request->hora_entrega_confirmada, ':') && substr_count($request->hora_entrega_confirmada, ':') == 2 ? 'H:i:s' : 'H:i';
                $horaConfirmada = \Carbon\Carbon::createFromFormat($horaRequestFormat, $request->hora_entrega_confirmada);
                $fechaConfirmada = \Carbon\Carbon::parse($request->fecha_entrega_confirmada);
                $diaSemana = $fechaConfirmada->dayOfWeek;

                // Obtener ventanas del cliente
                $ventanas = $proforma->cliente->ventanasEntrega()
                    ->where('dia_semana', $diaSemana)
                    ->where('activo', true)
                    ->first();

                if ($ventanas) {
                    // Los campos hora_inicio y hora_fin ahora vienen como string en formato 'H:i:s'
                    // Usar 'H:i:s' para soportar segundos, o 'H:i' si no los tiene
                    $format = str_contains($ventanas->hora_inicio, ':') && substr_count($ventanas->hora_inicio, ':') == 2 ? 'H:i:s' : 'H:i';
                    $horaInicio = \Carbon\Carbon::createFromFormat($format, $ventanas->hora_inicio);
                    $horaFin = \Carbon\Carbon::createFromFormat($format, $ventanas->hora_fin);

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
                'data' => $proforma->fresh(['detalles.producto', 'cliente', 'direccionConfirmada', 'direccionSolicitada', 'estadoLogistica']),
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
        // 🔧 Cargar la relación estadoLogistica para el accessor
        $proforma->load('estadoLogistica');

        $request->validate([
            'comentario' => 'required|string|max:500',
        ]);

        try {
            // ✅ Permitir rechazar proformas en estados: PENDIENTE, APROBADA, VENCIDA
            if (!in_array($proforma->estado, ['PENDIENTE', 'APROBADA', 'VENCIDA'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden rechazar proformas en estados PENDIENTE, APROBADA o VENCIDA',
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
                'estado_proforma_id' => 1, // ID = 1 para PENDIENTE
                'canal_origen' => Proforma::CANAL_APP_EXTERNA,
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'moneda_id' => 1, // Bolivianos por defecto
                'observaciones' => $request->observaciones,
                'usuario_creador_id' => Auth::id(),  // ✅ Usuario autenticado que crea la proforma
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
            Proforma::CONVERTIDA => 'Tu pedido ha sido confirmado y está en proceso de entrega',
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
            Proforma::CONVERTIDA => '#2196F3', // Azul
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
            Proforma::CONVERTIDA => 'truck',
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
        // 🔧 Cargar la relación estadoLogistica para el accessor
        $proforma->load('estadoLogistica');

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
                    // ✅ Estado del documento: APROBADO (ID=3) cuando se convierte proforma aprobada a venta
                    'estado_documento_id' => \App\Models\EstadoDocumento::where('codigo', 'APROBADO')
                        ->where('activo', true)
                        ->first()?->id ?? 3,
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
        // 🔧 Cargar la relación estadoLogistica para el accessor
        $proforma->load('estadoLogistica');

        // ✅ MEJORADO: Validar datos de pago si se proporcionan
        // Ahora incluye CREDITO en las políticas permitidas
        if ($request->input('con_pago')) {
            $request->validate([
                'tipo_pago_id' => 'required_unless:politica_pago,CREDITO|exists:tipos_pago,id',
                'politica_pago' => 'required|in:CONTRA_ENTREGA,ANTICIPADO_100,MEDIO_MEDIO,CREDITO',
                'monto_pagado' => 'nullable|numeric|min:0',
            ]);
        }

        return DB::transaction(function () use ($proforma, $request) {
            try {
                // ⭐ VALIDACIÓN PRINCIPAL: Caja abierta O consolidada es OBLIGATORIA para TODAS las conversiones
                $usuario = request()->user();
                $politica = $request->input('politica_pago') ?? 'CONTRA_ENTREGA';
                $montoPagado = (float) ($request->input('monto_pagado') ?? 0);

                // ✅ VALIDACIÓN: Caja abierta HOY (sin importar si es admin o cajero)
                $cajaAbiertaHoy = AperturaCaja::where('user_id', $usuario->id)
                    ->whereDoesntHave('cierre')
                    ->exists();

                // ✅ VALIDACIÓN: Caja consolidada en últimas 24h
                $cierreConsolidadoReciente = CierreCaja::where('user_id', $usuario->id)
                    ->whereHas('estadoCierre', function ($q) {
                        $q->where('codigo', 'CONSOLIDADA');
                    })
                    ->whereDate('fecha', '>=', now()->subDay())
                    ->whereDate('fecha', '<=', now())
                    ->exists();

                // ❌ Si no tiene caja abierta NI caja consolidada → RECHAZAR
                if (!$cajaAbiertaHoy && !$cierreConsolidadoReciente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No puede convertir proforma a venta sin una caja abierta o consolidada del día anterior. Por favor, abra una caja primero.',
                        'code' => 'CAJA_NO_DISPONIBLE',
                        'detalles' => [
                            'politica_pago' => $politica,
                            'monto_pagado' => $montoPagado,
                            'motivo' => 'Requiere caja abierta HOY o consolidada en las últimas 24 horas',
                            'accion_requerida' => 'Abra una caja en /cajas antes de convertir esta proforma',
                        ],
                    ], 422);
                }

                // ✅ Log: Validación de caja exitosa
                $estadoCajaActual = $cajaAbiertaHoy ? 'ABIERTA' : 'CONSOLIDADA_RECIENTE';

                Log::info('✅ [ApiProformaController::convertirAVenta] Validación de caja exitosa', [
                    'proforma_id' => $proforma->id,
                    'usuario_id' => $usuario->id,
                    'estado_caja' => $estadoCajaActual,
                    'politica' => $politica,
                    'monto' => $montoPagado,
                ]);

                // ✅ VALIDACIÓN 0.2: Si la política es CREDITO, validar permisos del cliente
                if ($politica === 'CREDITO') {
                    $cliente = $proforma->cliente;

                    if (!$cliente->puede_tener_credito) {
                        Log::warning('⚠️ Cliente no tiene permiso de crédito', [
                            'cliente_id' => $cliente->id,
                            'proforma_id' => $proforma->id,
                        ]);

                        return response()->json([
                            'success' => false,
                            'message' => "El cliente '{$cliente->nombre}' no tiene permiso para solicitar crédito",
                            'code' => 'CLIENTE_SIN_PERMISO_CREDITO',
                        ], 422);
                    }

                    if (!$cliente->limite_credito || $cliente->limite_credito <= 0) {
                        Log::warning('⚠️ Cliente sin límite de crédito', [
                            'cliente_id' => $cliente->id,
                            'proforma_id' => $proforma->id,
                        ]);

                        return response()->json([
                            'success' => false,
                            'message' => "El cliente '{$cliente->nombre}' no tiene límite de crédito configurado",
                            'code' => 'CLIENTE_SIN_LIMITE_CREDITO',
                        ], 422);
                    }

                    // Calcular saldo disponible
                    $saldoDisponible = $cliente->calcularSaldoDisponible();
                    $totalProforma = (float) $proforma->total;

                    if ($saldoDisponible < $totalProforma) {
                        return response()->json([
                            'success' => false,
                            'message' => "Crédito insuficiente para esta venta",
                            'code' => 'CREDITO_INSUFICIENTE',
                            'datos' => [
                                'monto_venta' => $totalProforma,
                                'saldo_disponible' => $saldoDisponible,
                                'limite_credito' => (float) $cliente->limite_credito,
                            ],
                        ], 422);
                    }
                }

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

                    // ✅ SIMPLIFICADO: Si hay reservas activas NO expiradas, no validar disponibilidad
                    // Las reservas ya garantizan que el stock existe para esta proforma
                    Log::info('✅ Proforma tiene reservas activas, continuando conversión sin validar stock disponible', [
                        'proforma_id' => $proforma->id,
                        'reservas_activas' => $reservasActivas,
                    ]);
                } else {
                    // NO hay reservas: intentar crearlas automáticamente
                    Log::info('⚠️  No hay reservas para proforma ' . $proforma->numero . ', intentando crearlas...');

                    $reservasCreadas = $proforma->reservarStock();

                    if (!$reservasCreadas) {
                        return response()->json([
                            'success' => false,
                            'message' => 'No se pudieron crear reservas de stock. Verifique la disponibilidad de inventario.',
                        ], 422);
                    }

                    Log::info('✅ Reservas creadas automáticamente para proforma ' . $proforma->numero);
                }

                // ✅ MEJORADO: Calcular estado de pago según política
                // Ahora considera todas las políticas: CONTRA_ENTREGA, ANTICIPADO_100, MEDIO_MEDIO, CREDITO
                // Nota: $montoPagado y $politica ya fueron definidas en VALIDACIÓN 0.1
                $total = (float) $proforma->total;

                // Lógica mejorada para determinar estado de pago según política
                $estadoPago = match($politica) {
                    // CREDITO: No requiere pago inmediato, se registra como cuenta por cobrar
                    'CREDITO' => 'PENDIENTE',

                    // ANTICIPADO_100: Requiere 100% de pago, si se pagó todo = PAGADO
                    'ANTICIPADO_100' => ($montoPagado >= $total) ? 'PAGADO' : 'PARCIAL',

                    // MEDIO_MEDIO: Requiere 50% mínimo
                    // Si se pagó el 100% = PAGADO
                    // Si se pagó entre 50%-100% = PARCIAL
                    // Si se pagó menos de 50% = PENDIENTE
                    'MEDIO_MEDIO' => match(true) {
                        $montoPagado >= $total => 'PAGADO',
                        $montoPagado >= ($total / 2) => 'PARCIAL',
                        default => 'PENDIENTE',
                    },

                    // CONTRA_ENTREGA: Se paga en la entrega, siempre inicia como PENDIENTE
                    'CONTRA_ENTREGA' => 'PENDIENTE',

                    // Default: PENDIENTE (seguridad)
                    default => 'PENDIENTE',
                };

                // NUEVO: Determinar requiere_envio y estado_logistico según tipo_entrega
                $tipoEntrega = $proforma->tipo_entrega ?? 'DELIVERY';
                $requiereEnvio = $tipoEntrega === 'DELIVERY';

                // REFACTORIZADO: Obtener IDs de estados en lugar de strings ENUM
                if ($tipoEntrega === 'PICKUP') {
                    $estadoLogisticoId = \App\Models\Venta::obtenerIdEstado('PENDIENTE_RETIRO', 'venta_logistica');
                } else {
                    // DELIVERY
                    $estadoLogisticoId = \App\Models\Venta::obtenerIdEstado('PENDIENTE_ENVIO', 'venta_logistica');
                }

                if (!$estadoLogisticoId) {
                    throw new \Exception('No se encontraron los estados logísticos requeridos en la base de datos');
                }

                // ✅ NUEVO: Calcular peso total desde detalles
                // Fórmula: pesoTotal = Σ(cantidad × peso_producto)
                $pesoTotal = 0;
                foreach ($proforma->detalles as $detalle) {
                    $pesoProducto = $detalle->producto?->peso ?? 0;
                    $pesoTotal += $detalle->cantidad * $pesoProducto;
                }

                // Preparar datos para la venta desde la proforma
                $datosVenta = [
                    'numero' => \App\Models\Venta::generarNumero(),
                    'fecha' => now()->toDateString(),
                    'subtotal' => $proforma->subtotal,
                    'descuento' => $proforma->descuento ?? 0,
                    'impuesto' => $proforma->impuesto,
                    'total' => $proforma->total,
                    'peso_total_estimado' => $pesoTotal,  // ✅ NUEVO: Pasar peso calculado
                    'observaciones' => $proforma->observaciones,
                    'cliente_id' => $proforma->cliente_id,
                    'usuario_id' => request()->user()->id,
                    'moneda_id' => $proforma->moneda_id,
                    'proforma_id' => $proforma->id,
                    // Campos de logística
                    'tipo_entrega' => $tipoEntrega, // NUEVO
                    'requiere_envio' => $requiereEnvio, // MODIFICADO
                    'canal_origen' => $proforma->canal_origen,
                    'estado_logistico_id' => $estadoLogisticoId, // REFACTORIZADO: Ahora es FK
                    // Campos de entrega comprometida (desde coordinación de proforma)
                    // MODIFICADO: Solo para DELIVERY (null para PICKUP)
                    'direccion_cliente_id' => $tipoEntrega === 'DELIVERY'
                        ? ($proforma->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_solicitada_id)
                        : null,
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
                    // ✅ Estado del documento: APROBADO (ID=3) cuando se convierte proforma aprobada a venta
                    'estado_documento_id' => \App\Models\EstadoDocumento::where('codigo', 'APROBADO')
                        ->where('activo', true)
                        ->first()?->id ?? 3,
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
                if (!$proforma->marcarComoConvertida()) {
                    throw new \Exception('Error al marcar la proforma como convertida');
                }

                // ✅ CRÍTICO: Consumir reservas DIRECTAMENTE (no confiar en Observer en transacción)
                // El Observer puede no dispararse dentro de una transacción en algunos casos
                Log::info('🔄 [ApiProformaController::convertirAVenta] Consumiendo reservas después de convertida', [
                    'proforma_id' => $proforma->id,
                ]);

                try {
                    $proforma->consumirReservas();
                    Log::info('✅ [ApiProformaController::convertirAVenta] Reservas consumidas exitosamente', [
                        'proforma_id' => $proforma->id,
                    ]);
                } catch (\Exception $e) {
                    Log::error('❌ [ApiProformaController::convertirAVenta] Error al consumir reservas', [
                        'proforma_id' => $proforma->id,
                        'error' => $e->getMessage(),
                    ]);
                    throw $e;
                }

                // ✅ NUEVO: Registrar movimiento de caja para pagos inmediatos (anticipados) y créditos
                // Se registra para políticas: ANTICIPADO_100, MEDIO_MEDIO, CREDITO
                if (in_array($politica, ['ANTICIPADO_100', 'MEDIO_MEDIO', 'CREDITO'])) {
                    $this->registrarMovimientoCajaParaPago(
                        $venta,
                        $proforma,
                        $politica,
                        $montoPagado,
                        request()->user()
                    );
                }

                // ✅ NUEVO: Registrar pago en tabla pagos SOLO para políticas de pago inmediato
                // Se registra SOLO para: ANTICIPADO_100, MEDIO_MEDIO
                // NO se registra para: CREDITO, CONTRA_ENTREGA (esas se crean en CrearCuentaPorCobrarListener)
                if (in_array($politica, ['ANTICIPADO_100', 'MEDIO_MEDIO'])) {
                    $this->registrarPagoEnVenta(
                        $venta,
                        $proforma,
                        $politica,
                        $montoPagado,
                        $request->input('tipo_pago_id'),
                        request()->user()
                    );
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

                // ✅ MEJORADO: Log detallado con información de política de pago
                Log::info('✅ Proforma convertida a venta exitosamente (API)', [
                    'proforma_id' => $proforma->id,
                    'proforma_numero' => $proforma->numero,
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'cliente_id' => $venta->cliente_id,
                    'cliente_nombre' => $venta->cliente->nombre,
                    'total' => (float) $venta->total,
                    'politica_pago' => $politica,
                    'estado_pago' => $estadoPago,
                    'monto_pagado' => $montoPagado,
                    'monto_pendiente' => (float) ($total - $montoPagado),
                    'requiere_envio' => $venta->requiere_envio,
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
                            // ✅ NUEVO: Información de pago
                            'pago' => [
                                'politica_pago' => $politica,
                                'estado_pago' => $estadoPago,
                                'monto_pagado' => $montoPagado,
                                'monto_pendiente' => (float) ($total - $montoPagado),
                            ],
                        ],
                        'proforma' => [
                            'id' => $proforma->id,
                            'numero' => $proforma->numero,
                            'estado' => $proforma->estado,
                            'politica_pago' => $proforma->politica_pago,
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
            // 🔑 ARREGLADO: Usar estado_proforma_id = 1 para PENDIENTE
            $proforma = Proforma::where('cliente_id', $cliente->id)
                ->where('estado_proforma_id', 1) // 1 = PENDIENTE
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
        elseif ($user->hasRole('Preventista')) {
            $query->where('usuario_creador_id', $user->id);
        }
        elseif ($user->hasAnyRole(['Gestor de Logística', 'Admin', 'Cajero', 'Manager', 'Chofer'])) {
            // Dashboard: todas las proformas
        }
        else {
            return Inertia::render('Error', [
                'message' => 'No tiene permisos para ver proformas',
                'status' => 403
            ]);
        }

        // Aplicar filtros opcionales
        // 🔑 ARREGLADO: Buscar dinámicamente en estados_logistica por código
        if ($request->filled('estado')) {
            $estadoCode = strtoupper($request->estado);

            // Buscar el estado en la tabla estados_logistica
            // Soporta cualquier estado: PENDIENTE, APROBADA, EN_RUTA, etc.
            $estadoId = DB::table('estados_logistica')
                ->where('codigo', $estadoCode)
                ->where('categoria', 'proforma')
                ->value('id');

            if ($estadoId) {
                $query->where('estado_proforma_id', $estadoId);
            }
            // Si no existe el estado, simplemente no aplica el filtro
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

    /**
     * API: Actualizar detalles de una proforma y recalcular totales
     *
     * POST /api/proformas/{proforma}/actualizar-detalles
     *
     * Body:
     * {
     *   "detalles": [
     *     { "id": 1, "producto_id": 137, "cantidad": 2, "precio_unitario": 12, "subtotal": 24 },
     *     { "id": 2, "producto_id": 2, "cantidad": 3, "precio_unitario": 32.4, "subtotal": 97.2 }
     *   ]
     * }
     */
    public function actualizarDetalles(Proforma $proforma, Request $request)
    {
        // 🔧 Cargar la relación estadoLogistica para el accessor
        $proforma->load('estadoLogistica');

        $request->validate([
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad' => 'required|numeric|min:0.01',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.subtotal' => 'required|numeric|min:0',
        ]);

        try {
            // Solo se pueden actualizar proformas en estado PENDIENTE
            if ($proforma->estado !== 'PENDIENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden actualizar detalles de proformas pendientes',
                ], 400);
            }

            // Obtener los detalles enviados
            $detallesActualizados = $request->input('detalles', []);

            // Inicializar contadores
            $subtotalNuevo = 0;
            $detallesGuardados = [];

            // Procesar cada detalle
            foreach ($detallesActualizados as $detalleData) {
                $producto_id = $detalleData['producto_id'];
                $cantidad = (float) $detalleData['cantidad'];
                $precio_unitario = (float) $detalleData['precio_unitario'];
                $subtotal = (float) $detalleData['subtotal'];

                // Validar que el producto existe
                $producto = \App\Models\Producto::findOrFail($producto_id);

                // Validar que el subtotal es cantidad * precio_unitario
                $subtotalCalculado = $cantidad * $precio_unitario;
                if (abs($subtotal - $subtotalCalculado) > 0.01) {
                    return response()->json([
                        'success' => false,
                        'message' => "El subtotal del producto {$producto->nombre} no coincide con cantidad × precio",
                    ], 422);
                }

                $subtotalNuevo += $subtotal;
                $detallesGuardados[] = [
                    'producto_id' => $producto_id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precio_unitario,
                    'descuento' => 0,
                    'subtotal' => $subtotal,
                ];
            }

            // Calcular totales
            $impuestoOriginal = $proforma->total > 0 ? ($proforma->impuesto / $proforma->subtotal) : 0.13;
            $impuestoNuevo = $subtotalNuevo * $impuestoOriginal;
            $totalNuevo = $subtotalNuevo + $impuestoNuevo;

            // Eliminar detalles antiguos
            $proforma->detalles()->delete();

            // Crear nuevos detalles
            foreach ($detallesGuardados as $detalle) {
                $proforma->detalles()->create($detalle);
            }

            // Actualizar la proforma con los nuevos totales
            $proforma->update([
                'subtotal' => $subtotalNuevo,
                'impuesto' => $impuestoNuevo,
                'total' => $totalNuevo,
            ]);

            // Recargar relaciones
            $proforma->load(['detalles.producto.imagenes', 'cliente.localidad', 'estadoLogistica']);

            return response()->json([
                'success' => true,
                'message' => 'Detalles actualizados correctamente',
                'data' => [
                    'proforma' => $proforma,
                    'subtotal_anterior' => $proforma->getOriginal('subtotal'),
                    'subtotal_nuevo' => $subtotalNuevo,
                    'total_anterior' => $proforma->getOriginal('total'),
                    'total_nuevo' => $totalNuevo,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error actualizando detalles de proforma:', [
                'proforma_id' => $proforma->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar detalles: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ NUEVO: Obtener la siguiente proforma pendiente
     *
     * Retorna la próxima proforma en estado PENDIENTE después de la proforma actual.
     * Útil para navegación continua sin volver al dashboard.
     *
     * @route GET /api/proformas/siguiente-pendiente
     * @queryParam current_id int - ID de la proforma actual (para excluir)
     * @queryParam incluir_stats bool - Incluir estadísticas (default: false)
     *
     * @return \Illuminate\Http\JsonResponse
     *
     * @example
     * GET /api/proformas/siguiente-pendiente?current_id=1
     * Response:
     * {
     *   "success": true,
     *   "existe_siguiente": true,
     *   "proforma": {
     *     "id": 2,
     *     "numero": "PR-002",
     *     "cliente_nombre": "Cliente XYZ",
     *     "total": 1500.00
     *   },
     *   "stats": {
     *     "pendientes_restantes": 14,
     *     "indice": "2 de 15"
     *   }
     * }
     */
    public function obtenerSiguientePendiente(Request $request)
    {
        try {
            $currentId = $request->input('current_id');
            $incluirStats = $request->boolean('incluir_stats', false);
            $usuario = Auth::user();

            if (!$currentId) {
                return response()->json([
                    'success' => false,
                    'message' => 'current_id es requerido',
                ], 400);
            }

            // Construir query base filtrando por estado PENDIENTE
            $queryBase = Proforma::where('estado', 'PENDIENTE')
                ->where('id', '!=', $currentId) // Excluir la actual
                ->orderBy('created_at', 'ASC'); // FIFO: la más antigua primero

            // ✅ Aplicar scope por rol (mismo que en index())
            // Los super admins ven todas, preventistas solo ven sus clientes
            $query = $queryBase->forCurrentUser();

            // Obtener la siguiente
            $siguienteProforma = $query->first();

            // Si se solicitan estadísticas
            $stats = null;
            // ✅ CORREGIDO: Solo calcular stats si existe siguiente proforma
            if ($incluirStats && $siguienteProforma) {
                // Total de pendientes (con el mismo filtro)
                $totalPendientes = Proforma::where('estado', 'PENDIENTE')
                    ->forCurrentUser()
                    ->count();

                // Índice: posición de la próxima en la lista
                // Contar cuántas proformas PENDIENTES fueron creadas antes que esta
                $indiceActual = Proforma::where('estado', 'PENDIENTE')
                    ->where('created_at', '<', $siguienteProforma->created_at)
                    ->forCurrentUser()
                    ->count() + 1;

                $stats = [
                    'pendientes_restantes' => max(0, $totalPendientes - $indiceActual),
                    'indice' => "{$indiceActual} de {$totalPendientes}",
                ];
            }

            // Responder
            if ($siguienteProforma) {
                // Eager load relación cliente y localidad si no está cargada
                if (!$siguienteProforma->relationLoaded('cliente')) {
                    $siguienteProforma->load('cliente.localidad');
                }

                return response()->json([
                    'success' => true,
                    'existe_siguiente' => true,
                    'proforma' => [
                        'id' => $siguienteProforma->id,
                        'numero' => $siguienteProforma->numero,
                        'cliente_nombre' => $siguienteProforma->cliente->nombre ?? 'Sin cliente',
                        'total' => (float) $siguienteProforma->total,
                        'fecha_creacion' => $siguienteProforma->created_at->format('d/m/Y H:i'),
                    ],
                    'stats' => $stats,
                ]);
            } else {
                return response()->json([
                    'success' => true,
                    'existe_siguiente' => false,
                    'mensaje' => 'No hay más proformas pendientes',
                    'stats' => null,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error al obtener siguiente proforma pendiente:', [
                'current_id' => $request->input('current_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener siguiente proforma: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ==========================================
    // MÉTODOS PRIVADOS: REGISTRO DE CAJAS
    // ==========================================

    /**
     * Registrar movimiento de caja para pagos inmediatos
     *
     * Registra los pagos/anticipos en la caja del usuario cuando se convierte
     * una proforma a venta con políticas que requieren pago inmediato:
     * - ANTICIPADO_100: 100% al contado
     * - MEDIO_MEDIO: 50% anticipo + 50% contra entrega
     *
     * @param \App\Models\Venta $venta Venta recién creada
     * @param \App\Models\Proforma $proforma Proforma original
     * @param string $politica Política de pago (ANTICIPADO_100, MEDIO_MEDIO, etc.)
     * @param float $montoPagado Monto pagado en la conversión
     * @param \App\Models\User $usuario Usuario que realiza la conversión
     *
     * @return void
     */
    private function registrarMovimientoCajaParaPago(
        \App\Models\Venta $venta,
        \App\Models\Proforma $proforma,
        string $politica,
        float $montoPagado,
        \App\Models\User $usuario
    ): void {
        // ✅ Solo registrar para políticas que requieren registro en caja
        // Incluye: pagos anticipados (100%, 50%) y créditos
        $politicasARegistrar = ['ANTICIPADO_100', 'MEDIO_MEDIO', 'CREDITO'];
        if (!in_array($politica, $politicasARegistrar)) {
            Log::info('⏭️ [registrarMovimientoCajaParaPago] Política no requiere registro', [
                'venta_id' => $venta->id,
                'politica' => $politica,
            ]);
            return;
        }

        // ✅ Para políticas de pago inmediato, validar que hay monto
        // Para crédito, puede ser 0
        if ($politica !== 'CREDITO' && $montoPagado <= 0) {
            Log::info('⏭️ [registrarMovimientoCajaParaPago] Sin monto a pagar, no registra movimiento', [
                'venta_id' => $venta->id,
                'proforma_id' => $proforma->id,
                'monto_pagado' => $montoPagado,
                'politica' => $politica,
            ]);
            return;
        }

        try {
            // ✅ MEJORADO: Usar CajaAbiertaService para obtener caja abierta (mismo que VentaController)
            $cajaAbiertaService = new \App\Services\CajaAbiertaService();
            $cajaAbierta = $cajaAbiertaService->obtenerAperturaAbierta();

            if (!$cajaAbierta) {
                Log::warning('⚠️ [registrarMovimientoCajaParaPago] Usuario no tiene caja abierta HOY', [
                    'usuario_id' => $usuario->id,
                    'usuario_nombre' => $usuario->name,
                    'usuario_roles' => $usuario->getRoleNames()->toArray(),
                    'venta_id' => $venta->id,
                    'proforma_id' => $proforma->id,
                    'politica' => $politica,
                    'monto' => $montoPagado,
                ]);

                // ✅ REGISTRAR EN AUDITORÍA: Intento fallido
                \App\Models\AuditoriaCaja::create([
                    'user_id' => $usuario->id,
                    'caja_id' => null,
                    'apertura_caja_id' => null,
                    'accion' => 'INTENTO_PAGO_SIN_CAJA',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo' => 'VENTA',
                    'exitosa' => false,
                    'detalle_operacion' => [
                        'venta_id' => $venta->id,
                        'proforma_id' => $proforma->id,
                        'politica' => $politica,
                        'monto_pagado' => $montoPagado,
                        'motivo' => 'Usuario no tiene caja abierta HOY',
                    ],
                    'codigo_http' => 422,
                    'mensaje_error' => 'Usuario no tiene caja abierta para registrar pago',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);

                return;
            }

            // Obtener el tipo de operación VENTA
            $tipoOperacion = \App\Models\TipoOperacionCaja::where('codigo', 'VENTA')->first();

            if (!$tipoOperacion) {
                Log::error('❌ [registrarMovimientoCajaParaPago] Tipo operación VENTA no existe', [
                    'venta_id' => $venta->id,
                ]);

                // ✅ REGISTRAR EN AUDITORÍA: Error de configuración
                \App\Models\AuditoriaCaja::create([
                    'user_id' => $usuario->id,
                    'caja_id' => $cajaAbierta->caja_id,
                    'apertura_caja_id' => $cajaAbierta->id,
                    'accion' => 'ERROR_OPERACION_NO_EXISTE',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo' => 'VENTA',
                    'exitosa' => false,
                    'detalle_operacion' => [
                        'venta_id' => $venta->id,
                        'proforma_id' => $proforma->id,
                        'motivo' => 'TipoOperacionCaja VENTA no existe en la BD',
                    ],
                    'codigo_http' => 500,
                    'mensaje_error' => 'Tipo operación VENTA no encontrado',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);

                return;
            }

            // Determinar descripción según la política
            $descripcionPolitica = match($politica) {
                'ANTICIPADO_100' => '100% ANTICIPADO',
                'MEDIO_MEDIO' => '50% ANTICIPO',
                'CREDITO' => 'VENTA A CRÉDITO',
                default => 'ANTICIPO'
            };

            // ✅ Crear movimiento de caja
            $movimiento = \App\Models\MovimientoCaja::create([
                'caja_id' => $cajaAbierta->caja_id,
                'user_id' => $usuario->id,
                'tipo_operacion_id' => $tipoOperacion->id,
                'numero_documento' => $venta->numero,
                'monto' => $montoPagado,
                'fecha' => now(),
                'observaciones' => "Venta #{$venta->numero} ({$descripcionPolitica}) - Convertida desde proforma #{$proforma->numero}",
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Éxito
            \App\Models\AuditoriaCaja::create([
                'user_id' => $usuario->id,
                'caja_id' => $cajaAbierta->caja_id,
                'apertura_caja_id' => $cajaAbierta->id,
                'accion' => 'PAGO_REGISTRADO',
                'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                'operacion_tipo' => 'VENTA',
                'exitosa' => true,
                'detalle_operacion' => [
                    'venta_id' => $venta->id,
                    'proforma_id' => $proforma->id,
                    'movimiento_caja_id' => $movimiento->id,
                    'caja_numero' => $cajaAbierta->caja?->nombre,
                    'politica' => $politica,
                    'monto_pagado' => $montoPagado,
                    'descripcion_politica' => $descripcionPolitica,
                ],
                'codigo_http' => 201,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            Log::info('✅ [registrarMovimientoCajaParaPago] Movimiento de caja registrado exitosamente', [
                'venta_id' => $venta->id,
                'proforma_id' => $proforma->id,
                'caja_id' => $cajaAbierta->caja_id,
                'caja_nombre' => $cajaAbierta->caja?->nombre,
                'usuario_id' => $usuario->id,
                'usuario_nombre' => $usuario->name,
                'monto' => $montoPagado,
                'politica' => $politica,
                'tipo_pago' => $descripcionPolitica,
                'movimiento_id' => $movimiento->id,
            ]);

        } catch (\Exception $e) {
            // No bloquear la conversión si falla el registro en cajas
            Log::error('❌ [registrarMovimientoCajaParaPago] Error al registrar movimiento de caja', [
                'venta_id' => $venta->id,
                'proforma_id' => $proforma->id,
                'usuario_id' => $usuario->id,
                'usuario_nombre' => $usuario->name,
                'monto' => $montoPagado,
                'politica' => $politica,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Error al registrar
            try {
                \App\Models\AuditoriaCaja::create([
                    'user_id' => $usuario->id,
                    'caja_id' => null,
                    'apertura_caja_id' => null,
                    'accion' => 'ERROR_REGISTRO_PAGO',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo' => 'VENTA',
                    'exitosa' => false,
                    'detalle_operacion' => [
                        'venta_id' => $venta->id,
                        'proforma_id' => $proforma->id,
                        'politica' => $politica,
                        'monto_pagado' => $montoPagado,
                    ],
                    'codigo_http' => 500,
                    'mensaje_error' => $e->getMessage(),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            } catch (\Exception $auditError) {
                Log::error('❌ [registrarMovimientoCajaParaPago] Error al registrar auditoría', [
                    'error_audit' => $auditError->getMessage(),
                ]);
            }

            // ⚠️ Importante: No relanzamos la excepción para no bloquear la conversión
            // El movimiento de caja es importante pero la venta ya está creada
        }
    }

    /**
     * ✅ Registrar pago en tabla pagos para TODAS las políticas de pago
     * Se registra para: ANTICIPADO_100, MEDIO_MEDIO, CREDITO, CONTRA_ENTREGA
     *
     * @param \App\Models\Venta $venta
     * @param \App\Models\Proforma $proforma
     * @param string $politica
     * @param float $montoPagado
     * @param int|null $tipoPagoId
     * @param \App\Models\User $usuario
     */
    private function registrarPagoEnVenta(
        \App\Models\Venta $venta,
        \App\Models\Proforma $proforma,
        string $politica,
        float $montoPagado,
        ?int $tipoPagoId,
        \App\Models\User $usuario
    ): void {
        try {
            // ✅ Determinar monto a registrar según política
            $montoRegistro = match($politica) {
                // Para anticipados: Registrar el monto pagado
                'ANTICIPADO_100' => $montoPagado,
                'MEDIO_MEDIO' => $montoPagado,
                // Para CREDITO y CONTRA_ENTREGA: Registrar 0 (no hay pago inmediato)
                'CREDITO' => 0,
                'CONTRA_ENTREGA' => 0,
                default => 0,
            };

            // ✅ Determinar tipo de pago según política si no se proporciona
            $tipoPagoFinal = $tipoPagoId;
            if (!$tipoPagoFinal && in_array($politica, ['CREDITO', 'CONTRA_ENTREGA'])) {
                // Para CREDITO y CONTRA_ENTREGA, obtener tipo de pago "PENDIENTE" o similar
                $tipoPagoDefault = \App\Models\TipoPago::where('codigo', 'PENDIENTE')
                    ->orWhere('nombre', 'Pendiente')
                    ->first();
                $tipoPagoFinal = $tipoPagoDefault?->id;
            }

            // Si aún no hay tipo_pago y el monto es 0, asignar tipo genérico
            if (!$tipoPagoFinal && $montoRegistro === 0) {
                $tipoPagoDefault = \App\Models\TipoPago::first();
                $tipoPagoFinal = $tipoPagoDefault?->id;
            }

            // ✅ Crear registro en tabla pagos
            $pago = \App\Models\Pago::create([
                'venta_id' => $venta->id,
                'tipo_pago_id' => $tipoPagoFinal,
                'monto' => $montoRegistro,
                'fecha' => now(),
                'fecha_pago' => now()->toDateString(),
                'observaciones' => "Pago por {$politica} - Convertida desde proforma #{$proforma->numero}",
                'usuario_id' => $usuario->id,
                'moneda_id' => $venta->moneda_id,
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Pago registrado exitosamente
            \App\Models\AuditoriaCaja::create([
                'user_id' => $usuario->id,
                'caja_id' => null,
                'apertura_caja_id' => null,
                'accion' => 'PAGO_REGISTRADO_EN_VENTA',
                'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                'operacion_tipo' => 'VENTA',
                'exitosa' => true,
                'detalle_operacion' => [
                    'venta_id' => $venta->id,
                    'proforma_id' => $proforma->id,
                    'pago_id' => $pago->id,
                    'politica' => $politica,
                    'monto_pagado' => $montoPagado,
                    'monto_registrado_tabla_pagos' => $montoRegistro,
                    'tipo_pago_id' => $tipoPagoFinal,
                ],
                'codigo_http' => 201,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            Log::info('✅ [registrarPagoEnVenta] Pago registrado en tabla pagos', [
                'venta_id' => $venta->id,
                'proforma_id' => $proforma->id,
                'pago_id' => $pago->id,
                'usuario_id' => $usuario->id,
                'usuario_nombre' => $usuario->name,
                'politica' => $politica,
                'monto_pagado' => $montoPagado,
                'monto_registrado' => $montoRegistro,
                'tipo_pago_id' => $tipoPagoFinal,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ [registrarPagoEnVenta] Error al registrar pago en tabla pagos', [
                'venta_id' => $venta->id,
                'proforma_id' => $proforma->id,
                'usuario_id' => $usuario->id,
                'usuario_nombre' => $usuario->name,
                'politica' => $politica,
                'monto_pagado' => $montoPagado,
                'tipo_pago_id' => $tipoPagoId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Error al registrar pago
            try {
                \App\Models\AuditoriaCaja::create([
                    'user_id' => $usuario->id,
                    'caja_id' => null,
                    'apertura_caja_id' => null,
                    'accion' => 'ERROR_REGISTRAR_PAGO_VENTA',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo' => 'VENTA',
                    'exitosa' => false,
                    'detalle_operacion' => [
                        'venta_id' => $venta->id,
                        'proforma_id' => $proforma->id,
                        'politica' => $politica,
                        'monto_pagado' => $montoPagado,
                    ],
                    'codigo_http' => 500,
                    'mensaje_error' => $e->getMessage(),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            } catch (\Exception $auditError) {
                Log::error('❌ [registrarPagoEnVenta] Error al registrar auditoría', [
                    'error_audit' => $auditError->getMessage(),
                ]);
            }

            // ⚠️ No relanzar excepción para no bloquear la conversión
        }
    }
}
