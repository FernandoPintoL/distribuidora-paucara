# 🚀 Quick Start - Gestión de Reservas

## En 5 Minutos

### 1. Verificar que todo está instalado
```bash
# Estos archivos ya están creados:
ls app/Http/Controllers/Inventario/ReservaProformaController.php
ls app/Console/Commands/LiberarReservasInconsistentes.php
ls app/Console/Kernel.php
ls resources/js/presentation/pages/Inventario/Reservas/Index.tsx
```

### 2. Crear permisos (una sola vez)
```bash
php artisan tinker

# En tinker:
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.index', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.liberar-masivo', 'guard_name' => 'web']);
> \Spatie\Permission\Models\Permission::create(['name' => 'inventario.reservas.extender', 'guard_name' => 'web']);
> exit
```

### 3. Asignar permisos al rol admin
```bash
php artisan tinker

> $role = \App\Models\Role::where('name', 'admin')->first();
> $role->givePermissionTo(['inventario.reservas.index', 'inventario.reservas.liberar', 'inventario.reservas.liberar-masivo', 'inventario.reservas.extender']);
> exit
```

### 4. Acceder a la aplicación
- URL: `http://localhost/inventario/reservas`
- Deberías ver dashboard con estadísticas

---

## 🧪 Probar Manualmente

### Crear datos de prueba
```bash
php artisan tinker

# Crear proforma y reserva de prueba
> $cliente = \App\Models\Cliente::first();
> $proforma = \App\Models\Proforma::create([
    'cliente_id' => $cliente->id,
    'usuario_creador_id' => auth()->id(),
    'estado_proforma_id' => 1, // PENDIENTE
    'moneda_id' => 1,
]);
> $proforma

# La proforma debería tener reservas activas si reservarStock() fue llamado

# Convertir la proforma
> $proforma->estado_proforma_id = 3; // CONVERTIDA
> $proforma->save();
> exit
```

### Ver en la interfaz
1. Navegar a `/inventario/reservas`
2. Debería mostrar reserva en rojo (inconsistente)
3. Hacer click en "Liberar"
4. Confirmar

---

## 💻 CLI Commands

### Ver todas las reservas inconsistentes (preview)
```bash
php artisan reservas:liberar-inconsistentes --dry-run
```

### Liberar todas las inconsistentes
```bash
php artisan reservas:liberar-inconsistentes
```

### Ver tareas programadas
```bash
php artisan schedule:list
```

---

## 📊 Rutas API

### GET - Listar reservas
```
GET /inventario/reservas
GET /inventario/reservas?tipo=inconsistentes
GET /inventario/reservas?tipo=proximas_expirar
GET /inventario/reservas?estado=ACTIVA
GET /inventario/reservas?busqueda=PRO001
GET /inventario/reservas?page=2&per_page=100
```

### POST - Liberar una reserva
```
POST /inventario/reservas/{id}/liberar
```

### POST - Liberar múltiples
```
POST /inventario/reservas/liberar-masivo
Body: {"reserva_ids": [1, 2, 3]}
```

### POST - Extender expiración
```
POST /inventario/reservas/{id}/extender
```

---

## 🔐 Permisos

Estos permisos se crean automáticamente:
- `inventario.reservas.index` - Ver página
- `inventario.reservas.liberar` - Liberar una
- `inventario.reservas.liberar-masivo` - Liberar múltiples
- `inventario.reservas.extender` - Extender fecha

---

## 📁 Estructura de Archivos

```
app/
├── Http/Controllers/Inventario/
│   └── ReservaProformaController.php (161 líneas)
├── Console/
│   ├── Commands/
│   │   └── LiberarReservasInconsistentes.php (129 líneas)
│   └── Kernel.php (22 líneas) [NUEVO]

routes/
└── web.php (Agregar rutas en línea 549-556)

resources/js/presentation/pages/Inventario/Reservas/
├── Index.tsx (Main page)
└── components/
    ├── ReservasStats.tsx (Estadísticas)
    ├── ReservasFilters.tsx (Filtros)
    └── ReservasTable.tsx (Tabla interactiva)
```

---

## 🐛 Debugging

### Ver logs
```bash
tail -f storage/logs/laravel.log
tail -f storage/logs/reservas-cleanup.log
```

### Verificar rutas
```bash
php artisan route:list | grep reservas
```

### Verificar permisos
```bash
php artisan tinker
> auth()->user()->getPermissions()
> auth()->user()->hasPermissionTo('inventario.reservas.index')
```

### Limpiar cache (si hay problemas)
```bash
php artisan cache:clear
php artisan config:clear
php artisan optimize:clear
```

---

## ✨ Features

✅ Dashboard con 4 métricas principales
✅ Tabla con 8 columnas de información
✅ Selección múltiple con checkbox
✅ Liberación individual con confirmación
✅ Liberación masiva con validación
✅ Extensión de 7 días con logging
✅ Filtros: tipo, estado, búsqueda
✅ Paginación de 50 items
✅ Comando CLI con dry-run
✅ Scheduler automático diario a las 2 AM
✅ Logging completo para auditoría
✅ Indicadores visuales (rojo, amarillo, verde)
✅ Responsive design (mobile + desktop)
✅ Dark mode compatible

---

## 📞 FAQ

**P: ¿Dónde están los logs?**
R: `storage/logs/laravel.log` y `storage/logs/reservas-cleanup.log`

**P: ¿Cómo verificar que se ejecutó el scheduler?**
R: `tail -f storage/logs/reservas-cleanup.log` a las 2 AM

**P: ¿Puedo cambiar la hora del scheduler?**
R: Sí, en `app/Console/Kernel.php` línea 14, cambiar `.dailyAt('02:00')`

**P: ¿Qué pasa si una reserva ya está liberada?**
R: El botón "Liberar" no se muestra (solo aparece para ACTIVAS)

**P: ¿Se puede deshacer una liberación?**
R: No en esta versión. Está en backlog para versión 2.0

**P: ¿Por qué red= inconsistente?**
R: Porque es un problema que requiere atención inmediata

---

**Status:** ✅ Implementación Completa
**Última actualización:** 2024-01-30
