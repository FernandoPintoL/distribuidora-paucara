// Domain: Generic types for CRUD operations
import type { Id, Pagination, Filters } from './shared';

// Base entity interface that all entities must implement
export interface BaseEntity {
  id: Id;
  [key: string]: any;
}

// Generic form data interface
export interface BaseFormData {
  id?: Id;
  [key: string]: any;
}

// Generic configuration for each module
export interface ModuleConfig<T extends BaseEntity, F extends BaseFormData> {
  // Module identification
  moduleName: string;
  singularName: string;
  pluralName: string;

  // Display configuration
  displayName: string;
  description: string;

  // Table configuration
  tableColumns: TableColumn<T>[];

  // Form configuration
  formFields: FormField<F>[];

  // Search configuration
  searchableFields: (keyof T)[];
  searchPlaceholder: string;

  // Optional enhanced index visualization
  enableCardView?: boolean; // Permite alternar entre tabla y tarjetas
  cardRenderer?: (entity: T, actions: { onEdit: (e: T) => void; onDelete: (e: T) => void }) => React.ReactNode; // Renderiza una tarjeta para el entity

  // Optional: show model-specific index filters (e.g., categoria/marca for productos)
  showIndexFilters?: boolean;

  // Optional: custom index filter renderer per module
  indexFilterRenderer?: IndexFilterRenderer;
}

// Table column configuration
export interface TableColumn<T extends BaseEntity> {
  key: keyof T;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'custom';
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, entity: T, ...extra: any[]) => React.ReactNode;
}

// Form field configuration
export interface FormField<F extends BaseFormData> {
  key: keyof F;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: { value: any; label: string }[];
  // Permite un renderizado personalizado del campo
  render?: (props: {
    value: any;
    onChange: (value: any) => void;
    label: string;
    error?: string;
    disabled?: boolean;
    field: FormField<F>;
  }) => React.ReactNode;
}

// Custom index filter renderer type
export type IndexFilterRenderer = (args: {
  current: Filters;
  apply: (filters: Filters) => void;
  reset: () => void;
  extraData?: Record<string, unknown>;
}) => React.ReactNode;

// Generic service interface
export interface BaseService<T extends BaseEntity, F extends BaseFormData> {
  indexUrl(params?: { query?: Filters }): string;
  createUrl(): string;
  editUrl(id: Id): string;
  storeUrl(): string;
  updateUrl(id: Id): string;
  destroyUrl(id: Id): string;
  search(filters: Filters): void;
  destroy(id: Id): void;
  validateData(data: F): string[] | Promise<string[]>;
}

// Generic props interfaces
export interface GenericIndexProps<T extends BaseEntity> {
  entities: Pagination<T>;
  filters: Filters;
}

export interface GenericFormProps<T extends BaseEntity> {
  entity?: T | null;
}

// Export Filters type for convenience
export type { Filters };
