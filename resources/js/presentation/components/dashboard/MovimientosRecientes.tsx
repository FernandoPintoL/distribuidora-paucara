/**
 * Componente: Movimientos Recientes
 *
 * Renderiza una tabla de los últimos movimientos de inventario
 */

import { Link } from '@inertiajs/react';
import type { MovimientoReciente } from '@/domain/entities/dashboard-inventario';

interface MovimientosRecientesProps {
    movimientos: MovimientoReciente[];
    canViewAll: boolean;
}

export default function MovimientosRecientes({
    movimientos,
    canViewAll,
}: MovimientosRecientesProps) {
    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Movimientos Recientes
                    </h3>
                    {canViewAll && (
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
                {movimientos.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">
                        No hay movimientos recientes.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {movimientos.map((movimiento) => (
                            <div
                                key={movimiento.id}
                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {movimiento.stockProducto?.producto?.nombre || 'Producto desconocido'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {movimiento.stockProducto?.almacen?.nombre || 'Almacén desconocido'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            movimiento.tipo === 'entrada'
                                                ? 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200'
                                                : movimiento.tipo === 'salida'
                                                    ? 'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200'
                                                    : 'text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
                                        }`}
                                    >
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
    );
}
