/**
 * Component: HistorialAperturasTable
 *
 * Responsabilidades:
 * ✅ Mostrar historial de cajas abiertas y cerradas
 * ✅ Filtrar por rango de fechas
 * ✅ Mostrar estado de cada caja (Abierta/Cerrada)
 * ✅ Mostrar diferencia entre monto esperado y real
 * ✅ Indicadores visuales de discrepancias
 * ✅ Acordeón expandible para ver movimientos de cada período
 */

import React, { useState, useMemo } from 'react';
import { formatCurrency, toNumber, formatDateTime } from '@/lib/cajas.utils';
import { Calendar, ChevronDown, ChevronRight, Loader } from 'lucide-react';
import { FormatoSelector } from '@/presentation/components/impresion/FormatoSelector';
import type { AperturaHistorico, MovimientoCaja } from '@/domain/entities/cajas';

interface Props {
    historicoAperturas: AperturaHistorico[];
}

interface MovimientosData {
    movimientos: MovimientoCaja[];
    total: number;
    count: number;
}

export function HistorialAperturasTable({ historicoAperturas }: Props) {

    console.log('Historico Aperturas:', historicoAperturas);
    const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>('');
    const [filtroFechaFin, setFiltroFechaFin] = useState<string>('');
    const [filtroCaja, setFiltroCaja] = useState<string>('');
    const [expandedAperturaId, setExpandedAperturaId] = useState<number | null>(null);
    const [movimientosLoading, setMovimientosLoading] = useState<number | null>(null);
    const [movimientosCached, setMovimientosCached] = useState<Record<number, MovimientosData>>({});

    // Obtener cajas únicas para el filtro
    const cajasUnicas = useMemo(() => {
        return Array.from(new Set(historicoAperturas.map(a => a.caja_nombre)));
    }, [historicoAperturas]);

    // Filtrar aperturas
    const aperturasFiltradas = useMemo(() => {
        return historicoAperturas.filter(apertura => {
            // Filtro por fecha inicio
            if (filtroFechaInicio) {
                const fechaApertura = new Date(apertura.fecha_apertura).toISOString().split('T')[0];
                if (fechaApertura < filtroFechaInicio) return false;
            }

            // Filtro por fecha fin
            if (filtroFechaFin) {
                const fechaApertura = new Date(apertura.fecha_apertura).toISOString().split('T')[0];
                if (fechaApertura > filtroFechaFin) return false;
            }

            // Filtro por caja
            if (filtroCaja && apertura.caja_nombre !== filtroCaja) return false;

            return true;
        });
    }, [historicoAperturas, filtroFechaInicio, filtroFechaFin, filtroCaja]);

    // Calcular estadísticas del filtro
    const stats = useMemo(() => {
        return {
            total: aperturasFiltradas.length,
            abiertas: aperturasFiltradas.filter(a => a.estado === 'Abierta').length,
            cerradas: aperturasFiltradas.filter(a => a.estado === 'Cerrada').length,
            conDiscrepancia: aperturasFiltradas.filter(a => {
                const diff = toNumber(a.diferencia);
                return diff !== 0 && a.estado === 'Cerrada';
            }).length,
        };
    }, [aperturasFiltradas]);

    const getEstadoBadge = (estado: string) => {
        if (estado === 'Abierta') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                🔓 Abierta
            </span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            🔒 Cerrada
        </span>;
    };

    const getDiferenciaColor = (diferencia: number | string | null) => {
        if (diferencia === null) return 'text-gray-500 dark:text-gray-400';
        const diff = toNumber(diferencia);
        if (diff === 0) return 'text-green-600 dark:text-green-400 font-bold';
        return 'text-red-600 dark:text-red-400 font-bold';
    };

    // ✅ NUEVO: Badge para el estado del cierre
    const getEstadoCierreBadge = (estadoCierre: string | null) => {
        if (!estadoCierre) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                ⚪ Sin estado
            </span>;
        }

        switch (estadoCierre.toUpperCase()) {
            case 'PENDIENTE':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    ⏳ Pendiente
                </span>;
            case 'CONSOLIDADA':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    ✅ Consolidada
                </span>;
            case 'RECHAZADA':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    ❌ Rechazada
                </span>;
            case 'CORREGIDA':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    🔧 Corregida
                </span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {estadoCierre}
                </span>;
        }
    };

    const cargarMovimientos = async (aperturaId: number) => {
        // Si ya está cargado, solo expandir/contraer
        if (movimientosCached[aperturaId]) {
            setExpandedAperturaId(expandedAperturaId === aperturaId ? null : aperturaId);
            return;
        }

        setMovimientosLoading(aperturaId);
        try {
            const response = await fetch(`/cajas/apertura/${aperturaId}/movimientos`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            setMovimientosCached({
                ...movimientosCached,
                [aperturaId]: data,
            });
            setExpandedAperturaId(aperturaId);
        } catch (error) {
            console.error('Error cargando movimientos:', error);
            // Aquí puedes agregar notificación al usuario si lo deseas
        } finally {
            setMovimientosLoading(null);
        }
    };

    if (!historicoAperturas || historicoAperturas.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                    📋 Historial de Cajas Abiertas y Cerradas
                </h3>

                {/* Filtros */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Desde
                        </label>
                        <input
                            type="date"
                            value={filtroFechaInicio}
                            onChange={(e) => setFiltroFechaInicio(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={filtroFechaFin}
                            onChange={(e) => setFiltroFechaFin(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Caja
                        </label>
                        <select
                            value={filtroCaja}
                            onChange={(e) => setFiltroCaja(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">Todas las cajas</option>
                            {cajasUnicas.map(caja => (
                                <option key={caja} value={caja}>{caja}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            &nbsp;
                        </label>
                        <button
                            onClick={() => {
                                setFiltroFechaInicio('');
                                setFiltroFechaFin('');
                                setFiltroCaja('');
                            }}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* Resumen de filtros */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Abiertas</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">{stats.abiertas}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cerradas</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.cerradas}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${stats.conDiscrepancia > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                        <p className={`text-xs mb-1 ${stats.conDiscrepancia > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            Con discrepancia
                        </p>
                        <p className={`text-lg font-bold ${stats.conDiscrepancia > 0 ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
                            {stats.conDiscrepancia}
                        </p>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="w-10"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Caja
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Fecha Apertura
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monto Apertura
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado Cierre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Fecha Cierre
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monto Esperado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monto Real
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Diferencia
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {aperturasFiltradas.map((apertura) => (
                                <React.Fragment key={apertura.id}>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                        <td
                                            className="w-10 px-3 py-4 text-center cursor-pointer"
                                            onClick={() => cargarMovimientos(apertura.id)}
                                        >
                                            {movimientosLoading === apertura.id ? (
                                                <Loader className="w-4 h-4 inline animate-spin text-indigo-600" />
                                            ) : (
                                                expandedAperturaId === apertura.id ? (
                                                    <ChevronDown className="w-4 h-4 text-indigo-600 hover:text-indigo-700" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                                )
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            #{apertura.id} | {apertura.caja_nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {formatDateTime(apertura.fecha_apertura)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                            {apertura.monto_apertura != null ? formatCurrency(toNumber(apertura.monto_apertura)) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {getEstadoBadge(apertura.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {apertura.estado_cierre ? getEstadoCierreBadge(apertura.estado_cierre) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {apertura.fecha_cierre != null ? formatDateTime(apertura.fecha_cierre) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                            {apertura.monto_esperado != null ? formatCurrency(toNumber(apertura.monto_esperado)) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300">
                                            {apertura.monto_real != null ? formatCurrency(toNumber(apertura.monto_real)) : '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${getDiferenciaColor(apertura.diferencia)}`}>
                                            {apertura.diferencia !== null ? formatCurrency(Math.abs(toNumber(apertura.diferencia))) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {apertura.estado === 'Cerrada' && apertura.id && (
                                                <FormatoSelector
                                                    documentoId={apertura.id}
                                                    tipoDocumento="cajas-cierre"
                                                    formatos={[
                                                        { formato: 'TICKET_80', nombre: 'Ticket 80mm', descripcion: 'Compacto' },
                                                        { formato: 'TICKET_58', nombre: 'Ticket 58mm', descripcion: 'Muy compacto' },
                                                    ]}
                                                    className="text-xs"
                                                />
                                            )}
                                            {apertura.estado !== 'Cerrada' && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">Sin cierre</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Fila expandible con movimientos */}
                                    {expandedAperturaId === apertura.id && movimientosCached[apertura.id] && (
                                        <tr className="bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600">
                                            <td colSpan={11} className="px-6 py-4">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                                            📊 Movimientos del período ({movimientosCached[apertura.id]?.count || 0})
                                                        </h4>

                                                        {movimientosCached[apertura.id]?.movimientos.length ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full text-sm">
                                                                    <thead className="bg-indigo-100 dark:bg-indigo-900/30">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Fecha/Hora</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tipo</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Documento</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Descripción</th>
                                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Monto</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-indigo-200 dark:divide-indigo-800">
                                                                        {movimientosCached[apertura.id]?.movimientos.map((mov: MovimientoCaja) => (
                                                                            <tr key={mov.id} className="hover:bg-indigo-100 dark:hover:bg-indigo-800/30">
                                                                                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">
                                                                                    {formatDateTime(mov.fecha)}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-xs">
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                                                        {mov.tipo_operacion.nombre}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">
                                                                                    {mov.numero_documento}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">
                                                                                    {mov.observaciones}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right text-xs font-semibold">
                                                                                    <span className={toNumber(mov.monto) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                                                                        {toNumber(mov.monto) > 0 ? '+' : '-'}{formatCurrency(Math.abs(toNumber(mov.monto)))}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-500 dark:text-gray-400 text-sm">No hay movimientos en este período</p>
                                                        )}

                                                        {/* Resumen de movimientos */}
                                                        <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total de Movimientos</p>
                                                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                                        {movimientosCached[apertura.id]?.count || 0}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Suma Total</p>
                                                                    <p className={`text-lg font-bold ${toNumber(movimientosCached[apertura.id]?.total || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                        {formatCurrency(movimientosCached[apertura.id]?.total || 0)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {aperturasFiltradas.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                            No hay registros que coincidan con los filtros seleccionados
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
