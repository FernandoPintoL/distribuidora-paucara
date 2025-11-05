// Configuration: Monedas module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { Moneda, MonedaFormData } from '@/domain/entities/monedas';


export const monedasConfig: ModuleConfig<Moneda, MonedaFormData> = {
  // Module identification
  moduleName: 'monedas',
  singularName: 'moneda',
  pluralName: 'monedas',

  // Display configuration
  displayName: 'Monedas',
  description: 'Gestiona las monedas del sistema y tasas de cambio',

  // Table configuration
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'simbolo', label: 'Símbolo', type: 'text' },
    { key: 'es_moneda_base', label: 'Moneda Base', type: 'boolean' },
    { key: 'activo', label: 'Estado', type: 'boolean' },
  ],

  // Form configuration
  formFields: [
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Ej: Peso Argentino',
      validation: { maxLength: 50 }
    },
    {
      key: 'codigo',
      label: 'Código ISO',
      type: 'text',
      required: true,
      placeholder: 'Ej: ARS',
      validation: { maxLength: 3 }
    },
    {
      key: 'simbolo',
      label: 'Símbolo',
      type: 'text',
      required: true,
      placeholder: 'Ej: $',
      validation: { maxLength: 5 }
    },
    {
      key: 'es_moneda_base',
      label: 'Es moneda base del sistema',
      type: 'boolean'
    },
    {
      key: 'activo',
      label: 'Moneda activa',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['nombre', 'codigo', 'simbolo'],
  searchPlaceholder: 'Buscar monedas...',
};
