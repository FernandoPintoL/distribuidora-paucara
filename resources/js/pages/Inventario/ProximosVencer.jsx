import React, { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import ModalDescarteProducto from '@/Components/Inventario/ModalDescarteProducto';
import ModalCrearOferta from '@/Components/Inventario/ModalCrearOferta';

export default function ProximosVencer({ productos = [], categorias = [], almacenes = [] }) {
    const [filtros, setFiltros] = useState({
        busqueda: '',
        diasVencimiento: '',
        categoria: '',
        almacen: ''
    });

    const [mostrarModalDescarte, setMostrarModalDescarte] = useState(false);
    const [mostrarModalOferta, setMostrarModalOferta] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState(null);

    const productosFiltrados = useMemo(() => {
        let productosFiltered = productos;

        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            productosFiltered = productosFiltered.filter(item =>
                item.producto.nombre.toLowerCase().includes(busqueda) ||
                item.producto.codigo.toLowerCase().includes(busqueda) ||
                (item.lote && item.lote.toLowerCase().includes(busqueda))
            );
        }

        if (filtros.diasVencimiento) {
            productosFiltered = productosFiltered.filter(item =>
                item.dias_restantes <= parseInt(filtros.diasVencimiento)
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

        return productosFiltered.sort((a, b) => a.dias_restantes - b.dias_restantes);
    }, [productos, filtros]);

    const getDiasRestantesClass = (dias) => {
        if (dias <= 0) return 'text-red-600';
        if (dias <= 7) return 'text-red-500';
        if (dias <= 15) return 'text-orange-500';
        if (dias <= 30) return 'text-yellow-600';
        return 'text-gray-900';
    };

    const getVencimientoStatusClass = (dias) => {
        if (dias <= 0) return 'bg-red-100 text-red-800';
        if (dias <= 7) return 'bg-red-100 text-red-800';
        if (dias <= 15) return 'bg-orange-100 text-orange-800';
        if (dias <= 30) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getVencimientoStatus = (dias) => {
        if (dias <= 0) return 'Vencido';
        if (dias <= 7) return 'Crítico';
        if (dias <= 15) return 'Urgente';
        if (dias <= 30) return 'Próximo';
        return 'Normal';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const abrirModalDescarte = (item) => {
        setItemSeleccionado(item);
        setMostrarModalDescarte(true);
    };

    const cerrarModalDescarte = () => {
        setMostrarModalDescarte(false);
        setItemSeleccionado(null);
    };

    const abrirModalOferta = (item) => {
        setItemSeleccionado(item);
        setMostrarModalOferta(true);
    };

    const cerrarModalOferta = () => {
        setMostrarModalOferta(false);
        setItemSeleccionado(null);
    };

    const procesarDescarte = (datos) => {
        router.post(route('inventario.ajuste.procesar'), {
            ...datos,
            tipo: 'salida_merma'
        }, {
            onSuccess: () => {
                cerrarModalDescarte();
                router.reload({ only: ['productos'] });
            }
        });
    };

    const procesarOferta = (datos) => {
        // Implementar lógica para crear oferta especial
        console.log('Crear oferta:', datos);
        cerrarModalOferta();
    };

    return (
        <AppLayout title="Productos Próximos a Vencer">
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Productos Próximos a Vencer
                            </h2>
                            <p className="text-gray-600">
                                Gestión de productos con fechas de vencimiento próximas
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Buscar producto
                                    </label>
                                    <input
                                        type="text"
                                        value={filtros.busqueda}
                                        onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                        placeholder="Nombre, código o lote..."
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Días hasta vencer
                                    </label>
                                    <select
                                        value={filtros.diasVencimiento}
                                        onChange={(e) => handleFiltroChange('diasVencimiento', e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Todos</option>
                                        <option value="7">7 días o menos</option>
                                        <option value="15">15 días o menos</option>
                                        <option value="30">30 días o menos</option>
                                        <option value="60">60 días o menos</option>
                                    </select>
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

                    {/* Lista de productos próximos a vencer */}
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="px-6 py-4 bg-orange-50 border-b">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-lg font-medium text-orange-800">
                                    {productosFiltrados.length} productos próximos a vencer
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
                                                    Lote
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Almacén
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cantidad
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Fecha Vencimiento
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Días Restantes
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
                                            {productosFiltrados.map((item, index) => (
                                                <tr key={`${item.producto.id}-${item.lote}-${item.almacen.id}-${index}`}>
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
                                                        {item.lote || 'Sin lote'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.almacen.nombre}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.cantidad_actual}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(item.fecha_vencimiento)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getDiasRestantesClass(item.dias_restantes)}`}>
                                                        {item.dias_restantes} días
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVencimientoStatusClass(item.dias_restantes)}`}
                                                        >
                                                            {getVencimientoStatus(item.dias_restantes)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => abrirModalDescarte(item)}
                                                                disabled={item.cantidad_actual === 0}
                                                                className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                            >
                                                                Descartar
                                                            </button>
                                                            <button
                                                                onClick={() => abrirModalOferta(item)}
                                                                disabled={item.cantidad_actual === 0}
                                                                className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                            >
                                                                Crear Oferta
                                                            </button>
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
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos próximos a vencer</h3>
                                    <p className="mt-1 text-sm text-gray-500">Todos los productos tienen fechas de vencimiento lejanas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para descarte de productos */}
            <ModalDescarteProducto
                show={mostrarModalDescarte}
                item={itemSeleccionado}
                onClose={cerrarModalDescarte}
                onDescartar={procesarDescarte}
            />

            {/* Modal para crear oferta */}
            <ModalCrearOferta
                show={mostrarModalOferta}
                item={itemSeleccionado}
                onClose={cerrarModalOferta}
                onCrear={procesarOferta}
            />
        </AppLayout>
    );
}
