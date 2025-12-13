<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== EJECUTANDO MIGRACIÓN: CREATE ZONAS TABLE ===\n\n";

try {
    // Crear tabla zonas
    Schema::create('zonas', function ($table) {
        $table->id();
        $table->string('nombre')->unique(); // Ej: "Zona Norte", "Zona Sur"
        $table->string('codigo')->unique()->nullable(); // Ej: "ZN", "ZS"
        $table->text('descripcion')->nullable(); // Descripción de la zona
        $table->json('localidades')->nullable(); // Array de localidades: ["La Paz", "Cochabamba"]
        $table->decimal('latitud_centro', 10, 8)->nullable(); // Coordenada centro de zona
        $table->decimal('longitud_centro', 11, 8)->nullable();
        $table->integer('tiempo_estimado_entrega')->nullable(); // Minutos promedio para entregas en zona
        $table->boolean('activa')->default(true);
        $table->unsignedBigInteger('preventista_id')->nullable(); // Preventista responsable de zona
        $table->foreign('preventista_id')->references('id')->on('empleados')->onDelete('set null');
        $table->timestamps();
        $table->softDeletes(); // Para poder restaurar zonas eliminadas
    });

    echo "✅ Tabla 'zonas' creada exitosamente\n";

    // Registrar migración
    DB::table('migrations')->insert([
        'migration' => '2025_11_02_040952_create_zonas_table',
        'batch' => DB::table('migrations')->max('batch') + 1
    ]);

    echo "✅ Migración registrada en tabla migrations\n";

    // Verificar que la tabla fue creada
    $count = DB::table('zonas')->count();
    echo "✅ Tabla verificada, registros: " . $count . "\n";

    echo "\n✅ Migración completada exitosamente!\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nDetalles:\n";
    echo $e->getTraceAsString() . "\n";
}
?>
