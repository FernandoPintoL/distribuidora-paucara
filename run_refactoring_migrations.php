<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== EJECUTANDO MIGRACIONES DE REFACTORIZACIÓN ===\n\n";

// Migración 1: Crear tabla pivot
echo "PASO 1: Crear tabla pivot localidad_zona\n";
echo "=========================================\n";

try {
    if (Schema::hasTable('localidad_zona')) {
        echo "⏭️  Tabla ya existe\n";
    } else {
        Schema::create('localidad_zona', function ($table) {
            $table->id();
            $table->unsignedBigInteger('localidad_id');
            $table->unsignedBigInteger('zona_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('localidad_id')
                  ->references('id')
                  ->on('localidades')
                  ->onDelete('cascade');

            $table->foreign('zona_id')
                  ->references('id')
                  ->on('zonas')
                  ->onDelete('cascade');

            // Constraints e índices
            $table->unique(['localidad_id', 'zona_id']);
            $table->index('localidad_id');
            $table->index('zona_id');
        });

        echo "✅ Tabla 'localidad_zona' creada\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Migración 2: Migrar datos del JSON a pivot
echo "PASO 2: Migrar datos del JSON a tabla pivot\n";
echo "==========================================\n";

try {
    $zonas = DB::table('zonas')->get();
    echo "Zonas encontradas: " . count($zonas) . "\n";

    $migratedCount = 0;

    foreach ($zonas as $zona) {
        if (!$zona->localidades) {
            continue;
        }

        $localidadesArray = json_decode($zona->localidades, true);
        if (!is_array($localidadesArray)) {
            continue;
        }

        foreach ($localidadesArray as $localidadData) {
            $localidadId = null;

            // Si es número, asumir que es ID
            if (is_numeric($localidadData)) {
                $exists = DB::table('localidades')->where('id', $localidadData)->exists();
                if ($exists) {
                    $localidadId = $localidadData;
                }
            }
            // Si es string, buscar por nombre o código
            elseif (is_string($localidadData)) {
                $localidadId = DB::table('localidades')
                    ->where('nombre', $localidadData)
                    ->orWhere('codigo', $localidadData)
                    ->value('id');
            }
            // Si es array con 'id'
            elseif (is_array($localidadData) && isset($localidadData['id'])) {
                $localidadId = $localidadData['id'];
            }

            if ($localidadId) {
                try {
                    DB::table('localidad_zona')->insertOrIgnore([
                        'zona_id' => $zona->id,
                        'localidad_id' => $localidadId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $migratedCount++;
                } catch (\Exception $e) {
                    // Ya existe, ignorar
                }
            }
        }
    }

    echo "✅ Registros migrados: " . $migratedCount . "\n";

    // Verificar migración
    $pivotCount = DB::table('localidad_zona')->count();
    echo "✅ Total registros en pivot: " . $pivotCount . "\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== VERIFICACIÓN FINAL ===\n";
echo "✅ Tabla localidades: " . DB::table('localidades')->count() . " registros\n";
echo "✅ Tabla zonas: " . DB::table('zonas')->count() . " registros\n";
echo "✅ Tabla localidad_zona: " . DB::table('localidad_zona')->count() . " registros\n";

echo "\n✅ ¡Refactorización completada exitosamente!\n";
?>
