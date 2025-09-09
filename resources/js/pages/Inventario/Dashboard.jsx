import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';

export default function Dashboard({ resumen, ultimosMovimientos }) {
    const getTipoMovimientoClass = (tipo) => {
        const classes = {
            'entrada_compra': 'bg-green-100 text-green-800',
            'entrada_ajuste': 'bg-blue-100 text-blue-800',
            'entrada_devolucion': 'bg-indigo-100 text-indigo-800',
            'salida_venta': 'bg-red-100 text-red-800',
            'salida_ajuste': 'bg-orange-100 text-orange-800',
            'salida_merma': 'bg-gray-100 text-gray-800',
        };
        return classes[tipo] || 'bg-gray-100 text-gray-800';
    };

    const formatTipoMovimiento = (tipo) => {
        const tipos = {
            'entrada_compra': 'Entrada Compra',
            'entrada_ajuste': 'Entrada Ajuste',
            'entrada_devolucion': 'Devolución',
            'salida_venta': 'Salida Venta',
            'salida_ajuste': 'Salida Ajuste',
            'salida_merma': 'Merma',
        };
        return tipos[tipo] || tipo;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout title="Dashboard de Inventario">
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Dashboard de Inventario
                        </h2>
                        <p className="text-gray-600">
                            Gestión y control de inventario en tiempo real
                        </p>
                    </div>

                    {/* Tarjetas de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {/* Total de productos */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white">
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Productos</p>
                                        <p className="text-2xl font-semibold text-gray-900">{resumen?.totalProductos || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stock bajo */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-yellow-500 text-white">
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                                        <p className="text-2xl font-semibold text-yellow-600">{resumen?.stockBajo || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Próximos a vencer */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-orange-500 text-white">
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Por Vencer (30 días)</p>
                                        <p className="text-2xl font-semibold text-orange-600">{resumen?.proximosVencer || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Productos vencidos */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-red-500 text-white">
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Vencidos</p>
                                        <p className="text-2xl font-semibold text-red-600">{resumen?.vencidos || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enlaces rápidos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Link
                            href={route('inventario.stock-bajo')}
                            className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200"
                        >
                            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
                                Productos con Stock Bajo
                            </h5>
                            <p className="font-normal text-gray-700">
                                Ver todos los productos que requieren reposición
                            </p>
                        </Link>

                        <Link
                            href={route('inventario.proximos-vencer')}
                            className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200"
                        >
                            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
                                Próximos a Vencer
                            </h5>
                            <p className="font-normal text-gray-700">
                                Gestionar productos próximos a vencer
                            </p>
                        </Link>

                        <Link
                            href={route('inventario.ajuste.form')}
                            className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200"
                        >
                            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
                                Ajustes de Inventario
                            </h5>
                            <p className="font-normal text-gray-700">
                                Realizar ajustes manuales de stock
                            </p>
                        </Link>
                    </div>

                    {/* Últimos movimientos */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="px-6 py-4 bg-gray-50 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Últimos Movimientos de Inventario
                                </h3>
                                <Link
                                    href={route('inventario.movimientos')}
                                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                                >
                                    Ver todos
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Producto
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cantidad
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Usuario
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {ultimosMovimientos && ultimosMovimientos.map((movimiento) => (
                                            <tr key={movimiento.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {movimiento.producto?.nombre || 'Producto eliminado'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoMovimientoClass(movimiento.tipo)}`}
                                                    >
                                                        {formatTipoMovimiento(movimiento.tipo)}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${movimiento.cantidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {movimiento.cantidad >= 0 ? '+' : ''}{movimiento.cantidad}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(movimiento.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {movimiento.usuario?.name || 'Sistema'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {(!ultimosMovimientos || ultimosMovimientos.length === 0) && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No hay movimientos recientes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
