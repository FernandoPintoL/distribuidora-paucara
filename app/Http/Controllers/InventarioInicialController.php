<?php
namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\TipoAjustInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InventarioInicialController extends Controller
{
    /**
     * Mostrar la página de carga masiva de inventario inicial
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
        $tipoInventarioInicial = TipoAjustInventario::where('clave', 'INVENTARIO_INICIAL')->firstOrFail();

        return Inertia::render('inventario/inventario-inicial', [
            'productos'             => $productos,
            'almacenes'             => $almacenes,
            'tipoInventarioInicial' => $tipoInventarioInicial,
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
        $tipoInventarioInicial = TipoAjustInventario::where('clave', 'INVENTARIO_INICIAL')->firstOrFail();

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
     * Verificar si un producto ya tiene inventario inicial cargado
     */
    private function tieneInventarioInicial(int $productoId): bool
    {
        $tipoInventarioInicial = TipoAjustInventario::where('clave', 'INVENTARIO_INICIAL')->first();

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
