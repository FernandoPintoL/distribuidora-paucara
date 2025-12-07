<?php
// Simple Laravel artisan script to check data
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TEST DATA CHECK ===\n\n";

$pending = DB::table('ventas')
    ->where('estado_logistico', 'PENDIENTE_ENVIO')
    ->where('requiere_envio', true)
    ->select('id', 'numero', 'estado_logistico', 'requiere_envio', 'fecha_entrega_comprometida', 'cliente_id')
    ->get();

echo "Total PENDIENTE_ENVIO + requiere_envio=true: " . count($pending) . "\n";
echo "List:\n";
foreach ($pending as $v) {
    echo "  ID: {$v->id} | Numero: {$v->numero} | Fecha: {$v->fecha_entrega_comprometida}\n";
}

echo "\n--- Searching by delivery date ---\n";
$tomorrow_date = '2025-12-07';
$tomorrow = DB::table('ventas')
    ->where('estado_logistico', 'PENDIENTE_ENVIO')
    ->where('requiere_envio', true)
    ->whereDate('fecha_entrega_comprometida', $tomorrow_date)
    ->select('id', 'numero', 'fecha_entrega_comprometida', 'cliente_id')
    ->get();

echo "Ventas for {$tomorrow_date}: " . count($tomorrow) . "\n";
foreach ($tomorrow as $v) {
    echo "  ID: {$v->id} | Numero: {$v->numero} | Fecha: {$v->fecha_entrega_comprometida}\n";
}

echo "\n--- All delivery dates ---\n";
$all_dates = DB::table('ventas')
    ->where('estado_logistico', 'PENDIENTE_ENVIO')
    ->where('requiere_envio', true)
    ->select('fecha_entrega_comprometida')
    ->distinct()
    ->get();

foreach ($all_dates as $d) {
    echo "  - {$d->fecha_entrega_comprometida}\n";
}
?>
