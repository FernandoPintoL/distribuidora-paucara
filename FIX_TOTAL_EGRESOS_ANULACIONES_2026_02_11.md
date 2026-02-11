# 🔧 Fix: calcularTotalEgresos() - Excluir Anulaciones (2026-02-11)

## ✅ Problema Identificado y Resuelto

`calcularTotalEgresos()` estaba sumando **TODAS las SALIDA** sin excluir ANULACION:

### ❌ ANTES
```php
->filter(fn($m) =>
    $m->tipoOperacion?->direccion === 'SALIDA' && $this->esPagoValido($m)
)
->sum('monto');  // ← Incluye ANULACION Y COMPRA
```

### ✅ AHORA
```php
->filter(fn($m) =>
    $m->tipoOperacion?->direccion === 'SALIDA' && $this->esPagoValido($m)
)
->whereNotIn('tipoOperacion.codigo', ['ANULACION', 'COMPRA'])
->sum('monto');  // ← Excluye ANULACION Y COMPRA
```

---

## 📊 Qué Cambió

| Operación | ANTES | AHORA |
|-----------|-------|-------|
| GASTOS | ✅ Incluida | ✅ Incluida |
| PAGO_SUELDO | ✅ Incluida | ✅ Incluida |
| ANTICIPO | ✅ Incluida | ✅ Incluida |
| **ANULACION** | **❌ Incluida** | **✅ Excluida** |
| **COMPRA** | **❌ Incluida** | **✅ Excluida** |

---

## 💡 Razón

- **ANULACION**: Transacción cancelada (nunca pasó) → No debe contar
- **COMPRA**: Promesa de pago a proveedor (no dinero real) → No debe contar

Ambas son excepciones, no dinero que realmente sale.

---

## 🎯 Ejemplo

### Escenario
```
Gastos: $300
Sueldos: $1,500
Anticipos: $200
Anulación: $500
Compra: $2,500
```

### ANTES (Incorrecto)
```
totalEgresos = $300 + $1,500 + $200 + $500 + $2,500 = $5,000 ❌
```

### AHORA (Correcto)
```
totalEgresos = $300 + $1,500 + $200 = $2,000 ✅
(Excluye $500 anulación + $2,500 compra)
```

---

## ✅ Validaciones

- ✅ PHP Lint: Sin errores
- ✅ Excluye ANULACION
- ✅ Excluye COMPRA
- ✅ Mantiene dinero real (GASTOS, PAGO_SUELDO, ANTICIPO)

---

**Status**: ✅ ARREGLADO - calcularTotalEgresos() excluye anulaciones
**Fecha**: 2026-02-11
**PHP Lint**: ✅ Sin errores
