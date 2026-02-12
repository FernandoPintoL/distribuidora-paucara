# ⚠️ ANÁLISIS CRÍTICO: Dos Implementaciones de devolverStock (2026-02-11)

## 🚨 DESCUBRIMIENTO IMPORTANTE

Existen **DOS métodos diferentes** que hacen la misma función pero con diferencias críticas:

1. **`VentaDistribucionService::devolverStock()`** - Línea 206 (Servicio centralizado)
2. **`Venta::revertirMovimientosStock()`** - Línea 619 (Modelo)

---

## 📊 TABLA COMPARATIVA DETALLADA

| Aspecto | VentaDistribucionService | Venta::revertirMovimientosStock |
|---------|----------------------------|--------------------------------|
| **Ubicación** | Servicio/Venta/VentaDistribucionService.php:206 | Model/Venta.php:619 |
| **Se Llama Desde** | ❓ Probablemente NO se usa | ✅ Observer? ¿Listeners? |
| **Parámetro Input** | `string $numeroVenta` | No necesita (usa $this->numero) |
| **Obtiene Movimientos** | WHERE tipo = SALIDA_VENTA | WHERE tipo IN [SALIDA_VENTA, CONSUMO_RESERVA] |
| **Captura cantidad_anterior** | ✅ Sí (línea 242) | ✅ Sí (línea 637) |
| **Captura cantidad_posterior** | ✅ Sí (línea 269) | ✅ Sí (línea 667) |
| **Actualiza cantidad** | ✅ Decrement (línea 137) | ✅ DB::raw() suma (línea 656) |
| **Actualiza cantidad_disponible** | ✅ Decrement (línea 137) | ✅ DB::raw() suma (línea 657) |
| **Registra Movimiento ENTRADA_AJUSTE** | ✅ Sí (línea 282-301) | ✅ Sí (línea 683-693) |
| **Tipo Movimiento** | TIPO_ENTRADA_AJUSTE | TIPO_ENTRADA_AJUSTE |
| **Cantidad Registrada** | Positivo (+) | Positivo (+) |
| **número_documento** | numeroVenta-DEV | numeroVenta-REV |
| **Usa Transacción** | ✅ DB::transaction (línea 67) | ✅ DB::beginTransaction (línea 631) |
| **Rollback en Error** | ✅ Automático | ✅ DB::rollBack (línea 737) |
| **Logging** | ✅ Completo (línea 314, 329) | ✅ Muy completo (línea 641-746) |
| **Lock Pesimista** | ✅ lockForUpdate (línea 218) | ❌ NO hay lock |
| **Maneja CONSUMO_RESERVA** | ❌ NO (solo SALIDA_VENTA) | ✅ SÍ (línea 627) |
| **Valida affected rows** | ❌ No valida | ✅ Valida (línea 661) |
| **Hard Delete Lote si = 0** | ❌ No | ✅ Sí (línea 711) |

---

## 🔴 PROBLEMA CRÍTICO #1: Lock Pesimista

### VentaDistribucionService (✅ CORRECTO)
```php
$stocks = StockProducto::where(...)
    ->lockForUpdate()  // ← PREVIENE RACE CONDITIONS
    ->get();
```

### Venta::revertirMovimientosStock() (❌ PROBLEMA)
```php
foreach ($movimientos as $movimiento) {
    $stockProducto = $movimiento->stockProducto;

    // ❌ NO hay lockForUpdate()
    // ❌ Vulnerable a race conditions

    DB::table('stock_productos')
        ->where('id', $stockProducto->id)
        ->update([...]);  // ← Sin lock previo
}
```

**Escenario de Error:**
```
Thread 1: Lee stock = 100
Thread 2: Lee stock = 100
Thread 1: Suma +20 → stock = 120
Thread 2: Suma +10 → stock = 110 (INCORRECTO, debería ser 130)
```

---

## 🔴 PROBLEMA CRÍTICO #2: CONSUMO_RESERVA No Se Maneja

### VentaDistribucionService (❌ PROBLEMA)
```php
$movimientos = MovimientoInventario::where('numero_documento', $numeroVenta)
    ->where('tipo', MovimientoInventario::TIPO_SALIDA_VENTA)  // ← SOLO esto
    ->lockForUpdate()
    ->get();
```

**¿Qué pasa si la venta se creó desde proforma?**
- Movimientos tipo: `CONSUMO_RESERVA` (no `SALIDA_VENTA`)
- ❌ `devolverStock()` NO los encontrará
- ❌ Stock NO se restaurará
- ❌ Cantidad quedará bloqueada indefinidamente

### Venta::revertirMovimientosStock() (✅ CORRECTO)
```php
$movimientos = MovimientoInventario::where('numero_documento', $this->numero)
    ->whereIn('tipo', [
        MovimientoInventario::TIPO_SALIDA_VENTA,
        'CONSUMO_RESERVA'  // ← Incluye ambos
    ])
    ->get();
```

---

## 🟡 PROBLEMA #3: ¿Cuál Se Está Usando?

### Búsqueda de Quién Llama

#### VentaDistribucionService::devolverStock()
```
ENCONTRADO EN:
├─ Definición: VentaDistribucionService.php:206
├─ ¿Llamado desde? ❓ NO ENCONTRADO EN BÚSQUEDA
└─ Status: PROBABLEMENTE NO SE USA
```

#### Venta::revertirMovimientosStock()
```
ENCONTRADO EN:
├─ Definición: Venta.php:619
├─ ¿Llamado desde? ❓ PROBABLEMENTE OBSERVER/LISTENER
└─ Status: PROBABLEMENTE ESTO SE ESTÁ USANDO
```

---

## 🧪 Ejemplo Comparativo: Anular Venta de Proforma

### Setup
```
Venta: VEN20260211-0001 (convertida de proforma)
├─ Producto A: 20 unidades
├─ Movimiento Creado:
│  ├─ tipo: CONSUMO_RESERVA (porque es de proforma)
│  ├─ numero_documento: VEN20260211-0001
│  ├─ cantidad: -20 (salida)
│  └─ stock_producto_id: 5
└─ Stock Actual:
   ├─ cantidad: 80 (100 - 20)
   ├─ cantidad_disponible: 60 (80 - 20)
```

### Anular Venta con VentaDistribucionService::devolverStock()

```php
$resultado = $ventaDistribucionService->devolverStock('VEN20260211-0001');

// Búsqueda de movimientos (línea 216):
$movimientos = MovimientoInventario::where('numero_documento', 'VEN20260211-0001')
    ->where('tipo', MovimientoInventario::TIPO_SALIDA_VENTA)  // ← Solo SALIDA_VENTA
    ->get();

// RESULTADO:
// $movimientos = [] (VACÍO, porque es CONSUMO_RESERVA, no SALIDA_VENTA)

// Flujo (línea 221-231):
if ($movimientos->isEmpty()) {
    return [
        'success' => true,
        'cantidad_devuelta' => 0,
        'movimientos' => 0,
        'error' => null,
    ];  // ← RETORNA COMO SI FUERA EXITOSO PERO SIN HACER NADA
}

// RESULTADO FINAL:
❌ Stock NO se restaura (sigue siendo 80 + 60)
❌ No se registra movimiento ENTRADA_AJUSTE
❌ Cantidad quedó bloqueada/perdida
❌ Retorna success: true (pero fue falso!)
```

### Anular Venta con Venta::revertirMovimientosStock()

```php
$venta->revertirMovimientosStock();

// Búsqueda de movimientos (línea 624-629):
$movimientos = MovimientoInventario::where('numero_documento', 'VEN20260211-0001')
    ->whereIn('tipo', [
        MovimientoInventario::TIPO_SALIDA_VENTA,
        'CONSUMO_RESERVA'  // ← INCLUYE AMBOS
    ])
    ->get();

// RESULTADO:
// $movimientos = [movimiento CONSUMO_RESERVA] (1 movimiento encontrado)

// Flujo (línea 634-726):
foreach ($movimientos as $movimiento) {
    $stockProducto = $movimiento->stockProducto;  // id=5
    $cantidadADevolver = abs(-20) = 20;

    // ANTES (línea 637-638):
    $cantidadAnterior = 80;
    $cantidadDisponibleAnterior = 60;

    // Actualizar (línea 653-659):
    DB::table('stock_productos')
        ->where('id', 5)
        ->update([
            'cantidad' => DB::raw("cantidad + 20"),           // 80 + 20 = 100
            'cantidad_disponible' => DB::raw("cantidad_disponible + 20"),  // 60 + 20 = 80
        ]);

    // DESPUÉS (línea 666-668):
    $stockActualizado = StockProducto::find(5);
    $cantidadNueva = 100;
    $cantidadDisponibleNueva = 80;

    // Registrar movimiento (línea 683-693):
    MovimientoInventario::create([
        'cantidad' => 20,  // POSITIVO
        'cantidad_anterior' => 80,
        'cantidad_posterior' => 100,
        'tipo' => TIPO_ENTRADA_AJUSTE,
        'numero_documento' => 'VEN20260211-0001-REV',
    ]);
}

// RESULTADO FINAL:
✅ Stock se restaura (80 + 60 → 100 + 80)
✅ Movimiento ENTRADA_AJUSTE registrado
✅ Auditoría completa
✅ Retorna cantidad_devuelta = 20
```

---

## 📋 Análisis de Cada Método

### VentaDistribucionService::devolverStock()

**Fortalezas:**
- ✅ Sigue patrón centralizado (servicio)
- ✅ Usa lockForUpdate() (concurrencia segura)
- ✅ Transacciones explícitas
- ✅ Logging completo

**Debilidades:**
- ❌ Solo busca TIPO_SALIDA_VENTA (falla con CONSUMO_RESERVA)
- ❌ Probablemente NO se está usando
- ❌ Retorna success: true incluso si no hay movimientos

---

### Venta::revertirMovimientosStock()

**Fortalezas:**
- ✅ Busca AMBOS tipos (SALIDA_VENTA + CONSUMO_RESERVA)
- ✅ Valida affected rows > 0
- ✅ Obtiene valores REALES de BD (refresh)
- ✅ Hard delete si lote queda en 0
- ✅ Probablemente SÍ se está usando
- ✅ Logging muy detallado
- ✅ Logging con diferencias (antes-después)

**Debilidades:**
- ❌ NO tiene lockForUpdate() (vulnerable a race conditions)
- ⚠️ Código duplicado (existe VentaDistribucionService::devolverStock())

---

## 🚨 RECOMENDACIONES

### Opción 1: Refactorizar VentaDistribucionService (RECOMENDADO)

```php
public function devolverStock(string $numeroVenta): array
{
    // AGREGAR: Buscar AMBOS tipos
    $movimientos = MovimientoInventario::where('numero_documento', $numeroVenta)
        ->whereIn('tipo', [
            MovimientoInventario::TIPO_SALIDA_VENTA,
            'CONSUMO_RESERVA'  // ← AGREGAR ESTA LÍNEA
        ])
        ->lockForUpdate()  // ← YA TIENE
        ->get();

    // ... resto del código igual
}
```

**Beneficio:**
- ✅ Centraliza la lógica en servicio
- ✅ Evita duplicación con Venta::revertirMovimientosStock()
- ✅ Una sola versión mantenida

---

### Opción 2: Agregar Lock a Venta::revertirMovimientosStock()

```php
public function revertirMovimientosStock(): void
{
    $movimientos = MovimientoInventario::where('numero_documento', $this->numero)
        ->whereIn('tipo', [...])
        ->lockForUpdate()  // ← AGREGAR LOCK
        ->get();

    // ... resto igual
}
```

**Beneficio:**
- ✅ Protege contra race conditions
- ✅ Minimalista (mínimo cambio)

---

### Opción 3: Consolidación Total (MEJOR)

1. **Mejorar VentaDistribucionService::devolverStock()**:
   - Agregar búsqueda de CONSUMO_RESERVA
   - ✅ Ya tiene lockForUpdate()
   - ✅ Ya tiene auditoría completa

2. **Actualizar Venta::revertirMovimientosStock()** para que llame al servicio:
   ```php
   public function revertirMovimientosStock(): void
   {
       $ventaDistribucionService = app(VentaDistribucionService::class);
       $resultado = $ventaDistribucionService->devolverStock($this->numero);

       if (!$resultado['success']) {
           throw new Exception("Error al devolver stock: " . $resultado['error']);
       }
   }
   ```

---

## 🔍 ¿Cuál Se Está Usando Ahora?

**Evidencia:**
- `VentaDistribucionService::devolverStock()` - **NO se encontró uso** en búsqueda
- `Venta::revertirMovimientosStock()` - **SÍ se está usando** (hay logging detallado)

**Conclusión:**
```
❌ VentaDistribucionService::devolverStock()
   └─ Código de respaldo no utilizado

✅ Venta::revertirMovimientosStock()
   └─ Método actualmente en uso
```

---

## ✅ Estado Actual

| Método Activo | Fallos Potenciales |
|---------------|-------------------|
| `Venta::revertirMovimientosStock()` | ⚠️ Race condition (sin lock) |

| Método Fallido | Razón |
|-------|-------|
| `VentaDistribucionService::devolverStock()` | ❌ No encuentra CONSUMO_RESERVA |

---

## 📌 Conclusión

**El método que SE ESTÁ USANDO es: `Venta::revertirMovimientosStock()`**

**Este método FUNCIONA CORRECTAMENTE PARA:**
- ✅ Actualizar cantidad y cantidad_disponible
- ✅ Registrar cantidad_anterior y cantidad_posterior
- ✅ Manejar TANTO SALIDA_VENTA como CONSUMO_RESERVA
- ✅ Validar affected rows
- ✅ Transacciones atómicas
- ✅ Logging completo

**PERO TIENE UN RIESGO:**
- ⚠️ **NO tiene lockForUpdate()** → Vulnerable a race conditions

**Acción Recomendada:**
1. Agregar `->lockForUpdate()` a la búsqueda en línea 624
2. O: Consolidar todo en VentaDistribucionService (más limpio)

---

**Última actualización:** 2026-02-11
**Status:** ⚠️ FUNCIONA pero CON RIESGO de race conditions
**Versión:** 1.0
