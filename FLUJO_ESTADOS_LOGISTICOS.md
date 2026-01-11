# 📊 Flujo de Estados Logísticos para Ventas y Entregas

## 1. CREACIÓN DE VENTA (desde Proforma)

Cuando se convierte una proforma a venta, se asigna el **estado inicial** según:

### Condiciones:

```php
if ($requiereEnvio === true) {
    // Venta que requiere envío (delivery a domicilio)
    estado_logistico_id = PENDIENTE_ENVIO
}
else if ($requiereEnvio === false) {
    // Venta de mostrador o retiro en local
    estado_logistico_id = null (sin logística)
}
```

### Lógica de `determinarSiRequiereEnvio()`:

```
¿Tiene dirección de entrega confirmada?
    ├─ SÍ → requiere_envio = true → PENDIENTE_ENVIO
    └─ NO ↓

¿Tiene dirección de entrega solicitada?
    ├─ SÍ → requiere_envio = true → PENDIENTE_ENVIO
    └─ NO ↓

¿Es desde app externa?
    ├─ SÍ → requiere_envio = true → PENDIENTE_ENVIO
    └─ NO ↓

¿Cliente está en localidad diferente de la base?
    ├─ SÍ → requiere_envio = true → PENDIENTE_ENVIO
    └─ NO → requiere_envio = false → null
```

### Estados Iniciales Disponibles:

| Estado | Código | Descripción | Caso de Uso |
|--------|--------|-------------|-----------|
| PENDIENTE_ENVIO | `PENDIENTE_ENVIO` | Venta lista para ser asignada a entrega | Ventas con dirección de envío |
| PENDIENTE_RETIRO | `PENDIENTE_RETIRO` | Venta lista para retiro por cliente | Ventas sin envío (retiro en local) |
| (Ninguno) | `null` | Sin logística | Ventas de mostrador |

---

## 2. ASIGNACIÓN A ENTREGA

Cuando una venta se asigna a una entrega (via `entrega_id` en FASE 3 o pivot en FASE 1):

### Cambio Automático de Estado:

```
Venta.estado_logistico_id = PENDIENTE_ENVIO
    ↓
Entrega creada con Venta
    ↓
SincronizacionVentaEntregaService::alCrearEntrega()
    ↓
Venta.estado_logistico_id = PROGRAMADO
```

**Código:**
```php
determinarEstadoLogistico($venta):
    - Si tiene entregas
    - Buscar el estado más avanzado entre ellas
    - Mapear: entrega.estado → venta.estado_logistico_id

Mapeo de Entregas → Venta:
├─ PROGRAMADO/ASIGNADA → PROGRAMADO
├─ PREPARACION_CARGA/EN_CARGA → EN_PREPARACION
├─ EN_TRANSITO/EN_CAMINO/LLEGO → EN_TRANSITO
├─ ENTREGADO → ENTREGADA
├─ NOVEDAD/RECHAZADO → PROBLEMAS
└─ CANCELADA → CANCELADA
```

---

## 3. CONFIRMACIÓN DE CARGA (Nueva Sincronización)

Cuando se confirma una venta como "cargada" en la entrega:

### Flujo:

```
Frontend: Confirmar Venta en Entrega
    ↓
API: POST /api/entregas/{id}/confirmar-venta/{venta_id}
    ↓
Entrega::confirmarVentaCargada()
    ├─ Verificar venta en AMBAS relaciones ✅
    ├─ Crear pivot si falta ✅
    ├─ Confirmar en tabla pivot (fecha_confirmacion = now()) ✅
    ├─ SYNC #1: sincronizarEstadosVentas() ✅
    │   └─ Venta.estado_logistico_id = EN_PREPARACION
    ├─ Verificar si todas las ventas están confirmadas
    ├─ Cambiar estado: Entrega → LISTO_PARA_ENTREGA ✅
    └─ SYNC #2: sincronizarEstadosVentas() nuevamente ✅
        └─ Venta.estado_logistico_id sigue siendo EN_PREPARACION
```

---

## 4. PROGRESIÓN COMPLETA DE ESTADOS

```
PROFORMA APROBADA
    ↓ convertirAVenta()
VENTA: estado_logistico_id = PENDIENTE_ENVIO
    ↓ Asignar a Entrega
VENTA: estado_logistico_id = PROGRAMADO
    ↓ (Entrega pasa a EN_CARGA y se confirma la venta)
VENTA: estado_logistico_id = EN_PREPARACION
    ↓ (Entrega sale a EN_TRANSITO)
VENTA: estado_logistico_id = EN_TRANSITO
    ↓ (Entrega llega: LLEGO)
VENTA: estado_logistico_id = EN_TRANSITO (sin cambios)
    ↓ (Entrega confirma entrega: ENTREGADO)
VENTA: estado_logistico_id = ENTREGADA ✅
```

---

## 5. TABLA DE REFERENCIA: ESTADOS LOGÍSTICOS

### Categoría: `venta_logistica`

| ID | Código | Nombre | Descripción | Terminal | UI Color |
|----|--------|--------|-------------|----------|----------|
| ? | SIN_ENTREGA | Sin Entrega | No tiene entregas asignadas | ❌ | #9E9E9E |
| ? | PENDIENTE_ENVIO | Pendiente de Envío | Esperando asignación a entrega | ❌ | #FF9800 |
| ? | PENDIENTE_RETIRO | Pendiente de Retiro | Esperando retiro del cliente | ❌ | #FFC107 |
| ? | PROGRAMADO | Programado | Asignada a entrega programada | ❌ | #2196F3 |
| ? | EN_PREPARACION | En Preparación | Siendo preparada/cargada | ❌ | #FF9800 |
| ? | EN_TRANSITO | En Tránsito | En camino al cliente | ❌ | #4CAF50 |
| ? | ENTREGADA | Entregada | Entregada exitosamente | ✅ | #4CAF50 |
| ? | PROBLEMAS | Con Problemas | Novedad/rechazo en entrega | ❌ | #F44336 |
| ? | CANCELADA | Cancelada | Cancelada | ✅ | #757575 |

---

## 6. TRANSICIONES VÁLIDAS

```
SIN_ENTREGA
    └─ (Nunca se asigna inicialmente)

PENDIENTE_ENVIO
    └─ → PROGRAMADO (cuando se crea entrega)
    └─ → CANCELADA (si se cancela)

PENDIENTE_RETIRO
    └─ → ENTREGADA (cuando se retira)
    └─ → CANCELADA (si se cancela)

PROGRAMADO
    ├─ → EN_PREPARACION (cuando se confirma carga)
    └─ → CANCELADA

EN_PREPARACION
    ├─ → EN_TRANSITO (cuando entrega sale)
    └─ → CANCELADA

EN_TRANSITO
    ├─ → ENTREGADA (cuando se confirma entrega)
    ├─ → PROBLEMAS (si hay novedad/rechazo)
    └─ → CANCELADA

ENTREGADA (FINAL)
    └─ (Sin transiciones)

PROBLEMAS
    ├─ → ENTREGADA (si se resuelve)
    └─ → CANCELADA

CANCELADA (FINAL)
    └─ (Sin transiciones)
```

---

## 7. CAMBIOS IMPLEMENTADOS (Enero 2026)

### En `app/Services/Venta/ProformaService.php`:
- ✅ Reemplazó hardcoded `estado_logistico_id: 27` con búsqueda dinámica
- ✅ Nuevo método `obtenerEstadoLogisticoInicial()` que busca por código
- ✅ Logging mejorado para documentar qué estado se asigna

### En `app/Models/Entrega.php`:
- ✅ Método `sincronizarEstadosVentas()` que actualiza todos los estados
- ✅ Llamada automática a sincronización después de confirmar venta
- ✅ Sincronización de recuperación si algo falla
- ✅ Logging detallado con prefijo `[SYNC]`

### En `app/Services/Logistica/SincronizacionVentaEntregaService.php`:
- ✅ Corregido bug: actualiza `estado_logistico_id` (FK) en lugar de `estado_logistico` (virtual)
- ✅ Mejorado `determinarEstadoLogistico()` para buscar en AMBAS relaciones (FASE 1 + FASE 3)
- ✅ Manejo defensivo con fallback a `PENDIENTE_ENVIO` si estado no existe

### Nueva Migración:
- ✅ `2026_01_09_000001_add_missing_venta_logistica_states.php`
  - Agrega los 7 estados faltantes a `estados_logistica`
  - Define colores, iconos y propiedades visuales

---

## 8. TESTING DEL FLUJO

### Test 1: Conversión Proforma → Venta
```bash
1. Crear proforma APROBADA con dirección de envío
2. Convertir a venta
3. Verificar: venta.estado_logistico_id = PENDIENTE_ENVIO
4. Logs deben mostrar: estado_logistico_codigo = "PENDIENTE_ENVIO"
```

### Test 2: Asignación Venta → Entrega
```bash
1. Crear entrega con venta
2. Sincronización automática debe ejecutarse
3. Verificar: venta.estado_logistico_id = PROGRAMADO
4. Logs deben mostrar: "✅ [SYNC] Venta actualizada"
```

### Test 3: Confirmación de Carga
```bash
1. Confirmar venta como "cargada" en entrega
2. Frontend: POST /api/entregas/12/confirmar-venta/9
3. Respuesta debe ser: 200 OK
4. Verificar: venta.estado_logistico_id = EN_PREPARACION
5. Logs deben mostrar ambas sincronizaciones:
   - ✅ [SYNC] Venta actualizada (después de confirmar)
   - ✅ [SYNC] Venta actualizada (después de cambiar estado)
```

### Test 4: Sin Logística (Mostrador)
```bash
1. Crear proforma SIN dirección de envío
2. Convertir a venta
3. Verificar: venta.estado_logistico_id = NULL
4. No debe intentar sincronizar
```

---

## 9. DEBUGGING

### Verificar Estados en BD:
```bash
php artisan tinker
DB::table('estados_logistica')->where('categoria', 'venta_logistica')->get(['id', 'codigo', 'nombre'])
```

### Ver Logs del Último Cambio:
```bash
tail -50 storage/logs/laravel.log | grep "\[SYNC\]\|\[CONFIRM\]"
```

### Query para Ver Historial de Venta:
```sql
SELECT v.id, v.numero, v.estado_logistico_id, el.codigo, el.nombre
FROM ventas v
LEFT JOIN estados_logistica el ON v.estado_logistico_id = el.id
WHERE v.id = 9
```

---

## 10. PRÓXIMOS PASOS

- [ ] Ejecutar migración: `php artisan migrate`
- [ ] Limpiar cachés: `php artisan cache:clear`
- [ ] Probar conversión proforma → venta
- [ ] Probar asignación a entrega
- [ ] Probar confirmación de carga
- [ ] Verificar sincronizaciones en logs
- [ ] Confirmar frontend muestra checkmark al recargar
