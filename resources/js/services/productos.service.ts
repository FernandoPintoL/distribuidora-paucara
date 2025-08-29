// Application Layer: Productos service
// Encapsulates URL building and navigation logic for productos

import { router } from '@inertiajs/react';
import Controllers from '@/actions/App/Http/Controllers';
import type { Filters } from '@/domain/shared';

export class ProductosService {
  indexUrl(params?: { query?: Filters }) {
    return Controllers.ProductoController.index(params).url;
  }
  createUrl() {
    return Controllers.ProductoController.create().url;
  }
  editUrl(id: number) {
    return Controllers.ProductoController.edit(id).url;
  }
  storeUrl() {
    return Controllers.ProductoController.store().url;
  }
  updateUrl(id: number) {
    return Controllers.ProductoController.update(id).url;
  }
  destroyUrl(id: number) {
    return Controllers.ProductoController.destroy(id).url;
  }

  search(filters: Filters) {
    const url = this.indexUrl({ query: filters });
    router.get(url);
  }

  destroy(id: number) {
    const url = this.destroyUrl(id);
    router.delete(url);
  }
}

const productosService = new ProductosService();
export default productosService;
