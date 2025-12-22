import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Hooks
import { useProformaFilters } from '@/application/hooks/use-proforma-filters';
import { useProformaUnifiedModal } from '@/application/hooks/use-proforma-unified-modal';
import { useProformaStats } from '@/application/hooks/use-proforma-stats';
import { useLogisticaStats } from '@/application/hooks/use-logistica-stats';

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

const MOTIVOS_RECHAZO = [
    { value: 'cliente_cancelo', label: 'Cliente canceló el pedido' },
    { value: 'sin_disponibilidad', label: 'No hay disponibilidad para la fecha solicitada' },
    { value: 'sin_respuesta', label: 'Cliente no contestó llamadas' },
    { value: 'fuera_cobertura', label: 'Dirección fuera de cobertura' },
    { value: 'stock_insuficiente', label: 'Stock insuficiente' },
    { value: 'otro', label: 'Otro motivo (especificar abajo)' },
];

export default function LogisticaDashboard({ estadisticas, proformasRecientes }: DashboardLogisticaProps) {
    // Estados principales
    const [stats] = useState<DashboardLogisticaStats>(estadisticas);
    const [proformas, setProformas] = useState<ProformaAppExterna[]>(proformasRecientes.data);

    // Hooks de filtros
    const proformaFilters = useProformaFilters(proformasRecientes);

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
    } = useProformaStats({
        autoRefresh: true,
        refreshInterval: 30,
    });

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

    // Filtrar envios localmente
    const enviosFiltrados = envioFilters.filtrarEnvios(envios);

    // Verificar si proforma está vencida
    const estaVencida = (proforma: ProformaAppExterna): boolean => {
        if (!proforma.fecha_vencimiento) return false;
        const fechaVenc = new Date(proforma.fecha_vencimiento);
        return fechaVenc < new Date() && !['RECHAZADA', 'CONVERTIDA'].includes(proforma.estado);
    };

    // Badge de estado
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

            <div className="space-y-6 p-4">
                {/* Estadísticas */}
                <DashboardStats
                    logisticaStats={logisticaStats}
                    proformaStats={proformaStats}
                    stats={stats}
                    loadingLogisticaStats={loadingLogisticaStats}
                    logisticaLastUpdate={logisticaLastUpdate}
                    refreshLogisticaStats={refreshLogisticaStats}
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
                    onRechazar={() => rechazarProforma(MOTIVOS_RECHAZO)}
                    isProcessing={false}
                    cargandoDetalles={cargandoDetalles}
                />
            </div>
        </AppLayout>
    );
}
