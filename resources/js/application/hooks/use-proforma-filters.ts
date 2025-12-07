import { useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface ProformaFilterState {
    searchProforma: string;
    filtroEstadoProforma: 'TODOS' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CONVERTIDA' | 'VENCIDA';
    soloVencidas: boolean;
    paginationInfo: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export function useProformaFilters(initialPaginationInfo: any) {
    // Inicializar filtros desde URL
    const urlParams = new URLSearchParams(window.location.search);

    const [searchProforma, setSearchProforma] = useState(urlParams.get('search') || '');
    const [filtroEstadoProforma, setFiltroEstadoProforma] = useState<any>(
        (urlParams.get('estado') as any) || 'TODOS'
    );
    const [soloVencidas, setSoloVencidas] = useState(urlParams.get('solo_vencidas') === 'true');
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
    const [paginationInfo, setPaginationInfo] = useState(initialPaginationInfo);

    // Aplicar filtros y recargar datos
    const aplicarFiltros = useCallback((page: number = 1) => {
        const params: any = { page };

        if (filtroEstadoProforma !== 'TODOS') {
            params.estado = filtroEstadoProforma;
        }

        if (searchProforma.trim()) {
            params.search = searchProforma.trim();
        }

        if (soloVencidas) {
            params.solo_vencidas = 'true';
        }

        // Actualizar paginación inmediatamente (CRITICAL FIX: evitar race condition)
        setPaginationInfo((prev: any) => ({
            ...prev,
            current_page: page,
            from: (page - 1) * prev.per_page + 1,
            to: Math.min(page * prev.per_page, prev.total),
        }));

        router.get('/logistica/dashboard', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['proformasRecientes'],
            replace: true,
        });
    }, [filtroEstadoProforma, searchProforma, soloVencidas]);

    // Aplicar filtros con debounce
    useEffect(() => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        const timeout = setTimeout(() => {
            aplicarFiltros(1);
        }, searchProforma ? 500 : 0);

        setDebounceTimeout(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [filtroEstadoProforma, soloVencidas, searchProforma, aplicarFiltros]);

    // Cambiar página
    const cambiarPagina = (page: number) => {
        aplicarFiltros(page);
    };

    return {
        searchProforma,
        setSearchProforma,
        filtroEstadoProforma,
        setFiltroEstadoProforma,
        soloVencidas,
        setSoloVencidas,
        paginationInfo,
        setPaginationInfo,
        cambiarPagina,
    };
}
