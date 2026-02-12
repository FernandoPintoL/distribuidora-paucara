# 📦 Flujo de Reservas de Proformas - Análisis Detallado

## 🎯 Objetivo
Cuando se actualiza una proforma con detalles de productos, el sistema automáticamente:
- Crea/modifica reservas de stock
- Actualiza cantidades en `stock_productos`
- Registra movimientos en `movimientos_inventario`
- Bloquea stock para 3 días (vencimiento automático)

---

## 🔄 Flujo Principal: Actualizar Detalles de Proforma

### ENDPOINT
```
POST /api/proformas/{proforma}/actualizar-detalles
```

### REQUEST BODY
```json
{
  "detalles": [
    { "id": 1, "producto_id": 137, "cantidad": 2, "precio_unitario": 12, "subtotal": 24 },
    { "id": 2, "producto_id": 2, "cantidad": 3, "precio_unitario": 32.4, "subtotal": 97.2 }
  ]
}
```

---

## 📋 PASO A PASO: Cómo se Procesan las Reservas

### 1. **Obtener Cliente y Almacén**
```php
$almacen_id = $proforma->cliente?->almacen_id ?? 1;
```
- Si el cliente tiene `almacen_id` preferido → usa ese
- Si no → usa almacén 1 (por defecto)

### 2. **Buscar Stock del Producto**
```php
$stockProducto = $producto->stocks()
    ->where('almacen_id', $almacen_id)
    ->firstOrFail();
```

⚠️ **IMPORTANTE - COMPORTAMIENTO CON MÚLTIPLES LOTES:**

#### Caso: Producto tiene 2 LOTES en el mismo almacén

Tabla `stock_productos`:
| id | producto_id | almacen_id | lote      | cantidad | cantidad_disponible |
|----|-------------|-----------|-----------|----------|-------------------|
| 1  | 137         | 1         | LOTE-001  | 100      | 50                |
| 2  | 137         | 1         | LOTE-002  | 80       | 80                |

**Comportamiento actual:**
- `firstOrFail()` toma el **PRIMER registro** (generalmente por ID o orden de creación)
- En este ejemplo: **selecciona LOTE-001** (id=1)
- Si LOTE-001 tuviera 0 disponible → **ERROR**, no intenta LOTE-002
- Si LOTE-001 tiene suficiente → **reserva de LOTE-001**

### 3. **Validar Stock Disponible**
```php
if ($stockProducto->cantidad_disponible < $cantidad) {
    throw new Exception("Stock insuficiente...");
}
```

### 4. **Crear Registro en `reservas_proformas`**
```php
$reserva = ReservaProforma::create([
    'proforma_id' => $proforma->id,
    'stock_producto_id' => $stockProducto->id,  // ← Referencia al lote específico
    'cantidad_reservada' => $cantidad,
    'fecha_reserva' => now(),
    'fecha_expiracion' => now()->addDays(3),    // ← 3 DÍAS DE BLOQUEO
    'estado' => 'ACTIVA',
]);
```

**Tabla resultante `reservas_proformas`:**
| id | proforma_id | stock_producto_id | cantidad_reservada | fecha_expiracion | estado |
|----|-------------|------------------|-------------------|-----------------|--------|
| 1  | 5           | 1                 | 2                 | 2026-02-14      | ACTIVA |

### 5. **Actualizar Cantidades en `stock_productos`**
```php
$stockProducto->decrement('cantidad_disponible', $cantidad);
$stockProducto->increment('cantidad_reservada', $cantidad);
```

**ANTES:**
| stock_producto_id | cantidad | cantidad_disponible | cantidad_reservada |
|------------------|----------|-------------------|-------------------|
| 1 (LOTE-001)    | 100      | 50                | 30                |

**DESPUÉS:**
| stock_producto_id | cantidad | cantidad_disponible | cantidad_reservada |
|------------------|----------|-------------------|-------------------|
| 1 (LOTE-001)    | 100      | 48                | 32                |

### 6. **Registrar Movimiento en `movimientos_inventario`**
```php
MovimientoInventario::create([
    'stock_producto_id' => $stockProducto->id,
    'cantidad' => -$cantidad,  // Negativo: indica bloqueo
    'tipo' => 'RESERVA_PROFORMA',
    'numero_documento' => $proforma->numero,  // PRO-001
    'referencia_tipo' => 'proforma',
    'referencia_id' => $proforma->id,
    'observacion' => "Producto agregado a proforma (vencimiento: 3 días)",
    'user_id' => Auth::id(),
    'fecha' => now(),
]);
```

**Tabla `movimientos_inventario`:**
| id | stock_producto_id | tipo               | cantidad | numero_documento | fecha      | observacion              |
|----|------------------|-------------------|----------|-----------------|-----------|------------------------|
| 1  | 1                | RESERVA_PROFORMA  | -2       | PRO-001        | 2026-02-11| Producto agregado... |

---

## 🔀 Comportamientos Especiales

### A) Cuando un Producto YA TIENE RESERVA
```php
// Si producto_id ya está en la proforma → MODIFICAR cantidad
if (isset($reservasActuales[$producto_id])) {
    $diferencia = $cantidadNueva - $cantidadActual;
    if ($diferencia > 0) {
        // AUMENTÓ → ampliar reserva
        $this->ampliarReserva($reserva, $cantidadNueva);
    } else if ($diferencia < 0) {
        // DISMINUYÓ → reducir reserva
        $this->reducirReserva($reserva, $cantidadNueva);
    }
}
```

### B) Cuando se REMUEVE un Producto
```php
// Si producto_id NO está en nueva lista → LIBERAR completamente
if (!isset($productosEnDetalles[$reserva->stock_producto_id->producto_id])) {
    $this->liberarReservaConMovimiento($reserva, 'Producto removido de proforma');
}
```

### C) Con MÚLTIPLES LOTES - Comportamiento ACTUAL
**Escenario:**
- Producto 137 tiene: LOTE-001 (50 disp) + LOTE-002 (100 disp)
- Usuario quiere reservar 80 unidades

**Resultado:**
1. `firstOrFail()` → selecciona LOTE-001
2. Valida: 50 < 80 → **ERROR**
3. No intenta LOTE-002 automáticamente

**Solución actual:** El usuario tendría que:
- Seleccionar LOTE-002 explícitamente (si hay UI para ello)
- O reducir cantidad a ≤50

---

## 📊 Transacciones y Atomicidad

```php
// TODO: ¿Hay transacciones DB::transaction()?
// Revisar si hay rollback automático si algo falla
```

**Riesgos identificados:**
- Si `MovimientoInventario::create()` falla después de actualizar `stock_productos`
- El stock quedaría inconsistente (descontado pero sin movimiento registrado)

---

## 🎯 Resumen: Cuando Hay 2 LOTES

| Acción | Resultado |
|--------|-----------|
| Agregar producto a proforma | Selecciona **PRIMER LOTE** (por ID) |
| Validar disponibilidad | Valida SOLO ese lote (no intenta otros) |
| Error: Stock insuficiente | Lanza excepción, no reserva nada |
| Reservar exitosamente | Crea 1 reserva para ese lote específico |
| Modificar cantidad | Actualiza cantidad en ese lote |
| Remover de proforma | Libera completamente ese lote |

---

## ⚠️ Recomendaciones

### 1. **Multi-Lote: Selección Explícita**
Si necesitas distribuir entre lotes, considera:
```php
// OPCIÓN A: UI para seleccionar lote
POST /api/proformas/{proforma}/actualizar-detalles
{
  "detalles": [
    { "producto_id": 137, "stock_producto_id": 2, "cantidad": 50 }
  ]
}

// OPCIÓN B: Algoritmo de distribución automática
// Por FIFO (First-In-First-Out)
// Por menor cantidad disponible
// Por orden de creación
```

### 2. **Transacciones**
```php
DB::transaction(function () {
    $stockProducto->update(...);
    MovimientoInventario::create(...);
    ReservaProforma::create(...);
});
```

### 3. **Validar Antes de Reservar**
```php
// Validar cantidad total disponible en TODOS los lotes
$totalDisponible = $producto->stocks()
    ->where('almacen_id', $almacen_id)
    ->sum('cantidad_disponible');

if ($totalDisponible < $cantidad) {
    // Error: insuficiente en todos los lotes
}
```

---

## 📝 Archivos Relevantes

- **Creación de reservas:** `app/Http/Controllers/Api/ApiProformaController.php`
  - Línea 3456: `crearNuevaReservaParaProducto()`
  - Línea 3396: `crearReservaAdicional()`

- **Modelo de reserva:** `app/Models/ReservaProforma.php`
  - Método `consumir()`: cuando se convierte a venta
  - Método `liberar()`: cuando se cancela

- **Tabla de movimientos:** `app/Models/MovimientoInventario.php`
  - Tipos: RESERVA_PROFORMA, LIBERACION_RESERVA, ENTRADA_AJUSTE, etc.

---

## 🔍 Query Para Ver Reservas de un Producto

```sql
SELECT
    rp.id as reserva_id,
    p.numero as proforma,
    pr.nombre as producto,
    sp.lote,
    rp.cantidad_reservada,
    sp.cantidad_disponible,
    rp.fecha_expiracion,
    rp.estado
FROM reservas_proformas rp
JOIN proformas p ON rp.proforma_id = p.id
JOIN stock_productos sp ON rp.stock_producto_id = sp.id
JOIN productos pr ON sp.producto_id = pr.id
WHERE pr.id = 137
ORDER BY rp.fecha_expiracion DESC;
```

---

**Última actualización:** 2026-02-11
**Versión:** 1.0
