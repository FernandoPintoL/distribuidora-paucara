# SimpleEntregaForm - Refactorización a Arquitectura Limpia

## 📊 Resumen Ejecutivo

Se ha refactorizado **SimpleEntregaForm** para seguir correctamente la Arquitectura Limpia:

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| **Lógica** | En componente | En hook `use-simple-entrega-form.ts` |
| **Selects** | `<select>` nativo | `SearchSelect` con búsqueda |
| **Tipos** | `EntregaFormData` local | Importado de `domain/entities` |
| **Validación** | Mezclada en componente | Centralizada en hook |
| **Responsabilidad** | Componente "gordo" | Componente "delgado" (presentación) |

---

## 🏗️ Nueva Arquitectura

### 1. Application Layer - Hook

**Archivo**: `application/hooks/use-simple-entrega-form.ts`

```
Responsabilidades del Hook:
├─ Estado del formulario
├─ Validación de negocio
│  ├─ Validar vehículo seleccionado
│  ├─ Validar capacidad del vehículo
│  ├─ Validar fecha (debe ser futura)
│  └─ Validar dirección de entrega
├─ Transformación de datos
│  ├─ Convertir vehiculos[] → vehiculosOptions[]
│  └─ Convertir choferes[] → choferesOptions[]
└─ Handlers reutilizables
   ├─ handleFieldChange()
   ├─ handleVehiculoSelect()
   ├─ handleChoferSelect()
   └─ validate()
```

**Retorna**:
```typescript
{
  // Estado
  formData: EntregaFormData,
  errors: Record<string, string>,

  // Para SearchSelect
  vehiculosOptions: SelectOption[],
  choferesOptions: SelectOption[],

  // Valores calculados
  selectedVehiculo: VehiculoCompleto | undefined,
  pesoEstimado: number,
  capacidadInsuficiente: boolean,
  isFormValid: boolean,

  // Métodos
  validate: () => boolean,
  handleFieldChange: (field, value) => void,
  handleVehiculoSelect: (value) => void,
  handleChoferSelect: (value) => void,
  setErrors: (errors) => void,
}
```

---

### 2. Presentation Layer - Componente

**Archivo**: `presentation/pages/logistica/entregas/components/SimpleEntregaForm.tsx`

```
Responsabilidades del Componente:
├─ Renderizar UI
├─ Usar hook para lógica
├─ Mostrar errores
└─ Delegación a padre vía onSubmit()
```

**Cambios principales**:

#### Antes (❌):
```typescript
// ❌ Componente responsable de TODO
const [formData, setFormData] = useState<EntregaFormData>({ ... });
const [errors, setErrors] = useState({});

// Lógica mezclada en componente
const validate = (): boolean => { ... };
const handleSubmit = async (e) => { ... };

return (
    // ❌ <select> nativo sin búsqueda
    <select
        value={formData.vehiculo_id ?? ''}
        onChange={(e) => setFormData({ ... })}
    >
        {vehiculos.map(v => <option>{v.placa}</option>)}
    </select>
);
```

#### Ahora (✅):
```typescript
// ✅ Hook maneja toda la lógica
const {
    formData,
    errors,
    vehiculosOptions,      // Ya transformado
    choferesOptions,       // Ya transformado
    handleVehiculoSelect,  // Ya con validación
    handleChoferSelect,    // Ya con validación
    isFormValid,
    validate,
} = useSimpleEntregaForm(venta, vehiculos, choferes);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
        await onSubmit(formData);
    } catch (error) {
        console.error('Error:', error);
    }
};

return (
    // ✅ SearchSelect con búsqueda
    <SearchSelect
        label="Vehículo"
        placeholder="Buscar vehículo..."
        value={formData.vehiculo_id ?? ''}
        options={vehiculosOptions}
        onChange={handleVehiculoSelect}
        error={errors.vehiculo_id}
        required
        searchPlaceholder="Buscar por placa, marca o modelo..."
        allowClear
    />
);
```

---

## 🎯 Beneficios de la Refactorización

### 1. **Separación de Responsabilidades**
```
Antes: 1 componente con 200+ líneas
Ahora: 1 hook (aplicación) + 1 componente (presentación)

Componente:  ~130 líneas (solo UI)
Hook:        ~160 líneas (solo lógica)
```

### 2. **Mejor UX**
- ✅ Búsqueda en vehículos y choferes
- ✅ Descripción visible (marca, modelo, capacidad, email)
- ✅ Opción de limpiar selección
- ✅ Placeholders descriptivos

### 3. **Validación Mejorada**
- ✅ Validación de capacidad del vehículo
- ✅ Validación de fecha futura
- ✅ Validación de dirección obligatoria
- ✅ Limpieza automática de errores al editar

### 4. **Reutilizable**
El hook `use-simple-entrega-form` puede usarse en:
- Otros componentes de formulario de entregas
- Editores de entregas
- Validadores de entregas
- Generadores de formularios dinámicos

### 5. **Testeable**
- Hook: Se prueba sin React (lógica pura)
- Componente: Se prueba snapshot y comportamiento
- Separación clara de lógica y presentación

---

## 📝 Ejemplo de Uso

```typescript
import SimpleEntregaForm from '@/presentation/pages/logistica/entregas/components/SimpleEntregaForm';
import { router } from '@inertiajs/react';

export default function MiComponente({ venta, vehiculos, choferes }) {
    const handleSubmit = async (data: EntregaFormData) => {
        // Delegado al padre de CreateEntregasUnificado
        router.post('/logistica/entregas', data, {
            onSuccess: () => {
                // Redirige automáticamente
            }
        });
    };

    return (
        <SimpleEntregaForm
            venta={venta}
            vehiculos={vehiculos}
            choferes={choferes}
            onSubmit={handleSubmit}
            isLoading={false}
        />
    );
}
```

---

## 🔍 Comparativa de Arquitectura

### Antes (❌ Monolítico)
```
SimpleEntregaForm.tsx (Componente)
├─ Estado del formulario
├─ Validación
├─ Transformación de datos
├─ Manejo de errores
├─ Renderizado de UI
└─ onSubmit
```

### Ahora (✅ Separado)
```
use-simple-entrega-form.ts (Hook - Application Layer)
├─ Estado del formulario
├─ Validación
├─ Transformación de datos
├─ Manejo de errores
└─ Handlers

     ↓ (proporciona)

SimpleEntregaForm.tsx (Componente - Presentation Layer)
├─ Renderizado de UI
├─ SearchSelect con opciones del hook
└─ onSubmit delegado al padre
```

---

## 📦 Archivos Creados/Modificados

### ✨ Nuevos
- `application/hooks/use-simple-entrega-form.ts` (160 líneas)

### 🔧 Modificados
- `presentation/pages/logistica/entregas/components/SimpleEntregaForm.tsx`
  - Antes: 275 líneas (lógica + UI)
  - Ahora: 134 líneas (solo UI)
  - Cambio: -54% de código, +100% claridad

---

## 🎓 Lecciones Aprendidas

### 1. **Hooks de Application Layer**
Los hooks no son solo para manejo de estado. Son perfectos para:
- Encapsular lógica de negocio
- Transformar datos para componentes
- Validación compleja
- Reutilización de lógica

### 2. **SearchSelect vs Select**
SearchSelect es superior para:
- Listas largas (>10 elementos)
- Búsqueda necesaria
- Mejor accesibilidad
- Mejor UX en mobile

### 3. **Tipos desde Domain**
Importar tipos de `domain/entities`:
- Garantiza consistencia
- Evita duplicación
- Facilita cambios futuros
- Mejora la trazabilidad

---

## ✅ Checklist Final

- [x] Hook de application creado
- [x] Componente refactorizado
- [x] SearchSelect implementado
- [x] Validación mejorada
- [x] Tipos de domain usados correctamente
- [x] Documentación actualizada
- [x] Código comentado
- [x] Sigue estándares del proyecto

---

## 🚀 Próximos Pasos (Opcionales)

1. **Crear hook genérico** `use-search-select-field.ts`
   - Para reutilizar SearchSelect en otros formularios

2. **Agregar validación asíncrona**
   - Validar disponibilidad de chofer
   - Validar horario disponible

3. **Mejorar manejo de errores**
   - Mostrar errores de servidor
   - Manejo de timeout
   - Reintentos automáticos

4. **Tests**
   - Test del hook (lógica pura)
   - Test del componente (UI)
   - Test de integración

---

## 🎯 Conclusión

**SimpleEntregaForm** ahora sigue correctamente la Arquitectura Limpia del proyecto:

✅ **Presentación**: Solo renderiza, delega lógica
✅ **Application**: Hook con validación y transformación
✅ **Domain**: Tipos importados
✅ **UX**: SearchSelect con búsqueda
✅ **Mantenibilidad**: Código limpio y separado
✅ **Reutilización**: Hook puede usarse en otros lugares

El componente es ahora **testeable**, **mantenible** y **reutilizable**.
