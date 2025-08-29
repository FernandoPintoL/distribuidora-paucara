import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { tiposPrecioConfig } from '@/config/tipos-precio.config';
import tiposPrecioService from '@/services/tipos-precio.service';
import type { Pagination } from '@/domain/shared';
import type { TipoPrecio, TipoPrecioFormData } from '@/domain/tipos-precio';

interface TiposPrecioIndexProps {
  tipos_precio: Pagination<TipoPrecio>;
  filters: { q?: string; activo?: boolean };
}

export default function TiposPrecioIndex({ tipos_precio, filters }: TiposPrecioIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: '/' },
      { title: 'Tipos de Precio', href: tiposPrecioService.indexUrl() }
    ]}>
      <GenericContainer<TipoPrecio, TipoPrecioFormData>
        entities={tipos_precio}
        filters={filters}
        config={tiposPrecioConfig}
        service={tiposPrecioService}
      />
    </AppLayout>
  );
}
