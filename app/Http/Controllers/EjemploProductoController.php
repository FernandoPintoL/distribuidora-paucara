<?php

namespace App\Http\Controllers;

use App\Http\Traits\BaseCrudTrait;
use App\Models\Producto;
use App\Models\Categoria;
use App\Models\Marca;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EjemploProductoController extends Controller
{
    use BaseCrudTrait;

    /**
     * Configuración específica para el CRUD de productos
     */
    protected function getCrudConfig(): array
    {
        return [
            'model' => Producto::class,
            'resource_name' => 'producto',
            'resource_name_plural' => 'productos',
            'view_prefix' => 'productos.',
            'index_view' => 'index',
            'form_view' => 'form',
            'show_view' => 'show',
            'per_page' => 20,
            'api_per_page' => 50,
            'search_fields' => ['nombre', 'codigo', 'descripcion'],
            'order_fields' => ['id', 'nombre', 'precio', 'created_at'],
            'default_order_by' => 'nombre',
            'default_order_dir' => 'asc',
            'api_default_order_by' => 'nombre',
            'api_default_order_dir' => 'asc',
            'with_relations' => ['categoria', 'marca'],
            'api_with_relations' => ['categoria', 'marca', 'stock', 'imagenes'],
            'filters' => [
                [
                    'field' => 'activo',
                    'param' => 'activo',
                    'type' => 'boolean'
                ],
                [
                    'field' => 'categoria_id',
                    'param' => 'categoria_id',
                    'type' => 'equals'
                ],
                [
                    'field' => 'marca_id',
                    'param' => 'marca_id',
                    'type' => 'equals'
                ],
                [
                    'field' => 'precio',
                    'start_param' => 'precio_min',
                    'end_param' => 'precio_max',
                    'type' => 'between'
                ],
                [
                    'field' => 'stock_disponible',
                    'start_param' => 'stock_min',
                    'end_param' => 'stock_max',
                    'type' => 'between'
                ]
            ],
            'validation_rules' => [
                'nombre' => 'required|string|max:255',
                'codigo' => 'required|string|max:50',
                'descripcion' => 'nullable|string|max:1000',
                'precio' => 'required|numeric|min:0',
                'precio_compra' => 'nullable|numeric|min:0',
                'categoria_id' => 'required|exists:categorias,id',
                'marca_id' => 'nullable|exists:marcas,id',
                'activo' => 'boolean',
                'stock_minimo' => 'nullable|integer|min:0',
                'stock_maximo' => 'nullable|integer|min:0',
            ],
            'store_validation_rules' => [
                'codigo' => 'required|string|max:50|unique:productos,codigo',
                'imagen_principal' => 'nullable|image|max:5120',
                'imagenes_adicionales' => 'nullable|array|max:5',
                'imagenes_adicionales.*' => 'image|max:5120',
            ],
            'update_validation_rules' => [
                'codigo' => 'required|string|max:50|unique:productos,codigo,{id}',
                'imagen_principal' => 'nullable|image|max:5120',
                'imagenes_adicionales' => 'nullable|array|max:5',
                'imagenes_adicionales.*' => 'image|max:5120',
            ],
            'soft_delete' => true,
            'before_store' => [$this, 'beforeStoreProducto'],
            'after_store' => [$this, 'afterStoreProducto'],
            'before_update' => [$this, 'beforeUpdateProducto'],
            'after_update' => [$this, 'afterUpdateProducto'],
            'before_destroy' => [$this, 'beforeDestroyProducto'],
        ];
    }

    /**
     * Callback antes de crear producto
     */
    public function beforeStoreProducto(array $data, Request $request): array
    {
        // Agregar usuario que crea el producto
        $data['usuario_creacion_id'] = Auth::id();
        
        // Generar código automático si no se proporciona
        if (empty($data['codigo'])) {
            $data['codigo'] = $this->generarCodigoProducto();
        }
        
        // Establecer stock inicial
        $data['stock_disponible'] = $request->input('stock_inicial', 0);
        
        return $data;
    }

    /**
     * Callback después de crear producto
     */
    public function afterStoreProducto(Producto $producto, Request $request): void
    {
        // Crear registro de stock inicial
        $producto->stock()->create([
            'cantidad' => $request->input('stock_inicial', 0),
            'tipo' => 'inicial',
            'usuario_id' => Auth::id(),
            'observaciones' => 'Stock inicial del producto'
        ]);

        // Procesar imágenes
        $this->procesarImagenes($producto, $request);

        // Log de auditoría
        \Log::info("Producto creado", [
            'producto_id' => $producto->id,
            'usuario_id' => Auth::id(),
            'datos' => $producto->toArray()
        ]);
    }

    /**
     * Callback antes de actualizar producto
     */
    public function beforeUpdateProducto(array $data, Request $request, Producto $producto): array
    {
        // Verificar si el código cambió y actualizar referencias
        if ($data['codigo'] !== $producto->codigo) {
            $this->actualizarReferenciasCodigo($producto->codigo, $data['codigo']);
        }
        
        return $data;
    }

    /**
     * Callback después de actualizar producto
     */
    public function afterUpdateProducto(Producto $producto, Request $request): void
    {
        // Procesar nuevas imágenes
        $this->procesarImagenes($producto, $request);

        // Actualizar stock si cambió
        if ($request->has('stock_disponible')) {
            $producto->stock()->create([
                'cantidad' => $request->input('stock_disponible'),
                'tipo' => 'ajuste',
                'usuario_id' => Auth::id(),
                'observaciones' => 'Ajuste manual de stock'
            ]);
        }

        // Log de auditoría
        \Log::info("Producto actualizado", [
            'producto_id' => $producto->id,
            'usuario_id' => Auth::id(),
            'cambios' => $producto->getChanges()
        ]);
    }

    /**
     * Callback antes de eliminar producto
     */
    public function beforeDestroyProducto(Producto $producto)
    {
        // Verificar si tiene ventas asociadas
        if ($producto->ventas()->exists()) {
            return $this->errorResponse(
                'No se puede eliminar el producto porque tiene ventas asociadas',
                null, null, [], 400
            );
        }

        // Verificar si tiene stock pendiente
        if ($producto->stock_disponible > 0) {
            return $this->errorResponse(
                'No se puede eliminar el producto porque tiene stock disponible',
                null, null, [], 400
            );
        }

        return true; // Permitir eliminación
    }

    /**
     * Obtiene datos adicionales para la vista index
     */
    protected function getIndexAdditionalData(Request $request): array
    {
        return [
            'filters' => $request->only([
                'q', 'activo', 'categoria_id', 'marca_id', 
                'precio_min', 'precio_max', 'stock_min', 'stock_max'
            ]),
            'categorias' => Categoria::where('activo', true)
                                    ->orderBy('nombre')
                                    ->get(['id', 'nombre']),
            'marcas' => Marca::where('activo', true)
                            ->orderBy('nombre')
                            ->get(['id', 'nombre']),
            'estadisticas' => [
                'total_productos' => Producto::count(),
                'productos_activos' => Producto::where('activo', true)->count(),
                'productos_sin_stock' => Producto::where('stock_disponible', 0)->count(),
                'productos_stock_bajo' => Producto::whereColumn('stock_disponible', '<=', 'stock_minimo')->count(),
            ]
        ];
    }

    /**
     * Obtiene datos para el formulario de creación
     */
    protected function getCreateFormData(): array
    {
        return [
            'producto' => null,
            'categorias' => Categoria::where('activo', true)
                                    ->orderBy('nombre')
                                    ->get(['id', 'nombre']),
            'marcas' => Marca::where('activo', true)
                            ->orderBy('nombre')
                            ->get(['id', 'nombre']),
        ];
    }

    /**
     * Obtiene datos para el formulario de edición
     */
    protected function getEditFormData(Producto $producto): array
    {
        return [
            'producto' => $producto->load(['categoria', 'marca', 'imagenes']),
            'categorias' => Categoria::where('activo', true)
                                    ->orderBy('nombre')
                                    ->get(['id', 'nombre']),
            'marcas' => Marca::where('activo', true)
                            ->orderBy('nombre')
                            ->get(['id', 'nombre']),
            'historial_stock' => $producto->stock()
                                        ->with('usuario')
                                        ->orderByDesc('created_at')
                                        ->limit(10)
                                        ->get(),
        ];
    }

    /**
     * Obtiene la ruta del índice
     */
    protected function getIndexRoute(): string
    {
        return 'productos.index';
    }

    // ================================
    // MÉTODOS API ESPECÍFICOS
    // ================================

    /**
     * API: Buscar productos para autocompletado
     */
    public function buscarApi(Request $request)
    {
        $q = $request->string('q');
        $limite = $request->integer('limite', 10);

        if (!$q || strlen($q) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        // Convertir búsqueda a minúsculas para hacer búsqueda case-insensitive
        $searchLower = strtolower($q);
        $productos = Producto::select(['id', 'nombre', 'codigo', 'precio', 'stock_disponible'])
            ->where('activo', true)
            ->where(function ($query) use ($searchLower) {
                $query->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(codigo) like ?', ["%$searchLower%"]);
            })
            ->limit($limite)
            ->get();

        return response()->json(['success' => true, 'data' => $productos]);
    }

    /**
     * API: Obtener productos con stock bajo
     */
    public function stockBajoApi(Request $request)
    {
        $productos = Producto::with(['categoria', 'marca'])
            ->where('activo', true)
            ->whereColumn('stock_disponible', '<=', 'stock_minimo')
            ->orderBy('stock_disponible')
            ->get();

        return response()->json(['success' => true, 'data' => $productos]);
    }

    /**
     * API: Actualizar stock masivo
     */
    public function actualizarStockMasivoApi(Request $request)
    {
        $request->validate([
            'productos' => 'required|array',
            'productos.*.id' => 'required|exists:productos,id',
            'productos.*.stock' => 'required|integer|min:0',
            'productos.*.observaciones' => 'nullable|string|max:500',
        ]);

        $productosActualizados = [];

        foreach ($request->input('productos') as $productoData) {
            $producto = Producto::find($productoData['id']);
            
            if ($producto) {
                $stockAnterior = $producto->stock_disponible;
                $producto->update(['stock_disponible' => $productoData['stock']]);
                
                // Registrar movimiento de stock
                $producto->stock()->create([
                    'cantidad' => $productoData['stock'] - $stockAnterior,
                    'tipo' => 'ajuste_masivo',
                    'usuario_id' => Auth::id(),
                    'observaciones' => $productoData['observaciones'] ?? 'Ajuste masivo de stock'
                ]);

                $productosActualizados[] = $producto;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock actualizado exitosamente',
            'data' => $productosActualizados
        ]);
    }

    // ================================
    // MÉTODOS PRIVADOS AUXILIARES
    // ================================

    /**
     * Genera un código único para el producto
     */
    private function generarCodigoProducto(): string
    {
        do {
            $codigo = 'PRD-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (Producto::where('codigo', $codigo)->exists());

        return $codigo;
    }

    /**
     * Procesa las imágenes del producto
     */
    private function procesarImagenes(Producto $producto, Request $request): void
    {
        // Procesar imagen principal
        if ($request->hasFile('imagen_principal')) {
            $this->procesarImagenPrincipal($producto, $request->file('imagen_principal'));
        }

        // Procesar imágenes adicionales
        if ($request->hasFile('imagenes_adicionales')) {
            $this->procesarImagenesAdicionales($producto, $request->file('imagenes_adicionales'));
        }
    }

    /**
     * Procesa la imagen principal
     */
    private function procesarImagenPrincipal(Producto $producto, $imagen): void
    {
        // Eliminar imagen anterior si existe
        if ($producto->imagen_principal) {
            Storage::disk('public')->delete($producto->imagen_principal);
        }

        // Guardar nueva imagen
        $folderName = "productos/{$producto->id}";
        $path = $imagen->store($folderName, 'public');
        
        $producto->update(['imagen_principal' => $path]);
    }

    /**
     * Procesa las imágenes adicionales
     */
    private function procesarImagenesAdicionales(Producto $producto, array $imagenes): void
    {
        $folderName = "productos/{$producto->id}/adicionales";
        
        foreach ($imagenes as $imagen) {
            $path = $imagen->store($folderName, 'public');
            
            $producto->imagenes()->create([
                'ruta' => $path,
                'tipo' => 'adicional',
                'orden' => $producto->imagenes()->count() + 1
            ]);
        }
    }

    /**
     * Actualiza referencias de código en otras tablas
     */
    private function actualizarReferenciasCodigo(string $codigoAnterior, string $codigoNuevo): void
    {
        // Actualizar en ventas, compras, etc.
        // Implementar según las relaciones específicas de tu aplicación
    }
}
