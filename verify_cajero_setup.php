<?php

/**
 * Script para verificar la configuración del Cajero
 * Uso: php verify_cajero_setup.php [email]
 * Ejemplo: php verify_cajero_setup.php cajero1@paucara.test
 */

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use App\Models\Empleado;

// Obtener email del argumento de línea de comandos
$email = $argv[1] ?? 'cajero1@paucara.test';

echo "\n========================================\n";
echo "🔍 Verificando configuración de Cajero\n";
echo "========================================\n\n";

// Buscar usuario
$user = User::where('email', $email)->first();

if (!$user) {
    echo "❌ Usuario NO encontrado: {$email}\n\n";
    exit(1);
}

echo "✅ Usuario encontrado: {$user->name} ({$user->email})\n";
echo "   - Nick: {$user->usernick}\n";
echo "   - Verificado: " . ($user->email_verified_at ? 'Sí' : 'No') . "\n";
echo "   - Acceso Web: " . ($user->can_access_web ? 'Sí' : 'No') . "\n";
echo "   - Acceso Móvil: " . ($user->can_access_mobile ? 'Sí' : 'No') . "\n";

// Verificar roles
$roles = $user->roles->pluck('name')->toArray();
echo "\n📋 Roles asignados:\n";
if (empty($roles)) {
    echo "   ❌ Sin roles asignados\n";
} else {
    foreach ($roles as $role) {
        echo "   ✓ {$role}\n";
    }
}

// Verificar si tiene rol Cajero
$tieneCajero = $user->hasRole('Cajero');
echo "\n🔐 Rol Cajero: " . ($tieneCajero ? "✅ Sí" : "❌ No") . "\n";

// Verificar empleado asociado
$empleado = $user->empleado;
if (!$empleado) {
    echo "\n❌ PROBLEMA: No hay Empleado asociado al usuario\n";
    echo "   Usuario debe tener un registro en la tabla 'empleados' con user_id = {$user->id}\n";
} else {
    echo "\n✅ Empleado encontrado: {$empleado->codigo_empleado}\n";
    echo "   - CI: {$empleado->ci}\n";
    echo "   - Estado: {$empleado->estado}\n";
    echo "   - Puede acceder sistema: " . ($empleado->puede_acceder_sistema ? 'Sí' : 'No') . "\n";
    echo "   - Teléfono: {$empleado->telefono}\n";
    echo "   - Dirección: {$empleado->direccion}\n";

    // Verificar método esCajero()
    $esCajero = $empleado->esCajero();
    echo "\n   - Método esCajero(): " . ($esCajero ? "✅ Sí" : "❌ No") . "\n";
}

// Verificar caja
if ($empleado) {
    $caja = $empleado->cajas()->first();
    if ($caja) {
        echo "\n✅ Caja asociada encontrada:\n";
        echo "   - Código: {$caja->codigo}\n";
        echo "   - Descripción: {$caja->descripcion}\n";
        echo "   - Estado: {$caja->estado}\n";
        echo "   - Saldo actual: {$caja->saldo_actual}\n";
    } else {
        echo "\n⚠️  Advertencia: No hay caja asociada al empleado\n";
    }
}

// Resumen final
echo "\n========================================\n";
echo "📊 RESUMEN DE REQUISITOS PARA ACCESO\n";
echo "========================================\n\n";

$requisitos = [
    'Usuario existe' => (bool)$user,
    'Email verificado' => (bool)$user->email_verified_at,
    'Acceso web habilitado' => $user->can_access_web ?? false,
    'Tiene rol Cajero' => $tieneCajero,
    'Empleado vinculado' => (bool)$empleado,
    'Empleado activo' => $empleado ? $empleado->estado === 'activo' : false,
    'Puede acceder sistema' => $empleado ? $empleado->puede_acceder_sistema : false,
    'Es Cajero' => $empleado ? $empleado->esCajero() : false,
];

$todoOk = true;
foreach ($requisitos as $req => $estado) {
    $icon = $estado ? '✅' : '❌';
    echo "{$icon} {$req}\n";
    if (!$estado) $todoOk = false;
}

echo "\n" . ($todoOk ? "✅ ¡TODO ESTÁ CORRECTO!" : "❌ HAY PROBLEMAS A RESOLVER") . "\n\n";

if ($empleado && !$empleado->esCajero()) {
    echo "💡 Solución: Asignar rol 'Cajero' al usuario\n";
    echo "   En Laravel Tinker:\n";
    echo "   > \$user = User::find({$user->id});\n";
    echo "   > \$user->assignRole('Cajero');\n\n";
}

if (!$empleado) {
    echo "💡 Solución: Crear empleado asociado al usuario\n";
    echo "   En Laravel Tinker:\n";
    echo "   > \$empleado = new Empleado();\n";
    echo "   > \$empleado->user_id = {$user->id};\n";
    echo "   > \$empleado->codigo_empleado = 'CAJ001';\n";
    echo "   > \$empleado->estado = 'activo';\n";
    echo "   > \$empleado->puede_acceder_sistema = true;\n";
    echo "   > \$empleado->save();\n\n";
}

exit($todoOk ? 0 : 1);
