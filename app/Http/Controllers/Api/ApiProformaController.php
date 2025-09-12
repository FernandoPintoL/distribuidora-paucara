<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Proforma;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ApiProformaController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'cliente_id' => 'required|exists:clientes,id',
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

        DB::beginTransaction();
        try {
            // Validar que el cliente existe
            $cliente = Cliente::findOrFail($request->cliente_id);

            // Calcular totales y verificar stock
            $subtotal = 0;
            $productosValidados = [];
            $stockInsuficiente = [];

            foreach ($request->productos as $item) {
                $producto = Producto::with('stockProductos')->findOrFail($item['producto_id']);
                $cantidad = $item['cantidad'];

                // Obtener precio actual del producto
                $precio = $producto->precio_venta ?? 0;

                if ($precio <= 0) {
                    throw new \Exception("El producto {$producto->nombre} no tiene precio definido");
                }

                // Verificar disponibilidad de stock
                $stockDisponible = $producto->stockProductos()->sum('cantidad_disponible');

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

            // Calcular impuestos (13% IVA)
            $impuesto = $subtotal * 0.13;
            $total = $subtotal + $impuesto;

            // Crear proforma
            $proforma = Proforma::create([
                'numero' => Proforma::generarNumeroProforma(),
                'fecha' => now(),
                'fecha_vencimiento' => now()->addDays(7),
                'cliente_id' => $request->cliente_id,
                'estado' => Proforma::PENDIENTE,
                'canal_origen' => Proforma::CANAL_APP_EXTERNA,
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'moneda_id' => 1, // Bolivianos por defecto
            ]);

            // Crear detalles
            foreach ($productosValidados as $detalle) {
                $proforma->detalles()->create($detalle);
            }

            // Cargar relaciones para respuesta
            $proforma->load(['detalles.producto', 'cliente']);

            DB::commit();

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
        ]);

        try {
            if ($proforma->estado !== 'PENDIENTE') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden aprobar proformas pendientes',
                ], 400);
            }

            $proforma->aprobar(request()->user(), $request->comentario);

            return response()->json([
                'success' => true,
                'message' => 'Proforma aprobada exitosamente',
                'data' => $proforma->fresh(),
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
}
