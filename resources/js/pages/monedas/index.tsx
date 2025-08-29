// Pages: Monedas index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { monedasConfig } from '@/config/monedas.config';
import monedasService from '@/services/monedas.service';
import type { Pagination } from '@/domain/shared';
import type { Moneda, MonedaFormData } from '@/domain/monedas';

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
