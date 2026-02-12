# 📊 Análisis del Flujo POST /ventas - Consumo de Stock

## 🎯 Objetivo
Entender cómo funciona actualmente el consumo de stock en ventas para diseñar un servicio centralizado similar a `ReservaDistribucionService`.

---

## 🔄 Flujo Actual Completo

### PASO 1: VentaController::store()
**Archivo:** `app/Http/Controllers/VentaController.php` (línea 413)

```php
public function store(StoreVentaRequest $request): JsonResponse | RedirectResponse
{
    // 1. Crear DTO desde Request
    $dto = CrearVentaDTO::fromRequest($request);

    // 2. Obtener caja abierta
    $cajaId = $this->cajaAbiertaService->obtenerCajaIdAbierta();

    // 3. Delegar al servicio
    $ventaDTO = $this->ventaService->crear($dto, $cajaId);
}
```

**Responsabilidades:**
- ✅ Validación (Form Request)
- ✅ Obtener caja abierta
- ✅ Delegar lógica al servicio

---

### PASO 2: VentaService::crear()
**Archivo:** `app/Services/Venta/VentaService.php` (línea 58)

#### 2.1 Validar Stock ANTES de la Transacción (Línea 82-106)

```php
// Expandir combos ANTES de validar
$detallesParaStock = $this->stockService->expandirCombos($dto->detalles);

// Validar stock (EXCEPTO para CREDITO)
$esCREDITO = strtoupper($dto->politica_pago ?? '') === 'CREDITO';

if (!$esCREDITO) {
    $validacionStock = $this->stockService->validarDisponible(
        $detallesParaStock,
        $dto->almacen_id
    );

    if (!$validacionStock->valido) {
        throw StockInsuficientException::create($validacionStock->detalles);
    }
}
```

**Características:**
- ✅ Expande combos para validar componentes individuales
- ✅ SALTA validación para CREDITO (son promesas de pago, no ventas inmediatas)
- ✅ Valida TOTAL disponible en almacén (todos los lotes)
- ✅ Lanza excepción si hay insuficiencia

---

#### 2.2 Crear Dentro de Transacción (Línea 110)

```php
$venta = $this->transaction(function () use ($dto, $cajaId, $esCREDITO, $detallesParaStock) {

    // 2.2.1 Determinar estado documento
    if ($dto->estado_documento_id) {
        $estadoDocumentoId = $dto->estado_documento_id;  // APROBADO (si viene de proforma)
    } else {
        $estadoDocumentoId = EstadoDocumento::obtenerEstadoInicial();  // PENDIENTE (por defecto)
    }

    // 2.2.2 Determinar estado logístico
    $estadoLogisticoId = $dto->estado_logistico_id ?? SIN_ENTREGA;  // SIN_ENTREGA por defecto

    // 2.2.3 Estado pago SIEMPRE PENDIENTE para ventas nuevas
    $estadoPago = 'PENDIENTE';  // El pago se registra después en movimientos_caja

    // 2.2.4 Crear Venta (línea 162)
    $venta = Venta::create([
        'numero'              => '0',  // Temp, se asignará con ID después
        'cliente_id'          => $dto->cliente_id,
        'usuario_id'          => $dto->usuario_id ?? Auth::id(),
        'fecha'               => $dto->fecha,
        'subtotal'            => $dto->subtotal,
        'descuento'           => $dto->descuento,
        'impuesto'            => $dto->impuesto,
        'total'               => $dto->total,
        'estado_documento_id' => $estadoDocumentoId,
        'estado_pago'         => $estadoPago,
        'monto_pagado'        => $dto->monto_pagado_inicial ?? 0,
        'monto_pendiente'     => max(0, ($dto->subtotal - $dto->descuento) - $dto->monto_pagado_inicial),
        // ... más campos
        'caja_id'             => $cajaId,  // ✅ Registrar en qué caja
    ]);

    // 2.2.5 Asignar número = VEN + FECHA + ID
    $numeroVenta = 'VEN' . now()->format('Ymd') . '-' . str_pad($venta->id, 4, '0', STR_PAD_LEFT);
    $venta->update(['numero' => $numeroVenta]);

    // 2.2.6 Crear DetalleVenta (línea 212)
    foreach ($dto->detalles as $detalle) {
        DetalleVenta::create([
            'venta_id'       => $venta->id,
            'producto_id'    => $detalle['producto_id'],
            'cantidad'       => $detalle['cantidad'],
            'precio_unitario' => $detalle['precio_unitario'],
            'subtotal'       => ($detalle['cantidad'] * $detalle['precio_unitario']) - $detalle['descuento'],
            // ... más campos
        ]);
    }

    // 2.2.7 CONSUMIR STOCK (línea 268)
    $this->stockService->procesarSalidaVenta(
        $detallesParaStock,
        $venta->numero,
        $dto->almacen_id,
        permitirStockNegativo: $esCREDITO  // ✅ CREDITO permite stock negativo
    );

    // 2.2.8 Emitir evento VentaCreada
    event(new VentaCreada($venta));

    return $venta;
});
```

---

### PASO 3: StockService::procesarSalidaVenta()
**Archivo:** `app/Services/Stock/StockService.php` (línea 160)

#### 3.1 Obtener Stocks con Lock FIFO (Línea 188-194)

```php
$stocks = StockProducto::where('producto_id', $productoId)
    ->where('almacen_id', $almacenId)
    ->where('cantidad_disponible', '>', 0)
    ->orderBy('fecha_vencimiento', 'asc')  // ← FIFO: primero vencimiento cercano
    ->orderBy('id', 'asc')                  // ← Luego por ID (creación)
    ->lockForUpdate()                       // ← Lock pesimista (evita race conditions)
    ->get();
```

**FIFO Algoritmo:**
1. Ordena por `fecha_vencimiento ASC` (vencimiento más próximo primero)
2. Luego por `id ASC` (creados primero, por defecto)
3. Lock pesimista para evitar race conditions en concurrencia

---

#### 3.2 Validar Stock Total (Línea 196-212)

```php
$stockTotal = $stocks->sum('cantidad_disponible');

// SOLO valida si NO es CREDITO
if (!$permitirStockNegativo && $stockTotal < $cantidadNecesaria) {
    throw new Exception("Stock insuficiente...");
}

// Si es CREDITO, solo LOG (permite stock negativo)
if ($permitirStockNegativo) {
    Log::info('⚠️ Procesando salida con stock negativo permitido (CREDITO)');
}
```

**Comportamiento:**
- ✅ VENTAS NORMALES: Valida suma total de TODOS los lotes
- ✅ CREDITO: NO valida, permite que cantidad_disponible sea negativa

---

#### 3.3 Consumir Según FIFO (Línea 217-245)

```php
$cantidadRestante = $cantidadNecesaria;

foreach ($stocks as $stock) {
    if ($cantidadRestante <= 0) break;

    // Tomar lo que necesite o lo que hay disponible (lo menor)
    $cantidadTomar = min($cantidadRestante, $stock->cantidad_disponible);

    // ACTUALIZAR stock_productos
    $stock->decrement('cantidad_disponible', $cantidadTomar);
    $stock->decrement('cantidad', $cantidadTomar);

    // REGISTRAR movimiento en movimientos_inventario
    MovimientoInventario::create([
        'stock_producto_id'  => $stock->id,
        'cantidad'           => -$cantidadTomar,            // ← NEGATIVO (salida)
        'cantidad_anterior'  => $stock->cantidad + $cantidadTomar,  // ← ANTES
        'cantidad_posterior' => $stock->cantidad,           // ← DESPUÉS
        'tipo'               => 'SALIDA_VENTA',
        'numero_documento'   => $referencia,                // ← VEN20260211-0001
        'observacion'        => "Venta: ...",
        'user_id'            => Auth::id(),
        'fecha'              => now(),
    ]);

    $cantidadRestante -= $cantidadTomar;
}
```

**Proceso:**
1. Para cada lote (stock_producto):
   - Calcula cuánto tomar: MIN(restante, disponible)
   - Decrementa cantidad_disponible y cantidad
   - Registra movimiento con valores ANTES/DESPUÉS
   - Continúa con siguiente lote si queda cantidad

---

## 📋 Comparativa: Reservas vs Ventas

| Aspecto | Reservas | Ventas |
|---------|----------|--------|
| **Servicio** | `ReservaDistribucionService` | `StockService.procesarSalidaVenta()` |
| **Responsabilidad** | Bloquear stock temporalmente | Consumir stock definitivamente |
| **Duración** | 3-7 días (vencimiento) | Inmediato (permanente) |
| **Transacción** | BD + Movimiento | BD + Movimiento |
| **FIFO** | `orderBy('id', 'asc')` | `orderBy('fecha_vencimiento', 'asc')`, `orderBy('id', 'asc')` |
| **Stock Negativo** | NO permitido | SÍ para CREDITO |
| **Almacén** | Desde `empresa.almacen_id` | Desde `$dto->almacen_id` |
| **Tabla Principal** | `reservas_proformas` | `detalles_venta` |
| **Movimiento Tipo** | `RESERVA_PROFORMA` | `SALIDA_VENTA` |

---

## 🎯 Oportunidad: Crear VentaDistribucionService

### Beneficios de Centralizar

```
ANTES (Actual):
VentaService → StockService::procesarSalidaVenta()
               ├─ FIFO logic distribuido
               ├─ Validación mezclada
               └─ Difícil de reutilizar

DESPUÉS (Propuesto):
VentaService → VentaDistribucionService::consumirStock()
               ├─ FIFO centralizado
               ├─ Validaciones claras
               ├─ Reutilizable en múltiples contextos
               └─ Testeable
```

### Estructura Propuesta

```php
class VentaDistribucionService
{
    /**
     * Consumir stock para una venta (FIFO con respecto a vencimiento)
     *
     * @param array $detalles Productos a consumir
     * @param string $numeroVenta Referencia para movimiento
     * @param int $almacenId Almacén de origen
     * @param bool $permitirStockNegativo Para CREDITO
     *
     * @return array Movimientos creados
     */
    public function consumirStock(
        array $detalles,
        string $numeroVenta,
        int $almacenId = 1,
        bool $permitirStockNegativo = false
    ): array
    {
        return DB::transaction(function () use ($detalles, $numeroVenta, $almacenId, $permitirStockNegativo) {
            // Mismo FIFO que procesarSalidaVenta() pero centralizado
            // + logging
            // + auditoría
        });
    }

    /**
     * Validar si hay stock suficiente
     */
    public function validarDisponible(
        array $detalles,
        int $almacenId
    ): StockValidationResult { }

    /**
     * Expandir combos a componentes individuales
     */
    public function expandirCombos(array $detalles): array { }
}
```

---

## 🔍 Preguntas para Clarificar el Diseño

1. **¿Aplicar FIFO por vencimiento para ventas también?**
   - Actual: SÍ (fecha_vencimiento ASC)
   - Propuesta: Mantener igual

2. **¿Permitir consumir desde múltiples almacenes en una sola venta?**
   - Actual: NO (solo 1 almacén por venta)
   - Propuesta: Mantener igual

3. **¿Registrar cantidad_anterior/posterior en movimientos?**
   - Actual: SÍ (línea 234-235)
   - Propuesta: Mantener igual

4. **¿Validar al crear o permitir excepciones en tiempo de ejecución?**
   - Actual: Valida ANTES (pre-validación)
   - Propuesta: Mantener igual

---

## 📝 Resumen

**Flujo Actual (POST /ventas):**

```
1. Controller: Obtener caja
2. VentaService::crear():
   a. Expandir combos
   b. Validar stock (excepto CREDITO)
   c. Transacción:
      - Crear Venta
      - Crear DetalleVenta
      - Consumir stock (StockService)
      - Emitir evento
3. StockService::procesarSalidaVenta():
   a. FIFO por vencimiento+id
   b. Decrementar cantidad_disponible
   c. Registrar movimiento
```

**Próxima Fase:**
- Crear `VentaDistribucionService` centralizado
- Mover lógica FIFO de `StockService` → `VentaDistribucionService`
- Mantener interfaz compatible
- Facilitar testing y reutilización

---

**Última actualización:** 2026-02-11
**Versión:** 1.0 (Análisis Inicial)
