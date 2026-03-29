import React, { useState } from 'react';
import { formatCurrencyWith2Decimals } from '@/lib/utils';
import BarcodeScannerModal from './BarcodeScannerModal';
import type { Producto } from '@/domain/entities/ventas';
import { useProductSearch } from '../hooks/useProductSearch';

interface ProductSearchBarProps {
    tipo: 'compra' | 'venta';
    almacen_id?: number;
    cliente_id?: number | null;
    readOnly?: boolean;
    es_farmacia?: boolean;
    onProductSelected: (producto: Producto) => void;
    onMedicamentoInfo: (producto: Producto) => void;
}

export default function ProductSearchBar({
    tipo,
    almacen_id,
    cliente_id,
    readOnly = false,
    es_farmacia = false,
    onProductSelected,
    onMedicamentoInfo
}: ProductSearchBarProps) {
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);

    const {
        productSearch,
        setProductSearch,
        productosDisponibles,
        isLoading,
        searchError,
        isFocused,
        setIsFocused,
        buscarProductos,
        handleScannerResult,
        handleAgregarProductoYLimpiar
    } = useProductSearch({
        tipo,
        almacen_id,
        cliente_id,
        readOnly,
        onAddProduct: onProductSelected
    });

    // ✅ Manejadores del modal escáner
    const openScannerModal = () => {
        setScannerError(null);
        setShowScannerModal(true);
    };

    const closeScannerModal = () => {
        setShowScannerModal(false);
        setScannerError(null);
    };

    const handleScannerError = (error: string) => {
        setScannerError(error);
        console.warn('Error del escáner:', error);
    };

    const handleScan = (result: string) => {
        handleScannerResult(result);
        closeScannerModal();
    };

    return (
        <>
            {/* Buscador de productos */}
            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 pb-3 mb-3">
                <div className="flex">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    buscarProductos();
                                }
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoComplete="off"
                            disabled={readOnly}
                            className={`w-full px-2 py-1 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${productSearch ? 'pt-3' : ''}`}
                            placeholder=""
                        />
                        <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${productSearch || isFocused
                            ? 'top-[-20px] text-xs font-medium text-blue-600 dark:text-blue-400'
                            : 'top-1/2 -translate-y-1/2 text-xs text-gray-600 dark:text-gray-400'
                            }`}>
                            Buscar productos
                        </label>
                    </div>
                    <button
                        type="button"
                        disabled={readOnly || isLoading}
                        onClick={() => buscarProductos()}
                        className="px-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Buscar producto"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        disabled={readOnly}
                        onClick={openScannerModal}
                        className="px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center sm:hidden"
                        title="Escanear código de barras"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 18h4.01M12 9h4.01M12 6h4.01M12 3h4.01" />
                        </svg>
                    </button>
                </div>

                {/* ✅ Mostrar resultados solo si hay búsqueda realizada */}
                {(productosDisponibles.length > 0 || searchError || (productSearch && !isLoading && productosDisponibles.length === 0)) && (
                    <div className="mt-1 max-h-[300px] overflow-y-auto border border-gray-200 dark:border-zinc-600 rounded-md">
                        {/* ✅ ESTADO: Cargando */}
                        {isLoading && (
                            <div className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 text-center">
                                🔍 Buscando...
                            </div>
                        )}

                        {/* ✅ ESTADO: Error */}
                        {searchError && !isLoading && (
                            <div className="px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 text-center">
                                ❌ {searchError}
                            </div>
                        )}

                        {/* ✅ ESTADO: Resultados encontrados */}
                        {!isLoading && productosDisponibles.length > 0 && (
                            <>
                                {/* ✅ ENCABEZADO: Contador de productos */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-3 border-b-2 border-green-200 dark:border-green-800">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm text-green-900 dark:text-green-200">
                                            ✨ {productosDisponibles.length} {productosDisponibles.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                                        </span>
                                        <span className="text-xs text-green-700 dark:text-green-300">Haz clic para agregar</span>
                                    </div>
                                </div>

                                {productosDisponibles.map((producto) => (
                                    <div
                                        key={producto.id}
                                        className="border-b border-gray-100 dark:border-zinc-700 last:border-b-0"
                                    >
                                        <button
                                            type="button"
                                            disabled={readOnly}
                                            onClick={() => handleAgregarProductoYLimpiar(producto)}
                                            className="w-full text-left px-4 py-3.5 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {/* ✅ NUEVO: Nombre del producto */}
                                            <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {producto.nombre}
                                            </div>
                                            {/* ✅ NUEVO: Código, precio (redondeado a 2 decimales) y stock */}
                                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                                                <span className="font-medium">{producto.codigo}</span>
                                                <span className="text-green-700 dark:text-green-400 font-bold ml-2">
                                                    {formatCurrencyWith2Decimals(producto.precio_venta || 0)}
                                                </span>
                                                {/* ✅ Mostrar stock para compras */}
                                                {tipo === 'compra' ? (
                                                    <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">
                                                        📦 Stock: {(producto as any).stock_disponible ?? (producto as any).stock ?? 0}
                                                    </span>
                                                ) : (
                                                    (producto as any).stock_disponible && <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">📦 Stock: {(producto as any).stock_disponible}</span>
                                                )}
                                            </div>
                                            {/* ✅ NUEVO: Metadatos del producto (unidad, marca, categoría) */}
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 flex flex-wrap gap-2">
                                                {producto.unidad && (
                                                    <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full text-blue-700 dark:text-blue-300 font-medium">
                                                        {producto.unidad.nombre}
                                                    </span>
                                                )}
                                                {producto.marca && (
                                                    <span className="bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300 font-medium">
                                                        {producto.marca.nombre}
                                                    </span>
                                                )}
                                                {producto.categoria && (
                                                    <span className="bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full text-amber-700 dark:text-amber-300 font-medium">
                                                        {producto.categoria.nombre}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                        {/* ✅ NUEVO: Botón para mostrar info de medicamentos (solo para farmacias) */}
                                        {(() => {
                                            const mostrarMedicamentos = es_farmacia && (producto.principio_activo || producto.uso_de_medicacion);
                                            return mostrarMedicamentos && (
                                                <button
                                                    type="button"
                                                    onClick={() => onMedicamentoInfo(producto)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-zinc-700 font-semibold flex items-center gap-2"
                                                >
                                                    <span>💊 Ver información del medicamento</span>
                                                </button>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </>
                        )}

                        {/* ✅ ESTADO: Sin resultados */}
                        {!isLoading && productosDisponibles.length === 0 && !searchError && (
                            <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 text-center bg-gray-50 dark:bg-zinc-800/50">
                                🔍 No se encontraron productos
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal del escáner */}
            <BarcodeScannerModal
                isOpen={showScannerModal}
                onClose={closeScannerModal}
                onScan={handleScan}
                onError={handleScannerError}
                error={scannerError}
            />
        </>
    );
}
