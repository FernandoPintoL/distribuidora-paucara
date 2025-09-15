<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Almacen;
use App\Models\Categoria;
use App\Models\Chofer;
use App\Models\DetalleTransferenciaInventario;
use App\Models\EstadoMerma;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\TipoAjustInventario;
use App\Models\TipoMerma;
use App\Models\TransferenciaInventario;
use App\Models\Vehiculo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventarioController extends Controller
{
    /**
     * Dashboard principal de inventario
     */
    public function dashboard(): Response
    {
        // Estadísticas generales
        $totalProductos = Producto::where('activo', true)->count();
        $productosStockBajo = Producto::where('activo', true)->stockBajo()->count();
        $productosProximosVencer = Producto::where('activo', true)->proximosVencer(30)->count();
        $productosVencidos = Producto::where('activo', true)->vencidos()->count();

        // Stock total por almacén
        $stockPorAlmacen = Almacen::withSum('stockProductos', 'cantidad')
            ->where('activo', true)
            ->get()
            ->map(function ($almacen) {
                return [
                    'nombre' => $almacen->nombre,
                    'stock_total' => $almacen->stock_productos_sum_cantidad ?? 0,
                ];
            });

        // Movimientos recientes (últimos 7 días)
        $movimientosRecientes = MovimientoInventario::with(['stockProducto.producto', 'stockProducto.almacen', 'user'])
            ->whereBetween('fecha', [now()->subDays(7), now()])
            ->orderByDesc('fecha')
            ->limit(10)
            ->get();

        // Top productos con más movimientos en el mes
        $productosMasMovidos = MovimientoInventario::select([
            'stock_productos.producto_id',
            DB::raw('COUNT(*) as total_movimientos'),
            DB::raw('SUM(ABS(movimientos_inventario.cantidad)) as cantidad_total'),
        ])
            ->join('stock_productos', 'movimientos_inventario.stock_producto_id', '=', 'stock_productos.id')
            ->whereBetween('fecha', [now()->startOfMonth(), now()])
            ->groupBy('stock_productos.producto_id')
            ->orderByDesc('total_movimientos')
            ->limit(10)
            ->with('producto:id,nombre')
            ->get();

        return Inertia::render('inventario/index', [
            'estadisticas' => [
                'total_productos' => $totalProductos,
                'productos_stock_bajo' => $productosStockBajo,
                'productos_proximos_vencer' => $productosProximosVencer,
                'productos_vencidos' => $productosVencidos,
            ],
            'stock_por_almacen' => $stockPorAlmacen,
            'movimientos_recientes' => $movimientosRecientes,
            'productos_mas_movidos' => $productosMasMovidos,
        ]);
    }

    /**
     * Productos con stock bajo
     */
    public function stockBajo(Request $request): Response
    {
        $q = (string) $request->string('q');
        $almacenId = $request->integer('almacen_id');

        // Obtener productos con stock bajo directamente desde StockProducto
        $query = StockProducto::with(['producto.categoria', 'producto.marca', 'almacen'])
            ->where('cantidad', '>', 0)
            ->whereHas('producto', function ($q) {
                $q->where('activo', true)
                    ->where('stock_minimo', '>', 0);
            })
            ->whereRaw('cantidad <= (SELECT stock_minimo FROM productos WHERE productos.id = stock_productos.producto_id)');

        if ($q) {
            $query->whereHas('producto', function ($productQuery) use ($q) {
                $productQuery->where('nombre', 'ilike', "%$q%");
            });
        }

        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        $productos = $query->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'producto' => [
                        'id' => $stock->producto->id,
                        'nombre' => $stock->producto->nombre,
                        'categoria' => [
                            'nombre' => $stock->producto->categoria->nombre ?? 'Sin categoría',
                        ],
                    ],
                    'almacen' => [
                        'id' => $stock->almacen->id,
                        'nombre' => $stock->almacen->nombre,
                    ],
                    'stock_actual' => $stock->cantidad,
                    'stock_minimo' => $stock->producto->stock_minimo,
                    'fecha_vencimiento' => $stock->fecha_vencimiento,
                ];
            });

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/stock-bajo', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters' => [
                'q' => $q,
                'almacen_id' => $almacenId,
            ],
        ]);
    }

    /**
     * Productos próximos a vencer
     */
    public function proximosVencer(Request $request): Response
    {
        $diasAnticipacion = $request->integer('dias', 30);
        $almacenId = $request->integer('almacen_id');

        // Obtener productos próximos a vencer directamente desde StockProducto
        $fechaLimite = now()->addDays($diasAnticipacion);

        $query = StockProducto::with(['producto.categoria', 'producto.marca', 'almacen'])
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '>', now()->toDateString())
            ->where('fecha_vencimiento', '<=', $fechaLimite)
            ->where('cantidad', '>', 0)
            ->whereHas('producto', function ($q) {
                $q->where('activo', true);
            });

        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        $productos = $query->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'producto' => [
                        'id' => $stock->producto->id,
                        'nombre' => $stock->producto->nombre,
                        'categoria' => [
                            'nombre' => $stock->producto->categoria->nombre ?? 'Sin categoría',
                        ],
                    ],
                    'almacen' => [
                        'id' => $stock->almacen->id,
                        'nombre' => $stock->almacen->nombre,
                    ],
                    'stock_actual' => $stock->cantidad,
                    'fecha_vencimiento' => $stock->fecha_vencimiento,
                    'dias_para_vencer' => now()->diffInDays($stock->fecha_vencimiento, false),
                ];
            });

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/proximos-vencer', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters' => [
                'dias' => $diasAnticipacion,
                'almacen_id' => $almacenId,
            ],
        ]);
    }

    /**
     * Productos vencidos
     */
    public function vencidos(Request $request): Response
    {
        $almacenId = $request->integer('almacen_id');

        // Obtener productos vencidos directamente desde StockProducto
        $query = StockProducto::with(['producto.categoria', 'producto.marca', 'almacen'])
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '<', now()->toDateString())
            ->where('cantidad', '>', 0)
            ->whereHas('producto', function ($q) {
                $q->where('activo', true);
            });

        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        $productos = $query->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'producto' => [
                        'id' => $stock->producto->id,
                        'nombre' => $stock->producto->nombre,
                        'categoria' => [
                            'nombre' => $stock->producto->categoria->nombre ?? 'Sin categoría',
                        ],
                    ],
                    'almacen' => [
                        'id' => $stock->almacen->id,
                        'nombre' => $stock->almacen->nombre,
                    ],
                    'stock_actual' => $stock->cantidad,
                    'fecha_vencimiento' => $stock->fecha_vencimiento,
                    'dias_vencido' => now()->diffInDays($stock->fecha_vencimiento, false) * -1,
                ];
            });

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/vencidos', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters' => [
                'almacen_id' => $almacenId,
            ],
        ]);
    }

    /**
     * Historial de movimientos
     */
    public function movimientos(Request $request): Response
    {
        $fechaInicio = $request->date('fecha_inicio') ?? now()->subMonth();
        $fechaFin = $request->date('fecha_fin') ?? now();
        $tipo = $request->filled('tipo') ? $request->string('tipo') : null;
        $almacenId = $request->filled('almacen_id') ? $request->integer('almacen_id') : null;
        $productoId = $request->filled('producto_id') ? $request->integer('producto_id') : null;

        $query = MovimientoInventario::with([
            'stockProducto.producto:id,nombre',
            'stockProducto.almacen:id,nombre',
            'user:id,name',
        ])->porFecha($fechaInicio, $fechaFin);

        if ($tipo && ! empty($tipo)) {
            $query->porTipo($tipo);
        }

        if ($almacenId && $almacenId > 0) {
            $query->porAlmacen($almacenId);
        }

        if ($productoId && $productoId > 0) {
            $query->porProducto($productoId);
        }

        $movimientos = $query->orderByDesc('fecha')
            ->get()
            ->map(function ($movimiento) {
                return [
                    'id' => $movimiento->id,
                    'tipo' => $this->mapearTipoMovimiento($movimiento->tipo),
                    'motivo' => $this->obtenerMotivoMovimiento($movimiento->tipo),
                    'cantidad' => $movimiento->cantidad,
                    'stock_anterior' => $movimiento->cantidad_anterior,
                    'stock_nuevo' => $movimiento->cantidad_posterior,
                    'fecha' => $movimiento->fecha->toISOString(),
                    'usuario' => [
                        'name' => $movimiento->user->name ?? 'Sistema',
                    ],
                    'producto' => [
                        'nombre' => $movimiento->stockProducto->producto->nombre,
                        'categoria' => [
                            'nombre' => 'General', // Simplificado por ahora
                        ],
                    ],
                    'almacen' => [
                        'nombre' => $movimiento->stockProducto->almacen->nombre,
                    ],
                    'referencia' => $movimiento->numero_documento,
                    'observaciones' => $movimiento->observacion,
                ];
            });

        $tipo_mermas = TipoMerma::all();
        $tipos_ajueste_inventario = TipoAjustInventario::all();
        $estado_mermas = EstadoMerma::all();
        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/movimientos', [
            'movimientos' => $movimientos,
            'tipo_mermas' => $tipo_mermas,
            'tipos_ajuste_inventario' => $tipos_ajueste_inventario,
            'estado_mermas' => $estado_mermas,
            'almacenes' => $almacenes,
            'filtros' => [
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_fin' => $fechaFin->toDateString(),
                'tipo' => $tipo,
                'almacen_id' => $almacenId,
                'producto_id' => $productoId,
            ],
        ]);
    }

    /**
     * Mapear tipo de movimiento a formato simple
     */
    private function mapearTipoMovimiento(string $tipo): string
    {
        if (str_starts_with($tipo, 'ENTRADA_')) {
            return 'entrada';
        } elseif (str_starts_with($tipo, 'SALIDA_')) {
            return 'salida';
        } else {
            return 'ajuste';
        }
    }

    /**
     * Obtener motivo legible del movimiento
     */
    private function obtenerMotivoMovimiento(string $tipo): string
    {
        $tipos = MovimientoInventario::getTipos();

        return $tipos[$tipo] ?? 'Movimiento desconocido';
    }

    /**
     * Formulario de ajuste de inventario
     */
    public function ajusteForm(Request $request): Response
    {
        $almacenId = $request->integer('almacen_id');

        $stockProductos = collect();
        if ($almacenId) {
            $stockProductos = StockProducto::where('almacen_id', $almacenId)
                ->with(['producto:id,nombre', 'almacen:id,nombre'])
                ->orderBy('cantidad', 'desc')
                ->get();
        }

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/ajuste', [
            'almacenes' => $almacenes,
            'stock_productos' => $stockProductos,
            'almacen_seleccionado' => $almacenId,
        ]);
    }

    /**
     * Procesar ajuste de inventario
     */
    public function procesarAjuste(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ajustes' => ['required', 'array'],
            'ajustes.*.stock_producto_id' => ['required', 'exists:stock_productos,id'],
            'ajustes.*.nueva_cantidad' => ['required', 'integer', 'min:0'],
            'ajustes.*.observacion' => ['nullable', 'string', 'max:500'],
            'ajustes.*.tipo_ajuste_id' => ['nullable', 'exists:tipos_ajuste_inventario,id'],
        ]);

        $movimientos = [];

        DB::transaction(function () use ($data, &$movimientos) {
            foreach ($data['ajustes'] as $ajuste) {
                $stockProducto = StockProducto::findOrFail($ajuste['stock_producto_id']);
                $observacion = $ajuste['observacion'] ?? 'Ajuste masivo de inventario';

                // Siempre procesar el ajuste, incluso si la cantidad no ha cambiado
                // Esto permite registrar el tipo de ajuste y la observación
                $diferencia = $ajuste['nueva_cantidad'] - $stockProducto->cantidad;
                // Consultar el tipo de movimiento desde la base de datos o definirlo como string plano
                $tipo = $diferencia >= 0 ? 'ENTRADA_AJUSTE' : 'SALIDA_AJUSTE';

                // Registrar el movimiento con el tipo de ajuste
                $movimiento = MovimientoInventario::registrar(
                    $stockProducto,
                    $diferencia,
                    $tipo,
                    $observacion,
                    null,
                    null,
                    $ajuste['tipo_ajuste_id'] ?? null
                );

                $movimientos[] = $movimiento;
            }
        });

        return redirect()->route('inventario.ajuste.form')
            ->with('success', 'Se procesaron '.count($movimientos).' ajustes de inventario');
    }

    /**
     * API: Procesar ajuste de inventario
     */
    public function procesarAjusteApi(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ajustes' => ['required', 'array'],
            'ajustes.*.stock_producto_id' => ['required', 'exists:stock_productos,id'],
            'ajustes.*.nueva_cantidad' => ['required', 'integer', 'min:0'],
            'ajustes.*.observacion' => ['nullable', 'string', 'max:500'],
            'ajustes.*.tipo_ajuste_id' => ['nullable', 'exists:tipos_ajuste_inventario,id'],
        ]);

        $movimientos = [];

        try {
            DB::transaction(function () use ($data, &$movimientos) {
                foreach ($data['ajustes'] as $ajuste) {
                    $stockProducto = StockProducto::find($ajuste['stock_producto_id']);
                    $observacion = $ajuste['observacion'] ?? 'Ajuste masivo de inventario';

                    // Siempre procesar el ajuste, incluso si la cantidad no ha cambiado
                    // Esto permite registrar el tipo de ajuste y la observación
                    $diferencia = $ajuste['nueva_cantidad'] - $stockProducto->cantidad;
                    $tipo = $diferencia >= 0 ?
                    MovimientoInventario::TIPO_ENTRADA_AJUSTE :
                    MovimientoInventario::TIPO_SALIDA_AJUSTE;

                    // Registrar el movimiento con el tipo de ajuste
                    $movimiento = MovimientoInventario::registrar(
                        $stockProducto,
                        $diferencia,
                        $tipo,
                        $observacion,
                        null,
                        null,
                        $ajuste['tipo_ajuste_id'] ?? null
                    );

                    $movimientos[] = $movimiento;
                }
            });

            return ApiResponse::success(
                $movimientos,
                'Se procesaron '.count($movimientos).' ajustes de inventario'
            );
        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al procesar ajustes: '.$e->getMessage(),
                500
            );
        }
    }

    /**
     * API: Listar movimientos de inventario
     */
    public function movimientosApi(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);
        $almacenId = $request->integer('almacen_id');
        $productoId = $request->integer('producto_id');
        $tipo = $request->string('tipo');
        $fechaInicio = $request->date('fecha_inicio');
        $fechaFin = $request->date('fecha_fin');

        $movimientos = MovimientoInventario::with([
            'stockProducto.producto:id,nombre,codigo',
            'user:id,name',
        ])
            ->when($almacenId, fn ($q) => $q->whereHas('stockProducto', fn ($sq) => $sq->where('almacen_id', $almacenId)))
            ->when($productoId, fn ($q) => $q->whereHas('stockProducto', fn ($sq) => $sq->where('producto_id', $productoId)))
            ->when($tipo, fn ($q) => $q->where('tipo', $tipo))
            ->when($fechaInicio, fn ($q) => $q->whereDate('fecha', '>=', $fechaInicio))
            ->when($fechaFin, fn ($q) => $q->whereDate('fecha', '<=', $fechaFin))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->paginate($perPage);

        return ApiResponse::success($movimientos);
    }

    /**
     * API: Crear movimiento manual de inventario
     */
    public function crearMovimiento(Request $request): JsonResponse
    {
        $data = $request->validate([
            'stock_producto_id' => ['required', 'exists:stock_productos,id'],
            'cantidad' => ['required', 'integer', 'not_in:0'],
            'tipo' => ['required', 'in:entrada_ajuste,salida_ajuste'],
            'observacion' => ['required', 'string', 'max:500'],
        ]);

        try {
            $stockProducto = StockProducto::findOrFail($data['stock_producto_id']);

            $movimiento = MovimientoInventario::registrar(
                $stockProducto,
                $data['cantidad'],
                $data['tipo'],
                $data['observacion']
            );

            return ApiResponse::success(
                $movimiento->load(['stockProducto.producto', 'stockProducto.almacen', 'user']),
                'Movimiento registrado exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al registrar movimiento: '.$e->getMessage(),
                500
            );
        }
    }

    /**
     * API: Buscar productos para ajustes
     */
    public function buscarProductos(Request $request): JsonResponse
    {
        $q = $request->string('q');
        $almacenId = $request->integer('almacen_id');

        if (! $q || strlen($q) < 2) {
            return ApiResponse::success([]);
        }

        $productos = Producto::where('nombre', 'ilike', "%$q%")
            ->where('activo', true)
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->with('almacen');
            }])
            ->limit(20)
            ->get();

        return ApiResponse::success($productos);
    }

    /**
     * API: Obtener stock de un producto específico
     */
    public function stockProducto(Producto $producto, Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');

        $stock = $producto->stock()
            ->when($almacenId, fn ($q) => $q->where('almacen_id', $almacenId))
            ->with('almacen')
            ->get();

        return ApiResponse::success([
            'producto' => [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'stock_minimo' => $producto->stock_minimo,
                'stock_maximo' => $producto->stock_maximo,
                'stock_total' => $producto->stockTotal(),
                'stock_bajo' => $producto->stockBajo(),
            ],
            'stock_por_almacen' => $stock,
        ]);
    }

    /**
     * Página de reportes de inventario
     */
    public function reportes(): Response
    {
        $categorias = Categoria::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);
        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/reportes', [
            'categorias' => $categorias,
            'almacenes' => $almacenes,
        ]);
    }

    /**
     * Listado de transferencias entre almacenes
     */
    public function transferencias(Request $request): Response
    {
        $query = TransferenciaInventario::with([
            'almacenOrigen:id,nombre',
            'almacenDestino:id,nombre',
            'usuario:id,name',
            'vehiculo:id,placa',
            'chofer:id,licencia',
        ]);

        if ($request->filled('estado')) {
            $query->porEstado($request->string('estado'));
        }

        if ($request->filled('almacen_id')) {
            $query->porAlmacen($request->integer('almacen_id'));
        }

        if ($request->filled('fecha_inicio')) {
            $query->porFecha($request->date('fecha_inicio'), $request->date('fecha_fin'));
        }

        $transferencias = $query->orderByDesc('fecha')
            ->paginate(15)
            ->withQueryString();

        $almacenes = Almacen::where('activo', true)->get(['id', 'nombre']);
        $vehiculos = Vehiculo::activos()->get(['id', 'placa']);
        $choferes = Chofer::activos()->with('user:id,name')->get();
        $estados = TransferenciaInventario::getEstados();

        return Inertia::render('inventario/transferencias/index', [
            'transferencias' => $transferencias,
            'almacenes' => $almacenes,
            'vehiculos' => $vehiculos,
            'choferes' => $choferes,
            'estados' => $estados,
            'filtros' => $request->only(['estado', 'almacen_id', 'fecha_inicio', 'fecha_fin']),
        ]);
    }

    /**
     * Crear nueva transferencia de inventario
     */
    public function crearTransferencia(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'almacen_origen_id' => ['required', 'exists:almacenes,id'],
            'almacen_destino_id' => ['required', 'exists:almacenes,id', 'different:almacen_origen_id'],
            'vehiculo_id' => ['nullable', 'exists:vehiculos,id'],
            'chofer_id' => ['nullable', 'exists:choferes,id'],
            'observaciones' => ['nullable', 'string', 'max:500'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', 'exists:productos,id'],
            'detalles.*.cantidad' => ['required', 'integer', 'min:1'],
            'detalles.*.lote' => ['nullable', 'string', 'max:50'],
            'detalles.*.fecha_vencimiento' => ['nullable', 'date'],
        ]);

        try {
            $transferencia = DB::transaction(function () use ($data) {
                // Generar número
                $ultimoNumero = TransferenciaInventario::max('numero') ?? 'TRF-000000';
                $numero = (int) substr($ultimoNumero, 4);
                $nuevoNumero = 'TRF-'.str_pad($numero + 1, 6, '0', STR_PAD_LEFT);

                // Crear transferencia
                $transferencia = TransferenciaInventario::create([
                    'numero' => $nuevoNumero,
                    'fecha' => now(),
                    'almacen_origen_id' => $data['almacen_origen_id'],
                    'almacen_destino_id' => $data['almacen_destino_id'],
                    'usuario_id' => Auth::id(),
                    'estado' => TransferenciaInventario::ESTADO_BORRADOR,
                    'vehiculo_id' => $data['vehiculo_id'] ?? null,
                    'chofer_id' => $data['chofer_id'] ?? null,
                    'observaciones' => $data['observaciones'] ?? null,
                    'total_productos' => count($data['detalles']),
                    'total_cantidad' => array_sum(array_column($data['detalles'], 'cantidad')),
                ]);

                // Crear detalles
                foreach ($data['detalles'] as $detalle) {
                    DetalleTransferenciaInventario::create([
                        'transferencia_id' => $transferencia->id,
                        'producto_id' => $detalle['producto_id'],
                        'cantidad' => $detalle['cantidad'],
                        'lote' => $detalle['lote'] ?? null,
                        'fecha_vencimiento' => $detalle['fecha_vencimiento'] ?? null,
                    ]);
                }

                return $transferencia;
            });

            return redirect()
                ->route('inventario.transferencias.show', $transferencia)
                ->with('success', "Transferencia {$transferencia->numero} creada exitosamente");

        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['error' => 'Error al crear transferencia: '.$e->getMessage()]);
        }
    }

    /**
     * Registrar merma de inventario
     */
    public function registrarMerma(Request $request): JsonResponse
    {
        $data = $request->validate([
            'stock_producto_id' => ['required', 'exists:stock_productos,id'],
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo' => ['required', 'string', 'max:500'],
            'fecha_merma' => ['nullable', 'date'],
        ]);

        try {
            $stockProducto = StockProducto::findOrFail($data['stock_producto_id']);

            if ($stockProducto->cantidad < $data['cantidad']) {
                return ApiResponse::error('Stock insuficiente para registrar la merma', 400);
            }

            $movimiento = MovimientoInventario::registrar(
                $stockProducto,
                -$data['cantidad'],
                MovimientoInventario::TIPO_SALIDA_MERMA,
                $data['motivo'],
                'MERMA-'.now()->format('Ymd-His')
            );

            return ApiResponse::success(
                $movimiento->load(['stockProducto.producto', 'stockProducto.almacen']),
                'Merma registrada exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al registrar merma: '.$e->getMessage(),
                500
            );
        }
    }

    /**
     * Mostrar formulario para crear transferencia
     */
    public function formularioCrearTransferencia(): Response
    {
        $almacenes = Almacen::where('activo', true)
            ->select('id', 'nombre', 'direccion', 'ubicacion_fisica', 'requiere_transporte_externo')
            ->get();
        $vehiculos = Vehiculo::activos()->get();
        $choferes = Chofer::with('user')->get();
        $productos = Producto::where('activo', true)
            ->with(['codigoPrincipal', 'stock' => function ($query) {
                $query->select('producto_id', 'almacen_id', 'cantidad')
                    ->where('cantidad', '>', 0);
            }])
            ->select('id', 'nombre', 'codigo_qr')
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                $stockTotal = $producto->stock->sum('cantidad');

                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'codigo' => $producto->codigoPrincipal?->codigo ?? $producto->codigo_qr ?? 'SIN-CODIGO',
                    'stock_disponible' => $stockTotal,
                    'stock_por_almacen' => $producto->stock->groupBy('almacen_id')->map(function ($stock) {
                        return $stock->sum('cantidad');
                    })->toArray(),
                ];
            });

        return Inertia::render('inventario/transferencias/crear', [
            'almacenes' => $almacenes,
            'vehiculos' => $vehiculos,
            'choferes' => $choferes,
            'productos' => $productos,
        ]);
    }

    /**
     * Ver detalles de una transferencia
     */
    public function verTransferencia(TransferenciaInventario $transferencia): Response
    {
        $transferencia->load([
            'almacenOrigen',
            'almacenDestino',
            'vehiculo',
            'chofer.user',
            'creadoPor',
            'detalles.producto',
        ]);

        return Inertia::render('inventario/transferencias/ver', [
            'transferencia' => $transferencia,
        ]);
    }

    /**
     * Enviar transferencia
     */
    public function enviarTransferencia(Request $request, TransferenciaInventario $transferencia): JsonResponse
    {
        try {
            $transferencia->enviar();

            return ApiResponse::success(
                $transferencia->load(['almacenOrigen', 'almacenDestino']),
                'Transferencia enviada exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al enviar transferencia: '.$e->getMessage(),
                400
            );
        }
    }

    /**
     * Recibir transferencia
     */
    public function recibirTransferencia(Request $request, TransferenciaInventario $transferencia): JsonResponse
    {
        try {
            $transferencia->recibir();

            return ApiResponse::success(
                $transferencia->load(['almacenOrigen', 'almacenDestino']),
                'Transferencia recibida exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al recibir transferencia: '.$e->getMessage(),
                400
            );
        }
    }

    /**
     * Cancelar transferencia
     */
    public function cancelarTransferencia(Request $request, TransferenciaInventario $transferencia): JsonResponse
    {
        $data = $request->validate([
            'motivo_cancelacion' => ['required', 'string', 'max:500'],
        ]);

        try {
            $transferencia->cancelar($data['motivo_cancelacion']);

            return ApiResponse::success(
                $transferencia->load(['almacenOrigen', 'almacenDestino']),
                'Transferencia cancelada exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al cancelar transferencia: '.$e->getMessage(),
                400
            );
        }
    }

    /**
     * Listar mermas
     */
    public function mermas(Request $request): Response
    {
        $mermas = MovimientoInventario::with(['stockProducto.producto', 'stockProducto.almacen', 'user'])
            ->where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)
            ->orderByDesc('fecha')
            ->paginate(15);

        // Calcular estadísticas de mermas
        $estadisticas = [
            'total_mermas' => MovimientoInventario::where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)->count(),
            'total_pendientes' => 0, // No existe la columna estado en movimientos_inventario
            'total_aprobadas' => MovimientoInventario::where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)->count(),
            'total_rechazadas' => 0, // No existe la columna estado en movimientos_inventario
            'costo_total_mes' => 0, // Temporalmente 0, se puede calcular con JOIN a precios_producto más adelante
        ];

        return Inertia::render('inventario/mermas/index', [
            'mermas' => $mermas,
            'estadisticas' => $estadisticas,
        ]);
    }

    /**
     * Mostrar formulario para registrar merma
     */
    public function formularioRegistrarMerma(): Response
    {
        $almacenes = Almacen::where('activo', true)->get();

        return Inertia::render('inventario/mermas/registrar', [
            'almacenes' => $almacenes,
        ]);
    }

    /**
     * API: Obtener vehículos activos
     */
    public function apiVehiculos(): JsonResponse
    {
        $vehiculos = Vehiculo::activos()->get();

        return ApiResponse::success($vehiculos);
    }

    /**
     * API: Obtener choferes
     */
    public function apiChoferes(): JsonResponse
    {
        $choferes = Chofer::with('user')->get()->map(function ($chofer) {
            return [
                'id' => $chofer->id,
                'user_id' => $chofer->user_id,
                'nombre' => $chofer->user->name,
                'licencia' => $chofer->licencia,
                'telefono' => $chofer->telefono,
                'activo' => $chofer->activo,
            ];
        });

        return ApiResponse::success($choferes);
    }

    /**
     * Formulario para editar transferencia
     */
    public function editarTransferencia(TransferenciaInventario $transferencia): Response
    {
        $transferencia->load(['detalles.producto', 'almacenOrigen', 'almacenDestino', 'vehiculo', 'chofer.user']);

        $almacenes = Almacen::where('activo', true)->get();
        $vehiculos = Vehiculo::where('activo', true)->get();
        $choferes = Chofer::with('user')->get();

        return Inertia::render('inventario/transferencias/editar', [
            'transferencia' => $transferencia,
            'almacenes' => $almacenes,
            'vehiculos' => $vehiculos,
            'choferes' => $choferes,
        ]);
    }

    /**
     * Actualizar transferencia
     */
    public function actualizarTransferencia(Request $request, TransferenciaInventario $transferencia): RedirectResponse
    {
        $request->validate([
            'almacen_destino_id' => 'required|exists:almacenes,id',
            'vehiculo_id' => 'nullable|exists:vehiculos,id',
            'chofer_id' => 'nullable|exists:choferes,id',
            'observaciones' => 'nullable|string|max:500',
            'productos' => 'required|array|min:1',
            'productos.*.stock_producto_id' => 'required|exists:stock_productos,id',
            'productos.*.cantidad' => 'required|numeric|min:0.01',
        ]);

        DB::beginTransaction();
        try {
            // Solo permitir editar si está en estado pendiente
            if ($transferencia->estado !== 'pendiente') {
                return back()->withErrors(['error' => 'Solo se pueden editar transferencias pendientes']);
            }

            // Actualizar datos principales
            $transferencia->update([
                'almacen_destino_id' => $request->almacen_destino_id,
                'vehiculo_id' => $request->vehiculo_id,
                'chofer_id' => $request->chofer_id,
                'observaciones' => $request->observaciones,
            ]);

            // Eliminar detalles existentes
            $transferencia->detalles()->delete();

            // Recrear detalles
            foreach ($request->productos as $producto) {
                DetalleTransferenciaInventario::create([
                    'transferencia_inventario_id' => $transferencia->id,
                    'stock_producto_id' => $producto['stock_producto_id'],
                    'cantidad_solicitada' => $producto['cantidad'],
                    'cantidad_enviada' => 0,
                    'cantidad_recibida' => 0,
                ]);
            }

            DB::commit();

            return redirect()->route('inventario.transferencias.ver', $transferencia->id)
                ->with('success', 'Transferencia actualizada exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al actualizar la transferencia: '.$e->getMessage()]);
        }
    }

    /**
     * Listado de mermas
     */
    public function indexMermas(Request $request): Response
    {
        // Aquí iría la lógica para obtener mermas desde la base de datos
        // Por ahora simulamos datos para que funcione el frontend
        $mermas = collect([]);
        $estadisticas = [
            'total_mermas' => 0,
            'valor_total_perdido' => 0,
            'mermas_pendientes' => 0,
            'mermas_aprobadas' => 0,
            'mermas_rechazadas' => 0,
        ];

        return Inertia::render('inventario/mermas/index', [
            'mermas' => $mermas,
            'estadisticas' => $estadisticas,
            'filtros' => $request->all(),
        ]);
    }

    /**
     * Formulario para registrar mermas
     */
    public function registrarMermasForm(): Response
    {
        $almacenes = Almacen::where('activo', true)->get();

        return Inertia::render('inventario/mermas/registrar', [
            'almacenes' => $almacenes,
        ]);
    }

    /**
     * Ver detalle de merma
     */
    public function verMerma($id): Response
    {
        // Simulamos datos hasta implementar el modelo
        $merma = [
            'id' => $id,
            'codigo' => 'MER-'.str_pad($id, 6, '0', STR_PAD_LEFT),
            'almacen' => ['nombre' => 'Almacén Principal'],
            'tipo_merma' => 'vencimiento',
            'estado' => 'pendiente',
            'fecha_registro' => now()->format('Y-m-d H:i:s'),
            'observaciones' => 'Productos vencidos del lote ABC123',
            'detalles' => [],
            'valor_total' => 0,
        ];

        return Inertia::render('inventario/mermas/ver', [
            'merma' => $merma,
        ]);
    }

    /**
     * Aprobar merma
     */
    public function aprobarMerma(Request $request, $id): JsonResponse
    {
        $request->validate([
            'observaciones_aprobacion' => 'nullable|string|max:500',
        ]);

        // Lógica de aprobación aquí

        return ApiResponse::success([
            'message' => 'Merma aprobada exitosamente',
            'merma_id' => $id,
        ]);
    }

    /**
     * Rechazar merma
     */
    public function rechazarMerma(Request $request, $id): JsonResponse
    {
        $request->validate([
            'observaciones_rechazo' => 'required|string|max:500',
        ]);

        // Lógica de rechazo aquí

        return ApiResponse::success([
            'message' => 'Merma rechazada exitosamente',
            'merma_id' => $id,
        ]);
    }
}
