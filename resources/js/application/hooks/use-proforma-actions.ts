/**
 * Application Layer Hook: useProformaActions
 *
 * Encapsula toda la lógica de negocio para acciones sobre proformas
 * (aprobar, rechazar, convertir a venta, guardar coordinación)
 *
 * RESPONSABILIDADES:
 * - Validar permisos (puedeAprobar, puedeRechazar, etc.)
 * - Orquestar llamadas al backend
 * - Manejar estados de carga
 * - Mostrar notificaciones
 * - Delegar presentación al componente
 */

import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import type { Proforma } from '@/domain/entities/proformas';
import { validacionesProforma } from '@/domain/entities/proformas';
import proformasService from '@/infrastructure/services/proformas.service';
import NotificationService from '@/infrastructure/services/notification.service';

/**
 * Datos para guardar coordinación de entrega
 */
export interface CoordinacionData {
    fecha_entrega_confirmada: string;
    hora_entrega_confirmada: string;
    comentario_coordinacion: string;
    notas_llamada: string;
    numero_intentos_contacto: number;
    resultado_ultimo_intento: string;
    entregado_en: string;
    entregado_a: string;
    observaciones_entrega: string;
}

/**
 * Estados de carga de acciones
 */
export interface ProformaActionsState {
    isSubmitting: boolean;
    isConverting: boolean;
    isGuardandoCoordinacion: boolean;
}

/**
 * Permisos de acciones sobre la proforma
 */
export interface ProformaPermissions {
    puedeAprobar: boolean;
    puedeRechazar: boolean;
    puedeConvertir: boolean;
    puedeCoordinar: boolean;
}

/**
 * Acciones disponibles sobre la proforma
 */
export interface ProformaActionsHandlers {
    aprobar: (coordinacion?: CoordinacionData) => void;
    rechazar: (motivo: string, coordinacion?: CoordinacionData) => void;
    convertirAVenta: () => void;
    guardarCoordinacion: (coordinacion: CoordinacionData) => void;
}

/**
 * Hook para manejar acciones sobre una proforma
 *
 * @param proforma Proforma a actualizar
 * @param options Opciones adicionales
 * @returns Estados, permisos y manejadores de acciones
 *
 * @example
 * const {
 *   isSubmitting,
 *   puedeAprobar,
 *   aprobar,
 * } = useProformaActions(proforma);
 */
export function useProformaActions(
    proforma: Proforma,
    options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
    }
) {
    // ============================================
    // ESTADOS DE CARGA
    // ============================================
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isGuardandoCoordinacion, setIsGuardandoCoordinacion] = useState(false);

    // ============================================
    // VALIDACIONES DE PERMISOS
    // ============================================
    const puedeAprobar = validacionesProforma.puedeAprobar(proforma);
    const puedeRechazar = validacionesProforma.puedeRechazar(proforma);
    const puedeConvertir = validacionesProforma.puedeConvertir(proforma);
    const puedeCoordinar = validacionesProforma.puedeCoordinar(proforma);

    // ============================================
    // ACCIÓN: APROBAR PROFORMA
    // ============================================
    const aprobar = useCallback((coordinacion?: CoordinacionData) => {
        if (!puedeAprobar) {
            NotificationService.warning('Esta proforma no puede ser aprobada en este momento');
            return;
        }

        setIsSubmitting(true);

        // Si hay datos de coordinación, guardarlos primero
        if (coordinacion?.fecha_entrega_confirmada) {
            // Obtener token CSRF del meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            fetch(proformasService.coordinarUrl(proforma.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify(coordinacion),
            })
            .then(response => {
                if (!response.ok) throw new Error('Error al guardar coordinación');
                return response.json();
            })
            .then(() => {
                NotificationService.success('Coordinación guardada correctamente');
                // Una vez guardada la coordinación, proceder a aprobar
                router.post(
                    proformasService.aprobarUrl(proforma.id),
                    {},
                    {
                        onSuccess: () => {
                            NotificationService.success('Proforma aprobada correctamente');
                            options?.onSuccess?.();
                            setIsSubmitting(false);
                        },
                        onError: (errors) => {
                            NotificationService.error('Error al aprobar la proforma');
                            console.error('Approve errors:', errors);
                            options?.onError?.(new Error('Error al aprobar'));
                            setIsSubmitting(false);
                        },
                    }
                );
            })
            .catch(() => {
                NotificationService.error('Error al guardar la coordinación');
                setIsSubmitting(false);
            });
        } else {
            // Si no hay coordinación, solo aprobar
            router.post(
                proformasService.aprobarUrl(proforma.id),
                {},
                {
                    onSuccess: () => {
                        NotificationService.success('Proforma aprobada correctamente');
                        options?.onSuccess?.();
                        setIsSubmitting(false);
                    },
                    onError: (errors) => {
                        NotificationService.error('Error al aprobar la proforma');
                        console.error('Approve errors:', errors);
                        options?.onError?.(new Error('Error al aprobar'));
                        setIsSubmitting(false);
                    },
                }
            );
        }
    }, [proforma.id, puedeAprobar, options]);

    // ============================================
    // ACCIÓN: RECHAZAR PROFORMA
    // ============================================
    const rechazar = useCallback((motivo: string, coordinacion?: CoordinacionData) => {
        if (!motivo.trim()) {
            NotificationService.warning('Debe indicar un motivo de rechazo');
            return;
        }

        if (!puedeRechazar) {
            NotificationService.warning('Esta proforma no puede ser rechazada en este momento');
            return;
        }

        setIsSubmitting(true);

        // Si hay datos de coordinación, guardarlos primero
        if (coordinacion?.fecha_entrega_confirmada) {
            // Obtener token CSRF del meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            fetch(proformasService.coordinarUrl(proforma.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify(coordinacion),
            })
            .then(response => {
                if (!response.ok) throw new Error('Error al guardar coordinación');
                return response.json();
            })
            .then(() => {
                NotificationService.success('Coordinación guardada correctamente');
                // Una vez guardada la coordinación, proceder a rechazar
                router.post(
                    proformasService.rechazarUrl(proforma.id),
                    { motivo: motivo.trim() },
                    {
                        onSuccess: () => {
                            NotificationService.success('Proforma rechazada correctamente');
                            options?.onSuccess?.();
                            setIsSubmitting(false);
                        },
                        onError: (errors) => {
                            NotificationService.error('Error al rechazar la proforma');
                            console.error('Reject errors:', errors);
                            options?.onError?.(new Error('Error al rechazar'));
                            setIsSubmitting(false);
                        },
                    }
                );
            })
            .catch(() => {
                NotificationService.error('Error al guardar la coordinación');
                setIsSubmitting(false);
            });
        } else {
            // Si no hay coordinación, solo rechazar
            router.post(
                proformasService.rechazarUrl(proforma.id),
                { motivo: motivo.trim() },
                {
                    onSuccess: () => {
                        NotificationService.success('Proforma rechazada correctamente');
                        options?.onSuccess?.();
                        setIsSubmitting(false);
                    },
                    onError: (errors) => {
                        NotificationService.error('Error al rechazar la proforma');
                        console.error('Reject errors:', errors);
                        options?.onError?.(new Error('Error al rechazar'));
                        setIsSubmitting(false);
                    },
                }
            );
        }
    }, [proforma.id, puedeRechazar, options]);

    // ============================================
    // ACCIÓN: CONVERTIR A VENTA
    // ============================================
    const convertirAVenta = useCallback(() => {
        if (!puedeConvertir) {
            NotificationService.warning('Esta proforma no puede ser convertida a venta en este momento');
            return;
        }

        setIsConverting(true);

        // LOG 1: Inicio del proceso
        console.log('🔄 [CONVERTIR A VENTA] Iniciando conversión de proforma', {
            proformaId: proforma.id,
            proformaNumero: proforma.numero,
            proformaEstado: proforma.estado,
            clienteId: proforma.cliente_id,
            montoTotal: proforma.total,
            timestamp: new Date().toISOString(),
        });

        // Usar web endpoint (ProformaController) para compatibilidad con ReservaStock
        const url = proformasService.convertirVentaUrl(proforma.id);

        console.log('📤 [CONVERTIR A VENTA] URL a llamar:', url);

        // Obtener token CSRF del meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({}),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(error => {
                        throw new Error(error?.message || 'Error al convertir la proforma');
                    });
                }
                return response.json();
            })
            .then((data) => {
                console.log('✅ [CONVERTIR A VENTA] Conversión exitosa', {
                    timestamp: new Date().toISOString(),
                    data: data?.data,
                    redirectTo: data?.redirect_to,
                });
                NotificationService.success('Proforma convertida a venta exitosamente');
                options?.onSuccess?.();
                setIsConverting(false);

                // Redirigir a la venta creada
                if (data?.redirect_to) {
                    console.log('📍 [CONVERTIR A VENTA] Redirigiendo a:', data.redirect_to);
                    setTimeout(() => {
                        router.visit(data.redirect_to);
                    }, 1000);
                }
            })
            .catch((error) => {
                console.log('❌ [CONVERTIR A VENTA] Error en la conversión', {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                });

                NotificationService.error(error.message || 'Error al convertir la proforma');
                console.error('Convert error:', error);
                options?.onError?.(error);
                setIsConverting(false);
            });
    }, [proforma.id, puedeConvertir, options]);

    // ============================================
    // ACCIÓN: GUARDAR COORDINACIÓN DE ENTREGA
    // ============================================
    const guardarCoordinacion = useCallback((coordinacion: CoordinacionData) => {
        if (!puedeCoordinar) {
            NotificationService.warning('Esta proforma no puede tener coordinación en este momento');
            return;
        }

        // Validaciones básicas
        if (!coordinacion.fecha_entrega_confirmada) {
            NotificationService.warning('Debe indicar una fecha de entrega');
            return;
        }

        setIsGuardandoCoordinacion(true);

        router.post(
            proformasService.coordinarUrl(proforma.id),
            coordinacion,
            {
                onSuccess: () => {
                    NotificationService.success('Coordinación guardada exitosamente');
                    options?.onSuccess?.();
                    setIsGuardandoCoordinacion(false);
                },
                onError: (errors) => {
                    NotificationService.error('Error al guardar la coordinación');
                    console.error('Coordination errors:', errors);
                    options?.onError?.(new Error('Error al guardar coordinación'));
                    setIsGuardandoCoordinacion(false);
                },
            }
        );
    }, [proforma.id, puedeCoordinar, options]);

    // ============================================
    // RETORNO PÚBLICO
    // ============================================
    return {
        // Estados de carga
        isSubmitting,
        isConverting,
        isGuardandoCoordinacion,

        // Permisos/Validaciones
        puedeAprobar,
        puedeRechazar,
        puedeConvertir,
        puedeCoordinar,

        // Acciones
        aprobar,
        rechazar,
        convertirAVenta,
        guardarCoordinacion,
    };
}

export type UseProformaActionsReturn = ReturnType<typeof useProformaActions>;
