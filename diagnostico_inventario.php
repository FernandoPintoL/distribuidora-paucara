<?php

/**
 * Diagnóstico Detallado del Inventario
 * Busca problemas específicos en los datos
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Illuminate\Support\Facades\DB;
use App\Models\StockProducto;
use App\Models\Producto;

echo "\n📋 DIAGNÓSTICO DETALLADO DEL INVENTARIO\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// 1. Verificar stock_minimo de productos
echo "1️⃣  ANÁLISIS DE STOCK MÍNIMO\n";
echo "─────────────────────────────────────────────────────────────\n";

$productos = Producto::select('id', 'nombre', 'stock_minimo', 'activo')
    ->where('activo', true)
    ->limit(10)
    ->get();

echo "  Muestra de 10 productos:\n";
foreach ($productos as $prod) {
    echo "    • {$prod->nombre}: stock_minimo = {$prod->stock_minimo}\n";
}

$promedio_stock_minimo = DB::table('productos')
    ->where('activo', true)
    ->avg('stock_minimo');

$max_stock_minimo = DB::table('productos')
    ->where('activo', true)
    ->max('stock_minimo');

echo "\n  Estadísticas:\n";
echo "    • Stock mínimo promedio: " . number_format($promedio_stock_minimo, 2) . "\n";
echo "    • Stock mínimo máximo: " . $max_stock_minimo . "\n";

echo "\n";

// 2. Comparar cantidad actual vs stock_minimo
echo "2️⃣  ANÁLISIS DE STOCK BAJO\n";
echo "─────────────────────────────────────────────────────────────\n";

$stock_bajo_query = DB::table('stock_productos')
    ->select(
        'productos.nombre',
        'stock_productos.cantidad',
        'productos.stock_minimo',
        DB::raw('stock_productos.cantidad <= productos.stock_minimo as bajo')
    )
    ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
    ->where('productos.activo', true)
    ->orderBy('stock_productos.cantidad')
    ->limit(10);

echo "  Top 10 productos con menos stock:\n";
foreach ($stock_bajo_query->get() as $prod) {
    $estado = $prod->cantidad <= $prod->stock_minimo ? "⚠️  BAJO" : "✅ OK";
    echo "    {$estado} {$prod->nombre}: {$prod->cantidad} / {$prod->stock_minimo}\n";
}

$stock_critico = DB::table('stock_productos')
    ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
    ->where('productos.activo', true)
    ->where('stock_productos.cantidad', '<=', 0)
    ->count();

$stock_sin_disponible = DB::table('stock_productos')
    ->where('cantidad', '<=', 0)
    ->count();

echo "\n  Análisis de stock:\n";
echo "    • Productos con cantidad <= 0: " . $stock_sin_disponible . "\n";
echo "    • Productos activos con cantidad <= 0: " . $stock_critico . "\n";

echo "\n";

// 3. Verificar cantidades negativas o nulas
echo "3️⃣  ANÁLISIS DE CANTIDADES INVÁLIDAS\n";
echo "─────────────────────────────────────────────────────────────\n";

$cantidad_nula = DB::table('stock_productos')
    ->whereNull('cantidad')
    ->count();

$cantidad_negativa = DB::table('stock_productos')
    ->where('cantidad', '<', 0)
    ->count();

$cantidad_cero = DB::table('stock_productos')
    ->where('cantidad', '=', 0)
    ->count();

echo "  Cantidades inválidas:\n";
echo "    • Stock NULL: " . $cantidad_nula . " registros\n";
echo "    • Stock NEGATIVO: " . $cantidad_negativa . " registros\n";
echo "    • Stock CERO: " . $cantidad_cero . " registros\n";

if ($cantidad_nula > 0 || $cantidad_negativa > 0) {
    echo "\n  ⚠️  PROBLEMA: Hay cantidades inválidas que afectan las estadísticas\n";
}

echo "\n";

// 4. Verificar movimientos con cantidad cero
echo "4️⃣  ANÁLISIS DE MOVIMIENTOS\n";
echo "─────────────────────────────────────────────────────────────\n";

$movimientos_cero = DB::table('movimientos_inventario')
    ->where('cantidad', '=', 0)
    ->count();

$movimientos_nulos = DB::table('movimientos_inventario')
    ->whereNull('cantidad')
    ->count();

$movimientos_negativo = DB::table('movimientos_inventario')
    ->where('cantidad', '<', 0)
    ->count();

echo "  Movimientos con cantidad problemática:\n";
echo "    • Movimientos cantidad = 0: " . $movimientos_cero . " registros\n";
echo "    • Movimientos cantidad NULL: " . $movimientos_nulos . " registros\n";
echo "    • Movimientos cantidad < 0: " . $movimientos_negativo . " registros\n";

// Estadísticas de movimientos por tipo
$movimientos_por_tipo = DB::table('movimientos_inventario')
    ->select('tipo', DB::raw('COUNT(*) as cantidad'))
    ->groupBy('tipo')
    ->get();

echo "\n  Movimientos por tipo:\n";
foreach ($movimientos_por_tipo as $mov) {
    echo "    • {$mov->tipo}: {$mov->cantidad} movimientos\n";
}

echo "\n";

// 5. Verificar fecha de movimientos
echo "5️⃣  ANÁLISIS DE FECHAS DE MOVIMIENTOS\n";
echo "─────────────────────────────────────────────────────────────\n";

$movimientos_hoy = DB::table('movimientos_inventario')
    ->whereDate('fecha', today())
    ->count();

$movimientos_semana = DB::table('movimientos_inventario')
    ->whereBetween('fecha', [now()->subDays(7), now()])
    ->count();

$movimientos_mes = DB::table('movimientos_inventario')
    ->whereBetween('fecha', [now()->startOfMonth(), now()])
    ->count();

$fecha_movimiento_mas_antigua = DB::table('movimientos_inventario')
    ->min('fecha');

$fecha_movimiento_mas_reciente = DB::table('movimientos_inventario')
    ->max('fecha');

echo "  Distribución temporal:\n";
echo "    • Movimientos hoy: " . $movimientos_hoy . "\n";
echo "    • Movimientos últimos 7 días: " . $movimientos_semana . "\n";
echo "    • Movimientos mes actual: " . $movimientos_mes . "\n";
echo "    • Movimiento más antiguo: " . ($fecha_movimiento_mas_antigua ? date('Y-m-d H:i', strtotime($fecha_movimiento_mas_antigua)) : 'N/A') . "\n";
echo "    • Movimiento más reciente: " . ($fecha_movimiento_mas_reciente ? date('Y-m-d H:i', strtotime($fecha_movimiento_mas_reciente)) : 'N/A') . "\n";

echo "\n";

// 6. Verificar integridad de datos: cantidad vs cantidad_anterior + cantidad_posterior
echo "6️⃣  VERIFICACIÓN DE INTEGRIDAD DE MOVIMIENTOS\n";
echo "─────────────────────────────────────────────────────────────\n";

$movimientos_invalidos = DB::table('movimientos_inventario')
    ->select(
        'id',
        'cantidad',
        'cantidad_anterior',
        'cantidad_posterior',
        DB::raw('(cantidad_posterior - cantidad_anterior) as diferencia_calculada')
    )
    ->whereRaw('(cantidad_posterior - cantidad_anterior) != cantidad')
    ->limit(5)
    ->get();

if ($movimientos_invalidos->count() > 0) {
    echo "  ⚠️  Se encontraron movimientos con inconsistencias:\n";
    foreach ($movimientos_invalidos as $mov) {
        echo "    • ID {$mov->id}: cantidad={$mov->cantidad}, calc={$mov->diferencia_calculada}\n";
    }
} else {
    echo "  ✅ Todos los movimientos tienen integridad correcta\n";
}

echo "\n";

// 7. Reporte de salud general
echo "7️⃣  REPORTE DE SALUD DEL SISTEMA\n";
echo "─────────────────────────────────────────────────────────────\n";

$issues = [];
if ($cantidad_nula > 0) $issues[] = "Stock con cantidad NULL";
if ($cantidad_negativa > 0) $issues[] = "Stock con cantidad negativa";
if ($movimientos_nulos > 0) $issues[] = "Movimientos con cantidad NULL";
if ($movimientos_invalidos->count() > 0) $issues[] = "Movimientos con inconsistencia de datos";

if (empty($issues)) {
    echo "  ✅ ESTADO GENERAL: SALUDABLE\n";
    echo "  ✅ Los datos están íntegros y listos para el dashboard\n";
} else {
    echo "  ⚠️  ESTADO GENERAL: PROBLEMAS DETECTADOS\n";
    foreach ($issues as $issue) {
        echo "    • {$issue}\n";
    }
}

echo "\n";

// 8. Verificar que el dashboard mostrará datos
echo "8️⃣  VISTA PREVIA DE DATOS DEL DASHBOARD\n";
echo "─────────────────────────────────────────────────────────────\n";

$preview = DB::table('stock_productos')
    ->select(
        DB::raw('COUNT(DISTINCT producto_id) as total_productos'),
        DB::raw('COUNT(*) as total_registros_stock'),
        DB::raw('SUM(cantidad) as stock_total'),
        DB::raw('SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END) as productos_sin_stock'),
        DB::raw('SUM(CASE WHEN cantidad < 0 THEN 1 ELSE 0 END) as productos_stock_negativo')
    )
    ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
    ->where('productos.activo', true)
    ->first();

echo "  Datos que verá el dashboard:\n";
echo "    • Productos únicos: " . $preview->total_productos . "\n";
echo "    • Registros de stock: " . $preview->total_registros_stock . "\n";
echo "    • Stock total: " . number_format($preview->stock_total ?? 0, 2) . " unidades\n";
echo "    • Productos sin stock (0): " . ($preview->productos_sin_stock ?? 0) . "\n";
echo "    • Productos con stock negativo: " . ($preview->productos_stock_negativo ?? 0) . "\n";

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  Diagnóstico completado\n";
echo "═══════════════════════════════════════════════════════════════\n\n";
