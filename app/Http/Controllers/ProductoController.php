<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\ImagenProducto;
use App\Models\Marca;
use App\Models\UnidadMedida;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\CodigoBarra;
use App\Models\TipoPrecio; // Cambiar de enum a modelo
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductoController extends Controller
{
    public function index(Request $request): Response
    {
        $q = (string) $request->string('q');
        $categoriaId = $request->integer('categoria_id');
        $marcaId = $request->integer('marca_id');

        $items = Producto::query()
            ->with(['categoria:id,nombre', 'marca:id,nombre', 'unidad:id,codigo,nombre'])
            ->when($q, function ($qq) use ($q) {
                $qq->where('nombre', 'ilike', "%$q%")
                   ->orWhere('codigo_barras', 'ilike', "%$q%");
            })
            ->when($categoriaId, fn($qq)=> $qq->where('categoria_id', $categoriaId))
            ->when($marcaId, fn($qq)=> $qq->where('marca_id', $marcaId))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $categorias = Categoria::query()->orderBy('nombre')->get(['id','nombre']);
        $marcas = Marca::query()->orderBy('nombre')->get(['id','nombre']);

        return Inertia::render('productos/index', [
            'productos' => $items,
            'filters' => [
                'q' => $q,
                'categoria_id' => $categoriaId ?: null,
                'marca_id' => $marcaId ?: null,
            ],
            'categorias' => $categorias,
            'marcas' => $marcas,
            'unidades' => UnidadMedida::orderBy('nombre')->get(['id','codigo','nombre']),
            'tipos_precio' => \App\Models\TipoPrecio::getOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('productos/form', [
            'producto' => null,
            'categorias' => Categoria::orderBy('nombre')->get(['id','nombre']),
            'marcas' => Marca::orderBy('nombre')->get(['id','nombre']),
            'unidades' => UnidadMedida::orderBy('nombre')->get(['id','codigo','nombre']),
            'tipos_precio' => \App\Models\TipoPrecio::getOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tiposPrecios = TipoPrecio::activos()->pluck('id')->toArray();

        // Manejo simplificado y robusto de códigos
        $requestData = $request->all();

        // Procesar códigos de manera más simple
        if (isset($requestData['codigos'])) {
            $codigosLimpios = [];

            // Si no es array, convertir a array
            if (!is_array($requestData['codigos'])) {
                $requestData['codigos'] = [];
            }

            foreach ($requestData['codigos'] as $item) {
                $codigoString = '';

                // Extraer string del código independientemente del formato
                if (is_string($item)) {
                    $codigoString = trim($item);
                } elseif (is_array($item)) {
                    // Si es array, buscar la clave 'codigo' o tomar el primer valor válido
                    if (isset($item['codigo']) && is_string($item['codigo'])) {
                        $codigoString = trim($item['codigo']);
                    } elseif (!empty($item)) {
                        // Tomar el primer valor que sea string
                        foreach ($item as $value) {
                            if (is_string($value) && !empty(trim($value))) {
                                $codigoString = trim($value);
                                break;
                            }
                        }
                    }
                } else {
                    // Si es otro tipo, intentar convertir a string
                    $codigoString = (string) $item;
                }

                // Solo agregar si no está vacío
                if (!empty($codigoString)) {
                    $codigosLimpios[] = $codigoString;
                }
            }

            $requestData['codigos'] = $codigosLimpios;
        }

        $data = $request->merge($requestData)->validate([
            'nombre' => ['required','string','max:255'],
            'descripcion' => ['nullable','string'],
            'peso' => ['nullable','numeric','min:0'],
            'unidad_medida_id' => ['nullable','exists:unidades_medida,id'],
            'numero' => ['nullable','string','max:255'],
            'fecha_vencimiento' => ['nullable','date'],
            'categoria_id' => ['nullable','exists:categorias,id'],
            'marca_id' => ['nullable','exists:marcas,id'],
            'precios' => ['nullable','array'],
            'precios.*.nombre' => ['required_with:precios.*','string','max:100'],
            'precios.*.monto' => ['required_with:precios.*','numeric','min:0'],
            'precios.*.tipo_precio_id' => ['sometimes','integer','in:' . implode(',', $tiposPrecios)],
            'codigos' => ['nullable','array'],
            'codigos.*' => ['string','max:255'],
            'perfil' => ['nullable','file','image','max:4096'],
            'galeria' => ['nullable','array'],
            'galeria.*' => ['file','image','max:4096'],
            'activo' => ['nullable','boolean'],
        ]);

        $producto = null;

        DB::transaction(function () use ($data, $request, &$producto) {
            // Filtrar y limpiar códigos válidos de manera más robusta
            $codigosValidos = [];
            if (isset($data['codigos']) && is_array($data['codigos'])) {
                foreach ($data['codigos'] as $codigo) {
                    // Asegurarse de que el código sea un string y no esté vacío
                    if (is_string($codigo) && !empty(trim($codigo))) {
                        $codigosValidos[] = trim($codigo);
                    }
                }
            }

            // También verificar si hay códigos en el request directamente (fallback)
            if (empty($codigosValidos) && $request->has('codigos')) {
                $requestCodigos = $request->get('codigos');
                if (is_array($requestCodigos)) {
                    foreach ($requestCodigos as $codigo) {
                        if (is_string($codigo) && !empty(trim($codigo))) {
                            $codigosValidos[] = trim($codigo);
                        }
                    }
                }
            }

            // Crear el producto
            $producto = Producto::create([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'peso' => $data['peso'] ?? 0,
                'unidad_medida_id' => $data['unidad_medida_id'] ?? null,
                'codigo_barras' => null,
                'codigo_qr' => null,
                'stock_minimo' => 0,
                'stock_maximo' => 0,
                'activo' => $data['activo'] ?? true,
                'es_alquilable' => false,
                'categoria_id' => $data['categoria_id'] ?? null,
                'marca_id' => $data['marca_id'] ?? null,
            ]);

            // Gestionar códigos de barra usando la nueva tabla
            if (!empty($codigosValidos)) {
                foreach ($codigosValidos as $index => $codigo) {
                    CodigoBarra::create([
                        'producto_id' => $producto->id,
                        'codigo' => trim($codigo),
                        'tipo' => 'EAN', // Por defecto EAN
                        'es_principal' => $index === 0, // El primero es principal
                        'activo' => true,
                    ]);
                }
                // Actualizar el campo legacy con el código principal
                $producto->update(['codigo_barras' => $codigosValidos[0]]);
            } else {
                // Si no hay códigos, crear uno con el ID del producto
                CodigoBarra::create([
                    'producto_id' => $producto->id,
                    'codigo' => (string)$producto->id,
                    'tipo' => 'INTERNAL',
                    'es_principal' => true,
                    'activo' => true,
                ]);
                // Actualizar el campo legacy
                $producto->update(['codigo_barras' => (string)$producto->id]);
            }

            // Precios mejorados usando la nueva tabla de tipos de precio
            if (!empty($data['precios']) && is_array($data['precios'])) {
                foreach ($data['precios'] as $p) {
                    if (empty($p['monto']) || empty($p['nombre'])) continue;

                    // Determinar tipo de precio ID
                    $tipoPrecioId = $p['tipo_precio_id'] ?? $this->determinarTipoPrecioId($p['nombre']);
                    $tipoPrecio = TipoPrecio::find($tipoPrecioId);

                    PrecioProducto::create([
                        'producto_id' => $producto->id,
                        'nombre' => $p['nombre'],
                        'precio' => $p['monto'],
                        'tipo_precio_id' => $tipoPrecioId,
                        'es_precio_base' => $tipoPrecio ? $tipoPrecio->es_precio_base : false,
                        'activo' => true,
                        'fecha_ultima_actualizacion' => now(),
                    ]);
                }
            }

            // imágenes: perfil + galería
            $orden = 0;
            if ($request->hasFile('perfil')) {
                $file = $request->file('perfil');
                $path = $file->store('productos', 'public');
                ImagenProducto::create([
                    'producto_id' => $producto->id,
                    'url' => Storage::disk('public')->url($path),
                    'es_principal' => true,
                    'orden' => $orden++,
                ]);
            }
            if ($request->hasFile('galeria')) {
                foreach ($request->file('galeria') as $file) {
                    $path = $file->store('productos', 'public');
                    ImagenProducto::create([
                        'producto_id' => $producto->id,
                        'url' => Storage::disk('public')->url($path),
                        'es_principal' => false,
                        'orden' => $orden++,
                    ]);
                }
            }
        });

        return redirect()->route('productos.index')->with('success', 'Producto creado correctamente');
    }

    public function edit(Producto $producto): Response
    {
        $producto->load([
            'imagenes' => function($q){ $q->orderBy('orden'); },
            'codigosBarra' => function($q){ $q->where('activo', true)->orderBy('es_principal', 'desc'); }
        ]);

        // Adapt payload for frontend form structure
        $perfil = $producto->imagenes->firstWhere('es_principal', true);
        $galeria = $producto->imagenes->where('es_principal', false)->values()->map(function($img){ return ['id'=>$img->id, 'url'=>$img->url]; });
        $precios = $producto->precios()->where('activo', true)->orderByDesc('id')->get()->map(fn($pr)=> ['id'=>$pr->id, 'nombre'=>$pr->nombre ?? 'Precio General', 'monto'=>$pr->precio]);

        // Obtener códigos de barra de la nueva tabla
        $codigos = $producto->codigosBarra->map(function($cb) {
            return ['codigo' => $cb->codigo, 'tipo' => $cb->tipo, 'es_principal' => $cb->es_principal];
        });

        // Obtener precios con información de tipo y ganancia usando el nuevo modelo
        $precios = $producto->precios()
            ->where('activo', true)
            ->with('tipoPrecio')
            ->get()
            ->sortBy(function($precio) {
                return $precio->tipoPrecio ? $precio->tipoPrecio->orden : 999;
            })
            ->map(function($pr) {
                $tipoPrecioInfo = $pr->getTipoPrecioInfo();
                return [
                    'id' => $pr->id,
                    'nombre' => $pr->nombre ?? $tipoPrecioInfo['nombre'],
                    'monto' => $pr->precio,
                    'tipo_precio_id' => $pr->tipo_precio_id,
                    'tipo_precio_info' => $tipoPrecioInfo,
                    'margen_ganancia' => $pr->margen_ganancia,
                    'porcentaje_ganancia' => $pr->porcentaje_ganancia,
                ];
            })
            ->values();

        $payload = [
            'id' => $producto->id,
            'nombre' => $producto->nombre,
            'descripcion' => $producto->descripcion,
            'sku' => null,
            'numero' => null,
            'categoria_id' => $producto->categoria_id,
            'marca_id' => $producto->marca_id,
            'peso' => $producto->peso,
            'unidad_medida_id' => $producto->unidad_medida_id,
            'fecha_vencimiento' => null,
            'activo' => $producto->activo,
            'perfil' => $perfil ? ['id'=>$perfil->id, 'url'=>$perfil->url] : null,
            'galeria' => $galeria,
            'precios' => $precios,
            'codigos' => $codigos->isNotEmpty() ? $codigos->toArray() : [['codigo' => '']],
        ];

        return Inertia::render('productos/form', [
            'producto' => $payload,
            'categorias' => Categoria::orderBy('nombre')->get(['id','nombre']),
            'marcas' => Marca::orderBy('nombre')->get(['id','nombre']),
            'unidades' => UnidadMedida::orderBy('nombre')->get(['id','codigo','nombre']),
            'tipos_precio' => TipoPrecio::getOptions(),
        ]);
    }

    public function update(Request $request, Producto $producto): RedirectResponse
    {
        $tiposPrecios = TipoPrecio::activos()->pluck('id')->toArray();

        $data = $request->validate([
            'nombre' => ['required','string','max:255'],
            'descripcion' => ['nullable','string'],
            'peso' => ['nullable','numeric','min:0'],
            'unidad_medida_id' => ['nullable','exists:unidades_medida,id'],
            'numero' => ['nullable','string','max:255'],
            'fecha_vencimiento' => ['nullable','date'],
            'categoria_id' => ['nullable','exists:categorias,id'],
            'marca_id' => ['nullable','exists:marcas,id'],
            'precios' => ['nullable','array'],
            'precios.*.nombre' => ['required','string','max:100'],
            'precios.*.monto' => ['required','numeric','min:0'],
            'precios.*.tipo_precio_id' => ['sometimes','integer','in:' . implode(',', $tiposPrecios)],
            'codigos' => ['nullable','array'],
            'codigos.*' => ['nullable','string','max:255'],
            'perfil' => ['nullable','file','image','max:4096'],
            'galeria' => ['nullable','array'],
            'galeria.*' => ['file','image','max:4096'],
            'activo' => ['nullable','boolean'],
        ]);

        DB::transaction(function () use ($data, $request, $producto) {
            // Filtrar códigos válidos (no vacíos)
            $codigosValidos = [];
            if (!empty($data['codigos']) && is_array($data['codigos'])) {
                $codigosValidos = array_filter($data['codigos'], function($codigo) {
                    return !empty(trim($codigo));
                });
            }

            // Actualizar información básica del producto
            $producto->update([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'peso' => $data['peso'] ?? 0,
                'unidad_medida_id' => $data['unidad_medida_id'] ?? null,
                'categoria_id' => $data['categoria_id'] ?? null,
                'marca_id' => $data['marca_id'] ?? null,
                'activo' => $data['activo'] ?? true,
            ]);

            // Gestionar códigos de barra usando la nueva tabla
            // Primero desactivar todos los códigos existentes
            $producto->codigosBarra()->update(['activo' => false]);

            if (!empty($codigosValidos)) {
                foreach ($codigosValidos as $index => $codigo) {
                    // Verificar si ya existe este código para este producto
                    $codigoExistente = $producto->codigosBarra()
                        ->where('codigo', trim($codigo))
                        ->first();

                    if ($codigoExistente) {
                        // Reactivar código existente
                        $codigoExistente->update([
                            'es_principal' => $index === 0,
                            'activo' => true
                        ]);
                    } else {
                        // Crear nuevo código
                        CodigoBarra::create([
                            'producto_id' => $producto->id,
                            'codigo' => trim($codigo),
                            'tipo' => 'EAN',
                            'es_principal' => $index === 0,
                            'activo' => true,
                        ]);
                    }
                }
                // Actualizar el campo legacy con el código principal
                $producto->update(['codigo_barras' => $codigosValidos[0]]);
            } else {
                // Si no hay códigos válidos, mantener el actual o crear uno con ID
                $codigoPrincipal = $producto->codigosBarra()->principal()->first();
                if (!$codigoPrincipal) {
                    CodigoBarra::create([
                        'producto_id' => $producto->id,
                        'codigo' => (string)$producto->id,
                        'tipo' => 'INTERNAL',
                        'es_principal' => true,
                        'activo' => true,
                    ]);
                    $producto->update(['codigo_barras' => (string)$producto->id]);
                }
            }

            // precios: strategy simple = desactivar todos y crear nuevos activos
            $producto->precios()->update(['activo' => false]);
            if (!empty($data['precios']) && is_array($data['precios'])) {
                foreach ($data['precios'] as $p) {
                    if (empty($p['monto']) || empty($p['nombre'])) continue;

                    // Determinar tipo de precio ID
                    $tipoPrecioId = $p['tipo_precio_id'] ?? $this->determinarTipoPrecioId($p['nombre']);
                    $tipoPrecio = TipoPrecio::find($tipoPrecioId);

                    PrecioProducto::create([
                        'producto_id' => $producto->id,
                        'nombre' => $p['nombre'],
                        'precio' => $p['monto'],
                        'tipo_precio_id' => $tipoPrecioId,
                        'es_precio_base' => $tipoPrecio ? $tipoPrecio->es_precio_base : false,
                        'activo' => true,
                        'fecha_ultima_actualizacion' => now(),
                    ]);
                }
            }

            // imágenes: si viene perfil, reemplazamos el principal
            if ($request->hasFile('perfil')) {
                ImagenProducto::where('producto_id', $producto->id)->update(['es_principal' => false]);
                $file = $request->file('perfil');
                $path = $file->store('productos', 'public');
                ImagenProducto::create([
                    'producto_id' => $producto->id,
                    'url' => Storage::disk('public')->url($path),
                    'es_principal' => true,
                    'orden' => 0,
                ]);
            }
            // anexar galería
            if ($request->hasFile('galeria')) {
                $currentMaxOrden = (int) ($producto->imagenes()->max('orden') ?? -1);
                foreach ($request->file('galeria') as $idx => $file) {
                    $path = $file->store('productos', 'public');
                    ImagenProducto::create([
                        'producto_id' => $producto->id,
                        'url' => Storage::disk('public')->url($path),
                        'es_principal' => false,
                        'orden' => $currentMaxOrden + 1 + $idx,
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
}
