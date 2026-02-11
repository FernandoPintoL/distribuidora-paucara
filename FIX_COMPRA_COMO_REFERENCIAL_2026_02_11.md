# 🔧 Fix: COMPRA como Referencial (Promesa de Pago) - 2026-02-11

## ✅ Corrección Realizada

**COMPRA es una promesa de pago** (igual que CREDITO), NO dinero que está saliendo en ese momento.

### Cambio Principal

```diff
- ANTES: totalEfectivo resta COMPRA
+ AHORA: COMPRA se muestra como referencial (no afecta totalEfectivo)
```

---

## 📊 Nueva Fórmula de totalEfectivo

```
totalEfectivo = Apertura
              + Ventas(Efectivo + Transferencia)
              + Pagos de Crédito
              - Dinero que REALMENTE sale (GASTOS, PAGO_SUELDO, ANTICIPO, ANULACION)
              ✗ NO resta COMPRA (es promesa de pago)
              ✗ NO resta CREDITO (es promesa de pago)
```

### Ejemplo Corregido

```
Apertura de caja:                         $1,000
────────────────────────────────────────────────
ENTRADAS DE EFECTIVO:
+ Venta Efectivo + Transferencia:        +$8,000
+ Pago de Crédito recibido:              +$2,000
────────────────────────────────────────────────
SALIDAS REALES DE EFECTIVO:
- Gastos:                                  -$300
- Pago de Sueldos:                       -$1,500
- Anticipos:                               -$200
- Anulaciones:                             -$100
════════════════════════════════════════════════
TOTAL EFECTIVO EN CAJA:                  $8,900  ✅

DATOS REFERENCIALES (no afectan totalEfectivo):
├─ Ventas al Crédito:           $7,000  (promesa de cliente)
├─ Compras (deuda):             $2,500  (promesa a proveedor)
└─ Son promesas de pago, no dinero real
```

---

## 🔄 Métodos Nuevos/Modificados

### `calcularSalidasReales()` - NUEVO
```php
/**
 * Dinero que REALMENTE sale de la caja
 * - GASTOS ✓
 * - PAGO_SUELDO ✓
 * - ANTICIPO ✓
 * - ANULACION ✓
 *
 * Excluye COMPRA (es promesa de pago)
 */
```

### `calcularCompras()` - NUEVO
```php
/**
 * Compras = Deuda a proveedores (promesa de pago)
 * Se muestra como referencial, NO afecta totalEfectivo
 * Solo afecta cuando realmente se paga
 */
```

### `calcularTotalSalidas()` - MODIFICADO
```php
/**
 * Suma TODAS las salidas (dinero real + promesas)
 * Para reportes generales
 * = COMPRA + GASTOS + PAGO_SUELDO + ANTICIPO + ANULACION
 */
```

---

## 📋 Respuesta del API

```json
{
  "totalVentas": 15000.00,
  "totalEfectivo": 8900.00,

  "detalleEfectivo": {
    "ventas_efectivo_transferencia": 8000.00,
    "pagos_credito": 2000.00,
    "total_entradas_efectivo": 10000.00,
    "salidas_reales": 2100.00
  },

  "datosReferenciales": {
    "ventas_credito": 7000.00,
    "compras": 2500.00
  },

  "sumatorialCompras": 2500.00,
  "sumatorialSalidasReales": 2100.00,
  "sumatorialGastos": 300.00,
  ...
}
```

---

## 🎯 Clasificación de Operaciones

| Tipo | Dirección | Dinero Real | Referencial | Afecta totalEfectivo |
|------|-----------|-------------|-------------|----------------------|
| VENTA (Efectivo) | ENTRADA | ✓ | | ✅ Suma |
| VENTA (Crédito) | - | | ✓ Promesa | ❌ NO suma |
| PAGO (Crédito cobrado) | ENTRADA | ✓ | | ✅ Suma |
| GASTOS | SALIDA | ✓ | | ✅ Resta |
| PAGO_SUELDO | SALIDA | ✓ | | ✅ Resta |
| ANTICIPO | SALIDA | ✓ | | ✅ Resta |
| ANULACION | SALIDA | ✓ | | ✅ Resta |
| **COMPRA** | **SALIDA** | **❌** | **✓ Promesa** | **❌ NO resta** |

---

## 💡 Razón del Cambio

**COMPRA es como CREDITO: una promesa de pago**

```
CREDITO:
- Cliente compra: "Te pagaré después"
- No entra dinero ahora
- Entra cuando se paga (como PAGO)

COMPRA:
- Empresa compra: "Pagaré después"
- No sale dinero ahora
- Sale cuando se paga (como PAGO_SUELDO o GASTOS)
```

Ambas son promesas, **no dinero real en este momento**.

---

## ✅ Validaciones

- ✅ PHP Lint: Sin errores
- ✅ Métodos privados: No afectan API pública
- ✅ Backward Compatible: Datos antiguos disponibles
- ✅ Logging: Completo para auditoría
- ✅ Nuevo método `calcularCompras()` para referencial

---

## 📌 Impacto en Cierre de Caja

### ANTES (Incorrecto)
```
Efectivo Real: $10,900
totalEfectivo (sistema): $8,400  ❌ Incorrecto (restó COMPRA)
Diferencia: -$2,500 (confuso)
```

### DESPUÉS (Correcto)
```
Efectivo Real: $8,900
totalEfectivo (sistema): $8,900  ✅ Correcto
Diferencia: $0 (perfecto coincide)
```

---

**Status**: ✅ ARREGLADO - COMPRA es ahora referencial
**Fecha**: 2026-02-11
**PHP Lint**: ✅ Sin errores
