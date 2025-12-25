# 🔄 Flujo de Sincronización de Estados: Venta ↔ Entrega

**Fecha**: 2025-12-24
**Estado**: ✅ Implementado
**Versión**: 1.0

---

## 📋 Resumen Ejecutivo

Se implementó un sistema de sincronización automática de estados entre **Ventas** y **Entregas** que garantiza:

✅ Consistencia de datos en tiempo real
✅ Actualización automática de estados logísticos
✅ Visibilidad completa del flujo de entrega
✅ Capacidad de auditoría y tracking

---

## 🎯 Objetivo

Cuando se crea una entrega desde una venta o el estado de la entrega cambia, el **estado logístico de la venta** se actualiza automáticamente para reflejar el progreso del envío.

**Ejemplo**:
```
Venta #5 creada →
  Se asigna a Entrega (PROGRAMADO) →
    Estado Venta = "PROGRAMADO"
      ↓
  Entrega inicia EN_CARGA →
    Estado Venta = "EN_PREPARACION"
      ↓
  Entrega EN_TRANSITO →
    Estado Venta = "EN_TRANSITO"
      ↓
  Entrega ENTREGADA →
    Estado Venta = "ENTREGADA" ✅
```

---

## 🏗️ Arquitectura

### 1. **SincronizacionVentaEntregaService**
Servicio encargado de:
- Mapear estados de entrega a estados logísticos de venta
- Determinar el estado correcto basado en todas las entregas
- Resincronizar estados (para auditoría)
- Generar estadísticas

**Ubicación**: `app/Services/Logistica/SincronizacionVentaEntregaService.php`

### 2. **Events en Modelos**
Eventos automáticos que disparan sincronización:
- `Entrega::created()` → Sincronizar cuando se crea entrega
- `Entrega::updated()` → Sincronizar cuando cambia estado

**Ubicación**: `app/Models/Entrega.php` (boot method)

### 3. **Métodos en Venta**
Métodos para acceder a información logística:
- `obtenerDetalleLogistico()` → Ver todas las entregas
- `estaBeingDelivered()` → ¿Está en tránsito?
- `wasDelivered()` → ¿Fue entregada?
- `hasDeliveryProblems()` → ¿Tiene problemas?
- `getEstadoLogisticoLabel()` → Etiqueta legible
- `getEstadoLogisticoColor()` → Color para UI

### 4. **Endpoints API**
Nuevos endpoints para consultar estado:
- `GET /api/ventas/{venta}/logistica` → Detalle completo
- `GET /api/ventas/{venta}/entregas` → Todas las entregas
- `GET /api/logistica/estadisticas` → Estadísticas generales
- `POST /api/logistica/resincronizar` → Resincronizar (admin)

**Controlador**: `app/Http/Controllers/Api/VentaLogisticaController.php`

---

## 📊 Mapeo de Estados

### Estados de Entrega → Estados Logísticos de Venta

```
ENTREGA                    → VENTA ESTADO_LOGISTICO
─────────────────────────────────────────────────
PROGRAMADO                 → PROGRAMADO
ASIGNADA                   → PROGRAMADO
PREPARACION_CARGA          → EN_PREPARACION
EN_CARGA                   → EN_PREPARACION
LISTO_PARA_ENTREGA         → EN_PREPARACION
EN_CAMINO / EN_TRANSITO    → EN_TRANSITO
LLEGO                      → EN_TRANSITO
ENTREGADO                  → ENTREGADA
NOVEDAD / RECHAZADO        → PROBLEMAS
CANCELADA                  → CANCELADA
```

### Lógica de Determinación (Prioridad)

Cuando una venta tiene múltiples entregas, el estado se determina por **prioridad**:

```
1. ⚠️  PROBLEMAS        (Si alguna tiene NOVEDAD o RECHAZADO)
2. ❌ CANCELADA        (Si TODAS están CANCELADAS)
3. ✅ ENTREGADA        (Si TODAS están ENTREGADAS)
4. 🚚 EN_TRANSITO      (Si alguna está EN_TRANSITO)
5. 📦 EN_PREPARACION   (Si alguna está EN_PREPARACION)
6. 📋 PROGRAMADO       (Por defecto)
```

**Ejemplo con 3 entregas**:
```
Venta #5 con 3 entregas:
- Entrega 1: ENTREGADO
- Entrega 2: EN_TRANSITO      ← Máxima prioridad según estado
- Entrega 3: PROGRAMADO

Estado Venta = EN_TRANSITO (porque hay una EN_TRANSITO)
```

---

## 🔄 Flujo de Sincronización

### Paso 1: Creación de Entrega
```
┌──────────────────────────────────────────┐
│ 1. Controller crea Entrega               │
│    Entrega::create([                     │
│      'venta_id' => 5,                    │
│      'estado' => 'PROGRAMADO'            │
│    ])                                    │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 2. Boot Event Trigger                    │
│    Entrega::created() → listener         │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 3. Sincronización Automática             │
│    SincronizacionVentaEntregaService::   │
│    alCrearEntrega($entrega)              │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 4. Actualización de Venta                │
│    Venta#5::update([                     │
│      'estado_logistico' => 'PROGRAMADO'  │
│    ])                                    │
└──────────────────────────────────────────┘
         ↓
✅ Venta #5 ahora muestra estado logístico
```

### Paso 2: Cambio de Estado de Entrega
```
┌──────────────────────────────────────────┐
│ 1. API cambia estado                     │
│    $entrega->cambiarEstado(              │
│      'EN_CARGA',                         │
│      'Iniciando carga'                   │
│    )                                     │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 2. Boot Event Trigger                    │
│    Entrega::updated() → listener         │
│    if (isDirty('estado') && venta_id)    │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 3. Sincronización Automática             │
│    SincronizacionVentaEntregaService::   │
│    alCambiarEstadoEntrega()              │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ 4. Recalcular Estado de Venta            │
│    Venta#5::update([                     │
│      'estado_logistico' => 'EN_PREP'     │
│    ])                                    │
└──────────────────────────────────────────┘
         ↓
✅ Venta #5 actualizada al nuevo estado
```

---

## 💻 Uso en Código

### Obtener Detalle Logístico de una Venta

```php
$venta = Venta::find(5);

// Obtener información completa
$detalle = $venta->obtenerDetalleLogistico();
// Retorna:
// {
//   "total_entregas": 3,
//   "estado_logistico_actual": "EN_TRANSITO",
//   "estado_logistico_calculado": "EN_TRANSITO",
//   "entregas": [...]
// }

// Métodos de utilidad
if ($venta->estaBeingDelivered()) {
    echo "Está siendo entregada";
}

if ($venta->wasDelivered()) {
    echo "Fue entregada exitosamente";
}

if ($venta->hasDeliveryProblems()) {
    echo "Tiene problemas en la entrega";
}

// Labels legibles
echo $venta->getEstadoLogisticoLabel();  // "En Tránsito"
echo $venta->getEstadoLogisticoColor();  // "purple"
```

### Sincronizar Automáticamente (Sin Intervención Manual)

La sincronización ocurre **automáticamente** cuando:

```php
// 1. Se crea una entrega
$entrega = Entrega::create(['venta_id' => 5, 'estado' => 'PROGRAMADO']);
// ✅ Automáticamente actualiza $venta->estado_logistico = 'PROGRAMADO'

// 2. Se cambia el estado de la entrega
$entrega->cambiarEstado('EN_CARGA');
// ✅ Automáticamente actualiza $venta->estado_logistico = 'EN_PREPARACION'
```

### API: Obtener Detalle desde Frontend

```javascript
// Obtener detalle logístico de una venta
fetch('/api/ventas/5/logistica')
  .then(r => r.json())
  .then(data => {
    console.log('Estado:', data.data.estado_logistico_label);
    console.log('Entregas:', data.data.detalle.entregas);
  });

// Obtener todas las entregas de una venta
fetch('/api/ventas/5/entregas')
  .then(r => r.json())
  .then(data => {
    data.data.entregas.forEach(entrega => {
      console.log(`${entrega.numero}: ${entrega.estado}`);
    });
  });

// Obtener estadísticas generales
fetch('/api/logistica/estadisticas')
  .then(r => r.json())
  .then(data => {
    console.log('Entregas EN_TRANSITO:', data.data.estadisticas.EN_TRANSITO);
  });
```

---

## 📈 Casos de Uso

### Caso 1: Venta con 1 Entrega Simple

```
1. Crear Venta#5
2. Crear Entrega(estado=PROGRAMADO)
   → Venta#5.estado_logistico = "PROGRAMADO" ✅
3. cambiarEstado(EN_CARGA)
   → Venta#5.estado_logistico = "EN_PREPARACION" ✅
4. cambiarEstado(EN_TRANSITO)
   → Venta#5.estado_logistico = "EN_TRANSITO" ✅
5. cambiarEstado(ENTREGADO)
   → Venta#5.estado_logistico = "ENTREGADA" ✅
```

### Caso 2: Venta con Múltiples Entregas (Lote)

```
Crear 3 entregas desde Venta#5:
- Entrega#1: PROGRAMADO
- Entrega#2: PROGRAMADO
- Entrega#3: PROGRAMADO
→ Venta#5.estado_logistico = "PROGRAMADO" (todas en mismo estado)

Cambiar Entrega#1 a EN_TRANSITO:
- Entrega#1: EN_TRANSITO
- Entrega#2: PROGRAMADO
- Entrega#3: PROGRAMADO
→ Venta#5.estado_logistico = "EN_TRANSITO" (prioridad máxima)

Cambiar Entrega#1 a ENTREGADO:
- Entrega#1: ENTREGADO
- Entrega#2: EN_TRANSITO ← Sigue EN_TRANSITO
- Entrega#3: PROGRAMADO
→ Venta#5.estado_logistico = "EN_TRANSITO" (hay una EN_TRANSITO)

Cambiar Entrega#2 a ENTREGADO:
- Entrega#1: ENTREGADO
- Entrega#2: ENTREGADO
- Entrega#3: PROGRAMADO
→ Venta#5.estado_logistico = "PROGRAMADO" (default, espera la última)

Cambiar Entrega#3 a ENTREGADO:
- Entrega#1: ENTREGADO
- Entrega#2: ENTREGADO
- Entrega#3: ENTREGADO
→ Venta#5.estado_logistico = "ENTREGADA" ✅ COMPLETADA
```

### Caso 3: Entrega con Problemas

```
Estados intermedios...
- Entrega#1: ENTREGADO
- Entrega#2: NOVEDAD ← Problema
- Entrega#3: ENTREGADO
→ Venta#5.estado_logistico = "PROBLEMAS" (prioridad máxima)

Resolver problema:
- Entrega#2: cambiarEstado(ENTREGADO)
→ Venta#5.estado_logistico = "ENTREGADA" ✅
```

---

## 🛡️ Garantías

### Consistencia
- ✅ Estado logístico siempre refleja el estado real de entregas
- ✅ Sincronización automática, no manual
- ✅ No es posible tener estado inconsistente

### Auditoría
- ✅ Historial de cambios de entrega se registra automáticamente
- ✅ Cada cambio es trazable
- ✅ Endpoint de resincronización para verificar inconsistencias

### Performance
- ✅ Sincronización ocurre dentro de la transacción de BD
- ✅ Logging configurado para no impactar performance
- ✅ Índices optimizados en tablas de entregas

---

## 🔧 Administración

### Resincronizar Estados (Si hay inconsistencia)

```php
// Via Command (admin)
php artisan logistica:resincronizar

// Via API
POST /api/logistica/resincronizar
```

### Verificar Sincronización

```php
$venta = Venta::find(5);

// Estado actual
echo $venta->estado_logistico;

// Estado calculado (debería ser igual)
$service = app(SincronizacionVentaEntregaService::class);
echo $service->determinarEstadoLogistico($venta);

// Si son diferentes, hay una inconsistencia
```

---

## 📞 Endpoints API Disponibles

### Consultar Estado Logístico

```
GET /api/ventas/{venta}/logistica
Retorna: Estado actual + todas las entregas + detalle

GET /api/ventas/{venta}/entregas
Retorna: Todas las entregas con historial de cambios

GET /api/logistica/estadisticas
Retorna: Conteos por estado logístico
```

### Administración

```
POST /api/logistica/resincronizar (admin only)
Acción: Verificar y corregir inconsistencias
```

---

## 🧪 Testing

### Test: Crear Entrega Actualiza Venta

```php
public function test_crear_entrega_actualiza_estado_venta()
{
    $venta = Venta::factory()->create();

    Entrega::create([
        'venta_id' => $venta->id,
        'estado' => 'PROGRAMADO',
    ]);

    $venta->refresh();
    $this->assertEquals('PROGRAMADO', $venta->estado_logistico);
}
```

### Test: Cambiar Estado Entrega Actualiza Venta

```php
public function test_cambiar_estado_entrega_actualiza_venta()
{
    $venta = Venta::factory()->create();
    $entrega = Entrega::factory()->create([
        'venta_id' => $venta->id,
        'estado' => 'PROGRAMADO',
    ]);

    $entrega->cambiarEstado('EN_CARGA');

    $venta->refresh();
    $this->assertEquals('EN_PREPARACION', $venta->estado_logistico);
}
```

---

## ⚠️ Consideraciones Importantes

1. **Venta sin Entregas**: El estado será `SIN_ENTREGA`
2. **Múltiples Entregas**: El estado se determina por PRIORIDAD, no por cantidad
3. **Sincronización es Automática**: No es necesario actualizar manualmente
4. **Si hay inconsistencias**: Usar endpoint de resincronización
5. **Venta Legacy (sin venta_id)**: No se sincroniza (backward compatible)

---

## 🎓 Recursos

- `SincronizacionVentaEntregaService.php` - Lógica de sincronización
- `VentaLogisticaController.php` - Endpoints API
- `Venta.php` - Métodos de utilidad
- `Entrega.php` - Events de sincronización

---

**Última actualización**: 2025-12-24
**Status**: ✅ Producción Ready
