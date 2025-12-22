# VALIDACIÓN Y COMPLETACIÓN - Endpoint POST /api/entregas

## 📊 Estado Actual

### ✅ QUÉ YA EXISTE
1. **Controller Method**: `EntregaController::store()` (línea 167-213)
   - Validaciones implementadas
   - Lógica de negocio completada
   - Manejo de errores correcto
   - Respuestas API consistentes

2. **Ruta Web**: `POST /logistica/entregas` (web.php línea 367)
   - Apunta a `EntregaController::store()`
   - Funciona correctamente en formulario web tradicional

3. **Frontend**: `SimpleEntregaForm.tsx` (275 líneas)
   - Formulario compacto implementado
   - Envía datos correctamente formateados
   - Manejo de errores integrado

---

### ❌ QUÉ FALTA

1. **Ruta API**: `POST /api/entregas`
   - NO existe en `routes/api.php`
   - Frontend intenta POST a `/api/entregas` pero no hay ruta
   - Necesita crearse

2. **Data Mismatch**:
   - Backend espera: `peso_kg` (requerido)
   - Frontend envía: NO envía `peso_kg`
   - Necesita resolverse

3. **Integración Completa**:
   - No hay controller API específico (usa web controller)
   - No hay formato JSON de respuesta estandarizado
   - Testing no completado

---

## 🔍 ANÁLISIS DETALLADO

### Problema 1: Falta la Ruta API

**Ubicación**: `routes/api.php`

**Estado Actual**:
```php
// routes/api.php (línea 496-506)
Route::prefix('entregas/lote')->group(function () {
    Route::post('/preview', [EntregaBatchController::class, 'preview'])
        ->middleware('permission:entregas.create')
        ->name('entregas.lote.preview');

    Route::post('/', [EntregaBatchController::class, 'store'])
        ->middleware('permission:entregas.create')
        ->name('entregas.lote.crear');
});

// ❌ FALTA: POST /api/entregas (simple)
```

**Lo que falta**:
```php
// Necesario agregar:
Route::middleware(['auth:sanctum', 'platform'])->group(function () {
    Route::prefix('entregas')->group(function () {
        // ✅ NUEVO: Crear entrega simple
        Route::post('/', [EntregaController::class, 'store'])
            ->middleware('permission:entregas.create')
            ->name('api.entregas.crear');
    });
});
```

---

### Problema 2: Discrepancia de Datos

**EntregaController::store() expects**:
```php
$validated = $request->validate([
    'venta_id'          => 'required|exists:ventas,id',
    'vehiculo_id'       => 'required|exists:vehiculos,id',
    'chofer_id'         => 'required|exists:empleados,id',
    'fecha_programada'  => 'required|date|after:now',
    'direccion_entrega' => 'required|string|max:500',
    'peso_kg'           => 'required|numeric|min:0.01|max:50000',  // ← REQUERIDO
    'observaciones'     => 'nullable|string|max:1000',
]);
```

**SimpleEntregaForm sends**:
```typescript
interface EntregaFormData {
    venta_id: number;
    vehiculo_id: number | null;
    chofer_id: number | null;
    fecha_programada: string;
    direccion_entrega?: string;      // ← FALTA
    observaciones?: string;
    // ❌ NO INCLUYE: peso_kg
}
```

**Solución**:
Opción A (Recomendada): Obtener peso de la venta automáticamente
Opción B: Enviar peso desde frontend

---

## ✅ PLAN DE ACCIÓN

### Paso 1: Agregar Ruta API
**Archivo**: `routes/api.php`
**Ubicación**: Después de línea 506

```php
// ✅ NUEVO: Entregas simples (1 venta)
Route::middleware(['auth:sanctum', 'platform'])->group(function () {
    Route::prefix('entregas')->group(function () {
        // Crear entrega simple (1 venta)
        Route::post('/', [EntregaController::class, 'store'])
            ->middleware('permission:entregas.create')
            ->name('api.entregas.store');
    });
});
```

**Tiempo estimado**: 5 minutos

---

### Paso 2: Resolver Peso (Opción A - Recomendada)

**Modificar**: `EntregaController::store()`

**Cambio**:
```php
public function store(Request $request): JsonResponse | RedirectResponse
{
    try {
        $validated = $request->validate([
            'venta_id'          => 'required|exists:ventas,id',
            'vehiculo_id'       => 'required|exists:vehiculos,id',
            'chofer_id'         => 'required|exists:empleados,id',
            'fecha_programada'  => 'required|date|after:now',
            'direccion_entrega' => 'nullable|string|max:500',
            'peso_kg'           => 'nullable|numeric|min:0.01|max:50000',  // ← CAMBIO: nullable
            'observaciones'     => 'nullable|string|max:1000',
        ]);

        // ✅ NUEVO: Obtener peso de la venta si no se proporciona
        if (empty($validated['peso_kg'])) {
            $venta = \App\Models\Venta::findOrFail($validated['venta_id']);
            // Calcular peso basado en detalles de la venta
            $validated['peso_kg'] = $venta->detalles?->sum(fn($det) => $det->cantidad * 2) ?? 10;
        }

        // ... resto del código igual
    }
}
```

**Ventajas**:
- No requiere cambios en frontend
- Cálculo automático y consistente
- Sigue patrón del proyecto

**Tiempo estimado**: 10 minutos

---

### Paso 3: Ajustar SimpleEntregaForm (Opcional)

Si queremos que el usuario pueda especificar peso manualmente:

```typescript
// Agregar campo opcional en formulario
<div>
    <label>Peso (kg) - Estimado: {estimatedWeight}</label>
    <input
        type="number"
        value={formData.peso_kg || estimatedWeight}
        onChange={(e) => setFormData({...formData, peso_kg: parseFloat(e.target.value)})}
    />
</div>
```

**Tiempo estimado**: 10 minutos

---

### Paso 4: Validar Respuesta API

**Asegurar formato consistente**:
```php
return $this->respondSuccess(
    data: $entrega,
    message: 'Entrega creada exitosamente',
    redirectTo: route('logistica.entregas.show', $entrega->id),  // ← Cambiar para API
);
```

**Para API, cambiar a**:
```php
if ($this->isApiRequest()) {
    return response()->json([
        'success' => true,
        'message' => 'Entrega creada exitosamente',
        'data' => $entrega,
    ], 201);
}

// Para web, mantener redirect
return redirect()->route('logistica.entregas.show', $entrega->id)
    ->with('success', 'Entrega creada exitosamente');
```

**Tiempo estimado**: 10 minutos

---

## 🧪 VALIDACIÓN POST-IMPLEMENTACIÓN

### Test Casos (cURL)

```bash
# Test 1: Crear entrega simple
curl -X POST http://localhost/api/entregas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "venta_id": 1,
    "vehiculo_id": 5,
    "chofer_id": 3,
    "fecha_programada": "2025-12-25T10:00:00",
    "direccion_entrega": "Calle Principal 123",
    "observaciones": "Primera entrega"
  }'

# Expected Response 201:
{
  "success": true,
  "message": "Entrega creada exitosamente",
  "data": {
    "id": 10,
    "venta_id": 1,
    "vehiculo_id": 5,
    "chofer_id": 3,
    "peso_kg": 20,
    "fecha_programada": "2025-12-25T10:00:00",
    "estado": "PROGRAMADO",
    "created_at": "2025-12-22T..."
  }
}

# Test 2: Validación - falta vehículo
curl -X POST http://localhost/api/entregas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "venta_id": 1,
    "chofer_id": 3,
    "fecha_programada": "2025-12-25T10:00:00"
  }'

# Expected Response 422:
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "vehiculo_id": ["Selecciona un vehículo"],
    "direccion_entrega": ["Dirección es requerida"]
  }
}

# Test 3: Validación - capacidad insuficiente
# (Vehículo con 10kg, venta con 25kg)
curl -X POST http://localhost/api/entregas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "venta_id": 1,
    "vehiculo_id": 1,
    "chofer_id": 3,
    "fecha_programada": "2025-12-25T10:00:00"
  }'

# Expected Response 422:
{
  "success": false,
  "message": "El peso (25 kg) excede la capacidad del vehículo (10 kg)"
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend Changes
- [ ] Agregar ruta API `POST /api/entregas` en `routes/api.php`
- [ ] Modificar `EntregaController::store()` para:
  - [ ] Hacer `peso_kg` nullable
  - [ ] Obtener peso de venta automáticamente
  - [ ] Diferenciar respuesta API vs Web
- [ ] Validar respuesta JSON es consistente
- [ ] Testing con cURL/Postman

### Frontend Changes
- [ ] SimpleEntregaForm: Validar que funciona sin `peso_kg`
- [ ] Verificar error handling en formulario
- [ ] Validar redirect post-submit
- [ ] Testing E2E

### Documentation
- [ ] Actualizar API docs
- [ ] Actualizar NEXT_SPRINT_ROADMAP.md
- [ ] Crear test cases documentados

### Testing
- [ ] Test unitario del endpoint
- [ ] Test validaciones
- [ ] Test E2E desde formulario
- [ ] Test en Postman

---

## ⏱️ ESTIMACIÓN

| Tarea | Estimado | Prioridad |
|-------|----------|-----------|
| Agregar ruta API | 5 min | 🔴 Crítica |
| Resolver peso | 10 min | 🔴 Crítica |
| Ajustar respuesta | 10 min | 🟡 Alta |
| Testing | 15 min | 🟡 Alta |
| Documentación | 10 min | 🟢 Media |
| **TOTAL** | **50 min** | |

---

## 🚀 SIGUIENTE STEP

Una vez completado este punto, el siguiente es:
- ☐ **POST /api/entregas/batch** - Crear entregas en lote (60 min estimado)
- ☐ **useEntregaBatch hook** - Integrar con backend (45 min estimado)
- ☐ **POST /api/entregas/optimizar** - Optimización de rutas (120 min estimado)

---

## 📝 NOTAS

1. **isApiRequest()**: El método `respondSuccess()` usa `isApiRequest()` para detectar si es API o web. Verificar que está implementado en el trait.

2. **Peso Estimado**: Actualmente en CreateEntregasUnificado se calcula como `detalles * 2`. Mantener consistencia.

3. **Middleware**: `permission:entregas.create` puede necesitar revisarse si el usuario no lo tiene.

4. **Versionado**: Considerar versión de API (`/api/v1/entregas`) en futuro para backward compatibility.
