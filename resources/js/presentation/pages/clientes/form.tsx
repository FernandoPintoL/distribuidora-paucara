// Pages: Clientes form page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/presentation/components/generic/generic-form-container';
import { clientesConfig } from '@/config/modules/clientes.config';
import { clientesService } from '@/infrastructure/services/clientes.service';
import type { Cliente, ClienteFormData, ClientesFormPageProps } from '@/domain/entities/clientes';

const initialClienteData: ClienteFormData = {
  nombre: '',
  razon_social: '',
  nit: '',
  telefono: '',
  email: '',
  foto_perfil: null,
  ci_anverso: null,
  ci_reverso: null,
  localidad_id: null,
  activo: true,
  limite_credito: null,
  puede_tener_credito: false,
  // Inicializar direcciones como array vacío
  direcciones: [],
  // Inicializar ventanas de entrega como array vacío
  ventanas_entrega: [],
};

export default function ClientesForm({ cliente, localidades }: ClientesFormPageProps) {
  const isEditing = !!cliente;

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: clientesService.indexUrl() },
      { title: 'Clientes', href: clientesService.indexUrl() },
      { title: isEditing ? 'Editar' : 'Nuevo', href: '#' }
    ]}>
      <GenericFormContainer<Cliente, ClienteFormData>
        entity={cliente}
        config={clientesConfig}
        service={clientesService}
        initialData={initialClienteData}
        extraData={{ localidades }}
        loadOptions={async (fieldKey: string) => {
          if (fieldKey === 'localidad_id') {
            return await clientesService.loadLocalidadOptions();
          }
          return [];
        }}
      />
    </AppLayout>
  );
}
