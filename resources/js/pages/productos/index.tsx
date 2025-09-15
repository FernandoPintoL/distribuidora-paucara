// Pages: Productos index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { productosConfig } from '@/config/productos.config';
import productosService from '@/services/productos.service';
import type { Pagination } from '@/domain/shared';
import type { Producto, ProductoFormData } from '@/domain/productos';

interface ProductosIndexProps {
  productos: Pagination<Producto>;
  filters: { q?: string; categoria_id?: number | string | null; marca_id?: number | string | null; proveedor_id?: number | string | null; order_by?: string | null; order_dir?: string | null };
  categorias?: { id: number; nombre: string }[];
  marcas?: { id: number; nombre: string }[];
  proveedores?: { id: number; nombre: string; razon_social?: string }[];
  unidades?: { id: number; codigo: string; nombre: string }[];
}

export default function ProductosIndex({ productos, filters, categorias, marcas, proveedores }: ProductosIndexProps) {
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
        extraData={{ categorias, marcas, proveedores }}
      />
    </AppLayout>
  );
}
