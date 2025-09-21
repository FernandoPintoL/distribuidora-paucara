// Domain: Generic types for CRUD operations
import type { Id, Pagination, Filters } from './shared';

// Base entity interface that all entities must implement
export interface BaseEntity {
  id: Id;
  [key: string]: unknown;
}

// Generic form data interface
export interface BaseFormData {
  id?: Id;
  [key: string]: unknown;
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

  // Modern index filters configuration
  indexFilters?: IndexFiltersConfig;

  // Legacy: show model-specific index filters (deprecated)
  showIndexFilters?: boolean;
  // Legacy: custom index filter renderer per module (deprecated)
  indexFilterRenderer?: IndexFilterRenderer;
}

// Table column configuration
export interface TableColumn<T extends BaseEntity> {
  key: keyof T;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'custom';
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: unknown, entity: T, ...extra: unknown[]) => React.ReactNode;
}

// Form field configuration
export interface FormField<F extends BaseFormData> {
  key: keyof F;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'file' | 'custom';
  required?: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  options?: { value: unknown; label: string }[];
  extraDataKey?: string; // For options coming from extraData (e.g., 'localidades', 'categorias')
  // Permite un renderizado personalizado del campo
  render?: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    label: string;
    error?: string;
    disabled?: boolean;
    field: FormField<F>;
  }) => React.ReactNode;
}

// Filter field configuration for dynamic filters
export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'date' | 'number' | 'range' | 'multiselect';
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  defaultValue?: unknown;
  extraDataKey?: string; // For options coming from extraData (e.g., 'categorias', 'marcas')
  width?: 'sm' | 'md' | 'lg' | 'full'; // Column width in grid
}

// Sort configuration
export interface SortOption {
  value: string;
  label: string;
}

// Index filters configuration
export interface IndexFiltersConfig {
  filters: FilterField[];
  sortOptions: SortOption[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  layout?: 'grid' | 'inline'; // Layout style
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
