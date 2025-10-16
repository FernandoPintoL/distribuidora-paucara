import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import AperturaCajaModal from '@/presentation/components/AperturaCajaModal';
import CierreCajaModal from '@/presentation/components/CierreCajaModal';

interface Caja {
    id: number;
    nombre: string;
    ubicacion: string;
    monto_inicial_dia: number;
    activa: boolean;
}

interface AperturaCaja {
    id: number;
    caja_id: number;
    user_id: number;
    fecha: string;
    monto_apertura: number;
    observaciones?: string;
    caja: Caja;
    cierre?: CierreCaja;
}

interface CierreCaja {
    id: number;
    monto_esperado: number;
    monto_real: number;
    diferencia: number;
    observaciones?: string;
    created_at: string;
}

interface MovimientoCaja {
    id: number;
    caja_id: number;
    numero_documento: string;
    descripcion: string;
    monto: number;
    fecha: string;
    created_at: string;
    tipo_operacion: {
        id: number;
        nombre: string;
        codigo: string;
    };
}

interface Props {
    cajas: Caja[];
    cajaAbiertaHoy: AperturaCaja | null;
    movimientosHoy: MovimientoCaja[];
    totalMovimientos: number;
}

export default function Index({ cajas, cajaAbiertaHoy, movimientosHoy, totalMovimientos }: Props) {
    const [showAperturaModal, setShowAperturaModal] = useState(false);
    const [showCierreModal, setShowCierreModal] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('es-BO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMovimientoIcon = (monto: number) => {
        return monto >= 0 ? (
            <span className="inline-block w-4 h-4 text-green-500">↗️</span>
        ) : (
            <span className="inline-block w-4 h-4 text-red-500">↘️</span>
        );
    };

    const getMovimientoColor = (monto: number) => {
        return monto >= 0 ? 'text-green-600' : 'text-red-600';
    };

    return (
        <AppLayout>
            <Head title="Gestión de Cajas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center">
                                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                                    💰 Gestión de Cajas
                                </h2>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date().toLocaleDateString('es-BO', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estado de Caja del Usuario */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Mi Caja del Día
                                </h3>

                                {cajaAbiertaHoy ? (
                                    <div className="flex items-center space-x-2">
                                        {cajaAbiertaHoy.cierre ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                ❌ Cerrada
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                ✅ Abierta
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                        ⚠️ Sin abrir
                                    </span>
                                )}
                            </div>

                            {cajaAbiertaHoy ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Información de la Caja */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Caja
                                            </label>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {cajaAbiertaHoy.caja.nombre}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {cajaAbiertaHoy.caja.ubicacion}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Hora de Apertura
                                            </label>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                🕐 {formatTime(cajaAbiertaHoy.fecha)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Montos */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Monto Inicial
                                            </label>
                                            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(cajaAbiertaHoy.monto_apertura)}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Movimientos del Día
                                            </label>
                                            <p className={`text-lg font-semibold ${getMovimientoColor(totalMovimientos)}`}>
                                                {formatCurrency(totalMovimientos)}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Total Esperado
                                            </label>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(cajaAbiertaHoy.monto_apertura + totalMovimientos)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex flex-col justify-center space-y-3">
                                        {!cajaAbiertaHoy.cierre ? (
                                            <button
                                                onClick={() => setShowCierreModal(true)}
                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                            >
                                                🔒 Cerrar Caja
                                            </button>
                                        ) : (
                                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    Caja cerrada a las {formatTime(cajaAbiertaHoy.cierre.created_at)}
                                                </p>
                                                {cajaAbiertaHoy.cierre.diferencia !== 0 && (
                                                    <p className={`text-sm font-medium ${cajaAbiertaHoy.cierre.diferencia > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        Diferencia: {formatCurrency(cajaAbiertaHoy.cierre.diferencia)}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto h-12 w-12 text-gray-400 text-4xl">💰</div>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        No tienes caja abierta
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Debes abrir una caja para comenzar a trabajar.
                                    </p>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setShowAperturaModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                                        >
                                            💰 Abrir Caja
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Movimientos del Día */}
                    {cajaAbiertaHoy && movimientosHoy.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    Movimientos del Día ({movimientosHoy.length})
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Hora
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Tipo
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Descripción
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Documento
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Monto
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {movimientosHoy.map((movimiento) => (
                                                <tr key={movimiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {formatTime(movimiento.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                            {movimiento.tipo_operacion.nombre}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                        {movimiento.descripcion}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {movimiento.numero_documento}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end">
                                                            {getMovimientoIcon(movimiento.monto)}
                                                            <span className={`ml-2 text-sm font-medium ${getMovimientoColor(movimiento.monto)}`}>
                                                                {formatCurrency(Math.abs(movimiento.monto))}
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
                    )}

                </div>
            </div>

            {/* Modales */}
            <AperturaCajaModal
                show={showAperturaModal}
                onClose={() => setShowAperturaModal(false)}
                cajas={cajas}
            />

            <CierreCajaModal
                show={showCierreModal}
                onClose={() => setShowCierreModal(false)}
                cajaAbierta={cajaAbiertaHoy}
                montoEsperado={cajaAbiertaHoy ? cajaAbiertaHoy.monto_apertura + totalMovimientos : 0}
            />
        </AppLayout>
    );
}
