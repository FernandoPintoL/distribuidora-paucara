// Configuration: Productos module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { Producto, ProductoFormData } from '@/domain/productos';

const currency = (n?: number | null) => {
  if (n === undefined || n === null) return '-';
  try {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(n);
  } catch {
    return n.toFixed(2);
  }
};

export const productosConfig: ModuleConfig<Producto, ProductoFormData> = {
  // Module identification
  moduleName: 'productos',
  singularName: 'producto',
  pluralName: 'productos',

  // Display configuration
  displayName: 'Productos',
  description: 'Gestiona el catálogo de productos',

  // Table configuration
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number', sortable: true },
    {
      key: 'perfil',
      label: 'Imagen',
      type: 'custom',
      // no sortable
      render: (value, entity) =>
        value && value.url ? (
          <img
            src={value.url}
            alt={entity.nombre}
            className="w-12 h-12 object-cover rounded shadow border border-border bg-white"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-muted-foreground italic">Sin imagen</span>
        ),
    },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true },
    { key: 'codigo_barras', label: 'Código', type: 'text', sortable: true },
    { key: 'marca', label: 'Marca', type: 'text' },
    { key: 'categoria', label: 'Categoría', type: 'text' },
    { key: 'proveedor', label: 'Proveedor', type: 'text' },
    { key: 'precio_base', label: 'Precio', type: 'custom', sortable: true, render: v => <span className="font-mono text-sm">{currency(v)}</span> },
    { key: 'stock_total', label: 'Stock', type: 'number', sortable: true },
    { key: 'activo', label: 'Estado', type: 'boolean' },
    {
      key: 'historial_precios',
      label: 'Historial',
      type: 'custom',
      render: (value, entity, openHistorialModal) => (
        <button
          type="button"
          className="text-blue-600 underline text-xs hover:text-blue-800"
          onClick={e => {
            e.stopPropagation();
            if (openHistorialModal) openHistorialModal(entity);
          }}
        >
          Ver historial
        </button>
      ),
    },
  ],

  // Form configuration
  formFields: [
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Ingrese el nombre del producto',
      validation: { maxLength: 255 }
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Ingrese una descripción opcional'
    },
    {
      key: 'categoria_id',
      label: 'Categoría',
      type: 'select',
      placeholder: 'Seleccione una categoría'
    },
    {
      key: 'marca_id',
      label: 'Marca',
      type: 'select',
      placeholder: 'Seleccione una marca'
    },
    {
      key: 'proveedor_id',
      label: 'Proveedor',
      type: 'select',
      placeholder: 'Seleccione un proveedor'
    },
    {
      key: 'peso',
      label: 'Peso',
      type: 'number',
      placeholder: 'Peso del producto'
    },
    {
      key: 'unidad_medida_id',
      label: 'Unidad de medida',
      type: 'select',
      placeholder: 'Seleccione una unidad'
    },
    {
      key: 'fecha_vencimiento',
      label: 'Fecha de vencimiento',
      type: 'date'
    },
    {
      key: 'activo',
      label: 'Producto activo',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['nombre', 'codigo_barras', 'descripcion'],
  searchPlaceholder: 'Buscar productos...',

  // Modern Index filters configuration
  indexFilters: {
    filters: [
      {
        key: 'categoria_id',
        label: 'Categoría',
        type: 'select' as const,
        placeholder: 'Todas las categorías',
        extraDataKey: 'categorias',
        width: 'md' as const
      },
      {
        key: 'marca_id',
        label: 'Marca',
        type: 'select' as const,
        placeholder: 'Todas las marcas',
        extraDataKey: 'marcas',
        width: 'md' as const
      },
      {
        key: 'proveedor_id',
        label: 'Proveedor',
        type: 'select' as const,
        placeholder: 'Todos los proveedores',
        extraDataKey: 'proveedores',
        width: 'md' as const
      },
      {
        key: 'activo',
        label: 'Estado',
        type: 'boolean' as const,
        placeholder: 'Todos los estados',
        width: 'sm' as const
      },
      {
        key: 'stock_minimo',
        label: 'Stock mínimo',
        type: 'number' as const,
        placeholder: 'Cantidad mínima',
        width: 'sm' as const
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
    defaultSort: { field: 'nombre', direction: 'asc' as const },
    layout: 'grid' as const
  },

  // Legacy support (deprecated)
  showIndexFilters: true,

  // Enhanced visualization
  enableCardView: true,
  cardRenderer: (p, { onEdit, onDelete }) => (
    <div className="group relative flex flex-col border border-border bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] w-full bg-secondary/40 flex items-center justify-center overflow-hidden">
        {p.perfil?.url ? (
          <img src={p.perfil.url} alt={p.nombre} loading="lazy" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="text-muted-foreground text-xs italic">Sin imagen</div>
        )}
        <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">#{p.id}</span>
        {p.activo ? (
          <span className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Activo</span>
        ) : (
          <span className="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Inactivo</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.25rem]">{p.nombre}</h3>
          <div className="flex flex-wrap gap-2 text-[10px] font-medium text-muted-foreground">
            {p.marca?.nombre && <span className="bg-secondary px-1.5 py-0.5 rounded">{p.marca.nombre}</span>}
            {p.categoria?.nombre && <span className="bg-secondary px-1.5 py-0.5 rounded">{p.categoria.nombre}</span>}
            {p.codigo_barras && <span className="bg-secondary px-1.5 py-0.5 rounded font-mono">{p.codigo_barras}</span>}
          </div>
        </div>
        <div className="flex items-end justify-between mt-auto">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <span className="block text-[10px] uppercase tracking-wide">Precio base</span>
              <span className="font-bold text-sm">{currency(p.precio_base)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wide">Stock</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${(p.stock_total ?? 0) === 0 ? 'bg-red-100 text-red-700' : (p.stock_total ?? 0) < (p.stock_minimo ?? 0) ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                {(p.stock_total ?? 0)}
              </span>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(p)} className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-[10px] font-medium">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Editar
            </button>
            <button onClick={() => onDelete(p)} className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-[10px] font-medium">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Borrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
};
