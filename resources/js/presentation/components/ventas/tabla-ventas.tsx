import React from 'react';
import { Link } from '@inertiajs/react';
import { Eye, Edit, Trash2, MoreHorizontal, FileText, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Venta, FiltrosVentas } from '@/domain/entities/ventas';
import type { Pagination } from '@/domain/entities/shared';
import ventasService from '@/infrastructure/services/ventas.service';

interface TablaVentasProps {
    ventas: Pagination<Venta>;
    filtros?: FiltrosVentas;
    onVentaDeleted?: (ventaId: number | string) => void;
}

export default function TablaVentas({ ventas, filtros, onVentaDeleted }: TablaVentasProps) {
    const handleDelete = (venta: Venta) => {
        ventasService.destroy(venta.id, {
            onSuccess: () => {
                if (onVentaDeleted) {
                    onVentaDeleted(venta.id);
                }
            }
        });
    };

    const handleSort = (field: string) => {
        const currentSortDir = filtros?.sort_by === field && filtros?.sort_dir === 'asc' ? 'desc' : 'asc';
        ventasService.sort(field, currentSortDir);
    };

    const getSortIcon = (field: string) => {
        if (filtros?.sort_by !== field) {
            return '↕️';
        }
        return filtros?.sort_dir === 'asc' ? '↑' : '↓';
    };

    const getEstadoColor = (estado: string) => {
        switch (estado.toLowerCase()) {
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'completada':
            case 'pagada':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'cancelada':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'facturada':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    if (!ventas.data || ventas.data.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <div className="p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No hay ventas
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                        {Object.keys(filtros || {}).length > 0
                            ? 'No se encontraron ventas con los filtros aplicados.'
                            : 'Comienza creando tu primera venta.'
                        }
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/ventas/create"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Nueva venta
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
            {/* Header con información de paginación */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrando{' '}
                        <span className="font-medium">{ventas.from}</span>
                        {' '}-{' '}
                        <span className="font-medium">{ventas.to}</span>
                        {' '}de{' '}
                        <span className="font-medium">{ventas.total}</span>
                        {' '}ventas
                    </div>

                    <div className="flex items-center space-x-2">
                        <select
                            value={filtros?.per_page || 15}
                            onChange={(e) => ventasService.changePerPage(Number(e.target.value))}
                            className="text-sm border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                        >
                            <option value={10}>10 por página</option>
                            <option value={15}>15 por página</option>
                            <option value={25}>25 por página</option>
                            <option value={50}>50 por página</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('numero')}
                            >
                                Número {getSortIcon('numero')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('fecha')}
                            >
                                Fecha {getSortIcon('fecha')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('cliente_id')}
                            >
                                Cliente {getSortIcon('cliente_id')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('estado_documento_id')}
                            >
                                Estado {getSortIcon('estado_documento_id')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('total')}
                            >
                                Total {getSortIcon('total')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                                Usuario
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                        {ventas.data.map((venta) => (
                            <tr
                                key={venta.id}
                                className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {venta.numero}
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {formatDate(venta.fecha)}
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {venta.cliente?.nombre || 'Sin cliente'}
                                    </div>
                                    {venta.cliente?.nit && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            NIT: {venta.cliente.nit}
                                        </div>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(venta.estado_documento?.nombre || '')
                                        }`}>
                                        {venta.estado_documento?.nombre || 'Sin estado'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(venta.total, venta.moneda?.codigo)}
                                    </div>
                                    {venta.moneda && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {venta.moneda.codigo}
                                        </div>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {venta.usuario?.name || 'Usuario desconocido'}
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        {/* Ver */}
                                        <Link
                                            href={ventasService.showUrl(venta.id)}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            title="Ver venta"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>

                                        {/* Editar */}
                                        <Link
                                            href={ventasService.editUrl(venta.id)}
                                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                            title="Editar venta"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>

                                        {/* Eliminar */}
                                        <button
                                            onClick={() => handleDelete(venta)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Eliminar venta"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Menú más opciones */}
                                        <div className="relative group">
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>

                                            {/* Dropdown menu - se puede expandir más adelante */}
                                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-gray-200 dark:border-zinc-700 z-10 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => ventasService.duplicate(venta.id)}
                                                        className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 text-left transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4 inline mr-2" />
                                                        Duplicar
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`/ventas/${venta.id}/pdf`, '_blank')}
                                                        className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 text-left transition-colors"
                                                    >
                                                        <Download className="w-4 h-4 inline mr-2" />
                                                        Descargar PDF
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {ventas.last_page > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => ventasService.goToPage(ventas.current_page - 1)}
                                disabled={ventas.current_page <= 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>

                            <div className="flex items-center space-x-1">
                                {/* Renderizar números de página */}
                                {Array.from({ length: Math.min(5, ventas.last_page) }, (_, i) => {
                                    const pageNum = Math.max(1, Math.min(
                                        ventas.current_page - 2 + i,
                                        ventas.last_page - 4 + i
                                    ));

                                    if (pageNum > ventas.last_page) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => ventasService.goToPage(pageNum)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pageNum === ventas.current_page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => ventasService.goToPage(ventas.current_page + 1)}
                                disabled={ventas.current_page >= ventas.last_page}
                                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>

                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Página {ventas.current_page} de {ventas.last_page}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
