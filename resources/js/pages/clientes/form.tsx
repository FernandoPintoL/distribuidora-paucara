// Pages: Clientes form page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/components/generic/generic-form-container';
import { clientesConfig } from '@/config/clientes.config';
import clientesService from '@/services/clientes.service';
import type { Cliente, ClienteFormData } from '@/domain/clientes';

interface ClientesFormProps {
  cliente?: Cliente | null;
  localidades?: Array<{ id: number; nombre: string; codigo: string }>;
}

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
  latitud: null,
  longitud: null,
  activo: true,
  // Inicializar direcciones como array vacío para que GenericForm contenga la propiedad
  direcciones: [],
};

export default function ClientesForm({ cliente, localidades }: ClientesFormProps) {
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
