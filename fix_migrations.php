<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Obtener todas las migraciones ejecutadas
$executed = DB::table('migrations')->pluck('migration')->toArray();

// Obtener todas las migraciones del filesystem
$files = glob('database/migrations/*.php');
$filesystem = [];
foreach ($files as $file) {
    $name = basename($file, '.php');
    $filesystem[] = $name;
}

// Encontrar cuáles están en el filesystem pero no en migrations
$missing = array_diff($filesystem, $executed);

// Registrar las que faltan
$batch = DB::table('migrations')->max('batch') ?? 0;
$count = 0;

foreach ($missing as $migration) {
    if (!$migration) continue;

    try {
        DB::table('migrations')->insert([
            'migration' => $migration,
            'batch' => $batch + 1
        ]);
        echo "✅ Registrada: $migration\n";
        $count++;
    } catch (\Exception $e) {
        echo "⏭️  Ya existe: $migration\n";
    }
}

echo "\n✅ Se registraron $count migraciones\n";
echo "Total migraciones registradas: " . DB::table('migrations')->count() . "\n";
?>
