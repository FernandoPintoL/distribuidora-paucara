import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/hooks/use-auth';

interface Almacen {
    id: number;
    nombre: string;
}

interface Categoria {
    id: number;
    nombre: string;
}

interface PageProps extends InertiaPageProps {
    almacenes: Almacen[];
    categorias: Categoria[];
}

interface FiltrosReporte {
    tipo_reporte: string;
    almacen_id: string;
    categoria_id: string;
    fecha_desde: string;
    fecha_hasta: string;
    incluir_sin_movimientos: boolean;
    solo_con_stock: boolean;
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Reportes',
        href: '/inventario/reportes',
    },
];

const tiposReporte = [
    {
        id: 'stock_actual',
        nombre: 'Stock Actual',
        descripcion: 'Reporte completo del stock actual por almacén y producto',
        icon: '📦'
    },
    {
        id: 'movimientos',
        nombre: 'Movimientos de Inventario',
        descripcion: 'Historial detallado de entradas, salidas y ajustes',
        icon: '📈'
    },
    {
        id: 'stock_valorizado',
        nombre: 'Stock Valorizado',
        descripcion: 'Reporte del stock actual con valores monetarios',
        icon: '💰'
    },
    {
        id: 'productos_bajo_minimo',
        nombre: 'Productos Bajo Mínimo',
        descripcion: 'Productos que han alcanzado su stock mínimo',
        icon: '⚠️'
    },
    {
        id: 'productos_sin_movimiento',
        nombre: 'Productos Sin Movimiento',
        descripcion: 'Productos que no han tenido movimientos en un período',
        icon: '🔍'
    },
    {
        id: 'vencimientos',
        nombre: 'Reporte de Vencimientos',
        descripcion: 'Productos próximos a vencer o ya vencidos',
        icon: '📅'
    },
    {
        id: 'kardex',
        nombre: 'Kardex de Producto',
        descripcion: 'Historial completo de un producto específico',
        icon: '📋'
    },
    {
        id: 'rotacion_inventario',
        nombre: 'Rotación de Inventario',
        descripción: 'Análisis de la rotación de productos por período',
        icon: '🔄'
    }
];

export default function Reportes() {
    const { props } = usePage<PageProps>();
    const { almacenes, categorias } = props;
    const { can } = useAuth();

    const [filtros, setFiltros] = useState<FiltrosReporte>({
        tipo_reporte: '',
        almacen_id: '',
        categoria_id: '',
        fecha_desde: '',
        fecha_hasta: '',
        incluir_sin_movimientos: false,
        solo_con_stock: true
    });

    const [generandoReporte, setGenerandoReporte] = useState(false);

    if (!can('inventario.reportes')) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Acceso Denegado" />
                <div className="text-center py-12">
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No tienes permisos para acceder a esta página
                    </h3>
                </div>
            </AppLayout>
        );
    }

    const handleFiltroChange = (campo: keyof FiltrosReporte, valor: any) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const generarReporte = async (formato: 'pdf' | 'excel' | 'csv') => {
        if (!filtros.tipo_reporte) {
            alert('Por favor selecciona un tipo de reporte');
            return;
        }

        setGenerandoReporte(true);
        try {
            const params = new URLSearchParams({
                ...filtros,
                formato,
                incluir_sin_movimientos: filtros.incluir_sin_movimientos.toString(),
                solo_con_stock: filtros.solo_con_stock.toString()
            });

            const response = await fetch(`/inventario/reportes/generar?${params}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `reporte_inventario_${filtros.tipo_reporte}_${new Date().toISOString().split('T')[0]}.${formato}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Error al generar el reporte');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar el reporte');
        } finally {
            setGenerandoReporte(false);
        }
    };

    const tipoReporteSeleccionado = tiposReporte.find(t => t.id === filtros.tipo_reporte);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reportes de Inventario" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Reportes de Inventario
                        </h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Genera reportes detallados sobre el estado de tu inventario
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Selección de tipo de reporte */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Seleccionar Tipo de Reporte
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {tiposReporte.map((tipo) => (
                                        <div
                                            key={tipo.id}
                                            onClick={() => handleFiltroChange('tipo_reporte', tipo.id)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filtros.tipo_reporte === tipo.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{tipo.icon}</span>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {tipo.nombre}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {tipo.descripcion}
                                                    </p>
                                                </div>
                                                {filtros.tipo_reporte === tipo.id && (
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros y generación */}
                    <div className="space-y-6">
                        {/* Filtros */}
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Filtros
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Almacén */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Almacén
                                    </label>
                                    <select
                                        value={filtros.almacen_id}
                                        onChange={(e) => handleFiltroChange('almacen_id', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                                    >
                                        <option value="">Todos los almacenes</option>
                                        {almacenes.map((almacen) => (
                                            <option key={almacen.id} value={almacen.id}>
                                                {almacen.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Categoría */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Categoría
                                    </label>
                                    <select
                                        value={filtros.categoria_id}
                                        onChange={(e) => handleFiltroChange('categoria_id', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                                    >
                                        <option value="">Todas las categorías</option>
                                        {categorias.map((categoria) => (
                                            <option key={categoria.id} value={categoria.id}>
                                                {categoria.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Fechas */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Desde
                                        </label>
                                        <input
                                            type="date"
                                            value={filtros.fecha_desde}
                                            onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Hasta
                                        </label>
                                        <input
                                            type="date"
                                            value={filtros.fecha_hasta}
                                            onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Opciones adicionales */}
                                <div className="space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filtros.solo_con_stock}
                                            onChange={(e) => handleFiltroChange('solo_con_stock', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            Solo productos con stock
                                        </span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filtros.incluir_sin_movimientos}
                                            onChange={(e) => handleFiltroChange('incluir_sin_movimientos', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            Incluir sin movimientos
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Generar reporte */}
                        {filtros.tipo_reporte && (
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        Generar Reporte
                                    </h3>
                                </div>
                                <div className="p-6">
                                    {tipoReporteSeleccionado && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">{tipoReporteSeleccionado.icon}</span>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                    {tipoReporteSeleccionado.nombre}
                                                </h4>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {tipoReporteSeleccionado.descripcion}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => generarReporte('pdf')}
                                            disabled={generandoReporte}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            {generandoReporte ? 'Generando...' : 'Descargar PDF'}
                                        </button>

                                        <button
                                            onClick={() => generarReporte('excel')}
                                            disabled={generandoReporte}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            {generandoReporte ? 'Generando...' : 'Descargar Excel'}
                                        </button>

                                        <button
                                            onClick={() => generarReporte('csv')}
                                            disabled={generandoReporte}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            {generandoReporte ? 'Generando...' : 'Descargar CSV'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Información */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Información sobre Reportes
                            </h3>
                            <ul className="mt-1 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• Los reportes se generan en tiempo real con los datos actuales</li>
                                <li>• PDF: Ideal para impresión y presentaciones</li>
                                <li>• Excel: Perfecto para análisis y manipulación de datos</li>
                                <li>• CSV: Compatible con cualquier sistema de análisis</li>
                                <li>• Los reportes grandes pueden tardar unos segundos en generarse</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
