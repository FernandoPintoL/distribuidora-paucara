<?php
namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\InventarioInicialBorrador;
use App\Models\InventarioInicialBorradorItem;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\TipoAjusteInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InventarioInicialController extends Controller
{
    /**
     * Mostrar la página de carga masiva de inventario inicial (versión anterior)
     */
    public function index()
    {
        // Obtener productos activos con información mínima
        $productos = Producto::with(['categoria:id,nombre', 'marca:id,nombre', 'unidad:id,codigo,nombre'])
            ->where('activo', true)
            ->select('id', 'nombre', 'sku', 'categoria_id', 'marca_id', 'unidad_medida_id', 'stock_minimo')
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                return [
                    'id'                       => $producto->id,
                    'nombre'                   => $producto->nombre,
                    'sku'                      => $producto->sku,
                    'categoria'                => $producto->categoria?->nombre,
                    'marca'                    => $producto->marca?->nombre,
                    'unidad'                   => $producto->unidad?->codigo,
                    'stock_minimo'             => $producto->stock_minimo,
                    // Verificar si ya tiene inventario inicial cargado
                    'tiene_inventario_inicial' => $this->tieneInventarioInicial($producto->id),
                ];
            });

        // Obtener almacenes activos
        $almacenes = Almacen::where('activo', true)
            ->select('id', 'nombre')
            ->orderBy('nombre')
            ->get();

        // Obtener el tipo de ajuste INVENTARIO_INICIAL
        $tipoInventarioInicial = TipoAjusteInventario::where('clave', 'INVENTARIO_INICIAL')->firstOrFail();

        // Renderizar el nuevo componente avanzado
        return Inertia::render('inventario/components/inventario-inicial-avanzado', [
            'almacenes' => $almacenes,
        ]);
    }

    /**
     * Procesar la carga masiva de inventario inicial
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items'                     => 'required|array|min:1',
            'items.*.producto_id'       => 'required|exists:productos,id',
            'items.*.almacen_id'        => 'required|exists:almacenes,id',
            'items.*.cantidad'          => 'required|integer|min:1',
            'items.*.lote'              => 'nullable|string|max:50',
            'items.*.fecha_vencimiento' => 'nullable|date',
            'items.*.observaciones'     => 'nullable|string|max:500',
        ]);

        // Obtener el tipo de ajuste INVENTARIO_INICIAL
        $tipoInventarioInicial = TipoAjusteInventario::where('clave', 'INVENTARIO_INICIAL')->firstOrFail();

        $resultados = [
            'exitosos'     => 0,
            'fallidos'     => 0,
            'advertencias' => [],
            'errores'      => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($validated['items'] as $index => $item) {
                try {
                    // Verificar si ya existe inventario inicial para este producto/almacén
                    $yaExisteInventarioInicial = MovimientoInventario::whereHas('stockProducto', function ($query) use ($item) {
                        $query->where('producto_id', $item['producto_id'])
                            ->where('almacen_id', $item['almacen_id']);
                    })
                        ->where('tipo', 'ENTRADA_AJUSTE')
                        ->where('tipo_ajuste_inventario_id', $tipoInventarioInicial->id)
                        ->exists();

                    if ($yaExisteInventarioInicial) {
                        $resultados['advertencias'][] = "Item #" . ($index + 1) . ": Ya existe inventario inicial cargado para este producto en este almacén. Se agregará como ajuste adicional.";
                    }

                    // Buscar o crear el registro de stock
                    $stockProducto = StockProducto::firstOrCreate(
                        [
                            'producto_id' => $item['producto_id'],
                            'almacen_id'  => $item['almacen_id'],
                            'lote'        => $item['lote'] ?? null,
                        ],
                        [
                            'cantidad'              => 0,
                            'cantidad_disponible'   => 0,  // Stock disponible (sin reservas)
                            'cantidad_reservada'    => 0,  // Stock reservado
                            'fecha_actualizacion'   => now(),
                            'fecha_vencimiento'     => $item['fecha_vencimiento'] ?? null,
                        ]
                    );

                    // Si el stock ya existe pero tiene una fecha de vencimiento diferente, actualizarla
                    if (! $stockProducto->wasRecentlyCreated && isset($item['fecha_vencimiento'])) {
                        $stockProducto->fecha_vencimiento = $item['fecha_vencimiento'];
                    }

                    $cantidadAnterior = $stockProducto->cantidad;

                    // Actualizar cantidad y mantener el invariante: cantidad = cantidad_disponible + cantidad_reservada
                    // Como es carga inicial, TODO el stock es disponible (sin reservas)
                    $stockProducto->cantidad += $item['cantidad'];
                    $stockProducto->cantidad_disponible += $item['cantidad'];  // Todo es disponible en carga inicial
                    // cantidad_reservada se mantiene igual (sigue siendo 0 en carga inicial)
                    $stockProducto->fecha_actualizacion = now();
                    $stockProducto->save();

                    // Validar que el invariante se mantiene
                    if ($stockProducto->validarInvariante() === false) {
                        throw new \Exception(
                            "Invariante de stock roto para producto_id={$item['producto_id']}, almacen_id={$item['almacen_id']}: " .
                            "cantidad ({$stockProducto->cantidad}) != cantidad_disponible ({$stockProducto->cantidad_disponible}) + cantidad_reservada ({$stockProducto->cantidad_reservada})"
                        );
                    }

                    // Generar número de documento para la carga inicial
                    $numeroDocumento = 'INV-INICIAL-' . now()->format('Ymd') . '-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);

                    // Registrar el movimiento
                    MovimientoInventario::create([
                        'stock_producto_id'         => $stockProducto->id,
                        'cantidad'                  => $item['cantidad'],
                        'cantidad_anterior'         => $cantidadAnterior,
                        'cantidad_posterior'        => $stockProducto->cantidad,
                        'fecha'                     => now(),
                        'numero_documento'          => $numeroDocumento,
                        'observacion'               => $item['observaciones'] ?? 'Carga inicial de inventario al implementar el sistema',
                        'tipo'                      => 'ENTRADA_AJUSTE',
                        'tipo_ajuste_inventario_id' => $tipoInventarioInicial->id,
                        'referencia_tipo'           => 'inventario_inicial',
                        'referencia_id'             => null,
                        'user_id'                   => Auth::id(),
                        'ip_dispositivo'            => $request->ip(),
                    ]);

                    $resultados['exitosos']++;
                } catch (\Exception $e) {
                    $resultados['fallidos']++;
                    $resultados['errores'][] = "Item #" . ($index + 1) . ": {$e->getMessage()}";
                    Log::error("Error en carga de inventario inicial item #" . ($index + 1), [
                        'item'  => $item,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "Inventario inicial cargado: {$resultados['exitosos']} exitosos, {$resultados['fallidos']} fallidos." . (count($resultados['advertencias']) > 0 ? ' Revisa las advertencias.' : ''));
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en carga masiva de inventario inicial', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'Error al cargar el inventario inicial: ' . $e->getMessage());
        }
    }

    /**
     * Crear o obtener un borrador para el usuario actual
     */
    public function createOrGetDraft()
    {
        $borrador = InventarioInicialBorrador::firstOrCreate(
            [
                'usuario_id' => Auth::id(),
                'estado'     => 'borrador',
            ],
            [
                'usuario_id' => Auth::id(),
                'estado'     => 'borrador',
            ]
        );

        return response()->json([
            'id'     => $borrador->id,
            'estado' => $borrador->estado,
        ]);
    }

    /**
     * Guardar o actualizar un item del borrador
     */
    public function storeDraftItem(Request $request, $borradorId)
    {
        $validated = $request->validate([
            'producto_id'       => 'required|exists:productos,id',
            'almacen_id'        => 'required|exists:almacenes,id',
            'cantidad'          => 'nullable|numeric|min:0',
            'lote'              => 'nullable|string|max:100',
            'fecha_vencimiento' => 'nullable|date',
            'precio_costo'      => 'nullable|numeric|min:0',
        ]);

        // Verificar que el borrador pertenece al usuario actual
        $borrador = InventarioInicialBorrador::findOrFail($borradorId);
        if ($borrador->usuario_id !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Usar UPSERT para insertar o actualizar
        // IMPORTANTE: Incluir 'lote' en los criterios de búsqueda para evitar duplicados
        $item = InventarioInicialBorradorItem::updateOrCreate(
            [
                'borrador_id'  => $borradorId,
                'producto_id'  => $validated['producto_id'],
                'almacen_id'   => $validated['almacen_id'],
                'lote'         => $validated['lote'] ?? null,
            ],
            $validated
        );

        return response()->json([
            'success'         => true,
            'item'            => $item,
            'lastUpdated'     => now(),
        ]);
    }

    /**
     * Obtener un borrador con todos sus items
     */
    public function getDraft($borradorId)
    {
        $borrador = InventarioInicialBorrador::with(['items.producto', 'items.almacen', 'items.stockProducto'])
            ->findOrFail($borradorId);

        // Verificar autorización
        if ($borrador->usuario_id !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        return response()->json([
            'id'       => $borrador->id,
            'estado'   => $borrador->estado,
            'items'    => $borrador->items->map(fn($item) => [
                'id'                 => $item->id,
                'producto_id'        => $item->producto_id,
                'almacen_id'         => $item->almacen_id,
                'cantidad'           => $item->cantidad,
                'lote'               => $item->lote,
                'fecha_vencimiento'  => $item->fecha_vencimiento,
                'precio_costo'       => $item->precio_costo,
                'producto'           => $item->producto,
                'almacen'            => $item->almacen,
                'stock_existente_id' => $item->stock_producto_id,
                'es_actualizacion'   => $item->stock_producto_id !== null,
            ]),
            'created'  => $borrador->created_at,
            'updated'  => $borrador->updated_at,
        ]);
    }

    /**
     * Agregar múltiples productos al borrador
     */
    public function addProductosToDraft(Request $request, $borradorId)
    {
        $validated = $request->validate([
            'producto_ids' => 'required|array|min:1',
            'producto_ids.*' => 'exists:productos,id',
        ]);

        $borrador = InventarioInicialBorrador::findOrFail($borradorId);

        // Verificar autorización
        if ($borrador->usuario_id !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Obtener almacenes activos
        $almacenes = Almacen::where('activo', true)->get();

        // Crear items para cada producto/almacén, cargando stock existente
        $items = [];
        foreach ($validated['producto_ids'] as $productoId) {
            foreach ($almacenes as $almacen) {
                // Buscar stock existente para este producto/almacén
                $stocksExistentes = StockProducto::where('producto_id', $productoId)
                    ->where('almacen_id', $almacen->id)
                    ->get();

                if ($stocksExistentes->isEmpty()) {
                    // Crear item sin stock (nuevo producto)
                    $item = InventarioInicialBorradorItem::firstOrCreate(
                        [
                            'borrador_id' => $borradorId,
                            'producto_id' => $productoId,
                            'almacen_id'  => $almacen->id,
                        ],
                        [
                            'cantidad'          => null,
                            'lote'              => null,
                            'fecha_vencimiento' => null,
                            'precio_costo'      => null,
                            'stock_producto_id' => null,
                        ]
                    );
                    $items[] = $item;
                } else {
                    // Crear un item por cada lote existente
                    foreach ($stocksExistentes as $stock) {
                        $item = InventarioInicialBorradorItem::firstOrCreate(
                            [
                                'borrador_id' => $borradorId,
                                'producto_id' => $productoId,
                                'almacen_id'  => $almacen->id,
                                'lote'        => $stock->lote,
                            ],
                            [
                                'cantidad'          => $stock->cantidad,
                                'fecha_vencimiento' => $stock->fecha_vencimiento,
                                'precio_costo'      => $stock->precio_costo,
                                'stock_producto_id' => $stock->id,
                            ]
                        );
                        $items[] = $item;
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'itemsCount' => count($items),
            'items' => $items,
        ]);
    }

    /**
     * Eliminar un item del borrador
     */
    public function deleteDraftItem($borradorId, $itemId)
    {
        $borrador = InventarioInicialBorrador::findOrFail($borradorId);

        // Verificar autorización
        if ($borrador->usuario_id !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $item = InventarioInicialBorradorItem::where('id', $itemId)
            ->where('borrador_id', $borradorId)
            ->firstOrFail();

        $item->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Completar el borrador y guardar el inventario inicial
     */
    public function completeDraft(Request $request, $borradorId)
    {
        $validated = $request->validate([
            'validar_cantidades' => 'boolean',
        ]);

        $borrador = InventarioInicialBorrador::with('items')->findOrFail($borradorId);

        // Verificar autorización
        if ($borrador->usuario_id !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Nota: Los items sin cantidad serán ignorados automáticamente al procesar
        // (ver línea 413-415: if ($item->cantidad === null || $item->cantidad <= 0) continue;)

        DB::beginTransaction();
        try {
            $tipoInventarioInicial = TipoAjusteInventario::where('clave', 'INVENTARIO_INICIAL')->firstOrFail();
            $resultados = [
                'exitosos'     => 0,
                'fallidos'     => 0,
                'advertencias' => [],
                'errores'      => [],
            ];

            foreach ($borrador->items as $index => $item) {
                if ($item->cantidad === null || $item->cantidad <= 0) {
                    continue;  // Saltar items sin cantidad
                }

                try {
                    if ($item->stock_producto_id) {
                        // Actualizar stock existente
                        $stockProducto = StockProducto::findOrFail($item->stock_producto_id);
                        $cantidadAnterior = $stockProducto->cantidad;
                        $diferencia = $item->cantidad - $cantidadAnterior;

                        // Actualizar cantidad y mantener invariante
                        $stockProducto->cantidad = $item->cantidad;
                        $stockProducto->cantidad_disponible = $item->cantidad - $stockProducto->cantidad_reservada;
                        $stockProducto->lote = $item->lote;
                        $stockProducto->fecha_vencimiento = $item->fecha_vencimiento;
                        if ($item->precio_costo) {
                            $stockProducto->precio_costo = $item->precio_costo;
                        }
                        $stockProducto->fecha_actualizacion = now();
                        $stockProducto->save();

                        // Validar invariante
                        if ($stockProducto->validarInvariante() === false) {
                            throw new \Exception("Invariante de stock roto para producto_id={$item->producto_id}");
                        }

                        // Registrar movimiento de ajuste
                        if ($diferencia !== 0) {
                            MovimientoInventario::create([
                                'stock_producto_id'         => $stockProducto->id,
                                'cantidad'                  => $diferencia,
                                'cantidad_anterior'         => $cantidadAnterior,
                                'cantidad_posterior'        => $stockProducto->cantidad,
                                'fecha'                     => now(),
                                'numero_documento'          => 'INV-AJUSTE-' . now()->format('Ymd') . '-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT),
                                'observacion'               => 'Ajuste de inventario inicial',
                                'tipo'                      => 'ENTRADA_AJUSTE',
                                'tipo_ajuste_inventario_id' => $tipoInventarioInicial->id,
                                'referencia_tipo'           => 'inventario_inicial_borrador',
                                'referencia_id'             => $item->id,
                                'user_id'                   => Auth::id(),
                                'ip_dispositivo'            => $request->ip(),
                            ]);
                        }
                    } else {
                        // Crear nuevo registro de stock
                        $stockProducto = StockProducto::create([
                            'producto_id'           => $item->producto_id,
                            'almacen_id'            => $item->almacen_id,
                            'cantidad'              => $item->cantidad,
                            'cantidad_disponible'   => $item->cantidad,
                            'cantidad_reservada'    => 0,
                            'lote'                  => $item->lote,
                            'fecha_vencimiento'     => $item->fecha_vencimiento,
                            'precio_costo'          => $item->precio_costo,
                            'fecha_actualizacion'   => now(),
                        ]);

                        // Registrar movimiento de creación
                        MovimientoInventario::create([
                            'stock_producto_id'         => $stockProducto->id,
                            'cantidad'                  => $item->cantidad,
                            'cantidad_anterior'         => 0,
                            'cantidad_posterior'        => $item->cantidad,
                            'fecha'                     => now(),
                            'numero_documento'          => 'INV-INICIAL-' . now()->format('Ymd') . '-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT),
                            'observacion'               => 'Carga inicial de inventario',
                            'tipo'                      => 'ENTRADA_AJUSTE',
                            'tipo_ajuste_inventario_id' => $tipoInventarioInicial->id,
                            'referencia_tipo'           => 'inventario_inicial_borrador',
                            'referencia_id'             => $item->id,
                            'user_id'                   => Auth::id(),
                            'ip_dispositivo'            => $request->ip(),
                        ]);
                    }

                    $resultados['exitosos']++;
                } catch (\Exception $e) {
                    $resultados['fallidos']++;
                    $resultados['errores'][] = "Item producto {$item->producto_id}, almacén {$item->almacen_id}: {$e->getMessage()}";
                    Log::error('Error completando borrador', ['error' => $e->getMessage()]);
                }
            }

            // Marcar borrador como completado
            $borrador->estado = 'completado';
            $borrador->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'resultados' => $resultados,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error completando inventario inicial borrador', [
                'borrador_id' => $borradorId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Error al completar el inventario: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cargar productos paginados al borrador con stock actual
     */
    public function loadProductsPaginated(Request $request, $borradorId)
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'search' => 'nullable|string|max:255',
        ]);

        $borrador = InventarioInicialBorrador::findOrFail($borradorId);

        // Verificar autorización
        if ($borrador->usuario_id !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 30;
        $search = $validated['search'] ?? '';

        // Obtener productos activos con paginación
        $productosQuery = Producto::with(['categoria', 'marca', 'unidad'])
            ->where('activo', true);

        // Aplicar búsqueda
        if (!empty($search)) {
            $productosQuery->where(function($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $productos = $productosQuery->paginate($perPage, ['*'], 'page', $page);

        // Obtener almacenes activos
        $almacenes = Almacen::where('activo', true)->get();

        // Agregar productos al borrador con stock actual
        $productosIds = $productos->pluck('id')->toArray();

        // Usar el método existente para agregar productos (ya carga stock)
        $items = [];
        foreach ($productosIds as $productoId) {
            foreach ($almacenes as $almacen) {
                // Buscar stock existente
                $stocksExistentes = StockProducto::where('producto_id', $productoId)
                    ->where('almacen_id', $almacen->id)
                    ->get();

                if ($stocksExistentes->isEmpty()) {
                    $item = InventarioInicialBorradorItem::firstOrCreate(
                        [
                            'borrador_id' => $borradorId,
                            'producto_id' => $productoId,
                            'almacen_id'  => $almacen->id,
                        ],
                        [
                            'cantidad' => null,
                            'lote' => null,
                            'fecha_vencimiento' => null,
                            'precio_costo' => null,
                            'stock_producto_id' => null,
                        ]
                    );
                    $items[] = $item;
                } else {
                    foreach ($stocksExistentes as $stock) {
                        $item = InventarioInicialBorradorItem::firstOrCreate(
                            [
                                'borrador_id' => $borradorId,
                                'producto_id' => $productoId,
                                'almacen_id'  => $almacen->id,
                                'lote' => $stock->lote,
                            ],
                            [
                                'cantidad' => $stock->cantidad,
                                'fecha_vencimiento' => $stock->fecha_vencimiento,
                                'precio_costo' => $stock->precio_costo,
                                'stock_producto_id' => $stock->id,
                            ]
                        );
                        $items[] = $item;
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'productos' => $productos->items(),
            'current_page' => $productos->currentPage(),
            'last_page' => $productos->lastPage(),
            'per_page' => $productos->perPage(),
            'total' => $productos->total(),
            'itemsAdded' => count($items),
        ]);
    }

    /**
     * Buscar producto en el borrador por múltiples criterios
     * Busca por: id, nombre, sku, código de barras, marca, categoría (case insensitive)
     */
    public function searchProductoInDraft(Request $request, $borradorId)
    {
        $validated = $request->validate([
            'search' => 'required|string|min:1|max:255',
        ]);

        $borrador = InventarioInicialBorrador::findOrFail($borradorId);

        // Verificar autorización
        if ($borrador->usuario_id !== Auth::id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $search = trim($validated['search']);
        $searchLower = strtolower($search);

        // Buscar en los items del borrador con relaciones
        $item = InventarioInicialBorradorItem::with([
            'producto' => function ($query) {
                $query->with(['categoria:id,nombre', 'marca:id,nombre', 'unidad:id,nombre']);
            },
            'almacen:id,nombre'
        ])
            ->where('borrador_id', $borradorId)
            ->whereHas('producto', function ($query) use ($searchLower, $search) {
                // Búsqueda case insensitive por múltiples criterios
                $query->where(function ($q) use ($searchLower, $search) {
                    // Búsqueda exacta por ID (si es número)
                    if (is_numeric($search)) {
                        $q->orWhere('id', (int)$search);
                    }

                    // Búsqueda case insensitive en nombre
                    $q->orWhereRaw('LOWER(nombre) LIKE ?', ["%{$searchLower}%"])
                      // Búsqueda case insensitive en SKU
                      ->orWhereRaw('LOWER(sku) LIKE ?', ["%{$searchLower}%"])
                      // Búsqueda case insensitive en código de barras
                      ->orWhereRaw('LOWER(codigo_barras) LIKE ?', ["%{$searchLower}%"])
                      // Búsqueda en marca (relacional)
                      ->orWhereHas('marca', function ($q) use ($searchLower) {
                          $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$searchLower}%"]);
                      })
                      // Búsqueda en categoría (relacional)
                      ->orWhereHas('categoria', function ($q) use ($searchLower) {
                          $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$searchLower}%"]);
                      });
                });
            })
            ->first();

        if ($item) {
            return response()->json([
                'success' => true,
                'found' => true,
                'producto' => [
                    'id' => $item->producto->id,
                    'nombre' => $item->producto->nombre,
                    'sku' => $item->producto->sku,
                    'codigo_barras' => $item->producto->codigo_barras,
                    'categoria' => $item->producto->categoria?->nombre,
                    'marca' => $item->producto->marca?->nombre,
                ],
                'item' => [
                    'cantidad' => $item->cantidad,
                    'lote' => $item->lote,
                    'fecha_vencimiento' => $item->fecha_vencimiento,
                    'almacen' => $item->almacen?->nombre,
                ],
                'message' => "Producto ya registrado en borrador"
            ]);
        }

        return response()->json([
            'success' => true,
            'found' => false,
            'message' => 'Producto no encontrado en borrador'
        ]);
    }

    /**
     * Verificar si un producto ya tiene inventario inicial cargado
     */
    private function tieneInventarioInicial(int $productoId): bool
    {
        $tipoInventarioInicial = TipoAjusteInventario::where('clave', 'INVENTARIO_INICIAL')->first();

        if (! $tipoInventarioInicial) {
            return false;
        }

        return MovimientoInventario::whereHas('stockProducto', function ($query) use ($productoId) {
            $query->where('producto_id', $productoId);
        })
            ->where('tipo', 'ENTRADA_AJUSTE')
            ->where('tipo_ajuste_inventario_id', $tipoInventarioInicial->id)
            ->exists();
    }
}
