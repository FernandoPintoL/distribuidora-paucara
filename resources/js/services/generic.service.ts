// Data Layer: Generic base service class - Updated with notifications
import { router } from '@inertiajs/react';
import type { Filters, Id } from '@/domain/shared';
import type { BaseEntity, BaseFormData, BaseService } from '@/domain/generic';
import NotificationService from '@/services/notification.service';

export abstract class GenericService<T extends BaseEntity, F extends BaseFormData> implements BaseService<T, F> {
  protected controllerName: string;

  constructor(controllerName: string) {
    this.controllerName = controllerName;
  }

  // Abstract methods that must be implemented by child classes
  abstract indexUrl(params?: { query?: Filters }): string;
  abstract createUrl(): string;
  abstract editUrl(id: Id): string;
  abstract storeUrl(): string;
  abstract updateUrl(id: Id): string;
  abstract destroyUrl(id: Id): string;

  // Common navigation methods with notifications
  search(filters: Filters) {
    router.get(this.indexUrl({ query: filters }), {}, {
      preserveState: true,
      preserveScroll: true,
      onError: (errors) => {
        NotificationService.error('Error al realizar la búsqueda');
        console.error('Search errors:', errors);
      }
    });
  }

  destroy(id: Id) {
    const loadingToast = NotificationService.loading('Eliminando registro...');

    router.delete(this.destroyUrl(id), {
      preserveState: true,
      onSuccess: () => {
        NotificationService.dismiss(loadingToast);
        NotificationService.success('Registro eliminado correctamente');
        router.reload({ only: [this.controllerName.toLowerCase()] });
      },
      onError: (errors) => {
        NotificationService.dismiss(loadingToast);
        NotificationService.error('Error al eliminar el registro');
        console.error('Delete errors:', errors);
      }
    });
  }

  // Generic validation - can be overridden by child classes
  validateData(data: F): string[] {
    const errors: string[] = [];

    // Basic validation for common fields
    if ('nombre' in data && (!data.nombre || String(data.nombre).trim().length === 0)) {
      errors.push('El nombre es requerido');
    }

    if ('nombre' in data && String(data.nombre).length > 255) {
      errors.push('El nombre no puede tener más de 255 caracteres');
    }

    return errors;
  }

  // Utility methods
  formatStatus(entity: T): string {
    return 'activo' in entity && entity.activo ? 'Activo' : 'Inactivo';
  }

  getDisplayName(entity: T): string {
    if ('nombre' in entity && 'descripcion' in entity && entity.descripcion) {
      return `${entity.nombre} - ${entity.descripcion}`;
    }
    return 'nombre' in entity ? String(entity.nombre) : String(entity.id);
  }
}
