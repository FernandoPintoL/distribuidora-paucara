<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Zona;
use App\Models\Localidad;

echo "=== CREANDO ZONAS ===\n\n";

// Get all localidades
$localidades = Localidad::all();
echo "Localidades encontradas: " . count($localidades) . "\n";

// Create corresponding zonas
foreach ($localidades as $loc) {
    $zona = Zona::firstOrCreate(
        ['nombre' => $loc->nombre],
        [
            'nombre' => $loc->nombre,
            'descripcion' => 'Zona para ' . $loc->nombre,
            'activa' => true,
        ]
    );

    // Agregar a tabla pivot (sin eliminar otras localidades)
    $zona->localidades()->syncWithoutDetaching([$loc->id]);

    echo "  ✅ Zona creada/actualizada: ID {$zona->id} = {$loc->nombre}\n";
}

echo "\n=== VERIFICACIÓN ===\n";
$zonas_count = DB::table('zonas')->count();
echo "Total zonas en BD: {$zonas_count}\n";

$zonas = DB::table('zonas')->get();
foreach ($zonas as $z) {
    echo "  - ID {$z->id}: {$z->nombre}\n";
}

echo "\n✅ Zonas creadas correctamente\n";
?>
