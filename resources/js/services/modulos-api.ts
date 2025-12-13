import { router } from '@inertiajs/react';
import { ModuloSidebar } from '@/domain/modulos/types';
import { getCsrfHeaders } from './csrf';

/**
 * Servicio centralizado para todas las operaciones API de módulos
 * Centraliza la lógica de comunicación con el backend
 */

export const modulosApi = {
    /**
     * Obtiene los permisos disponibles
     */
    async obtenerPermisosDisponibles(): Promise<string[]> {
        const response = await fetch('/api/modulos-sidebar/permisos/disponibles');
        if (!response.ok) throw new Error('Error al obtener permisos');
        return response.json();
    },

    /**
     * Obtiene la matriz de acceso rol-módulo
     */
    async obtenerMatrizAcceso() {
        const response = await fetch('/api/modulos-sidebar/matriz-acceso');
        if (!response.ok) throw new Error('Error al obtener matriz de acceso');
        return response.json();
    },

    /**
     * Obtiene los roles disponibles
     */
    async obtenerRoles() {
        const response = await fetch('/api/modulos-sidebar/roles');
        if (!response.ok) throw new Error('Error al obtener roles');
        return response.json();
    },

    /**
     * Obtiene la vista previa del sidebar para un rol específico
     */
    async obtenerPreviewPorRol(rolName: string) {
        const response = await fetch(`/api/modulos-sidebar/preview/${rolName}`);
        if (!response.ok) throw new Error('Error al obtener preview');
        return response.json();
    },

    /**
     * Alterna el estado activo/inactivo de un módulo
     * Usa router.patch() de Inertia para mantener consistencia
     */
    toggleActivo(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            router.patch(
                `/modulos-sidebar/${id}/toggle-activo`,
                {},
                {
                    onSuccess: () => resolve(),
                    onError: () => reject(new Error('Error al cambiar el estado del módulo')),
                }
            );
        });
    },

    /**
     * Guarda el nuevo orden de los módulos
     * Usa Inertia.post() para mantener consistencia con el backend
     */
    async guardarOrden(orden: Array<{ id: number; orden: number }>): Promise<void> {
        return new Promise((resolve, reject) => {
            router.post(
                '/modulos-sidebar/actualizar-orden',
                { modulos: orden },
                {
                    onSuccess: () => resolve(),
                    onError: () => reject(new Error('Error al guardar orden')),
                }
            );
        });
    },
};
