/**
 * Page: Ventas de Comidas/Helados
 *
 * Interfaz especializada para venta de comidas sin stock
 * Características:
 * ✅ Selector de productos de comida
 * ✅ Gestión de adicionales por producto
 * ✅ Carrito con precio dinámico
 * ✅ Métodos de pago
 * ✅ Cliente opcional
 * ✅ Guardado de venta
 */

import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import AppLayout from '@/layouts/app-layout';
import { ProductosComidaSelector } from '@/presentation/components/ProductosComidaSelector';
import { DetalleProductoComida } from '@/presentation/components/DetalleProductoComida';
import { useCarritoComidas } from '@/application/hooks/use-carrito-comidas';
import { Button } from '@/presentation/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Trash2, ShoppingCart, Save, AlertCircle } from 'lucide-react';

interface Cliente {
    id: number;
    nombre: string;
    ci: string;
}

interface TipoPago {
    id: number;
    nombre: string;
    codigo: string;
}

interface Adicional {
    id: number;
    nombre: string;
    precio_adicional: number;
    activo: boolean;
}

interface ProductoComidaConAdicionales {
    producto: {
        id: number;
        nombre: string;
        precio_venta: number;
        adicionales?: Adicional[];
    };
    adicionalesSeleccionados: number[];
    cantidad: number;
}

interface VentasComidaspageProps {
    clientes: Cliente[];
    tiposPago: TipoPago[];
    auth: { user: { id: number; name: string } };
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function VentasComidas({ clientes, tiposPago, auth }: VentasComidaspageProps) {
    const carrito = useCarritoComidas();
    const [clienteId, setClienteId] = useState<string | null>(null);
    const [tipoPagoId, setTipoPagoId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mostrarSelector, setMostrarSelector] = useState(true);

    const handleAgregarProducto = (detalle: ProductoComidaConAdicionales) => {
        const adicionalesDetalles = detalle.producto.adicionales?.filter(a =>
            detalle.adicionalesSeleccionados.includes(a.id)
        ) || [];

        carrito.agregarProducto(detalle as any, adicionalesDetalles);
        toast.success(`${detalle.producto.nombre} agregado al carrito`);
    };

    const handleEliminar = (index: number) => {
        carrito.eliminarProducto(index);
        toast.success('Producto eliminado');
    };

    const handleGuardarVenta = async () => {
        // Validaciones
        if (carrito.items.length === 0) {
            toast.error('Agrega al menos un producto');
            return;
        }

        if (!tipoPagoId) {
            toast.error('Selecciona un tipo de pago');
            return;
        }

        setIsSubmitting(true);

        try {
            // Preparar datos
            const datosVenta = {
                cliente_id: clienteId ? parseInt(clienteId) : null,
                tipo_pago_id: parseInt(tipoPagoId),
                productos_comida: carrito.items.map(item => ({
                    producto_id: item.producto_id,
                    nombre: item.nombre_producto,
                    precio_base: item.precio_base,
                    adicionales_ids: item.adicionalesSeleccionados,
                    cantidad: item.cantidad,
                    subtotal: item.precio_total,
                })),
                total: carrito.calcularTotal(),
                es_venta_comida: true,
                observaciones: null,
            };

            // Enviar al servidor
            const response = await fetch('/api/ventas-comidas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(datosVenta),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('¡Venta registrada exitosamente!');
                carrito.limpiarCarrito();
                setClienteId(null);
                setTipoPagoId(null);
                setMostrarSelector(true);

                // Opcional: Redirigir o mostrar comprobante
                if (result.ventaId) {
                    // router.visit(`/ventas/${result.ventaId}`);
                }
            } else {
                toast.error(result.message || 'Error al guardar la venta');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al guardar la venta');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Venta de Comidas" />
            <Toaster position="top-right" />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Encabezado */}
                    <div className="mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                    🍦 Venta de Comidas/Helados
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    Vendedor: {auth.user.name} • {new Date().toLocaleDateString('es-BO')}
                                </p>
                            </div>
                            <Link
                                href="/ventas"
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                                ← Volver
                            </Link>
                        </div>

                        {/* Info importante */}
                        {carrito.items.length === 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                                <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
                                <p className="text-blue-800 dark:text-blue-300 text-sm">
                                    Selecciona productos del menú para comenzar una venta
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Layout Principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Panel Izquierdo: Selector de Productos */}
                        <div className="lg:col-span-2">
                            {mostrarSelector && (
                                <ProductosComidaSelector onAgregar={handleAgregarProducto} />
                            )}

                            {carrito.items.length > 0 && !mostrarSelector && (
                                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <CardContent className="py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                            Carrito actualizado
                                        </p>
                                        <button
                                            onClick={() => setMostrarSelector(true)}
                                            className="px-6 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                        >
                                            + Agregar más productos
                                        </button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Panel Derecho: Resumen y Opciones */}
                        <div className="space-y-6">
                            {/* Carrito Resumen */}
                            {carrito.items.length > 0 && (
                                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-6">
                                    <CardHeader>
                                        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                            <ShoppingCart size={20} />
                                            Resumen
                                        </CardTitle>
                                        <CardDescription>
                                            {carrito.totalItems} producto(s)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Items listado */}
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {carrito.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between items-start p-2 bg-gray-50 dark:bg-gray-900/50 rounded"
                                                >
                                                    <div className="text-sm">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.nombre_producto} ×{item.cantidad}
                                                        </p>
                                                        {(item.adicionales_detalles || []).length > 0 && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                +{(item.adicionales_detalles || []).map(a => a.nombre).join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency(item.precio_total)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total */}
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    Total:
                                                </span>
                                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(carrito.calcularTotal())}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    carrito.limpiarCarrito();
                                                    toast.success('Carrito vaciado');
                                                }}
                                                className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Vaciar
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Opciones de Venta */}
                            {carrito.items.length > 0 && (
                                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-gray-900 dark:text-white">
                                            Detalles de Venta
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Cliente (opcional) */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Cliente (Opcional)
                                            </label>
                                            <Select value={clienteId || ''} onValueChange={setClienteId}>
                                                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                                    <SelectValue placeholder="Sin cliente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">Sin cliente</SelectItem>
                                                    {clientes.map(cliente => (
                                                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                                                            {cliente.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Tipo de Pago */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Tipo de Pago <span className="text-red-500">*</span>
                                            </label>
                                            <Select value={tipoPagoId || ''} onValueChange={setTipoPagoId}>
                                                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tiposPago.map(tipo => (
                                                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                                            {tipo.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Botón Guardar */}
                                        <button
                                            onClick={handleGuardarVenta}
                                            disabled={isSubmitting || !tipoPagoId}
                                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} />
                                            {isSubmitting ? 'Guardando...' : 'Guardar Venta'}
                                        </button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
