import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import axios from 'axios';

interface Localidad {
    id: number;
    nombre: string;
    codigo: string;
}

interface Chofer {
    id: number;
    user: { name: string };
}

interface Ruta {
    id: number;
    codigo: string;
    fecha_ruta: string;
    estado: 'planificada' | 'en_progreso' | 'completada' | 'cancelada';
    localidad: Localidad;
    chofer?: Chofer;
    cantidad_paradas?: number;
    distancia_km?: number;
}

interface PaginationData {
    data: Ruta[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export default function RutasIndex() {
    const [rutas, setRutas] = useState<PaginationData | null>(null);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);
    const [choferes, setChoferes] = useState<Chofer[]>([]);

    // Filtros
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [localidadId, setLocalidadId] = useState('');
    const [estado, setEstado] = useState('');
    const [choferIdFilter, setChoferIdFilter] = useState('');

    const [cargando, setCargando] = useState(false);
    const [planificando, setPlanificando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        setError(null);
        try {
            const response = await axios.get('/api/rutas', {
                params: {
                    fecha,
                    localidad_id: localidadId || undefined,
                    estado: estado || undefined,
                    chofer_id: choferIdFilter || undefined,
                }
            });
            setRutas(response.data.data);
        } catch (err) {
            setError('Error al cargar las rutas');
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    const planificarRutas = async () => {
        setPlanificando(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await axios.post('/api/rutas/planificar', {
                fecha
            });
            setSuccess(response.data.message);
            setTimeout(() => cargarDatos(), 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al planificar rutas');
        } finally {
            setPlanificando(false);
        }
    };

    const handleFiltrosChange = () => {
        cargarDatos();
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

    const getEstadoTexto = (estado: string) => {
        const map: { [key: string]: string } = {
            'planificada': 'Planificada',
            'en_progreso': 'En Progreso',
            'completada': 'Completada',
            'cancelada': 'Cancelada'
        };
        return map[estado] || estado;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Rutas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Gestión de Rutas
                        </h1>
                        <Link
                            href="/rutas/create"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Nueva Ruta
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

                    {/* Filtros */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    onBlur={handleFiltrosChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Localidad
                                </label>
                                <select
                                    value={localidadId}
                                    onChange={(e) => {
                                        setLocalidadId(e.target.value);
                                    }}
                                    onBlur={handleFiltrosChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">Todas</option>
                                    {localidades.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={estado}
                                    onChange={(e) => {
                                        setEstado(e.target.value);
                                    }}
                                    onBlur={handleFiltrosChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">Todos</option>
                                    <option value="planificada">Planificada</option>
                                    <option value="en_progreso">En Progreso</option>
                                    <option value="completada">Completada</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 flex gap-2 items-end">
                                <button
                                    onClick={planificarRutas}
                                    disabled={planificando}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {planificando ? 'Planificando...' : '🚀 Planificar para ' + fecha.split('-').reverse().join('/')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Rutas */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        {cargando ? (
                            <div className="p-6 text-center text-gray-500">
                                Cargando rutas...
                            </div>
                        ) : rutas && rutas.data.length > 0 ? (
                            <>
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
                                                    Paradas
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Distancia
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {rutas.data.map((ruta) => (
                                                <tr key={ruta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                        {ruta.codigo}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.localidad?.nombre || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.chofer?.user?.name || 'Sin asignar'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {ruta.cantidad_paradas || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {(ruta.distancia_km || 0).toFixed(2)} km
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(ruta.estado)}`}>
                                                            {getEstadoTexto(ruta.estado)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm space-x-2">
                                                        <Link
                                                            href={`/rutas/${ruta.id}`}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                        >
                                                            Ver
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t dark:border-gray-600 flex justify-between items-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Mostrando {rutas.from} a {rutas.to} de {rutas.total}
                                    </div>
                                    <div className="flex gap-2">
                                        {rutas.current_page > 1 && (
                                            <button
                                                onClick={() => {
                                                    // Implementar paginación
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                            >
                                                Anterior
                                            </button>
                                        )}
                                        {rutas.current_page < rutas.last_page && (
                                            <button
                                                onClick={() => {
                                                    // Implementar paginación
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                            >
                                                Siguiente
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                No hay rutas para mostrar
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
