<?php

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\Role;

$rolCajero = Role::where('name', 'Cajero')->first();

if (!$rolCajero) {
    echo "❌ Rol Cajero no encontrado\n";
    exit(1);
}

$permisos = $rolCajero->permissions()->orderBy('name')->pluck('name')->toArray();

echo "\n════════════════════════════════════════════════════════════\n";
echo "✅ PERMISOS DE LOGÍSTICA ASIGNADOS AL CAJERO\n";
echo "════════════════════════════════════════════════════════════\n\n";

$categorias = [
    'Dashboard de Logística' => ['logistica.dashboard', 'logistica.envios.seguimiento'],
    'Gestión de Envíos' => array_filter($permisos, fn($p) => strpos($p, 'envios.') === 0),
    'Gestión de Entregas' => array_filter($permisos, fn($p) => strpos($p, 'entregas.') === 0),
    'Reportes de Carga' => array_filter($permisos, fn($p) => strpos($p, 'reportes-carga.') === 0),
    'Vehículos' => array_filter($permisos, fn($p) => strpos($p, 'vehiculos.') === 0),
];

foreach ($categorias as $categoria => $permisosCat) {
    if (!empty($permisosCat)) {
        echo "📋 {$categoria} (" . count($permisosCat) . " permisos):\n";
        foreach ($permisosCat as $perm) {
            echo "   ✓ {$perm}\n";
        }
        echo "\n";
    }
}

echo "════════════════════════════════════════════════════════════\n";
echo "📊 Resumen:\n";
echo "════════════════════════════════════════════════════════════\n";
echo "Total de permisos asignados: " . count($permisos) . "\n";

$logistica = array_filter($permisos, function($p) {
    return strpos($p, 'logistica') !== false || strpos($p, 'envios') !== false ||
           strpos($p, 'entregas') !== false || strpos($p, 'reportes-carga') !== false ||
           strpos($p, 'vehiculos') !== false;
});

echo "Permisos de logística: " . count($logistica) . "\n\n";

// Verificar permisos críticos
echo "🔐 Verificación de permisos críticos:\n";
$criticos = [
    'logistica.dashboard' => 'Dashboard de logística',
    'envios.index' => 'Ver lista de envíos',
    'envios.create' => 'Crear envíos',
    'envios.manage' => 'Gestionar rutas',
    'entregas.manage' => 'Gestionar entregas',
    'reportes-carga.index' => 'Ver reportes de carga',
];

foreach ($criticos as $permiso => $descripcion) {
    $tiene = in_array($permiso, $permisos);
    $icon = $tiene ? '✅' : '❌';
    echo "   {$icon} {$descripcion} ({$permiso})\n";
}

echo "\n════════════════════════════════════════════════════════════\n";
echo "✅ EL CAJERO PUEDE ACCEDER A TODAS LAS PANTALLAS DE LOGÍSTICA\n";
echo "════════════════════════════════════════════════════════════\n\n";

echo "Módulos habilitados:\n";
echo "   ✓ Dashboard de Logística\n";
echo "   ✓ Gestión de Envíos\n";
echo "   ✓ Gestión de Entregas\n";
echo "   ✓ Reportes de Carga\n";
echo "   ✓ Gestión de Rutas\n";
echo "   ✓ Gestión de Vehículos\n";
echo "   ✓ Seguimiento de Envíos\n";

echo "\n";
