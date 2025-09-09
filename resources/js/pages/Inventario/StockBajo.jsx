import React, { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import ModalAjusteStock from '@/Components/Inventario/ModalAjusteStock';

export default function StockBajo({ productos = [], categorias = [], almacenes = [] }) {
    const [filtros, setFiltros] = useState({
        busqueda: '',
        categoria: '',
        almacen: ''
    });

    const [mostrarModalAjuste, setMostrarModalAjuste] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState(null);

    const productosFiltrados = useMemo(() => {
        let productosFiltered = productos;

        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            productosFiltered = productosFiltered.filter(item =>
                item.producto.nombre.toLowerCase().includes(busqueda) ||
                item.producto.codigo.toLowerCase().includes(busqueda)
            );
        }

        if (filtros.categoria) {
            productosFiltered = productosFiltered.filter(item =>
                item.producto.categoria_id == filtros.categoria
            );
        }

        if (filtros.almacen) {
            productosFiltered = productosFiltered.filter(item =>
                item.almacen_id == filtros.almacen
            );
        }

        return productosFiltered;
    }, [productos, filtros]);

    const getStockStatusClass = (item) => {
        const porcentaje = (item.cantidad_actual / item.stock_minimo) * 100;
        if (porcentaje <= 25) return 'bg-red-100 text-red-800';
        if (porcentaje <= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-orange-100 text-orange-800';
    };

    const getStockStatus = (item) => {
        if (item.cantidad_actual === 0) return 'Sin Stock';
        const porcentaje = (item.cantidad_actual / item.stock_minimo) * 100;
        if (porcentaje <= 25) return 'Crítico';
        if (porcentaje <= 50) return 'Muy Bajo';
        return 'Bajo';
    };

    const abrirModalAjuste = (item) => {
        setItemSeleccionado(item);
        setMostrarModalAjuste(true);
    };

    const cerrarModalAjuste = () => {
        setMostrarModalAjuste(false);
        setItemSeleccionado(null);
    };

    const procesarAjuste = (datos) => {
        router.post(route('inventario.ajuste.procesar'), datos, {
            onSuccess: () => {
                cerrarModalAjuste();
                router.reload({ only: ['productos'] });
            }
        });
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    return (
        <AppLayout title="Stock Bajo - Inventario">
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Productos con Stock Bajo
                            </h2>
                            <p className="text-gray-600">
                                Gestión de productos que requieren reposición
                            </p>
                        </div>
                        <Link
                            href={route('inventario.dashboard')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Dashboard
                        </Link>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Buscar producto
                                    </label>
                                    <input
                                        type="text"
                                        value={filtros.busqueda}
                                        onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                        placeholder="Nombre o código del producto..."
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Categoría
                                    </label>
                                    <select
                                        value={filtros.categoria}
                                        onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Todas las categorías</option>
                                        {categorias.map(categoria => (
                                            <option key={categoria.id} value={categoria.id}>
                                                {categoria.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Almacén
                                    </label>
                                    <select
                                        value={filtros.almacen}
                                        onChange={(e) => handleFiltroChange('almacen', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Todos los almacenes</option>
                                        {almacenes.map(almacen => (
                                            <option key={almacen.id} value={almacen.id}>
                                                {almacen.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de productos con stock bajo */}
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="px-6 py-4 bg-yellow-50 border-b">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <h3 className="text-lg font-medium text-yellow-800">
                                    {productosFiltrados.length} productos con stock bajo
                                </h3>
                            </div>
                        </div>

                        <div className="p-6">
                            {productosFiltrados.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Producto
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Almacén
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Stock Actual
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Stock Mínimo
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {productosFiltrados.map((item) => (
                                                <tr key={`${item.producto.id}-${item.almacen.id}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.producto.nombre}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Código: {item.producto.codigo}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.almacen.nombre}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                                        {item.cantidad_actual}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.stock_minimo}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusClass(item)}`}
                                                        >
                                                            {getStockStatus(item)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => abrirModalAjuste(item)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Ajustar Stock
                                                            </button>
                                                            <Link
                                                                href={route('compras.create', { producto: item.producto.id })}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                Crear Compra
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos con stock bajo</h3>
                                    <p className="mt-1 text-sm text-gray-500">Todos los productos tienen stock suficiente.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de ajuste de stock */}
            <ModalAjusteStock
                show={mostrarModalAjuste}
                item={itemSeleccionado}
                onClose={cerrarModalAjuste}
                onAjustar={procesarAjuste}
            />
        </AppLayout>
    );
}
