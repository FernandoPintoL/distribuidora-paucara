# 🔧 FIX: Panel de Envío Detallado en Proformas
**Fecha:** 2026-04-05  
**Severidad:** 🟡 MEDIA (Falta de funcionalidad en UI)  
**Estado:** ✅ CORREGIDO

---

## 📋 PROBLEMA

Cuando el usuario seleccionaba "Requiere Envío" en el formulario de crear proformas, no aparecía ningún panel de envío detallado como el que existe en ventas/create.tsx.

**Consecuencia:** El usuario no podía seleccionar la dirección de entrega para las proformas, aunque el backend soportaba este campo (`direccion_entrega_solicitada_id`).

---

## ✅ SOLUCIÓN

### 1. Backend - ProformaController

Agregué la prop `logistica_envios` a los métodos `create()` y `edit()`:

**Archivo:** `app/Http/Controllers/ProformaController.php`

#### create() - línea 247:
```php
// ✅ CORREGIDO (2026-04-05): Obtener empresa principal para logistica_envios
$empresaPrincipal = \App\Models\Empresa::where('es_principal', true)
    ->where('activo', true)
    ->first();

return Inertia::render('proformas/Create', [
    // ... otros datos ...
    'logistica_envios' => (bool) $empresaPrincipal?->logistica_envios,  // ✅ NUEVO
]);
```

#### edit() - línea 515:
```php
return Inertia::render('proformas/Create', [
    // ... otros datos ...
    'logistica_envios' => (bool) auth()->user()?->empresa?->logistica_envios,  // ✅ NUEVO
]);
```

---

### 2. Frontend - Create.tsx

#### A. Props Interface (línea 139)
```tsx
interface Props {
    // ... otros props ...
    logistica_envios?: boolean  // ✅ CORREGIDO (2026-04-05)
}
```

#### B. Parámetros de función (línea 152)
```tsx
export default function ProformasCreate({
    // ... otros parámetros ...
    logistica_envios = false  // ✅ CORREGIDO (2026-04-05)
}: Props) {
```

#### C. Estados para direcciones (línea 200)
```tsx
// ✅ CORREGIDO (2026-04-05): Estados para dirección de entrega
const [cargandoDirecciones, setCargandoDirecciones] = useState(false)
const [direccionesDisponibles, setDireccionesDisponibles] = useState<any[]>([])
const [direccionEntregaId, setDireccionEntregaId] = useState<number | null>(null)
```

#### D. useEffect para cargar direcciones (línea 283)
```tsx
// ✅ CORREGIDO (2026-04-05): Cargar direcciones cuando se selecciona un cliente
useEffect(() => {
    if (clienteValue && typeof clienteValue === 'number') {
        setCargandoDirecciones(true)
        const cargarDirecciones = async () => {
            try {
                const response = await fetch(`/api/clientes/${clienteValue}/direcciones`)
                if (response.ok) {
                    const result = await response.json()
                    if (result.success && result.data?.direcciones) {
                        const direccionesActivas = result.data.direcciones.filter((d: any) => d.activa !== false)
                        setDireccionesDisponibles(direccionesActivas)
                        // Auto-seleccionar si solo hay una
                        if (direccionesActivas.length === 1 && !direccionEntregaId) {
                            setDireccionEntregaId(direccionesActivas[0].id)
                        }
                    }
                }
            } catch (error) {
                console.error('Error cargando direcciones:', error)
            } finally {
                setCargandoDirecciones(false)
            }
        }
        cargarDirecciones()
    } else {
        setDireccionesDisponibles([])
        setDireccionEntregaId(null)
    }
}, [clienteValue])
```

#### E. Panel de Envío Detallado (línea 779)
```tsx
{/* ✅ CORREGIDO (2026-04-05): Panel de Envío Detallado - Solo si logistica_envios && requiereEnvio */}
{logistica_envios && requiereEnvio && (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            🚚 Detalles de Envío
        </h3>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-4">
            {/* Selector de Direcciones del Cliente */}
            {clienteSeleccionado && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📍 Dirección de Entrega
                    </label>
                    {cargandoDirecciones ? (
                        // ... indicador de carga ...
                    ) : direccionesDisponibles.length > 0 ? (
                        // ... selector de direcciones ...
                    ) : (
                        // ... sin direcciones disponibles ...
                    )}
                </div>
            )}
        </div>
    </div>
)}
```

#### F. Payloads con dirección (línea 586 y 519)

**Modo creación:**
```tsx
const payload = {
    // ... otros campos ...
    direccion_entrega_solicitada_id: requiereEnvio ? direccionEntregaId : null,  // ✅ CORREGIDO (2026-04-05)
    // ...
}
```

**Modo edición:**
```tsx
const detallesPayload = {
    // ... otros campos ...
    direccion_entrega_solicitada_id: requiereEnvio ? direccionEntregaId : null,  // ✅ CORREGIDO (2026-04-05)
    // ...
}
```

#### G. Precarga en edición (línea 308)
```tsx
// ✅ Activar envío si hay fecha de entrega solicitada
if (proforma.fecha_entrega_solicitada) {
    setRequiereEnvio(true)
    // ✅ CORREGIDO (2026-04-05): Preseleccionar dirección de entrega
    if (proforma.direccion_entrega_solicitada_id) {
        setDireccionEntregaId(proforma.direccion_entrega_solicitada_id)
    }
}
```

---

## 🔄 FLUJO COMPLETO

```
Usuario abre formulario de crear proforma
  ↓
Backend pasa logistica_envios = true/false
  ↓
Frontend recibe prop logistica_envios
  ↓
Usuario selecciona cliente
  ↓
Frontend carga direcciones del cliente via /api/clientes/{id}/direcciones
  ↓
Usuario marca "Requiere Envío" = Sí
  ↓
(Si logistica_envios && requiereEnvio) → Mostrar panel "Detalles de Envío"
  ↓
Usuario selecciona dirección de entrega
  ↓
Usuario crea/edita proforma
  ↓
Payload incluye: direccion_entrega_solicitada_id
  ↓
Backend guarda dirección en proformas.direccion_entrega_solicitada_id
```

---

## 📊 COMPARACIÓN CON VENTAS

| Aspecto | Ventas | Proformas |
|---------|--------|-----------|
| logistica_envios | ✅ Tenía | ❌ Faltaba |
| Selector direcciones | ✅ Sí | ❌ Faltaba |
| Carga direcciones al seleccionar cliente | ✅ Sí | ❌ Faltaba |
| Panel envío detallado | ✅ Sí | ❌ Faltaba |
| Envía dirección_id en payload | ✅ Sí | ❌ Faltaba |
| Almacena en BD | ✅ Sí | ✅ Sí (pero no se pasaba) |

**Resultado:** Ahora proformas y ventas tienen feature parity.

---

## 🧪 CASOS DE USO

### Caso 1: Crear proforma SIN envío
```
1. Usuario abre crear proforma
2. Marca "Requiere Envío" = No
3. Panel de envío NO aparece (incluso si logistica_envios = true)
4. Crea proforma
5. direccion_entrega_solicitada_id = null ✅
```

### Caso 2: Crear proforma CON envío (si logistica_envios = false)
```
1. Usuario abre crear proforma
2. Backend envía logistica_envios = false
3. Usuario marca "Requiere Envío" = Sí
4. Panel de envío NO aparece (porque logistica_envios = false)
5. Solo aparecen: fecha entrega, tipo entrega, política pago
6. Crea proforma
7. direccion_entrega_solicitada_id = null ✅
```

### Caso 3: Crear proforma CON envío (si logistica_envios = true) ⭐
```
1. Usuario abre crear proforma
2. Backend envía logistica_envios = true
3. Usuario marca "Requiere Envío" = Sí
4. Panel "Detalles de Envío" APARECE
5. Usuario selecciona cliente
6. Frontend carga direcciones automáticamente
7. Usuario selecciona una dirección
8. Crea proforma
9. Payload: { direccion_entrega_solicitada_id: 5, ... }
10. proformas.direccion_entrega_solicitada_id = 5 ✅
```

### Caso 4: Editar proforma existente
```
1. Usuario abre editar proforma (que tiene dirección_id = 5)
2. Frontend carga datos
3. Precarga: direccionEntregaId = 5
4. Panel de envío muestra dirección preseleccionada
5. Usuario puede cambiar o limpiar dirección
6. Envía cambios
7. Dirección se actualiza ✅
```

---

## ✅ VALIDACIONES

### En Create.tsx
- ✅ Auto-selecciona dirección si solo hay una
- ✅ Muestra loading mientras carga direcciones
- ✅ Maneja caso de cliente sin direcciones
- ✅ Limpia direcciones al cambiar de cliente
- ✅ Envía null si no requiere envío

### En Backend
- ✅ Proforma model tiene campo `direccion_entrega_solicitada_id`
- ✅ Relación `direccionSolicitada()` ya existe
- ✅ Campo es nullable (permite null si no requiere envío)

---

## 📝 ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `app/Http/Controllers/ProformaController.php` | Agregar `logistica_envios` en create() y edit() |
| `resources/js/presentation/pages/proformas/Create.tsx` | Agregar panel de envío, estados, useEffect, payloads |

---

## 🎯 CONCLUSIÓN

✅ **Implementado:** Panel de envío detallado en proformas cuando `logistica_envios = true`  
✅ **Sincronización:** Ahora proformas y ventas tienen la misma funcionalidad  
✅ **Dirección:** El usuario puede seleccionar dirección de entrega al crear proforma  
✅ **Auto-carga:** Las direcciones se cargan automáticamente al seleccionar cliente  
✅ **Edición:** Modo edición preselecciona dirección si ya estaba guardada  

---

**Fix completado:** 2026-04-05 23:00 UTC  
**Desarrollador:** Claude Code  
**Estado:** ✅ LISTO PARA TESTING
