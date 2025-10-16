import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { NotificationService } from '@/infrastructure/services/notification.service';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';

// Tipos para el componente - más genéricos para compatibilidad
export interface DetalleProducto {
    id?: number | string;
    producto_id: number | string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
    lote?: string;
    fecha_vencimiento?: string;
    producto?: {
        id: number | string;
        nombre: string;
        codigo?: string;
        codigo_barras?: string;
        precio_venta?: number;
        precio_compra?: number;
    };
}

interface Producto {
    id: number | string;
    nombre: string;
    codigo?: string;
    codigo_barras?: string;
    codigos_barras?: string[]; // Array con todos los códigos de barra relacionados
    precio_venta?: number;
    precio_compra?: number;
}

interface ProductosTableProps {
    productos: Producto[];
    detalles: DetalleProducto[];
    onAddProduct: (producto: Producto) => void;
    onUpdateDetail: (index: number, field: keyof DetalleProducto, value: number | string) => void;
    onRemoveDetail: (index: number) => void;
    onTotalsChange: (detalles: DetalleProducto[]) => void;
    tipo: 'compra' | 'venta';
    errors?: Record<string, string>;
    showLoteFields?: boolean; // Para mostrar campos de lote y fecha de vencimiento en compras
}

export default function ProductosTable({
    productos,
    detalles,
    onAddProduct,
    onUpdateDetail,
    onRemoveDetail
}: ProductosTableProps) {
    const [productSearch, setProductSearch] = useState('');
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);

    // Filtrar productos disponibles - solo mostrar cuando hay búsqueda
    const productosDisponibles = productSearch.trim() === '' ? [] : productos.filter(p => {
        const searchTerm = productSearch.toLowerCase().trim();

        // Buscar por ID (convertir a string para comparación)
        if (String(p.id).toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Buscar por nombre
        if (p.nombre.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Buscar por código principal
        if (p.codigo && p.codigo.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Buscar por código de barras principal
        if (p.codigo_barras && p.codigo_barras.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Buscar en todos los códigos de barra relacionados
        if (p.codigos_barras && p.codigos_barras.some(cb => cb.toLowerCase().includes(searchTerm))) {
            return true;
        }

        return false;
    });

    // Función para manejar el resultado del escáner
    const handleScannerResult = (result: string) => {
        if (result) {
            // Buscar producto por código de barras
            const productoEncontrado = productos.find(p => {
                // Buscar en código principal
                if (p.codigo_barras === result) return true;
                // Buscar en códigos relacionados
                if (p.codigos_barras && p.codigos_barras.includes(result)) return true;
                return false;
            });

            if (productoEncontrado) {
                onAddProduct(productoEncontrado);
                setShowScannerModal(false);
                NotificationService.success(`Producto escaneado: ${productoEncontrado.nombre}`);
            } else {
                NotificationService.error('No se encontró ningún producto con ese código de barras');
            }
        }
    };

    // Función para manejar errores del escáner
    const handleScannerError = (error: string) => {
        setScannerError(error);
        console.warn('Error del escáner:', error);
    };

    // Función para abrir el modal del escáner
    const openScannerModal = () => {
        setScannerError(null);
        setShowScannerModal(true);
    };

    // Función para cerrar el modal del escáner
    const closeScannerModal = () => {
        setShowScannerModal(false);
        setScannerError(null);
    };

    // Función para actualizar detalle
    const handleUpdateDetail = (index: number, field: keyof DetalleProducto, value: number | string) => {
        onUpdateDetail(index, field, value);
    };

    // Función para eliminar detalle
    const handleRemoveDetail = (index: number) => {
        onRemoveDetail(index);
    };

    // Función para agregar producto desde la búsqueda
    const handleAddProduct = (producto: Producto) => {
        onAddProduct(producto);
        setProductSearch(''); // Limpiar búsqueda después de agregar
    };

    return (
        <div>
            {/* Buscador de productos */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar productos
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                        placeholder="Buscar por nombre o código..."
                    />
                    <button
                        type="button"
                        onClick={openScannerModal}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
                        title="Escanear código de barras"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 18h4.01M12 9h4.01M12 6h4.01M12 3h4.01" />
                        </svg>
                    </button>
                </div>

                {productSearch && (
                    <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-zinc-600 rounded-md">
                        {productosDisponibles.slice(0, 10).map((producto) => (
                            <button
                                key={producto.id}
                                type="button"
                                onClick={() => handleAddProduct(producto)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 last:border-b-0"
                            >
                                <div className="font-medium text-gray-900 dark:text-white">
                                    {producto.nombre}
                                </div>
                                {producto.codigo && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Código: {producto.codigo} | Precio: {formatCurrency(producto.precio_venta || 0)}
                                    </div>
                                )}
                            </button>
                        ))}
                        {productSearch && productosDisponibles.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                No se encontraron productos con ese criterio
                            </div>
                        )}

                        {!productSearch && (
                            <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 text-center">
                                Escribe para buscar productos...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lista de productos agregados */}
            {detalles.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                        <thead className="bg-gray-50 dark:bg-zinc-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cantidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Precio Unit.
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Subtotal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                            {detalles.map((detalle, index) => {
                                // Buscar el producto correspondiente por ID
                                const productoInfo = productos.find(p => p.id === detalle.producto_id);

                                return (
                                    <tr key={detalle.producto_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {productoInfo?.nombre || 'Producto no encontrado'}
                                            </div>
                                            {productoInfo?.codigo && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {productoInfo.codigo}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={detalle.cantidad}
                                                onChange={(e) => handleUpdateDetail(index, 'cantidad', Number(e.target.value))}
                                                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={detalle.precio_unitario}
                                                onChange={(e) => handleUpdateDetail(index, 'precio_unitario', Number(e.target.value))}
                                                className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(detalle.subtotal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDetail(index)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No hay productos agregados
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Busca y agrega productos a la venta.
                    </p>
                </div>
            )}

            {/* Modal del escáner de códigos de barras */}
            {showScannerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Escanear código de barras
                            </h3>
                            <button
                                type="button"
                                onClick={closeScannerModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <BarcodeScannerComponent
                                width={300}
                                height={300}
                                onUpdate={(err, result) => {
                                    if (result) {
                                        handleScannerResult(result.getText());
                                    } else if (err) {
                                        handleScannerError(typeof err === 'string' ? err : 'Error al escanear');
                                    }
                                }}
                            />
                        </div>

                        {scannerError && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {scannerError}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeScannerModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
