<?php
/**
 * Script de diagnóstico para verificar si los movimientos existen en la BD
 *
 * Uso:
 *   php artisan tinker < diagnostico_movimientos.php
 * O copiar y pegar línea por línea en `php artisan tinker`
 */

// 1️⃣ Buscar movimientos de VEN20260212-0206
echo "\n🔍 Buscando movimientos de VEN20260212-0206...\n";
$movimientos = \App\Models\MovimientoInventario::where('numero_documento', 'VEN20260212-0206')
    ->orderBy('created_at', 'desc')
    ->get();

echo "Resultados encontrados: " . $movimientos->count() . "\n";
foreach ($movimientos as $mov) {
    echo "  ✅ ID: {$mov->id}, Tipo: {$mov->tipo}, Stock: {$mov->stock_producto_id}, Cantidad: {$mov->cantidad}, Created: {$mov->created_at}\n";
    if ($mov->observacion) {
        echo "     JSON: " . substr($mov->observacion, 0, 100) . "...\n";
    }
}

// 2️⃣ Buscar movimientos tipo CONSUMO_RESERVA (últimos 10)
echo "\n🔍 Buscando movimientos tipo CONSUMO_RESERVA (últimos 10)...\n";
$consumos = \App\Models\MovimientoInventario::where('tipo', 'CONSUMO_RESERVA')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

echo "Resultados encontrados: " . $consumos->count() . "\n";
foreach ($consumos as $mov) {
    echo "  ✅ Número: {$mov->numero_documento}, Stock: {$mov->stock_producto_id}, Cantidad: {$mov->cantidad}, Created: {$mov->created_at}\n";
}

// 3️⃣ Verificar reservas_proforma tabla
echo "\n🔍 Verificando estado de reservas de la proforma 126...\n";
$reservas = \App\Models\ReservaProforma::where('proforma_id', 126)->get();
echo "Total de reservas encontradas: " . $reservas->count() . "\n";
foreach ($reservas as $res) {
    echo "  📌 ID: {$res->id}, Stock: {$res->stock_producto_id}, Estado: {$res->estado}, Cantidad: {$res->cantidad_reservada}\n";
}

// 4️⃣ Verificar venta 206
echo "\n🔍 Verificando venta 206...\n";
$venta = \App\Models\Venta::find(206);
if ($venta) {
    echo "  ✅ Venta encontrada: {$venta->numero}, Total: {$venta->total}\n";
    echo "     Cliente: {$venta->cliente->nombre}\n";
    echo "     Detalles: " . $venta->detalles->count() . " items\n";
} else {
    echo "  ❌ Venta 206 no encontrada\n";
}

// 5️⃣ Contar total de movimientos en BD
echo "\n📊 Estadísticas generales...\n";
$totalMovimientos = \App\Models\MovimientoInventario::count();
$totalConsumo = \App\Models\MovimientoInventario::where('tipo', 'CONSUMO_RESERVA')->count();
$totalReservas = \App\Models\ReservaProforma::count();

echo "  Total movimientos: $totalMovimientos\n";
echo "  Total movimientos CONSUMO_RESERVA: $totalConsumo\n";
echo "  Total reservas: $totalReservas\n";

echo "\n✅ Diagnóstico completado\n";
