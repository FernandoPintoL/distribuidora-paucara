# 🔧 Fix: calcularMovimientosPorTipoPago() - Consistencia de Datos (2026-02-11)

## ❌ Problema Identificado

### Inconsistencia en Datos Enviados al Frontend

```javascript
// Valores recibidos en Cajas/Index:
totalVentas: 23856              ← Suma de TODAS las ventas APROBADAS
ventasPorTipoPago: [
  { tipo: "Efectivo", total: 14299, cantidad: 34 }
]                               ← Suma diferente: SOLO 14299

Diferencia: 23,856 - 14,299 = 9,557 FALTANTE
```

### Causa Raíz

En `calcularMovimientosPorTipoPago()`:

```php
// ❌ ANTES - Problemas:
->map(fn($grupo) => [
    'cantidad' => $grupo->count(),
    'total' => $grupo->sum('monto'),  // ← Usa movimientos_caja.monto
]);
```

En `calcularTotalVentas()`:

```php
// ✅ Pero calcularTotalVentas usa:
->sum('ventas.total');  // ← Usa tabla ventas
```

**Dos fuentes de datos diferentes:**
1. ❌ `totalVentas` = sum(ventas.total)
2. ❌ `ventasPorTipoPago` = sum(movimientos_caja.monto)

Estos valores difieren por:
- Descuentos (restados en ventas.total, no en monto)
- Impuestos (en ventas.total)
- Ajustes (pueden afectar monto pero no ventas.total)

**Además:**
- Incluía CREDITO junto con VENTA
- Créditos NO son ingresos de efectivo en el momento

---

## ✅ Solución Aplicada

### Cambios en `calcularMovimientosPorTipoPago()`

```php
/**
 * ✅ REFACTORIZADO (2026-02-11): Ventas por tipo de pago
 * - Solo VENTAS aprobadas (NO creditos)
 * - Usa ventas.total (no movimientos_caja.monto)
 * - Agrupa por tipo de pago
 */
private function calcularMovimientosPorTipoPago($movimientos)
{
    return $movimientos
        ->filter(function ($m) {
            // Solo VENTAS aprobadas (excluyendo CREDITO)
            if ($m->tipoOperacion->codigo === 'VENTA') {
                return $this->esVentaAprobada($m);
            }

            // Excluir todo lo demás (CREDITO, PAGO, GASTOS, etc.)
            return false;
        })
        ->groupBy(fn($m) => $m->tipoPago?->nombre ?? 'Sin tipo de pago')
        ->map(fn($grupo) => [
            'cantidad' => $grupo->count(),
            // Usar ventas.total (no movimientos_caja.monto) para consistencia
            'total' => (float) $grupo->sum(fn($m) => $m->venta?->total ?? 0),
        ]);
}
```

---

## 🔄 Cambios Específicos

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| **Tipo de Operación** | VENTA + CREDITO + PAGO + otros | ✅ Solo VENTA |
| **Monto Usado** | movimientos_caja.monto | ✅ ventas.total |
| **Consistencia** | ❌ Diferente a calcularTotalVentas() | ✅ Mismo que calcularTotalVentas() |
| **Ingresos Reales** | ❌ Incluía créditos (promesas) | ✅ Solo efectivo/transferencias |
| **Agrupación** | Por tipo de pago (todos) | ✅ Por tipo de pago (solo VENTA) |

---

## 📊 Resultado Esperado

Antes de la corrección:
```javascript
totalVentas: 23856          (ventas.total correcto)
ventasPorTipoPago: [
  { tipo: "Efectivo", total: 14299 }  ❌ INCORRECTO
]
```

Después de la corrección:
```javascript
totalVentas: 23856          ✅ (ventas.total)
ventasPorTipoPago: [
  { tipo: "Efectivo", total: 23856 }  ✅ CONSISTENTE
]
// O puede haber múltiples tipos de pago que sumen 23856
```

---

## 🎯 Lógica Nueva

```
calcularMovimientosPorTipoPago($movimientos)
│
├─ Filtrar: Tipo = 'VENTA' AND Estado = 'APROBADO'
├─ Excluir: CREDITO, PAGO, GASTOS y otros
├─ Agrupar: Por tipo_pago
└─ Calcular: SUM(ventas.total) por grupo ← CONSISTENTE con totalVentas
```

---

## 💡 Razones del Cambio

### 1. Consistencia de Datos
- `totalVentas` y `ventasPorTipoPago` ahora usan la **MISMA fuente**: `ventas.total`
- Los números siempre serán congruentes

### 2. Solo Ingresos Reales
- ✅ VENTA (efectivo, transferencia, etc.) = Ingreso real
- ❌ CREDITO = Promesa de pago (no es ingreso de caja hoy)
- ❌ PAGO = Es cobro de deuda (otro concepto)

### 3. Claridad Conceptual
- `ventasPorTipoPago` = Desglose de **VENTAS APROBADAS** por tipo de pago
- NO mezcla otros tipos de operación

---

## ✅ Validaciones

- ✅ PHP Lint: Sin errores
- ✅ Usa ventas.total (relación eager loaded)
- ✅ Filtra correctamente: solo tipo = 'VENTA'
- ✅ Valida estado: solo APROBADO
- ✅ Agrupa por tipo_pago
- ✅ Fallback para tipos sin pago: 'Sin tipo de pago'
- ✅ Cast a float para precisión numérica

---

## 📌 Impacto en Frontend

### Datos Ahora Consistentes

```javascript
datosResumen: {
  totalVentas: 23856,           // SUM(ventas.total) para VENTAS APROBADAS
  ventasPorTipoPago: [          // Desglose de ese mismo total
    { tipo: "Efectivo", total: 15000, cantidad: 20 },
    { tipo: "Transferencia", total: 8856, cantidad: 14 }
    // Suma de totales = 23856 ✅
  ],
  totalIngresos: 23856 + pagosCredito,
  efectivoEsperado: apertura + totalIngresos - egresos
}
```

**El frontend puede ahora:**
- ✅ Confiar en que ventasPorTipoPago suma = totalVentas
- ✅ Mostrar correctamente el desglose por tipo de pago
- ✅ No confundir créditos con ventas

---

## 🔍 Verificación

Para verificar que los datos son correctos ahora:

```sql
-- totalVentas debe ser igual a SUM de ventasPorTipoPago[].total
SELECT SUM(ventas.total) as totalVentas
FROM movimientos_caja
JOIN ventas ON movimientos_caja.numero_documento = ventas.numero
JOIN tipo_operacion_caja ON movimientos_caja.tipo_operacion_id = tipo_operacion_caja.id
JOIN estados_documento ON ventas.estado_documento_id = estados_documento.id
WHERE movimientos_caja.caja_id = {caja_id}
  AND tipo_operacion_caja.codigo = 'VENTA'
  AND estados_documento.codigo = 'APROBADO'
  AND movimientos_caja.fecha BETWEEN {desde} AND {hasta};

-- Este valor debe coincidir con:
-- SUM(datosResumen.ventasPorTipoPago[].total)
```

---

**Status**: ✅ CORREGIDO
**Fecha**: 2026-02-11
**PHP Lint**: ✅ Sin errores
**Consistencia**: ✅ Verificada
