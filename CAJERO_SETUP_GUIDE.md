# Guía de Configuración del Acceso para Cajero

## Problema
El cajero recibe error 403 (Forbidden) con mensaje:
```
No hay un empleado asociado a tu cuenta. Por favor contacta al administrador.
GET http://localhost:8000/vendedor/dashboard 403 (Forbidden)
```

## Causa
El usuario (cajero) está autenticado pero **no tiene un registro de Empleado vinculado** a su cuenta en la base de datos.

## Solución

### Opción 1: Ejecutar el Seeder Nuevo (Recomendado)

Se ha creado un nuevo seeder `CajeroTestSeeder` que crea usuarios cajero con sus empleados asociados correctamente.

**Paso 1: Ejecutar solo el seeder de cajero (sin perder datos)**
```bash
php artisan db:seed --class=CajeroTestSeeder
```

**Paso 2: Verificar que todo esté correcto**
```bash
php verify_cajero_setup.php cajero1@paucara.test
```

Deberías ver algo como:
```
✅ Usuario encontrado: Juana García (cajero1@paucara.test)
✅ Empleado encontrado: CAJ001
✅ Rol Cajero: Sí
```

**Paso 3: Intentar loguearce con:**
- Email: `cajero1@paucara.test` o `cajero2@paucara.test`
- Contraseña: `password`

---

### Opción 2: Rehacer la Base de Datos Completa

Si prefieres una base de datos limpia:

```bash
php artisan migrate:fresh --seed
```

**Usuarios de prueba creados:**
- Admin: `admin@paucara.test` / `password`
- Cajero 1: `cajero1@paucara.test` / `password`
- Cajero 2: `cajero2@paucara.test` / `password`
- Chofer 1-5: `chofer[1-5]@paucara.test` / `password`

---

### Opción 3: Solucionar Manualmente para un Usuario Existente

Si tienes un usuario cajero que ya existe pero sin empleado asociado:

**Paso 1: Abrir Tinker**
```bash
php artisan tinker
```

**Paso 2: Crear empleado para el usuario**
```php
$user = User::where('email', 'tu-email@example.com')->first();

// Crear empleado asociado
$empleado = new \App\Models\Empleado();
$empleado->user_id = $user->id;
$empleado->codigo_empleado = 'CAJ-TU-CODIGO';
$empleado->ci = '12345678'; // CI del empleado
$empleado->estado = 'activo';
$empleado->puede_acceder_sistema = true;
$empleado->fecha_ingreso = now()->format('Y-m-d');
$empleado->telefono = '70123456';
$empleado->save();

// Asignar rol Cajero
$user->assignRole('Cajero');

// Verificar
$user->empleado->esCajero(); // Debería retornar true
```

---

## Verificación Manual

Ejecuta este comando para verificar cualquier usuario:

```bash
php verify_cajero_setup.php email@example.com
```

Deberías ver todos los requisitos marcados con ✅:
- ✅ Usuario existe
- ✅ Email verificado
- ✅ Acceso web habilitado
- ✅ Tiene rol Cajero
- ✅ Empleado vinculado
- ✅ Empleado activo
- ✅ Puede acceder sistema
- ✅ Es Cajero

---

## Requisitos para Acceso al Dashboard del Vendedor/Cajero

El usuario debe cumplir TODOS estos requisitos:

1. **Usuario autenticado** ✓
2. **Email verificado** (email_verified_at no nulo)
3. **Acceso web habilitado** (can_access_web = true)
4. **Rol Cajero asignado** (users_roles tabla)
5. **Empleado vinculado** (empleado.user_id = user.id)
6. **Empleado activo** (empleado.estado = 'activo')
7. **Acceso sistema habilitado** (empleado.puede_acceder_sistema = true)
8. **Método esCajero() retorna true** (user.hasRole('Cajero'))

---

## Cambios Realizados

✅ **Creado:** `database/seeders/CajeroTestSeeder.php`
- Crea 2 usuarios cajero con empleados asociados
- Crea cajas inicializadas para cada cajero
- Asigna roles correctamente

✅ **Actualizado:** `database/seeders/DatabaseSeeder.php`
- Agregado `$this->call(CajeroTestSeeder::class);`

✅ **Creado:** `verify_cajero_setup.php`
- Script para verificar la configuración de cualquier usuario
- Identifica problemas específicos
- Proporciona soluciones

---

## Modelo de Datos Correcto

```
User (cajero1@paucara.test)
├── Roles: ['Cajero']
├── can_access_web: true
├── email_verified_at: 2024-01-01 ...
│
└── Empleado
    ├── user_id: [user.id]
    ├── codigo_empleado: 'CAJ001'
    ├── estado: 'activo'
    ├── puede_acceder_sistema: true
    │
    └── Cajas
        ├── codigo: 'CAJA-CAJ001'
        └── estado: 'cerrada' (se abre manualmente)
```

---

## Troubleshooting

### Error: "No hay un empleado asociado a tu cuenta"
→ Ejecuta `php verify_cajero_setup.php tu-email@example.com`
→ Si dice "❌ Empleado vinculado: No", ve a Opción 3 arriba

### Error: "No tienes el rol de Cajero"
→ El usuario existe pero no tiene el rol asignado
→ En Tinker: `User::find($id)->assignRole('Cajero')`

### Error: Caja no abierta
→ Esto es normal. El cajero debe abrir una caja manualmente desde el panel
→ El dashboard mostrará mensaje "Debes abrir una caja para ver el dashboard"

---

## Preguntas Frecuentes

**P: ¿Por qué necesita un Empleado asociado?**
R: El sistema distingue entre usuarios (credenciales) y empleados (información de nómina). Un usuario sin empleado no tiene rol laboral definido.

**P: ¿Se pueden tener múltiples empleados por usuario?**
R: No, es una relación 1:1 (HasOne). Un usuario tiene un único empleado.

**P: ¿El empleado sin usuario puede iniciar sesión?**
R: No, necesita un usuario asociado (user_id no nulo).

**P: ¿Qué permisos tiene un Cajero?**
R: Definidos en `RolesAndPermissionsSeeder`. Actualmente puede ver el dashboard y gestionar cajas.
