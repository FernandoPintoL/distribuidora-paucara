import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';

interface Permission {
    id: number;
    name: string;
    label: string;
}

interface PermissionModule {
    module: string;
    module_label: string;
    permissions: Permission[];
}

interface Props {
    rol: {
        id: number;
        name: string;
    };
    permisosActuales: number[];
    todosLosPermisos: PermissionModule[];
}

export default function EditarPermisosRol({
    rol,
    permisosActuales,
    todosLosPermisos
}: Props) {
    const [seleccionados, setSeleccionados] = useState<Set<number>>(
        new Set(permisosActuales)
    );
    const { patch, processing } = useForm();
    const [guardado, setGuardado] = useState(false);

    const handleTogglePermiso = (permisoId: number) => {
        const nuevo = new Set(seleccionados);
        if (nuevo.has(permisoId)) {
            nuevo.delete(permisoId);
        } else {
            nuevo.add(permisoId);
        }
        setSeleccionados(nuevo);
        setGuardado(false);
    };

    const handleToggleModulo = (modulo: PermissionModule) => {
        const permsEnModulo = modulo.permissions.map(p => p.id);
        const todasActivas = permsEnModulo.every(id => seleccionados.has(id));

        const nuevo = new Set(seleccionados);
        if (todasActivas) {
            permsEnModulo.forEach(id => nuevo.delete(id));
        } else {
            permsEnModulo.forEach(id => nuevo.add(id));
        }
        setSeleccionados(nuevo);
        setGuardado(false);
    };

    const guardarPermisos = () => {
        patch(route('permisos.rol.actualizar', rol.id), {
            data: { permisos: Array.from(seleccionados) },
            onSuccess: () => setGuardado(true),
        });
    };

    const contarPermisosModulo = (modulo: PermissionModule) => {
        return modulo.permissions.filter(p => seleccionados.has(p.id)).length;
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Permisos del rol ${rol.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Permisos del rol: <span className="text-blue-600">{rol.name}</span>
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Configura qué acciones pueden realizar los usuarios con este rol
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-purple-600">
                                    {seleccionados.size}
                                </p>
                                <p className="text-sm text-gray-600">permisos seleccionados</p>
                            </div>
                        </div>
                    </div>

                    {/* Mensaje de éxito */}
                    {guardado && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-green-800 font-medium">✅ Permisos del rol actualizados correctamente</p>
                        </div>
                    )}

                    {/* Atajos rápidos */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-blue-900 text-sm mb-3 font-medium">⚡ Atajos rápidos:</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    const todoIds = todosLosPermisos.flatMap(m => m.permissions.map(p => p.id));
                                    setSeleccionados(new Set(todoIds));
                                    setGuardado(false);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            >
                                Seleccionar todo
                            </button>
                            <button
                                onClick={() => {
                                    setSeleccionados(new Set());
                                    setGuardado(false);
                                }}
                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition"
                            >
                                Deseleccionar todo
                            </button>
                        </div>
                    </div>

                    {/* Módulos de Permisos */}
                    <div className="space-y-4">
                        {todosLosPermisos.map((modulo) => (
                            <div
                                key={modulo.module}
                                className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200"
                            >
                                {/* Header del módulo */}
                                <div
                                    onClick={() => handleToggleModulo(modulo)}
                                    className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={modulo.permissions.every(p =>
                                                    seleccionados.has(p.id)
                                                )}
                                                onChange={() => {}}
                                                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                                            />
                                            <span className="font-semibold text-gray-900">
                                                {modulo.module_label}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-600 font-medium">
                                            {contarPermisosModulo(modulo)} / {modulo.permissions.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Permisos del módulo */}
                                <div className="px-6 py-4 space-y-3 bg-white">
                                    {modulo.permissions.map((permiso) => (
                                        <label
                                            key={permiso.id}
                                            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={seleccionados.has(permiso.id)}
                                                onChange={() => handleTogglePermiso(permiso.id)}
                                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700">{permiso.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={guardarPermisos}
                            disabled={processing || guardado}
                            className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                            {processing ? 'Guardando...' : guardado ? '✓ Guardado' : 'Guardar Permisos'}
                        </button>
                        <a
                            href={route('roles.index')}
                            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
                        >
                            Volver
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
