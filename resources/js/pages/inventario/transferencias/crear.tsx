import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';

interface Almacen {
    id: number;
    nombre: string;
}

interface Vehiculo {
    id: number;
    placa: string;
}

interface Chofer {
    id: number;
    licencia: string;
    user: {
        name: string;
    };
}

interface CrearTransferenciaProps extends PageProps {
    almacenes: Almacen[];
    vehiculos: Vehiculo[];
    choferes: Chofer[];
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Transferencias',
        href: '/inventario/transferencias',
    },
    {
        title: 'Nueva Transferencia',
        href: '/inventario/transferencias/crear',
    },
];

export default function CrearTransferencia({ almacenes, vehiculos, choferes }: CrearTransferenciaProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva Transferencia" />
            
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Nueva Transferencia
                    </h2>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        Crear una nueva transferencia de productos entre almacenes.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Formulario de Transferencia
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                Formulario de transferencia en construcción.
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                Los datos disponibles: {almacenes.length} almacenes, {vehiculos.length} vehículos, {choferes.length} choferes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}