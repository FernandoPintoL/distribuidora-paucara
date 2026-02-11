# 📊 Fuentes de Datos: CierreCajaService - Análisis Completo

## ❓ ¿Usa solo tabla `movimientos_caja`?

**RESPUESTA: NO.** Usa múltiples tablas con JOINs.

---

## 🗄️ Tablas Utilizadas

| Tabla | Uso | Método |
|-------|-----|--------|
| **movimientos_caja** | Tabla base, SIEMPRE se consulta | Todos los métodos |
| **ventas** | Datos de ventas (total, número, estado) | calcularTotalVentas(), calcularVentasPorTipoPago(), etc. |
| **tipo_operacion_caja** | Clasificación (VENTA, PAGO, GASTOS, etc.) | Filtros en WHERE IN |
| **estados_documento** | Validación de estado (APROBADO, ANULADO) | JOINs para validar estado de ventas |
| **tipos_pago** | Tipo de pago (EFECTIVO, TRANSFERENCIA, etc.) | Agrupamientos por tipo de pago |
| **pagos** | Datos de pagos de CxC | Via relación en MovimientoCaja |

---

## 🔗 Relaciones (Eager Loading)

En `obtenerMovimientos()`:

```php
MovimientoCaja::where('caja_id', $aperturaCaja->caja_id)
    ->whereBetween('fecha', [$aperturaCaja->fecha, $this->fechaFin])
    ->with([
        'tipoOperacion',           // -> tipo_operacion_caja
        'comprobantes',            // -> comprobantes
        'tipoPago',                // -> tipos_pago
        'venta.estadoDocumento',   // -> ventas.estado_documento_id -> estados_documento
        'pago'                     // -> pagos
    ])
    ->get();
```

---

## 📋 Ejemplo de Query Completo: `calcularTotalVentas()`

```sql
SELECT SUM(ventas.total)
FROM movimientos_caja
    JOIN ventas
        ON movimientos_caja.numero_documento = ventas.numero
    JOIN tipo_operacion_caja
        ON movimientos_caja.tipo_operacion_id = tipo_operacion_caja.id
    JOIN estados_documento
        ON ventas.estado_documento_id = estados_documento.id
WHERE movimientos_caja.caja_id = {apertura.caja_id}
  AND tipo_operacion_caja.codigo IN ('VENTA', 'CREDITO')
  AND estados_documento.codigo = 'APROBADO'
  AND movimientos_caja.fecha BETWEEN {apertura.fecha} AND {cierre.fecha}
```

**Tablas usadas: 4**
- movimientos_caja
- ventas
- tipo_operacion_caja
- estados_documento

---

## 🔍 Análisis por Método Principal

### 1. `calcularTotalVentas()`
**Tablas**: movimientos_caja + ventas + tipo_operacion_caja + estados_documento
```
SELECT SUM(ventas.total) ...
WHERE tipo = VENTA/CREDITO AND estado = APROBADO
```

### 2. `calcularVentasPorTipoPagoEspecifico()`
**Tablas**: movimientos_caja + ventas + tipo_operacion_caja + estados_documento + tipos_pago
```
SELECT SUM(ventas.total) ...
WHERE tipo = VENTA/CREDITO AND estado = APROBADO AND tipo_pago IN ['EFECTIVO', 'TRANSFERENCIA']
```

### 3. `calcularVentasAprobadasCredito()`
**Tablas**: movimientos_caja + ventas + tipo_operacion_caja + estados_documento
```
SELECT SUM(ventas.total) ...
WHERE tipo = CREDITO AND estado = APROBADO
```

### 4. `calcularPagosCredito()`
**Tablas**: movimientos_caja (operaciones con tipo PAGO)
```
Filtra en memoria: $movimientos->where('tipoOperacion.codigo', 'PAGO')
                            ->where('estado_pago', 'APROBADO')
```

### 5. `calcularSalidasReales()`
**Tablas**: movimientos_caja (operaciones con dirección SALIDA)
```
Filtra en memoria: $movimientos->whereIn('tipoOperacion.codigo', ['GASTOS', 'PAGO_SUELDO', 'ANTICIPO', 'ANULACION'])
```

### 6. `calcularAnulaciones()`
**Tablas**: movimientos_caja + ventas (solo tipo VENTA, estado ANULADO)
```
DB::table('ventas')
    ->where('caja_id', $aperturaCaja->caja_id)
    ->where('estado_documento_id', ANULADO)
    ->whereBetween('created_at', [...])
    ->sum('total')
```

### 7. `calcularVentasPorEstado()`
**Tablas**: movimientos_caja + ventas + tipo_operacion_caja + estados_documento
```
SELECT COUNT(*), SUM(ventas.total)
FROM movimientos_caja
    JOIN ventas
    JOIN tipo_operacion_caja
    JOIN estados_documento
GROUP BY estados_documento.nombre
```

---

## 🎯 Flujo de Obtención de Datos

```
CajaController::index()
    ↓
CierreCajaService::calcularDatos(AperturaCaja)
    ↓
obtenerMovimientos()
    ├─ Query a movimientos_caja
    └─ Eager load relaciones: tipoOperacion, tipoPago, venta.estadoDocumento, pago
        ↓
        Luego cada método privado:
    ├─ calcularTotalVentas() → DB::table + 4 JOINs
    ├─ calcularVentasPorTipoPagoEspecifico() → DB::table + 5 JOINs
    ├─ calcularVentasAprobadasCredito() → DB::table + 4 JOINs
    ├─ calcularPagosCredito() → Filtra en memoria de movimientos
    ├─ calcularSalidasReales() → Filtra en memoria de movimientos
    ├─ calcularAnulaciones() → DB::table(ventas) + 1 JOIN
    └─ calcularVentasPorEstado() → DB::table + 4 JOINs
```

---

## 📊 Resumen de Consultas por Tipo

### Queries Ejecutadas (DB::)
1. `obtenerMovimientos()` - SELECT FROM movimientos_caja
2. `calcularTotalVentas()` - SELECT SUM() con 4 JOINs
3. `calcularVentasPorTipoPagoEspecifico()` - SELECT SUM() con 5 JOINs
4. `calcularVentasAprobadasCredito()` - SELECT SUM() con 4 JOINs
5. `calcularAnulaciones()` - SELECT SUM() FROM ventas con JOINs
6. `calcularVentasPorEstado()` - SELECT COUNT, SUM con 4 JOINs, GROUP BY
7. `calcularCompras()` - SELECT SUM() con filtros
8. `calcularTotalSalidas()` - SELECT SUM() con filtros
9. Otras queries menores

### Filtros en Memoria (PHP Collection)
- `calcularPagosCredito()` - Filtra movimientos ya cargados
- `calcularSalidasReales()` - Filtra movimientos ya cargados
- `calcularCompras()` - Filtra movimientos ya cargados
- `calcularVentasAprobadas()` - Valida con helper methods

---

## 🔐 Validaciones de Datos

### Usa `estados_documento.codigo` (Seguro)
✅ **CORRECTO**: Compara strings como 'APROBADO', 'ANULADO'
```php
->where('estados_documento.codigo', self::ESTADO_APROBADO)
```

### Filtra por `tipo_operacion_caja.codigo` (Seguro)
✅ **CORRECTO**: Compara strings como 'VENTA', 'PAGO', 'GASTOS'
```php
->whereIn('tipo_operacion_caja.codigo', ['VENTA', 'CREDITO'])
```

### NO usa IDs directamente en comparaciones
✅ **CORRECTO**: Usa códigos, no IDs que podrían cambiar

---

## 💡 Conclusión

**CierreCajaService NO usa solo `movimientos_caja`.**

Realiza **múltiples queries complejas** que requieren:

1. ✅ Tabla `movimientos_caja` como base
2. ✅ Joins con `ventas` para obtener totales
3. ✅ Joins con `tipo_operacion_caja` para clasificar operaciones
4. ✅ Joins con `estados_documento` para validar estados
5. ✅ Joins con `tipos_pago` para agrupar por tipo de pago
6. ✅ Relación con `pagos` para pagos de CxC

**Esto garantiza:**
- Datos precisos y actualizados
- Validaciones robustas
- Integridad referencial
- Auditoría completa

---

## 📌 Impacto de Cambios en Datos

| Si Cambias | Impacto |
|-----------|--------|
| Una venta en tabla `ventas` | ✅ Automáticamente reflejado en cálculos |
| Un estado en `estados_documento` | ✅ Automáticamente reflejado en cálculos |
| Un movimiento en `movimientos_caja` | ✅ Automáticamente reflejado en cálculos |
| Un tipo de operación | ✅ Automáticamente reflejado en filtros |

**Los datos siempre están FRESCOS y EXACTOS** porque se consultan directamente desde BD.

---

**Status**: ✅ ANÁLISIS COMPLETO
**Fecha**: 2026-02-11
