// Data Layer: Tipos de Ajuste de Inventario service
import Controllers from '@/actions/App/Http/Controllers';
import { GenericService } from '@/infrastructure/services/generic.service';
import type { Filters, Id } from '@/domain/entities/shared';
import type { TipoAjusteInventario, TipoAjusteInventarioFormData } from '@/domain/entities/tipos-ajuste-inventario';

export class TipoAjusteInventarioService extends GenericService<TipoAjusteInventario, TipoAjusteInventarioFormData> {
  constructor() {
    super('tipos-ajuste-inventario');
  }

  indexUrl(params?: { query?: Filters }) {
    return Controllers.TipoAjusteInventarioController.index(params).url;
  }

  createUrl() {
    return Controllers.TipoAjusteInventarioController.create().url;
  }

  editUrl(id: Id) {
    return Controllers.TipoAjusteInventarioController.edit(Number(id)).url;
  }

  storeUrl() {
    return Controllers.TipoAjusteInventarioController.store().url;
  }

  updateUrl(id: Id) {
    return Controllers.TipoAjusteInventarioController.update(Number(id)).url;
  }

  destroyUrl(id: Id) {
    return Controllers.TipoAjusteInventarioController.destroy(Number(id)).url;
  }

  // Override validation for specific fields
  validateData(data: TipoAjusteInventarioFormData): string[] {
    const errors = super.validateData(data);

    if (!data.clave || data.clave.trim().length === 0) {
      errors.push('La clave es requerida');
    }

    if (!data.label || data.label.trim().length === 0) {
      errors.push('El nombre visible es requerido');
    }

    return errors;
  }
}

const tipoAjusteInventarioService = new TipoAjusteInventarioService();
export default tipoAjusteInventarioService;
