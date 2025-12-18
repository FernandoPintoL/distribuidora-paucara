/**
 * Componente: Stock por Almacén y Productos Más Movidos
 *
 * Renderiza dos paneles lado a lado con información de stock
 * y productos con mayor movimiento
 */

import type { StockPorAlmacen, ProductoMasMovido } from '@/domain/entities/dashboard-inventario';

interface StockYProductosProps {
    stockPorAlmacen: StockPorAlmacen[];
    productosMasMovidos: ProductoMasMovido[];
}

export default function StockYProductos({
    stockPorAlmacen,
    productosMasMovidos,
}: StockYProductosProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock por Almacén */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Stock por Almacén
                    </h3>
                    {stockPorAlmacen.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No hay información de stock disponible.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {stockPorAlmacen.map((almacen, index) => (
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

            {/* Productos Más Movidos */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Productos Más Movidos
                    </h3>
                    {productosMasMovidos.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No hay movimientos registrados.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {productosMasMovidos.map((producto, index) => (
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
    );
}
