// Pages: Productos index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { productosConfig } from '@/config/modules/productos.config';
import productosService from '@/infrastructure/services/productos.service';
import type { Pagination } from '@/domain/entities/shared';
import type { Producto, ProductoFormData } from '@/domain/entities/productos';
import { Link } from '@inertiajs/react';
import { Button } from '@/presentation/components/ui/button';
import { Package } from 'lucide-react';

interface ProductosIndexProps {
  productos: Pagination<Producto>;
  filters: { q?: string; categoria_id?: number | string | null; marca_id?: number | string | null; proveedor_id?: number | string | null; order_by?: string | null; order_dir?: string | null };
  categorias?: { id: number; nombre: string }[];
  marcas?: { id: number; nombre: string }[];
  proveedores?: { id: number; nombre: string; razon_social?: string }[];
  unidades?: { id: number; codigo: string; nombre: string }[];
}

export default function ProductosIndex({ productos, filters, categorias, marcas, proveedores }: ProductosIndexProps) {
  console.log('ProductosIndex renderizado con productos:', productos);

  // 🔍 DEBUG: Inspeccionar la estructura de los productos
  if (productos?.data && productos.data.length > 0) {
    console.log('🔍 PRIMER PRODUCTO COMPLETO:', productos.data[0]);
    console.log('🔍 Campo "codigos":', productos.data[0].codigos);
    console.log('🔍 Campo "codigosBarra":', (productos.data[0] as any).codigosBarra);
    console.log('🔍 Todas las propiedades:', Object.keys(productos.data[0]));
  }

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: productosService.indexUrl() },
      { title: 'Productos', href: productosService.indexUrl() }
    ]}>
      <div className="mb-4 flex justify-end">
        <Link href="/combos">
          <Button variant="outline" className="gap-2">
            <Package size={18} />
            Ir a Combos
          </Button>
        </Link>
      </div>
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
