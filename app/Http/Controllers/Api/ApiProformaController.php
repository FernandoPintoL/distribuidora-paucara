<?php
namespace App\Http\Controllers\Api;

use App\Events\ProformaCreada;
use App\Events\ProformaRechazada;
use App\Http\Controllers\Controller;
use App\Models\AperturaCaja;
use App\Models\CierreCaja;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Proforma;
use App\Services\ComboStockService;
use App\Services\Reservas\ReservaDistribucionService;
use App\Services\Stock\StockService; // ✅ CORREGIDO: namespace correcto
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
        if (! isset($requestData['tipo_entrega'])) {
            $requestData['tipo_entrega'] = 'DELIVERY';
        }

        // Si viene fecha_programada (timestamp ISO8601), convertir a fecha
        if ($request->filled('fecha_programada') && ! $request->filled('fecha_entrega_solicitada')) {
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
        if ($request->filled('hora_inicio_preferida') && ! $request->filled('hora_entrega_solicitada')) {
            $requestData['hora_entrega_solicitada'] = $request->hora_inicio_preferida;
        }

        // Si viene hora_fin_preferida, usar como hora_entrega_solicitada_fin
        if ($request->filled('hora_fin_preferida') && ! $request->filled('hora_entrega_solicitada_fin')) {
            $requestData['hora_entrega_solicitada_fin'] = $request->hora_fin_preferida;
        }

        // ✅ NUEVO: Normalizar política de pago (default: CONTRA_ENTREGA)
        if (! isset($requestData['politica_pago'])) {
            $requestData['politica_pago'] = 'CONTRA_ENTREGA';
        }

        $validator = Validator::make($requestData, [
            'cliente_id'                      => 'required|exists:clientes,id',
            'productos'                       => 'required|array|min:1',
            'productos.*.producto_id'         => 'required|exists:productos,id',
            'productos.*.cantidad'            => 'required|numeric|min:1',
            // NUEVO: tipo_entrega es requerido
            'tipo_entrega'                    => 'required|in:DELIVERY,PICKUP',
            // ✅ NUEVO: Validación de política de pago
            'politica_pago'                   => 'sometimes|string|in:CONTRA_ENTREGA,ANTICIPADO_100,MEDIO_MEDIO,CREDITO',
            // Solicitud de entrega del cliente (REQUERIDO)
            'fecha_entrega_solicitada'        => 'required|date|after_or_equal:today',
            'hora_entrega_solicitada'         => 'nullable|date_format:H:i',
            'hora_entrega_solicitada_fin'     => 'nullable|date_format:H:i',
            // MODIFICADO: Dirección solo requerida para DELIVERY
            'direccion_entrega_solicitada_id' => 'required_if:tipo_entrega,DELIVERY|nullable|exists:direcciones_cliente,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Usar datos normalizados
        $fechaEntrega   = $requestData['fecha_entrega_solicitada'] ?? null;
        $horaEntrega    = $requestData['hora_entrega_solicitada'] ?? null;
        $horaEntregaFin = $requestData['hora_entrega_solicitada_fin'] ?? null;

        // MODIFICADO: Validación condicional de dirección según tipo_entrega
        if ($requestData['tipo_entrega'] === 'DELIVERY') {
            // Para DELIVERY, la dirección es OBLIGATORIA
            if (! $request->filled('direccion_entrega_solicitada_id')) {
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
                if (! $cliente->puede_tener_credito) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre}' no tiene permiso para solicitar crédito",
                    ], 422);
                }

                if (! $cliente->limite_credito || $cliente->limite_credito <= 0) {
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
            $empresaId          = $cliente->empresa_id ?? auth()->user()->empresa_id ?? 1;

            // Calcular totales y verificar stock
            $subtotal           = 0;
            $productosValidados = [];
            $stockInsuficiente  = [];
            $detallesConRangos  = [];

            // ✅ NUEVO (2026-02-20): Instanciar servicios de stock para validar combos
            $comboStockService = app(ComboStockService::class);
            $stockService      = app(StockService::class);
            $almacenId         = auth()->user()->almacen_id ?? 1; // Usar almacén del usuario autenticado

            foreach ($requestData['productos'] as $item) {
                $producto = Producto::with('stock')->findOrFail($item['producto_id']);
                // ✅ CORREGIDO (2026-02-16): Cambiar (int) a (float) para preservar decimales en productos fraccionados
                $cantidad = (float) $item['cantidad'];

                // ✅ NUEVO (2026-02-16): Validar que solo productos fraccionados pueden tener decimales
                if (! $producto->es_fraccionado && (float) $cantidad != floor((float) $cantidad)) {
                    return response()->json([
                        'success' => false,
                        'message' => "El producto '{$producto->nombre}' no permite cantidades fraccionadas. Solo se pueden vender unidades completas.",
                    ], 422);
                }

                // ✅ NUEVO: CALCULAR PRECIO EN BACKEND, considerando rangos de cantidad
                // El precio NO viene del cliente, se calcula en backend por seguridad
                $precioUnitario = $producto->obtenerPrecioConRango($cantidad, $empresaId);

                if (! $precioUnitario || $precioUnitario <= 0) {
                    throw new \Exception("El producto {$producto->nombre} no tiene precio definido para esta cantidad");
                }

                // Obtener información completa del rango (para logging y auditoría)
                $detallesRango = $producto->obtenerPrecioConDetallesRango($cantidad, $empresaId);

                // ✅ NUEVO (2026-02-20): Validar stock considerando si es COMBO o PRODUCTO SIMPLE
                if ($producto->es_combo) {
                    // Para COMBOS: Validar capacidad usando ComboStockService
                    $capacidad           = $comboStockService->obtenerStockProducto($producto->id, $almacenId);
                    $capacidadDisponible = $capacidad['capacidad'] ?? 0;

                    if ($capacidadDisponible < $cantidad) {
                        $stockInsuficiente[] = [
                            'producto'   => $producto->nombre . ' (COMBO)',
                            'requerido'  => $cantidad . ' ' . ($cantidad == 1 ? 'combo' : 'combos'),
                            'disponible' => $capacidadDisponible . ' ' . ($capacidadDisponible == 1 ? 'combo' : 'combos'),
                            'faltante'   => $cantidad - $capacidadDisponible,
                            'detalles'   => [
                                'cuello_botella' => $capacidad['cuello_botella'] ?? null,
                                'componentes'    => $capacidad['componentes'] ?? [],
                            ],
                        ];
                    }

                    \Log::info('✅ Validación de COMBO exitosa', [
                        'producto_id'          => $producto->id,
                        'nombre'               => $producto->nombre,
                        'combos_requeridos'    => $cantidad,
                        'capacidad_disponible' => $capacidadDisponible,
                        'cuello_botella'       => $capacidad['cuello_botella'] ?? null,
                    ]);
                } else {
                    // Para PRODUCTOS SIMPLES: Validar stock disponible
                    $stockDisponible = $producto->stock()->sum('cantidad_disponible');

                    if ($stockDisponible < $cantidad) {
                        $stockInsuficiente[] = [
                            'producto'   => $producto->nombre,
                            'requerido'  => $cantidad,
                            'disponible' => $stockDisponible,
                            'faltante'   => $cantidad - $stockDisponible,
                        ];
                    }

                    \Log::info('✅ Validación de PRODUCTO SIMPLE exitosa', [
                        'producto_id'        => $producto->id,
                        'nombre'             => $producto->nombre,
                        'cantidad_requerida' => $cantidad,
                        'stock_disponible'   => $stockDisponible,
                    ]);
                }

                $subtotalItem = $cantidad * $precioUnitario;
                $subtotal     += $subtotalItem;

                // ✅ ACTUALIZADO (2026-02-20): Procesar combo_items_seleccionados desde Flutter
                $comboItemsSeleccionados = null;
                if (isset($item['combo_items_seleccionados']) && is_array($item['combo_items_seleccionados'])) {
                    // Los items ya vienen seleccionados desde la app (sin necesidad de filtro)
                    $comboItemsSeleccionados = array_map(function ($itemCombo) {
                        // ✅ CORREGIDO: Procesar cantidad (puede ser int o float)
                        $cantidad = $itemCombo['cantidad'] ?? 1;
                        if (is_string($cantidad)) {
                            $cantidad = (float) $cantidad;
                        }

                        return [
                            'combo_item_id' => $itemCombo['combo_item_id'] ?? null,
                            'producto_id'   => $itemCombo['producto_id'] ?? null,
                            'cantidad'      => $cantidad,
                        ];
                    }, $item['combo_items_seleccionados']);

                    \Log::info('✅ Combo items procesados desde Flutter', [
                        'cantidad_items' => count($comboItemsSeleccionados),
                        'items'          => $comboItemsSeleccionados,
                    ]);
                }

                $productosValidados[] = [
                    'producto_id'               => $producto->id,
                    'cantidad'                  => $cantidad,
                    'precio_unitario'           => $precioUnitario,
                    'subtotal'                  => $subtotalItem,
                    'tipo_precio_id'            => $item['tipo_precio_id'] ?? null,     // ✅ NUEVO (2026-02-16)
                    'tipo_precio_nombre'        => $item['tipo_precio_nombre'] ?? null, // ✅ NUEVO (2026-02-16)
                    'combo_items_seleccionados' => $comboItemsSeleccionados,            // ✅ NUEVO (2026-02-16)
                ];

                // ✅ Guardar detalles del rango para auditoría
                $detallesConRangos[] = array_merge($detallesRango, [
                    'producto_nombre' => $producto->nombre,
                ]);
            }

            // Si hay productos con stock insuficiente, retornar error
            if (! empty($stockInsuficiente)) {
                return response()->json([
                    'success'             => false,
                    'message'             => 'Stock insuficiente para algunos productos',
                    'productos_sin_stock' => $stockInsuficiente,
                ], 422);
            }

            // Calcular impuestos (13% IVA) - Por ahora no se suma al total
            $impuesto = $subtotal * 0.13;
            $total    = $subtotal; // Sin impuestos por ahora

            // Crear proforma con solicitud de entrega del cliente
            $proforma = Proforma::create([
                'numero'                          => Proforma::generarNumeroProforma(),
                'fecha'                           => now(),
                'fecha_vencimiento'               => now()->addDays(7),
                'cliente_id'                      => $requestData['cliente_id'],
                'estado_proforma_id'              => 1, // ID del estado PENDIENTE en estados_logistica
                'canal_origen'                    => Proforma::CANAL_APP_EXTERNA,
                'tipo_entrega'                    => $requestData['tipo_entrega'], // NUEVO: DELIVERY o PICKUP
                'subtotal'                        => $subtotal,
                'impuesto'                        => $impuesto,
                'total'                           => $total,
                'moneda_id'                       => 1, // Bolivianos por defecto
                                                        // Usuario creador: el usuario asociado al cliente
                                                        // IMPORTANTE: esto es user_id, NO cliente_id
                'usuario_creador_id'              => $usuarioCreador,
                // ✅ NUEVO: Política de pago
                'politica_pago'                   => $requestData['politica_pago'],
                // Solicitud de entrega del cliente (usa campos normalizados)
                'fecha_entrega_solicitada'        => $fechaEntrega,
                'hora_entrega_solicitada'         => $horaEntrega,
                'hora_entrega_solicitada_fin'     => $horaEntregaFin,
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
            try {
                $reservaExitosa = $proforma->reservarStock();
                if (! $reservaExitosa) {
                    Log::warning('⚠️  No se pudieron reservar todos los productos para proforma ' . $proforma->numero);
                }
            } catch (\Exception $reservaException) {
                // 🔴 Error durante reserva de stock - dar mensajes más claros
                DB::rollBack();

                // Parsear el mensaje de error para extraer producto_id si existe
                $errorMsg        = $reservaException->getMessage();
                $productoFallido = null;
                $detalleError    = null;

                // Buscar en los detalles expandidos cual producto falló
                if (preg_match('/producto_id[\'"]?\s*[:\s=>]+\s*(\d+)/', $errorMsg, $matches)) {
                    $productoFallidoId = (int) $matches[1];
                    $productoFallido   = Producto::find($productoFallidoId);
                } elseif (preg_match('/Stock insuficiente.*Disponible:\s*(\d+).*Solicitado:\s*(\d+)/', $errorMsg, $matches)) {
                    // Tomar el primer producto que falló en los detalles
                    foreach ($proforma->detalles as $detalle) {
                        if (! $detalle->producto->es_combo) {
                            $productoFallido = $detalle->producto;
                            $detalleError    = [
                                'disponible' => (int) $matches[1],
                                'solicitado' => (int) $matches[2],
                            ];
                            break;
                        }
                    }
                }

                // Si no encontramos qué producto, buscar en los detalles
                if (! $productoFallido && $proforma->detalles->count() > 0) {
                    $productoFallido = $proforma->detalles->first()->producto;
                }

                return response()->json([
                    'success'        => false,
                    'message'        => 'No hay suficiente stock disponible para completar su pedido',
                    'tipo_error'     => 'STOCK_INSUFICIENTE',
                    'detalles_error' => [
                        'producto'      => $productoFallido ? [
                            'id'     => $productoFallido->id,
                            'nombre' => $productoFallido->nombre,
                        ] : null,
                        'stock_info'    => $detalleError,
                        'error_tecnico' => $errorMsg,
                    ],
                    'sugerencia'     => 'Por favor, ajusta las cantidades o contacta al equipo de ventas para conocer disponibilidad.',
                ], 422);
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
                'data'    => [
                    'proforma'        => $proforma,
                    'numero'          => $proforma->numero,
                    'total'           => $proforma->total,
                    'estado'          => $proforma->estado,
                    'politica_pago'   => $proforma->politica_pago, // ✅ Incluir política de pago en respuesta
                    'detalles_rangos' => $detallesConRangos,       // ✅ Información de rangos aplicados
                    'subtotal'        => $subtotal,
                    'impuesto'        => $impuesto,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error creando proforma',
                'error'   => $e->getMessage(),
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
            'detalles.producto.imagenes', // ✅ AGREGADO: Cargar imágenes del producto
            'cliente.localidad',          // ✅ ACTUALIZADO: Cargar localidad del cliente
            'usuarioCreador',
            'usuarioAprobador',
            'estadoLogistica', // ✅ AGREGADO: Cargar relación de estado
            'venta',           // ✅ NUEVO: Cargar venta relacionada (cuando está CONVERTIDA)
        ]);

        return response()->json([
            'success' => true,
            'data'    => $proforma,
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
        if (! isset($requestData['tipo_entrega'])) {
            $requestData['tipo_entrega'] = $proforma->tipo_entrega ?? 'DELIVERY';
        }

        // Si viene fecha_programada, convertir a fecha_entrega_solicitada
        if ($request->filled('fecha_programada') && ! $request->filled('fecha_entrega_solicitada')) {
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
        if ($request->filled('hora_inicio_preferida') && ! $request->filled('hora_entrega_solicitada')) {
            $requestData['hora_entrega_solicitada'] = $request->hora_inicio_preferida;
        }

        // Si viene hora_fin_preferida
        if ($request->filled('hora_fin_preferida') && ! $request->filled('hora_entrega_solicitada_fin')) {
            $requestData['hora_entrega_solicitada_fin'] = $request->hora_fin_preferida;
        }

        // Normalizar política de pago
        if (! isset($requestData['politica_pago'])) {
            $requestData['politica_pago'] = $proforma->politica_pago ?? 'CONTRA_ENTREGA';
        }

        $validator = Validator::make($requestData, [
            'cliente_id'                      => 'sometimes|exists:clientes,id',
            'productos'                       => 'sometimes|array|min:1',
            'productos.*.producto_id'         => 'required_with:productos|exists:productos,id',
            'productos.*.cantidad'            => 'required_with:productos|numeric|min:1',
            'tipo_entrega'                    => 'sometimes|in:DELIVERY,PICKUP',
            'politica_pago'                   => 'sometimes|string|in:CONTRA_ENTREGA,ANTICIPADO_100,MEDIO_MEDIO,CREDITO',
            'fecha_entrega_solicitada'        => 'sometimes|date',
            'hora_entrega_solicitada'         => 'nullable|date_format:H:i',
            'hora_entrega_solicitada_fin'     => 'nullable|date_format:H:i',
            'direccion_entrega_solicitada_id' => 'required_if:tipo_entrega,DELIVERY|nullable|exists:direcciones_cliente,id',
            'observaciones'                   => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors'  => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Obtener el cliente (puede ser el mismo o uno nuevo)
            $clienteId = $requestData['cliente_id'] ?? $proforma->cliente_id;
            $cliente   = Cliente::findOrFail($clienteId);

            // Validar política de pago si es CREDITO
            if ($requestData['politica_pago'] === 'CREDITO') {
                if (! $cliente->puede_tener_credito) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre}' no tiene permiso para solicitar crédito",
                    ], 422);
                }

                if (! $cliente->limite_credito || $cliente->limite_credito <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre}' no tiene límite de crédito configurado",
                    ], 422);
                }
            }

            // Validación condicional de dirección según tipo_entrega
            if ($requestData['tipo_entrega'] === 'DELIVERY') {
                if (! $request->filled('direccion_entrega_solicitada_id')) {
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
            $empresaId          = $cliente->empresa_id ?? auth()->user()->empresa_id ?? 1;

            // Calcular totales con los nuevos productos
            $subtotal           = 0;
            $productosValidados = [];
            $stockInsuficiente  = [];

            if ($request->filled('productos')) {
                foreach ($requestData['productos'] as $item) {
                    $producto = Producto::with('stock')->findOrFail($item['producto_id']);
                    $cantidad = (int) $item['cantidad'];

                    // Calcular precio con rangos
                    $precioUnitario = $producto->obtenerPrecioConRango($cantidad, $empresaId);

                    if (! $precioUnitario || $precioUnitario <= 0) {
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
                            'producto'   => $producto->nombre,
                            'requerido'  => $cantidad,
                            'disponible' => $stockDisponible,
                            'faltante'   => $cantidad - $stockDisponible,
                        ];
                    }

                    $subtotalItem = $cantidad * $precioUnitario;
                    $subtotal     += $subtotalItem;

                    // ✅ NUEVO (2026-02-16): Procesar combo_items_seleccionados
                    $comboItemsSeleccionados  = null;
                    if (isset($item['combo_items_seleccionados']) && is_array($item['combo_items_seleccionados'])) {
                        // Filtrar solo items que están incluidos (incluido = true)
                        $comboItemsSeleccionados = array_filter($item['combo_items_seleccionados'], function ($itemCombo) {
                            return ($itemCombo['incluido'] ?? false) === true;
                        });
                        // Reindexar array después de filter
                        $comboItemsSeleccionados = array_values($comboItemsSeleccionados);
                        // Mapear a formato estándar
                        $comboItemsSeleccionados = array_map(function ($itemCombo) {
                            return [
                                'combo_item_id' => $itemCombo['combo_item_id'] ?? null,
                                'producto_id'   => $itemCombo['producto_id'] ?? null,
                                'incluido'      => $itemCombo['incluido'] ?? false,
                            ];
                        }, $comboItemsSeleccionados);
                    }

                    $productosValidados[] = [
                        'producto_id'               => $producto->id,
                        'cantidad'                  => $cantidad,
                        'precio_unitario'           => $precioUnitario,
                        'subtotal'                  => $subtotalItem,
                        'tipo_precio_id'            => $item['tipo_precio_id'] ?? null,     // ✅ NUEVO (2026-02-16)
                        'tipo_precio_nombre'        => $item['tipo_precio_nombre'] ?? null, // ✅ NUEVO (2026-02-16)
                        'combo_items_seleccionados' => $comboItemsSeleccionados,            // ✅ NUEVO (2026-02-16)
                    ];
                }

                if (! empty($stockInsuficiente)) {
                    return response()->json([
                        'success'             => false,
                        'message'             => 'Stock insuficiente para algunos productos',
                        'productos_sin_stock' => $stockInsuficiente,
                    ], 422);
                }
            } else {
                // Si no vienen productos, mantener los existentes
                foreach ($proforma->detalles as $detalle) {
                    $subtotal             += $detalle->subtotal;
                    $productosValidados[]  = [
                        'producto_id'               => $detalle->producto_id,
                        'cantidad'                  => $detalle->cantidad,
                        'precio_unitario'           => $detalle->precio_unitario,
                        'subtotal'                  => $detalle->subtotal,
                        'tipo_precio_id'            => $detalle->tipo_precio_id,            // ✅ PRESERVAR (2026-02-16)
                        'tipo_precio_nombre'        => $detalle->tipo_precio_nombre,        // ✅ PRESERVAR (2026-02-16)
                        'combo_items_seleccionados' => $detalle->combo_items_seleccionados, // ✅ PRESERVAR (2026-02-16)
                    ];
                }
            }

            // Calcular impuestos
            $impuesto = $subtotal * 0.13;
            $total    = $subtotal;

            // Actualizar campos de cabecera
            $proforma->update([
                'cliente_id'    => $clienteId,
                'tipo_entrega'  => $requestData['tipo_entrega'],
                'subtotal'      => $subtotal,
                'impuesto'      => $impuesto,
                'total'         => $total,
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
                if (! $reservaExitosa) {
                    \Log::warning('⚠️  No se pudieron reservar todos los productos para proforma ' . $proforma->numero);
                }
            }

            // Cargar relaciones para respuesta
            $proforma->load(['detalles.producto.imagenes', 'cliente.localidad', 'direccionSolicitada', 'direccionConfirmada']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proforma actualizada exitosamente',
                'data'    => [
                    'proforma'      => $proforma,
                    'numero'        => $proforma->numero,
                    'total'         => $proforma->total,
                    'estado'        => $proforma->estado,
                    'politica_pago' => $proforma->politica_pago,
                    'subtotal'      => $subtotal,
                    'impuesto'      => $impuesto,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error actualizando proforma',
                'error'   => $e->getMessage(),
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
        if (! $user) {
            Log::warning('API Index Proformas: No authenticated user found', [
                'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
                'auth_header'  => $request->header('Authorization') ? 'present' : 'missing',
                'user_agent'   => $request->userAgent(),
                'client_ip'    => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No autenticado. El token de acceso no es válido o ha expirado.',
                'debug'   => [
                    'token_present' => (bool) $request->bearerToken(),
                    'auth_method'   => auth()->guard(),
                ],
            ], 401);
        }

        if (! $user->activo) {
            Log::warning('API Index Proformas: User inactive', [
                'user_id'   => $user->id,
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
            // Búsqueda
            'search'                         => 'nullable|string|max:100',
            // Filtros de estado
            'estado'                         => 'nullable|in:' . $estadosValidos,
            'canal_origen'                   => 'nullable|string',
            // Filtros de cliente y usuario
            'cliente_id'                     => 'nullable|integer|exists:clientes,id',
            'usuario_creador_id'             => 'nullable|integer|exists:users,id',
            // Filtros de fecha
            'fecha_desde'                    => 'nullable|date',
            'fecha_hasta'                    => 'nullable|date|after_or_equal:fecha_desde',
            'fecha_vencimiento_desde'        => 'nullable|date',
            'fecha_vencimiento_hasta'        => 'nullable|date|after_or_equal:fecha_vencimiento_desde',
            'fecha_entrega_solicitada_desde' => 'nullable|date',
            'fecha_entrega_solicitada_hasta' => 'nullable|date|after_or_equal:fecha_entrega_solicitada_desde',
            // Filtros de monto
            'total_min'                      => 'nullable|numeric|min:0',
            'total_max'                      => 'nullable|numeric|min:0',
            // Filtros de vencimiento
            'filtro_vencidas'                => 'nullable|in:TODAS,VIGENTES,VENCIDAS',
            // Paginación
            'page'                           => 'nullable|integer|min:1',
            'per_page'                       => 'nullable|integer|min:1|max:100',
            'format'                         => 'nullable|in:default,app',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parámetros de filtro incorrectos',
                'errors'  => $validator->errors(),
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

            if (! $cliente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene un cliente asociado',
                ], 403);
            }

            $query->where('cliente_id', $cliente->id);
        } elseif (in_array('preventista', $userRoles)) {
            // PREVENTISTA: Solo las proformas que él creó
            $query->where('usuario_creador_id', $user->id);
        } elseif (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado', 'chofer'], $userRoles)) {
            // DASHBOARD: Todas las proformas (sin filtro adicional)
            // Opcionalmente se puede filtrar por canal_origen, estado, etc.
        } else {
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

        // ✅ NUEVO: Filtro por fecha de vencimiento
        if ($request->filled('fecha_vencimiento_desde')) {
            $query->whereDate('fecha_vencimiento', '>=', $request->fecha_vencimiento_desde);
        }

        if ($request->filled('fecha_vencimiento_hasta')) {
            $query->whereDate('fecha_vencimiento', '<=', $request->fecha_vencimiento_hasta);
        }

        // ✅ NUEVO: Filtro por fecha de entrega solicitada
        if ($request->filled('fecha_entrega_solicitada_desde')) {
            $query->whereDate('fecha_entrega_solicitada', '>=', $request->fecha_entrega_solicitada_desde);
        }

        if ($request->filled('fecha_entrega_solicitada_hasta')) {
            $query->whereDate('fecha_entrega_solicitada', '<=', $request->fecha_entrega_solicitada_hasta);
        }

        // ✅ NUEVO 2026-02-21: Búsqueda general (ID, número, cliente)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('numero', 'like', "%{$search}%")
                  ->orWhereHas('cliente', function ($q) use ($search) {
                      $q->whereRaw('LOWER(nombre) like ?', ["%{$search}%"]);
                  });
            });
        }

        // Búsqueda por número de proforma
        if ($request->filled('numero')) {
            $query->where('numero', 'like', '%' . $request->numero . '%');
        }

        // ✅ Filtro por cliente_id
        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        // ✅ Filtro por usuario_creador_id
        if ($request->filled('usuario_creador_id')) {
            $query->where('usuario_creador_id', $request->usuario_creador_id);
        }

        // ✅ Filtro por monto mínimo
        if ($request->filled('total_min')) {
            $query->where('total', '>=', floatval($request->total_min));
        }

        // ✅ Filtro por monto máximo
        if ($request->filled('total_max')) {
            $query->where('total', '<=', floatval($request->total_max));
        }

        // ✅ Filtro por proformas vencidas/vigentes
        if ($request->filled('filtro_vencidas')) {
            $hoy = now()->startOfDay();
            if ($request->filtro_vencidas === 'VENCIDAS') {
                $query->whereDate('fecha_vencimiento', '<', $hoy);
            } elseif ($request->filtro_vencidas === 'VIGENTES') {
                $query->where(function ($q) use ($hoy) {
                    $q->whereDate('fecha_vencimiento', '>=', $hoy)
                      ->orWhereNull('fecha_vencimiento');
                });
            }
        }

        // ✅ Búsqueda por cliente (nombre, teléfono, NIT) - case insensitive
        if ($request->filled('cliente')) {
            $searchCliente = strtolower($request->cliente);
            $query->whereHas('cliente', function ($clienteQuery) use ($searchCliente) {
                $clienteQuery->where(function ($q) use ($searchCliente) {
                    $q->whereRaw('LOWER(nombre) like ?', ["%{$searchCliente}%"])
                        ->orWhereRaw('LOWER(nit) like ?', ["%{$searchCliente}%"])
                        ->orWhereRaw('LOWER(telefono) like ?', ["%{$searchCliente}%"]);
                });
            });
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
            'venta', // ✅ NUEVO: Cargar venta relacionada si está convertida
        ]);

        $query->orderBy('created_at', 'desc');

        // ========================================
        // PAGINACIÓN
        // ========================================

        $perPage   = min($request->get('per_page', 20), 100);
        $proformas = $query->paginate($perPage);

        // ========================================
        // FORMATO DE RESPUESTA
        // ========================================

        // Formato para app móvil (simplificado)
        if ($request->format === 'app') {
            return response()->json([
                'success' => true,
                'data'    => [
                    'pedidos'    => $proformas->map(function ($proforma) {
                        return [
                            'id'                       => $proforma->id,
                            'codigo'                   => $proforma->numero,
                            'fecha'                    => $proforma->fecha?->format('Y-m-d'),
                            'fecha_vencimiento'        => $proforma->fecha_vencimiento?->format('Y-m-d'),
                            // ✅ NUEVO: Agregar fecha entrega solicitada
                            'fecha_entrega_solicitada' => $proforma->fecha_entrega_solicitada?->format('Y-m-d'),
                            'hora_entrega_solicitada'  => $proforma->hora_entrega_solicitada,
                            // ✅ MODIFICADO: Devolver objeto estado completo en lugar de solo código
                            'estado'                   => $proforma->estadoLogistica ? [
                                'id'        => $proforma->estadoLogistica->id,
                                'codigo'    => $proforma->estadoLogistica->codigo,
                                'nombre'    => $proforma->estadoLogistica->nombre,
                                'color'     => $proforma->estadoLogistica->color,
                                'icono'     => $proforma->estadoLogistica->icono,
                                'categoria' => $proforma->estadoLogistica->categoria,
                            ] : null,
                            'total'                    => (float) $proforma->total,
                            'moneda'                   => 'BOB',
                            // ✅ NUEVO: Información del cliente
                            'cliente'                  => [
                                'id'       => $proforma->cliente->id,
                                'nombre'   => $proforma->cliente->nombre,
                                'telefono' => $proforma->cliente->telefono,
                                'nit'      => $proforma->cliente->nit,
                            ],
                            'cantidad_items'           => $proforma->detalles->count(),
                            'total_productos'          => (float) $proforma->detalles->sum('cantidad'),
                            'tiene_reserva_activa'     => $proforma->reservasActivas()->count() > 0,
                            'observaciones'            => $proforma->observaciones,
                            'observaciones_rechazo'    => $proforma->observaciones_rechazo,
                            'items_preview'            => $proforma->detalles->take(3)->map(function ($detalle) {
                                return [
                                    'producto' => $detalle->producto->nombre ?? 'Producto',
                                    'cantidad' => (float) $detalle->cantidad,
                                ];
                            }),
                        ];
                    }),
                    'paginacion' => [
                        'total'         => $proformas->total(),
                        'por_pagina'    => $proformas->perPage(),
                        'pagina_actual' => $proformas->currentPage(),
                        'ultima_pagina' => $proformas->lastPage(),
                        'desde'         => $proformas->firstItem(),
                        'hasta'         => $proformas->lastItem(),
                    ],
                ],
            ]);
        }

        // Formato default (dashboard web + app móvil)
        // ✅ NUEVO: Mapear venta_id y venta_numero para app móvil
        $data = $proformas->map(function ($proforma) {
            $item = $proforma->toArray();
            // Agregar información de venta si está convertida
            $item['venta_id']     = $proforma->venta?->id;
            $item['venta_numero'] = $proforma->venta?->numero;
            return $item;
        })->toArray();

        return response()->json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'current_page' => $proformas->currentPage(),
                'last_page'    => $proformas->lastPage(),
                'per_page'     => $proformas->perPage(),
                'total'        => $proformas->total(),
                'from'         => $proformas->firstItem(),
                'to'           => $proformas->lastItem(),
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
        if (! $user) {
            // Log detallado para debugging
            Log::warning('API Stats: No authenticated user found', [
                'bearer_token' => $request->bearerToken() ? 'present' : 'missing',
                'auth_header'  => $request->header('Authorization') ? 'present' : 'missing',
                'user_agent'   => $request->userAgent(),
                'method'       => $request->method(),
                'path'         => $request->path(),
                'client_ip'    => $request->ip(),
                'timestamp'    => now()->toIso8601String(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No autenticado. El token de acceso no es válido o ha expirado.',
                'debug'   => [
                    'token_present' => (bool) $request->bearerToken(),
                    'auth_method'   => auth()->guard(),
                    'timestamp'     => now(),
                ],
            ], 401);
        }

        // Validación adicional: verificar que el usuario está activo
        if (! $user->activo) {
            Log::warning('API Stats: User inactive', [
                'user_id'   => $user->id,
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
        } elseif (in_array('cliente', $userRoles)) {
            // CLIENTE: Solo sus propias proformas
            $cliente = $user->cliente;

            if (! $cliente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene un cliente asociado',
                ], 403);
            }

            $query->where('cliente_id', $cliente->id);
        } elseif (in_array('preventista', $userRoles)) {
            // PREVENTISTA: Solo las proformas que él creó
            $query->where('usuario_creador_id', $user->id);
        } else {
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
            $estadoAprobada  = Proforma::obtenerIdEstado('APROBADA', 'proforma');

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
                'pendiente'  => Proforma::obtenerIdEstado('PENDIENTE', 'proforma'),
                'aprobada'   => Proforma::obtenerIdEstado('APROBADA', 'proforma'),
                'rechazada'  => Proforma::obtenerIdEstado('RECHAZADA', 'proforma'),
                'convertida' => Proforma::obtenerIdEstado('CONVERTIDA', 'proforma'),
                'vencida'    => Proforma::obtenerIdEstado('VENCIDA', 'proforma'),
            ];

            return response()->json([
                'success' => true,
                'data'    => [
                    'total'             => $total,
                    'por_estado'        => [
                        'pendiente'  => $porEstado->get($estadoIds['pendiente'])?->cantidad ?? 0,
                        'aprobada'   => $porEstado->get($estadoIds['aprobada'])?->cantidad ?? 0,
                        'rechazada'  => $porEstado->get($estadoIds['rechazada'])?->cantidad ?? 0,
                        'convertida' => $porEstado->get($estadoIds['convertida'])?->cantidad ?? 0,
                        'vencida'    => $porEstado->get($estadoIds['vencida'])?->cantidad ?? 0,
                    ],
                    'montos_por_estado' => [
                        'pendiente'  => (float) ($porEstado->get($estadoIds['pendiente'])?->monto_total ?? 0),
                        'aprobada'   => (float) ($porEstado->get($estadoIds['aprobada'])?->monto_total ?? 0),
                        'rechazada'  => (float) ($porEstado->get($estadoIds['rechazada'])?->monto_total ?? 0),
                        'convertida' => (float) ($porEstado->get($estadoIds['convertida'])?->monto_total ?? 0),
                        'vencida'    => (float) ($porEstado->get($estadoIds['vencida'])?->monto_total ?? 0),
                    ],
                    'por_canal'         => [
                        'app_externa' => $porCanal->get(Proforma::CANAL_APP_EXTERNA)?->cantidad ?? 0,
                        'web'         => $porCanal->get(Proforma::CANAL_WEB)?->cantidad ?? 0,
                        'presencial'  => $porCanal->get(Proforma::CANAL_PRESENCIAL)?->cantidad ?? 0,
                    ],
                    'alertas'           => [
                        'vencidas'   => $vencidas,
                        'por_vencer' => $porVencer,
                    ],
                    'monto_total'       => (float) $montoTotal,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error obteniendo estadísticas de proformas', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de proformas',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function verificarEstado(Proforma $proforma)
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'numero'                  => $proforma->numero,
                'estado_codigo'           => $proforma->estadoLogistica?->codigo,
                'estado_nombre'           => $proforma->estadoLogistica?->nombre,
                'estado_id'               => $proforma->estado_proforma_id,
                'fecha'                   => $proforma->fecha,
                'total'                   => $proforma->total,
                'observaciones'           => $proforma->observaciones,
                'observaciones_rechazo'   => $proforma->observaciones_rechazo,
                'fecha_aprobacion'        => $proforma->fecha_aprobacion,
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
            'data'    => $productos,
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
            'comentario'                      => 'nullable|string|max:500',
            // Confirmación de entrega del vendedor después de coordinación
            // ✅ FIXED: Comparar con fecha_entrega_solicitada (no con today que depende de zona horaria)
            'fecha_entrega_confirmada'        => [
                'nullable',
                'date',
                function ($attribute, $value, $fail) use ($proforma) {
                    if ($value) {
                        $fechaConfirmada = \Carbon\Carbon::parse($value)->toDateString();
                        $fechaSolicitada = $proforma->fecha_entrega_solicitada ?
                        \Carbon\Carbon::parse($proforma->fecha_entrega_solicitada)->toDateString() :
                        null;

                        // Si existe fecha solicitada, la confirmada debe ser >= a ella
                        if ($fechaSolicitada && \Carbon\Carbon::parse($fechaConfirmada)->lt(\Carbon\Carbon::parse($fechaSolicitada))) {
                            $fail('La fecha de entrega confirmada debe ser igual o posterior a la fecha solicitada (' . $fechaSolicitada . ')');
                        }
                    }
                },
            ],
            'hora_entrega_confirmada'         => 'nullable|date_format:H:i',
            'hora_entrega_confirmada_fin'     => 'nullable|date_format:H:i',
            'direccion_entrega_confirmada_id' => 'nullable|exists:direcciones_cliente,id',
            'comentario_coordinacion'         => 'nullable|string|max:1000',
            // Datos de intentos de contacto
            'numero_intentos_contacto'        => 'nullable|integer|min:0',
            'fecha_ultimo_intento'            => 'nullable|date',
            'resultado_ultimo_intento'        => 'nullable|string|max:500',
            'notas_llamada'                   => 'nullable|string|max:1000',
        ]);

        try {
            if ($proforma->estado !== 'PENDIENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden aprobar proformas pendientes',
                ], 400);
            }

            // 1️⃣ ✅ MEJORADO: Valida que la dirección confirmada pertenece al cliente (si se proporciona)
            // Se acepta NULL si no hay dirección confirmada
            $direccionConfirmadaId = $request->direccion_entrega_confirmada_id;

            if ($direccionConfirmadaId) {
                // Validar que la dirección pertenece al cliente actual
                $direccionExiste = $proforma->cliente->direcciones()
                    ->where('id', $direccionConfirmadaId)
                    ->exists();

                if (! $direccionExiste) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La dirección de entrega confirmada no pertenece a este cliente',
                    ], 422);
                }
            }

            // Si se proporciona dirección confirmada, usarla; si no, usar la solicitada (puede ser NULL)
            $direccionFinal = $direccionConfirmadaId ?? $proforma->direccion_entrega_solicitada_id;

            // Actualizar proforma con confirmación del vendedor y datos de contacto
            $proforma->update([
                'fecha_entrega_confirmada'        => $request->fecha_entrega_confirmada ?? $proforma->fecha_entrega_solicitada,
                'hora_entrega_confirmada'         => $request->hora_entrega_confirmada ?? $proforma->hora_entrega_solicitada,
                'hora_entrega_confirmada_fin'     => $request->hora_entrega_confirmada_fin ?? $proforma->hora_entrega_solicitada_fin,
                'direccion_entrega_confirmada_id' => $direccionFinal,
                'coordinacion_completada'         => true,
                'comentario_coordinacion'         => $request->comentario_coordinacion,
                // Datos de intentos de contacto (se envían desde la pantalla principal)
                'numero_intentos_contacto'        => $request->numero_intentos_contacto ?? $proforma->numero_intentos_contacto,
                // Si no se proporciona fecha_ultimo_intento, se genera automáticamente la de hoy
                'fecha_ultimo_intento'            => $request->fecha_ultimo_intento ?? ($request->numero_intentos_contacto ? now()->toDateString() : $proforma->fecha_ultimo_intento),
                'resultado_ultimo_intento'        => $request->resultado_ultimo_intento ?? $proforma->resultado_ultimo_intento,
                'notas_llamada'                   => $request->notas_llamada ?? $proforma->notas_llamada,
            ]);

            // Obtener usuario autenticado
            $usuario = request()->user();
            if ($usuario === null) {
                $usuario = auth()->user();
            }

            // Aprobar la proforma
            $aprobada = $proforma->aprobar($usuario, $request->comentario);

            if (! $aprobada) {
                return response()->json([
                    'success' => false,
                    'message' => $proforma->estaVencida()
                        ? 'No se puede aprobar una proforma vencida (venció el ' . $proforma->fecha_vencimiento->format('d/m/Y') . ')'
                        : 'No se puede aprobar la proforma en su estado actual',
                ], 400);
            }

            // ✅ DESACTIVADO: Usar solo servidor WebSocket de Node.js (./paucara/websocket)
            // Las notificaciones se envían directamente desde SendProformaApprovedNotification listener
            // No usamos Pusher broadcasting porque tenemos WebSocket nativo en Node.js
            Log::info('✅ [aprobar] Notificaciones manejadas por servidor WebSocket Node.js (SendProformaApprovedNotification)', [
                'proforma_id' => $proforma->id,
                'usuario_id'  => $usuario?->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proforma aprobada exitosamente',
                'data'    => $proforma->fresh(['detalles.producto', 'cliente', 'direccionConfirmada', 'direccionSolicitada', 'estadoLogistica']),
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al aprobar proforma', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'proforma_id' => $proforma->id,
            ]);

            return response()->json([
                'success'       => false,
                'message'       => 'Error al aprobar la proforma: ' . $e->getMessage(),
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
            if (! in_array($proforma->estado, ['PENDIENTE', 'APROBADA', 'VENCIDA'])) {
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
                    'error'       => $broadcastError->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Proforma rechazada',
                'data'    => $proforma->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al rechazar la proforma: ' . $e->getMessage(),
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
            'fecha_entrega_confirmada'        => 'nullable|date|after_or_equal:today',
            'hora_entrega_confirmada'         => 'nullable|date_format:H:i',
            'hora_entrega_confirmada_fin'     => 'nullable|date_format:H:i',
            'direccion_entrega_confirmada_id' => 'nullable|exists:direcciones_cliente,id',
            'comentario_coordinacion'         => 'nullable|string|max:1000',
            'notas_llamada'                   => 'nullable|string|max:500',

            // Nuevos campos de control de intentos
            'numero_intentos_contacto'        => 'nullable|integer|min:0|max:255',
            'resultado_ultimo_intento'        => 'nullable|string|in:Aceptado,No contactado,Rechazado,Reagendar',

            // Nuevos campos de entrega realizada
            'entregado_en'                    => 'nullable|date_format:Y-m-d\TH:i',
            'entregado_a'                     => 'nullable|string|max:255',
            'observaciones_entrega'           => 'nullable|string|max:1000',
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
                'fecha_entrega_confirmada'        => $request->fecha_entrega_confirmada ?? $proforma->fecha_entrega_confirmada,
                'hora_entrega_confirmada'         => $request->hora_entrega_confirmada ?? $proforma->hora_entrega_confirmada,
                'hora_entrega_confirmada_fin'     => $request->hora_entrega_confirmada_fin ?? $proforma->hora_entrega_confirmada_fin,
                'direccion_entrega_confirmada_id' => $request->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_confirmada_id,
                'comentario_coordinacion'         => $comentarioFinal ?: $proforma->comentario_coordinacion,
                'coordinacion_completada'         => true,

                // Nuevos campos de control
                'coordinacion_actualizada_en'     => now(),
                'coordinacion_actualizada_por_id' => auth()->id(),
                'numero_intentos_contacto'        => $request->numero_intentos_contacto ?? $proforma->numero_intentos_contacto ?? 0,
                'resultado_ultimo_intento'        => $request->resultado_ultimo_intento ?? $proforma->resultado_ultimo_intento,
                'entregado_en'                    => $request->entregado_en ?? $proforma->entregado_en,
                'entregado_a'                     => $request->entregado_a ?? $proforma->entregado_a,
                'observaciones_entrega'           => $request->observaciones_entrega ?? $proforma->observaciones_entrega,
            ];

            // Actualizar proforma con todos los datos
            $proforma->update($datosActualizar);

            // Disparar evento de coordinación actualizada
            event(new \App\Events\ProformaCoordinacionActualizada($proforma, auth()->id()));

            // Log de coordinación actualizada
            Log::info('Coordinación de proforma actualizada', [
                'proforma_id'        => $proforma->id,
                'proforma_numero'    => $proforma->numero,
                'usuario_id'         => auth()->id(),
                'datos_actualizados' => array_keys($datosActualizar),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Coordinación guardada exitosamente',
                'data'    => $proforma->fresh([
                    'cliente',
                    'usuarioCreador',
                    'coordinacionActualizadaPor',
                    'direccionSolicitada',
                    'direccionConfirmada',
                ]),
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al guardar coordinación de proforma', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'proforma_id' => $proforma->id,
                'usuario_id'  => auth()->id(),
            ]);

            return response()->json([
                'success'       => false,
                'message'       => 'Error al guardar la coordinación: ' . $e->getMessage(),
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

            if (! $extendida) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede extender el vencimiento. Solo se permite para proformas PENDIENTES o APROBADAS.',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => "Fecha de vencimiento extendida {$dias} días",
                'data' => [
                    'proforma'                => $proforma->fresh(),
                    'nueva_fecha_vencimiento' => $proforma->fecha_vencimiento->format('Y-m-d'),
                    'dias_extendidos'         => $dias,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al extender vencimiento de proforma', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'proforma_id' => $proforma->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al extender el vencimiento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar disponibilidad de stock para productos
     */
    public function verificarStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'productos'               => 'required|array|min:1',
            'productos.*.producto_id' => 'required|exists:productos,id',
            'productos.*.cantidad'    => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $verificacion   = [];
        $todoDisponible = true;

        foreach ($request->productos as $item) {
            $producto          = Producto::with('stockProductos')->findOrFail($item['producto_id']);
            $cantidadRequerida = $item['cantidad'];

            $stockTotal = $producto->stockProductos()->sum('cantidad_disponible');

            $disponible = $stockTotal >= $cantidadRequerida;

            if (! $disponible) {
                $todoDisponible = false;
            }

            $verificacion[] = [
                'producto_id'         => $producto->id,
                'producto_nombre'     => $producto->nombre,
                'cantidad_requerida'  => $cantidadRequerida,
                'cantidad_disponible' => $stockTotal,
                'disponible'          => $disponible,
                'diferencia'          => $stockTotal - $cantidadRequerida,
            ];
        }

        return response()->json([
            'success'         => true,
            'todo_disponible' => $todoDisponible,
            'verificacion'    => $verificacion,
        ]);
    }

    /**
     * Verificar estado de reservas de una proforma
     */
    public function verificarReservas(Proforma $proforma)
    {
        $reservas  = $proforma->reservasActivas()->with('stockProducto.producto')->get();
        $expiradas = $proforma->tieneReservasExpiradas();

        return response()->json([
            'success' => true,
            'data'    => [
                'proforma_id'        => $proforma->id,
                'tiene_reservas'     => $reservas->count() > 0,
                'reservas_expiradas' => $expiradas,
                'reservas'           => $reservas->map(function ($reserva) {
                    return [
                        'id'                 => $reserva->id,
                        'producto_nombre'    => $reserva->stockProducto->producto->nombre,
                        'cantidad_reservada' => $reserva->cantidad_reservada,
                        'fecha_expiracion'   => $reserva->fecha_expiracion,
                        'expirada'           => $reserva->estaExpirada(),
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
                'errors'  => $validator->errors(),
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
            'items'               => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,id',
            'items.*.cantidad'    => 'required|numeric|min:0.01',
            'direccion_id'        => 'nullable|exists:direcciones_cliente,id',
            'observaciones'       => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors'  => $validator->errors(),
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
                        'success'            => false,
                        'message'            => 'No tienes una dirección de entrega configurada. Por favor agrega una dirección antes de crear un pedido.',
                        'requiere_direccion' => true,
                    ], 422);
                }
            }

            // 3. Validar stock y calcular totales
            $subtotal           = 0;
            $productosValidados = [];
            $stockInsuficiente  = [];

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
                        'producto'    => $producto->nombre,
                        'requerido'   => $cantidad,
                        'disponible'  => $stockDisponible,
                        'faltante'    => $cantidad - $stockDisponible,
                    ];
                }

                $subtotalItem = $cantidad * $precio;
                $subtotal     += $subtotalItem;

                $productosValidados[] = [
                    'producto_id'     => $producto->id,
                    'producto'        => $producto,
                    'cantidad'        => $cantidad,
                    'precio_unitario' => $precio,
                    'subtotal'        => $subtotalItem,
                ];
            }

            // Si hay productos con stock insuficiente, retornar error detallado
            if (! empty($stockInsuficiente)) {
                return response()->json([
                    'success'             => false,
                    'message'             => 'Stock insuficiente para algunos productos',
                    'productos_sin_stock' => $stockInsuficiente,
                ], 422);
            }

            // 4. Calcular impuestos (13% IVA en Bolivia) - Por ahora no se suma al total
            $impuesto = $subtotal * 0.13;
            $total    = $subtotal; // Sin impuestos por ahora

            // 5. Crear la proforma
            $proforma = Proforma::create([
                'numero'             => Proforma::generarNumeroProforma(),
                'fecha'              => now(),
                'fecha_vencimiento'  => now()->addDays(7), // 7 días para aprobar
                'cliente_id'         => $cliente->id,
                'estado_proforma_id' => 1, // ID = 1 para PENDIENTE
                'canal_origen'       => Proforma::CANAL_APP_EXTERNA,
                'subtotal'           => $subtotal,
                'impuesto'           => $impuesto,
                'total'              => $total,
                'moneda_id'          => 1, // Bolivianos por defecto
                'observaciones'      => $request->observaciones,
                'usuario_creador_id' => Auth::id(), // ✅ Usuario autenticado que crea la proforma
            ]);

            // 6. Crear detalles de la proforma
            foreach ($productosValidados as $detalle) {
                $proforma->detalles()->create([
                    'producto_id'     => $detalle['producto_id'],
                    'cantidad'        => $detalle['cantidad'],
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal'        => $detalle['subtotal'],
                ]);
            }

            // 7. Reservar stock automáticamente
            $reservaExitosa = $proforma->reservarStock();

            if (! $reservaExitosa) {
                DB::rollBack();

                return response()->json([
                    'success'    => false,
                    'message'    => 'No se pudo reservar el stock para este pedido. Algunos productos pueden haber sido vendidos recientemente.',
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
                'data'    => [
                    'pedido'            => [
                        'id'                => $proforma->id,
                        'codigo'            => $proforma->numero,
                        'fecha'             => $proforma->fecha->format('Y-m-d'),
                        'fecha_vencimiento' => $proforma->fecha_vencimiento->format('Y-m-d'),
                        'estado'            => $proforma->estado,
                        'canal'             => $proforma->canal_origen,
                        'subtotal'          => (float) $proforma->subtotal,
                        'impuesto'          => (float) $proforma->impuesto,
                        'total'             => (float) $proforma->total,
                        'observaciones'     => $proforma->observaciones,
                        'items'             => $proforma->detalles->map(function ($detalle) {
                            return [
                                'producto_id'     => $detalle->producto_id,
                                'producto'        => $detalle->producto->nombre,
                                'cantidad'        => (float) $detalle->cantidad,
                                'precio_unitario' => (float) $detalle->precio_unitario,
                                'subtotal'        => (float) $detalle->subtotal,
                            ];
                        }),
                    ],
                    'direccion_entrega' => [
                        'id'            => $direccion->id,
                        'direccion'     => $direccion->direccion,
                        'latitud'       => $direccion->latitud,
                        'longitud'      => $direccion->longitud,
                        'observaciones' => $direccion->observaciones,
                    ],
                    'stock_reservado'   => [
                        'cantidad_reservas'     => $proforma->reservasActivas->count(),
                        'fecha_expiracion'      => $proforma->reservasActivas->first()?->fecha_expiracion,
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
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el pedido. Por favor intenta nuevamente.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
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
            'data'    => [
                'pedido'            => [
                    'id'                     => $proforma->id,
                    'codigo'                 => $proforma->numero,
                    'fecha'                  => $proforma->fecha->format('Y-m-d H:i'),
                    'fecha_vencimiento'      => $proforma->fecha_vencimiento?->format('Y-m-d'),
                    'estado'                 => $proforma->estado,
                    'canal_origen'           => $proforma->canal_origen,
                    'subtotal'               => (float) $proforma->subtotal,
                    'impuesto'               => (float) $proforma->impuesto,
                    'total'                  => (float) $proforma->total,
                    'moneda'                 => 'BOB',
                    'observaciones'          => $proforma->observaciones,
                    'observaciones_rechazo'  => $proforma->observaciones_rechazo,
                    'fecha_aprobacion'       => $proforma->fecha_aprobacion?->format('Y-m-d H:i'),
                    'puede_cancelar'         => $proforma->estado === Proforma::PENDIENTE,
                    'puede_extender_reserva' => $proforma->reservasActivas->count() > 0 &&
                    $proforma->estado === Proforma::PENDIENTE,
                ],
                'items'             => $proforma->detalles->map(function ($detalle) {
                    return [
                        'id'              => $detalle->id,
                        'producto_id'     => $detalle->producto_id,
                        'producto'        => $detalle->producto->nombre,
                        'codigo_producto' => $detalle->producto->codigo,
                        'categoria'       => $detalle->producto->categoria?->nombre,
                        'marca'           => $detalle->producto->marca?->nombre,
                        'unidad_medida'   => $detalle->producto->unidad?->abreviacion,
                        'cantidad'        => (float) $detalle->cantidad,
                        'precio_unitario' => (float) $detalle->precio_unitario,
                        'subtotal'        => (float) $detalle->subtotal,
                        'imagen_url'      => $detalle->producto->imagen_url,
                    ];
                }),
                'direccion_entrega' => $direccionEntrega ? [
                    'id'            => $direccionEntrega->id,
                    'direccion'     => $direccionEntrega->direccion,
                    'latitud'       => $direccionEntrega->latitud,
                    'longitud'      => $direccionEntrega->longitud,
                    'observaciones' => $direccionEntrega->observaciones,
                    'es_principal'  => $direccionEntrega->es_principal,
                ] : null,
                'reservas_stock'    => $proforma->reservasActivas->count() > 0 ? [
                    'tiene_reservas'        => true,
                    'cantidad_reservas'     => $proforma->reservasActivas->count(),
                    'fecha_expiracion'      => $proforma->reservasActivas->first()?->fecha_expiracion?->format('Y-m-d H:i'),
                    'tiempo_restante_horas' => $proforma->reservasActivas->first()
                        ? now()->diffInHours($proforma->reservasActivas->first()->fecha_expiracion, false)
                        : null,
                    'detalles_por_almacen'  => $proforma->reservasActivas->groupBy('stockProducto.almacen.nombre')->map(function ($reservas, $almacen) {
                        return [
                            'almacen'              => $almacen,
                            'productos_reservados' => $reservas->count(),
                        ];
                    })->values(),
                ] : [
                    'tiene_reservas' => false,
                ],
                'seguimiento'       => [
                    'creado_por'       => $proforma->usuarioCreador?->name,
                    'fecha_creacion'   => $proforma->created_at->format('Y-m-d H:i'),
                    'aprobado_por'     => $proforma->usuarioAprobador?->name,
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
        $reserva              = $tieneReservasActivas ? $proforma->reservasActivas()->first() : null;

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                    => $proforma->id,
                'codigo'                => $proforma->numero,
                'estado'                => $proforma->estado,
                'fecha'                 => $proforma->fecha->format('Y-m-d'),
                'total'                 => (float) $proforma->total,
                'observaciones'         => $proforma->observaciones,
                'estado_detalle'        => [
                    'descripcion' => $this->obtenerDescripcionEstado($proforma->estado),
                    'color'       => $this->obtenerColorEstado($proforma->estado),
                    'icono'       => $this->obtenerIconoEstado($proforma->estado),
                ],
                'fecha_aprobacion'      => $proforma->fecha_aprobacion?->format('Y-m-d H:i'),
                'observaciones_rechazo' => $proforma->observaciones_rechazo,
                'tiene_reserva_activa'  => $tieneReservasActivas,
                'reserva_info'          => $reserva ? [
                    'fecha_expiracion'      => $reserva->fecha_expiracion->format('Y-m-d H:i'),
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
            Proforma::PENDIENTE  => 'Tu pedido está siendo revisado por nuestro equipo',
            Proforma::APROBADA   => 'Tu pedido ha sido aprobado y está listo para ser procesado',
            Proforma::RECHAZADA  => 'Lo sentimos, tu pedido no pudo ser procesado',
            Proforma::CONVERTIDA => 'Tu pedido ha sido confirmado y está en proceso de entrega',
            default              => 'Estado desconocido',
        };
    }

    /**
     * Helper: Obtener color del estado para la UI
     */
    private function obtenerColorEstado($estado)
    {
        return match ($estado) {
            Proforma::PENDIENTE  => '#FFA500', // Naranja
            Proforma::APROBADA   => '#4CAF50', // Verde
            Proforma::RECHAZADA  => '#F44336', // Rojo
            Proforma::CONVERTIDA => '#2196F3', // Azul
            default              => '#9E9E9E', // Gris
        };
    }

    /**
     * Helper: Obtener icono del estado para la UI
     */
    private function obtenerIconoEstado($estado)
    {
        return match ($estado) {
            Proforma::PENDIENTE  => 'clock',
            Proforma::APROBADA   => 'check-circle',
            Proforma::RECHAZADA  => 'x-circle',
            Proforma::CONVERTIDA => 'truck',
            default              => 'help-circle',
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
                'errors'  => $validator->errors(),
            ], 422);
        }

        return DB::transaction(function () use ($proforma, $request) {
            try {
                // Validación 1: La proforma debe estar APROBADA
                if ($proforma->estado !== Proforma::APROBADA) {
                    return response()->json([
                        'success'       => false,
                        'message'       => 'La proforma debe estar aprobada para confirmarla',
                        'estado_actual' => $proforma->estado,
                    ], 422);
                }

                // Validación 2: Debe tener mínimo 5 productos diferentes
                $cantidadProductos = $proforma->detalles()->count();
                if ($cantidadProductos < 5) {
                    return response()->json([
                        'success'               => false,
                        'message'               => 'Debe solicitar mínimo 5 productos diferentes',
                        'productos_solicitados' => $cantidadProductos,
                        'productos_requeridos'  => 5,
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
                $disponibilidad    = $proforma->verificarDisponibilidadStock();
                $stockInsuficiente = array_filter($disponibilidad, fn($item) => ! $item['disponible']);

                if (! empty($stockInsuficiente)) {
                    return response()->json([
                        'success'             => false,
                        'message'             => 'Stock insuficiente para algunos productos',
                        'productos_sin_stock' => $stockInsuficiente,
                    ], 422);
                }

                // ✅ NUEVO: Obtener caja abierta ANTES de crear la venta
                // El listener RegisterCajaMovementFromVentaListener requiere este ID
                $cajaAbiertaParaGuardar = \App\Models\AperturaCaja::where('user_id', $usuario->id)
                    ->delDia()
                    ->abiertas()
                    ->with('caja')
                    ->latest()
                    ->first();

                // Si no hay caja de hoy, buscar la más reciente
                if (! $cajaAbiertaParaGuardar) {
                    $cajaAbiertaParaGuardar = \App\Models\AperturaCaja::where('user_id', $usuario->id)
                        ->abiertas()
                        ->with('caja')
                        ->latest('fecha')
                        ->first();
                }

                // Preparar datos para la venta desde la proforma
                $politicaPago = $request->politica_pago;
                // ✅ CAMBIO: Total SIN impuesto (subtotal - descuento)
                $montoTotal = max(0, $proforma->subtotal - ($proforma->descuento ?? 0));

                // ✅ NUEVO: Para CONTRA_ENTREGA, monto_pagado = total (para registrar en caja)
                // pero estado_pago sigue siendo PENDIENTE
                $montoPagadoInicial = ($politicaPago === 'CONTRA_ENTREGA') ? $montoTotal : 0;
                $montoPendiente     = $montoTotal - $montoPagadoInicial;

                $datosVenta = [
                    'numero'              => '0', // ✅ TEMP: Se asignará al ID después de crear
                    'fecha'               => now()->toDateString(),
                    'subtotal'            => $proforma->subtotal,
                    'descuento'           => $proforma->descuento ?? 0,
                    'impuesto'            => 0,           // ✅ NUEVO: La empresa NO usa impuesto
                    'total'               => $montoTotal, // ✅ CAMBIO: Total SIN impuesto
                    'monto_total'         => $montoTotal,
                    'monto_pagado'        => $montoPagadoInicial, // ✅ CAMBIO: = total para CONTRA_ENTREGA
                    'monto_pendiente'     => $montoPendiente,     // ✅ CAMBIO: 0 para CONTRA_ENTREGA
                    'politica_pago'       => $politicaPago,
                    'estado_pago'         => 'PENDIENTE',
                    'observaciones'       => $proforma->observaciones,
                    'cliente_id'          => $proforma->cliente_id,
                    'usuario_id'          => request()->user()->id,
                    'moneda_id'           => $proforma->moneda_id,
                    'proforma_id'         => $proforma->id,
                    // Campos de logística
                    'requiere_envio'      => $proforma->esDeAppExterna(),
                    'canal_origen'        => $proforma->canal_origen,
                    'estado_logistico'    => $proforma->esDeAppExterna()
                        ? \App\Models\Venta::ESTADO_PENDIENTE_ENVIO
                        : null,
                    // ✅ Estado del documento: APROBADO (ID=3) cuando se convierte proforma aprobada a venta
                    'estado_documento_id' => \App\Models\EstadoDocumento::where('codigo', 'APROBADO')
                        ->where('activo', true)
                        ->first()?->id ?? 3,
                    // ✅ NUEVO: Guardar caja_id en ventas incluso para CONTRA_ENTREGA
                    'caja_id'             => $cajaAbiertaParaGuardar?->caja_id ?? null,
                ];

                // Crear la venta
                $venta = \App\Models\Venta::create($datosVenta);

                // ✅ NUEVO: Asignar número de venta con formato VEN + FECHA + ID
                $numeroVenta = 'VEN' . now()->format('Ymd') . '-' . str_pad($venta->id, 4, '0', STR_PAD_LEFT);
                $venta->update(['numero' => $numeroVenta]);
                Log::info('✅ [procesarVenta desde ApiProformaController] Número de venta asignado con ID', [
                    'venta_id'     => $venta->id,
                    'numero_venta' => $numeroVenta,
                ]);

                // Crear detalles de la venta desde los detalles de la proforma
                foreach ($proforma->detalles as $detalleProforma) {
                    $venta->detalles()->create([
                        'producto_id'     => $detalleProforma->producto_id,
                        'cantidad'        => $detalleProforma->cantidad,
                        'precio_unitario' => $detalleProforma->precio_unitario,
                        'subtotal'        => $detalleProforma->subtotal,
                    ]);
                }

                // 🔑 CRÍTICO: Obtener caja abierta para establecer en atributo especial
                // El listener RegisterCajaMovementFromVentaListener requiere _caja_id para registrar en caja
                $cajaAbiertaParaRegistro = \App\Models\AperturaCaja::where('user_id', request()->user()->id)
                    ->delDia()
                    ->abiertas()
                    ->with('caja')
                    ->latest()
                    ->first();

                // Si no hay caja de hoy, buscar la más reciente
                if (! $cajaAbiertaParaRegistro) {
                    $cajaAbiertaParaRegistro = \App\Models\AperturaCaja::where('user_id', request()->user()->id)
                        ->abiertas()
                        ->with('caja')
                        ->latest('fecha')
                        ->first();
                }

                // ✅ Establecer atributo especial para el listener
                if ($cajaAbiertaParaRegistro) {
                    $venta->setAttribute('_caja_id', $cajaAbiertaParaRegistro->caja_id);
                    Log::info('🔑 [procesarVenta] Establecido _caja_id para listener', [
                        'venta_id'    => $venta->id,
                        'caja_id'     => $cajaAbiertaParaRegistro->caja_id,
                        'caja_nombre' => $cajaAbiertaParaRegistro->caja?->nombre,
                    ]);
                }

                // ✅ DISPARO MANUAL DEL EVENTO: VentaCreada (para que se registre en caja)
                event(new \App\Events\VentaCreada($venta));

                // Marcar la proforma como convertida
                if (! $proforma->marcarComoConvertida()) {
                    throw new \Exception('Error al marcar la proforma como convertida');
                }

                // Cargar relaciones para la respuesta
                $venta->load(['cliente', 'detalles.producto']);

                // Enviar notificación WebSocket
                // NOTA: Las notificaciones WebSocket ahora se envían a través de los Events/Listeners
                // Ver: ProformaConvertida event → SendProformaConvertedNotification listener

                Log::info('Proforma confirmada como venta (API)', [
                    'proforma_id'     => $proforma->id,
                    'proforma_numero' => $proforma->numero,
                    'venta_id'        => $venta->id,
                    'venta_numero'    => $venta->numero,
                    'politica_pago'   => $politicaPago,
                    'usuario_id'      => request()->user()->id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Proforma {$proforma->numero} confirmada como venta {$venta->numero}",
                    'data' => [
                        'venta'       => [
                            'id'               => $venta->id,
                            'numero'           => $venta->numero,
                            'fecha'            => $venta->fecha,
                            'monto_total'      => (float) $venta->monto_total,
                            'monto_pagado'     => (float) $venta->monto_pagado,
                            'monto_pendiente'  => (float) $venta->monto_pendiente,
                            'politica_pago'    => $venta->politica_pago,
                            'estado_pago'      => $venta->estado_pago,
                            'estado_logistico' => $venta->estado_logistico,
                        ],
                        'cliente'     => [
                            'id'     => $venta->cliente->id,
                            'nombre' => $venta->cliente->nombre,
                        ],
                        'items_count' => $venta->detalles->count(),
                    ],
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();

                Log::error('Error al confirmar proforma como venta (API)', [
                    'proforma_id' => $proforma->id,
                    'error'       => $e->getMessage(),
                    'trace'       => $e->getTraceAsString(),
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
                'tipo_pago_id'  => 'required_unless:politica_pago,CREDITO|exists:tipos_pago,id',
                'politica_pago' => 'required|in:CONTRA_ENTREGA,ANTICIPADO_100,MEDIO_MEDIO,CREDITO',
                'monto_pagado'  => 'nullable|numeric|min:0',
            ]);
        }

        return DB::transaction(function () use ($proforma, $request) {
            try {
                // ⭐ VALIDACIÓN PRINCIPAL: Caja abierta O consolidada es OBLIGATORIA para TODAS las conversiones
                $usuario     = request()->user();
                $politica    = $request->input('politica_pago') ?? 'CONTRA_ENTREGA';
                $montoPagado = (float) ($request->input('monto_pagado') ?? 0);

                // ✅ NUEVO: Para CONTRA_ENTREGA, forzar monto_pagado = total (para registrar en caja)
                // Pero estado_pago seguirá siendo PENDIENTE
                $totalProforma = max(0, $proforma->subtotal - ($proforma->descuento ?? 0));
                if ($politica === 'CONTRA_ENTREGA') {
                    $montoPagado = $totalProforma;
                }

                // 📊 LOG: INICIO DEL FLUJO DE CONVERSIÓN
                Log::info('🚀 [ApiProformaController::convertirAVenta] INICIO DEL FLUJO', [
                    'proforma_id'     => $proforma->id,
                    'proforma_numero' => $proforma->numero,
                    'usuario_id'      => $usuario->id,
                    'usuario_nombre'  => $usuario->name,
                    'usuario_roles'   => $usuario->getRoleNames()->toArray(),
                    'cliente_id'      => $proforma->cliente_id,
                    'cliente_nombre'  => $proforma->cliente->nombre,
                ]);

                // 📊 LOG: PARÁMETROS DE PAGO RECIBIDOS
                Log::info('💳 [convertirAVenta] Parámetros de pago', [
                    'politica_pago' => $politica,
                    'monto_pagado'  => $montoPagado,
                    'tipo_pago_id'  => $request->input('tipo_pago_id'),
                    'con_pago'      => $request->input('con_pago', false),
                ]);

                // ✅ VALIDACIÓN: Caja abierta HOY (sin importar si es admin o cajero)
                $cajaAbiertaHoy = AperturaCaja::where('user_id', $usuario->id)
                    ->whereDoesntHave('cierre')
                    ->exists();

                // 📊 LOG: Búsqueda de caja del día actual
                Log::info('🔍 [convertirAVenta] Buscando caja abierta de HOY', [
                    'usuario_id'       => $usuario->id,
                    'caja_abierta_hoy' => $cajaAbiertaHoy,
                ]);

                // ✅ VALIDACIÓN: Caja consolidada en últimas 24h
                $cierreConsolidadoReciente = CierreCaja::where('user_id', $usuario->id)
                    ->whereHas('estadoCierre', function ($q) {
                        $q->where('codigo', 'CONSOLIDADA');
                    })
                    ->whereDate('fecha', '>=', now()->subDay())
                    ->whereDate('fecha', '<=', now())
                    ->exists();

                // ❌ Si no tiene caja abierta NI caja consolidada → RECHAZAR
                if (! $cajaAbiertaHoy && ! $cierreConsolidadoReciente) {
                    Log::error('❌ [convertirAVenta] RECHAZADA: No hay caja abierta ni consolidada', [
                        'proforma_id'                 => $proforma->id,
                        'usuario_id'                  => $usuario->id,
                        'caja_abierta_hoy'            => $cajaAbiertaHoy,
                        'cierre_consolidado_reciente' => $cierreConsolidadoReciente,
                    ]);

                    return response()->json([
                        'success'  => false,
                        'message'  => 'No puede convertir proforma a venta sin una caja abierta o consolidada del día anterior. Por favor, abra una caja primero.',
                        'code'     => 'CAJA_NO_DISPONIBLE',
                        'detalles' => [
                            'politica_pago'    => $politica,
                            'monto_pagado'     => $montoPagado,
                            'motivo'           => 'Requiere caja abierta HOY o consolidada en las últimas 24 horas',
                            'accion_requerida' => 'Abra una caja en /cajas antes de convertir esta proforma',
                        ],
                    ], 422);
                }

                // ✅ Log: Validación de caja exitosa
                $estadoCajaActual = $cajaAbiertaHoy ? 'ABIERTA' : 'CONSOLIDADA_RECIENTE';

                Log::info('✅ [ApiProformaController::convertirAVenta] Validación de caja exitosa', [
                    'proforma_id' => $proforma->id,
                    'usuario_id'  => $usuario->id,
                    'estado_caja' => $estadoCajaActual,
                    'politica'    => $politica,
                    'monto'       => $montoPagado,
                ]);

                // ✅ VALIDACIÓN 0.2: Si la política es CREDITO, validar permisos del cliente
                if ($politica === 'CREDITO') {
                    $cliente = $proforma->cliente;

                    if (! $cliente->puede_tener_credito) {
                        Log::warning('⚠️ Cliente no tiene permiso de crédito', [
                            'cliente_id'  => $cliente->id,
                            'proforma_id' => $proforma->id,
                        ]);

                        return response()->json([
                            'success' => false,
                            'message' => "El cliente '{$cliente->nombre}' no tiene permiso para solicitar crédito",
                            'code' => 'CLIENTE_SIN_PERMISO_CREDITO',
                        ], 422);
                    }

                    if (! $cliente->limite_credito || $cliente->limite_credito <= 0) {
                        Log::warning('⚠️ Cliente sin límite de crédito', [
                            'cliente_id'  => $cliente->id,
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
                    $totalProforma   = (float) $proforma->total;

                    if ($saldoDisponible < $totalProforma) {
                        return response()->json([
                            'success' => false,
                            'message' => "Crédito insuficiente para esta venta",
                            'code'    => 'CREDITO_INSUFICIENTE',
                            'datos'   => [
                                'monto_venta'      => $totalProforma,
                                'saldo_disponible' => $saldoDisponible,
                                'limite_credito'   => (float) $cliente->limite_credito,
                            ],
                        ], 422);
                    }
                }

                // Validación 1: La proforma debe poder convertirse
                if (! $proforma->puedeConvertirseAVenta()) {
                    return response()->json([
                        'success'       => false,
                        'message'       => 'Esta proforma no puede convertirse a venta',
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
                        'proforma_id'      => $proforma->id,
                        'reservas_activas' => $reservasActivas,
                    ]);
                } else {
                    // NO hay reservas: intentar crearlas automáticamente
                    Log::info('⚠️  No hay reservas para proforma ' . $proforma->numero . ', intentando crearlas...');

                    $reservasCreadas = $proforma->reservarStock();

                    if (! $reservasCreadas) {
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
                // ✅ CAMBIO: Total SIN impuesto (subtotal - descuento)
                $total = max(0, $proforma->subtotal - ($proforma->descuento ?? 0));

                // Lógica mejorada para determinar estado de pago según política
                $estadoPago = match ($politica) {
                    // CREDITO: No requiere pago inmediato, se registra como cuenta por cobrar
                    'CREDITO'        => 'PENDIENTE',

                    // ANTICIPADO_100: Requiere 100% de pago, si se pagó todo = PAGADO
                    'ANTICIPADO_100' => ($montoPagado >= $total) ? 'PAGADO' : 'PARCIAL',

                    // MEDIO_MEDIO: Requiere 50% mínimo
                    // Si se pagó el 100% = PAGADO
                    // Si se pagó entre 50%-100% = PARCIAL
                    // Si se pagó menos de 50% = PENDIENTE
                    'MEDIO_MEDIO'    => match (true) {
                        $montoPagado >= $total       => 'PAGADO',
                        $montoPagado >= ($total / 2) => 'PARCIAL',
                        default                      => 'PENDIENTE',
                    },

                    // CONTRA_ENTREGA: Se paga en la entrega, siempre inicia como PENDIENTE
                    'CONTRA_ENTREGA' => 'PENDIENTE',

                // Default: PENDIENTE (seguridad)
                    default          => 'PENDIENTE',
                };

                // NUEVO: Determinar requiere_envio y estado_logistico según tipo_entrega
                $tipoEntrega   = $proforma->tipo_entrega ?? 'DELIVERY';
                $requiereEnvio = $tipoEntrega === 'DELIVERY';

                // REFACTORIZADO: Obtener IDs de estados en lugar de strings ENUM
                if ($tipoEntrega === 'PICKUP') {
                    $estadoLogisticoId = \App\Models\Venta::obtenerIdEstado('PENDIENTE_RETIRO', 'venta_logistica');
                } else {
                    // DELIVERY
                    $estadoLogisticoId = \App\Models\Venta::obtenerIdEstado('PENDIENTE_ENVIO', 'venta_logistica');
                }

                if (! $estadoLogisticoId) {
                    throw new \Exception('No se encontraron los estados logísticos requeridos en la base de datos');
                }

                // ✅ NUEVO: Obtener caja abierta ANTES de crear la venta
                // El listener RegisterCajaMovementFromVentaListener requiere este ID
                $cajaAbiertaParaRegistro = \App\Models\AperturaCaja::where('user_id', $usuario->id)
                    ->delDia()
                    ->abiertas()
                    ->with('caja')
                    ->latest()
                    ->first();

                // Si no hay caja de hoy, buscar la más reciente
                if (! $cajaAbiertaParaRegistro) {
                    $cajaAbiertaParaRegistro = \App\Models\AperturaCaja::where('user_id', $usuario->id)
                        ->abiertas()
                        ->with('caja')
                        ->latest('fecha')
                        ->first();
                }

                $cajaIdParaGuardar = $cajaAbiertaParaRegistro?->caja_id ?? null;

                // ✅ NUEVO: Calcular peso total desde detalles
                // Fórmula: pesoTotal = Σ(cantidad × peso_producto)
                $pesoTotal = 0;
                foreach ($proforma->detalles as $detalle) {
                    $pesoProducto  = $detalle->producto?->peso ?? 0;
                    $pesoTotal    += $detalle->cantidad * $pesoProducto;
                }

                // Preparar datos para la venta desde la proforma
                $datosVenta = [
                    'numero'                     => '0', // ✅ TEMP: Se asignará al ID después de crear
                    'fecha'                      => now()->toDateString(),
                    'subtotal'                   => $proforma->subtotal,
                    'descuento'                  => $proforma->descuento ?? 0,
                    'impuesto'                   => 0,                                                         // ✅ NUEVO: La empresa NO usa impuesto
                    'total'                      => max(0, $proforma->subtotal - ($proforma->descuento ?? 0)), // ✅ CAMBIO: Total SIN impuesto (subtotal - descuento)
                    'peso_total_estimado'        => $pesoTotal,                                                // ✅ NUEVO: Pasar peso calculado
                    'observaciones'              => $proforma->observaciones,
                    'cliente_id'                 => $proforma->cliente_id,
                    'usuario_id'                 => request()->user()->id,
                    'moneda_id'                  => $proforma->moneda_id,
                    'proforma_id'                => $proforma->id,
                                                                    // Campos de logística
                    'tipo_entrega'               => $tipoEntrega,   // NUEVO
                    'requiere_envio'             => $requiereEnvio, // MODIFICADO
                    'canal_origen'               => $proforma->canal_origen,
                    'estado_logistico_id'        => $estadoLogisticoId, // REFACTORIZADO: Ahora es FK
                                                                        // Campos de entrega comprometida (desde coordinación de proforma)
                                                                        // MODIFICADO: Solo para DELIVERY (null para PICKUP)
                    'direccion_cliente_id'       => $tipoEntrega === 'DELIVERY'
                        ? ($proforma->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_solicitada_id)
                        : null,
                    'fecha_entrega_comprometida' => $proforma->fecha_entrega_confirmada,
                    'hora_entrega_comprometida'  => $proforma->hora_entrega_confirmada,     // Hora SLA (inicio del rango)
                    'ventana_entrega_ini'        => $proforma->hora_entrega_confirmada,     // Inicio del rango de entrega
                    'ventana_entrega_fin'        => $proforma->hora_entrega_confirmada_fin, // Fin del rango de entrega
                    'idempotency_key'            => \Illuminate\Support\Str::uuid()->toString(),
                    // Campos de pago
                    'tipo_pago_id'               => $request->input('tipo_pago_id'),
                    'politica_pago'              => $politica,
                    'estado_pago'                => $estadoPago,
                    'monto_pagado'               => $montoPagado,
                    'monto_pendiente'            => max(0, ($proforma->subtotal - ($proforma->descuento ?? 0)) - $montoPagado),
                    // ✅ Estado del documento: APROBADO (ID=3) cuando se convierte proforma aprobada a venta
                    'estado_documento_id'        => \App\Models\EstadoDocumento::where('codigo', 'APROBADO')
                        ->where('activo', true)
                        ->first()?->id ?? 3,
                    // ✅ NUEVO: Guardar caja_id en ventas incluso para CONTRA_ENTREGA
                    'caja_id'                    => $cajaAbiertaParaRegistro?->caja_id ?? null,
                ];

                // Crear la venta
                // IMPORTANTE: NO se procesa stock aquí, se hace al consumir reservas
                $venta = \App\Models\Venta::create($datosVenta);

                // ✅ NUEVO: Asignar número de venta con formato VEN + FECHA + ID
                $numeroVenta = 'VEN' . now()->format('Ymd') . '-' . str_pad($venta->id, 4, '0', STR_PAD_LEFT);
                $venta->update(['numero' => $numeroVenta]);
                Log::info('✅ [convertirAVenta] Número de venta asignado con ID', [
                    'venta_id'     => $venta->id,
                    'numero_venta' => $numeroVenta,
                ]);

                // 🔑 CRÍTICO: Obtener caja abierta para establecer en atributo especial
                // El listener RegisterCajaMovementFromVentaListener requiere _caja_id para registrar en caja
                $cajaAbiertaParaRegistro = \App\Models\AperturaCaja::where('user_id', request()->user()->id)
                    ->delDia()
                    ->abiertas()
                    ->with('caja')
                    ->latest()
                    ->first();

                // Si no hay caja de hoy, buscar la más reciente
                if (! $cajaAbiertaParaRegistro) {
                    $cajaAbiertaParaRegistro = \App\Models\AperturaCaja::where('user_id', request()->user()->id)
                        ->abiertas()
                        ->with('caja')
                        ->latest('fecha')
                        ->first();
                }

                // ✅ Establecer atributo especial para el listener
                if ($cajaAbiertaParaRegistro) {
                    $venta->setAttribute('_caja_id', $cajaAbiertaParaRegistro->caja_id);
                    Log::info('🔑 [convertirAVenta] Establecido _caja_id para listener', [
                        'venta_id'    => $venta->id,
                        'caja_id'     => $cajaAbiertaParaRegistro->caja_id,
                        'caja_nombre' => $cajaAbiertaParaRegistro->caja?->nombre,
                    ]);
                } else {
                    Log::warning('⚠️ [convertirAVenta] No hay caja para establecer _caja_id', [
                        'venta_id'   => $venta->id,
                        'usuario_id' => request()->user()->id,
                    ]);
                }

                // ✅ DISPARO MANUAL DEL EVENTO: VentaCreada (para que se registre en caja)
                event(new \App\Events\VentaCreada($venta));

                // Crear detalles de la venta desde los detalles de la proforma
                foreach ($proforma->detalles as $detalleProforma) {
                    // ✅ NUEVO: Copiar combo_items_seleccionados si existen (mismo procesamiento que VentaService)
                    $comboItemsSeleccionados = null;
                    if ($detalleProforma->combo_items_seleccionados && is_array($detalleProforma->combo_items_seleccionados)) {
                        $comboItemsSeleccionados = array_map(function ($item) {
                            return [
                                'combo_item_id' => $item['combo_item_id'] ?? null,
                                'producto_id'   => $item['producto_id'] ?? null,
                                'incluido'      => $item['incluido'] ?? false,
                            ];
                        }, $detalleProforma->combo_items_seleccionados);
                    }

                    $venta->detalles()->create([
                        'producto_id'               => $detalleProforma->producto_id,
                        'cantidad'                  => $detalleProforma->cantidad,
                        'precio_unitario'           => $detalleProforma->precio_unitario,
                        'subtotal'                  => $detalleProforma->subtotal,
                        // ✅ NUEVO: Copiar campos faltantes desde detalle de proforma
                        'tipo_precio_id'            => $detalleProforma->tipo_precio_id,
                        'tipo_precio_nombre'        => $detalleProforma->tipo_precio_nombre,
                        'combo_items_seleccionados' => $comboItemsSeleccionados,
                    ]);
                }

                // Marcar la proforma como convertida
                if (! $proforma->marcarComoConvertida()) {
                    throw new \Exception('Error al marcar la proforma como convertida');
                }

                // ✅ CRÍTICO: Consumir reservas DIRECTAMENTE (no confiar en Observer en transacción)
                // El Observer puede no dispararse dentro de una transacción en algunos casos
                Log::info('🔄 [ApiProformaController::convertirAVenta] Consumiendo reservas después de convertida', [
                    'proforma_id' => $proforma->id,
                ]);

                // 📊 NUEVO: Obtener detalles de reservas ANTES de consumir
                // ✅ FIXED: Las reservas están relacionadas con proforma + stockProducto, no con detalleProforma
                $reservasDetalles = [];
                $reservasActivas  = $proforma->reservas()->where('estado', 'ACTIVA')->get();

                if ($reservasActivas->isNotEmpty()) {
                    // Agrupar reservas por producto
                    $reservasPorProducto = $reservasActivas->groupBy(fn($r) => $r->stockProducto?->producto_id);

                    foreach ($reservasPorProducto as $productoId => $reservasProducto) {
                        $detalleProducto = $proforma->detalles->firstWhere('producto_id', $productoId);
                        if ($detalleProducto) {
                            $reservasDetalles[] = [
                                'producto_id'         => $productoId,
                                'producto_nombre'     => $detalleProducto->producto?->nombre,
                                'producto_sku'        => $detalleProducto->producto?->codigoPrincipal?->codigo,
                                'cantidad_solicitada' => $detalleProducto->cantidad,
                                'cantidad_reservada'  => $reservasProducto->sum('cantidad_reservada'),
                                'cantidad_lotes'      => $reservasProducto->count(),
                                'lotes'               => $reservasProducto->map(fn($r) => [
                                    'id'                => $r->id,
                                    'cantidad'          => $r->cantidad_reservada,
                                    'lote'              => $r->stockProducto?->lote,
                                    'fecha_vencimiento' => $r->stockProducto?->fecha_vencimiento?->format('Y-m-d'),
                                ])->toArray(),
                            ];
                        }
                    }
                }

                try {
                    $proforma->consumirReservas($numeroVenta);
                    Log::info('✅ [ApiProformaController::convertirAVenta] Reservas consumidas exitosamente', [
                        'proforma_id'                    => $proforma->id,
                        'numero_venta'                   => $numeroVenta,
                        'cantidad_detalles_con_reservas' => count($reservasDetalles),
                    ]);
                } catch (\Exception $e) {
                    Log::error('❌ [ApiProformaController::convertirAVenta] Error al consumir reservas', [
                        'proforma_id'  => $proforma->id,
                        'numero_venta' => $numeroVenta,
                        'error'        => $e->getMessage(),
                    ]);
                    throw $e;
                }

                // ✅ NUEVO: Registrar movimiento de caja para pagos inmediatos (anticipados) y créditos
                // Se registra para políticas: ANTICIPADO_100, MEDIO_MEDIO, CREDITO
                if (in_array($politica, ['ANTICIPADO_100', 'MEDIO_MEDIO', 'CREDITO'])) {
                    // 📊 LOG: Llamada a registrarMovimientoCajaParaPago
                    Log::info('📋 [convertirAVenta] Registrando movimiento en caja', [
                        'venta_id'      => $venta->id,
                        'venta_numero'  => $venta->numero,
                        'proforma_id'   => $proforma->id,
                        'politica_pago' => $politica,
                        'monto_pagado'  => $montoPagado,
                        'total_venta'   => $venta->total,
                    ]);

                    $this->registrarMovimientoCajaParaPago(
                        $venta,
                        $proforma,
                        $politica,
                        $montoPagado,
                        request()->user()
                    );

                    Log::info('✅ [convertirAVenta] Movimiento en caja registrado exitosamente', [
                        'venta_id'      => $venta->id,
                        'politica_pago' => $politica,
                    ]);
                } else {
                    Log::info('⏭️ [convertirAVenta] No se registra en caja (política no requiere)', [
                        'venta_id'      => $venta->id,
                        'politica_pago' => $politica,
                    ]);
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

                // ✅ DESACTIVADO: Usar solo servidor WebSocket de Node.js (./paucara/websocket)
                // Las notificaciones se envían directamente desde SendProformaConvertedNotification listener
                // No usamos Pusher broadcasting porque tenemos WebSocket nativo en Node.js
                Log::info('✅ [convertirAVenta] Notificaciones manejadas por servidor WebSocket Node.js (SendProformaConvertedNotification)', [
                    'proforma_id' => $proforma->id,
                    'venta_id'    => $venta->id,
                ]);

                // ✅ MEJORADO: Log detallado con información de política de pago
                Log::info('🎉 [convertirAVenta] FLUJO COMPLETADO EXITOSAMENTE', [
                    'proforma_id'     => $proforma->id,
                    'proforma_numero' => $proforma->numero,
                    'venta_id'        => $venta->id,
                    'venta_numero'    => $venta->numero,
                    'cliente_id'      => $venta->cliente_id,
                    'cliente_nombre'  => $venta->cliente->nombre,
                    'usuario_id'      => request()->user()->id,
                    'usuario_nombre'  => request()->user()->name,
                ]);

                Log::info('💰 [convertirAVenta] Detalles de pago registrados', [
                    'venta_id'            => $venta->id,
                    'total'               => (float) $venta->total,
                    'politica_pago'       => $politica,
                    'estado_pago'         => $estadoPago,
                    'monto_pagado'        => $montoPagado,
                    'monto_pendiente'     => (float) ($total - $montoPagado),
                    'requiere_envio'      => $venta->requiere_envio,
                    'reservas_consumidas' => $reservasActivas,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Proforma {$proforma->numero} convertida exitosamente a venta {$venta->numero}",
                    'data' => [
                        'venta'           => [
                            'id'               => $venta->id,
                            'numero'           => $venta->numero,
                            'fecha'            => $venta->fecha->format('Y-m-d'),
                            'total'            => (float) $venta->total,
                            'cliente'          => [
                                'id'     => $venta->cliente->id,
                                'nombre' => $venta->cliente->nombre,
                            ],
                            'estado_documento' => $venta->estadoDocumento?->nombre,
                            'requiere_envio'   => $venta->requiere_envio,
                            'estado_logistico' => $venta->estado_logistico,
                            // ✅ NUEVO: Información de pago
                            'pago'             => [
                                'politica_pago'   => $politica,
                                'estado_pago'     => $estadoPago,
                                'monto_pagado'    => $montoPagado,
                                'monto_pendiente' => (float) ($total - $montoPagado),
                            ],
                        ],
                        'proforma'        => [
                            'id'            => $proforma->id,
                            'numero'        => $proforma->numero,
                            'estado'        => $proforma->estado,
                            'politica_pago' => $proforma->politica_pago,
                        ],
                        // ✅ NUEVO: Información detallada de reservas consumidas
                        'stock_consumido' => [
                            'cantidad_productos'     => count($reservasDetalles),
                            'cantidad_lotes_totales' => collect($reservasDetalles)->sum('cantidad_lotes'),
                            'mensaje'                => count($reservasDetalles) === 0
                                ? '✅ Venta creada sin reservas de stock'
                                : '✅ ' . count($reservasDetalles) . ' producto(s) desreservado(s) - Stock consumido',
                            'detalles'               => $reservasDetalles,
                        ],
                    ],
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();

                Log::error('Error al convertir proforma a venta (API)', [
                    'proforma_id' => $proforma->id,
                    'error'       => $e->getMessage(),
                    'trace'       => $e->getTraceAsString(),
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
            if ($usuarioActual->id !== (int) $usuarioId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado para acceder a este carrito',
                ], 403);
            }

            // Obtener el cliente del usuario autenticado
            $cliente = Cliente::where('user_id', $usuarioId)->first();
            if (! $cliente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no tiene un cliente asociado',
                    'data'    => null,
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

            if (! $proforma) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay carrito guardado para este usuario',
                    'data'    => null,
                ], 200);
            }

            return response()->json([
                'success' => true,
                'message' => 'Carrito recuperado exitosamente',
                'data'    => [
                    'id'                              => $proforma->id,
                    'numero'                          => $proforma->numero,
                    'fecha'                           => $proforma->fecha,
                    'subtotal'                        => $proforma->subtotal,
                    'descuento'                       => $proforma->descuento,
                    'impuesto'                        => $proforma->impuesto,
                    'total'                           => $proforma->total,
                    'estado'                          => $proforma->estado,
                    'observaciones'                   => $proforma->observaciones,
                    'canal_origen'                    => $proforma->canal_origen,
                    'requiere_envio'                  => $proforma->requiere_envio,
                    // Información de entrega
                    'fecha_entrega_solicitada'        => $proforma->fecha_entrega_solicitada,
                    'hora_entrega_solicitada'         => $proforma->hora_entrega_solicitada,
                    'direccion_entrega_solicitada_id' => $proforma->direccion_entrega_solicitada_id,
                    'direccionSolicitada'             => $proforma->direccionSolicitada ? [
                        'id'        => $proforma->direccionSolicitada->id,
                        'direccion' => $proforma->direccionSolicitada->direccion,
                        'latitud'   => $proforma->direccionSolicitada->latitud,
                        'longitud'  => $proforma->direccionSolicitada->longitud,
                    ] : null,
                    // Detalles de la proforma
                    'detalles'                        => $proforma->detalles->map(function ($detalle) {
                        return [
                            'id'              => $detalle->id,
                            'producto_id'     => $detalle->producto_id,
                            'cantidad'        => $detalle->cantidad,
                            'precio_unitario' => $detalle->precio_unitario,
                            'descuento'       => $detalle->descuento,
                            'subtotal'        => $detalle->subtotal,
                            'producto'        => [
                                'id'           => $detalle->producto->id,
                                'nombre'       => $detalle->producto->nombre,
                                'codigo'       => $detalle->producto->codigo,
                                'precio_venta' => $detalle->producto->precio_venta,
                            ],
                        ];
                    })->toArray(),
                    'created_at'                      => $proforma->created_at->toIso8601String(),
                    'updated_at'                      => $proforma->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al obtener último carrito', [
                'usuario_id' => $request->route('usuarioId'),
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
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
        // ✅ NUEVO 2026-02-21: Usar la misma lógica de filtrado que el API
        $user = Auth::user();

        // Construir query base
        $query = Proforma::query();

        // Filtrado por rol
        if ($user->hasRole('cliente') || $user->cliente_id) {
            $clienteId = $user->cliente_id ?? $user->cliente->id ?? null;

            if (! $clienteId) {
                return Inertia::render('Error', [
                    'message' => 'Usuario no tiene un cliente asociado',
                    'status'  => 403,
                ]);
            }

            $query->where('cliente_id', $clienteId);
        } elseif ($user->hasRole('Preventista')) {
            $query->where('usuario_creador_id', $user->id);
        } elseif ($user->hasAnyRole(['Gestor de Logística', 'Admin', 'Cajero', 'Manager', 'Chofer', 'Encargado'])) {
            // Dashboard: todas las proformas
        } else {
            return Inertia::render('Error', [
                'message' => 'No tiene permisos para ver proformas',
                'status'  => 403,
            ]);
        }

        // ✅ NUEVO: Búsqueda general (ID, número, cliente)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('numero', 'like', "%{$search}%")
                  ->orWhereHas('cliente', function ($q) use ($search) {
                      $q->whereRaw('LOWER(nombre) like ?', ["%{$search}%"]);
                  });
            });
        }

        // Filtros por parámetros
        if ($request->filled('estado')) {
            $estadoCode = strtoupper($request->estado);
            $estadoId = DB::table('estados_logistica')
                ->where('codigo', $estadoCode)
                ->where('categoria', 'proforma')
                ->value('id');

            if ($estadoId) {
                $query->where('estado_proforma_id', $estadoId);
            }
        }

        // ✅ NUEVO: Filtro por cliente_id
        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        // ✅ NUEVO: Filtro por usuario_creador_id
        if ($request->filled('usuario_creador_id')) {
            $query->where('usuario_creador_id', $request->usuario_creador_id);
        }

        // ✅ NUEVO: Filtro por monto mínimo
        if ($request->filled('total_min')) {
            $query->where('total', '>=', floatval($request->total_min));
        }

        // ✅ NUEVO: Filtro por monto máximo
        if ($request->filled('total_max')) {
            $query->where('total', '<=', floatval($request->total_max));
        }

        // ✅ NUEVO: Filtro por proformas vencidas/vigentes
        if ($request->filled('filtro_vencidas')) {
            $hoy = now()->startOfDay();
            if ($request->filtro_vencidas === 'VENCIDAS') {
                $query->whereDate('fecha_vencimiento', '<', $hoy);
            } elseif ($request->filtro_vencidas === 'VIGENTES') {
                $query->where(function ($q) use ($hoy) {
                    $q->whereDate('fecha_vencimiento', '>=', $hoy)
                      ->orWhereNull('fecha_vencimiento');
                });
            }
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        // Eager loading y paginación
        $proformas = $query->with([
            'cliente',
            'usuarioCreador',
            'detalles.producto',
            'direccionSolicitada',
            'direccionConfirmada',
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
     * ✅ REFACTORIZADO: Ajustar reservaciones cuando se actualizan detalles de proforma
     *
     * Maneja CORRECTAMENTE múltiples lotes (FIFO al aumentar, LIFO al disminuir):
     * - Agrupa reservas por producto_id (no por lote individual)
     * - Libera TODAS las reservas de productos removidos
     * - Ajusta cantidades si disminuyeron (libera desde lotes más recientes - LIFO)
     * - Crea nuevas reservas con FIFO si aumentaron o se agregaron productos
     *
     * @param Proforma $proforma
     * @param array $detallesGuardados Array de detalles nuevos: [{'producto_id': X, 'cantidad': Y}, ...]
     * @return void
     */
    private function ajustarReservacionesAlActualizarDetalles(Proforma $proforma, array $detallesGuardados)
    {
        try {
            Log::info('🔄 Iniciando ajuste de reservaciones (MULTI-LOTE)', [
                'proforma_id'     => $proforma->id,
                'detalles_nuevos' => count($detallesGuardados),
            ]);

            // 1️⃣ AGRUPAR reservas por producto_id (no por lote individual)
            $reservasPorProducto = $proforma->reservasActivas()
                ->with('stockProducto.producto')
                ->get()
                ->groupBy(fn($r) => $r->stockProducto->producto_id);

            // 2️⃣ Crear mapa de producto_id → cantidad esperada (de los nuevos detalles)
            $detallesMap = [];
            foreach ($detallesGuardados as $detalle) {
                $producto_id               = (int) $detalle['producto_id'];
                $cantidad                  = (int) $detalle['cantidad'];
                $detallesMap[$producto_id] = ($detallesMap[$producto_id] ?? 0) + $cantidad;
            }

            // 🎁 IMPORTANTE: Expandir COMBOS en el mapa de detalles esperados
            // Esto es CRÍTICO porque las reservas actuales tienen los componentes expandidos,
            // pero el mapa esperado solo tiene el combo padre. Necesitamos expandir para comparar correctamente.
            $stockService = new StockService();

            foreach ($detallesGuardados as $detalle) {
                $producto = Producto::find($detalle['producto_id']);

                if ($producto && $producto->es_combo) {
                    $cantidadCombos = (int) $detalle['cantidad'];

                    Log::info('🎁 Expandiendo COMBO en mapa de detalles esperados', [
                        'combo_id'        => $producto->id,
                        'cantidad_combos' => $cantidadCombos,
                    ]);

                    // Expandir el combo usando la misma lógica que en creación de proformas
                    $componentesExpandidos = $stockService->expandirCombos([
                        [
                            'producto_id'               => $producto->id,
                            'cantidad'                  => $cantidadCombos,
                            'combo_items_seleccionados' => $detalle['combo_items_seleccionados'] ?? null,
                        ],
                    ]);

                    // Agregar componentes al mapa (reemplazar el combo)
                    foreach ($componentesExpandidos as $componente) {
                        $productoComponenteId = $componente['producto_id'];
                        $cantidadComponente   = $componente['cantidad'];

                        $detallesMap[$productoComponenteId] =
                            ($detallesMap[$productoComponenteId] ?? 0) + $cantidadComponente;

                        Log::info('  ├─ Componente agregado al mapa', [
                            'componente_id' => $productoComponenteId,
                            'cantidad'      => $cantidadComponente,
                        ]);
                    }

                    // REMOVER el combo del mapa (nunca se reserva directamente, solo sus componentes)
                    unset($detallesMap[$detalle['producto_id']]);
                    Log::info('  └─ Combo removido del mapa (ya está expandido)', [
                        'combo_id' => $detalle['producto_id'],
                    ]);
                }
            }

            Log::info('📊 Mapa de detalles esperados (DESPUÉS DE EXPANDIR COMBOS)', ['mapa' => $detallesMap]);

            // Instanciar servicio de distribución
            $reservaService = new ReservaDistribucionService();

            // 3️⃣ PROCESAR POR PRODUCTO (agrupar todas las reservas del mismo producto)
            foreach ($reservasPorProducto as $producto_id => $reservasDelProducto) {
                // Calcular cantidad total reservada para este producto (suma de todos los lotes)
                $cantidadTotalReservada = $reservasDelProducto->sum('cantidad_reservada');
                $cantidadEsperada       = $detallesMap[$producto_id] ?? 0;

                Log::info('📋 Procesando producto', [
                    'producto_id'               => $producto_id,
                    'cantidad_reservada_actual' => $cantidadTotalReservada,
                    'cantidad_esperada'         => $cantidadEsperada,
                    'cantidad_lotes'            => $reservasDelProducto->count(),
                ]);

                if ($cantidadEsperada === 0) {
                    // ❌ PRODUCTO REMOVIDO: Liberar TODOS los lotes de este producto
                    Log::info('📤 Producto removido de proforma, liberando TODOS los lotes', [
                        'producto_id'              => $producto_id,
                        'cantidad_total_a_liberar' => $cantidadTotalReservada,
                        'cantidad_lotes'           => $reservasDelProducto->count(),
                    ]);

                    foreach ($reservasDelProducto as $reserva) {
                        $this->liberarReservaConMovimiento(
                            $reserva,
                            'Detalle removido de proforma',
                            $proforma->numero
                        );
                    }

                } elseif ($cantidadEsperada < $cantidadTotalReservada) {
                    // 📉 REDUCCIÓN: Liberar desde los lotes más recientes (LIFO)
                    $cantidadALiberar = $cantidadTotalReservada - $cantidadEsperada;

                    Log::info('📉 Cantidad de producto disminuyó, liberando desde lotes más recientes (LIFO)', [
                        'producto_id'              => $producto_id,
                        'cantidad_total_reservada' => $cantidadTotalReservada,
                        'cantidad_esperada'        => $cantidadEsperada,
                        'cantidad_a_liberar'       => $cantidadALiberar,
                    ]);

                    // Ordenar por ID DESC (más recientes primero) y iterar
                    foreach ($reservasDelProducto->sortByDesc('id') as $reserva) {
                        if ($cantidadALiberar <= 0) {
                            break; // Ya se liberó todo lo necesario
                        }

                        $cantidadReservada = $reserva->cantidad_reservada;

                        if ($cantidadReservada <= $cantidadALiberar) {
                            // Liberar COMPLETAMENTE este lote
                            Log::info('🗑️ Liberando lote completamente', [
                                'reserva_id' => $reserva->id,
                                'cantidad'   => $cantidadReservada,
                            ]);
                            $this->liberarReservaConMovimiento(
                                $reserva,
                                'Reducción de cantidad en proforma',
                                $proforma->numero
                            );
                            $cantidadALiberar -= $cantidadReservada;
                        } else {
                            // Liberar PARCIALMENTE este lote
                            Log::info('⚠️ Liberando lote parcialmente', [
                                'reserva_id'               => $reserva->id,
                                'cantidad_a_liberar'       => $cantidadALiberar,
                                'cantidad_total_reservada' => $cantidadReservada,
                            ]);
                            $this->liberarExcesoReserva(
                                $reserva,
                                $cantidadALiberar,
                                'Reducción de cantidad en proforma',
                                $proforma->numero
                            );
                            // Actualizar la reserva con la nueva cantidad
                            $reserva->update(['cantidad_reservada' => $cantidadReservada - $cantidadALiberar]);
                            $cantidadALiberar = 0;
                        }
                    }

                } elseif ($cantidadEsperada > $cantidadTotalReservada) {
                    // 📈 AUMENTO: Usar ReservaDistribucionService para FIFO (solo agregar la diferencia)
                    $diferencia = $cantidadEsperada - $cantidadTotalReservada;

                    Log::info('📈 Cantidad de producto aumentó, reservando nuevos lotes con FIFO', [
                        'producto_id'               => $producto_id,
                        'cantidad_reservada_actual' => $cantidadTotalReservada,
                        'cantidad_esperada'         => $cantidadEsperada,
                        'cantidad_a_reservar'       => $diferencia,
                    ]);

                    $resultado = $reservaService->distribuirReserva(
                        $proforma,
                        $producto_id,
                        $diferencia,
                        3// dias_vencimiento por defecto
                    );

                    if (! $resultado['success']) {
                        Log::warning('⚠️ No se pudo reservar la cantidad completa (FIFO)', [
                            'producto_id'         => $producto_id,
                            'cantidad_solicitada' => $diferencia,
                            'error'               => $resultado['error'],
                        ]);
                    } else {
                        Log::info('✅ Nuevas reservas creadas con FIFO', [
                            'producto_id'        => $producto_id,
                            'cantidad_reservada' => $resultado['resumen']['cantidad_reservada'],
                            'cantidad_lotes'     => $resultado['resumen']['cantidad_lotes'],
                        ]);
                    }

                } else {
                    // ✅ Cantidad igual: no hacer nada
                    Log::info('✅ Cantidad de producto sin cambios', [
                        'producto_id' => $producto_id,
                        'cantidad'    => $cantidadTotalReservada,
                    ]);
                }

                // Marcar como procesado
                unset($detallesMap[$producto_id]);
            }

            // 4️⃣ Crear nuevas reservas para PRODUCTOS AGREGADOS (no en reservas actuales)
            foreach ($detallesMap as $producto_id => $cantidad) {
                if ($cantidad > 0) {
                    Log::info('➕ Creando reservas para producto agregado', [
                        'producto_id' => $producto_id,
                        'cantidad'    => $cantidad,
                    ]);

                    $resultado = $reservaService->distribuirReserva(
                        $proforma,
                        $producto_id,
                        $cantidad,
                        3// dias_vencimiento por defecto
                    );

                    if (! $resultado['success']) {
                        Log::warning('⚠️ No se pudo reservar producto agregado', [
                            'producto_id'         => $producto_id,
                            'cantidad_solicitada' => $cantidad,
                            'error'               => $resultado['error'],
                        ]);
                    } else {
                        Log::info('✅ Reservas creadas para producto agregado', [
                            'producto_id'        => $producto_id,
                            'cantidad_reservada' => $resultado['resumen']['cantidad_reservada'],
                            'cantidad_lotes'     => $resultado['resumen']['cantidad_lotes'],
                        ]);
                    }
                }
            }

            Log::info('✅ Ajuste de reservaciones completado (MULTI-LOTE)', [
                'proforma_id' => $proforma->id,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error ajustando reservaciones', [
                'proforma_id' => $proforma->id,
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
            ]);
            // No lanzar excepción: solo registrar en log para no bloquear la actualización
        }
    }

    /**
     * Liberar una reserva completa
     */
    private function liberarReservaConMovimiento(\App\Models\ReservaProforma $reserva, string $motivo, ?string $numeroProforma = null)
    {
        if ($reserva->estado !== \App\Models\ReservaProforma::ACTIVA) {
            return;
        }

        try {
            // 1️⃣ Obtener stock ANTES de cambios
            $stockProducto             = \App\Models\StockProducto::lockForUpdate()->findOrFail($reserva->stock_producto_id);
            $cantidadAnterior          = $stockProducto->cantidad_disponible;
            $cantidadReservadaAnterior = $stockProducto->cantidad_reservada;

            // 2️⃣ Actualizar stock_productos (liberar cantidad_reservada → cantidad_disponible)
            $cantidadALiberar = $reserva->cantidad_reservada;
            $stockProducto->update([
                'cantidad_disponible' => $stockProducto->cantidad_disponible + $cantidadALiberar,
                'cantidad_reservada'  => $stockProducto->cantidad_reservada - $cantidadALiberar,
            ]);

            // 3️⃣ Obtener valores DESPUÉS
            $stockProducto->refresh();
            $cantidadPosterior          = $stockProducto->cantidad_disponible;
            $cantidadReservadaPosterior = $stockProducto->cantidad_reservada;

            // 4️⃣ Actualizar estado de la reserva
            $reserva->update(['estado' => \App\Models\ReservaProforma::LIBERADA]);

            // 5️⃣ Registrar movimiento con cantidad_anterior y cantidad_posterior
            \App\Models\MovimientoInventario::create([
                'stock_producto_id'  => $reserva->stock_producto_id,
                'cantidad'           => $cantidadALiberar,  // Positivo: liberado
                'cantidad_anterior'  => $cantidadAnterior,  // ✅ ANTES
                'cantidad_posterior' => $cantidadPosterior, // ✅ DESPUÉS
                'fecha'              => now(),
                'observacion'        => json_encode([
                    'evento'                       => 'Liberación de reserva de proforma',
                    'motivo'                       => $motivo,
                    'reserva_id'                   => $reserva->id,
                    'cantidad_reservada_anterior'  => $cantidadReservadaAnterior,
                    'cantidad_reservada_posterior' => $cantidadReservadaPosterior,
                ]),
                'numero_documento'   => $numeroProforma,
                'tipo'               => \App\Models\MovimientoInventario::TIPO_LIBERACION_RESERVA,
                'user_id'            => \Illuminate\Support\Facades\Auth::id(),
                'referencia_tipo'    => 'proforma',
                'referencia_id'      => $reserva->proforma_id,
            ]);

            \Illuminate\Support\Facades\Log::info('✅ Reserva liberada completamente', [
                'reserva_id'                  => $reserva->id,
                'cantidad_liberada'           => $cantidadALiberar,
                'cantidad_disponible_antes'   => $cantidadAnterior,
                'cantidad_disponible_despues' => $cantidadPosterior,
                'motivo'                      => $motivo,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error liberando reserva', [
                'reserva_id' => $reserva->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * Reducir cantidad de una reserva existente
     */
    private function reducirReserva(\App\Models\ReservaProforma $reserva, int $cantidadNueva)
    {
        if ($reserva->cantidad_reservada === $cantidadNueva) {
            return; // No hay cambio
        }

        try {
            // 1️⃣ Obtener stock ANTES de cambios
            $stockProducto              = \App\Models\StockProducto::lockForUpdate()->findOrFail($reserva->stock_producto_id);
            $cantidadDisponibleAnterior = $stockProducto->cantidad_disponible;
            $cantidadReservadaAnterior  = $reserva->cantidad_reservada;

            // 2️⃣ Actualizar cantidad de la reserva
            $reserva->update(['cantidad_reservada' => $cantidadNueva]);

            // 3️⃣ Actualizar stock_productos (reducir cantidad_reservada y aumentar cantidad_disponible)
            $diferencia = $cantidadReservadaAnterior - $cantidadNueva;
            $stockProducto->update([
                'cantidad_disponible' => $stockProducto->cantidad_disponible + $diferencia,
                'cantidad_reservada'  => $stockProducto->cantidad_reservada - $diferencia,
            ]);

            // 4️⃣ Obtener valores DESPUÉS
            $stockProducto->refresh();
            $cantidadDisponiblePosterior = $stockProducto->cantidad_disponible;

            // 5️⃣ Registrar movimiento con cantidad_anterior y cantidad_posterior
            \App\Models\MovimientoInventario::create([
                'stock_producto_id'  => $reserva->stock_producto_id,
                'cantidad'           => $diferencia,                  // Positivo: liberado
                'cantidad_anterior'  => $cantidadDisponibleAnterior,  // ✅ ANTES
                'cantidad_posterior' => $cantidadDisponiblePosterior, // ✅ DESPUÉS
                'fecha'              => now(),
                'observacion'        => json_encode([
                    'evento'                       => 'Reducción de cantidad de reserva',
                    'reserva_id'                   => $reserva->id,
                    'cantidad_reservada_anterior'  => $cantidadReservadaAnterior,
                    'cantidad_reservada_posterior' => $cantidadNueva,
                ]),
                'numero_documento'   => $reserva->proforma->numero ?? null,
                'tipo'               => \App\Models\MovimientoInventario::TIPO_LIBERACION_RESERVA,
                'user_id'            => \Illuminate\Support\Facades\Auth::id(),
                'referencia_tipo'    => 'proforma',
                'referencia_id'      => $reserva->proforma_id,
            ]);

            \Illuminate\Support\Facades\Log::info('✅ Reserva reducida correctamente', [
                'reserva_id'                  => $reserva->id,
                'cantidad_reservada_anterior' => $cantidadReservadaAnterior,
                'cantidad_reservada_nueva'    => $cantidadNueva,
                'cantidad_disponible_antes'   => $cantidadDisponibleAnterior,
                'cantidad_disponible_despues' => $cantidadDisponiblePosterior,
                'diferencia'                  => $diferencia,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error reduciendo reserva', [
                'reserva_id' => $reserva->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * Liberar la parte del exceso cuando se reduce una reserva
     */
    private function liberarExcesoReserva(\App\Models\ReservaProforma $reserva, int $exceso, string $motivo, ?string $numeroProforma = null)
    {
        try {
            // 1️⃣ Obtener stock ANTES de cambios
            $stockProducto             = \App\Models\StockProducto::lockForUpdate()->findOrFail($reserva->stock_producto_id);
            $cantidadAnterior          = $stockProducto->cantidad_disponible;
            $cantidadReservadaAnterior = $stockProducto->cantidad_reservada;

            // 2️⃣ Actualizar stock_productos (liberar cantidad_reservada → cantidad_disponible)
            $stockProducto->update([
                'cantidad_disponible' => $stockProducto->cantidad_disponible + $exceso,
                'cantidad_reservada'  => $stockProducto->cantidad_reservada - $exceso,
            ]);

            // 3️⃣ Obtener valores DESPUÉS
            $stockProducto->refresh();
            $cantidadPosterior          = $stockProducto->cantidad_disponible;
            $cantidadReservadaPosterior = $stockProducto->cantidad_reservada;

            // 4️⃣ Registrar movimiento con cantidad_anterior y cantidad_posterior
            \App\Models\MovimientoInventario::create([
                'stock_producto_id'  => $reserva->stock_producto_id,
                'cantidad'           => $exceso,            // Positivo: liberado
                'cantidad_anterior'  => $cantidadAnterior,  // ✅ ANTES
                'cantidad_posterior' => $cantidadPosterior, // ✅ DESPUÉS
                'fecha'              => now(),
                'observacion'        => json_encode([
                    'evento'                       => 'Liberación de exceso de reserva',
                    'motivo'                       => $motivo,
                    'reserva_id'                   => $reserva->id,
                    'cantidad_reservada_anterior'  => $cantidadReservadaAnterior,
                    'cantidad_reservada_posterior' => $cantidadReservadaPosterior,
                ]),
                'numero_documento'   => $numeroProforma,
                'tipo'               => \App\Models\MovimientoInventario::TIPO_LIBERACION_RESERVA,
                'user_id'            => \Illuminate\Support\Facades\Auth::id(),
                'referencia_tipo'    => 'proforma',
                'referencia_id'      => $reserva->proforma_id,
            ]);

            \Illuminate\Support\Facades\Log::info('✅ Exceso liberado correctamente', [
                'reserva_id'                  => $reserva->id,
                'exceso'                      => $exceso,
                'cantidad_disponible_antes'   => $cantidadAnterior,
                'cantidad_disponible_despues' => $cantidadPosterior,
                'motivo'                      => $motivo,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error liberando exceso', [
                'reserva_id' => $reserva->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * Ampliar cantidad de una reserva existente
     */
    private function ampliarReserva(\App\Models\ReservaProforma $reserva, int $cantidadNueva,  ? \App\Models\Proforma $proforma = null)
    {
        if ($reserva->cantidad_reservada === $cantidadNueva) {
            return; // No hay cambio
        }

        try {
            // 1️⃣ Obtener stock ANTES de cambios
            $stockProducto              = \App\Models\StockProducto::lockForUpdate()->findOrFail($reserva->stock_producto_id);
            $cantidadDisponibleAnterior = $stockProducto->cantidad_disponible;
            $cantidadReservadaAnterior  = $reserva->cantidad_reservada;

            // 2️⃣ Validar disponibilidad
            $diferencia = $cantidadNueva - $cantidadReservadaAnterior;
            if ($stockProducto->cantidad_disponible < $diferencia) {
                throw new \Exception("Stock insuficiente para ampliar reserva");
            }

            // 3️⃣ Actualizar cantidad de la reserva
            $reserva->update(['cantidad_reservada' => $cantidadNueva]);

            // 4️⃣ Actualizar stock_productos (reducir cantidad_disponible y aumentar cantidad_reservada)
            $stockProducto->update([
                'cantidad_disponible' => $stockProducto->cantidad_disponible - $diferencia,
                'cantidad_reservada'  => $stockProducto->cantidad_reservada + $diferencia,
            ]);

            // 5️⃣ Obtener valores DESPUÉS
            $stockProducto->refresh();
            $cantidadDisponiblePosterior = $stockProducto->cantidad_disponible;

            // 6️⃣ Registrar movimiento en inventario con cantidad_anterior/posterior
            \App\Models\MovimientoInventario::create([
                'stock_producto_id'  => $reserva->stock_producto_id,
                'cantidad'           => -$diferencia,                 // Negativo: reservar
                'cantidad_anterior'  => $cantidadDisponibleAnterior,  // ✅ ANTES
                'cantidad_posterior' => $cantidadDisponiblePosterior, // ✅ DESPUÉS
                'fecha'              => now(),
                'observacion'        => json_encode([
                    'evento'                       => 'Aumento de cantidad de reserva',
                    'reserva_id'                   => $reserva->id,
                    'cantidad_reservada_anterior'  => $cantidadReservadaAnterior,
                    'cantidad_reservada_posterior' => $cantidadNueva,
                ]),
                'numero_documento'   => $proforma?->numero,
                'tipo'               => \App\Models\MovimientoInventario::TIPO_RESERVA_PROFORMA,
                'user_id'            => \Illuminate\Support\Facades\Auth::id(),
                'referencia_tipo'    => 'proforma',
                'referencia_id'      => $proforma?->id,
            ]);

            \Illuminate\Support\Facades\Log::info('✅ Reserva ampliada correctamente', [
                'reserva_id'                  => $reserva->id,
                'cantidad_reservada_anterior' => $cantidadReservadaAnterior,
                'cantidad_reservada_nueva'    => $cantidadNueva,
                'cantidad_disponible_antes'   => $cantidadDisponibleAnterior,
                'cantidad_disponible_despues' => $cantidadDisponiblePosterior,
                'diferencia'                  => $diferencia,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error ampliando reserva', [
                'reserva_id' => $reserva->id,
                'error'      => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Crear una reserva adicional para ampliar cantidad existente
     */
    private function crearReservaAdicional(\App\Models\Proforma $proforma, int $stock_producto_id, int $cantidad)
    {
        try {
            // 1️⃣ Obtener stock ANTES de cambios
            $stockProducto             = \App\Models\StockProducto::lockForUpdate()->findOrFail($stock_producto_id);
            $cantidadAnterior          = $stockProducto->cantidad_disponible;
            $cantidadReservadaAnterior = $stockProducto->cantidad_reservada;

            // 2️⃣ Validar disponibilidad
            if ($cantidadAnterior < $cantidad) {
                throw new \Exception(
                    "Stock insuficiente para reservar adicional. " .
                    "Disponible: {$cantidadAnterior}, " .
                    "Solicitado: {$cantidad}"
                );
            }

            // 3️⃣ Crear nueva reserva
            $reserva = \App\Models\ReservaProforma::create([
                'proforma_id'        => $proforma->id,
                'stock_producto_id'  => $stock_producto_id,
                'cantidad_reservada' => $cantidad,
                'fecha_reserva'      => now(),
                'fecha_expiracion'   => now()->addDays(3),
                'estado'             => \App\Models\ReservaProforma::ACTIVA,
            ]);

            // 4️⃣ Actualizar stock_productos
            $stockProducto->update([
                'cantidad_disponible' => $cantidadAnterior - $cantidad,
                'cantidad_reservada'  => $cantidadReservadaAnterior + $cantidad,
            ]);

            // 5️⃣ Obtener valores DESPUÉS
            $stockProducto->refresh();
            $cantidadPosterior          = $stockProducto->cantidad_disponible;
            $cantidadReservadaPosterior = $stockProducto->cantidad_reservada;

            // 6️⃣ Registrar movimiento en inventario con cantidad_anterior/posterior
            \App\Models\MovimientoInventario::create([
                'stock_producto_id'  => $stock_producto_id,
                'cantidad'           => -$cantidad,         // Negativo: reservar
                'cantidad_anterior'  => $cantidadAnterior,  // ✅ ANTES
                'cantidad_posterior' => $cantidadPosterior, // ✅ DESPUÉS
                'fecha'              => now(),
                'observacion'        => json_encode([
                    'evento'                       => 'Nueva reserva adicional creada',
                    'reserva_id'                   => $reserva->id,
                    'cantidad_reservada_anterior'  => $cantidadReservadaAnterior,
                    'cantidad_reservada_posterior' => $cantidadReservadaPosterior,
                ]),
                'numero_documento'   => $proforma->numero,
                'tipo'               => \App\Models\MovimientoInventario::TIPO_RESERVA_PROFORMA,
                'user_id'            => \Illuminate\Support\Facades\Auth::id(),
                'referencia_tipo'    => 'proforma',
                'referencia_id'      => $proforma->id,
            ]);

            \Illuminate\Support\Facades\Log::info('✅ Reserva adicional creada correctamente', [
                'reserva_id'                  => $reserva->id,
                'proforma_id'                 => $proforma->id,
                'stock_producto_id'           => $stock_producto_id,
                'cantidad_reservada'          => $cantidad,
                'cantidad_disponible_antes'   => $cantidadAnterior,
                'cantidad_disponible_despues' => $cantidadPosterior,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error creando reserva adicional', [
                'proforma_id'       => $proforma->id,
                'stock_producto_id' => $stock_producto_id,
                'error'             => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Crear nueva reserva para un producto agregado a la proforma
     */
    private function crearNuevaReservaParaProducto(\App\Models\Proforma $proforma, int $producto_id, int $cantidad)
    {
        try {
            // Usar ReservaDistribucionService para distribuir automáticamente entre múltiples lotes (FIFO)
            // El servicio obtiene el almacén internamente de la empresa del usuario autenticado
            $distribucionService = new \App\Services\Reservas\ReservaDistribucionService();
            $resultado           = $distribucionService->distribuirReserva(
                $proforma,
                $producto_id,
                $cantidad,
                3// días de vencimiento
            );

            // Validar resultado de distribución
            if (! $resultado['success']) {
                throw new \Exception($resultado['error'] ?? 'Error distribuiendo reservas');
            }

            // Log de éxito con detalles de distribución
            \Illuminate\Support\Facades\Log::info('✅ Reservas distribuidas exitosamente (FIFO)', [
                'proforma_id'         => $proforma->id,
                'producto_id'         => $producto_id,
                'cantidad_solicitada' => $cantidad,
                'cantidad_reservada'  => $resultado['resumen']['cantidad_reservada'] ?? $cantidad,
                'cantidad_lotes'      => $resultado['resumen']['cantidad_lotes'] ?? 1,
                'distribucion'        => $resultado['distribucion'],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('❌ Error distribuiendo reservas', [
                'proforma_id' => $proforma->id,
                'producto_id' => $producto_id,
                'cantidad'    => $cantidad,
                'error'       => $e->getMessage(),
            ]);
            throw $e;
        }
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
            // ✅ Cliente (ahora actualizable en edición)
            'cliente_id'                 => 'nullable|exists:clientes,id',
            'detalles'                   => 'required|array|min:1',
            'detalles.*.producto_id'     => 'required|exists:productos,id',
            'detalles.*.cantidad'        => 'required|numeric|min:0.01',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.subtotal'        => 'required|numeric|min:0',
            // ✅ NUEVO: Campos adicionales opcionales para edición completa
            'fecha'                      => 'nullable|date',
            'fecha_vencimiento'          => 'nullable|date',
            'fecha_entrega_solicitada'   => 'nullable|date',
            'tipo_entrega'               => 'nullable|in:DELIVERY,PICKUP',
            'canal'                      => 'nullable|in:PRESENCIAL,ONLINE,TELEFONO',
            'politica_pago'              => 'nullable|in:CONTRA_ENTREGA,ANTICIPADO_100',
            'observaciones'              => 'nullable|string|max:1000',
            // ✅ NUEVO: Estado y preventista para edición completa
            'estado_inicial'             => 'nullable|in:BORRADOR,PENDIENTE',
            'preventista_id'             => 'nullable|exists:users,id',
        ]);

        try {
            // ✅ ACTUALIZADO: Permitir actualizar proformas en estado PENDIENTE o BORRADOR
            if (! in_array($proforma->estado, ['PENDIENTE', 'BORRADOR'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden actualizar proformas en estado PENDIENTE o BORRADOR',
                ], 400);
            }

            // Obtener los detalles enviados
            $detallesActualizados = $request->input('detalles', []);

            // ✅ DEBUG: Ver exactamente qué datos llegaron
            Log::info('🔍 [actualizarDetalles] Detalles recibidos del frontend:', [
                'cantidad_detalles'  => count($detallesActualizados),
                'detalles_completos' => $detallesActualizados,
            ]);

            // Inicializar contadores
            $subtotalNuevo     = 0;
            $detallesGuardados = [];

            // Procesar cada detalle
            foreach ($detallesActualizados as $i => $detalleData) {
                $producto_id     = $detalleData['producto_id'];
                $cantidad        = (float) $detalleData['cantidad'];
                $precio_unitario = (float) $detalleData['precio_unitario'];
                $subtotal        = (float) $detalleData['subtotal'];

                // ✅ DEBUG: Ver qué se procesa por detalle
                Log::info("📋 [actualizarDetalles] Procesando detalle #$i:", [
                    'producto_id'       => $producto_id,
                    'cantidad'          => $cantidad,
                    'precio_unitario'   => $precio_unitario,
                    'tiene_combo_items' => isset($detalleData['combo_items_seleccionados']),
                    'combo_items'       => $detalleData['combo_items_seleccionados'] ?? null,
                ]);

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

                $subtotalNuevo       += $subtotal;
                $detallesGuardados[] = [
                    'producto_id'               => $producto_id,
                    'cantidad'                  => $cantidad,
                    'precio_unitario'           => $precio_unitario,
                    'descuento'                 => 0,
                    'subtotal'                  => $subtotal,
                    'unidad_medida_id'          => $detalleData['unidad_medida_id'] ?? null,
                    // ✅ NUEVO: Agregar campos faltantes para coincidencia con DetalleVenta
                    'tipo_precio_id'            => $detalleData['tipo_precio_id'] ?? null,
                    'tipo_precio_nombre'        => $detalleData['tipo_precio_nombre'] ?? null,
                    'combo_items_seleccionados' => $detalleData['combo_items_seleccionados'] ?? null,
                ];
            }

            // Calcular totales
            // ✅ CAMBIO: Impuesto se calcula pero NO se suma al total (es solo informativo)
            $impuestoOriginal = $proforma->total > 0 ? ($proforma->impuesto / $proforma->subtotal) : 0.13;
            $impuestoNuevo    = $subtotalNuevo * $impuestoOriginal;
            $totalNuevo       = $subtotalNuevo; // ✅ Total SIN impuesto

            // Eliminar detalles antiguos
            $proforma->detalles()->delete();

            // Crear nuevos detalles (con procesamiento de combo_items_seleccionados)
            foreach ($detallesGuardados as $detalle) {
                // ✅ NUEVO: Preparar combo_items_seleccionados (mismo patrón que VentaService)
                $comboItemsSeleccionados = null;
                if (isset($detalle['combo_items_seleccionados']) && is_array($detalle['combo_items_seleccionados'])) {
                    // Filtrar solo items que están incluidos (incluido = true)
                    $comboItemsSeleccionados = array_filter($detalle['combo_items_seleccionados'], function ($item) {
                        return ($item['incluido'] ?? false) === true;
                    });
                    // Reindexar array después de filter
                    $comboItemsSeleccionados = array_values($comboItemsSeleccionados);
                }

                // Crear detalle con combo items procesados
                $detalleData                              = $detalle;
                $detalleData['combo_items_seleccionados'] = $comboItemsSeleccionados ? array_map(function ($item) {
                    return [
                        'combo_item_id' => $item['combo_item_id'] ?? null,
                        'producto_id'   => $item['producto_id'] ?? null,
                        'incluido'      => $item['incluido'] ?? false,
                    ];
                }, $comboItemsSeleccionados) : null;

                $proforma->detalles()->create($detalleData);
            }

            // Actualizar la proforma con los nuevos totales y campos adicionales opcionales
            $updateData  = [
                'subtotal' => $subtotalNuevo,
                'impuesto' => $impuestoNuevo,
                'total'    => $totalNuevo,
            ];

            // ✅ NUEVO: Agregar campos opcionales si están presentes en la request
            $camposOpcionales = ['cliente_id', 'fecha', 'fecha_vencimiento', 'fecha_entrega_solicitada', 'tipo_entrega', 'canal', 'politica_pago', 'observaciones', 'preventista_id'];
            foreach ($camposOpcionales as $campo) {
                if ($request->has($campo) && $request->input($campo) !== null) {
                    $updateData[$campo] = $request->input($campo);
                }
            }

            // ✅ NUEVO: Actualizar estado si se envía estado_inicial
            if ($request->has('estado_inicial') && $request->input('estado_inicial') !== null) {
                $nuevoEstado = $request->input('estado_inicial');
                $estadoId    = Proforma::obtenerIdEstado($nuevoEstado, 'proforma');
                if ($estadoId && $proforma->estado !== $nuevoEstado) {
                    $updateData['estado_proforma_id'] = $estadoId;

                    // Log del cambio de estado
                    Log::info("Proforma {$proforma->numero} estado actualizado: {$proforma->estado} → {$nuevoEstado}");
                }
            }

            $proforma->update($updateData);

            // ✅ NUEVO: Ajustar reservaciones solo si la proforma está en PENDIENTE o estado con reservas
            // No ajustar si está en BORRADOR (sin reservas)
            if ($proforma->estado !== 'BORRADOR') {
                $this->ajustarReservacionesAlActualizarDetalles($proforma, $detallesGuardados);
            }

            // Recargar relaciones
            $proforma->load(['detalles.producto.imagenes', 'cliente.localidad', 'estadoLogistica']);

            return response()->json([
                'success' => true,
                'message' => 'Detalles actualizados correctamente',
                'data'    => [
                    'proforma'          => $proforma,
                    'subtotal_anterior' => $proforma->getOriginal('subtotal'),
                    'subtotal_nuevo'    => $subtotalNuevo,
                    'total_anterior'    => $proforma->getOriginal('total'),
                    'total_nuevo'       => $totalNuevo,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error actualizando detalles de proforma:', [
                'proforma_id' => $proforma->id,
                'error'       => $e->getMessage(),
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
            $currentId    = $request->input('current_id');
            $incluirStats = $request->boolean('incluir_stats', false);
            $usuario      = Auth::user();

            if (! $currentId) {
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
                    'indice'               => "{$indiceActual} de {$totalPendientes}",
                ];
            }

            // Responder
            if ($siguienteProforma) {
                // Eager load relación cliente y localidad si no está cargada
                if (! $siguienteProforma->relationLoaded('cliente')) {
                    $siguienteProforma->load('cliente.localidad');
                }

                return response()->json([
                    'success'          => true,
                    'existe_siguiente' => true,
                    'proforma'         => [
                        'id'             => $siguienteProforma->id,
                        'numero'         => $siguienteProforma->numero,
                        'cliente_nombre' => $siguienteProforma->cliente->nombre ?? 'Sin cliente',
                        'total'          => (float) $siguienteProforma->total,
                        'fecha_creacion' => $siguienteProforma->created_at->format('d/m/Y H:i'),
                    ],
                    'stats'            => $stats,
                ]);
            } else {
                return response()->json([
                    'success'          => true,
                    'existe_siguiente' => false,
                    'mensaje'          => 'No hay más proformas pendientes',
                    'stats'            => null,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error al obtener siguiente proforma pendiente:', [
                'current_id' => $request->input('current_id'),
                'error'      => $e->getMessage(),
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
    ) : void {
        // 📊 LOG: INICIO DEL REGISTRO EN CAJA
        Log::info('🏪 [registrarMovimientoCajaParaPago] INICIANDO REGISTRO EN CAJA', [
            'venta_id'       => $venta->id,
            'venta_numero'   => $venta->numero,
            'proforma_id'    => $proforma->id,
            'usuario_id'     => $usuario->id,
            'usuario_nombre' => $usuario->name,
            'politica'       => $politica,
            'monto_pagado'   => $montoPagado,
        ]);

        // ✅ Solo registrar para políticas que requieren registro en caja
        // Incluye: pagos anticipados (100%, 50%) y créditos
        $politicasARegistrar = ['ANTICIPADO_100', 'MEDIO_MEDIO', 'CREDITO'];
        if (! in_array($politica, $politicasARegistrar)) {
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
                'venta_id'     => $venta->id,
                'proforma_id'  => $proforma->id,
                'monto_pagado' => $montoPagado,
                'politica'     => $politica,
                'detalle'      => 'Para política ' . $politica . ' se requiere monto positivo',
            ]);
            return;
        }

        try {
            // ✅ MEJORADO: Buscar caja abierta IGUAL QUE EL MIDDLEWARE
            // 1️⃣ Buscar caja abierta de HOY
            Log::info('🔍 [registrarMovimientoCajaParaPago] Buscando caja abierta de HOY', [
                'usuario_id'     => $usuario->id,
                'fecha_busqueda' => today(),
            ]);

            $cajaAbierta = \App\Models\AperturaCaja::where('user_id', $usuario->id)
                ->delDia()
                ->abiertas()
                ->with('caja')
                ->latest()
                ->first();

            if ($cajaAbierta) {
                Log::info('✅ [registrarMovimientoCajaParaPago] Caja de HOY encontrada', [
                    'apertura_caja_id' => $cajaAbierta->id,
                    'caja_id'          => $cajaAbierta->caja_id,
                    'caja_nombre'      => $cajaAbierta->caja?->nombre,
                    'fecha_apertura'   => $cajaAbierta->fecha,
                ]);
            }

            // 2️⃣ Si no hay caja de hoy, buscar la más reciente (posiblemente de ayer)
            if (! $cajaAbierta) {
                Log::info('🔍 [registrarMovimientoCajaParaPago] No hay caja de HOY, buscando más reciente', [
                    'usuario_id' => $usuario->id,
                ]);

                $cajaAbierta = \App\Models\AperturaCaja::where('user_id', $usuario->id)
                    ->abiertas()
                    ->with('caja')
                    ->latest('fecha')
                    ->first();

                // ✅ Registrar advertencia si es caja de día anterior
                if ($cajaAbierta && $cajaAbierta->fecha < today()) {
                    Log::warning('⚠️ [registrarMovimientoCajaParaPago] USANDO CAJA DE DÍA ANTERIOR', [
                        'usuario_id'       => $usuario->id,
                        'usuario_nombre'   => $usuario->name,
                        'apertura_caja_id' => $cajaAbierta->id,
                        'apertura_fecha'   => $cajaAbierta->fecha,
                        'dias_atras'       => $cajaAbierta->fecha->diffInDays(today()),
                        'caja_id'          => $cajaAbierta->caja_id,
                        'caja_nombre'      => $cajaAbierta->caja?->nombre,
                        'venta_id'         => $venta->id,
                        'venta_numero'     => $venta->numero,
                        'politica'         => $politica,
                        'advertencia'      => 'Se está usando una caja abierta de un día anterior',
                    ]);
                } elseif ($cajaAbierta) {
                    Log::info('ℹ️ [registrarMovimientoCajaParaPago] Caja más reciente encontrada (mismo día)', [
                        'apertura_caja_id' => $cajaAbierta->id,
                        'caja_id'          => $cajaAbierta->caja_id,
                        'caja_nombre'      => $cajaAbierta->caja?->nombre,
                        'fecha_apertura'   => $cajaAbierta->fecha,
                    ]);
                }
            }

            if (! $cajaAbierta) {
                Log::error('❌ [registrarMovimientoCajaParaPago] ERROR CRÍTICO: No hay caja abierta', [
                    'usuario_id'       => $usuario->id,
                    'usuario_nombre'   => $usuario->name,
                    'usuario_roles'    => $usuario->getRoleNames()->toArray(),
                    'usuario_empleado' => $usuario->empleado?->id,
                    'venta_id'         => $venta->id,
                    'venta_numero'     => $venta->numero,
                    'proforma_id'      => $proforma->id,
                    'proforma_numero'  => $proforma->numero,
                    'politica'         => $politica,
                    'monto'            => $montoPagado,
                    'detalle_error'    => 'No hay apertura de caja abierta para este usuario, ni hoy ni en días anteriores sin cerrar',
                ]);

                // ✅ REGISTRAR EN AUDITORÍA: Intento fallido
                \App\Models\AuditoriaCaja::create([
                    'user_id'             => $usuario->id,
                    'caja_id'             => null,
                    'apertura_caja_id'    => null,
                    'accion'              => 'INTENTO_PAGO_SIN_CAJA',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo'      => 'VENTA',
                    'exitosa'             => false,
                    'detalle_operacion'   => [
                        'venta_id'     => $venta->id,
                        'proforma_id'  => $proforma->id,
                        'politica'     => $politica,
                        'monto_pagado' => $montoPagado,
                        'motivo'       => 'Usuario no tiene caja abierta HOY',
                    ],
                    'codigo_http'         => 422,
                    'mensaje_error'       => 'Usuario no tiene caja abierta para registrar pago',
                    'ip_address'          => request()->ip(),
                    'user_agent'          => request()->userAgent(),
                ]);

                return;
            }

            // Obtener el tipo de operación VENTA
            $tipoOperacion = \App\Models\TipoOperacionCaja::where('codigo', 'VENTA')->first();

            if (! $tipoOperacion) {
                Log::error('❌ [registrarMovimientoCajaParaPago] Tipo operación VENTA no existe', [
                    'venta_id' => $venta->id,
                ]);

                // ✅ REGISTRAR EN AUDITORÍA: Error de configuración
                \App\Models\AuditoriaCaja::create([
                    'user_id'             => $usuario->id,
                    'caja_id'             => $cajaAbierta->caja_id,
                    'apertura_caja_id'    => $cajaAbierta->id,
                    'accion'              => 'ERROR_OPERACION_NO_EXISTE',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo'      => 'VENTA',
                    'exitosa'             => false,
                    'detalle_operacion'   => [
                        'venta_id'    => $venta->id,
                        'proforma_id' => $proforma->id,
                        'motivo'      => 'TipoOperacionCaja VENTA no existe en la BD',
                    ],
                    'codigo_http'         => 500,
                    'mensaje_error'       => 'Tipo operación VENTA no encontrado',
                    'ip_address'          => request()->ip(),
                    'user_agent'          => request()->userAgent(),
                ]);

                return;
            }

            // Determinar descripción según la política
            $descripcionPolitica = match ($politica) {
                'ANTICIPADO_100' => '100% ANTICIPADO',
                'MEDIO_MEDIO'    => '50% ANTICIPO',
                'CREDITO'        => 'VENTA A CRÉDITO',
                default          => 'ANTICIPO'
            };

            // 📝 LOG: Preparando movimiento en caja
            Log::info('📝 [registrarMovimientoCajaParaPago] Preparando movimiento en caja', [
                'venta_numero'         => $venta->numero,
                'caja_id'              => $cajaAbierta->caja_id,
                'caja_nombre'          => $cajaAbierta->caja?->nombre,
                'usuario_id'           => $usuario->id,
                'tipo_operacion_id'    => $tipoOperacion->id,
                'monto'                => $montoPagado,
                'descripcion_politica' => $descripcionPolitica,
            ]);

            // ✅ Crear movimiento de caja
            $movimiento = \App\Models\MovimientoCaja::create([
                'caja_id'           => $cajaAbierta->caja_id,
                'user_id'           => $usuario->id,
                'tipo_operacion_id' => $tipoOperacion->id,
                'numero_documento'  => $venta->numero,
                'monto'             => $montoPagado,
                'fecha'             => now(),
                'observaciones'     => "Venta #{$venta->numero} ({$descripcionPolitica}) - Convertida desde proforma #{$proforma->numero}",
            ]);

            // 💾 LOG: Movimiento creado
            Log::info('💾 [registrarMovimientoCajaParaPago] Movimiento creado en BD', [
                'movimiento_id' => $movimiento->id,
                'venta_numero'  => $venta->numero,
                'monto'         => $movimiento->monto,
                'caja_id'       => $movimiento->caja_id,
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Éxito
            \App\Models\AuditoriaCaja::create([
                'user_id'             => $usuario->id,
                'caja_id'             => $cajaAbierta->caja_id,
                'apertura_caja_id'    => $cajaAbierta->id,
                'accion'              => 'PAGO_REGISTRADO',
                'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                'operacion_tipo'      => 'VENTA',
                'exitosa'             => true,
                'detalle_operacion'   => [
                    'venta_id'             => $venta->id,
                    'proforma_id'          => $proforma->id,
                    'movimiento_caja_id'   => $movimiento->id,
                    'caja_numero'          => $cajaAbierta->caja?->nombre,
                    'politica'             => $politica,
                    'monto_pagado'         => $montoPagado,
                    'descripcion_politica' => $descripcionPolitica,
                ],
                'codigo_http'         => 201,
                'ip_address'          => request()->ip(),
                'user_agent'          => request()->userAgent(),
            ]);

            Log::info('✅ [registrarMovimientoCajaParaPago] MOVIMIENTO EN CAJA REGISTRADO EXITOSAMENTE', [
                'venta_id'             => $venta->id,
                'venta_numero'         => $venta->numero,
                'proforma_id'          => $proforma->id,
                'proforma_numero'      => $proforma->numero,
                'caja_id'              => $cajaAbierta->caja_id,
                'caja_nombre'          => $cajaAbierta->caja?->nombre,
                'apertura_caja_id'     => $cajaAbierta->id,
                'usuario_id'           => $usuario->id,
                'usuario_nombre'       => $usuario->name,
                'monto_registrado'     => $montoPagado,
                'politica_pago'        => $politica,
                'descripcion_politica' => $descripcionPolitica,
                'movimiento_id'        => $movimiento->id,
                'fecha_movimiento'     => $movimiento->fecha,
            ]);

        } catch (\Exception $e) {
            // No bloquear la conversión si falla el registro en cajas
            Log::error('❌ [registrarMovimientoCajaParaPago] Error al registrar movimiento de caja', [
                'venta_id'       => $venta->id,
                'proforma_id'    => $proforma->id,
                'usuario_id'     => $usuario->id,
                'usuario_nombre' => $usuario->name,
                'monto'          => $montoPagado,
                'politica'       => $politica,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Error al registrar
            try {
                \App\Models\AuditoriaCaja::create([
                    'user_id'             => $usuario->id,
                    'caja_id'             => null,
                    'apertura_caja_id'    => null,
                    'accion'              => 'ERROR_REGISTRO_PAGO',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo'      => 'VENTA',
                    'exitosa'             => false,
                    'detalle_operacion'   => [
                        'venta_id'     => $venta->id,
                        'proforma_id'  => $proforma->id,
                        'politica'     => $politica,
                        'monto_pagado' => $montoPagado,
                    ],
                    'codigo_http'         => 500,
                    'mensaje_error'       => $e->getMessage(),
                    'ip_address'          => request()->ip(),
                    'user_agent'          => request()->userAgent(),
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
            $montoRegistro = match ($politica) {
                // Para anticipados: Registrar el monto pagado
                'ANTICIPADO_100' => $montoPagado,
                'MEDIO_MEDIO'    => $montoPagado,
                // Para CREDITO y CONTRA_ENTREGA: Registrar 0 (no hay pago inmediato)
                'CREDITO'        => 0,
                'CONTRA_ENTREGA' => 0,
                default          => 0,
            };

            // ✅ Determinar tipo de pago según política si no se proporciona
            $tipoPagoFinal = $tipoPagoId;
            if (! $tipoPagoFinal && in_array($politica, ['CREDITO', 'CONTRA_ENTREGA'])) {
                // Para CREDITO y CONTRA_ENTREGA, obtener tipo de pago "PENDIENTE" o similar
                $tipoPagoDefault = \App\Models\TipoPago::where('codigo', 'PENDIENTE')
                    ->orWhere('nombre', 'Pendiente')
                    ->first();
                $tipoPagoFinal = $tipoPagoDefault?->id;
            }

            // Si aún no hay tipo_pago y el monto es 0, asignar tipo genérico
            if (! $tipoPagoFinal && $montoRegistro === 0) {
                $tipoPagoDefault = \App\Models\TipoPago::first();
                $tipoPagoFinal   = $tipoPagoDefault?->id;
            }

            // ✅ Crear registro en tabla pagos
            $pago = \App\Models\Pago::create([
                'venta_id'      => $venta->id,
                'tipo_pago_id'  => $tipoPagoFinal,
                'monto'         => $montoRegistro,
                'fecha'         => now(),
                'fecha_pago'    => now()->toDateString(),
                'observaciones' => "Pago por {$politica} - Convertida desde proforma #{$proforma->numero}",
                'usuario_id' => $usuario->id,
                'moneda_id'  => $venta->moneda_id,
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Pago registrado exitosamente
            \App\Models\AuditoriaCaja::create([
                'user_id'             => $usuario->id,
                'caja_id'             => null,
                'apertura_caja_id'    => null,
                'accion'              => 'PAGO_REGISTRADO_EN_VENTA',
                'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                'operacion_tipo'      => 'VENTA',
                'exitosa'             => true,
                'detalle_operacion'   => [
                    'venta_id'                     => $venta->id,
                    'proforma_id'                  => $proforma->id,
                    'pago_id'                      => $pago->id,
                    'politica'                     => $politica,
                    'monto_pagado'                 => $montoPagado,
                    'monto_registrado_tabla_pagos' => $montoRegistro,
                    'tipo_pago_id'                 => $tipoPagoFinal,
                ],
                'codigo_http'         => 201,
                'ip_address'          => request()->ip(),
                'user_agent'          => request()->userAgent(),
            ]);

            Log::info('✅ [registrarPagoEnVenta] Pago registrado en tabla pagos', [
                'venta_id'         => $venta->id,
                'proforma_id'      => $proforma->id,
                'pago_id'          => $pago->id,
                'usuario_id'       => $usuario->id,
                'usuario_nombre'   => $usuario->name,
                'politica'         => $politica,
                'monto_pagado'     => $montoPagado,
                'monto_registrado' => $montoRegistro,
                'tipo_pago_id'     => $tipoPagoFinal,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ [registrarPagoEnVenta] Error al registrar pago en tabla pagos', [
                'venta_id'       => $venta->id,
                'proforma_id'    => $proforma->id,
                'usuario_id'     => $usuario->id,
                'usuario_nombre' => $usuario->name,
                'politica'       => $politica,
                'monto_pagado'   => $montoPagado,
                'tipo_pago_id'   => $tipoPagoId,
                'error'          => $e->getMessage(),
                'trace'          => $e->getTraceAsString(),
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Error al registrar pago
            try {
                \App\Models\AuditoriaCaja::create([
                    'user_id'             => $usuario->id,
                    'caja_id'             => null,
                    'apertura_caja_id'    => null,
                    'accion'              => 'ERROR_REGISTRAR_PAGO_VENTA',
                    'operacion_intentada' => 'POST /api/proformas/{id}/convertir-venta',
                    'operacion_tipo'      => 'VENTA',
                    'exitosa'             => false,
                    'detalle_operacion'   => [
                        'venta_id'     => $venta->id,
                        'proforma_id'  => $proforma->id,
                        'politica'     => $politica,
                        'monto_pagado' => $montoPagado,
                    ],
                    'codigo_http'         => 500,
                    'mensaje_error'       => $e->getMessage(),
                    'ip_address'          => request()->ip(),
                    'user_agent'          => request()->userAgent(),
                ]);
            } catch (\Exception $auditError) {
                Log::error('❌ [registrarPagoEnVenta] Error al registrar auditoría', [
                    'error_audit' => $auditError->getMessage(),
                ]);
            }

            // ⚠️ No relanzar excepción para no bloquear la conversión
        }
    }

    /**
     * ✅ NUEVO 2026-02-21: Buscar clientes por término de búsqueda (nombre, email, ID, etc)
     * GET /api/proformas/search/clientes?q=texto
     */
    public function searchClientes(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 1) {
            return response()->json([
                'data' => [],
            ]);
        }

        $clientes = Cliente::where('activo', true)
            ->where(function ($q) use ($query) {
                // Buscar por ID si es numérico
                if (is_numeric($query)) {
                    $q->orWhere('id', intval($query));
                }

                // Búsqueda texto
                $q->orWhere('nombre', 'ilike', "%{$query}%")
                    ->orWhere('email', 'ilike', "%{$query}%")
                    ->orWhere('telefono', 'ilike', "%{$query}%")
                    ->orWhere('razon_social', 'ilike', "%{$query}%");
            })
            ->select('id', 'nombre', 'email', 'telefono')
            ->orderBy('nombre', 'asc')
            ->limit(20)
            ->get()
            ->map(function ($cliente) {
                return [
                    'id'       => $cliente->id,
                    'nombre'   => $cliente->nombre,
                    'email'    => $cliente->email,
                    'telefono' => $cliente->telefono,
                ];
            });

        return response()->json([
            'data' => $clientes,
        ]);
    }

    /**
     * ✅ NUEVO 2026-02-21: Buscar usuarios (preventistas/creadores) por término de búsqueda (nombre, email, ID, etc)
     * GET /api/proformas/search/usuarios?q=texto
     */
    public function searchUsuarios(Request $request)
    {
        $query = $request->input('q', '');

        if (strlen($query) < 1) {
            return response()->json([
                'data' => [],
            ]);
        }

        $usuarios = \App\Models\User::where('activo', true)
            ->where(function ($q) use ($query) {
                // Buscar por ID si es numérico
                if (is_numeric($query)) {
                    $q->orWhere('id', intval($query));
                }

                // Búsqueda texto
                $q->orWhere('name', 'ilike', "%{$query}%")
                    ->orWhere('email', 'ilike', "%{$query}%")
                    ->orWhere('phone', 'ilike', "%{$query}%");
            })
            ->select('id', 'name', 'email', 'phone')
            ->orderBy('name', 'asc')
            ->limit(20)
            ->get()
            ->map(function ($usuario) {
                return [
                    'id'    => $usuario->id,
                    'name'  => $usuario->name,
                    'email' => $usuario->email,
                    'phone' => $usuario->phone,
                ];
            });

        return response()->json([
            'data' => $usuarios,
        ]);
    }

    /**
     * ✅ NUEVO 2026-02-21: Preparar impresión de proformas filtradas
     * POST /api/proformas/preparar-impresion
     *
     * Recibe filtros y los guarda en sesión para luego generar el reporte
     */
    public function prepararImpresion(Request $request)
    {
        $filtros = $request->input('filtros', []);
        $formato = $request->input('formato', 'A4');

        // Obtener todas las proformas del usuario (según su rol)
        $query = Proforma::with(['cliente', 'usuarioCreador', 'detalles', 'venta']);

        // Aplicar filtros igual que en el frontend
        if (! empty($filtros['searchTerm'])) {
            $search = $filtros['searchTerm'];
            $query->where(function ($q) use ($search) {
                $q->where('id', 'ilike', "%{$search}%")
                    ->orWhere('numero', 'ilike', "%{$search}%")
                    ->orWhereHas('cliente', function ($q) use ($search) {
                        $q->where('nombre', 'ilike', "%{$search}%");
                    });
            });
        }

        if (! empty($filtros['filtroEstado']) && $filtros['filtroEstado'] !== 'TODOS') {
            $estadoCode = strtoupper($filtros['filtroEstado']);
            $estadoId = DB::table('estados_logistica')
                ->where('codigo', $estadoCode)
                ->where('categoria', 'proforma')
                ->value('id');

            if ($estadoId) {
                $query->where('estado_proforma_id', $estadoId);
            }
        }

        if (! empty($filtros['filtroCliente']) && $filtros['filtroCliente'] !== 'TODOS') {
            $query->where('cliente_id', $filtros['filtroCliente']);
        }

        if (! empty($filtros['filtroUsuario']) && $filtros['filtroUsuario'] !== 'TODOS') {
            $query->where('usuario_creador_id', intval($filtros['filtroUsuario']));
        }

        if (! empty($filtros['fechaDesde'])) {
            $query->whereDate('created_at', '>=', $filtros['fechaDesde']);
        }

        if (! empty($filtros['fechaHasta'])) {
            $query->whereDate('created_at', '<=', $filtros['fechaHasta']);
        }

        if (! empty($filtros['totalMin'])) {
            $query->where('total', '>=', floatval($filtros['totalMin']));
        }

        if (! empty($filtros['totalMax'])) {
            $query->where('total', '<=', floatval($filtros['totalMax']));
        }

        // Filtro de proformas vencidas
        if (! empty($filtros['filtroVencidas'])) {
            $hoy = now()->startOfDay();
            if ($filtros['filtroVencidas'] === 'VENCIDAS') {
                $query->whereDate('fecha_vencimiento', '<', $hoy);
            } elseif ($filtros['filtroVencidas'] === 'VIGENTES') {
                $query->where(function ($q) use ($hoy) {
                    $q->whereDate('fecha_vencimiento', '>=', $hoy)
                        ->orWhereNull('fecha_vencimiento');
                });
            }
        }

        // Obtener las proformas filtradas
        $proformas = $query->get();

        // Guardar en sesión para usar en la vista de impresión
        session([
            'impresion_proformas' => $proformas->pluck('id')->toArray(),
            'impresion_formato'   => $formato,
            'impresion_filtros'   => $filtros,
        ]);

        return response()->json([
            'success'            => true,
            'message'            => 'Impresión preparada correctamente',
            'cantidad_proformas' => $proformas->count(),
            'proforma_ids'       => $proformas->pluck('id')->toArray(),
        ]);
    }

    /**
     * ✅ NUEVO: Descargar PDF de proformas filtradas (para app móvil)
     * Genera PDF directamente sin usar sesión
     * Accessible para preventistas del usuario autenticado
     */
    public function descargarPdfProformas(Request $request)
    {
        try {
            // Obtener filtros
            $filtros = $request->input('filtros', []);
            $formato = $request->input('formato', 'A4');
            $idsParam = $request->input('ids');

            // Obtener IDs desde parámetro
            if ($idsParam) {
                $proformaIds = is_array($idsParam)
                    ? array_map('intval', $idsParam)
                    : array_map('intval', explode(',', $idsParam));
            } else {
                $proformaIds = [];
            }

            if (empty($proformaIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay proformas para descargar'
                ], 400);
            }

            // Obtener proformas con relaciones necesarias
            $proformas = Proforma::whereIn('id', $proformaIds)
                ->with([
                    'cliente',
                    'usuarioCreador',
                    'detalles.producto',
                    'venta.cliente',
                    'venta.detalles.producto',
                    'estadoLogistica',
                ])
                ->orderBy('id', 'asc') // ✅ Ordenar ascendentemente por ID
                ->get();

            if ($proformas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron proformas con los IDs especificados'
                ], 404);
            }

            // Mapear formato a vista específica
            $vistaMap = [
                'A4'        => 'proformas.imprimir.listado-a4',
                'TICKET_80' => 'proformas.imprimir.ticket-80',
                'TICKET_58' => 'proformas.imprimir.ticket-58',
            ];

            $vista = $vistaMap[$formato] ?? 'proformas.imprimir.listado-a4';

            // Renderizar HTML
            $html = view($vista, [
                'proformas' => $proformas,
                'filtros' => $filtros,
                'titulo' => 'Reporte de Proformas',
            ])->render();

            // Convertir a PDF usando DomPDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);

            // Retornar PDF como descarga
            $nombreArchivo = 'proformas-' . now()->format('YmdHis') . '.pdf';
            return $pdf->download($nombreArchivo);

        } catch (\Exception $e) {
            \Log::error('❌ Error al descargar PDF de proformas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar el PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
