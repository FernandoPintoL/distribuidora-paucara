# Configuración de Seeders - Cajero con Acceso Completo a Logística

## 📋 Descripción General

Los siguientes seeders han sido creados/modificados para configurar completamente el acceso del Cajero a logística, entregas, cajas, ventas y proformas.

---

## 🔧 Seeders Creados

### 1. **CajeroTestSeeder.php**
**Ubicación:** `database/seeders/CajeroTestSeeder.php`
**Propósito:** Crea usuarios cajero de prueba con empleados asociados

**Crea:**
- Usuario: `cajero1@paucara.test` / password
- Usuario: `cajero2@paucara.test` / password
- Empleado asociado a cada usuario
- Cajas inicializadas

**Ejecutado en:** DatabaseSeeder (línea 88)

---

### 2. **UpdateCajeroLogisticsPermissionsSeeder.php**
**Ubicación:** `database/seeders/UpdateCajeroLogisticsPermissionsSeeder.php`
**Propósito:** Asigna permisos de logística al rol Cajero

**Permisos Asignados:**
- Cajas: 7 permisos (index, show, abrir, cerrar, create, store, transacciones)
- Ventas: 6 permisos (index, create, store, show, edit, update)
- Proformas: 9 permisos (todas las acciones)
- Clientes: 1 permiso (manage)
- Logística: 2 permisos (dashboard, seguimiento)
- Envíos: 15 permisos (todas las acciones)
- Entregas: 16 permisos (todas las acciones)
- Reportes de Carga: 8 permisos
- Vehículos: 8 permisos

**Total: 73 permisos**

**Ejecutado en:** DatabaseSeeder (línea 91)

---

### 3. **UpdateSidebarPermissionsSeeder.php**
**Ubicación:** `database/seeders/UpdateSidebarPermissionsSeeder.php`
**Propósito:** Actualiza los permisos de los módulos del sidebar

**Actualiza:**
- Módulo Logística: agrega permisos `entregas.index`, `logistica.dashboard`, `envios.index`
- Submódulos de Logística: actualiza permisos individuales
- Módulo Cajas: agrega permiso `cajas.index`
- Módulo Ventas: agrega permiso `ventas.index`
- Módulo Proformas: agrega permiso `proformas.index`
- Módulo Clientes: agrega permiso `clientes.manage`
- Módulo Rutas: agrega permiso `envios.manage`

**Ejecutado en:** DatabaseSeeder (línea 49)

---

### 4. **CleanupDuplicateModulesSeeder.php**
**Ubicación:** `database/seeders/CleanupDuplicateModulesSeeder.php`
**Propósito:** Limpia módulos duplicados en el sidebar

**Limpia:**
- Eliminación de módulo Logística antiguo (ID: 31) y sus submódulos
- Eliminación de módulos Proformas duplicados (IDs: 37, 75)
- Creación de Proformas como módulo principal con submódulos

**Ejecutado en:** DatabaseSeeder (línea 46)

---

## 🔄 Seeders Modificados

### 1. **RolesAndPermissionsSeeder.php**
**Cambios:**
- Ya contenía definición de permisos de entregas
- Ya asignaba permisos al rol Cajero en RolesAndPermissionsSeeder

**Líneas relevantes:** 52-54 (entregas), 239-269 (cajero)

---

### 2. **ModuloSidebarSeeder.php**
**Cambios:**
- Cambio de `firstOrCreate` a `updateOrCreate` para logística
- Cambio de `firstOrCreate` a `updateOrCreate` para submódulos de logística
- Agregado de permisos `entregas.index` y `logistica.dashboard` al módulo principal

**Líneas relevantes:** 215-254

---

### 3. **DatabaseSeeder.php**
**Cambios Agregados (en orden de ejecución):**

```php
// Línea 18: RolesAndPermissionsSeeder - Crea roles y permisos
$this->call(RolesAndPermissionsSeeder::class);

// Línea 43: ModuloSidebarSeeder - Crea módulos del sidebar
$this->call(ModuloSidebarSeeder::class);

// Línea 46: CleanupDuplicateModulesSeeder - Limpia duplicados
$this->call(CleanupDuplicateModulesSeeder::class);

// Línea 49: UpdateSidebarPermissionsSeeder - Actualiza permisos del sidebar
$this->call(UpdateSidebarPermissionsSeeder::class);

// Línea 85: ChoferTestSeeder - Crea choferes
$this->call(ChoferTestSeeder::class);

// Línea 88: CajeroTestSeeder - Crea cajeros
$this->call(CajeroTestSeeder::class);

// Línea 91: UpdateCajeroLogisticsPermissionsSeeder - Asigna permisos al Cajero
$this->call(UpdateCajeroLogisticsPermissionsSeeder::class);
```

---

## 📊 Orden de Ejecución (DatabaseSeeder)

```
1. CoreCatalogSeeder
2. AlmacenesUbicacionSeeder
3. RolesAndPermissionsSeeder ⭐
4. SidebarPermissionsSeeder
5. AssignReportesPermissionsSeeder
6. CajaSeeder
7. ClientesConUsuariosSeeder
8. CuentaContableSeeder
9. EmpleadoRolesSeeder
10. EstadoDocumentoSeeder
11. EstadoMermaSeeder
12. EstadosLogisticaSeeder
13. ImpuestoSeeder
14. ModuloSidebarSeeder ⭐
15. CleanupDuplicateModulesSeeder ⭐
16. UpdateSidebarPermissionsSeeder ⭐
17. MonedaSeeder
18. TipoAjustInventarioSeeder
19. TipoDocumentoSeeder
20. TipoMermaSeeder
21. TipoOperacionCajaSeeder
22. TiposPrecioSeeder
23. CategoriaClienteSeeder
24. LocalidadSeeder
25. Admin user creation
26. ChoferTestSeeder
27. CajeroTestSeeder ⭐
28. UpdateCajeroLogisticsPermissionsSeeder ⭐
29. ValidateAndCreateRequiredDataSeeder
30. CodigosBarraCachePrecalentarSeeder
```

⭐ = Nuevo o Modificado para acceso del Cajero a Logística

---

## 🚀 Uso para Futuras Migraciones

### Migración Fresh (Recomendado)
```bash
php artisan migrate:fresh --seed
```

Esto ejecutará:
1. Todas las migraciones (en orden)
2. Todos los seeders (en orden definido en DatabaseSeeder)
3. El Cajero quedará completamente configurado

### Resultado Final

**Usuario Cajero Creado:**
```
Email: cajero1@paucara.test o cajero2@paucara.test
Contraseña: password
Rol: Cajero
Empleado: Vinculado y activo
Caja: Inicializada
Permisos: 73 (cajas, ventas, proformas, clientes, logística, entregas, rutas)
Sidebar: Visible con todos los módulos (sin duplicados)
```

---

## ✔️ Verificación Post-Seeding

Para verificar que todo está correcto después de ejecutar los seeders:

```bash
# 1. Verificar que el Cajero existe
php artisan tinker
$user = User::where('email', 'cajero1@paucara.test')->first();
$user->hasRole('Cajero') // true
$user->empleado // Empleado object
$user->hasPermissionTo('entregas.index') // true

# 2. Verificar módulos sin duplicados
$modulos = ModuloSidebar::where('es_submenu', false)->pluck('titulo');
// No debería haber 'Logística' duplicado

# 3. Limpiar caché
php artisan cache:clear
```

---

## 📝 Notas Importantes

1. **RolesAndPermissionsSeeder** DEBE ejecutarse PRIMERO para crear los roles y permisos
2. **ModuloSidebarSeeder** debe ejecutarse ANTES de CleanupDuplicateModulesSeeder
3. **CajeroTestSeeder** debe ejecutarse ANTES de UpdateCajeroLogisticsPermissionsSeeder
4. El **cache debe limpiarse** después de cualquier cambio manual
5. Los permisos de entregas se crean en **RolesAndPermissionsSeeder**

---

## 🔄 Cambios Futuros

Si necesitas:
- **Cambiar permisos del Cajero:** Edita `UpdateCajeroLogisticsPermissionsSeeder.php`
- **Cambiar estructura del sidebar:** Edita `ModuloSidebarSeeder.php` o `UpdateSidebarPermissionsSeeder.php`
- **Limpiar duplicados automáticamente:** `CleanupDuplicateModulesSeeder.php` se ejecuta automáticamente

---

## 📦 Archivos Involucrados

```
✅ database/seeders/CajeroTestSeeder.php (NUEVO)
✅ database/seeders/UpdateCajeroLogisticsPermissionsSeeder.php (NUEVO)
✅ database/seeders/UpdateSidebarPermissionsSeeder.php (NUEVO)
✅ database/seeders/CleanupDuplicateModulesSeeder.php (NUEVO)
✅ database/seeders/RolesAndPermissionsSeeder.php (EXISTENTE - sin cambios grandes)
✅ database/seeders/ModuloSidebarSeeder.php (MODIFICADO - updateOrCreate)
✅ database/seeders/DatabaseSeeder.php (MODIFICADO - orden de ejecución)
```

---

**Última Actualización:** 2026-01-03

**Estado:** ✅ Completamente Configurado - Listo para Producción
