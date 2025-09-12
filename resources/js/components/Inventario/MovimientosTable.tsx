// Presentation Layer: MovimientosTable Component
// Componente de tabla para movimientos de inventario con filtros y paginación

import React from 'react';
import type { MovimientoInventario, MovimientoInventarioFilters } from '@/domain/movimientos-inventario';
import type { Pagination } from '@/domain/shared';
import { TIPOS_MOVIMIENTO } from '@/domain/movimientos-inventario';
import { Badge } from '@/components/ui/badge';
import { MovimientosInventarioService } from '@/services/movimientos-inventario.service';

interface MovimientosTableProps {
    movimientos: Pagination<MovimientoInventario>;
    filters: MovimientoInventarioFilters;
}

export const MovimientosTable: React.FC<MovimientosTableProps> = ({
    movimientos,
    filters
}) => {
    const columns = [
        {
            key: 'fecha',
            label: 'Fecha',
            sortable: true,
            render: (movimiento: MovimientoInventario) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                        {MovimientosInventarioService.formatFechaCorta(movimiento.created_at || '')}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {movimiento.created_at ? new Date(movimiento.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            key: 'tipo',
            label: 'Tipo',
            sortable: true,
            render: (movimiento: MovimientoInventario) => {
                const tipoInfo = TIPOS_MOVIMIENTO[movimiento.tipo];
                return (
                    <div title={tipoInfo.label}>
                        <Badge className={tipoInfo.color}>
                            <span className="mr-1">{tipoInfo.icon}</span>
                            <span className="hidden md:inline">{tipoInfo.label}</span>
                            <span className="md:hidden">{movimiento.tipo.split('_')[0]}</span>
                        </Badge>
                    </div>
                );
            }
        },
        {
            key: 'producto',
            label: 'Producto',
            sortable: true,
            render: (movimiento: MovimientoInventario) => (
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {movimiento.stockProducto?.producto?.nombre || 'N/A'}
                    </div>
                    {movimiento.stockProducto?.producto?.categoria && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {movimiento.stockProducto.producto.categoria.nombre}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'almacen',
            label: 'Almacén',
            sortable: true,
            render: (movimiento: MovimientoInventario) => (
                <div className="text-sm text-gray-900 dark:text-white">
                    {movimiento.stockProducto?.almacen?.nombre || 'N/A'}
                </div>
            )
        },
        {
            key: 'cantidad',
            label: 'Cantidad',
            sortable: true,
            className: 'text-right',
            render: (movimiento: MovimientoInventario) => {
                const esEntrada = movimiento.tipo.startsWith('ENTRADA') || movimiento.tipo === 'TRANSFERENCIA_ENTRADA';
                const colorClass = esEntrada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

                return (
                    <div className={`text-sm font-medium ${colorClass}`}>
                        {MovimientosInventarioService.formatCantidad(
                            esEntrada ? movimiento.cantidad : -movimiento.cantidad
                        )}
                    </div>
                );
            }
        },
        {
            key: 'stock_anterior',
            label: 'Stock Anterior',
            sortable: true,
            className: 'text-right',
            render: (movimiento: MovimientoInventario) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {movimiento.stock_anterior.toLocaleString('es-ES')}
                </div>
            )
        },
        {
            key: 'stock_nuevo',
            label: 'Stock Actual',
            sortable: true,
            className: 'text-right',
            render: (movimiento: MovimientoInventario) => (
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {movimiento.stock_nuevo.toLocaleString('es-ES')}
                </div>
            )
        },
        {
            key: 'documento',
            label: 'Documento',
            render: (movimiento: MovimientoInventario) => (
                <div className="text-sm">
                    {movimiento.numero_documento ? (
                        <div className="font-mono text-gray-900 dark:text-white">
                            {movimiento.numero_documento}
                        </div>
                    ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                </div>
            )
        },
        {
            key: 'usuario',
            label: 'Usuario',
            render: (movimiento: MovimientoInventario) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {movimiento.user?.name || 'Sistema'}
                </div>
            )
        }
    ];

    // Crear una tabla simplificada para movimientos (que son readonly)
    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${column.className || ''}`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {movimientos.data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center">
                                        <div className="text-gray-500 dark:text-gray-400">
                                            <div className="text-4xl mb-4">📦</div>
                                            <h3 className="text-lg font-medium">No hay movimientos</h3>
                                            <p className="text-sm">No se encontraron movimientos de inventario que coincidan con los filtros aplicados.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movimientos.data.map((movimiento) => (
                                    <tr key={movimiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        {columns.map((column) => (
                                            <td key={column.key} className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}>
                                                {column.render ? column.render(movimiento) : String(movimiento[column.key as keyof MovimientoInventario] || '-')}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {movimientos.current_page && movimientos.last_page && (
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrando {movimientos.from || 0} a {movimientos.to || 0} de{' '}
                        {movimientos.total} resultados
                    </div>

                    <div className="flex space-x-2">
                        {Array.from({ length: movimientos.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => {
                                    const service = new MovimientosInventarioService();
                                    service.searchMovimientos({ ...filters, page });
                                }}
                                className={`px-3 py-1 rounded text-sm ${page === movimientos.current_page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovimientosTable;
