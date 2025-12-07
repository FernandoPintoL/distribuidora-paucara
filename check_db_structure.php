<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DATABASE STRUCTURE CHECK ===\n\n";

// Check rutas table
echo "--- TABLA: rutas ---\n";
$columns = DB::select("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='rutas' ORDER BY ordinal_position");
echo "Columnas: " . count($columns) . "\n";
foreach ($columns as $col) {
    echo "  - {$col->column_name} ({$col->data_type}, nullable: {$col->is_nullable})\n";
}

// Check ruta_detalles table
echo "\n--- TABLA: ruta_detalles ---\n";
$columns = DB::select("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='ruta_detalles' ORDER BY ordinal_position");
echo "Columnas: " . count($columns) . "\n";
foreach ($columns as $col) {
    echo "  - {$col->column_name} ({$col->data_type}, nullable: {$col->is_nullable})\n";
}

// Check zonas table
echo "\n--- TABLA: zonas ---\n";
$zonas = DB::table('zonas')->get();
echo "Registros en zonas: " . count($zonas) . "\n";

// Check if zona_id 8 exists
echo "\nZona ID 8:\n";
$zona = DB::table('zonas')->find(8);
if ($zona) {
    echo "  ✅ Existe: {$zona->nombre}\n";
} else {
    echo "  ❌ NO EXISTE\n";
}

// Check users table
echo "\n--- Verificar creador de rutas (usuario) ---\n";
$user = DB::table('users')->first();
if ($user) {
    echo "  ✅ Usuario existe: ID {$user->id}\n";
} else {
    echo "  ❌ NO HAY USUARIOS\n";
}

// Check vehiculos table structure
echo "\n--- TABLA: vehiculos ---\n";
$vehiculos = DB::table('vehiculos')->get();
echo "Vehículos: " . count($vehiculos) . "\n";

// Check empleados table
echo "\n--- TABLA: empleados ---\n";
$empleados = DB::table('empleados')->get();
echo "Empleados: " . count($empleados) . "\n";

echo "\n=== FIN CHECK ===\n";
?>
