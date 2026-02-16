# Mejoras de Ajuste de Inventario - Formato Tabla

## 📋 Resumen de Cambios

Se ha implementado un nuevo sistema de **ajuste de inventario en formato tabla editable** que permite:

✅ Agregar/eliminar múltiples ajustes en una tabla
✅ Selector dinámico de productos por almacén
✅ Cálculo automático de cantidades
✅ Tipos de ajuste (Entrada/Salida) por fila
✅ Observaciones personalizadas
✅ Resumen en tiempo real (Total Productos, Entradas, Salidas)
✅ Validaciones completas en frontend y backend

---

## 🚀 Acceso a la Nueva Página

**URL:** `http://localhost:8000/inventario/ajuste-tabla`
**Ruta:** `inventario.ajuste-tabla.form`
**Permiso requerido:** `inventario.ajuste.form`

---

## 🏗️ Estructura Implementada

### Frontend (React/TypeScript)

**Archivo:** `resources/js/presentation/pages/inventario/ajuste-tabla.tsx`

#### Componentes Principales:

1. **Selector de Almacén**
   - Dropdown con almacenes activos
   - Filtra productos disponibles por almacén

2. **Tabla Editable**
   - Columnas:
     - Producto (selector dinámico)
     - Stock Actual (solo lectura)
     - Tipo (Entrada/Salida)
     - Cantidad de Ajuste (input numérico)
     - Stock Nuevo (calculado automáticamente)
     - Observación (texto libre)
     - Acción (botón eliminar)

3. **Resumen en Tiempo Real**
   - Total de Productos
   - Total de Entradas
   - Total de Salidas

4. **Acciones**
   - ➕ Agregar Fila
   - ❌ Cancelar
   - 💾 Guardar Ajustes

#### Lógica de Cálculo:

```javascript
// Si es ENTRADA: Stock Nuevo = Stock Actual + Cantidad Ajuste
// Si es SALIDA: Stock Nuevo = máx(0, Stock Actual - Cantidad Ajuste)
```

#### Validaciones Frontend:

- Almacén obligatorio
- Al menos 1 ajuste requerido
- Producto obligatorio en cada fila
- Cantidad > 0
- Validaciones de tipos

---

### Backend (Laravel)

**Archivo:** `app/Http/Controllers/InventarioController.php`

#### Nuevo Método: `procesarAjusteTabla()`

**Endpoint:** `POST /api/inventario/ajuste`

**Parámetros:**
```json
{
  "almacen_id": 1,
  "ajustes": [
    {
      "stock_producto_id": 5,
      "nueva_cantidad": 100,
      "observacion": "Ajuste inicial",
      "tipo_ajuste": "entrada"
    },
    {
      "stock_producto_id": 8,
      "nueva_cantidad": 50,
      "observacion": "Devolución de cliente",
      "tipo_ajuste": "salida"
    }
  ]
}
```

**Validaciones Backend:**
- Almacén existe y está activo
- Stock_producto existe
- Nuevas cantidades >= 0
- Productos pertenecen al almacén seleccionado
- Observaciones máximo 500 caracteres

**Respuesta Exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "stock_producto_id": 5,
      "numero_documento": "AJ202602120001",
      "diferencia": 50,
      "tipo": "ENTRADA_AJUSTE",
      "observacion": "Ajuste inicial",
      "fecha": "2026-02-12 10:30:00"
    }
  ],
  "message": "Se procesaron 2 ajustes de inventario exitosamente"
}
```

**Procesa:**
1. Valida datos de entrada
2. Verifica que los productos pertenecen al almacén
3. Dentro de transacción:
   - Calcula diferencias (nueva_cantidad - cantidad_actual)
   - Determina tipo (ENTRADA_AJUSTE o SALIDA_AJUSTE)
   - Genera número de documento único (AJ + YYYYMMDD + XXXX)
   - Registra MovimientoInventario con auditoría completa
   - Actualiza stock_productos automáticamente

---

## 📊 Flujo Completo

```
Frontend: Usuario ingresa almacén
    ↓
Frontend: Filtra productos por almacén
    ↓
Frontend: Usuario agrega filas de ajuste
    ↓
Frontend: Usuario rellena producto, cantidad, tipo y observación
    ↓
Frontend: Se calcul stock nuevo automáticamente
    ↓
Frontend: Usuario hace submit
    ↓
Frontend: Validaciones locales
    ↓
Backend: POST /api/inventario/ajuste
    ↓
Backend: Validaciones completas
    ↓
Backend: Procesa dentro de transacción
    ↓
Backend: Retorna movimientos creados
    ↓
Frontend: Muestra toast de éxito
    ↓
Frontend: Limpia formulario
```

---

## 🔌 Rutas Implementadas

### Web Route
```php
Route::get('ajuste-tabla', function () { ... })
    ->middleware('permission:inventario.ajuste.form')
    ->name('ajuste-tabla.form');
```

### API Route
```php
Route::post('ajuste', [InventarioController::class, 'procesarAjusteTabla']);
// Dentro de: Route::group(['prefix' => 'inventario'], function () { ... })
```

---

## 📝 Ejemplo de Uso

### Caso 1: Ajuste de entrada (Compra recibida)

1. Selecciona almacén: "Bodega Central"
2. Agrega fila 1:
   - Producto: "Pepsi 2L"
   - Tipo: Entrada 📥
   - Cantidad: 50
   - Observación: "Compra PO#12345"
   - Stock Nuevo: 340 (290 + 50)

3. Agrega fila 2:
   - Producto: "Guaraná Antártica 2L"
   - Tipo: Entrada 📥
   - Cantidad: 30
   - Observación: "Compra PO#12345"
   - Stock Nuevo: 189 (159 + 30)

4. Click "Guardar Ajustes"
5. Sistema crea 2 movimientos:
   - AJ202602120001: Pepsi +50
   - AJ202602120002: Guaraná +30

### Caso 2: Ajuste de salida (Devolución cliente)

1. Selecciona almacén: "Bodega Central"
2. Agrega fila 1:
   - Producto: "Fanta Naranja 3L"
   - Tipo: Salida 📤
   - Cantidad: 15
   - Observación: "Devolución cliente García"
   - Stock Nuevo: 45 (60 - 15)

3. Click "Guardar Ajustes"
4. Sistema crea 1 movimiento:
   - AJ202602120003: Fanta -15

---

## 🔒 Permisos Requeridos

- `inventario.ajuste.form` - Para ver la página y procesar ajustes
- `inventario.ajuste.procesar` - Para procesar los ajustes (heredado)

---

## 📊 Movimientos Generados

Cada ajuste registra un `MovimientoInventario` con:

```php
[
    'stock_producto_id' => 5,
    'tipo' => 'ENTRADA_AJUSTE' | 'SALIDA_AJUSTE',
    'cantidad' => 50 | -15,                    // Positivo o negativo
    'cantidad_anterior' => 290,
    'cantidad_posterior' => 340,
    'numero_documento' => 'AJ202602120001',
    'observacion' => 'Compra PO#12345',
    'user_id' => 1,
    'fecha' => '2026-02-12 10:30:00'
]
```

El stock en `stock_productos` se actualiza automáticamente.

---

## 🧪 Testing

### Test Básico
1. Navega a `/inventario/ajuste-tabla`
2. Selecciona un almacén
3. Agrega una fila con un producto
4. Verifica que se calcula el stock nuevo automáticamente
5. Agrega observación
6. Click en "Guardar Ajustes"
7. Verifica que se ve el toast de éxito
8. Verifica en la BD que se creó el MovimientoInventario

### Test de Validaciones
1. Intenta guardar sin almacén → Error
2. Intenta guardar sin productos → Error
3. Intenta guardar con cantidad = 0 → Error
4. Intenta guardar con producto que no existe → Error
5. Intenta guardar con producto de otro almacén → Error

---

## 🔄 Diferencias con Método Anterior

| Característica | Anterior (Form) | Nuevo (Tabla) |
|---|---|---|
| **Interfaz** | Dropdown individual | Tabla editable |
| **Múltiples ajustes** | Uno por uno | Todos de una vez |
| **Validación** | En tiempo real | Frontend + Backend |
| **Resumen** | Manual/calculado | En tiempo real |
| **Experiencia** | Lenta, repetitiva | Rápida, eficiente |
| **Almacenamiento** | Individual | Transacción atómica |

---

## 🐛 Debugging

Si hay errores, revisa:

1. **Consola del navegador** (F12)
   - Errores de validación
   - Problemas de API

2. **Laravel logs** (`storage/logs/laravel.log`)
   - Errores del servidor
   - Problemas de transacción

3. **Network tab** (F12 → Network)
   - Request/Response del POST
   - Status HTTP

---

## 📌 Notas Importantes

1. **Transacciones Atómicas**: Si uno de los ajustes falla, SE REVIERTEN TODOS
2. **Números Secuenciales**: Cada ajuste obtiene un número único AJ202602120001
3. **Auditoría Completa**: Se registra usuario, timestamp, observación
4. **Sin Duplicación**: El sistema previene registros duplicados con locks
5. **Stock Negativo**: Se previene excepto en casos especiales (creditos, etc.)

---

## 📞 Soporte

Para más información sobre:
- **Movimientos de Inventario** → Ver `MovimientoInventario` model
- **Stock de Productos** → Ver `StockProducto` model
- **Validaciones** → Ver `StoreAjusteInventarioRequest`

---

**Fecha de Implementación:** 2026-02-12
**Versión:** 1.0
