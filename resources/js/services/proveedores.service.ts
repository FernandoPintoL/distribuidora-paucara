// Data Layer: Proveedores service
import Controllers from '@/actions/App/Http/Controllers';
import { GenericService } from '@/services/generic.service';
import type { Filters, Id } from '@/domain/shared';
import type { Proveedor, ProveedorFormData } from '@/domain/proveedores';

export class ProveedoresService extends GenericService<Proveedor, ProveedorFormData> {
  constructor() {
    super('proveedores');
  }

  indexUrl(params?: { query?: Filters }) {
    return Controllers.ProveedorController.index(params).url;
  }

  createUrl() {
    return Controllers.ProveedorController.create().url;
  }

  editUrl(id: Id) {
    return Controllers.ProveedorController.edit(Number(id)).url;
  }

  storeUrl() {
    return Controllers.ProveedorController.store().url;
  }

  updateUrl(id: Id) {
    return Controllers.ProveedorController.update(Number(id)).url;
  }

  destroyUrl(id: Id) {
    return Controllers.ProveedorController.destroy(Number(id)).url;
  }

  // Override validation for specific fields
  validateData(data: ProveedorFormData): string[] {
    const errors = super.validateData(data);

    // Validación específica para email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('El formato del email no es válido');
    }

    // Validación específica para NIT (opcional)
    if (data.nit && String(data.nit).length > 255) {
      errors.push('El NIT no puede exceder 255 caracteres');
    }

    return errors;
  }
}

const proveedoresService = new ProveedoresService();
export default proveedoresService;
