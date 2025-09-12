// Application Layer: Productos service
// Encapsulates URL building and navigation logic for productos

import { router } from '@inertiajs/react';
import Controllers from '@/actions/App/Http/Controllers';
import type { Filters, Id } from '@/domain/shared';
import type { BaseService } from '@/domain/generic';
import type { Producto, ProductoFormData } from '@/domain/productos';
import NotificationService from '@/services/notification.service';

export class ProductosService implements BaseService<Producto, ProductoFormData> {
  indexUrl(params?: { query?: Filters }): string {
    return Controllers.ProductoController.index(params).url;
  }

  createUrl(): string {
    return Controllers.ProductoController.create().url;
  }

  editUrl(id: Id): string {
    return Controllers.ProductoController.edit(Number(id)).url;
  }

  storeUrl(): string {
    return Controllers.ProductoController.store().url;
  }

  updateUrl(id: Id): string {
    return Controllers.ProductoController.update(Number(id)).url;
  }

  destroyUrl(id: Id): string {
    return Controllers.ProductoController.destroy(Number(id)).url;
  }

  search(filters: Filters): void {
    router.get(this.indexUrl({ query: filters }), {}, {
      preserveState: true,
      preserveScroll: true,
      onError: (errors) => {
        NotificationService.error('Error al realizar la búsqueda');
        console.error('Search errors:', errors);
      }
    });
  }

  clearFilters(): void {
    router.get(this.indexUrl(), {}, {
      preserveState: true,
      preserveScroll: true,
      onError: (errors) => {
        NotificationService.error('Error al limpiar filtros');
        console.error('Clear filters errors:', errors);
      }
    });
  }

  destroy(id: Id): void {
    const loadingToast = NotificationService.loading('Eliminando producto...');

    router.delete(this.destroyUrl(id), {
      preserveState: true,
      onSuccess: () => {
        NotificationService.dismiss(loadingToast);
        NotificationService.success('Producto eliminado correctamente');
        router.reload({ only: ['productos'] });
      },
      onError: (errors) => {
        NotificationService.dismiss(loadingToast);
        NotificationService.error('Error al eliminar el producto');
        console.error('Delete errors:', errors);
      }
    });
  }

  // Implementación específica de validación para productos
  validateData(data: ProductoFormData): string[] {
    const errors: string[] = [];

    // Validación básica del nombre
    if (!data.nombre || data.nombre.trim().length === 0) {
      errors.push('El nombre es requerido');
    }

    if (data.nombre && data.nombre.length > 255) {
      errors.push('El nombre no puede tener más de 255 caracteres');
    }

    // Validaciones específicas para productos
    if (!data.categoria_id || data.categoria_id === '') {
      errors.push('La categoría es requerida');
    }

    if (!data.unidad_medida_id || data.unidad_medida_id === '') {
      errors.push('La unidad de medida es requerida');
    }

    if (data.peso && data.peso < 0) {
      errors.push('El peso no puede ser negativo');
    }

    // Validar códigos de barras si están presentes
    if (data.codigos && data.codigos.length > 0) {
      data.codigos.forEach((codigo, index) => {
        if (!codigo.codigo || codigo.codigo.trim().length === 0) {
          errors.push(`El código de barras ${index + 1} no puede estar vacío`);
        }
      });
    }

    // Validar precios si están presentes
    if (data.precios && data.precios.length > 0) {
      data.precios.forEach((precio, index) => {
        if (!precio.tipo_precio_id) {
          errors.push(`El tipo de precio ${index + 1} es requerido`);
        }
        if (precio.monto < 0) {
          errors.push(`El monto del precio ${index + 1} no puede ser negativo`);
        }
      });
    }

    return errors;
  }
}

const productosService = new ProductosService();
export default productosService;
