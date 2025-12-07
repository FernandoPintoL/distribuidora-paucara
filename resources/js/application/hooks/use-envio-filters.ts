import { useState, useCallback } from 'react';

interface EnvioFilterState {
    searchEnvio: string;
    filtroEstadoEnvio: 'TODOS' | 'PROGRAMADO' | 'EN_PREPARACION' | 'EN_RUTA' | 'ENTREGADO' | 'CANCELADO';
    enviosPaginationInfo: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export function useEnvioFilters(initialPaginationInfo: any) {
    // Inicializar filtros desde URL
    const urlParams = new URLSearchParams(window.location.search);

    const [searchEnvio, setSearchEnvio] = useState(urlParams.get('search_envios') || '');
    const [filtroEstadoEnvio, setFiltroEstadoEnvio] = useState<any>(
        (urlParams.get('estado_envios') as any) || 'TODOS'
    );
    const [enviosPaginationInfo, setEnviosPaginationInfo] = useState(initialPaginationInfo);

    // Filtrar envíos localmente (sin llamada al servidor)
    const filtrarEnvios = useCallback((envios: any[]) => {
        return envios.filter((e) => {
            const coincideTexto =
                e.numero_seguimiento.toLowerCase().includes(searchEnvio.toLowerCase()) ||
                e.cliente_nombre.toLowerCase().includes(searchEnvio.toLowerCase());
            const coincideEstado = filtroEstadoEnvio === 'TODOS' || e.estado === filtroEstadoEnvio;
            return coincideTexto && coincideEstado;
        });
    }, [searchEnvio, filtroEstadoEnvio]);

    // Cambiar página
    const cambiarPaginaEnvio = (page: number) => {
        setEnviosPaginationInfo((prev: any) => ({
            ...prev,
            current_page: page,
            from: (page - 1) * prev.per_page + 1,
            to: Math.min(page * prev.per_page, prev.total),
        }));
    };

    return {
        searchEnvio,
        setSearchEnvio,
        filtroEstadoEnvio,
        setFiltroEstadoEnvio,
        enviosPaginationInfo,
        setEnviosPaginationInfo,
        filtrarEnvios,
        cambiarPaginaEnvio,
    };
}
