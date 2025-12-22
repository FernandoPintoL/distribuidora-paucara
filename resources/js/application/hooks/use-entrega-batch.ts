import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    optimizacionEntregasService,
    type CrearLoteRequest,
    type PreviewResponse,
    type CrearLoteResponse,
} from '@/application/services/optimizacion-entregas.service';

export interface BatchFormData {
    venta_ids: number[];
    vehiculo_id: number | null;
    chofer_id: number | null;
    optimizar: boolean;
}

interface UseBatchState {
    formData: BatchFormData;
    isLoading: boolean;
    isSubmitting: boolean;
    preview: PreviewResponse | null;
    previewError: string | null;
    submitError: string | null;
    successMessage: string | null;
}

export function useEntregaBatch() {
    const [state, setState] = useState<UseBatchState>({
        formData: {
            venta_ids: [],
            vehiculo_id: null,
            chofer_id: null,
            optimizar: true,
        },
        isLoading: false,
        isSubmitting: false,
        preview: null,
        previewError: null,
        submitError: null,
        successMessage: null,
    });

    /**
     * Actualizar datos del formulario
     */
    const updateFormData = (data: Partial<BatchFormData>) => {
        setState((prev) => ({
            ...prev,
            formData: { ...prev.formData, ...data },
            submitError: null,
            successMessage: null,
        }));
    };

    /**
     * Agregar/remover venta del lote
     */
    const toggleVenta = (ventaId: number) => {
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                venta_ids: prev.formData.venta_ids.includes(ventaId)
                    ? prev.formData.venta_ids.filter((id) => id !== ventaId)
                    : [...prev.formData.venta_ids, ventaId],
            },
            preview: null,
            previewError: null,
        }));
    };

    /**
     * Seleccionar todas las ventas
     */
    const selectAllVentas = (ventaIds: number[]) => {
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                venta_ids: ventaIds,
            },
            preview: null,
        }));
    };

    /**
     * Limpiar selección de ventas
     */
    const clearVentas = () => {
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                venta_ids: [],
            },
            preview: null,
        }));
    };

    /**
     * Obtener preview de la creación
     */
    const obtenerPreview = async () => {
        // Validar datos mínimos
        if (!state.formData.vehiculo_id || !state.formData.chofer_id) {
            setState((prev) => ({
                ...prev,
                previewError: 'Debe seleccionar vehículo y chofer',
            }));
            return;
        }

        if (state.formData.venta_ids.length === 0) {
            setState((prev) => ({
                ...prev,
                previewError: 'Debe seleccionar al menos una venta',
            }));
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true, previewError: null }));

        try {
            const request: CrearLoteRequest = {
                venta_ids: state.formData.venta_ids,
                vehiculo_id: state.formData.vehiculo_id,
                chofer_id: state.formData.chofer_id,
                optimizar: state.formData.optimizar,
            };

            const preview = await optimizacionEntregasService.obtenerPreview(request);

            setState((prev) => ({
                ...prev,
                preview,
                isLoading: false,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener preview';
            setState((prev) => ({
                ...prev,
                previewError: message,
                isLoading: false,
            }));
        }
    };

    /**
     * Crear entregas en lote
     */
    const handleSubmit = async () => {
        // Validar datos
        if (!state.formData.vehiculo_id || !state.formData.chofer_id) {
            setState((prev) => ({
                ...prev,
                submitError: 'Debe seleccionar vehículo y chofer',
            }));
            return;
        }

        if (state.formData.venta_ids.length === 0) {
            setState((prev) => ({
                ...prev,
                submitError: 'Debe seleccionar al menos una venta',
            }));
            return;
        }

        setState((prev) => ({
            ...prev,
            isSubmitting: true,
            submitError: null,
            successMessage: null,
        }));

        try {
            const request: CrearLoteRequest = {
                venta_ids: state.formData.venta_ids,
                vehiculo_id: state.formData.vehiculo_id,
                chofer_id: state.formData.chofer_id,
                optimizar: state.formData.optimizar,
            };

            const resultado = await optimizacionEntregasService.crearLote(request);

            if (resultado.success) {
                setState((prev) => ({
                    ...prev,
                    successMessage: resultado.message,
                    isSubmitting: false,
                }));

                // Redirigir a lista de entregas después de 2 segundos
                setTimeout(() => {
                    router.visit('/logistica/entregas');
                }, 2000);
            } else {
                setState((prev) => ({
                    ...prev,
                    submitError: resultado.message || 'Error desconocido',
                    isSubmitting: false,
                }));
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al crear entregas';
            setState((prev) => ({
                ...prev,
                submitError: message,
                isSubmitting: false,
            }));
        }
    };

    /**
     * Cancelar y volver
     */
    const handleCancel = () => {
        router.visit('/logistica/entregas');
    };

    return {
        ...state,
        updateFormData,
        toggleVenta,
        selectAllVentas,
        clearVentas,
        obtenerPreview,
        handleSubmit,
        handleCancel,
    };
}
