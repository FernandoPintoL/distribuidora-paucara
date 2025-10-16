import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { useAuth } from '@/application/hooks/use-auth';
import FiltrosVentasComponent from '@/presentation/components/ventas/filtros-ventas';
import EstadisticasVentasComponent from '@/presentation/components/ventas/estadisticas-ventas';
import TablaVentas from '@/presentation/components/ventas/tabla-ventas';
import StockBajoAlerts from '@/presentation/components/ventas/stock-bajo-alerts';
import { Plus } from 'lucide-react';

// Importar tipos del domain
import type {
    Venta,
    FiltrosVentas,
    EstadisticasVentas,
    DatosParaFiltrosVentas
} from '@/domain/entities/ventas';
import type { Pagination } from '@/domain/entities/shared';

interface PageProps extends InertiaPageProps {
    ventas: Pagination<Venta>;
    filtros: FiltrosVentas;
    estadisticas: EstadisticasVentas;
    datosParaFiltros?: DatosParaFiltrosVentas;
}

export default function VentasIndex() {
    const { props } = usePage<PageProps>();
    const { can } = useAuth();

    const ventas = props.ventas;
    const filtros = props.filtros || {};
    const estadisticas = props.estadisticas;
    const datosParaFiltros = props.datosParaFiltros || {
        clientes: [],
        estados_documento: [],
        monedas: [],
        usuarios: []
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Ventas', href: '/ventas' }]}>
            <Head title="Ventas" />

            <div className="space-y-6 p-6">
                {/* Alertas de stock bajo */}
                <StockBajoAlerts />

                {/* Header */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ventas</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {ventas.total > 0
                                ? `${ventas.from}-${ventas.to} de ${ventas.total} ventas`
                                : 'No se encontraron ventas'
                            }
                        </p>
                    </div>

                    {can('ventas.create') && (
                        <Link
                            href="/ventas/create"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva venta
                        </Link>
                    )}
                </div>

                {/* Estadísticas */}
                {estadisticas && (
                    <EstadisticasVentasComponent estadisticas={estadisticas} />
                )}

                {/* Filtros */}
                <FiltrosVentasComponent
                    filtros={filtros}
                    datosParaFiltros={datosParaFiltros}
                />

                {/* Tabla de ventas */}
                <TablaVentas
                    ventas={ventas}
                    filtros={filtros}
                />
            </div>
        </AppLayout>
    );
}
