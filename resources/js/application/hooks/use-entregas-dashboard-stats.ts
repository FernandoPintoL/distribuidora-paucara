import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ✅ ACTUALIZADO: Usar Record<string, number> para soportar cualquier código de estado
// Esto permite que el dashboard sea agnóstico a qué códigos existen en la BD
export type EntregaEstado = Record<string, number>;

export interface MetricaZona {
    zona_id: number | null;
    nombre: string;
    total: number;
    completadas: number;
    porcentaje: number;
    tiempo_promedio_minutos: number;
}

export interface TopChofer {
    chofer_id: number;
    nombre: string;
    email: string;
    entregas_total: number;
    entregas_completadas: number;
    eficiencia_porcentaje: number;
}

export interface UltimoDia {
    fecha: string;
    dia: string;
    entregas: number;
}

export interface EntregaReciente {
    id: number;
    estado: string;
    cliente_nombre: string;
    chofer_nombre: string;
    fecha_entrega: string | null;
    fecha_programada: string | null;
    peso_kg: number;
    vehiculo_placa: string;
}

export interface EntregasDashboardStats {
    estados: EntregaEstado;
    estados_total: number;
    por_zona: MetricaZona[];
    top_choferes: TopChofer[];
    ultimos_7_dias: UltimoDia[];
    entregas_recientes: EntregaReciente[];
}

interface UseEntregasDashboardStatsOptions {
    /** Habilitar actualización automática (default: true) */
    autoRefresh?: boolean;
    /** Intervalo de actualización en segundos (default: 30) */
    refreshInterval?: number;
    /** Datos iniciales del servidor (SSR con Inertia) */
    initialData?: Partial<EntregasDashboardStats>;
}

export function useEntregasDashboardStats(options: UseEntregasDashboardStatsOptions = {}) {
    const {
        autoRefresh = true,
        refreshInterval = 30,
        initialData,
    } = options;

    const [stats, setStats] = useState<EntregasDashboardStats | null>(
        initialData ? (initialData as EntregasDashboardStats) : null
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

            const response = await axios.get('/logistica/entregas/dashboard-stats');

            if (response.data.success) {
                setStats(response.data.data);
                setLastUpdate(new Date());
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Error al cargar estadísticas';
            setError(errorMessage);
            console.error('Error cargando estadísticas de entregas:', err);
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
