# 📋 Referencia Rápida de Comandos

## 🚀 Setup Inicial

### 1. Crear Permisos
```bash
php artisan tinker
```

Dentro de tinker:
```php
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.index', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar-masivo', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.extender', 'guard_name' => 'web']);
> exit
```

### 2. Asignar a Rol Admin
```bash
php artisan tinker
```

Dentro de tinker:
```php
> $role = \App\Models\Role::where('name', 'admin')->first();
> $role->givePermissionTo(['inventario.reservas.index', 'inventario.reservas.liberar', 'inventario.reservas.liberar-masivo', 'inventario.reservas.extender']);
> exit
```

### 3. Verificar Permisos Creados
```bash
php artisan tinker
```

Dentro de tinker:
```php
> \App\Models\Permission::where('name', 'like', 'inventario.reservas.%')->get();
> exit
```

### 4. Verificar Asignación a Rol
```bash
php artisan tinker
```

Dentro de tinker:
```php
> $role = \App\Models\Role::where('name', 'admin')->first();
> $role->permissions;
> exit
```

---

## 📱 Acceso Web

### Ver Página de Reservas
```
http://localhost/inventario/reservas
```

### Con Filtros
```
http://localhost/inventario/reservas?tipo=inconsistentes
http://localhost/inventario/reservas?tipo=proximas_expirar
http://localhost/inventario/reservas?estado=ACTIVA
http://localhost/inventario/reservas?busqueda=PRO001
http://localhost/inventario/reservas?page=2&per_page=100
```

### Combinados
```
http://localhost/inventario/reservas?tipo=inconsistentes&estado=ACTIVA&busqueda=PRO&page=1
```

---

## 🛠️ Comandos CLI

### Ver Reservas Inconsistentes (Preview)
```bash
php artisan reservas:liberar-inconsistentes --dry-run
```

**Salida:**
```
Buscando reservas inconsistentes...
Se encontraron 5 reservas inconsistentes

[Tabla visual con detalles]

Stock total a liberar: 47 unidades

⚠ DRY RUN: No se realizarán cambios
```

### Liberar Inconsistentes (Ejecución Real)
```bash
php artisan reservas:liberar-inconsistentes
```

**Salida:**
```
Buscando reservas inconsistentes...
Se encontraron 5 reservas inconsistentes

[Tabla visual]

Stock total a liberar: 47 unidades

¿Deseas liberar estas reservas? [yes/no]:
```

Responder con `yes` para confirmar.

---

## ⏰ Scheduler

### Ver Tareas Programadas
```bash
php artisan schedule:list
```

**Salida esperada:**
```
Expression | Command | Description
* * * * * | reservas:liberar-inconsistentes | -
```

### Ejecutar Scheduler Manualmente
```bash
php artisan schedule:run
```

Esta ejecutará todas las tareas programadas que toquen en ese momento.

### Ver Logs de Limpieza Automática
```bash
tail -f storage/logs/reservas-cleanup.log
```

Para dejar de ver logs: `Ctrl+C`

### Ver Logs Generales
```bash
tail -f storage/logs/laravel.log
```

---

## 🔍 Debugging

### Listar Todas las Rutas
```bash
php artisan route:list | grep reservas
```

### Limpiar Cache de Rutas
```bash
php artisan route:clear
```

### Limpiar Todo
```bash
php artisan cache:clear
php artisan config:clear
php artisan optimize:clear
```

### Probar Liberar Manual (Tinker)
```bash
php artisan tinker
```

Dentro de tinker:
```php
> $reserva = \App\Models\ReservaProforma::find(123); // Cambiar ID
> $reserva->liberar();
> exit
```

### Ver Reserva Específica
```bash
php artisan tinker
```

Dentro de tinker:
```php
> $reserva = \App\Models\ReservaProforma::with(['proforma', 'stockProducto'])->find(123);
> $reserva;
> exit
```

### Ver Todas las Inconsistentes (Tinker)
```bash
php artisan tinker
```

Dentro de tinker:
```php
> \App\Models\ReservaProforma::where('estado', 'ACTIVA')
    ->whereHas('proforma.estadoLogistica', function ($q) {
      $q->whereIn('nombre', ['CONVERTIDA', 'RECHAZADA', 'VENCIDA']);
    })
    ->with(['proforma.estadoLogistica', 'stockProducto.producto'])
    ->get();
> exit
```

---

## 📊 Base de Datos

### Ver Reservas en BD
```sql
SELECT id, proforma_id, cantidad_reservada, estado, fecha_expiracion
FROM reservas_proforma
WHERE estado = 'ACTIVA'
LIMIT 10;
```

### Ver Inconsistentes en BD
```sql
SELECT r.id, r.proforma_id, r.estado, el.nombre as estado_proforma
FROM reservas_proforma r
JOIN proformas p ON r.proforma_id = p.id
JOIN estado_proformas el ON p.estado_proforma_id = el.id
WHERE r.estado = 'ACTIVA'
  AND el.nombre IN ('CONVERTIDA', 'RECHAZADA', 'VENCIDA');
```

### Ver Stock Bloqueado
```sql
SELECT
  sp.id,
  sp.producto_id,
  sp.cantidad,
  sp.cantidad_disponible,
  sp.cantidad_reservada,
  SUM(rp.cantidad_reservada) as reservado
FROM stock_productos sp
LEFT JOIN reservas_proforma rp ON sp.id = rp.stock_producto_id AND rp.estado = 'ACTIVA'
GROUP BY sp.id
HAVING SUM(rp.cantidad_reservada) > 0;
```

### Liberar Reserva Manual (SQL)
```sql
BEGIN TRANSACTION;

-- Liberar la reserva
UPDATE reservas_proforma
SET estado = 'LIBERADA'
WHERE id = 123;

-- Restaurar stock
UPDATE stock_productos
SET
  cantidad_disponible = cantidad_disponible + 10,
  cantidad_reservada = cantidad_reservada - 10
WHERE id = (SELECT stock_producto_id FROM reservas_proforma WHERE id = 123);

COMMIT;
```

---

## 🧪 Testing

### Crear Datos de Prueba (Tinker)
```bash
php artisan tinker
```

Dentro de tinker:
```php
> // Crear proforma
> $proforma = \App\Models\Proforma::first();
> $proforma->update(['estado_proforma_id' => 1]); // PENDIENTE

> // Reservar stock
> $proforma->reservarStock([
    ['producto_id' => 1, 'cantidad' => 10]
  ]);

> // Convertir para crear inconsistencia
> $proforma->update(['estado_proforma_id' => 3]); // CONVERTIDA

> // Verificar
> \App\Models\ReservaProforma::where('proforma_id', $proforma->id)->first();
> exit
```

### Test de Liberación Manual
```bash
# 1. Ir a /inventario/reservas
# 2. Verificar que aparece en rojo
# 3. Click en "Liberar"
# 4. Confirmar
# 5. Esperar recarga
# 6. Verificar que desaparece
```

### Test de Liberación Masiva
```bash
# 1. Ir a /inventario/reservas
# 2. Seleccionar 2-3 checkboxes
# 3. Click en "Liberar Seleccionadas"
# 4. Confirmar con cantidad
# 5. Esperar recarga
# 6. Verificar que desaparecen
```

### Test de Extensión
```bash
# 1. Ir a /inventario/reservas?tipo=proximas_expirar
# 2. Click en "+7 días"
# 3. Confirmar
# 4. Esperar recarga
# 5. Verificar que fecha cambió
```

---

## 📊 Performance

### Verificar Índices
```sql
-- Ver índices en reservas_proforma
SELECT indexname FROM pg_indexes
WHERE tablename = 'reservas_proforma';

-- Crear índices si no existen
CREATE INDEX idx_reservas_estado ON reservas_proforma(estado);
CREATE INDEX idx_reservas_fecha_exp ON reservas_proforma(fecha_expiracion);
CREATE INDEX idx_reservas_proforma ON reservas_proforma(proforma_id);
```

### Ver Queries Lentas
```bash
tail -f storage/logs/laravel.log | grep "Executed in"
```

---

## 🔐 Seguridad

### Ver Permisos de Usuario
```bash
php artisan tinker
```

Dentro de tinker:
```php
> $user = \App\Models\User::find(1); // Cambiar ID
> $user->getAllPermissions();
> $user->hasPermissionTo('inventario.reservas.liberar');
> exit
```

### Asignar Permisos a Usuario Específico
```bash
php artisan tinker
```

Dentro de tinker:
```php
> $user = \App\Models\User::find(1);
> $user->givePermissionTo('inventario.reservas.index');
> exit
```

---

## 📝 Logs

### Ver Logs en Tiempo Real
```bash
# Logs generales
tail -f storage/logs/laravel.log

# Solo reservas
tail -f storage/logs/laravel.log | grep -i "reserva"

# Solo cleanup automático
tail -f storage/logs/reservas-cleanup.log

# Con filtro de fecha
tail -f storage/logs/laravel.log | grep "2024-01-30"
```

### Buscar Operación Específica
```bash
grep "usuario_id.*5" storage/logs/laravel.log
grep "reserva_id.*123" storage/logs/laravel.log
```

### Contar Operaciones del Día
```bash
grep -c "Reserva liberada" storage/logs/laravel.log
grep -c "Liberación automática" storage/logs/reservas-cleanup.log
```

---

## 🔄 Mantenimiento

### Limpiar Logs Viejos
```bash
# Ver tamaño
du -sh storage/logs/

# Rotar logs (Laravel)
# Esto se hace automáticamente con rotación configurada en config/logging.php
```

### Backup de Logs
```bash
cp storage/logs/laravel.log storage/logs/laravel.log.backup
cp storage/logs/reservas-cleanup.log storage/logs/reservas-cleanup.log.backup
```

### Verificar Salud del Sistema
```bash
php artisan tinker
```

Dentro de tinker:
```php
> // Contar inconsistentes
> \App\Models\ReservaProforma::where('estado', 'ACTIVA')
    ->whereHas('proforma.estadoLogistica', function ($q) {
      $q->whereIn('nombre', ['CONVERTIDA', 'RECHAZADA', 'VENCIDA']);
    })->count();

> // Contar próximas a expirar
> \App\Models\ReservaProforma::where('estado', 'ACTIVA')
    ->where('fecha_expiracion', '<=', now()->addDay())
    ->count();

> // Stock total bloqueado
> \App\Models\ReservaProforma::where('estado', 'ACTIVA')
    ->sum('cantidad_reservada');

> exit
```

---

## 🎯 Checklist Diario

- [ ] Ver logs: `tail storage/logs/reservas-cleanup.log`
- [ ] Verificar scheduler: `php artisan schedule:list`
- [ ] Checar inconsistentes: `/inventario/reservas?tipo=inconsistentes`
- [ ] Revisar reportes: Exportar si hay muchas
- [ ] Backup: `cp storage/logs/laravel.log ...`

---

**Última actualización:** 2024-01-30
**Versión:** 1.0.0
