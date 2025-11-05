// Pages: Marcas index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { marcasConfig } from '@/config/marcas.config';
import marcasService from '@/infrastructure/services/marcas.service';
import type { Pagination } from '@/domain/entities/shared';
import type { Marca, MarcaFormData } from '@/domain/entities/marcas';

interface MarcasIndexProps {
  marcas: Pagination<Marca>;
  filters: { q?: string };
}

export default function MarcasIndex({ marcas, filters }: MarcasIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: marcasService.indexUrl() },
      { title: 'Marcas', href: marcasService.indexUrl() }
    ]}>
      <GenericContainer<Marca, MarcaFormData>
        entities={marcas}
        filters={filters}
        config={marcasConfig}
        service={marcasService}
      />
    </AppLayout>
  );
}
