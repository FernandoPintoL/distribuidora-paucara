/**
 * Componente: Modal para mostrar compras con diferencia de costo
 * Muestra las compras donde el precio unitario es diferente al precio COSTO actual
 * Permite actualizar tipos de precio desde aquí
 */

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/compras.utils';
import type { PrecioProductoDTO } from '@/domain/entities/precios';

interface Compra {
    compra_numero: string;
    compra_id: number;
    fecha: string;
    proveedor: string;
    estado: {
        codigo: string;
        nombre: string;
        color: string;
    };
    precio_unitario_actual: number;
    precio_unitario_compra: number;
    diferencia: number;
    porcentaje_diferencia: number;
    cantidad: number;
    subtotal_compra: number;
    es_aumento: boolean;
}

interface PrecioPropuesto {
    id: number;
    tipo_precio_id: number;
    tipo_nombre: string;
    tipo_codigo: string;
    tipo_color: string;
    tipo_es_ganancia: boolean;
    precio_actual: number;
    precio_propuesto: number;
    porcentaje_ganancia_actual: number;
    porcentaje_ganancia_propuesto: number;
}

interface ModalComprasDiferenciaCostoProps {
    isOpen: boolean;
    onClose: () => void;
    producto: {
        id: number;
        nombre: string;
        sku?: string;
        precios?: PrecioProductoDTO[]; // ✅ NUEVO: Array de precios
    } | null;
    precioActual: number | null;
    precioCostoNuevo?: number | null; // ✅ NUEVO: Nuevo precio de costo propuesto
    compras: Compra[];
    loading?: boolean;
    onActualizarPrecios?: (precios: Array<{ precio_id: number; precio_nuevo: number; motivo: string }>) => Promise<void>; // ✅ NUEVO: Callback para actualizar
}

export const ModalComprasDiferenciaCostoComponent: React.FC<ModalComprasDiferenciaCostoProps> = ({
    isOpen,
    onClose,
    producto,
    precioActual,
    precioCostoNuevo,
    compras,
    loading = false,
    onActualizarPrecios,
}) => {
    const [activeTab, setActiveTab] = useState<'compras' | 'precios'>('compras'); // ✅ NUEVO: Tabs para compras y precios
    const [preciosPropuestos, setPreciosPropuestos] = useState<PrecioPropuesto[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [motivoActualizacion, setMotivoActualizacion] = useState('Cambio de costo en compra');
    const [inputsEditando, setInputsEditando] = useState<{[key: number]: {precio?: string; ganancia?: string}}>({});

    // ✅ NUEVO: Calcular precios propuestos cuando cambia el costo
    useEffect(() => {
        if (!producto?.precios || !precioCostoNuevo || !precioActual) {
            setPreciosPropuestos([]);
            return;
        }

        const nuevosPrecios = producto.precios
            .map((precio) => {
                // Si es el COSTO, usar el nuevo precio de costo directo (0% de ganancia)
                if (precio.tipo.codigo === 'COSTO') {
                    return {
                        id: precio.id,
                        tipo_precio_id: precio.tipo_precio_id,
                        tipo_nombre: precio.tipo.nombre,
                        tipo_codigo: precio.tipo.codigo,
                        tipo_color: precio.tipo.color,
                        tipo_es_ganancia: precio.tipo.es_ganancia,
                        precio_actual: precio.precio_actual,
                        precio_propuesto: redondearDos(precioCostoNuevo),
                        porcentaje_ganancia_actual: precio.porcentaje_ganancia,
                        porcentaje_ganancia_propuesto: 0, // El costo no tiene ganancia
                    };
                }

                // Para otros precios, calcular basado en margen de ganancia actual
                const diferenciaCosto = precioCostoNuevo - (precioActual || 0);
                const nuevoPrecio = precioCostoNuevo + precio.margen_ganancia + diferenciaCosto;

                return {
                    id: precio.id,
                    tipo_precio_id: precio.tipo_precio_id,
                    tipo_nombre: precio.tipo.nombre,
                    tipo_codigo: precio.tipo.codigo,
                    tipo_color: precio.tipo.color,
                    tipo_es_ganancia: precio.tipo.es_ganancia,
                    precio_actual: precio.precio_actual,
                    precio_propuesto: Math.max(0, redondearDos(nuevoPrecio)),
                    porcentaje_ganancia_actual: precio.porcentaje_ganancia,
                    porcentaje_ganancia_propuesto: precioCostoNuevo > 0 ? redondearDos(((nuevoPrecio - precioCostoNuevo) / precioCostoNuevo) * 100) : 0,
                };
            });

        setPreciosPropuestos(nuevosPrecios);
    }, [producto?.precios, precioCostoNuevo, precioActual]);

    // Helper para redondear a 2 decimales
    const redondearDos = (valor: number): number => {
        return Math.round(valor * 100) / 100;
    };

    // ✅ NUEVO: Manejar cambio de precio propuesto
    const handleCambioPrecioPropuesto = (index: number, nuevoValor: number) => {
        const nuevos = [...preciosPropuestos];
        nuevos[index].precio_propuesto = redondearDos(nuevoValor);

        // Recalcular porcentaje de ganancia
        if (precioCostoNuevo && precioCostoNuevo > 0) {
            nuevos[index].porcentaje_ganancia_propuesto = redondearDos(
                ((nuevoValor - precioCostoNuevo) / precioCostoNuevo) * 100
            );
        }

        setPreciosPropuestos(nuevos);
    };

    // ✅ NUEVO: Manejar cambio de porcentaje de ganancia
    const handleCambioGananciaPropuesta = (index: number, nuevoValor: number) => {
        const nuevos = [...preciosPropuestos];
        nuevos[index].porcentaje_ganancia_propuesto = redondearDos(nuevoValor);

        // Recalcular precio propuesto basado en el nuevo porcentaje
        if (precioCostoNuevo && precioCostoNuevo > 0) {
            nuevos[index].precio_propuesto = redondearDos(
                precioCostoNuevo + (precioCostoNuevo * (nuevoValor / 100))
            );
        }

        setPreciosPropuestos(nuevos);
    };

    // ✅ NUEVO: Guardar cambios de precios
    const handleGuardarPrecios = async () => {
        if (!onActualizarPrecios) return;

        // Filtrar solo los precios que cambieron (precio o porcentaje)
        const preciosCambiados = preciosPropuestos
            .filter(p =>
                Math.abs(p.precio_propuesto - p.precio_actual) > 0.01 ||
                Math.abs(p.porcentaje_ganancia_propuesto - p.porcentaje_ganancia_actual) > 0.01
            )
            .map(p => ({
                precio_id: p.id,
                precio_nuevo: p.precio_propuesto,
                porcentaje_ganancia: p.porcentaje_ganancia_propuesto,
                motivo: motivoActualizacion,
            }));

        if (preciosCambiados.length === 0) {
            alert('No hay cambios en los precios');
            return;
        }

        console.log('📤 Enviando precios al backend:', JSON.stringify({ precios: preciosCambiados }, null, 2));

        setGuardando(true);
        try {
            await onActualizarPrecios(preciosCambiados);
            console.log('✅ Precios actualizados exitosamente');
            onClose();
        } catch (error) {
            console.error('❌ Error al actualizar precios:', error);
            alert('Error al actualizar precios');
        } finally {
            setGuardando(false);
        }
    };

    if (!isOpen || !producto) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-lg shadow-xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-b border-red-200 dark:border-red-800/50 px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">📦</div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                                        {producto.nombre}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">
                                        SKU: {producto.sku || 'N/A'} • Precio COSTO actual: {formatCurrency(precioActual || 0)}
                                        {precioCostoNuevo && precioCostoNuevo !== precioActual && (
                                            <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                                                → Nuevo: {formatCurrency(precioCostoNuevo)}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 border-t border-red-200 dark:border-red-800/50 pt-4 -mx-6 px-6">
                            <button
                                onClick={() => setActiveTab('compras')}
                                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'compras'
                                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 border-b-2 border-red-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                📋 Compras con Diferencia
                            </button>
                            <button
                                onClick={() => setActiveTab('precios')}
                                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'precios'
                                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 border-b-2 border-blue-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                💰 Tipos de Precio ({preciosPropuestos.length})
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-96 overflow-y-auto">
                        {/* Tab: Compras */}
                        {activeTab === 'compras' && (
                            <>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="inline-block animate-spin">
                                            <div className="h-8 w-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full" />
                                        </div>
                                        <p className="ml-4 text-gray-600 dark:text-slate-400">Cargando compras...</p>
                                    </div>
                                ) : compras.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="mb-4 text-4xl">✅</div>
                                        <p className="text-gray-700 dark:text-slate-300 font-semibold mb-2">Sin cambios necesarios</p>
                                        <p className="text-gray-600 dark:text-slate-400">El precio de la última compra aprobada coincide con el precio registrado en el sistema.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-slate-50">Compra</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-slate-50">Proveedor</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-slate-50">Fecha</th>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-slate-50">Estado</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-50">Precio Actual</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-50">Precio Compra</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-50">Diferencia</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-50">%</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-50">Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                                {compras.map((compra) => (
                                                    <tr key={compra.compra_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-50">
                                                            #{compra.compra_numero}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                                                            {compra.proveedor}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                                                            {new Date(compra.fecha).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                                style={{
                                                                    backgroundColor: compra.estado.color || '#999999',
                                                                }}
                                                            >
                                                                {compra.estado.nombre}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                                                            {formatCurrency(compra.precio_unitario_actual)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-50">
                                                            {formatCurrency(compra.precio_unitario_compra)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-bold ${compra.es_aumento
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                            }`}>
                                                            {compra.es_aumento ? '+' : ''}{formatCurrency(compra.diferencia)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-bold ${compra.es_aumento
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                            }`}>
                                                            {compra.es_aumento ? '+' : ''}{compra.porcentaje_diferencia.toFixed(1)}%
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                                                            {compra.cantidad.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Tab: Tipos de Precio */}
                        {activeTab === 'precios' && (
                            <>
                                {preciosPropuestos.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-gray-600 dark:text-slate-400">
                                            {precioCostoNuevo ? 'Cargando precios propuestos...' : 'Selecciona un nuevo costo para ver los precios propuestos'}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            {preciosPropuestos
                                                .sort((a, b) => a.tipo_precio_id - b.tipo_precio_id)
                                                .map((precio) => {
                                                    const realIndex = preciosPropuestos.findIndex(p => p.id === precio.id);
                                                    return (
                                                    <div key={precio.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Precio Actual */}
                                                            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span
                                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                                        style={{
                                                                            backgroundColor: precio.tipo_color || '#999999',
                                                                        }}
                                                                    >
                                                                        {precio.tipo_nombre}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        ({precio.id}) | ({precio.tipo_codigo})
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                                    Precio Actual
                                                                </div>
                                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                    {formatCurrency(precio.precio_actual)}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    Ganancia: {precio.porcentaje_ganancia_actual.toFixed(1)}%
                                                                </div>
                                                            </div>

                                                            {/* Precio Propuesto (Editable) */}
                                                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                    💡 Precio Propuesto
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={inputsEditando[realIndex]?.precio !== undefined ? inputsEditando[realIndex].precio : precio.precio_propuesto.toFixed(2)}
                                                                    onChange={(e) => {
                                                                        setInputsEditando(prev => ({
                                                                            ...prev,
                                                                            [realIndex]: { ...prev[realIndex], precio: e.target.value }
                                                                        }));
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const valor = e.target.value ? Number(e.target.value) : 0;
                                                                        handleCambioPrecioPropuesto(realIndex, valor);
                                                                        setInputsEditando(prev => ({
                                                                            ...prev,
                                                                            [realIndex]: { ...prev[realIndex], precio: undefined }
                                                                        }));
                                                                    }}
                                                                    className="w-full text-2xl font-bold px-3 py-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                                                                />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                                                            Ganancia (%)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={inputsEditando[realIndex]?.ganancia !== undefined ? inputsEditando[realIndex].ganancia : precio.porcentaje_ganancia_propuesto.toFixed(2)}
                                                                            onChange={(e) => {
                                                                                setInputsEditando(prev => ({
                                                                                    ...prev,
                                                                                    [realIndex]: { ...prev[realIndex], ganancia: e.target.value }
                                                                                }));
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                const valor = e.target.value ? Number(e.target.value) : 0;
                                                                                handleCambioGananciaPropuesta(realIndex, valor);
                                                                                setInputsEditando(prev => ({
                                                                                    ...prev,
                                                                                    [realIndex]: { ...prev[realIndex], ganancia: undefined }
                                                                                }));
                                                                            }}
                                                                            className="w-full px-2 py-1 text-sm border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                        />
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                            Actual
                                                                        </div>
                                                                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                                            {precio.porcentaje_ganancia_actual.toFixed(1)}%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {Math.abs(precio.precio_propuesto - precio.precio_actual) > 0.01 && (
                                                                    <div className={`text-xs font-semibold mt-2 ${precio.precio_propuesto > precio.precio_actual
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                                        }`}>
                                                                        {precio.precio_propuesto > precio.precio_actual ? '↑ Aumento' : '↓ Disminución'}: {formatCurrency(Math.abs(precio.precio_propuesto - precio.precio_actual))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                        </div>

                                        {/* Campo de motivo */}
                                        <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Motivo de la actualización
                                            </label>
                                            <input
                                                type="text"
                                                value={motivoActualizacion}
                                                onChange={(e) => setMotivoActualizacion(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Ej: Cambio de costo en compra"
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-slate-800/30 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-medium transition-colors"
                        >
                            Cerrar
                        </button>

                        {activeTab === 'precios' && preciosPropuestos.length > 0 && onActualizarPrecios && (
                            <button
                                onClick={handleGuardarPrecios}
                                disabled={guardando}
                                className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {guardando && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {guardando ? 'Actualizando...' : '💾 Guardar Cambios'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
