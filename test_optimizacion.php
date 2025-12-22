<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔧 Creando entregas de prueba para optimización...\n\n";

// Obtener datos necesarios
$ventas = \App\Models\Venta::whereDoesntHave('entregas')->take(8)->get();
$vehiculo = \App\Models\Vehiculo::disponibles()->first();
$chofer = \App\Models\Empleado::where('estado', 'activo')->first();

if ($ventas->count() < 5) {
    echo "⚠️  Solo hay " . $ventas->count() . " ventas disponibles sin entregas.\n";
    echo "   Se crearán entregas con las ventas disponibles.\n\n";
}

if (!$vehiculo) {
    echo "❌ No hay vehículos disponibles\n";
    exit(1);
}

if (!$chofer) {
    echo "❌ No hay choferes activos\n";
    exit(1);
}

// Coordenadas de prueba en Cochabamba (diferentes zonas)
$direcciones = [
    ['lat' => -17.3935, 'lon' => -66.1570, 'dir' => 'Av. Heroínas #123, Zona Centro'],
    ['lat' => -17.3850, 'lon' => -66.1650, 'dir' => 'Calle Jordán #456, Zona Norte'],
    ['lat' => -17.4020, 'lon' => -66.1520, 'dir' => 'Av. Blanco Galindo Km 4, Zona Sur'],
    ['lat' => -17.3890, 'lon' => -66.1720, 'dir' => 'Calle Nataniel Aguirre #789, Zona Este'],
    ['lat' => -17.3980, 'lon' => -66.1480, 'dir' => 'Av. América #321, Zona Oeste'],
    ['lat' => -17.3920, 'lon' => -66.1610, 'dir' => 'Calle España #654, Zona Centro'],
    ['lat' => -17.3860, 'lon' => -66.1580, 'dir' => 'Av. Aroma #987, Zona Norte'],
    ['lat' => -17.4050, 'lon' => -66.1550, 'dir' => 'Av. Circunvalación #147, Zona Sur'],
];

$pesos = [50, 120, 80, 200, 45, 150, 90, 110]; // kg

$entregasCreadas = [];
$count = min($ventas->count(), count($direcciones));

for ($i = 0; $i < $count; $i++) {
    $venta = $ventas[$i];
    $dir = $direcciones[$i];

    $entrega = \App\Models\Entrega::create([
        'venta_id' => $venta->id,
        'vehiculo_id' => $vehiculo->id,
        'chofer_id' => $chofer->id,
        'estado' => 'PROGRAMADO',
        'peso_kg' => $pesos[$i],
        'fecha_programada' => now()->addHours(rand(2, 8)),
        'direccion_entrega' => $dir['dir'],
        'observaciones' => 'Entrega de prueba para optimización ' . ($i + 1),
    ]);

    // Crear dirección de cliente si no existe
    if ($venta->cliente) {
        $direccionCliente = \App\Models\DireccionCliente::updateOrCreate(
            [
                'cliente_id' => $venta->cliente->id,
                'direccion' => $dir['dir'],
            ],
            [
                'latitud' => $dir['lat'],
                'longitud' => $dir['lon'],
                'es_principal' => false,
            ]
        );

        // Asociar dirección a la venta
        $venta->update(['direccion_cliente_id' => $direccionCliente->id]);
    }

    $entregasCreadas[] = $entrega;

    echo "✅ Entrega #{$entrega->id} creada:\n";
    echo "   Venta: #{$venta->id}\n";
    echo "   Peso: {$pesos[$i]} kg\n";
    echo "   Dirección: {$dir['dir']}\n";
    echo "   Coordenadas: ({$dir['lat']}, {$dir['lon']})\n\n";
}

echo "\n📊 Resumen:\n";
echo "   Total entregas creadas: " . count($entregasCreadas) . "\n";
echo "   Peso total: " . array_sum(array_slice($pesos, 0, $count)) . " kg\n";
echo "   Capacidad vehículo: {$vehiculo->capacidad_kg} kg\n\n";

// Probar optimización
echo "🚀 Ejecutando optimización de rutas...\n\n";

$entregaService = app(\App\Services\Logistica\EntregaService::class);
$entregaIds = array_map(fn($e) => $e->id, $entregasCreadas);

$resultado = $entregaService->optimizarAsignacionMasiva($entregaIds, $vehiculo->capacidad_kg);

echo "📍 Resultado de optimización:\n";
echo "   Rutas creadas: " . count($resultado['rutas']) . "\n";
echo "   Total entregas: " . $resultado['estadisticas']['items_totales'] . "\n";
echo "   Distancia total: " . $resultado['estadisticas']['distancia_total'] . " km\n";
echo "   Tiempo total: " . $resultado['estadisticas']['tiempo_total_minutos'] . " minutos\n";
echo "   Uso promedio capacidad: " . $resultado['estadisticas']['uso_promedio'] . "%\n\n";

foreach ($resultado['rutas'] as $index => $ruta) {
    echo "🚚 Ruta " . ($index + 1) . ":\n";
    echo "   Entregas: " . count($ruta['ruta']) . "\n";
    echo "   Peso total: " . $ruta['peso_total_bin'] . " kg\n";
    echo "   Distancia: " . $ruta['distancia_total'] . " km\n";
    echo "   Tiempo estimado: " . $ruta['tiempo_estimado'] . " min\n";
    echo "   Uso capacidad: " . $ruta['porcentaje_uso'] . "%\n";

    if ($ruta['sugerencia_vehiculo']) {
        echo "   Vehículo sugerido: {$ruta['sugerencia_vehiculo']['placa']} ({$ruta['sugerencia_vehiculo']['capacidad_kg']} kg)\n";
    }

    if ($ruta['sugerencia_chofer']) {
        echo "   Chofer sugerido: {$ruta['sugerencia_chofer']['nombre']}\n";
    }

    echo "   Orden de entregas:\n";
    foreach ($ruta['ruta'] as $i => $parada) {
        echo "      " . ($i + 1) . ". Entrega #{$parada['entrega_id']} - {$parada['direccion']}\n";
        echo "         Distancia desde anterior: " . round($parada['distancia_anterior'], 2) . " km\n";
    }
    echo "\n";
}

echo "✅ Optimización completada exitosamente!\n";
