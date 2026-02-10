<?php
require 'vendor/autoload.php';

$url = 'http://localhost:8000/api/test/cajas/12/datos-cierre';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    echo "❌ No se pudo conectar al servidor. Asegúrate de que está corriendo: php artisan serve\n";
    exit(1);
}

$data = json_decode($response, true);

if ($data['success'] ?? false) {
    echo "✅ Endpoint respondió correctamente (HTTP {$httpCode})\n";
    echo "\n📊 Estructura de respuesta:\n";
    echo "   - apertura_id: {$data['apertura_id']}\n";
    echo "   - caja_nombre: {$data['caja_nombre']}\n";
    echo "   - usuario: {$data['usuario']}\n";

    echo "\n📋 Arrays disponibles en 'data':\n";
    foreach (array_keys($data['data']) as $key) {
        $item = $data['data'][$key];
        if (is_array($item)) {
            echo "   - $key: " . count($item) . " elementos\n";
        } else {
            echo "   - $key: " . gettype($item) . "\n";
        }
    }

    echo "\n🎯 sumatoriasVentasPorTipoPago:\n";
    foreach ($data['data']['sumatoriasVentasPorTipoPago'] as $item) {
        echo "   ✓ {$item['tipo_pago']}: {$item['cantidad']} ventas | Total: \${$item['total']} | Promedio: \${$item['promedio_por_venta']}\n";
    }

    echo "\n✅ Endpoint funcionando correctamente\n";
} else {
    echo "❌ Error en respuesta:\n";
    var_dump($data);
}
