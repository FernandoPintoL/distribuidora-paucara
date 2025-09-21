import React from 'react';
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { vehiculosConfig } from '@/config/vehiculos.config';
import vehiculosService from '@/services/vehiculos.service';
import type { Pagination } from '@/domain/shared';
import type { Vehiculo, VehiculoFormData } from '@/domain/vehiculos';

interface VehiculosIndexProps {
    vehiculos: Pagination<Vehiculo>;
    filters: { q?: string };
}

export default function VehiculosIndex({ vehiculos, filters }: VehiculosIndexProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: vehiculosService.indexUrl() },
            { title: 'Vehículos', href: vehiculosService.indexUrl() }
        ]}>
            <GenericContainer<Vehiculo, VehiculoFormData>
                entities={vehiculos}
                filters={filters}
                config={vehiculosConfig}
                service={vehiculosService}
            />
        </AppLayout>
    );
}
