// Configuration: Productos module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { Producto, ProductoFormData } from '@/domain/productos';

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
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'codigo_barras', label: 'Código', type: 'text' },
    { key: 'marca', label: 'Marca', type: 'text' },
    { key: 'categoria', label: 'Categoría', type: 'text' },
    { key: 'peso', label: 'Peso', type: 'text' },
    { key: 'activo', label: 'Estado', type: 'boolean' },
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
  searchPlaceholder: 'Buscar productos...'
};
