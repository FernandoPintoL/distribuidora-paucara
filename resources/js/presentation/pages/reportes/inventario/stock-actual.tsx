import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { StockPageProps } from '@/domain/entities/reportes';
import { useStockActualFilters } from '@/application/hooks/useStockActualFilters';
import { StockEstadisticasCard } from './stock-actual/components/StockEstadisticasCard';
import { StockFiltrosCard } from './stock-actual/components/StockFiltrosCard';
import { StockTable } from './stock-actual/components/StockTable';
import { ExportButtons } from './stock-actual/components/ExportButtons';

export default function ReporteStockActual({
    stock,
    estadisticas,
    filtros,
    almacenes,
    categorias
}: StockPageProps) {
    const { formData, handleFilter, clearFilters, updateField, ALL_VALUE } = useStockActualFilters(filtros);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Reportes', href: '#' },
            { title: 'Stock Actual', href: '#' }
        ]}>
            <Head title="Reporte de Stock Actual" />

            <div className="space-y-6 p-4">
                {/* Header con Botones de Descarga */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reporte de Stock Actual</h1>
                        <p className="text-muted-foreground">
                            Visualiza el estado actual del inventario por almacén
                        </p>
                    </div>
                    {/* ✅ NUEVO: Botones de descarga */}
                    <ExportButtons
                        reportType="stock-actual"
                        filters={formData}
                    />
                </div>

                {/* Estadísticas */}
                <StockEstadisticasCard estadisticas={estadisticas} />

                {/* Filtros */}
                <StockFiltrosCard
                    formData={formData}
                    almacenes={almacenes}
                    categorias={categorias}
                    ALL_VALUE={ALL_VALUE}
                    onUpdateField={updateField}
                    onFilter={handleFilter}
                    onClear={clearFilters}
                />

                {/* Tabla de Stock */}
                <StockTable stock={stock} />
            </div>
        </AppLayout>
    );
}
