/**
 * Capa de Lógica de Negocio - Módulos Sidebar
 *
 * Esta capa encapsula toda la lógica de negocio del dominio de módulos.
 * Actúa como intermediaria entre la Presentación y la Capa de Datos.
 *
 * Flujo:
 * Presentación (Index.tsx)
 *     ↓
 * Lógica de Negocio (este archivo)
 *     ↓
 * Capa de Datos (services/modulos-api.ts)
 *     ↓
 * API Backend
 */

import { ModuloSidebar } from './types';
import { modulosApi } from '@/services/modulos-api';

/**
 * Servicio de módulos - Encapsula toda la lógica de negocio
 */
export const modulosService = {
    /**
     * Obtiene los permisos disponibles del backend
     */
    async obtenerPermisosDisponibles(): Promise<string[]> {
        return modulosApi.obtenerPermisosDisponibles();
    },

    /**
     * Obtiene la matriz de acceso rol-módulo
     */
    async obtenerMatrizAcceso() {
        return modulosApi.obtenerMatrizAcceso();
    },

    /**
     * Obtiene los roles disponibles
     */
    async obtenerRoles() {
        return modulosApi.obtenerRoles();
    },

    /**
     * Obtiene la vista previa del sidebar para un rol específico
     * @param rolName - Nombre del rol
     */
    async obtenerPreviewPorRol(rolName: string) {
        return modulosApi.obtenerPreviewPorRol(rolName);
    },

    /**
     * Alterna el estado activo/inactivo de un módulo
     *
     * Lógica de negocio:
     * - Llama a la API para cambiar el estado
     * - Si falla, propaga el error para que la presentación lo maneje
     *
     * @param modulo - Módulo a alternar
     * @throws Error si la API falla
     */
    async alternarEstadoModulo(modulo: ModuloSidebar): Promise<void> {
        try {
            await modulosApi.toggleActivo(modulo.id);
        } catch (error) {
            throw new Error(`No se pudo cambiar el estado del módulo "${modulo.titulo}"`);
        }
    },

    /**
     * Guarda el nuevo orden de los módulos
     *
     * Lógica de negocio:
     * - Valida que haya módulos para reordenar
     * - Llama a la API para guardar el nuevo orden
     * - Si falla, propaga el error para que la presentación lo maneje
     *
     * @param orden - Array con id y nuevo orden de cada módulo
     * @throws Error si la API falla o no hay módulos
     */
    async guardarOrdenModulos(orden: Array<{ id: number; orden: number }>): Promise<void> {
        if (!orden || orden.length === 0) {
            throw new Error('No hay módulos para reordenar');
        }

        try {
            await modulosApi.guardarOrden(orden);
        } catch (error) {
            throw new Error('No se pudo guardar el nuevo orden de los módulos');
        }
    },

    /**
     * Crea un nuevo módulo
     *
     * Nota: La creación es manejada por Inertia.useForm() en la presentación
     * Este método puede extenderse para agregar validaciones de negocio
     */
    async crearModulo(data: any): Promise<void> {
        // Validaciones de negocio podrían ir aquí
        // Por ahora, es delegado a la presentación con Inertia.useForm()
    },

    /**
     * Actualiza un módulo existente
     *
     * Nota: La actualización es manejada por Inertia.useForm() en la presentación
     * Este método puede extenderse para agregar validaciones de negocio
     */
    async actualizarModulo(id: number, data: any): Promise<void> {
        // Validaciones de negocio podrían ir aquí
        // Por ahora, es delegado a la presentación con Inertia.useForm()
    },

    /**
     * Elimina un módulo
     *
     * Nota: La eliminación es manejada por Inertia.useForm() en la presentación
     * Este método puede extenderse para agregar validaciones de negocio
     */
    async eliminarModulo(id: number): Promise<void> {
        // Validaciones de negocio podrían ir aquí
        // Por ahora, es delegado a la presentación con Inertia.useForm()
    },
};
