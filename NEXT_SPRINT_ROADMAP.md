# Roadmap - Siguiente Sprint: Entregas (Fase 3 - API & Optimización)

## Estado Actual ✅

**Sprint Actual (Completado)**:
- ✅ Layout persistente 4/8 (Opción B)
- ✅ SimpleEntregaForm integrado
- ✅ BatchVentaSelector reutilizado
- ✅ Responsive completo (desktop/mobile)
- ✅ Dark mode soporte
- ✅ Documentación técnica

**Commit**: `65e50d2` - Refactorizar interfaz de entregas

---

## Siguiente Sprint: Fase 3 - Implementación de APIs & Optimización

### 📊 Visión General

```
FASE 3: APIs & Optimización (Siguiente Sprint)

Current State:
├─ UI: ✅ Completado (Layout 4/8, formularios)
├─ Validaciones: ✅ Completado (front-end)
├─ Endpoints: ❌ Por validar/completar
└─ Optimización: ❌ Por implementar

Next Sprint:
├─ Validar & completar endpoints API
├─ Integrar hook useEntregaBatch
├─ Implementar algoritmos de optimización
├─ Testing E2E
└─ Deployment

Timeline: 1-2 semanas (estimado)
```

---

## 📋 Tareas Pendientes por Categoría

### 1️⃣ ENDPOINTS API (Backend)

**Status**: Parcialmente implementados

#### 1.1 POST /api/entregas (Crear Entrega Simple)
- **Archivo**: `app/Http/Controllers/EntregaController.php`
- **Estado**: Existe pero necesita revisión
- **TODO**:
  - ✅ Validar request (venta_id, vehiculo_id, chofer_id, fecha_programada)
  - ✅ Validar que venta existe y está disponible
  - ✅ Validar que vehículo existe y tiene capacidad
  - ✅ Validar que chofer existe y está disponible
  - ⚠️ Crear entrega en base de datos
  - ⚠️ Actualizar estado de venta
  - ⚠️ Retornar entrega creada
  - ⚠️ Manejar errores y validaciones

**Endpoint Esperado**:
```http
POST /api/entregas
Content-Type: application/json

{
  "venta_id": 1,
  "vehiculo_id": 5,
  "chofer_id": 3,
  "fecha_programada": "2025-12-25T10:00:00",
  "direccion_entrega": "Calle X #123",
  "observaciones": "Notas adicionales"
}

Response 201:
{
  "id": 10,
  "numero_entrega": "ENT-2025-001",
  "venta_id": 1,
  "vehiculo_id": 5,
  "chofer_id": 3,
  "estado": "PROGRAMADA",
  "fecha_programada": "2025-12-25T10:00:00",
  "created_at": "2025-12-22..."
}
```

---

#### 1.2 POST /api/entregas/batch (Crear Entregas en Lote)
- **Archivo**: `app/Http/Controllers/Api/EntregaBatchController.php` (sin tracking)
- **Estado**: Existe pero no está integrado
- **TODO**:
  - 🔄 Validar request (venta_ids[], vehiculo_id, chofer_id)
  - 🔄 Validar todas las ventas existen
  - 🔄 Validar capacidad total
  - 🔄 Crear múltiples entregas en transacción
  - 🔄 Actualizar estados de ventas
  - 🔄 Retornar lista de entregas creadas

**Endpoint Esperado**:
```http
POST /api/entregas/batch
Content-Type: application/json

{
  "venta_ids": [1, 2, 3],
  "vehiculo_id": 5,
  "chofer_id": 3,
  "optimizar": false
}

Response 201:
{
  "entregas": [
    {"id": 10, "numero_entrega": "ENT-001", "venta_id": 1},
    {"id": 11, "numero_entrega": "ENT-002", "venta_id": 2},
    {"id": 12, "numero_entrega": "ENT-003", "venta_id": 3}
  ],
  "total_creadas": 3,
  "peso_total": 125.5,
  "monto_total": 5000
}
```

---

#### 1.3 POST /api/entregas/optimizar (Optimización de Rutas)
- **Archivo**: `app/Services/Logistica/AdvancedVRPService.php` (sin tracking)
- **Estado**: Implementación existente pero sin integración
- **TODO**:
  - 🔄 Crear endpoint que reciba venta_ids, vehiculo_id
  - 🔄 Llamar a servicio de optimización
  - 🔄 Retornar sugerencia de orden

**Endpoint Esperado**:
```http
POST /api/entregas/optimizar
Content-Type: application/json

{
  "venta_ids": [1, 2, 3, 4, 5],
  "vehiculo_id": 5,
  "chofer_id": 3
}

Response 200:
{
  "sugerencia": {
    "orden_sugerido": [1, 3, 5, 2, 4],
    "distancia_total_km": 45.3,
    "tiempo_estimado_minutos": 120,
    "peso_total_kg": 125.5,
    "ahorro_vs_original": {
      "distancia_km": 12.5,
      "tiempo_minutos": 25
    },
    "paradas": [
      {
        "numero": 1,
        "venta_id": 1,
        "cliente": "Cliente A",
        "direccion": "Calle X",
        "distancia_desde_anterior_km": 0,
        "tiempo_acumulado_minutos": 5
      }
    ]
  }
}
```

---

### 2️⃣ HOOKS & SERVICIOS (Frontend)

**Status**: Parcialmente implementados

#### 2.1 useEntregaBatch Hook
- **Archivo**: `resources/js/application/hooks/use-entrega-batch.ts` (sin tracking)
- **Estado**: Existe pero necesita validación
- **TODO**:
  - ✅ Gestionar estado de formulario batch
  - ✅ HandleSubmit para crear entregas
  - ✅ obtenerPreview para optimización
  - ⚠️ Validar que retorna los valores correctos
  - ⚠️ Manejar errores correctamente
  - ⚠️ Sincronizar con selectedVentaIds

**Hook Esperado**:
```typescript
const {
  formData,           // { vehiculo_id, chofer_id, optimizar }
  isLoading,          // boolean
  isSubmitting,       // boolean
  preview,            // { sugerencia, ... }
  previewError,       // string | null
  submitError,        // string | null
  successMessage,     // string | null
  updateFormData,     // (partial) => void
  obtenerPreview,     // () => Promise<void>
  handleSubmit,       // () => Promise<void>
} = useEntregaBatch();
```

#### 2.2 optimizacion-entregas.service.ts
- **Archivo**: `resources/js/application/services/optimizacion-entregas.service.ts` (sin tracking)
- **Estado**: Existe pero necesita validación
- **TODO**:
  - ✅ Servicio que llama a endpoints API
  - ✅ Manejo de errores
  - ✅ Transformación de respuestas

---

### 3️⃣ COMPONENTES (Frontend)

**Status**: Parcialmente implementados

#### 3.1 BatchVehiculoAssignment.tsx
- **Archivo**: `resources/js/presentation/pages/logistica/entregas/components/BatchVehiculoAssignment.tsx` (sin tracking)
- **Estado**: Existe pero sin tracking
- **TODO**:
  - ✅ Validar que está integrado en CreateEntregasUnificado
  - ✅ Probar selectores de vehículo y chofer
  - ✅ Validar que actualiza formData correctamente

#### 3.2 BatchVentaSelector.tsx
- **Archivo**: `resources/js/presentation/pages/logistica/entregas/components/BatchVentaSelector.tsx` (sin tracking)
- **Estado**: Existe pero sin tracking
- **TODO**:
  - ✅ Ya integrado en CreateEntregasUnificado
  - ✅ Validar resumen de selección
  - ✅ Probar búsqueda y filtros

#### 3.3 BatchOptimizationResult.tsx
- **Archivo**: `resources/js/presentation/pages/logistica/entregas/components/BatchOptimizationResult.tsx` (sin tracking)
- **Estado**: Existe pero sin tracking
- **TODO**:
  - ⚠️ Validar que muestra preview correctamente
  - ⚠️ Mostrar orden sugerido
  - ⚠️ Mostrar ahorro de distancia/tiempo
  - ⚠️ Permitir aceptar o rechazar sugerencia

---

### 4️⃣ SERVICIOS BACKEND (Lógica de Negocio)

**Status**: Parcialmente implementados

#### 4.1 EntregaService.php
- **Archivo**: `app/Services/Logistica/EntregaService.php`
- **Estado**: Existe pero necesita revisión
- **TODO**:
  - ⚠️ Validar métodos createEntrega()
  - ⚠️ Validar métodos createBatch()
  - ⚠️ Validar actualizaciones de estado

#### 4.2 AdvancedVRPService.php (Vehicle Routing Problem)
- **Archivo**: `app/Services/Logistica/AdvancedVRPService.php` (sin tracking)
- **Estado**: Implementación existente
- **TODO**:
  - 🔄 Integrar con optimización
  - 🔄 Validar algoritmo de clustering
  - 🔄 Validar cálculos de distancia

#### 4.3 GeoClusteringService.php
- **Archivo**: `app/Services/Logistica/GeoClusteringService.php` (sin tracking)
- **Estado**: Implementación existente
- **TODO**:
  - 🔄 Agrupar entregas por zona
  - 🔄 Calcular distancias

#### 4.4 DeliveryTimePredictionService.php
- **Archivo**: `app/Services/Logistica/DeliveryTimePredictionService.php` (sin tracking)
- **Estado**: Implementación existente
- **TODO**:
  - 🔄 Predecir tiempo de entrega
  - 🔄 Considerar hora del día, tráfico

#### 4.5 DynamicRebalancerService.php
- **Archivo**: `app/Services/Logistica/DynamicRebalancerService.php` (sin tracking)
- **Estado**: Implementación existente
- **TODO**:
  - 🔄 Rebalancear entregas si hay cancelación
  - 🔄 Redistribuir carga

---

### 5️⃣ REQUEST & VALIDATION

#### 5.1 CrearEntregasBatchRequest.php
- **Archivo**: `app/Http/Requests/CrearEntregasBatchRequest.php` (sin tracking)
- **Estado**: Existe pero sin integración
- **TODO**:
  - ⚠️ Validar rules()
  - ⚠️ Validar authorize()
  - ⚠️ Mensajes de validación en español

---

### 6️⃣ RUTAS

#### 6.1 Rutas API
- **Archivo**: `routes/api.php`
- **Estado**: Modificado, necesita completarse
- **TODO**:
  - ⚠️ POST /api/entregas
  - ⚠️ POST /api/entregas/batch
  - ⚠️ POST /api/entregas/optimizar
  - ⚠️ Validar que están en el namespace correcto

#### 6.2 Rutas Web
- **Archivo**: `routes/web.php`
- **Estado**: Modificado
- **TODO**:
  - ✅ GET /logistica/entregas/create → CreateEntregasUnificado

---

## 🧪 TESTING NECESARIO

### 6.1 Testing de Endpoints (PHPUnit)
```
POST /api/entregas
├─ ✅ Crear entrega simple
├─ ⚠️ Validación de capacidad
├─ ⚠️ Validación de venta disponible
└─ ⚠️ Errores y edge cases

POST /api/entregas/batch
├─ ⚠️ Crear múltiples entregas
├─ ⚠️ Transacción (todo o nada)
└─ ⚠️ Actualizar estados

POST /api/entregas/optimizar
├─ ⚠️ Calcular optimización
├─ ⚠️ Retornar orden sugerido
└─ ⚠️ Performance con muchas entregas
```

### 6.2 Testing E2E (Cypress/Playwright)
```
Flujo Completo:
├─ ⚠️ Seleccionar venta
├─ ⚠️ Llenar formulario
├─ ⚠️ Crear entrega
├─ ⚠️ Ver confirmación
└─ ⚠️ Verificar en BD
```

### 6.3 Testing de Optimización
```
VRP Algorithm:
├─ ⚠️ Calcular ruta óptima
├─ ⚠️ Validar distancias
└─ ⚠️ Performance test (100+ entregas)
```

---

## 📈 PRIORIDADES

### 🔴 CRÍTICO (Debe estar en sprint)
1. Validar POST /api/entregas (crear simple)
   - Responsable: Backend
   - Estimado: 3-4 horas
   - Blocker para: SimpleEntregaForm

2. Validar POST /api/entregas/batch (crear lote)
   - Responsable: Backend
   - Estimado: 4-5 horas
   - Blocker para: BatchUI

3. Validar useEntregaBatch hook
   - Responsable: Frontend
   - Estimado: 2-3 horas
   - Blocker para: Batch UI submit

### 🟡 ALTO (Próximo sprint)
4. Implementar POST /api/entregas/optimizar
   - Responsable: Backend + Frontend
   - Estimado: 6-8 horas
   - Enhancement: Optimización de rutas

5. Testing E2E completo
   - Responsable: QA
   - Estimado: 4-5 horas
   - Validación: Flujos reales

### 🟢 MEDIO (Siguiente)
6. Performance optimization (100+ entregas)
7. Caching de optimización
8. Webhooks para actualizaciones en tiempo real

---

## 🛠️ CHECKLIST POR FASE

### Antes de Empezar Sprint
- [ ] Revisar archivos sin tracking
- [ ] Validar que endpoints existen en API
- [ ] Revisar hook useEntregaBatch
- [ ] Plannear testing strategy

### Durante el Sprint
- [ ] Completar endpoints POST /api/entregas
- [ ] Completar endpoints POST /api/entregas/batch
- [ ] Integrar y validar useEntregaBatch
- [ ] Testing de cada endpoint
- [ ] Testing E2E de flujos

### Antes de Merge
- [ ] Todos los tests pasando
- [ ] Code review
- [ ] Validación en staging
- [ ] Documentation actualizada

### Antes de Deploy
- [ ] QA final
- [ ] Performance testing
- [ ] Security review
- [ ] Rollback plan listo

---

## 📊 ESTIMACIONES

| Tarea | Horas | Prioridad |
|-------|-------|-----------|
| Validar POST /api/entregas | 3-4 | 🔴 |
| Validar POST /api/entregas/batch | 4-5 | 🔴 |
| Validar useEntregaBatch | 2-3 | 🔴 |
| Implementar optimización | 6-8 | 🟡 |
| Testing E2E | 4-5 | 🟡 |
| Bug fixes & Polish | 3-4 | 🟢 |
| **TOTAL ESTIMADO** | **23-29 horas** | |
| **SPRINT (1 semana)** | **40 horas** | |

---

## 🎯 DEFINICIÓN DE DONE

- ✅ Todos los endpoints validados
- ✅ useEntregaBatch integrado
- ✅ Testing E2E pasando
- ✅ Documentación actualizada
- ✅ Code review aprobado
- ✅ Listo para deploy a staging
- ✅ Performance < 500ms para request API

---

## 📝 NOTAS

1. **Archivos sin tracking**: Muchos archivos ya existen en el repo pero no están en tracking. Revisar y decidir si usar como están o reescribir.

2. **Servicios existentes**: Los servicios de optimización (AdvancedVRPService, GeoClusteringService, etc.) ya existen. Validar si están completos.

3. **API vs UI**: El layout UI está 100% completo. La prioridad del siguiente sprint es completar la API backend.

4. **Testing**: Es crítico hacer testing E2E para validar que el flujo completo funciona.

---

## 🚀 Siguiente Sesión

**Punto de Partida**:
- Revisar y validar archivos sin tracking
- Decidir: ¿Reutilizar código existente o reescribir?
- Crear tickets en el backlog
- Asignar equipo (backend/frontend)

**Estimado**: 2-3 semanas para Fase 3 completa
