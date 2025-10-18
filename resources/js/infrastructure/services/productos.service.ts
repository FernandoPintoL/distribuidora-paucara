// Infrastructure: Productos service
// Encapsulates URL building and navigation logic for productos

import Controllers from '@/actions/App/Http/Controllers';
import { GenericService } from '@/infrastructure/services/generic.service';
import type { Filters, Id } from '@/domain/entities/shared';
import type { Producto, ProductoFormData } from '@/domain/entities/productos';

export class ProductosService extends GenericService<Producto, ProductoFormData> {
  constructor() {
    super('productos');
  }

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

  // Validación específica para productos (sobrescribe la genérica)
  validateData(data: ProductoFormData): string[] {
    const errors = super.validateData(data); // 🆕 Llama primero a la validación genérica (incluye nombre)

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
