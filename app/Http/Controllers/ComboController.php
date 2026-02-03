<?php

namespace App\Http\Controllers;

use App\Models\ComboItem;
use App\Models\Producto;
use App\Models\PrecioProducto;
use App\Models\TipoPrecio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ComboController extends Controller
{
    public function index(): Response
    {
        $combos = Producto::where('es_combo', true)
            ->when(auth()->user()?->empresa_id, fn($q, $id) => $q->where('empresa_id', $id))
            ->with('comboItems.producto:id,nombre,sku')
            ->orderByDesc('id')
            ->paginate(15)
            ->through(function (Producto $combo) {
                return [
                    'id'             => $combo->id,
                    'nombre'         => $combo->nombre,
                    'sku'            => $combo->sku,
                    'precio_venta'   => (float) $combo->precio_venta,
                    'subtotal_costo' => round($combo->comboItems->sum(
                        fn($item) => (float) $item->precio_unitario * (float) $item->cantidad
                    ), 2),
                    'cantidad_items' => $combo->comboItems->count(),
                    'activo'         => $combo->activo,
                ];
            });

        return Inertia::render('combos/index', ['combos' => $combos]);
    }

    public function create(): Response
    {
        return Inertia::render('combos/form', $this->formProps());
    }

    public function store(Request $request): RedirectResponse
    {
        $this->validarRequest($request);

        $combo = null;

        DB::transaction(function () use ($request, &$combo) {
            $this->validarItems($request->items);

            $combo = Producto::create([
                'sku'            => $request->sku,
                'nombre'         => $request->nombre,
                'descripcion'    => $request->descripcion,
                'precio_venta'   => $request->precio_venta,
                'es_combo'       => true,
                'activo'         => true,
                'empresa_id'     => auth()->user()?->empresa_id,
                'fecha_creacion' => now(),
            ]);

            $this->crearItems($combo->id, $request->items);

            // Crear precios para el combo (venta y costo con el mismo valor)
            $this->crearPreciosProducto($combo->id, $request->precio_venta);

            Log::info('✅ [ComboController::store] Combo creado', [
                'combo_id'       => $combo->id,
                'sku'            => $combo->sku,
                'cantidad_items' => count($request->items),
            ]);
        });

        return redirect()->route('combos.index')
            ->with('success', "Combo \"{$combo->nombre}\" creado exitosamente.");
    }

    public function show(Producto $combo): Response
    {
        abort_unless($combo->es_combo, 404);
        $combo->load('comboItems.producto:id,nombre,sku', 'comboItems.tipoPrecio:id,nombre');

        return Inertia::render('combos/show', ['combo' => $this->serializarCombo($combo)]);
    }

    public function edit(Producto $combo): Response
    {
        abort_unless($combo->es_combo, 404);
        $combo->load('comboItems.producto:id,nombre,sku', 'comboItems.tipoPrecio:id,nombre');

        return Inertia::render('combos/form', array_merge(
            $this->formProps(),
            ['combo' => $this->serializarCombo($combo)]
        ));
    }

    public function update(Request $request, Producto $combo): RedirectResponse
    {
        abort_unless($combo->es_combo, 404);
        $this->validarRequest($request);

        DB::transaction(function () use ($request, $combo) {
            $this->validarItems($request->items, comboId: $combo->id);

            $combo->update([
                'sku'            => $request->sku,
                'nombre'         => $request->nombre,
                'descripcion'    => $request->descripcion,
                'precio_venta'   => $request->precio_venta,
            ]);

            // Delete-and-recreate atómico (mismo patrón que codigos_barra en ProductoController)
            $combo->comboItems()->delete();
            $this->crearItems($combo->id, $request->items);

            // Actualizar precios del combo (eliminar antiguos y crear nuevos)
            $combo->precios()->delete();
            $this->crearPreciosProducto($combo->id, $request->precio_venta);

            Log::info('✅ [ComboController::update] Combo actualizado', [
                'combo_id'       => $combo->id,
                'sku'            => $combo->sku,
                'cantidad_items' => count($request->items),
            ]);
        });

        return redirect()->route('combos.index')
            ->with('success', "Combo \"{$combo->nombre}\" actualizado exitosamente.");
    }

    public function destroy(Producto $combo): RedirectResponse
    {
        abort_unless($combo->es_combo, 404);
        $combo->delete(); // cascade borra combo_items

        return redirect()->route('combos.index')
            ->with('success', 'Combo eliminado exitosamente.');
    }

    // ── Privados ────────────────────────────────────────────────

    private function validarRequest(Request $request): void
    {
        $request->validate([
            'sku'                    => ['required', 'string', 'min:2', 'max:255'],
            'nombre'                 => ['required', 'string', 'min:2', 'max:255'],
            'descripcion'            => ['nullable', 'string', 'max:1000'],
            'precio_venta'           => ['required', 'numeric', 'min:0'],
            'items'                  => ['required', 'array', 'min:1'],
            'items.*.producto_id'    => ['required', 'integer', 'exists:productos,id'],
            'items.*.cantidad'       => ['required', 'numeric', 'min:0.01'],
            'items.*.precio_unitario'=> ['required', 'numeric', 'min:0'],
            'items.*.tipo_precio_id' => ['nullable', 'integer', 'exists:tipos_precio,id'],
        ]);
    }

    private function validarItems(array $items, ?int $comboId = null): void
    {
        $productosIds = array_column($items, 'producto_id');

        if (count($productosIds) !== count(array_unique($productosIds))) {
            abort(422, 'No se puede agregar el mismo producto dos veces al combo.');
        }

        if ($comboId && in_array($comboId, $productosIds)) {
            abort(422, 'Un combo no puede contener a sí mismo.');
        }

        $otrosCombos = Producto::whereIn('id', $productosIds)->where('es_combo', true)->pluck('nombre');
        if ($otrosCombos->isNotEmpty()) {
            abort(422, 'Los siguientes son combos y no pueden ser componentes: ' . $otrosCombos->implode(', '));
        }

        $inactivos = Producto::whereIn('id', $productosIds)->where('activo', false)->pluck('nombre');
        if ($inactivos->isNotEmpty()) {
            abort(422, 'Productos inactivos: ' . $inactivos->implode(', '));
        }
    }

    private function crearItems(int $comboId, array $items): void
    {
        foreach ($items as $item) {
            ComboItem::create([
                'combo_id'        => $comboId,
                'producto_id'     => $item['producto_id'],
                'cantidad'        => $item['cantidad'],
                'precio_unitario' => $item['precio_unitario'],
                'tipo_precio_id'  => $item['tipo_precio_id'] ?? null,
            ]);
        }
    }

    private function crearPreciosProducto(int $comboId, float $precioVenta): void
    {
        // Obtener los tipos de precio para "venta" y "costo"
        $tipoVenta = TipoPrecio::activos()->where('es_ganancia', true)->first();
        $tipoCosto = TipoPrecio::activos()->where('es_ganancia', false)->first();

        // Si existe tipo venta, crear precio para venta
        if ($tipoVenta) {
            PrecioProducto::create([
                'producto_id'    => $comboId,
                'tipo_precio_id' => $tipoVenta->id,
                'precio'         => $precioVenta,
                'activo'         => true,
            ]);
        }

        // Si existe tipo costo, crear precio para costo (mismo valor)
        if ($tipoCosto) {
            PrecioProducto::create([
                'producto_id'    => $comboId,
                'tipo_precio_id' => $tipoCosto->id,
                'precio'         => $precioVenta,
                'activo'         => true,
            ]);
        }
    }

    private function formProps(): array
    {
        return [
            'tipos_precio' => TipoPrecio::activos()->ordenados()->get(['id', 'nombre', 'codigo'])->toArray(),
        ];
    }

    private function serializarCombo(Producto $combo): array
    {
        return [
            'id'           => $combo->id,
            'nombre'       => $combo->nombre,
            'descripcion'  => $combo->descripcion,
            'precio_venta' => (float) $combo->precio_venta,
            'activo'       => $combo->activo,
            'items'        => $combo->comboItems->map(fn(ComboItem $item) => [
                'producto_id'        => $item->producto_id,
                'producto_nombre'    => $item->producto?->nombre,
                'producto_sku'       => $item->producto?->sku,
                'cantidad'           => (float) $item->cantidad,
                'precio_unitario'    => (float) $item->precio_unitario,
                'tipo_precio_id'     => $item->tipo_precio_id,
                'tipo_precio_nombre' => $item->tipoPrecio?->nombre,
            ])->values()->toArray(),
        ];
    }
}
