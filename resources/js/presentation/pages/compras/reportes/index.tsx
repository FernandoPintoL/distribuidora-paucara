import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Download,
    Calendar,
    DollarSign,
    Package,
    Users,
    PieChart,
    LineChart,
    FileText,
    Filter,
    RefreshCw
} from 'lucide-react';
import type { Proveedor } from '@/domain/entities/proveedores';
import type { Moneda } from '@/domain/entities/monedas';

// Interfaces para reportes
interface ResumenComprasPorPeriodo {
    periodo: string;
    total_compras: number;
    cantidad_compras: number;
    promedio_compra: number;
    variacion_anterior: number;
}

interface ComprasPorProveedor {
    proveedor: Proveedor;
    total_compras: number;
    cantidad_compras: number;
    promedio_compra: number;
    porcentaje_total: number;
    ultima_compra: string;
}

interface ComprasPorCategoria {
    categoria: string;
    total_compras: number;
    cantidad_compras: number;
    porcentaje_total: number;
}

interface EstadisticasGenerales {
    total_compras_periodo: number;
    cantidad_compras_periodo: number;
    promedio_compra_periodo: number;
    variacion_mes_anterior: number;
    proveedor_principal: Proveedor;
    categoria_principal: string;
    mes_mayor_compra: string;
}

interface TendenciasCompras {
    mes: string;
    total: number;
    cantidad: number;
    promedio: number;
}

interface Props {
    estadisticas_generales: EstadisticasGenerales;
    resumen_por_periodo: ResumenComprasPorPeriodo[];
    compras_por_proveedor: ComprasPorProveedor[];
    compras_por_categoria: ComprasPorCategoria[];
    tendencias_mensuales: TendenciasCompras[];
    proveedores: Proveedor[];
    monedas: Moneda[];
    filtros: {
        fecha_inicio?: string;
        fecha_fin?: string;
        proveedor_id?: string;
        moneda_id?: string;
        tipo_reporte?: string;
    };
}

const ReportesCompras: React.FC<Props> = ({
    estadisticas_generales,
    resumen_por_periodo,
    compras_por_proveedor,
    compras_por_categoria,
    tendencias_mensuales,
    proveedores,
    monedas,
    filtros
}) => {
    const [filtroLocal, setFiltroLocal] = useState(filtros || {
        fecha_inicio: '',
        fecha_fin: '',
        proveedor_id: '',
        moneda_id: '',
        tipo_reporte: ''
    });
    const [cargandoReporte, setCargandoReporte] = useState(false);

    // Valores por defecto para estadísticas generales
    const estadisticasPorDefecto: EstadisticasGenerales = {
        total_compras_periodo: 0,
        cantidad_compras_periodo: 0,
        promedio_compra_periodo: 0,
        variacion_mes_anterior: 0,
        proveedor_principal: { id: 0, nombre: 'N/A' } as Proveedor,
        categoria_principal: 'N/A',
        mes_mayor_compra: 'N/A'
    };

    const estadisticasSeguras = estadisticas_generales || estadisticasPorDefecto;

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPercentage = (value: number): string => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    const aplicarFiltros = () => {
        setCargandoReporte(true);
        const params = new URLSearchParams();

        Object.entries(filtroLocal).forEach(([key, value]) => {
            if (value && value !== '') {
                params.set(key, value);
            }
        });

        window.location.href = `/compras/reportes?${params.toString()}`;
    };

    const exportarReporte = (formato: 'pdf' | 'excel') => {
        setCargandoReporte(true);
        const params = new URLSearchParams();

        Object.entries(filtroLocal).forEach(([key, value]) => {
            if (value && value !== '') {
                params.set(key, value);
            }
        });

        params.set('formato', formato);
        window.open(`/compras/reportes/exportar?${params.toString()}`, '_blank');
        setCargandoReporte(false);
    };

    const getVariacionColor = (variacion: number) => {
        if (variacion > 0) return 'text-green-600';
        if (variacion < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getVariacionIcon = (variacion: number) => {
        if (variacion > 0) return <TrendingUp className="w-4 h-4" />;
        if (variacion < 0) return <TrendingDown className="w-4 h-4" />;
        return null;
    };

    return (
        <AppLayout>
            <Head title="Reportes de Compras" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Reportes de Compras
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Análisis detallado de las compras y tendencias del negocio
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => exportarReporte('excel')}
                            disabled={cargandoReporte}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Excel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => exportarReporte('pdf')}
                            disabled={cargandoReporte}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Filter className="w-5 h-5 mr-2" />
                            Filtros de Reporte
                        </CardTitle>
                        <CardDescription>
                            Personaliza el período y criterios para generar el reporte
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Fecha Inicio
                                </label>
                                <Input
                                    type="date"
                                    value={filtroLocal.fecha_inicio || ''}
                                    onChange={(e) => setFiltroLocal(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Fecha Fin
                                </label>
                                <Input
                                    type="date"
                                    value={filtroLocal.fecha_fin || ''}
                                    onChange={(e) => setFiltroLocal(prev => ({ ...prev, fecha_fin: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Proveedor
                                </label>
                                <Select
                                    value={filtroLocal.proveedor_id || 'all'}
                                    onValueChange={(value) => setFiltroLocal(prev => ({ ...prev, proveedor_id: value === 'all' ? '' : value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los proveedores" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los proveedores</SelectItem>
                                        {(proveedores || [])
                                            .filter(proveedor => proveedor.id && Number(proveedor.id) > 0)
                                            .map((proveedor) => {
                                                const valueId = String(proveedor.id).trim();
                                                return valueId !== '' ? (
                                                    <SelectItem key={proveedor.id} value={valueId}>
                                                        {proveedor.nombre}
                                                    </SelectItem>
                                                ) : null;
                                            })
                                            .filter(Boolean)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Moneda
                                </label>
                                <Select
                                    value={filtroLocal.moneda_id || 'all'}
                                    onValueChange={(value) => setFiltroLocal(prev => ({ ...prev, moneda_id: value === 'all' ? '' : value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las monedas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las monedas</SelectItem>
                                        {(monedas || [])
                                            .filter(moneda => moneda.id && Number(moneda.id) > 0)
                                            .map((moneda) => {
                                                const valueId = String(moneda.id).trim();
                                                return valueId !== '' ? (
                                                    <SelectItem key={moneda.id} value={valueId}>
                                                        {moneda.nombre} ({moneda.codigo})
                                                    </SelectItem>
                                                ) : null;
                                            })
                                            .filter(Boolean)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-4">
                            <Button
                                onClick={aplicarFiltros}
                                disabled={cargandoReporte}
                            >
                                {cargandoReporte ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                )}
                                Generar Reporte
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Estadísticas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(estadisticasSeguras.total_compras_periodo)}
                            </div>
                            <div className={`flex items-center text-xs ${getVariacionColor(estadisticasSeguras.variacion_mes_anterior)}`}>
                                {getVariacionIcon(estadisticasSeguras.variacion_mes_anterior)}
                                <span className="ml-1">
                                    {formatPercentage(estadisticasSeguras.variacion_mes_anterior)} vs mes anterior
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cantidad Compras</CardTitle>
                            <Package className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {estadisticasSeguras.cantidad_compras_periodo}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Promedio: {formatCurrency(estadisticasSeguras.promedio_compra_periodo)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Proveedor Principal</CardTitle>
                            <Users className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">
                                {estadisticasSeguras.proveedor_principal?.nombre || 'N/A'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Mayor volumen de compras
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mejor Mes</CardTitle>
                            <Calendar className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">
                                {estadisticasSeguras.mes_mayor_compra || 'N/A'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Mes con mayores compras
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs de Reportes */}
                <Tabs defaultValue="tendencias" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
                        <TabsTrigger value="proveedores">Por Proveedores</TabsTrigger>
                        <TabsTrigger value="categorias">Por Categorías</TabsTrigger>
                        <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
                    </TabsList>

                    {/* Tab Tendencias */}
                    <TabsContent value="tendencias">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <LineChart className="w-5 h-5 mr-2" />
                                    Tendencias Mensuales
                                </CardTitle>
                                <CardDescription>
                                    Evolución de las compras a lo largo del tiempo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(tendencias_mensuales || []).map((tendencia, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{tendencia.mes}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {tendencia.cantidad} compras
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">
                                                    {formatCurrency(tendencia.total)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Promedio: {formatCurrency(tendencia.promedio)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Proveedores */}
                    <TabsContent value="proveedores">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    Análisis por Proveedores
                                </CardTitle>
                                <CardDescription>
                                    Ranking de proveedores por volumen de compras
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Proveedor
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Total Compras
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Cantidad
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Promedio
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    % Total
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Última Compra
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {(compras_por_proveedor || []).map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {item.proveedor.nombre}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {item.proveedor.nit}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(item.total_compras)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {item.cantidad_compras}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {formatCurrency(item.promedio_compra)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant="outline">
                                                            {item.porcentaje_total.toFixed(1)}%
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDate(item.ultima_compra)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Categorías */}
                    <TabsContent value="categorias">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChart className="w-5 h-5 mr-2" />
                                    Análisis por Categorías
                                </CardTitle>
                                <CardDescription>
                                    Distribución de compras por tipo de producto
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(compras_por_categoria || []).map((categoria, index) => (
                                        <div key={index} className="p-4 border rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-lg">{categoria.categoria}</h4>
                                                <Badge variant="secondary">
                                                    {categoria.porcentaje_total.toFixed(1)}%
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="font-medium">
                                                        {formatCurrency(categoria.total_compras)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Cantidad:</span>
                                                    <span className="font-medium">{categoria.cantidad_compras}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${categoria.porcentaje_total}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Comparativo */}
                    <TabsContent value="comparativo">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-2" />
                                    Análisis Comparativo por Período
                                </CardTitle>
                                <CardDescription>
                                    Comparación de rendimiento entre diferentes períodos
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Período
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Total Compras
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Cantidad
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Promedio
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Variación
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {(resumen_por_periodo || []).map((periodo, index) => (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                        {periodo.periodo}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {formatCurrency(periodo.total_compras)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {periodo.cantidad_compras}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {formatCurrency(periodo.promedio_compra)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className={`flex items-center ${getVariacionColor(periodo.variacion_anterior)}`}>
                                                            {getVariacionIcon(periodo.variacion_anterior)}
                                                            <span className="ml-1 text-sm font-medium">
                                                                {formatPercentage(periodo.variacion_anterior)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default ReportesCompras;
