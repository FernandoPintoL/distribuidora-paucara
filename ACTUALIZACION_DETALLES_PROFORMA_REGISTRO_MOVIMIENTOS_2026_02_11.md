# ✅ Endpoint actualizar-detalles: Registro Correcto de Movimientos (2026-02-11)

## 🎯 Objetivo
Asegurar que el endpoint `POST /api/proformas/{proforma}/actualizar-detalles` registre correctamente:
- ✅ Cantidad anterior y cantidad posterior en `movimientos_inventario`
- ✅ Actualización correcta en `stock_productos` (cantidad, cantidad_disponible, cantidad_reservada)
- ✅ Sincronización correcta en `reservas_proforma`

---

## ✅ Cambios Realizados

### 1. **liberarReservaConMovimiento()** - COMPLETAMENTE REFACTORIZADO
**Línea**: 3228-3285

**Antes**: ❌ No actualizaba stock_productos, no registraba cantidad_anterior/posterior
**Ahora**: ✅ Actualización completa con auditoría

```php
// 1️⃣ Lock + obtener valores ANTES
$stockProducto = StockProducto::lockForUpdate()->findOrFail(...);
$cantidadAnterior = $stockProducto->cantidad_disponible;

// 2️⃣ Actualizar stock_productos
$stockProducto->update([
    'cantidad_disponible' => $cantidadAnterior + $cantidadALiberar,
    'cantidad_reservada' => $cantidadReservada - $cantidadALiberar,
]);

// 3️⃣ Obtener valores DESPUÉS
$stockProducto->refresh();
$cantidadPosterior = $stockProducto->cantidad_disponible;

// 4️⃣ Registrar con cantidad_anterior/posterior
MovimientoInventario::create([
    'cantidad_anterior' => $cantidadAnterior,  // ✅
    'cantidad_posterior' => $cantidadPosterior,  // ✅
    'observacion' => json_encode([...])  // JSON con detalles
]);

// 5️⃣ Actualizar estado de reserva
$reserva->update(['estado' => LIBERADA]);
```

---

### 2. **liberarExcesoReserva()** - COMPLETAMENTE REFACTORIZADO
**Línea**: 3333-3412

**Antes**: ❌ No actualizaba stock_productos, no registraba cantidad_anterior/posterior
**Ahora**: ✅ Actualización completa igual a liberarReservaConMovimiento

```php
// Mismo patrón que liberarReservaConMovimiento:
// 1. Lock + obtener ANTES
// 2. Actualizar stock_productos
// 3. Obtener DESPUÉS
// 4. Registrar movimiento con cantidad_anterior/posterior
// 5. Logging detallado
```

---

### 3. **reducirReserva()** - MEJORADO CON REGISTRO DE MOVIMIENTO
**Línea**: 3294-3356

**Antes**: ✅ Actualizaba stock, ❌ NO registraba movimiento
**Ahora**: ✅ Actualización + movimiento con cantidad_anterior/posterior

```php
// 1. Lock + obtener cantidad_disponible ANTES
// 2. Actualizar cantidad_reservada en reserva
// 3. Actualizar stock_productos
// 4. Obtener cantidad_disponible DESPUÉS
// 5. Registrar movimiento tipo LIBERACION_RESERVA con cantidad_anterior/posterior
```

---

### 4. **ampliarReserva()** - MEJORADO CON CANTIDAD_ANTERIOR/POSTERIOR
**Línea**: 3417-3483

**Antes**: ✅ Actualizaba stock + registraba movimiento, ❌ NO había cantidad_anterior/posterior
**Ahora**: ✅ Movimiento completo con auditoría

```php
// 1. Lock + obtener cantidad_disponible ANTES
// 2. Validar disponibilidad
// 3. Actualizar cantidad_reservada
// 4. Actualizar stock_productos
// 5. Obtener cantidad_disponible DESPUÉS
// 6. Registrar movimiento tipo RESERVA_PROFORMA con:
//    - cantidad_anterior (disponible antes)
//    - cantidad_posterior (disponible después)
//    - JSON con detalles de cantidad_reservada (antes/después)
```

---

### 5. **crearReservaAdicional()** - MEJORADO CON CANTIDAD_ANTERIOR/POSTERIOR
**Línea**: 3488-3557

**Antes**: ✅ Actualizaba stock + registraba movimiento, ❌ NO había cantidad_anterior/posterior
**Ahora**: ✅ Movimiento completo con auditoría

```php
// 1. Lock + obtener valores ANTES
// 2. Validar disponibilidad
// 3. Crear nueva reserva
// 4. Actualizar stock_productos
// 5. Obtener valores DESPUÉS
// 6. Registrar movimiento con cantidad_anterior/posterior en JSON
```

---

## 📊 Tabla de Cambios

| Método | Actualiza stock | Registra movimiento | Cantidad anterior/posterior |
|--------|-----------------|---------------------|---------------------------|
| liberarReservaConMovimiento | ✅ NUEVO | ✅ NUEVO | ✅ NUEVO |
| liberarExcesoReserva | ✅ NUEVO | ✅ NUEVO | ✅ NUEVO |
| reducirReserva | ✅ YA | ✅ NUEVO | ✅ NUEVO |
| ampliarReserva | ✅ YA | ✅ YA | ✅ MEJORADO |
| crearReservaAdicional | ✅ YA | ✅ YA | ✅ MEJORADO |

---

## 🔍 Ejemplo de Movimiento Registrado

**Cuando se libera una reserva de 10 unidades:**

```json
{
  "stock_producto_id": 5,
  "cantidad": 10,
  "cantidad_anterior": 50,  // ✅ Disponibles ANTES
  "cantidad_posterior": 60,  // ✅ Disponibles DESPUÉS
  "tipo": "LIBERACION_RESERVA",
  "numero_documento": "PRO20260211-0001",
  "observacion": {
    "evento": "Liberación de reserva de proforma",
    "motivo": "Detalle removido de proforma",
    "reserva_id": 42,
    "cantidad_reservada_anterior": 10,
    "cantidad_reservada_posterior": 0
  }
}
```

---

## 📋 Tabla stock_productos - Actualización Correcta

| Campo | Antes | Después | Cambio |
|-------|-------|---------|--------|
| `cantidad_disponible` | 50 | 60 | +10 (liberado) |
| `cantidad_reservada` | 10 | 0 | -10 (liberado) |
| `fecha_actualizacion` | - | NOW() | ✅ |

---

## 🔐 Tabla reservas_proforma - Sincronización

| Caso | Acción en reserva | Estado |
|------|-------------------|--------|
| Liberar completa | `update(estado => LIBERADA)` | ✅ |
| Reducir cantidad | `update(cantidad_reservada => X)` | ✅ |
| Ampliar cantidad | `update(cantidad_reservada => Y)` | ✅ |
| Crear nueva | `create(...)` | ✅ |

---

## ✅ Características Implementadas

### Lock Pesimista
```php
$stockProducto = StockProducto::lockForUpdate()->findOrFail(...);
```
- ✅ Evita race conditions en concurrencia
- ✅ Garantiza consistencia de datos

### Observación en JSON
```php
'observacion' => json_encode([
    'evento' => '...',
    'motivo' => '...',
    'cantidad_reservada_anterior' => X,
    'cantidad_reservada_posterior' => Y,
])
```
- ✅ Detalles completos para auditoría
- ✅ Información clara sobre qué cambió

### Logging Detallado
```php
Log::info('✅ Reserva ampliada correctamente', [
    'reserva_id' => $reserva->id,
    'cantidad_disponible_antes' => $antes,
    'cantidad_disponible_despues' => $despues,
    'diferencia' => $diferencia,
]);
```
- ✅ Debugging facilitado
- ✅ Trazabilidad de cambios

---

## 🧪 Ejemplo Completo: Reducir Cantidad de Proforma

### Escenario
```
Proforma con 2 productos:
- Producto A: 10 unidades (reserva_id=42)
- Producto B: 5 unidades (reserva_id=43)

Usuario actualiza a:
- Producto A: 8 unidades (reduce de 10 a 8)
- Producto B: 5 unidades (sin cambio)
```

### Flujo
1. **Reducir Producto A**:
   - `reducirReserva(reserva=42, cantidadNueva=8)`
   - Diferencia: 10 - 8 = 2 unidades
   - Stock ANTES: cantidad_disponible=50, cantidad_reservada=150
   - Stock DESPUÉS: cantidad_disponible=52, cantidad_reservada=148
   - Movimiento registrado con cantidad_anterior=50, cantidad_posterior=52

2. **Producto B sin cambios**:
   - No hace nada (cantidad igual)

3. **Resultado en tablas**:
   - ✅ `reservas_proforma`: reserva_id=42 ahora cantidad_reservada=8
   - ✅ `stock_productos`: cantidad_disponible=52, cantidad_reservada=148
   - ✅ `movimientos_inventario`: Registro con cantidad_anterior=50, cantidad_posterior=52

---

## ✅ Build Status

- ✅ `php -l` ApiProformaController.php - Sin errores
- ✅ `npm run build` - Exitoso (43.51s)
- ✅ No hay cambios en TypeScript/frontend
- ✅ Totalmente compatible con actualizaciones anteriores

---

## 🎯 Beneficios

1. **Auditoría Completa**: Cada cambio queda registrado con ANTES/DESPUÉS
2. **Consistencia**: Stock y reservas siempre sincronizados
3. **Confiabilidad**: Lock pesimista previene race conditions
4. **Debugging**: Logging detallado facilita investigación de problemas
5. **Trazabilidad**: JSON con observaciones completas para auditoría

---

**Última actualización**: 2026-02-11  
**Versión**: 1.0 (Implementación Completa)
