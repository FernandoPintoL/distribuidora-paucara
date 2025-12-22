<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "📍 Verificando coordenadas GPS...\n\n";

$total = \App\Models\DireccionCliente::count();
$conGPS = \App\Models\DireccionCliente::whereNotNull('latitud')->whereNotNull('longitud')->count();

echo "Total DireccionCliente: $total\n";
echo "Con GPS (lat/lon): $conGPS\n\n";

$ultimas = \App\Models\DireccionCliente::whereNotNull('latitud')->latest()->take(5)->get();

foreach ($ultimas as $dc) {
    echo "ID: {$dc->id}\n";
    echo "  Lat: {$dc->latitud}, Lon: {$dc->longitud}\n";
    echo "  Dir: {$dc->direccion}\n";
    echo "  Cliente: {$dc->cliente_id}\n\n";
}

// Verificar ventas con direcciones
echo "🚚 Verificando ventas...\n\n";
$ventasRecientes = \App\Models\Venta::with('direccionCliente')->latest()->take(3)->get();

foreach ($ventasRecientes as $venta) {
    echo "Venta #{$venta->id}\n";
    echo "  direccion_cliente_id: {$venta->direccion_cliente_id}\n";
    if ($venta->direccionCliente) {
        echo "  ✅ DireccionCliente cargada\n";
        echo "  Lat: {$venta->direccionCliente->latitud}, Lon: {$venta->direccionCliente->longitud}\n";
    } else {
        echo "  ❌ Sin DireccionCliente\n";
    }
    echo "\n";
}
