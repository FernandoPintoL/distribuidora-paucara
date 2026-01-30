# Implementación: Gestión de Reservas de Inventario

## 📋 Resumen Ejecutivo

Se ha implementado un **sistema completo de gestión de reservas de inventario** (`/inventario/reservas`) para manejar reservas huérfanas (aquellas que permanecen ACTIVAS pero cuyas proformas están CONVERTIDAS, RECHAZADAS o VENCIDAS).

### Problema Resuelto
- Identificación automática de reservas inconsistentes
- Liberación masiva e individual de reservas
- Automatización de limpieza diaria
- Interfaz de usuario intuitiva con estadísticas en tiempo real

---

## 🏗️ Componentes Implementados

### 1. Backend - Controller
**Archivo:** `app/Http/Controllers/Inventario/ReservaProformaController.php`

#### Métodos Implementados:
- **`index()`** - Listar reservas con filtros y estadísticas
  - Filtros: tipo (inconsistentes, próximas_expirar), estado, búsqueda
  - Paginación: 50 items por página
  - Estadísticas: total activas, inconsistentes, próximas a expirar, stock bloqueado
  - Eager loading: `with(['proforma.cliente', 'stockProducto.producto', 'stockProducto.almacen'])`

- **`liberar(id)`** - Liberar una reserva específica
  - Validaciones: Solo reservas ACTIVAS
  - Transacción DB para atomicidad
  - Logging detallado

- **`liberarMasivo(Request)`** - Liberar múltiples reservas
  - Validación de IDs
  - Transacción unitaria para todas
  - Logging con cantidad total liberada

- **`extender(id)`** - Extender expiración (+7 días)
  - Validación de estado
  - Logging con fechas anterior y nueva
  - Rollback automático en error

#### Características de Seguridad:
- Validación de permisos via middleware
- CSRF protection en todas las acciones
- Transacciones atómicas para consistencia
- Logging completo para auditoría

---

### 2. Backend - Comando Automático
**Archivo:** `app/Console/Commands/LiberarReservasInconsistentes.php`

#### Funcionalidad:
```bash
php artisan reservas:liberar-inconsistentes
php artisan reservas:liberar-inconsistentes --dry-run  # Preview sin cambios
```

#### Características:
- Búsqueda de reservas activas con proformas en estado inconsistente
- Tabla visual con reservas a liberar
- Confirmación interactiva
- Opción `--dry-run` para preview
- Logging detallado en `storage/logs/reservas-cleanup.log`

#### Ejemplo de Salida:
```
Buscando reservas inconsistentes...
Se encontraron 5 reservas inconsistentes

ID | Proforma | Estado    | SKU    | Cantidad | Expiración
1  | PRO001   | CONVERTIDA| PRO001 | 10       | 2024-02-15 10:30
2  | PRO002   | RECHAZADA | PRO002 | 5        | 2024-02-14 14:20
...

Stock total a liberar: 25 unidades
¿Deseas liberar estas reservas? [yes/no]
```

---

### 3. Backend - Tarea Programada
**Archivo:** `app/Console/Kernel.php` (CREADO)

#### Configuración de Scheduler:
```php
$schedule->command('reservas:liberar-inconsistentes')
    ->dailyAt('02:00')  // Se ejecuta todos los días a las 2 AM
    ->appendOutputTo(storage_path('logs/reservas-cleanup.log'));
```

#### Verificación:
```bash
# Ver tareas programadas
php artisan schedule:list

# Ejecutar scheduler manualmente
php artisan schedule:run

# Ver logs de ejecución
tail -f storage/logs/reservas-cleanup.log
```

---

### 4. Backend - Rutas
**Archivo:** `routes/web.php` (MODIFICADO)

```php
Route::prefix('inventario/reservas')->name('inventario.reservas.')->group(function () {
    Route::get('/', [ReservaProformaController::class, 'index'])
        ->middleware('permission:inventario.reservas.index')
        ->name('index');

    Route::post('{id}/liberar', [ReservaProformaController::class, 'liberar'])
        ->middleware('permission:inventario.reservas.liberar')
        ->name('liberar');

    Route::post('liberar-masivo', [ReservaProformaController::class, 'liberarMasivo'])
        ->middleware('permission:inventario.reservas.liberar-masivo')
        ->name('liberar-masivo');

    Route::post('{id}/extender', [ReservaProformaController::class, 'extender'])
        ->middleware('permission:inventario.reservas.extender')
        ->name('extender');
});
```

---

### 5. Frontend - Componentes
**Ubicación:** `resources/js/presentation/pages/Inventario/Reservas/`

#### Componentes Creados:

##### **Index.tsx** (Página Principal)
- Layout principal con AppLayout
- Integración de todos los sub-componentes
- Manejo de selección múltiple
- Acción de liberación masiva con confirmación

##### **ReservasStats.tsx** (Estadísticas)
Tarjetas con 4 métricas principales:
1. **Total Activas** - Número total de reservas activas (azul)
2. **Inconsistentes** - Reservas que requieren atención (rojo con badge de alerta)
3. **Próximas a Expirar** - < 24 horas (amarillo con ícono de reloj)
4. **Stock Bloqueado** - Total de unidades en reserva (púrpura)

Cada tarjeta:
- Ícono visual distinto
- Colores indicativos del estado
- Información contextual

##### **ReservasFilters.tsx** (Filtros)
Sección colapsable con:
- **Búsqueda por SKU/Producto** - Input de texto con autocompletado
- **Tipo de Reserva** - Dropdown: Todas, Inconsistentes, Próximas a Expirar, Normales
- **Estado** - Dropdown: Todas, Activa, Expirada, Liberada, Consumida
- Botones: "Aplicar Filtros", "Limpiar"

Características:
- URL query params para persistencia
- Indicador visual de filtros activos
- Botón limpiar solo visible con filtros activos

##### **ReservasTable.tsx** (Tabla)
Tabla responsiva con columnas:
| Columna | Contenido | Nota |
|---------|-----------|------|
| Checkbox | Selección múltiple | |
| ID | #1, #2, etc | Mono font |
| Producto | Nombre + SKU | Nombre en bold, SKU en gris |
| Cantidad | Cantidad + Almacén | |
| Proforma | Número + Estado (Badge) | Badges coloreadas |
| Cliente | Nombre del cliente | |
| Expiración | Fecha + Ícono si próxima | Clock icon si < 24h |
| Estado | Badge coloreado | Rojo si inconsistente |
| Acciones | Botones de acción | Dinámicos según estado |

Características Visuales:
- **Filas inconsistentes:** Fondo rojo claro + borde izquierdo rojo
- **Filas próximas a expirar:** Fondo amarillo claro + borde izquierdo amarillo
- **Filas normales:** Hover sutil
- **Dark mode compatible:** Colores adaptables

Funcionalidades:
- Selección individual y grupal
- Botón "Liberar" individual con confirmación
- Botón "+7 días" para extender
- Loading states en botones
- Detalles expandibles (cantidad, almacén, etc)

---

## 🔐 Permisos Requeridos

Se deben crear los siguientes permisos en la tabla `permissions`:

```sql
-- Permisos para reservas
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('inventario.reservas.index', 'web', NOW(), NOW()),
('inventario.reservas.liberar', 'web', NOW(), NOW()),
('inventario.reservas.liberar-masivo', 'web', NOW(), NOW()),
('inventario.reservas.extender', 'web', NOW(), NOW());

-- Asignar a roles (ejemplo: admin, gerente_inventario)
-- Esto depende de tu estructura de roles existente
```

---

## 🔄 Flujo de Operación

### Escenario 1: Identificar Inconsistencias

```
1. Usuario navega a /inventario/reservas
2. Dashboard carga con estadísticas actuales
3. Sistema detecta automáticamente:
   - Reservas ACTIVAS con proformas CONVERTIDAS
   - Reservas ACTIVAS con proformas RECHAZADAS
   - Reservas ACTIVAS con proformas VENCIDAS
4. Muestra tarjeta roja "Inconsistentes" con contador
5. Tabla filtra automáticamente si aplica
```

### Escenario 2: Liberar Reserva Individual

```
1. Usuario localiza reserva en tabla
2. Hace clic en botón "Liberar"
3. Confirmación popup: "¿Liberar esta reserva?"
4. Si confirma:
   - POST a /inventario/reservas/{id}/liberar
   - Se ejecuta $reserva->liberar() en transacción
   - Se restaura cantidad en stock_productos.cantidad_disponible
   - Se cambia estado a LIBERADA
   - Se registra en logs
   - Página recarga con feedback positivo
```

### Escenario 3: Liberar Múltiples Reservas

```
1. Usuario selecciona checkboxes de reservas
2. Aparece barra azul: "3 reservas seleccionadas"
3. Hace clic en "Liberar Seleccionadas"
4. Confirmación: "¿Liberar 3 reservas?"
5. Si confirma:
   - POST a /inventario/reservas/liberar-masivo
   - Validación de IDs
   - DB::transaction() envuelve todas las liberaciones
   - Rollback automático si una falla
   - Logs incluyen: usuario_id, cantidad_reservas, ids, stock_total
   - Feedback: "Se liberaron 3 reservas (15 unidades)"
```

### Escenario 4: Limpieza Automática Diaria

```
02:00 AM (diario):
1. Kernel scheduler dispara command
2. LiberarReservasInconsistentes::handle() ejecuta
3. Busca todas las reservas inconsistentes
4. Para cada una: $reserva->liberar()
5. Registra en storage/logs/reservas-cleanup.log:
   - Timestamp de ejecución
   - Cantidad de reservas liberadas
   - Stock total liberado
   - Cualquier error
```

---

## 📊 Datos y Lógica de Filtrado

### Detección de Inconsistencias
```sql
SELECT * FROM reservas_proforma r
WHERE r.estado = 'ACTIVA'
AND r.proforma_id IN (
    SELECT p.id FROM proformas p
    JOIN estado_proformas ep ON p.estado_proforma_id = ep.id
    WHERE ep.nombre IN ('CONVERTIDA', 'RECHAZADA', 'VENCIDA')
)
```

### Próximas a Expirar
```sql
SELECT * FROM reservas_proforma r
WHERE r.estado = 'ACTIVA'
AND r.fecha_expiracion <= NOW() + INTERVAL '1 day'
AND r.fecha_expiracion > NOW()
```

---

## 🚀 Instalación y Configuración

### Paso 1: Verificar Archivos Creados
```bash
# Controller
ls app/Http/Controllers/Inventario/ReservaProformaController.php

# Console command
ls app/Console/Commands/LiberarReservasInconsistentes.php

# Kernel
ls app/Console/Kernel.php

# Frontend
ls resources/js/presentation/pages/Inventario/Reservas/Index.tsx
ls resources/js/presentation/pages/Inventario/Reservas/components/
```

### Paso 2: Crear Permisos (si es necesario)
```bash
# Ejecutar en la aplicación
php artisan tinker

# En tinker:
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.index', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar-masivo', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.extender', 'guard_name' => 'web']);
```

### Paso 3: Asignar Permisos a Roles
```bash
# En tinker:
> $role = \App\Models\Role::where('name', 'admin')->first();
> $role->givePermissionTo(['inventario.reservas.index', 'inventario.reservas.liberar', 'inventario.reservas.liberar-masivo', 'inventario.reservas.extender']);
```

### Paso 4: Actualizar Rutas (ya hecho en web.php)
```bash
# Verificar que las rutas estén registradas
php artisan route:list | grep reservas
```

### Paso 5: Verificar Scheduler en Cron
```bash
# Agregar a crontab (si no está ya)
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
```

---

## ✅ Pruebas

### Test Manual 1: Listar Reservas
```bash
# Navegar a http://localhost/inventario/reservas
# Verificar que carga página con estadísticas
# Verificar que muestra tabla vacía o con reservas existentes
```

### Test Manual 2: Filtrar Inconsistentes
```bash
# Crear proforma de prueba
# Reservar stock para esa proforma
# Convertir la proforma a CONVERTIDA
# Navegar a /inventario/reservas?tipo=inconsistentes
# Verificar que aparece con fondo rojo
# Verificar estadísticas: inconsistentes = 1
```

### Test Manual 3: Liberar Individual
```bash
# En tabla, hacer click en botón "Liberar" de una reserva ACTIVA
# Confirmar popup
# Esperar recarga
# Verificar que desaparece de tabla
# Verificar en BD: estado cambió a LIBERADA
# Verificar en logs: entrada de liberación manual
```

### Test Manual 4: Liberar Masivo
```bash
# Seleccionar 3-5 reservas ACTIVAS con checkboxes
# Hacer click en "Liberar Seleccionadas"
# Confirmar popup
# Esperar recarga
# Verificar que todas desaparecen
# Verificar stats actualizadas
```

### Test Manual 5: Extender Fecha
```bash
# Seleccionar reserva próxima a expirar
# Hacer click en "+7 días"
# Confirmar
# Verificar fecha_expiracion en BD: +7 días
# Verificar logs: entrada de extensión
```

### Test Automático: Comando CLI
```bash
# Test dry-run
php artisan reservas:liberar-inconsistentes --dry-run

# Salida esperada:
# "Se encontraron X reservas inconsistentes"
# Tabla con detalles
# "⚠ DRY RUN: No se realizarán cambios"
# Verificar que NO cambió BD

# Test real
php artisan reservas:liberar-inconsistentes

# Confirmar con "yes"
# Salida esperada:
# "✓ Se liberaron X reservas correctamente"
# "✓ Stock liberado: Y unidades"
# Verificar logs en storage/logs/reservas-cleanup.log
```

### Test Scheduler
```bash
# Ver tareas programadas
php artisan schedule:list

# Debe mostrar:
# reservas:liberar-inconsistentes 02:00 (o similar)

# Ejecutar scheduler manualmente
php artisan schedule:run

# Verificar log
tail -f storage/logs/reservas-cleanup.log
```

---

## 📝 Logging

Todos los eventos se registran en:
- **Logs generales:** `storage/logs/laravel.log`
- **Logs de cleanup:** `storage/logs/reservas-cleanup.log`

### Formato de Log (Manual)
```json
{
    "message": "Reserva liberada manualmente",
    "context": {
        "reserva_id": 123,
        "usuario_id": 5,
        "cantidad": 10,
        "proforma_id": 456
    }
}
```

### Formato de Log (Masivo)
```json
{
    "message": "Reservas liberadas en lote",
    "context": {
        "usuario_id": 5,
        "cantidad_reservas": 3,
        "cantidad_stock": 25,
        "ids": [123, 124, 125]
    }
}
```

### Formato de Log (Automático)
```json
{
    "message": "Liberación automática de reservas inconsistentes completada",
    "context": {
        "cantidad_liberadas": 5,
        "stock_total": 50,
        "comando": "reservas:liberar-inconsistentes",
        "timestamp": "2024-02-15T02:00:00Z"
    }
}
```

---

## 🐛 Troubleshooting

### Problema: "No se ve el menú de Reservas"
**Solución:** Verificar permisos en usuario
```bash
# En tinker:
> auth()->user()->givePermissionTo('inventario.reservas.index');
```

### Problema: Comando no aparece en `php artisan list`
**Solución:** Limpiar cache de comandos
```bash
php artisan cache:clear
php artisan config:clear
php artisan optimize:clear
```

### Problema: Las rutas no funcionan (404)
**Solución:** Verificar rutas registradas
```bash
php artisan route:clear
php artisan route:cache
php artisan route:list | grep reservas
```

### Problema: El scheduler no se ejecuta
**Solución:** Verificar cron job
```bash
# Verificar crontab
crontab -l

# Debe contener:
# * * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1

# Agregar si no existe
crontab -e
# Agregar línea arriba
```

### Problema: Error de transacción en liberación masiva
**Solución:** Verificar integridad de datos
```bash
# En tinker:
> \App\Models\ReservaProforma::where('id', 123)->first()->liberar();
# Si falla, el error será más específico
```

---

## 🔄 Mejoras Futuras (Backlog)

1. **Exportación a Excel**
   - Agregar botón para descargar reporte de reservas
   - Incluir filtros aplicados en nombre de archivo

2. **Notificaciones por Email**
   - Alertar a supervisores cuando hay inconsistencias
   - Reporte diario automático a stakeholders

3. **Integración con Dashboard**
   - Widget de "Reservas Inconsistentes" en dashboard
   - Gráfico de evolución de stock bloqueado

4. **Automatización Inteligente**
   - Liberar automáticamente inconsistentes (sin esperar 02:00)
   - Configurar diferentes horarios por almacén

5. **Historial Auditado**
   - Tabla de historial de liberaciones
   - Reversión de acciones (deshacer liberación)

6. **Búsqueda Avanzada**
   - Filtro por rango de fechas
   - Filtro por almacén
   - Filtro por tipo de proforma (PED, PEDI, etc)

---

## 📚 Referencia Rápida

### URLs
- Ver reservas: `/inventario/reservas`
- Filtradas: `/inventario/reservas?tipo=inconsistentes`
- Por página: `/inventario/reservas?page=2&per_page=100`

### Comandos
```bash
# Ejecutar limpieza
php artisan reservas:liberar-inconsistentes

# Preview
php artisan reservas:liberar-inconsistentes --dry-run

# Ver scheduler
php artisan schedule:list

# Ejecutar scheduler
php artisan schedule:run
```

### Modelos
- `ReservaProforma::activas()` - Filtrar activas
- `ReservaProforma::expiradas()` - Filtrar expiradas
- `reserva->liberar()` - Liberar una reserva
- `reserva->consumir()` - Consumir una reserva

### Métodos del Controller
- `index()` - GET /inventario/reservas
- `liberar($id)` - POST /inventario/reservas/{id}/liberar
- `liberarMasivo()` - POST /inventario/reservas/liberar-masivo
- `extender($id)` - POST /inventario/reservas/{id}/extender

---

## 📞 Soporte

Para problemas o mejoras, revisar:
1. Logs: `storage/logs/laravel.log`
2. Logs de cleanup: `storage/logs/reservas-cleanup.log`
3. Tablas BD: `reservas_proforma`, `stock_productos`
4. Permisos: `permissions`, `role_has_permissions`

**Autor:** Sistema de Gestión de Reservas
**Fecha:** 2024-01-30
**Versión:** 1.0.0
