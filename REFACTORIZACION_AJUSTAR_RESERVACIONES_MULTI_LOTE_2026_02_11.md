# ✅ Refactorización: ajustarReservacionesAlActualizarDetalles() - Soporte Multi-Lote (2026-02-11)

## 🎯 Objetivo

Refactorizar `ajustarReservacionesAlActualizarDetalles()` en `ApiProformaController` para manejar **correctamente múltiples lotes** cuando se actualizan detalles de proforma, respetando:
- **FIFO (First-In-First-Out)** al aumentar cantidades (tomar los lotes más antiguos)
- **LIFO (Last-In-First-Out)** al disminuir cantidades (liberar los lotes más recientes)

---

## 🐛 Problema Identificado

### El Bug Original

El código anterior **procesaba reservas individualmente por lote**, lo que causaba que:

1. **Si un producto tenía 2 lotes reservados** (Lote A: 30, Lote B: 20 = 50 total)
2. **Y se actualizaba a 60** (aumento de 10)
3. **Flujo incorrecto:**
   ```
   Loop 1 - Procesa Lote A (30):
   - Esperado: 60
   - Tipo: AUMENTO
   - ampliarReserva(30→60) ✓

   Loop 2 - Procesa Lote B (20):
   - Esperado: 0 ← (eliminado del mapa en Loop 1) ❌
   - Tipo: PRODUCTO REMOVIDO
   - LIBERA completamente la reserva de Lote B ❌

   RESULTADO FINAL:
   - Lote A: 60 ✓
   - Lote B: 0 ❌ (debería tener parte del aumento)
   ```

### Causa Raíz

Línea 3177 (código antiguo):
```php
unset($detallesMap[$producto_id]);  // ❌ Elimina DESPUÉS de procesar PRIMERA reserva
```

Cuando iteraba sobre la segunda reserva del mismo producto, el mapa estaba vacío → asumía que el producto fue removido.

---

## ✅ Solución Implementada

### Cambio Fundamental: Agrupar por Producto, No por Lote

**ANTES:**
```php
foreach ($reservasActuales as $reserva) {  // ← Itera por CADA lote
    // Compara cantidad individual del lote
}
```

**DESPUÉS:**
```php
$reservasPorProducto = $proforma->reservasActivas()
    ->with('stockProducto.producto')
    ->get()
    ->groupBy(fn($r) => $r->stockProducto->producto_id);

foreach ($reservasPorProducto as $producto_id => $reservasDelProducto) {
    // Compara TOTAL de todas las reservas del producto
    $cantidadTotalReservada = $reservasDelProducto->sum('cantidad_reservada');
    $cantidadEsperada = $detallesMap[$producto_id];
    // Procesa ALL lotes de una sola vez
}
```

---

## 📋 Nuevas Lógicas Implementadas

### 1️⃣ PRODUCTO REMOVIDO (cantidadEsperada = 0)

Libera **TODOS los lotes** del producto:

```php
foreach ($reservasDelProducto as $reserva) {
    $this->liberarReservaConMovimiento(
        $reserva,
        'Detalle removido de proforma',
        $proforma->numero
    );
}
```

**Resultado:**
- ✅ Si tenías 30 + 20 en 2 lotes → AMBOS se liberan
- ✅ Total disponible: +50
- ✅ Total reservado: 0

---

### 2️⃣ REDUCCIÓN (cantidadEsperada < cantidadTotalReservada)

Libera desde los **lotes más recientes (LIFO)**:

```php
$cantidadALiberar = $cantidadTotalReservada - $cantidadEsperada;

foreach ($reservasDelProducto->sortByDesc('id') as $reserva) {  // ← LIFO (DESC)
    if ($cantidadALiberar <= 0) break;

    if ($cantidadReservada <= $cantidadALiberar) {
        // Liberar completamente
        $this->liberarReservaConMovimiento(...);
        $cantidadALiberar -= $cantidadReservada;
    } else {
        // Liberar parcialmente
        $this->liberarExcesoReserva(...);
        $cantidadALiberar = 0;
    }
}
```

**Ejemplo:** Reducir de 50 a 35 (liberar 15)
```
Lotes antes:
├─ Lote A (más antiguo): 30 reservados
├─ Lote B (más reciente): 20 reservados
└─ Total: 50

LIFO (libera Lote B primero):
1. Libera Lote B completamente: 20 unidades
2. Libera parcialmente Lote A: 5 más (para total de 15)

Resultado:
├─ Lote A: 25 reservados (30-5)
├─ Lote B: 0 reservados (liberado completamente)
└─ Total: 25 reservados ✓
```

---

### 3️⃣ AUMENTO (cantidadEsperada > cantidadTotalReservada)

Usa **ReservaDistribucionService para FIFO**:

```php
$diferencia = $cantidadEsperada - $cantidadTotalReservada;

$resultado = $reservaService->distribuirReserva(
    $proforma,
    $producto_id,
    $diferencia,  // Solo agregar la diferencia
    3  // dias_vencimiento
);
```

**Ejemplo:** Aumentar de 50 a 60 (agregar 10 más)
```
Stock disponible por lote (FIFO):
├─ Lote C (más antiguo): 40 disponibles
├─ Lote D (siguiente): 30 disponibles
└─ Total: 70 disponibles

ReservaDistribucionService respeta FIFO:
1. Toma 10 del Lote C (el más antiguo)
2. Crea ReservaProforma para Lote C: 10 unidades

Reservas resultantes:
├─ Lote A: 30 (originales)
├─ Lote B: 20 (originales)
├─ Lote C: 10 (nueva, FIFO)
└─ Total: 60 ✓
```

---

### 4️⃣ PRODUCTOS AGREGADOS (nuevos en detalles)

También usa **ReservaDistribucionService para FIFO**:

```php
foreach ($detallesMap as $producto_id => $cantidad) {
    if ($cantidad > 0) {
        $resultado = $reservaService->distribuirReserva(
            $proforma,
            $producto_id,
            $cantidad,
            3  // dias_vencimiento
        );
    }
}
```

**Resultado:**
- ✅ Distribuye automáticamente entre lotes disponibles
- ✅ Respeta FIFO (lotes más antiguos primero)
- ✅ Registra múltiples ReservaProforma si es necesario
- ✅ Movimientos de inventario registrados automáticamente

---

## 📊 Tabla Comparativa: ANTES vs DESPUÉS

| Escenario | ANTES | DESPUÉS |
|-----------|-------|---------|
| **Producto con 2 lotes + Aumento** | ❌ Libera lote 2 incorrectamente | ✅ Aumenta correctamente con FIFO |
| **Producto con 3 lotes + Reducción** | ❌ Solo reduce 1 lote | ✅ Libera desde más recientes (LIFO) |
| **Múltiples productos** | ⚠️ Puede cruzar lógicas | ✅ Procesa cada producto completamente |
| **Movimientos registrados** | ⚠️ Incompletos/incorrectos | ✅ Completos y precisos |
| **Respeta FIFO** | ❌ No | ✅ Sí (ReservaDistribucionService) |
| **Respeta LIFO al liberar** | ❌ No | ✅ Sí (sortByDesc('id')) |

---

## 🔧 Cambios Técnicos Realizados

### Archivo: `app/Http/Controllers/Api/ApiProformaController.php`

**Líneas:** 3079-3301 (método `ajustarReservacionesAlActualizarDetalles()`)

**Cambios principales:**

1. **Agrupar reservas por producto** (línea 3104-3105):
   ```php
   $reservasPorProducto = $proforma->reservasActivas()
       ->with('stockProducto.producto')
       ->get()
       ->groupBy(fn($r) => $r->stockProducto->producto_id);
   ```

2. **Instanciar ReservaDistribucionService** (línea 3126):
   ```php
   $reservaService = new ReservaDistribucionService();
   ```

3. **Procesar por producto (no por lote)** (línea 3128):
   ```php
   foreach ($reservasPorProducto as $producto_id => $reservasDelProducto) {
       // Calcula TOTAL del producto
       $cantidadTotalReservada = $reservasDelProducto->sum('cantidad_reservada');
   }
   ```

4. **LIFO para reducciones** (línea 3189):
   ```php
   foreach ($reservasDelProducto->sortByDesc('id') as $reserva) {
   ```

5. **FIFO para aumentos** (línea 3227):
   ```php
   $resultado = $reservaService->distribuirReserva(
       $proforma,
       $producto_id,
       $diferencia
   );
   ```

---

## 📝 Logging Completo

Se añadió logging detallado en cada paso:

```
🔄 Iniciando ajuste de reservaciones (MULTI-LOTE)
📊 Mapa de detalles esperados
📋 Procesando producto X
   - cantidad_reservada_actual: 50
   - cantidad_esperada: 60
   - cantidad_lotes: 2

📈 Cantidad de producto aumentó
   - cantidad_a_reservar: 10
✅ Nuevas reservas creadas con FIFO
   - cantidad_lotes: 1

✅ Ajuste de reservaciones completado (MULTI-LOTE)
```

---

## ✅ Validación

### PHP Syntax
```bash
php -l ApiProformaController.php
✅ No syntax errors detected
```

### Frontend Build
```bash
npm run build
✅ built in 34.83s
```

---

## 🧪 Casos de Prueba

### Caso 1: Aumentar Cantidad (20 → 35) en 2 Lotes

**Inicial:**
- Lote A: 20 reservados
- Lote B: 0 reservados (puede ser nuevo)
- Total: 20 reservados

**Acción:** Actualizar a 35

**Esperado:**
- Lote A: 20 (sin cambio)
- Lote B: 15 (nueva reserva con FIFO)
- Total: 35 ✓
- Movimientos: 2 (uno por cada lote)

**Verificar:**
- ✅ ReservaProforma cuenta correcta
- ✅ stock_productos.cantidad_reservada = 35
- ✅ stock_productos.cantidad_disponible = original - 15
- ✅ movimientos_inventario registrados

---

### Caso 2: Reducir Cantidad (50 → 25) desde 2 Lotes

**Inicial:**
- Lote A: 30 reservados
- Lote B: 20 reservados
- Total: 50 reservados

**Acción:** Actualizar a 25

**Esperado (LIFO):**
- Lote A: 25 reservados (reducido de 30)
- Lote B: 0 reservados (liberado completamente)
- Total: 25 ✓
- Liberado: 25 unidades (20 + 5)

**Verificar:**
- ✅ Lote B completamente liberado
- ✅ Lote A reducido en 5
- ✅ stock_productos.cantidad_disponible aumentó en 25
- ✅ movimientos_inventario: 2 registros de liberación

---

### Caso 3: Eliminar Producto (50 → 0)

**Inicial:**
- Lote A: 30 reservados
- Lote B: 20 reservados
- Total: 50 reservados

**Acción:** Remover producto de proforma

**Esperado:**
- Lote A: 0 reservados (liberado)
- Lote B: 0 reservados (liberado)
- Total: 0 ✓
- Liberado: 50 unidades

**Verificar:**
- ✅ Ambos lotes liberados
- ✅ ReservaProforma estado = LIBERADA (ambas)
- ✅ stock_productos.cantidad_disponible aumentó en 50
- ✅ movimientos_inventario: 2 registros de liberación

---

## 🎯 Beneficios

| Beneficio | Descripción |
|-----------|------------|
| **Correctitud Funcional** | ✅ Maneja correctamente múltiples lotes |
| **FIFO Automático** | ✅ Reservaciones respetan FIFO (lotes más antiguos) |
| **LIFO en Liberación** | ✅ Liberaciones respetan LIFO (lotes más recientes primero) |
| **Auditoría Completa** | ✅ Todos los cambios registrados en movimientos_inventario |
| **Escalabilidad** | ✅ Funciona con N lotes (2, 3, 5, etc.) |
| **Consistencia** | ✅ stock_productos siempre sincronizado con reservas |
| **Trazabilidad** | ✅ Logging detallado de cada operación |

---

## 📌 Métodos No Utilizados (Legacy)

Los siguientes métodos privados ahora no se utilizan en `ajustarReservacionesAlActualizarDetalles()` pero se mantienen para futura expansión:

- `ampliarReserva()` (línea 3479)
- `crearNuevaReservaParaProducto()` (línea 3629)

Se pueden eliminar si no se usan en otros contextos del controlador.

---

## 🔐 Error Handling

El método mantiene `try-catch` para capturar errores sin bloquear la actualización de detalles:

```php
if (!$resultado['success']) {
    Log::warning('⚠️ No se pudo reservar la cantidad completa', [
        'producto_id' => $producto_id,
        'cantidad_solicitada' => $diferencia,
        'error' => $resultado['error'],
    ]);
    // No lanza excepción
}
```

---

## 📚 Documentación Relacionada

- `ACTUALIZACION_DETALLES_PROFORMA_REGISTRO_MOVIMIENTOS_2026_02_11.md` - Cambios anteriores en movimientos
- `ReservaDistribucionService.php` - Servicio de distribución FIFO
- `app/Http/Controllers/Api/ApiProformaController.php` - Controlador principal

---

## ✅ Status

**Última actualización:** 2026-02-11
**Versión:** 2.0 (Refactorización Multi-Lote)
**Build Status:** ✅ Exitoso (34.83s)
**PHP Syntax:** ✅ Sin errores
**Test Status:** ⏳ Pendiente de prueba en sandbox
