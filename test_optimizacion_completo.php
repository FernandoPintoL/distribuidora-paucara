<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔧 PRUEBA COMPLETA DE OPTIMIZACIÓN DE RUTAS\n";
echo "==========================================\n\n";

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

// PASO 1: Obtener o crear datos necesarios
echo "📦 PASO 1: Preparando datos de prueba...\n\n";

$clientes = \App\Models\Cliente::take(8)->get();
if ($clientes->count() < 8) {
    echo "⚠️  Solo hay {$clientes->count()} clientes. Se crearán entregas con los disponibles.\n";
    $count = $clientes->count();
} else {
    $count = 8;
}

$almacen = \App\Models\Almacen::first();
if (!$almacen) {
    echo "❌ No hay almacenes disponibles\n";
    exit(1);
}

$vehiculo = \App\Models\Vehiculo::disponibles()->first();
if (!$vehiculo) {
    echo "❌ No hay vehículos disponibles\n";
    exit(1);
}

$chofer = \App\Models\Empleado::where('estado', 'activo')->first();
if (!$chofer) {
    echo "❌ No hay choferes activos\n";
    exit(1);
}

$usuario = \App\Models\User::first();
if (!$usuario) {
    echo "❌ No hay usuarios en el sistema\n";
    exit(1);
}

echo "✅ Almacén: {$almacen->nombre}\n";
echo "✅ Vehículo: {$vehiculo->placa} (Capacidad: {$vehiculo->capacidad_kg} kg)\n";
echo "✅ Chofer: {$chofer->nombre}\n";
echo "✅ Usuario: {$usuario->name}\n\n";

// PASO 2: Crear ventas de prueba
echo "📝 PASO 2: Creando ventas de prueba...\n\n";

$ventasCreadas = [];
for ($i = 0; $i < $count; $i++) {
    $cliente = $clientes[$i];

    // Crear dirección de cliente
    $direccionCliente = \App\Models\DireccionCliente::updateOrCreate(
        [
            'cliente_id' => $cliente->id,
            'direccion' => $direcciones[$i]['dir'],
        ],
        [
            'latitud' => $direcciones[$i]['lat'],
            'longitud' => $direcciones[$i]['lon'],
            'es_principal' => false,
        ]
    );

    // Crear venta
    $numeroVenta = 'TEST-' . time() . '-' . $i;
    $totalVenta = rand(100, 500);

    $venta = \App\Models\Venta::create([
        'numero' => $numeroVenta,
        'fecha' => now(),
        'usuario_id' => $usuario->id,
        'cliente_id' => $cliente->id,
        'direccion_cliente_id' => $direccionCliente->id,
        'estado_documento_id' => 1,
        'moneda_id' => 1, // BOB (Bolivianos)
        'total' => $totalVenta,
        'subtotal' => $totalVenta,
        'nit' => $cliente->nit ?? '0',
        'razon_social' => $cliente->razon_social ?? $cliente->nombre,
        'canal' => 'WEB',
        'fecha_venta' => now(),
    ]);

    $ventasCreadas[] = $venta;

    echo "✅ Venta #{$venta->id} creada para cliente {$cliente->nombre}\n";
    echo "   Dirección: {$direcciones[$i]['dir']}\n";
    echo "   GPS: ({$direcciones[$i]['lat']}, {$direcciones[$i]['lon']})\n\n";
}

// PASO 3: Crear entregas de prueba
echo "🚚 PASO 3: Creando entregas de prueba...\n\n";

$entregasCreadas = [];
foreach ($ventasCreadas as $index => $venta) {
    $entrega = \App\Models\Entrega::create([
        'venta_id' => $venta->id,
        'vehiculo_id' => null, // Sin asignar inicialmente
        'chofer_id' => null,   // Sin asignar inicialmente
        'estado' => 'PROGRAMADO',
        'peso_kg' => $pesos[$index],
        'fecha_programada' => now()->addHours(rand(2, 8)),
        'direccion_entrega' => $direcciones[$index]['dir'],
        'observaciones' => 'Entrega de prueba para optimización ' . ($index + 1),
    ]);

    $entregasCreadas[] = $entrega;

    echo "✅ Entrega #{$entrega->id} creada:\n";
    echo "   Venta: #{$venta->id}\n";
    echo "   Peso: {$pesos[$index]} kg\n";
    echo "   Dirección: {$direcciones[$index]['dir']}\n\n";
}

// PASO 4: Ejecutar optimización
echo "🚀 PASO 4: Ejecutando optimización de rutas...\n";
echo "================================================\n\n";

$entregaService = app(\App\Services\Logistica\EntregaService::class);
$entregaIds = array_map(fn($e) => $e->id, $entregasCreadas);

$resultado = $entregaService->optimizarAsignacionMasiva($entregaIds, $vehiculo->capacidad_kg);

// PASO 5: Mostrar resultados
echo "📊 RESULTADOS DE OPTIMIZACIÓN:\n";
echo "================================\n\n";

echo "📈 Estadísticas Globales:\n";
echo "   • Rutas creadas: " . count($resultado['rutas']) . "\n";
echo "   • Total entregas: " . ($resultado['estadisticas']['items_totales'] ?? 'N/A') . "\n";
echo "   • Peso total: " . ($resultado['estadisticas']['peso_total'] ?? 0) . " kg\n";
echo "   • Distancia total: " . ($resultado['estadisticas']['distancia_total'] ?? 0) . " km\n";
echo "   • Tiempo total: " . ($resultado['estadisticas']['tiempo_total_minutos'] ?? 0) . " minutos\n";
echo "   • Uso promedio capacidad: " . ($resultado['estadisticas']['uso_promedio'] ?? 0) . "%\n\n";

foreach ($resultado['rutas'] as $index => $ruta) {
    echo "🚚 RUTA " . ($index + 1) . ":\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "   📦 Entregas: " . count($ruta['ruta']) . "\n";
    echo "   ⚖️  Peso total: " . $ruta['peso_total_bin'] . " kg\n";
    echo "   📏 Distancia: " . $ruta['distancia_total'] . " km\n";
    echo "   ⏱️  Tiempo estimado: " . $ruta['tiempo_estimado'] . " min\n";
    echo "   📊 Uso capacidad: " . $ruta['porcentaje_uso'] . "%\n";

    if (isset($ruta['sugerencia_vehiculo']) && $ruta['sugerencia_vehiculo']) {
        echo "   🚗 Vehículo sugerido: {$ruta['sugerencia_vehiculo']['placa']} ({$ruta['sugerencia_vehiculo']['capacidad_kg']} kg)\n";
    }

    if (isset($ruta['sugerencia_chofer']) && $ruta['sugerencia_chofer']) {
        echo "   👤 Chofer sugerido: {$ruta['sugerencia_chofer']['nombre']}\n";
    }

    echo "\n   📍 Orden optimizado de entregas:\n";
    foreach ($ruta['ruta'] as $i => $parada) {
        echo "      " . ($i + 1) . ". Entrega #{$parada['entrega_id']}\n";
        echo "         📍 {$parada['direccion']}\n";
        echo "         ⚖️  Peso: {$parada['peso']} kg\n";
        echo "         📏 Distancia desde anterior: " . round($parada['distancia_anterior'], 2) . " km\n\n";
    }

    echo "   🔙 Distancia de retorno a base: " . round($ruta['distancia_regreso'], 2) . " km\n";
    echo "\n";
}

echo "✅ OPTIMIZACIÓN COMPLETADA EXITOSAMENTE!\n\n";
echo "💡 Algoritmo utilizado: First Fit Decreasing (FFD) + Nearest Neighbor (NN)\n";
echo "   • FFD: Agrupa entregas por capacidad de vehículo\n";
echo "   • NN: Optimiza orden de paradas por distancia\n";
echo "   • Complejidad: O(n²) - Óptimo para <100 entregas\n\n";
