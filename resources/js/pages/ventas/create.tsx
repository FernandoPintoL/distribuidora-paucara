import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import VentaPreviewModal from '@/components/VentaPreviewModal';

// Importar tipos del domain y servicio
import type {
    Cliente,
    Producto,
    Moneda,
    EstadoDocumento,
    VentaFormData,
    DetalleVentaFormData,
    Venta
} from '@/domain/ventas';

import ventasService from '@/services/ventas.service';
import { formatCurrency } from '@/lib/utils';

// Interfaz para detalles con producto embebido (solo para la UI)
interface DetalleVentaConProducto extends DetalleVentaFormData {
    producto?: Producto;
}

interface PageProps extends InertiaPageProps {
    clientes: Cliente[];
    productos: Producto[];
    monedas: Moneda[];
    estados_documento: EstadoDocumento[];
    auth: {
        user: {
            id: number;
            name: string;
        };
    };
    venta?: Venta;
}

export default function VentaForm() {
    const { clientes, productos, monedas, estados_documento, auth, venta } = usePage<PageProps>().props;
    const isEditing = Boolean(venta);

    // Validaciones defensivas para evitar errores usando useMemo
    const clientesSeguro = useMemo(() => clientes || [], [clientes]);
    const productosSeguro = useMemo(() => productos || [], [productos]);
    const monedasSeguro = useMemo(() => monedas || [], [monedas]);
    const estadosSeguro = useMemo(() => estados_documento || [], [estados_documento]);

    const [productSearch, setProductSearch] = useState('');
    const [availableProducts, setAvailableProducts] = useState(productosSeguro);
    const [detallesWithProducts, setDetallesWithProducts] = useState<DetalleVentaConProducto[]>([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const { data, setData, processing, errors } = useForm<VentaFormData>({
        numero: venta?.numero || '',
        fecha: venta?.fecha || new Date().toISOString().split('T')[0],
        subtotal: venta?.subtotal || 0,
        descuento: venta?.descuento || 0,
        impuesto: venta?.impuesto || 0,
        total: venta?.total || 0,
        observaciones: venta?.observaciones || '',
        cliente_id: venta?.cliente_id || 0,
        usuario_id: auth?.user?.id || 0,
        estado_documento_id: venta?.estado_documento_id || (estadosSeguro[0]?.id || 0),
        moneda_id: venta?.moneda_id || (monedasSeguro[0]?.id || 0),
        detalles: venta?.detalles?.map((d) => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento || 0,
            subtotal: d.subtotal
        })) || []
    });

    // Inicializar detalles con productos
    useEffect(() => {
        if (venta?.detalles) {
            setDetallesWithProducts(venta.detalles.map((d) => ({
                id: d.id,
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                descuento: d.descuento || 0,
                subtotal: d.subtotal,
                producto: d.producto
            })));
        }
    }, [venta]);

    // Generar número automático para nuevas ventas
    useEffect(() => {
        if (!isEditing && !data.numero) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const numeroGenerado = `V${year}${month}${random}`;
            setData(prevData => ({ ...prevData, numero: numeroGenerado }));
        }
    }, [isEditing, data.numero, setData]);

    // Filtrar productos
    useEffect(() => {
        if (productSearch.trim()) {
            const filtered = productosSeguro.filter(p =>
                p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.codigo?.toLowerCase().includes(productSearch.toLowerCase())
            );
            setAvailableProducts(filtered);
        } else {
            setAvailableProducts(productosSeguro);
        }
    }, [productSearch, productosSeguro]);

    const addProductToDetail = (producto: Producto) => {
        // Verificar si el producto ya está en los detalles
        const existingDetail = detallesWithProducts.find(d => d.producto_id === producto.id);

        if (existingDetail) {
            toast.error('El producto ya está agregado a la venta');
            return;
        }

        const newDetail: DetalleVentaConProducto = {
            producto_id: producto.id,
            cantidad: 1,
            precio_unitario: producto.precio_venta || 0,
            descuento: 0,
            subtotal: producto.precio_venta || 0,
            producto: producto
        };

        const newDetalles = [...detallesWithProducts, newDetail];
        setDetallesWithProducts(newDetalles);

        // Actualizar data form
        setData('detalles', newDetalles.map(d => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
            subtotal: d.subtotal
        })));

        setProductSearch('');
        calculateTotals(newDetalles);
    };

    const updateDetail = (index: number, field: keyof DetalleVentaFormData, value: number) => {
        const updatedDetalles = [...detallesWithProducts];
        updatedDetalles[index] = { ...updatedDetalles[index], [field]: value };

        // Recalcular subtotal del detalle
        if (field === 'cantidad' || field === 'precio_unitario' || field === 'descuento') {
            const cantidad = field === 'cantidad' ? value : updatedDetalles[index].cantidad;
            const precio = field === 'precio_unitario' ? value : updatedDetalles[index].precio_unitario;
            const descuento = field === 'descuento' ? value : updatedDetalles[index].descuento;

            updatedDetalles[index].subtotal = (cantidad * precio) - descuento;
        }

        setDetallesWithProducts(updatedDetalles);

        // Actualizar data form
        setData('detalles', updatedDetalles.map(d => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
            subtotal: d.subtotal
        })));

        calculateTotals(updatedDetalles);
    };

    const removeDetail = (index: number) => {
        const updatedDetalles = detallesWithProducts.filter((_, i) => i !== index);
        setDetallesWithProducts(updatedDetalles);

        // Actualizar data form
        setData('detalles', updatedDetalles.map(d => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
            subtotal: d.subtotal
        })));

        calculateTotals(updatedDetalles);
    };

    const calculateTotals = (detalles: DetalleVentaConProducto[]) => {
        const subtotal = detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
        const descuentoGeneral = data.descuento || 0;
        const impuesto = data.impuesto || 0;
        const total = subtotal - descuentoGeneral + impuesto;

        setData(prev => ({
            ...prev,
            subtotal: subtotal,
            total: total
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar usando el servicio
        const validationErrors = await ventasService.validateData(data);
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            return;
        }

        // Mostrar modal de vista previa
        setShowPreviewModal(true);
    };

    const handleConfirmSubmit = () => {
        setShowPreviewModal(false);

        const submitData = {
            ...data,
            detalles: data.detalles.map(d => ({
                id: d.id,
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                descuento: d.descuento,
                subtotal: d.subtotal
            }))
        };

        if (isEditing && venta) {
            ventasService.update(venta.id, submitData, {
                onSuccess: () => {
                    toast.success('Venta actualizada exitosamente');
                }
            });
        } else {
            ventasService.store(submitData, {
                onSuccess: () => {
                    toast.success('Venta creada exitosamente');
                }
            });
        }
    };

    // Obtener entidades relacionadas para el modal
    const selectedCliente = clientesSeguro.find(c => c.id === data.cliente_id);
    const selectedMoneda = monedasSeguro.find(m => m.id === data.moneda_id);
    const selectedEstado = estadosSeguro.find(e => e.id === data.estado_documento_id);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Ventas', href: '/ventas' },
            { title: isEditing ? 'Editar venta' : 'Nueva venta', href: '#' }
        ]}>
            <Head title={isEditing ? 'Editar venta' : 'Nueva venta'} />

            <div className="flex items-center justify-between mb-6 p-4">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Editar venta' : 'Nueva venta'}
                </h1>
                <Link
                    href="/ventas"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                    Volver a ventas
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-4">
                {/* Información básica */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Información básica
                    </h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Número de venta *
                            </label>
                            <input
                                type="text"
                                value={data.numero}
                                onChange={(e) => setData('numero', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                placeholder="Ej: V20240001"
                            />
                            {errors.numero && <p className="mt-1 text-sm text-red-600">{errors.numero}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={data.fecha}
                                onChange={(e) => setData('fecha', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            />
                            {errors.fecha && <p className="mt-1 text-sm text-red-600">{errors.fecha}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cliente *
                            </label>
                            <select
                                value={data.cliente_id}
                                onChange={(e) => setData('cliente_id', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value={0}>Seleccionar cliente</option>
                                {clientesSeguro.map((cliente) => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.nombre} {cliente.nit ? `(${cliente.nit})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.cliente_id && <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Moneda *
                            </label>
                            <select
                                value={data.moneda_id}
                                onChange={(e) => setData('moneda_id', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            >
                                {monedasSeguro.map((moneda) => (
                                    <option key={moneda.id} value={moneda.id}>
                                        {moneda.nombre} ({moneda.codigo})
                                    </option>
                                ))}
                            </select>
                            {errors.moneda_id && <p className="mt-1 text-sm text-red-600">{errors.moneda_id}</p>}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Observaciones
                        </label>
                        <textarea
                            value={data.observaciones}
                            onChange={(e) => setData('observaciones', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            placeholder="Observaciones adicionales..."
                        />
                    </div>
                </div>

                {/* Productos */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Productos
                    </h2>

                    {/* Buscador de productos */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Buscar productos
                        </label>
                        <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            placeholder="Buscar por nombre o código..."
                        />

                        {productSearch && (
                            <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-zinc-600 rounded-md">
                                {availableProducts.slice(0, 10).map((producto) => (
                                    <button
                                        key={producto.id}
                                        type="button"
                                        onClick={() => addProductToDetail(producto)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 last:border-b-0"
                                    >
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {producto.nombre}
                                        </div>
                                        {producto.codigo && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Código: {producto.codigo} | Precio: {formatCurrency(producto.precio_venta || 0)}
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {availableProducts.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        No se encontraron productos
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lista de productos agregados */}
                    {detallesWithProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                                <thead className="bg-gray-50 dark:bg-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Precio Unit.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Descuento
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                                    {detallesWithProducts.map((detalle, index) => (
                                        <tr key={detalle.producto_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {detalle.producto?.nombre}
                                                </div>
                                                {detalle.producto?.codigo && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {detalle.producto.codigo}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={detalle.cantidad}
                                                    onChange={(e) => updateDetail(index, 'cantidad', Number(e.target.value))}
                                                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={detalle.precio_unitario}
                                                    onChange={(e) => updateDetail(index, 'precio_unitario', Number(e.target.value))}
                                                    className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={detalle.descuento}
                                                    onChange={(e) => updateDetail(index, 'descuento', Number(e.target.value))}
                                                    className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(detalle.subtotal)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => removeDetail(index)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                No hay productos agregados
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Busca y agrega productos a la venta.
                            </p>
                        </div>
                    )}
                </div>

                {/* Totales */}
                {detallesWithProducts.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Totales
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descuento general
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.descuento}
                                    onChange={(e) => {
                                        const descuento = Number(e.target.value);
                                        setData('descuento', descuento);
                                        setData('total', data.subtotal - descuento + data.impuesto);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Impuesto
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.impuesto}
                                    onChange={(e) => {
                                        const impuesto = Number(e.target.value);
                                        setData('impuesto', impuesto);
                                        setData('total', data.subtotal - data.descuento + impuesto);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Estado
                                </label>
                                <select
                                    value={data.estado_documento_id}
                                    onChange={(e) => setData('estado_documento_id', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                >
                                    {estadosSeguro.map((estado) => (
                                        <option key={estado.id} value={estado.id}>
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                            <div className="flex justify-between items-center text-lg font-medium">
                                <span className="text-gray-900 dark:text-white">Subtotal:</span>
                                <span className="text-gray-900 dark:text-white">{formatCurrency(data.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold mt-2">
                                <span className="text-gray-900 dark:text-white">Total:</span>
                                <span className="text-gray-900 dark:text-white">{formatCurrency(data.total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Acciones */}
                <div className="flex justify-end space-x-3">
                    <Link
                        href="/ventas"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || detallesWithProducts.length === 0}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {processing ? 'Guardando...' : (isEditing ? 'Actualizar venta' : 'Crear venta')}
                    </button>
                </div>
            </form>

            {/* Modal de Vista Previa */}
            <VentaPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                onConfirm={handleConfirmSubmit}
                data={data}
                detallesWithProducts={detallesWithProducts}
                cliente={selectedCliente}
                moneda={selectedMoneda}
                estadoDocumento={selectedEstado}
                processing={processing}
                isEditing={isEditing}
            />
        </AppLayout>
    );
}
