# 📦 Flujo Completo: Registro de Stock en POST /ventas

## ✅ Sistema Ya Implementado - Centralizado con VentaDistribucionService

El endpoint `POST /ventas` (`VentaController@store`) **YA MANEJA COMPLETAMENTE** el registro de stock usando servicios centralizados. Aquí está el flujo:

---

## 🔄 Flujo Completo: POST /ventas (VentaController@store)

### 1️⃣ **VALIDACIÓN DE STOCK** (ANTES de crear la transacción)
```
POST /ventas con JSON:
{
  "cliente_id": 5,
  "detalles": [
    {"producto_id": 123, "cantidad": 10, "precio_unitario": 100},
    {"producto_id": 456, "cantidad": 5, "precio_unitario": 200}
  ],
  "politica_pago": "CONTRA_ENTREGA"  // ← Determina si permite stock negativo
}
         ↓
VentaController::store()
         ↓
VentaService::crear($dto, $cajaId)
         ↓
Línea 81: Expandir combos
  stockService->expandirCombos($dto->detalles)
         ↓
Línea 91-102: VALIDAR STOCK DISPONIBLE
  ventaDistribucionService->validarDisponible($detallesParaStock)

  // ✅ Si politica_pago !== 'CREDITO':
  //    - Verifica stock total >= cantidad solicitada
  //    - Retorna error si insuficiente
  //
  // ✅ Si politica_pago = 'CREDITO':
  //    - SALTEA validación (permite stock negativo)
         ↓
Si validación FALLA:
  ❌ Lanza StockInsuficientException
  ❌ NO crea venta, NO modifica stock
  ❌ Retorna 400 con detalles del error
```

### 2️⃣ **CREACIÓN DE VENTA EN TRANSACCIÓN**

```
DB::transaction() INICIADA
         ↓
Línea 163: Crear registro Venta en tabla ventas
  - numero: VEN20260211-0001
  - cliente_id, total, subtotal, descuento, impuesto
  - almacen_id: empresa.almacen_id (del usuario autenticado)
  - estado_documento_id: PENDIENTE
  - caja_id: $cajaId (de CajaAbiertaService)
         ↓
Línea 214-256: Crear detalles en tabla detalles_ventas (1 por producto)
  - venta_id: (recién creada)
  - producto_id, cantidad, precio_unitario, subtotal
  - tipo_precio_id: (si fue seleccionado en UI)
  - combo_items_seleccionados: JSON con items opcionales del combo
```

### 3️⃣ **CONSUMO DE STOCK - FIFO (El paso CRÍTICO)**

```
Línea 271-282: Procesar salida de stock
  ventaDistribucionService->consumirStock(
    $detallesParaStock,
    $venta->numero = "VEN20260211-0001",
    permitirStockNegativo = ($politica_pago === 'CREDITO')
  )
         ↓
PARA CADA PRODUCTO:
  1. Obtener stocks con FIFO (múltiples lotes):
     SELECT * FROM stock_productos
     WHERE producto_id = 123
       AND almacen_id = 1
       AND cantidad_disponible > 0
     ORDER BY fecha_vencimiento ASC,  // ← Vence primero
              id ASC                   // ← Creado primero
     FOR UPDATE (lock pesimista)

  2. Validar stock total:
     - suma cantidad_disponible de todos los lotes
     - si < cantidad_requerida:
       • SI permitirStockNegativo=false: ERROR
       • SI permitirStockNegativo=true: Continúa (CREDITO)

  3. CONSUMIR cada lote en orden FIFO:
     FOR cada lote (stock_producto):
       cantidad_a_tomar = MIN(
         cantidad_requerida_restante,
         lote.cantidad_disponible
       )

       BEFORE UPDATE (guardar para auditoría):
       - cantidad_anterior = lote.cantidad
       - cantidad_disponible_anterior = lote.cantidad_disponible

       UPDATE stock_productos SET
         cantidad = cantidad - cantidad_a_tomar,
         cantidad_disponible = cantidad_disponible - cantidad_a_tomar
       WHERE id = lote.id

       AFTER UPDATE (guardar para auditoría):
       - cantidad_posterior = lote.cantidad (actualizado)
       - cantidad_disponible_posterior = lote.cantidad_disponible

       ✅ REGISTRAR MOVIMIENTO en movimientos_inventario:
          INSERT INTO movimientos_inventario (
            stock_producto_id = lote.id,
            cantidad = -cantidad_a_tomar,  // ← NEGATIVO (salida)
            cantidad_anterior,
            cantidad_posterior,
            tipo = 'SALIDA_VENTA',
            numero_documento = 'VEN20260211-0001',
            observacion = JSON {
              evento: 'Consumo de stock para venta',
              venta_numero,
              producto_id,
              lote: lote.lote,
              cantidad_anterior,
              cantidad_posterior,
              cantidad_disponible_anterior,
              cantidad_disponible_posterior
            },
            user_id = auth()->id(),
            fecha = now()
          )

       cantidad_requerida_restante -= cantidad_a_tomar

       IF cantidad_requerida_restante <= 0:
         BREAK (listo, consumió todo)
```

### 4️⃣ **EVENTOS Y AUDITORÍA**

```
Línea 300: Disparar evento VentaCreada
  event(new VentaCreada($venta))
         ↓
Listeners activos:
  - SendVentaCreatedNotification (notificaciones)
  - RegisterCajaMovementFromVentaListener (registra en caja)
  - OtrosListeners...
         ↓
DB::transaction() COMMIT
```

### 5️⃣ **RESPUESTA AL CLIENTE**

```
✅ SI TODO EXITOSO:
  HTTP 201 Created
  {
    "success": true,
    "data": {
      "id": 1234,
      "numero": "VEN20260211-0001",
      "cliente_id": 5,
      "total": 1500,
      "estado": "Pendiente",
      "detalles": [...]
    }
  }

❌ SI FALLA:
  HTTP 400/422 Bad Request
  {
    "success": false,
    "message": "Stock insuficiente",
    "errors": {
      "productos": [
        {
          "producto_id": 123,
          "producto_nombre": "Pepsi 2L",
          "cantidad_requerida": 10,
          "cantidad_disponible": 7
        }
      ]
    }
  }
```

---

## 📊 Tablas Afectadas

| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| **ventas** | INSERT | Crear registro de venta |
| **detalles_ventas** | INSERT | 1 fila por producto en venta |
| **stock_productos** | UPDATE | Decrementar cantidad y cantidad_disponible |
| **movimientos_inventario** | INSERT | 1 fila por lote consumido (SALIDA_VENTA) |
| **caja_movimientos** | INSERT | Registra entrada de dinero (listener) |

---

## 🎯 Características Principales

### ✅ FIFO Automático
- Ordena lotes por `fecha_vencimiento ASC` (vence primero)
- Luego por `id ASC` (creado primero)
- Consume vencimientos próximos primero

### ✅ Múltiples Lotes
- Si un producto tiene 5 lotes con:
  - Lote 1: 3 unidades
  - Lote 2: 5 unidades
  - Lote 3: 2 unidades
- Y se venden 8 unidades
- **CONSUME**: Lote 1 (3) + Lote 2 (5) = 8
- **RESULTADO**:
  - Lote 1: 0 unidades (agotado)
  - Lote 2: 0 unidades (agotado)
  - Lote 3: 2 unidades (sin cambios)

### ✅ Auditoría Completa
- Cada movimiento registra:
  - `cantidad_anterior` y `cantidad_posterior`
  - `cantidad_disponible_anterior` y `_posterior`
  - `numero_documento` (VEN20260211-0001)
  - `observacion` en JSON con detalles
  - `user_id` (quién ejecutó)
  - `fecha` (cuándo se ejecutó)

### ✅ Stock Negativo Controlado
- **CONTRA_ENTREGA, ANTICIPADO_100**: Stock negativo ❌ BLOQUEADO
- **CREDITO**: Stock negativo ✅ PERMITIDO (promesas de pago)

### ✅ Transacciones ACID
- Usa `DB::transaction()` para atomicidad
- Si algo falla en el medio: TODO SE REVIERTE
- No hay registros parciales

---

## 🔗 Servicios Involucrados

### VentaController::store()
- **Ubicación**: `app/Http/Controllers/VentaController.php:413`
- **Responsabilidad**: Punto de entrada, validación de request, manejo de errores

### VentaService::crear()
- **Ubicación**: `app/Services/Venta/VentaService.php:59`
- **Responsabilidad**: Orquestación de creación (validación, expandir combos, crear DB records, consumir stock)

### VentaDistribucionService::consumirStock()
- **Ubicación**: `app/Services/Venta/VentaDistribucionService.php:51`
- **Responsabilidad**: Consumo real de stock con FIFO, múltiples lotes, auditoría

### StockService::expandirCombos()
- **Ubicación**: `app/Services/Stock/StockService.php`
- **Responsabilidad**: Expande combos a sus componentes para validación y consumo

---

## 🧪 Ejemplo Práctico: Venta con Combo

```javascript
// FRONTEND - POST /ventas
{
  "cliente_id": 5,
  "detalles": [
    {
      "producto_id": 100,           // Combo "Six Pack"
      "cantidad": 2,
      "precio_unitario": 45,
      "combo_items_seleccionados": [
        {
          "producto_id": 101,       // Cerveza A (obligatorio)
          "incluido": true,
          "cantidad": 12,
          "cantidad_final": 24      // 2 combos × 12 = 24
        },
        {
          "producto_id": 102,       // Cerveza B (opcional, NO seleccionado)
          "incluido": false,
          "cantidad": 6
        }
      ]
    },
    {
      "producto_id": 200,           // Pepsi 2L normal
      "cantidad": 5,
      "precio_unitario": 15
    }
  ]
}
```

**PROCESAMIENTO BACKEND:**

```
1. EXPANDIR COMBOS:
   - Combo 100 → Cerveza A (24 unidades)
   - Cerveza A no está en detalles_originales, agregar

2. DETALLES PARA STOCK = [
   { producto_id: 101, cantidad: 24 },  ← Expandido del combo
   { producto_id: 200, cantidad: 5 }    ← Normal
]

3. VALIDAR:
   - Cerveza A: ¿Hay 24 disponibles? Sí
   - Pepsi: ¿Hay 5 disponibles? Sí
   ✅ STOCK VALIDADO

4. CONSUMIR (FIFO):
   - Cerveza A: Consume 24 del lote más antiguo
   - Pepsi: Consume 5 del lote más antiguo

5. REGISTRAR:
   - Movimiento SALIDA_VENTA: -24 Cerveza A
   - Movimiento SALIDA_VENTA: -5 Pepsi

6. GUARDAR DETALLE_VENTA:
   - combo_items_seleccionados: JSON con solo Cerveza A (incluido=true)
```

---

## 🚀 Cómo Usar desde el Frontend

```javascript
// Es automático - solo envía el POST /ventas con detalles correctos
const response = await fetch('/api/ventas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cliente_id: 5,
    detalles: productosTable,  // De ProductosTable.tsx
    politica_pago: 'CONTRA_ENTREGA',
    requiere_envio: false
  })
});

// Backend maneja TODO:
// ✅ Expandir combos
// ✅ Validar stock (FIFO)
// ✅ Decrementar stock (múltiples lotes)
// ✅ Registrar movimientos
// ✅ Registrar en caja
// ✅ Disparar eventos
```

---

## 📋 Resumen: TODO YA ESTÁ IMPLEMENTADO

| Aspecto | Status | Ubicación |
|--------|--------|-----------|
| **Validación de stock** | ✅ IMPLEMENTADO | VentaDistribucionService::validarDisponible |
| **Consumo FIFO** | ✅ IMPLEMENTADO | VentaDistribucionService::consumirStock |
| **Múltiples lotes** | ✅ IMPLEMENTADO | Loop foreach en consumirStock |
| **Auditoría completa** | ✅ IMPLEMENTADO | MovimientoInventario::create |
| **Stock negativo (CREDITO)** | ✅ IMPLEMENTADO | permitirStockNegativo flag |
| **Expansión combos** | ✅ IMPLEMENTADO | StockService::expandirCombos |
| **Registro caja** | ✅ IMPLEMENTADO | Listener RegisterCajaMovement |
| **Transacciones ACID** | ✅ IMPLEMENTADO | DB::transaction |

**✨ No hay nada que cambiar - Sistema completamente funcional y robusto.**

---

## 🔍 Para Verificar que Funciona

```bash
# 1. Ver logs de consumo
tail -f storage/logs/laravel.log | grep "consumirStock"

# 2. Consultar movimientos creados
SELECT * FROM movimientos_inventario
WHERE numero_documento LIKE 'VEN%'
ORDER BY created_at DESC LIMIT 10;

# 3. Verificar stock actualizado
SELECT id, producto_id, cantidad, cantidad_disponible, cantidad_reservada
FROM stock_productos
WHERE producto_id IN (SELECT DISTINCT producto_id FROM detalles_ventas)
ORDER BY updated_at DESC;
```

---

**Creado**: 2026-02-11
**Actualizado**: 2026-02-11
**Estado**: ✅ Completamente Funcional
