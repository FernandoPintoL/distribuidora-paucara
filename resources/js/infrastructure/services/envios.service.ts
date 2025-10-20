// Application Layer: Envios service
// Encapsulates URL building and navigation logic for envíos

import { router } from '@inertiajs/react';
import type { Filters, Id } from '@/domain/entities/shared';
import type { BaseService } from '@/domain/entities/generic';
import type {
    Envio,
    EnvioFormData,
    ProgramarEnvioFormData,
    ConfirmarEntregaFormData,
    CancelarEnvioFormData,
    ActualizarUbicacionFormData,
    EstadoEnvio
} from '@/domain/entities/envios';
import NotificationService from '@/infrastructure/services/notification.service';

export interface FiltrosEnvios extends Filters {
    estado?: EstadoEnvio | '';
    venta_id?: Id | '';
    vehiculo_id?: Id | '';
    chofer_id?: Id | '';
    fecha_desde?: string;
    fecha_hasta?: string;
}

export class EnviosService implements BaseService<Envio, EnvioFormData> {
    indexUrl(params?: { query?: Filters }): string {
        const baseUrl = '/envios';
        if (params?.query) {
            const queryString = new URLSearchParams(
                Object.entries(params.query).map(([k, v]) => [k, String(v)])
            ).toString();
            return `${baseUrl}?${queryString}`;
        }
        return baseUrl;
    }

    createUrl(): string {
        return '/envios/create';
    }

    showUrl(id: Id): string {
        return `/envios/${id}`;
    }

    editUrl(id: Id): string {
        return `/envios/${id}/edit`;
    }

    storeUrl(): string {
        return '/envios';
    }

    updateUrl(id: Id): string {
        return `/envios/${id}`;
    }

    destroyUrl(id: Id): string {
        return `/envios/${id}`;
    }

    /**
     * Navegar al listado de envíos con filtros
     */
    search(filters: Filters): void {
        // Limpiar filtros vacíos
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([, value]) =>
                value !== '' && value != null && value !== undefined
            )
        );

        router.get('/envios', cleanFilters, {
            preserveState: true,
            replace: true,
            onError: (errors) => {
                NotificationService.error('Error al realizar la búsqueda');
                console.error('Search errors:', errors);
            }
        });
    }

    /**
     * Búsqueda específica para envíos con filtros tipados
     */
    searchEnvios(filters: FiltrosEnvios): void {
        this.search(filters as Filters);
    }

    /**
     * Limpiar todos los filtros
     */
    clearFilters(): void {
        router.get('/envios', {}, {
            preserveState: true,
            replace: true,
        });
    }

    /**
     * Aplicar ordenamiento
     */
    sort(field: string, direction: 'asc' | 'desc' = 'desc'): void {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('sort_by', field);
        currentParams.set('sort_dir', direction);

        router.get(`/envios?${currentParams.toString()}`, {}, {
            preserveState: true,
            replace: true,
        });
    }

    /**
     * Cambiar página de paginación
     */
    goToPage(page: number): void {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('page', page.toString());

        router.get(`/envios?${currentParams.toString()}`, {}, {
            preserveState: true,
            replace: true,
        });
    }

    /**
     * Cambiar número de elementos por página
     */
    changePerPage(perPage: number): void {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('per_page', perPage.toString());
        currentParams.delete('page'); // Reset to first page

        router.get(`/envios?${currentParams.toString()}`, {}, {
            preserveState: true,
            replace: true,
        });
    }

    /**
     * Navegar a la creación de un nuevo envío
     */
    create(): void {
        router.get(this.createUrl(), {}, {
            onError: (errors) => {
                NotificationService.error('Error al acceder al formulario de creación');
                console.error('Create navigation errors:', errors);
            }
        });
    }

    /**
     * Navegar a la vista de detalle de un envío
     */
    show(id: Id): void {
        router.get(this.showUrl(id), {}, {
            onError: (errors) => {
                NotificationService.error('Error al cargar el envío');
                console.error('Show navigation errors:', errors);
            }
        });
    }

    /**
     * Navegar a la edición de un envío
     */
    edit(id: Id): void {
        router.get(this.editUrl(id), {}, {
            onError: (errors) => {
                NotificationService.error('Error al acceder al formulario de edición');
                console.error('Edit navigation errors:', errors);
            }
        });
    }

    /**
     * Crear un nuevo envío
     */
    store(data: EnvioFormData, options?: {
        onSuccess?: (envio?: Envio) => void;
        onError?: (errors: Record<string, string[]>) => void;
        preserveScroll?: boolean;
    }): void {
        router.post(this.storeUrl(), data, {
            preserveScroll: options?.preserveScroll ?? false,
            onSuccess: (page) => {
                NotificationService.success('Envío creado exitosamente');
                if (options?.onSuccess) {
                    options.onSuccess(page.props.envio as Envio);
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al crear el envío');
                console.error('Store errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Actualizar un envío existente
     */
    update(id: Id, data: EnvioFormData, options?: {
        onSuccess?: (envio?: Envio) => void;
        onError?: (errors: Record<string, string[]>) => void;
        preserveScroll?: boolean;
    }): void {
        router.put(this.updateUrl(id), data, {
            preserveScroll: options?.preserveScroll ?? false,
            onSuccess: (page) => {
                NotificationService.success('Envío actualizado exitosamente');
                if (options?.onSuccess) {
                    options.onSuccess(page.props.envio as Envio);
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al actualizar el envío');
                console.error('Update errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Eliminar un envío
     */
    destroy(id: Id, options?: {
        onSuccess?: () => void;
        onError?: (errors: Record<string, string[]>) => void;
    }): void {
        if (!confirm('¿Estás seguro de que deseas eliminar este envío?')) {
            return;
        }

        router.delete(this.destroyUrl(id), {
            onSuccess: () => {
                NotificationService.success('Envío eliminado exitosamente');
                if (options?.onSuccess) {
                    options.onSuccess();
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al eliminar el envío');
                console.error('Destroy errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Programar un envío para una venta
     *
     * @route POST /ventas/{venta}/programar-envio
     * @see routes/web.php
     * @see EnvioController::programar()
     */
    programar(ventaId: Id, data: ProgramarEnvioFormData, options?: {
        onSuccess?: (envio?: Envio) => void;
        onError?: (errors: Record<string, string[]>) => void;
    }): void {
        router.post(`/ventas/${ventaId}/programar-envio`, data, {
            onSuccess: (page) => {
                NotificationService.success('Envío programado exitosamente');
                if (options?.onSuccess) {
                    options.onSuccess(page.props.envio as Envio);
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al programar el envío');
                console.error('Programar errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Iniciar preparación de un envío
     * IMPORTANTE: Esta acción reduce el stock
     *
     * @route POST /envios/{envio}/iniciar-preparacion
     * @see routes/web.php
     * @see EnvioController::iniciarPreparacion()
     */
    iniciarPreparacion(envioId: Id, options?: {
        onSuccess?: () => void;
        onError?: (errors: Record<string, string[]>) => void;
    }): void {
        if (!confirm('¿Está seguro de iniciar la preparación? Esta acción reducirá el stock.')) {
            return;
        }

        router.post(`/envios/${envioId}/iniciar-preparacion`, {}, {
            onSuccess: () => {
                NotificationService.success('Preparación iniciada. Stock reducido correctamente.');
                if (options?.onSuccess) {
                    options.onSuccess();
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al iniciar preparación');
                console.error('Iniciar preparación errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Confirmar salida del vehículo
     *
     * @route POST /envios/{envio}/confirmar-salida
     * @see routes/web.php
     * @see EnvioController::confirmarSalida()
     */
    confirmarSalida(envioId: Id, options?: {
        onSuccess?: () => void;
        onError?: (errors: Record<string, string[]>) => void;
    }): void {
        router.post(`/envios/${envioId}/confirmar-salida`, {}, {
            onSuccess: () => {
                NotificationService.success('Salida confirmada. El envío está en ruta.');
                if (options?.onSuccess) {
                    options.onSuccess();
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al confirmar salida');
                console.error('Confirmar salida errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Confirmar entrega del envío
     *
     * @route POST /envios/{envio}/confirmar-entrega
     * @see routes/web.php
     * @see EnvioController::confirmarEntrega()
     */
    confirmarEntrega(envioId: Id, data: ConfirmarEntregaFormData, options?: {
        onSuccess?: () => void;
        onError?: (errors: Record<string, string[]>) => void;
    }): void {
        router.post(`/envios/${envioId}/confirmar-entrega`, data, {
            onSuccess: () => {
                NotificationService.success('Entrega confirmada exitosamente');
                if (options?.onSuccess) {
                    options.onSuccess();
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al confirmar entrega');
                console.error('Confirmar entrega errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Cancelar un envío
     * IMPORTANTE: Si el envío está EN_PREPARACION o EN_RUTA, se revertirá el stock
     *
     * @route POST /envios/{envio}/cancelar
     * @see routes/web.php
     * @see EnvioController::cancelar()
     */
    cancelar(envioId: Id, data: CancelarEnvioFormData, options?: {
        onSuccess?: () => void;
        onError?: (errors: Record<string, string[]>) => void;
    }): void {
        if (!confirm('¿Está seguro de cancelar este envío? El stock será revertido si es necesario.')) {
            return;
        }

        router.post(`/envios/${envioId}/cancelar`, data, {
            onSuccess: () => {
                NotificationService.success('Envío cancelado y stock revertido');
                if (options?.onSuccess) {
                    options.onSuccess();
                }
            },
            onError: (errors) => {
                NotificationService.error('Error al cancelar envío');
                console.error('Cancelar envío errors:', errors);
                if (options?.onError) {
                    options.onError(errors as unknown as Record<string, string[]>);
                }
            }
        });
    }

    /**
     * Actualizar ubicación desde app móvil
     *
     * @route POST /api/envios/{envio}/actualizar-ubicacion
     * @see routes/api.php
     * @see EnvioController::actualizarUbicacion()
     */
    async actualizarUbicacion(envioId: Id, data: ActualizarUbicacionFormData): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            const response = await fetch(`/api/envios/${envioId}/actualizar-ubicacion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar ubicación');
            }

            const result = await response.json();
            NotificationService.success('Ubicación actualizada');
            return {
                success: true,
                message: result.message || 'Ubicación actualizada'
            };
        } catch (error) {
            console.error('Error actualizando ubicación:', error);
            NotificationService.error('Error al actualizar ubicación');
            throw error;
        }
    }

    /**
     * Obtener seguimiento de un envío (API pública)
     *
     * @route GET /api/envios/{envio}/seguimiento
     * @see routes/api.php
     * @see EnvioController::seguimientoApi()
     */
    async obtenerSeguimiento(envioId: Id): Promise<Envio> {
        try {
            const response = await fetch(`/api/envios/${envioId}/seguimiento`, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error obteniendo seguimiento del envío');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error obteniendo seguimiento:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas del dashboard de logística
     *
     * @route GET /api/logistica/dashboard/stats
     * @see routes/api.php
     * @see EnvioController::dashboardStats()
     */
    async obtenerEstadisticas(): Promise<{
        proformas_pendientes: number;
        envios_programados: number;
        envios_en_transito: number;
        envios_entregados_hoy: number;
    }> {
        try {
            const response = await fetch('/api/logistica/dashboard/stats', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error obteniendo estadísticas');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    /**
     * Obtener vehículos disponibles
     *
     * @route GET /envios/vehiculos-disponibles
     * @see routes/web.php
     * @see EnvioController::obtenerVehiculosDisponibles()
     */
    async obtenerVehiculosDisponibles(): Promise<Array<{
        id: Id;
        placa: string;
        marca: string;
        modelo: string;
        estado: string;
        capacidad_carga?: number;
    }>> {
        try {
            const response = await fetch('/envios/vehiculos-disponibles', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error obteniendo vehículos disponibles');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error obteniendo vehículos:', error);
            throw error;
        }
    }

    /**
     * Obtener choferes disponibles
     *
     * @route GET /envios/choferes-disponibles
     * @see routes/web.php
     * @see EnvioController::obtenerChoferesDisponibles()
     */
    async obtenerChoferesDisponibles(): Promise<Array<{
        id: Id;
        name: string;
        email: string;
        telefono?: string;
    }>> {
        try {
            const response = await fetch('/envios/choferes-disponibles', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error obteniendo choferes disponibles');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error obteniendo choferes:', error);
            throw error;
        }
    }

    /**
     * Validar datos de envío en el cliente
     */
    validateData(data: EnvioFormData | ProgramarEnvioFormData): string[] {
        const errors: string[] = [];

        if (!data.vehiculo_id || data.vehiculo_id === 0) {
            errors.push('Debe seleccionar un vehículo');
        }

        if (!data.chofer_id || data.chofer_id === 0) {
            errors.push('Debe seleccionar un chofer');
        }

        if (!data.fecha_programada) {
            errors.push('La fecha programada es obligatoria');
        } else {
            const fechaProgramada = new Date(data.fecha_programada);
            const ahora = new Date();
            if (fechaProgramada <= ahora) {
                errors.push('La fecha programada debe ser posterior a la fecha actual');
            }
        }

        // Validar venta_id solo si es EnvioFormData
        if ('venta_id' in data && (!data.venta_id || data.venta_id === 0)) {
            errors.push('Debe seleccionar una venta');
        }

        return errors;
    }

    /**
     * Validar datos de confirmación de entrega
     */
    validateConfirmarEntrega(data: ConfirmarEntregaFormData): string[] {
        const errors: string[] = [];

        if (!data.receptor_nombre || data.receptor_nombre.trim() === '') {
            errors.push('El nombre del receptor es obligatorio');
        }

        if (data.receptor_nombre && data.receptor_nombre.length > 255) {
            errors.push('El nombre del receptor no puede exceder 255 caracteres');
        }

        if (data.foto_entrega && data.foto_entrega.size > 2048 * 1024) {
            errors.push('La foto de entrega no puede exceder 2MB');
        }

        return errors;
    }

    /**
     * Validar datos de cancelación
     */
    validateCancelar(data: CancelarEnvioFormData): string[] {
        const errors: string[] = [];

        if (!data.motivo_cancelacion || data.motivo_cancelacion.trim() === '') {
            errors.push('El motivo de cancelación es obligatorio');
        }

        if (data.motivo_cancelacion && data.motivo_cancelacion.length < 10) {
            errors.push('El motivo debe tener al menos 10 caracteres');
        }

        if (data.motivo_cancelacion && data.motivo_cancelacion.length > 500) {
            errors.push('El motivo no puede exceder 500 caracteres');
        }

        return errors;
    }

    /**
     * Validar datos de actualización de ubicación
     */
    validateActualizarUbicacion(data: ActualizarUbicacionFormData): string[] {
        const errors: string[] = [];

        if (data.latitud == null || data.latitud === undefined) {
            errors.push('La latitud es obligatoria');
        } else if (data.latitud < -90 || data.latitud > 90) {
            errors.push('La latitud debe estar entre -90 y 90');
        }

        if (data.longitud == null || data.longitud === undefined) {
            errors.push('La longitud es obligatoria');
        } else if (data.longitud < -180 || data.longitud > 180) {
            errors.push('La longitud debe estar entre -180 y 180');
        }

        return errors;
    }

    /**
     * Exportar envíos a PDF
     */
    exportPdf(filters?: FiltrosEnvios): void {
        const cleanFilters = filters ? Object.fromEntries(
            Object.entries(filters).filter(([, value]) =>
                value !== '' && value != null && value !== undefined
            )
        ) : {};

        const queryString = new URLSearchParams(
            Object.entries(cleanFilters).map(([k, v]) => [k, String(v)])
        ).toString();

        window.open(`/envios/export/pdf?${queryString}`, '_blank');
    }

    /**
     * Exportar envíos a Excel
     */
    exportExcel(filters?: FiltrosEnvios): void {
        const cleanFilters = filters ? Object.fromEntries(
            Object.entries(filters).filter(([, value]) =>
                value !== '' && value != null && value !== undefined
            )
        ) : {};

        const queryString = new URLSearchParams(
            Object.entries(cleanFilters).map(([k, v]) => [k, String(v)])
        ).toString();

        window.open(`/envios/export/excel?${queryString}`, '_blank');
    }
}

// Singleton instance
const enviosService = new EnviosService();
export default enviosService;
