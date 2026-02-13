<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockProducto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StockApiController extends Controller
{
    /**
     * Preparar datos de stock para impresión
     * Guarda los datos filtrados en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresion(Request $request)
    {
        try {
            $validated = $request->validate([
                'stock'           => 'required|array',
                'almacen_filtro'  => 'nullable|string',
                'busqueda_filtro' => 'nullable|string',
            ]);

            // Guardar en sesión
            session([
                'stock_impresion'   => $validated['stock'],
                'almacen_filtro'    => $validated['almacen_filtro'],
                'busqueda_filtro'   => $validated['busqueda_filtro'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos preparados para impresión',
                'cantidad' => count($validated['stock']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preparar datos de movimientos para impresión
     * Filtra movimientos en el backend y guarda en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresionMovimientos(Request $request)
    {
        try {
            $validated = $request->validate([
                'filtros' => 'nullable|array',
                'formato' => 'nullable|string',
            ]);

            $filtros = $validated['filtros'] ?? [];

            // ✅ NUEVO: Hacer el filtrado en el backend
            \Log::info('📋 [prepararImpresionMovimientos] Filtros recibidos:', $filtros);

            // Excluir parámetros que no son filtros
            $parametrosExcluir = ['page', 'per_page', 'sort', 'order', 'all', 'print'];
            $filtros = array_diff_key($filtros, array_flip($parametrosExcluir));

            // Usar MovimientoInventario model para filtrar
            $query = \App\Models\MovimientoInventario::with([
                'stockProducto:id,producto_id,almacen_id,cantidad,cantidad_disponible',
                'stockProducto.producto:id,nombre,sku,es_combo',
                'stockProducto.almacen:id,nombre',
                'user:id,name,email',
                'tipoAjusteInventario:id,label',
                'tipoMerma:id,label',
                'estadoMerma:id,label',
            ]);

            // ✅ Aplicar filtros dinámicamente
            if (!empty($filtros['almacen_id'])) {
                $query->whereHas('stockProducto', fn($q) => $q->where('almacen_id', $filtros['almacen_id']));
            }

            // Filtrar por producto_id (ID exacto) o producto_busqueda (búsqueda flexible)
            if (!empty($filtros['producto_id'])) {
                $query->whereHas('stockProducto', fn($q) =>
                    $q->where('producto_id', $filtros['producto_id'])
                );
            } elseif (!empty($filtros['producto_busqueda'])) {
                // Búsqueda flexible: nombre, SKU, código principal
                $busqueda = $filtros['producto_busqueda'];
                $query->whereHas('stockProducto.producto', fn($q) =>
                    $q->where('nombre', 'ilike', '%' . $busqueda . '%')
                        ->orWhere('sku', 'ilike', '%' . $busqueda . '%')
                        ->orWhereHas('codigoPrincipal', fn($sq) =>
                            $sq->where('codigo', 'ilike', '%' . $busqueda . '%')
                        )
                );
            }

            if (!empty($filtros['tipo'])) {
                $query->where('tipo', $filtros['tipo']);
            }

            // Filtrar por número de documento (búsqueda flexible)
            if (!empty($filtros['numero_documento'])) {
                $query->where('numero_documento', 'ilike', '%' . $filtros['numero_documento'] . '%');
            }

            if (!empty($filtros['user_id'])) {
                $query->where('user_id', $filtros['user_id']);
            }
            if (!empty($filtros['tipo_ajuste_inventario_id'])) {
                $query->where('tipo_ajuste_inventario_id', $filtros['tipo_ajuste_inventario_id']);
            }
            if (!empty($filtros['tipo_merma_id'])) {
                $query->where('tipo_merma_id', $filtros['tipo_merma_id']);
            }
            if (!empty($filtros['estado_merma_id'])) {
                $query->where('estado_merma_id', $filtros['estado_merma_id']);
            }
            // ✅ CORREGIDO: Usar created_at en lugar de fecha para obtener todos los movimientos
            // Soportar ambos nombres: fecha_desde/fecha_hasta y fecha_inicio/fecha_fin
            $fechaDesde = $filtros['fecha_desde'] ?? $filtros['fecha_inicio'] ?? null;
            $fechaHasta = $filtros['fecha_hasta'] ?? $filtros['fecha_fin'] ?? null;

            if (!empty($fechaDesde)) {
                $query->whereDate('created_at', '>=', $fechaDesde);
            }
            if (!empty($fechaHasta)) {
                $query->whereDate('created_at', '<=', $fechaHasta);
            }

            // Ordenar por fecha (más reciente primero)
            $query->orderByDesc('created_at')->orderByDesc('id');

            $movimientos = $query->get();

            \Log::info('📋 [prepararImpresionMovimientos] Movimientos obtenidos:', [
                'cantidad' => $movimientos->count(),
                'ids' => $movimientos->pluck('id')->toArray(),
                'filtros_aplicados' => array_filter($filtros, fn($v) => $v !== '' && $v !== null)
            ]);

            // ✅ Guardar en sesión
            session([
                'movimientos_impresion' => $movimientos,
                'movimientos_filtros'   => $filtros,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Se prepararon {$movimientos->count()} movimientos para impresión",
                'cantidad_movimientos' => $movimientos->count(),
                'movimiento_ids' => $movimientos->pluck('id')->toArray(),
                'filtros_aplicados' => array_filter($filtros, fn($v) => $v !== '' && $v !== null),
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ [prepararImpresionMovimientos] Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preparar datos de ventas para impresión
     * Guarda los datos filtrados en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresionVentas(Request $request)
    {
        try {
            $validated = $request->validate([
                'filtros' => 'nullable|array',
                'formato' => 'nullable|string',
            ]);

            $filtros = $validated['filtros'] ?? [];

            // ✅ NUEVO: Hacer el filtrado en el backend
            \Log::info('📋 [prepararImpresionVentas] Filtros recibidos:', $filtros);

            // Excluir parámetros que no son filtros
            $parametrosExcluir = ['page', 'per_page', 'sort', 'order', 'all', 'print'];
            $filtros = array_diff_key($filtros, array_flip($parametrosExcluir));

            // Usar Venta model para filtrar exactamente como lo hace ventasParaImpresion
            $query = \App\Models\Venta::with([
                'cliente:id,nombre,nit,telefono,email',
                'cliente.localidad:id,nombre',
                'usuario:id,name,email',
                'estadoDocumento:id,codigo,nombre',
                'moneda:id,codigo,nombre,simbolo',
                'tipoPago:id,nombre',
                'estadoLogistica:id,codigo,nombre',
                'detalles.producto:id,nombre,sku,es_combo',
                'detalles.producto.codigoPrincipal:id,codigo',
            ]);

            // ✅ Aplicar filtros dinámicamente (idéntico a VentaController::ventasParaImpresion)
            if (!empty($filtros['id'])) {
                $query->where('id', $filtros['id']);
            }
            if (!empty($filtros['numero'])) {
                $query->where('numero', 'like', '%' . $filtros['numero'] . '%');
            }
            if (!empty($filtros['cliente_id'])) {
                $query->where('cliente_id', $filtros['cliente_id']);
            }
            if (!empty($filtros['estado_documento_id'])) {
                $query->where('estado_documento_id', $filtros['estado_documento_id']);
            }
            if (!empty($filtros['usuario_id'])) {
                $query->where('usuario_id', $filtros['usuario_id']);
            }
            if (!empty($filtros['moneda_id'])) {
                $query->where('moneda_id', $filtros['moneda_id']);
            }
            if (!empty($filtros['tipo_pago_id'])) {
                $query->where('tipo_pago_id', $filtros['tipo_pago_id']);
            }
            if (!empty($filtros['estado_pago'])) {
                $query->where('estado_pago', $filtros['estado_pago']);
            }
            if (!empty($filtros['estado_logistico'])) {
                $query->where('estado_logistico', $filtros['estado_logistico']);
            }
            // ✅ CORREGIDO: Usar created_at en lugar de fecha para obtener TODAS las 22 ventas
            if (!empty($filtros['fecha_desde'])) {
                $query->whereDate('created_at', '>=', $filtros['fecha_desde']);
            }
            if (!empty($filtros['fecha_hasta'])) {
                $query->whereDate('created_at', '<=', $filtros['fecha_hasta']);
            }
            if (!empty($filtros['monto_min'])) {
                $query->where('total', '>=', (float) $filtros['monto_min']);
            }
            if (!empty($filtros['monto_max'])) {
                $query->where('total', '<=', (float) $filtros['monto_max']);
            }

            // Ordenar por fecha (más reciente primero)
            $query->orderByDesc('fecha')->orderByDesc('id');

            $ventas = $query->get();

            \Log::info('📋 [prepararImpresionVentas] Ventas obtenidas:', [
                'cantidad' => $ventas->count(),
                'ids' => $ventas->pluck('id')->toArray(),
                'filtros_aplicados' => array_filter($filtros, fn($v) => $v !== '' && $v !== null)
            ]);

            // ✅ Guardar en sesión
            session([
                'ventas_impresion' => $ventas,
                'ventas_filtros'   => $filtros,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Se prepararon {$ventas->count()} ventas para impresión",
                'cantidad_ventas' => $ventas->count(),
                'venta_ids' => $ventas->pluck('id')->toArray(),
                'filtros_aplicados' => array_filter($filtros, fn($v) => $v !== '' && $v !== null),
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ [prepararImpresionVentas] Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preparar datos de compras para impresión
     * Guarda los datos filtrados en sesión
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresionCompras(Request $request)
    {
        try {
            $validated = $request->validate([
                'compras' => 'required|array',
                'filtros' => 'nullable|array',
            ]);

            // Guardar en sesión
            session([
                'compras_impresion' => $validated['compras'],
                'compras_filtros'   => $validated['filtros'] ?? [],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos preparados para impresión',
                'cantidad' => count($validated['compras']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preparar datos de productos vendidos para impresión
     * Agrupa ventas aprobadas del día por producto
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function prepararImpresionProductosVendidos(Request $request)
    {
        try {
            $validated = $request->validate([
                'fecha' => 'nullable|date',
                'formato' => 'nullable|string',
            ]);

            // ✅ IMPORTANTE: Usar today() del servidor, no la fecha del cliente
            // El cliente puede enviar fecha en UTC, nosotros usamos la fecha local del servidor
            $fecha = today()->toDateString();

            \Log::info('📦 [prepararImpresionProductosVendidos] Preparando reporte de productos vendidos para:', ['fecha' => $fecha]);

            // Obtener ventas APROBADAS del día
            $ventas = \App\Models\Venta::with([
                'detalles.producto:id,nombre,sku',
                'estadoDocumento:id,codigo,nombre',
            ])
            ->whereHas('estadoDocumento', fn($q) => $q->where('codigo', 'APROBADO'))
            ->whereDate('created_at', $fecha)
            ->get();

            \Log::info('📦 [prepararImpresionProductosVendidos] Ventas encontradas:', ['cantidad' => $ventas->count()]);

            // Agrupar por producto y calcular totales
            $productosVendidos = [];

            foreach ($ventas as $venta) {
                foreach ($venta->detalles as $detalle) {
                    $productoId = $detalle->producto_id;
                    $productoNombre = $detalle->producto?->nombre ?? 'Producto sin nombre';

                    if (!isset($productosVendidos[$productoId])) {
                        $productosVendidos[$productoId] = [
                            'id' => $productoId,
                            'nombre' => $productoNombre,
                            'sku' => $detalle->producto?->sku ?? '-',
                            'cantidad_total' => 0,
                            'precio_unitario' => $detalle->precio_unitario,
                            'subtotal' => 0,
                            'detalles' => [], // Para referencia
                        ];
                    }

                    $cantidad = $detalle->cantidad ?? 0;
                    $precio = $detalle->precio_unitario ?? 0;
                    $subtotal = $cantidad * $precio;

                    $productosVendidos[$productoId]['cantidad_total'] += $cantidad;
                    $productosVendidos[$productoId]['subtotal'] += $subtotal;
                    $productosVendidos[$productoId]['detalles'][] = $detalle;
                }
            }

            // ✅ NUEVO: Obtener stock actual para cada producto y calcular stock inicial
            foreach ($productosVendidos as &$producto) {
                // Stock actual = suma de stock disponible en todos los almacenes
                $stockActual = \App\Models\StockProducto::where('producto_id', $producto['id'])
                    ->sum('cantidad_disponible');

                // Stock inicial = stock actual + cantidad vendida (porque se restó al vender)
                $stockInicial = $stockActual + $producto['cantidad_total'];

                $producto['stock_actual'] = (int) $stockActual;
                $producto['stock_inicial'] = (int) $stockInicial;
            }
            unset($producto);

            // Convertir a array indexado y ordenar por nombre
            $productosVendidos = array_values($productosVendidos);
            usort($productosVendidos, fn($a, $b) => strcmp($a['nombre'], $b['nombre']));

            \Log::info('📦 [prepararImpresionProductosVendidos] Productos agrupados:', [
                'cantidad_productos' => count($productosVendidos),
                'total_items' => collect($productosVendidos)->sum('cantidad_total'),
            ]);

            // Guardar en sesión
            session([
                'productos_vendidos_impresion' => $productosVendidos,
                'productos_vendidos_fecha' => $fecha,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Se prepararon " . count($productosVendidos) . " productos para impresión",
                'cantidad_productos' => count($productosVendidos),
                'total_cantidad_vendida' => collect($productosVendidos)->sum('cantidad_total'),
                'total_monto' => collect($productosVendidos)->sum('subtotal'),
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ [prepararImpresionProductosVendidos] Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar impresión: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Eliminar un lote de stock (stock_producto)
     * Permite eliminar lotes incluso si tienen movimientos asociados
     *
     * @param int $id ID del stock_producto a eliminar
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $stockProducto = StockProducto::findOrFail($id);

            // Log de auditoría
            Log::info('Eliminando lote de stock', [
                'stock_producto_id' => $id,
                'producto_id' => $stockProducto->producto_id,
                'almacen_id' => $stockProducto->almacen_id,
                'lote' => $stockProducto->lote,
                'cantidad' => $stockProducto->cantidad,
                'user_id' => auth()->id(),
            ]);

            // Eliminar el stock_producto (CASCADE eliminará movimientos asociados si está configurado)
            $stockProducto->delete();

            return response()->json([
                'success' => true,
                'message' => "Lote '{$stockProducto->lote}' eliminado correctamente",
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Intento de eliminar stock_producto no existente', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'El lote no existe',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error eliminando lote de stock', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar lote: ' . $e->getMessage(),
            ], 422);
        }
    }
}
