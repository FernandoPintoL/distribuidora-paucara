import React, { useState, useEffect, useMemo } from 'react';

export default function ModalCrearOferta({ show, item, onClose, onCrear }) {
    const [formulario, setFormulario] = useState({
        nombreOferta: '',
        tipoOferta: '',
        porcentajeDescuento: null,
        precioEspecial: null,
        fechaInicio: '',
        fechaFin: '',
        cantidadOferta: null,
        descripcion: ''
    });

    const today = new Date().toISOString().split('T')[0];

    const maxFechaFin = useMemo(() => {
        if (!item?.fecha_vencimiento) return '';
        return item.fecha_vencimiento;
    }, [item]);

    // Resetear formulario cuando se abre/cierra el modal
    useEffect(() => {
        if (show && item) {
            setFormulario({
                nombreOferta: `Oferta Especial - ${item.producto?.nombre}`,
                tipoOferta: '',
                porcentajeDescuento: 20, // Sugerencia inicial
                precioEspecial: null,
                fechaInicio: today,
                fechaFin: '',
                cantidadOferta: item.cantidad_actual,
                descripcion: `Producto próximo a vencer en ${item.dias_restantes} días. ¡Aprovecha esta oferta especial!`
            });
        } else if (!show) {
            setFormulario({
                nombreOferta: '',
                tipoOferta: '',
                porcentajeDescuento: null,
                precioEspecial: null,
                fechaInicio: '',
                fechaFin: '',
                cantidadOferta: null,
                descripcion: ''
            });
        }
    }, [show, item, today]);

    const precioCalculado = useMemo(() => {
        if (!item?.producto?.precio_venta) return 0;

        const precioOriginal = item.producto.precio_venta;

        switch (formulario.tipoOferta) {
            case 'descuento_porcentaje':
                if (formulario.porcentajeDescuento) {
                    return precioOriginal * (1 - formulario.porcentajeDescuento / 100);
                }
                break;
            case 'precio_fijo':
                return formulario.precioEspecial || 0;
            case '2x1':
                return precioOriginal / 2;
            case 'llevate_3_paga_2':
                return precioOriginal * (2 / 3);
        }

        return precioOriginal;
    }, [item, formulario.tipoOferta, formulario.porcentajeDescuento, formulario.precioEspecial]);

    const puedeCrear = useMemo(() => {
        const basico = formulario.nombreOferta.trim() &&
            formulario.tipoOferta &&
            formulario.fechaInicio &&
            formulario.fechaFin;

        if (!basico) return false;

        // Validaciones específicas por tipo
        if (formulario.tipoOferta === 'descuento_porcentaje') {
            return formulario.porcentajeDescuento &&
                formulario.porcentajeDescuento >= 5 &&
                formulario.porcentajeDescuento <= 80;
        }

        if (formulario.tipoOferta === 'precio_fijo') {
            return formulario.precioEspecial && formulario.precioEspecial > 0;
        }

        return true;
    }, [formulario]);

    const enviarOferta = () => {
        if (!puedeCrear || !item) return;

        onCrear({
            producto_id: item.producto.id,
            almacen_id: item.almacen.id,
            nombre: formulario.nombreOferta,
            tipo: formulario.tipoOferta,
            porcentaje_descuento: formulario.porcentajeDescuento,
            precio_especial: formulario.precioEspecial,
            fecha_inicio: formulario.fechaInicio,
            fecha_fin: formulario.fechaFin,
            cantidad: formulario.cantidadOferta || item.cantidad_actual,
            descripcion: formulario.descripcion,
            lote: item.lote,
            dias_restantes: item.dias_restantes
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

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Crear Oferta Especial
                                </h3>
                                <div className="mt-4">
                                    <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
                                        <p className="text-sm text-green-800 mb-2">
                                            <strong>💡 Sugerencia:</strong> Crear una oferta especial puede ayudar a vender productos antes de su vencimiento.
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Producto:</strong> {item?.producto?.nombre}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Cantidad disponible:</strong> {item?.cantidad_actual}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Días para vencer:</strong> {item?.dias_restantes} días
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Información de la oferta */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Detalles de la Oferta</h4>

                                            <div className="mb-4">
                                                <label htmlFor="nombre_oferta" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nombre de la Oferta *
                                                </label>
                                                <input
                                                    id="nombre_oferta"
                                                    type="text"
                                                    value={formulario.nombreOferta}
                                                    onChange={(e) => handleInputChange('nombreOferta', e.target.value)}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                                    placeholder="ej: Oferta Especial - Próximo a Vencer"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="tipo_oferta" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Oferta *
                                                </label>
                                                <select
                                                    id="tipo_oferta"
                                                    value={formulario.tipoOferta}
                                                    onChange={(e) => handleInputChange('tipoOferta', e.target.value)}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                                    required
                                                >
                                                    <option value="">Seleccionar tipo</option>
                                                    <option value="descuento_porcentaje">Descuento por porcentaje</option>
                                                    <option value="precio_fijo">Precio fijo especial</option>
                                                    <option value="2x1">2x1</option>
                                                    <option value="llevate_3_paga_2">Llévate 3 paga 2</option>
                                                </select>
                                            </div>

                                            {formulario.tipoOferta === 'descuento_porcentaje' && (
                                                <div className="mb-4">
                                                    <label htmlFor="porcentaje_descuento" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Porcentaje de Descuento *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="porcentaje_descuento"
                                                            type="number"
                                                            min="5"
                                                            max="80"
                                                            value={formulario.porcentajeDescuento || ''}
                                                            onChange={(e) => handleInputChange('porcentajeDescuento', parseInt(e.target.value) || null)}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 pr-8"
                                                            required
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-500 sm:text-sm">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {formulario.tipoOferta === 'precio_fijo' && (
                                                <div className="mb-4">
                                                    <label htmlFor="precio_especial" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Precio Especial *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="precio_especial"
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            value={formulario.precioEspecial || ''}
                                                            onChange={(e) => handleInputChange('precioEspecial', parseFloat(e.target.value) || null)}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 pl-8"
                                                            required
                                                        />
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-500 sm:text-sm">$</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Configuración temporal */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Vigencia</h4>

                                            <div className="mb-4">
                                                <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fecha de Inicio *
                                                </label>
                                                <input
                                                    id="fecha_inicio"
                                                    type="date"
                                                    min={today}
                                                    value={formulario.fechaInicio}
                                                    onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fecha de Fin *
                                                </label>
                                                <input
                                                    id="fecha_fin"
                                                    type="date"
                                                    min={formulario.fechaInicio || today}
                                                    max={maxFechaFin}
                                                    value={formulario.fechaFin}
                                                    onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="cantidad_oferta" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cantidad en Oferta
                                                </label>
                                                <input
                                                    id="cantidad_oferta"
                                                    type="number"
                                                    min="1"
                                                    max={item?.cantidad_actual || 0}
                                                    value={formulario.cantidadOferta || ''}
                                                    onChange={(e) => handleInputChange('cantidadOferta', parseInt(e.target.value) || null)}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Disponible: {item?.cantidad_actual || 0} (Dejar vacío para toda la cantidad)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="descripcion_oferta" className="block text-sm font-medium text-gray-700 mb-2">
                                            Descripción de la Oferta
                                        </label>
                                        <textarea
                                            id="descripcion_oferta"
                                            rows="3"
                                            value={formulario.descripcion}
                                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                            placeholder="Describe los detalles de la oferta, condiciones especiales, etc."
                                        />
                                    </div>

                                    {/* Vista previa del precio */}
                                    {precioCalculado > 0 && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-md">
                                            <h5 className="text-sm font-medium text-blue-900 mb-2">Vista Previa de Precios</h5>
                                            <div className="text-sm text-blue-800">
                                                <p><strong>Precio Original:</strong> ${item?.producto?.precio_venta || 0}</p>
                                                <p><strong>Precio con Oferta:</strong> ${precioCalculado.toFixed(2)}</p>
                                                <p><strong>Ahorro:</strong> ${(((item?.producto?.precio_venta || 0) - precioCalculado)).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={enviarOferta}
                            disabled={!puedeCrear}
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${puedeCrear
                                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                    : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Crear Oferta
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
