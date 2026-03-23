import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Search, Filter, RefreshCw, Download } from 'lucide-react';
import { Input } from '@/presentation/components/ui/input';
import { Button } from '@/presentation/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select';
import { DistributionChart } from '@/presentation/components/prestamos';

interface StockItem {
    prestable_id: number;
    prestable_nombre: string;
    prestable_codigo: string;
    almacen_nombre: string;
    cantidad_disponible: number;
    cantidad_en_prestamo_cliente: number;
    cantidad_en_prestamo_proveedor: number;
    cantidad_vendida: number;
    cantidad_total: number;
}

interface StockPageProps {
    items: StockItem[];
    resumen: {
        total_disponible: number;
        total_en_prestamo_cliente: number;
        total_en_prestamo_proveedor: number;
        total_vendido: number;
        total_general: number;
    };
    almacenes: Array<{ id: number; nombre: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Préstamos',
        href: '/prestamos',
    },
    {
        title: 'Stock',
        href: '#',
    },
];

export default function StockPage({
    items: initialItems,
    resumen,
    almacenes,
}: StockPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [almacenFilter, setAlmacenFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState<'nombre' | 'disponible' | 'prestamo'>('nombre');

    // Filtrado y búsqueda
    const filteredItems = useMemo(() => {
        let filtered = initialItems;

        // Filtro por almacén
        if (almacenFilter && almacenFilter !== 'all') {
            filtered = filtered.filter((item) =>
                item.almacen_nombre === almacenFilter
            );
        }

        // Búsqueda
        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.prestable_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.prestable_codigo.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Ordenamiento
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'nombre':
                    return a.prestable_nombre.localeCompare(b.prestable_nombre);
                case 'disponible':
                    return b.cantidad_disponible - a.cantidad_disponible;
                case 'prestamo':
                    return (b.cantidad_en_prestamo_cliente + b.cantidad_en_prestamo_proveedor) -
                        (a.cantidad_en_prestamo_cliente + a.cantidad_en_prestamo_proveedor);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [initialItems, searchTerm, almacenFilter, sortBy]);

    const handleRefresh = () => {
        setLoading(true);
        router.reload({
            onFinish: () => setLoading(false),
        });
    };

    const handleExport = () => {
        // Preparar CSV
        const headers = ['Código', 'Nombre', 'Almacén', 'Disponible', 'Préstamo Cliente', 'Préstamo Proveedor', 'Vendido', 'Total'];
        const rows = filteredItems.map((item) => [
            item.prestable_codigo,
            item.prestable_nombre,
            item.almacen_nombre,
            item.cantidad_disponible,
            item.cantidad_en_prestamo_cliente,
            item.cantidad_en_prestamo_proveedor,
            item.cantidad_vendida,
            item.cantidad_total,
        ]);

        const csv = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock - Préstamos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            Stock y Distribución
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Visualiza la distribución de stock: disponible, préstamos y deuda
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Exportar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Gráfico de Distribución */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <DistributionChart
                            disponible={resumen.total_disponible}
                            enPrestamo={
                                resumen.total_en_prestamo_cliente + resumen.total_en_prestamo_proveedor
                            }
                            vendido={resumen.total_vendido}
                            deuda={resumen.total_en_prestamo_proveedor}
                            title="Distribución General de Stock"
                            size="lg"
                        />
                    </div>

                    {/* Cards de Totales */}
                    <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">
                                Disponible
                            </p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-200 mt-1">
                                {resumen.total_disponible}
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                                En Préstamo
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">
                                {resumen.total_en_prestamo_cliente +
                                    resumen.total_en_prestamo_proveedor}
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">
                                Total
                            </p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-200 mt-1">
                                {resumen.total_general}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Search className="h-4 w-4 inline mr-2" />
                            Buscar prestable
                        </label>
                        <Input
                            placeholder="Por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Filter className="h-4 w-4 inline mr-2" />
                            Almacén
                        </label>
                        <Select value={almacenFilter} onValueChange={setAlmacenFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {almacenes.map((almacen) => (
                                    <SelectItem key={almacen.id} value={almacen.nombre}>
                                        {almacen.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Ordenar por
                        </label>
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nombre">Nombre</SelectItem>
                                <SelectItem value="disponible">Disponible (Mayor)</SelectItem>
                                <SelectItem value="prestamo">Préstamos (Mayor)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabla */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Código
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Almacén
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                                        Disponible
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                                        Cliente
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                                        Proveedor
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                                        Vendido
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No hay resultados
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, idx) => (
                                        <tr
                                            key={`${item.prestable_id}-${item.almacen_nombre}`}
                                            className={`border-b border-slate-200 dark:border-slate-700 ${
                                                idx % 2 === 0
                                                    ? 'bg-white dark:bg-slate-900'
                                                    : 'bg-slate-50 dark:bg-slate-800'
                                            } hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}
                                        >
                                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                                                {item.prestable_codigo}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {item.prestable_nombre}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                {item.almacen_nombre}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-block px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200 font-semibold">
                                                    {item.cantidad_disponible}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-block px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 font-semibold">
                                                    {item.cantidad_en_prestamo_cliente}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-block px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 font-semibold">
                                                    {item.cantidad_en_prestamo_proveedor}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-block px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 font-semibold">
                                                    {item.cantidad_vendida}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                                {item.cantidad_total}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    Mostrando {filteredItems.length} de {initialItems.length} registros
                </div>
            </div>
        </AppLayout>
    );
}
