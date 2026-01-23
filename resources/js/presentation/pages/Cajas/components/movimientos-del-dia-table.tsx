/**
 * Component: MovimientosDelDiaTable
 *
 * Responsabilidades:
 * ✅ Renderizar tabla de movimientos de caja del día
 * ✅ Mostrar columnas: Hora, Tipo, Descripción, Documento, Monto
 * ✅ Indicadores visuales de ingresos/egresos
 * ✅ Agrupar movimientos por tipo
 * ✅ Resumen de totales por tipo
 */

import { useState } from 'react';
import type { AperturaCaja, MovimientoCaja } from '@/domain/entities/cajas';
import { formatCurrency, formatDateTime, getMovimientoIcon, getMovimientoColor, toNumber } from '@/lib/cajas.utils';
import { ComprobantesMovimiento } from '@/presentation/components/ComprobantesMovimiento';

interface Props {
    cajaAbiertaHoy: AperturaCaja | null;
    movimientosHoy: MovimientoCaja[];
}

export function MovimientosDelDiaTable({ cajaAbiertaHoy, movimientosHoy }: Props) {
    console.log('MovimientosDelDiaTable renderizado con movimientosHoy:', movimientosHoy);
    console.log('cajaAbiertaHoy:', cajaAbiertaHoy);
    const [filtroTipo, setFiltroTipo] = useState<string | null>(null);

    if (!cajaAbiertaHoy || movimientosHoy.length === 0) {
        return null;
    }

    // ✅ NUEVO: Determinar si la caja es de hoy o de otro día
    const fechaApertura = new Date(cajaAbiertaHoy.fecha);
    const hoy = new Date();
    const esHoy = fechaApertura.toDateString() === hoy.toDateString();
    const etiquetaPeriodo = esHoy ? 'del Día' : `desde ${fechaApertura.toLocaleDateString('es-BO', { month: 'short', day: 'numeric' })}`;

    // ✅ NUEVO: Agrupar movimientos por tipo
    const movimientosAgrupados = movimientosHoy.reduce((acc: Record<string, MovimientoCaja[]>, mov) => {
        const tipo = mov.tipo_operacion.nombre;
        if (!acc[tipo]) {
            acc[tipo] = [];
        }
        acc[tipo].push(mov);
        return acc;
    }, {});

    // ✅ NUEVO: Obtener tipos únicos y calcular totales
    const tipos = Object.keys(movimientosAgrupados);
    const totalesPorTipo = Object.entries(movimientosAgrupados).map(([tipo, movs]) => ({
        tipo,
        total: movs.reduce((sum, m) => sum + m.monto, 0),
        count: movs.length,
    }));

    // ✅ NUEVO: Filtrar movimientos si hay filtro activo
    const movimientosAMostrar = filtroTipo
        ? movimientosAgrupados[filtroTipo]
        : movimientosHoy;

    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Movimientos {etiquetaPeriodo} ({movimientosAMostrar.length})
                    </h3>
                </div>
                {/* ✅ NUEVO: Resumen final */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Mostrado (respeta filtro) */}
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Total Mostrado
                                {filtroTipo && ` (${filtroTipo})`}
                            </p>
                            {(() => {
                                const totalMostrado = movimientosAMostrar.reduce((sum, m) => sum + toNumber(m.monto), 0);
                                return (
                                    <>
                                        <p className={`text-lg font-bold ${getMovimientoColor(totalMostrado)}`}>
                                            {formatCurrency(totalMostrado)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {movimientosAMostrar.length} movimiento{movimientosAMostrar.length !== 1 ? 's' : ''}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Total del Día (siempre todos sin filtro) */}
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Total del Día
                            </p>
                            {(() => {
                                const totalDia = movimientosHoy.reduce((sum, m) => sum + toNumber(m.monto), 0);
                                return (
                                    <>
                                        <p className={`text-lg font-bold ${getMovimientoColor(totalDia)}`}>
                                            {formatCurrency(totalDia)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {movimientosHoy.length} movimiento{movimientosHoy.length !== 1 ? 's' : ''}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Saldo Esperado */}
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Saldo Esperado
                            </p>
                            {(() => {
                                const apertura = toNumber(cajaAbiertaHoy.monto_apertura);
                                const totalDia = movimientosHoy.reduce((sum, m) => sum + toNumber(m.monto), 0);
                                const saldoEsperado = apertura + totalDia;
                                return (
                                    <>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(saldoEsperado)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Apertura: {formatCurrency(apertura)}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* ✅ NUEVO: Filtros por tipo */}
                <div className="mb-6 flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => setFiltroTipo(null)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${!filtroTipo
                            ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        Todos ({movimientosHoy.length})
                    </button>
                    {tipos.map((tipo) => {
                        // const total = totalesPorTipo.find(t => t.tipo === tipo)?.total || 0;
                        return (
                            <button
                                key={tipo}
                                onClick={() => setFiltroTipo(tipo)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${filtroTipo === tipo
                                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {tipo} ({movimientosAgrupados[tipo].length})
                            </button>
                        );
                    })}
                </div>

                {/* ✅ NUEVO: Resumen por tipo */}
                {totalesPorTipo.length > 1 && !filtroTipo && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {totalesPorTipo.map(({ tipo, total, count }) => (
                            <div
                                key={tipo}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                onClick={() => setFiltroTipo(tipo)}
                            >
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    {tipo}
                                </p>
                                <p className={`text-lg font-bold ${getMovimientoColor(total)}`}>
                                    {formatCurrency(Math.abs(total))}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {count} movimiento{count !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Informacion
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Descripcion
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Comprobantes
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monto
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {movimientosAMostrar.map((movimiento) => (
                                <tr key={movimiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                        {formatDateTime(movimiento.fecha)}
                                        <br />
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                            {movimiento.tipo_operacion.nombre}
                                        </span>
                                        <br />
                                        {movimiento.numero_documento}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                        {movimiento.observaciones}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <ComprobantesMovimiento comprobantes={movimiento.comprobantes} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end">
                                            {getMovimientoIcon(toNumber(movimiento.monto))}
                                            <span className={`ml-2 text-sm font-medium ${getMovimientoColor(toNumber(movimiento.monto))}`}>
                                                {formatCurrency(Math.abs(toNumber(movimiento.monto)))}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
