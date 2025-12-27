# FASE 1: ANTES vs DESPUÉS

## Vista Conceptual

### ANTES (Confuso) ❌
```
┌─────────────────────────────────────────────────────────────┐
│                    1 ENTREGA POR VENTA                      │
└─────────────────────────────────────────────────────────────┘

Venta #1001 (500kg, $5,000)  Venta #1002 (600kg)  Venta #1003 (400kg)
    ↓                              ↓                      ↓
Entrega #1                    Entrega #2           Entrega #3
(venta_id=1001)              (venta_id=1002)      (venta_id=1003)
(vehiculo_id=10)             (vehiculo_id=10)     (vehiculo_id=10)
(chofer_id=5)                (chofer_id=5)        (chofer_id=5)

PROBLEMA: 3 entregas separadas que DEBEN estar juntas

    ↓ Se consolidan en...

ReporteCarga #100 (entrega_id=1 ← FK)
    ↓ Pero también:
reporte_carga_entregas (N:N pivot)
    └─ Entrega #1
    └─ Entrega #2
    └─ Entrega #3

RESULTADO: DOS CAMINOS para la misma relación
├─ FK entrega_id de ReporteCarga
└─ Pivot reporte_carga_entregas

⚠️ ¿Cuál es la fuente de verdad?
⚠️ ¿Qué pasa si no están sincronizadas?
```

---

### DESPUÉS (Claro) ✅
```
┌─────────────────────────────────────────────────────────────┐
│              1 ENTREGA CON MÚLTIPLES VENTAS                 │
└─────────────────────────────────────────────────────────────┘

Entrega #100
├─ vehiculo_id: 10 (Camión ABC-123)
├─ chofer_id: 5 (Juan García)
├─ zona_id: 3 (Centro)
├─ numero_entrega: ENT-20251227-001
├─ estado: PROGRAMADA
└─ CONTIENE 3 VENTAS (via pivot entrega_venta):
    ├─ Venta #1001 (500kg, orden=1) - confirmado_por=NULL
    ├─ Venta #1002 (600kg, orden=2) - confirmado_por=NULL
    └─ Venta #1003 (400kg, orden=3) - confirmado_por=user_5

    TOTAL: 1500kg (cabe en vehículo de 2000kg)

FLUJO CLARO:
1. Almacenero ve Entrega #100 con 3 ventas
2. Confirma carga: "Venta #1001 ✓ cargada"
3. Confirma carga: "Venta #1002 ✓ cargada"
4. Confirma carga: "Venta #1003 ✓ cargada"
5. Sistema marca automáticamente: Entrega → LISTA_PARA_ENTREGA
6. Chofer recibe Entrega #100 lista
7. Imprime ReporteCarga (documento único con 3 clientes)
8. Entrega a cada cliente

VENTAJA: Entrega es el contenedor principal ✓
```

---

## Vista de Base de Datos

### TABLA: entregas (ANTES)
```sql
id (PK)                 | int
proforma_id (FK)        | int ← Legacy
venta_id (FK)           | int ← 1 venta por entrega ❌
chofer_id (FK)          | int
vehiculo_id (FK)        | int
direccion_cliente_id    | int
peso_kg                 | decimal
volumen_m3              | decimal
-- Nuevos campos pero mal organizados --
reporte_carga_id (FK)   | int ← ¿Por qué acá?
confirmado_carga_por    | int
-- Estados duplicados --
estado ENUM             | PROGRAMADO, EN_CARGA, etc.
timestamps
```

### TABLA: entregas (DESPUÉS)
```sql
id (PK)                 | int
proforma_id (FK)        | int ← Solo para legacy (deprecated)
-- ELIMINADO: venta_id --
chofer_id (FK)          | int
vehiculo_id (FK)        | int
direccion_cliente_id    | int
peso_kg                 | decimal
volumen_m3              | decimal

-- NUEVOS CAMPOS PARA NUEVA ARQUITECTURA --
zona_id (FK)            | int ← ¡NUEVO! Agrupa por localidad
numero_entrega          | varchar ← ¡NUEVO! ID legible (ENT-20251227-001)

-- Estados simples --
estado ENUM             | PROGRAMADA, EN_CARGA, etc.
timestamps
```

### NUEVA TABLA: entrega_venta (PIVOT) ✨
```sql
id (PK)                 | int
entrega_id (FK)         | int ← Qué entrega
venta_id (FK)           | int ← Qué venta
orden                   | int ← Orden de carga (1, 2, 3...)
confirmado_por (FK)     | int ← Qué usuario confirmó
fecha_confirmacion      | timestamp ← Cuándo se confirmó
notas                   | text ← Observaciones
timestamps

ÍNDICES:
├─ UNIQUE(entrega_id, venta_id) ← Una venta solo 1x por entrega
├─ INDEX(entrega_id, orden) ← Obtener ventas en orden
└─ INDEX(venta_id, entrega_id) ← Buscar en qué entrega está
```

---

## Cambios en Relaciones

### ANTES
```
Venta (1) ────────────→ Entrega (N)
                           ↓ via FK venta_id

Entrega (N) ────→ ReporteCarga (1)
                   via FK entrega_id ❌ (conflictivo)

Entrega (N) ←─────→ ReporteCarga (N)
                     via pivot (¿por qué dos caminos?)
```

### DESPUÉS
```
Entrega (1) ←─────────→ Venta (N)
                         via entrega_venta (pivot) ✓

Entrega (N) ────────→ ReporteCarga (N)
                       via reporte_carga_entregas (pivot) ✓

CADA RELACIÓN: UN SOLO CAMINO CLARO
```

---

## Migración de Datos

### ¿Qué sucedió con las 29 entregas existentes?

```
ANTES:
─────
Entrega #1 → venta_id = 1001
Entrega #2 → venta_id = 1002
Entrega #3 → venta_id = 1003
...
[Cada entrega tenía 1 venta]

DESPUÉS (automático):
────────────────────
entrega_venta:
├─ entrega_id=1, venta_id=1001, orden=1
├─ entrega_id=2, venta_id=1002, orden=1
├─ entrega_id=3, venta_id=1003, orden=1
...
[Cada entrega sigue siendo 1 venta, pero vía pivot]

BENEFICIO: Ahora PUEDES agregar más ventas a una entrega
```

---

## Impacto en el Código (Lo que viene)

### ANTES
```php
$entrega = Entrega::find(1);
$venta = $entrega->venta; // Relación belongsTo

// Para agregar otra venta:
// ❌ NO SE PODÍA (solo 1 venta por entrega)
```

### DESPUÉS
```php
$entrega = Entrega::find(1);

// Una entrega tiene múltiples ventas
$ventas = $entrega->ventas; // Relación belongsToMany

// Agregar otra venta es fácil:
$entrega->ventas()->attach(1002, [
    'orden' => 2,
    'confirmado_por' => auth()->id(),
    'notas' => 'Agregada después'
]);

// Confirmar venta como cargada:
$entrega->confirmarVentaCargada($venta, 'notas...');

// Ver si todas están cargadas:
if ($entrega->todasVentasConfirmadas()) {
    $entrega->cambiarEstado('LISTA_PARA_ENTREGA');
}
```

---

## SQL: Verificar la estructura nueva

```sql
-- Ver estructura de entrega_venta
\d entrega_venta;

-- Ver entregas con sus ventas
SELECT
    e.id,
    e.numero_entrega,
    e.vehiculo_id,
    e.chofer_id,
    COUNT(ev.venta_id) as total_ventas
FROM entregas e
LEFT JOIN entrega_venta ev ON e.id = ev.entrega_id
GROUP BY e.id, e.numero_entrega, e.vehiculo_id, e.chofer_id;

-- Ver detalles de una entrega
SELECT
    e.numero_entrega,
    v.numero as numero_venta,
    v.cliente_id,
    ev.orden,
    ev.confirmado_por,
    ev.fecha_confirmacion,
    ev.notas
FROM entregas e
JOIN entrega_venta ev ON e.id = ev.entrega_id
JOIN ventas v ON ev.venta_id = v.id
WHERE e.id = 100
ORDER BY ev.orden;
```

---

## Resumen de cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Relación Entrega-Venta** | 1:1 (FK) | N:M (Pivot) |
| **Múltiples ventas en una entrega** | ❌ Imposible | ✅ Fácil |
| **Orden de carga** | No definido | Via `orden` en pivot |
| **Confirmación de carga** | No existe | Via `confirmado_por`, `fecha_confirmacion` |
| **Zona/Localidad** | No existe | `zona_id` en entregas |
| **Identificador legible** | Solo `id` | `numero_entrega` (ENT-20251227-001) |
| **Fuentes de verdad** | Múltiples (venta_id, pivot) | Una sola (entrega_venta pivot) |
| **Datos existentes** | 29 entregas de 1 venta c/u | 29 entregas migradas al pivot |

---

## Próximos pasos

✅ **FASE 1 COMPLETADA:** Base de datos refactorizada

⏳ **FASE 2:** Modelos Eloquent (Entrega.php, etc.)
⏳ **FASE 3:** Servicios (CrearEntregaPorLocalidadService)
⏳ **FASE 4:** Controllers & APIs
⏳ **FASE 5:** Frontend

**Fecha de ejecución de FASE 1:** 2025-12-27
