# 🔐 Setup: Permisos para Gestión de Precios

## ✅ Estado: COMPLETADO

Se han creado e instalado correctamente los permisos para la gestión de precios.

---

## 📋 Permisos Creados

| Permiso | Descripción |
|---------|-------------|
| `precios.index` | Ver página de gestión de precios |
| `precios.update` | Actualizar precios de productos |

---

## 👥 Asignación de Permisos

### Roles que tienen acceso:

```
✅ Super Admin    - Acceso total (incluye precios)
✅ admin          - Acceso total (incluye precios)
✅ gerente        - Acceso total (incluye precios)
```

### Usuario Admin:

```
👤 Nombre: Administrador
📧 Email: admin@admin.com
🔑 Rol: Super Admin
✅ Acceso a: /precios
```

---

## 🧪 Verificación

Para confirmar que todo está correcto:

```bash
# Ver los permisos creados
php artisan tinker
> App\Models\Permission::whereIn('name', ['precios.index', 'precios.update'])->get()

# Ver el usuario admin
> App\Models\User::where('email', 'admin@admin.com')->first()

# Ver roles del admin
> App\Models\User::where('email', 'admin@admin.com')->first()->roles()->get()
```

---

## 🚀 Acceso a la Página

### Por URL:
```
http://localhost/precios
```

### Por middleware:
Se verifica automáticamente:
```php
middleware('permission:precios.index')  // Ver página
middleware('permission:precios.update')  // Actualizar precios
```

---

## 📝 Archivos Usados

```
✅ database/seeders/PreciosPermissionsSeeder.php
   └─ Seeder que creó los permisos

✅ app/Http/Controllers/PrecioController.php
   └─ Controller con middleware de permisos

✅ routes/web.php
   └─ Ruta protegida por permiso precios.index

✅ routes/api.php
   └─ APIs protegidas por permisos
```

---

## 🔄 Si necesitas agregar otro usuario

```php
// Opción 1: Si el usuario tiene un rol que ya incluye los permisos
$user->assignRole('admin'); // O 'gerente', o 'Super Admin'

// Opción 2: Si quieres asignarlo manualmente
$user->givePermissionTo(['precios.index', 'precios.update']);
```

---

## 🐛 Troubleshooting

### Error: "Acceso denegado a /precios"
```
✅ Solución: El usuario no tiene el permiso
   → Asigna el rol 'admin' o 'Super Admin'
   → O ejecuta: php artisan db:seed --class=PreciosPermissionsSeeder
```

### Error: "Route precios.management not found"
```
✅ Solución: Limpiar caché
   → php artisan cache:clear
   → php artisan route:cache
```

---

## 📊 Estructura de Permisos Spatie

El sistema usa **Spatie Permission** para gestionar:

```
Permisos (Permission)
  └─ Acciones específicas (precios.index, precios.update, etc.)

Roles (Role)
  └─ Conjuntos de permisos (Super Admin, admin, gerente, etc.)

Usuarios (User)
  └─ Tienen roles y/o permisos directos
```

---

## ✨ Próximos Pasos

1. ✅ Compila assets (si usas NPM):
   ```bash
   npm run dev
   # o para producción:
   npm run build
   ```

2. ✅ Reinicia el servidor si es necesario:
   ```bash
   php artisan serve
   ```

3. ✅ Accede a `/precios` como usuario admin

4. ✅ Prueba crear una compra y actualizar precios

---

**Fecha de instalación**: 2026-01-24
**Versión**: 1.0
**Estado**: ✅ ACTIVO
