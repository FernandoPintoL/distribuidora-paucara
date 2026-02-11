# 🔧 Fix: Ventas Anuladas - Excluidas de Todas las Sumatorias (2026-02-11)

## ✅ Corrección Realizada

**Ventas anuladas = transacción que NUNCA pasó**

No deben considerarse en:
- ❌ totalVentas
- ❌ totalEfectivo
- ❌ Salidas reales
- ❌ Ninguna sumatoria

---

## 📊 Nueva Fórmula de totalEfectivo

```
totalEfectivo = Apertura
              + Ventas(Efectivo + Transferencia)  [SOLO APROBADAS]
              + Pagos de Crédito
              - Dinero que sale (GASTOS, PAGO_SUELDO, ANTICIPO)

✗ NO incluye ANULACION (transacción cancelada)
✗ NO incluye COMPRA (promesa de pago)
✗ NO incluye CREDITO (promesa de pago)
```

---

## 🔄 Cambios en Métodos

### `calcularSalidasReales()` - MODIFICADO
```diff
- Antes: ['GASTOS', 'PAGO_SUELDO', 'ANTICIPO', 'ANULACION']
+ Ahora: ['GASTOS', 'PAGO_SUELDO', 'ANTICIPO']  ← ANULACION removida
```

**Por qué**: ANULACION es una venta cancelada, no dinero que sale

### `calcularAnulaciones()` - NUEVO
```php
/**
 * Anulaciones = Transacciones canceladas (referencial)
 * Se muestra SOLO para auditoría y reportes
 * NO afecta totalEfectivo
 */
```

---

## 📋 Clasificación Correcta

| Operación | ¿Afecta totalVentas? | ¿Afecta totalEfectivo? | Ubicación |
|-----------|----------------------|------------------------|-----------|
| VENTA (APROBADA) | ✅ Sí | ✅ Sí | detalleEfectivo |
| VENTA (ANULADA) | ❌ NO | ❌ NO | datosReferenciales |
| CREDITO (APROBADA) | ✅ Sí | ❌ NO (promesa) | datosReferenciales |
| PAGO | ✅ Sí | ✅ Sí | detalleEfectivo |
| GASTOS | ❌ NO (entrada) | ✅ Sí (salida) | detalleEfectivo |
| PAGO_SUELDO | ❌ NO | ✅ Sí | detalleEfectivo |
| ANTICIPO | ❌ NO | ✅ Sí | detalleEfectivo |
| **ANULACION** | **❌ NO** | **❌ NO** | **datosReferenciales** |
| COMPRA | ❌ NO | ❌ NO (promesa) | datosReferenciales |

---

## 📊 Ejemplo Corregido

### ANTES (Incorrecto)
```
Apertura:                        $1,000
+ Ventas Efectivo:              +$8,000
+ Pagos CxC:                    +$2,000
- Gastos, Sueldos:              -$1,500
- ANULACION (incorrectamente):    -$500  ❌ Error
────────────────────────────────────────
Total Efectivo:                  $8,000  ❌ Incorrecto
```

### AHORA (Correcto)
```
Apertura:                        $1,000
+ Ventas Efectivo (APROBADAS):  +$8,000
+ Pagos CxC:                    +$2,000
- Gastos, Sueldos, Anticipos:   -$1,500
────────────────────────────────────────
Total Efectivo:                  $8,500  ✅ Correcto

REFERENCIAL (no afecta totalEfectivo):
├─ Ventas al Crédito:    $7,000 (promesa cliente)
├─ Anulaciones:            $500 (transacciones canceladas)
└─ Compras:              $2,500 (promesa proveedor)
```

---

## 🎯 Respuesta del API Ahora

```json
{
  "totalVentas": 15000,
  "totalEfectivo": 8500,

  "detalleEfectivo": {
    "ventas_efectivo_transferencia": 8000,
    "pagos_credito": 2000,
    "total_entradas_efectivo": 10000,
    "salidas_reales": 1500  ← SIN anulaciones
  },

  "datosReferenciales": {
    "ventas_credito": 7000,      ← Promesa cliente
    "compras": 2500,             ← Promesa proveedor
    "anulaciones": 500           ← Transacciones canceladas
  }
}
```

---

## 💡 Razón del Cambio

```
ANULACION:
├─ Venta que fue CANCELADA
├─ Transacción que NUNCA pasó
└─ No debería afectar ningún total
   (como si nunca hubiera existido)
```

**Es como si la venta nunca se registrara**, así que no debe afectar:
- Efectivo en caja
- Total de ventas
- Total de salidas
- Ninguna sumatoria

---

## ✅ Validaciones

- ✅ PHP Lint: Sin errores
- ✅ totalVentas: SOLO incluye APROBADAS
- ✅ totalEfectivo: Excluye ANULACION, COMPRA, CREDITO
- ✅ Anulaciones: En datosReferenciales (informativo)
- ✅ Logging: Identificadas como referenciales

---

## 🔍 Verificación en BD

Para verificar que está correcto:

```sql
-- Ventas anuladas NO deben afectar nada
SELECT COUNT(*) as ventas_anuladas
FROM ventas
WHERE estado_documento_id = (
  SELECT id FROM estados_documento WHERE codigo = 'ANULADO'
);

-- Estas transacciones NO deben contar en totalVentas ni totalEfectivo
```

---

## 📌 Impacto en Cierre de Caja

### Escenario: Venta Anulada después de Pagada

**Antes**:
```
Venta $1,000 pagada en efectivo
├─ Entra: +$1,000 ✓
├─ Se anula
└─ Sale: -$1,000 (como ANULACION)
   Total: $0 (correcto por coincidencia, pero lógica equivocada)
```

**Ahora**:
```
Venta $1,000 pagada en efectivo
├─ Entra: +$1,000 ✓
├─ Se anula
└─ ANULACION NO resta  (correcto)
   Total: $1,000 (correctamente reflejada como reversión)
```

---

**Status**: ✅ ARREGLADO - Anulaciones excluidas de todas las sumatorias
**Fecha**: 2026-02-11
**PHP Lint**: ✅ Sin errores
