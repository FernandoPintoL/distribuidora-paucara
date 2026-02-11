# 📍 Clarificación: ¿De Dónde Vienen los MONTOS?

## Respuesta Corta

**NO todos los montos vienen de `movimientos_caja`.**

```
VENTAS (VENTA, CREDITO)      → sum(ventas.total)           ✅ Tabla VENTAS
SALIDAS (GASTOS, PAGO_SUELDO, ANTICIPO, ANULACION) → sum(movimientos_caja.monto)  ✅ Tabla MOVIMIENTOS_CAJA
PAGOS (Cobros de CxC)        → sum(movimientos_caja.monto)  ✅ Tabla MOVIMIENTOS_CAJA
COMPRAS                        → sum(movimientos_caja.monto)  ✅ Tabla MOVIMIENTOS_CAJA
```

---

## 🎯 Desglose por Tipo de Operación

### ✅ VENTAS (tipos: VENTA, CREDITO)

**Usan: `ventas.total`** (tabla VENTAS)

```php
$totalVentas = DB::table('movimientos_caja')
    ->join('ventas', 'movimientos_caja.numero_documento', '=', 'ventas.numero')
    ->join('tipo_operacion_caja', ...)
    ->join('estados_documento', ...)
    ->sum('ventas.total');  // ← DE TABLA VENTAS
```

**¿Por qué?**
- Ventas tienen datos complejos: descuento, impuesto, etc.
- La fuente de verdad es `ventas.total`
- `movimientos_caja.monto` podría diferir

**Líneas de código**: 150, 236, 809, 869

---

### ✅ SALIDAS (tipos: GASTOS, PAGO_SUELDO, ANTICIPO, ANULACION)

**Usan: `movimientos_caja.monto`** (tabla MOVIMIENTOS_CAJA)

```php
// Ejemplo: calcularSalidasReales()
$movimientos
    ->filter(fn($m) =>
        in_array($m->tipoOperacion?->codigo, ['GASTOS', 'PAGO_SUELDO', 'ANTICIPO', 'ANULACION'])
    )
    ->sum('monto');  // ← DE TABLA MOVIMIENTOS_CAJA
```

**¿Por qué?**
- Estos tipos NO tienen tabla propia
- Solo existen en `movimientos_caja`
- `movimientos_caja.monto` es la fuente de verdad

**Líneas de código**: 327, 353, 377, 408, 428, 446, 654, 661, 667, 672, 676, 680, 684

---

### ✅ PAGOS (Cobros de Cuentas por Cobrar)

**Usan: `movimientos_caja.monto`** (tabla MOVIMIENTOS_CAJA)

```php
// En calcularPagosCredito()
$movimientos
    ->filter(fn($m) => $m->tipoOperacion?->codigo === 'PAGO')
    ->filter(fn($m) => $this->esPagoValido($m))
    ->sum('monto');  // ← DE TABLA MOVIMIENTOS_CAJA
```

**¿Por qué?**
- Los pagos se registran SOLO en `movimientos_caja`
- No hay tabla `pagos_credito` con detalles
- Validar: estado_pago !== ANULADO

**Líneas de código**: 774

---

### ✅ COMPRAS (tipo: COMPRA)

**Usan: `movimientos_caja.monto`** (tabla MOVIMIENTOS_CAJA)

```php
// En calcularCompras()
$movimientos
    ->filter(fn($m) => $m->tipoOperacion?->codigo === 'COMPRA')
    ->filter(fn($m) => $this->esPagoValido($m))
    ->sum('monto');  // ← DE TABLA MOVIMIENTOS_CAJA
```

**¿Por qué?**
- Las compras se registran SOLO en `movimientos_caja`
- Son promesas de pago (no dinero real aún)
- Validar: estado_pago !== ANULADO

---

## 📊 Tabla Resumen

| Tipo de Operación | Tabla de Monto | Campo | Razón |
|---|---|---|---|
| **VENTA** | ventas | ventas.total | Datos complejos, fuente de verdad |
| **CREDITO** | ventas | ventas.total | Igual que VENTA |
| **GASTOS** | movimientos_caja | monto | Solo en movimientos_caja |
| **PAGO_SUELDO** | movimientos_caja | monto | Solo en movimientos_caja |
| **ANTICIPO** | movimientos_caja | monto | Solo en movimientos_caja |
| **ANULACION** | movimientos_caja | monto | Solo en movimientos_caja |
| **PAGO** (CxC) | movimientos_caja | monto | Solo en movimientos_caja |
| **COMPRA** | movimientos_caja | monto | Solo en movimientos_caja |

---

## ⚠️ Diferencia Entre `ventas.total` vs `movimientos_caja.monto`

### `movimientos_caja.monto`
- Monto registrado en el movimiento
- Puede tener ajustes o diferencias
- Es lo que **realmente se movió en caja**

### `ventas.total`
- Monto total de la venta
- Incluye descuentos e impuestos
- Es la **fuente de verdad de la venta**

---

## 🎯 Flujo en CierreCajaService

```
calcularDatos(AperturaCaja)
│
├─ Para VENTAS (VENTA, CREDITO aprobadas):
│  └─ sum(ventas.total) ← TABLA VENTAS
│
├─ Para SALIDAS REALES (GASTOS, PAGO_SUELDO, ANTICIPO, ANULACION):
│  └─ sum(movimientos_caja.monto) ← TABLA MOVIMIENTOS_CAJA
│
├─ Para PAGOS DE CxC:
│  └─ sum(movimientos_caja.monto) ← TABLA MOVIMIENTOS_CAJA
│
└─ Para COMPRAS:
   └─ sum(movimientos_caja.monto) ← TABLA MOVIMIENTOS_CAJA
```

---

## 💡 Conclusión

**Los MONTOS NO vienen SOLO de `movimientos_caja`:**

- ✅ **VENTAS**: Usan `ventas.total` (tabla ventas) - porque tienen datos complejos
- ✅ **SALIDAS**: Usan `movimientos_caja.monto` (tabla movimientos_caja) - porque no tienen tabla propia
- ✅ **PAGOS**: Usan `movimientos_caja.monto` (tabla movimientos_caja) - porque no tienen tabla propia
- ✅ **COMPRAS**: Usan `movimientos_caja.monto` (tabla movimientos_caja) - porque no tienen tabla propia

---

**Status**: ✅ CLARIFICADO
**Fecha**: 2026-02-11
