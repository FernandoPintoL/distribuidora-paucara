# Dominio de Módulos - Arquitectura 3 Capas

Este directorio contiene la **Capa de Lógica de Negocio** del dominio de Módulos Sidebar.

## 📊 Flujo de Arquitectura 3 Capas

```
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 1: PRESENTACIÓN (Interfaz de Usuario)                      │
│ resources/js/presentation/pages/ModulosSidebar/Index.tsx        │
│                                                                   │
│ • Componentes React                                              │
│ • Estado de UI (filtros, modales, vistas)                       │
│ • Manejo de eventos del usuario                                 │
│ ✓ Solo llamadas a capa de Lógica de Negocio                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 2: LÓGICA DE NEGOCIO (domain/modulos/)                     │
│                                                                   │
│ 📁 types.ts                                                      │
│    └─ Interfaces y tipos (ModuloSidebar, FiltrosModulo, etc.)  │
│                                                                   │
│ 🔧 services.ts                                                   │
│    └─ Métodos de negocio con side effects (API calls)           │
│    └─ alternarEstadoModulo()                                    │
│    └─ guardarOrdenModulos()                                     │
│    └─ obtenerPermisosDisponibles()                              │
│                                                                   │
│ 🎣 hooks.ts                                                      │
│    └─ Hooks de transformación de datos (sin side effects)       │
│    └─ useFiltrarModulos()                                       │
│    └─ useExtraerDatos()                                         │
│    └─ useModulosPadre()                                         │
│                                                                   │
│ ✓ Encapsula toda la lógica                                      │
│ ✓ Reutilizable en múltiples componentes                         │
│ ✓ Fácil de testear                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 3: DATOS (services/modulos-api.ts)                         │
│                                                                   │
│ • Llamadas HTTP a la API backend                                │
│ • fetch() / Inertia.patch() / Inertia.post()                   │
│ • CSRF token management                                         │
│ ✓ Solo comunicación con backend                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │   Backend    │
                    │  API REST    │
                    │   Laravel    │
                    └──────────────┘
```

## 📁 Estructura de Archivos

```
domain/modulos/
├── types.ts                  # ✅ Tipos TypeScript centralizados
├── services.ts               # 🔧 Lógica de negocio (con side effects)
├── hooks.ts                  # 🎣 Lógica de transformación (sin side effects)
└── README.md                 # 📖 Este archivo
```

## 🎯 Responsabilidades de Cada Capa

### 1. **Capa de Presentación** (Index.tsx)
```typescript
// ✅ CORRECTO: Solo llama a servicios de negocio
const toggleActivo = async (modulo: ModuloSidebar) => {
    await modulosService.alternarEstadoModulo(modulo);
};

// ✅ CORRECTO: Usa hooks para transformación de datos
const modulosFiltrados = useFiltrarModulos(modulos, filtros);
const { categorias, rolesDisponibles } = useExtraerDatos(modulos);
```

### 2. **Capa de Lógica de Negocio** (services.ts + hooks.ts)

**services.ts** - Métodos con side effects:
```typescript
// Encapsula lógica de negocio + llamadas a API
export const modulosService = {
    alternarEstadoModulo: (modulo) => {
        // Lógica de negocio
        // Llamadas a API
        return modulosApi.toggleActivo(modulo.id);
    },
    guardarOrdenModulos: (orden) => {
        // Validaciones de negocio
        // Llamadas a API
        return modulosApi.guardarOrden(orden);
    }
};
```

**hooks.ts** - Funciones puras (sin side effects):
```typescript
// Lógica pura de transformación
export function useFiltrarModulos(modulos, filtros) {
    return useMemo(() => {
        // Solo transformación de datos
        // SIN llamadas a API
        // SIN efectos secundarios
        return modulos.filter(...);
    }, [modulos, filtros]);
}
```

### 3. **Capa de Datos** (services/modulos-api.ts)
```typescript
// Solo comunicación con API
export const modulosApi = {
    toggleActivo: (id) => router.patch(`/modulos-sidebar/${id}/toggle-activo`),
    guardarOrden: (orden) => router.post('/modulos-sidebar/actualizar-orden', ...),
};
```

## 🔄 Flujo de Datos Completo

### Ejemplo: Cambiar estado de un módulo

1. **Usuario hace clic** en botón "Activo/Inactivo" (Presentación)
   ```typescript
   <Button onClick={() => toggleActivo(modulo)} />
   ```

2. **Presentación llama a servicio de negocio**
   ```typescript
   const toggleActivo = async (modulo) => {
       await modulosService.alternarEstadoModulo(modulo);
   };
   ```

3. **Servicio de negocio valida y llama a API**
   ```typescript
   alternarEstadoModulo: (modulo) => {
       // Validación de negocio
       if (!modulo) throw new Error(...);

       // Llama a capa de datos
       return modulosApi.toggleActivo(modulo.id);
   }
   ```

4. **Capa de datos hace llamada HTTP**
   ```typescript
   toggleActivo: (id) => router.patch(`/modulos-sidebar/${id}/toggle-activo`)
   ```

5. **Backend procesa y retorna respuesta**
   ```
   HTTP PATCH /modulos-sidebar/1/toggle-activo
   ↓
   ModuloSidebarController@toggleActivo
   ↓
   Actualiza en base de datos
   ↓
   Retorna JSON response
   ```

## ✅ Ventajas de Esta Arquitectura

| Aspecto | Ventaja |
|---------|---------|
| **Separación de responsabilidades** | Cada capa tiene una única razón de cambio |
| **Testabilidad** | Hooks puro son fáciles de testear sin mocking |
| **Reusabilidad** | Hooks y servicios se reutilizan en otros componentes |
| **Mantenibilidad** | Código organizado y predecible |
| **Escalabilidad** | Fácil agregar nuevas funcionalidades |
| **Debugging** | Errores localizados en una capa específica |

## 🚫 Lo que NO DEBE HACERSE

```typescript
// ❌ MALO: Index.tsx llama directamente a API
const toggleActivo = async (modulo) => {
    await fetch(`/modulos-sidebar/${modulo.id}/toggle-activo`, ...);
};

// ❌ MALO: servicios.ts ignora modulosService
import { modulosApi } from '@/services/modulos-api';

// ❌ MALO: Lógica de negocio dispersa en componentes
const modulos = useMemo(() => {
    return data.filter(m => m.estado === 'activo');
}, [data]);
```

## ✅ Lo que SÍ DEBE HACERSE

```typescript
// ✅ BUENO: Presentación usa servicios
const toggleActivo = async (modulo) => {
    await modulosService.alternarEstadoModulo(modulo);
};

// ✅ BUENO: Servicios encapsulan lógica + API
export const modulosService = {
    alternarEstadoModulo: (modulo) => modulosApi.toggleActivo(modulo.id)
};

// ✅ BUENO: Lógica de negocio en una capa
const modulosActivos = useFiltrarModulosActivos(modulos);
```

## 📚 Referencias

- **Dominio**: `domain/modulos/` (este directorio)
- **Servicios de API**: `services/modulos-api.ts`
- **Presentación**: `presentation/pages/ModulosSidebar/Index.tsx`
- **Componentes**: `presentation/components/`

## 🔗 Ejemplo Completo

Ver `Index.tsx` para ver cómo:
- ✅ Importa de la capa de lógica de negocio
- ✅ Usa servicios para operaciones que tocan API
- ✅ Usa hooks para transformación de datos
- ✅ Delega responsabilidades correctamente
