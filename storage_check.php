<?php
/**
 * Script de diagnóstico para verificar imágenes de empresas
 * Ejecución: php artisan tinker < storage_check.php
 */

use App\Models\Empresa;
use Illuminate\Support\Facades\Storage;

echo "====== VERIFICACIÓN DE IMÁGENES DE EMPRESAS ======\n\n";

// 1. Verificar si los archivos existen en la BD
$empresas = Empresa::whereNotNull('logo_principal')
    ->orWhereNotNull('logo_compacto')
    ->orWhereNotNull('logo_footer')
    ->get();

echo "Total empresas con imágenes en BD: " . $empresas->count() . "\n\n";

foreach ($empresas as $empresa) {
    echo "Empresa: {$empresa->nombre_comercial} (ID: {$empresa->id})\n";
    echo "  ├─ logo_principal: {$empresa->logo_principal}\n";
    echo "  ├─ logo_compacto: {$empresa->logo_compacto}\n";
    echo "  └─ logo_footer: {$empresa->logo_footer}\n\n";
    
    // 2. Verificar si los archivos existen en el sistema de archivos
    if ($empresa->logo_principal) {
        $path = str_replace('/storage/', '', $empresa->logo_principal);
        $exists = Storage::disk('public')->exists($path);
        echo "  ✓ logo_principal existe en disco: " . ($exists ? "SÍ" : "NO") . "\n";
    }
    
    if ($empresa->logo_compacto) {
        $path = str_replace('/storage/', '', $empresa->logo_compacto);
        $exists = Storage::disk('public')->exists($path);
        echo "  ✓ logo_compacto existe en disco: " . ($exists ? "SÍ" : "NO") . "\n";
    }
    
    if ($empresa->logo_footer) {
        $path = str_replace('/storage/', '', $empresa->logo_footer);
        $exists = Storage::disk('public')->exists($path);
        echo "  ✓ logo_footer existe en disco: " . ($exists ? "SÍ" : "NO") . "\n";
    }
    echo "\n";
}

// 3. Listar archivos en el directorio empresas
echo "====== ARCHIVOS EN /storage/app/public/empresas ======\n";
$files = Storage::disk('public')->files('empresas');
echo "Total archivos en directorio: " . count($files) . "\n";
foreach ($files as $file) {
    echo "  • " . $file . "\n";
}
