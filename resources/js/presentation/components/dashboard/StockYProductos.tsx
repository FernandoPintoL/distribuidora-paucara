/**
 * Componente: Stock por Almacén y Productos Más Movidos
 * Mejorado con soporte para productos fraccionados
 *
 * Renderiza tabla de stock_productos y productos con mayor movimiento
 * Con visualización expandible de conversiones para productos fraccionados
 */

import { useState, useMemo } from 'react';
import React from 'react';
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

    // Estado para filas expandidas (mostrar conversiones)
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
                    stock.producto_sku.toLowerCase().includes(busquedaLower) ||
                    stock.producto_codigo_barra.toLowerCase().includes(busquedaLower)
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
                (stock) => stock.cantidad >= rango.min && stock.cantidad <= rango.max
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

    // Toggle para expandir/colapsar filas
    const toggleRow = (stockId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(stockId)) {
            newExpanded.delete(stockId);
        } else {
            newExpanded.add(stockId);
        }
        setExpandedRows(newExpanded);
    };

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
                                Inventario detallado con soporte para productos fraccionados
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                                        {/* Columna para expandir */}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Unidad
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Almacén
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Stock Total
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Disponible
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Reservado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Valor Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {stockFiltrado.map((stock) => {
                                    const cantidadTotal = parseFloat(String(stock.cantidad || 0));
                                    const cantidadDisponible = parseFloat(String(stock.cantidad_disponible || 0));
                                    const cantidadReservada = parseFloat(String(stock.cantidad_reservada || 0));
                                    const precioVenta = parseFloat(String(stock.precio_venta || 0));
                                    const valorTotal = cantidadTotal * precioVenta;
                                    const isExpanded = expandedRows.has(stock.id);
                                    const hasFractionedInfo = stock.es_fraccionado && stock.conversiones && stock.conversiones.length > 0;

                                    return (
                                        <React.Fragment key={stock.id}>
                                            {/* Fila principal */}
                                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {hasFractionedInfo && (
                                                        <button
                                                            onClick={() => toggleRow(stock.id)}
                                                            className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition text-gray-600 dark:text-gray-400"
                                                            title={isExpanded ? 'Colapsar' : 'Expandir conversiones'}
                                                        >
                                                            <svg
                                                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''
                                                                    }`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 5l7 7-7 7"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {stock.producto_nombre}
                                                                <br />
                                                                {stock.es_fraccionado && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                                                        Fraccionado
                                                                    </span>
                                                                )}
                                                            </p>

                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {stock.producto_codigo_barra && (
                                                                <>Código: {stock.producto_codigo_barra}</>
                                                            )}
                                                        </p>
                                                        {stock.producto_sku && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                SKU: {stock.producto_sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                        {stock.unidad_medida_nombre}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                        {stock.almacen_nombre}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {cantidadTotal.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        {cantidadDisponible.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                        {cantidadReservada.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                        Bs{valorTotal.toFixed(2)}
                                                    </span>
                                                </td>
                                            </tr>

                                            {/* Fila expandible: conversiones de unidades */}
                                            {hasFractionedInfo && isExpanded && (
                                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                                    <td colSpan={8} className="px-6 py-4">
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                                                Conversiones de Unidades
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {/* Unidad base */}
                                                                <div className="p-3 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                                                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                                                                        Unidad Base ({stock.unidad_medida_nombre})
                                                                    </p>
                                                                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                                                        {cantidadTotal.toFixed(2)}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                        Disponible: {cantidadDisponible.toFixed(2)}
                                                                    </p>
                                                                </div>

                                                                {/* Conversiones */}
                                                                {stock.conversiones?.map((conv) => (
                                                                    <div
                                                                        key={conv.id}
                                                                        className="p-3 rounded-lg border-2 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
                                                                    >
                                                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                                                                            {conv.unidad_destino_nombre}
                                                                            <span className="text-orange-600 dark:text-orange-400 ml-1">
                                                                                (÷ {conv.factor_conversion})
                                                                            </span>
                                                                        </p>
                                                                        <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                                                                            {conv.cantidad_en_conversion.toFixed(2)}
                                                                        </p>
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                            Disponible:{' '}
                                                                            {(cantidadDisponible * conv.factor_conversion).toFixed(2)}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
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
