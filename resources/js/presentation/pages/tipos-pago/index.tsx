// Pages: Tipos de Pago index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { tiposPagoConfig } from '@/config/tipos-pago.config';
import tiposPagoService from '@/infrastructure/services/tipos-pago.service';
import type { Pagination } from '@/domain/entities/shared';
import type { TipoPago, TipoPagoFormData } from '@/domain/entities/tipos-pago';

interface TiposPagoIndexProps {
  tiposPago: Pagination<TipoPago>;
  filters: { q?: string };
}

export default function TiposPagoIndex({ tiposPago, filters }: TiposPagoIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: tiposPagoService.indexUrl() },
      { title: 'Tipos de Pago', href: tiposPagoService.indexUrl() }
    ]}>
      <GenericContainer<TipoPago, TipoPagoFormData>
        entities={tiposPago}
        filters={filters}
        config={tiposPagoConfig}
        service={tiposPagoService}
      />
    </AppLayout>
  );
}
