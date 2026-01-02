/**
 * React Context para Estados Logísticos Centralizados
 *
 * Proporciona acceso global a todos los estados logísticos
 * con gestión de cache, loading states, y error handling.
 *
 * Inicialización:
 * 1. Intenta cargar del cache localStorage
 * 2. Si cache es inválido, fetch desde API
 * 3. Almacena en cache con TTL de 7 días
 *
 * @module application/contexts/EstadosContext
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import type {
    CategoriaEstado,
    Estado,
    EstadosContextState,
} from '@/domain/entities/estados-centralizados';
import estadosApiService from '@/infrastructure/services/estados-api.service';
import {
    getAllCachedEstados,
    updateMultipleCachedEstados,
    clearEstadosCache,
    getCacheSummary,
} from '@/infrastructure/utils/estados-cache';

/**
 * React Context para Estados
 */
const EstadosContext = createContext<EstadosContextState | undefined>(
    undefined
);

/**
 * Props del EstadosProvider
 */
interface EstadosProviderProps {
    children: React.ReactNode;
}

/**
 * Provider que envuelve la aplicación y proporciona acceso a estados
 */
export function EstadosProvider({ children }: EstadosProviderProps) {
    const [estados, setEstados] = useState<
        Partial<Record<CategoriaEstado, Estado[]>>
    >({});
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Inicializa los estados desde cache o API
     */
    const initializeEstados = useCallback(async () => {
        console.log('[EstadosProvider] Initializing states...');
        setIsLoading(true);
        setError(null);

        try {
            // Intentar cargar del cache primero
            const cachedEstados = getAllCachedEstados();

            if (
                cachedEstados &&
                Object.keys(cachedEstados).length > 0
            ) {
                console.log(
                    '[EstadosProvider] ✅ Loaded from cache:',
                    getCacheSummary()
                );
                setEstados(cachedEstados);
                setIsInitialized(true);
                setIsLoading(false);
                return;
            }

            // Cache miss - fetch desde API
            console.log(
                '[EstadosProvider] 📥 Cache miss, fetching from API...'
            );
            const allEstados = await estadosApiService.getAllEstados();

            // Actualizar cache con los nuevos datos
            updateMultipleCachedEstados(allEstados);
            setEstados(allEstados);
            setIsInitialized(true);

            console.log(
                '[EstadosProvider] ✅ Initialized from API:',
                getCacheSummary()
            );
        } catch (err) {
            const error =
                err instanceof Error
                    ? err
                    : new Error('Failed to load estados');

            console.error('[EstadosProvider] ❌ Error:', error.message);
            setError(error);
            setEstados({});
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Refresca los estados desde la API (ignorando cache)
     */
    const refreshEstados = useCallback(async () => {
        console.log('[EstadosProvider] 🔄 Refreshing estados from API...');
        setIsLoading(true);
        setError(null);

        try {
            const allEstados = await estadosApiService.getAllEstados();
            updateMultipleCachedEstados(allEstados);
            setEstados(allEstados);

            console.log(
                '[EstadosProvider] ✅ Refresh complete:',
                getCacheSummary()
            );
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Refresh failed');

            console.error('[EstadosProvider] ❌ Refresh error:', error.message);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Limpia el cache y reinicializa
     */
    const clearCache = useCallback(() => {
        console.log('[EstadosProvider] 🗑️  Clearing cache...');
        clearEstadosCache();
        setIsInitialized(false);
        setEstados({});
        initializeEstados();
    }, [initializeEstados]);

    /**
     * Obtiene los estados de una categoría específica
     */
    const getEstadosPorCategoria = useCallback(
        (categoria: CategoriaEstado): Estado[] => {
            return estados[categoria] || [];
        },
        [estados]
    );

    /**
     * Obtiene un estado específico por código
     */
    const getEstadoPorCodigo = useCallback(
        (categoria: CategoriaEstado, codigo: string): Estado | undefined => {
            const categEstados = estados[categoria] || [];
            return categEstados.find((e) => e.codigo === codigo);
        },
        [estados]
    );

    /**
     * Efecto: Inicializar estados al montar el componente
     */
    useEffect(() => {
        // Solo inicializar una vez
        if (!isInitialized && !isLoading) {
            initializeEstados();
        }
    }, [isInitialized, isLoading, initializeEstados]);

    /**
     * Valor del contexto
     */
    const value: EstadosContextState = {
        estados,
        isLoading,
        isInitialized,
        error,
        refreshEstados,
        clearCache,
        getEstadosPorCategoria,
        getEstadoPorCodigo,
    };

    return (
        <EstadosContext.Provider value={value}>
            {children}
        </EstadosContext.Provider>
    );
}

/**
 * Hook para usar el contexto de estados
 * @throws Error si se usa fuera del EstadosProvider
 */
export function useEstadosContext(): EstadosContextState {
    const context = useContext(EstadosContext);

    if (!context) {
        throw new Error(
            'useEstadosContext debe ser utilizado dentro de EstadosProvider'
        );
    }

    return context;
}

/**
 * Export default del provider para mayor conveniencia
 */
export default EstadosProvider;
