import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import axios from 'axios';

interface Estadisticas {
    proformas_pendientes: number;
    envios_programados: number;
    envios_en_transito: number;
    envios_entregados_hoy: number;
    rutas: {
        planificadas: number;
        en_progreso: number;
        completadas: number;
        total_distancia: number;
    };
}

interface Ruta {
    id: number;
    codigo: string;
    localidad_nombre: string;
    chofer_nombre: string;
    vehiculo_placa: string;
    estado: string;
    paradas: number;
    distancia_km: number;
}

interface RutasDelDia {
    data: Ruta[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface DashboardProps {
    estadisticas: Estadisticas;
    rutasDelDia: RutasDelDia;
    proformasRecientes?: any;
    enviosActivos?: any;
}

export default function LogisticaDashboard({
    estadisticas: initialStats,
    rutasDelDia,
    proformasRecientes,
    enviosActivos,
}: DashboardProps) {
    const [estadisticas, setEstadisticas] = useState<Estadisticas>(initialStats);
    const [rutasActualizadas, setRutasActualizadas] = useState<RutasDelDia>(rutasDelDia);
    const [notificaciones, setNotificaciones] = useState<string[]>([]);

    useEffect(() => {
        // Configurar WebSocket para recibir actualizaciones en tiempo real
        const setupWebSocket = () => {
            // Escuchar eventos de Pusher/Socket.IO
            if (typeof window !== 'undefined' && window.Echo) {
                // Escuchar eventos de rutas
                window.Echo.channel('rutas')
                    .listen('RutaPlanificada', (data: any) => {
                        agregarNotificacion('Nueva ruta planificada: ' + data.codigo);
                        recargarEstadisticas();
                    })
                    .listen('RutaModificada', (data: any) => {
                        agregarNotificacion('Ruta modificada: ' + data.codigo);
                        recargarEstadisticas();
                    })
                    .listen('RutaDetalleActualizado', (data: any) => {
                        agregarNotificacion('Entrega actualizada en: ' + data.cliente_nombre);
                        recargarEstadisticas();
                    });
            }
        };

        setupWebSocket();

        // Cleanup
        return () => {
            if (typeof window !== 'undefined' && window.Echo) {
                window.Echo.leaveChannel('rutas');
            }
        };
    }, []);

    const agregarNotificacion = (mensaje: string) => {
        setNotificaciones(prev => [mensaje, ...prev.slice(0, 4)]);
        setTimeout(() => {
            setNotificaciones(prev => prev.filter(n => n !== mensaje));
        }, 5000);
    };

    const recargarEstadisticas = async () => {
        try {
            const response = await axios.get('/api/logistica/dashboard/stats');
            setEstadisticas(response.data.estadisticas);
        } catch (error) {
            console.error('Error al recargar estadísticas:', error);
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'planificada':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'en_progreso':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'completada':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'cancelada':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const StatCard = ({ title, value, icon, color }: any) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {title}
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${color}`}>
                        {value}
                    </p>
                </div>
                <div className="text-4xl opacity-20">
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Logística" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        Dashboard Logística
                    </h1>

                    {/* Notificaciones en tiempo real */}
                    {notificaciones.length > 0 && (
                        <div className="mb-6 space-y-2">
                            {notificaciones.map((notif, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <span>🔔</span>
                                    {notif}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Estadísticas de Rutas */}
                    <div className="mb-12">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            📍 Rutas del Día
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <StatCard
                                title="Planificadas"
                                value={estadisticas.rutas.planificadas}
                                icon="📋"
                                color="text-blue-600 dark:text-blue-400"
                            />
                            <StatCard
                                title="En Progreso"
                                value={estadisticas.rutas.en_progreso}
                                icon="🚗"
                                color="text-yellow-600 dark:text-yellow-400"
                            />
                            <StatCard
                                title="Completadas"
                                value={estadisticas.rutas.completadas}
                                icon="✅"
                                color="text-green-600 dark:text-green-400"
                            />
                            <StatCard
                                title="Distancia Total"
                                value={`${estadisticas.rutas.total_distancia.toFixed(1)} km`}
                                icon="🗺️"
                                color="text-purple-600 dark:text-purple-400"
                            />
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <Link
                                    href="/rutas"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    Ver Todas las Rutas →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Rutas del Día - Tabla */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Rutas Hoy ({rutasActualizadas.total})
                            </h2>
                            <Link
                                href="/rutas/create"
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                + Nueva Ruta
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            {rutasActualizadas.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 dark:bg-gray-700 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Código
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Localidad
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Chofer
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Vehículo
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Paradas
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Distancia
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Acción
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {rutasActualizadas.data.map((ruta) => (
                                                <tr key={ruta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                        {ruta.codigo}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.localidad_nombre}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.chofer_nombre}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.vehiculo_placa}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.paradas}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.distancia_km.toFixed(2)} km
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(ruta.estado)}`}>
                                                            {ruta.estado.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <Link
                                                            href={`/rutas/${ruta.id}`}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                                                        >
                                                            Ver
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    No hay rutas planificadas para hoy
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grid de otras estadísticas */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            📦 Otras Estadísticas
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Proformas Pendientes"
                                value={estadisticas.proformas_pendientes}
                                icon="📋"
                                color="text-red-600 dark:text-red-400"
                            />
                            <StatCard
                                title="Envíos Programados"
                                value={estadisticas.envios_programados}
                                icon="📦"
                                color="text-blue-600 dark:text-blue-400"
                            />
                            <StatCard
                                title="Envíos en Tránsito"
                                value={estadisticas.envios_en_transito}
                                icon="🚚"
                                color="text-yellow-600 dark:text-yellow-400"
                            />
                            <StatCard
                                title="Entregados Hoy"
                                value={estadisticas.envios_entregados_hoy}
                                icon="✅"
                                color="text-green-600 dark:text-green-400"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
