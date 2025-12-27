import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Plus } from 'lucide-react';

// Hooks
import { useEntregasDashboardStats } from '@/application/hooks/use-entregas-dashboard-stats';

// Componentes
import { PageHeader } from '@/presentation/components/entrega/PageHeader';
import { DashboardEntregasStats } from './components/DashboardEntregasStats';
import { MetricasZonas } from './components/MetricasZonas';
import { TopChoferes } from './components/TopChoferes';
import { EntregasUltimos7Dias } from './components/EntregasUltimos7Dias';
import { EntregasPorEstado } from './components/EntregasPorEstado';
import { EntregasRecientes } from './components/EntregasRecientes';

export default function DashboardEntregas() {
    // Hook para cargar estadísticas
    const {
        stats,
        loading,
        lastUpdate,
        refresh,
    } = useEntregasDashboardStats({
        autoRefresh: true,
        refreshInterval: 30, // Actualizar cada 30 segundos
    });

    const handleVerEntrega = (entregaId: number) => {
        window.location.href = `/logistica/entregas/${entregaId}`;
    };

    if (!stats && loading) {
        return (
            <AppLayout>
                <Head title="Dashboard de Entregas" />
                <div className="space-y-6 p-4">
                    <div className="text-center text-muted-foreground">
                        Cargando dashboard...
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!stats) {
        return (
            <AppLayout>
                <Head title="Dashboard de Entregas" />
                <div className="space-y-6 p-4">
                    <div className="text-center text-red-500">
                        Error al cargar las estadísticas
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Dashboard de Entregas" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <PageHeader
                    title="Dashboard de Entregas"
                    description="Visualización completa de estadísticas de entregas y rendimiento"
                    actions={
                        <Link href="/logistica/entregas/create">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Entrega
                            </Button>
                        </Link>
                    }
                />

                {/* Cards de Estados */}
                <DashboardEntregasStats
                    estados={stats.estados}
                    estadosTotal={stats.estados_total}
                    loading={loading}
                    lastUpdate={lastUpdate}
                    onRefresh={refresh}
                />

                {/* Gráficos */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <EntregasPorEstado
                        estados={stats.estados}
                        loading={loading}
                    />
                    <EntregasUltimos7Dias
                        datos={stats.ultimos_7_dias}
                        loading={loading}
                    />
                </div>

                {/* Métricas por Zona */}
                <MetricasZonas
                    zonasData={stats.por_zona}
                    loading={loading}
                />

                {/* Top Choferes */}
                <TopChoferes
                    choferes={stats.top_choferes}
                    loading={loading}
                />

                {/* Entregas Recientes */}
                <EntregasRecientes
                    entregas={stats.entregas_recientes}
                    loading={loading}
                    onVerEntrega={handleVerEntrega}
                />
            </div>
        </AppLayout>
    );
}
