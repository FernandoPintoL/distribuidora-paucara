/**
 * Component: CajaHeader
 *
 * Responsabilidades:
 * ✅ Renderizar header con título y fecha actual
 * ✅ Información general del módulo de cajas
 * ✅ Mostrar shortcuts a otras secciones
 * ✅ Indicar si hay caja abierta de días anteriores
 * ✅ Mostrar nombre del usuario cuando es vista admin
 */

import type { AperturaCaja } from '@/domain/entities/cajas';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    cajaAbiertaHoy?: AperturaCaja | null;
    esVistaAdmin?: boolean;
    usuarioDestino?: User | null;
}

export function CajaHeader({ cajaAbiertaHoy, esVistaAdmin = false, usuarioDestino }: Props = {}) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-BO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const currentTime = today.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // ✅ NUEVO: Detectar si caja es de un día anterior
    let titulo = esVistaAdmin ? `👤 Caja de ${usuarioDestino?.name || 'Usuario'}` : '💰 Mi Caja';
    let subtítulo = esVistaAdmin ? usuarioDestino?.email || '' : 'Mi caja personal';
    let badge = null;

    if (cajaAbiertaHoy) {
        const fechaApertura = new Date(cajaAbiertaHoy.fecha);
        const esHoy = fechaApertura.toDateString() === today.toDateString();

        if (!esHoy) {
            const diasAtras = Math.floor((today.getTime() - fechaApertura.getTime()) / (1000 * 60 * 60 * 24));
            subtítulo = `Caja abierta hace ${diasAtras} día${diasAtras !== 1 ? 's' : ''}`;
            badge = (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    ⚠️ Sin cerrar
                </span>
            );
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            {titulo}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {subtítulo}
                            {badge}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center text-sm">
                        <div className="text-right">
                            <div className="text-gray-600 dark:text-gray-400">
                                {formattedDate}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                🕐 {currentTime}
                            </div>
                        </div>
                        {/* ✅ NUEVO: Quick navigation */}
                        {/* <div className="hidden lg:flex gap-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <a
                                href="/cajas/reportes"
                                className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                📊 Reportes
                            </a>
                            <a
                                href="/cajas/gastos"
                                className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                💸 Gastos
                            </a>
                            <a
                                href="/cajas/auditoria"
                                className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                🔍 Auditoría
                            </a>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
