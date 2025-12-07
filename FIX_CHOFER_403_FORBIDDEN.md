# Fix: Chofer 403 Forbidden Error

## El Problema
Cuando el chofer intentaba acceder al dashboard, recibía:
- ✗ `Failed to load resource: the server responded with a status of 403 (Forbidden)`
- ✗ Error: `Error obteniendo estadísticas de proformas`

El error venía del endpoint `/api/proformas/estadisticas` que estaba bloqueado para el rol "chofer".

## La Causa
En `ApiProformaController.php`, el método `stats()` (y otros) verificaban roles permitidos:
```php
if (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado'], $userRoles)) {
    // Solo estos roles podían ver estadísticas
}
else {
    // Resto → 403 Forbidden
}
```

El rol **'chofer'** NO estaba en la lista, por lo que recibía **403 Forbidden**.

## La Solución Aplicada
Se agregó **'chofer'** a la lista de roles autorizados en 3 lugares:

### 1. Método `stats()` - Línea 428
```php
// ❌ ANTES:
if (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado'], $userRoles)) {

// ✅ DESPUÉS:
if (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado', 'chofer'], $userRoles)) {
```

### 2. Método `index()` - Línea 281
```php
// ❌ ANTES:
elseif (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado'], $userRoles)) {

// ✅ DESPUÉS:
elseif (array_intersect(['logistica', 'admin', 'cajero', 'manager', 'encargado', 'chofer'], $userRoles)) {
```

### 3. Otro método - Línea 1900
```php
// ❌ ANTES:
elseif ($user->hasAnyRole(['logistica', 'admin', 'cajero', 'manager', 'encargado'])) {

// ✅ DESPUÉS:
elseif ($user->hasAnyRole(['logistica', 'admin', 'cajero', 'manager', 'encargado', 'chofer'])) {
```

## Cambios Realizados

### Archivo Modificado:
- `app/Http/Controllers/Api/ApiProformaController.php` (3 localizaciones)

### Build ejecutado:
- ✓ `npm run build` → 42.40s completado exitosamente
- ✓ Caché de Laravel limpiado
- ✓ Routes caché actualizado
- ✓ Config caché actualizado

## Próximos Pasos

### 1. Limpia el navegador completamente:
```javascript
// Abre DevTools (F12) y ejecuta:
localStorage.clear();
sessionStorage.clear();
```
O usa: **Ctrl+Shift+Delete** para limpiar cache del navegador

### 2. Intenta loguearme de nuevo como Chofer:
```
Email: chofer@paucara.test
```

### 3. Verifica que:
- ✓ Dashboard del chofer carga sin errores 404 o 403
- ✓ Las estadísticas de proformas se cargan correctamente
- ✓ El sidebar tiene el diseño moderno
- ✓ WebSocket conecta sin problemas
- ✓ Console muestra mensajes de conexión exitosa, NO errores 403

### 4. Consola esperada:
```javascript
✅ Token obtenido de props de Inertia
✅ WebSocket conectado: [socket-id]
✅ Autenticación exitosa en WebSocket
[useProformaNotifications] isConnected=true, user=Chofer de Prueba
📡 Registrando listeners para eventos de proformas
✅ Event listeners registrados
```

## Lógica de Acceso Ahora

El chofer ahora puede:
- ✓ Ver todos los eventos de proformas (creada, aprobada, rechazada, convertida)
- ✓ Ver estadísticas de proformas (`stats()`)
- ✓ Ver listado de proformas (`index()`)
- ✓ Ver detalles de proformas (`show()`)

Esto tiene sentido porque los choferes necesitan ver qué proformas se han convertido en entregas para procesar su logística.

## Si Aún Hay Problemas

### 1. Verifica que el servidor esté corriendo:
```bash
# Terminal 1: Laravel
php artisan serve

# Terminal 2: Node/Vite (si usas dev server)
npm run dev
```

### 2. Verifica los logs:
```bash
tail -f storage/logs/laravel.log
```

### 3. Fuerza limpiar TODOS los cachés:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
# Limpia navegador: Ctrl+Shift+Delete
```

### 4. Verifica el rol del chofer:
```php
php artisan tinker
> User::where('email', 'chofer@paucara.test')->with('roles')->first()
# Debe mostrar: roles: [Chofer]
```

## Summary de Cambios

| Item | Valor |
|------|-------|
| **Archivos modificados** | 1 (ApiProformaController.php) |
| **Métodos actualizados** | 3 (stats, index, otro) |
| **Roles agregados** | chofer |
| **Build status** | ✓ Exitoso en 42.40s |
| **Caches limpiados** | ✓ Cache, Config, Routes |

---

**Siguiente paso:** Recarga el navegador y prueba nuevamente como chofer. ¡Debería funcionar sin errores 403! 🚀
