# 🎯 Soporte para Múltiples Formas de Pago en Confirmación de Entregas

**Documento:** Estructura mejorada para registrar múltiples formas de pago en una sola venta
**Fecha:** 2026-02-12
**Status:** 📋 ESPECIFICACIÓN - En preparación para implementación

---

## 📋 Problema Actual

El endpoint actual solo soporta UN tipo de pago por venta:
```json
{
  "monto_recibido": 1000.0,
  "tipo_pago_id": 1
}
```

### Escenarios NO soportados:
1. ❌ **Pago Mixto**: 500 efectivo + 500 transferencia = 1000 total
2. ❌ **Pago Parcial**: 500 efectivo + 500 crédito = 1000 total (500 pendiente)
3. ❌ **Crédito Total**: 0 efectivo + 1000 crédito = 1000 (sin dinero recibido)

---

## ✅ Solución Propuesta

### 1. Estructura de Datos Mejorada

#### Base de Datos (Nueva columna en `entregas_venta_confirmaciones`)

```sql
-- Nuevo campo JSON para desglose de pagos
desglose_pagos: JSON -- Array de pagos recibidos

-- Ejemplo:
[
  {
    "tipo_pago_id": 1,
    "tipo_pago_nombre": "Efectivo",
    "monto": 500.00,
    "referencia": null
  },
  {
    "tipo_pago_id": 2,
    "tipo_pago_nombre": "Transferencia / QR",
    "monto": 500.00,
    "referencia": "TRX-12345"
  }
]
```

#### Nuevos Campos Adicionales
```sql
total_dinero_recibido: DECIMAL(12,2)  -- Suma de todos los pagos en efectivo/transferencia
monto_pendiente: DECIMAL(12,2)         -- Dinero pendiente (si hubo crédito o pago parcial)
tipo_confirmacion: STRING              -- COMPLETA, CON_NOVEDAD
```

---

### 2. Formato de Solicitud del Cliente (Flutter)

#### Opción A: Array de Pagos
```json
{
  "observaciones_logistica": "Entrega completa",
  "pagos": [
    {
      "tipo_pago_id": 1,
      "monto": 500.00,
      "referencia": null
    },
    {
      "tipo_pago_id": 2,
      "monto": 500.00,
      "referencia": "TRX-ABC123"
    }
  ],
  "monto_credito": 0,
  "tipo_confirmacion": "COMPLETA"
}
```

#### Opción B: Backward Compatibility (Mantener actual)
```json
{
  "observaciones_logistica": "Entrega completa",
  "monto_recibido": 1000.0,
  "tipo_pago_id": 1
}
```

---

### 3. Validaciones en Backend

```php
public function confirmarVentaEntregada(Request $request, $id, $venta_id)
{
    $validated = $request->validate([
        // Opción A: Array de pagos
        'pagos' => 'nullable|array',
        'pagos.*.tipo_pago_id' => 'required_with:pagos|exists:tipos_pago,id',
        'pagos.*.monto' => 'required_with:pagos|numeric|min:0',
        'pagos.*.referencia' => 'nullable|string|max:100',

        // Opción B: Backward compatibility
        'monto_recibido' => 'nullable|numeric|min:0',
        'tipo_pago_id' => 'nullable|exists:tipos_pago,id',

        // Nuevos campos
        'monto_credito' => 'nullable|numeric|min:0',
        'tipo_confirmacion' => 'required|in:COMPLETA,CON_NOVEDAD',
    ]);
}
```

---

### 4. Lógica de Procesamiento

```php
// Detectar cual formato usa el cliente
if (isset($validated['pagos']) && !empty($validated['pagos'])) {
    // Nuevo formato: múltiples pagos
    $desglosePagos = $this->procesarMultiplesPagos($validated['pagos']);
    $totalDineroRecibido = collect($desglosePagos)->sum('monto');
} else if (isset($validated['monto_recibido'])) {
    // Backward compatibility: un único pago
    $desglosePagos = [[
        'tipo_pago_id' => $validated['tipo_pago_id'],
        'monto' => $validated['monto_recibido']
    ]];
    $totalDineroRecibido = $validated['monto_recibido'];
} else {
    // Sin dinero recibido (crédito total)
    $desglosePagos = [];
    $totalDineroRecibido = 0;
}

// Calcular monto pendiente
$montoPendiente = max(0, $venta->total - $totalDineroRecibido);

// Guardar confirmación
$confirmacion = EntregaVentaConfirmacion::updateOrCreate(
    ['entrega_id' => $id, 'venta_id' => $venta_id],
    [
        'desglose_pagos' => $desglosePagos,
        'total_dinero_recibido' => $totalDineroRecibido,
        'monto_pendiente' => $montoPendiente,
        'tipo_confirmacion' => $validated['tipo_confirmacion'],
        'estado_pago' => $this->determinarEstadoPago($totalDineroRecibido, $venta->total),
    ]
);
```

---

### 5. Determinación del Estado de Pago

```php
private function determinarEstadoPago($dineroRecibido, $totalVenta)
{
    if ($dineroRecibido >= $totalVenta) {
        return 'PAGADO';                    // 100% cobrado
    } else if ($dineroRecibido > 0) {
        return 'PARCIAL';                   // Pago parcial
    } else {
        return 'CREDITO';                   // Crédito total (0 recibido)
    }
}
```

---

## 📊 Ejemplo Práctico

### Escenario 1: Pago Mixto (500 efectivo + 500 transferencia)

**Solicitud:**
```json
{
  "observaciones_logistica": "Entrega completa",
  "pagos": [
    {"tipo_pago_id": 1, "monto": 500, "referencia": null},
    {"tipo_pago_id": 2, "monto": 500, "referencia": "TRX-20260212-001"}
  ],
  "tipo_confirmacion": "COMPLETA"
}
```

**Resultado en BD:**
```sql
desglose_pagos: [
  {"tipo_pago_id": 1, "tipo_pago_nombre": "Efectivo", "monto": 500},
  {"tipo_pago_id": 2, "tipo_pago_nombre": "Transferencia", "monto": 500}
]
total_dinero_recibido: 1000.00
monto_pendiente: 0.00
estado_pago: 'PAGADO'
```

### Escenario 2: Pago Parcial (500 efectivo + 500 crédito)

**Solicitud:**
```json
{
  "observaciones_logistica": "Entrega completa - cliente paga la mitad",
  "pagos": [
    {"tipo_pago_id": 1, "monto": 500}
  ],
  "monto_credito": 500,
  "tipo_confirmacion": "COMPLETA"
}
```

**Resultado en BD:**
```sql
desglose_pagos: [
  {"tipo_pago_id": 1, "tipo_pago_nombre": "Efectivo", "monto": 500}
]
total_dinero_recibido: 500.00
monto_pendiente: 500.00
estado_pago: 'PARCIAL'
```

### Escenario 3: Crédito Total (sin dinero)

**Solicitud:**
```json
{
  "observaciones_logistica": "Entrega completa - cliente paga después",
  "pagos": [],
  "monto_credito": 1000,
  "tipo_confirmacion": "COMPLETA"
}
```

**Resultado en BD:**
```sql
desglose_pagos: null
total_dinero_recibido: 0.00
monto_pendiente: 1000.00
estado_pago: 'CREDITO'
```

---

## 🔄 Flujo de Implementación

1. **Fase 1**: Ejecutar migración para agregar columnas a `entregas_venta_confirmaciones`
2. **Fase 2**: Actualizar endpoint `/api/chofer/entregas/{id}/ventas/{venta_id}/confirmar-entrega`
3. **Fase 3**: Actualizar modelo `EntregaVentaConfirmacion` con casting de JSON
4. **Fase 4**: Actualizar pantalla Flutter para capturar múltiples pagos
5. **Fase 5**: Crear reportes en dashboard para analizar desglose de pagos

---

## 📋 Checklist de Implementación

- [ ] Ejecutar migración en BD
- [ ] Actualizar EntregaController::confirmarVentaEntregada()
- [ ] Actualizar modelo EntregaVentaConfirmacion
- [ ] Actualizar Flutter: agregar UI para múltiples pagos
- [ ] Probar Escenario 1: Pago Mixto
- [ ] Probar Escenario 2: Pago Parcial
- [ ] Probar Escenario 3: Crédito Total
- [ ] Backward compatibility: verificar flujo antiguo sigue funcionando
- [ ] Crear reportes de desglose de pagos

---

## 🎯 Beneficios

✅ Soporta cualquier combinación de formas de pago
✅ Mantiene backward compatibility con clientes antiguos
✅ Auditoría completa de dinero recibido vs pendiente
✅ Facilita ajuste con contabilidad (CxC vs Efectivo)
✅ Reportes precisos de cobranza por tipo de pago

