# Análisis de Arquitectura 3 Capas: ModulosSidebar/Index.tsx

## 📊 Estructura Actual vs Óptima

### ✅ LO QUE ESTÁ BIEN

#### Capa 1: Presentación (UI)
```
✅ Separación clara de componentes:
  - UI primitivos: Button, Input, Label, Select (correctos)
  - Componentes compuestos: Card, Dialog, Table (correctos)
  - Componentes específicos del dominio:
    ├─ PermisosMultiSelect ✅
    ├─ MatrizAccesoRol ✅
    ├─ ModulosFiltros ✅
    ├─ ModulosVistaAgrupada ✅
    ├─ ModulosListaArrastrables ✅
    └─ SidebarPreview ✅

✅ Estructura de carpetas correcta:
  resources/js/presentation/
  ├─ components/        (Componentes puros)
  │  ├─ ui/            (Primitivos: Button, Input, etc.)
  │  ├─ forms/         (Formularios: PermisosMultiSelect)
  │  └─ (otros)        (Dominio específico)
  └─ pages/            (Contenedores/Smart Components) ✅
```

#### Capa 2: Lógica de Negocio (Servicios/Hooks)
```
✅ Estado bien organizado:
  - filtros: FiltrosModulo (estado local correcto)
  - vistaActual: 'tabla' | 'agrupada' | 'lista' (estado local correcto)
  - guardandoOrden: boolean (estado local correcto)

✅ Transformaciones de datos con useMemo:
  - modulosFiltrados: Usa useMemo para optimizar ✅
  - categorias: Extracción dinámica ✅
  - rolesDisponibles: Extracción dinámica ✅

✅ Handlers bien separados:
  - handleCreate: Crea módulo
  - handleEdit: Edita módulo
  - handleDelete: Elimina módulo
  - toggleActivo: Cambia estado
  - handleGuardarOrden: Guarda orden
  - openEditModal: Abre modal
```

#### Capa 3: Datos (API/Backend)
```
✅ Integración con API clara:
  - POST /modulos-sidebar (create)
  - PUT /modulos-sidebar/{id} (update)
  - DELETE /modulos-sidebar/{id} (delete)
  - PATCH /modulos-sidebar/{id}/toggle-activo (toggle)
  - POST /modulos-sidebar/actualizar-orden (reorder)
  - GET /api/modulos-sidebar/permisos/disponibles (fetch permisos)
  - GET /api/modulos-sidebar/matriz-acceso (fetch matriz)
  - GET /api/modulos-sidebar/roles (fetch roles)
  - GET /api/modulos-sidebar/preview/{rolName} (fetch preview)

✅ Uso correcto de Inertia.useForm():
  - post(), put(), delete() para operaciones
  - Manejo automático de CSRF
```

---

## 🔴 PROBLEMAS IDENTIFICADOS

### Problema 1: Lógica de API mezclada con Presentación
```typescript
// ❌ MALO: Fetch directo en el componente
const toggleActivo = (modulo: ModuloSidebar) => {
    fetch(`/modulos-sidebar/${modulo.id}/toggle-activo`, {
        method: 'PATCH',
        headers: { ... },
    })
        .then(() => {
            window.location.reload();  // ❌ Recarga la página
        })
};

// ✅ MEJOR: Extraer a hook o servicio
// O usar Inertia.patch() como en handleCreate
```

**Impacto**:
- Mezcla de responsabilidades
- Difícil de testear
- Efecto secundario fuerte (reload)

---

### Problema 2: CSRF Token Duplicado
```typescript
// ❌ Se repite en 2 lugares:
// 1. toggleActivo (línea 116)
// 2. handleGuardarOrden (línea 134)

const csrfToken = document.querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content') || '';

// ✅ MEJOR: Crear un servicio o hook
```

**Impacto**:
- Código duplicado
- Difícil de mantener
- Violación del principio DRY

---

### Problema 3: fetch() vs Inertia.useForm()
```typescript
// ❌ Inconsistencia: Usa dos métodos diferentes
// Inertia.useForm() para create/edit/delete:
post('/modulos-sidebar', { ... })
put(`/modulos-sidebar/${selectedModulo.id}`, { ... })
destroy(`/modulos-sidebar/${modulo.id}`, { ... })

// fetch() para toggle y actualizar orden:
fetch(`/modulos-sidebar/${modulo.id}/toggle-activo`, { ... })
fetch('/modulos-sidebar/actualizar-orden', { ... })

// ✅ MEJOR: Usar Inertia.patch() para todo
```

**Impacto**:
- Inconsistencia en patrones
- Confunde otros desarrolladores
- Difícil mantener

---

### Problema 4: Lógica de Filtrado en el Componente
```typescript
// ❌ Lógica compleja de filtrado (líneas 190-240)
const modulosFiltrados = useMemo(() => {
    return modulos.filter(modulo => {
        // 40+ líneas de lógica de negocio
        if (filtros.busqueda) { ... }
        if (filtros.tipo !== 'todos') { ... }
        if (filtros.estado !== 'todos') { ... }
        // etc...
    });
}, [modulos, filtros]);

// ✅ MEJOR: Extraer a una función/hook separada
```

**Impacto**:
- Componente difícil de leer (700+ líneas)
- Difícil de testear
- Mezcla de responsabilidades

---

### Problema 5: Extracción de Datos en el Componente
```typescript
// ❌ Extraer categorías y roles aquí
const categorias = Array.from(
    new Set(modulos.filter(m => m.categoria).map(m => m.categoria))
).sort();

const rolesDisponibles = Array.from(
    new Set(
        modulos
            .flatMap(m => m.permisos || [])
            .filter(p => typeof p === 'string')
    )
).sort();

// ✅ MEJOR: Backend devuelve esto en los props iniciales
```

**Impacto**:
- Lógica de datos en presentación
- Recalcula en cada render
- No usa la API que ya existe

---

### Problema 6: Archivo muy Grande
```
Index.tsx: ~800+ líneas
├─ Imports: 20 líneas ✅
├─ Interfaces: 20 líneas ✅
├─ Estado: 50 líneas (OK)
├─ Handlers: 100 líneas ✅
├─ Lógica de transformación: 100 líneas (debería estar en servicio)
└─ JSX/Presentación: 400+ líneas ✅

Total: TOO BIG ❌
```

**Recomendación**:
- Máximo 300-400 líneas
- Ahora: 800+ líneas

---

## 🏗️ ARQUITECTURA DE 3 CAPAS RECOMENDADA

### Estructura Propuesta:

```
resources/js/
├─ presentation/
│  ├─ pages/
│  │  └─ ModulosSidebar/
│  │     ├─ Index.tsx          (Smart Component - 300 líneas)
│  │     ├─ ModuloForm.tsx     (Modal Form - 150 líneas)
│  │     └─ types.ts           (Interfaces locales)
│  │
│  └─ components/
│     ├─ modulos-filtros.tsx    ✅ (Componente puro)
│     ├─ modulos-vista-tabla.tsx (Nuevo)
│     ├─ matriz-acceso-rol.tsx   ✅ (Componente puro)
│     └─ ... (otros)
│
├─ domain/                     (🆕 NUEVA CAPA)
│  ├─ modulos/
│  │  ├─ types.ts             (Modulo, FiltrosModulo, etc.)
│  │  ├─ services.ts          (Lógica de negocio)
│  │  └─ hooks.ts             (Custom hooks)
│  │
│  └─ (otros dominios)
│
└─ services/                   (🆕 NUEVA CAPA)
   ├─ api.ts                  (Funciones de API)
   ├─ http.ts                 (Cliente HTTP)
   └─ csrf.ts                 (Manejo de CSRF)
```

---

## 🎯 CAMBIOS RECOMENDADOS

### 1. Crear `domain/modulos/types.ts`
```typescript
// Centralizar tipos
export interface ModuloSidebar {
    id: number;
    titulo: string;
    ruta: string;
    // ... campos
}

export interface FiltrosModulo {
    busqueda: string;
    tipo: 'todos' | 'principal' | 'submenu';
    // ... filtros
}

export type VistaActual = 'tabla' | 'agrupada' | 'lista';
```

### 2. Crear `domain/modulos/hooks.ts`
```typescript
// Custom hooks para lógica reutilizable
export function useFiltrarModulos(modulos, filtros) {
    return useMemo(() => {
        return modulos.filter(m => {
            // Lógica de filtrado
        });
    }, [modulos, filtros]);
}

export function useExtraerDatos(modulos) {
    const categorias = useMemo(() => {
        // Extrae categorías
    }, [modulos]);

    const rolesDisponibles = useMemo(() => {
        // Extrae roles
    }, [modulos]);

    return { categorias, rolesDisponibles };
}
```

### 3. Crear `services/modulos-api.ts`
```typescript
// API calls en un lugar
export const modulosApi = {
    create: (data) => post('/modulos-sidebar', data),
    update: (id, data) => put(`/modulos-sidebar/${id}`, data),
    delete: (id) => destroy(`/modulos-sidebar/${id}`),
    toggleActivo: (id) => patch(`/modulos-sidebar/${id}/toggle-activo`),
    guardarOrden: (orden) => post('/modulos-sidebar/actualizar-orden', { modulos: orden }),
};
```

### 4. Crear `services/csrf.ts`
```typescript
// Gestión centralizada de CSRF
export function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') || '';
}

export function headers() {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),
    };
}
```

### 5. Simplificar Index.tsx
```typescript
export default function Index({ modulos, categorias, rolesDisponibles }: Props) {
    // Solo estado UI
    const [filtros, setFiltros] = useState<FiltrosModulo>(...);
    const [vistaActual, setVistaActual] = useState<VistaActual>('tabla');

    // Custom hooks para lógica
    const modulosFiltrados = useFiltrarModulos(modulos, filtros);

    // Handlers que usan API service
    const handleCreate = async (data) => {
        await modulosApi.create(data);
    };

    // Solo presentación
    return (
        <AppLayout>
            {/* JSX */}
        </AppLayout>
    );
}
```

---

## 📋 CHECKLIST DE MEJORA

### Prioridad Alta (Hazlo YA)
- [ ] Extraer tipos a `domain/modulos/types.ts`
- [ ] Crear `services/csrf.ts` para evitar duplicación
- [ ] Crear `domain/modulos/hooks.ts` para lógica de filtrado
- [ ] Reemplazar `fetch()` con Inertia.patch()
- [ ] Remover `window.location.reload()` (usar Inertia)

### Prioridad Media (Próxima semana)
- [ ] Crear `ModuloForm.tsx` separado
- [ ] Crear `services/modulos-api.ts`
- [ ] Remover extracción de datos (pasar desde backend)
- [ ] Reducir Index.tsx a ~300 líneas

### Prioridad Baja (Futuro)
- [ ] Tests unitarios para hooks
- [ ] Tests de integración para API
- [ ] Documentación de arquitectura
- [ ] Refactorizar vistas (tabla, agrupada, lista)

---

## 🎓 RESUMEN ACTUAL vs RECOMENDADO

| Aspecto | Actual | Recomendado | Impacto |
|---------|--------|------------|--------|
| **Líneas en Index.tsx** | 800+ | 300 | Mantenibilidad ↑ |
| **Separación de capas** | 60% | 100% | Testabilidad ↑ |
| **Duplicación de código** | CSRF × 2 | 1 lugar | DRY principle ↑ |
| **API calls inconsistentes** | fetch + Inertia | Solo Inertia | Consistencia ↑ |
| **Lógica en componente** | 40% | 5% | Reusabilidad ↑ |
| **Hooks personalizados** | 0 | 3-5 | Testabilidad ↑ |
| **Servicios de API** | Mixto | Centralizado | Mantenibilidad ↑ |

---

## 🚀 BENEFICIOS DE LA REFACTORIZACIÓN

✅ **Testabilidad**: Funciones puras se prueban fácil
✅ **Reusabilidad**: Hooks se usan en otros componentes
✅ **Mantenibilidad**: Código más organizado
✅ **Performance**: Mejor optimización con hooks
✅ **Escalabilidad**: Fácil agregar nuevas vistas
✅ **Consistencia**: Mismo patrón en toda la app

---

## 📝 SIGUIENTE PASO

Quieres que refactorice el código para seguir la estructura de 3 capas recomendada?

Priorizaría:
1. ✅ Extraer tipos a `domain/modulos/types.ts`
2. ✅ Crear `services/csrf.ts`
3. ✅ Crear `domain/modulos/hooks.ts` con `useFiltrarModulos()`
4. ✅ Reemplazar `fetch()` con Inertia.patch()

¿Vamos con esto? 🚀
