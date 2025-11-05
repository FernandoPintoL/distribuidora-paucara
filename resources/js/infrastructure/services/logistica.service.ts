// Application Layer: Logistica service
// Encapsulates URL building and API calls for logistics operations (entregas, proformas)

import { router } from '@inertiajs/react';
import type { Filters, Id } from '@/domain/entities/shared';
import type { BaseService } from '@/domain/entities/generic';
import NotificationService from '@/infrastructure/services/notification.service';

export interface Entrega {
    id: number;
    proforma_id: number;
    chofer_id?: number;
    vehiculo_id?: number;
    estado: 'ASIGNADA' | 'EN_CAMINO' | 'LLEGO' | 'ENTREGADO' | 'NOVEDAD' | 'CANCELADA';
    fecha_asignacion?: string;
    fecha_inicio?: string;
    fecha_entrega?: string;
    observaciones?: string;
}

export interface Proforma {
    id: number;
    numero: string;
    cliente_nombre: string;
    total: number;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
    canal_origen: string;
    fecha: string;
    usuario_creador_nombre: string;
    // Solicitud del cliente
    fecha_entrega_solicitada?: string;
    hora_entrega_solicitada?: string;
    direccion_entrega_solicitada_id?: number;
    direccionSolicitada?: any;
    // Confirmación del vendedor
    fecha_entrega_confirmada?: string;
    hora_entrega_confirmada?: string;
    direccion_entrega_confirmada_id?: number;
    direccionConfirmada?: any;
    // Auditoría
    coordinacion_completada?: boolean;
    comentario_coordinacion?: string;
    // Cliente relacionado
    cliente?: any;
}

export interface FiltrosEntregas extends Filters {
    estado?: string;
    chofer_id?: Id | '';
    vehiculo_id?: Id | '';
    fecha_desde?: string;
    fecha_hasta?: string;
}

export interface FiltrosProformas extends Filters {
    estado?: string;
    cliente_id?: Id | '';
    fecha_desde?: string;
    fecha_hasta?: string;
}

export interface AsignarEntregaData {
    chofer_id: Id;
    vehiculo_id: Id;
}

export interface ActualizarEstadoEntregaData {
    estado: string;
    comentario?: string;
    motivo?: string;
}

export interface AprobarProformaData {
    comentario?: string;
    fecha_entrega_confirmada?: string;
    hora_entrega_confirmada?: string;
    direccion_entrega_confirmada_id?: number;
    comentario_coordinacion?: string;
}

export class LogisticaService implements BaseService<Entrega, AsignarEntregaData> {
    // BaseService implementations
    indexUrl(params?: { query?: Filters }): string {
        const baseUrl = '/api/encargado/entregas/asignadas';
        if (params?.query) {
            const queryString = new URLSearchParams(
                Object.entries(params.query).map(([k, v]) => [k, String(v)])
            ).toString();
            return `${baseUrl}?${queryString}`;
        }
        return baseUrl;
    }

    createUrl(): string {
        return '/logistica/entregas/create';
    }

    showUrl(id: Id): string {
        return `/logistica/entregas/${id}`;
    }

    editUrl(id: Id): string {
        return `/logistica/entregas/${id}/edit`;
    }

    storeUrl(): string {
        return '/api/entregas';
    }

    updateUrl(id: Id): string {
        return `/api/entregas/${id}`;
    }

    destroyUrl(id: Id): string {
        return `/api/entregas/${id}`;
    }

    /**
     * Navegar al listado de entregas asignadas
     */
    navigateToAsignadas(filters?: FiltrosEntregas): void {
        if (filters) {
            this.searchEntregas(filters);
        } else {
            router.get('/logistica/entregas-asignadas', {}, {
                preserveState: true,
            });
        }
    }

    /**
     * Navegar al listado de entregas en tránsito
     */
    navigateToEnTransito(filters?: FiltrosEntregas): void {
        if (filters) {
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([, value]) =>
                    value !== '' && value != null && value !== undefined
                )
            );
            router.get('/logistica/entregas-en-transito', cleanFilters, {
                preserveState: true,
                replace: true,
            });
        } else {
            router.get('/logistica/entregas-en-transito', {}, {
                preserveState: true,
            });
        }
    }

    /**
     * Búsqueda de entregas con filtros
     */
    searchEntregas(filters: FiltrosEntregas): void {
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([, value]) =>
                value !== '' && value != null && value !== undefined
            )
        );

        router.get('/logistica/entregas-asignadas', cleanFilters, {
            preserveState: true,
            replace: true,
            onError: (errors) => {
                NotificationService.error('Error al realizar la búsqueda');
                console.error('Search errors:', errors);
            }
        });
    }

    /**
     * Búsqueda de entregas en tránsito
     */
    searchEntregasEnTransito(filters: FiltrosEntregas): void {
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([, value]) =>
                value !== '' && value != null && value !== undefined
            )
        );

        router.get('/logistica/entregas-en-transito', cleanFilters, {
            preserveState: true,
            replace: true,
            onError: (errors) => {
                NotificationService.error('Error al realizar la búsqueda');
                console.error('Search errors:', errors);
            }
        });
    }

    /**
     * Limpiar filtros de entregas
     */
    clearFilters(): void {
        router.get('/logistica/entregas-asignadas', {}, {
            preserveState: true,
            replace: true,
        });
    }

    /**
     * Obtener entregas asignadas (API call)
     */
    async obtenerEntregasAsignadas(page: number = 1, filters?: FiltrosEntregas): Promise<{
        data: Entrega[];
        total: number;
        per_page: number;
        current_page: number;
    }> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== '' && value != null && value !== undefined) {
                        params.append(key, String(value));
                    }
                });
            }

            const response = await fetch(`/api/encargado/entregas/asignadas?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener entregas asignadas');
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo entregas asignadas:', error);
            NotificationService.error('Error al obtener entregas');
            throw error;
        }
    }

    /**
     * Obtener entregas en tránsito (API call)
     */
    async obtenerEntregasEnTransito(page: number = 1, filters?: FiltrosEntregas): Promise<{
        data: Entrega[];
        total: number;
        per_page: number;
        current_page: number;
    }> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== '' && value != null && value !== undefined) {
                        params.append(key, String(value));
                    }
                });
            }

            const response = await fetch(`/api/encargado/entregas/activas?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener entregas en tránsito');
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo entregas en tránsito:', error);
            NotificationService.error('Error al obtener entregas');
            throw error;
        }
    }

    /**
     * Obtener proformas pendientes de aprobación (API call)
     */
    async obtenerProformasPendientes(page: number = 1, filters?: FiltrosProformas): Promise<{
        data: Proforma[];
        total: number;
        per_page: number;
        current_page: number;
    }> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== '' && value != null && value !== undefined) {
                        params.append(key, String(value));
                    }
                });
            }

            const response = await fetch(`/api/encargado/proformas/pendientes?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener proformas pendientes');
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo proformas pendientes:', error);
            NotificationService.error('Error al obtener proformas');
            throw error;
        }
    }

    /**
     * Asignar chofer y vehículo a una entrega
     */
    async asignarEntrega(entregaId: Id, data: AsignarEntregaData): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            const response = await fetch(`/api/encargado/entregas/${entregaId}/asignar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al asignar entrega');
            }

            const result = await response.json();
            NotificationService.success('Entrega asignada exitosamente');
            return result;
        } catch (error) {
            console.error('Error asignando entrega:', error);
            NotificationService.error(error instanceof Error ? error.message : 'Error al asignar entrega');
            throw error;
        }
    }

    /**
     * Aprobar una proforma
     */
    async aprobarProforma(proformaId: Id, data: AprobarProformaData | string = ''): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            // Soportar llamadas antiguas con solo comentario string
            const payload = typeof data === 'string' ? { comentario: data } : data;

            const response = await fetch(`/api/encargado/proformas/${proformaId}/aprobar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al aprobar proforma');
            }

            const result = await response.json();
            NotificationService.success('Proforma aprobada exitosamente');
            return result;
        } catch (error) {
            console.error('Error aprobando proforma:', error);
            NotificationService.error(error instanceof Error ? error.message : 'Error al aprobar proforma');
            throw error;
        }
    }

    /**
     * Rechazar una proforma
     */
    async rechazarProforma(proformaId: Id, motivo: string): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            if (!motivo || motivo.trim() === '') {
                throw new Error('El motivo de rechazo es obligatorio');
            }

            const response = await fetch(`/api/encargado/proformas/${proformaId}/rechazar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ motivo }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al rechazar proforma');
            }

            const result = await response.json();
            NotificationService.success('Proforma rechazada');
            return result;
        } catch (error) {
            console.error('Error rechazando proforma:', error);
            NotificationService.error(error instanceof Error ? error.message : 'Error al rechazar proforma');
            throw error;
        }
    }

    /**
     * Obtener ubicaciones de una entrega para mapa
     */
    async obtenerUbicacionesEntrega(entregaId: Id): Promise<{
        ubicaciones: Array<{
            latitud: number;
            longitud: number;
            timestamp: string;
        }>;
        ultima_ubicacion: {
            latitud: number;
            longitud: number;
            velocidad?: number;
            timestamp: string;
        } | null;
    }> {
        try {
            const response = await fetch(`/api/tracking/ubicaciones/${entregaId}`, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al obtener ubicaciones');
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo ubicaciones:', error);
            throw error;
        }
    }

    /**
     * Obtener ETA de una entrega
     */
    async obtenerETA(entregaId: Id, latDestino: number, lngDestino: number): Promise<{
        distancia_km: number;
        tiempo_estimado_minutos: number;
        tiempo_estimado_formato: string;
        velocidad_actual_kmh: number;
        ubicacion_actual: { latitud: number; longitud: number };
        ubicacion_destino: { latitud: number; longitud: number };
    }> {
        try {
            const params = new URLSearchParams({
                entrega_id: String(entregaId),
                lat_destino: String(latDestino),
                lng_destino: String(lngDestino),
            });

            const response = await fetch(`/api/tracking/calcular-eta?${params}`, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al calcular ETA');
            }

            return await response.json();
        } catch (error) {
            console.error('Error calculando ETA:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas del dashboard de logística
     */
    async obtenerEstadisticas(): Promise<{
        entregas_asignadas: number;
        entregas_en_transito: number;
        entregas_entregadas_hoy: number;
        proformas_pendientes: number;
        entregas_con_novedad: number;
    }> {
        try {
            const response = await fetch('/api/encargado/dashboard/stats', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error obteniendo estadísticas');
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    /**
     * Obtener vehículos disponibles para asignar
     */
    async obtenerVehiculosDisponibles(): Promise<Array<{
        id: Id;
        placa: string;
        marca: string;
        modelo: string;
        estado: string;
    }>> {
        try {
            const response = await fetch('/api/vehiculos/disponibles', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error obteniendo vehículos');
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo vehículos:', error);
            NotificationService.error('Error al obtener vehículos disponibles');
            throw error;
        }
    }

    /**
     * Obtener choferes disponibles para asignar
     */
    async obtenerChoferesDisponibles(): Promise<Array<{
        id: Id;
        nombre: string;
        email: string;
        telefono?: string;
    }>> {
        try {
            const response = await fetch('/api/choferes/disponibles', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error obteniendo choferes');
            }

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo choferes:', error);
            NotificationService.error('Error al obtener choferes disponibles');
            throw error;
        }
    }

    /**
     * Validar datos de asignación
     */
    validateAsignarEntrega(data: AsignarEntregaData): string[] {
        const errors: string[] = [];

        if (!data.chofer_id || data.chofer_id === 0) {
            errors.push('Debe seleccionar un chofer');
        }

        if (!data.vehiculo_id || data.vehiculo_id === 0) {
            errors.push('Debe seleccionar un vehículo');
        }

        return errors;
    }

    /**
     * Validar motivo de rechazo
     */
    validateRechazarProforma(motivo: string): string[] {
        const errors: string[] = [];

        if (!motivo || motivo.trim() === '') {
            errors.push('El motivo de rechazo es obligatorio');
        }

        if (motivo.length < 10) {
            errors.push('El motivo debe tener al menos 10 caracteres');
        }

        if (motivo.length > 500) {
            errors.push('El motivo no puede exceder 500 caracteres');
        }

        return errors;
    }
}

// Singleton instance
const logisticaService = new LogisticaService();
export default logisticaService;
