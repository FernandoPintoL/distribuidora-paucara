// Configuration: Productos module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { Producto, ProductoFormData } from '@/domain/entities/productos';

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
            className="w-14 h-14 object-cover rounded-lg shadow-sm border-2 border-border bg-white ring-2 ring-transparent hover:ring-blue-400/50 transition-all"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-secondary/50 border border-border">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ),
    },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true },
    {
      key: 'sku',
      label: 'SKU',
      type: 'custom',
      sortable: true,
      render: (value) => value ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-700">
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/40 italic text-xs">—</span>
      )
    },
    { key: 'codigo_barras', label: 'Código de Barra', type: 'text', sortable: true },
    { key: 'marca', label: 'Marca', type: 'text' },
    { key: 'categoria', label: 'Categoría', type: 'text' },
    { key: 'proveedor', label: 'Proveedor', type: 'text' },
    {
      key: 'precio_base',
      label: 'Precio',
      type: 'custom',
      sortable: true,
      render: v => v && v > 0 ? (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 border-2 border-green-200 dark:border-green-700">
          <span className="font-mono text-sm font-bold text-green-700 dark:text-green-200">{currency(v)}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/40 border-2 border-amber-300 dark:border-amber-700">
          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-200">Sin precio</span>
        </span>
      )
    },
    {
      key: 'stock_disponible_calc',
      label: 'Stock Disponible',
      type: 'custom',
      sortable: true,
      render: (value, entity) => {
        const stockDisponible = value ?? 0;
        const stockTotal = (entity as any).stock_total_calc ?? 0;
        const stockMin = entity.stock_minimo ?? 5;
        const stockReservado = stockTotal - stockDisponible;

        let badgeClasses = '';
        let icon = '';
        let text = '';

        if (stockDisponible === 0) {
          badgeClasses = 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/40 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200';
          icon = '🚫';
          text = 'Agotado';
        } else if (stockDisponible < stockMin) {
          badgeClasses = 'bg-gradient-to-r from-orange-50 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-200';
          icon = '⚠️';
          text = 'Bajo';
        } else {
          badgeClasses = 'bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200';
          icon = '✓';
          text = 'OK';
        }

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm ${badgeClasses}`}>
                <span>{icon}</span>
                <span className="font-mono">{stockDisponible}</span>
                <span className="text-[10px] font-semibold opacity-70">({text})</span>
              </span>
            </div>
            {stockTotal > 0 && (
              <div className="text-[10px] text-muted-foreground px-3">
                <span>Total: {stockTotal}</span>
                {stockReservado > 0 && <span className="ml-2 text-amber-600 dark:text-amber-400">Reservado: {stockReservado}</span>}
              </div>
            )}
          </div>
        );
      }
    },
    { key: 'activo', label: 'Estado', type: 'boolean' },
    /* {
      key: 'historial_precios',
      label: 'Historial',
      type: 'custom',
      hidden: true,
      render: (value, entity, openHistorialModal) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-xs font-semibold border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
          onClick={e => {
            e.stopPropagation();
            if (openHistorialModal) openHistorialModal(entity);
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ver historial
        </button>
      ),
    }, */
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
      type: 'boolean',
      defaultValue: true, // 🆕 Por defecto activo al crear
      hidden: true, // 🆕 Oculto en el formulario
    }
  ],

  // Search configuration
  searchableFields: ['nombre', 'codigo_barras', 'sku', 'descripcion'],
  searchPlaceholder: 'Buscar por nombre, código o SKU...',

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
      },
      {
        key: 'sin_precio',
        label: 'Sin precio',
        type: 'boolean' as const,
        placeholder: 'Mostrar todos',
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
        {(!p.precio_base || p.precio_base === 0) && (
          <span className="absolute bottom-2 left-2 bg-amber-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">⚠️ Sin precio</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.25rem]">{p.nombre}</h3>
          <div className="flex flex-wrap gap-2 text-[10px] font-medium text-muted-foreground">
            {p.sku && <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 px-1.5 py-0.5 rounded font-mono font-semibold">{p.sku}</span>}
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
              <span className="block text-[10px] uppercase tracking-wide">Stock Disponible</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${((p as any).stock_disponible_calc ?? 0) === 0 ? 'bg-red-100 text-red-700' : ((p as any).stock_disponible_calc ?? 0) < (p.stock_minimo ?? 0) ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                {((p as any).stock_disponible_calc ?? 0)}
              </span>
            </div>
            {((p as any).stock_total_calc ?? 0) > 0 && (
              <div className="text-[10px] text-muted-foreground">
                Total: {((p as any).stock_total_calc ?? 0)}
                {(((p as any).stock_total_calc ?? 0) - ((p as any).stock_disponible_calc ?? 0)) > 0 && (
                  <span className="ml-1 text-amber-600">Reservado: {(((p as any).stock_total_calc ?? 0) - ((p as any).stock_disponible_calc ?? 0))}</span>
                )}
              </div>
            )}
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
