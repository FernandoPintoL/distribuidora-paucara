import { useState, useEffect, useCallback } from 'react';
import logisticaService from '@/infrastructure/services/logistica.service';

export interface ProformaStats {
    total: number;
    por_estado: {
        pendiente: number;
        aprobada: number;
        rechazada: number;
        convertida: number;
        vencida: number;
    };
    montos_por_estado: {
        pendiente: number;
        aprobada: number;
        rechazada: number;
        convertida: number;
        vencida: number;
    };
    por_canal: {
        app_externa: number;
        web: number;
        presencial: number;
    };
    alertas: {
        vencidas: number;
        por_vencer: number;
    };
    monto_total: number;
}

interface UseProformaStatsOptions {
    /** Habilitar actualización automática (default: true) */
    autoRefresh?: boolean;
    /** Intervalo de actualización en segundos (default: 30) */
    refreshInterval?: number;
    /** Datos iniciales del servidor (SSR con Inertia) */
    initialData?: Partial<ProformaStats>;
}

export function useProformaStats(options: UseProformaStatsOptions = {}) {
    const {
        autoRefresh = true,
        refreshInterval = 30,
        initialData,
    } = options;

    const [stats, setStats] = useState<ProformaStats | null>(
        initialData ? (initialData as ProformaStats) : null
    );
    const [loading, setLoading] = useState<boolean>(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    /**
     * Cargar estadísticas desde el endpoint
     */
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await logisticaService.obtenerEstadisticasProformas();

            if (response.success) {
                setStats(response.data);
                setLastUpdate(new Date());
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Error al cargar estadísticas';
            setError(errorMessage);
            console.error('Error cargando estadísticas de proformas:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Refrescar estadísticas manualmente
     */
    const refresh = useCallback(() => {
        fetchStats();
    }, [fetchStats]);

    /**
     * Efecto para carga inicial (si no hay datos iniciales)
     */
    useEffect(() => {
        if (!initialData) {
            fetchStats();
        }
    }, [initialData, fetchStats]);

    /**
     * Efecto para actualización automática
     */
    useEffect(() => {
        if (!autoRefresh) return;

        const intervalId = setInterval(() => {
            fetchStats();
        }, refreshInterval * 1000);

        return () => clearInterval(intervalId);
    }, [autoRefresh, refreshInterval, fetchStats]);

    return {
        stats,
        loading,
        error,
        lastUpdate,
        refresh,
    };
}
