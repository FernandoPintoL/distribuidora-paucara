<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\CreateMovimientoRequest;
use App\Http\Requests\StoreAjusteInventarioRequest;
use App\Http\Requests\StoreMermaRequest;
use App\Http\Requests\StoreTransferenciaInventarioRequest;
use App\Models\Almacen;
use App\Models\Categoria;
use App\Models\DetalleTransferenciaInventario;
use App\Models\EstadoMerma;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\TipoAjusteInventario;
use App\Models\TipoMerma;
use App\Models\TipoOperacion;
use App\Models\TransferenciaInventario;
use App\Models\User;
use App\Models\Vehiculo;
use App\Services\ExcelExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class InventarioController extends Controller
{
    private ExcelExportService $excelExportService;

    public function __construct(ExcelExportService $excelExportService)
    {
        $this->excelExportService = $excelExportService;
    }
    /**
     * Generar número secuencial para ajuste de inventario
     * Formato: AJ + YYYYMMDD + XXXX (ejemplo: AJ202510290001)
     */
    private function generarNumeroAjuste(): string
    {
        $fecha       = now()->format('Ymd');
        $maxIntentos = 5;
        $intento     = 0;

        while ($intento < $maxIntentos) {
            try {
                // Buscar el último movimiento de ajuste del día
                $ultimoAjuste = MovimientoInventario::where('numero_documento', 'like', "AJ{$fecha}%")
                    ->orderBy('numero_documento', 'desc')
                    ->lockForUpdate()
                    ->first();

                if ($ultimoAjuste) {
                    $numeroSecuencial = intval(substr($ultimoAjuste->numero_documento, -4)) + 1;
                } else {
                    $numeroSecuencial = 1;
                }

                $numero = 'AJ' . $fecha . str_pad($numeroSecuencial, 4, '0', STR_PAD_LEFT);

                \Illuminate\Support\Facades\Log::info('Número de ajuste generado', [
                    'numero'  => $numero,
                    'intento' => $intento + 1,
                ]);

                return $numero;

            } catch (\Illuminate\Database\QueryException $e) {
                $intento++;
                if ($intento >= $maxIntentos) {
                    throw new \Exception('No se pudo generar el número de ajuste después de ' . $maxIntentos . ' intentos');
                }
                usleep(100000); // Esperar 100ms antes de reintentar
            }
        }

        throw new \Exception('Error al generar número de ajuste');
    }

    /**
     * Dashboard principal de inventario
     */
    public function dashboard(): Response
    {
        // Estadísticas generales
        $totalProductos          = Producto::where('activo', true)->count();
        $productosStockBajo      = Producto::where('activo', true)->stockBajo()->count();
        $productosProximosVencer = Producto::where('activo', true)->proximosVencer(30)->count();
        $productosVencidos       = Producto::where('activo', true)->vencidos()->count();

        // Stock por almacén - agrupado por producto+almacén con detalles de lotes
        $stockPorAlmacen = StockProducto::with([
            'producto',
            'producto.codigoPrincipal',
            'almacen',
            'producto.precios',
            'producto.unidad',
            'producto.conversiones.unidadDestino',
        ])
            ->withoutTrashed() // Excluir registros soft deleted
            ->where('cantidad', '>', 0)
            ->orderBy('almacen_id')
            ->orderBy('producto_id')
            ->get();

        // Agrupar por producto_id + almacen_id
        $stockAgrupado = [];
        foreach ($stockPorAlmacen as $stock) {
            $clave = $stock->producto_id . '_' . $stock->almacen_id;

            if (! isset($stockAgrupado[$clave])) {
                // Obtener precio de venta base
                $precioVenta = 0;
                if ($stock->producto) {
                    $precioVentaObj = $stock->producto->precios?->firstWhere('es_precio_base', true);
                    $precioVenta    = $precioVentaObj?->precio ?? $stock->producto->precio_venta ?? 0;
                }

                $stockAgrupado[$clave] = [
                    'id'                        => null,
                    'producto_id'               => $stock->producto_id,
                    'almacen_id'                => $stock->almacen_id,
                    'cantidad'                  => 0,
                    'cantidad_disponible'       => 0,
                    'cantidad_reservada'        => 0,
                    'precio_venta'              => $precioVenta,
                    'producto_nombre'           => $stock->producto?->nombre ?? 'Desconocido',
                    'producto_codigo'           => $stock->producto?->codigo ?? '',
                    'producto_codigo_barra'     => $stock->producto?->codigoPrincipal?->codigo ?? '',
                    'producto_sku'              => $stock->producto?->sku ?? '',
                    'almacen_nombre'            => $stock->almacen?->nombre ?? 'Desconocido',
                    'es_fraccionado'            => (bool) $stock->producto?->es_fraccionado,
                    'unidad_medida_nombre'      => $stock->producto?->unidad?->nombre ?? 'Unidades',
                    'fecha_vencimiento_proximo' => null,
                    'detalles_lotes'            => [],
                ];
            }

            // Acumular cantidades
            $stockAgrupado[$clave]['cantidad']            += $stock->cantidad;
            $stockAgrupado[$clave]['cantidad_disponible'] += $stock->cantidad_disponible;
            $stockAgrupado[$clave]['cantidad_reservada']  += $stock->cantidad_reservada;

            // Procesar conversiones para productos fraccionados
            $conversiones = [];
            if ($stock->producto?->es_fraccionado && $stock->producto->conversiones) {
                $conversiones = $stock->producto->conversiones->map(function ($conv) use ($stock) {
                    return [
                        'id'                     => $conv->id,
                        'unidad_origen_id'       => $conv->unidad_origen_id,
                        'unidad_destino_id'      => $conv->unidad_destino_id,
                        'unidad_destino_nombre'  => $conv->unidadDestino?->nombre ?? '',
                        'factor_conversion'      => $conv->factor_conversion,
                        'cantidad_en_conversion' => round($stock->cantidad * $conv->factor_conversion, 2),
                    ];
                })->values()->toArray();
            }

            // Agregar detalle de lote
            $stockAgrupado[$clave]['detalles_lotes'][] = [
                'id'                  => $stock->id,
                'lote'                => $stock->lote ?? 'Sin lote',
                'fecha_vencimiento'   => $stock->fecha_vencimiento ? \Carbon\Carbon::parse($stock->fecha_vencimiento)->format('d/m/Y') : null,
                'cantidad'            => $stock->cantidad,
                'cantidad_disponible' => $stock->cantidad_disponible,
                'cantidad_reservada'  => $stock->cantidad_reservada,
                'conversiones'        => $conversiones,
            ];

            // Actualizar próximo vencimiento (el más cercano)
            if ($stock->fecha_vencimiento) {
                $fechaParsed = \Carbon\Carbon::parse($stock->fecha_vencimiento);
                if (! $stockAgrupado[$clave]['fecha_vencimiento_proximo'] ||
                    $fechaParsed < \Carbon\Carbon::parse($stockAgrupado[$clave]['fecha_vencimiento_proximo'])) {
                    $stockAgrupado[$clave]['fecha_vencimiento_proximo'] = $fechaParsed->format('d/m/Y');
                }
            }
        }

        // Convertir a Collection para las operaciones posteriores
        $stockPorAlmacenCollection = collect($stockAgrupado);

        // Obtener productos sin registros de stock_productos
        $productosConStock = $stockPorAlmacenCollection->pluck('producto_id')->unique();
        $productossinStock = Producto::where('activo', true)
            ->whereNotIn('id', $productosConStock)
            ->with(['codigoPrincipal', 'precios', 'unidad', 'conversiones.unidadDestino'])
            ->get();

        // Mapear productos sin stock con cantidad 0
        $stockSinRegistros = $productossinStock->map(function ($producto) {
            // Obtener precio de venta base
            $precioVenta    = 0;
            $precioVentaObj = $producto->precios?->firstWhere('es_precio_base', true);
            $precioVenta    = $precioVentaObj?->precio ?? $producto->precio_venta ?? 0;

            return [
                'id'                        => null,
                'producto_id'               => $producto->id,
                'almacen_id'                => null,
                'cantidad'                  => 0,
                'cantidad_disponible'       => 0,
                'cantidad_reservada'        => 0,
                'precio_venta'              => $precioVenta,
                'producto_nombre'           => $producto->nombre,
                'producto_codigo'           => $producto->codigo ?? '',
                'producto_codigo_barra'     => $producto->codigoPrincipal?->codigo ?? '',
                'producto_sku'              => $producto->sku ?? '',
                'almacen_nombre'            => 'Sin Stock',
                'es_fraccionado'            => (bool) $producto->es_fraccionado,
                'unidad_medida_nombre'      => $producto->unidad?->nombre ?? 'Unidades',
                'fecha_vencimiento_proximo' => null,
                'detalles_lotes'            => [],
            ];
        });

        // Combinar stock existente con productos sin stock
        $stockPorAlmacen = $stockPorAlmacenCollection->concat($stockSinRegistros)->sortBy(['almacen_nombre', 'producto_nombre'])->values()->toArray();

        // Movimientos recientes (últimos 7 días)
        $movimientosRecientes  = MovimientoInventario::with(['stockProducto.producto', 'stockProducto.almacen', 'user'])
            ->whereBetween('fecha', [now()->subDays(7), now()])
            ->whereHas('stockProducto.producto')
            ->orderByDesc('fecha')
            ->limit(10)
            ->get()
            ->filter(function ($movimiento) {
                // Filtrar movimientos que tengan relaciones válidas
                return $movimiento->stockProducto && $movimiento->stockProducto->producto && $movimiento->stockProducto->almacen;
            })
            ->values();

        // Top productos con más movimientos en el mes
        $productosMasMovidosData = MovimientoInventario::select([
            'stock_productos.producto_id',
            DB::raw('COUNT(*) as total_movimientos'),
            DB::raw('SUM(ABS(movimientos_inventario.cantidad)) as cantidad_total'),
        ])
            ->join('stock_productos', 'movimientos_inventario.stock_producto_id', '=', 'stock_productos.id')
            ->whereBetween('movimientos_inventario.fecha', [now()->startOfMonth(), now()])
            ->groupBy('stock_productos.producto_id')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(10)
            ->get();

        // Obtener productos en una sola query
        $productoIds = $productosMasMovidosData->pluck('producto_id')->unique();
        $productos   = Producto::whereIn('id', $productoIds)->select('id', 'nombre')->get()->keyBy('id');

        $productosMasMovidos = $productosMasMovidosData->map(function ($item) use ($productos) {
            $producto = $productos->get($item->producto_id);
            return [
                'producto_id'       => $item->producto_id,
                'nombre_producto'   => $producto?->nombre ?? 'Producto desconocido',
                'total_movimientos' => $item->total_movimientos,
            ];
        });

        // Obtener lista de almacenes para los filtros
        $almacenesLista = Almacen::select('id', 'nombre')
            ->where('activo', true)
            ->orderBy('nombre')
            ->get();

        return Inertia::render('inventario/index', [
            'estadisticas'          => [
                'total_productos'           => $totalProductos,
                'productos_stock_bajo'      => $productosStockBajo,
                'productos_proximos_vencer' => $productosProximosVencer,
                'productos_vencidos'        => $productosVencidos,
            ],
            'stock_por_almacen'     => $stockPorAlmacen,
            'movimientos_recientes' => $movimientosRecientes,
            'productos_mas_movidos' => $productosMasMovidos,
            'almacenes'             => $almacenesLista,
        ]);
    }

    /**
     * Productos con stock bajo
     */
    public function stockBajo(Request $request): Response
    {
        $q         = (string) $request->string('q');
        $almacenId = $request->integer('almacen_id');

        // Obtener productos con stock bajo directamente desde StockProducto
        $query = StockProducto::with(['producto.categoria', 'producto.marca', 'almacen'])
            ->withoutTrashed() // Excluir registros soft deleted
            ->where('cantidad', '>', 0)
            ->whereHas('producto', function ($q) {
                $q->where('activo', true)
                    ->where('stock_minimo', '>', 0);
            })
            ->whereRaw('cantidad <= (SELECT stock_minimo FROM productos WHERE productos.id = stock_productos.producto_id)');

        if ($q) {
            $query->whereHas('producto', function ($productQuery) use ($q) {
                $searchLower = strtolower($q);
                $productQuery->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
            });
        }

        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        $productos = $query->get()
            ->map(function ($stock) {
                return [
                    'id'                => $stock->id,
                    'producto'          => [
                        'id'        => $stock->producto->id,
                        'nombre'    => $stock->producto->nombre,
                        'categoria' => [
                            'nombre' => $stock->producto->categoria->nombre ?? 'Sin categoría',
                        ],
                    ],
                    'almacen'           => [
                        'id'     => $stock->almacen->id,
                        'nombre' => $stock->almacen->nombre,
                    ],
                    'stock_actual'      => $stock->cantidad,
                    'stock_minimo'      => $stock->producto->stock_minimo,
                    'fecha_vencimiento' => $stock->fecha_vencimiento,
                ];
            });

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/stock-bajo', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters'   => [
                'q'          => $q,
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
        $almacenId        = $request->integer('almacen_id');

        // Obtener productos próximos a vencer directamente desde StockProducto
        $fechaLimite = now()->addDays($diasAnticipacion);

        $query = StockProducto::with(['producto.categoria', 'producto.marca', 'almacen'])
            ->withoutTrashed() // Excluir registros soft deleted
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
                    'id'                => $stock->id,
                    'producto'          => [
                        'id'        => $stock->producto->id,
                        'nombre'    => $stock->producto->nombre,
                        'categoria' => [
                            'nombre' => $stock->producto->categoria->nombre ?? 'Sin categoría',
                        ],
                    ],
                    'almacen'           => [
                        'id'     => $stock->almacen->id,
                        'nombre' => $stock->almacen->nombre,
                    ],
                    'stock_actual'      => $stock->cantidad,
                    'fecha_vencimiento' => $stock->fecha_vencimiento,
                    'dias_para_vencer'  => now()->diffInDays($stock->fecha_vencimiento, false),
                ];
            });

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/proximos-vencer', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters'   => [
                'dias'       => $diasAnticipacion,
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
            ->withoutTrashed() // Excluir registros soft deleted
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
                    'id'                => $stock->id,
                    'producto'          => [
                        'id'        => $stock->producto->id,
                        'nombre'    => $stock->producto->nombre,
                        'categoria' => [
                            'nombre' => $stock->producto->categoria->nombre ?? 'Sin categoría',
                        ],
                    ],
                    'almacen'           => [
                        'id'     => $stock->almacen->id,
                        'nombre' => $stock->almacen->nombre,
                    ],
                    'stock_actual'      => $stock->cantidad,
                    'fecha_vencimiento' => $stock->fecha_vencimiento,
                    'dias_vencido'      => now()->diffInDays($stock->fecha_vencimiento, false) * -1,
                ];
            });

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/vencidos', [
            'productos' => $productos,
            'almacenes' => $almacenes,
            'filters'   => [
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
        $fechaFin    = $request->date('fecha_fin') ?? now();
        $tipo        = $request->filled('tipo') ? $request->string('tipo') : null;
        $almacenId   = $request->filled('almacen_id') ? $request->integer('almacen_id') : null;
        $productoId  = $request->filled('producto_id') ? $request->integer('producto_id') : null;
        $productoBusqueda = $request->filled('producto_busqueda') ? $request->string('producto_busqueda') : null;
        $observaciones = $request->filled('observaciones') ? $request->string('observaciones') : null;
        $numeroDocumento = $request->filled('numero_documento') ? $request->string('numero_documento') : null;
        $perPage     = 15;

        // Construir query con filtros
        $query = MovimientoInventario::with([
            'stockProducto.producto:id,nombre,sku',
            'stockProducto.almacen:id,nombre',
            'user:id,name,email',  // ✅ MODIFICADO: Agregar email
            'user.roles:id,name',  // ✅ NUEVO: Cargar roles del usuario
        ])->porFecha($fechaInicio, $fechaFin);

        if ($tipo && ! empty($tipo)) {
            $query->porTipo($tipo);
        }

        if ($almacenId && $almacenId > 0) {
            $query->porAlmacen($almacenId);
        }

        // Buscar por ID específico O por búsqueda flexible
        if ($productoId && $productoId > 0) {
            $query->porProducto($productoId);
        } elseif ($productoBusqueda && ! empty($productoBusqueda)) {
            $query->porProductoBusqueda($productoBusqueda);
        }

        // Filtrar por observaciones
        if ($observaciones && ! empty($observaciones)) {
            $query->porObservaciones($observaciones);
        }

        // Filtrar por número de documento
        if ($numeroDocumento && ! empty($numeroDocumento)) {
            $query->where('numero_documento', 'LIKE', '%' . $numeroDocumento . '%');
        }

        // Obtener total para estadísticas
        $totalMovimientos = $query->count();
        $totalEntradas    = (clone $query)->where('tipo', 'like', 'ENTRADA%')->count();
        $totalSalidas     = (clone $query)->where('tipo', 'like', 'SALIDA%')->count();

        // ✅ Paginar resultados - Laravel obtiene automáticamente la página del request
        $movimientosPaginados = $query->orderByDesc('id')
            ->paginate($perPage);

        // Mapear datos de movimientos
        $movimientos = $movimientosPaginados->map(function ($movimiento) {
            // ✅ Validar que stockProducto existe (puede ser null si se eliminó el lote)
            $stockProducto = $movimiento->stockProducto;

            if (!$stockProducto) {
                // Si el stock_producto fue eliminado, crear datos fallback
                return [
                    'id'                => $movimiento->id,
                    'tipo'              => $this->mapearTipoMovimiento($movimiento->tipo),
                    'tipo_ajuste_id'    => $movimiento->tipo_ajuste_inventario_id,
                    'tipo_merma_id'     => $movimiento->tipo_merma_id,
                    'estado_merma_id'   => $movimiento->estado_merma_id,
                    'motivo'            => $this->obtenerMotivoMovimiento($movimiento->tipo),
                    'cantidad'          => $movimiento->cantidad,
                    'stock_anterior'    => $movimiento->cantidad_anterior,
                    'stock_nuevo'       => $movimiento->cantidad_posterior,
                    'fecha'             => $movimiento->fecha->toISOString(),
                    'usuario'           => [
                        'id'   => $movimiento->user_id,
                        'name' => $movimiento->user?->name ?? 'Sistema',
                        'rol'  => $movimiento->user?->roles?->first()?->name ?? 'Sin rol',  // ✅ NUEVO: Agregar rol
                    ],
                    'producto'          => [
                        'id'        => null,
                        'nombre'    => '[Producto Eliminado]',
                        'sku'       => 'N/A',
                        'categoria' => [
                            'nombre' => 'General',
                        ],
                    ],
                    'almacen'           => [
                        'id'     => null,
                        'nombre' => '[Almacén No Disponible]',
                    ],
                    'referencia'        => $movimiento->numero_documento,
                    'referencia_tipo'   => $movimiento->referencia_tipo,
                    'referencia_id'     => $movimiento->referencia_id,
                    'observaciones'     => $movimiento->observacion,
                    'anulado'           => (bool) $movimiento->anulado,
                    'motivo_anulacion'  => $movimiento->motivo_anulacion,
                    'user_anulacion_id' => $movimiento->user_anulacion_id,
                    'fecha_anulacion'   => $movimiento->fecha_anulacion ? \Carbon\Carbon::parse($movimiento->fecha_anulacion)->toISOString() : null,
                    'ip_dispositivo'    => $movimiento->ip_dispositivo,
                ];
            }

            return [
                'id'                => $movimiento->id,
                'tipo'              => $this->mapearTipoMovimiento($movimiento->tipo),
                'tipo_ajuste_id'    => $movimiento->tipo_ajuste_inventario_id,
                'tipo_merma_id'     => $movimiento->tipo_merma_id,
                'estado_merma_id'   => $movimiento->estado_merma_id,
                'motivo'            => $this->obtenerMotivoMovimiento($movimiento->tipo),
                'cantidad'          => $movimiento->cantidad,
                'stock_anterior'    => $movimiento->cantidad_anterior,
                'stock_nuevo'       => $movimiento->cantidad_posterior,
                'fecha'             => $movimiento->fecha->toISOString(),
                'usuario'           => [
                    'id'   => $movimiento->user_id,
                    'name' => $movimiento->user?->name ?? 'Sistema',
                    'rol'  => $movimiento->user?->roles?->first()?->name ?? 'Sin rol',  // ✅ NUEVO: Agregar rol
                ],
                'producto'          => [
                    'id'        => $stockProducto->producto->id,
                    'nombre'    => $stockProducto->producto->nombre,
                    'sku'       => $stockProducto->producto->sku,
                    'categoria' => [
                        'nombre' => 'General',
                    ],
                ],
                'almacen'           => [
                    'id'     => $stockProducto->almacen->id,
                    'nombre' => $stockProducto->almacen->nombre,
                ],
                'referencia'        => $movimiento->numero_documento,
                'referencia_tipo'   => $movimiento->referencia_tipo,
                'referencia_id'     => $movimiento->referencia_id,
                'observaciones'     => $movimiento->observacion,
                'anulado'           => (bool) $movimiento->anulado,
                'motivo_anulacion'  => $movimiento->motivo_anulacion,
                'user_anulacion_id' => $movimiento->user_anulacion_id,
                'fecha_anulacion'   => $movimiento->fecha_anulacion ? \Carbon\Carbon::parse($movimiento->fecha_anulacion)->toISOString() : null,
                'ip_dispositivo'    => $movimiento->ip_dispositivo,
            ];
        });

        // Estadísticas
        $stats = [
            'total_movimientos'      => $totalMovimientos,
            'total_entradas'         => $totalEntradas,
            'total_salidas'          => $totalSalidas,
            'total_transferencias'   => 0,
            'total_mermas'           => 0,
            'total_ajustes'          => 0,
            'valor_total_entradas'   => 0,
            'valor_total_salidas'    => 0,
            'valor_total_mermas'     => 0,
            'productos_afectados'    => 0,
            'almacenes_activos'      => 0,
            'movimientos_pendientes' => 0,
            'tendencia_semanal'      => [],
        ];

        // Datos para filtros
        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);
        $productos = Producto::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre'])
            ->take(100); // Limitar para performance

        $tipo_mermas              = TipoMerma::all();
        $tipos_ajueste_inventario = TipoAjusteInventario::where('activo', true)
            ->select('id', 'clave', 'label')
            ->orderBy('label')
            ->get();
        $estado_mermas = EstadoMerma::all();

        return Inertia::render('inventario/movimientos', [
            'movimientos'             => [
                'data'         => $movimientos,
                'current_page' => $movimientosPaginados->currentPage(),
                'per_page'     => $movimientosPaginados->perPage(),
                'total'        => $movimientosPaginados->total(),
                'last_page'    => $movimientosPaginados->lastPage(),
                'from'         => $movimientosPaginados->firstItem(),
                'to'           => $movimientosPaginados->lastItem(),
            ],
            'stats'                   => $stats,
            'filtros'                 => [
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_fin'    => $fechaFin->toDateString(),
                'tipo'         => $tipo,
                'almacen_id'   => $almacenId,
                'producto_id'  => $productoId,
            ],
            'almacenes'               => $almacenes,
            'productos'               => $productos,
            'tipo_mermas'             => $tipo_mermas,
            'tipos_ajuste_inventario' => $tipos_ajueste_inventario,
            'estado_mermas'           => $estado_mermas,
        ]);
    }

    /**
     * Mapear tipo de movimiento a formato simple
     */
    private function mapearTipoMovimiento(string $tipo): string
    {
        if (str_starts_with($tipo, 'ENTRADA_')) {
            return 'ENTRADA';
        } elseif (str_starts_with($tipo, 'SALIDA_')) {
            return 'SALIDA';
        } elseif (str_starts_with($tipo, 'RESERVA') || str_starts_with($tipo, 'LIBERACION')) {
            return 'RESERVA';  // ✅ NUEVO: Identificar movimientos de reserva
        } else {
            return 'AJUSTE';
        }
    }

    /**
     * Obtener motivo legible del movimiento
     */
    private function obtenerMotivoMovimiento(string $tipo): string
    {
        $tipos = [
            'ENTRADA_COMPRA'     => 'Compra',
            'ENTRADA_AJUSTE'     => 'Ajuste de inventario',
            'ENTRADA_DEVOLUCION' => 'Devolución de venta',
            'ENTRADA_TRANSFERENCIA' => 'Transferencia recibida',
            'SALIDA_VENTA'       => 'Venta',
            'SALIDA_MERMA'       => 'Merma',
            'SALIDA_AJUSTE'      => 'Ajuste de inventario',
            'SALIDA_TRANSFERENCIA' => 'Transferencia enviada',
            // ✅ NUEVO: Tipos de reserva
            'RESERVA_PROFORMA'   => 'Reserva de proforma',
            'LIBERACION_RESERVA' => 'Liberación de reserva',
        ];

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
                ->withoutTrashed() // Excluir registros soft deleted
                ->with(['producto:id,nombre,sku,codigo_barras,codigo_qr', 'producto.codigosBarra', 'almacen:id,nombre'])
                ->orderBy('cantidad_disponible', 'desc')
                ->get();
        }

        $almacenes = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/ajuste', [
            'almacenes'            => $almacenes,
            'stock_productos'      => $stockProductos,
            'almacen_seleccionado' => $almacenId,
        ]);
    }

    /**
     * Procesar ajuste de inventario (Web)
     */
    public function procesarAjuste(StoreAjusteInventarioRequest $request): RedirectResponse
    {
        try {
            $movimientos = $this->procesarAjustesInventario($request->validated()['ajustes']);

            return redirect()->route('inventario.ajuste.form')
                ->with('success', 'Se procesaron ' . count($movimientos) . ' ajustes de inventario');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'El producto no existe. Por favor, recarga la página e intenta nuevamente.']);
        } catch (\Exception $e) {
            \Log::error('Error al procesar ajuste de inventario: ' . $e->getMessage(), [
                'exception' => $e,
                'ajustes'   => $request->validated()['ajustes'],
            ]);

            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Error al procesar ajustes: ' . $e->getMessage()]);
        }
    }

    /**
     * API: Procesar ajuste de inventario
     */
    public function procesarAjusteApi(StoreAjusteInventarioRequest $request): JsonResponse
    {
        try {
            $movimientos = $this->procesarAjustesInventario($request->validated()['ajustes']);

            return ApiResponse::success(
                $movimientos,
                'Se procesaron ' . count($movimientos) . ' ajustes de inventario'
            );
        } catch (\Exception $e) {
            return ApiResponse::error(
                'Error al procesar ajustes: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Método privado compartido para procesar ajustes de inventario
     *
     * @param array $ajustes Array de ajustes a procesar
     * @return array Array de movimientos creados
     * @throws \Exception Si hay error al procesar
     */
    private function procesarAjustesInventario(array $ajustes): array
    {
        $movimientos = [];

        DB::transaction(function () use ($ajustes, &$movimientos) {
            foreach ($ajustes as $ajuste) {
                $stockProducto = StockProducto::findOrFail($ajuste['stock_producto_id']);
                $observacion   = $ajuste['observacion'] ?? 'Ajuste masivo de inventario';

                // Generar número de documento único para este ajuste
                $numeroDocumento = $this->generarNumeroAjuste();

                // Siempre procesar el ajuste, incluso si la cantidad no ha cambiado
                // Esto permite registrar el tipo de ajuste y la observación
                $diferencia = $ajuste['nueva_cantidad'] - $stockProducto->cantidad;
                $tipo       = $diferencia >= 0 ?
                MovimientoInventario::TIPO_ENTRADA_AJUSTE :
                MovimientoInventario::TIPO_SALIDA_AJUSTE;

                // Registrar el movimiento con el tipo de ajuste y número de documento
                $movimiento = MovimientoInventario::registrar(
                    $stockProducto,
                    $diferencia,
                    $tipo,
                    $observacion,
                    $numeroDocumento,
                    null,
                    $ajuste['tipo_ajuste_id'] ?? null
                );

                $movimientos[] = $movimiento;
            }
        });

        return $movimientos;
    }

    /**
     * API: Listar movimientos de inventario
     */
    public function movimientosApi(Request $request): JsonResponse
    {
        $perPage     = $request->integer('per_page', 15);
        $almacenId   = $request->integer('almacen_id');
        $productoId  = $request->integer('producto_id');
        $tipo        = $request->string('tipo');
        $fechaInicio = $request->date('fecha_inicio');
        $fechaFin    = $request->date('fecha_fin');

        $movimientos = MovimientoInventario::with([
            'stockProducto.producto:id,nombre,codigo',
            'user:id,name',
        ])
            ->when($almacenId, fn($q) => $q->whereHas('stockProducto', fn($sq) => $sq->where('almacen_id', $almacenId)))
            ->when($productoId, fn($q) => $q->whereHas('stockProducto', fn($sq) => $sq->where('producto_id', $productoId)))
            ->when($tipo, fn($q) => $q->where('tipo', $tipo))
            ->when($fechaInicio, fn($q) => $q->whereDate('fecha', '>=', $fechaInicio))
            ->when($fechaFin, fn($q) => $q->whereDate('fecha', '<=', $fechaFin))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->paginate($perPage);

        return ApiResponse::success($movimientos);
    }

    /**
     * API: Crear movimiento manual de inventario
     */
    public function crearMovimiento(CreateMovimientoRequest $request): JsonResponse
    {
        // Data already validated by CreateMovimientoRequest
        $data = $request->validated();

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
                'Error al registrar movimiento: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * API: Buscar productos para ajustes
     */
    public function buscarProductos(Request $request): JsonResponse
    {
        $q         = $request->string('q');
        $almacenId = $request->integer('almacen_id');

        if (! $q || strlen($q) < 2) {
            return ApiResponse::success([]);
        }

        $searchLower = strtolower($q);
        $productos   = Producto::whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
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
            ->when($almacenId, fn($q) => $q->where('almacen_id', $almacenId))
            ->with('almacen')
            ->get();

        return ApiResponse::success([
            'producto'          => [
                'id'           => $producto->id,
                'nombre'       => $producto->nombre,
                'stock_minimo' => $producto->stock_minimo,
                'stock_maximo' => $producto->stock_maximo,
                'stock_total'  => $producto->stockTotal(),
                'stock_bajo'   => $producto->stockBajo(),
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
        $almacenes  = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/reportes', [
            'categorias' => $categorias,
            'almacenes'  => $almacenes,
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
        $choferes  = User::role('Chofer')->get(['id', 'name'])->map(fn($user) => ['id' => $user->id, 'name' => $user->name]);
        $estados   = TransferenciaInventario::getEstados();

        return Inertia::render('inventario/transferencias/index', [
            'transferencias' => $transferencias,
            'almacenes'      => $almacenes,
            'vehiculos'      => $vehiculos,
            'choferes'       => $choferes,
            'estados'        => $estados,
            'filtros'        => $request->only(['estado', 'almacen_id', 'fecha_inicio', 'fecha_fin']),
        ]);
    }

    /**
     * Crear nueva transferencia de inventario
     */
    public function crearTransferencia(StoreTransferenciaInventarioRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $transferencia = DB::transaction(function () use ($data) {
                // Generar número
                $ultimoNumero = TransferenciaInventario::max('numero') ?? 'TRF-000000';
                $numero       = (int) substr($ultimoNumero, 4);
                $nuevoNumero  = 'TRF-' . str_pad($numero + 1, 6, '0', STR_PAD_LEFT);

                // Crear transferencia
                $transferencia = TransferenciaInventario::create([
                    'numero'             => $nuevoNumero,
                    'fecha'              => now(),
                    'almacen_origen_id'  => $data['almacen_origen_id'],
                    'almacen_destino_id' => $data['almacen_destino_id'],
                    'usuario_id'         => Auth::id(),
                    'estado'             => TransferenciaInventario::ESTADO_BORRADOR,
                    'vehiculo_id'        => $data['vehiculo_id'] ?? null,
                    'chofer_id'          => $data['chofer_id'] ?? null,
                    'observaciones'      => $data['observaciones'] ?? null,
                    'total_productos'    => count($data['detalles']),
                    'total_cantidad'     => array_sum(array_column($data['detalles'], 'cantidad')),
                ]);

                // Crear detalles
                foreach ($data['detalles'] as $detalle) {
                    DetalleTransferenciaInventario::create([
                        'transferencia_id'  => $transferencia->id,
                        'producto_id'       => $detalle['producto_id'],
                        'cantidad'          => $detalle['cantidad'],
                        'lote'              => $detalle['lote'] ?? null,
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
                ->withErrors(['error' => 'Error al crear transferencia: ' . $e->getMessage()]);
        }
    }

    /**
     * Registrar merma de inventario
     */
    public function registrarMerma(StoreMermaRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            DB::beginTransaction();

            Log::info('🟠 [REGISTRAR MERMA] INICIO', [
                'almacen_id'      => $data['almacen_id'],
                'tipo_merma'      => $data['tipo_merma'],
                'total_productos' => count($data['productos']),
            ]);

            $numeroMerma            = 'MERMA-' . now()->format('Ymd-His');
            $movimientosRegistrados = [];
            $costTotalMerma         = 0;

            // Obtener el tipo de merma por su clave
            $tipoMerma   = TipoMerma::where('clave', $data['tipo_merma'])->first();
            $tipoMermaId = $tipoMerma?->id;

            Log::info('🟠 [REGISTRAR MERMA] Tipo de merma encontrado', [
                'tipo_merma'      => $data['tipo_merma'],
                'tipo_merma_id'   => $tipoMermaId,
            ]);

            // Procesar cada producto
            foreach ($data['productos'] as $productoData) {
                // Encontrar el stock del producto en el almacén
                $stockProducto = StockProducto::where('producto_id', $productoData['producto_id'])
                    ->where('almacen_id', $data['almacen_id'])
                    ->first();

                if (! $stockProducto) {
                    DB::rollBack();
                    Log::warning('⚠️ [REGISTRAR MERMA] Stock no encontrado', [
                        'producto_id' => $productoData['producto_id'],
                        'almacen_id'  => $data['almacen_id'],
                    ]);
                    return ApiResponse::error(
                        "Stock no encontrado para producto ID {$productoData['producto_id']} en almacén seleccionado",
                        422
                    );
                }

                // Validar cantidad disponible
                if ($stockProducto->cantidad < $productoData['cantidad']) {
                    DB::rollBack();
                    Log::warning('⚠️ [REGISTRAR MERMA] Stock insuficiente', [
                        'producto_id' => $productoData['producto_id'],
                        'disponible'  => $stockProducto->cantidad,
                        'solicitado'  => $productoData['cantidad'],
                    ]);
                    return ApiResponse::error(
                        "Stock insuficiente para {$stockProducto->producto->nombre}. Disponible: {$stockProducto->cantidad}",
                        422
                    );
                }

                // Registrar movimiento de inventario con tipo_merma_id
                $movimiento = MovimientoInventario::registrar(
                    $stockProducto,
                    -$productoData['cantidad'],
                    MovimientoInventario::TIPO_SALIDA_MERMA,
                    $data['motivo'],
                    $numeroMerma,
                    auth()->id(),
                    null,
                    $tipoMermaId,
                    null,
                    'MERMA',
                    null
                );

                $movimientosRegistrados[] = $movimiento;

                // Calcular costo total de merma
                $costoUnitario  = $productoData['costo_unitario'] ?? 0;
                $costTotalMerma += ($productoData['cantidad'] * $costoUnitario);

                Log::info('✅ [REGISTRAR MERMA] Movimiento registrado', [
                    'producto_id'    => $productoData['producto_id'],
                    'cantidad'       => $productoData['cantidad'],
                    'costo_unitario' => $costoUnitario,
                    'tipo_merma_id'  => $tipoMermaId,
                ]);
            }

            DB::commit();

            Log::info('🟢 [REGISTRAR MERMA] COMPLETADO', [
                'numero_merma'      => $numeroMerma,
                'total_movimientos' => count($movimientosRegistrados),
                'costo_total'       => $costTotalMerma,
            ]);

            return ApiResponse::success(
                [
                    'numero_merma'       => $numeroMerma,
                    'movimientos'        => MovimientoInventario::where('numero_documento', $numeroMerma)
                        ->with(['stockProducto.producto', 'stockProducto.almacen'])
                        ->get(),
                    'costo_total'        => $costTotalMerma,
                    'cantidad_productos' => count($movimientosRegistrados),
                ],
                'Merma registrada exitosamente'
            );

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ [REGISTRAR MERMA] ERROR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return ApiResponse::error(
                'Error al registrar merma: ' . $e->getMessage(),
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
        $choferes  = User::role('Chofer')->get(['id', 'name'])->map(fn($user) => ['id' => $user->id, 'name' => $user->name]);
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
                    'id'                => $producto->id,
                    'nombre'            => $producto->nombre,
                    'codigo'            => $producto->codigoPrincipal?->codigo ?? $producto->codigo_qr ?? 'SIN-CODIGO',
                    'stock_disponible'  => $stockTotal,
                    'stock_por_almacen' => $producto->stock->groupBy('almacen_id')->map(function ($stock) {
                        return $stock->sum('cantidad');
                    })->toArray(),
                ];
            });

        return Inertia::render('inventario/transferencias/crear', [
            'almacenes' => $almacenes,
            'vehiculos' => $vehiculos,
            'choferes'  => $choferes,
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
                'Error al enviar transferencia: ' . $e->getMessage(),
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
                'Error al recibir transferencia: ' . $e->getMessage(),
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
                'Error al cancelar transferencia: ' . $e->getMessage(),
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
            'total_mermas'     => MovimientoInventario::where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)->count(),
            'total_pendientes' => 0, // No existe la columna estado en movimientos_inventario
            'total_aprobadas'  => MovimientoInventario::where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)->count(),
            'total_rechazadas' => 0, // No existe la columna estado en movimientos_inventario
            'costo_total_mes'  => 0, // Temporalmente 0, se puede calcular con JOIN a precios_producto más adelante
        ];

        return Inertia::render('inventario/mermas/index', [
            'mermas'       => $mermas,
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
        $choferes = User::role('Chofer')->get(['id', 'name'])->map(function ($user) {
            return [
                'id'     => $user->id,
                'nombre' => $user->name,
                'activo' => true, // Los usuarios en el sistema están activos
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
        $choferes  = User::role('Chofer')->get(['id', 'name'])->map(fn($user) => ['id' => $user->id, 'name' => $user->name]);

        return Inertia::render('inventario/transferencias/editar', [
            'transferencia' => $transferencia,
            'almacenes'     => $almacenes,
            'vehiculos'     => $vehiculos,
            'choferes'      => $choferes,
        ]);
    }

    /**
     * Actualizar transferencia
     */
    public function actualizarTransferencia(Request $request, TransferenciaInventario $transferencia): RedirectResponse
    {
        $request->validate([
            'almacen_destino_id'            => 'required|exists:almacenes,id',
            'vehiculo_id'                   => 'nullable|exists:vehiculos,id',
            'chofer_id'                     => 'nullable|exists:choferes,id',
            'observaciones'                 => 'nullable|string|max:500',
            'productos'                     => 'required|array|min:1',
            'productos.*.stock_producto_id' => 'required|exists:stock_productos,id',
            'productos.*.cantidad'          => 'required|numeric|min:0.01',
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
                'vehiculo_id'        => $request->vehiculo_id,
                'chofer_id'          => $request->chofer_id,
                'observaciones'      => $request->observaciones,
            ]);

            // Eliminar detalles existentes
            $transferencia->detalles()->delete();

            // Recrear detalles
            foreach ($request->productos as $producto) {
                DetalleTransferenciaInventario::create([
                    'transferencia_inventario_id' => $transferencia->id,
                    'stock_producto_id'           => $producto['stock_producto_id'],
                    'cantidad_solicitada'         => $producto['cantidad'],
                    'cantidad_enviada'            => 0,
                    'cantidad_recibida'           => 0,
                ]);
            }

            DB::commit();

            return redirect()->route('inventario.transferencias.ver', $transferencia->id)
                ->with('success', 'Transferencia actualizada exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al actualizar la transferencia: ' . $e->getMessage()]);
        }
    }

    /**
     * Listado de mermas
     */
    public function indexMermas(Request $request): Response
    {
        try {
            // Obtener todos los movimientos de tipo MERMA con sus relaciones
            $movimientos = MovimientoInventario::with([
                'stockProducto.producto',
                'stockProducto.almacen',
                'user',
            ])
                ->where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)
                ->orderByDesc('fecha')
                ->get();

            // Agrupar por numero_documento (cada número de merma puede tener múltiples movimientos)
            $mermasAgrupadas = $movimientos->groupBy('numero_documento')->map(function ($grupo) {
                $primerMovimiento = $grupo->first();
                $totalProductos   = $grupo->count();
                $totalCantidad    = $grupo->sum(function ($mov) {
                    return abs($mov->cantidad);
                });
                $costoTotal = $grupo->sum(function ($mov) {
                    $costoUnitario = $mov->stockProducto?->precio_promedio ?? 0;
                    return abs($mov->cantidad) * $costoUnitario;
                });

                return [
                    'id'              => $primerMovimiento->numero_documento,
                    'numero'          => $primerMovimiento->numero_documento,
                    'almacen'         => $primerMovimiento->stockProducto?->almacen ? [
                        'id'     => $primerMovimiento->stockProducto->almacen->id,
                        'nombre' => $primerMovimiento->stockProducto->almacen->nombre,
                    ] : null,
                    'motivo'          => $primerMovimiento->observacion ?? 'Sin motivo',
                    'tipo_merma'      => 'MERMA',
                    'estado'          => 'Registrada',
                    'total_productos' => $totalProductos,
                    'total_cantidad'  => $totalCantidad,
                    'costo_total'     => $costoTotal,
                    'fecha'           => $primerMovimiento->fecha,
                    'usuario'         => $primerMovimiento->user ? [
                        'id'   => $primerMovimiento->user->id,
                        'name' => $primerMovimiento->user->name,
                    ] : null,
                    'movimientos'     => $grupo->toArray(),
                ];
            });

            // Convertir a array y paginar
            $mermasArray = $mermasAgrupadas->values()->toArray();
            $perPage     = 15;
            $currentPage = $request->get('page', 1);
            $total       = count($mermasArray);
            $mermas      = array_slice($mermasArray, ($currentPage - 1) * $perPage, $perPage);

            // Calcular estadísticas
            $estadisticas = [
                'total_mermas'        => $total,
                'valor_total_perdido' => collect($mermasArray)->sum('costo_total'),
                'mermas_pendientes'   => 0,
                'mermas_aprobadas'    => 0,
                'mermas_rechazadas'   => 0,
            ];

            Log::info('📊 [INDEX MERMAS] Datos cargados', [
                'total_mermas'      => $total,
                'total_movimientos' => $movimientos->count(),
                'valor_total'       => $estadisticas['valor_total_perdido'],
            ]);

            return Inertia::render('inventario/mermas/index', [
                'mermas'       => [
                    'data'         => $mermas,
                    'total'        => $total,
                    'per_page'     => $perPage,
                    'current_page' => $currentPage,
                    'last_page'    => ceil($total / $perPage),
                ],
                'estadisticas' => $estadisticas,
                'filtros'      => $request->all(),
                'almacenes'    => Almacen::where('activo', true)->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [INDEX MERMAS] Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('inventario/mermas/index', [
                'mermas'       => [
                    'data'         => [],
                    'total'        => 0,
                    'per_page'     => 15,
                    'current_page' => 1,
                    'last_page'    => 0,
                ],
                'estadisticas' => [
                    'total_mermas'        => 0,
                    'valor_total_perdido' => 0,
                    'mermas_pendientes'   => 0,
                    'mermas_aprobadas'    => 0,
                    'mermas_rechazadas'   => 0,
                ],
                'filtros'      => $request->all(),
                'almacenes'    => Almacen::where('activo', true)->get(),
            ]);
        }
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
        $movimiento = MovimientoInventario::with([
            'stockProducto.producto.categoria',
            'stockProducto.almacen',
            'user',
            'tipoMerma',
            'estadoMerma',
        ])
            ->where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)
            ->findOrFail($id);

        // Calcular valor de la merma (cantidad * precio promedio)
        $valorTotal = abs($movimiento->cantidad) * ($movimiento->stockProducto->precio_promedio ?? 0);

        $merma = [
            'id'               => $movimiento->id,
            'codigo'           => $movimiento->numero_documento ?? 'MER-' . str_pad($movimiento->id, 6, '0', STR_PAD_LEFT),
            'producto'         => [
                'id'        => $movimiento->stockProducto->producto->id,
                'nombre'    => $movimiento->stockProducto->producto->nombre,
                'categoria' => $movimiento->stockProducto->producto->categoria->nombre ?? 'Sin categoría',
            ],
            'almacen'          => [
                'id'     => $movimiento->stockProducto->almacen->id,
                'nombre' => $movimiento->stockProducto->almacen->nombre,
            ],
            'cantidad'         => abs($movimiento->cantidad),
            'tipo_merma'       => $movimiento->tipoMerma ? [
                'id'     => $movimiento->tipoMerma->id,
                'nombre' => $movimiento->tipoMerma->label,
            ] : null,
            'estado_merma'     => $movimiento->estadoMerma ? [
                'id'     => $movimiento->estadoMerma->id,
                'nombre' => $movimiento->estadoMerma->label,
            ] : null,
            'fecha_registro'   => $movimiento->fecha->format('Y-m-d H:i:s'),
            'observaciones'    => $movimiento->observacion,
            'usuario'          => [
                'name' => $movimiento->user->name ?? 'Sistema',
            ],
            'stock_anterior'   => $movimiento->cantidad_anterior,
            'stock_posterior'  => $movimiento->cantidad_posterior,
            'valor_unitario'   => $movimiento->stockProducto->precio_promedio ?? 0,
            'valor_total'      => $valorTotal,
            'anulado'          => $movimiento->anulado ?? false,
            'motivo_anulacion' => $movimiento->motivo_anulacion,
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

        try {
            $movimiento = MovimientoInventario::where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)
                ->findOrFail($id);

            // Verificar que no esté anulado
            if ($movimiento->anulado) {
                return ApiResponse::error('No se puede aprobar una merma anulada', 400);
            }

            // Buscar el estado "aprobado"
            $estadoAprobado = EstadoMerma::where('clave', 'APROBADO')
                ->orWhere('label', 'like', '%aprobad%')
                ->first();

            if (! $estadoAprobado) {
                return ApiResponse::error('No se encontró el estado "Aprobado" en el sistema', 500);
            }

            // Actualizar estado
            $movimiento->update([
                'estado_merma_id' => $estadoAprobado->id,
            ]);

            // Si hay observaciones, agregarlas
            if ($request->observaciones_aprobacion) {
                $observacionActual = $movimiento->observacion ?? '';
                $movimiento->update([
                    'observacion' => $observacionActual . "\n[APROBACIÓN] " . $request->observaciones_aprobacion,
                ]);
            }

            return ApiResponse::success([
                'message'    => 'Merma aprobada exitosamente',
                'merma_id'   => $id,
                'movimiento' => $movimiento->load(['estadoMerma', 'tipoMerma']),
            ]);
        } catch (\Exception $e) {
            return ApiResponse::error('Error al aprobar la merma: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Rechazar merma
     */
    public function rechazarMerma(Request $request, $id): JsonResponse
    {
        $request->validate([
            'observaciones_rechazo' => 'required|string|max:500',
        ]);

        try {
            $movimiento = MovimientoInventario::where('tipo', MovimientoInventario::TIPO_SALIDA_MERMA)
                ->findOrFail($id);

            // Verificar que no esté anulado
            if ($movimiento->anulado) {
                return ApiResponse::error('No se puede rechazar una merma anulada', 400);
            }

            // Buscar el estado "rechazado"
            $estadoRechazado = EstadoMerma::where('clave', 'RECHAZADO')
                ->orWhere('label', 'like', '%rechazad%')
                ->first();

            if (! $estadoRechazado) {
                return ApiResponse::error('No se encontró el estado "Rechazado" en el sistema', 500);
            }

            // Actualizar estado y agregar observaciones
            $observacionActual = $movimiento->observacion ?? '';
            $movimiento->update([
                'estado_merma_id' => $estadoRechazado->id,
                'observacion'     => $observacionActual . "\n[RECHAZO] " . $request->observaciones_rechazo,
            ]);

            return ApiResponse::success([
                'message'        => 'Merma rechazada exitosamente',
                'merma_id'       => $id,
                'motivo_rechazo' => $request->observaciones_rechazo,
                'movimiento'     => $movimiento->load(['estadoMerma', 'tipoMerma']),
            ]);
        } catch (\Exception $e) {
            return ApiResponse::error('Error al rechazar la merma: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mostrar formulario para ajuste masivo
     */
    public function ajusteMasivoForm(Request $request): Response
    {
        $almacenes      = Almacen::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'activo']);
        $tiposAjuste    = TipoAjusteInventario::where('activo', true)->get();
        $tiposMerma     = TipoMerma::where('activo', true)->get();
        $tiposOperacion = TipoOperacion::where('activo', true)->get();
        $productos      = Producto::all(['id', 'sku', 'nombre'])->take(1000);
        $proveedores    = \App\Models\Proveedor::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'razon_social', 'nit'])->take(500);
        $clientes       = \App\Models\Cliente::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'razon_social', 'nit'])->take(500);

        return Inertia::render('inventario/ajuste-masivo', [
            'almacenes'       => $almacenes,
            'tipos_ajuste'    => $tiposAjuste,
            'tipos_merma'     => $tiposMerma,
            'tipos_operacion' => $tiposOperacion,
            'productos'       => $productos,
            'proveedores'     => $proveedores,
            'clientes'        => $clientes,
        ]);
    }

    /**
     * Procesar ajustes masivos desde CSV
     */
    public function importarAjustesMasivos(Request $request): JsonResponse
    {
        $request->validate([
            'ajustes'                     => 'required|array|min:1',
            'ajustes.*.stock_producto_id' => 'required|integer|exists:stock_productos,id',
            'ajustes.*.tipo_operacion_id' => 'required|integer|exists:tipo_operaciones,id',
            'ajustes.*.tipo_motivo_id'    => 'nullable|integer', // Puede ser null para operaciones sin tipo motivo específico
            'ajustes.*.almacen_id'        => 'required|integer|exists:almacenes,id',
            'ajustes.*.cantidad'          => 'required|integer|min:1', // Siempre positiva
            'ajustes.*.observacion'       => 'required|string|max:500',
            'ajustes.*.tipo_motivo_valor' => 'nullable|string|max:255', // Para proveedor/cliente
            'nombre_archivo'              => 'required|string|max:255',
            'datos_csv'                   => 'required|array', // Datos originales del CSV para almacenamiento
        ]);

        try {
            DB::beginTransaction();

            $ajustes            = $request->input('ajustes');
            $nombreArchivo      = $request->input('nombre_archivo');
            $datosCsv           = $request->input('datos_csv');
            $procesados         = 0;
            $errores            = [];
            $movimientosCreados = [];

            // Calcular hash del archivo para detectar duplicados
            $hashArchivo = hash('sha256', json_encode($datosCsv));

            // Verificar si el archivo ya fue cargado (deduplicación)
            $cargaPrevious = \App\Models\CargoCSVInventario::where('hash_archivo', $hashArchivo)->first();
            if ($cargaPrevious) {
                DB::rollBack();
                return ApiResponse::error('Este archivo ya fue procesado anteriormente', 409);
            }

            // Crear registro de carga CSV
            $cargo = \App\Models\CargoCSVInventario::create([
                'usuario_id'       => Auth::id(),
                'nombre_archivo'   => $nombreArchivo,
                'hash_archivo'     => $hashArchivo,
                'cantidad_filas'   => count($datosCsv),
                'cantidad_validas' => count($ajustes),
                'cantidad_errores' => 0,
                'estado'           => 'pendiente',
                'datos_json'       => json_encode($datosCsv),
                'errores_json'     => json_encode([]),
                'cambios_json'     => json_encode([]),
            ]);

            // Procesar cada ajuste
            foreach ($ajustes as $index => $ajuste) {
                try {
                    // Obtener el stock del producto
                    $stock    = StockProducto::findOrFail($ajuste['stock_producto_id']);
                    $producto = $stock->producto;

                    // VALIDACIÓN CRÍTICA: Verificar que el stock pertenece al almacén especificado
                    if ($stock->almacen_id !== $ajuste['almacen_id']) {
                        throw new \Exception(
                            "El producto '{$producto->nombre}' no existe en el almacén especificado. " .
                            "Pertenece al almacén: {$stock->almacen->nombre}"
                        );
                    }

                    // Obtener la operación para determinar la dirección
                    $operacion = TipoOperacion::findOrFail($ajuste['tipo_operacion_id']);

                    // Generar número de ajuste
                    $numeroAjuste = $this->generarNumeroAjuste();

                    // Determinar tipo de movimiento según la dirección de la operación
                    // La cantidad siempre es positiva, la dirección viene del tipo de operación
                    $cantidad  = $ajuste['cantidad'];
                    $esEntrada = $operacion->direccion === 'entrada';

                    // Mapear el tipo de operación al tipo de movimiento
                    $tipoMovimiento = $this->mapearTipoMovimiento($operacion->clave);

                    // Capturar cantidad anterior ANTES de actualizar el stock
                    $cantidadAnterior = $stock->cantidad;

                    // Actualizar stock según la dirección
                    // IMPORTANTE: Mantener el invariante: cantidad = cantidad_disponible + cantidad_reservada
                    if ($esEntrada) {
                        $stock->cantidad            += $cantidad;
                        $stock->cantidad_disponible += $cantidad;
                    } else {
                        $stock->cantidad            -= $cantidad;
                        $stock->cantidad_disponible -= $cantidad;

                        // Evitar stock negativo
                        if ($stock->cantidad < 0) {
                            $stock->cantidad = 0;
                        }
                        if ($stock->cantidad_disponible < 0) {
                            $stock->cantidad_disponible = 0;
                        }
                    }

                    $stock->fecha_actualizacion  = now();
                    $stock->save();

                    // Ahora crear el movimiento CON los datos actualizados
                    $cantidadPosterior = $stock->cantidad;

                    $movimientoData = [
                        'numero_documento'   => $numeroAjuste,
                        'stock_producto_id'  => $ajuste['stock_producto_id'],
                        'cantidad'           => $cantidad,
                        'cantidad_anterior'  => $cantidadAnterior,
                        'cantidad_posterior' => $cantidadPosterior,
                        'tipo'               => $tipoMovimiento,
                        'observacion'        => $ajuste['observacion'],
                        'user_id'            => Auth::id(),
                        'fecha'              => now(),
                        'referencia_tipo'    => 'CARGA_CSV',
                        'referencia_id'      => $cargo->id, // Vincular al cargo CSV
                    ];

                    // Agregar campos específicos según el tipo de operación
                    if ($operacion->requiere_tipo_motivo === 'tipo_ajuste' && $ajuste['tipo_motivo_id']) {
                        $movimientoData['tipo_ajust_inventario_id'] = $ajuste['tipo_motivo_id'];
                    } else if ($operacion->requiere_tipo_motivo === 'tipo_merma' && $ajuste['tipo_motivo_id']) {
                        $movimientoData['tipo_merma_id'] = $ajuste['tipo_motivo_id'];
                    } else if ($operacion->requiere_proveedor || $operacion->requiere_cliente) {
                        // Guardar el nombre del proveedor/cliente en observación o campo adicional
                        $movimientoData['observacion'] .= ' (' . $ajuste['tipo_motivo_valor'] . ')';
                    }

                    $movimiento = MovimientoInventario::create($movimientoData);

                    $procesados++;
                    $movimientosCreados[] = $movimiento->id;
                } catch (\Exception $e) {
                    $errores[] = [
                        'fila'  => $index + 1,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // Actualizar errores en cargo
            if (! empty($errores)) {
                $cargo->update([
                    'cantidad_errores' => count($errores),
                    'errores_json'     => json_encode($errores),
                ]);
            }

            DB::commit();

            // Después de commit, vincular movimientos al cargo
            if (! empty($movimientosCreados)) {
                foreach ($movimientosCreados as $movimientoId) {
                    DB::table('cargo_csv_movimientos')->insert([
                        'cargo_csv_id'             => $cargo->id,
                        'movimiento_inventario_id' => $movimientoId,
                        'created_at'               => now(),
                        'updated_at'               => now(),
                    ]);
                }

                // Marcar cargo como procesado
                $cargo->update(['estado' => 'procesado']);
            }

            if ($errores) {
                \Log::warning('Errores en importación de ajustes masivos', [
                    'cargo_id' => $cargo->id,
                    'errores'  => $errores,
                ]);
            }

            return ApiResponse::success([
                'cargo_id'   => $cargo->id,
                'procesados' => $procesados,
                'total'      => count($ajustes),
                'errores'    => $errores,
                'mensaje'    => "Se procesaron {$procesados} de " . count($ajustes) . " ajustes",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al procesar ajustes masivos', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ApiResponse::error('Error al procesar los ajustes masivos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mostrar formulario de historial de cargas CSV
     */
    public function historialCargasForm()
    {
        return Inertia::render('inventario/historial-cargas', [
            'initialCargos' => [],
        ]);
    }

    /**
     * Obtener listado de cargas CSV
     */
    public function listarCargosCsv(Request $request): JsonResponse
    {
        try {
            $page    = $request->input('page', 1);
            $perPage = $request->input('per_page', 15);
            $estado  = $request->input('estado');  // Opcional: filtrar por estado
            $usuario = $request->input('usuario'); // Opcional: filtrar por usuario

            $query = \App\Models\CargoCSVInventario::with(['usuario', 'revertidoPorUsuario'])
                ->latest('created_at');

            if ($estado) {
                $query->where('estado', $estado);
            }

            if ($usuario) {
                $query->where('usuario_id', $usuario);
            }

            $cargos = $query->paginate($perPage, ['*'], 'page', $page);

            return ApiResponse::success([
                'data'       => $cargos->map(function ($cargo) {
                    return $cargo->getResumenAttribute();
                })->toArray(),
                'pagination' => [
                    'current_page' => $cargos->currentPage(),
                    'per_page'     => $cargos->perPage(),
                    'total'        => $cargos->total(),
                    'last_page'    => $cargos->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener cargos CSV', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::error('Error al obtener el historial de cargas', 500);
        }
    }

    /**
     * Obtener detalles de un cargo CSV
     */
    public function obtenerDetalleCargo(\App\Models\CargoCSVInventario $cargo): JsonResponse
    {
        try {
            $movimientos = $cargo->movimientos()
                ->with(['stockProducto.producto', 'almacen', 'tipoAjuste'])
                ->get()
                ->map(function ($mov) {
                    return [
                        'id'               => $mov->id,
                        'numero_documento' => $mov->numero_documento,
                        'producto'         => $mov->stockProducto->producto->nombre,
                        'sku'              => $mov->stockProducto->producto->sku,
                        'cantidad'         => $mov->cantidad,
                        'tipo'             => $mov->tipo,
                        'almacen'          => $mov->almacen->nombre,
                        'observacion'      => $mov->observacion,
                        'fecha'            => $mov->fecha_movimiento->format('d/m/Y H:i'),
                    ];
                });

            return ApiResponse::success([
                'cargo'            => $cargo->getResumenAttribute(),
                'movimientos'      => $movimientos,
                'puede_revertir'   => $cargo->estado === 'procesado',
                'datos_originales' => json_decode($cargo->datos_json, true),
                'errores'          => json_decode($cargo->errores_json, true),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener detalles del cargo', [
                'cargo_id' => $cargo->id,
                'error'    => $e->getMessage(),
            ]);

            return ApiResponse::error('Error al obtener los detalles del cargo', 500);
        }
    }

    /**
     * Revertir un cargo CSV
     */
    public function revertirCargo(Request $request, \App\Models\CargoCSVInventario $cargo): JsonResponse
    {
        $request->validate([
            'motivo' => 'required|string|max:500',
        ]);

        try {
            // Verificar que el cargo pueda ser revertido
            if ($cargo->estado !== 'procesado') {
                return ApiResponse::error('Este cargo no puede ser revertido. Estado actual: ' . $cargo->estado, 400);
            }

            // Revertir el cargo
            $resultado = $cargo->revertir(Auth::user(), $request->input('motivo'));

            if (! $resultado) {
                return ApiResponse::error('Error al revertir el cargo', 500);
            }

            \Log::info('Cargo CSV revertido', [
                'cargo_id'              => $cargo->id,
                'usuario_id'            => Auth::id(),
                'movimientos_afectados' => $cargo->movimientos()->count(),
            ]);

            return ApiResponse::success([
                'cargo_id'               => $cargo->id,
                'mensaje'                => 'Cargo revertido exitosamente. Se han deshecho todos los cambios.',
                'movimientos_revertidos' => $cargo->movimientos()->count(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al revertir cargo CSV', [
                'cargo_id' => $cargo->id,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            return ApiResponse::error('Error al revertir el cargo: ' . $e->getMessage(), 500);
        }
    }

    /**
     * API: Obtener estadísticas de inventario
     */
    public function estadisticasApi(Request $request): JsonResponse
    {
        try {
            // Parámetros opcionales de filtro
            $almacenId   = $request->integer('almacen_id');
            $categoriaId = $request->integer('categoria_id');
            $fechaDesde  = $request->date('fecha_desde');
            $fechaHasta  = $request->date('fecha_hasta');

            // Query base de movimientos
            $movimientosQuery = MovimientoInventario::when($almacenId, fn($q) =>
                $q->whereHas('stockProducto', fn($sq) => $sq->where('almacen_id', $almacenId))
            )->when($categoriaId, fn($q) =>
                $q->whereHas('stockProducto.producto', fn($sq) => $sq->where('categoria_id', $categoriaId))
            )->when($fechaDesde, fn($q) =>
                $q->whereDate('fecha', '>=', $fechaDesde)
            )->when($fechaHasta, fn($q) =>
                $q->whereDate('fecha', '<=', $fechaHasta)
            );

            // Estadísticas por tipo de movimiento
            $totalMovimientos    = (clone $movimientosQuery)->count();
            $totalEntradas       = (clone $movimientosQuery)->where('tipo', 'like', 'ENTRADA%')->count();
            $totalSalidas        = (clone $movimientosQuery)->where('tipo', 'like', 'SALIDA%')->count();
            $totalTransferencias = (clone $movimientosQuery)->where('tipo', 'like', '%TRANSFERENCIA%')->count();
            $totalMermas         = (clone $movimientosQuery)->where('tipo', 'like', '%MERMA%')->count();
            $totalAjustes        = (clone $movimientosQuery)->where('tipo', 'like', '%AJUSTE%')->count();

            // Valor total de movimientos (usando cantidad como aproximación)
            $valorTotalEntradas = (clone $movimientosQuery)
                ->where('tipo', 'like', 'ENTRADA%')
                ->where('cantidad', '>', 0)
                ->sum(DB::raw('cantidad'));

            $valorTotalSalidas = (clone $movimientosQuery)
                ->where('tipo', 'like', 'SALIDA%')
                ->where('cantidad', '>', 0)
                ->sum(DB::raw('cantidad'));

            $valorTotalMermas = (clone $movimientosQuery)
                ->where('tipo', 'like', '%MERMA%')
                ->sum(DB::raw('ABS(cantidad)'));

            // Productos afectados
            $productosAfectados = (clone $movimientosQuery)
                ->select('stock_productos.producto_id')
                ->distinct()
                ->count();

            // Almacenes activos
            $almacenesActivos = Almacen::where('activo', true)->count();

            // Stock bajo
            $stockBajo = Producto::where('activo', true)
                ->stockBajo()
                ->count();

            // Próximos a vencer
            $proximosVencer = Producto::where('activo', true)
                ->proximosVencer(30)
                ->count();

            // Vencidos
            $vencidos = Producto::where('activo', true)
                ->vencidos()
                ->count();

            // Tendencia semanal
            $tendenciaSemanal = (clone $movimientosQuery)
                ->select(
                    DB::raw('DATE(fecha) as fecha'),
                    DB::raw("SUM(CASE WHEN tipo LIKE 'ENTRADA%' THEN ABS(cantidad) ELSE 0 END) as entradas"),
                    DB::raw("SUM(CASE WHEN tipo LIKE 'SALIDA%' THEN ABS(cantidad) ELSE 0 END) as salidas"),
                    DB::raw("SUM(CASE WHEN tipo LIKE '%TRANSFERENCIA%' THEN 1 ELSE 0 END) as transferencias"),
                    DB::raw("SUM(CASE WHEN tipo LIKE '%MERMA%' THEN ABS(cantidad) ELSE 0 END) as mermas")
                )
                ->groupBy(DB::raw('DATE(fecha)'))
                ->orderBy('fecha', 'desc')
                ->limit(7)
                ->get()
                ->sortBy('fecha')
                ->values()
                ->map(fn($item) => [
                    'fecha'          => $item->fecha,
                    'entradas'       => (int) $item->entradas,
                    'salidas'        => (int) $item->salidas,
                    'transferencias' => (int) $item->transferencias,
                    'mermas'         => (int) $item->mermas,
                ]);

            $estadisticas = [
                'total_movimientos'      => $totalMovimientos,
                'total_entradas'         => $totalEntradas,
                'total_salidas'          => $totalSalidas,
                'total_transferencias'   => $totalTransferencias,
                'total_mermas'           => $totalMermas,
                'total_ajustes'          => $totalAjustes,
                'valor_total_entradas'   => (float) $valorTotalEntradas,
                'valor_total_salidas'    => (float) $valorTotalSalidas,
                'valor_total_mermas'     => (float) $valorTotalMermas,
                'productos_afectados'    => $productosAfectados,
                'almacenes_activos'      => $almacenesActivos,
                'stock_bajo'             => $stockBajo,
                'proximos_vencer'        => $proximosVencer,
                'vencidos'               => $vencidos,
                'movimientos_pendientes' => 0,
                'tendencia_semanal'      => $tendenciaSemanal,
            ];

            return ApiResponse::success($estadisticas);

        } catch (\Exception $e) {
            \Log::error('Error al obtener estadísticas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ApiResponse::error('Error al obtener estadísticas: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Exportar stock a Excel con formato profesional
     * GET /stock/{stock}/exportar-excel
     */
    public function exportarExcel(StockProducto $stock)
    {
        Log::info('📊 [InventarioController::exportarExcel] Exportando stock a Excel', [
            'stock_id' => $stock->id,
            'user_id'  => auth()->id(),
        ]);

        try {
            return $this->excelExportService->exportarInventario($stock);
        } catch (\Exception $e) {
            Log::error('❌ [InventarioController::exportarExcel] Error', [
                'error'    => $e->getMessage(),
                'stock_id' => $stock->id,
            ]);
            return back()->with('error', 'Error al generar Excel: ' . $e->getMessage());
        }
    }

    /**
     * Exportar stock a PDF
     * GET /stock/{stock}/exportar-pdf
     */
    public function exportarPdf(StockProducto $stock)
    {
        Log::info('📄 [InventarioController::exportarPdf] Exportando stock a PDF', [
            'stock_id' => $stock->id,
            'user_id'  => auth()->id(),
        ]);

        try {
            // Generar PDF usando DomPDF
            $stock->load(['producto.categoria', 'producto.marca', 'almacen']);

            $datos = [
                'stock'   => $stock,
                'empresa' => \App\Models\Empresa::first(),
                'usuario' => auth()->user()->name ?? 'Sistema',
            ];

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('impresion.inventarios.reporte-a4', $datos);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->download('stock_' . $stock->producto->codigo . '_' . now()->format('Y-m-d_H-i-s') . '.pdf');
        } catch (\Exception $e) {
            Log::error('❌ [InventarioController::exportarPdf] Error', [
                'error'    => $e->getMessage(),
                'stock_id' => $stock->id,
            ]);
            return back()->with('error', 'Error al generar PDF: ' . $e->getMessage());
        }
    }

    /**
     * API: Obtener stock filtrado y ordenado
     * Parámetros de query:
     * - busqueda: Buscar por nombre, código o SKU
     * - almacen_id: Filtrar por almacén
     * - rango_stock: 'todos', 'cero', 'bajo', 'normal', 'alto'
     * - ordenamiento: 'cantidad-asc', 'cantidad-desc', 'producto', 'almacen'
     */
    public function apiStockFiltrado(Request $request): JsonResponse
    {
        try {
            $busqueda     = (string) $request->string('busqueda', '')->lower();
            $almacenId    = (int) $request->integer('almacen_id', 0);
            $rangoStock   = (string) $request->string('rango_stock', 'todos');
            $ordenamiento = (string) $request->string('ordenamiento', 'cantidad-desc');

            // Definir rangos de stock
            $rangos = [
                'todos'  => ['min' => 0, 'max' => PHP_INT_MAX],
                'cero'   => ['min' => 0, 'max' => 0],
                'bajo'   => ['min' => 0.01, 'max' => 10],
                'normal' => ['min' => 10.01, 'max' => 100],
                'alto'   => ['min' => 100.01, 'max' => PHP_INT_MAX],
            ];

            $rango = $rangos[$rangoStock] ?? $rangos['todos'];

            // Obtener lista de almacenes activos
            $almacenes = Almacen::where('activo', true)->get();

            $stocks = [];

            // Si hay búsqueda O si filtra por stock cero, comenzar desde Producto (incluye sin stock)
            if ($busqueda || $rangoStock === 'cero') {
                $productoQuery = Producto::with([
                    'stock' => fn($q) => $q->withoutTrashed(), // Excluir soft deleted
                    'stock.almacen',
                    'codigoPrincipal',
                    'precios',
                    'unidad',
                    'conversiones.unidadDestino',
                ]);

                // Aplicar filtro de búsqueda solo si hay término de búsqueda
                if ($busqueda) {
                    $productoQuery->where(function ($q) use ($busqueda) {
                        // Prioridad 1: Búsqueda exacta por ID si es numérico
                        if (is_numeric($busqueda)) {
                            $q->where('id', (int) $busqueda);
                        } else {
                            // Prioridad 2: Búsqueda exacta por SKU (no parcial)
                            $q->where('sku', strtolower($busqueda));
                        }

                        // Prioridad 3: Si no coincide exacto, buscar parcial en SKU
                        $q->orWhereRaw('LOWER(sku) like ?', ["%{$busqueda}%"]);

                        // Prioridad 4: Buscar parcial en nombre
                        $q->orWhereRaw('LOWER(nombre) like ?', ["%{$busqueda}%"]);

                        // Prioridad 5: Buscar en código de barras
                        $q->orWhereHas('codigoPrincipal', function ($cq) use ($busqueda) {
                            $cq->whereRaw('LOWER(codigo) like ?', ["%{$busqueda}%"]);
                        });
                    });
                }

                $productoQuery = $productoQuery->get();

                // Procesar productos encontrados
                foreach ($productoQuery as $producto) {
                    if ($producto->stock && $producto->stock->count() > 0) {
                        // Producto tiene stock registrado
                        foreach ($producto->stock as $stock) {
                            // Aplicar filtros
                            if ($almacenId > 0 && $stock->almacen_id != $almacenId) {
                                continue;
                            }

                            if ($rangoStock === 'cero' && $stock->cantidad != 0) {
                                continue;
                            } elseif ($rangoStock !== 'cero' && ! ($stock->cantidad >= $rango['min'] && $stock->cantidad <= $rango['max'])) {
                                continue;
                            }

                            $stocks[] = $stock;
                        }
                    } else {
                        // Producto sin stock: crear registros virtuales (stock = 0)
                        if ($rangoStock === 'cero' || $rangoStock === 'todos') {
                            // Mostrar en todos los almacenes o solo el seleccionado
                            $almacenesParaMostrar = $almacenId > 0
                                ? [$almacenes->find($almacenId)]
                                : $almacenes;

                            foreach ($almacenesParaMostrar as $almacen) {
                                if (! $almacen) {
                                    continue;
                                }

                                // Crear objeto StockProducto virtual con todas las propiedades
                                $stockVirtual                      = new \stdClass();
                                $stockVirtual->id                  = null;
                                $stockVirtual->producto_id         = $producto->id;
                                $stockVirtual->almacen_id          = $almacen->id;
                                $stockVirtual->cantidad            = 0;
                                $stockVirtual->cantidad_disponible = 0;
                                $stockVirtual->cantidad_reservada  = 0;
                                $stockVirtual->lote                = null;
                                $stockVirtual->ubicacion           = null;
                                $stockVirtual->fecha_vencimiento   = null;
                                $stockVirtual->fecha_registro      = now();
                                $stockVirtual->producto            = $producto;
                                $stockVirtual->almacen             = $almacen;

                                $stocks[] = $stockVirtual;
                            }
                        }
                    }
                }
            } else {
                // Sin búsqueda: usar la query original de stock_productos
                $query = StockProducto::with([
                    'producto',
                    'producto.codigoPrincipal',
                    'almacen',
                    'producto.precios',
                    'producto.unidad',
                    'producto.conversiones.unidadDestino',
                ])
                    ->withoutTrashed(); // Excluir registros soft deleted

                // Filtro por almacén
                if ($almacenId > 0) {
                    $query->where('almacen_id', $almacenId);
                }

                // Filtro por rango de stock
                if ($rangoStock === 'cero') {
                    $query->where('cantidad', '=', 0);
                } else {
                    $query->whereBetween('cantidad', [$rango['min'], $rango['max']]);
                }

                $stocks = $query->get();
            }
            $stockProductos = [];

            // Construcción de datos con detalles de lote
            $stockProductos = [];
            $stockAgrupado  = []; // Para agrupar por producto+almacén

            foreach ($stocks as $stock) {
                // Obtener precio de venta base
                $precioVenta = 0;
                if ($stock->producto) {
                    $precioVentaObj = $stock->producto->precios?->firstWhere('es_precio_base', true);
                    $precioVenta    = $precioVentaObj?->precio ?? $stock->producto->precio_venta ?? 0;
                }

                // Procesar conversiones para productos fraccionados
                $conversiones = [];
                if ($stock->producto?->es_fraccionado && $stock->producto->conversiones) {
                    foreach ($stock->producto->conversiones as $conv) {
                        $conversiones[] = [
                            'id'                     => $conv->id,
                            'unidad_origen_id'       => $conv->unidad_origen_id,
                            'unidad_destino_id'      => $conv->unidad_destino_id,
                            'unidad_destino_nombre'  => $conv->unidadDestino?->nombre ?? '',
                            'factor_conversion'      => $conv->factor_conversion,
                            'cantidad_en_conversion' => round($stock->cantidad * $conv->factor_conversion, 2),
                        ];
                    }
                }

                // Clave única para agrupar
                $clave = $stock->producto_id . '_' . $stock->almacen_id;

                // Si no existe el grupo, crearlo
                if (! isset($stockAgrupado[$clave])) {
                    $stockAgrupado[$clave] = [
                        'id'                        => null, // No hay ID en grupo
                        'producto_id'               => $stock->producto_id,
                        'almacen_id'                => $stock->almacen_id,
                        'cantidad'                  => 0,
                        'cantidad_disponible'       => 0,
                        'cantidad_reservada'        => 0,
                        'precio_venta'              => $precioVenta,
                        'producto_nombre'           => $stock->producto?->nombre ?? 'Desconocido',
                        'producto_codigo'           => $stock->producto?->codigo ?? '',
                        'producto_codigo_barra'     => $stock->producto?->codigoPrincipal?->codigo ?? '',
                        'producto_sku'              => $stock->producto?->sku ?? '',
                        'almacen_nombre'            => $stock->almacen?->nombre ?? 'Desconocido',
                        'es_fraccionado'            => (bool) $stock->producto?->es_fraccionado,
                        'unidad_medida_nombre'      => $stock->producto?->unidad?->nombre ?? 'Unidades',
                        'fecha_vencimiento_proximo' => null, // Se calcula después
                        'detalles_lotes'            => [],
                    ];
                }

                // Acumular cantidades
                $stockAgrupado[$clave]['cantidad']            += $stock->cantidad;
                $stockAgrupado[$clave]['cantidad_disponible'] += $stock->cantidad_disponible;
                $stockAgrupado[$clave]['cantidad_reservada']  += $stock->cantidad_reservada;

                // Agregar detalle de lote
                $stockAgrupado[$clave]['detalles_lotes'][] = [
                    'id'                  => $stock->id,
                    'lote'                => $stock->lote ?? 'Sin lote',
                    'fecha_vencimiento'   => $stock->fecha_vencimiento ? \Carbon\Carbon::parse($stock->fecha_vencimiento)->format('d/m/Y') : null,
                    'cantidad'            => $stock->cantidad,
                    'cantidad_disponible' => $stock->cantidad_disponible,
                    'cantidad_reservada'  => $stock->cantidad_reservada,
                    'conversiones'        => $conversiones,
                ];

                // Actualizar próximo vencimiento (el más cercano)
                if ($stock->fecha_vencimiento) {
                    $fechaParsed = \Carbon\Carbon::parse($stock->fecha_vencimiento);
                    if (! $stockAgrupado[$clave]['fecha_vencimiento_proximo'] ||
                        $fechaParsed < \Carbon\Carbon::parse($stockAgrupado[$clave]['fecha_vencimiento_proximo'])) {
                        $stockAgrupado[$clave]['fecha_vencimiento_proximo'] = $fechaParsed->format('d/m/Y');
                    }
                }
            }

            // Convertir a array de valores
            $stockProductos = array_values($stockAgrupado);

            // Ordenamiento
            usort($stockProductos, function ($a, $b) use ($ordenamiento) {
                return match ($ordenamiento) {
                    'cantidad-asc'  => (int) $a['cantidad'] <=> (int) $b['cantidad'],
                    'cantidad-desc' => (int) $b['cantidad'] <=> (int) $a['cantidad'],
                    'producto'      => strcmp((string) $a['producto_nombre'], (string) $b['producto_nombre']),
                    'almacen'       => strcmp((string) $a['almacen_nombre'], (string) $b['almacen_nombre']),
                    default         => (int) $b['cantidad'] <=> (int) $a['cantidad'],
                };
            });

            return response()->json([
                'success' => true,
                'data'    => $stockProductos,
                'total'   => count($stockProductos),
            ]);

        } catch (\Exception $e) {
            Log::error('Error en apiStockFiltrado', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener stock filtrado: ' . $e->getMessage(),
            ], 500);
        }
    }
}
