import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/application/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { Badge } from '@/presentation/components/ui/badge';
import {
    FileSpreadsheet,
    FileText,
    Download,
    BarChart3,
    TrendingUp,
    Filter,
    RefreshCw
} from 'lucide-react';
import { DashboardMetricas } from '@/presentation/components/Inventario/DashboardMetricas';
import { GraficosTendencias } from '@/presentation/components/Inventario/GraficosTendencias';
import type { EstadisticasMovimientos } from '@/domain/entities/movimientos-inventario';

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

    const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensual'>('semanal');
    const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);

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

    // Datos mock para estadísticas (en producción vendrían del backend)
    const [estadisticas] = useState<EstadisticasMovimientos>({
        total_movimientos: 1247,
        total_entradas: 483,
        total_salidas: 592,
        total_transferencias: 85,
        total_mermas: 87,
        total_ajustes: 25,
        valor_total_entradas: 125680.50,
        valor_total_salidas: 98750.25,
        valor_total_mermas: 8450.75,
        productos_afectados: 156,
        almacenes_activos: 8,
        movimientos_pendientes: 15, // Campo requerido que faltaba
        tendencia_semanal: [
            { fecha: '2024-01-08', entradas: 45, salidas: 62, transferencias: 8, mermas: 12 },
            { fecha: '2024-01-09', entradas: 38, salidas: 55, transferencias: 12, mermas: 7 },
            { fecha: '2024-01-10', entradas: 52, salidas: 48, transferencias: 15, mermas: 9 },
            { fecha: '2024-01-11', entradas: 41, salidas: 67, transferencias: 6, mermas: 14 },
            { fecha: '2024-01-12', entradas: 59, salidas: 71, transferencias: 11, mermas: 8 },
            { fecha: '2024-01-13', entradas: 46, salidas: 39, transferencias: 9, mermas: 13 },
            { fecha: '2024-01-14', entradas: 33, salidas: 42, transferencias: 7, mermas: 5 },
        ]
    });

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

    const handleFiltroChange = (campo: keyof FiltrosReporte, valor: string | boolean) => {
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

    const actualizarEstadisticas = async () => {
        setCargandoEstadisticas(true);
        try {
            // Simular llamada API - en producción sería una llamada real
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Aquí iría la lógica real para obtener estadísticas del backend
            // const response = await fetch('/inventario/estadisticas');
            // const data = await response.json();
            // setEstadisticas(data);

        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        } finally {
            setCargandoEstadisticas(false);
        }
    };

    const tipoReporteSeleccionado = tiposReporte.find(t => t.id === filtros.tipo_reporte);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reportes y Análisis - Inventario" />

            <div className="flex flex-col gap-6 p-4">
                {/* Header moderno */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Reportes y Análisis
                        </h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Dashboard avanzado con métricas en tiempo real y reportes detallados
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={actualizarEstadisticas}
                            disabled={cargandoEstadisticas}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${cargandoEstadisticas ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>

                        <Badge variant="secondary" className="text-xs">
                            Última actualización: {new Date().toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Badge>
                    </div>
                </div>

                {/* Navegación por pestañas */}
                <Tabs defaultValue="analytics">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="tendencias" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Tendencias
                        </TabsTrigger>
                        <TabsTrigger value="reportes" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Reportes
                        </TabsTrigger>
                    </TabsList>

                    {/* Dashboard Analytics */}
                    <TabsContent value="analytics" className="space-y-6">
                        <DashboardMetricas
                            estadisticas={estadisticas}
                        />
                    </TabsContent>

                    {/* Gráficos de Tendencias */}
                    <TabsContent value="tendencias" className="space-y-6">
                        <GraficosTendencias
                            estadisticas={estadisticas}
                            periodo={periodo}
                            onPeriodoChange={setPeriodo}
                        />
                    </TabsContent>

                    {/* Generación de Reportes */}
                    <TabsContent value="reportes" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Selección de tipo de reporte */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileSpreadsheet className="h-5 w-5" />
                                            Seleccionar Tipo de Reporte
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
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
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Filtros y generación */}
                            <div className="space-y-6">
                                {/* Filtros */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Filter className="h-5 w-5" />
                                            Filtros
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
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
                                    </CardContent>
                                </Card>

                                {/* Generar reporte */}
                                {filtros.tipo_reporte && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Download className="h-5 w-5" />
                                                Generar Reporte
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
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
                                                <Button
                                                    onClick={() => generarReporte('pdf')}
                                                    disabled={generandoReporte}
                                                    className="w-full"
                                                    variant="destructive"
                                                >
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    {generandoReporte ? 'Generando...' : 'Descargar PDF'}
                                                </Button>

                                                <Button
                                                    onClick={() => generarReporte('excel')}
                                                    disabled={generandoReporte}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                    {generandoReporte ? 'Generando...' : 'Descargar Excel'}
                                                </Button>

                                                <Button
                                                    onClick={() => generarReporte('csv')}
                                                    disabled={generandoReporte}
                                                    className="w-full"
                                                    variant="secondary"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {generandoReporte ? 'Generando...' : 'Descargar CSV'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Información adicional */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Reportes y Análisis Avanzados
                            </h3>
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Dashboard integrado con métricas en tiempo real, análisis de tendencias y generación de reportes en múltiples formatos.
                                Los datos se actualizan automáticamente y ofrecen insights profundos sobre el rendimiento del inventario.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
