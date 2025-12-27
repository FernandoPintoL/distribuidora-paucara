import { useMemo, useState, useCallback, useEffect } from 'react';
import { AlertCircle, Package, CheckCircle2, Plus, Zap } from 'lucide-react';
import { Card } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import BatchVentaSelector from './BatchVentaSelector';
import SimpleEntregaForm from './SimpleEntregaForm';
import ConsolidacionAutomaticaModal from './ConsolidacionAutomaticaModal';
import { VehicleRecommendationCard } from '@/presentation/components/entrega/VehicleRecommendationCard';
import { useEntregaBatch } from '@/application/hooks/use-entrega-batch';
import { useSimpleEntregaSubmit } from '@/application/hooks/use-simple-entrega-submit';
import { useVehiculoRecomendado } from '@/application/hooks/use-vehiculo-recomendado';
import type { VentaConDetalles, VehiculoCompleto, ChoferEntrega, EntregaFormData } from '@/domain/entities/entregas';
import type { Id } from '@/domain/entities/shared';

interface CreateEntregasUnificadoProps {
    ventas: VentaConDetalles[];
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEntrega[];
    ventaPreseleccionada?: number;
    onCancel?: () => void;
}

/**
 * Presentación: Componente Unificado de Creación de Entregas
 *
 * ARQUITECTURA LIMPIA - Responsabilidades por capa:
 *
 * ✅ PRESENTACIÓN (Este archivo):
 *   - UI layout y renderizado
 *   - Gestión de estado de selección
 *   - Delegación a hooks de application
 *   - Mostrar estados y errores
 *
 * ✅ APPLICATION (Hooks):
 *   - use-entregas-create.ts: Lógica para 1 venta
 *   - use-entrega-batch.ts: Lógica para 2+ ventas
 *   - Validación de negocio
 *   - Orquestación de servicios
 *   - Manejo de navegación
 *
 * ✅ INFRASTRUCTURE (Servicios):
 *   - entregas.service.ts: URLs y operaciones HTTP
 *   - logistica.service.ts: Operaciones complejas
 *   - Abstracción de HTTP
 *
 * ✅ DOMAIN (Tipos):
 *   - Tipos de Entrega, VentaConDetalles, etc.
 *   - Sin lógica, solo contratos
 *
 * Layout:
 * - Panel Izquierdo (4/12): BatchVentaSelector sticky
 * - Panel Derecho (8/12): renderDynamicFormPanel()
 *   - 0 ventas: Mensaje instructivo
 *   - 1 venta: SimpleEntregaForm (usa Inertia.js router.post())
 *   - 2+ ventas: BatchUI con optimización
 * - Footer Sticky: Solo cuando hay ≥1 venta seleccionada
 */
export default function CreateEntregasUnificado({
    ventas,
    vehiculos,
    choferes,
    ventaPreseleccionada,
}: CreateEntregasUnificadoProps) {
    // Estado de selección de ventas
    // Usar Id en lugar de number para ser compatible con VentaConDetalles.id
    const [selectedVentaIds, setSelectedVentaIds] = useState<Id[]>(
        ventaPreseleccionada ? [ventaPreseleccionada] : []
    );

    // Estado del modal de consolidación automática
    const [isConsolidacionModalOpen, setIsConsolidacionModalOpen] = useState(false);

    // Hooks para batch (2+ ventas)
    const {
        formData,
        isSubmitting,
        submitError,
        successMessage,
        updateFormData,
        handleSubmit: handleSubmitBatch,
    } = useEntregaBatch();

    // Hook para envío de entrega simple
    const { submitEntrega } = useSimpleEntregaSubmit();

    // Memoized callbacks para vehicle recommendation
    // Estos callbacks deben ser estables para que el useEffect en VehicleRecommendationCard funcione correctamente
    const handleSelectVehiculo = useCallback((vehiculoId: Id) => {
        console.log('📍 Actualizando vehiculo_id:', vehiculoId);
        updateFormData({ vehiculo_id: vehiculoId });
    }, [updateFormData]);

    const handleSelectChofer = useCallback((choferId: Id) => {
        console.log('👤 Actualizando chofer_id:', choferId);
        updateFormData({ chofer_id: choferId });
    }, [updateFormData]);

    // Hook para recomendación de vehículo (batch mode)
    const {
        recomendado,
        disponibles,
        pesoTotal: pesoRecomendacion,
        isLoading: loadingRecomendacion,
        error: errorRecomendacion,
        alerta: alertaRecomendacion,
    } = useVehiculoRecomendado(
        selectedVentaIds,
        ventas,
        true, // Auto-select recomendado
        handleSelectVehiculo
    );

    // Auto-seleccionar vehículo cuando se carga la recomendación
    useEffect(() => {
        if (recomendado && !formData.vehiculo_id) {
            console.log('✅ Auto-seleccionando vehículo recomendado:', {
                vehiculo: {
                    id: recomendado.id,
                    placa: recomendado.placa,
                    marca: recomendado.marca,
                    modelo: recomendado.modelo,
                    capacidad_kg: recomendado.capacidad_kg,
                    porcentaje_uso: recomendado.porcentaje_uso,
                },
                peso_total: pesoRecomendacion,
            });
            handleSelectVehiculo(recomendado.id);
        }
    }, [recomendado?.id, formData.vehiculo_id, handleSelectVehiculo, pesoRecomendacion]);

    // Auto-seleccionar chofer cuando se carga la recomendación y hay un choferAsignado
    useEffect(() => {
        if (recomendado?.choferAsignado && !formData.chofer_id) {
            console.log('✅ Auto-seleccionando chofer:', {
                id: recomendado.choferAsignado.id,
                nombre: recomendado.choferAsignado.nombre || recomendado.choferAsignado.name,
                telefono: recomendado.choferAsignado.telefono,
            });
            handleSelectChofer(recomendado.choferAsignado.id);
        }
    }, [recomendado?.choferAsignado?.id, formData.chofer_id, handleSelectChofer]);

    // Sincronizar selectedVentaIds con formData.venta_ids para que el submit funcione
    useEffect(() => {
        updateFormData({ venta_ids: selectedVentaIds });
    }, [selectedVentaIds]);

    // Detectar modo - DEBE IR ANTES del useEffect que lo usa
    const selectedCount = selectedVentaIds.length;
    const isSingleMode = selectedCount === 1;
    const isBatchMode = selectedCount > 1;
    const isEmptyMode = selectedCount === 0;

    // Totales seleccionados - DEBE IR ANTES del useEffect que lo usa
    const totals = useMemo(() => {
        const selectedVentas = ventas.filter((v) => selectedVentaIds.includes(v.id));
        return {
            count: selectedVentaIds.length,
            pesoTotal: selectedVentas.reduce((sum, v) => sum + (v.peso_estimado ?? 0), 0),
            montoTotal: selectedVentas.reduce((sum, v) => sum + (v.total ?? 0), 0),
        };
    }, [ventas, selectedVentaIds]);

    // Validaciones para batch - DEBE IR ANTES del useEffect que lo usa
    const selectedVehiculo = vehiculos.find((v) => v.id === formData.vehiculo_id);
    const capacidadInsuficiente = selectedVehiculo && totals.pesoTotal > (selectedVehiculo.capacidad_kg ?? 0);

    // Monitor del estado del formulario
    useEffect(() => {
        if (isBatchMode) {
            const buttonStatus = !formData.vehiculo_id || !formData.chofer_id ? '❌ DESHABILITADO' : '✅ HABILITADO';
            console.log('📋 Estado del Formulario:', {
                buttonStatus,
                formData: {
                    vehiculo_id: formData.vehiculo_id ?? 'undefined',
                    chofer_id: formData.chofer_id ?? 'undefined',
                    tipo_reporte: formData.tipo_reporte,
                },
                validaciones: {
                    capacidadInsuficiente,
                    pesoTotal: totals.pesoTotal,
                },
            });
        }
    }, [formData.vehiculo_id, formData.chofer_id, isBatchMode, capacidadInsuficiente, totals.pesoTotal]);

    // Handlers
    const handleToggleVenta = (ventaId: Id) => {
        setSelectedVentaIds((prev) => {
            const updated = prev.includes(ventaId)
                ? prev.filter((id) => id !== ventaId)
                : [...prev, ventaId];

            // Log de selección
            const selectedVentas = ventas.filter((v) => updated.includes(v.id));
            console.log('📦 Ventas Seleccionadas:', {
                count: updated.length,
                ventaIds: updated,
                ventas: selectedVentas.map(v => ({
                    id: v.id,
                    numero_venta: v.numero_venta,
                    cliente: v.cliente?.nombre,
                    peso_estimado: v.peso_estimado,
                    total: v.total,
                }))
            });

            // Limpiar preview si deselecciona en batch con optimización activa
            if (prev.length >= 2 && updated.length >= 2 && formData.optimizar) {
                updateFormData({ optimizar: false });
            }

            return updated;
        });
    };

    const handleSelectAll = () => {
        setSelectedVentaIds(ventas.map((v) => v.id));
    };

    const handleClearSelection = () => {
        setSelectedVentaIds([]);
    };

    // Handler para SimpleEntregaForm (1 venta)
    // Delega al hook de application que usa el servicio de infrastructure
    const handleSubmitSimple = async (data: EntregaFormData): Promise<void> => {
        await submitEntrega(data);
    };

    // Renderizar panel dinámico según selección
    const renderDynamicFormPanel = () => {
        // Caso 0: Sin selección
        if (isEmptyMode) {
            return (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="p-12 text-center">
                        <Package className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                        <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Selecciona ventas para comenzar
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-6">
                            Puedes seleccionar una o múltiples ventas desde el listado de la izquierda
                        </p>
                        <ul className="text-sm text-left inline-block space-y-2 text-blue-700 dark:text-blue-300">
                            <li className="flex items-center gap-2">
                                <span className="text-lg">✓</span>
                                <span><strong>1 venta</strong> → Formulario simple</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-lg">✓</span>
                                <span><strong>2+ ventas</strong> → Optimización inteligente</span>
                            </li>
                        </ul>
                    </div>
                </Card>
            );
        }

        // Caso 1: Una venta - SimpleEntregaForm
        if (isSingleMode) {
            const selectedVenta = ventas.find((v) => v.id === selectedVentaIds[0]);
            if (!selectedVenta) return null;

            return (
                <SimpleEntregaForm
                    venta={selectedVenta}
                    vehiculos={vehiculos}
                    choferes={choferes}
                    onSubmit={handleSubmitSimple}
                />
            );
        }

        // Caso 2+: Múltiples ventas - Batch UI
        return (
            <>
                {/* Encabezado */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Crear {selectedCount} Entregas en Lote
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Asigna un vehículo y chofer para todas las entregas
                    </p>
                </div>

                {/* Mensajes de estado */}
                {submitError && (
                    <Card className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800 dark:text-red-200">Error al crear entregas</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{submitError}</p>

                                {/* Acciones para diferentes tipos de error */}
                                {submitError.includes('no está disponible') && (
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => {
                                                // Limpiar selección de vehículo/chofer para re-obtener recomendación
                                                updateFormData({ vehiculo_id: null, chofer_id: null });
                                                console.log('🔄 Limpiando selección para solicitar nueva recomendación');
                                            }}
                                            className="text-sm px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                        >
                                            Solicitar nueva recomendación
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {successMessage && (
                    <Card className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-green-800 dark:text-green-200">¡Éxito!</h3>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    {successMessage}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Asignación de Recursos - Recomendación + Selección Manual */}
                <div className="space-y-4 mb-4">
                    {/* Recomendación Inteligente de Vehículo (si está disponible) */}
                    {(recomendado || alertaRecomendacion || errorRecomendacion || loadingRecomendacion) && (
                        <VehicleRecommendationCard
                            recomendado={recomendado}
                            disponibles={disponibles}
                            pesoTotal={pesoRecomendacion}
                            isLoading={loadingRecomendacion}
                            error={errorRecomendacion}
                            alerta={alertaRecomendacion}
                            selectedVehiculoId={formData.vehiculo_id ?? undefined}
                            selectedChoferId={formData.chofer_id ?? null}
                            choferes={choferes}
                            onSelectVehiculo={handleSelectVehiculo}
                            onSelectChofer={handleSelectChofer}
                        />
                    )}

                    {/* Selección Manual de Vehículo y Chofer (siempre disponible como fallback) */}
                    {/* <Card className="dark:bg-slate-900 dark:border-slate-700 p-4 mb-4">
                        <BatchVehiculoAssignment
                            vehiculos={vehiculos}
                            choferes={choferes}
                            selectedVehiculoId={formData.vehiculo_id}
                            selectedChoferId={formData.chofer_id}
                            pesoTotal={totals.pesoTotal}
                            onVehiculoSelect={(id) => updateFormData({ vehiculo_id: id })}
                            onChoferSelect={(id) => updateFormData({ chofer_id: id })}
                        />
                    </Card> */}
                </div>

                {/* Tipo de Reporte de Carga - Automático */}
                <Card className="dark:bg-slate-900 dark:border-slate-700 p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {selectedCount === 1
                            ? `Se creará 1 reporte individual para esta entrega`
                            : `Se creará 1 reporte consolidado para las ${selectedCount} entregas`
                        }
                    </p>
                </Card>

                {/* Opciones de optimización */}
                {/* <Card className="dark:bg-slate-900 dark:border-slate-700 p-4 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.optimizar}
                            onChange={(e) => updateFormData({ optimizar: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                Calcular optimización de rutas
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Usa algoritmos inteligentes para sugerir el mejor orden de entregas
                            </p>
                        </div>
                    </label>
                </Card> */}

                {/* Advertencias */}
                {capacidadInsuficiente && (
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                    Capacidad insuficiente
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    El peso total ({totals.pesoTotal.toFixed(1)} kg) excede la capacidad
                                    del vehículo ({(selectedVehiculo?.capacidad_kg ?? 0).toFixed(1)} kg)
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Preview de Optimización */}
                {/* {formData.optimizar && (
                    <div className="space-y-3">
                        <button
                            onClick={obtenerPreview}
                            disabled={
                                !selectedVentaIds.length ||
                                !formData.vehiculo_id ||
                                !formData.chofer_id ||
                                isLoading
                            }
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Calculando...' : 'Ver Preview de Optimización'}
                        </button>
                        <BatchOptimizationResult
                            preview={preview}
                            error={previewError}
                            isLoading={isLoading}
                        />
                    </div>
                )} */}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Crear Entrega o Entregas
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Selecciona una o más ventas para continuar
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsConsolidacionModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white whitespace-nowrap"
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        Consolidar Automáticamente
                    </Button>
                </div>

                {/* Layout Principal: Grid 4/8 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* PANEL IZQUIERDO: Lista Persistente (4/12 = 1/3) */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-6">
                            <Card className="dark:bg-slate-900 dark:border-slate-700 p-4">
                                <BatchVentaSelector
                                    ventas={ventas}
                                    selectedIds={selectedVentaIds}
                                    onToggleVenta={handleToggleVenta}
                                    onSelectAll={handleSelectAll}
                                    onClearSelection={handleClearSelection}
                                />
                            </Card>
                        </div>
                    </div>

                    {/* PANEL DERECHO: Formulario Dinámico (8/12 = 2/3) */}
                    <div className="lg:col-span-8">
                        <div className="space-y-6">
                            {renderDynamicFormPanel()}
                        </div>
                    </div>
                </div>

                {/* Footer Sticky - Solo cuando hay selección en modo batch (2+) */}
                {isBatchMode && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-slate-950 py-4">
                        <Button
                            onClick={handleClearSelection}
                            variant="outline"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmitBatch}
                            disabled={
                                !formData.vehiculo_id || !formData.chofer_id || capacidadInsuficiente || isSubmitting
                            }
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-600 dark:disabled:bg-gray-600 text-white"
                        >
                            {isSubmitting ? 'Creando...' : `Crear ${selectedCount} Entregas`}
                            {!isSubmitting && <Plus className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                )}

                {/* Modal de Consolidación Automática */}
                <ConsolidacionAutomaticaModal
                    isOpen={isConsolidacionModalOpen}
                    onClose={() => setIsConsolidacionModalOpen(false)}
                />
            </div>
        </div>
    );
}
