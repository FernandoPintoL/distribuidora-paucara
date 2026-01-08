<?php
require_once 'bootstrap/app.php';
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Obtener estados
$estados = \App\Models\EstadoLogistica::get()->groupBy('categoria');

echo "\n════════════════════════════════════════════════════════════════\n";
echo "ESTADOS DISPONIBLES EN LA BASE DE DATOS:\n";
echo "════════════════════════════════════════════════════════════════\n";

foreach ($estados as $categoria => $items) {
    echo "\n📂 Categoría: $categoria\n";
    foreach ($items as $estado) {
        echo "   ✓ ID: " . str_pad($estado->id, 3, " ", STR_PAD_LEFT) . " | Código: " . str_pad($estado->codigo, 20, " ") . " | Nombre: " . $estado->nombre . "\n";
    }
}

echo "\n════════════════════════════════════════════════════════════════\n";
