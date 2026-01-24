/**
 * Component: CajaEstadoCard
 *
 * Responsabilidades:
 * ✅ Renderizar estado actual de la caja del usuario
 * ✅ Mostrar información de apertura/cierre
 * ✅ Mostrar montos y movimientos
 * ✅ Proveer botones de acción (Abrir/Cerrar)
 * ✅ Mostrar estado del cierre (PENDIENTE/CONSOLIDADA/RECHAZADA)
 * ✅ Permitir corrección si está rechazado
 */

import type { AperturaCaja } from '@/domain/entities/cajas';
import { formatCurrency, formatTime, getMovimientoColor } from '@/lib/cajas.utils';
import EstadoCierreBadge from '@/presentation/components/cajas/EstadoCierreBadge';

interface Cierre {
    id: number;
    estado?: string;
    observaciones_rechazo?: string;
    requiere_reapertura?: boolean;
    diferencia: number;
    monto_esperado: number;
    monto_real: number;
}

interface Props {
    cajaAbiertaHoy: AperturaCaja | null;
    totalMovimientos: number;
    onAbrirClick: () => void;
    onCerrarClick: () => void;
    onGastoClick?: () => void;
    onCorregirClick?: () => void;
    onConsolidarClick?: () => void; // ✅ NUEVO: Para consolidar cajas
    cierreDatos?: Cierre | null;
    esVistaAdmin?: boolean; // ✅ NUEVO
    cierresPendientes?: number; // ✅ NUEVO: Cantidad de cierres pendientes
    isConsolidating?: boolean; // ✅ NUEVO: Estado de consolidación
}

export function CajaEstadoCard({
    cajaAbiertaHoy,
    totalMovimientos,
    onAbrirClick,
    onCerrarClick,
    onGastoClick,
    onCorregirClick,
    onConsolidarClick,
    cierreDatos,
    esVistaAdmin = false,
    cierresPendientes = 0,
    isConsolidating = false
}: Props) {
    // ✅ NUEVO: Detectar si la caja es del día anterior o anterior
    const esDiaAnterior = () => {
        if (!cajaAbiertaHoy) return false;
        const fechaCaja = new Date(cajaAbiertaHoy.fecha);
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);

        // Comparar solo las fechas (sin hora)
        const fechaCajaDate = new Date(fechaCaja.getFullYear(), fechaCaja.getMonth(), fechaCaja.getDate());
        const hoyDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const ayerDate = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate());

        return fechaCajaDate < hoyDate;
    };

    const isDiaAnterior = esDiaAnterior();
    if (!cajaAbiertaHoy) {
        return (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Mi Caja del Día
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            ⚠️ Sin abrir
                        </span>
                    </div>

                    <div className="text-center py-8">
                        <div className="mx-auto h-12 w-12 text-gray-400 text-4xl">💰</div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            No tienes caja abierta hoy
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {isDiaAnterior
                                ? '💡 Tienes una caja abierta de días anteriores. Verifica el historial.'
                                : 'Debes abrir una caja para comenzar a trabajar.'}
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={onAbrirClick}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                            >
                                💰 Abrir Caja
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Mi Caja {isDiaAnterior ? 'del Día Anterior' : 'del Día'}
                        </h3>
                        {isDiaAnterior && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                ⚠️ Esta caja fue abierta hace varios días
                            </p>
                        )}
                    </div>

                    {cajaAbiertaHoy.cierre ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            ❌ Cerrada
                        </span>
                    ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDiaAnterior ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                            {isDiaAnterior ? '⏳ Abierta (Antigua)' : '✅ Abierta'}
                        </span>
                    )}
                </div>

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
                                Abierta desde
                            </label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {/* ✅ NUEVO: Mostrar fecha completa si es de otro día */}
                                {new Date(cajaAbiertaHoy.fecha).toLocaleDateString('es-BO', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                })} a las {formatTime(cajaAbiertaHoy.fecha)}
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

                    {/* Acciones - Usuario Normal */}
                    {!esVistaAdmin && (
                    <div className="flex flex-col justify-center space-y-3">
                        {!cajaAbiertaHoy.cierre ? (
                            <>
                                <button
                                    onClick={onCerrarClick}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                >
                                    🔒 Cerrar Caja
                                </button>
                                {onGastoClick && (
                                    <button
                                        onClick={onGastoClick}
                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                                    >
                                        💱 Registrar Movimiento
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="space-y-3">
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

                                {/* Estado del Cierre - NUEVO */}
                                {cierreDatos && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Estado:
                                            </span>
                                            <EstadoCierreBadge
                                                estado={cierreDatos.estado as any}
                                                size="md"
                                            />
                                        </div>

                                        {cierreDatos.estado === 'RECHAZADA' && cierreDatos.observaciones_rechazo && (
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                                                    ⚠️ Motivo del Rechazo:
                                                </p>
                                                <p className="text-sm text-red-700 dark:text-red-200">
                                                    {cierreDatos.observaciones_rechazo}
                                                </p>
                                                {cierreDatos.requiere_reapertura && (
                                                    <p className="text-xs text-red-600 dark:text-red-300 mt-2 font-semibold">
                                                        ⚠️ Requiere reapertura de caja
                                                    </p>
                                                )}
                                                {onCorregirClick && (
                                                    <button
                                                        onClick={onCorregirClick}
                                                        className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                                                    >
                                                        🔧 Corregir Cierre
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {cierreDatos.estado === 'CONSOLIDADA' && (
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                                <p className="text-sm text-green-700 dark:text-green-200">
                                                    ✅ Tu cierre fue consolidado y aprobado
                                                </p>
                                            </div>
                                        )}

                                        {cierreDatos.estado === 'PENDIENTE' && (
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                                    ⏳ Tu cierre está pendiente de verificación por el administrador
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    )}

                    {/* Acciones - Admin */}
                    {esVistaAdmin && (
                        <div className="flex flex-col justify-center space-y-3">
                            {cajaAbiertaHoy.cierre && (
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

                            {/* ✅ NUEVO: Botón de consolidación si hay pendientes */}
                            {cierresPendientes > 0 && onConsolidarClick && (
                                <button
                                    onClick={onConsolidarClick}
                                    disabled={isConsolidating}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                                >
                                    {isConsolidating ? '⏳ Consolidando...' : `✅ Consolidar cajas (${cierresPendientes})`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
