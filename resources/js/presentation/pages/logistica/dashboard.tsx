import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Hooks
import { useProformaFilters } from '@/application/hooks/use-proforma-filters';
import { useProformaUnifiedModal } from '@/application/hooks/use-proforma-unified-modal';
import { useProformaStats } from '@/application/hooks/use-proforma-stats';
import { useLogisticaStats } from '@/application/hooks/use-logistica-stats';
import { useDashboardWebSocket } from '@/application/hooks/use-dashboard-websocket';
import { useProformaNotifications } from '@/application/hooks/use-proforma-notifications';

// Componentes
import { DashboardStats } from './components/DashboardStats';
import { ProformasSection } from './components/ProformasSection';
import { ProformaUnifiedModal } from './components/modals/ProformaUnifiedModal';

// Domain entities (centralized type definitions)
import type {
    ProformaAppExterna,
    DashboardLogisticaStats,
    DashboardLogisticaProps,
} from '@/domain/entities/logistica';

// Utilidades centralizadas
import { MOTIVOS_RECHAZO_PROFORMA } from '@/lib/proformas.utils';

export default function LogisticaDashboard({ estadisticas, proformasRecientes, localidades }: DashboardLogisticaProps & { localidades: Array<{id: number; nombre: string}> }) {
    // Estados principales
    const [stats] = useState<DashboardLogisticaStats>(estadisticas);
    const [proformas, setProformas] = useState<ProformaAppExterna[]>(proformasRecientes.data);

    // Hooks de filtros
    const proformaFilters = useProformaFilters(proformasRecientes);

    // Hook de WebSocket para dashboard en tiempo real
    const { metricas: dashboardMetricas, lastUpdate: dashboardLastUpdate, isRefreshing: dashboardIsRefreshing, refresh: refreshDashboard } = useDashboardWebSocket(estadisticas);

    // Hook para notificaciones de proformas en tiempo real
    const { requestNotificationPermission } = useProformaNotifications();

    // Solicitar permisos de notificación al cargar
    useEffect(() => {
        requestNotificationPermission();
    }, [requestNotificationPermission]);

    // Hooks de estadísticas
    const {
        stats: logisticaStats,
        loading: loadingLogisticaStats,
        lastUpdate: logisticaLastUpdate,
        refresh: refreshLogisticaStats,
    } = useLogisticaStats({
        autoRefresh: true,
        refreshInterval: 30,
    });

    const {
        stats: proformaStats,
        loading: loadingProformaStats,
        error: proformaError,
    } = useProformaStats({
        autoRefresh: true,
        refreshInterval: 30,
    });

    // Debug: Log datos recibidos
    useEffect(() => {
        console.log('=== LOGISTICA DASHBOARD DEBUG ===');
        console.log('Stats from Inertia (estadisticas):', stats);
        console.log('Proforma Stats from API:', proformaStats);
        console.log('Proforma Loading:', loadingProformaStats);
        console.log('================================');
    }, [stats, proformaStats, loadingProformaStats, proformaError, logisticaStats]);

    // Hook de modal unificado
    const {
        mostrarModal,
        proformaSeleccionada,
        tabActiva,
        datosConfirmacion,
        motivoRechazoSeleccionado,
        motivoRechazoCustom,
        notasLlamada,
        cargandoDetalles,
        setTabActiva,
        setDatosConfirmacion,
        setMotivoRechazoSeleccionado,
        setMotivoRechazoCustom,
        setNotasLlamada,
        cerrarModal,
        aprobarProforma,
        rechazarProforma,
    } = useProformaUnifiedModal();

    // Actualizar proformas cuando cambian las props
    useEffect(() => {
        setProformas(proformasRecientes.data);
        proformaFilters.setPaginationInfo({
            current_page: proformasRecientes.current_page,
            last_page: proformasRecientes.last_page,
            per_page: proformasRecientes.per_page,
            total: proformasRecientes.total,
            from: proformasRecientes.from,
            to: proformasRecientes.to,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proformasRecientes]);

    // Verificar si proforma está vencida
    const estaVencida = (proforma: ProformaAppExterna): boolean => {
        if (!proforma.fecha_vencimiento) return false;
        const fechaVenc = new Date(proforma.fecha_vencimiento);
        return fechaVenc < new Date() && !['RECHAZADA', 'CONVERTIDA'].includes(proforma.estado);
    };

    // Badge de estado
    // Fase 3.7: Este función muestra emojis + texto
    // Nota: En Fase 3.8+, considerar refactorizar para usar ProformaEstadoBadge component
    // que ahora tiene integración completa con hooks dinámicos
    const getEstadoBadge = (estado: string) => {
        const emojis: Record<string, string> = {
            'PENDIENTE': '🟡',
            'APROBADA': '🟢',
            'RECHAZADA': '🔴',
            'CONVERTIDA': '🔵',
            'VENCIDA': '⚫'
        };

        const emoji = emojis[estado] || '';
        return `${emoji} ${estado}`;
    };

    // Ver proforma
    const handleVerProforma = (proforma: ProformaAppExterna) => {
        window.open(`/proformas/${proforma.id}`, '_blank');
    };


    return (
        <AppLayout>
            <Head title="Dashboard de Logística" />

            <div className="space-y-6 p-4 bg-white dark:bg-slate-950 min-h-screen">
                {/* Estadísticas */}
                <DashboardStats
                    logisticaStats={logisticaStats}
                    proformaStats={proformaStats}
                    stats={dashboardMetricas || stats}
                    loadingLogisticaStats={loadingLogisticaStats}
                    logisticaLastUpdate={logisticaLastUpdate}
                    refreshLogisticaStats={refreshLogisticaStats}
                    dashboardLastUpdate={dashboardLastUpdate}
                    dashboardIsRefreshing={dashboardIsRefreshing}
                    refreshDashboard={refreshDashboard}
                />

                {/* Sección de Proformas */}
                <ProformasSection
                    proformas={proformas}
                    paginationInfo={proformaFilters.paginationInfo}
                    searchProforma={proformaFilters.searchProforma}
                    setSearchProforma={proformaFilters.setSearchProforma}
                    filtroEstadoProforma={proformaFilters.filtroEstadoProforma}
                    setFiltroEstadoProforma={proformaFilters.setFiltroEstadoProforma}
                    soloVencidas={proformaFilters.soloVencidas}
                    setSoloVencidas={proformaFilters.setSoloVencidas}
                    filtroLocalidad={proformaFilters.filtroLocalidad}
                    setFiltroLocalidad={proformaFilters.setFiltroLocalidad}
                    localidades={localidades}
                    cambiarPagina={proformaFilters.cambiarPagina}
                    onVerProforma={handleVerProforma}
                    getEstadoBadge={getEstadoBadge}
                    estaVencida={estaVencida}
                />

                {/* Modal Unificado */}
                <ProformaUnifiedModal
                    isOpen={mostrarModal}
                    onClose={cerrarModal}
                    proforma={proformaSeleccionada}
                    tabActiva={tabActiva}
                    setTabActiva={setTabActiva}
                    datosConfirmacion={datosConfirmacion}
                    setDatosConfirmacion={setDatosConfirmacion}
                    motivoRechazoSeleccionado={motivoRechazoSeleccionado}
                    setMotivoRechazoSeleccionado={setMotivoRechazoSeleccionado}
                    motivoRechazoCustom={motivoRechazoCustom}
                    setMotivoRechazoCustom={setMotivoRechazoCustom}
                    notasLlamada={notasLlamada}
                    setNotasLlamada={setNotasLlamada}
                    onAprobar={() => aprobarProforma()}
                    onRechazar={() => rechazarProforma(MOTIVOS_RECHAZO_PROFORMA)}
                    isProcessing={false}
                    cargandoDetalles={cargandoDetalles}
                />
            </div>
        </AppLayout>
    );
}
