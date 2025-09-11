import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/hooks/use-auth';

interface MovimientoInventario {
    id: number;
    tipo: 'entrada' | 'salida' | 'ajuste' | 'transferencia';
    motivo: string;
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
    fecha: string;
    usuario: {
        name: string;
    };
    producto: {
        nombre: string;
        categoria: {
            nombre: string;
        };
    };
    almacen: {
        nombre: string;
    };
    referencia?: string;
    observaciones?: string;
}

interface PageProps extends InertiaPageProps {
    movimientos: MovimientoInventario[];
    filtros?: {
        tipo?: string;
        almacen?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
    };
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Movimientos',
        href: '/inventario/movimientos',
    },
];

export default function MovimientosInventario() {
    const { props } = usePage<PageProps>();
    const { movimientos: movimientosRaw, filtros = {} } = props;
    const movimientos = Array.isArray(movimientosRaw) ? movimientosRaw : [];
    const { can } = useAuth();
    const [filtroTipo, setFiltroTipo] = useState(filtros.tipo || '');
    const [filtroFecha, setFiltroFecha] = useState(filtros.fecha_inicio || '');

    if (!can('inventario.movimientos')) {
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

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const obtenerEstiloTipo = (tipo: string) => {
        const estilos = {
            entrada: {
                color: 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200',
                texto: 'Entrada',
                icono: '↗'
            },
            salida: {
                color: 'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200',
                texto: 'Salida',
                icono: '↘'
            },
            ajuste: {
                color: 'text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
                texto: 'Ajuste',
                icono: '⚖'
            },
            transferencia: {
                color: 'text-purple-800 bg-purple-100 dark:bg-purple-900 dark:text-purple-200',
                texto: 'Transferencia',
                icono: '⇄'
            }
        };
        return estilos[tipo as keyof typeof estilos] || estilos.ajuste;
    };

    const movimientosFiltrados = movimientos.filter(movimiento => {
        if (filtroTipo && movimiento.tipo !== filtroTipo) return false;
        if (filtroFecha && !movimiento.fecha.startsWith(filtroFecha)) return false;
        return true;
    });

    const estadisticas = {
        total: movimientosFiltrados.length,
        entradas: movimientosFiltrados.filter(m => m.tipo === 'entrada').length,
        salidas: movimientosFiltrados.filter(m => m.tipo === 'salida').length,
        ajustes: movimientosFiltrados.filter(m => m.tipo === 'ajuste').length,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Movimientos de Inventario" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Movimientos de Inventario
                        </h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Historial completo de movimientos de stock
                        </p>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Movimientos</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                    {estadisticas.total}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entradas</p>
                                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                                    {estadisticas.entradas}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Salidas</p>
                                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                                    {estadisticas.salidas}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ajustes</p>
                                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                    {estadisticas.ajustes}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de Movimiento
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="entrada">Entradas</option>
                                <option value="salida">Salidas</option>
                                <option value="ajuste">Ajustes</option>
                                <option value="transferencia">Transferencias</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={filtroFecha}
                                onChange={(e) => setFiltroFecha(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFiltroTipo('');
                                    setFiltroFecha('');
                                }}
                                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla de movimientos */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                    {movimientosFiltrados.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Sin movimientos
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                No se encontraron movimientos con los filtros aplicados.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Almacén
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Stock Anterior
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Stock Nuevo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Motivo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {movimientosFiltrados.map((movimiento) => {
                                        const tipoEstilo = obtenerEstiloTipo(movimiento.tipo);

                                        return (
                                            <tr key={movimiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                                        {formatearFecha(movimiento.fecha)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {movimiento.producto.nombre}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {movimiento.producto.categoria.nombre}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {movimiento.almacen.nombre}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${tipoEstilo.color}`}>
                                                        <span className="mr-1">{tipoEstilo.icono}</span>
                                                        {tipoEstilo.texto}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm font-semibold ${movimiento.tipo === 'entrada'
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : movimiento.tipo === 'salida'
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-blue-600 dark:text-blue-400'
                                                        }`}>
                                                        {movimiento.tipo === 'entrada' ? '+' : movimiento.tipo === 'salida' ? '-' : '±'}
                                                        {Math.abs(movimiento.cantidad)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {movimiento.stock_anterior}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        {movimiento.stock_nuevo}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {movimiento.usuario.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                                        {movimiento.motivo}
                                                    </div>
                                                    {movimiento.referencia && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Ref: {movimiento.referencia}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}