/**
 * ResumenCajaCard Component - Tabla Format
 *
 * Responsabilidades:
 * ✅ Mostrar resumen de datos de cierre de caja en tabla
 * ✅ Mostrar ventas por tipo de pago
 * ✅ Mostrar ingresos, egresos y efectivo esperado
 * ✅ Manejo de estados de carga
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Loader2 } from 'lucide-react';

interface VentaPorTipoPago {
    tipo: string;
    total: number;
    cantidad: number;
}

interface DatosResumen {
    apertura: number;
    totalVentas: number;
    ventasAnuladas: number;
    pagosCredito: number;
    totalSalidas: number;
    totalIngresos: number;
    totalEgresos: number;
    efectivoEsperado: number;
    ventasPorTipoPago: VentaPorTipoPago[];
    sumatorialGastos?: number;  // ✅ NUEVO: Desglose de gastos
    sumatorialPagosSueldo?: number;  // ✅ NUEVO: Desglose de sueldos
    sumatorialAnticipos?: number;  // ✅ NUEVO: Desglose de anticipos
    sumatorialCompras?: number;  // ✅ NUEVO: Desglose de compras
    sumatorialAnulaciones?: number;  // ✅ NUEVO: Desglose de anulaciones
}

interface ResumenCajaCardProps {
    datosResumen: DatosResumen | null;
    cargando?: boolean;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function ResumenCajaCard({ datosResumen, cargando = false }: ResumenCajaCardProps) {
    if (cargando) {
        return (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">📊 Resumen de Caja</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando datos...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!datosResumen) {
        return (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">📊 Resumen de Caja</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No hay datos disponibles
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">📊 Resumen de Caja</CardTitle>
                <CardDescription>
                    Detalles financieros de la apertura actual
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        {/* Encabezado */}
                        <thead>
                            <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Concepto</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Cantidad</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Monto</th>
                            </tr>
                        </thead>

                        {/* Cuerpo */}
                        <tbody>
                            {/* 1. APERTURA */}
                            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">💵 Apertura</td>
                                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(datosResumen.apertura)}
                                </td>
                            </tr>

                            {/* 2. VENTAS POR TIPO DE PAGO */}
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
                                <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                    💳 Ventas por Tipo de Pago
                                </td>
                            </tr>

                            {datosResumen.ventasPorTipoPago.length > 0 ? (
                                datosResumen.ventasPorTipoPago.map((venta, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">• {venta.tipo}</td>
                                        <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                                                {venta.cantidad}
                                            </span>
                                        </td>
                                        <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(venta.total)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td colSpan={3} className="py-3 px-4 text-gray-500 dark:text-gray-400 text-center">
                                        No hay ventas registradas
                                    </td>
                                </tr>
                            )}

                            {/* 3. TOTAL VENTAS */}
                            <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                                <td className="py-3 px-4 font-bold text-green-900 dark:text-green-100">✅ Total Ventas (Aprobadas)</td>
                                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                <td className="text-right py-3 px-4 font-bold text-green-900 dark:text-green-100 text-base">
                                    {formatCurrency(datosResumen.totalVentas)}
                                </td>
                            </tr>

                            {/* 4. VENTAS ANULADAS */}
                            {datosResumen.ventasAnuladas > 0 && (
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                                    <td className="py-3 px-4 font-medium text-yellow-900 dark:text-yellow-100">⚠️ Ventas Anuladas (Referencial)</td>
                                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                    <td className="text-right py-3 px-4 font-semibold text-yellow-900 dark:text-yellow-100">
                                        {formatCurrency(datosResumen.ventasAnuladas)}
                                    </td>
                                </tr>
                            )}

                            {/* 5. PAGOS DE CRÉDITO */}
                            {datosResumen.pagosCredito > 0 && (
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20">
                                    <td className="py-3 px-4 font-medium text-blue-900 dark:text-blue-100">💰 Pagos de Cuentas por Cobrar</td>
                                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                    <td className="text-right py-3 px-4 font-semibold text-blue-900 dark:text-blue-100">
                                        {formatCurrency(datosResumen.pagosCredito)}
                                    </td>
                                </tr>
                            )}

                            {/* 6. TOTAL INGRESOS */}
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-green-100 dark:bg-green-900/30">
                                <td className="py-3 px-4 font-bold text-green-900 dark:text-green-100">📈 Total Ingresos</td>
                                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                <td className="text-right py-3 px-4 font-bold text-green-900 dark:text-green-100 text-base">
                                    {formatCurrency(datosResumen.totalIngresos)}
                                </td>
                            </tr>

                            {/* SEPARADOR */}
                            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                                <td colSpan={3} className="py-2 px-4"></td>
                            </tr>

                            {/* 7. DESGLOSE DE EGRESOS */}
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
                                <td colSpan={3} className="py-3 px-4 font-semibold text-red-900 dark:text-red-100">
                                    📉 Desglose de Egresos (Salidas Reales)
                                </td>
                            </tr>

                            {datosResumen.sumatorialGastos !== undefined && datosResumen.sumatorialGastos > 0 && (
                                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">• Gastos Operacionales</td>
                                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                    <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(datosResumen.sumatorialGastos)}
                                    </td>
                                </tr>
                            )}

                            {datosResumen.sumatorialPagosSueldo !== undefined && datosResumen.sumatorialPagosSueldo > 0 && (
                                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">• Pagos de Sueldo</td>
                                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                    <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(datosResumen.sumatorialPagosSueldo)}
                                    </td>
                                </tr>
                            )}

                            {datosResumen.sumatorialAnticipos !== undefined && datosResumen.sumatorialAnticipos > 0 && (
                                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">• Anticipos</td>
                                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                    <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(datosResumen.sumatorialAnticipos)}
                                    </td>
                                </tr>
                            )}

                            {datosResumen.sumatorialCompras !== undefined && datosResumen.sumatorialCompras > 0 && (
                                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">• Compras</td>
                                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                    <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(datosResumen.sumatorialCompras)}
                                    </td>
                                </tr>
                            )}

                            {datosResumen.sumatorialAnulaciones !== undefined && datosResumen.sumatorialAnulaciones > 0 && (
                                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 pl-8">• Anulaciones (Devoluciones)</td>
                                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                    <td className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(datosResumen.sumatorialAnulaciones)}
                                    </td>
                                </tr>
                            )}

                            {/* 7. TOTAL EGRESOS */}
                            <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-red-100 dark:bg-red-900/30">
                                <td className="py-3 px-4 font-bold text-red-900 dark:text-red-100">📉 Total Egresos (Salidas Reales)</td>
                                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">-</td>
                                <td className="text-right py-3 px-4 font-bold text-red-900 dark:text-red-100 text-base">
                                    {formatCurrency(datosResumen.totalEgresos)}
                                </td>
                            </tr>

                            {/* 8. EFECTIVO ESPERADO - DESTACADO */}
                            <tr className="border-b-2 border-blue-400 dark:border-blue-600 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
                                <td className="py-4 px-4 font-bold text-blue-900 dark:text-blue-100 text-base">💵 Efectivo Esperado en Caja</td>
                                <td className="text-right py-4 px-4 text-gray-600 dark:text-gray-400">-</td>
                                <td className="text-right py-4 px-4 font-bold text-blue-900 dark:text-blue-100 text-lg">
                                    {formatCurrency(datosResumen.efectivoEsperado)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Fórmula de Cálculo */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white mb-3">📋 Fórmula de Cálculo:</p>
                    <div className="space-y-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                        <p>
                            <span className="text-gray-500">+</span> Apertura
                            <span className="float-right text-gray-900 dark:text-white font-semibold">{formatCurrency(datosResumen.apertura)}</span>
                        </p>
                        <p>
                            <span className="text-green-600 dark:text-green-400">+</span> Total Ingresos
                            <span className="float-right text-green-600 dark:text-green-400 font-semibold">{formatCurrency(datosResumen.totalIngresos)}</span>
                        </p>
                        <p>
                            <span className="text-red-600 dark:text-red-400">-</span> Total Egresos
                            <span className="float-right text-red-600 dark:text-red-400 font-semibold">{formatCurrency(datosResumen.totalEgresos)}</span>
                        </p>
                        <div className="pt-2 border-t border-gray-300 dark:border-gray-600 mt-2">
                            <p className="font-bold">
                                <span className="text-blue-600 dark:text-blue-400">=</span> Efectivo Esperado
                                <span className="float-right text-blue-600 dark:text-blue-400">{formatCurrency(datosResumen.efectivoEsperado)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
