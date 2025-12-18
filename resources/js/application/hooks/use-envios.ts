/**
 * Application Layer Hook: useEnvios
 *
 * Maneja la lógica de negocio para la gestión de envíos
 * Incluye navegación, filtrado y acciones comunes
 */

import { router } from '@inertiajs/react';
import type { Id } from '@/domain/entities/shared';

interface UseEnviosReturn {
    handleVerEnvio: (envioId: Id) => void;
    handlePaginaAnterior: (currentPage: number) => void;
    handlePaginaSiguiente: (currentPage: number) => void;
    handleCrearEnvio: () => void;
}

/**
 * Hook para manejo de envíos
 * Encapsula la lógica de navegación y acciones
 */
export const useEnvios = (): UseEnviosReturn => {
    /**
     * Navegar a detalle de envío
     */
    const handleVerEnvio = (envioId: Id) => {
        router.visit(`/envios/${envioId}`, { method: 'get' });
    };

    /**
     * Navegar a página anterior
     */
    const handlePaginaAnterior = (currentPage: number) => {
        router.get(`/envios?page=${currentPage - 1}`, {}, {
            preserveState: true,
            replace: true,
        });
    };

    /**
     * Navegar a página siguiente
     */
    const handlePaginaSiguiente = (currentPage: number) => {
        router.get(`/envios?page=${currentPage + 1}`, {}, {
            preserveState: true,
            replace: true,
        });
    };

    /**
     * Navegar a crear envío
     */
    const handleCrearEnvio = () => {
        router.visit('/envios/create', { method: 'get' });
    };

    return {
        handleVerEnvio,
        handlePaginaAnterior,
        handlePaginaSiguiente,
        handleCrearEnvio,
    };
};
