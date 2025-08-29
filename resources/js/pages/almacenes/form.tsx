// Pages: Almacenes form page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/components/generic/generic-form-container';
import { almacenesConfig } from '@/config/almacenes.config';
import almacenesService from '@/services/almacenes.service';
import type { Almacen, AlmacenFormData } from '@/domain/almacenes';

interface AlmacenesFormProps {
  almacen?: Almacen | null;
}

const initialAlmacenData: AlmacenFormData = {
  codigo: '',
  nombre: '',
  direccion: '',
  descripcion: '',
  activo: true,
};

export default function AlmacenesForm({ almacen }: AlmacenesFormProps) {
  const isEditing = !!almacen;

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: almacenesService.indexUrl() },
      { title: 'Almacenes', href: almacenesService.indexUrl() },
      { title: isEditing ? 'Editar' : 'Nuevo', href: '#' }
    ]}>
      <GenericFormContainer<Almacen, AlmacenFormData>
        entity={almacen}
        config={almacenesConfig}
        service={almacenesService}
        initialData={initialAlmacenData}
      />
    </AppLayout>
  );
}
