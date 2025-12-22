# VALIDACIÓN Y COMPLETACIÓN - Endpoint POST /api/entregas/batch

## 📊 Estado Actual

### ✅ QUÉ YA EXISTE

1. **EntregaBatchController**: `app/Http/Controllers/Api/EntregaBatchController.php`
   - Método `store()` implementado (línea 33-61)
   - Método `preview()` implementado (línea 77-167)
   - Ambos métodos retornan JsonResponse

2. **CrearEntregasBatchRequest**: `app/Http/Requests/CrearEntregasBatchRequest.php`
   - Validaciones completas definidas
   - Mensajes de error en español
   - Autorización verificada

3. **EntregaService::crearLote()**: `app/Services/Logistica/EntregaService.php` (línea 625-720)
   - Crear entregas en transacción
   - Asignar chofer y vehículo automáticamente
   - Calcular peso automáticamente
   - Opción de optimización
   - Historial de cambios
   - Eventos disparados

4. **Ruta API**: `routes/api.php` (línea 503-513)
   - `POST /api/entregas/lote` → `store()` ✅
   - `POST /api/entregas/lote/preview` → `preview()` ✅

---

### ⚠️ QUÉ NECESITA MEJORA

1. **Inconsistencia en Respuestas**
   - `exitoso` vs `success` (debería ser `success`)
   - `mensaje` vs `message` (debería ser `message`)
   - `error` vs `errors` (debería ser `errors`)

2. **Formato de Respuesta**
   - El `store()` retorna claves inconsistentes
   - No hay estructura unificada con POST /api/entregas
   - Los errores no siguen el formato estándar

3. **Validación de Capacidad**
   - No valida si peso total > capacidad del vehículo
   - Esto puede permitir crear entregas imposibles

4. **Logging**
   - `preview()` no tiene logging
   - `store()` no maneja todos los errores adecuadamente

---

## 🔧 CAMBIOS NECESARIOS

### 1. Estandarizar Respuestas en EntregaBatchController

**Cambio**: Usar claves consistentes con POST /api/entregas

```php
// Antes:
[
    'exitoso' => true,
    'mensaje' => '...',
    'data' => [...]
]

// Después:
[
    'success' => true,
    'message' => '...',
    'data' => [...]
]
```

### 2. Validar Capacidad del Vehículo

**Agregar en `store()`**:
```php
// Calcular peso total seleccionado
$pesoTotal = \App\Models\Venta::whereIn('id', $request->input('venta_ids'))
    ->with('detalles')
    ->get()
    ->sum(fn($v) => $v->detalles?->sum(fn($det) => $det->cantidad * 2) ?? 10);

// Validar contra capacidad del vehículo
$vehiculo = \App\Models\Vehiculo::findOrFail($request->input('vehiculo_id'));
if ($pesoTotal > $vehiculo->capacidad_kg) {
    return response()->json([
        'success' => false,
        'message' => "Peso total ({$pesoTotal} kg) excede capacidad ({$vehiculo->capacidad_kg} kg)",
        'data' => null,
    ], 422);
}
```

### 3. Mejorar Manejo de Errores

**Agregar en `store()`**:
```php
catch (\Illuminate\Validation\ValidationException $e) {
    return response()->json([
        'success' => false,
        'message' => 'Error de validación',
        'errors' => $e->errors(),
    ], 422);
}
```

### 4. Agregar Logging a `preview()`

```php
Log::info('Preview de entregas en lote solicitado', [
    'venta_count' => count($request->input('venta_ids')),
    'vehiculo_id' => $request->input('vehiculo_id'),
    'user_id' => Auth::id(),
]);
```

---

## ✅ PLAN DE IMPLEMENTACIÓN

### Paso 1: Actualizar EntregaBatchController

**Cambios**:
1. Importar `Log`
2. Actualizar `store()`:
   - Estandarizar respuestas
   - Validar capacidad
   - Mejorar manejo de errores
   - Agregar logging
3. Actualizar `preview()`:
   - Estandarizar respuestas
   - Agregar logging
   - Mejorar manejo de errores

### Paso 2: Validar CrearEntregasBatchRequest

- ✅ Validaciones ya están correctas
- ✅ Mensajes ya están en español

### Paso 3: Testing

- Test crear lote simple (2 ventas)
- Test capacidad insuficiente
- Test preview
- Test errores de validación

---

## 📋 ENDPOINT SPECIFICATION

### POST /api/entregas/lote

**Request**:
```json
{
  "venta_ids": [1, 2, 3],
  "vehiculo_id": 5,
  "chofer_id": 3,
  "optimizar": true,
  "agrupar_por_zona": false
}
```

**Response 201** (Success):
```json
{
  "success": true,
  "message": "Se crearon 3 entregas exitosamente",
  "data": {
    "entregas": [
      {
        "id": 10,
        "venta_id": 1,
        "vehiculo_id": 5,
        "chofer_id": 3,
        "peso_kg": 20,
        "estado": "PROGRAMADO",
        "fecha_programada": "2025-12-25T10:00:00",
        "created_at": "2025-12-22T..."
      },
      {
        "id": 11,
        "venta_id": 2,
        "vehiculo_id": 5,
        "chofer_id": 3,
        "peso_kg": 18,
        "estado": "PROGRAMADO",
        "fecha_programada": "2025-12-25T10:30:00",
        "created_at": "2025-12-22T..."
      },
      {
        "id": 12,
        "venta_id": 3,
        "vehiculo_id": 5,
        "chofer_id": 3,
        "peso_kg": 22,
        "estado": "PROGRAMADO",
        "fecha_programada": "2025-12-25T11:00:00",
        "created_at": "2025-12-22T..."
      }
    ],
    "estadisticas": {
      "total_creadas": 3,
      "total_errores": 0,
      "peso_total": 60,
      "vehiculo": {
        "id": 5,
        "placa": "PA-123",
        "capacidad_kg": 100
      },
      "chofer": {
        "id": 3,
        "nombre": "Juan Pérez"
      }
    },
    "optimizacion": null
  }
}
```

**Response 422** (Validation Error):
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "venta_ids": ["Debe seleccionar al menos una venta"],
    "vehiculo_id": ["Debe asignar un vehículo"]
  }
}
```

**Response 422** (Capacity Error):
```json
{
  "success": false,
  "message": "Peso total (200 kg) excede capacidad del vehículo (100 kg)",
  "data": null
}
```

**Response 500** (Server Error):
```json
{
  "success": false,
  "message": "Error al crear entregas en lote",
  "error": "..."
}
```

---

### POST /api/entregas/lote/preview

**Request**:
```json
{
  "venta_ids": [1, 2, 3],
  "vehiculo_id": 5,
  "chofer_id": 3
}
```

**Response 200** (Success):
```json
{
  "success": true,
  "message": "Preview generado exitosamente",
  "data": {
    "ventas": 3,
    "peso_total": 60,
    "vehiculo": {
      "id": 5,
      "placa": "PA-123",
      "capacidad_kg": 100
    },
    "optimizacion": {
      "rutas": [...],
      "estadisticas": {...},
      "clustering_stats": {...},
      "problemas": [],
      "sugerencias": []
    }
  }
}
```

---

## 🧪 TESTING CASES

### Test 1: Crear lote básico
```bash
curl -X POST http://localhost/api/entregas/lote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "venta_ids": [1, 2],
    "vehiculo_id": 5,
    "chofer_id": 3,
    "optimizar": false
  }'

Expected: 201 + 2 entregas creadas
```

### Test 2: Capacidad insuficiente
```bash
curl -X POST http://localhost/api/entregas/lote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "venta_ids": [1, 2, 3, 4, 5],
    "vehiculo_id": 1,
    "chofer_id": 3
  }'

Expected: 422 + "Peso total excede capacidad"
```

### Test 3: Preview
```bash
curl -X POST http://localhost/api/entregas/lote/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "venta_ids": [1, 2, 3],
    "vehiculo_id": 5,
    "chofer_id": 3
  }'

Expected: 200 + preview data con optimización
```

### Test 4: Validación
```bash
curl -X POST http://localhost/api/entregas/lote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "vehiculo_id": 5,
    "chofer_id": 3
  }'

Expected: 422 + "venta_ids es requerido"
```

---

## ⏱️ ESTIMACIÓN

| Tarea | Estimado |
|-------|----------|
| Actualizar controller | 15 min |
| Testing | 20 min |
| Documentación | 10 min |
| **TOTAL** | **45 min** |

---

## ✅ CHECKLIST

Backend:
- [ ] Estandarizar respuestas en `store()`
- [ ] Validar capacidad del vehículo
- [ ] Mejorar manejo de errores
- [ ] Agregar logging
- [ ] Estandarizar respuestas en `preview()`
- [ ] Testing con cURL

Frontend:
- [ ] SimpleEntregaForm: Verificar integración
- [ ] BatchUI: Enviar request correcto
- [ ] Manejo de errores
- [ ] Validación de capacidad
- [ ] Testing E2E

Documentación:
- [ ] Actualizar NEXT_SPRINT_ROADMAP.md
- [ ] Crear test cases documentados
