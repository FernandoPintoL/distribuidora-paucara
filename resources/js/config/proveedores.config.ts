// Configuration: Proveedores module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { Proveedor, ProveedorFormData } from '@/domain/proveedores';

export const proveedoresConfig: ModuleConfig<Proveedor, ProveedorFormData> = {
  // Module identification
  moduleName: 'proveedores',
  singularName: 'proveedor',
  pluralName: 'proveedores',

  // Display configuration
  displayName: 'Proveedores',
  description: 'Gestiona los proveedores de productos',

  // Table configuration
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'ruc', label: 'RUC', type: 'text' },
    { key: 'telefono', label: 'Teléfono', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'activo', label: 'Estado', type: 'boolean' },
  ],

  // Form configuration
  formFields: [
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del proveedor',
      validation: { maxLength: 255 }
    },
    {
      key: 'ruc',
      label: 'RUC',
      type: 'text',
      placeholder: '20123456789',
      validation: { maxLength: 11 }
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      type: 'text',
      placeholder: '(01) 234-5678'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'proveedor@empresa.com'
    },
    {
      key: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      placeholder: 'Dirección completa del proveedor'
    },
    {
      key: 'contacto',
      label: 'Persona de Contacto',
      type: 'text',
      placeholder: 'Nombre del contacto principal'
    },
    {
      key: 'activo',
      label: 'Proveedor activo',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['nombre', 'ruc', 'email'],
  searchPlaceholder: 'Buscar proveedores...',
};
