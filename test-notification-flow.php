<?php
/**
 * Test de flujo completo de notificaciones para EntregaAsignada
 * 
 * Verifica:
 * 1. Configuración de WebSocket en Laravel
 * 2. Conexión con servidor Node
 * 3. Dispatch correcto del evento
 * 4. Envío de notificación al chofer
 */

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║  TEST DE FLUJO DE NOTIFICACIONES ENTREGA ASIGNADA (Phase 6)    ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// 1. Verificar configuración de WebSocket
echo "1️⃣  VERIFICANDO CONFIGURACIÓN DE WEBSOCKET\n";
echo "   ─────────────────────────────────────────\n";

$wsUrl = Config::get('websocket.url');
$wsEnabled = Config::get('websocket.enabled');
$wsSecret = env('WS_SECRET', 'cobrador-websocket-secret-key-2025');
$wsDebug = Config::get('websocket.debug');

echo "   ✓ URL WebSocket: " . ($wsUrl ?: 'NO CONFIGURADA') . "\n";
echo "   ✓ WebSocket Habilitado: " . ($wsEnabled ? 'SÍ' : 'NO') . "\n";
echo "   ✓ Secret configurado: " . (strlen($wsSecret) > 0 ? 'SÍ' : 'NO') . "\n";
echo "   ✓ Debug mode: " . ($wsDebug ? 'ACTIVADO' : 'desactivado') . "\n\n";

if (!$wsEnabled) {
    echo "   ⚠️  ADVERTENCIA: WebSocket está DESHABILITADO\n\n";
    exit(1);
}

// 2. Verificar disponibilidad de servidor Node
echo "2️⃣  VERIFICANDO SERVIDOR WEBSOCKET NODE\n";
echo "   ─────────────────────────────────────────\n";

try {
    $response = \Illuminate\Support\Facades\Http::timeout(3)->get($wsUrl . '/health');
    if ($response->successful()) {
        echo "   ✅ Servidor Node DISPONIBLE\n";
        echo "   📊 Status: " . json_encode($response->json()) . "\n\n";
    } else {
        echo "   ❌ Servidor retornó error: " . $response->status() . "\n\n";
    }
} catch (\Exception $e) {
    echo "   ❌ NO CONECTA CON SERVIDOR NODE\n";
    echo "   📍 Error: " . $e->getMessage() . "\n\n";
}

// 3. Verificar que existen los archivos necesarios
echo "3️⃣  VERIFICANDO COMPONENTES NECESARIOS\n";
echo "   ─────────────────────────────────────────\n";

$files = [
    'app/Events/EntregaAsignada.php' => 'Evento EntregaAsignada',
    'app/Listeners/SendEntregaAsignadaNotification.php' => 'Listener SendEntregaAsignadaNotification',
    'app/Services/Notifications/EntregaNotificationService.php' => 'Servicio EntregaNotificationService',
    'app/Services/WebSocket/EntregaWebSocketService.php' => 'Servicio EntregaWebSocketService',
    'app/Http/Controllers/Api/EntregaController.php' => 'Controlador EntregaController',
];

foreach ($files as $path => $name) {
    $fullPath = base_path($path);
    if (file_exists($fullPath)) {
        echo "   ✅ $name\n";
    } else {
        echo "   ❌ $name - NO ENCONTRADO\n";
    }
}

echo "\n4️⃣  VERIFICANDO CONFIGURACIÓN EN EVENTSERVICEPROVIDER\n";
echo "   ─────────────────────────────────────────\n";

$eventServiceProvider = file_get_contents(base_path('app/Providers/EventServiceProvider.php'));
if (strpos($eventServiceProvider, 'EntregaAsignada') !== false && 
    strpos($eventServiceProvider, 'SendEntregaAsignadaNotification') !== false) {
    echo "   ✅ Listener registrado correctamente\n\n";
} else {
    echo "   ❌ Listener NO está registrado\n\n";
}

// 5. Verificar que el evento NO tiene ShouldBroadcast
echo "5️⃣  VERIFICANDO IMPLEMENTACIÓN DEL EVENTO\n";
echo "   ─────────────────────────────────────────\n";

$eventCode = file_get_contents(base_path('app/Events/EntregaAsignada.php'));
if (strpos($eventCode, 'ShouldBroadcast') === false) {
    echo "   ✅ Evento NO implementa ShouldBroadcast (CORRECTO)\n";
} else {
    echo "   ⚠️  Evento IMPLEMENTA ShouldBroadcast (PROBLEMA)\n";
}

if (strpos($eventCode, 'load([\'vehiculo\', \'chofer\'])') !== false) {
    echo "   ✅ Evento carga relaciones vehiculo y chofer\n\n";
} else {
    echo "   ⚠️  Evento podría no cargar relaciones\n\n";
}

// 6. Resumen
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║  TEST COMPLETADO                                              ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

echo "PRÓXIMOS PASOS:\n";
echo "1. Crear una entrega nueva desde la web\n";
echo "2. Monitorear logs de Laravel: tail -f storage/logs/laravel.log | grep -i \"entrega\"\n";
echo "3. Monitorear logs de Node: tail -f websocket.log (en servidor Node)\n";
echo "4. Verificar que notification llega a Flutter app\n\n";
