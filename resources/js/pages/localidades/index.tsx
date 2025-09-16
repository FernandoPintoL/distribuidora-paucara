// Pages: Localidades index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/components/generic/generic-container';
import { localidadesConfig } from '@/config/localidades.config';
import localidadesService from '@/services/localidades.service';
import type { Pagination } from '@/domain/shared';
import type { Localidad, LocalidadFormData } from '@/domain/localidades';

interface LocalidadesIndexProps {
    localidades: Pagination<Localidad>;
    filters: { q?: string };
}

export default function LocalidadesIndex({ localidades, filters }: LocalidadesIndexProps) {
    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: localidadesService.indexUrl() },
            { title: 'Localidades', href: localidadesService.indexUrl() }
        ]}>
            <GenericContainer<Localidad, LocalidadFormData>
                entities={localidades}
                filters={filters}
                config={localidadesConfig}
                service={localidadesService}
            />
        </AppLayout>
    );
}