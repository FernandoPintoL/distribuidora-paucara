import { Head } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import type { VentaConDetalles, VehiculoCompleto, ChoferEntrega } from '@/domain/entities/entregas';
import { useEntregaWizard } from '@/application/hooks/use-entrega-wizard';
import EntregaFormWizard from './components/EntregaFormWizard';

interface Props extends PageProps {
    ventas: VentaConDetalles[];
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEntrega[];
    ventaPreseleccionada?: number;
}

/**
 * Página de Crear Entrega - Form Wizard Inteligente
 *
 * Features:
 * ✅ Auto-carga de peso desde detalles de venta
 * ✅ Auto-carga de dirección desde cliente
 * ✅ Sugerencias de vehículos por capacidad
 * ✅ Sugerencias de choferes por historial
 * ✅ Validaciones en tiempo real
 * ✅ 3 pasos progresivos con barra de progreso
 * ✅ Dark mode completo
 */
export default function Create({ ventas, vehiculos, choferes, ventaPreseleccionada }: Props) {
    const { isSubmitting, submitError, handleSubmit, handleCancel } = useEntregaWizard();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Logística', href: '/logistica' },
                { title: 'Entregas', href: '/logistica/entregas' },
                { title: 'Crear', href: '#' },
            ]}
        >
            <Head title="Crear Entrega - Form Wizard" />

            <div className="min-h-screen bg-white dark:bg-slate-950">
                <EntregaFormWizard
                    ventas={ventas}
                    vehiculos={vehiculos}
                    choferes={choferes}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </AppLayout>
    );
}
