import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Package, Check, X, Eye } from 'lucide-react';
import stockService, {
    StockValidation,
    ProductoStock,
    ProductoStockBajo
} from '@/infrastructure/services/stock.service';

interface StockManagerProps {
    productosEnCarrito: Array<{
        producto_id: number;
        cantidad: number;
        nombre?: string;
    }>;
    almacenId?: number;
    onStockChange?: (stockValido: boolean) => void;
}

export default function StockManager({
    productosEnCarrito = [],
    almacenId = 1,
    onStockChange
}: StockManagerProps) {
    const [stockValidation, setStockValidation] = useState<StockValidation | null>(null);
    const [productosStockBajo, setProductosStockBajo] = useState<ProductoStockBajo[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductoStock | null>(null);

    const cargarProductosStockBajo = useCallback(async () => {
        try {
            const productos = await stockService.obtenerProductosStockBajo();
            setProductosStockBajo(productos);
        } catch (error) {
            console.error('Error cargando productos con stock bajo:', error);
        }
    }, []);

    const verificarStockCarrito = useCallback(async () => {
        setLoading(true);
        try {
            const validation = await stockService.verificarStock({
                productos: productosEnCarrito.map(p => ({
                    producto_id: p.producto_id,
                    cantidad: p.cantidad
                })),
                almacen_id: almacenId
            });

            setStockValidation(validation);
            onStockChange?.(validation?.valido ?? false);
        } catch (error) {
            console.error('Error verificando stock:', error);
        } finally {
            setLoading(false);
        }
    }, [productosEnCarrito, almacenId, onStockChange]);

    // Verificar stock cuando cambie el carrito
    useEffect(() => {
        if (productosEnCarrito.length > 0) {
            verificarStockCarrito();
        } else {
            setStockValidation(null);
            onStockChange?.(true);
        }
    }, [productosEnCarrito.length, verificarStockCarrito, onStockChange]);

    // Cargar productos con stock bajo al inicializar
    useEffect(() => {
        cargarProductosStockBajo();
    }, [cargarProductosStockBajo]);

    const verDetalleProducto = async (productoId: number) => {
        try {
            const detalle = await stockService.obtenerStockProducto(productoId, almacenId);
            if (detalle) {
                setSelectedProduct(detalle);
            }
        } catch (error) {
            console.error('Error obteniendo detalle del producto:', error);
        }
    };

    const getStatusColor = (valido: boolean) => {
        return valido
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800';
    };

    const getStatusIcon = (valido: boolean) => {
        return valido
            ? <Check className="w-5 h-5 text-green-600" />
            : <X className="w-5 h-5 text-red-600" />;
    };

    if (productosEnCarrito.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Estado general del stock */}
            <div className={`p-4 rounded-lg border ${loading ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">
                            Estado del Stock
                        </span>
                        {loading && (
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </div>

                    {stockValidation && (
                        <div className="flex items-center space-x-2">
                            {getStatusIcon(stockValidation.valido)}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stockValidation.valido)}`}>
                                {stockValidation.valido ? 'Stock Disponible' : 'Stock Insuficiente'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Errores de stock */}
                {stockValidation && !stockValidation.valido && (
                    <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-red-800">Problemas de Stock:</h4>
                        <ul className="space-y-1 text-sm text-red-700">
                            {stockValidation.errores.map((error, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Detalles de validación */}
                {stockValidation && stockValidation.detalles.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                            <Eye className="w-4 h-4" />
                            <span>{showDetails ? 'Ocultar' : 'Ver'} detalles</span>
                        </button>

                        {showDetails && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                                <div className="space-y-3">
                                    {stockValidation.detalles.map((detalle, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-900">
                                                    {detalle.producto_nombre}
                                                </span>
                                                <div className="text-sm text-gray-600">
                                                    Solicitado: {detalle.cantidad_solicitada} |
                                                    Disponible: {detalle.stock_disponible}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {detalle.diferencia < 0 && (
                                                    <span className="text-red-600 text-sm font-medium">
                                                        Falta: {Math.abs(detalle.diferencia)}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => verDetalleProducto(detalle.producto_id)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Productos con stock bajo (alerta) */}
            {productosStockBajo.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                            Productos con Stock Bajo ({productosStockBajo.length})
                        </span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {productosStockBajo.slice(0, 5).map((producto) => (
                            <div key={producto.id} className="flex items-center justify-between text-sm">
                                <span className="text-yellow-800">{producto.nombre}</span>
                                <span className="text-yellow-700">
                                    Stock: {producto.stock_actual} (Min: {producto.stock_minimo})
                                </span>
                            </div>
                        ))}
                        {productosStockBajo.length > 5 && (
                            <button
                                onClick={() => stockService.navigateToStockBajo()}
                                className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                            >
                                Ver todos ({productosStockBajo.length - 5} más)
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de detalle del producto */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Detalle de Stock
                            </h3>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-gray-700">Stock Total:</span>
                                <span className="ml-2 text-lg font-semibold text-gray-900">
                                    {selectedProduct.stock_total}
                                </span>
                            </div>

                            {selectedProduct.lotes.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Detalle por Lotes:
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedProduct.lotes.map((lote) => (
                                            <div key={lote.id} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">{lote.lote}</span>
                                                    <span className="text-gray-600">Cant: {lote.cantidad}</span>
                                                </div>
                                                {lote.fecha_vencimiento && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        Vence: {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                                                        {lote.dias_vencimiento !== null && (
                                                            <span className={`ml-2 ${lote.dias_vencimiento <= 30 ? 'text-red-600' : 'text-gray-600'}`}>
                                                                ({lote.dias_vencimiento} días)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
