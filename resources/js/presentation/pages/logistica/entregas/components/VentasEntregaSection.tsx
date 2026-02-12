import React, { useState } from 'react';
import { ChevronDown, ShoppingCart, DollarSign, Calendar, MapPin, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/presentation/components/ui/badge';
import type { VentaEntrega, Entrega } from '@/domain/entities/entregas';

interface VentasEntregaSectionProps {
    entrega?: Entrega;
    ventas: VentaEntrega[];
    totalVentas?: number;
}

const getEstadoColor = (estado: string) => {
    const estadoMap: Record<string, string> = {
        'EN_PREPARACION': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
        'EN_TRANSITO': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
        'ENTREGADA': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
        'PROBLEMAS': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
        'CANCELADA': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
        'PROGRAMADO': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    };
    return estadoMap[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
};

export default function VentasEntregaSection({ entrega, ventas }: VentasEntregaSectionProps) {
    console.log('VentasEntregaSection render with ventas:', ventas);
    const [expandedVentaId, setExpandedVentaId] = useState<number | null>(null);

    if (!ventas || ventas.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <ShoppingCart className="w-5 h-5" />
                    <p>No hay ventas asociadas a esta entrega</p>
                </div>
            </div>
        );
    }

    const montoTotal = ventas.reduce((sum, v) => sum + (typeof v.subtotal === 'string' ? parseFloat(v.subtotal) : v.subtotal || 0), 0);

    // Usar el peso de la entrega si está disponible, sino calcular desde las ventas
    let pesoTotal = 0;
    if (entrega?.peso_kg) {
        pesoTotal = typeof entrega.peso_kg === 'string' ? parseFloat(entrega.peso_kg) : entrega.peso_kg;
    } else {
        pesoTotal = ventas.reduce((sum, v) => sum + (v.peso_estimado || 0), 0);
    }
    pesoTotal = Number(pesoTotal) || 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Ventas en esta Entrega
                </h2>

                {/* Resumen de métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">Total Ventas</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{ventas.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-900/20 dark:to-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300">Monto Total</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            Bs. {montoTotal.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <p className="text-sm text-purple-700 dark:text-purple-300">Peso Total</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {pesoTotal.toFixed(2)} kg
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-700 dark:text-orange-300">Promedio</p>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            Bs. {(montoTotal / ventas.length).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabla de ventas */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        {/* Header de tabla */}
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Venta
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                    Peso
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                    Monto
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white w-12">
                                    Detalles
                                </th>
                            </tr>
                        </thead>

                        {/* Body de tabla */}
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {ventas.map((venta, index) => {
                                const isExpanded = expandedVentaId === Number(venta.id);
                                const ventaTotal = (typeof venta.subtotal === 'string' ? parseFloat(venta.subtotal) : venta.subtotal) || 0;
                                const pesoVenta = venta.peso_total_estimado || 0;

                                return (
                                    <React.Fragment key={`venta-${venta.id}`}>
                                        {/* Fila principal de la venta */}
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        Folio: {venta.id}
                                                    </p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {venta.numero}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {venta.cliente?.nombre || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 text-xs font-semibold">
                                                    {venta.detalles?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                                {pesoVenta} kg
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                    Bs. {ventaTotal.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className={getEstadoColor(venta.estado_logistica?.codigo || 'PROGRAMADO')}>
                                                    {venta.estado_logistica?.codigo || 'PROGRAMADO'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {venta.detalles && venta.detalles.length > 0 && (
                                                    <button
                                                        onClick={() => setExpandedVentaId(isExpanded ? null : Number(venta.id))}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                                                        title={isExpanded ? 'Ocultar' : 'Ver detalles'}
                                                    >
                                                        <ChevronDown
                                                            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Fila expandible - Detalles de la venta */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50 dark:bg-gray-800/20">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="space-y-4">
                                                        {/* Información adicional */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                                            {venta.fecha_entrega_comprometida && (
                                                                <div className="flex items-start gap-3">
                                                                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Comprometida</p>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {new Date(venta.fecha_entrega_comprometida).toLocaleDateString('es-ES', {
                                                                                weekday: 'short',
                                                                                year: 'numeric',
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {venta.direccion_entrega && (
                                                                <div className="flex items-start gap-3">
                                                                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Dirección Entrega</p>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {venta.direccion_entrega}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Tabla de productos */}
                                                        {venta.detalles && venta.detalles.length > 0 && (
                                                            <div className="space-y-2">
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                    Productos ({venta.detalles.length})
                                                                </h4>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="bg-gray-100 dark:bg-gray-900/50">
                                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                                    Producto
                                                                                </th>
                                                                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                                    Cantidad
                                                                                </th>
                                                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                                    Precio
                                                                                </th>
                                                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                                    Subtotal
                                                                                </th>
                                                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                                    Peso
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                            {venta.detalles.map((detalle) => {
                                                                                const precio = typeof detalle.precio_unitario === 'string' ? parseFloat(detalle.precio_unitario) : detalle.precio_unitario;
                                                                                const subtotal = typeof detalle.subtotal === 'string' ? parseFloat(detalle.subtotal) : detalle.subtotal;
                                                                                const pesoItem = (detalle.producto?.peso || 0) * detalle.cantidad;

                                                                                return (
                                                                                    <tr key={detalle.id} className="hover:bg-gray-100 dark:hover:bg-gray-800/50">
                                                                                        <td className="px-4 py-2">
                                                                                            <div>
                                                                                                <p className="font-medium text-gray-900 dark:text-white">
                                                                                                    {detalle.producto?.nombre || 'Producto sin nombre'}
                                                                                                </p>
                                                                                                {detalle.producto?.codigo && (
                                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                        {detalle.producto.codigo}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-center text-gray-900 dark:text-white font-medium">
                                                                                            {detalle.cantidad}
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                                                                                            Bs. {precio.toFixed(2)}
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                                                                                            Bs. {subtotal.toFixed(2)}
                                                                                        </td>
                                                                                        <td className="px-4 py-2 text-right text-purple-600 dark:text-purple-400 font-medium">
                                                                                            {pesoItem.toFixed(2)} kg
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}
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
            </div>
        </div>
    );
}
