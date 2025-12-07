import axios from 'axios';

interface PermissionStructure {
    success: boolean;
    permissions: any[];
    total: number;
}

interface PermissionsGrouped {
    success: boolean;
    grouped: any[];
}

/**
 * Servicio para consumir la API de permisos
 * Centraliza todas las llamadas a permisos
 */
export const permissionService = {
    /**
     * Obtener estructura de permisos (para dropdowns/selectores)
     */
    async getStructure(): Promise<PermissionStructure> {
        const response = await axios.get('/api/permisos/estructura');
        return response.data;
    },

    /**
     * Obtener permisos agrupados por módulo
     */
    async getGrouped(): Promise<PermissionsGrouped> {
        const response = await axios.get('/api/permisos/agrupados');
        return response.data;
    },

    /**
     * Obtener permisos de un usuario
     */
    async getUserPermissions(userId: number) {
        const response = await axios.get(`/api/permisos/usuario/${userId}`);
        return response.data;
    },

    /**
     * Actualizar permisos de un usuario
     */
    async updateUserPermissions(userId: number, permissionIds: number[]) {
        const response = await axios.patch(`/api/permisos/usuario/${userId}`, {
            permisos: permissionIds,
        });
        return response.data;
    },

    /**
     * Obtener permisos de un rol
     */
    async getRolePermissions(roleId: number) {
        const response = await axios.get(`/api/permisos/rol/${roleId}`);
        return response.data;
    },

    /**
     * Actualizar permisos de un rol
     */
    async updateRolePermissions(roleId: number, permissionIds: number[]) {
        const response = await axios.patch(`/api/permisos/rol/${roleId}`, {
            permisos: permissionIds,
        });
        return response.data;
    },
};
