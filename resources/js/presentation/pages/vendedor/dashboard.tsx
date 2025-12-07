/**
 * Dashboard específico para Vendedor/Cajero
 * Muestra solo métricas relevantes: Ventas, Caja, Clientes, proformas
 */

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    DollarSign,
    Wallet,
    Users,
    FileText,
} from 'lucide-react';

import { MetricCard } from '@/presentation/components/dashboard/metric-card';
import { ChartWrapper } from '@/presentation/components/dashboard/chart-wrapper';
import { AlertasStock } from '@/presentation/components/dashboard/alertas-stock';
import { ProductosMasVendidos } from '@/presentation/components/dashboard/productos-mas-vendidos';
import { PeriodSelector } from '@/presentation/components/dashboard/period-selector';

interface VendedorDashboardProps {
    metricas: {
        ventas: {
            total: number;
            cantidad: number;
            promedio: number;
            cambio_porcentual: number;
        };
        caja: {
            ingresos: number;
            egresos: number;
            saldo: number;
            total_movimientos: number;
        };
        clientes: {
            total: number;
            nuevos: number;
            activos: number;
            con_credito: number;
        };
        proformas: {
            total: number;
            aprobadas: number;
            pendientes: number;
            tasa_aprobacion: number;
        };
    };
    graficoVentas: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor: string;
            borderColor: string;
            tension?: number;
            yAxisID?: string;
        }>;
    };
    productosMasVendidos: Array<{
        nombre: string;
        total_vendido: number;
        ingresos_total: number;
    }>;
    alertasStock: {
        stock_bajo: number;
        stock_critico: number;
        productos_afectados: Array<{
            producto: string;
            almacen: string;
            cantidad_actual: number;
            stock_minimo: number;
        }>;
    };
    periodo: string;
    titulo: string;
    descripcion: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vendedor',
        href: '/vendedor/dashboard',
    },
    {
        title: 'Dashboard',
        href: '/vendedor/dashboard',
    },
];

export default function VendedorDashboard({
    metricas,
    graficoVentas,
    productosMasVendidos,
    alertasStock,
    periodo: initialPeriodo = 'mes_actual',
    titulo = 'Dashboard Vendedor',
    descripcion = 'Resumen de ventas y caja',
}: VendedorDashboardProps) {
    const [periodo, setPeriodo] = useState(initialPeriodo);
    const [loading, setLoading] = useState(false);

    // Valores por defecto
    const defaultMetricas = {
        ventas: { total: 0, cantidad: 0, promedio: 0, cambio_porcentual: 0 },
        caja: { ingresos: 0, egresos: 0, saldo: 0, total_movimientos: 0 },
        clientes: { total: 0, nuevos: 0, activos: 0, con_credito: 0 },
        proformas: { total: 0, aprobadas: 0, pendientes: 0, tasa_aprobacion: 0 },
    };

    // Merge con defaults
    const safeMetricas = {
        ...defaultMetricas,
        ventas: { ...defaultMetricas.ventas, ...metricas.ventas },
        caja: { ...defaultMetricas.caja, ...metricas.caja },
        clientes: { ...defaultMetricas.clientes, ...metricas.clientes },
        proformas: { ...defaultMetricas.proformas, ...metricas.proformas },
    };

    const safeGraficoVentas = graficoVentas || { labels: [], datasets: [] };
    const safeProductosMasVendidos = productosMasVendidos || [];
    const safeAlertasStock = alertasStock || { stock_bajo: 0, stock_critico: 0, productos_afectados: [] };

    const handlePeriodChange = (newPeriod: string) => {
        setPeriodo(newPeriod);
        setLoading(true);

        router.get('/vendedor/dashboard', { periodo: newPeriod }, {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Vendedor" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {titulo}
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            {descripcion}
                        </p>
                    </div>
                    <PeriodSelector
                        value={periodo}
                        onChange={handlePeriodChange}
                    />
                </div>

                {/* Métricas principales (Ventas, Caja, Clientes, proformas) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Ventas"
                        value={safeMetricas.ventas.total}
                        subtitle={`${safeMetricas.ventas.cantidad} ventas`}
                        change={safeMetricas.ventas.cambio_porcentual}
                        icon={DollarSign}
                        loading={loading}
                    />
                    <MetricCard
                        title="Saldo en Caja"
                        value={safeMetricas.caja.saldo}
                        subtitle={`${safeMetricas.caja.total_movimientos} movimientos`}
                        change={
                            safeMetricas.caja.ingresos === 0 && safeMetricas.caja.egresos === 0 ? 0 :
                                safeMetricas.caja.ingresos > safeMetricas.caja.egresos ?
                                    safeMetricas.caja.ingresos > 0 ? ((safeMetricas.caja.ingresos - safeMetricas.caja.egresos) / safeMetricas.caja.ingresos) * 100 : 0 :
                                    safeMetricas.caja.egresos > 0 ? -((safeMetricas.caja.egresos - safeMetricas.caja.ingresos) / safeMetricas.caja.egresos) * 100 : 0
                        }
                        icon={Wallet}
                        loading={loading}
                    />
                    <MetricCard
                        title="Clientes"
                        value={safeMetricas.clientes.activos}
                        subtitle={`${safeMetricas.clientes.nuevos} nuevos`}
                        icon={Users}
                        loading={loading}
                    />
                    <MetricCard
                        title="Proformas Aprobadas"
                        value={`${safeMetricas.proformas.tasa_aprobacion}%`}
                        subtitle={`${safeMetricas.proformas.aprobadas}/${safeMetricas.proformas.total}`}
                        icon={FileText}
                        loading={loading}
                    />
                </div>

                {/* Gráficos */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Gráfico de ventas */}
                    <ChartWrapper
                        title="Evolución de Ventas"
                        type="line"
                        data={safeGraficoVentas}
                        loading={loading}
                        className="lg:col-span-2"
                    />

                    {/* Productos más vendidos */}
                    <ProductosMasVendidos
                        productos={safeProductosMasVendidos}
                        loading={loading}
                    />

                    {/* Alertas de stock */}
                    <div className="lg:col-span-1">
                        <AlertasStock
                            alertas={safeAlertasStock}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
