// Pages: Almacenes form page using generic components
import GenericFormContainer from '@/components/generic/generic-form-container';
import { almacenesConfig } from '@/config/almacenes.config';
import type { Almacen, AlmacenFormData } from '@/domain/almacenes';
import AppLayout from '@/layouts/app-layout';
import almacenesService from '@/services/almacenes.service';

interface AlmacenesFormProps {
    almacen?: Almacen | null;
}

const initialAlmacenData: AlmacenFormData = {
    nombre: '',
    direccion: '',
    ubicacion_fisica: '',
    requiere_transporte_externo: false,
    responsable: '',
    telefono: '',
    activo: true,
};

export default function AlmacenesForm({ almacen }: AlmacenesFormProps) {
    const isEditing = !!almacen;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: almacenesService.indexUrl() },
                { title: 'Almacenes', href: almacenesService.indexUrl() },
                { title: isEditing ? 'Editar' : 'Nuevo', href: '#' },
            ]}
        >
            <GenericFormContainer<Almacen, AlmacenFormData>
                entity={almacen}
                config={almacenesConfig}
                service={almacenesService}
                initialData={initialAlmacenData}
            />
        </AppLayout>
    );
}
