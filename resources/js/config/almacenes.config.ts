// Configuration: Almacenes module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { Almacen, AlmacenFormData } from '@/domain/almacenes';

export const almacenesConfig: ModuleConfig<Almacen, AlmacenFormData> = {
  // Module identification
  moduleName: 'almacenes',
  singularName: 'almacén',
  pluralName: 'almacenes',

  // Display configuration
  displayName: 'Almacenes',
  description: 'Gestiona los almacenes de la empresa',

  // Table configuration
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number' },
    // { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'direccion', label: 'Dirección', type: 'text' },
    { key: 'activo', label: 'Estado', type: 'boolean' },
  ],

  // Form configuration
  formFields: [
    /*{
      key: 'codigo',
      label: 'Código',
      type: 'text',
      required: true,
      placeholder: 'Código único del almacén',
      validation: { maxLength: 10 }
    },*/
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del almacén',
      validation: { maxLength: 255 }
    },
    {
      key: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      placeholder: 'Dirección física del almacén'
    },
    {
      key: 'activo',
      label: 'Almacén activo',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['id','nombre', 'direccion'],
  searchPlaceholder: 'Buscar almacenes...',
};
