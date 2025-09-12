# Sistema de Tablas Genéricas Modernizadas

## 📋 Resumen de Mejoras

Hemos modernizado completamente el sistema de tablas genéricas para proporcionar:

1. **Filtros dinámicos por módulo**: Cada modelo puede definir sus propios filtros específicos
2. **Interfaz moderna y responsiva**: Componentes renovados con mejor UX
3. **Sistema de ordenamiento flexible**: Configuración de opciones de ordenamiento por módulo
4. **Arquitectura escalable**: Fácil agregar nuevos tipos de filtros
5. **Compatibilidad con el sistema legacy**: Mantiene compatibilidad hacia atrás

## 🏗️ Arquitectura del Sistema

### 1. Tipos de Dominio Extendidos (`domain/generic.ts`)

#### Nuevos tipos añadidos

```typescript
// Configuración de campos de filtro
interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'date' | 'number' | 'range' | 'multiselect';
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  defaultValue?: any;
  extraDataKey?: string; // Para opciones desde extraData
  width?: 'sm' | 'md' | 'lg' | 'full';
}

// Configuración de opciones de ordenamiento
interface SortOption {
  value: string;
  label: string;
}

// Configuración completa de filtros del módulo
interface IndexFiltersConfig {
  filters: FilterField[];
  sortOptions: SortOption[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  layout?: 'grid' | 'inline';
}
```

### 2. Componente ModernFilters (`components/generic/modern-filters.tsx`)

**Características principales:**

- ✅ **Filtros expansibles**: Se pueden contraer/expandir para ahorrar espacio
- ✅ **Filtros activos visibles**: Muestra badges con filtros aplicados
- ✅ **Ordenamiento rápido**: Controles de ordenamiento siempre visibles
- ✅ **Diseño responsivo**: Se adapta a diferentes tamaños de pantalla
- ✅ **Tipos de filtro**: text, select, boolean, date, number
- ✅ **Contador de filtros**: Muestra cuántos filtros están activos
- ✅ **Reset inteligente**: Limpia todos los filtros y vuelve a los valores por defecto

### 3. Componente ModernTable (`components/generic/modern-table.tsx`)

**Mejoras implementadas:**

- ✅ **Ordenamiento visual**: Iconos que indican la dirección del ordenamiento
- ✅ **Estados de carga**: Skeleton loading para mejor UX
- ✅ **Estado vacío**: Mensaje amigable cuando no hay datos
- ✅ **Menú de acciones mejorado**: Dropdown con iconos claros
- ✅ **Renderizado inteligente**: Trunca texto largo automáticamente
- ✅ **Alternancia de filas**: Mejora la legibilidad
- ✅ **Hover effects**: Feedback visual en interacciones

## 🔧 Configuración por Módulo

### Ejemplo: Productos (Configuración Completa)

```typescript
// config/productos.config.tsx
export const productosConfig: ModuleConfig<Producto, ProductoFormData> = {
  // ... configuración existente ...

  // 🆕 Configuración moderna de filtros
  indexFilters: {
    filters: [
      {
        key: 'categoria_id',
        label: 'Categoría',
        type: 'select',
        placeholder: 'Todas las categorías',
        extraDataKey: 'categorias', // Usa datos de extraData
        width: 'md'
      },
      {
        key: 'marca_id',
        label: 'Marca',
        type: 'select',
        placeholder: 'Todas las marcas',
        extraDataKey: 'marcas',
        width: 'md'
      },
      {
        key: 'activo',
        label: 'Estado',
        type: 'boolean',
        placeholder: 'Todos los estados',
        width: 'sm'
      },
      {
        key: 'stock_minimo',
        label: 'Stock mínimo',
        type: 'number',
        placeholder: 'Cantidad mínima',
        width: 'sm'
      }
    ],
    sortOptions: [
      { value: 'id', label: 'ID' },
      { value: 'nombre', label: 'Nombre' },
      { value: 'precio_base', label: 'Precio' },
      { value: 'stock_total', label: 'Stock' },
      { value: 'created_at', label: 'Fecha creación' },
      { value: 'updated_at', label: 'Última actualización' }
    ],
    defaultSort: { field: 'nombre', direction: 'asc' },
    layout: 'grid' // 'grid' para filtros complejos, 'inline' para simples
  },

  // 📄 Compatibilidad legacy (se puede mantener temporalmente)
  showIndexFilters: true,
};
```

### Ejemplo: Clientes (Configuración Médium)

```typescript
// config/clientes.config.ts
indexFilters: {
  filters: [
    {
      key: 'activo',
      label: 'Estado',
      type: 'boolean',
      placeholder: 'Todos los estados',
      width: 'sm'
    },
    {
      key: 'tipo_documento',
      label: 'Tipo de documento',
      type: 'select',
      placeholder: 'Todos los tipos',
      options: [
        { value: 'ci', label: 'Cédula de Identidad' },
        { value: 'nit', label: 'NIT' },
        { value: 'pasaporte', label: 'Pasaporte' },
        { value: 'ruc', label: 'RUC' }
      ],
      width: 'md'
    }
  ],
  sortOptions: [
    { value: 'id', label: 'ID' },
    { value: 'nombre', label: 'Nombre' },
    { value: 'razon_social', label: 'Razón Social' },
    { value: 'created_at', label: 'Fecha registro' },
    { value: 'updated_at', label: 'Última actualización' }
  ],
  defaultSort: { field: 'nombre', direction: 'asc' },
  layout: 'grid'
},
```

### Ejemplo: Categorías (Configuración Simple)

```typescript
// config/categorias.config.ts
indexFilters: {
  filters: [
    {
      key: 'activo',
      label: 'Estado',
      type: 'boolean',
      placeholder: 'Todos los estados',
      width: 'sm'
    }
  ],
  sortOptions: [
    { value: 'id', label: 'ID' },
    { value: 'nombre', label: 'Nombre' },
    { value: 'created_at', label: 'Fecha creación' },
    { value: 'updated_at', label: 'Última actualización' }
  ],
  defaultSort: { field: 'nombre', direction: 'asc' },
  layout: 'inline' // Layout simple para filtros básicos
},
```

## 🚀 Cómo Agregar Filtros a un Nuevo Módulo

### Paso 1: Actualizar la configuración del módulo

```typescript
// config/tu-modulo.config.ts
export const tuModuloConfig: ModuleConfig<TuEntidad, TuFormData> = {
  // ... configuración existente ...

  // Agregar filtros modernos
  indexFilters: {
    filters: [
      // Filtro básico de estado
      {
        key: 'activo',
        label: 'Estado',
        type: 'boolean',
        placeholder: 'Todos los estados',
        width: 'sm'
      },
      
      // Filtro de texto libre
      {
        key: 'codigo',
        label: 'Código',
        type: 'text',
        placeholder: 'Buscar por código',
        width: 'md'
      },
      
      // Filtro de selección con opciones fijas
      {
        key: 'tipo',
        label: 'Tipo',
        type: 'select',
        placeholder: 'Todos los tipos',
        options: [
          { value: 'tipo1', label: 'Tipo 1' },
          { value: 'tipo2', label: 'Tipo 2' }
        ],
        width: 'md'
      },
      
      // Filtro de relación (usa extraData)
      {
        key: 'categoria_id',
        label: 'Categoría',
        type: 'select',
        placeholder: 'Todas las categorías',
        extraDataKey: 'categorias',
        width: 'md'
      },
      
      // Filtro de fecha
      {
        key: 'fecha_desde',
        label: 'Fecha desde',
        type: 'date',
        placeholder: 'Seleccionar fecha',
        width: 'md'
      },
      
      // Filtro numérico
      {
        key: 'cantidad_minima',
        label: 'Cantidad mínima',
        type: 'number',
        placeholder: '0',
        width: 'sm'
      }
    ],
    
    // Opciones de ordenamiento
    sortOptions: [
      { value: 'id', label: 'ID' },
      { value: 'nombre', label: 'Nombre' },
      { value: 'created_at', label: 'Fecha creación' },
      { value: 'updated_at', label: 'Última actualización' }
    ],
    
    // Ordenamiento por defecto
    defaultSort: { field: 'nombre', direction: 'asc' },
    
    // Layout: 'grid' para muchos filtros, 'inline' para pocos
    layout: 'grid'
  },
};
```

### Paso 2: Actualizar el controlador de Laravel (si es necesario)

```php
// app/Http/Controllers/TuModuloController.php
public function index(Request $request)
{
    $query = TuModelo::query();
    
    // Filtros básicos existentes
    if ($request->filled('q')) {
        $query->where('nombre', 'like', '%' . $request->q . '%');
    }
    
    // 🆕 Nuevos filtros dinámicos
    if ($request->filled('activo')) {
        $query->where('activo', $request->boolean('activo'));
    }
    
    if ($request->filled('tipo')) {
        $query->where('tipo', $request->tipo);
    }
    
    if ($request->filled('categoria_id')) {
        $query->where('categoria_id', $request->categoria_id);
    }
    
    if ($request->filled('fecha_desde')) {
        $query->whereDate('created_at', '>=', $request->fecha_desde);
    }
    
    if ($request->filled('cantidad_minima')) {
        $query->where('cantidad', '>=', $request->cantidad_minima);
    }
    
    // Ordenamiento
    $orderBy = $request->get('order_by', 'nombre');
    $orderDir = $request->get('order_dir', 'asc');
    $query->orderBy($orderBy, $orderDir);
    
    $entidades = $query->paginate(15);
    
    return Inertia::render('TuModulo/Index', [
        'entidades' => $entidades,
        'filters' => $request->only(['q', 'activo', 'tipo', 'categoria_id', 'fecha_desde', 'cantidad_minima', 'order_by', 'order_dir']),
        // 🆕 Datos adicionales para filtros de relación
        'categorias' => Categoria::select('id', 'nombre')->where('activo', true)->get(),
    ]);
}
```

## 🎨 Tipos de Filtros Disponibles

### 1. `text` - Campo de texto libre

```typescript
{
  key: 'nombre',
  label: 'Nombre',
  type: 'text',
  placeholder: 'Buscar por nombre',
  width: 'md'
}
```

### 2. `select` - Lista desplegable

```typescript
// Con opciones fijas
{
  key: 'estado',
  label: 'Estado',
  type: 'select',
  placeholder: 'Seleccionar estado',
  options: [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ],
  width: 'md'
}

// Con datos dinámicos
{
  key: 'categoria_id',
  label: 'Categoría',
  type: 'select',
  placeholder: 'Seleccionar categoría',
  extraDataKey: 'categorias', // Usa datos del prop extraData
  width: 'md'
}
```

### 3. `boolean` - Selector de verdadero/falso

```typescript
{
  key: 'activo',
  label: 'Estado',
  type: 'boolean',
  placeholder: 'Todos los estados',
  width: 'sm'
}
```

### 4. `date` - Selector de fecha

```typescript
{
  key: 'fecha_desde',
  label: 'Fecha desde',
  type: 'date',
  placeholder: 'Seleccionar fecha',
  width: 'md'
}
```

### 5. `number` - Campo numérico

```typescript
{
  key: 'precio_minimo',
  label: 'Precio mínimo',
  type: 'number',
  placeholder: '0.00',
  width: 'sm'
}
```

## 📱 Diseño Responsivo

### Anchos de columna disponibles

- `'sm'` → 1 columna en grid (25%)
- `'md'` → 2 columnas en grid (50%)
- `'lg'` → 3 columnas en grid (75%)
- `'full'` → 4 columnas en grid (100%)

### Layouts disponibles

- `'grid'` → Disposición en rejilla, ideal para muchos filtros
- `'inline'` → Disposición en línea, ideal para pocos filtros

## 🔄 Migración desde el Sistema Legacy

### Módulos ya migrados

- ✅ **Productos** - Configuración completa con filtros avanzados
- ✅ **Clientes** - Filtros de estado y tipo de documento  
- ✅ **Proveedores** - Filtros de estado y tipo de proveedor
- ✅ **Categorías** - Filtro básico de estado
- ✅ **Marcas** - Filtro básico de estado
- ✅ **Unidades** - Filtro básico de estado

### Para migrar un módulo legacy

1. **Mantener compatibilidad**: El sistema legacy sigue funcionando
2. **Agregar configuración moderna**: Añadir `indexFilters` a la configuración
3. **Probar gradualmente**: Ambos sistemas coexisten
4. **Actualizar backend**: Ajustar controladores para nuevos filtros si es necesario
5. **Remover legacy**: Opcional, cuando estés seguro del nuevo sistema

## 🚀 Próximas Mejoras Planificadas

### Tipos de filtros adicionales

- `'range'` - Rango numérico (min/max)
- `'multiselect'` - Selección múltiple
- `'autocomplete'` - Autocompletado con búsqueda

### Funcionalidades avanzadas

- **Filtros guardados**: Poder guardar combinaciones frecuentes
- **Filtros URL**: Sincronización con query parameters
- **Exportación**: Exportar resultados filtrados
- **Filtros anidados**: Dependencias entre filtros

## 💡 Consejos de Uso

### ✅ Buenas prácticas

1. **Usar layout 'inline' para módulos simples** (1-2 filtros)
2. **Usar layout 'grid' para módulos complejos** (3+ filtros)
3. **Ordenar filtros por frecuencia de uso** (más usados primero)
4. **Usar anchuras apropiadas** (sm para boolean, md para select, etc.)
5. **Proporcionar placeholders descriptivos**

### ❌ Evitar

1. **Demasiados filtros**: Puede abrumar al usuario
2. **Filtros redundantes**: No duplicar funcionalidad de búsqueda
3. **Anchuras incorrectas**: Select muy estrecho o boolean muy ancho
4. **Ordenamiento por defecto poco útil**: Usar campos relevantes

## 📞 Soporte

Si necesitas ayuda implementando filtros para un módulo específico o tienes ideas para mejoras, no dudes en preguntar. El sistema está diseñado para ser extensible y fácil de mantener.

---

**¡Disfruta del nuevo sistema de tablas modernizadas! 🎉**
