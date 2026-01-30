<?php
namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreProductoRequest;
use App\Http\Requests\UpdateProductoRequest;
use App\Models\Almacen;
use App\Models\CargoCSVProducto;
use App\Models\Categoria;
use App\Models\CodigoBarra;
use App\Models\Empresa;
use App\Models\ImagenProducto;
use App\Models\Marca;
use App\Models\MovimientoInventario;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\StockProducto;
use App\Models\TipoAjusteInventario;
use App\Models\TipoPrecio;
use App\Models\UnidadMedida;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductoController extends Controller
{
    // ✅ Cache del tipo de precio de venta para evitar múltiples queries
    private static $tipoPrecioVentaCache = null;

    /**
     * Obtiene el ID del tipo de precio de venta buscando por código 'VENTA'
     * Se cachea para evitar N+1 queries
     */
    private function getTipoPrecioVentaId(): int
    {
        if (self::$tipoPrecioVentaCache === null) {
            $tipoPrecio = TipoPrecio::where('codigo', 'VENTA')->first();
            if (!$tipoPrecio) {
                Log::error('❌ Tipo de precio VENTA no encontrado en la BD');
                throw new \Exception('Tipo de precio VENTA no encontrado en la base de datos');
            }
            self::$tipoPrecioVentaCache = $tipoPrecio->id;
        }
        return self::$tipoPrecioVentaCache;
    }

    public function historialPrecios(Producto $producto): JsonResponse
    {
        $producto->load(['precios' => function ($q) {
            $q->where('activo', true)->with(['tipoPrecio', 'historialPrecios' => function ($h) {
                $h->orderByDesc('fecha_cambio');
            }]);
        }]);
        $historial = [];
        foreach ($producto->precios as $precio) {
            foreach ($precio->historialPrecios as $h) {
                $historial[] = [
                    'id'                 => $h->id,
                    'tipo_precio_id'     => $precio->tipo_precio_id,
                    'tipo_precio_nombre' => $precio->tipoPrecio?->nombre,
                    'valor_anterior'     => $h->valor_anterior,
                    'valor_nuevo'        => $h->valor_nuevo,
                    'fecha_cambio'       => $h->fecha_cambio?->format('Y-m-d H:i'),
                    'motivo'             => $h->motivo,
                    'usuario'            => $h->usuario,
                    'porcentaje_cambio'  => $h->porcentaje_cambio,
                ];
            }
        }

        return ApiResponse::success($historial);
    }

    public function index(Request $request): Response
    {
        $q           = (string) $request->string('q');
        $categoriaId = $request->integer('categoria_id');
        $marcaId     = $request->integer('marca_id');
        $proveedorId = $request->integer('proveedor_id');
        $sinPrecio   = $request->boolean('sin_precio');
        $orderBy     = $request->string('order_by')->toString();
        $orderDir    = strtolower($request->string('order_dir')->toString()) === 'asc' ? 'asc' : 'desc';

        $allowedOrder   = ['id' => 'productos.id', 'nombre' => 'productos.nombre', 'precio_base' => 'precio_base', 'fecha_creacion' => 'productos.fecha_creacion', 'stock_total' => 'stock_total_calc'];
        $orderColumnRaw = $allowedOrder[$orderBy] ?? 'productos.id';

        $userEmpresaId = auth()->user()?->empresa_id;
        $items = Producto::query()
            // ✨ NUEVO: Filtrar por empresa del usuario (si tiene empresa_id asignada)
            // Si es admin sin empresa_id, mostrar todos los productos
            ->when($userEmpresaId, fn($q) => $q->where('productos.empresa_id', $userEmpresaId))
            ->with([
                'categoria:id,nombre',
                'marca:id,nombre',
                'proveedor:id,nombre,razon_social',
                'unidad:id,codigo,nombre',
                // Cargar todas las imágenes para poder mostrar galería en modal rápido
                'imagenes:id,producto_id,url,es_principal,orden',
                // Cargar todos los precios activos (no sólo el base) para modal rápido
                'precios'      => function ($q) {
                    $q->where('activo', true)
                        ->select('id', 'producto_id', 'nombre', 'precio', 'es_precio_base', 'tipo_precio_id', 'activo');
                },
                // Códigos de barra activos para modal rápido
                'codigosBarra' => function ($q) {
                    $q->where('activo', true)
                        ->orderByDesc('es_principal')
                        ->select('id', 'producto_id', 'codigo', 'tipo', 'es_principal', 'activo');
                },
                'stock:producto_id,cantidad,cantidad_disponible',
            ])
            ->when($q, function ($qq) use ($q) {
                // Convertir búsqueda a minúsculas para hacer búsqueda case-insensitive
                $searchLower = strtolower($q);
                $qq->where(function ($sub) use ($searchLower) {
                    $sub->whereRaw('LOWER(productos.nombre) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(productos.sku) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(productos.descripcion) like ?', ["%$searchLower%"])
                        ->orWhereHas('codigosBarra', function ($q) use ($searchLower) {
                            $q->whereRaw('LOWER(codigo) like ?', ["%$searchLower%"]);
                        })
                        ->orWhereHas('proveedor', function ($q) use ($searchLower) {
                            $q->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
                        });
                });
            })
            ->when($categoriaId, fn($qq) => $qq->where('productos.categoria_id', $categoriaId))
            ->when($marcaId, fn($qq) => $qq->where('productos.marca_id', $marcaId))
            ->when($proveedorId, fn($qq) => $qq->where('productos.proveedor_id', $proveedorId))
            ->when($sinPrecio, function ($qq) {
                $qq->whereDoesntHave('precios', function ($precioQuery) {
                    $precioQuery->where('activo', true)
                        ->where('precio', '>', 0);
                });
            })
            ->select('productos.*')
            ->leftJoinSub(
                'select producto_id, sum(cantidad) as stock_total_calc, sum(cantidad_disponible) as stock_disponible_calc from stock_productos where deleted_at is null group by producto_id',
                'stock_totales',
                'stock_totales.producto_id',
                '=',
                'productos.id'
            )
            ->addSelect(
                DB::raw('coalesce(stock_totales.stock_total_calc,0) as stock_total_calc'),
                DB::raw('coalesce(stock_totales.stock_disponible_calc,0) as stock_disponible_calc')
            )
            ->orderBy($orderColumnRaw === 'precio_base' ? DB::raw('(select precio from precios_producto p where p.producto_id = productos.id and p.activo = true and p.es_precio_base = true limit 1)') : $orderColumnRaw, $orderDir)
            ->paginate(12)
            ->through(function ($producto) {
                // Perfil y galería
                $perfil  = $producto->imagenes->firstWhere('es_principal', true) ?: $producto->imagenes->first();
                $galeria = $producto->imagenes->where('id', '!=', optional($perfil)->id)->values()->map(fn($img) => ['id' => $img->id, 'url' => $img->url])->toArray();

                // Precios activos completos para modal rápido
                $preciosActivos = $producto->precios->map(function ($p) {
                    return [
                        'id'             => $p->id,
                        'nombre'         => $p->nombre,
                        'monto'          => (float) $p->precio,
                        'tipo_precio_id' => $p->tipo_precio_id,
                        'es_precio_base' => (bool) $p->es_precio_base,
                    ];
                })->values();
                $precioBase = optional($producto->precios->firstWhere('es_precio_base', true))->precio;

                // Códigos de barra - enviar relación completa
                $codigosBarra = $producto->codigosBarra->map(function ($cb) {
                    return [
                        'id'          => $cb->id,
                        'codigo'      => $cb->codigo,
                        'tipo'        => $cb->tipo,
                        'es_principal' => (bool) $cb->es_principal,
                        'activo'      => (bool) $cb->activo,
                    ];
                })->values();

                $stockTotal      = (int) ($producto->stock_total_calc ?? $producto->stock?->sum('cantidad') ?? 0);
                $stockDisponible = (int) ($producto->stock_disponible_calc ?? 0);

                return [
                    'id'                    => $producto->id,
                    'nombre'                => $producto->nombre,
                    'sku'                   => $producto->sku,
                    'descripcion'           => $producto->descripcion,
                    'peso'                  => $producto->peso,
                    'unidad_medida_id'      => $producto->unidad_medida_id,
                    'codigo_barras'         => $producto->codigo_barras,
                    'codigo_qr'             => $producto->codigo_qr,
                    'stock_minimo'          => $producto->stock_minimo,
                    'stock_maximo'          => $producto->stock_maximo,
                    'stock_total'           => $stockTotal,
                    'stock_disponible_calc' => $stockDisponible,
                    'activo'                => $producto->activo,
                    'fecha_creacion'        => $producto->fecha_creacion,
                    'es_alquilable'         => $producto->es_alquilable,
                    'categoria_id'          => $producto->categoria_id,
                    'marca_id'              => $producto->marca_id,
                    'proveedor_id'          => $producto->proveedor_id,
                    'categoria'             => $producto->categoria,
                    'marca'                 => $producto->marca,
                    'proveedor'             => $producto->proveedor,
                    'unidad'                => $producto->unidad,
                    'perfil'                => $perfil ? ['id' => $perfil->id, 'url' => $perfil->url] : null,
                    'galeria'               => $galeria,
                    'precios'               => $preciosActivos,
                    'codigos'               => $codigosBarra, // Array completo de códigos de barra con metadata
                    'codigosBarra'          => $codigosBarra, // Para compatibilidad
                    'historial_precios'     => [],             // se puede cargar diferido si se requiere
                    'precio_base'           => $precioBase,
                ];
            })
            ->withQueryString();

        $categorias  = Categoria::query()->orderBy('nombre')->get(['id', 'nombre']);
        $marcas      = Marca::query()->orderBy('nombre')->get(['id', 'nombre']);
        $proveedores = \App\Models\Proveedor::query()->orderBy('nombre')->get(['id', 'nombre', 'razon_social']);

        return Inertia::render('productos/index', [
            'productos'    => $items,
            'filters'      => [
                'q'            => $q,
                'categoria_id' => $categoriaId ?: null,
                'marca_id'     => $marcaId ?: null,
                'proveedor_id' => $request->integer('proveedor_id') ?: null,
                'sin_precio'   => $sinPrecio ?: null,
                'order_by'     => $orderBy ?: null,
                'order_dir'    => $orderDir,
            ],
            'categorias'   => $categorias,
            'marcas'       => $marcas,
            'proveedores'  => $proveedores,
            'unidades'     => UnidadMedida::orderBy('nombre')->get(['id', 'codigo', 'nombre']),
            'tipos_precio' => TipoPrecio::getOptions(),
        ]);
    }

    public function create(): Response
    {
        $empresa = auth()->user()?->empresa;

        return Inertia::render('productos/form', [
            'producto'                      => null,
            'categorias'                    => Categoria::orderBy('nombre')->get(['id', 'nombre']),
            'marcas'                        => Marca::orderBy('nombre')->get(['id', 'nombre']),
            'proveedores'                   => \App\Models\Proveedor::orderBy('nombre')->get(['id', 'nombre', 'razon_social']),
            'unidades'                      => UnidadMedida::orderBy('nombre')->get(['id', 'codigo', 'nombre']),
            'tipos_precio'                  => TipoPrecio::getOptions(),
            'configuraciones_ganancias'     => \App\Models\ConfiguracionGlobal::configuracionesGanancias(),
            'almacenes'                     => Almacen::orderBy('nombre')->get(['id', 'nombre']),
            'permite_productos_fraccionados' => $empresa?->permite_productos_fraccionados ?? false, // ✨ NUEVO
            'es_farmacia'                   => $empresa?->es_farmacia ?? false, // ✨ NUEVO
        ]);
    }

    /**
     * Formulario moderno simplificado para crear productos
     */
    public function createModerno(): Response
    {
        return Inertia::render('productos/form-moderno', [
            'producto'                  => null,
            'categorias'                => Categoria::orderBy('nombre')->get(['id', 'nombre']),
            'marcas'                    => Marca::orderBy('nombre')->get(['id', 'nombre']),
            'unidades'                  => UnidadMedida::orderBy('nombre')->get(['id', 'codigo', 'nombre']),
            'tipos_precio'              => TipoPrecio::getOptions(),
            'configuraciones_ganancias' => \App\Models\ConfiguracionGlobal::configuracionesGanancias(),
        ]);
    }

    public function store(StoreProductoRequest $request): RedirectResponse
    {
        // Data already validated and prepared by StoreProductoRequest
        $data = $request->validated();

        $producto = null;

        DB::transaction(function () use ($data, $request, &$producto) {
            // Filtrar y limpiar códigos válidos de manera más robusta
            $codigosValidos = [];
            if (isset($data['codigos']) && is_array($data['codigos'])) {
                foreach ($data['codigos'] as $codigo) {
                    // Asegurarse de que el código sea un string y no esté vacío
                    if (is_string($codigo) && ! empty(trim($codigo))) {
                        $codigosValidos[] = trim($codigo);
                    }
                }
            }

            // Crear el producto
            $producto = Producto::create([
                'nombre'           => $data['nombre'],
                'descripcion'      => $data['descripcion'] ?? null,
                'peso'             => $data['peso'] ?? 0,
                'unidad_medida_id' => $data['unidad_medida_id'] ?? null,
                'codigo_barras'    => null,
                'codigo_qr'        => null,
                'stock_minimo'     => $data['stock_minimo'] ?? 0,
                'stock_maximo'     => $data['stock_maximo'] ?? 0,
                'activo'           => $data['activo'] ?? true,
                'es_alquilable'    => false,
                'categoria_id'     => $data['categoria_id'] ?? null,
                'marca_id'         => $data['marca_id'] ?? null,
                'proveedor_id'     => $data['proveedor_id'] ?? null,
                'empresa_id'       => auth()->user()?->empresa_id, // ✨ NUEVO: Asignar empresa del usuario autenticado
                'limite_venta'     => $data['limite_venta'] ?? null, // ✨ NUEVO
            ]);

            // Gestionar códigos de barra usando la nueva tabla
            if (! empty($codigosValidos)) {
                foreach ($codigosValidos as $index => $codigo) {
                    CodigoBarra::create([
                        'producto_id'  => $producto->id,
                        'codigo'       => trim($codigo),
                        'tipo'         => 'EAN',        // Por defecto EAN
                        'es_principal' => $index === 0, // El primero es principal
                        'activo'       => true,
                    ]);
                }
                // Actualizar el campo legacy con el código principal
                $codigoPrincipal = $codigosValidos[0];
                $producto->update([
                    'codigo_barras' => $codigoPrincipal,
                    'codigo_qr'     => $codigoPrincipal, // Mismo valor para código QR
                ]);
            } else {
                // Si no hay códigos, crear uno con el ID del producto
                $codigoGenerado = (string) $producto->id;
                CodigoBarra::create([
                    'producto_id'  => $producto->id,
                    'codigo'       => $codigoGenerado,
                    'tipo'         => 'INTERNAL',
                    'es_principal' => true,
                    'activo'       => true,
                ]);
                // Actualizar el campo legacy
                $producto->update([
                    'codigo_barras' => $codigoGenerado,
                    'codigo_qr'     => $codigoGenerado, // Mismo valor para código QR
                ]);
            }

            // Precios mejorados usando la nueva tabla de tipos de precio
            if (! empty($data['precios']) && is_array($data['precios'])) {
                // Obtener monto del precio base (costo) del payload para calcular márgenes
                $montoBase = 0.0;
                foreach ($data['precios'] as $pp) {
                    $tpIdTmp = $pp['tipo_precio_id'] ?? $this->determinarTipoPrecioId($pp['nombre'] ?? '');
                    $tpTmp   = TipoPrecio::find($tpIdTmp);
                    if ($tpTmp && $tpTmp->es_precio_base) {
                        $montoBase = (float) ($pp['monto'] ?? 0);
                        break;
                    }
                }

                foreach ($data['precios'] as $p) {
                    // Validar que tenga monto válido
                    if (empty($p['monto']) || ! is_numeric($p['monto'])) {
                        continue;
                    }

                    // Determinar tipo de precio ID
                    $tipoPrecioId = $p['tipo_precio_id'] ?? null;
                    $tipoPrecio   = TipoPrecio::find($tipoPrecioId);

                    if (! $tipoPrecio) {
                        continue; // Si no existe el tipo de precio, saltarlo
                    }

                    // ✅ IMPORTANTE: Validar que no exista un precio activo para ESTA COMBINACIÓN
                    // producto_id + tipo_precio_id + unidad_medida_id (NULL para base)
                    $precioExistente = PrecioProducto::where('producto_id', $producto->id)
                        ->where('tipo_precio_id', $tipoPrecioId)
                        ->where('unidad_medida_id', $p['unidad_medida_id'] ?? null)
                        ->where('activo', true)
                        ->first();

                    if ($precioExistente) {
                        // Si existe, actualizar el existente en lugar de crear uno nuevo
                        $monto      = (float) $p['monto'];
                        $esBase     = (bool) $tipoPrecio->es_precio_base;
                        $margen     = $esBase ? 0.0 : max(0.0, $monto - $montoBase);
                        $porcentaje = ($esBase || $montoBase <= 0) ? 0.0 : (($monto - $montoBase) / max($montoBase, 1)) * 100;
                        $nombre     = $p['nombre'] ?? $tipoPrecio->nombre;

                        $precioExistente->update([
                            'nombre'                     => $nombre,
                            'precio'                     => $monto,
                            'unidad_medida_id'           => $p['unidad_medida_id'] ?? null,
                            'es_precio_base'             => $esBase,
                            'margen_ganancia'            => $margen,
                            'porcentaje_ganancia'        => $porcentaje,
                            'fecha_ultima_actualizacion' => now(),
                        ]);
                        continue;
                    }

                    $monto      = (float) $p['monto'];
                    $esBase     = (bool) $tipoPrecio->es_precio_base;
                    $margen     = $esBase ? 0.0 : max(0.0, $monto - $montoBase);
                    $porcentaje = ($esBase || $montoBase <= 0) ? 0.0 : (($monto - $montoBase) / max($montoBase, 1)) * 100;

                    // Generar nombre automáticamente basado en el tipo de precio
                    $nombre = $p['nombre'] ?? $tipoPrecio->nombre;

                    PrecioProducto::create([
                        'producto_id'                => $producto->id,
                        'nombre'                     => $nombre,
                        'precio'                     => $monto,
                        'tipo_precio_id'             => $tipoPrecioId,
                        'unidad_medida_id'           => $p['unidad_medida_id'] ?? null,
                        'es_precio_base'             => $esBase,
                        'margen_ganancia'            => $margen,
                        'porcentaje_ganancia'        => $porcentaje,
                        'activo'                     => true,
                        'fecha_ultima_actualizacion' => now(),
                    ]);
                }
            }

            // 4. Guardar conversiones de unidad (si es fraccionado)
            if ($data['es_fraccionado'] ?? false) {
                $conversiones = $data['conversiones'] ?? [];

                foreach ($conversiones as $conv) {
                    \App\Models\ConversionUnidadProducto::create([
                        'producto_id'             => $producto->id,
                        'unidad_base_id'          => $conv['unidad_base_id'],
                        'unidad_destino_id'       => $conv['unidad_destino_id'],
                        'factor_conversion'       => $conv['factor_conversion'],
                        'activo'                  => $conv['activo'] ?? true,
                        'es_conversion_principal' => $conv['es_conversion_principal'] ?? false,
                    ]);
                }

                Log::info('Conversiones de unidad guardadas', [
                    'producto_id' => $producto->id,
                    'cantidad'    => count($conversiones),
                ]);

                // Actualizar es_fraccionado en el producto
                $producto->update(['es_fraccionado' => true]);
            }

            // imágenes: perfil + galería
            $orden = 0;
            if ($request->hasFile('perfil')) {
                $file = $request->file('perfil');
                $path = $file->store('productos', 'public');
                ImagenProducto::create([
                    'producto_id'  => $producto->id,
                    'url'          => Storage::disk('public')->url($path),
                    'es_principal' => true,
                    'orden'        => $orden++,
                ]);
            }
            if ($request->hasFile('galeria')) {
                foreach ($request->file('galeria') as $file) {
                    $path = $file->store('productos', 'public');
                    ImagenProducto::create([
                        'producto_id'  => $producto->id,
                        'url'          => Storage::disk('public')->url($path),
                        'es_principal' => false,
                        'orden'        => $orden++,
                    ]);
                }
            }
        });

        return redirect()->route('productos.index')->with('success', 'Producto creado correctamente');
    }

    public function edit(Producto $producto): Response
    {
        // ✨ NUEVO: Verificar que el producto pertenece a la empresa del usuario autenticado
        $userEmpresaId = auth()->user()?->empresa_id;
        // Si el usuario no tiene empresa_id (ej: admin global) o coincide, permitir acceso
        if ($userEmpresaId && $producto->empresa_id !== $userEmpresaId) {
            abort(403, 'No tienes permiso para editar este producto');
        }

        $producto->load([
            'imagenes'     => function ($q) {
                $q->orderBy('orden');
            },
            'codigosBarra' => function ($q) {
                $q->where('activo', true)->orderBy('es_principal', 'desc');
            },
            'proveedor:id,nombre,razon_social',
        ]);

        // Adapt payload for frontend form structure
        $perfil  = $producto->imagenes->firstWhere('es_principal', true);
        $galeria = $producto->imagenes->where('es_principal', false)->values()->map(function ($img) {
            return ['id' => $img->id, 'url' => $img->url];
        });

        // Obtener todos los códigos de barra activos para el frontend
        $codigos = $producto->codigosBarra->map(function ($cb) {
            return [
                'codigo' => $cb->codigo,
                'es_principal' => (bool) $cb->es_principal,
                'tipo' => $cb->tipo,
            ];
        })->values()->toArray();

        // Si no hay códigos, incluir uno vacío para poder agregar
        if (empty($codigos)) {
            $codigos = [['codigo' => '']];
        }

        // Obtener precios en formato simple que espera el frontend
        $precios = $producto->precios()
            ->where('activo', true)
            ->with('tipoPrecio')
            ->get()
            ->sortBy(function ($precio) {
                return $precio->tipoPrecio ? $precio->tipoPrecio->orden : 999;
            })
            ->map(function ($pr) {
                return [
                    'id'             => $pr->id,
                    'monto'          => (float) $pr->precio,
                    'tipo_precio_id' => (int) $pr->tipo_precio_id,
                    'unidad_medida_id' => $pr->unidad_medida_id,
                ];
            })
            ->values()
            // ✅ Ordenar secundariamente por unidad_medida_id (NULL primero = precio base)
            ->sort(function ($a, $b) {
                // Si tienen diferente tipo_precio_id, mantener el orden anterior
                if ($a['tipo_precio_id'] !== $b['tipo_precio_id']) {
                    return $a['tipo_precio_id'] <=> $b['tipo_precio_id'];
                }

                // Mismo tipo_precio_id: ordenar por unidad_medida_id
                // NULL (base) primero (-1), luego los números en orden ascendente
                $aUnidad = $a['unidad_medida_id'] ?? -1;
                $bUnidad = $b['unidad_medida_id'] ?? -1;

                return $aUnidad <=> $bUnidad;
            })
            ->values();

        // Obtener historial de precios agrupado por tipo de precio
        $historialPrecios = [];
        $preciosActivos   = $producto->precios()->with(['tipoPrecio', 'historialPrecios' => function ($q) {
            $q->orderByDesc('fecha_cambio');
        }])->where('activo', true)->get();
        foreach ($preciosActivos as $precio) {
            $historialPrecios[] = [
                'tipo_precio_id'     => $precio->tipo_precio_id,
                'tipo_precio_nombre' => $precio->tipoPrecio?->nombre,
                'historial'          => $precio->historialPrecios->map(function ($h) {
                    return [
                        'id'                => $h->id,
                        'valor_anterior'    => $h->valor_anterior,
                        'valor_nuevo'       => $h->valor_nuevo,
                        'fecha_cambio'      => $h->fecha_cambio?->format('Y-m-d H:i'),
                        'motivo'            => $h->motivo,
                        'usuario'           => $h->usuario,
                        'porcentaje_cambio' => $h->porcentaje_cambio,
                    ];
                })->toArray()];
        }

        $payload = [
            'id'                => $producto->id,
            'nombre'            => $producto->nombre,
            'descripcion'       => $producto->descripcion,
            'sku'               => $producto->sku ?? null,
            'numero'            => null,
            'categoria_id'      => (int) $producto->categoria_id,
            'marca_id'          => (int) $producto->marca_id,
            'proveedor_id'      => $producto->proveedor_id ? (int) $producto->proveedor_id : null,
            'proveedor'         => $producto->proveedor ? [
                'id'           => $producto->proveedor->id,
                'nombre'       => $producto->proveedor->nombre,
                'razon_social' => $producto->proveedor->razon_social,
            ] : null,
            'peso'              => $producto->peso ? (float) $producto->peso : null,
            'unidad_medida_id'  => $producto->unidad_medida_id ? (int) $producto->unidad_medida_id : null,
            'fecha_vencimiento' => null,
            'activo'            => (bool) $producto->activo,
            'stock_minimo'      => $producto->stock_minimo ? (int) $producto->stock_minimo : null,
            'stock_maximo'      => $producto->stock_maximo ? (int) $producto->stock_maximo : null,
            'limite_venta'      => $producto->limite_venta ? (int) $producto->limite_venta : null, // ✨ NUEVO
            'perfil'            => $perfil ? ['id' => $perfil->id, 'url' => $perfil->url] : null,
            'galeria'           => $galeria,
            'precios'           => $precios,
            'codigos'           => $codigos, // Array de códigos de barra con metadata
            // mapear stock por almacén para el frontend
            'almacenes'         => StockProducto::where('producto_id', $producto->id)
                ->get(['almacen_id', 'cantidad as stock', 'lote', 'fecha_vencimiento'])
                ->map(function ($s) {
                    return ['almacen_id' => $s->almacen_id, 'stock' => $s->stock, 'lote' => $s->lote, 'fecha_vencimiento' => $s->fecha_vencimiento ? $s->fecha_vencimiento->format('Y-m-d') : null];
                })->toArray(),
            'historial_precios' => $historialPrecios,
        ];

        // Cargar conversiones de unidad
        $payload['conversiones'] = $producto->conversiones()
            ->with(['unidadBase:id,nombre,codigo', 'unidadDestino:id,nombre,codigo'])
            ->get()
            ->map(function ($conv) {
                return [
                    'id'                      => $conv->id,
                    'unidad_base_id'          => $conv->unidad_base_id,
                    'unidad_destino_id'       => $conv->unidad_destino_id,
                    'factor_conversion'       => (float) $conv->factor_conversion,
                    'activo'                  => (bool) $conv->activo,
                    'es_conversion_principal' => (bool) $conv->es_conversion_principal,
                    'unidad_base'             => $conv->unidadBase ? [
                        'id'     => $conv->unidadBase->id,
                        'nombre' => $conv->unidadBase->nombre,
                        'codigo' => $conv->unidadBase->codigo,
                    ] : null,
                    'unidad_destino'          => $conv->unidadDestino ? [
                        'id'     => $conv->unidadDestino->id,
                        'nombre' => $conv->unidadDestino->nombre,
                        'codigo' => $conv->unidadDestino->codigo,
                    ] : null,
                ];
            })->toArray();

        $payload['es_fraccionado'] = (bool) $producto->es_fraccionado;

        $empresa = auth()->user()?->empresa;

        return Inertia::render('productos/form', [
            'producto'                      => $payload,
            'categorias'                    => Categoria::orderBy('nombre')->get(['id', 'nombre']),
            'marcas'                        => Marca::orderBy('nombre')->get(['id', 'nombre']),
            'proveedores'                   => \App\Models\Proveedor::orderBy('nombre')->get(['id', 'nombre', 'razon_social']),
            'unidades'                      => UnidadMedida::orderBy('nombre')->get(['id', 'codigo', 'nombre']),
            'tipos_precio'                  => TipoPrecio::getOptions(),
            'configuraciones_ganancias'     => \App\Models\ConfiguracionGlobal::configuracionesGanancias(),
            'almacenes'                     => Almacen::orderBy('nombre')->get(['id', 'nombre']),
            'permite_productos_fraccionados' => $empresa?->permite_productos_fraccionados ?? false, // ✨ NUEVO
            'es_farmacia'                   => $empresa?->es_farmacia ?? false, // ✨ NUEVO
        ]);
    }

    public function update(UpdateProductoRequest $request, Producto $producto): RedirectResponse
    {
        // ✨ NUEVO: Verificar que el producto pertenece a la empresa del usuario autenticado
        $userEmpresaId = auth()->user()?->empresa_id;
        // Si el usuario no tiene empresa_id (ej: admin global) o coincide, permitir acceso
        if ($userEmpresaId && $producto->empresa_id !== $userEmpresaId) {
            abort(403, 'No tienes permiso para editar este producto');
        }

        // Data already validated and prepared by UpdateProductoRequest
        $data = $request->validated();

        DB::transaction(function () use ($data, $request, $producto) {
            $producto->update([
                'nombre'           => $data['nombre'],
                'sku'              => $data['sku'] ?? $producto->sku,
                'descripcion'      => $data['descripcion'] ?? $producto->descripcion,
                'peso'             => $data['peso'] ?? $producto->peso,
                'unidad_medida_id' => $data['unidad_medida_id'] ?? $producto->unidad_medida_id,
                'categoria_id'     => $data['categoria_id'] ?? $producto->categoria_id,
                'marca_id'         => $data['marca_id'] ?? $producto->marca_id,
                'proveedor_id'     => $data['proveedor_id'] ?? $producto->proveedor_id,
                'stock_minimo'     => $data['stock_minimo'] ?? $producto->stock_minimo,
                'stock_maximo'     => $data['stock_maximo'] ?? $producto->stock_maximo,
                'limite_venta'     => $data['limite_venta'] ?? $producto->limite_venta, // ✨ NUEVO
                'activo'           => $data['activo'] ?? $producto->activo,
            ]);

            // Codigos sólo si vienen
            if ($request->has('codigos')) {
                $producto->codigosBarra()->update(['activo' => false]);
                $codigosValidos = [];
                if (! empty($data['codigos']) && is_array($data['codigos'])) {
                    $codigosValidos = array_values(array_filter(array_map(fn($c) => is_string($c) ? trim($c) : '', $data['codigos']), fn($c) => $c !== ''));
                }
                if (! empty($codigosValidos)) {
                    foreach ($codigosValidos as $index => $codigo) {
                        $existente = $producto->codigosBarra()->whereRaw('LOWER(codigo) = ?', [strtolower($codigo)])->first();
                        if ($existente) {
                            $existente->update(['es_principal' => $index === 0, 'activo' => true]);
                        } else {
                            CodigoBarra::create([
                                'producto_id'  => $producto->id,
                                'codigo'       => $codigo,
                                'tipo'         => 'EAN',
                                'es_principal' => $index === 0,
                                'activo'       => true,
                            ]);
                        }
                    }
                    $principal = $codigosValidos[0];
                    $producto->update(['codigo_barras' => $principal, 'codigo_qr' => $principal]);
                }
            }

            // Precios s��lo si vienen
            if ($request->has('precios')) {
                $producto->precios()->update(['activo' => false]);
                if (! empty($data['precios']) && is_array($data['precios'])) {
                    $montoBase = 0.0;
                    foreach ($data['precios'] as $pp) {
                        $tpIdTmp = $pp['tipo_precio_id'] ?? $this->determinarTipoPrecioId($pp['nombre'] ?? '');
                        $tpTmp   = TipoPrecio::find($tpIdTmp);
                        if ($tpTmp && $tpTmp->es_precio_base) {
                            $montoBase = (float) ($pp['monto'] ?? 0);
                            break;
                        }
                    }
                    foreach ($data['precios'] as $precioData) {
                        // Validar que tenga monto válido
                        if (empty($precioData['monto']) || ! is_numeric($precioData['monto'])) {
                            continue;
                        }

                        $tipoPrecioId = $precioData['tipo_precio_id'] ?? null;
                        $tipoPrecio   = TipoPrecio::find($tipoPrecioId);

                        if (! $tipoPrecio) {
                            continue; // Si no existe el tipo de precio, saltarlo
                        }

                        // ✅ IMPORTANTE: Validar que no exista un precio activo para ESTA COMBINACIÓN
                        // producto_id + tipo_precio_id + unidad_medida_id (NULL para base)
                        $precioExistente = PrecioProducto::where('producto_id', $producto->id)
                            ->where('tipo_precio_id', $tipoPrecioId)
                            ->where('unidad_medida_id', $precioData['unidad_medida_id'] ?? null)
                            ->where('activo', false) // Buscamos el que ya desactivamos arriba
                            ->first();

                        if ($precioExistente) {
                            // Si existe, reactivarlo y actualizar
                            $monto      = (float) $precioData['monto'];
                            $esBase     = (bool) $tipoPrecio->es_precio_base;
                            $margen     = $esBase ? 0.0 : max(0.0, $monto - $montoBase);
                            $porcentaje = ($esBase || $montoBase <= 0) ? 0.0 : (($monto - $montoBase) / max($montoBase, 1)) * 100;
                            $nombre     = $precioData['nombre'] ?? $tipoPrecio->nombre;

                            $precioExistente->update([
                                'nombre'                     => $nombre,
                                'precio'                     => $monto,
                                'unidad_medida_id'           => $precioData['unidad_medida_id'] ?? null,
                                'es_precio_base'             => $esBase,
                                'margen_ganancia'            => $margen,
                                'porcentaje_ganancia'        => $porcentaje,
                                'activo'                     => true,
                                'fecha_ultima_actualizacion' => now(),
                            ]);
                            continue;
                        }

                        $monto      = (float) $precioData['monto'];
                        $esBase     = (bool) $tipoPrecio->es_precio_base;
                        $margen     = $esBase ? 0.0 : max(0.0, $monto - $montoBase);
                        $porcentaje = ($esBase || $montoBase <= 0) ? 0.0 : (($monto - $montoBase) / max($montoBase, 1)) * 100;

                        // Generar nombre automáticamente basado en el tipo de precio
                        $nombre = $precioData['nombre'] ?? $tipoPrecio->nombre;

                        PrecioProducto::create([
                            'producto_id'                => $producto->id,
                            'nombre'                     => $nombre,
                            'precio'                     => $monto,
                            'tipo_precio_id'             => $tipoPrecioId,
                            'unidad_medida_id'           => $precioData['unidad_medida_id'] ?? null,
                            'es_precio_base'             => $esBase,
                            'margen_ganancia'            => $margen,
                            'porcentaje_ganancia'        => $porcentaje,
                            'activo'                     => true,
                            'fecha_ultima_actualizacion' => now(),
                        ]);
                    }
                }
            }

            // 4. Actualizar conversiones de unidad (si es fraccionado)
            if ($data['es_fraccionado'] ?? false) {
                // Eliminar conversiones actuales
                $producto->conversiones()->delete();

                // Crear nuevas conversiones
                $conversiones = $data['conversiones'] ?? [];
                foreach ($conversiones as $conv) {
                    \App\Models\ConversionUnidadProducto::create([
                        'producto_id'             => $producto->id,
                        'unidad_base_id'          => $conv['unidad_base_id'],
                        'unidad_destino_id'       => $conv['unidad_destino_id'],
                        'factor_conversion'       => $conv['factor_conversion'],
                        'activo'                  => $conv['activo'] ?? true,
                        'es_conversion_principal' => $conv['es_conversion_principal'] ?? false,
                    ]);
                }

                // Actualizar es_fraccionado en el producto
                $producto->update(['es_fraccionado' => true]);

                Log::info('Conversiones de unidad actualizadas', [
                    'producto_id' => $producto->id,
                ]);
            } else {
                // Si ya no es fraccionado, eliminar conversiones existentes
                $producto->conversiones()->delete();
                $producto->update(['es_fraccionado' => false]);
            }

            // Eliminar imágenes de galería marcadas
            $galeriaEliminar = $request->input('galeria_eliminar', []);
            if (is_array($galeriaEliminar) && ! empty($galeriaEliminar)) {
                $imagenes = ImagenProducto::whereIn('id', $galeriaEliminar)->where('producto_id', $producto->id)->get();
                foreach ($imagenes as $img) {
                    $path = str_replace(Storage::disk('public')->url('/'), '', $img->url);
                    if ($path) {
                        Storage::disk('public')->delete($path);
                    }
                    $img->delete();
                }
            }

            // Quitar perfil si se solicitó
            if ($request->boolean('remove_perfil')) {
                $perfilActual = $producto->imagenes()->where('es_principal', true)->first();
                if ($perfilActual) {
                    $path = str_replace(Storage::disk('public')->url('/'), '', $perfilActual->url);
                    if ($path) {
                        Storage::disk('public')->delete($path);
                    }
                    $perfilActual->delete();
                }
            }

            // Reemplazar perfil si viene nuevo
            if ($request->hasFile('perfil')) {
                ImagenProducto::where('producto_id', $producto->id)->update(['es_principal' => false]);
                $file = $request->file('perfil');
                $path = $file->store('productos', 'public');
                ImagenProducto::create([
                    'producto_id'  => $producto->id,
                    'url'          => Storage::disk('public')->url($path),
                    'es_principal' => true,
                    'orden'        => 0,
                ]);
            }
            // anexar nuevas galería
            if ($request->hasFile('galeria')) {
                $currentMaxOrden = (int) ($producto->imagenes()->max('orden') ?? -1);
                foreach ($request->file('galeria') as $idx => $file) {
                    $path = $file->store('productos', 'public');
                    ImagenProducto::create([
                        'producto_id'  => $producto->id,
                        'url'          => Storage::disk('public')->url($path),
                        'es_principal' => false,
                        'orden'        => $currentMaxOrden + 1 + $idx,
                    ]);
                }
            }
        });

        return redirect()->route('productos.edit', $producto->id)->with('success', 'Producto actualizado correctamente');
    }

    public function destroy(Producto $producto): RedirectResponse
    {
        // delete images files too
        foreach ($producto->imagenes as $img) {
            $path = str_replace(Storage::disk('public')->url('/'), '', $img->url);
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }
        $producto->imagenes()->delete();
        $producto->delete();

        return redirect()->route('productos.index')->with('success', 'Producto eliminado');
    }

    /**
     * Determinar el ID del tipo de precio basado en el nombre
     */
    private function determinarTipoPrecioId(string $nombre): int
    {
        $nombre = strtolower($nombre);

        if (str_contains($nombre, 'costo') || str_contains($nombre, 'compra')) {
            return TipoPrecio::porCodigo('COSTO')?->id ?? 1;
        }
        if (str_contains($nombre, 'mayor') || str_contains($nombre, 'mayorista')) {
            return TipoPrecio::porCodigo('POR_MAYOR')?->id ?? 3;
        }
        if (str_contains($nombre, 'distribuidor')) {
            return TipoPrecio::porCodigo('DISTRIBUIDOR')?->id ?? 5;
        }
        if (str_contains($nombre, 'promocional') || str_contains($nombre, 'promoción')) {
            return TipoPrecio::porCodigo('PROMOCIONAL')?->id ?? 6;
        }
        if (str_contains($nombre, 'facturado')) {
            return TipoPrecio::porCodigo('FACTURADO')?->id ?? 4;
        }

        // Por defecto, precio de venta
        return TipoPrecio::porCodigo('VENTA')?->id ?? 2;
    }

    // ================================
    // MÉTODOS API
    // ================================

    /**
     * API: Listar productos
     *
     * Parámetros query:
     * - per_page: Cantidad de registros por página (default: 20)
     * - q: Búsqueda por nombre, código de barras, SKU o descripción
     * - categoria_id: Filtrar por categoría
     * - marca_id: Filtrar por marca
     * - proveedor_id: Filtrar por proveedor
     * - activo: Filtrar por estado (default: true)
     *
     * ✅ NOTA IMPORTANTE DE SEGURIDAD:
     * El almacén se obtiene SIEMPRE de empresa.almacen_id del usuario autenticado.
     * Se IGNORA COMPLETAMENTE cualquier parámetro 'almacen_id' en el request para
     * evitar que usuarios accedan a productos de otros almacenes.
     *
     * Respuesta:
     * - productos: Array paginado de productos con sus precios
     * - total: Total de productos encontrados
     */
    public function indexApi(Request $request): JsonResponse
    {
        $user = auth()->user();

        Log::info('🔍 [indexApi] INICIO', [
            'user_id' => $user->id,
            'user_name' => $user->name,
        ]);

        // ✅ VALIDACIÓN 1: Verificar rol permitido
        // Solo Preventista, Cliente, Chofer y Super Admin pueden ver productos
        $rolesPermitidos = ['Preventista', 'preventista', 'cliente', 'Cliente', 'Chofer', 'chofer', 'Super Admin'];
        $userRoles = $user->getRoleNames()->toArray();
        Log::info('✅ [indexApi] VAL 1 - Roles del usuario', [
            'user_roles' => $userRoles,
            'roles_permitidos' => $rolesPermitidos,
        ]);

        if (!$user->hasAnyRole($rolesPermitidos)) {
            Log::warning('❌ [indexApi] Rol NO permitido', ['roles' => $userRoles]);
            return response()->json([
                'message' => 'No tienes permisos para ver productos. Solo Preventistas, Clientes y Choferes pueden listarlos.',
                'data' => []
            ], 403);
        }

        $perPage     = $request->integer('per_page', 20);
        $q           = $request->string('q');
        $categoriaId = $request->integer('categoria_id');
        $marcaId     = $request->integer('marca_id');
        $proveedorId = $request->integer('proveedor_id');
        $activo      = $request->boolean('activo', true);

        // ✅ VALIDACIÓN 2: Obtener empresa del usuario autenticado
        $empresa = $user->empresa;
        Log::info('✅ [indexApi] VAL 2 - Empresa', [
            'empresa_id' => $empresa?->id,
            'empresa_nombre' => $empresa?->nombre,
        ]);

        if (!$empresa) {
            Log::warning('❌ [indexApi] Usuario sin empresa');
            return response()->json([
                'message' => 'El usuario no tiene asociada una empresa',
                'data' => []
            ], 403);
        }

        // ✅ VALIDACIÓN 3: Obtener almacén de venta de la empresa del usuario autenticado
        // Se IGNORA COMPLETAMENTE cualquier parámetro 'almacen_id' en el request
        // El almacén se obtiene exclusivamente de: empresa->almacen_id
        $almacenId = $empresa->almacen_id;
        Log::info('✅ [indexApi] VAL 3 - Almacén', [
            'almacen_id' => $almacenId,
        ]);

        if (!$almacenId) {
            Log::warning('❌ [indexApi] Empresa sin almacén de venta');
            return response()->json([
                'message' => 'La empresa no tiene un almacén de venta asignado',
                'data' => []
            ], 403);
        }

        // Precargar el almacén para evitar N+1 queries
        $almacenPrincipal = Almacen::find($almacenId);

        // Convertir búsqueda a minúsculas para hacer búsqueda case-insensitive
        $searchLower = $q ? strtolower($q) : '';

        // 🔍 DEBUGGEO: Contar productos por etapas
        Log::info('📊 [indexApi] DEBUGGEO PRODUCTOS', [
            'total_en_bd' => Producto::count(),
            'por_empresa' => Producto::where('empresa_id', $empresa->id)->count(),
            'activos' => Producto::where('activo', true)->count(),
            'en_empresa_activos' => Producto::where('empresa_id', $empresa->id)->where('activo', true)->count(),
        ]);

        // ✅ Obtener ID del tipo de precio de venta dinámicamente por código
        try {
            $tipoPrecioVentaId = $this->getTipoPrecioVentaId();
            Log::info('✅ [indexApi] Tipo de precio VENTA obtenido', [
                'tipo_precio_id' => $tipoPrecioVentaId,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [indexApi] ' . $e->getMessage());
            return response()->json([
                'message' => $e->getMessage(),
                'data' => []
            ], 500);
        }

        // 🔍 DEBUGGEO: Verificar stock y precios
        $productosConStock = Producto::whereHas('stock', function ($q) use ($almacenId) {
            $q->where('almacen_id', $almacenId)->where('cantidad_disponible', '>', 0);
        })->count();

        $productosConPrecio = Producto::whereHas('precios', function ($q) use ($tipoPrecioVentaId) {
            $q->where('tipo_precio_id', $tipoPrecioVentaId)->where('activo', true)->where('precio', '>', 0);
        })->count();

        Log::info('📊 [indexApi] DEBUGGEO STOCK Y PRECIO', [
            'almacen_id' => $almacenId,
            'tipo_precio_venta_id' => $tipoPrecioVentaId,
            'productos_con_stock' => $productosConStock,
            'productos_con_precio_venta' => $productosConPrecio,
            'empresa_id' => $empresa->id,
        ]);

        $productos   = Producto::with([
            'categoria:id,nombre',
            'marca:id,nombre',
            'proveedor:id,nombre,razon_social',
            'unidad:id,nombre',
            'precios'      => function ($q) {
                // Cargar SOLO precios activos con relación a tipo de precio
                $q->where('activo', true)
                    ->select('id', 'producto_id', 'tipo_precio_id', 'nombre', 'precio', 'es_precio_base', 'margen_ganancia', 'porcentaje_ganancia')
                    ->with('tipoPrecio:id,nombre,codigo');
            },
            'codigosBarra' => function ($q) {
                // Cargar códigos de barra activos
                $q->where('activo', true)
                    ->select('id', 'producto_id', 'codigo', 'tipo', 'es_principal');
            },
            'stock.almacen:id,nombre', // Cargar todos los stocks con almacenes
        ])
            ->where('empresa_id', $empresa->id) // Filtro 1: Por empresa
            ->when($q, fn($query) => $query->where(function ($subQuery) use ($searchLower) {
                $subQuery->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(sku) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(descripcion) like ?', ["%$searchLower%"])
                    // Buscar en códigos de barra activos
                    ->orWhereHas('codigosBarra', function ($codigosQuery) use ($searchLower) {
                        $codigosQuery->whereRaw('LOWER(codigo) like ?', ["%$searchLower%"])
                            ->where('activo', true);
                    })
                    // Buscar en marca
                    ->orWhereHas('marca', function ($marcaQuery) use ($searchLower) {
                        $marcaQuery->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
                    })
                    // Buscar en categoría
                    ->orWhereHas('categoria', function ($categoriaQuery) use ($searchLower) {
                        $categoriaQuery->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
                    })
                    // Buscar en unidad de medida
                    ->orWhereHas('unidad', function ($unidadQuery) use ($searchLower) {
                        $unidadQuery->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
                    });
            }))
            ->when($categoriaId, fn($query) => $query->where('categoria_id', $categoriaId))
            ->when($marcaId, fn($query) => $query->where('marca_id', $marcaId))
            ->when($proveedorId, fn($query) => $query->where('proveedor_id', $proveedorId))
            // ✅ VALIDACIÓN 4: FILTRO 2 - Stock disponible > 0 en el almacén
            ->whereHas('stock', function ($stockQuery) use ($almacenId) {
                $stockQuery->where('almacen_id', $almacenId)
                    ->where('cantidad_disponible', '>', 0);
            })
            // ✅ VALIDACIÓN 5: FILTRO 3 - Precio de venta válido
            ->whereHas('precios', function ($precioQuery) use ($tipoPrecioVentaId) {
                $precioQuery->where('tipo_precio_id', $tipoPrecioVentaId)
                    ->where('activo', true)
                    ->where('precio', '>', 0);
            })
            // ✅ VALIDACIÓN 6: FILTRO 4 - Producto activo
            ->where('activo', $activo)
            ->orderBy('nombre')
            ->paginate($perPage)
            ->through(function ($producto) use ($almacenId, $almacenPrincipal, $tipoPrecioVentaId) {
                // Consolidar stock por almacén (suma de lotes)
                $stockConsolidado = $producto->stock->groupBy('almacen_id')->map(function ($stocks) {
                    $primero = $stocks->first();
                    return [
                        'almacen_id'          => $primero->almacen_id,
                        'almacen_nombre'      => $primero->almacen?->nombre ?? 'Almacén Desconocido',
                        'cantidad'            => (int) $stocks->sum('cantidad'),
                        'cantidad_disponible' => (int) $stocks->sum('cantidad_disponible'),
                        'cantidad_reservada'  => (int) $stocks->sum('cantidad_reservada'),
                    ];
                })->values();

                // Stock del almacén principal/seleccionado (consolidado)
                $stockPrincipalConsolidado = $stockConsolidado->firstWhere('almacen_id', $almacenId);

                if (! $stockPrincipalConsolidado) {
                    $stockPrincipalConsolidado = [
                        'almacen_id'          => $almacenId,
                        'almacen_nombre'      => $almacenPrincipal->nombre ?? 'Almacén Principal',
                        'cantidad'            => 0,
                        'cantidad_disponible' => 0,
                        'cantidad_reservada'  => 0,
                    ];
                }

                // Detalle de stock por lotes (para gestionar inventario)
                $stockPorLotes = $producto->stock
                    ->where('almacen_id', $almacenId)
                    ->map(fn($s) => [
                        'id'                  => $s->id,
                        'almacen_id'          => $s->almacen_id,
                        'lote'                => $s->lote,
                        'fecha_vencimiento'   => $s->fecha_vencimiento?->format('Y-m-d'),
                        'cantidad'            => (int) $s->cantidad,
                        'cantidad_disponible' => (int) $s->cantidad_disponible,
                        'cantidad_reservada'  => (int) $s->cantidad_reservada,
                    ])->values();

                // ✅ Obtener precio de venta para mostrar al cliente
                $precioVenta = $producto->precios->firstWhere('tipo_precio_id', $tipoPrecioVentaId);

                // Obtener solo el string del segundo código de barra
                $segundoCodigoBarra = CodigoBarra::obtenerSegundoCodigoActivo($producto->id) ?? $producto->codigo_barras ?? '';

                return [
                    'id'                  => $producto->id,
                    'nombre'              => $producto->nombre,
                    'sku'                 => $producto->sku,
                    'descripcion'         => $producto->descripcion,
                    // 'peso'                => $producto->peso,
                    'unidad_medida_id'    => $producto->unidad_medida_id,
                    // 'codigo_barras'       => $producto->codigo_barras,
                    // 'codigo_qr'           => $producto->codigo_qr,
                    // 'stock_minimo' => $producto->stock_minimo,
                    // 'stock_maximo' => $producto->stock_maximo,
                    'activo'              => $producto->activo,
                    'limite_venta'        => $producto->limite_venta,
                    // 'fecha_creacion'      => $producto->fecha_creacion,
                    // 'es_alquilable' => $producto->es_alquilable,
                    'categoria_id'        => $producto->categoria_id,
                    'marca_id'            => $producto->marca_id,
                    'proveedor_id'        => $producto->proveedor_id,
                    'categoria'           => $producto->categoria,
                    'marca'               => $producto->marca,
                    'proveedor'           => $producto->proveedor,
                    'unidad'              => $producto->unidad,
                                                                  // 'precios' => $producto->precios,
                    'codigos_barra'       => $segundoCodigoBarra, // String simple del segundo código

                    // Para mostrar al cliente
                    'precio'              => $precioVenta ? (float) $precioVenta->precio : 0,
                    'cantidad_disponible' => $stockPrincipalConsolidado['cantidad_disponible'],

                    // Stock consolidado del almacén principal/seleccionado
                    /* 'stock_principal'     => [
                        'almacen_id'          => $stockPrincipalConsolidado['almacen_id'],
                        'almacen_nombre'      => $stockPrincipalConsolidado['almacen_nombre'],
                        'cantidad'            => $stockPrincipalConsolidado['cantidad'],
                        'cantidad_disponible' => $stockPrincipalConsolidado['cantidad_disponible'],
                        'cantidad_reservada'  => $stockPrincipalConsolidado['cantidad_reservada'],
                    ], */

                    // Stock por almacenes consolidado (para reportes/dashboards)
                    // 'stock_por_almacenes' => $stockConsolidado,

                    // Detalle de lotes del almacén seleccionado (para gestionar inventario)
                    // 'stock_por_lotes' => $stockPorLotes,
                ];
            });

        return ApiResponse::success($productos);
    }

    /**
     * API: Mostrar producto específico
     *
     * Parámetros query:
     * - almacen_id: ID del almacén para consultar stock (default: almacén principal de config)
     *
     * Respuesta incluye stock desglosado por almacenes
     */
    public function showApi(Producto $producto, Request $request): JsonResponse
    {
        // ✨ NUEVO: Verificar que el producto pertenece a la empresa del usuario autenticado
        $userEmpresaId = auth()->user()?->empresa_id;
        // Si el usuario no tiene empresa_id (ej: admin global) o coincide, permitir acceso
        if ($userEmpresaId && $producto->empresa_id !== $userEmpresaId) {
            return response()->json([
                'message' => 'No tienes permiso para ver este producto',
                'data' => []
            ], 403);
        }

        // Almacén dinámico: desde request o config
        // Nota: $request->integer() retorna 0 si no existe, no null, así que usamos has()
        $almacenId = $request->has('almacen_id')
            ? $request->integer('almacen_id')
            : config('inventario.almacen_principal_id', 1);

        // Precargar el almacén para evitar N+1 queries
        $almacenPrincipal = Almacen::find($almacenId);

        $producto->load([
            'categoria:id,nombre',
            'marca:id,nombre',
            'proveedor:id,nombre,razon_social',
            'unidad:id,nombre',
            'stock.almacen:id,nombre',
            'precios'      => function ($q) {
                // Cargar SOLO precios activos con relación a tipo de precio
                $q->where('activo', true)
                    ->select('id', 'producto_id', 'tipo_precio_id', 'nombre', 'precio', 'es_precio_base', 'margen_ganancia', 'porcentaje_ganancia')
                    ->with('tipoPrecio:id,nombre,codigo');
            },
            'codigosBarra' => function ($q) {
                // Cargar códigos de barra activos
                $q->where('activo', true)
                    ->select('id', 'producto_id', 'codigo', 'tipo', 'es_principal');
            },
            'imagenes',
        ]);

        // Consolidar stock por almacén (suma de lotes)
        $stockConsolidado = $producto->stock->groupBy('almacen_id')->map(function ($stocks) {
            $primero = $stocks->first();
            return [
                'almacen_id'          => $primero->almacen_id,
                'almacen_nombre'      => $primero->almacen?->nombre ?? 'Almacén Desconocido',
                'cantidad'            => (int) $stocks->sum('cantidad'),
                'cantidad_disponible' => (int) $stocks->sum('cantidad_disponible'),
                'cantidad_reservada'  => (int) $stocks->sum('cantidad_reservada'),
            ];
        })->values();

        // Stock del almacén principal/seleccionado (consolidado)
        $stockPrincipalConsolidado = $stockConsolidado->firstWhere('almacen_id', $almacenId);

        if (! $stockPrincipalConsolidado) {
            $stockPrincipalConsolidado = [
                'almacen_id'          => $almacenId,
                'almacen_nombre'      => $almacenPrincipal->nombre ?? 'Almacén Principal',
                'cantidad'            => 0,
                'cantidad_disponible' => 0,
                'cantidad_reservada'  => 0,
            ];
        }

        // Detalle de stock por lotes (para gestionar inventario)
        $stockPorLotes = $producto->stock
            ->where('almacen_id', $almacenId)
            ->map(fn($s) => [
                'id'                  => $s->id,
                'almacen_id'          => $s->almacen_id,
                'lote'                => $s->lote,
                'fecha_vencimiento'   => $s->fecha_vencimiento?->format('Y-m-d'),
                'cantidad'            => (int) $s->cantidad,
                'cantidad_disponible' => (int) $s->cantidad_disponible,
                'cantidad_reservada'  => (int) $s->cantidad_reservada,
            ])->values();

        // ✅ Obtener precio de venta para mostrar al cliente (dinámico por código 'VENTA')
        $tipoPrecioVentaId = $this->getTipoPrecioVentaId();
        $precioVenta = $producto->precios->firstWhere('tipo_precio_id', $tipoPrecioVentaId);

        // Obtener solo el string del segundo código de barra
        $segundoCodigoBarra = CodigoBarra::obtenerSegundoCodigoActivo($producto->id) ?? $producto->codigo_barras ?? '';

        // Retornar producto con estructura mejorada de stock
        return ApiResponse::success([
            'id'                  => $producto->id,
            'nombre'              => $producto->nombre,
            'sku'                 => $producto->sku,
            'descripcion'         => $producto->descripcion,
            'peso'                => $producto->peso,
            'unidad_medida_id'    => $producto->unidad_medida_id,
            'codigo_barras'       => $producto->codigo_barras,
            'codigo_qr'           => $producto->codigo_qr,
            'stock_minimo'        => $producto->stock_minimo,
            'stock_maximo'        => $producto->stock_maximo,
            'activo'              => $producto->activo,
            'fecha_creacion'      => $producto->fecha_creacion,
            'es_alquilable'       => $producto->es_alquilable,
            'categoria_id'        => $producto->categoria_id,
            'marca_id'            => $producto->marca_id,
            'proveedor_id'        => $producto->proveedor_id,
            'categoria'           => $producto->categoria,
            'marca'               => $producto->marca,
            'proveedor'           => $producto->proveedor,
            'unidad'              => $producto->unidad,
            'precios'             => $producto->precios,
            'codigos_barra'       => $segundoCodigoBarra, // String simple del segundo código
            'imagenes'            => $producto->imagenes,

            // Para mostrar al cliente
            'precio'              => $precioVenta ? (float) $precioVenta->precio : 0,
            'cantidad_disponible' => $stockPrincipalConsolidado['cantidad_disponible'],

            // Stock consolidado del almacén principal/seleccionado
            'stock_principal'     => [
                'almacen_id'          => $stockPrincipalConsolidado['almacen_id'],
                'almacen_nombre'      => $stockPrincipalConsolidado['almacen_nombre'],
                'cantidad'            => $stockPrincipalConsolidado['cantidad'],
                'cantidad_disponible' => $stockPrincipalConsolidado['cantidad_disponible'],
                'cantidad_reservada'  => $stockPrincipalConsolidado['cantidad_reservada'],
            ],

            // Stock por almacenes consolidado (para reportes/dashboards)
            'stock_por_almacenes' => $stockConsolidado,

            // Detalle de lotes del almacén seleccionado (para gestionar inventario)
            'stock_por_lotes'     => $stockPorLotes,
        ]);
    }

    /**
     * API: Crear producto
     */
    public function storeApi(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'           => ['required', 'string', 'max:255'],
            'codigo'           => ['nullable', 'string', 'max:100', 'unique:productos,codigo'],
            'descripcion'      => ['nullable', 'string'],
            'categoria_id'     => ['required', 'exists:categorias,id'],
            'marca_id'         => ['nullable', 'exists:marcas,id'],
            'proveedor_id'     => ['nullable', 'exists:proveedores,id'],
            'unidad_medida_id' => ['required', 'exists:unidad_medidas,id'],
            'precio_compra'    => ['required', 'numeric', 'min:0'],
            'precio_venta'     => ['required', 'numeric', 'min:0'],
            'stock_minimo'     => ['required', 'integer', 'min:0'],
            'stock_maximo'     => ['required', 'integer', 'min:0'],
            'activo'           => ['boolean'],
        ]);

        try {
            $producto = DB::transaction(function () use ($data) {
                $producto = Producto::create($data);

                // Crear precio base
                PrecioProducto::create([
                    'producto_id'    => $producto->id,
                    'tipo_precio_id' => TipoPrecio::porCodigo('VENTA')?->id ?? 2,
                    'valor'          => $data['precio_venta'],
                    'activo'         => true,
                ]);

                return $producto;
            });

            return ApiResponse::success(
                $producto->load(['categoria', 'marca', 'proveedor', 'unidad']),
                'Producto creado exitosamente',
                201
            );

        } catch (\Exception $e) {
            return ApiResponse::error('Error al crear producto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * API: Actualizar producto
     */
    public function updateApi(Request $request, Producto $producto): JsonResponse
    {
        $data = $request->validate([
            'nombre'           => ['sometimes', 'required', 'string', 'max:255'],
            'sku'              => ['nullable', 'string', 'max:20', 'unique:productos,sku,' . $producto->id],
            'codigo'           => ['nullable', 'string', 'max:100', 'unique:productos,codigo,' . $producto->id],
            'descripcion'      => ['nullable', 'string'],
            'categoria_id'     => ['sometimes', 'required', 'exists:categorias,id'],
            'marca_id'         => ['nullable', 'exists:marcas,id'],
            'proveedor_id'     => ['nullable', 'exists:proveedores,id'],
            'unidad_medida_id' => ['sometimes', 'required', 'exists:unidad_medidas,id'],
            'precio_compra'    => ['sometimes', 'required', 'numeric', 'min:0'],
            'precio_venta'     => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock_minimo'     => ['sometimes', 'required', 'integer', 'min:0'],
            'stock_maximo'     => ['sometimes', 'required', 'integer', 'min:0'],
            'activo'           => ['boolean'],
        ]);

        try {
            $producto->update($data);

            return ApiResponse::success(
                $producto->fresh(['categoria', 'marca', 'proveedor', 'unidad']),
                'Producto actualizado exitosamente'
            );

        } catch (\Exception $e) {
            return ApiResponse::error('Error al actualizar producto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * API: Eliminar producto
     */
    public function destroyApi(Producto $producto): JsonResponse
    {
        try {
            // Verificar si tiene stock
            $tieneStock = $producto->stock()->where('cantidad', '>', 0)->exists();
            if ($tieneStock) {
                return ApiResponse::error('No se puede eliminar un producto con stock', 400);
            }

            // Verificar si tiene movimientos
            $tieneMovimientos = $producto->stock()->whereHas('movimientos')->exists();
            if ($tieneMovimientos) {
                // Solo desactivar
                $producto->update(['activo' => false]);

                return ApiResponse::success(null, 'Producto desactivado (tiene historial de movimientos)');
            }

            // Eliminar completamente
            $producto->delete();

            return ApiResponse::success(null, 'Producto eliminado exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al eliminar producto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * API: Buscar productos para autocompletado
     *
     * Parámetros query:
     * - q: Término de búsqueda (mínimo 2 caracteres)
     * - limite: Máximo número de resultados (default: 10)
     * - almacen_id: ID del almacén para consultar stock (default: almacén principal de config)
     *
     * Respuesta incluye stock del almacén seleccionado
     */
    public function buscarApi(Request $request): JsonResponse
    {
        $q             = $request->string('q');
        $limite        = $request->integer('limite', 10);
        $tipoBusqueda  = $request->string('tipo_busqueda', 'parcial'); // ✅ NUEVO: exacta o parcial
        $tipo          = $request->string('tipo', 'venta'); // ✅ NUEVO: 'venta' o 'compra'

        // Obtener almacén: desde request > empresa autenticada > empresa principal > config
        // Prioridad: 1) parámetro explícito, 2) empresa del usuario, 3) empresa principal, 4) config
        if ($request->has('almacen_id')) {
            $almacenId = $request->integer('almacen_id');
        } else {
            // Obtener empresa del contexto (usuario autenticado o empresa principal)
            $empresa = $this->obtenerEmpresa($request);
            $almacenId = $empresa?->almacen_id_principal ?? config('inventario.almacen_principal_id', 1);
        }

        if (! $q || strlen($q) < 2) {
            return ApiResponse::success([]);
        }

        Log::info('🔍 ProductoController::buscarApi', [
            'q'              => $q,
            'tipo_busqueda'  => $tipoBusqueda,
            'tipo'           => $tipo,
            'almacen_id'     => $almacenId,
            'limite'         => $limite,
        ]);

        // Convertir búsqueda a minúsculas para hacer búsqueda case-insensitive
        $searchLower = strtolower($q);
        $userEmpresaId = auth()->user()?->empresa_id;

        // ✅ NUEVO: Determinar tipo de búsqueda
        $esExacta = $tipoBusqueda === 'exacta';

        $productos = Producto::select([
            'id', 'nombre', 'codigo_barras', 'sku', 'categoria_id', 'marca_id',
            'descripcion', 'peso', 'unidad_medida_id', 'proveedor_id',
            'stock_minimo', 'stock_maximo', 'limite_venta', 'activo', 'es_fraccionado', 'empresa_id'
        ])
            // ✨ NUEVO: Filtrar por empresa del usuario (si tiene empresa_id asignada)
            ->when($userEmpresaId, fn($q) => $q->where('empresa_id', $userEmpresaId))
            ->where('activo', true)
            // ✅ MODIFICADO: Solo filtrar por stock para VENTAS, no para COMPRAS
            ->when($tipo === 'venta', function ($query) use ($almacenId) {
                return $query->whereHas('stock', function ($stockQuery) use ($almacenId) {
                    $stockQuery->where('almacen_id', $almacenId)
                        ->where('cantidad_disponible', '>', 0);
                });
            })
            ->when($tipo === 'compra', function ($query) use ($almacenId) {
                // Para compras, solo verificar que exista el almacén (no filtrar por stock)
                return $query->whereHas('stock', function ($stockQuery) use ($almacenId) {
                    $stockQuery->where('almacen_id', $almacenId);
                });
            })
            // ✅ NUEVO: Filtrar por precio de venta activo SOLO PARA VENTAS
            ->when($tipo === 'venta', function ($query) {
                return $query->whereHas('precios', function ($preciosQuery) {
                    $preciosQuery->where('activo', true)
                        ->whereHas('tipoPrecio', function ($tipoQuery) {
                            $tipoQuery->where('codigo', 'VENTA');
                        });
                });
            })
            ->where(function ($query) use ($searchLower, $esExacta) {
                if ($esExacta) {
                    // ✅ BÚSQUEDA EXACTA: Para código de barras (escáner)
                    $query->where('codigo_barras', $searchLower)
                        ->orWhere('sku', $searchLower)
                        ->orWhereHas('codigosBarra', function ($codigoQuery) use ($searchLower) {
                            $codigoQuery->where('codigo', $searchLower);
                        });
                } else {
                    // ✅ BÚSQUEDA PARCIAL: Para texto (búsqueda manual)
                    $query->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(codigo_barras) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(sku) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(descripcion) like ?', ["%$searchLower%"])
                        ->orWhereHas('codigosBarra', function ($codigoQuery) use ($searchLower) {
                            $codigoQuery->whereRaw('LOWER(codigo) like ?', ["%$searchLower%"]);
                        });
                }
            })
            ->with([
                'codigosBarra' => function ($q) {
                    // Cargar códigos de barra activos
                    $q->where('activo', true)
                        ->select('id', 'producto_id', 'codigo', 'tipo', 'es_principal');
                },
                'categoria:id,nombre',
                'marca:id,nombre',
                'proveedor:id,nombre,razon_social', // ✨ NUEVO
                'unidad:id,nombre,codigo', // ✨ NUEVO - Corregido: era unidadMedida
                'conversiones' => function ($q) { // ✅ MODIFICADO: Cargar conversiones con relaciones
                    $q->where('activo', true)
                        ->select('id', 'producto_id', 'unidad_base_id', 'unidad_destino_id', 'factor_conversion', 'activo', 'es_conversion_principal')
                        ->with('unidadDestino:id,nombre,codigo'); // ✅ NUEVO: Cargar la unidad destino
                },
                'precios'      => function ($q) {
                    // Cargar SOLO precios activos
                    $q->where('activo', true)
                        ->select('id', 'producto_id', 'tipo_precio_id', 'nombre', 'precio', 'es_precio_base')
                        ->with('tipoPrecio:id,nombre,codigo');
                },
                'stock'        => function ($query) {
                    $query->select('id', 'producto_id', 'almacen_id', 'cantidad', 'cantidad_disponible', 'cantidad_reservada')
                        ->with('almacen:id,nombre');
                },
            ])
            ->limit($limite)
            ->get()
            ->map(function ($producto) use ($almacenId, $tipo) {
                // ✅ DEBUG: Loguear producto con conversiones
                Log::info('🔍 [buscarApi] Procesando producto', [
                    'producto_id' => $producto->id,
                    'producto_nombre' => $producto->nombre,
                    'es_fraccionado' => $producto->es_fraccionado,
                    'unidad_medida_id' => $producto->unidad_medida_id,
                    'unidad_nombre' => $producto->unidad?->nombre,
                    'conversiones_count' => $producto->conversiones->count(),
                    'conversiones' => $producto->conversiones->map(fn($c) => [
                        'id' => $c->id,
                        'unidad_destino_id' => $c->unidad_destino_id,
                        'unidad_destino_nombre' => $c->unidadDestino?->nombre,
                        'factor' => $c->factor_conversion,
                        'activo' => $c->activo,
                    ])->toArray()
                ]);

                // Incluir códigos de barras en la respuesta
                $codigosTexto = $producto->codigosBarra->pluck('codigo')->toArray();

                // Obtener stock del almacén seleccionado
                $stockAlmacen    = $producto->stock->firstWhere('almacen_id', $almacenId);
                $stockDisponible = $stockAlmacen?->cantidad_disponible ?? 0;

                // Calcular stock total de todos los almacenes
                $stockTotal = $producto->stock->sum('cantidad_disponible');

                // ✅ MODIFICADO: Obtener precio de VENTA (tipos_precio.codigo = 'VENTA')
                $precioVenta = $producto->precios
                    ->first(fn($p) => $p->tipoPrecio?->codigo === 'VENTA')?->precio ?? 0;

                // Fallback: Obtener precio base si no existe precio de venta
                // En modo VENTA: NO debe retornar precio de costo, solo precio de venta
                $precioBase = ($tipo === 'venta')
                    ? $precioVenta
                    : ($precioVenta ?? $producto->precios->firstWhere('es_precio_base', true)?->precio ?? $producto->precios->first()?->precio ?? 0);

                // ✅ NUEVO: Obtener precio de COSTO
                $precioCosto = $producto->precios
                    ->first(fn($p) => $p->tipoPrecio?->codigo === 'COSTO')?->precio ?? 0;

                // Obtener nombre del almacén
                $almacenNombre = $stockAlmacen?->almacen?->nombre ?? 'Almacén Principal';

                // Obtener solo el string del segundo código de barra
                $segundoCodigoBarra = CodigoBarra::obtenerSegundoCodigoActivo($producto->id) ?? $producto->codigo_barras ?? '';

                return [
                    'id'               => $producto->id,
                    'nombre'           => $producto->nombre,
                    'codigo'           => $producto->codigo, // ✅ NUEVO: Código del producto
                    'sku'              => $producto->sku, // ✅ NUEVO: SKU del producto
                    'codigo_barras'    => $producto->codigo_barras,
                    'codigos_barras'   => $codigosTexto,
                    'codigos_barra'    => $segundoCodigoBarra, // String simple del segundo código
                    'precio_base'      => (float) $precioBase, // ✅ Ahora retorna precio de VENTA
                    'precio_venta'     => (float) $precioBase, // ✅ NUEVO: Alias para compatibilidad
                    'precio_costo'     => (float) $precioCosto, // ✅ NUEVO: Precio de costo registrado
                    'precios'          => $producto->precios,

                    // Stock del almacén seleccionado
                    'stock_disponible' => (int) $stockDisponible,
                    'stock'            => (int) $stockDisponible, // ✅ NUEVO: Alias para compatibilidad
                    'almacen_id'       => $almacenId,
                    'almacen_nombre'   => $almacenNombre,

                    // Stock total de todos los almacenes
                    'stock_total'      => (int) $stockTotal,

                    // ✨ Límite de venta
                    'limite_venta'     => $producto->limite_venta ? (int) $producto->limite_venta : null,

                    'peso'             => $producto->peso, // ✅ NUEVO: Peso del producto
                    'categoria'        => $producto->categoria?->nombre ?? '',
                    'marca'            => $producto->marca?->nombre ?? '',

                    // ✅ NUEVO: Información de fraccionamiento y conversiones para ventas
                    'es_fraccionado'   => (bool) $producto->es_fraccionado,
                    'unidad_medida_id' => $producto->unidad_medida_id,
                    'unidad_medida_nombre' => $producto->unidad?->nombre ?? null,
                    'conversiones'     => $producto->conversiones
                        ->where('activo', true)
                        ->map(fn($c) => [
                            'unidad_destino_id' => $c->unidad_destino_id,
                            'unidad_destino_nombre' => $c->unidadDestino?->nombre ?? null,
                            'factor_conversion' => (float) $c->factor_conversion,
                            'es_conversion_principal' => (bool) $c->es_conversion_principal,
                        ])
                        ->values()
                        ->all(),
                ];
            });

        return ApiResponse::success($productos);
    }

    /**
     * Importar productos masivamente desde CSV
     */
    public function importarProductosMasivos(Request $request): JsonResponse
    {
        try {
            // Validar request
            $validated = $request->validate([
                'nombre_archivo' => 'required|string|max:255',
                'datos_csv' => 'required|string',
                'productos' => 'required|array|min:1|max:5000',
                'productos.*.nombre' => 'required|string|max:255',
                'productos.*.cantidad' => 'required|numeric|min:0',
                'productos.*.precio_costo' => 'nullable|numeric|min:0',
                'productos.*.precio_venta' => 'nullable|numeric|min:0',
                'productos.*.codigo_barra' => 'nullable|string|max:50',
                'productos.*.sku' => 'nullable|string|max:20',
                'productos.*.proveedor_nombre' => 'nullable|string|max:255',
                'productos.*.unidad_medida_nombre' => 'nullable|string|max:100',
                'productos.*.lote' => 'nullable|string|max:50',
                'productos.*.fecha_vencimiento' => 'nullable|date',
                'productos.*.descripcion' => 'nullable|string|max:500',
                'productos.*.principio_activo' => 'nullable|string|max:255',
                'productos.*.uso_de_medicacion' => 'nullable|string',
                'productos.*.categoria_nombre' => 'nullable|string|max:100',
                'productos.*.marca_nombre' => 'nullable|string|max:100',
                'productos.*.almacen_id' => 'nullable|integer|min:1',
                'productos.*.almacen_nombre' => 'nullable|string|max:255',
                'productos.*.accion_stock' => 'nullable|in:sumar,reemplazar',
            ]);

            // Generar hash del CSV para deduplicación
            $hashArchivo = hash('sha256', $validated['datos_csv']);

            // Verificar si el archivo ya fue procesado
            $cargaExistente = CargoCSVProducto::where('hash_archivo', $hashArchivo)->first();
            if ($cargaExistente) {
                return ApiResponse::error(
                    'Este archivo ya fue procesado',
                    409,
                    ['cargo_id' => $cargaExistente->id]
                );
            }

            // Crear registro de carga
            $cargo = CargoCSVProducto::create([
                'usuario_id' => Auth::id(),
                'nombre_archivo' => $validated['nombre_archivo'],
                'hash_archivo' => $hashArchivo,
                'cantidad_filas' => count($validated['productos']),
                'estado' => 'pendiente',
                'datos_json' => $validated['datos_csv'],
            ]);

            // Iniciar transacción
            DB::beginTransaction();

            try {
                $cambios = [];
                $errores = [];
                $cantidadValidas = 0;

                // Obtener almacén principal con fallback inteligente
                $empresa = $this->obtenerEmpresa($request);
                $almacenPrincipalId = $empresa?->almacen_id_principal;

                if (!$almacenPrincipalId) {
                    // Fallback 1: buscar almacén llamado "Almacén Principal"
                    $almacenPrincipal = Almacen::whereRaw('LOWER(nombre) = ?', ['almacén principal'])
                        ->where('activo', true)
                        ->first();

                    if ($almacenPrincipal) {
                        $almacenPrincipalId = $almacenPrincipal->id;
                    } else {
                        // Fallback 2: obtener el primer almacén activo ordenado por ID
                        $almacenFallback = Almacen::where('activo', true)
                            ->orderBy('id')
                            ->first();
                        $almacenPrincipalId = $almacenFallback?->id;
                    }
                }

                $tipoAjuste = TipoAjusteInventario::where('clave', 'INVENTARIO_INICIAL')->first();

                // Crear tipo de ajuste si no existe
                if (!$tipoAjuste) {
                    $tipoAjuste = TipoAjusteInventario::create([
                        'clave' => 'INVENTARIO_INICIAL',
                        'label' => 'Inventario Inicial',
                        'descripcion' => 'Carga inicial de inventario al importar productos',
                        'color' => 'purple',
                        'activo' => true,
                    ]);
                }

                // Procesar cada producto
                foreach ($validated['productos'] as $index => $datosFila) {
                    // Crear savepoint para cada fila (permite rollback parcial)
                    $savepointName = 'producto_' . $index;
                    DB::statement("SAVEPOINT {$savepointName}");

                    try {
                        // Limpiar campos de texto para evitar errores de UTF-8 en JSON
                        $camposTexto = [
                            'nombre', 'descripcion', 'principio_activo', 'uso_de_medicacion',
                            'sku', 'codigo_barra', 'proveedor_nombre', 'unidad_medida_nombre',
                            'lote', 'categoria_nombre', 'marca_nombre', 'almacen_nombre'
                        ];
                        foreach ($camposTexto as $campo) {
                            if (isset($datosFila[$campo])) {
                                $datosFila[$campo] = $this->limpiarUTF8($datosFila[$campo]);
                            }
                        }
                        // Buscar/crear proveedor
                        $proveedor = null;
                        if (!empty($datosFila['proveedor_nombre'])) {
                            $proveedor = $this->buscarOCrearProveedor($datosFila['proveedor_nombre']);
                        }

                        // Buscar/crear unidad de medida
                        $unidadMedida = null;
                        if (!empty($datosFila['unidad_medida_nombre'])) {
                            $unidadMedida = $this->buscarOCrearUnidadMedida($datosFila['unidad_medida_nombre']);
                        }

                        // Buscar/crear categoría (con búsqueda inteligente por ID, nombre)
                        $categoria = null;
                        if (!empty($datosFila['categoria_nombre'])) {
                            $categoria = $this->buscarOCrearCategoria($datosFila['categoria_nombre']);
                        }

                        // Buscar/crear marca (con búsqueda inteligente por ID, nombre)
                        $marca = null;
                        if (!empty($datosFila['marca_nombre'])) {
                            $marca = $this->buscarOCrearMarca($datosFila['marca_nombre']);
                        }

                        // Buscar almacén (con búsqueda inteligente por ID, nombre)
                        $almacenId = $almacenPrincipalId;
                        if (!empty($datosFila['almacen_id'])) {
                            $almacenBuscado = $this->buscarAlmacen((string) $datosFila['almacen_id']);
                            if ($almacenBuscado) {
                                $almacenId = $almacenBuscado->id;
                            }
                        } elseif (!empty($datosFila['almacen_nombre'])) {
                            $almacenBuscado = $this->buscarAlmacen($datosFila['almacen_nombre']);
                            if ($almacenBuscado) {
                                $almacenId = $almacenBuscado->id;
                            }
                        }

                        // Buscar producto por código de barra o nombre
                        $producto = null;
                        $esNuevo = true;

                        if (!empty($datosFila['codigo_barra'])) {
                            $producto = Producto::whereHas('codigosBarra', function ($q) use ($datosFila) {
                                $q->where('codigo', $datosFila['codigo_barra'])->where('activo', true);
                            })->first();
                        }

                        if (!$producto && !empty($datosFila['nombre'])) {
                            $nombreNormalizado = $this->normalizarTexto($datosFila['nombre']);
                            $producto = Producto::whereRaw('LOWER(nombre) = ?', [$nombreNormalizado])->first();
                        }

                        if ($producto) {
                            $esNuevo = false;

                            // Actualizar SKU si viene en el CSV
                            if (!empty($datosFila['sku'])) {
                                $producto->update(['sku' => $datosFila['sku']]);
                            }

                            // Actualizar precios si existe
                            if (!empty($datosFila['precio_costo']) || !empty($datosFila['precio_venta'])) {
                                $this->actualizarPreciosProducto($producto, $datosFila);
                            }
                        } else {
                            // Crear nuevo producto
                            $producto = Producto::create([
                                'nombre' => $datosFila['nombre'],
                                'descripcion' => $datosFila['descripcion'] ?? null,
                                'principio_activo' => $datosFila['principio_activo'] ?? null,
                                'uso_de_medicacion' => $datosFila['uso_de_medicacion'] ?? null,
                                'sku' => $datosFila['sku'] ?? null, // Se genera automáticamente si es null
                                'categoria_id' => $categoria?->id,
                                'marca_id' => $marca?->id,
                                'proveedor_id' => $proveedor?->id,
                                'unidad_medida_id' => $unidadMedida?->id,
                                'activo' => true,
                            ]);

                            // Crear precios
                            if (!empty($datosFila['precio_costo']) || !empty($datosFila['precio_venta'])) {
                                $this->crearPreciosProducto($producto, $datosFila);
                            }
                        }

                        // Crear/actualizar código de barra
                        if (!empty($datosFila['codigo_barra'])) {
                            $codigoBarra = CodigoBarra::where('codigo', $datosFila['codigo_barra'])
                                ->where('producto_id', $producto->id)
                                ->first();

                            if (!$codigoBarra) {
                                // Marcar otros códigos como no principal
                                CodigoBarra::where('producto_id', $producto->id)
                                    ->update(['es_principal' => false]);

                                // Crear nuevo código
                                CodigoBarra::create([
                                    'producto_id' => $producto->id,
                                    'codigo' => $datosFila['codigo_barra'],
                                    'tipo' => 'EAN',
                                    'es_principal' => true,
                                    'activo' => true,
                                ]);
                            }
                        }

                        // Crear/actualizar stock en almacén seleccionado
                        $stockAnterior = 0;
                        $stock = StockProducto::where('producto_id', $producto->id)
                            ->where('almacen_id', $almacenId)
                            ->where('lote', $datosFila['lote'] ?? null)
                            ->first();

                        // Obtener acción de stock (default: sumar)
                        $accionStock = $datosFila['accion_stock'] ?? 'sumar';

                        if ($stock) {
                            $stockAnterior = $stock->cantidad;

                            if ($accionStock === 'reemplazar') {
                                // Validar que no hay reservas mayores a la nueva cantidad
                                if ($stock->cantidad_reservada > 0 && $datosFila['cantidad'] < $stock->cantidad_reservada) {
                                    throw new \Exception(
                                        "No se puede reemplazar el stock del producto '{$producto->nombre}' " .
                                        "porque tiene {$stock->cantidad_reservada} unidades reservadas " .
                                        "y el nuevo stock ({$datosFila['cantidad']}) es menor."
                                    );
                                }
                                $stock->cantidad = $datosFila['cantidad'];
                            } else {
                                // Sumar cantidad al stock existente (comportamiento por defecto)
                                $stock->cantidad += $datosFila['cantidad'];
                            }

                            $stock->cantidad_disponible = $stock->cantidad - ($stock->cantidad_reservada ?? 0);
                            // Actualizar fecha de vencimiento si se proporciona
                            if (!empty($datosFila['fecha_vencimiento'])) {
                                $stock->fecha_vencimiento = $this->parsearFechaVencimiento($datosFila['fecha_vencimiento']);
                            }
                            $stock->fecha_actualizacion = now();
                            $stock->save();
                        } else {
                            // Crear nuevo registro de stock
                            $stock = StockProducto::create([
                                'producto_id' => $producto->id,
                                'almacen_id' => $almacenId,
                                'cantidad' => $datosFila['cantidad'],
                                'cantidad_reservada' => 0,
                                'cantidad_disponible' => $datosFila['cantidad'],
                                'lote' => $datosFila['lote'] ?? null,
                                'fecha_vencimiento' => $this->parsearFechaVencimiento($datosFila['fecha_vencimiento'] ?? null),
                            ]);
                            $stockAnterior = 0;
                        }

                        // Crear movimiento de inventario
                        $observacionAccion = $accionStock === 'reemplazar'
                            ? " (Reemplazo: {$stockAnterior} → {$stock->cantidad})"
                            : " (Suma: {$stockAnterior} + {$datosFila['cantidad']} = {$stock->cantidad})";

                        MovimientoInventario::create([
                            'stock_producto_id' => $stock->id,
                            'cantidad_anterior' => $stockAnterior,
                            'cantidad' => $accionStock === 'reemplazar'
                                ? ($stock->cantidad - $stockAnterior)
                                : $datosFila['cantidad'],
                            'cantidad_posterior' => $stock->cantidad,
                            'fecha' => now(),
                            'observacion' => "Carga masiva: {$validated['nombre_archivo']}" . $observacionAccion,
                            'tipo' => 'ENTRADA_AJUSTE',
                            'user_id' => Auth::id(),
                            'tipo_ajuste_inventario_id' => $tipoAjuste->id,
                            'referencia_tipo' => 'CARGA_CSV_PRODUCTOS',
                            'referencia_id' => $cargo->id,
                        ]);

                        // Registrar cambio
                        $cambios[] = [
                            'fila' => $index + 2, // +2 porque fila 1 es encabezado
                            'producto_id' => $producto->id,
                            'producto_nombre' => $this->limpiarUTF8($producto->nombre),
                            'accion' => $esNuevo ? 'creado' : 'actualizado',
                            'stock_anterior' => $stockAnterior,
                            'stock_nuevo' => $stock->cantidad,
                        ];

                        $cantidadValidas++;
                        // Confirmar savepoint si todo va bien
                        DB::statement("RELEASE SAVEPOINT {$savepointName}");
                    } catch (\Exception $e) {
                        // Rollback al savepoint en caso de error
                        DB::statement("ROLLBACK TO SAVEPOINT {$savepointName}");

                        $errores[] = [
                            'fila' => $index + 2,
                            'mensaje' => $this->limpiarUTF8("Error procesando fila: {$e->getMessage()}"),
                        ];
                        Log::error("Error procesando producto en carga CSV: {$e->getMessage()}", [
                            'cargo_id' => $cargo->id,
                            'fila' => $index + 2,
                            'datos' => $datosFila,
                        ]);
                    }
                }

                // Actualizar cargo con resultados
                $cargo->update([
                    'cantidad_validas' => $cantidadValidas,
                    'cantidad_errores' => count($errores),
                    'estado' => 'procesado',
                    'cambios_json' => $cambios,
                    'errores_json' => $errores,
                ]);

                DB::commit();

                return ApiResponse::success([
                    'cargo_id' => $cargo->id,
                    'cantidad_total' => count($validated['productos']),
                    'cantidad_procesados' => $cantidadValidas,
                    'cantidad_errores' => count($errores),
                    'errores' => $errores,
                    'mensaje' => "Se procesaron {$cantidadValidas} productos con éxito",
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Error en importación de productos: {$e->getMessage()}", [
                    'cargo_id' => $cargo->id,
                    'trace' => $e->getTraceAsString(),
                ]);

                $cargo->update([
                    'estado' => 'cancelado',
                    'errores_json' => [['mensaje' => "Error crítico: {$e->getMessage()}"]],
                ]);

                return ApiResponse::error(
                    "Error procesando carga masiva: {$e->getMessage()}",
                    500
                );
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return ApiResponse::error('Validación fallida', 422, $e->errors());
        } catch (\Exception $e) {
            Log::error("Error en importarProductosMasivos: {$e->getMessage()}");
            return ApiResponse::error("Error inesperado: {$e->getMessage()}", 500);
        }
    }

    /**
     * Validar productos CSV - Detectar existentes + Stock
     */
    public function validarProductosCSV(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'productos' => 'required|array',
                'productos.*.nombre' => 'required|string',
                'productos.*.codigo_barra' => 'nullable|string',
                'productos.*.cantidad' => 'required|numeric|min:0',
                'productos.*.almacen_id' => 'nullable|integer',
                'productos.*.almacen_nombre' => 'nullable|string',
                'productos.*.lote' => 'nullable|string',
            ]);

            $resultados = [];

            foreach ($validated['productos'] as $index => $datosFila) {
                // 1. Detectar producto existente (mismo criterio que importación)
                $producto = null;
                $criterioDeteccion = null;

                // Buscar por código de barra primero
                if (!empty($datosFila['codigo_barra'])) {
                    $producto = Producto::whereHas('codigosBarra', function ($q) use ($datosFila) {
                        $q->where('codigo', $datosFila['codigo_barra'])->where('activo', true);
                    })->first();
                    if ($producto) {
                        $criterioDeteccion = 'codigo_barra';
                    }
                }

                // Buscar por nombre si no encontró por código
                if (!$producto && !empty($datosFila['nombre'])) {
                    $nombreNormalizado = $this->normalizarTexto($datosFila['nombre']);
                    $producto = Producto::whereRaw('LOWER(nombre) = ?', [$nombreNormalizado])->first();
                    if ($producto) {
                        $criterioDeteccion = 'nombre';
                    }
                }

                $resultado = [
                    'index' => $index,
                    'existe' => (bool) $producto,
                ];

                if ($producto) {
                    // 2. Calcular stock total en todos los almacenes
                    $stockTotal = $producto->stock()->sum('cantidad');

                    // 3. Calcular stock en el almacén específico (si aplica)
                    $almacenId = $this->resolverAlmacenIdValidacion($datosFila);
                    $stockEnAlmacen = 0;

                    if ($almacenId) {
                        $stockEnAlmacen = $producto->stock()
                            ->where('almacen_id', $almacenId)
                            ->sum('cantidad');
                    }

                    // 4. Detalles por almacén
                    $detallesPorAlmacen = $producto->stock()
                        ->with('almacen:id,nombre')
                        ->get()
                        ->groupBy('almacen_id')
                        ->map(function ($stocks) {
                            return [
                                'almacen' => $stocks->first()->almacen?->nombre ?? 'Almacén Desconocido',
                                'cantidad' => (int) $stocks->sum('cantidad'),
                                'lotes' => $stocks->count(),
                            ];
                        })
                        ->values();

                    $resultado['producto_existente'] = [
                        'id' => $producto->id,
                        'nombre' => $producto->nombre,
                        'sku' => $producto->sku,
                        'criterio_deteccion' => $criterioDeteccion,
                        'stock_total' => (int) $stockTotal,
                        'stock_almacen_destino' => (int) $stockEnAlmacen,
                        'detalles_por_almacen' => $detallesPorAlmacen->toArray(),
                        // Valores para preview
                        'preview_suma' => (int) ($stockTotal + $datosFila['cantidad']),
                        'preview_reemplazo' => (int) $datosFila['cantidad'],
                    ];
                }

                $resultados[] = $resultado;
            }

            return response()->json([
                'success' => true,
                'resultados' => $resultados,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Resolver ID del almacén para validación
     */
    private function resolverAlmacenIdValidacion(array $datosFila): ?int
    {
        if (!empty($datosFila['almacen_id'])) {
            return (int) $datosFila['almacen_id'];
        }

        if (!empty($datosFila['almacen_nombre'])) {
            $almacen = Almacen::where('nombre', $datosFila['almacen_nombre'])->first();
            return $almacen?->id;
        }

        return config('inventario.almacen_principal_id', 1);
    }

    /**
     * Listar cargas masivas con historial
     */
    public function listarCargasMasivas(Request $request): JsonResponse
    {
        try {
            $estado = $request->string('estado')->toString();
            $pagina = $request->integer('page', 1);
            $porPagina = $request->integer('per_page', 15);

            $query = CargoCSVProducto::with(['usuario', 'usuarioReversion'])
                ->orderByDesc('created_at');

            if (!empty($estado) && in_array($estado, ['pendiente', 'procesado', 'cancelado', 'revertido'])) {
                $query->where('estado', $estado);
            }

            $cargas = $query->paginate($porPagina, ['*'], 'page', $pagina);

            return ApiResponse::success($cargas);
        } catch (\Exception $e) {
            Log::error("Error listando cargas masivas: {$e->getMessage()}");
            return ApiResponse::error("Error listando cargas: {$e->getMessage()}", 500);
        }
    }

    /**
     * Ver detalle de una carga masiva
     */
    public function verCargaMasiva(CargoCSVProducto $cargo): JsonResponse
    {
        try {
            $cargo->load(['usuario', 'usuarioReversion']);

            return ApiResponse::success($cargo);
        } catch (\Exception $e) {
            Log::error("Error viendo carga masiva: {$e->getMessage()}");
            return ApiResponse::error("Error obteniendo carga: {$e->getMessage()}", 500);
        }
    }

    /**
     * Revertir una carga masiva de productos
     */
    public function revertirCargaMasiva(Request $request, CargoCSVProducto $cargo): JsonResponse
    {
        try {
            // Validar que pueda revertirse
            if (!$cargo->puedeRevertir()) {
                $razon = $cargo->obtenerRazonNoRevertible();
                return ApiResponse::error($razon ?? 'No se puede revertir esta carga', 422);
            }

            $motivo = $request->string('motivo', 'Sin motivo especificado')->toString();

            DB::beginTransaction();

            try {
                $productosAfectados = $cargo->obtenerProductosAfectados();

                foreach ($productosAfectados as $cambio) {
                    $producto = Producto::find($cambio['id']);
                    if (!$producto) {
                        continue;
                    }

                    if ($cambio['accion'] === 'creado') {
                        // Eliminar movimientos de inventario
                        MovimientoInventario::where('referencia_tipo', 'CARGA_CSV_PRODUCTOS')
                            ->where('referencia_id', $cargo->id)
                            ->delete();

                        // Eliminar stock
                        StockProducto::where('producto_id', $producto->id)->delete();

                        // Eliminar precios
                        PrecioProducto::where('producto_id', $producto->id)->delete();

                        // Eliminar códigos de barra
                        CodigoBarra::where('producto_id', $producto->id)->delete();

                        // Eliminar producto
                        $producto->delete();
                    } else if ($cambio['accion'] === 'actualizado') {
                        // Revertir stock a valor anterior
                        $movimientos = MovimientoInventario::where('referencia_tipo', 'CARGA_CSV_PRODUCTOS')
                            ->where('referencia_id', $cargo->id)
                            ->get();

                        foreach ($movimientos as $movimiento) {
                            $stock = StockProducto::find($movimiento->stock_producto_id);
                            if ($stock) {
                                $stock->cantidad = $cambio['stock_anterior'];
                                $stock->cantidad_disponible = $cambio['stock_anterior'] - ($stock->cantidad_reservada ?? 0);
                                $stock->save();
                            }
                            $movimiento->delete();
                        }
                    }
                }

                // Marcar como revertida
                $cargo->marcarComoRevertida(Auth::user(), $motivo);

                DB::commit();

                return ApiResponse::success([
                    'mensaje' => 'Carga revertida exitosamente',
                    'cargo_id' => $cargo->id,
                    'productos_afectados' => count($productosAfectados),
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error("Error revirtiendo carga masiva: {$e->getMessage()}");
            return ApiResponse::error("Error revirtiendo carga: {$e->getMessage()}", 500);
        }
    }

    /**
     * Métodos helper privados
     */

    /**
     * Normalizar texto para búsqueda (eliminar acentos)
     */
    private function normalizarTexto(string $texto): string
    {
        return strtolower(trim(
            (string) preg_replace('~&([a-z]{1,2})(?:acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1',
                htmlentities($texto, ENT_QUOTES, 'UTF-8'))
        ));
    }

    /**
     * Buscar o crear proveedor por nombre
     */
    private function buscarOCrearProveedor(string $nombre): Proveedor
    {
        $nombreNormalizado = $this->normalizarTexto($nombre);

        $proveedor = Proveedor::whereRaw('LOWER(nombre) = ?', [$nombreNormalizado])->first();

        if (!$proveedor) {
            $proveedor = Proveedor::create([
                'nombre' => $nombre,
                'activo' => true,
                'fecha_registro' => now(),
            ]);
        }

        return $proveedor;
    }

    /**
     * Buscar o crear unidad de medida (inteligencia: ID, código, nombre)
     */
    private function buscarOCrearUnidadMedida(string $valor): ?UnidadMedida
    {
        if (empty($valor)) {
            return null;
        }

        $valorNormalizado = $this->normalizarTexto($valor);

        // Intentar buscar por ID si es numérico
        if (is_numeric($valor)) {
            $unidad = UnidadMedida::find((int) $valor);
            if ($unidad && $unidad->activo) {
                return $unidad;
            }
        }

        // Buscar por código o nombre (case-insensitive)
        $unidad = UnidadMedida::where(function ($q) use ($valorNormalizado) {
            $q->whereRaw('LOWER(codigo) = ?', [$valorNormalizado])
              ->orWhereRaw('LOWER(nombre) = ?', [$valorNormalizado]);
        })->where('activo', true)->first();

        if ($unidad) {
            return $unidad;
        }

        // Crear nueva unidad de medida
        $codigo = strtoupper(substr($valor, 0, 3));
        $unidad = UnidadMedida::create([
            'codigo' => $codigo,
            'nombre' => $valor,
            'activo' => true,
        ]);

        return $unidad;
    }

    /**
     * Buscar o crear categoría (inteligencia: ID, nombre)
     */
    private function buscarOCrearCategoria(string $valor): ?Categoria
    {
        if (empty($valor)) {
            return null;
        }

        $valorNormalizado = $this->normalizarTexto($valor);

        // Intentar buscar por ID si es numérico
        if (is_numeric($valor)) {
            $categoria = Categoria::find((int) $valor);
            if ($categoria && $categoria->activo) {
                return $categoria;
            }
        }

        // Buscar por nombre (case-insensitive)
        $categoria = Categoria::whereRaw('LOWER(nombre) = ?', [$valorNormalizado])
            ->where('activo', true)
            ->first();

        if ($categoria) {
            return $categoria;
        }

        // Crear nueva categoría
        $categoria = Categoria::create([
            'nombre' => $valor,
            'activo' => true,
        ]);

        return $categoria;
    }

    /**
     * Buscar o crear marca (inteligencia: ID, nombre)
     */
    private function buscarOCrearMarca(string $valor): ?Marca
    {
        if (empty($valor)) {
            return null;
        }

        $valorNormalizado = $this->normalizarTexto($valor);

        // Intentar buscar por ID si es numérico
        if (is_numeric($valor)) {
            $marca = Marca::find((int) $valor);
            if ($marca && $marca->activo) {
                return $marca;
            }
        }

        // Buscar por nombre (case-insensitive)
        $marca = Marca::whereRaw('LOWER(nombre) = ?', [$valorNormalizado])
            ->where('activo', true)
            ->first();

        if ($marca) {
            return $marca;
        }

        // Crear nueva marca
        $marca = Marca::create([
            'nombre' => $valor,
            'activo' => true,
        ]);

        return $marca;
    }

    /**
     * Buscar almacén (inteligencia: ID, nombre) - NO CREA
     */
    private function buscarAlmacen(string $valor): ?Almacen
    {
        if (empty($valor)) {
            return null;
        }

        $valorNormalizado = $this->normalizarTexto($valor);

        // Intentar buscar por ID si es numérico
        if (is_numeric($valor)) {
            $almacen = Almacen::where('id', (int) $valor)
                ->where('activo', true)
                ->first();
            if ($almacen) {
                return $almacen;
            }
        }

        // Buscar por nombre (case-insensitive)
        $almacen = Almacen::whereRaw('LOWER(nombre) = ?', [$valorNormalizado])
            ->where('activo', true)
            ->first();

        return $almacen;
    }

    /**
     * Crear precios para un producto
     */
    private function crearPreciosProducto(Producto $producto, array $datosFila): void
    {
        // Precio de costo (tipo_precio id=1)
        if (!empty($datosFila['precio_costo'])) {
            PrecioProducto::create([
                'producto_id' => $producto->id,
                'tipo_precio_id' => 1, // COSTO
                'nombre' => 'Precio de Costo',
                'precio' => (float) $datosFila['precio_costo'],
                'es_precio_base' => true,
                'activo' => true,
                'fecha_inicio' => now()->toDateString(),
            ]);
        }

        // Precio de venta (tipo_precio id=2)
        if (!empty($datosFila['precio_venta'])) {
            PrecioProducto::create([
                'producto_id' => $producto->id,
                'tipo_precio_id' => 2, // VENTA
                'nombre' => 'Precio de Venta',
                'precio' => (float) $datosFila['precio_venta'],
                'es_precio_base' => false,
                'activo' => true,
                'fecha_inicio' => now()->toDateString(),
            ]);
        }
    }

    /**
     * Actualizar precios de un producto existente
     */
    private function actualizarPreciosProducto(Producto $producto, array $datosFila): void
    {
        // Actualizar/crear precio de costo
        if (!empty($datosFila['precio_costo'])) {
            $precioCosto = PrecioProducto::where('producto_id', $producto->id)
                ->where('tipo_precio_id', 1)
                ->first();

            if ($precioCosto) {
                $precioCosto->update(['precio' => (float) $datosFila['precio_costo']]);
            } else {
                PrecioProducto::create([
                    'producto_id' => $producto->id,
                    'tipo_precio_id' => 1,
                    'nombre' => 'Precio de Costo',
                    'precio' => (float) $datosFila['precio_costo'],
                    'es_precio_base' => true,
                    'activo' => true,
                    'fecha_inicio' => now()->toDateString(),
                ]);
            }
        }

        // Actualizar/crear precio de venta
        if (!empty($datosFila['precio_venta'])) {
            $precioVenta = PrecioProducto::where('producto_id', $producto->id)
                ->where('tipo_precio_id', 2)
                ->first();

            if ($precioVenta) {
                $precioVenta->update(['precio' => (float) $datosFila['precio_venta']]);
            } else {
                PrecioProducto::create([
                    'producto_id' => $producto->id,
                    'tipo_precio_id' => 2,
                    'nombre' => 'Precio de Venta',
                    'precio' => (float) $datosFila['precio_venta'],
                    'es_precio_base' => false,
                    'activo' => true,
                    'fecha_inicio' => now()->toDateString(),
                ]);
            }
        }
    }

    /**
     * Parsear fecha de vencimiento con soporte a formato MM/YYYY (farmacéutico)
     *
     * Soporta múltiples formatos:
     * - DD/MM/YYYY o DD-MM-YYYY (fecha completa)
     * - YYYY-MM-DD (ISO)
     * - MM/YYYY o MM-YYYY (farmacéutico - convierte a último día del mes)
     * - M/YYYY o M-YYYY (mes sin padding)
     *
     * Para formatos de mes/año (ej: 05-2027), convierte al último día del mes
     * porque es cuando el medicamento realmente expira
     */
    private function parsearFechaVencimiento(?string $fechaStr): ?string
    {
        if (empty($fechaStr)) {
            return null;
        }

        $fechaStr = trim($fechaStr);

        // Formato 1: DD/MM/YYYY o DD-MM-YYYY (fecha completa)
        if (preg_match('/^(\d{1,2})([\/-])(\d{1,2})\2(\d{4})$/', $fechaStr, $matches)) {
            [$_, $dia, , $mes, $año] = $matches;
            return sprintf('%s-%s-%s', $año, str_pad($mes, 2, '0', STR_PAD_LEFT), str_pad($dia, 2, '0', STR_PAD_LEFT));
        }

        // Formato 2: YYYY-MM-DD (ISO, retornar tal cual)
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaStr)) {
            return $fechaStr;
        }

        // Formato 3: MM/YYYY o MM-YYYY o M/YYYY o M-YYYY (mes/año farmacéutico)
        // Convertir al ÚLTIMO día del mes
        if (preg_match('/^(\d{1,2})([\/-])(\d{4})$/', $fechaStr, $matches)) {
            [$_, $mes, , $año] = $matches;
            $mesNum = intval($mes);
            $añoNum = intval($año);

            // Calcular último día del mes
            // Usar día 0 del siguiente mes para obtener el último día del mes actual
            $ultimoDia = (int) date('d', mktime(0, 0, 0, $mesNum + 1, 0, $añoNum));

            return sprintf(
                '%s-%s-%s',
                $año,
                str_pad($mes, 2, '0', STR_PAD_LEFT),
                str_pad($ultimoDia, 2, '0', STR_PAD_LEFT)
            );
        }

        // Si no coincide con ningún formato válido, retornar null
        return null;
    }

    /**
     * Obtener la empresa del contexto actual
     *
     * Prioridad de obtención:
     * 1. Parámetro empresa_id en request
     * 2. Usuario autenticado (si existe)
     * 3. Empresa principal del sistema
     * 4. null si no hay empresa disponible
     *
     * @param Request $request
     * @return Empresa|null
     */
    private function obtenerEmpresa(Request $request): ?Empresa
    {
        // 1. Buscar empresa_id explícito en request
        if ($request->has('empresa_id')) {
            $empresaId = $request->integer('empresa_id');
            return Empresa::find($empresaId);
        }

        // 2. Si hay usuario autenticado, obtener su empresa (si está disponible)
        $user = Auth::user();
        if ($user) {
            // Si el usuario tiene una empresa asignada (relación custom), usarla
            // Por ahora asumimos que usa la empresa principal
            // TODO: Implementar relación user-empresa si es necesario
            return Empresa::principal();
        }

        // 3. Retornar empresa principal como fallback
        return Empresa::principal();
    }

    /**
     * Limpia y valida caracteres UTF-8 en una cadena
     * Evita errores de "Malformed UTF-8 characters" durante serialización JSON
     *
     * @param string|null $valor Valor a limpiar
     * @return string|null Valor limpio o null si estaba vacío
     */
    private function limpiarUTF8(?string $valor): ?string
    {
        if (empty($valor)) {
            return null;
        }

        // Verificar si ya es UTF-8 válido
        if (mb_check_encoding($valor, 'UTF-8')) {
            return $valor;
        }

        // Si no es UTF-8 válido, intentar convertir desde latin1 (encoding más común)
        $convertido = iconv('ISO-8859-1', 'UTF-8//IGNORE', $valor);
        if ($convertido !== false) {
            return $convertido;
        }

        // Fallback: eliminar caracteres inválidos
        return mb_convert_encoding($valor, 'UTF-8', 'UTF-8');
    }

    /**
     * Obtener productos paginados para carga de inventario inicial
     */
    public function getPaginados(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 30);
        $page = $request->get('page', 1);
        $search = $request->get('search', '');
        $barcode = $request->get('barcode', null);

        // Nuevos filtros
        $proveedorId = $request->get('proveedor_id');
        $marcaId = $request->get('marca_id');
        $categoriaId = $request->get('categoria_id');
        $stockStatus = $request->get('stock_status'); // 'bajo', 'alto', 'sin_stock'
        $precioStatus = $request->get('precio_status'); // 'con_precio', 'sin_precio'

        $query = Producto::where('activo', true)
            ->with(['categoria:id,nombre', 'marca:id,nombre', 'proveedor:id,nombre', 'unidad:id,codigo,nombre', 'stocks']);

        // Búsqueda por código de barras si se proporciona
        if ($barcode) {
            $query->orWhereHas('codigosBarra', function ($q) use ($barcode) {
                $q->where('codigo', 'like', "%{$barcode}%");
            });
        }

        // Búsqueda por nombre, SKU o código
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhereHas('codigosBarra', function ($subQ) use ($search) {
                      $subQ->where('codigo', 'like', "%{$search}%");
                  });
            });
        }

        // Filtro por proveedor
        if ($proveedorId) {
            $query->where('proveedor_id', $proveedorId);
        }

        // Filtro por marca
        if ($marcaId) {
            $query->where('marca_id', $marcaId);
        }

        // Filtro por categoría
        if ($categoriaId) {
            $query->where('categoria_id', $categoriaId);
        }

        // Filtro por precio
        if ($precioStatus === 'sin_precio') {
            $query->whereNull('precio_venta');
        } elseif ($precioStatus === 'con_precio') {
            $query->whereNotNull('precio_venta');
        }

        // Paginar primero
        $productos = $query
            ->select('id', 'nombre', 'sku', 'categoria_id', 'marca_id', 'proveedor_id', 'unidad_medida_id', 'stock_minimo', 'precio_venta')
            ->orderBy('nombre')
            ->paginate($perPage, ['*'], 'page', $page);

        // Filtro por estado de stock (post-paginación, en memory)
        if ($stockStatus) {
            $items = $productos->items();
            $items = array_filter($items, function($producto) use ($stockStatus) {
                $stockTotal = $producto->stocks?->sum('cantidad') ?? 0;
                $stockMinimo = $producto->stock_minimo ?? 0;

                switch($stockStatus) {
                    case 'bajo':
                        return $stockTotal > 0 && $stockTotal <= $stockMinimo;
                    case 'sin_stock':
                        return $stockTotal <= 0;
                    case 'alto':
                        return $stockTotal > $stockMinimo;
                    default:
                        return true;
                }
            });
            $productos->setCollection(collect($items));
        }

        // Mapear resultados
        $items = $productos->items();
        $items = collect($items)->map(function ($producto) {
            // Calcular stock total
            $stockTotal = $producto->stocks?->sum('cantidad') ?? 0;

            return [
                'id'           => $producto->id,
                'nombre'       => $producto->nombre,
                'sku'          => $producto->sku,
                'categoria'    => $producto->categoria?->nombre,
                'marca'        => $producto->marca?->nombre,
                'proveedor'    => $producto->proveedor?->nombre,
                'unidad'       => $producto->unidad?->codigo,
                'stock_minimo' => $producto->stock_minimo,
                'stock_total'  => $stockTotal,
                'precio_venta' => $producto->precio_venta,
            ];
        })->toArray();

        return response()->json([
            'data'     => $items,
            'total'    => $productos->total(),
            'per_page' => $productos->perPage(),
            'current_page' => $productos->currentPage(),
            'last_page' => $productos->lastPage(),
            'from'     => $productos->firstItem(),
            'to'       => $productos->lastItem(),
        ]);
    }

    /**
     * Obtener datos para los filtros (proveedores, marcas, categorías)
     */
    public function getFiltrosData(): JsonResponse
    {
        return response()->json([
            'proveedores' => \App\Models\Proveedor::where('activo', true)
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'marcas' => \App\Models\Marca::where('activo', true)
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'categorias' => \App\Models\Categoria::where('activo', true)
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get(),
        ]);
    }
}
