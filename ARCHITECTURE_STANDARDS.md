# Estándares de Arquitectura Frontend - Distribuidora Paucara

## Convenciones de Nombres

### 1. Archivos y Carpetas

#### Servicios
- **Formato**: `{entidad}.service.ts` (kebab-case)
- **Ejemplo**: `tipoAjuste-inventario.service.ts` ❌ INCORRECTO
- **Correcto**: `tipo-ajuste-inventario.service.ts` ✅

#### Componentes
- **Archivos**: kebab-case para componentes funcionales
  - Ejemplo: `generic-crud-modal.tsx` ✅
  - Incorrecto: `GenericCrudModal.tsx` ❌
- **Carpetas de componentes**: PascalCase
  - Ejemplo: `Inventario/` ✅
  - Incorrecto: `inventario/` ❌

#### Páginas
- **Archivos**: kebab-case
  - Ejemplo: `tipos-ajuste-inventario.tsx` ✅
  - Incorrecto: `TiposAjusteInventario.tsx` ❌
- **Carpetas**: kebab-case
  - Ejemplo: `inventario/`, `tipos-ajuste/` ✅
  - Incorrecto: `Inventario/`, `TiposAjuste/` ❌

#### Configuración
- **Formato**: `{entidad}.config.ts` (kebab-case)
- **Ejemplo**: `tipo-ajuste-inventario.config.ts` ✅
- **Incorrecto**: `tipoAjusteConfig.ts` ❌

#### Hooks
- **Formato**: `use-{nombre}.ts` (kebab-case)
- **Ejemplo**: `use-generic-entities.ts` ✅
- **Incorrecto**: `useGenericEntities.ts` ❌

#### Tipos de Dominio
- **Archivos**: kebab-case
  - Ejemplo: `tipo-ajuste-inventario.ts` ✅
- **Interfaces**: PascalCase
  - Ejemplo: `export interface TipoAjusteInventario` ✅

### 2. Nombres de Importaciones

#### Servicios
```typescript
// ❌ INCORRECTO
import { TipoAjusteInventarioService } from '@/infrastructure/services/tipoAjusteInventario.service';

// ✅ CORRECTO
import tipoAjusteInventarioService from '@/infrastructure/services/tipo-ajuste-inventario.service';
```

#### Hooks
```typescript
// ❌ INCORRECTO
import { useTipoAjuste } from '@/application/hooks/useTipoAjuste';

// ✅ CORRECTO
import { useTipoAjuste } from '@/application/hooks/use-tipo-ajuste';
```

### 3. Variables y Constantes

- **Servicios**: camelCase (instancia única)
  - Ejemplo: `const tipoAjusteService = new TipoAjusteService();`
- **Constantes**: UPPER_SNAKE_CASE
  - Ejemplo: `const TIPO_AJUSTE_CONFIG = { ... };`

## Estructura de Carpetas

### Recomendado:
```
resources/js/
├── domain/entities/
│   ├── tipo-ajuste-inventario.ts
│   ├── tipo-merma.ts
│   └── estado-merma.ts
├── infrastructure/services/
│   ├── tipo-ajuste-inventario.service.ts
│   ├── tipo-merma.service.ts
│   └── estado-merma.service.ts
├── application/hooks/
│   └── use-tipo-ajuste.ts
├── presentation/
│   ├── components/
│   │   ├── Inventario/  (PascalCase para folder)
│   │   │   └── generic-crud-modal.tsx (kebab-case para archivos)
│   │   └── Generic/
│   │       └── generic-table.tsx
│   ├── pages/
│   │   ├── inventario/ (kebab-case)
│   │   │   ├── movimientos.tsx
│   │   │   └── tipos-ajuste-inventario.tsx
│   │   └── compras/
│   └── config/
│       └── modules/
│           └── tipo-ajuste-inventario.config.ts
└── config/
    └── modules/
        └── tipo-ajuste-inventario.config.ts
```

## Patrones Archirectónicos

### Servicios Consolidados
Todos los servicios deben:
1. Extender `GenericService` para Inertia.js
2. Proporcionar métodos HTTP directo para modales (`getAll()`, `create()`, `update()`, `remove()`)
3. Estar localizados en `infrastructure/services/`

### Nombres Consistentes
- Carpetas de componentes: PascalCase
- Archivos de componentes: kebab-case
- Nombres de servicios: {entidad}.service.ts
- Todos los demás archivos: kebab-case

## Componentes Generic vs Modern

### Análisis Actual
- **modern-table.tsx**: ✅ Componente genérico bien estructurado
- **generic-table.tsx**: ❌ Componente acoplado a lógica de productos

### Recomendación
Usar `modern-table.tsx` como patrón base y refactorear `generic-table.tsx` para seguir el mismo patrón.

## Organización de Hooks por Capa

### Actual
```
application/hooks/     (23 hooks)
├── use-auth.ts
├── use-filters.ts
├── use-form-with-validation.ts
├── use-generic-entities.ts
├── use-modal-form.ts
├── use-proforma-*.ts (5 archivos específicos)
└── use-table.ts

infrastructure/hooks/  (3 hooks)
├── use-api-search.ts
├── use-export.ts
└── use-google-maps.ts

presentation/hooks/    (2 hooks)
├── use-mobile-navigation.ts
└── use-search-select.ts
```

### Problemas Identificados
1. **Hooks de proforma muy específicos**: `use-proforma-filters`, `use-proforma-modals`, `use-proforma-stats` podrían consolidarse
2. **Distribución desbalanceada**: 23 en application vs 3 en infrastructure vs 2 en presentation
3. **Falta de subdirectories**: Los hooks de application deberían estar organizados por dominio (user, inventory, sales, etc.)

### Recomendación
Reorganizar application/hooks en subdirectories:
```
application/hooks/
├── common/
│   ├── use-auth.ts
│   ├── use-filters.ts
│   └── use-table.ts
├── forms/
│   ├── use-form-with-validation.ts
│   ├── use-generic-form.ts
│   └── use-modal-form.ts
├── inventory/
│   └── use-paginated-data.ts
├── sales/
│   ├── use-proforma-unified.ts (consolidado)
│   └── use-tracking.ts
└── notifications/
    └── use-realtime-notifications.ts
```

## Carpeta `actions/` - Análisis Detallado

### Propósito
La carpeta `actions/` contiene **definiciones type-safe de rutas** generadas automáticamente que reflejan la estructura del backend (Laravel). NO duplica infraestructura.

### Cómo se Genera

#### 1. **Plugin Vite: @laravel/vite-plugin-wayfinder**
En `vite.config.ts`:
```typescript
import { wayfinder } from '@laravel/vite-plugin-wayfinder';

export default defineConfig({
    plugins: [
        wayfinder({
            formVariants: true,
        }),
    ],
});
```

#### 2. **Comando Laravel Artisan**
Durante desarrollo o build:
```bash
php artisan wayfinder:generate
```

Este comando (generado por la librería Laravel Wayfinder) hace:
1. **Lee las rutas del backend** (`routes/*.php`)
2. **Introspecciona los Controllers** del backend
3. **Genera TypeScript** con definiciones type-safe en `/resources/js/actions/`
4. **Mantiene sincronía**: Los cambios en rutas backend → automáticos en `actions/`

#### 3. **Flujo de Generación**
```
Backend (Laravel)
    ↓
routes/*.php + Controllers
    ↓
php artisan wayfinder:generate
    ↓
TypeScript definitions in /resources/js/actions/
    ↓
Frontend (React)
```

### Patrón de Uso en Servicios
```typescript
// En GenericService
import Controllers from '@/actions/App/Http/Controllers';

indexUrl(params?: { query?: Filters }) {
    // Type-safe, auto-generado desde backend
    return Controllers.TipoAjusteInventarioController.index(params).url;
}
```

### Relación con Infraestructura
- ✅ **`actions/`**: Define URLs (auto-generado, sin lógica de negocio)
- ✅ **`infrastructure/services/`**: Contiene lógica CRUD, validaciones, transformaciones
- ✅ **NO es duplicación**: Son capas complementarias que se sincronizan automáticamente

### Ventajas Arquitectónicas
1. **Type-safe**: Las rutas son type-checked en compile-time
2. **Auto-sincronizado**: Se regenera automáticamente desde el backend
3. **Separación clara**: URLs ≠ Lógica de negocio
4. **DRY**: No hay strings mágicas de rutas, una única fuente de verdad en backend
5. **Error Prevention**: Cambios en rutas backend = errores en TypeScript

### Conclusión
✅ **Arquitectura CORRECTA**. No hay duplicación:
- `actions/` es la capa de **rutas type-safe** (generada automáticamente)
- `infrastructure/services/` es la capa de **lógica y CRUD**
- Ambas están sincronizadas automáticamente por Wayfinder

## Arquitectura de `/presentation` - Análisis

### Estructura General
```
presentation/
├── components/     (141 componentes)
│   ├── ui/                    ← Componentes base (button, card, dialog, etc.)
│   ├── generic/               ← Componentes reutilizables genéricos
│   ├── forms/                 ← Formularios
│   ├── {entidad}/             ← Componentes específicos por entidad
│   │   ├── {entidad}-container.tsx         (Orquestador principal)
│   │   ├── {entidad}-table.tsx             (Tabla de datos)
│   │   ├── {entidad}-search-bar.tsx        (Búsqueda)
│   │   ├── {entidad}-pagination.tsx        (Paginación)
│   │   ├── {entidad}-form-container.tsx    (Formulario)
│   │   └── {entidad}-form-fields.tsx       (Campos del form)
│   ├── maps/                  ← Componentes de mapas
│   ├── export/                ← Exportación de datos
│   └── dashboard/             ← Dashboard
├── pages/          (137 páginas)
│   ├── admin/                 ← Páginas administrativas
│   ├── auth/                  ← Autenticación
│   ├── {entidad}/             ← Páginas por entidad
│   │   ├── index.tsx          (Lista - usa container)
│   │   └── form.tsx           (Crear/Editar)
│   ├── compras/               ← Módulo de compras
│   ├── ventas/                ← Módulo de ventas
│   ├── inventario/            ← Módulo de inventario
│   └── logistica/             ← Módulo de logística
├── config/
│   ├── inventory.config.ts    (Configuraciones específicas)
│   └── modules/               (Configuraciones por módulo)
├── hooks/          (5 hooks UI-specific)
│   ├── use-mobile-navigation.ts
│   └── use-search-select.ts
└── layouts/
    ├── app-layout.tsx         (Layout principal)
    ├── auth-layout.tsx        (Layout de auth)
    └── settings-layout.tsx    (Layout de settings)
```

### DOS Patrones de Componentes

#### 1. **Patrón Específico (ANTIGUO - En transición)**
Componentes dedicados a una entidad:
```typescript
// /components/categorias/categorias-container.tsx
export default function CategoriasContainer() {
  const { categorias, isLoading } = useCategorias();
  return (
    <Card>
      <CategoriasSearchBar />
      <CategoriasTable data={categorias} />
      <CategoriasPagination />
    </Card>
  );
}
```

**Desventaja**: Duplicación de código (6+ archivos por entidad × 20+ entidades)

#### 2. **Patrón Genérico (NUEVO - Recomendado)**
Un componente reutilizable configurable:
```typescript
// /pages/almacenes/index.tsx
export default function AlmacenesIndex({ almacenes, filters }) {
  return (
    <AppLayout>
      <GenericContainer<Almacen, AlmacenFormData>
        entities={almacenes}
        filters={filters}
        config={almacenesConfig}         // ← Configuración
        service={almacenesService}        // ← Lógica
      />
    </AppLayout>
  );
}
```

**Ventajas**:
- ✅ DRY - Un componente para todas las entidades
- ✅ Consistencia UI
- ✅ Menos código
- ✅ Fácil de mantener

### Cómo Funciona GenericContainer

```
GenericContainer (genérico)
    ↓
    ├─→ Recibe: config + service + entities
    ├─→ Usa: useGenericEntities hook
    ├─→ Renderiza:
    │   ├─ ModernFilters (búsqueda, filtros)
    │   ├─ GenericTable (tabla de datos)
    │   ├─ GenericPagination (paginación)
    │   └─ CardView (alternativa a tabla)
    └─→ Delegación a config para renderizado específico
```

### Patrón de Configuración (ModuleConfig)

```typescript
// /config/modules/almacenes.config.ts
export const almacenesConfig: ModuleConfig<Almacen, AlmacenFormData> = {
  moduleName: 'almacenes',
  displayName: 'Almacenes',
  description: '...',

  // Configuración de tabla
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    // ...
  ],

  // Configuración de formulario
  formFields: [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true },
    // ...
  ],

  // Búsqueda
  searchableFields: ['nombre', 'codigo'],

  // Filtros avanzados
  indexFilters: {
    filters: [...],
    sortOptions: [...],
  },

  // Renderizado personalizado (opcional)
  cardRenderer: (almacen) => <AlmacenCard {...almacen} />,
  enableCardView: true,
};
```

### Estado de Migración

| Patrón | Componentes | Estado | Ejemplo |
|--------|-----------|--------|---------|
| **Específico (antiguo)** | ~60 | En transición | categorias, clientes, empleados |
| **Genérico (nuevo)** | ~10 | Activo | almacenes, marcas, monedas |
| **Modales CRUD** | ~3 | Nuevo | tipoMerma, estadoMerma |

### Recomendación: Plan de Migración

**Para nuevas entidades:**
```typescript
// ✅ Usar GenericContainer + ModuleConfig
<GenericContainer<Entidad, EntidadFormData>
  config={entidadConfig}
  service={entidadService}
  entities={entities}
/>
```

**Para entidades existentes:**
Gradualmente migrar de patrón específico a GenericContainer.

### Patrones de Layouts

```typescript
// App Layout (Principal)
<AppLayout breadcrumbs={[]} />

// Auth Layout (Login, etc)
<AuthLayout />

// Settings Layout (Configuraciones)
<SettingsLayout />
```

## ⚠️ Flujo de Build Recomendado

### Situación Actual
En `vite.config.ts`, el plugin wayfinder está **DESHABILITADO en producción**:
```typescript
isProduction
    ? {
        name: 'wayfinder-safe', // Plugin nulo en build
        // ...
    }
    : wayfinder({              // Plugin activo en desarrollo
        formVariants: true,
    }),
```

### Recomendación: Actualizar el Flujo de Build

**ANTES (actual):**
```bash
npm run build  # ⚠️ Genera archivos sin wayfinder:generate
```

**DESPUÉS (recomendado):**
```bash
# Asegurar que actions/ está sincronizado
php artisan wayfinder:generate

# Luego hacer build
npm run build
```

### Implementación Sugerida

**Opción 1: Script Manual (Simple)**
```bash
#!/bin/bash
php artisan wayfinder:generate && npm run build
```

**Opción 2: Actualizar package.json (Recomendado)**
```json
{
  "scripts": {
    "build": "php artisan wayfinder:generate && vite build",
    "build:ssr": "php artisan wayfinder:generate && vite build && vite build --ssr"
  }
}
```

**Opción 3: Actualizar vite.config.ts (Mejor)**
```typescript
// Habilitar wayfinder en producción también
wayfinder({
    formVariants: true,
    // ... otras opciones
}),
```

### Problemas Potenciales sin wayfinder:generate

❌ Si cambias rutas en backend pero no ejecutas `wayfinder:generate`:
- `actions/` tendrá definiciones antiguas
- Frontend importará URLs que no existen en el backend
- Runtime errors en producción
- Difícil de debuggear

### Recomendación Final
✅ **Ejecutar `php artisan wayfinder:generate` SIEMPRE antes de `npm run build`**

## Próximos Pasos
1. ✅ Consolidar servicios duplicados
2. ✅ Resolver versiones duplicadas de páginas
3. ✅ Estandarizar nombres de archivos y servicios (documentado)
4. ✅ Unificar componentes generic vs modern (documentado)
5. ✅ Limpiar y reorganizar hooks por capa (documentado)
6. ⚠️ **IMPORTANTE**: Asegurar que `php artisan wayfinder:generate` se ejecuta antes de build
