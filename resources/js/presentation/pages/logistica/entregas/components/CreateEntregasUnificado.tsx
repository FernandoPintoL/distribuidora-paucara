import { useMemo, useState } from 'react';
import { AlertCircle, Package, ChevronLeft, CheckCircle2, Plus } from 'lucide-react';
import { Card } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import BatchVentaSelector from './BatchVentaSelector';
import BatchVehiculoAssignment from './BatchVehiculoAssignment';
import BatchOptimizationResult from './BatchOptimizationResult';
import SimpleEntregaForm from './SimpleEntregaForm';
import { useEntregaBatch } from '@/application/hooks/use-entrega-batch';
import { router } from '@inertiajs/react';

interface VentaConDetalles {
    id: number;
    numero_venta: string;
    numero?: string;
    total: number;
    fecha_venta?: string;
    fecha?: string;
    estado?: string;
    cliente: {
        id: number;
        nombre: string;
        telefono?: string;
    };
    cantidad_items?: number;
    peso_estimado?: number;
    detalles?: any[];
}

interface VehiculoCompleto {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    capacidad_carga?: number;
    capacidad_kg: number;
}

interface ChoferEntrega {
    id: number;
    name?: string;
    nombre?: string;
    email?: string;
    tiene_licencia?: boolean;
}

interface CreateEntregasUnificadoProps {
    ventas: VentaConDetalles[];
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEntrega[];
    ventaPreseleccionada?: number;
    onCancel?: () => void;
}

/**
 * Componente Unificado para Creación de Entregas - OPCIÓN B
 *
 * Layout persistente: Lista de ventas siempre visible (izquierda)
 * Panel dinámico: Formulario cambia según selección (derecha)
 *
 * Estructura:
 * - Panel Izquierdo (4/12): BatchVentaSelector sticky
 * - Panel Derecho (8/12): renderDynamicFormPanel()
 *   - 0 ventas: Mensaje instructivo
 *   - 1 venta: SimpleEntregaForm
 *   - 2+ ventas: BatchUI con optimización
 * - Footer Sticky: Solo cuando hay ≥1 venta seleccionada
 */
export default function CreateEntregasUnificado({
    ventas,
    vehiculos,
    choferes,
    ventaPreseleccionada,
    onCancel,
}: CreateEntregasUnificadoProps) {
    // Estado de selección de ventas
    const [selectedVentaIds, setSelectedVentaIds] = useState<number[]>(
        ventaPreseleccionada ? [ventaPreseleccionada] : []
    );

    // Hooks para batch (2+ ventas)
    const {
        formData,
        isLoading,
        isSubmitting,
        preview,
        previewError,
        submitError,
        successMessage,
        updateFormData,
        obtenerPreview,
        handleSubmit: handleSubmitBatch,
    } = useEntregaBatch();

    // Detectar modo
    const selectedCount = selectedVentaIds.length;
    const isSingleMode = selectedCount === 1;
    const isBatchMode = selectedCount > 1;
    const isEmptyMode = selectedCount === 0;

    // Totales seleccionados
    const totals = useMemo(() => {
        const selectedVentas = ventas.filter((v) => selectedVentaIds.includes(v.id));
        return {
            count: selectedVentaIds.length,
            pesoTotal: selectedVentas.reduce((sum, v) => sum + (v.peso_estimado ?? 0), 0),
            montoTotal: selectedVentas.reduce((sum, v) => sum + (v.total ?? 0), 0),
        };
    }, [ventas, selectedVentaIds]);

    // Validaciones para batch
    const selectedVehiculo = vehiculos.find((v) => v.id === formData.vehiculo_id);
    const capacidadInsuficiente = selectedVehiculo && totals.pesoTotal > selectedVehiculo.capacidad_kg;

    // Handlers
    const handleToggleVenta = (ventaId: number) => {
        setSelectedVentaIds((prev) => {
            const updated = prev.includes(ventaId)
                ? prev.filter((id) => id !== ventaId)
                : [...prev, ventaId];

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
    const handleSubmitSimple = async (data: any) => {
        try {
            const response = await fetch('/api/entregas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Error al crear entrega');

            router.visit('/logistica/entregas');
        } catch (error) {
            console.error('Error al crear entrega:', error);
            throw error;
        }
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
                            <div>
                                <h3 className="font-semibold text-red-800 dark:text-red-200">Error</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{submitError}</p>
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

                {/* Asignación de Vehículo y Chofer */}
                <Card className="dark:bg-slate-900 dark:border-slate-700 p-4 mb-4">
                    <BatchVehiculoAssignment
                        vehiculos={vehiculos}
                        choferes={choferes}
                        selectedVehiculoId={formData.vehiculo_id}
                        selectedChoferId={formData.chofer_id}
                        pesoTotal={totals.pesoTotal}
                        onVehiculoSelect={(id) => updateFormData({ vehiculo_id: id })}
                        onChoferSelect={(id) => updateFormData({ chofer_id: id })}
                    />
                </Card>

                {/* Opciones de optimización */}
                <Card className="dark:bg-slate-900 dark:border-slate-700 p-4 mb-4">
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
                </Card>

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
                                    del vehículo ({selectedVehiculo?.capacidad_kg} kg)
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Preview de Optimización */}
                {formData.optimizar && (
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
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Crear Entrega o Entregas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Selecciona una o más ventas para continuar
                    </p>
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

                {/* Footer Sticky - Solo cuando hay selección */}
                {selectedCount > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-slate-950 py-4">
                        <Button
                            onClick={() => {
                                if (isSingleMode) {
                                    handleToggleVenta(selectedVentaIds[0]);
                                } else {
                                    handleClearSelection();
                                }
                            }}
                            variant="outline"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                if (isSingleMode) {
                                    // SimpleEntregaForm maneja su propio submit
                                    // Este botón se maneja dentro del formulario
                                } else {
                                    handleSubmitBatch();
                                }
                            }}
                            disabled={
                                isBatchMode &&
                                (!formData.vehiculo_id || !formData.chofer_id || capacidadInsuficiente || isSubmitting)
                            }
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-600 dark:disabled:bg-gray-600 text-white"
                        >
                            {isSingleMode && 'Crear Entrega'}
                            {isBatchMode && (
                                <>
                                    {isSubmitting ? 'Creando...' : `Crear ${selectedCount} Entregas`}
                                    {!isSubmitting && <Plus className="h-4 w-4 ml-2" />}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
