import { useState } from 'react';
import { ChevronDown, ShoppingCart, User, DollarSign, Calendar, MapPin, Package, CheckCircle, AlertCircle } from 'lucide-react';
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

export default function VentasEntregaSection({ entrega, ventas, totalVentas }: VentasEntregaSectionProps) {
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

    const montoTotal = ventas.reduce((sum, v) => sum + (typeof v.total === 'string' ? parseFloat(v.total) : v.total || 0), 0);

    // Usar el peso de la entrega si está disponible, sino calcular desde las ventas
    // Convertir a número para evitar errores con .toFixed()
    let pesoTotal = 0;
    if (entrega?.peso_kg) {
        pesoTotal = typeof entrega.peso_kg === 'string' ? parseFloat(entrega.peso_kg) : entrega.peso_kg;
    } else {
        pesoTotal = ventas.reduce((sum, v) => sum + (v.peso_estimado || 0), 0);
    }
    pesoTotal = Number(pesoTotal) || 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            {/* Header */}
            <div className="mb-6">
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

            {/* Lista de ventas con acordeón */}
            <div className="space-y-3">
                {ventas.map((venta, index) => {
                    const isExpanded = expandedVentaId === venta.id;
                    const ventaTotal = typeof venta.total === 'string' ? parseFloat(venta.total) : venta.total;

                    return (
                        <div
                            key={venta.id}
                            className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-slate-600 transition"
                        >
                            {/* Tarjeta principal - Clic para expandir */}
                            <button
                                onClick={() => setExpandedVentaId(isExpanded ? null : venta.id)}
                                className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <p className="font-semibold text-gray-900 dark:text-white">{venta.numero}</p>
                                        <Badge className={getEstadoColor(venta.estado_logistico || 'PROGRAMADO')}>
                                            {venta.estado_logistico || 'PROGRAMADO'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Cliente</p>
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                {venta.cliente?.nombre || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Total</p>
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                Bs. {ventaTotal.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Peso</p>
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                {venta.peso_estimado || 0} kg
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Items</p>
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                {venta.detalles?.length || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Icono de expansión */}
                                <div
                                    className={`transition-transform duration-300 ${
                                        isExpanded ? 'rotate-180' : ''
                                    }`}
                                >
                                    <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </div>
                            </button>

                            {/* Contenido expandido */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/30 p-4 space-y-4">
                                    {/* Información detallada */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                        <div className="flex items-start gap-3">
                                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Monto Total</p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    Bs. {ventaTotal.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Package className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Peso Estimado</p>
                                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                                    {venta.peso_estimado || 0} kg
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Productos en la venta */}
                                    {venta.detalles && venta.detalles.length > 0 && (
                                        <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                Productos ({venta.detalles.length})
                                            </h4>
                                            <div className="space-y-3">
                                                {venta.detalles.map((detalle, detalleIndex) => {
                                                    const precio = typeof detalle.precio_unitario === 'string' ? parseFloat(detalle.precio_unitario) : detalle.precio_unitario;
                                                    const subtotal = typeof detalle.subtotal === 'string' ? parseFloat(detalle.subtotal) : detalle.subtotal;
                                                    return (
                                                        <div
                                                            key={detalle.id}
                                                            className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition"
                                                        >
                                                            {/* Número y nombre */}
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-start gap-3 flex-1">
                                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded px-2 py-1 mt-0.5">
                                                                        #{detalleIndex + 1}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                                            {detalle.producto?.nombre || 'Producto sin nombre'}
                                                                        </p>
                                                                        {detalle.producto?.codigo && (
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                                Código: {detalle.producto.codigo}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Cantidad, precio y subtotal */}
                                                            <div className="grid grid-cols-3 gap-3 text-sm">
                                                                <div className="bg-white dark:bg-slate-900 rounded p-2 text-center">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cantidad</p>
                                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                                        {detalle.cantidad}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white dark:bg-slate-900 rounded p-2 text-center">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unitario</p>
                                                                    <p className="font-bold text-gray-900 dark:text-white text-xs">
                                                                        Bs. {precio.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-center border border-blue-200 dark:border-blue-800">
                                                                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-1 font-semibold">Total</p>
                                                                    <p className="font-bold text-blue-900 dark:text-blue-100 text-xs">
                                                                        Bs. {subtotal.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Peso calculation row */}
                                                            <div className="grid grid-cols-3 gap-3 text-sm mt-2">
                                                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 text-center">
                                                                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Peso Unit.</p>
                                                                    <p className="font-bold text-purple-900 dark:text-purple-100 text-xs">
                                                                        {(detalle.producto?.peso || 0).toFixed(2)} kg
                                                                    </p>
                                                                </div>
                                                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 text-center">
                                                                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Cantidad</p>
                                                                    <p className="font-bold text-purple-900 dark:text-purple-100 text-xs">
                                                                        {detalle.cantidad}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-purple-100 dark:bg-purple-800/30 rounded p-2 text-center border border-purple-300 dark:border-purple-700">
                                                                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-1 font-semibold">Peso Total</p>
                                                                    <p className="font-bold text-purple-900 dark:text-purple-100 text-xs">
                                                                        {((detalle.producto?.peso || 0) * detalle.cantidad).toFixed(2)} kg
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Estado */}
                                    <div className="border-t border-gray-200 dark:border-slate-600 pt-4 flex items-center gap-2">
                                        {venta.estado_logistico === 'ENTREGADA' || venta.estado_logistico === 'EN_TRANSITO' ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                <span className="text-sm text-green-600 dark:text-green-400">
                                                    En proceso de entrega
                                                </span>
                                            </>
                                        ) : venta.estado_logistico === 'PROBLEMAS' ? (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                <span className="text-sm text-red-600 dark:text-red-400">
                                                    Hay problemas en esta venta
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                                    En preparación
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
