import React, { useState, useEffect, useMemo } from 'react';

export default function ModalAjusteStock({ show, item, onClose, onAjustar }) {
    const [formulario, setFormulario] = useState({
        tipo: '',
        cantidad: null,
        observacion: ''
    });

    // Resetear formulario cuando se abre/cierra el modal
    useEffect(() => {
        if (!show) {
            setFormulario({
                tipo: '',
                cantidad: null,
                observacion: ''
            });
        }
    }, [show]);

    const puedeEnviar = useMemo(() => {
        return formulario.tipo &&
            formulario.cantidad &&
            formulario.cantidad > 0 &&
            formulario.observacion.trim();
    }, [formulario]);

    const calcularNuevoStock = () => {
        if (!item || !formulario.cantidad) return 0;

        const stockActual = item.cantidad_actual;
        const cantidad = formulario.cantidad;

        if (formulario.tipo === 'entrada_ajuste') {
            return stockActual + cantidad;
        } else if (formulario.tipo === 'salida_ajuste') {
            return Math.max(0, stockActual - cantidad);
        }

        return stockActual;
    };

    const enviarAjuste = () => {
        if (!puedeEnviar || !item) return;

        const cantidad = formulario.tipo === 'entrada_ajuste'
            ? formulario.cantidad
            : -formulario.cantidad;

        onAjustar({
            producto_id: item.producto.id,
            almacen_id: item.almacen.id,
            tipo: formulario.tipo,
            cantidad: cantidad,
            observacion: formulario.observacion
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
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Ajustar Stock de Inventario
                                </h3>
                                <div className="mt-4">
                                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-700">
                                            <strong>Producto:</strong> {item?.producto?.nombre}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Almacén:</strong> {item?.almacen?.nombre}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Stock Actual:</strong> {item?.cantidad_actual}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="tipo_ajuste" className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Ajuste
                                            </label>
                                            <select
                                                id="tipo_ajuste"
                                                value={formulario.tipo}
                                                onChange={(e) => handleInputChange('tipo', e.target.value)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Seleccionar tipo</option>
                                                <option value="entrada_ajuste">Entrada (Aumentar stock)</option>
                                                <option value="salida_ajuste">Salida (Reducir stock)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-2">
                                                Cantidad
                                            </label>
                                            <input
                                                id="cantidad"
                                                type="number"
                                                min="1"
                                                value={formulario.cantidad || ''}
                                                onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value) || null)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="observacion" className="block text-sm font-medium text-gray-700 mb-2">
                                                Observación
                                            </label>
                                            <textarea
                                                id="observacion"
                                                rows="3"
                                                value={formulario.observacion}
                                                onChange={(e) => handleInputChange('observacion', e.target.value)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Motivo del ajuste..."
                                                required
                                            />
                                        </div>

                                        {formulario.tipo && formulario.cantidad && (
                                            <div className={`p-3 rounded-md ${formulario.tipo === 'entrada_ajuste' ? 'bg-green-50' : 'bg-red-50'}`}>
                                                <p className={`text-sm font-medium ${formulario.tipo === 'entrada_ajuste' ? 'text-green-800' : 'text-red-800'}`}>
                                                    Stock después del ajuste:
                                                    <span className="font-bold ml-1">
                                                        {calcularNuevoStock()}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={enviarAjuste}
                            disabled={!puedeEnviar}
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${puedeEnviar
                                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                    : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            Procesar Ajuste
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
