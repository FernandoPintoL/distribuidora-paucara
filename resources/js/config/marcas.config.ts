// Configuration: Marcas module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { Marca, MarcaFormData } from '@/domain/marcas';

export const marcasConfig: ModuleConfig<Marca, MarcaFormData> = {
  // Module identification
  moduleName: 'marcas',
  singularName: 'marca',
  pluralName: 'marcas',

  // Display configuration
  displayName: 'Marcas',
  description: 'Gestiona las marcas de productos',

  // Table configuration
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'activo', label: 'Estado', type: 'boolean' },
  ],

  // Form configuration
  formFields: [
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Ingrese el nombre de la marca',
      validation: { maxLength: 255 }
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Ingrese una descripción opcional'
    },
    {
      key: 'activo',
      label: 'Marca activa',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['nombre', 'descripcion'],
  searchPlaceholder: 'Buscar marcas...',
};
