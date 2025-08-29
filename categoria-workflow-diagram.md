# Diagrama de Flujo de Trabajo - Sistema de Categorías

## Arquitectura General del Sistema

```mermaid
graph TD
    A[Usuario Frontend] --> B[Páginas React/TypeScript]
    B --> C[Componentes Genéricos]
    C --> D[Servicios Frontend]
    D --> E[Controladores Laravel]
    E --> F[Modelos Eloquent]
    F --> G[Base de Datos]
    
    H[Configuración] --> C
    I[Hooks Personalizados] --> C
    J[Notificaciones] --> D
```

## Flujo Detallado de Operaciones CRUD

### 1. Listado de Categorías (READ)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant P as index.tsx
    participant GC as GenericContainer
    participant S as CategoriasService
    participant C as CategoriaController
    participant M as Modelo Categoria
    participant DB as Base de Datos

    U->>P: Accede a /categorias
    P->>GC: Renderiza con props (categorias, filters)
    GC->>S: indexUrl() - Genera URL
    Note over S: Usa Controllers.CategoriaController.index()
    S->>C: GET /categorias
    C->>M: Categoria::query()
    M->>DB: SELECT con filtros y paginación
    DB-->>M: Resultados
    M-->>C: Colección paginada
    C-->>GC: Inertia::render() con datos
    GC-->>U: Tabla con categorías
```

### 2. Búsqueda de Categorías

```mermaid
sequenceDiagram
    participant U as Usuario
    participant GSB as GenericSearchBar
    participant H as useGenericEntities Hook
    participant S as CategoriasService
    participant C as CategoriaController

    U->>GSB: Escribe en campo de búsqueda
    GSB->>H: handleSearchChange()
    H->>S: search(filters)
    S->>C: GET /categorias?q=texto
    Note over C: Filtro: where('nombre', 'ilike', '%texto%')
    C-->>GSB: Resultados filtrados
    GSB-->>U: Tabla actualizada
```

### 3. Creación de Categoría (CREATE)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant P as form.tsx
    participant GFC as GenericFormContainer
    participant S as CategoriasService
    participant C as CategoriaController
    participant M as Modelo Categoria
    participant N as NotificationService

    U->>P: Click "Nueva categoría"
    P->>GFC: Renderiza formulario vacío
    U->>GFC: Completa formulario
    GFC->>S: validateData()
    S->>S: Validaciones frontend
    GFC->>S: storeUrl()
    S->>C: POST /categorias
    C->>C: Validate request data
    C->>M: Categoria::create()
    M-->>C: Nueva instancia
    C->>N: Notificación de éxito
    C-->>P: Redirect a index
    P-->>U: Lista actualizada
```

### 4. Edición de Categoría (UPDATE)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant GT as GenericTable
    participant P as form.tsx
    participant GFC as GenericFormContainer
    participant S as CategoriasService
    participant C as CategoriaController
    participant M as Modelo Categoria

    U->>GT: Click "Editar" en fila
    GT->>S: editUrl(id)
    S->>C: GET /categorias/{id}/edit
    C->>P: Inertia::render() con categoría
    P->>GFC: Formulario precargado
    U->>GFC: Modifica datos
    GFC->>S: updateUrl(id)
    S->>C: PUT/PATCH /categorias/{id}
    C->>M: categoria->update()
    M-->>C: Instancia actualizada
    C-->>P: Redirect con mensaje
```

### 5. Eliminación de Categoría (DELETE)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant GT as GenericTable
    participant H as useGenericEntities Hook
    participant S as CategoriasService
    participant C as CategoriaController
    participant N as NotificationService

    U->>GT: Click "Eliminar"
    GT->>H: deleteEntity()
    H->>N: loading('Eliminando...')
    H->>S: destroy(id)
    S->>C: DELETE /categorias/{id}
    C->>C: categoria->delete()
    C->>N: success('Eliminado')
    C-->>GT: Reload data
    GT-->>U: Lista actualizada
```

## Componentes y Responsabilidades

### Frontend (React/TypeScript)

#### 1. **Páginas (Pages)**
- `index.tsx`: Página principal de listado
- `form.tsx`: Página de formulario (crear/editar)

#### 2. **Componentes Genéricos**
- `GenericContainer`: Contenedor principal con tabla y búsqueda
- `GenericFormContainer`: Manejo de formularios
- `GenericTable`: Tabla de datos con acciones
- `GenericSearchBar`: Barra de búsqueda
- `GenericPagination`: Paginación

#### 3. **Servicios**
- `CategoriasService`: Servicio específico que extiende `GenericService`
- `GenericService`: Clase base con operaciones CRUD comunes
- `NotificationService`: Manejo de notificaciones

#### 4. **Configuración**
- `categorias.config.ts`: Configuración de campos, validaciones, etc.

#### 5. **Hooks Personalizados**
- `useGenericEntities`: Lógica de estado y operaciones

### Backend (Laravel/PHP)

#### 1. **Controladores**
- `CategoriaController`: Maneja todas las operaciones CRUD
  - `index()`: Listado con filtros y paginación
  - `create()`: Formulario de creación
  - `store()`: Guardar nueva categoría
  - `edit()`: Formulario de edición
  - `update()`: Actualizar categoría
  - `destroy()`: Eliminar categoría

#### 2. **Modelos**
- `Categoria`: Modelo Eloquent con definición de campos y relaciones

#### 3. **Validaciones**
- Validación en controlador usando `$request->validate()`
- Validación frontend en el servicio

## Flujo de Datos

```mermaid
graph LR
    A[Configuración categorias.config.ts] --> B[Páginas React]
    B --> C[Componentes Genéricos]
    C --> D[CategoriasService]
    D --> E[GenericService Base]
    D --> F[CategoriaController]
    F --> G[Modelo Categoria]
    G --> H[Base de Datos]
    
    I[useGenericEntities Hook] --> C
    J[NotificationService] --> D
```

## Características del Sistema

### 1. **Arquitectura Genérica**
- Componentes reutilizables para diferentes módulos
- Servicios base con operaciones CRUD comunes
- Configuración centralizada por módulo

### 2. **Comunicación Frontend-Backend**
- Uso de Inertia.js para SPA con Laravel
- Router de Inertia para navegación
- Manejo de estado reactivo

### 3. **Características de UX**
- Búsqueda en tiempo real
- Paginación automática
- Notificaciones de feedback
- Loading states
- Validación client-side y server-side

### 4. **Patrón de Diseño**
- Service Layer Pattern
- Generic/Template Pattern
- Observer Pattern (para notificaciones)
- MVC Pattern (Laravel backend)

Este diagrama muestra cómo el sistema de categorías implementa una arquitectura limpia y escalable, donde cada capa tiene responsabilidades bien definidas y la comunicación fluye de manera ordenada desde el frontend hasta la base de datos.
