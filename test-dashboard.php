<?php
/**
 * Script de test para verificar que el dashboard funciona
 * Ejecutar: php test-dashboard.php
 */

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Test 1: Verificar que config se carga
echo "✓ Test 1: Verificando configuración...\n";
$config = require 'config/dashboard-widgets.php';
if ($config && isset($config['role_modules'])) {
    echo "  ✓ Config cargada correctamente\n";
    echo "  - Roles definidos: " . implode(', ', array_keys($config['role_modules'])) . "\n";
} else {
    echo "  ✗ Error: Config no se cargó correctamente\n";
}

// Test 2: Verificar que el Service funciona
echo "\n✓ Test 2: Verificando DashboardWidgetsService...\n";
try {
    $service = app(\App\Services\DashboardWidgetsService::class);
    echo "  ✓ Service inyectado correctamente\n";

    // Test con usuario preventista
    $preventista = \App\Models\User::whereHas('roles', function ($query) {
        $query->where('name', 'preventista');
    })->first();

    if ($preventista) {
        $modulos = $service->getModulosPermitidos($preventista);
        echo "  ✓ Usuario preventista encontrado\n";
        echo "  - Módulos permitidos: " . implode(', ', $modulos) . "\n";
    } else {
        echo "  ⚠ No hay usuario con rol preventista (esto está bien, solo info)\n";
    }
} catch (Exception $e) {
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

// Test 3: Verificar que Dashboard Controller funciona
echo "\n✓ Test 3: Verificando DashboardController...\n";
try {
    $controller = app(\App\Http\Controllers\DashboardController::class);
    echo "  ✓ Controller inyectado correctamente\n";
} catch (Exception $e) {
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n✓ Todos los tests completados\n";
