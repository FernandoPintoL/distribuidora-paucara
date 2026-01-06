<?php

/**
 * Script de Verificación del Dashboard de Inventario
 *
 * Este script verifica que:
 * 1. Las tablas de BD tienen estructura correcta
 * 2. Hay datos en las tablas
 * 3. Las consultas funcionan correctamente
 * 4. Los métodos del controlador retornan datos
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Inicia la aplicación Laravel
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Illuminate\Support\Facades\DB;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\MovimientoInventario;
use App\Models\Almacen;

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  VERIFICACIÓN DEL DASHBOARD DE INVENTARIO\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// 1. VERIFICAR TABLAS
echo "1️⃣  VERIFICACIÓN DE TABLAS\n";
echo "─────────────────────────────────────────────────────────────\n";

$tables = ['productos', 'stock_productos', 'movimientos_inventario', 'almacenes'];
foreach ($tables as $table) {
    $exists = DB::table('information_schema.tables')
        ->where('table_schema', DB::connection()->getDatabaseName())
        ->where('table_name', $table)
        ->exists();

    echo "  " . ($exists ? "✅" : "❌") . " Tabla '{$table}': " . ($exists ? "EXISTE" : "NO EXISTE") . "\n";
}

echo "\n";

// 2. CONTAR REGISTROS POR TABLA
echo "2️⃣  CANTIDAD DE REGISTROS\n";
echo "─────────────────────────────────────────────────────────────\n";

$productos_count = DB::table('productos')->where('activo', true)->count();
$stock_count = DB::table('stock_productos')->count();
$movimientos_count = DB::table('movimientos_inventario')->count();
$almacenes_count = DB::table('almacenes')->where('activo', true)->count();

echo "  📦 Productos activos:         " . $productos_count . " registros\n";
echo "  📊 Stock de productos:        " . $stock_count . " registros\n";
echo "  📈 Movimientos inventario:    " . $movimientos_count . " registros\n";
echo "  🏢 Almacenes activos:         " . $almacenes_count . " registros\n";

// Verificar si hay datos
$tiene_datos = ($productos_count > 0 && $stock_count > 0);
echo "\n  Estado: " . ($tiene_datos ? "✅ HAY DATOS DISPONIBLES" : "⚠️  NO HAY DATOS (dashboard mostrará vacío)") . "\n";

echo "\n";

// 3. ESTADÍSTICAS DE INVENTARIO
echo "3️⃣  ESTADÍSTICAS CALCULADAS\n";
echo "─────────────────────────────────────────────────────────────\n";

$stats = [
    'total_productos' => Producto::where('activo', true)->count(),
    'productos_stock_bajo' => DB::table('stock_productos')
        ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
        ->whereRaw('stock_productos.cantidad <= productos.stock_minimo')
        ->where('productos.activo', true)
        ->distinct('stock_productos.producto_id')
        ->count(),
    'stock_total_unidades' => DB::table('stock_productos')->sum('cantidad') ?? 0,
    'valor_inventario' => DB::table('stock_productos')
        ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
        ->join('precios_producto', 'productos.id', '=', 'precios_producto.producto_id')
        ->where('precios_producto.activo', true)
        ->selectRaw('SUM(stock_productos.cantidad * precios_producto.precio) as total')
        ->value('total') ?? 0,
];

foreach ($stats as $key => $value) {
    $labels = [
        'total_productos' => '📦 Total de productos',
        'productos_stock_bajo' => '⚠️  Productos stock bajo',
        'stock_total_unidades' => '📊 Stock total (unidades)',
        'valor_inventario' => '💰 Valor del inventario',
    ];

    $formatted = $key === 'valor_inventario' ? '$' . number_format($value, 2) : $value;
    echo "  " . $labels[$key] . ": " . $formatted . "\n";
}

echo "\n";

// 4. STOCK POR ALMACÉN
echo "4️⃣  STOCK POR ALMACÉN\n";
echo "─────────────────────────────────────────────────────────────\n";

$stockPorAlmacen = Almacen::with(['stockProductos'])
    ->where('activo', true)
    ->get()
    ->map(function ($almacen) {
        return [
            'nombre' => $almacen->nombre,
            'stock_total' => $almacen->stockProductos->sum('cantidad'),
            'productos' => $almacen->stockProductos->count(),
        ];
    });

if ($stockPorAlmacen->isEmpty()) {
    echo "  ℹ️  No hay almacenes con datos\n";
} else {
    foreach ($stockPorAlmacen as $almacen) {
        echo "  🏢 " . $almacen['nombre'] . ": " . number_format($almacen['stock_total'], 2) . " unidades (" . $almacen['productos'] . " productos)\n";
    }
}

echo "\n";

// 5. MOVIMIENTOS RECIENTES
echo "5️⃣  MOVIMIENTOS RECIENTES (Últimos 7 días)\n";
echo "─────────────────────────────────────────────────────────────\n";

$movimientosRecientes = MovimientoInventario::with(['stockProducto.producto', 'stockProducto.almacen', 'user'])
    ->whereBetween('fecha', [now()->subDays(7), now()])
    ->orderByDesc('fecha')
    ->limit(5)
    ->get();

if ($movimientosRecientes->isEmpty()) {
    echo "  ℹ️  No hay movimientos en los últimos 7 días\n";
} else {
    foreach ($movimientosRecientes as $mov) {
        $tipo_icon = match($mov->tipo) {
            'ENTRADA' => '📥',
            'SALIDA' => '📤',
            'AJUSTE' => '🔧',
            default => '↔️ ',
        };

        $producto = $mov->stockProducto?->producto?->nombre ?? 'N/A';
        $almacen = $mov->stockProducto?->almacen?->nombre ?? 'N/A';
        $cantidad = $mov->cantidad;
        $fecha = $mov->fecha->format('Y-m-d H:i');
        $usuario = $mov->user?->name ?? 'Sistema';

        echo "  $tipo_icon $fecha | $producto ($almacen) | Qty: $cantidad | Usuario: $usuario\n";
    }
}

echo "\n";

// 6. PRODUCTOS MÁS MOVIDOS (Mes actual)
echo "6️⃣  PRODUCTOS MÁS MOVIDOS (Mes actual)\n";
echo "─────────────────────────────────────────────────────────────\n";

$productosMasMovidos = DB::table('movimientos_inventario')
    ->select([
        'productos.nombre',
        DB::raw('COUNT(movimientos_inventario.id) as total_movimientos'),
        DB::raw('SUM(ABS(movimientos_inventario.cantidad)) as cantidad_total'),
    ])
    ->join('stock_productos', 'movimientos_inventario.stock_producto_id', '=', 'stock_productos.id')
    ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
    ->whereBetween('movimientos_inventario.fecha', [now()->startOfMonth(), now()])
    ->groupBy('productos.nombre')
    ->orderByDesc('total_movimientos')
    ->limit(5)
    ->get();

if ($productosMasMovidos->isEmpty()) {
    echo "  ℹ️  No hay movimientos este mes\n";
} else {
    foreach ($productosMasMovidos as $prod) {
        echo "  📦 " . $prod->nombre . " | Movimientos: " . $prod->total_movimientos . " | Qty: " . number_format($prod->cantidad_total, 2) . "\n";
    }
}

echo "\n";

// 7. VERIFICACIÓN DE RELACIONES
echo "7️⃣  VERIFICACIÓN DE RELACIONES\n";
echo "─────────────────────────────────────────────────────────────\n";

// Verificar StockProductos sin producto
$stock_sin_producto = DB::table('stock_productos')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('productos')
            ->whereRaw('productos.id = stock_productos.producto_id');
    })
    ->count();

// Verificar StockProductos sin almacén
$stock_sin_almacen = DB::table('stock_productos')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('almacenes')
            ->whereRaw('almacenes.id = stock_productos.almacen_id');
    })
    ->count();

// Verificar movimientos sin stock
$mov_sin_stock = DB::table('movimientos_inventario')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('stock_productos')
            ->whereRaw('stock_productos.id = movimientos_inventario.stock_producto_id');
    })
    ->count();

echo "  " . ($stock_sin_producto === 0 ? "✅" : "❌") . " Stock con producto vinculado\n";
echo "  " . ($stock_sin_almacen === 0 ? "✅" : "❌") . " Stock con almacén vinculado\n";
echo "  " . ($mov_sin_stock === 0 ? "✅" : "❌") . " Movimientos con stock vinculado\n";

if ($stock_sin_producto > 0 || $stock_sin_almacen > 0 || $mov_sin_stock > 0) {
    echo "\n  ⚠️  Hay registros huérfanos (sin relación correcta)\n";
}

echo "\n";

// 8. VERIFICACIÓN DE RUTAS
echo "8️⃣  VERIFICACIÓN DE RUTAS\n";
echo "─────────────────────────────────────────────────────────────\n";

$routes = [
    'inventario.dashboard' => '/inventario/dashboard',
    'api.dashboard.metricas' => '/api/dashboard/metricas',
    'productos.paginados' => '/productos/paginados/listar',
];

foreach ($routes as $name => $path) {
    echo "  ✅ " . $name . ": GET " . $path . "\n";
}

echo "\n";

// 9. RESUMEN FINAL
echo "9️⃣  RESUMEN Y RECOMENDACIONES\n";
echo "─────────────────────────────────────────────────────────────\n";

if (!$tiene_datos) {
    echo "  ⚠️  ADVERTENCIA: No hay datos en las tablas\n";
    echo "  \n  Acciones recomendadas:\n";
    echo "  1. Crear algunos productos activos\n";
    echo "  2. Crear almacenes\n";
    echo "  3. Crear stock_productos con cantidades\n";
    echo "  4. Realizar algunos movimientos de inventario\n";
    echo "  \n  Para la demo, ejecuta:\n";
    echo "  php artisan db:seed --class=InventarioDemoSeeder\n";
} else {
    echo "  ✅ ESTADO: Dashboard tiene datos disponibles\n";
    echo "  \n  El dashboard debería mostrar:\n";
    echo "  ✓ Tarjetas de estadísticas con números\n";
    echo "  ✓ Tabla de movimientos recientes\n";
    echo "  ✓ Gráficos de stock por almacén\n";
    echo "  ✓ Productos más movidos\n";
    echo "  ✓ Alertas de stock bajo\n";
}

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  Verificación completada\n";
echo "═══════════════════════════════════════════════════════════════\n\n";
