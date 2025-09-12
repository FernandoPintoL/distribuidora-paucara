// Presentation Layer: MovimientosStats Component
// Componente de estadísticas y resumen para movimientos de inventario

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RotateCcw, Activity } from 'lucide-react';
import { CATEGORIAS_MOVIMIENTO } from '@/domain/movimientos-inventario';
import type { MovimientoInventario } from '@/domain/movimientos-inventario';

interface MovimientosStats {
    total_movimientos: number;
    total_entradas: number;
    total_salidas: number;
    total_transferencias: number;
    valor_total_entradas?: number;
    valor_total_salidas?: number;
    productos_afectados: number;
    almacenes_activos: number;
}

interface MovimientosStatsProps {
    stats: MovimientosStats;
    recientes?: MovimientoInventario[];
}

export const MovimientosStatsComponent: React.FC<MovimientosStatsProps> = ({
    stats,
    recientes = []
}) => {
    const tarjetasStats = [
        {
            title: 'Total Movimientos',
            value: stats.total_movimientos,
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900',
            change: null
        },
        {
            title: 'Entradas',
            value: stats.total_entradas,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900',
            change: null,
            subtitle: stats.valor_total_entradas ?
                `Bs. ${stats.valor_total_entradas.toLocaleString('es-ES')}` :
                undefined
        },
        {
            title: 'Salidas',
            value: stats.total_salidas,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900',
            change: null,
            subtitle: stats.valor_total_salidas ?
                `Bs. ${stats.valor_total_salidas.toLocaleString('es-ES')}` :
                undefined
        },
        {
            title: 'Transferencias',
            value: stats.total_transferencias,
            icon: RotateCcw,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900',
            change: null
        }
    ];

    const tarjetasResumen = [
        {
            title: 'Productos Afectados',
            value: stats.productos_afectados,
            subtitle: 'productos diferentes'
        },
        {
            title: 'Almacenes Activos',
            value: stats.almacenes_activos,
            subtitle: 'almacenes con movimientos'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Tarjetas de estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tarjetasStats.map((tarjeta, index) => {
                    const Icon = tarjeta.icon;
                    return (
                        <Card key={index}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {tarjeta.title}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {tarjeta.value.toLocaleString('es-ES')}
                                        </p>
                                        {tarjeta.subtitle && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {tarjeta.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`p-3 rounded-full ${tarjeta.bgColor}`}>
                                        <Icon className={`w-6 h-6 ${tarjeta.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Tarjetas de resumen adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tarjetasResumen.map((tarjeta, index) => (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {tarjeta.value.toLocaleString('es-ES')}
                                </p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {tarjeta.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {tarjeta.subtitle}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Distribución por categoría */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Distribución por Categoría
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(CATEGORIAS_MOVIMIENTO).map(([categoria, info]) => {
                            const count = categoria === 'entrada' ? stats.total_entradas :
                                categoria === 'salida' ? stats.total_salidas :
                                    stats.total_transferencias;

                            const percentage = stats.total_movimientos > 0 ?
                                (count / stats.total_movimientos * 100).toFixed(1) : '0.0';

                            return (
                                <div key={categoria} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-lg">{info.icon}</div>
                                        <div>
                                            <p className={`font-medium ${info.color}`}>
                                                {info.label}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {count.toLocaleString('es-ES')} movimientos
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline">
                                            {percentage}%
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Movimientos recientes (si se proporcionan) */}
            {recientes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Movimientos Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recientes.slice(0, 5).map((movimiento) => (
                                <div key={movimiento.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {movimiento.stockProducto?.producto?.nombre || 'N/A'}
                                            </p>
                                            <p className="text-gray-500">
                                                {movimiento.stockProducto?.almacen?.nombre || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${movimiento.tipo.startsWith('ENTRADA') || movimiento.tipo === 'TRANSFERENCIA_ENTRADA'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                            {(movimiento.tipo.startsWith('ENTRADA') || movimiento.tipo === 'TRANSFERENCIA_ENTRADA' ? '+' : '-')
                                                + movimiento.cantidad.toLocaleString('es-ES')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(movimiento.created_at || '').toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MovimientosStatsComponent;
