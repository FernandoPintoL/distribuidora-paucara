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

echo "=== RUTA PLANNING DEBUG ===\n\n";

$fecha = Carbon::parse('2025-12-07');
echo "Fecha a planificar: " . $fecha->format('Y-m-d') . "\n\n";

// Step 1: Get pending deliveries
echo "--- PASO 1: Obtener entregas pendientes ---\n";
$entregas = Venta::where('estado_logistico', 'PENDIENTE_ENVIO')
    ->where('requiere_envio', true)
    ->whereDate('fecha_entrega_comprometida', $fecha->format('Y-m-d'))
    ->with(['cliente', 'cliente.localidad', 'detalles'])
    ->get();

echo "Entregas encontradas: " . count($entregas) . "\n";
if (count($entregas) > 0) {
    foreach ($entregas as $e) {
        $loc_name = $e->cliente->localidad ? $e->cliente->localidad->nombre : 'N/A';
        echo "  - Venta ID: {$e->id} | Cliente: {$e->cliente->nombre} | Localidad: {$loc_name}\n";
    }
} else {
    echo "  ❌ NO HAY ENTREGAS\n";
}

echo "\n--- PASO 2: Agrupar por zona (localidad_id) ---\n";
$agrupadas = $entregas->groupBy(function($e) {
    $zona = $e->cliente->localidad_id;
    return $zona !== null ? $zona : 'sin_zona';
});

echo "Grupos encontrados: " . count($agrupadas) . "\n";
foreach ($agrupadas as $zona_id => $grupo) {
    echo "  Zona ID {$zona_id}: " . count($grupo) . " entregas\n";
}

echo "\n--- PASO 3: Validar disponibilidad de vehículos ---\n";
$vehiculos = Vehiculo::where('estado', 'DISPONIBLE')->get();
echo "Vehículos disponibles: " . count($vehiculos) . "\n";
if (count($vehiculos) > 0) {
    foreach ($vehiculos as $v) {
        echo "  - {$v->placa} | Cap: {$v->capacidad_kg}kg | Estado: {$v->estado}\n";
    }
} else {
    echo "  ❌ NO HAY VEHÍCULOS DISPONIBLES\n";
}

echo "\n--- PASO 4: Validar disponibilidad de choferes ---\n";
$choferes = Empleado::where('puede_acceder_sistema', true)
    ->where('estado', 'activo')
    ->get();
echo "Choferes disponibles: " . count($choferes) . "\n";
if (count($choferes) > 0) {
    foreach ($choferes as $c) {
        echo "  - {$c->nombre} | Estado: {$c->estado}\n";
    }
} else {
    echo "  ❌ NO HAY CHOFERES DISPONIBLES\n";
}

echo "\n--- PASO 5: Verificar direcciones de clientes ---\n";
foreach ($entregas as $e) {
    $dir = $e->cliente->direcciones()->first();
    if ($dir) {
        echo "  Cliente {$e->cliente->nombre}: lat={$dir->latitud}, lon={$dir->longitud}\n";
    } else {
        echo "  ❌ Cliente {$e->cliente->nombre}: SIN DIRECCIÓN\n";
    }
}

echo "\n=== FIN DEBUG ===\n";
?>
