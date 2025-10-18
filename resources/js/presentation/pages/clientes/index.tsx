// Pages: Clientes index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { clientesConfig } from '@/config/clientes.config';
import { clientesService } from '@/infrastructure/services/clientes.service';
import type { Pagination } from '@/domain/entities/shared';
import type { Cliente, ClienteFormData } from '@/domain/entities/clientes';

interface ClientesIndexProps {
  clientes: Pagination<Cliente>;
  filters: {
    q?: string;
    activo?: string | number | boolean | null;
    localidad_id?: number | null;
    order_by?: string | null;
    order_dir?: string | null
  };
  localidades?: Array<{ id: number; nombre: string; codigo: string }>;
}

export default function ClientesIndex({ clientes, filters, localidades }: ClientesIndexProps) {
  // Debug: Ver qué datos llegan del backend
  console.log('🔍 Datos de clientes del backend:', clientes.data);
  console.log('🔍 Primer cliente:', clientes.data[0]);

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
        extraData={{ localidades }}
      />
    </AppLayout>
  );
}
