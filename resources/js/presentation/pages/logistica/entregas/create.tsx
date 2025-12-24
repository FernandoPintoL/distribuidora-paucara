import { Head, router } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import type { VentaConDetalles, VehiculoCompleto, ChoferEntrega } from '@/domain/entities/entregas';
import CreateEntregasUnificado from './components/CreateEntregasUnificado';

interface Props extends PageProps {
    ventas: VentaConDetalles[];
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEntrega[];
    ventaPreseleccionada?: number;
}

/**
 * Página Unificada de Creación de Entregas
 *
 * FASE UNIFICADA: Una sola página para crear entregas simples o en lote
 *
 * Features:
 * ✅ Interfaz dinámica que se adapta según selección
 * ✅ 1 venta → Form Wizard inteligente (3 pasos)
 * ✅ 2+ ventas → Batch UI con optimización Phase 3
 * ✅ Auto-carga de pesos desde detalles de venta
 * ✅ Sugerencias de vehículos y choferes
 * ✅ Preview de optimización (clustering + ML + rebalanceo)
 * ✅ Dark mode completo
 * ✅ Cambio dinámico entre modos sin perder datos
 */
export default function Create({
    ventas,
    vehiculos,
    choferes,
    ventaPreseleccionada,
}: Props) {
    console.log('Renderizando Create Entregas Unificado con props:');
    const handleCancel = () => {
        router.visit('/logistica/entregas');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Logística', href: '/logistica' },
                { title: 'Entregas', href: '/logistica/entregas' },
                { title: 'Crear', href: '#' },
            ]}
        >
            <Head title="Crear Entrega/s - Unificado" />

            <CreateEntregasUnificado
                ventas={ventas}
                vehiculos={vehiculos}
                choferes={choferes}
                ventaPreseleccionada={ventaPreseleccionada}
                onCancel={handleCancel}
            />
        </AppLayout>
    );
}
