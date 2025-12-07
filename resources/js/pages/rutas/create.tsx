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

interface FormData {
    localidad_id: string;
    chofer_id: string;
    fecha_ruta: string;
    detalles: Array<{
        cliente_id: string;
        secuencia: string;
        direccion?: string;
    }>;
}

export default function RutasCreate() {
    const [localidades, setLocalidades] = useState<Localidad[]>([]);
    const [choferes, setChoferes] = useState<Chofer[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        localidad_id: '',
        chofer_id: '',
        fecha_ruta: new Date().toISOString().split('T')[0],
        detalles: [{ cliente_id: '', secuencia: '1', direccion: '' }],
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Cargar localidades y choferes en paralelo
            const [localidadesRes, choferesRes] = await Promise.all([
                axios.get('/api/localidades'),
                axios.get('/api/choferes'),
            ]);

            setLocalidades(localidadesRes.data.data || []);
            setChoferes(choferesRes.data.data || []);
        } catch (err) {
            setError('Error al cargar datos');
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleDetalleChange = (index: number, field: string, value: string) => {
        const newDetalles = [...formData.detalles];
        newDetalles[index] = {
            ...newDetalles[index],
            [field]: value,
        };
        setFormData(prev => ({
            ...prev,
            detalles: newDetalles,
        }));
    };

    const agregarDetalle = () => {
        const newSecuencia = formData.detalles.length + 1;
        setFormData(prev => ({
            ...prev,
            detalles: [
                ...prev.detalles,
                { cliente_id: '', secuencia: newSecuencia.toString(), direccion: '' },
            ],
        }));
    };

    const eliminarDetalle = (index: number) => {
        if (formData.detalles.length === 1) {
            setError('Debe haber al menos un detalle');
            return;
        }
        setFormData(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setGuardando(true);

        // Validación básica
        if (!formData.localidad_id || !formData.chofer_id || !formData.fecha_ruta) {
            setError('Por favor completa los campos requeridos');
            setGuardando(false);
            return;
        }

        if (formData.detalles.some(d => !d.cliente_id || !d.secuencia)) {
            setError('Por favor completa todos los detalles');
            setGuardando(false);
            return;
        }

        try {
            const response = await axios.post('/rutas', formData);
            // Redirigir a la lista de rutas
            router.push('/rutas');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al crear la ruta');
            console.error(err);
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <AuthenticatedLayout>
                <Head title="Nueva Ruta" />
                <div className="py-12 text-center">Cargando datos...</div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Ruta" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/rutas"
                            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
                        >
                            ← Volver a Rutas
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Crear Nueva Ruta
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Ingresa los datos de la ruta que deseas crear manualmente
                        </p>
                    </div>

                    {/* Mensajes */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información General */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Información General
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Localidad <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.localidad_id}
                                        onChange={(e) => handleInputChange('localidad_id', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="">Selecciona una localidad</option>
                                        {localidades.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Chofer <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.chofer_id}
                                        onChange={(e) => handleInputChange('chofer_id', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="">Selecciona un chofer</option>
                                        {choferes.map((chofer) => (
                                            <option key={chofer.id} value={chofer.id}>
                                                {chofer.user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Fecha Ruta <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.fecha_ruta}
                                        onChange={(e) => handleInputChange('fecha_ruta', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Detalles de la Ruta */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Paradas ({formData.detalles.length})
                                </h2>
                                <button
                                    type="button"
                                    onClick={agregarDetalle}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                >
                                    + Agregar Parada
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.detalles.map((detalle, index) => (
                                    <div
                                        key={index}
                                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Parada #{index + 1}
                                            </h3>
                                            {formData.detalles.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarDetalle(index)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Secuencia
                                                </label>
                                                <input
                                                    type="number"
                                                    value={detalle.secuencia}
                                                    onChange={(e) => handleDetalleChange(index, 'secuencia', e.target.value)}
                                                    required
                                                    className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Cliente ID
                                                </label>
                                                <input
                                                    type="number"
                                                    value={detalle.cliente_id}
                                                    onChange={(e) => handleDetalleChange(index, 'cliente_id', e.target.value)}
                                                    placeholder="ID del cliente"
                                                    required
                                                    className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Dirección (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={detalle.direccion || ''}
                                                    onChange={(e) => handleDetalleChange(index, 'direccion', e.target.value)}
                                                    placeholder="Dirección de entrega"
                                                    className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={guardando}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {guardando ? 'Guardando...' : 'Crear Ruta'}
                            </button>
                            <Link
                                href="/rutas"
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
