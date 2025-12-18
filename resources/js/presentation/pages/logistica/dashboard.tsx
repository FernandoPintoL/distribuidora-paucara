import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';

// Hooks
import { useProformaFilters } from '@/application/hooks/use-proforma-filters';
import { useEnvioFilters } from '@/application/hooks/use-envio-filters';
import { useProformaUnifiedModal } from '@/application/hooks/use-proforma-unified-modal';
import { useProformaStats } from '@/application/hooks/use-proforma-stats';
import { useLogisticaStats } from '@/application/hooks/use-logistica-stats';

// Componentes
import { DashboardStats } from './components/DashboardStats';
import { ProformasSection } from './components/ProformasSection';
import { EnviosSection } from './components/EnviosSection';
import { ProformaUnifiedModal } from './components/modals/ProformaUnifiedModal';

// Domain entities (centralized type definitions)
import type {
    ProformaAppExterna,
    EnvioLogistica,
    DashboardLogisticaStats,
    PaginatedEnvios,
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

export default function LogisticaDashboard({ estadisticas, proformasRecientes, enviosActivos }: DashboardLogisticaProps) {
    // Estados principales
    const [stats] = useState<DashboardLogisticaStats>(estadisticas);
    const [proformas, setProformas] = useState<ProformaAppExterna[]>(proformasRecientes.data);

    // Helper: detectar si enviosActivos es paginado
    const isEnviosPaginated = (envios: PaginatedEnvios | EnvioLogistica[]): envios is PaginatedEnvios => {
        return Array.isArray(envios) === false && 'data' in envios;
    };

    const [envios] = useState<EnvioLogistica[]>(
        isEnviosPaginated(enviosActivos) ? enviosActivos.data : enviosActivos
    );

    // Hooks de filtros
    const proformaFilters = useProformaFilters(proformasRecientes);
    const envioFilters = useEnvioFilters(
        isEnviosPaginated(enviosActivos)
            ? {
                current_page: enviosActivos.current_page,
                last_page: enviosActivos.last_page,
                per_page: enviosActivos.per_page,
                total: enviosActivos.total,
                from: enviosActivos.from,
                to: enviosActivos.to,
            }
            : { current_page: 1, last_page: 1, per_page: 15, total: envios.length, from: 1, to: envios.length }
    );

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

    // Ver envio
    const handleVerEnvio = (envio: EnvioLogistica) => {
        window.location.href = `/logistica/seguimiento/${envio.id}`;
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

                {/* Tabs para proformas y Envios */}
                <Tabs defaultValue="entregas" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="entregas">Entregas</TabsTrigger>
                        <TabsTrigger value="proformas">Proformas App Externa</TabsTrigger>
                    </TabsList>

                    {/* Tab de Entregas */}
                    <TabsContent value="entregas">
                        <EnviosSection
                            envios={enviosFiltrados}
                            enviosPaginationInfo={envioFilters.enviosPaginationInfo}
                            searchEnvio={envioFilters.searchEnvio}
                            setSearchEnvio={envioFilters.setSearchEnvio}
                            filtroEstadoEnvio={envioFilters.filtroEstadoEnvio}
                            setFiltroEstadoEnvio={envioFilters.setFiltroEstadoEnvio}
                            cambiarPaginaEnvio={envioFilters.cambiarPaginaEnvio}
                            onVerEnvio={handleVerEnvio}
                            getEstadoBadge={getEstadoBadge}
                        />
                    </TabsContent>

                    {/* Tab de proformas */}
                    <TabsContent value="proformas">
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
                    </TabsContent>
                </Tabs>

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
