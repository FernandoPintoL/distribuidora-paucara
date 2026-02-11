# 🎯 Refactorización CierreCajaService - Cálculos Simplificados (2026-02-11)

## 📋 Objetivo

Simplificar la lógica de cierre de caja centrando en **2 cálculos principales** que responden a preguntas de negocio claras:

1. **¿Cuánto vendimos en total?** → `totalVentas`
2. **¿Cuánto efectivo hay en la caja?** → `totalEfectivo`

---

## 🔄 Cambios Principales

### Antes (Complicado)

```php
// Múltiples cálculos parciales, difícil de entender
'sumatorialVentas'          => calcularVentasAprobadasTotal()
'sumatorialVentasEfectivo'  => calcularVentasAprobadasEfectivo()
'sumatorialVentasCredito'   => calcularVentasAprobadasCredito()
'sumatorialGastos'          => calcularSumaPorCodigo('GASTOS')
'sumatorialPagosSueldo'     => calcularSumaPorCodigo('PAGO_SUELDO')
'sumatorialAnticipos'       => calcularSumaPorCodigo('ANTICIPO')
'sumatorialAnulaciones'     => calcularSumaPorCodigo('ANULACION')
// ... y frontend tenía que sumar/restar manualmente
```

### Después (Simplificado) ✅

```php
// 2 valores principales claros
'totalVentas'   => 15000.00,  // Todas las ventas
'totalEfectivo' => 12500.00,  // Todo el efectivo en caja

// Breakdown detallado si necesitas (opcional)
'detalleEfectivo' => [
    'ventas_efectivo_transferencia' => 10000.00,
    'pagos_credito'                 => 3500.00,
    'ventas_credito'                => -1500.00,  // Crédito no entra en efectivo
    'total_entradas_efectivo'       => 13500.00,
    'total_salidas'                 => -1000.00,  // Gastos, sueldos, etc
]

// Datos antiguos siguen disponibles para compatibilidad
'sumatorialVentas'     => 15000.00,
'sumatorialGastos'     => 500.00,
...
```

---

## 📊 Fórmulas de Cálculo

### 1️⃣ Total de Ventas

```
totalVentas = ∑(Ventas APROBADAS) + ∑(Créditos APROBADOS)

Donde:
- Ventas APROBADAS: tipo_operacion='VENTA' AND estado='APROBADO'
- Créditos APROBADOS: tipo_operacion='CREDITO' AND estado='APROBADO'
```

**Ejemplo**:
```
Venta 1: $5,000 (Efectivo) ✓
Venta 2: $3,000 (Transferencia) ✓
Venta 3: $7,000 (Crédito) ✓
───────────────────────────
Total Ventas = $15,000
```

### 2️⃣ Efectivo en Caja

```
totalEfectivo = Apertura
              + Ventas(Efectivo + Transferencia)
              + Pagos de Crédito
              - Ventas al Crédito
              - Total Salidas

Donde:
- Apertura: monto inicial de caja
- Ventas(Efectivo+Transferencia): tipo_pago IN ('EFECTIVO', 'TRANSFERENCIA')
- Pagos de Crédito: tipo_operacion='PAGO' AND estado='REGISTRADO'
- Ventas al Crédito: tipo_operacion='CREDITO' (no entra en efectivo)
- Total Salidas: GASTOS + PAGO_SUELDO + ANTICIPO + ANULACION
```

**Ejemplo Paso a Paso**:
```
Apertura de caja:                    $1,000
+ Venta efectivo:                    $5,000
+ Venta transferencia:               $3,000
+ Pago de crédito recibido:          $2,000
- Venta al crédito (no entra):      -$7,000
- Gastos operacionales:              -$500
- Pago de sueldos:                   -$1,500
- Anticipos a empleados:             -$500
- Anulación de venta:                -$200
═══════════════════════════════════════════
Total Efectivo en Caja:              $1,300
```

---

## 🔍 Métodos Nuevos

### `calcularTotalVentas()`

```php
/**
 * Suma todas las ventas aprobadas de TODOS los tipos de pago
 * Fórmula: VENTA.total + CREDITO.total (ambas en estado APROBADO)
 */
private function calcularTotalVentas(AperturaCaja $aperturaCaja): float
```

✅ **Cuándo usarlo**: Reportes de ventas totales, metrics de negocio
✅ **Qué incluye**: Ventas efectivo, transferencia, crédito
✅ **Qué excluye**: Anulaciones, ventas pendientes

---

### `calcularEfectivoEnCaja()`

```php
/**
 * Calcula el efectivo real que debe haber en caja al cierre
 * Fórmula: Apertura + Entradas - Salidas
 */
private function calcularEfectivoEnCaja(AperturaCaja $aperturaCaja, $movimientos): float
```

✅ **Cuándo usarlo**: Cierre físico de caja, reconciliación
✅ **Qué incluye**: Apertura, ventas en efectivo, pagos de CxC, menos salidas
✅ **Qué excluye**: Créditos pendientes (promesa de pago, no dinero)

---

### `calcularVentasPorTipoPagoEspecifico()`

```php
/**
 * Calcula ventas filtradas por tipos de pago específicos
 * Ejemplo: Solo EFECTIVO, o EFECTIVO+TRANSFERENCIA
 */
private function calcularVentasPorTipoPagoEspecifico(
    AperturaCaja $aperturaCaja,
    array $tiposPago
): float
```

**Ejemplo de uso**:
```php
// Solo efectivo
$soloEfectivo = calcularVentasPorTipoPagoEspecifico($apertura, ['EFECTIVO']);

// Efectivo + Transferencias
$conTransferencias = calcularVentasPorTipoPagoEspecifico($apertura, ['EFECTIVO', 'TRANSFERENCIA']);
```

---

### `calcularPagosCredito()`

```php
/**
 * Suma pagos de crédito que entran en efectivo
 * Solo pagos en estado REGISTRADO
 */
private function calcularPagosCredito($movimientos): float
```

✅ **Qué incluye**: Todos los pagos de cuentas por cobrar en estado REGISTRADO
✅ **Qué excluye**: Pagos ANULADOS o PENDIENTES

---

### `calcularTotalSalidas()`

```php
/**
 * Suma TODOS los egresos (GASTOS, PAGO_SUELDO, ANTICIPO, ANULACION)
 */
private function calcularTotalSalidas($movimientos): float
```

✅ **Qué incluye**:
- GASTOS: Gastos operacionales
- PAGO_SUELDO: Nómina
- ANTICIPO: Anticipos a empleados
- ANULACION: Anulaciones de venta

---

## 📈 Respuesta en el Array

```php
return [
    // ✅ CÁLCULOS PRINCIPALES (NUEVOS)
    'totalVentas'   => 15000.00,
    'totalEfectivo' => 12500.00,

    // Breakdown detallado
    'detalleEfectivo' => [
        'ventas_efectivo_transferencia' => 8000.00,
        'ventas_credito'                => 7000.00,
        'pagos_credito'                 => 2000.00,
        'total_entradas_efectivo'       => 10000.00,
        'total_salidas'                 => -2500.00,
    ],

    // Datos antiguos (compatibilidad)
    'sumatorialVentas'          => 15000.00,
    'sumatorialVentasEfectivo'  => 8000.00,
    'sumatorialVentasCredito'   => 7000.00,
    'sumatorialGastos'          => 500.00,
    'sumatorialPagosSueldo'     => 1500.00,
    'sumatorialAnticipos'       => 300.00,
    'sumatorialAnulaciones'     => 200.00,
    ...
];
```

---

## 🎯 Casos de Uso

### Caso 1: Cierre de Caja Diario
```javascript
// Frontend recibe:
const { totalVentas, totalEfectivo } = respuesta;

// Muestra:
console.log(`Vendiste: $${totalVentas}`);
console.log(`Efectivo esperado: $${totalEfectivo}`);

// Contador físico
const contador_fisico = prompt('¿Cuánto efectivo contaste?');
const diferencia = contador_fisico - totalEfectivo;
if (diferencia === 0) {
    console.log('✅ Caja coincide perfectamente');
} else {
    console.log(`⚠️ Diferencia: $${diferencia}`);
}
```

### Caso 2: Reporte de Ventas Mensuales
```javascript
// Para reports
const { totalVentas, detalleEfectivo } = respuesta;

console.table({
    'Total Vendido': totalVentas,
    'Efectivo': detalleEfectivo.ventas_efectivo_transferencia,
    'Crédito': detalleEfectivo.ventas_credito,
    'Cobranzas': detalleEfectivo.pagos_credito,
});
```

### Caso 3: Auditoría
```javascript
// Para auditoría, todos los detalles disponibles
const { detalleEfectivo, sumatorialGastos, sumatorialPagosSueldo } = respuesta;

// Verificar que las fórmulas se cumplen
const calculado =
    detalleEfectivo.ventas_efectivo_transferencia +
    detalleEfectivo.pagos_credito -
    detalleEfectivo.ventas_credito -
    detalleEfectivo.total_salidas;

console.assert(
    Math.abs(calculado - totalEfectivo) < 0.01,
    'Fórmula no coincide'
);
```

---

## 📝 Logging Mejorado

Cada método nuevo loguea automáticamente en `storage/logs/laravel.log`:

```
[2026-02-11 14:30:45] local.INFO: 💰 [calcularTotalVentas]: {"apertura_id":5,"total":15000}
[2026-02-11 14:30:45] local.INFO: 💵 [calcularEfectivoEnCaja]: {"apertura":1000,"ventas_efectivo_transferencia":8000,"pagos_credito":2000,"menos_ventas_credito":-7000,"menos_salidas":-2500,"total_efectivo":1500}
[2026-02-11 14:30:45] local.INFO: 📥 [calcularPagosCredito]: {"total":2000}
[2026-02-11 14:30:45] local.INFO: 📤 [calcularTotalSalidas]: {"total":2500}
```

✅ Fácil debuggear y auditar

---

## ✅ Validaciones

- ✅ PHP Lint: Sin errores
- ✅ Métodos privados: No afectan API pública
- ✅ Backward Compatible: Datos antiguos siguen disponibles
- ✅ Logging: Completo para auditoría
- ✅ Tipo Hints: Agregados

---

## 📌 Notas Importantes

### 1. Ventas al Crédito NO entran en Efectivo

```
Venta al crédito $1,000:
- Se suma en totalVentas ✓
- NO se suma en totalEfectivo (es promesa de pago, no dinero) ❌
- Entra en totalEfectivo CUANDO se paga (pago_credito) ✓
```

### 2. Diferencia: totalVentas vs totalEfectivo

```
totalVentas = $15,000    (todo lo que vendimos)
totalEfectivo = $8,500   (dinero que realmente recibimos)

Si totalVentas > totalEfectivo:
  → Hay crédito pendiente de cobrar
```

### 3. Formula se puede verificar

```
detalleEfectivo.total_entradas_efectivo - detalleEfectivo.total_salidas
= (ventas_efectivo + pagos_credito) - salidas
= totalEfectivo - apertura
```

---

## 🚀 Próximos Pasos Recomendados

1. **Frontend**: Actualizar componentes para mostrar `totalVentas` y `totalEfectivo`
2. **Reports**: Usar `detalleEfectivo` para breakdown en reportes
3. **Tests**: Agregar tests unitarios para validar fórmulas
4. **Auditoría**: Revisar logs para verificar cálculos

---

**Status**: ✅ Refactorización completada
**Fecha**: 2026-02-11
**PHP Lint**: ✅ Sin errores
**Backward Compatible**: ✅ Sí
