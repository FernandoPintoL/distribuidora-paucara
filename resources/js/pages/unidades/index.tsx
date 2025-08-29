// Pages: Unidades index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { unidadesConfig } from '@/config/unidades.config';
import unidadesService from '@/services/unidades.service';
import type { Pagination } from '@/domain/shared';
import type { UnidadMedida, UnidadMedidaFormData } from '@/domain/unidades';

interface UnidadesIndexProps {
  unidades: Pagination<UnidadMedida>;
  filters: { q?: string };
}

export default function UnidadesIndex({ unidades, filters }: UnidadesIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: unidadesService.indexUrl() },
      { title: 'Unidades de Medida', href: unidadesService.indexUrl() }
    ]}>
      <GenericContainer<UnidadMedida, UnidadMedidaFormData>
        entities={unidades}
        filters={filters}
        config={unidadesConfig}
        service={unidadesService}
      />
    </AppLayout>
  );
}
