<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Venta;
use App\Models\Vehiculo;
use App\Models\Empleado;
use App\Models\DireccionCliente;
use App\Services\RutaOptimizer;

echo "=== DEBUGGING crearRutaParaZona LOGIC ===\n\n";

$fecha = Carbon::parse('2025-12-07');
$zona_id = 8; // La Paz Centro

// Get deliveries
$entregas = Venta::where('estado_logistico', 'PENDIENTE_ENVIO')
    ->where('requiere_envio', true)
    ->whereDate('fecha_entrega_comprometida', $fecha->format('Y-m-d'))
    ->with(['cliente', 'cliente.localidad', 'detalles'])
    ->get();

echo "--- PASO 1: Select vehicle ---\n";
$peso_necesario = 0;
$volumen_necesario = 0;
foreach ($entregas as $venta) {
    foreach ($venta->detalles as $detalle) {
        $peso_necesario += ($detalle->producto->peso_unitario ?? 0) * $detalle->cantidad;
        $volumen_necesario += ($detalle->producto->volumen_unitario ?? 0) * $detalle->cantidad;
    }
}
echo "Peso requerido: {$peso_necesario}kg\n";
echo "Volumen requerido: {$volumen_necesario}\n";

$camion = Vehiculo::where('estado', 'DISPONIBLE')
    ->where('capacidad_kg', '>=', $peso_necesario)
    ->where('capacidad_volumen', '>=', $volumen_necesario)
    ->orderBy('capacidad_kg')
    ->first();

if ($camion) {
    echo "✅ Vehículo seleccionado: {$camion->placa}\n";
} else {
    echo "❌ No hay vehículo disponible con capacidad suficiente\n";
}

echo "\n--- PASO 2: Validate capacity ---\n";
$excede_peso = $peso_necesario > $camion->capacidad_kg;
$excede_volumen = $volumen_necesario > $camion->capacidad_volumen;
echo "Excede peso: " . ($excede_peso ? "SÍ" : "NO") . "\n";
echo "Excede volumen: " . ($excede_volumen ? "SÍ" : "NO") . "\n";

if (!($excede_peso || $excede_volumen)) {
    echo "✅ Capacidad validada\n";
} else {
    echo "❌ Capacidad excedida\n";
}

echo "\n--- PASO 3: Prepare data for RutaOptimizer ---\n";
$entregas_array = [];
foreach ($entregas as $venta) {
    $direccion = $venta->cliente->direcciones()->first();
    if (!$direccion) {
        echo "⚠️  Cliente {$venta->cliente->nombre} no tiene dirección\n";
        continue;
    }

    $peso = 0;
    foreach ($venta->detalles as $detalle) {
        $peso += ($detalle->producto->peso_unitario ?? 0) * $detalle->cantidad;
    }

    $entregas_array[] = [
        'id' => $venta->id,
        'venta_id' => $venta->id,
        'cliente_id' => $venta->cliente_id,
        'direccion' => $direccion->direccion,
        'lat' => (float)$direccion->latitud,
        'lon' => (float)$direccion->longitud,
        'peso' => $peso,
    ];
}

echo "Entregas preparadas para optimizador: " . count($entregas_array) . "\n";
foreach ($entregas_array as $e) {
    echo "  - ID: {$e['id']} | Lat: {$e['lat']}, Lon: {$e['lon']}\n";
}

echo "\n--- PASO 4: Run RutaOptimizer ---\n";
try {
    $optimizer = new RutaOptimizer();
    $ruta_optimizada = $optimizer->obtenerRutaOptimizada($entregas_array, $camion->capacidad_kg);

    echo "✅ Ruta optimizada:\n";
    echo "  - Paradas: " . count($ruta_optimizada['ruta']) . "\n";
    echo "  - Distancia total: " . $ruta_optimizada['distancia_total'] . " km\n";
    echo "  - Tiempo estimado: " . $ruta_optimizada['tiempo_estimado'] . " minutos\n";
    echo "  - Entregas no asignadas: " . $ruta_optimizada['entregas_no_asignadas'] . "\n";

    echo "\nSecuencia de paradas:\n";
    foreach ($ruta_optimizada['ruta'] as $i => $parada) {
        echo "  " . ($i+1) . ". Cliente ID: {$parada['cliente_id']} | Lat: {$parada['lat']}, Lon: {$parada['lon']}\n";
    }

} catch (Exception $e) {
    echo "❌ Error en RutaOptimizer: " . $e->getMessage() . "\n";
}

echo "\n--- PASO 5: Select driver ---\n";
$chofer = Empleado::where('puede_acceder_sistema', true)
    ->where('estado', 'activo')
    ->orderBy('ultimo_acceso_sistema', 'desc')
    ->first();

if ($chofer) {
    echo "✅ Chofer asignado: {$chofer->nombre}\n";
} else {
    echo "❌ No hay chofer disponible\n";
}

echo "\n=== FIN DEBUG ===\n";
?>
