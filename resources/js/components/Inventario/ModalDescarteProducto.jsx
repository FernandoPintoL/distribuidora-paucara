import React, { useState, useEffect, useMemo } from 'react';

export default function ModalDescarteProducto({ show, item, onClose, onDescartar }) {
    const [formulario, setFormulario] = useState({
        motivo: '',
        observaciones: '',
        cantidad: null,
        confirmarDescarte: false
    });

    // Resetear formulario cuando se abre/cierra el modal
    useEffect(() => {
        if (show && item) {
            setFormulario({
                motivo: '',
                observaciones: '',
                cantidad: item.cantidad_actual,
                confirmarDescarte: false
            });
        } else if (!show) {
            setFormulario({
                motivo: '',
                observaciones: '',
                cantidad: null,
                confirmarDescarte: false
            });
        }
    }, [show, item]);

    const puedeDescartar = useMemo(() => {
        return formulario.motivo &&
            formulario.observaciones.trim() &&
            formulario.cantidad &&
            formulario.cantidad > 0 &&
            formulario.confirmarDescarte;
    }, [formulario]);

    const enviarDescarte = () => {
        if (!puedeDescartar || !item) return;

        onDescartar({
            producto_id: item.producto.id,
            almacen_id: item.almacen.id,
            cantidad: -formulario.cantidad, // Negativo para salida
            observacion: `DESCARTE - ${formulario.motivo.toUpperCase()}: ${formulario.observaciones}`,
            lote: item.lote,
            fecha_vencimiento: item.fecha_vencimiento
        });
    };

    const handleInputChange = (campo, valor) => {
        setFormulario(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Descartar Producto
                                </h3>
                                <div className="mt-4">
                                    <div className="mb-4 p-3 bg-red-50 rounded-md border border-red-200">
                                        <p className="text-sm text-red-800 mb-2">
                                            <strong>⚠️ Acción irreversible:</strong> Esta acción eliminará el producto del inventario.
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Producto:</strong> {item?.producto?.nombre}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Lote:</strong> {item?.lote || 'Sin lote'}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Cantidad a descartar:</strong> {item?.cantidad_actual}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Días para vencer:</strong> {item?.dias_restantes} días
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                                                Motivo del Descarte *
                                            </label>
                                            <select
                                                id="motivo"
                                                value={formulario.motivo}
                                                onChange={(e) => handleInputChange('motivo', e.target.value)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                                                required
                                            >
                                                <option value="">Seleccionar motivo</option>
                                                <option value="vencido">Producto vencido</option>
                                                <option value="proximo_vencer">Próximo a vencer</option>
                                                <option value="daño_fisico">Daño físico</option>
                                                <option value="contaminacion">Contaminación</option>
                                                <option value="defecto_calidad">Defecto de calidad</option>
                                                <option value="otro">Otro motivo</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                                                Observaciones Detalladas *
                                            </label>
                                            <textarea
                                                id="observaciones"
                                                rows="4"
                                                value={formulario.observaciones}
                                                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                                                placeholder="Describe las condiciones del producto, fecha de vencimiento, estado físico, etc..."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="cantidad_descartar" className="block text-sm font-medium text-gray-700 mb-2">
                                                Cantidad a Descartar
                                            </label>
                                            <input
                                                id="cantidad_descartar"
                                                type="number"
                                                min="1"
                                                max={item?.cantidad_actual || 0}
                                                value={formulario.cantidad || ''}
                                                onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value) || null)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                                                required
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Cantidad disponible: {item?.cantidad_actual || 0}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formulario.confirmarDescarte}
                                                    onChange={(e) => handleInputChange('confirmarDescarte', e.target.checked)}
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                    required
                                                />
                                                <span className="ml-2 text-sm text-gray-700">
                                                    Confirmo que deseo descartar este producto del inventario
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={enviarDescarte}
                            disabled={!puedeDescartar}
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${puedeDescartar
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Descartar Producto
                        </button>
                        <button
                            onClick={onClose}
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
