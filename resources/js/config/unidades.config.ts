// Configuration: Unidades module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { UnidadMedida, UnidadMedidaFormData } from '@/domain/unidades';

export const unidadesConfig: ModuleConfig<UnidadMedida, UnidadMedidaFormData> = {
  // Module identification
  moduleName: 'unidades',
  singularName: 'unidad',
  pluralName: 'unidades',

  // Display configuration
  displayName: 'Unidades de Medida',
  description: 'Gestiona las unidades de medida de productos',

  // Table configuration
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    // { key: 'abreviatura', label: 'Abreviatura', type: 'text' },
    { key: 'activo', label: 'Estado', type: 'boolean' },
  ],

  // Form configuration
  formFields: [
    {
      key: 'codigo',
      label: 'Código',
      type: 'text',
      required: true,
      placeholder: 'Ej: KG, MT, LT',
      validation: { maxLength: 10 }
    },
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Kilogramo, Metro, Litro',
      validation: { maxLength: 255 }
    },
    /*{
      key: 'abreviatura',
      label: 'Abreviatura',
      type: 'text',
      placeholder: 'Abreviatura opcional'
    },*/
    {
      key: 'activo',
      label: 'Unidad activa',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['codigo', 'nombre', 'abreviatura'],
  searchPlaceholder: 'Buscar unidades...',
};
