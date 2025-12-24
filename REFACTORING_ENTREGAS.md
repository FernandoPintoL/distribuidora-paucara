# Refactorización: CreateEntregasUnificado - Arquitectura Limpia

## Estado: ✅ COMPLETADO - INCLUYE REFACTORIZACIÓN DE SimpleEntregaForm

### Cambios Realizados

#### 1. **Creación del Servicio en Infrastructure** ✅
**Archivo**: `infrastructure/services/entregas.service.ts`

```typescript
export class EntregasService extends GenericService<Entrega, EntregaFormData> {
  storeUrl() {
    return Controllers.EntregaController.store['/logistica/entregas']().url;
  }
  // ... más métodos de URL y validación
}
```

**Responsabilidad**:
- Generar URLs para operaciones CRUD
- Validar datos de formulario
- Formatear estados y respuestas

---

#### 2. **Corrección: Eliminación de Fetch Directo** ✅
**Antes** (❌ Incorrecto - lógica en presentación):
```typescript
const handleSubmitSimple = async (data: any) => {
    const response = await fetch('/api/entregas', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};
```

**Ahora** (✅ Correcto - usa Inertia.js):
```typescript
const handleSubmitSimple = async (data: any) => {
    router.post('/logistica/entregas', data, {
        onSuccess: () => { /* ... */ },
        onError: (errors) => { /* ... */ }
    });
};
```

**Ventajas**:
- Usa Inertia.js para navegación consistente
- Manejo automático de CSRF tokens
- Mejor integración con el backend
- Respeta la arquitectura del proyecto

---

#### 3. **Documentación de Arquitectura en el Componente** ✅
```typescript
/**
 * ARQUITECTURA LIMPIA - Responsabilidades por capa:
 *
 * ✅ PRESENTACIÓN: UI layout, delegación a hooks
 * ✅ APPLICATION: Lógica de negocio en hooks
 * ✅ INFRASTRUCTURE: URLs y operaciones HTTP en servicios
 * ✅ DOMAIN: Tipos sin lógica
 */
```

---

### Estructura Actual de Entregas

```
DOMAIN (Tipos puros)
  └─ entregas.ts
     ├─ Entrega (interfaz)
     ├─ EntregaFormData (formulario)
     ├─ VentaConDetalles
     ├─ VehiculoCompleto
     └─ ChoferEntrega

APPLICATION (Lógica de negocio)
  └─ hooks/
     ├─ use-entregas-create.ts ✅
     │  ├─ Validación de formulario
     │  ├─ Historial de choferes
     │  ├─ Manejo de Inertia.js
     │  └─ Transformación de datos
     │
     └─ use-entrega-batch.ts ✅
        ├─ Selección de múltiples ventas
        ├─ Cálculo de totales y pesos
        ├─ Obtener preview de optimización
        └─ Crear lote de entregas

INFRASTRUCTURE (Servicios HTTP)
  └─ services/
     ├─ entregas.service.ts ✅ (NUEVO)
     │  ├─ storeUrl() → Guardar entrega
     │  ├─ createUrl() → Ir a crear
     │  ├─ indexUrl() → Ir a listado
     │  ├─ validateData() → Validar
     │  └─ formatEstado() → Formato para UI
     │
     └─ logistica.service.ts ✅
        ├─ obtenerEntregasAsignadas()
        ├─ asignarEntrega()
        └─ Operaciones complejas

PRESENTATION (Componentes React)
  └─ pages/logistica/entregas/
     ├─ create.tsx (Página)
     │  └─ Usa CreateEntregasUnificado
     │
     └─ components/
        ├─ CreateEntregasUnificado.tsx ✅ (REFACTORIZADO)
        │  ├─ Delegación a hooks
        │  ├─ Usa router.post() para entregas simples
        │  ├─ Usa useEntregaBatch para lotes
        │  └─ Layout dinámico
        │
        ├─ SimpleEntregaForm.tsx
        │  └─ Formulario para 1 venta
        │
        ├─ BatchVentaSelector.tsx
        │  └─ Selector múltiple de ventas
        │
        └─ BatchOptimizationResult.tsx
           └─ Mostrar preview de rutas optimizadas
```

---

### Flujo Correcto Ahora

#### Para 1 Entrega (Modo Simple)
```
CreateEntregasUnificado
  └─ Renderiza SimpleEntregaForm
     └─ handleSubmitSimple()
        └─ router.post('/logistica/entregas', data)
           └─ Backend procesa y redirige
```

#### Para 2+ Entregas (Modo Batch)
```
CreateEntregasUnificado
  └─ Usa useEntregaBatch hook
     ├─ updateFormData() → actualiza estado local
     ├─ obtenerPreview()
     │  └─ optimizacionEntregasService.obtenerPreview()
     │
     └─ handleSubmit()
        └─ optimizacionEntregasService.crearLote()
           └─ Backend procesa y redirige
```

---

#### 4. **Creación del Hook para SimpleEntregaForm** ✅
**Archivo**: `application/hooks/use-simple-entrega-form.ts`

```typescript
export const useSimpleEntregaForm = (
    venta: VentaConDetalles,
    vehiculos: VehiculoCompleto[],
    choferes: ChoferEntrega[]
): UseSimpleEntregaFormReturn => {
    // Gestiona: estado, validación, transformación a SelectOptions
    // Retorna: formData, handlers, opciones para SearchSelect
};
```

**Responsabilidades**:
- Validación compleja (capacidad, fechas, campos)
- Transformación de datos a SelectOptions
- Limpieza automática de errores al editar

---

#### 5. **Refactorización de SimpleEntregaForm** ✅
**Antes** (❌ Problemas):
- Lógica de validación mezclada con UI
- Usa `<select>` nativo (sin búsqueda)
- Define `EntregaFormData` localmente
- Gestiona estado directamente

**Ahora** (✅ Correcto):
- Solo renderiza UI
- Delega al hook `use-simple-entrega-form.ts`
- Usa `SearchSelect` con búsqueda
- Importa `EntregaFormData` de domain
- Validación mediante hook

```typescript
// ✅ CORRECTO - Presentación pura
const {
    formData,
    errors,
    vehiculosOptions,  // ← Transformado por hook
    choferesOptions,   // ← Transformado por hook
    handleVehiculoSelect,  // ← Delegado al hook
    handleChoferSelect,    // ← Delegado al hook
    isFormValid,
    validate,
} = useSimpleEntregaForm(venta, vehiculos, choferes);

// Renderiza SearchSelect en lugar de <select>
<SearchSelect
    label="Vehículo"
    placeholder="Buscar vehículo..."
    value={formData.vehiculo_id ?? ''}
    options={vehiculosOptions}
    onChange={handleVehiculoSelect}
    error={errors.vehiculo_id}
    required
/>
```

---

### Archivos Modificados

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `infrastructure/services/entregas.service.ts` | ✨ Creado | Nuevo |
| `application/hooks/use-simple-entrega-form.ts` | ✨ Creado | Nuevo |
| `presentation/pages/logistica/entregas/components/CreateEntregasUnificado.tsx` | 🔧 Refactorizado | Mejorado |
| `presentation/pages/logistica/entregas/components/SimpleEntregaForm.tsx` | 🔧 Refactorizado | Mejorado |
| `presentation/pages/logistica/entregas/components/create.tsx` | ✅ Correcto | Sin cambios |
| `application/hooks/use-entregas-create.ts` | ✅ Correcto | Sin cambios |
| `application/hooks/use-entrega-batch.ts` | ✅ Correcto | Sin cambios |
| `domain/entities/entregas.ts` | ✅ Correcto | Sin cambios |

---

### Validación de Arquitectura ✅

- [x] Domain contiene solo tipos
- [x] Application contiene lógica de negocio en hooks
- [x] Infrastructure contiene servicios HTTP
- [x] Presentation contiene componentes UI
- [x] No hay fetch() directo en componentes
- [x] Usa Inertia.js para navegación
- [x] Tipos importados de domain
- [x] Servicios en singleton para reutilización

---

### Cómo Usar

#### Para crear una entrega simple:
```typescript
<CreateEntregasUnificado
  ventas={ventas}
  vehiculos={vehiculos}
  choferes={choferes}
  ventaPreseleccionada={1}
  onCancel={() => router.visit('/logistica/entregas')}
/>
```

#### Para crear entregas en lote:
```typescript
<CreateEntregasUnificado
  ventas={ventas}
  vehiculos={vehiculos}
  choferes={choferes}
  onCancel={() => router.visit('/logistica/entregas')}
/>
// El usuario selecciona múltiples ventas desde la UI
```

---

### Próximos Pasos (Opcionales)

Si quieres mejorar más:

1. **Crear hook unificado**:
   - `use-entregas-create-unified.ts` que combine ambas lógicas

2. **Mejorar validación**:
   - Mover validaciones complejas a servicios

3. **Agregar notificaciones**:
   - Usar NotificationService en los hooks

4. **Mejorar manejo de errores**:
   - ErrorBoundary para el componente
   - Manejo específico de errores HTTP

---

## Conclusión

El componente `CreateEntregasUnificado` ahora sigue correctamente la **Arquitectura Limpia**:

- ✅ **Presentación**: Solo UI y delegación
- ✅ **Application**: Lógica en hooks
- ✅ **Infrastructure**: HTTP en servicios
- ✅ **Domain**: Tipos puros

Esto hace el código:
- Más mantenible
- Más testeable
- Más reutilizable
- Más consistente con el resto del proyecto
