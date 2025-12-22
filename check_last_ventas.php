<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Verificando últimas ventas creadas...\n\n";

$ventas = \App\Models\Venta::with('direccionCliente')->latest()->take(8)->get();

foreach ($ventas as $venta) {
    echo "Venta #{$venta->id} (#{$venta->numero})\n";
    echo "  Cliente ID: {$venta->cliente_id}\n";
    echo "  DireccionCliente ID: " . ($venta->direccion_cliente_id ?? 'NULL') . "\n";

    if ($venta->direccionCliente) {
        echo "  ✅ DireccionCliente encontrada:\n";
        echo "      Latitud: {$venta->direccionCliente->latitud}\n";
        echo "      Longitud: {$venta->direccionCliente->longitud}\n";
        echo "      Dirección: {$venta->direccionCliente->direccion}\n";
    } else {
        echo "  ❌ Sin DireccionCliente\n";
    }
    echo "\n";
}
