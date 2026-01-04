import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card';
import { Progress } from '@/presentation/components/ui/progress';
import { AlertCircle, TrendingUp, Users, DollarSign } from 'lucide-react';

interface CreditoMetrics {
    total_clientes: number;
    clientes_con_credito: number;
    porcentaje_clientes_credito: number;
    limite_total_credito: number;
    saldo_utilizado: number;
    saldo_disponible: number;
    porcentaje_utilizacion: number;
    clientes_cerca_limite: number;
}

interface CreditoWidgetProps {
    data: CreditoMetrics;
}

export default function CreditoWidget({ data }: CreditoWidgetProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const getProgressColor = (percentage: number) => {
        if (percentage > 80) return 'bg-red-500';
        if (percentage > 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white flex items-center gap-2">
                            <span>💳</span>
                            <span>Crédito de Clientes</span>
                        </CardTitle>
                        <CardDescription>
                            Estado actual del crédito en el sistema
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Resumen de Clientes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Clientes */}
                    <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-gray-300">Total Clientes</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {data.total_clientes}
                        </div>
                    </div>

                    {/* Clientes con Crédito */}
                    <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-gray-300">Con Crédito</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">
                            {data.clientes_con_credito}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {data.porcentaje_clientes_credito}%
                        </div>
                    </div>

                    {/* Límite Total */}
                    <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-gray-300">Límite Total</span>
                        </div>
                        <div className="text-lg font-bold text-purple-400 truncate">
                            {formatCurrency(data.limite_total_credito)}
                        </div>
                    </div>

                    {/* Disponible */}
                    <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-300">Disponible</span>
                        </div>
                        <div className="text-lg font-bold text-cyan-400 truncate">
                            {formatCurrency(data.saldo_disponible)}
                        </div>
                    </div>
                </div>

                {/* Utilización de Crédito */}
                <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">
                            Utilización de Crédito
                        </span>
                        <span className={`text-sm font-bold ${getProgressColor(data.porcentaje_utilizacion) === 'bg-red-500' ? 'text-red-400' : getProgressColor(data.porcentaje_utilizacion) === 'bg-yellow-500' ? 'text-yellow-400' : 'text-green-400'}`}>
                            {data.porcentaje_utilizacion}%
                        </span>
                    </div>
                    <Progress
                        value={data.porcentaje_utilizacion}
                        className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-400 pt-2">
                        <span>
                            Utilizado: {formatCurrency(data.saldo_utilizado)}
                        </span>
                        <span>
                            Límite: {formatCurrency(data.limite_total_credito)}
                        </span>
                    </div>
                </div>

                {/* Alerta de Clientes Cercanos al Límite */}
                {data.clientes_cerca_limite > 0 && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-300">
                                ⚠️ Atención
                            </p>
                            <p className="text-sm text-red-200 mt-1">
                                {data.clientes_cerca_limite} cliente{data.clientes_cerca_limite > 1 ? 's' : ''} está{data.clientes_cerca_limite > 1 ? 'n' : ''} utilizando más del 80% de su límite de crédito
                            </p>
                        </div>
                    </div>
                )}

                {/* Estado General */}
                <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-sm text-gray-300 mb-2">
                        <strong>Estado General:</strong>
                    </p>
                    {data.porcentaje_utilizacion > 80 ? (
                        <p className="text-sm text-red-300">
                            🔴 Utilización CRÍTICA - Se recomienda revisar los límites de crédito
                        </p>
                    ) : data.porcentaje_utilizacion > 50 ? (
                        <p className="text-sm text-yellow-300">
                            🟡 Utilización MODERADA - Monitorear los próximos cambios
                        </p>
                    ) : (
                        <p className="text-sm text-green-300">
                            🟢 Utilización NORMAL - Sistema en estado óptimo
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
