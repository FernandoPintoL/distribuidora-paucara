# 🏭 Gestión de Reservas de Inventario - Documentación Completa

## 📌 Descripción General

Este módulo implementa un sistema completo de **gestión de reservas de inventario** para identificar, monitorear y liberar reservas "huérfanas" - aquellas que permanecen ACTIVAS pero cuyas proformas asociadas ya han sido CONVERTIDAS, RECHAZADAS o VENCIDAS.

**URL:** `http://localhost/inventario/reservas`

**Problema que resuelve:**
- ❌ Antes: Stock bloqueado innecesariamente sin manera de identificarlo
- ✅ Ahora: Dashboard con alertas en rojo, liberación inmediata, limpieza automática

---

## 📂 Estructura de Archivos

```
Paucara/
├── app/
│   ├── Http/Controllers/Inventario/
│   │   └── ReservaProformaController.php          [NUEVO] 162 líneas
│   └── Console/
│       ├── Commands/
│       │   └── LiberarReservasInconsistentes.php  [NUEVO] 129 líneas
│       └── Kernel.php                             [NUEVO] 22 líneas
├── routes/
│   └── web.php                                    [MODIFICADO] +8 líneas
├── resources/js/presentation/pages/Inventario/Reservas/
│   ├── Index.tsx                                  [NUEVO] 108 líneas
│   └── components/
│       ├── ReservasStats.tsx                      [NUEVO] 76 líneas
│       ├── ReservasFilters.tsx                    [NUEVO] 99 líneas
│       └── ReservasTable.tsx                      [NUEVO] 244 líneas
└── [DOCUMENTACIÓN]
    ├── IMPLEMENTATION_RESERVAS.md                 750+ líneas
    ├── RESERVAS_QUICK_START.md                    130+ líneas
    ├── IMPLEMENTATION_SUMMARY.txt                 250+ líneas
    ├── VERIFICATION_CHECKLIST.md                  300+ líneas
    ├── SETUP_PERMISSIONS.sql                      50+ líneas
    └── README_RESERVAS.md                         [Este archivo]
```

---

## 🚀 Inicio Rápido (5 minutos)

### Paso 1: Crear Permisos
```bash
php artisan tinker

> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.index', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar-masivo', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.extender', 'guard_name' => 'web']);
> exit
```

### Paso 2: Asignar Permisos al Rol Admin
```bash
php artisan tinker

> $role = \App\Models\Role::where('name', 'admin')->first();
> $role->givePermissionTo([
    'inventario.reservas.index',
    'inventario.reservas.liberar',
    'inventario.reservas.liberar-masivo',
    'inventario.reservas.extender'
  ]);
> exit
```

### Paso 3: Acceder a la Aplicación
```
http://localhost/inventario/reservas
```

### Paso 4: Probar
```bash
# Preview de inconsistencias
php artisan reservas:liberar-inconsistentes --dry-run

# Liberar inconsistencias (si existen)
php artisan reservas:liberar-inconsistentes
```

---

## 💻 Componentes del Backend

### 1. ReservaProformaController

**Ubicación:** `app/Http/Controllers/Inventario/ReservaProformaController.php`

#### Métodos

##### `index(Request $request)`
Listar y filtrar reservas con estadísticas.

**Parámetros:**
- `tipo` - Filter type: `inconsistentes`, `proximas_expirar`, null (todas)
- `estado` - Reservation state: `ACTIVA`, `EXPIRADA`, `LIBERADA`, null
- `busqueda` - Search by SKU or product name
- `page` - Página (default 1)
- `per_page` - Items por página (default 50)

**Retorna:** Inertia response con:
```javascript
{
  reservas: {
    data: Reserva[],
    current_page: number,
    per_page: number,
    total: number,
    last_page: number
  },
  stats: {
    total_activas: number,
    inconsistentes: number,
    proximas_expirar: number,
    stock_bloqueado: number
  },
  filtros: { /* filtros aplicados */ }
}
```

##### `liberar(int $id)`
Liberar una reserva individual.

**Validaciones:**
- Verifica que exista
- Verifica que estado = ACTIVA

**Operaciones:**
1. Llama `$reserva->liberar()`
2. Registra en logs
3. Retorna con flash message

##### `liberarMasivo(Request $request)`
Liberar múltiples reservas en una transacción.

**Validaciones:**
- `reserva_ids` - Array requerido, mínimo 1
- Cada ID debe existir en BD

**Operaciones:**
1. DB::transaction() para atomicidad
2. Itera y libera cada una
3. Rollback automático si falla alguna
4. Logging con cantidad total

##### `extender(int $id)`
Extender fecha de expiración +7 días.

**Validaciones:**
- Verifica que exista
- Verifica que estado = ACTIVA

**Operaciones:**
1. Suma 7 días a `fecha_expiracion`
2. Guarda cambios
3. Registra fecha anterior y nueva en logs

---

### 2. Console Command: LiberarReservasInconsistentes

**Ubicación:** `app/Console/Commands/LiberarReservasInconsistentes.php`

```bash
php artisan reservas:liberar-inconsistentes [--dry-run]
```

**Flujo:**
1. Busca reservas inconsistentes (ACTIVA + proforma inconsistente)
2. Muestra tabla visual con detalles
3. Calcula stock total a liberar
4. Si `--dry-run`: Muestra preview sin cambios
5. Si ejecución real: Solicita confirmación
6. Libera todas en transacción
7. Registra resultado en logs

**Salida de ejemplo:**
```
Buscando reservas inconsistentes...
Se encontraron 3 reservas inconsistentes

ID | Proforma | Estado     | SKU     | Cantidad | Expiración
1  | PRO-001  | CONVERTIDA | PROD001 | 10       | 2024-02-15 10:30
2  | PRO-002  | RECHAZADA  | PROD002 | 5        | 2024-02-14 14:20
3  | PRO-003  | VENCIDA    | PROD003 | 8        | 2024-02-13 08:45

Stock total a liberar: 23 unidades

¿Deseas liberar estas reservas? [yes/no]: yes

✓ Se liberaron 3 reservas correctamente
✓ Stock liberado: 23 unidades
```

---

### 3. Scheduler: Kernel.php

**Ubicación:** `app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule): void
{
    // Ejecuta diariamente a las 2 AM
    $schedule->command('reservas:liberar-inconsistentes')
        ->dailyAt('02:00')
        ->appendOutputTo(storage_path('logs/reservas-cleanup.log'));
}
```

**Requisitos:**
- Cron job activo: `* * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1`
- Verificar con: `php artisan schedule:list`

---

## 🎨 Componentes del Frontend

### 1. Index.tsx (Página Principal)

**Ubicación:** `resources/js/presentation/pages/Inventario/Reservas/Index.tsx`

**Estructura:**
```
┌─ Encabezado
│  ├─ Título
│  └─ Descripción
├─ Estadísticas (ReservasStats)
│  ├─ Total Activas
│  ├─ Inconsistentes
│  ├─ Próximas a Expirar
│  └─ Stock Bloqueado
├─ Tarjeta Principal
│  ├─ Filtros (ReservasFilters)
│  ├─ Barra de Selección (condicional)
│  ├─ Tabla (ReservasTable)
│  └─ Paginación
```

**Funcionalidades:**
- Selección múltiple con estado
- Liberación masiva con confirmación
- Manejo de errores y loading
- Feedback al usuario

---

### 2. ReservasStats.tsx

**4 Tarjetas de Estadísticas:**

| Nombre | Métrica | Color | Icono |
|--------|---------|-------|-------|
| Total Activas | Total reservas con estado ACTIVA | Azul | Package |
| Inconsistentes | ACTIVA + proforma inconsistente | Rojo (Badge) | AlertTriangle |
| Próximas a Expirar | < 24 horas restantes | Amarillo | Clock |
| Stock Bloqueado | Suma de cantidad_reservada | Púrpura | Archive |

**Características:**
- Colores indicativos del estado
- Información contextual (ej: "Requieren atención")
- Iconografía consistente
- Responsive grid

---

### 3. ReservasFilters.tsx

**Filtros disponibles:**

1. **Búsqueda por SKU/Producto**
   - Input type="text"
   - Busca en SKU y nombre del producto
   - Query param: `?busqueda=...`

2. **Tipo de Reserva**
   - Todas (sin filtro)
   - Inconsistentes (proforma CONVERTIDA/RECHAZADA/VENCIDA)
   - Próximas a Expirar (< 24 horas)
   - Normales (resto)
   - Query param: `?tipo=...`

3. **Estado de Reserva**
   - Todas
   - ACTIVA
   - EXPIRADA
   - LIBERADA
   - CONSUMIDA
   - Query param: `?estado=...`

**Acciones:**
- Botón "Aplicar Filtros" - Recarga con params
- Botón "Limpiar" - Solo visible con filtros activos

**Ejemplo de URL filtrada:**
```
/inventario/reservas?tipo=inconsistentes&estado=ACTIVA&busqueda=PRO&page=1
```

---

### 4. ReservasTable.tsx

**9 Columnas:**

| # | Columna | Contenido | Ancho | Notas |
|---|---------|-----------|-------|-------|
| 1 | Checkbox | Selección individual | Mínimo | Encabezado selecciona todas |
| 2 | ID | #123 | 80px | Mono font, prefijo # |
| 3 | Producto | Nombre + SKU | 200px | Nombre bold, SKU gris |
| 4 | Cantidad | Valor + Almacén | 120px | En bold |
| 5 | Proforma | Número + Estado | 180px | Número bold, badge coloreado |
| 6 | Cliente | Nombre del cliente | 180px | |
| 7 | Expiración | Fecha + Ícono | 150px | Clock icon si < 24h |
| 8 | Estado | Badge coloreado | 120px | Rojo si inconsistente |
| 9 | Acciones | Botones | Flexible | +7 días, Liberar |

**Indicadores Visuales:**

**Fila Inconsistente:**
- Fondo rojo claro (`bg-red-50 dark:bg-red-900/10`)
- Borde izquierdo rojo (`border-l-4 border-l-red-500`)
- Badge rojo dice "INCONSISTENTE"

**Fila Próxima a Expirar:**
- Fondo amarillo claro (`bg-yellow-50`)
- Borde izquierdo amarillo
- Ícono Clock en columna expiración

**Fila Normal:**
- Hover sutil con `bg-muted/50`

**Botones de Acción:**

1. **+7 días**
   - Disponible: Solo para estado ACTIVA
   - Confirmación: "¿Extender por 7 días?"
   - Loading: Deshabilitado y "Extendiendo..."

2. **Liberar** (Trash icon)
   - Disponible: Solo para estado ACTIVA
   - Confirmación: "¿Liberar esta reserva?"
   - Loading: Deshabilitado y "..."

---

## 🔀 Flujos de Datos

### Flujo 1: Ver Dashboard
```
GET /inventario/reservas
    ↓
ReservaProformaController::index()
    ├─ Busca todas las reservas ACTIVAS
    ├─ Calcula 4 estadísticas
    ├─ Retorna Inertia con datos
    ↓
Index.tsx renderiza
    ├─ ReservasStats (4 tarjetas)
    ├─ ReservasFilters
    ├─ ReservasTable (paginada)
    └─ Feedback visual
```

### Flujo 2: Filtrar Inconsistentes
```
Usuario selecciona tipo="inconsistentes"
    ↓
ReservasFilters aplica filtro
    ↓
GET /inventario/reservas?tipo=inconsistentes
    ↓
ReservaProformaController::index()
    ├─ WHERE estado = 'ACTIVA'
    ├─ AND proforma.estadoLogistica.nombre IN ('CONVERTIDA', ...)
    ↓
ReservasTable muestra:
    ├─ Filas con fondo rojo
    ├─ Estado badge rojo
    └─ Botones de liberación
```

### Flujo 3: Liberar Individual
```
Usuario hace click en "Liberar"
    ↓
Confirmación popup: "¿Liberar?"
    ↓
POST /inventario/reservas/{id}/liberar
    ├─ CSRF token validado
    ├─ ReservaProformaController::liberar()
    ├─ $reserva->liberar()
    ├─ Actualiza estado a LIBERADA
    ├─ Incrementa cantidad_disponible
    ├─ Logging: usuario_id, timestamp, cantidad
    ↓
window.location.reload()
    ↓
Página recarga con feedback: "Reserva liberada"
```

### Flujo 4: Liberar Masivo
```
Usuario selecciona 3 reservas
    ↓
Aparece barra azul: "3 seleccionadas"
    ↓
Usuario hace click "Liberar Seleccionadas"
    ↓
Confirmación: "¿Liberar 3 reservas?"
    ↓
POST /inventario/reservas/liberar-masivo
Body: {reserva_ids: [1, 2, 3]}
    ↓
ReservaProformaController::liberarMasivo()
    ├─ Validación de IDs
    ├─ DB::transaction() {
    │   ├─ Libera reserva 1
    │   ├─ Libera reserva 2
    │   ├─ Libera reserva 3
    │   └─ Si error: rollback automático
    │ }
    ├─ Logging: usuario_id, cantidad_total, ids, stock_total
    ↓
window.location.reload()
    ↓
Feedback: "Se liberaron 3 reservas (15 unidades)"
```

### Flujo 5: Limpieza Automática (Nightly)
```
02:00 AM (cada día)
    ↓
Laravel Scheduler ejecuta:
php artisan reservas:liberar-inconsistentes
    ↓
LiberarReservasInconsistentes::handle()
    ├─ Busca reservas inconsistentes
    ├─ Sin confirmación (automático)
    ├─ DB::transaction() libera todas
    ├─ Logging en reservas-cleanup.log
    └─ Resultado: "5 reservas liberadas, 47 unidades"
    ↓
storage/logs/reservas-cleanup.log
```

---

## 🔐 Seguridad

### Protecciones Implementadas

1. **CSRF Protection**
   - Validación en todas las POST
   - Token en meta tag: `<meta name="csrf-token">`
   - Header: `X-CSRF-Token`

2. **Autenticación**
   - Middleware: `auth`, `verified`
   - Usuario debe estar logueado

3. **Autorización (Permisos)**
   - `inventario.reservas.index` - Ver página
   - `inventario.reservas.liberar` - Liberar individual
   - `inventario.reservas.liberar-masivo` - Liberar múltiples
   - `inventario.reservas.extender` - Extender fecha

4. **Validación de Datos**
   - Validación en controller
   - Tipos asegurados (integer, array)
   - Existencia verificada (findOrFail)

5. **Transacciones Atómicas**
   - DB::transaction() para consistencia
   - Rollback automático en error
   - Todas las operaciones o ninguna

6. **Logging de Auditoría**
   - Todas las operaciones registradas
   - Usuario, timestamp, detalles
   - Trazabilidad completa

---

## 📊 Datos y Lógica

### Tabla: reservas_proforma

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INT PK | ID único |
| proforma_id | INT FK | Referencia a proforma |
| stock_producto_id | INT FK | Referencia a stock |
| cantidad_reservada | INT | Unidades reservadas |
| fecha_reserva | DATETIME | Cuándo se creó |
| fecha_expiracion | DATETIME | Cuándo vence |
| estado | VARCHAR(20) | ACTIVA, LIBERADA, CONSUMIDA |
| created_at | DATETIME | Timestamp creación |
| updated_at | DATETIME | Timestamp actualización |
| deleted_at | DATETIME | Soft delete |

### Detección de Inconsistencias

Una reserva es INCONSISTENTE cuando:

```sql
estado = 'ACTIVA'
AND proforma.estado_logistica.nombre IN ('CONVERTIDA', 'RECHAZADA', 'VENCIDA')
```

**Ejemplos:**

1. **Proforma Convertida a Venta**
   - Reserva: ACTIVA
   - Proforma: CONVERTIDA
   - Stock: Bloqueado (debe liberarse)

2. **Proforma Rechazada**
   - Reserva: ACTIVA
   - Proforma: RECHAZADA
   - Motivo: Cliente rechazó pedido
   - Stock: Debe volver a disponible

3. **Proforma Vencida**
   - Reserva: ACTIVA
   - Proforma: VENCIDA
   - Motivo: Fecha de vigencia expiró
   - Stock: Debe liberarse

---

## 🧪 Testing

### Escenario 1: Crear Reserva Inconsistente

```bash
php artisan tinker

# Crear proforma de prueba
> $proforma = factory(\App\Models\Proforma::class)->create();
> $proforma->reservarStock([
    'producto_id' => 1,
    'cantidad' => 10
  ]);

# Convertir a venta (ahora es inconsistente)
> $proforma->update(['estado_proforma_id' => 3]); // CONVERTIDA

# Verificar
> \App\Models\ReservaProforma::where('proforma_id', $proforma->id)->first();
> exit
```

### Escenario 2: Ver en Dashboard

1. Navegar a `/inventario/reservas`
2. Verificar que reserva aparece en rojo
3. Verificar que `stats.inconsistentes` = 1

### Escenario 3: Liberar Manual

1. En tabla, hacer click en "Liberar"
2. Confirmar en popup
3. Esperar recarga
4. Verificar que desaparece
5. Verificar en logs

### Escenario 4: Comando CLI

```bash
# Ver preview
php artisan reservas:liberar-inconsistentes --dry-run

# Ejecutar real
php artisan reservas:liberar-inconsistentes

# Ver logs
tail -f storage/logs/reservas-cleanup.log
```

---

## 📚 Documentación Adicional

- **IMPLEMENTATION_RESERVAS.md** - Documentación técnica completa (750+ líneas)
- **RESERVAS_QUICK_START.md** - Guía de inicio rápido (130+ líneas)
- **VERIFICATION_CHECKLIST.md** - Checklist de verificación (300+ líneas)
- **SETUP_PERMISSIONS.sql** - SQL para crear permisos

---

## ❓ FAQ

**P: ¿Cómo verifico que el scheduler se ejecutó?**
R: `tail -f storage/logs/reservas-cleanup.log` a las 2:05 AM

**P: ¿Puedo cambiar la hora del scheduler?**
R: Sí, en `app/Console/Kernel.php` línea 14, cambiar `->dailyAt('02:00')`

**P: ¿Qué pasa si libero una reserva que ya está liberada?**
R: El método `liberar()` valida `estado == ACTIVA`, así que retorna false sin hacer cambios

**P: ¿Se puede deshacer una liberación?**
R: No en esta versión. Usa logs para auditar. Feature planeada para v2.0

**P: ¿Funciona en PostgreSQL?**
R: Sí. Sin transacciones anidadas (PostgreSQL limitación)

**P: ¿Cuándo se ejecuta la limpieza automática?**
R: Todos los días a las 2 AM (configurable)

**P: ¿Los usuarios ven logs?**
R: No. Logs en `storage/logs/` solo para admins

---

## 🚨 Troubleshooting

### Error: "Class not found"
```bash
composer autoload
php artisan cache:clear
```

### Rutas no funcionan (404)
```bash
php artisan route:clear
php artisan route:cache
php artisan route:list | grep reservas
```

### Comando no aparece
```bash
php artisan command:clear
php artisan optimize:clear
```

### Scheduler no se ejecuta
```bash
# Verificar cron
crontab -l

# Debe contener:
# * * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1

# Verificar scheduler
php artisan schedule:list
php artisan schedule:run
```

### Transacción falla en masivo
```bash
# Verificar integridad
php artisan tinker
> \App\Models\ReservaProforma::find(123)->liberar();
```

---

## 📞 Contacto / Soporte

Para problemas técnicos:
1. Revisar logs en `storage/logs/`
2. Ejecutar comandos de verificación
3. Consultar documentación adicional
4. Verificar permisos en BD

---

**Versión:** 1.0.0
**Última actualización:** 2024-01-30
**Status:** ✅ IMPLEMENTACIÓN COMPLETA
