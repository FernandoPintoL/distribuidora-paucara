# 🔐 Spatie Permissions: Permisos Directos por Usuario

## Tu Pregunta
> "usando spatie puedo darle permisos específicos a un usuario para que pueda acceder a un módulo completo?"

**Respuesta**: ✅ **SÍ, completamente posible** con Spatie Laravel Permissions.

---

## 1. CÓMO FUNCIONA SPATIE

Spatie tiene **3 niveles de granularidad**:

```
┌─────────────────────────────────────┐
│         USUARIO (User)               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │   ROL (Role)                │   │
│  │  (grupo de permisos)        │   │
│  │  - admin                    │   │
│  │  - editor                   │   │
│  └─────────────────────────────┘   │
│           ↓                         │
│  ┌─────────────────────────────┐   │
│  │  PERMISOS (Permissions)     │   │
│  │  - productos.create         │   │
│  │  - productos.edit           │   │
│  │  - ventas.index             │   │
│  └─────────────────────────────┘   │
│                                     │
│  + PERMISOS DIRECTOS (Sin Rol)     │
│    - usuarios.admin                 │
│    - reportes.export                │
│                                     │
└─────────────────────────────────────┘
```

---

## 2. ARQUITECTURA ACTUAL DE TU SISTEMA

```sql
USUARIO (ID 1, nombre: "Juan")
    ↓
    ├─ ROL: "Preventista"
    │   ↓
    │   └─ PERMISOS (44 permisos agrupados):
    │       - proformas.* (9)
    │       - ventas.* (7)
    │       - clientes.* (18)
    │       - ...
    │
    └─ PERMISOS DIRECTOS (0 actualmente)
```

---

## 3. CÓMO DARLE PERMISOS DIRECTOS A UN USUARIO

### Opción 1: Via Código (Programáticamente)

```php
use App\Models\User;

// Obtener usuario
$user = User::find(1); // Juan

// Darle un permiso directo (sin rol)
$user->givePermissionTo('usuarios.admin');
$user->givePermissionTo('reportes.export');

// Revocar permiso directo
$user->revokePermissionTo('usuarios.admin');

// Verificar si tiene permiso
if ($user->hasPermissionTo('usuarios.admin')) {
    // Hacer algo
}
```

### Opción 2: Via Tinker

```bash
php artisan tinker

# Obtener usuario y darle permisos
> $user = App\Models\User::find(1);
> $user->givePermissionTo('usuarios.admin');
> $user->givePermissionTo('reportes.export');
> $user->getDirectPermissions(); // Ver permisos directos
```

### Opción 3: Via Base de Datos (SQL)

```sql
-- Dar permiso directo a usuario
INSERT INTO model_has_permissions (permission_id, model_type, model_id)
SELECT id, 'App\Models\User', 1
FROM permissions
WHERE name IN ('usuarios.admin', 'reportes.export');

-- Ver permisos directos
SELECT p.name
FROM model_has_permissions mhp
JOIN permissions p ON mhp.permission_id = p.id
WHERE mhp.model_type = 'App\Models\User'
AND mhp.model_id = 1;
```

---

## 4. TU CASO DE USO: Dar Acceso a Módulo Completo

**Pregunta específica**: "¿Puedo darle permisos para acceder a un módulo COMPLETO?"

**Respuesta**: ✅ **SÍ**, hay varias formas:

### Forma 1: Crear "Submódulo Permiso"

```php
// En tu código/seeder
namespace Database\Seeders;

use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        // Crear permiso especial para acceder a módulo completo
        Permission::create(['name' => 'modulo.proformas.acceso-completo']);
        Permission::create(['name' => 'modulo.ventas.acceso-completo']);
        Permission::create(['name' => 'modulo.cajas.acceso-completo']);
    }
}
```

Luego:
```php
// Dar acceso a módulo completo a usuario
$user->givePermissionTo('modulo.proformas.acceso-completo');
$user->givePermissionTo('modulo.cajas.acceso-completo');
```

### Forma 2: Dar Todos los Permisos de un Módulo

```php
use Spatie\Permission\Models\Permission;

// Obtener usuario
$user = User::find(1);

// Obtener TODOS los permisos de un módulo
$moduloPermisos = Permission::where('name', 'like', 'proformas.%')
    ->get();

// Darle todos esos permisos
foreach ($moduloPermisos as $permission) {
    $user->givePermissionTo($permission);
}

// Más corto:
$user->givePermissionTo(
    Permission::where('name', 'like', 'proformas.%')->get()
);
```

### Forma 3: Crear Rol Dinámico

```php
// Si necesitas hacer esto múltiples veces, mejor crear un rol
$role = Role::create(['name' => 'preventista-premium']);

// Agregar todos los permisos de un módulo al rol
$proformasPerms = Permission::where('name', 'like', 'proformas.%')->get();
$role->syncPermissions($proformasPerms);

// Asignar el rol al usuario
$user->assignRole($role);
```

---

## 5. CASOS DE USO REALES EN TU SISTEMA

### Caso 1: "El preventista X necesita ver Cajas"

```php
$preventista = User::where('email', 'preventista@ejemplo.com')->first();

// Opción A: Darle permiso específico
$preventista->givePermissionTo('cajas.index');

// Opción B: Darle TODO acceso a Cajas
$preventista->givePermissionTo(
    Permission::where('name', 'like', 'cajas.%')->get()
);
```

### Caso 2: "El chofer debe gestionar envíos pero es especial"

```php
$chofer = User::find(30); // "Chofer de Prueba"

// Darle permisos adicionales sin cambiar su rol
$chofer->givePermissionTo('envios.create'); // Crear envíos
$chofer->givePermissionTo('envios.update'); // Editar envíos
$chofer->givePermissionTo('reportes.logistica'); // Ver reportes
```

### Caso 3: "Usuario temporal necesita acceso a Inventario"

```php
$temporal = User::create([
    'name' => 'Auditor Temporal',
    'email' => 'auditor@ejemplo.com',
    'password' => bcrypt('temporal123')
]);

// Sin asignar rol, solo permisos directos
$temporal->givePermissionTo(
    Permission::where('name', 'like', 'inventario.%')->get()
);

// Después remover
$temporal->revokePermissionTo(
    Permission::where('name', 'like', 'inventario.%')->get()
);
```

---

## 6. VERIFICAR PERMISOS DE UN USUARIO

```php
use App\Models\User;

$user = User::find(1);

// VER TODOS sus permisos (vía roles + directos)
$user->getAllPermissions(); // Colección de permisos

// VER solo permisos DIRECTOS (sin rol)
$user->getDirectPermissions();

// VER permisos via ROLES
$user->getPermissionsViaRoles();

// VERIFICAR si tiene permiso
$user->hasPermissionTo('proformas.create'); // true/false

// VERIFICAR si tiene CUALQUIERA de varios
$user->hasAnyPermission(['cajas.index', 'cajas.create']);

// VERIFICAR si tiene TODOS
$user->hasAllPermissions(['cajas.index', 'cajas.create']);
```

---

## 7. CONTROLADOR DE EJEMPLO

```php
namespace App\Http\Controllers;

use App\Models\User;
use Spatie\Permission\Models\Permission;

class UserPermissionsController extends Controller
{
    // Dar permiso a usuario
    public function givePermission($userId, $permissionName)
    {
        $user = User::findOrFail($userId);
        $user->givePermissionTo($permissionName);

        return response()->json([
            'message' => "Permiso '{$permissionName}' dado a {$user->name}",
            'permissions' => $user->getAllPermissions()->pluck('name')
        ]);
    }

    // Dar acceso a módulo completo
    public function giveModuleAccess($userId, $module)
    {
        $user = User::findOrFail($userId);

        $permissions = Permission::where('name', 'like', "{$module}.%")
            ->get();

        $user->givePermissionTo($permissions);

        return response()->json([
            'message' => "Módulo '{$module}' dado a {$user->name}",
            'module_permissions' => $permissions->pluck('name')
        ]);
    }

    // Revocar permiso
    public function revokePermission($userId, $permissionName)
    {
        $user = User::findOrFail($userId);
        $user->revokePermissionTo($permissionName);

        return response()->json([
            'message' => "Permiso '{$permissionName}' revocado de {$user->name}"
        ]);
    }

    // Ver permisos del usuario
    public function getUserPermissions($userId)
    {
        $user = User::findOrFail($userId);

        return response()->json([
            'user' => $user->name,
            'roles' => $user->roles->pluck('name'),
            'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
            'all_permissions' => $user->getAllPermissions()->pluck('name')
        ]);
    }
}
```

---

## 8. RUTAS PARA ADMINISTRAR PERMISOS

```php
// routes/web.php

Route::middleware(['auth', 'admin'])->group(function () {
    // Ver permisos de usuario
    Route::get('/users/{user}/permissions',
        'UserPermissionsController@getUserPermissions');

    // Dar permiso específico
    Route::post('/users/{user}/permissions/{permission}',
        'UserPermissionsController@givePermission');

    // Dar acceso a módulo completo
    Route::post('/users/{user}/modules/{module}',
        'UserPermissionsController@giveModuleAccess');

    // Revocar permiso
    Route::delete('/users/{user}/permissions/{permission}',
        'UserPermissionsController@revokePermission');
});
```

---

## 9. PANEL DE ADMINISTRACIÓN DE PERMISOS

```blade
{{-- resources/views/admin/user-permissions.blade.php --}}

@extends('layouts.app')

@section('content')
<div class="container">
    <h2>Gestionar Permisos de {{ $user->name }}</h2>

    <h3>Roles Asignados</h3>
    @foreach($user->roles as $role)
        <span class="badge">{{ $role->name }}</span>
    @endforeach

    <h3>Permisos Directos</h3>
    <form method="POST" action="/users/{{ $user->id }}/permissions">
        @csrf

        <select name="permissions[]" multiple>
            @foreach($allPermissions as $perm)
                <option value="{{ $perm->name }}"
                    @if($user->getDirectPermissions()->contains('id', $perm->id))
                        selected
                    @endif
                >
                    {{ $perm->name }}
                </option>
            @endforeach
        </select>

        <button type="submit">Guardar Permisos</button>
    </form>

    <h3>Agregar Acceso a Módulo Completo</h3>
    <form method="POST" action="/users/{{ $user->id }}/modules">
        @csrf

        <select name="module">
            <option value="proformas">Proformas</option>
            <option value="ventas">Ventas</option>
            <option value="cajas">Cajas</option>
            <option value="inventario">Inventario</option>
            <option value="clientes">Clientes</option>
            <option value="envios">Envíos</option>
        </select>

        <button type="submit">Dar Acceso</button>
    </form>
</div>
@endsection
```

---

## 10. MEJORES PRÁCTICAS

### ✅ HACER
```php
// 1. Dar permisos específicos a usuarios específicos
$user->givePermissionTo('usuarios.admin');

// 2. Usar roles para grupos
$role = Role::create(['name' => 'contador']);
$role->syncPermissions(['cajas.index', 'reportes.export']);

// 3. Auditar cambios
\Log::info("Permiso dado", [
    'user_id' => $user->id,
    'permission' => 'usuarios.admin'
]);

// 4. Revocar cuando sea necesario
$user->revokePermissionTo('usuarios.admin');
```

### ❌ NO HACER
```php
// 1. No confiar en nombres de permisos inconsistentes
// ❌ Evitar: 'user.admin', 'users.admin', 'user-admin'
// ✅ Usar: 'usuarios.admin' (consistente)

// 2. No olvidar revocar permisos temporales
// ❌ $temporal->givePermissionTo('...') // sin revocar después

// 3. No dar demasiados permisos sin auditoría
// ❌ $user->givePermissionTo(Permission::all());

// 4. No guardar permisos en variables
// ❌ $perm = 'usuarios.admin';
// ✅ Usar: Permission::where('name', 'usuarios.admin')
```

---

## 11. FLUJO COMPLETO: CASO REAL

```php
// Escenario: Un nuevo contador necesita acceso temporal a Cajas

// 1. Crear usuario
$contador = User::create([
    'name' => 'Carlos Contador',
    'email' => 'carlos@empresa.com',
    'password' => bcrypt(Str::random(12))
]);

// 2. Asignar rol base
$contador->assignRole('contador');

// 3. Darle permisos adicionales temporales
$contador->givePermissionTo([
    'cajas.index',
    'cajas.show',
    'reportes.cajas'
]);

// 4. Auditar
\Log::info('Contador temporal creado con acceso a cajas', [
    'user_id' => $contador->id,
    'permissions' => $contador->getAllPermissions()->pluck('name')
]);

// ... después de 30 días ...

// 5. Revocar permisos temporales
$contador->revokePermissionTo([
    'cajas.index',
    'cajas.show',
    'reportes.cajas'
]);

// 6. Verificar cambios
if (!$contador->hasPermissionTo('cajas.index')) {
    \Log::info('Acceso a cajas revocado de contador');
}
```

---

## Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Puedo dar permisos a usuarios individuales? | ✅ Sí, con `givePermissionTo()` |
| ¿Puedo dar acceso a módulo completo? | ✅ Sí, con `Permission::where()` |
| ¿Puedo combinar roles + permisos directos? | ✅ Sí, se suman automáticamente |
| ¿Puedo auditar cambios de permisos? | ✅ Sí, con logging y `getDirectPermissions()` |
| ¿Es seguro? | ✅ Sí, si se audita y revoca regularmente |

---

## Próximos Pasos

1. **Crear controlador** de gestión de permisos por usuario
2. **Crear panel admin** para visualizar y editar permisos
3. **Implementar auditoría** de cambios de permisos
4. **Crear comando artisan** para scripts rápidos

¿Quieres que implemente alguno de estos?
