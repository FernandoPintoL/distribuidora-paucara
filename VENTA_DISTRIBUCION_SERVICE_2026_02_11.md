# 📦 VentaDistribucionService - Servicio Centralizado de Consumo de Stock

## 🎯 Objetivo
Crear un servicio centralizado para gestionar el consumo y devolución de stock en ventas, siguiendo el mismo patrón que `ReservaDistribucionService` para coherencia y mantenibilidad.

---

## ✅ Componentes Creados

### 1. VentaDistribucionService
**Archivo:** `app/Services/Venta/VentaDistribucionService.php`

**Responsabilidades:**
- ✅ Consumir stock cuando se crea una venta (FIFO)
- ✅ Devolver stock cuando se anula una venta (inverso)
- ✅ Validar disponibilidad ANTES de consumir
- ✅ Obtener información de stock disponible
- ✅ Registrar movimientos correctamente (cantidad_anterior/posterior)

---

## 📋 Métodos Principales

### 1. consumirStock()
**Propósito:** Consumir stock cuando se crea una venta

```php
public function consumirStock(
    array $detalles,           // Productos: [['producto_id' => X, 'cantidad' => Y], ...]
    string $numeroVenta,       // Referencia: VEN20260211-0001
    bool $permitirStockNegativo = false  // Para CREDITO
): array  // Retorna movimientos creados
```

**Flujo:**
```
1. Para cada producto:
   a. Obtener stocks con FIFO (vencimiento cercano primero)
   b. Validar si hay disponible (excepto CREDITO)
   c. Consumir según FIFO
   d. Registrar movimiento SALIDA_VENTA
2. Retornar movimientos creados
```

**FIFO Algoritmo:**
```sql
ORDER BY fecha_vencimiento ASC,  -- ← Vence primero
         id ASC                   -- ← Creado primero
```

**Registro de Movimiento:**
```php
MovimientoInventario::create([
    'stock_producto_id' => $stock->id,
    'cantidad' => -$cantidadTomar,           // ← NEGATIVO (salida)
    'cantidad_anterior' => $cantidadAnterior,
    'cantidad_posterior' => $cantidadPosterior,
    'tipo' => 'SALIDA_VENTA',
    'numero_documento' => $numeroVenta,
    'observacion' => json_encode([
        'evento' => 'Consumo de stock para venta',
        'producto_id' => $productoId,
        'cantidad_anterior' => $cantidadAnterior,
        'cantidad_posterior' => $cantidadPosterior,
        // ... más detalles
    ]),
]);
```

---

### 2. devolverStock()
**Propósito:** Devolver stock cuando se anula una venta

```php
public function devolverStock(string $numeroVenta): array
// Retorna: ['success' => bool, 'cantidad_devuelta' => int, 'movimientos' => int, 'error' => string|null]
```

**Flujo:**
```
1. Obtener movimientos SALIDA_VENTA de la venta
2. Para cada movimiento:
   a. Restaurar cantidad en stock_productos
   b. Registrar movimiento ENTRADA_AJUSTE inverso
3. Retornar resultado
```

**Ejemplo de Reversión:**
```
SALIDA_VENTA:  cantidad = -10  (consumió 10)
ENTRADA_AJUSTE: cantidad = +10  (devuelve 10)

stock_productos:
  ANTES: cantidad = 90
  DESPUÉS: cantidad = 100
```

---

### 3. validarDisponible()
**Propósito:** Validar si hay stock disponible

```php
public function validarDisponible(array $detalles): array
// Retorna: ['valido' => bool, 'detalles' => array de errores]
```

**Uso:**
```php
$validacion = $ventaDistribucionService->validarDisponible($detalles);

if (!$validacion['valido']) {
    throw StockInsuficientException::create($validacion['detalles']);
}
```

---

### 4. obtenerDisponibilidad()
**Propósito:** Obtener stock disponible actual

```php
public function obtenerDisponibilidad(array $productoIds): array
// Retorna: [['producto_id' => 5, 'disponible' => 100], ...]
```

---

## 🔄 Integración con VentaService

### Cambios en VentaService::crear()

**ANTES:**
```php
$this->stockService->procesarSalidaVenta(
    $detallesParaStock,
    $venta->numero,
    $dto->almacen_id,
    permitirStockNegativo: $esCREDITO
);
```

**DESPUÉS:**
```php
$movimientosStock = $this->ventaDistribucionService->consumirStock(
    $detallesParaStock,
    $venta->numero,
    permitirStockNegativo: $esCREDITO
);
```

### Validación de Stock

**ANTES:**
```php
$validacionStock = $this->stockService->validarDisponible(
    $detallesParaStock,
    $dto->almacen_id
);

if (!$validacionStock->valido) { ... }
```

**DESPUÉS:**
```php
$validacionStock = $this->ventaDistribucionService->validarDisponible(
    $detallesParaStock
);

if (!$validacionStock['valido']) { ... }
```

---

## 📊 Características Clave

### 1. Almacén Automático
```php
$almacenId = auth()->user()?->empresa?->almacen_id ?? 1;
```
- ✅ Usa siempre `empresa.almacen_id` del usuario autenticado
- ✅ Fallback a 1 si no hay empresa
- ✅ Consistente con `ReservaDistribucionService`

### 2. FIFO por Vencimiento
```php
->orderBy('fecha_vencimiento', 'asc')  // Vence primero
->orderBy('id', 'asc')                  // Creado primero
```
- ✅ Vende primero lo que vence pronto
- ✅ Dentro de mismo vencimiento, FIFO por ID

### 3. Stock Negativo para CREDITO
```php
if ($permitirStockNegativo && $stockTotal < $cantidad) {
    Log::info('ℹ️ Stock negativo permitido (CREDITO)');
}
```
- ✅ CREDITO: Promesas de pago, permite stock negativo
- ✅ VENTA: Requiere stock disponible

### 4. Cantidad Anterior/Posterior
```php
$cantidadAnterior = $stock->cantidad;
// ... actualizar ...
$stock->refresh();
$cantidadPosterior = $stock->cantidad;

MovimientoInventario::create([
    'cantidad_anterior' => $cantidadAnterior,
    'cantidad_posterior' => $cantidadPosterior,
]);
```
- ✅ Registra ANTES y DESPUÉS en cada movimiento
- ✅ Completa auditoría del cambio

### 5. Observación en JSON
```php
'observacion' => json_encode([
    'evento' => 'Consumo de stock para venta',
    'venta_numero' => $numeroVenta,
    'producto_id' => $productoId,
    'lote' => $stock->lote,
    'cantidad_anterior' => $cantidadAnterior,
    'cantidad_posterior' => $cantidadPosterior,
])
```
- ✅ Registra detalles completos en JSON
- ✅ Facilita análisis y auditoría

---

## 🔍 Ejemplo Completo

### Escenario: Venta con 2 Productos

**Stock Inicial:**
```
Producto 5:
  ├─ Lote A (vencimiento: 2026-02-20): 50 disponibles
  └─ Lote B (vencimiento: 2026-03-15): 100 disponibles

Producto 10:
  └─ Lote C (vencimiento: 2026-02-25): 30 disponibles
```

**Venta:**
```php
$detalles = [
    ['producto_id' => 5, 'cantidad' => 80],
    ['producto_id' => 10, 'cantidad' => 20],
];

$ventaDistribucionService->consumirStock(
    $detalles,
    'VEN20260211-0001',
    permitirStockNegativo: false
);
```

**Flujo FIFO:**
1. Producto 5, Cantidad 80:
   - Toma 50 del Lote A (vencimiento 2026-02-20)
   - Toma 30 del Lote B (vencimiento 2026-03-15)
   - RESULTADO: Lote A = 0, Lote B = 70

2. Producto 10, Cantidad 20:
   - Toma 20 del Lote C
   - RESULTADO: Lote C = 10

**Movimientos Registrados:**
```
1. Producto 5, Lote A:
   cantidad_anterior: 50
   cantidad_posterior: 0
   observacion: {...}

2. Producto 5, Lote B:
   cantidad_anterior: 100
   cantidad_posterior: 70
   observacion: {...}

3. Producto 10, Lote C:
   cantidad_anterior: 30
   cantidad_posterior: 10
   observacion: {...}
```

---

## 🧪 Testing Recomendado

```php
public function test_consumir_stock_fifo()
{
    // Crear stocks con diferentes vencimientos
    $stock1 = StockProducto::create([
        'producto_id' => 5,
        'almacen_id' => 1,
        'cantidad' => 50,
        'cantidad_disponible' => 50,
        'fecha_vencimiento' => now()->addDays(5),  // Vence primero
    ]);

    $stock2 = StockProducto::create([
        'producto_id' => 5,
        'almacen_id' => 1,
        'cantidad' => 100,
        'cantidad_disponible' => 100,
        'fecha_vencimiento' => now()->addDays(30),  // Vence después
    ]);

    // Consumir 80 unidades
    $movimientos = $ventaDistribucionService->consumirStock(
        [['producto_id' => 5, 'cantidad' => 80]],
        'VEN-TEST-001'
    );

    // Verificar FIFO: debe consumir 50 de stock1 + 30 de stock2
    $this->assertEquals(2, count($movimientos));
    $this->assertEquals(50, $movimientos[0]->cantidad * -1);
    $this->assertEquals(30, $movimientos[1]->cantidad * -1);
}
```

---

## 🚀 Build Status

- ✅ `php -l` VentaDistribucionService.php - Sin errores
- ✅ `php -l` VentaService.php - Sin errores
- ✅ `npm run build` - 22.08s (exitoso)

---

## 📝 Resumen de Cambios

| Componente | ANTES | DESPUÉS |
|-----------|-------|---------|
| **Consumo Stock** | `StockService::procesarSalidaVenta()` | `VentaDistribucionService::consumirStock()` |
| **Validación** | `StockService::validarDisponible()` | `VentaDistribucionService::validarDisponible()` |
| **Almacén** | `$dto->almacen_id` | `auth()->user()->empresa->almacen_id` |
| **Centralización** | Distribuido | Centralizado (mismo patrón que reservas) |
| **Devolución** | `Venta::revertirMovimientosStock()` | `VentaDistribucionService::devolverStock()` |

---

## 🎯 Próximos Pasos

1. ✅ Crear VentaDistribucionService
2. ✅ Integrar en VentaService
3. ⏳ Hacer build completo
4. ⏳ Testing de flujo completo (crear → consumir → anular → devolver)
5. ⏳ Migración de datos históricos (opcional)

---

**Última actualización:** 2026-02-11
**Versión:** 1.0 (Implementación Inicial)
