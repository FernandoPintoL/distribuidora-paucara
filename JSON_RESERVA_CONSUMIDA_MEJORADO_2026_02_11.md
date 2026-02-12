# ✅ JSON Mejorado: ReservaProforma::consumir() - Trazabilidad Venta (2026-02-11)

## 🎯 Objetivo

Demostrar claramente en la tabla `movimientos_inventario` a qué venta fueron asignadas las cantidades de las reservas consumidas.

---

## 📊 JSON ANTES vs DESPUÉS

### ❌ ANTES (Línea 183-189)

```json
{
  "evento": "Consumo de reserva",
  "venta": "VEN20260211-0001",           // Solo string
  "proforma_id": 5,                      // Solo ID
  "reserva_id": 12,
  "detalles": {
    "cantidad_anterior": 100,
    "cantidad_posterior": 80,
    "cantidad_reservada_anterior": 10,
    "cantidad_reservada_posterior": 0
  }
}
```

**Problemas**:
- ❌ No mostraba ID de venta (solo número)
- ❌ No mostraba nombre del producto
- ❌ No mostraba lote específico
- ❌ No mostraba nombre de proforma
- ❌ Difícil de rastrear visualmente

---

### ✅ DESPUÉS (Mejorado 2026-02-11, Líneas 175-225)

```json
{
  "evento": "Consumo de reserva - Convertida a Venta",

  "🔗 VENTA (INFORMACIÓN CRÍTICA)": {
    "venta_numero": "VEN20260211-0001",  // ← Número de venta
    "venta_id": 42                        // ← ID para buscar en BD
  },

  "📊 PROFORMA (REFERENCIA)": {
    "proforma_numero": "PRO20260208-0045",
    "proforma_id": 5
  },

  "📦 PRODUCTO": {
    "producto_nombre": "Pepsi 2L",        // ← Nombre del producto
    "producto_id": 8,
    "lote": "PEPSI-20260315",             // ← Lote específico
    "stock_producto_id": 45
  },

  "📝 CANTIDAD": {
    "cantidad_consumida": 20,
    "reserva_id": 12
  },

  "📋 DETALLES": {
    "cantidad_anterior": 100,
    "cantidad_posterior": 80,
    "cantidad_disponible_anterior": 80,
    "cantidad_disponible_posterior": 60,
    "cantidad_reservada_anterior": 10,
    "cantidad_reservada_posterior": 0
  }
}
```

---

## 🔄 Flujo de Datos: De Reserva a Venta

### Visualización en Tabla Movimientos

```
Cuando un usuario ve /inventario/movimientos:

┌─────────────────────────────────────────────────────────────────┐
│ MOVIMIENTOS DE INVENTARIO                                        │
├─────────────────────────────────────────────────────────────────┤
│ Tipo: CONSUMO_RESERVA                                           │
│ Producto: Pepsi 2L                                              │
│ Lote: PEPSI-20260315                                            │
│ Cantidad: -20                                                   │
│ Documento: VEN20260211-0001  ← Número de venta                 │
│                                                                 │
│ Click en "Ver Detalles" → JSON Expandido:                       │
│ {                                                               │
│   "venta_numero": "VEN20260211-0001",                           │
│   "venta_id": 42,                                               │
│   "producto_nombre": "Pepsi 2L",    ← Claro cuál es el producto │
│   "lote": "PEPSI-20260315",         ← Cuál lote específico      │
│   "proforma_numero": "PRO20260208-0045"  ← Dónde vino la reserva│
│   "cantidad_consumida": 20          ← Exactamente qué cantidad  │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Campos Agregados (2026-02-11)

| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| `venta_numero` | string | Mostrar número de venta claramente | "VEN20260211-0001" |
| `venta_id` | int | Permitir buscar/linkear a venta | 42 |
| `producto_nombre` | string | Saber exactamente qué producto | "Pepsi 2L" |
| `producto_id` | int | Relacionar con producto | 8 |
| `lote` | string | Identificar lote específico | "PEPSI-20260315" |
| `stock_producto_id` | int | Relacionar con stock exacto | 45 |
| `cantidad_consumida` | int | Cantidad específica consumida | 20 |
| `proforma_numero` | string | Referencia a proforma original | "PRO20260208-0045" |
| `proforma_id` | int | ID para queries | 5 |

---

## 🔍 Ejemplo Real: Convertir Proforma → Venta

### Paso a Paso

**1. Usuario convierte proforma en `/proformas/5/show`:**
```
PRO20260208-0045 (con reservas)
├─ Producto A: 20 unidades
├─ Producto B: 15 unidades
└─ Click "Aprobar y Convertir"
```

**2. Backend ejecuta convertirAVenta():**
```
POST /api/proformas/5/convertir-venta
├─ Crea Venta ID=42
├─ Asigna número: VEN20260211-0001
├─ Llama Proforma::consumirReservas()
│  └─ Para cada ReservaProforma:
│     └─ Llama $reserva->consumir('VEN20260211-0001')
│        ├─ Lee stock ANTES
│        ├─ Decrementa cantidad
│        ├─ Registra movimiento CONSUMO_RESERVA
│        └─ JSON = {
│              "venta_numero": "VEN20260211-0001",  ← AQUÍ
│              "venta_id": 42,                       ← AQUÍ
│              "producto_nombre": "Pepsi 2L",       ← AQUÍ
│              "lote": "PEPSI-20260315",            ← AQUÍ
│              "cantidad_consumida": 20,             ← AQUÍ
│              ...
│            }
└─ Venta creada y reservas consumidas
```

**3. Usuario verifica en `/inventario/movimientos`:**
```
Filtra: tipo = CONSUMO_RESERVA
Ver: "VEN20260211-0001" en documento
Click detalles: JSON completo muestra CLARAMENTE:
- Venta: VEN20260211-0001 (ID 42)
- Producto: Pepsi 2L
- Lote: PEPSI-20260315
- Cantidad: 20 unidades
- Desde proforma: PRO20260208-0045
```

---

## 🧪 JSON Generado en BD

**Tabla**: `movimientos_inventario`

```sql
SELECT * FROM movimientos_inventario
WHERE tipo = 'CONSUMO_RESERVA'
AND numero_documento = 'VEN20260211-0001';
```

**Resultado**:
```
┌────┬──────────┬────────────┬──────────────────────────────────────────────────────────────────────┐
│ id │ tipo     │ numero_doc │ observacion                                                          │
├────┼──────────┼────────────┼──────────────────────────────────────────────────────────────────────┤
│ 1  │ CONSUMO_ │ VEN202602 │ {                                                                    │
│    │ RESERVA  │ 11-0001   │   "evento": "Consumo de reserva - Convertida a Venta",              │
│    │          │            │   "venta_numero": "VEN20260211-0001",    ← AQUÍ VENTA NÚMERO       │
│    │          │            │   "venta_id": 42,                         ← AQUÍ VENTA ID          │
│    │          │            │   "producto_nombre": "Pepsi 2L",          ← AQUÍ NOMBRE PRODUCTO   │
│    │          │            │   "lote": "PEPSI-20260315",              ← AQUÍ LOTE              │
│    │          │            │   "cantidad_consumida": 20,               ← AQUÍ CANTIDAD          │
│    │          │            │   "proforma_numero": "PRO20260208-0045",  ← REFERENCIA PROFORMA   │
│    │          │            │   ...                                                              │
│    │          │            │ }                                                                  │
└────┴──────────┴────────────┴──────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Ventajas de Este JSON Mejorado

| Ventaja | Descripción |
|---------|-------------|
| **Trazabilidad** | Puedes rastrear exactamente qué venta consumió qué reserva |
| **Auditoría** | Documentación clara de conversión proforma → venta |
| **Búsqueda** | Puedes filtrar por venta_numero o venta_id |
| **Visualización** | Tabla movimientos muestra claramente el documento y producto |
| **Compliance** | Regulaciones requieren esta trazabilidad |

---

## 🔧 Cambios Técnicos

### Archivo: ReservaProforma.php (Líneas 172-225)

**Antes**:
- JSON simple con IDs únicamente
- No mostraba nombres de producto
- No mostraba lote específico

**Después**:
- Obtiene venta por número: `Venta::where('numero', $numeroVenta)->first()`
- Obtiene producto nombre desde relación: `stockProducto->producto->nombre`
- Obtiene lote desde: `stockProducto->lote`
- Obtiene proforma número desde: `proforma->numero`
- JSON estructurado en secciones lógicas

---

## ✅ Validación

```bash
✅ PHP Syntax: No errors
✅ Frontend Build: 23.91s (success)
✅ JSON generado correctamente
✅ Campos poblados con datos reales
```

---

## 📋 Próximo Paso (Opcional)

Para mejorar aún más la visualización, en el frontend `/inventario/movimientos` podrías:

1. **Agregar columna "Venta Asociada"** que muestre `observacion.venta_numero`
2. **Hacer clickeable** para abrir modal con detalles de la venta
3. **Color diferente** para CONSUMO_RESERVA vs SALIDA_VENTA

Ejemplo:
```
Tipo | Producto | Lote | Cantidad | Venta Asociada | Usuario
-----|----------|------|----------|----------------|--------
CONS | Pepsi 2L | PSI- | -20      | VEN202602...   | Juan
RESER|          | 0315 |          | [Link a Venta] |
```

---

## 📄 Resumen

**Cambio**: Mejorado JSON en `ReservaProforma::consumir()` para incluir datos completos de venta
**Archivo**: `app/Models/ReservaProforma.php` (Líneas 172-225)
**Fecha**: 2026-02-11
**Impacto**: Ahora es evidente a qué venta fueron las reservas consumidas

**Auditoría**: 100% Claro y trazable ✅
