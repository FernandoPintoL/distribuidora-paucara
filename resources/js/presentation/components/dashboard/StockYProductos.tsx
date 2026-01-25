/**
 * Componente: Stock por Almacén y Productos Más Movidos
 *
 * Renderiza tabla de stock_productos y productos con mayor movimiento
 */

import { useState, useMemo } from 'react';
import type { StockPorAlmacen, ProductoMasMovido } from '@/domain/entities/dashboard-inventario';
import FiltrosStock, { type FiltrosState, RANGOS_STOCK } from './FiltrosStock';
import { ImprimirStockButton } from '../impresion/ImprimirStockButton';

interface StockYProductosProps {
    stockPorAlmacen: StockPorAlmacen[];
    productosMasMovidos: ProductoMasMovido[];
}

export default function StockYProductos({
    stockPorAlmacen,
    productosMasMovidos,
}: StockYProductosProps) {
    const [filtros, setFiltros] = useState<FiltrosState>({
        busqueda: '',
        almacenId: '',
        rangoStock: 'todos',
        ordenamiento: 'cantidad-desc',
    });

    // Obtener lista única de almacenes
    const almacenes = useMemo(() => {
        const almacenesMap = new Map();
        stockPorAlmacen.forEach((stock) => {
            if (!almacenesMap.has(stock.almacen_id)) {
                almacenesMap.set(stock.almacen_id, {
                    id: stock.almacen_id,
                    nombre: stock.almacen_nombre,
                });
            }
        });
        return Array.from(almacenesMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [stockPorAlmacen]);

    // Aplicar filtros y ordenamiento
    const stockFiltrado = useMemo(() => {
        let resultado = [...stockPorAlmacen];

        // Filtro por búsqueda
        if (filtros.busqueda) {
            const busquedaLower = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(
                (stock) =>
                    stock.producto_nombre.toLowerCase().includes(busquedaLower) ||
                    stock.producto_codigo.toLowerCase().includes(busquedaLower) ||
                    stock.producto_sku.toLowerCase().includes(busquedaLower)
            );
        }

        // Filtro por almacén
        if (filtros.almacenId) {
            resultado = resultado.filter((stock) => stock.almacen_id === parseInt(filtros.almacenId));
        }

        // Filtro por rango de cantidad
        if (filtros.rangoStock !== 'todos') {
            const rango = RANGOS_STOCK[filtros.rangoStock as keyof typeof RANGOS_STOCK];
            resultado = resultado.filter(
                (stock) => stock.cantidad >= rango.min && stock.cantidad < rango.max
            );
        }

        // Ordenamiento
        switch (filtros.ordenamiento) {
            case 'cantidad-asc':
                resultado.sort((a, b) => a.cantidad - b.cantidad);
                break;
            case 'cantidad-desc':
                resultado.sort((a, b) => b.cantidad - a.cantidad);
                break;
            case 'producto':
                resultado.sort((a, b) => a.producto_nombre.localeCompare(b.producto_nombre));
                break;
            case 'almacen':
                resultado.sort((a, b) => a.almacen_nombre.localeCompare(b.almacen_nombre));
                break;
        }

        return resultado;
    }, [stockPorAlmacen, filtros]);

    return (
        <div className="flex flex-col gap-6">
            {/* Filtros */}
            <FiltrosStock almacenes={almacenes} onFiltrosChange={setFiltros} />

            {/* Tabla de Stock por Producto y Almacén */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Stock de Productos por Almacén
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Inventario detallado de stock_productos
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {stockFiltrado.length} de {stockPorAlmacen.length} registros
                            </p>
                            <ImprimirStockButton
                                stock={stockFiltrado}
                                almacenFiltro={
                                    filtros.almacenId
                                        ? almacenes.find((a) => a.id === parseInt(filtros.almacenId))?.nombre
                                        : undefined
                                }
                                busquedaFiltro={filtros.busqueda || undefined}
                            />
                        </div>
                    </div>
                </div>
                {stockPorAlmacen.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No hay información de stock disponible
                        </p>
                    </div>
                ) : stockFiltrado.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No hay registros que coincidan con los filtros seleccionados
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Almacén
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Cantidad
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {stockFiltrado.map((stock) => (
                                    <tr
                                        key={stock.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {stock.producto_nombre}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {stock.producto_codigo_barra}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {stock.producto_sku}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                {stock.almacen_nombre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {parseFloat(String(stock.cantidad || 0)).toFixed(2)} unidades
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Productos Más Movidos */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Productos Más Movidos (Este Mes)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Top 10 productos con mayor cantidad de movimientos
                    </p>
                </div>
                {productosMasMovidos.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No hay movimientos registrados
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Total Movimientos
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {productosMasMovidos.map((producto, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {producto.nombre_producto}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                {producto.total_movimientos}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
