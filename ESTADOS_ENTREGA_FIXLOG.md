# 🔧 FIX LOG: Estados de Entregas - estado_entrega_id Inicialización

**Fecha:** 9 de Enero de 2026
**Problema:** `entregas.estado_entrega_id` estaba NULL al crear entregas
**Solución:** Inicializar correctamente el `estado_entrega_id` (FK a estados_logistica) en todos los puntos de creación

---

## 📋 RESUMEN DEL PROBLEMA

### Síntoma
```
CREATE entrega → estado_entrega_id = NULL ❌
DEBERÍA SER: estado_entrega_id = <ID de PROGRAMADO o PREPARACION_CARGA> ✅
```

### Raíz del Problema

**Las entregas se creaban con:**
- ✅ `estado = 'PROGRAMADO'` (enum string)
- ❌ `estado_entrega_id = NULL` (FK no asignado)

**Ubicaciones afectadas:**
1. `CrearEntregaPorLocalidadService::crearEntrega()` - Creación inicial
2. `ReporteCargoService::generarReporteDesdeEntrega()` - Cambio a PREPARACION_CARGA
3. `EntregaService::crearLote()` - Creación en lote
4. `Entrega::cambiarEstado()` - Cambios manuales de estado

---

## ✅ ARCHIVOS MODIFICADOS

### 1. `app/Services/Logistica/CrearEntregaPorLocalidadService.php`
```php
// LÍNEAS 480-505
// Agregado:
$estadoProgramado = EstadoLogistica::where('codigo', 'PROGRAMADO')
    ->where('categoria', 'entrega_logistica')
    ->first();

// Al crear, agregar:
'estado_entrega_id' => $estadoProgramado?->id,
```

**Cambio:** Inicializa `estado_entrega_id` cuando crea la entrega

---

### 2. `app/Services/Logistica/ReporteCargoService.php`
```php
// LÍNEAS 89-105
// Agregado:
$estadoPreparacion = EstadoLogistica::where('codigo', 'PREPARACION_CARGA')
    ->where('categoria', 'entrega_logistica')
    ->first();

// Al actualizar a PREPARACION_CARGA:
'estado_entrega_id' => $estadoPreparacion?->id,
```

**Cambio:** Sincroniza `estado_entrega_id` cuando se genera el reporte

---

### 3. `app/Services/Logistica/EntregaService.php`
```php
// LÍNEAS 657-674
// Agregado:
$estadoProgramado = EstadoLogistica::where('codigo', 'PROGRAMADO')
    ->where('categoria', 'entrega_logistica')
    ->first();

// Al crear, agregar:
'estado_entrega_id' => $estadoProgramado?->id,
```

**Cambio:** Inicializa `estado_entrega_id` en creación en lote

---

### 4. `app/Models/Entrega.php` - Método `cambiarEstado()`
```php
// LÍNEAS 407-454
// Ahora busca el estado logístico correspondiente:
$estadoLogistico = EstadoLogistica::where('codigo', $nuevoEstado)
    ->where('categoria', 'entrega_logistica')
    ->first();

// Y actualiza AMBOS campos:
$this->update([
    'estado' => $nuevoEstado,
    'estado_entrega_id' => $estadoLogistico?->id,  // ✅ FK sincronizado
]);
```

**Cambio:** Mantiene sincronización entre enum y FK en todos los cambios de estado

---

## 📦 NUEVAS MIGRACIONES

### 1. `2026_01_09_000002_update_null_estado_entrega_id.php`

**Propósito:** Actualizar entregas existentes que tienen `estado_entrega_id = NULL`

**Lo que hace:**
- Obtiene todos los estados de `estados_logistica.categoria = 'entrega_logistica'`
- Mapea el enum `estado` al `estado_entrega_id` correspondiente
- Actualiza TODAS las entregas existentes

**Ejemplo:**
```
ANTES:
├─ Entrega #1: estado='PROGRAMADO', estado_entrega_id=NULL
└─ Entrega #2: estado='PREPARACION_CARGA', estado_entrega_id=NULL

DESPUÉS:
├─ Entrega #1: estado='PROGRAMADO', estado_entrega_id=5 (ID de PROGRAMADO)
└─ Entrega #2: estado='PREPARACION_CARGA', estado_entrega_id=7 (ID de PREPARACION_CARGA)
```

---

## 🚀 FLUJO CORRECTO AHORA

```
CREAR ENTREGA
    ↓
Búsqueda: EstadoLogistica::where('codigo', 'PROGRAMADO')
    ↓
CREATE entregas (
    estado = 'PROGRAMADO',
    estado_entrega_id = 5  ✅ FK asignado
)
    ↓
GENERAR REPORTE
    ↓
Búsqueda: EstadoLogistica::where('codigo', 'PREPARACION_CARGA')
    ↓
UPDATE entregas (
    estado = 'PREPARACION_CARGA',
    estado_entrega_id = 7  ✅ FK actualizado
)
    ↓
CAMBIAR ESTADO (manual o automático)
    ↓
Búsqueda: EstadoLogistica::where('codigo', nuevoEstado)
    ↓
UPDATE entregas (
    estado = nuevoEstado,
    estado_entrega_id = <ID>  ✅ FK sincronizado
)
```

---

## 📊 TABLA: ESTADOS ENTREGA_LOGISTICA

| Código | Descripción | Transición Automática |
|--------|-------------|----------------------|
| PROGRAMADO | Estado inicial al crear entrega | Crea con `estado_entrega_id = ID` |
| ASIGNADA | Asignada a chofer/vehículo | Manual |
| PREPARACION_CARGA | Preparando carga | Al generar reporte |
| EN_CARGA | Cargando vehículo | Manual |
| LISTO_PARA_ENTREGA | Listo para partir | Manual o automático |
| EN_TRANSITO | En camino (GPS activo) | Manual |
| EN_CAMINO | En camino (legacy) | Manual |
| LLEGO | Llegó al destino | Manual |
| ENTREGADO | Entregada exitosamente | Manual (FINAL) |
| NOVEDAD | Problema en entrega | Manual |
| RECHAZADO | Rechazada en entrega | Manual |
| CANCELADA | Cancelada | Manual (FINAL) |

---

## 🔍 VERIFICACIÓN EN BD

### Antes (Problema):
```sql
SELECT id, numero_entrega, estado, estado_entrega_id
FROM entregas
WHERE estado_entrega_id IS NULL;

RESULTADO:
id | numero_entrega | estado | estado_entrega_id
1  | ENT-20260109-1 | PROGRAMADO | NULL ❌
2  | ENT-20260109-2 | PREPARACION_CARGA | NULL ❌
```

### Después (Corregido):
```sql
SELECT id, numero_entrega, estado, estado_entrega_id
FROM entregas
WHERE id IN (1, 2);

RESULTADO:
id | numero_entrega | estado | estado_entrega_id
1  | ENT-20260109-1 | PROGRAMADO | 5 ✅
2  | ENT-20260109-2 | PREPARACION_CARGA | 7 ✅
```

---

## 🔄 PASOS PARA APLICAR

### Paso 1: Ejecutar migraciones
```bash
cd distribuidora-paucara-web
php artisan migrate
```

**Output esperado:**
```
Migrating: 2026_01_09_000002_update_null_estado_entrega_id.php
🔄 [MIGRATION] Actualizando entregas.estado_entrega_id...
📋 Estados disponibles:
   ✓ PROGRAMADO → ID: 5
   ✓ PREPARACION_CARGA → ID: 7
   ...
✅ Actualizadas: 42 entregas
❌ No mapeadas: 0 entregas
```

### Paso 2: Limpiar cachés
```bash
php artisan cache:clear
php artisan config:cache
```

### Paso 3: Verificar en BD
```bash
php artisan tinker
>>> DB::table('entregas')->whereNull('estado_entrega_id')->count()
=> 0  ✅ (Todas tienen estado_entrega_id asignado)
```

### Paso 4: Crear entrega de prueba
```
1. Crear nueva entrega
2. Verificar: entregas.estado_entrega_id ≠ NULL ✅
3. Revisar logs: [cambiarEstado] Estado de entrega actualizado ✅
```

---

## 📝 LOGGING

Todos los cambios ahora loguean:

```
✅ [cambiarEstado] Estado de entrega actualizado
   entrega_id: 12
   estado_anterior: PROGRAMADO
   estado_nuevo: PREPARACION_CARGA
   estado_entrega_id: 7
```

---

## ⚡ RESUMEN DE CAMBIOS

| Ubicación | Antes | Ahora |
|-----------|-------|-------|
| CrearEntrega | `estado_entrega_id = NULL` | Busca + asigna ID |
| ReporteGenerate | No actualiza FK | Busca + actualiza ID |
| EntregaService | No asigna FK | Busca + asigna ID |
| cambiarEstado() | Solo actualiza enum | Actualiza enum + FK |

**Resultado Final:**
- ✅ Todas las entregas tienen `estado_entrega_id` inicializado
- ✅ Sincronización automática entre enum y FK
- ✅ Logging detallado de cambios
- ✅ Compatibilidad FASE 1 (enum) + FASE 3 (FK)

