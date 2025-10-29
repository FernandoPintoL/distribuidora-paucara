import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/application/hooks/use-auth';

interface Estadisticas {
    total_productos: number;
    productos_stock_bajo: number;
    productos_proximos_vencer: number;
    productos_vencidos: number;
}

interface StockPorAlmacen {
    nombre: string;
    stock_total: number;
}

interface MovimientoReciente {
    id: number;
    tipo: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    fecha: string;
    stockProducto: {
        producto: {
            nombre: string;
        };
        almacen: {
            nombre: string;
        };
    };
    user?: {
        name: string;
    };
}

interface ProductoMasMovido {
    producto_id: number;
    nombre_producto: string;
    total_movimientos: number;
}

interface PageProps extends InertiaPageProps {
    estadisticas: Estadisticas;
    stock_por_almacen: StockPorAlmacen[];
    movimientos_recientes: MovimientoReciente[];
    productos_mas_movidos: ProductoMasMovido[];
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
];

export default function Dashboard() {
    const { props } = usePage<PageProps>();
    const {
        estadisticas,
        stock_por_almacen: stockPorAlmacenRaw,
        movimientos_recientes: movimientosRecientesRaw,
        productos_mas_movidos: productosMasMovidosRaw
    } = props;

    // Validar que los arrays sean efectivamente arrays
    const stock_por_almacen = Array.isArray(stockPorAlmacenRaw) ? stockPorAlmacenRaw : [];
    const movimientos_recientes = Array.isArray(movimientosRecientesRaw) ? movimientosRecientesRaw : [];
    const productos_mas_movidos = Array.isArray(productosMasMovidosRaw) ? productosMasMovidosRaw : [];

    const { can } = useAuth();

    if (!can('inventario.dashboard')) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Acceso Denegado" />
                <div className="text-center py-12">
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No tienes permisos para acceder a esta página
                    </h3>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard de Inventario" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Dashboard de Inventario
                        </h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Resumen general del estado de tu inventario
                        </p>
                    </div>
                </div>

                {/* Estadísticas Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Productos</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {estadisticas.total_productos}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Bajo</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {estadisticas.productos_stock_bajo}
                                </p>
                                {can('inventario.stock-bajo') && (
                                    <Link
                                        href="/inventario/stock-bajo"
                                        className="text-sm text-red-600 hover:text-red-500 dark:text-red-400"
                                    >
                                        Ver detalles →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Próximos a Vencer</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {estadisticas.productos_proximos_vencer}
                                </p>
                                {can('inventario.proximos-vencer') && (
                                    <Link
                                        href="/inventario/proximos-vencer"
                                        className="text-sm text-orange-600 hover:text-orange-500 dark:text-orange-400"
                                    >
                                        Ver detalles →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productos Vencidos</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {estadisticas.productos_vencidos}
                                </p>
                                {can('inventario.vencidos') && (
                                    <Link
                                        href="/inventario/vencidos"
                                        className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400"
                                    >
                                        Ver detalles →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock por almacén y Productos más movidos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                Stock por Almacén
                            </h3>
                            {stock_por_almacen.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No hay información de stock disponible.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {stock_por_almacen.map((almacen, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                                {almacen.nombre}
                                            </span>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {almacen.stock_total.toLocaleString()} unidades
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                Productos Más Movidos
                            </h3>
                            {productos_mas_movidos.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No hay movimientos registrados.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {productos_mas_movidos.slice(0, 5).map((producto, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                                                {producto.nombre_producto}
                                            </span>
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                {producto.total_movimientos}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Movimientos recientes */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Movimientos Recientes
                            </h3>
                            {can('inventario.movimientos') && (
                                <Link
                                    href="/inventario/movimientos"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                                >
                                    Ver todos →
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        {movimientos_recientes.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">
                                No hay movimientos recientes.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {movimientos_recientes
                                    .filter(m => m.stockProducto?.producto && m.stockProducto?.almacen)
                                    .slice(0, 5)
                                    .map((movimiento) => (
                                    <div key={movimiento.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {movimiento.stockProducto?.producto?.nombre || 'Producto desconocido'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {movimiento.stockProducto?.almacen?.nombre || 'Almacén desconocido'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${movimiento.tipo === 'entrada'
                                                ? 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200'
                                                : movimiento.tipo === 'salida'
                                                    ? 'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200'
                                                    : 'text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
                                                }`}>
                                                {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enlaces rápidos */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Enlaces Rápidos
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {can('inventario.stock-bajo') && (
                                <Link
                                    href="/inventario/stock-bajo"
                                    className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 text-red-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Stock Bajo</p>
                                    </div>
                                </Link>
                            )}
                            {can('inventario.movimientos') && (
                                <Link
                                    href="/inventario/movimientos"
                                    className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Movimientos</p>
                                    </div>
                                </Link>
                            )}
                            {can('inventario.ajuste.form') && (
                                <Link
                                    href="/inventario/ajuste"
                                    className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ajustar</p>
                                    </div>
                                </Link>
                            )}
                            {can('inventario.reportes') && (
                                <Link
                                    href="/inventario/reportes"
                                    className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Reportes</p>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
