// Presentation Layer: Enhanced Movimientos Page
// Página principal de movimientos de inventario con arquitectura de 3 capas

import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import MovimientosTable from '@/presentation/components/Inventario/MovimientosTable';
import MovimientosFilters from '@/presentation/components/Inventario/MovimientosFilters';
import MovimientosStats from '@/presentation/components/Inventario/MovimientosStats';
import { Button } from '@/presentation/components/ui/button';
import { Plus, BarChart3, List } from 'lucide-react';
import type {
    MovimientoInventario,
    MovimientoInventarioFilters
} from '@/domain/entities/movimientos-inventario';
import type { Pagination } from '@/domain/entities/shared';
import { MovimientosInventarioService } from '@/infrastructure/services/movimientos-inventario.service';

interface MovimientosStats {
    total_movimientos: number;
    total_entradas: number;
    total_salidas: number;
    total_transferencias: number;
    valor_total_entradas?: number;
    valor_total_salidas?: number;
    productos_afectados: number;
    almacenes_activos: number;
}

interface PageProps extends InertiaPageProps {
    movimientos: Pagination<MovimientoInventario>;
    filtros: MovimientoInventarioFilters;
    stats: MovimientosStats;
    almacenes: Array<{ id: number; nombre: string }>;
    productos: Array<{ id: number; nombre: string }>;
    usuarios: Array<{ id: number; name: string }>;
}

const MovimientosInventarioPage: React.FC<PageProps> = ({
    movimientos,
    filtros,
    stats,
    almacenes,
    productos,
    usuarios
}) => {
    const [activeTab, setActiveTab] = useState<'lista' | 'estadisticas'>('lista');
    const service = new MovimientosInventarioService();

    const breadcrumbs = [
        {
            title: 'Inventario',
            href: '/inventario',
        },
        {
            title: 'Movimientos',
            href: '/inventario/movimientos',
        },
    ];

    const handleCreateAjuste = () => {
        service.goToCreate();
    };

    const handleGoToReportes = () => {
        service.goToReportes();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Movimientos de Inventario" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Movimientos de Inventario
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Consulta y analiza todos los movimientos de tu inventario
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleGoToReportes}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Reportes
                        </Button>

                        <Button onClick={handleCreateAjuste}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajustar Stock
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <MovimientosFilters
                    filters={filtros}
                    almacenes={almacenes}
                    productos={productos}
                    usuarios={usuarios}
                />

                {/* Tabs navegación */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('lista')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'lista'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Lista de Movimientos
                        </button>
                        <button
                            onClick={() => setActiveTab('estadisticas')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'estadisticas'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Estadísticas
                        </button>
                    </nav>
                </div>

                {/* Contenido de las tabs */}
                {activeTab === 'lista' && (
                    <div className="space-y-4">
                        {/* Resumen rápido */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Total Movimientos
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {movimientos.total?.toLocaleString('es-ES') || 0}
                                        </p>
                                    </div>
                                    <div className="text-2xl">📦</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Entradas Hoy
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            +{stats.total_entradas.toLocaleString('es-ES')}
                                        </p>
                                    </div>
                                    <div className="text-2xl">⬆️</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Salidas Hoy
                                        </p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            -{stats.total_salidas.toLocaleString('es-ES')}
                                        </p>
                                    </div>
                                    <div className="text-2xl">⬇️</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Transferencias
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {stats.total_transferencias.toLocaleString('es-ES')}
                                        </p>
                                    </div>
                                    <div className="text-2xl">🔄</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de movimientos */}
                        <MovimientosTable
                            movimientos={movimientos}
                            filters={filtros}
                        />
                    </div>
                )}

                {activeTab === 'estadisticas' && (
                    <MovimientosStats
                        stats={stats}
                        recientes={movimientos.data.slice(0, 5)}
                    />
                )}
            </div>
        </AppLayout>
    );
};

export default MovimientosInventarioPage;
