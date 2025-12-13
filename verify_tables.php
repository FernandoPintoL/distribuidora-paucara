<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== VERIFICACIÓN DE TABLAS ===\n\n";

try {
    // Usar raw SQL para verificar
    $result = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");

    echo "Tablas relacionadas a zonas/localidades:\n";
    $found = false;
    foreach ($result as $row) {
        if (strpos($row->table_name, 'zona') !== false || strpos($row->table_name, 'localidad') !== false) {
            echo "  ✅ " . $row->table_name . "\n";
            $found = true;
        }
    }

    if (!$found) {
        echo "  ❌ No se encontraron tablas de zonas o localidades\n";
    }

    echo "\n=== RESUMEN ===\n";
    echo "Total tablas en BD: " . count($result) . "\n";

    // Verificar tabla pivot específica
    echo "\n=== TABLA PIVOT ===\n";
    try {
        $count = DB::table('localidad_zona')->count();
        echo "✅ Tabla localidad_zona existe\n";
        echo "   Registros: " . $count . "\n";
    } catch (\Exception $e) {
        echo "❌ Tabla localidad_zona no existe\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
