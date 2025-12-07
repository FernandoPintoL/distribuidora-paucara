import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import axios from 'axios';

interface Localidad {
    id: number;
    nombre: string;
}

interface Usuario {
    name: string;
}

interface Chofer {
    id: number;
    user: Usuario;
}

interface Vehiculo {
    id: number;
    placa: string;
    modelo: string;
}

interface RutaDetalle {
    id: number;
    secuencia: number;
    cliente_nombre: string;
    direccion_entrega: string;
    estado: string;
    latitud?: number;
    longitud?: number;
    hora_entrega_estimada?: string;
    hora_entrega_real?: string;
}

interface Ruta {
    id: number;
    codigo: string;
    fecha_ruta: string;
    estado: string;
    localidad: Localidad;
    chofer: Chofer;
    vehiculo: Vehiculo;
    cantidad_paradas: number;
    distancia_km: number;
    tiempo_estimado_min: number;
    hora_salida?: string;
    hora_llegada?: string;
    estadisticas?: {
        progreso: number;
        duracion?: number;
    };
}

interface ShowProps {
    ruta: Ruta;
    estadisticas: any;
}

export default function RutasShow({ ruta: initialRuta, estadisticas }: ShowProps) {
    const [ruta, setRuta] = useState<Ruta | null>(null);
    const [detalles, setDetalles] = useState<RutaDetalle[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [actualizandoEstado, setActualizandoEstado] = useState(false);

    useEffect(() => {
        setRuta(initialRuta);
        cargarDetalles();
    }, [initialRuta]);

    const cargarDetalles = async () => {
        setCargando(true);
        try {
            const response = await axios.get(`/api/rutas/${initialRuta.id}/detalles`);
            setDetalles(response.data.data);
        } catch (err) {
            setError('Error al cargar los detalles de la ruta');
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    const cambiarEstado = async (nuevoEstado: string) => {
        if (!ruta) return;

        setActualizandoEstado(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.patch(`/api/rutas/${ruta.id}/estado`, {
                estado: nuevoEstado
            });
            setRuta(response.data.data);
            setSuccess(`Estado cambiado a ${nuevoEstado}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cambiar el estado');
        } finally {
            setActualizandoEstado(false);
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'planificada':
                return 'bg-blue-100 text-blue-800';
            case 'en_progreso':
                return 'bg-yellow-100 text-yellow-800';
            case 'completada':
                return 'bg-green-100 text-green-800';
            case 'cancelada':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDetalleEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return 'bg-gray-100 text-gray-800';
            case 'en_entrega':
                return 'bg-blue-100 text-blue-800';
            case 'entregado':
                return 'bg-green-100 text-green-800';
            case 'no_entregado':
                return 'bg-red-100 text-red-800';
            case 'reprogramado':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (!ruta) {
        return (
            <AuthenticatedLayout>
                <Head title="Cargar ruta..." />
                <div className="py-12 text-center">Cargando...</div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Ruta ${ruta.codigo}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header con botón atrás */}
                    <div className="mb-6">
                        <Link
                            href="/rutas"
                            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
                        >
                            ← Volver a Rutas
                        </Link>
                    </div>

                    {/* Mensajes */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                            {success}
                        </div>
                    )}

                    {/* Información Principal */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {ruta.codigo}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(ruta.estado)}`}>
                                    {ruta.estado.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Fecha: {new Date(ruta.fecha_ruta).toLocaleDateString('es-ES')}
                                </div>
                            </div>
                        </div>

                        {/* Grid de información */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Localidad</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {ruta.localidad.nombre}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chofer</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {ruta.chofer.user.name}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vehículo</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {ruta.vehiculo.placa}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Distancia Total</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {ruta.distancia_km.toFixed(2)} km
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paradas</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {ruta.cantidad_paradas}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tiempo Estimado</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {ruta.tiempo_estimado_min} min
                                </div>
                            </div>

                            {ruta.hora_salida && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hora Salida</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {new Date(ruta.hora_salida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            )}

                            {ruta.hora_llegada && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hora Llegada</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {new Date(ruta.hora_llegada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botones de acción */}
                        <div className="mt-6 flex gap-2 flex-wrap">
                            {ruta.estado === 'planificada' && (
                                <button
                                    onClick={() => cambiarEstado('en_progreso')}
                                    disabled={actualizandoEstado}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {actualizandoEstado ? 'Actualizando...' : '▶️ Iniciar Ruta'}
                                </button>
                            )}
                            {ruta.estado === 'en_progreso' && (
                                <button
                                    onClick={() => cambiarEstado('completada')}
                                    disabled={actualizandoEstado}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {actualizandoEstado ? 'Actualizando...' : '✅ Completar Ruta'}
                                </button>
                            )}
                            {(ruta.estado === 'planificada' || ruta.estado === 'en_progreso') && (
                                <button
                                    onClick={() => cambiarEstado('cancelada')}
                                    disabled={actualizandoEstado}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    {actualizandoEstado ? 'Actualizando...' : '❌ Cancelar'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Lista de Paradas */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Paradas y Entregas
                            </h2>
                        </div>

                        {cargando ? (
                            <div className="p-6 text-center text-gray-500">
                                Cargando detalles...
                            </div>
                        ) : detalles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-gray-700 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                #
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                Cliente
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                Dirección
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                Hora Estimada
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                Hora Real
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {detalles.map((detalle) => (
                                            <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {detalle.secuencia}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {detalle.cliente_nombre}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {detalle.direccion_entrega}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDetalleEstadoColor(detalle.estado)}`}>
                                                        {detalle.estado.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {detalle.hora_entrega_estimada
                                                        ? new Date(detalle.hora_entrega_estimada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {detalle.hora_entrega_real
                                                        ? new Date(detalle.hora_entrega_real).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm space-x-2">
                                                    {detalle.estado === 'pendiente' && (
                                                        <button
                                                            onClick={() => {
                                                                // TODO: Abrir modal para registrar entrega
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs"
                                                        >
                                                            Registrar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                No hay paradas registradas
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
