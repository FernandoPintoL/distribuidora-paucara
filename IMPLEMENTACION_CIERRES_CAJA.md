# 🎯 Guía de Implementación: Flujo de Aprobación de Cierres de Caja

## 📋 Resumen Ejecutivo

Se ha implementado un **flujo completo de aprobación y verificación de cierres de caja** con:
- ✅ Estados del cierre (PENDIENTE → CONSOLIDADA/RECHAZADA → CORREGIDA)
- ✅ Notificaciones en tiempo real vía WebSocket
- ✅ Auditoría completa de cambios
- ✅ Interfaz intuitiva para admins y cajeros

---

## 🚀 Pasos de Implementación Rápida

### 1️⃣ **Ejecutar Migraciones**

```bash
php artisan migrate
```

Esto crea:
- Tabla `estados_cierre` con los 4 estados disponibles
- Campos nuevos en `cierres_caja` para el flujo de aprobación

### 2️⃣ **Ejecutar Seeders de Permisos**

```bash
php artisan db:seed RolesAndPermissionsSeeder
```

Esto asigna los nuevos permisos:
- `cajas.corregir` - Cajero puede corregir cierres rechazados
- `admin.cierres.ver` - Ver cierres pendientes
- `admin.cierres.consolidar` - Aprobar cierres
- `admin.cierres.rechazar` - Rechazar cierres

### 3️⃣ **Integrar Rutas de Inertia**

Agregar a `routes/web.php` (ya incluido, pero verificar):

```php
// En el grupo de cajas, debe estar:
Route::post('/cierres/{id}/corregir', [\App\Http\Controllers\CajaController::class, 'corregirCierre'])
    ->middleware('permission:cajas.corregir')
    ->name('cajas.cierres.corregir');
```

### 4️⃣ **Crear Rutas de Inertia para Admin**

Agregar a `routes/web.php`:

```php
// Página de cierres pendientes para admin
Route::middleware(['auth', 'permission:admin.cierres.ver'])->group(function () {
    Route::get('/admin/cajas/pendientes', function () {
        return inertia('admin/Cajas/Pendientes', [
            'stats' => [
                'pendientes' => \App\Models\CierreCaja::pendientes()->whereDate('fecha', today())->count(),
                'consolidadas' => \App\Models\CierreCaja::consolidadas()->whereDate('fecha', today())->count(),
                'rechazadas' => \App\Models\CierreCaja::rechazadas()->whereDate('fecha', today())->count(),
                'requieren_atencion' => \App\Models\CierreCaja::requierenAtencion()->count(),
                'con_diferencias' => \App\Models\CierreCaja::pendientes()->whereDate('fecha', today())->conDiferencias()->count(),
            ],
        ]);
    })->name('admin.cajas.pendientes');
});
```

### 5️⃣ **Integrar Componentes en Index de Cajas**

Modificar `resources/js/presentation/pages/Cajas/Index.tsx`:

```tsx
import CierresPendientesModal from '@/presentation/components/CorrecionCierreModal';

// En el componente:
const [showCorrecionModal, setShowCorrecionModal] = useState(false);

// Agregar al props de CajaEstadoCard:
<CajaEstadoCard
    cajaAbiertaHoy={cajaAbiertaHoy}
    totalMovimientos={totalMovimientos}
    onAbrirClick={handleAbrirModal}
    onCerrarClick={handleAbrirCierreModal}
    onCorregirClick={() => setShowCorrecionModal(true)}  // NUEVO
    cierreDatos={cajaAbiertaHoy?.cierre}  // NUEVO
/>

// Agregar modal al final:
<CorrecionCierreModal
    show={showCorrecionModal}
    onClose={() => setShowCorrecionModal(false)}
    cierreId={cajaAbiertaHoy?.cierre?.id || 0}
    montoActual={cajaAbiertaHoy?.cierre?.monto_real || 0}
    montoEsperado={cajaAbiertaHoy?.cierre?.monto_esperado || 0}
/>
```

### 6️⃣ **Inicializar WebSocket Listeners** (Opcional pero Recomendado)

En tu main app component o layout principal (`resources/js/layouts/app-layout.tsx`):

```tsx
import { initializeWebSocketListeners } from '@/services/websocket-listeners';

export default function AppLayout({ children }: Props) {
    useEffect(() => {
        // Inicializar WebSocket listeners
        initializeWebSocketListeners();

        return () => {
            // Cleanup
        };
    }, []);

    return (
        // ...
    );
}
```

---

## 📊 Estados y Transiciones

```
PENDIENTE (⏳)
    ↓
    ├─→ [CONSOLIDAR] → CONSOLIDADA (✅)
    └─→ [RECHAZAR] → RECHAZADA (❌)
                        ↓
                    [CORREGIR] → PENDIENTE (⏳)
```

### Estados:

| Estado | Color | Descripción |
|--------|-------|-------------|
| **PENDIENTE** | 🟨 Amarillo | Cajero cierra → Espera admin |
| **CONSOLIDADA** | 🟩 Verde | Admin aprobó → Finalizado |
| **RECHAZADA** | 🟥 Rojo | Admin rechazó → Cajero corrige |
| **CORREGIDA** | 🟦 Azul | Cajero corrigió → Vuelve PENDIENTE |

---

## 🔌 APIs Disponibles

### Para Admin:

```bash
# Obtener cierres pendientes
GET /api/admin/cierres/pendientes
Response: { success: true, data: [...] }

# Obtener estadísticas
GET /api/admin/cierres/estadisticas
Response: { success: true, data: { pendientes: 5, consolidadas: 20, ... } }

# Consolidar (aprobar)
POST /api/admin/cierres/{id}/consolidar
Body: { "observaciones": "Verificado correctamente" }
Response: { success: true, message: "..." }

# Rechazar
POST /api/admin/cierres/{id}/rechazar
Body: { "motivo": "Diferencia en efectivo", "requiere_reapertura": false }
Response: { success: true, message: "..." }
```

### Para Cajero:

```bash
# Corregir un cierre rechazado
POST /cajas/cierres/{id}/corregir
Body: { "monto_real": 5000.00, "observaciones": "Revisé el efectivo nuevamente" }
Response: redirect con mensaje de éxito
```

---

## 🔔 WebSocket Events

El sistema emite los siguientes eventos:

### Cliente recibe:
```javascript
// Cierre fue consolidado (para el cajero)
socket.on('cierre.consolidado', (data) => {
    // data: { cierre_id, caja, usuario, verificador, diferencia, ... }
});

// Cierre fue rechazado (para el cajero)
socket.on('cierre.rechazado', (data) => {
    // data: { cierre_id, caja, motivo, requiere_reapertura, ... }
});

// Nuevo cierre pendiente (para admins)
socket.on('cierre.pendiente', (data) => {
    // data: { cierre_id, caja, usuario, diferencia, ... }
});
```

---

## 📱 Componentes Incluidos

### Backend:
- ✅ `EstadoCierre` Model
- ✅ `CierreCaja` Model (mejorado)
- ✅ `CajaController` (mejorado)
- ✅ `AdminCajaApiController` (nuevos métodos)
- ✅ `CajaWebSocketService` (nuevo)

### Frontend:
- ✅ `EstadoCierreBadge.tsx` - Badge de estado con colores
- ✅ `CorrecionCierreModal.tsx` - Modal para corrección de cajero
- ✅ `CierresPendientes.tsx` - Página de admin para pendientes
- ✅ `Pendientes.tsx` - Página admin con estadísticas
- ✅ `caja-estado-card.tsx` - Mejorado con estado
- ✅ `websocket-listeners.ts` - Servicio de escucha

### Servicios:
- ✅ `websocket-listeners.ts` - Manejo de eventos en tiempo real

---

## 🧪 Testing Manual

### Escenario 1: Flujo Normal (Cajero → Admin → Aprobado)

```
1. Cajero abre caja
2. Cajero realiza movimientos
3. Cajero cierra caja
   → Estado: PENDIENTE
   → Admin recibe notificación WebSocket

4. Admin va a /admin/cajas/pendientes
5. Admin ve el cierre pendiente
6. Admin hace click en "Consolidar"
   → Estado: CONSOLIDADA
   → Cajero recibe notificación WebSocket
   → Movimiento de ajuste finalizado

7. Cajero ve su cierre consolidado ✅
```

### Escenario 2: Flujo con Rechazo y Corrección

```
1. Admin rechaza cierre con motivo "Revisar diferencia"
   → Estado: RECHAZADA
   → Cajero recibe notificación

2. Cajero ve su cierre rechazado
3. Cajero hace click en "Corregir Cierre"
4. Modal abre para que corrija el monto
5. Cajero ingresa nuevo monto y observaciones
   → Estado: PENDIENTE (nuevamente)
   → Admin recibe notificación de nuevo pendiente

6. Admin revisa de nuevo y aprueba
   → Estado: CONSOLIDADA
```

---

## 📝 Auditoría

Todas las acciones se registran automáticamente en `cajas_auditoria`:

```sql
SELECT *
FROM cajas_auditoria
WHERE accion IN ('CIERRE_CONSOLIDADO', 'CIERRE_RECHAZADO', 'CIERRE_CORREGIDO')
ORDER BY created_at DESC;
```

Cada registro incluye:
- Usuario que realizó la acción
- Tipo de acción
- Detalles completos de la transacción
- IP y User-Agent
- Timestamp exacto

---

## ⚙️ Configuración WebSocket

Si usas Laravel Echo o Socket.io, configura en `config/websocket.php`:

```php
'websocket' => [
    'enabled' => env('WS_ENABLED', true),
    'url' => env('WS_URL', 'http://localhost:3001'),
    'secret' => env('WS_SECRET', 'cobrador-websocket-secret-key-2025'),
    'debug' => env('WS_DEBUG', false),
    'timeout' => env('WS_TIMEOUT', 5),
    'retry' => [
        'enabled' => true,
        'times' => 2,
        'sleep' => 100,
    ],
],
```

---

## 🔐 Permisos Requeridos

### Para Cajero:
- `cajas.index` - Ver su caja
- `cajas.cerrar` - Cerrar su caja
- `cajas.corregir` - Corregir cierre rechazado

### Para Admin:
- `admin.cierres.ver` - Ver pendientes
- `admin.cierres.consolidar` - Aprobar cierres
- `admin.cierres.rechazar` - Rechazar cierres

### Para Super Admin:
- Todos los anteriores (acceso completo)

---

## 🐛 Troubleshooting

### Problema: Migraciones no se ejecutan
```bash
# Verificar estado de migraciones
php artisan migrate:status

# Forzar re-ejecución
php artisan migrate:refresh --force
```

### Problema: Permisos no funcionan
```bash
# Limpiar caché de permisos
php artisan cache:forget spatie.permission.cache

# Re-ejecutar seeder
php artisan db:seed RolesAndPermissionsSeeder
```

### Problema: WebSocket no envía notificaciones
```bash
# Verificar que WebSocket está habilitado
php artisan tinker
> config('websocket.enabled')

# Revisar logs
tail -f storage/logs/laravel.log | grep "WebSocket"
```

---

## 📚 Archivos Modificados/Creados

### Base de Datos:
- ✅ `2026_01_21_000001_create_estados_cierre_table.php`
- ✅ `2026_01_21_000002_add_estado_to_cierres_caja_table.php`

### Backend:
- ✅ `app/Models/EstadoCierre.php` (NUEVO)
- ✅ `app/Models/CierreCaja.php` (MODIFICADO)
- ✅ `app/Http/Controllers/CajaController.php` (MODIFICADO)
- ✅ `app/Http/Controllers/Api/AdminCajaApiController.php` (MODIFICADO)
- ✅ `app/Services/WebSocket/CajaWebSocketService.php` (NUEVO)
- ✅ `routes/api.php` (MODIFICADO)
- ✅ `routes/web.php` (MODIFICADO)
- ✅ `database/seeders/RolesAndPermissionsSeeder.php` (MODIFICADO)

### Frontend:
- ✅ `resources/js/presentation/components/cajas/EstadoCierreBadge.tsx` (NUEVO)
- ✅ `resources/js/presentation/components/CorrecionCierreModal.tsx` (NUEVO)
- ✅ `resources/js/presentation/pages/Cajas/components/caja-estado-card.tsx` (MODIFICADO)
- ✅ `resources/js/presentation/pages/admin/Cajas/CierresPendientes.tsx` (NUEVO)
- ✅ `resources/js/presentation/pages/admin/Cajas/Pendientes.tsx` (NUEVO)
- ✅ `resources/js/services/websocket-listeners.ts` (NUEVO)

---

## 🎓 Próximos Pasos Opcionales

1. **Reportes Avanzados**
   - Dashboard de performance de cajeros
   - Reportes de tendencias de diferencias

2. **Automatización**
   - Notificaciones por email para rechazos importantes
   - Escalación automática si pendiente > 4 horas

3. **Análisis**
   - Gráficos de tasa de consolidación vs rechazo
   - Análisis de patrones de diferencias

---

## ✅ Verificación Final

Ejecutar este comando para verificar que todo está en orden:

```bash
# Verificar migraciones
php artisan migrate:status

# Verificar permisos
php artisan tinker
> \Spatie\Permission\Models\Permission::where('name', 'like', 'admin.cierres%')->pluck('name')

# Verificar modelos
> \App\Models\EstadoCierre::all()
> \App\Models\CierreCaja::pendientes()->count()

# Salir
exit
```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar `storage/logs/laravel.log`
2. Ejecutar migraciones nuevamente: `php artisan migrate`
3. Limpiar caché: `php artisan cache:clear && php artisan config:cache`
4. Verificar permisos: `php artisan permission:create-role admin`

---

**¡Implementación Completada! 🎉**

El sistema está listo para usar. Todos los componentes backend están integrados y los componentes frontend están disponibles para ser agregados a tu aplicación.
