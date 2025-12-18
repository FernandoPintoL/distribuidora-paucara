import { httpClient } from './http-client';
import type { AdminUsuario, AdminRol, PermisoAudit, PermissionGroup } from '@/domain/entities/admin-permisos';

interface EstadisticasHistorial {
  total_cambios: number;
  cambios_hoy: number;
  cambios_esta_semana: number;
  cambios_este_mes: number;
}

export class PermisosService {
  /**
   * Obtiene todos los permisos disponibles agrupados por módulo
   */
  static async getPermisosDisponibles(): Promise<PermissionGroup[]> {
    try {
      const response = await httpClient.get<{ data: PermissionGroup[] }>('/permisos/agrupados');
      return response.data || [];
    } catch (error) {
      console.error('Error al cargar permisos disponibles:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de usuarios con filtro opcional
   */
  static async getUsuarios(search?: string): Promise<AdminUsuario[]> {
    try {
      const response = await httpClient.get<{ data: AdminUsuario[] }>('/usuarios', {
        params: { search: search || undefined },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de roles con filtro opcional
   */
  static async getRoles(search?: string): Promise<AdminRol[]> {
    try {
      const response = await httpClient.get<{ data: AdminRol[] }>('/roles', {
        params: { search: search || undefined },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error al cargar roles:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de auditoría con filtro opcional
   */
  static async getHistorial(filtro?: string | null): Promise<{
    data: PermisoAudit[];
    estadisticas: EstadisticasHistorial;
  }> {
    try {
      const response = await httpClient.get<{
        data: PermisoAudit[];
        estadisticas: EstadisticasHistorial;
      }>('/permisos/historial', {
        params: { target_type: filtro || undefined },
      });
      return {
        data: response.data || [],
        estadisticas: response.estadisticas,
      };
    } catch (error) {
      console.error('Error al cargar historial:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de módulos disponibles
   */
  static async getModulos(): Promise<string[]> {
    try {
      const response = await httpClient.get<any>('/modulos-sidebar');
      // Mapear los módulos para obtener solo los títulos/nombres
      if (Array.isArray(response)) {
        return response.map((m: any) => m.titulo || m.name).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      throw error;
    }
  }

  /**
   * Obtiene los permisos disponibles desagrupados, con filtros opcionales
   */
  static async getPermisos(search?: string, modulo?: string): Promise<any[]> {
    try {
      // Obtener permisos disponibles agrupados
      const response = await httpClient.get<any>('/permisos/agrupados');

      let permisos: any[] = [];
      let groupedData = response;

      // Si la respuesta tiene un campo 'grouped', usarlo
      if (response && response.grouped && Array.isArray(response.grouped)) {
        groupedData = response.grouped;
      }

      // Desagrupar los permisos si vienen agrupados por módulo
      if (Array.isArray(groupedData)) {
        // Si es array de PermissionGroup
        permisos = groupedData.flatMap((group: any) => {
          if (group.permissions && Array.isArray(group.permissions)) {
            // Agregar el módulo a cada permiso para referencia
            return group.permissions.map((p: any) => ({
              ...p,
              module: group.module || group.name || 'General'
            }));
          }
          return [];
        });
      } else if (groupedData && typeof groupedData === 'object') {
        // Si viene como objeto con módulos como keys
        permisos = Object.entries(groupedData).flatMap(([module, permissions]: any) => {
          if (Array.isArray(permissions)) {
            return permissions.map((p: any) => ({
              ...p,
              module
            }));
          }
          return [];
        });
      }

      // Filtrar por búsqueda si se proporciona
      if (search) {
        permisos = permisos.filter((p: any) =>
          (p.name?.toLowerCase().includes(search.toLowerCase())) ||
          (p.description?.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // Filtrar por módulo si se proporciona
      if (modulo) {
        permisos = permisos.filter((p: any) => p.module === modulo);
      }

      return permisos;
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      throw error;
    }
  }

  /**
   * Ejecuta operación de edición en lote
   */
  static async bulkEdit(
    tipo: 'usuarios' | 'roles',
    ids: number[],
    permisos: number[],
    accion: 'reemplazar' | 'agregar' | 'eliminar'
  ): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<{ message: string }>('/permisos/bulk-edit', {
        tipo,
        ids,
        permisos,
        accion,
      });
      return response;
    } catch (error) {
      console.error('Error en bulk edit:', error);
      throw error;
    }
  }
}
