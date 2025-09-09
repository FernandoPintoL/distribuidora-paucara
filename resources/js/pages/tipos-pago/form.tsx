// Pages: Marcas form page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/components/generic/generic-form-container';
import { marcasConfig } from '@/config/marcas.config';
import marcasService from '@/services/marcas.service';
import type { Marca, MarcaFormData } from '@/domain/marcas';

interface MarcasFormProps {
  marca?: Marca | null;
}

const initialMarcaData: MarcaFormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  activo: true,
};

export default function MarcasForm({ marca }: MarcasFormProps) {
  const isEditing = !!marca;

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: marcasService.indexUrl() },
      { title: 'Marcas', href: marcasService.indexUrl() },
      { title: isEditing ? 'Editar' : 'Nueva', href: '#' }
    ]}>
      <GenericFormContainer<Marca, MarcaFormData>
        entity={marca}
        config={marcasConfig}
        service={marcasService}
        initialData={initialMarcaData}
      />
    </AppLayout>
  );
}
