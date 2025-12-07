import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import axios from 'axios';

interface Usuario {
    id: number;
    name: string;
    email: string;
    roles?: string[];
    permissions_count?: number;
}

interface Rol {
    id: number;
    name: string;
    display_name: string;
    permissions_count?: number;
}

interface AuditRecord {
    id: number;
    admin: { id: number; name: string; email: string };
    target_type: string;
    target_id: number;
    target_name: string;
    action: string;
    descripcion: string;
    permisos_changed: number;
    ip_address: string;
    created_at: string;
}

type TabType = 'usuarios' | 'roles' | 'historial';

export default function PermisosIndex() {
    const [activeTab, setActiveTab] = useState<TabType>('usuarios');
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [historial, setHistorial] = useState<AuditRecord[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estados de búsqueda
    const [searchUsuarios, setSearchUsuarios] = useState('');
    const [searchRoles, setSearchRoles] = useState('');

    // Estados de bulk select
    const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
    const [todosSeleccionados, setTodosSeleccionados] = useState(false);
    const [mostrarBulkEdit, setMostrarBulkEdit] = useState(false);
    const [bulkEditGuardando, setBulkEditGuardando] = useState(false);

    // Estados de historial
    const [filtroHistorialTipo, setFiltroHistorialTipo] = useState<string | null>(null);
    const [estadisticas, setEstadisticas] = useState<any>(null);

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, [activeTab, searchUsuarios, searchRoles]);

    const cargarDatos = async () => {
        setCargando(true);
        setError(null);
        try {
            if (activeTab === 'usuarios') {
                const response = await axios.get('/api/usuarios', {
                    params: { search: searchUsuarios || undefined }
                });
                setUsuarios(response.data.data || []);
            } else if (activeTab === 'roles') {
                const response = await axios.get('/api/roles', {
                    params: { search: searchRoles || undefined }
                });
                setRoles(response.data.data || []);
            } else if (activeTab === 'historial') {
                const response = await axios.get('/api/permisos/historial', {
                    params: { target_type: filtroHistorialTipo || undefined }
                });
                setHistorial(response.data.data || []);
                setEstadisticas(response.data.estadisticas);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cargar datos');
            console.error('Error cargando datos:', err);
        } finally {
            setCargando(false);
        }
    };

    const getRoleColor = (roleName: string) => {
        const colors: Record<string, string> = {
            'admin': 'bg-red-100 text-red-800',
            'manager': 'bg-blue-100 text-blue-800',
            'manager_de_ruta': 'bg-indigo-100 text-indigo-800',
            'preventista': 'bg-green-100 text-green-800',
            'cobrador': 'bg-yellow-100 text-yellow-800',
            'chofer': 'bg-purple-100 text-purple-800',
            'cliente': 'bg-gray-100 text-gray-800',
            'client': 'bg-gray-100 text-gray-800',
        };
        return colors[roleName.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    // Funciones de bulk select
    const toggleSeleccion = (id: number) => {
        const nuevo = new Set(seleccionados);
        if (nuevo.has(id)) {
            nuevo.delete(id);
        } else {
            nuevo.add(id);
        }
        setSeleccionados(nuevo);
        setTodosSeleccionados(false);
    };

    const toggleTodos = () => {
        if (todosSeleccionados) {
            setSeleccionados(new Set());
            setTodosSeleccionados(false);
        } else {
            const todas = new Set(activeTab === 'usuarios' ? usuarios.map(u => u.id) : roles.map(r => r.id));
            setSeleccionados(todas);
            setTodosSeleccionados(true);
        }
    };

    const ejecutarBulkEdit = async (tipo: string, permisos: number[], accion: 'reemplazar' | 'agregar' | 'eliminar') => {
        setBulkEditGuardando(true);
        try {
            const response = await axios.post('/api/permisos/bulk-edit', {
                tipo: activeTab,
                ids: Array.from(seleccionados),
                permisos: permisos,
                accion: accion,
            });

            setSuccess(response.data.message);
            setMostrarBulkEdit(false);
            setSeleccionados(new Set());
            setTodosSeleccionados(false);

            // Recargar datos
            setTimeout(() => cargarDatos(), 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error en bulk edit');
        } finally {
            setBulkEditGuardando(false);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSeleccionados(new Set());
        setTodosSeleccionados(false);
        setMostrarBulkEdit(false);
        setSearchUsuarios('');
        setSearchRoles('');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Centro de Permisos y Roles" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8 mb-8 shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-bold mb-2">🔐 Centro de Permisos</h1>
                                <p className="text-purple-100">
                                    Panel unificado con búsqueda, edición en lote e historial de cambios
                                </p>
                            </div>
                            <a
                                href={route('dashboard')}
                                className="px-4 py-2 bg-white text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition"
                            >
                                ← Volver
                            </a>
                        </div>
                    </div>

                    {/* Mensajes */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800">❌ {error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-green-800">✅ {success}</p>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => handleTabChange('usuarios')}
                                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                                    activeTab === 'usuarios'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                👥 Usuarios
                            </button>
                            <button
                                onClick={() => handleTabChange('roles')}
                                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                                    activeTab === 'roles'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                🎭 Roles
                            </button>
                            <button
                                onClick={() => handleTabChange('historial')}
                                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                                    activeTab === 'historial'
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                📋 Historial y Auditoría
                            </button>
                        </div>
                    </div>

                    {/* CONTENIDO: USUARIOS */}
                    {activeTab === 'usuarios' && (
                        <>
                            {/* Barra de búsqueda y acciones */}
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🔍 Buscar usuario
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nombre o email..."
                                            value={searchUsuarios}
                                            onChange={(e) => setSearchUsuarios(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    {seleccionados.size > 0 && (
                                        <button
                                            onClick={() => setMostrarBulkEdit(true)}
                                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                        >
                                            ⚡ Editar {seleccionados.size} seleccionados
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Modal de Bulk Edit */}
                            {mostrarBulkEdit && (
                                <BulkEditModal
                                    tipo="usuario"
                                    cantidad={seleccionados.size}
                                    onClose={() => setMostrarBulkEdit(false)}
                                    onSubmit={ejecutarBulkEdit}
                                    cargando={bulkEditGuardando}
                                />
                            )}

                            {/* Tabla de usuarios */}
                            {cargando ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin text-purple-600">
                                        <div className="text-3xl">⏳</div>
                                    </div>
                                    <p className="text-gray-600 mt-2">Cargando...</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                                    {usuarios.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <p className="text-lg">No hay usuarios</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left">
                                                            <input
                                                                type="checkbox"
                                                                checked={todosSeleccionados}
                                                                onChange={toggleTodos}
                                                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                                            />
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Usuario
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Email
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Roles
                                                        </th>
                                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                                                            Permisos
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                                            Acciones
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {usuarios.map((usuario) => (
                                                        <tr key={usuario.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={seleccionados.has(usuario.id)}
                                                                    onChange={() => toggleSeleccion(usuario.id)}
                                                                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-medium text-gray-900">{usuario.name}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-sm text-gray-600">{usuario.email}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {usuario.roles && usuario.roles.length > 0 ? (
                                                                        usuario.roles.map((role) => (
                                                                            <span
                                                                                key={role}
                                                                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                                                                    role
                                                                                )}`}
                                                                            >
                                                                                {role}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-sm text-gray-500 italic">
                                                                            Sin roles
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                                    {usuario.permissions_count || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <a
                                                                    href={route('permisos.usuario.editar', {
                                                                        user: usuario.id,
                                                                    })}
                                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
                                                                >
                                                                    ✏️ Editar
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* CONTENIDO: ROLES */}
                    {activeTab === 'roles' && (
                        <>
                            {/* Barra de búsqueda */}
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            🔍 Buscar rol
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nombre del rol..."
                                            value={searchRoles}
                                            onChange={(e) => setSearchRoles(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    {seleccionados.size > 0 && (
                                        <button
                                            onClick={() => setMostrarBulkEdit(true)}
                                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                        >
                                            ⚡ Editar {seleccionados.size} seleccionados
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Modal de Bulk Edit */}
                            {mostrarBulkEdit && (
                                <BulkEditModal
                                    tipo="rol"
                                    cantidad={seleccionados.size}
                                    onClose={() => setMostrarBulkEdit(false)}
                                    onSubmit={ejecutarBulkEdit}
                                    cargando={bulkEditGuardando}
                                />
                            )}

                            {/* Tabla de roles */}
                            {cargando ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin text-blue-600">
                                        <div className="text-3xl">⏳</div>
                                    </div>
                                    <p className="text-gray-600 mt-2">Cargando...</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                                    {roles.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <p className="text-lg">No hay roles</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left">
                                                            <input
                                                                type="checkbox"
                                                                checked={todosSeleccionados}
                                                                onChange={toggleTodos}
                                                                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                                            />
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Rol
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Descripción
                                                        </th>
                                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                                                            Permisos
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                                            Acciones
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {roles.map((rol) => (
                                                        <tr key={rol.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={seleccionados.has(rol.id)}
                                                                    onChange={() => toggleSeleccion(rol.id)}
                                                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-medium text-gray-900">{rol.name}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-sm text-gray-600">
                                                                    {rol.display_name || '-'}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                                    {rol.permissions_count || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <a
                                                                    href={route('permisos.rol.editar', {
                                                                        role: rol.id,
                                                                    })}
                                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                                                                >
                                                                    ✏️ Editar
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* CONTENIDO: HISTORIAL */}
                    {activeTab === 'historial' && (
                        <>
                            {/* Estadísticas */}
                            {estadisticas && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <p className="text-gray-600 text-sm">Total de cambios</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {estadisticas.total_cambios}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <p className="text-gray-600 text-sm">Cambios hoy</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {estadisticas.cambios_hoy}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <p className="text-gray-600 text-sm">Esta semana</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {estadisticas.cambios_esta_semana}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <p className="text-gray-600 text-sm">Este mes</p>
                                        <p className="text-3xl font-bold text-orange-600">
                                            {estadisticas.cambios_este_mes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Tabla de historial */}
                            {cargando ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin text-purple-600">
                                        <div className="text-3xl">⏳</div>
                                    </div>
                                    <p className="text-gray-600 mt-2">Cargando historial...</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                                    {historial.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <p className="text-lg">No hay registros de auditoría</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Administrador
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Objetivo
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Descripción
                                                        </th>
                                                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                                                            Cambios
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                            Fecha
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {historial.map((registro) => (
                                                        <tr key={registro.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">
                                                                        {registro.admin.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {registro.ip_address}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">
                                                                        {registro.target_name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 capitalize">
                                                                        {registro.target_type}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="text-sm text-gray-600">
                                                                    {registro.descripcion}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
                                                                    {registro.permisos_changed}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {new Date(registro.created_at).toLocaleString('es-ES')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex gap-4">
                            <div className="text-2xl">ℹ️</div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-2">Características del panel:</h3>
                                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                                    <li>
                                        <strong>🔍 Búsqueda:</strong> Filtra usuarios o roles por nombre/email
                                    </li>
                                    <li>
                                        <strong>☑️ Bulk Edit:</strong> Selecciona múltiples elementos y modifica sus
                                        permisos en una sola acción
                                    </li>
                                    <li>
                                        <strong>📋 Historial:</strong> Visualiza todos los cambios de permisos con
                                        quién los hizo y cuándo
                                    </li>
                                    <li>
                                        <strong>📊 Estadísticas:</strong> Monitorea la actividad de cambios por período
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Componente Modal para Bulk Edit
interface BulkEditModalProps {
    tipo: 'usuario' | 'rol';
    cantidad: number;
    onClose: () => void;
    onSubmit: (tipo: string, permisos: number[], accion: string) => Promise<void>;
    cargando: boolean;
}

function BulkEditModal({ tipo, cantidad, onClose, onSubmit, cargando }: BulkEditModalProps) {
    const [accion, setAccion] = useState<'reemplazar' | 'agregar' | 'eliminar'>('reemplazar');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Editar {cantidad} {tipo === 'usuario' ? 'usuarios' : 'roles'}
                </h2>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Para esta demostración, mostraremos el flujo. Implementa la selección de
                        permisos según tu diseño.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Acción:</label>
                    <select
                        value={accion}
                        onChange={(e) => setAccion(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="reemplazar">Reemplazar todos los permisos</option>
                        <option value="agregar">Agregar estos permisos</option>
                        <option value="eliminar">Eliminar estos permisos</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                        disabled={cargando}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSubmit(tipo, [], accion)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                        disabled={cargando}
                    >
                        {cargando ? 'Guardando...' : 'Aplicar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
