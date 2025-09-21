import React from 'react';
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/components/generic/generic-form-container';
import { vehiculosConfig } from '@/config/vehiculos.config';
import vehiculosService from '@/services/vehiculos.service';

export default function VehiculoForm(props: Record<string, unknown>) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: vehiculosService.indexUrl() },
            { title: 'Vehículos', href: vehiculosService.indexUrl() }
        ]}>
            <GenericFormContainer
                config={vehiculosConfig}
                service={vehiculosService}
                initialData={{} as Record<string, unknown>}
                {...props}
            />
        </AppLayout>
    );
}
