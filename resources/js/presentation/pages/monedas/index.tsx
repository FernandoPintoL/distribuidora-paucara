// Pages: Monedas index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { monedasConfig } from '@/config/monedas.config';
import monedasService from '@/infrastructure/services/monedas.service';
import type { Pagination } from '@/domain/entities/shared';
import type { Moneda, MonedaFormData } from '@/domain/entities/monedas';

interface MonedasIndexProps {
  monedas: Pagination<Moneda>;
  filters: { q?: string };
}

export default function MonedasIndex({ monedas, filters }: MonedasIndexProps) {
  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Monedas', href: monedasService.indexUrl() }
      ]}
    >
      <GenericContainer<Moneda, MonedaFormData>
        entities={monedas}
        filters={filters}
        config={monedasConfig}
        service={monedasService}
      />
    </AppLayout>
  );
}
