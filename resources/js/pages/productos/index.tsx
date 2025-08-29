// Pages: Productos index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { productosConfig } from '@/config/productos.config';
import productosService from '@/services/productos.service';
import type { Pagination } from '@/domain/shared';
import type { Producto, ProductoFormData } from '@/domain/productos';

interface ProductosIndexProps {
  productos: Pagination<Producto>;
  filters: { q?: string; categoria_id?: number|string; marca_id?: number|string };
  categorias?: {id:number; nombre:string}[];
  marcas?: {id:number; nombre:string}[];
  unidades?: {id:number; codigo:string; nombre:string}[];
}

export default function ProductosIndex({ productos, filters }: ProductosIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: productosService.indexUrl() },
      { title: 'Productos', href: productosService.indexUrl() }
    ]}>
      <GenericContainer<Producto, ProductoFormData>
        entities={productos}
        filters={filters}
        config={productosConfig}
        service={productosService}
      />
    </AppLayout>
  );
}
