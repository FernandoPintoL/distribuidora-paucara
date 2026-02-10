# ✅ Ejecución Manual de Reversión de Stock (2026-02-10)

## 📋 Resumen

Se agregó funcionalidad para ejecutar manualmente la reversión de stock cuando el sistema detecta que una venta anulada tiene reversiones incompletas o faltantes. Ahora desde el modal de auditoría se puede hacer clic en un botón para registrar los movimientos faltantes.

---

## 🎯 Características

### 1. **Botón "Ejecutar Reversión"**
- Solo aparece si hay reversiones **incompletas** (⚠️) o **sin reversión** (❌)
- No aparece si la reversión está **completa** (✅)
- Permite ejecutar la reversión manualmente desde el modal

### 2. **Flujo de Ejecución**
```
Usuario abre modal de verificación
    ↓
Si estado = "incompleta" o "sin-reversiones":
    ├─ Muestra botón "🔄 Ejecutar Reversión"
    └─ Usuario hace click
       ↓
       Solicita confirmación: "¿Ejecutar reversión de stock?"
       ↓
       Si acepta:
         ├─ Llama POST /api/ventas/{id}/ejecutar-reversion-stock
         ├─ Backend registra movimientos faltantes
         ├─ Actualiza stock de productos
         └─ Devuelve confirmación
       ↓
       Modal muestra éxito y se recarga
```

### 3. **Validaciones**
- Solo funciona en ventas **anuladas**
- Solo registra reversiones que faltan
- No duplica reversiones existentes
- Valida stock del producto antes de crear movimiento

---

## 🔧 Cambios Implementados

### Backend

**Archivo**: `app/Http/Controllers/VentaController.php`

**Nuevo Método**: `ejecutarReversionStock(int $id)`

```php
/**
 * POST /api/ventas/{id}/ejecutar-reversion-stock
 *
 * Registra movimientos de reversión faltantes para venta anulada
 *
 * Validaciones:
 * - Venta debe estar anulada
 * - Debe haber movimientos originales
 * - Solo crea reversiones faltantes
 *
 * Response:
 * {
 *     "success": true,
 *     "message": "Reversión de stock ejecutada exitosamente. 2 movimiento(s) creado(s)",
 *     "movimientos_creados": 2,
 *     "detalles": [...]
 * }
 */
```

**Lógica**:
1. Valida que venta esté anulada
2. Obtiene movimientos originales (SALIDA_VENTA, CONSUMO_RESERVA)
3. Obtiene reversiones existentes
4. Para cada movimiento sin reversión:
   - Crea movimiento ENTRADA_AJUSTE
   - Actualiza stock del producto
   - Registra en log de auditoría
5. Retorna cantidad de movimientos creados

**Rutas**: `routes/api.php`

```php
Route::post('{venta}/ejecutar-reversion-stock', [VentaController::class, 'ejecutarReversionStock']);
```

### Frontend

**Archivo**: `DetalleReversionModal.tsx`

**Nuevas Props**:
```typescript
onReversionExecuted?: () => void;  // Callback cuando se ejecuta reversión
```

**Nuevos Estados**:
```typescript
const [isEjecutando, setIsEjecutando] = useState(false);
```

**Nueva Función**:
```typescript
const handleEjecutarReversion = async () => {
    // 1. Validar ID de venta
    // 2. Pedir confirmación
    // 3. Llamar endpoint POST
    // 4. Mostrar éxito/error
    // 5. Recargar datos si éxito
}
```

**Botón Condicional**:
```typescript
{(data.estado === 'incompleta' || data.estado === 'sin-reversiones') && (
    <button onClick={handleEjecutarReversion} disabled={isEjecutando}>
        🔄 Ejecutar Reversión
    </button>
)}
```

**Archivo**: `tabla-ventas.tsx`

```typescript
<DetalleReversionModal
    // ... props anteriores
    onReversionExecuted={() => {
        // Recargar página después de ejecutar reversión
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }}
/>
```

---

## 📊 Flujo Completo

### Caso: Sin Reversiones (❌)

```
1. Usuario accede a /ventas/index
2. Ve venta anulada con icono ❌
3. Hace click en icono
4. Se abre modal:
   ├─ Estado: ❌ Sin Reversión
   ├─ Movimientos originales: SALIDA_VENTA: 2
   ├─ Movimientos reversión: ENTRADA_AJUSTE: 0
   ├─ Detalle:
   │  ├─ Pepsi: Original -3, Reversión: ❌ Falta
   │  └─ Guaraná: Original -1, Reversión: ❌ Falta
   └─ Botón: "🔄 Ejecutar Reversión" (visible)

5. Usuario hace click en botón
6. Sistema pide confirmación
7. Si acepta:
   ├─ Registra 2 movimientos ENTRADA_AJUSTE
   ├─ Pepsi: +3, Guaraná: +1
   ├─ Actualiza stock
   └─ Muestra "Reversión ejecutada exitosamente"

8. Modal se cierra y página se recarga
9. Venta ahora muestra icono ✅
```

### Caso: Incompleta (⚠️)

```
1. Venta anulada con estado ⚠️ (Reversión Incompleta)
2. Usuario abre modal
3. Ve:
   ├─ Pepsi: Original -3, Reversión: +2 (❌ Incompleta)
   └─ Guaraná: Original -1, Reversión: ❌ Falta

4. Botón "🔄 Ejecutar Reversión" (visible)
5. Hace click y acepta
6. Sistema crea:
   ├─ Para Pepsi: +1 (para completar +3)
   └─ Para Guaraná: +1 (para crear la faltante)

7. Ahora ambos están completos: ✅
```

### Caso: Completa (✅)

```
1. Venta anulada con estado ✅
2. Usuario abre modal
3. Ve:
   ├─ Pepsi: Original -3, Reversión: +3 ✅
   └─ Guaraná: Original -1, Reversión: +1 ✅

4. Botón "Ejecutar Reversión" NO APARECE (reversión completa)
5. Solo muestra información de auditoría
```

---

## 📡 Endpoint API

### POST `/api/ventas/{id}/ejecutar-reversion-stock`

**Parámetros**: Ninguno (ID en URL)

**Headers Requeridos**:
```
Content-Type: application/json
X-CSRF-TOKEN: <token>
```

**Respuesta Exitosa** (200):
```json
{
    "success": true,
    "message": "Reversión de stock ejecutada exitosamente. 2 movimiento(s) creado(s)",
    "movimientos_creados": 2,
    "detalles": [
        {
            "stock_producto_id": 71,
            "producto_nombre": "Pepsi 1LTS X 12",
            "cantidad_revertida": 3,
            "estado": "✅ Reversión ejecutada"
        },
        {
            "stock_producto_id": 75,
            "producto_nombre": "Guaraná Antártica 1LTS X 12",
            "cantidad_revertida": 1,
            "estado": "✅ Reversión ejecutada"
        }
    ]
}
```

**Respuesta Error** (400):
```json
{
    "success": false,
    "message": "Solo se puede ejecutar reversión en ventas anuladas"
}
```

**Respuesta Error** (500):
```json
{
    "success": false,
    "message": "Error al ejecutar reversión: [detalle]"
}
```

---

## 🎨 Interfaz Visual

### Modal con Botón de Ejecución

```
┌────────────────────────────────────────────────┐
│ Auditoría de Reversión - VEN20260210-0141      │
├────────────────────────────────────────────────┤
│ Estado: ❌ Sin Reversión    [🔄 Ejecutar Reversión] │
├────────────────────────────────────────────────┤
│ Movimientos Originales | Movimientos Reversión │
│ SALIDA_VENTA: 2        | ENTRADA_AJUSTE: 0    │
├────────────────────────────────────────────────┤
│ Detalle de Productos:                          │
│ ├─ Pepsi: -3 → ❌ Falta reversión             │
│ └─ Guaraná: -1 → ❌ Falta reversión           │
└────────────────────────────────────────────────┘
```

**Estados del Botón**:
- ✅ Habilitado: Click ejecuta reversión
- ⏳ Ejecutando: Muestra spinner "Ejecutando..."
- ✅ Éxito: Recargas página automáticamente
- ❌ Error: Muestra mensaje de error

---

## 📝 Auditoría de Movimientos

Cada movimiento creado registra:

```php
MovimientoInventario::create([
    'stock_producto_id' => $id,
    'almacen_id' => $almacen,
    'tipo' => 'ENTRADA_AJUSTE',
    'cantidad' => $cantidadRevercion,
    'numero_documento' => 'VEN20260210-0141-REV',
    'descripcion' => 'Reversión de stock - Venta ... anulada',
    'motivo' => 'ANULACION',
    'usuario_id' => Auth::id(),
    'observacion' => json_encode([
        'evento' => 'Reversión manual de stock',
        'venta_id' => 141,
        'venta_numero' => 'VEN20260210-0141',
        'ejecutada_por' => 'Junior',
        'fecha_ejecucion' => '2026-02-10T18:45:32Z'
    ])
])
```

---

## ✅ Compilación

- ✅ `npm run build` - Exitosa (45.87s)
- ✅ PHP syntax check - Sin errores
- ✅ Frontend TypeScript - Válido
- ✅ Rutas API - Registradas

---

## 🧪 Casos de Prueba

### Test 1: Ejecutar reversión sin movimientos
- Venta sin movimientos originales
- Esperado: Error "No hay movimientos originales para revertir"

### Test 2: Ejecutar reversión en venta no anulada
- Venta en estado APROBADO
- Esperado: Error "Solo se puede ejecutar reversión en ventas anuladas"

### Test 3: Ejecutar reversión completa
- Venta anulada sin reversiones
- Esperado: 2+ movimientos creados, estado → ✅

### Test 4: Ejecutar reversión incompleta
- Venta anulada con reversiones parciales
- Esperado: Movimientos faltantes creados, estado → ✅

---

## 🔍 Logging

El sistema registra en `storage/logs/laravel.log`:

```
[2026-02-10 18:45:32] local.INFO: ✅ Reversión de stock ejecutada manualmente
  venta_id: 141
  venta_numero: VEN20260210-0141
  movimientos_creados: 2
  usuario: Junior
```

---

## 🚀 Beneficios

✅ **Auditoría completa** - Rastrea quién ejecutó la reversión y cuándo
✅ **Seguridad** - Solo crea reversiones faltantes, no duplica
✅ **Recuperación** - Puede corregir reversiones incompletas manualmente
✅ **Visibilidad** - Usuario sabe exactamente qué se está revirtiendo
✅ **Confirmación** - Pide confirmación antes de ejecutar

---

**Última actualización**: 2026-02-10
**Estado**: ✅ COMPLETO - Integración exitosa
**Compilación**: ✅ npm run build (45.87s), ✅ PHP lint
