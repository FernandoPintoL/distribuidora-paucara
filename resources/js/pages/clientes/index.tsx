// Pages: Clientes index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { clientesConfig } from '@/config/clientes.config';
import clientesService from '@/services/clientes.service';
import type { Pagination } from '@/domain/shared';
import type { Cliente, ClienteFormData } from '@/domain/clientes';

interface ClientesIndexProps {
  clientes: Pagination<Cliente>;
  filters: { q?: string; activo?: string | number | boolean | null; order_by?: string | null; order_dir?: string | null };
}

export default function ClientesIndex({ clientes, filters }: ClientesIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: clientesService.indexUrl() },
      { title: 'Clientes', href: clientesService.indexUrl() }
    ]}>
      <GenericContainer<Cliente, ClienteFormData>
        entities={clientes}
        filters={filters}
        config={clientesConfig}
        service={clientesService}
      />
    </AppLayout>
  );
}
