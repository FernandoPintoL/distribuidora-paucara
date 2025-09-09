// Pages: Proveedores index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { proveedoresConfig } from '@/config/proveedores.config';
import proveedoresService from '@/services/proveedores.service';
import type { Pagination } from '@/domain/shared';
import type { Proveedor, ProveedorFormData } from '@/domain/proveedores';

interface ProveedoresIndexProps {
  proveedores: Pagination<Proveedor>;
  filters: { q?: string; activo?: string|number|boolean|null; order_by?: string|null; order_dir?: string|null };
}

export default function ProveedoresIndex({ proveedores, filters }: ProveedoresIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: proveedoresService.indexUrl() },
      { title: 'Proveedores', href: proveedoresService.indexUrl() }
    ]}>
      <GenericContainer<Proveedor, ProveedorFormData>
        entities={proveedores}
        filters={filters}
        config={proveedoresConfig}
        service={proveedoresService}
      />
    </AppLayout>
  );
}
