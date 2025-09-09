// Pages: Proveedores form page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/components/generic/generic-form-container';
import { proveedoresConfig } from '@/config/proveedores.config';
import proveedoresService from '@/services/proveedores.service';
import type { Proveedor, ProveedorFormData } from '@/domain/proveedores';

interface ProveedoresFormProps {
  proveedor?: Proveedor | null;
}

const initialProveedorData: ProveedorFormData = {
  nombre: '',
  razon_social: '',
  nit: '',
  telefono: '',
  email: '',
  direccion: '',
  contacto: '',
  foto_perfil: null,
  ci_anverso: null,
  ci_reverso: null,
  activo: true,
};

export default function ProveedoresForm({ proveedor }: ProveedoresFormProps) {
  const isEditing = !!proveedor;

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: proveedoresService.indexUrl() },
      { title: 'Proveedores', href: proveedoresService.indexUrl() },
      { title: isEditing ? 'Editar' : 'Nuevo', href: '#' }
    ]}>
      <GenericFormContainer<Proveedor, ProveedorFormData>
        entity={proveedor}
        config={proveedoresConfig}
        service={proveedoresService}
        initialData={initialProveedorData}
      />
    </AppLayout>
  );
}
