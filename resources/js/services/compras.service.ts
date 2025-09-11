// Application Layer: Compras service
// Encapsulates URL building and navigation logic for compras

import { router } from '@inertiajs/react';
import type { Filters, Id } from '@/domain/shared';
import type { BaseService } from '@/domain/generic';
import type {
    Compra,
    CompraFormData,
    FiltrosCompras,
    EstadisticasCompras
} from '@/domain/compras';
import NotificationService from '@/services/notification.service';

export class ComprasService implements BaseService<Compra, CompraFormData> {
    indexUrl(params?: { query?: Filters }): string {
        const baseUrl = '/compras';
        if (params?.query) {
            const queryString = new URLSearchParams(
                Object.entries(params.query).map(([k, v]) => [k, String(v)])
            ).toString();
            return `${baseUrl}?${queryString}`;
        }
        return baseUrl;
    }

    createUrl(): string {
        return '/compras/create';
    }

    showUrl(id: Id): string {
        return `/compras/${id}`;
    }

    editUrl(id: Id): string {
        return `/compras/${id}/edit`;
    }

    storeUrl(): string {
        return '/compras';
    }

    updateUrl(id: Id): string {
        return `/compras/${id}`;
    }

    destroyUrl(id: Id): string {
        return `/compras/${id}`;
    }

    /**
     * Navegar al listado de compras con filtros
     */
    search(filters: FiltrosCompras): void {
        // Limpiar filtros vacíos
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([, value]) =>
                value !== '' && value != null && value !== undefined
            )
        );

        router.get('/compras', cleanFilters, {
            preserveState: true,
            replace: true,
            onError: (errors) => {
                NotificationService.error('Error al realizar la búsqueda');
                console.error('Search errors:', errors);
            }
        });
    }

    /**
     * Limpiar todos los filtros
     */
    clearFilters(): void {
        router.get('/compras', {}, {
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

        router.get(`/compras?${currentParams.toString()}`, {}, {
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

        router.get(`/compras?${currentParams.toString()}`, {}, {
            preserveState: true,
            replace: true,
        });
    }

    /**
     * Eliminar compra con confirmación
     */
    destroy(id: Id): void {
        if (!confirm('¿Estás seguro de que deseas eliminar esta compra?')) {
            return;
        }

        const loadingToast = NotificationService.loading('Eliminando compra...');

        router.delete(this.destroyUrl(id), {
            preserveState: true,
            onSuccess: () => {
                NotificationService.dismiss(loadingToast);
                NotificationService.success('Compra eliminada correctamente');
                // Recargar solo los datos de compras
                router.reload({ only: ['compras'] });
            },
            onError: (errors) => {
                NotificationService.dismiss(loadingToast);
                NotificationService.error('Error al eliminar la compra');
                console.error('Delete errors:', errors);
            }
        });
    }

    /**
     * Crear nueva compra
     */
    create(data: CompraFormData): void {
        const loadingToast = NotificationService.loading('Creando compra...');

        router.post(this.storeUrl(), data, {
            preserveState: true,
            onSuccess: (page) => {
                NotificationService.dismiss(loadingToast);
                NotificationService.success('Compra creada correctamente');
                // Redirigir a la vista de la compra creada
                if (page.props && 'compra' in page.props) {
                    router.visit(`/compras/${(page.props.compra as Compra).id}`);
                }
            },
            onError: (errors) => {
                NotificationService.dismiss(loadingToast);
                NotificationService.error('Error al crear la compra');
                console.error('Create errors:', errors);
            }
        });
    }

    /**
     * Actualizar compra existente
     */
    update(id: Id, data: CompraFormData): void {
        const loadingToast = NotificationService.loading('Actualizando compra...');

        router.put(this.updateUrl(id), data, {
            preserveState: true,
            onSuccess: () => {
                NotificationService.dismiss(loadingToast);
                NotificationService.success('Compra actualizada correctamente');
            },
            onError: (errors) => {
                NotificationService.dismiss(loadingToast);
                NotificationService.error('Error al actualizar la compra');
                console.error('Update errors:', errors);
            }
        });
    }

    /**
     * Validación específica para compras
     */
    validateData(data: CompraFormData): string[] {
        const errors: string[] = [];

        // Validar fecha
        if (!data.fecha) {
            errors.push('La fecha es requerida');
        }

        // Validar proveedor
        if (!data.proveedor_id || data.proveedor_id === '') {
            errors.push('El proveedor es requerido');
        }

        // Validar moneda
        if (!data.moneda_id || data.moneda_id === '') {
            errors.push('La moneda es requerida');
        }

        // Validar estado documento
        if (!data.estado_documento_id || data.estado_documento_id === '') {
            errors.push('El estado del documento es requerido');
        }

        // Validar detalles
        if (!data.detalles || data.detalles.length === 0) {
            errors.push('Debe agregar al menos un producto');
        } else {
            data.detalles.forEach((detalle, index) => {
                if (!detalle.producto_id || detalle.producto_id === '') {
                    errors.push(`Producto ${index + 1}: Debe seleccionar un producto`);
                }

                const cantidad = Number(detalle.cantidad);
                if (!cantidad || cantidad <= 0) {
                    errors.push(`Producto ${index + 1}: La cantidad debe ser mayor a 0`);
                }

                const precio = Number(detalle.precio_unitario);
                if (!precio || precio <= 0) {
                    errors.push(`Producto ${index + 1}: El precio debe ser mayor a 0`);
                }

                // Validar fecha de vencimiento si se proporciona
                if (detalle.fecha_vencimiento && detalle.fecha_vencimiento !== '') {
                    const fechaVencimiento = new Date(detalle.fecha_vencimiento);
                    const hoy = new Date();

                    if (fechaVencimiento < hoy) {
                        errors.push(`Producto ${index + 1}: La fecha de vencimiento no puede ser anterior a hoy`);
                    }
                }
            });
        }

        return errors;
    }

    /**
     * Calcular totales de la compra
     */
    calculateTotals(detalles: CompraFormData['detalles']): {
        subtotal: number;
        total: number;
    } {
        const subtotal = detalles.reduce((acc, detalle) => {
            const cantidad = Number(detalle.cantidad) || 0;
            const precio = Number(detalle.precio_unitario) || 0;
            return acc + (cantidad * precio);
        }, 0);

        return {
            subtotal,
            total: subtotal, // En el futuro se pueden agregar descuentos e impuestos
        };
    }

    /**
     * Formatear estado de compra con colores
     */
    getEstadoColor(estado: string): string {
        switch (estado.toLowerCase()) {
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'completada':
            case 'aprobada':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'cancelada':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    }

    /**
     * Formatear número de compra para display
     */
    formatNumeroCompra(numero: string): string {
        return numero.startsWith('C-') ? numero : `C-${numero}`;
    }

    /**
     * Obtener resumen de estadísticas para dashboard
     */
    getEstadisticasResumen(estadisticas: EstadisticasCompras): {
        totalCompras: string;
        montoTotal: string;
        promedioCompra: string;
        variacionMensual: {
            compras: number;
            monto: number;
        };
    } {
        return {
            totalCompras: estadisticas.total_compras.toLocaleString('es-ES'),
            montoTotal: new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'BOB'
            }).format(estadisticas.monto_total),
            promedioCompra: new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'BOB'
            }).format(estadisticas.promedio_compra),
            variacionMensual: {
                compras: Math.round(estadisticas.mes_actual.variacion_compras),
                monto: Math.round(estadisticas.mes_actual.variacion_monto),
            }
        };
    }
}

const comprasService = new ComprasService();
export default comprasService;
