/**
 * ProductosComidaSelector Component
 *
 * Responsabilidades:
 * ✅ Mostrar productos de comida/helados en grid
 * ✅ Permitir seleccionar adicionales
 * ✅ Calcular precio dinámico (base + extras)
 * ✅ Agregar al carrito con detalles
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Adicional {
    id: number;
    nombre: string;
    precio_adicional: number;
    activo: boolean;
}

interface ProductoComida {
    id: number;
    nombre: string;
    descripcion: string;
    precio_venta: number;
    es_producto_comida: boolean;
    adicionales?: Adicional[];
}

interface ProductoComidaConAdicionales {
    producto: ProductoComida;
    adicionalesSeleccionados: number[];
    cantidad: number;
}

interface ProductosComidaSelectorProps {
    onAgregar: (detalle: ProductoComidaConAdicionales) => void;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export function ProductosComidaSelector({ onAgregar }: ProductosComidaSelectorProps) {
    const [productos, setProductos] = useState<ProductoComida[]>([]);
    const [cargando, setCargando] = useState(true);
    const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoComida | null>(null);
    const [adicionalesSeleccionados, setAdicionalesSeleccionados] = useState<number[]>([]);
    const [cantidad, setCantidad] = useState(1);

    // Cargar productos de comida
    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const response = await fetch('/api/productos-comida/');
                const data = await response.json();

                if (data.success && data.data) {
                    setProductos(data.data);
                } else {
                    toast.error('Error al cargar productos de comida');
                }
            } catch (error) {
                console.error('Error cargando productos:', error);
                toast.error('Error al cargar productos');
            } finally {
                setCargando(false);
            }
        };

        cargarProductos();
    }, []);

    // Seleccionar producto
    const handleSeleccionarProducto = (producto: ProductoComida) => {
        setProductoSeleccionado(producto);
        setAdicionalesSeleccionados([]);
        setCantidad(1);
    };

    // Toggle adicional
    const toggleAdicional = (adicionalId: number) => {
        setAdicionalesSeleccionados(prev =>
            prev.includes(adicionalId)
                ? prev.filter(id => id !== adicionalId)
                : [...prev, adicionalId]
        );
    };

    // Calcular precio total
    const calcularPrecioTotal = (): number => {
        if (!productoSeleccionado) return 0;

        let precioBase = productoSeleccionado.precio_venta;
        const precioAdicionales = adicionalesSeleccionados.reduce((sum, id) => {
            const adicional = productoSeleccionado.adicionales?.find(a => a.id === id);
            return sum + (adicional?.precio_adicional || 0);
        }, 0);

        return (precioBase + precioAdicionales) * cantidad;
    };

    // Agregar al carrito
    const handleAgregar = () => {
        if (!productoSeleccionado) {
            toast.error('Selecciona un producto');
            return;
        }

        if (cantidad <= 0) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        onAgregar({
            producto: productoSeleccionado,
            adicionalesSeleccionados,
            cantidad,
        });

        // Limpiar selección
        setProductoSeleccionado(null);
        setAdicionalesSeleccionados([]);
        setCantidad(1);
        toast.success('Producto agregado al carrito');
    };

    if (cargando) {
        return (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">🍦 Venta de Comidas/Helados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando productos...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">🍦 Venta de Comidas/Helados</CardTitle>
                <CardDescription>
                    Selecciona un producto y agrega tus adicionales favoritos
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Grid de productos */}
                    {!productoSeleccionado ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {productos.length === 0 ? (
                                <div className="col-span-full text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No hay productos de comida disponibles
                                    </p>
                                </div>
                            ) : (
                                productos.map(producto => (
                                    <button
                                        key={producto.id}
                                        onClick={() => handleSeleccionarProducto(producto)}
                                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg dark:hover:shadow-blue-900/30 transition-all"
                                    >
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {producto.nombre}
                                            </h3>
                                            {producto.descripcion && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {producto.descripcion}
                                                </p>
                                            )}
                                            <div className="mt-3 flex justify-between items-center">
                                                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                                                    {formatCurrency(producto.precio_venta)}
                                                </span>
                                                {producto.adicionales && producto.adicionales.length > 0 && (
                                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">
                                                        +{producto.adicionales.length} extras
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Vista de detalle del producto seleccionado */
                        <div className="space-y-6 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50">
                            {/* Encabezado con producto seleccionado */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {productoSeleccionado.nombre}
                                    </h3>
                                    {productoSeleccionado.descripcion && (
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                            {productoSeleccionado.descripcion}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setProductoSeleccionado(null)}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    <X className="text-gray-600 dark:text-gray-400" size={20} />
                                </button>
                            </div>

                            {/* Precio base */}
                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 dark:text-gray-300">Precio Base:</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                                        {formatCurrency(productoSeleccionado.precio_venta)}
                                    </span>
                                </div>
                            </div>

                            {/* Adicionales */}
                            {productoSeleccionado.adicionales && productoSeleccionado.adicionales.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        Selecciona Adicionales:
                                    </h4>
                                    <div className="space-y-2">
                                        {productoSeleccionado.adicionales.map(adicional => (
                                            <label
                                                key={adicional.id}
                                                className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={adicionalesSeleccionados.includes(adicional.id)}
                                                    onChange={() => toggleAdicional(adicional.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div className="flex-1 ml-3">
                                                    <span className="text-gray-900 dark:text-white">
                                                        {adicional.nombre}
                                                    </span>
                                                </div>
                                                <span className="text-green-600 dark:text-green-400 font-semibold">
                                                    +{formatCurrency(adicional.precio_adicional)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cantidad */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                    Cantidad:
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => setCantidad(cantidad + 1)}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Precio total */}
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Precio Total:
                                    </span>
                                    <span className="text-green-600 dark:text-green-400 font-bold text-2xl">
                                        {formatCurrency(calcularPrecioTotal())}
                                    </span>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAgregar}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} />
                                    Agregar al Carrito
                                </button>
                                <button
                                    onClick={() => setProductoSeleccionado(null)}
                                    className="px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
