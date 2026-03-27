import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import AsyncSearchSelect from '@/presentation/components/ui/async-search-select';

interface Producto {
    id: number;
    nombre: string;
    sku: string;
}

interface Venta {
    detalle_id: number;
    numero_venta: string;
    venta_id: number;
    cliente: string;
    fecha: string;
    cantidad_vendida: number;
    cantidad_devuelta: number;
    cantidad_neta: number;
    precio_unitario: number;
    monto_vendido: number;
    monto_devuelto: number;
    monto_neto: number;
    estado: string;
}

interface PageProps {
    productos: Producto[];
    productoSeleccionado?: Producto | null;
    ventas: Venta[];
    filtros: {
        producto_id: number | null;
        fecha_especifica: string | null;
        fecha_inicio: string | null;
        fecha_fin: string | null;
    };
    totalProducto: {
        cantidad_vendida: number;
        cantidad_devuelta: number;
        cantidad_neta: number;
        monto_total: number;
        monto_devuelto: number;
        monto_neto: number;
    };
}

export default function VentasPorProducto() {
    const { props } = usePage<PageProps>();
    const {
        productos,
        productoSeleccionado,
        ventas,
        filtros,
        totalProducto,
    } = props;

    const [tipoFecha, setTipoFecha] = useState<'especifica' | 'rango'>('especifica');
    const [productoId, setProductoId] = useState<number | null>(filtros.producto_id);
    const [fechaEspecifica, setFechaEspecifica] = useState(filtros.fecha_especifica || '');
    const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
    const [filtroEstado, setFiltroEstado] = useState<'todas' | 'Aprobado' | 'Anulado'>('todas');

    // Filtrar ventas según el estado seleccionado
    const ventasFiltradas = ventas.filter(venta => {
        if (filtroEstado === 'todas') return true;
        return venta.estado === filtroEstado;
    });

    // Debug: mostrar estados únicos disponibles
    useEffect(() => {
        const estadosUnicos = [...new Set(ventas.map(v => v.estado))];
        console.log('📊 Estados únicos en ventas:', estadosUnicos);
        console.log('🔍 Filtro actual:', filtroEstado);
        console.log('📈 Ventas filtradas:', ventasFiltradas.length, 'de', ventas.length);
    }, [ventas, filtroEstado]);

    const handleBuscar = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();

        if (productoId) params.append('producto_id', productoId.toString());
        if (tipoFecha === 'especifica' && fechaEspecifica) {
            params.append('fecha_especifica', fechaEspecifica);
        } else if (tipoFecha === 'rango' && fechaInicio && fechaFin) {
            params.append('fecha_inicio', fechaInicio);
            params.append('fecha_fin', fechaFin);
        }

        window.location.href = `${window.location.pathname}?${params.toString()}`;
    };

    const formatCurrency = (valor: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
        }).format(valor);
    };

    return (
        <AppLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📊 Reporte de Ventas por Producto
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Visualiza todas las ventas de un producto en una fecha o rango específico
                    </p>
                </div>

                {/* Filtros */}
                <Card className="p-6">
                    <form onSubmit={handleBuscar} className="space-y-6">
                        {/* Producto */}
                        <div>
                            <AsyncSearchSelect
                                label="🔍 Seleccionar Producto"
                                placeholder="Buscar por nombre, ID o SKU..."
                                value={productoId?.toString() || ''}
                                onChange={(value) => setProductoId(value ? parseInt(value as string) : null)}
                                searchEndpoint="/api/productos/buscar"
                                minSearchLength={1}
                            />
                        </div>

                        {/* Tipo de Filtro de Fecha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                📅 Tipo de Fecha
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="tipoFecha"
                                        value="especifica"
                                        checked={tipoFecha === 'especifica'}
                                        onChange={() => setTipoFecha('especifica')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Fecha Específica</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="tipoFecha"
                                        value="rango"
                                        checked={tipoFecha === 'rango'}
                                        onChange={() => setTipoFecha('rango')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Rango de Fechas</span>
                                </label>
                            </div>
                        </div>

                        {/* Fecha Específica */}
                        {tipoFecha === 'especifica' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    value={fechaEspecifica}
                                    onChange={(e) => setFechaEspecifica(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {/* Rango de Fechas */}
                        {tipoFecha === 'rango' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fecha Fin
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setProductoId(null);
                                    setFechaEspecifica('');
                                    setFechaInicio('');
                                    setFechaFin('');
                                    window.location.href = window.location.pathname;
                                }}
                            >
                                🔄 Limpiar Filtros
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                🔍 Buscar Ventas
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Resultado */}
                {productoSeleccionado && (
                    <div className="space-y-6">
                        {/* Información del Producto */}
                        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        📦 {productoSeleccionado.nombre}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        SKU: {productoSeleccionado.sku}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Resumen Total */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Cantidad Vendida
                                </div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {totalProducto.cantidad_vendida.toFixed(2)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Cantidad Devuelta
                                </div>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {totalProducto.cantidad_devuelta.toFixed(2)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Cantidad Neta
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {totalProducto.cantidad_neta.toFixed(2)}
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Monto Total
                                </div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {formatCurrency(totalProducto.monto_total)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Monto Devuelto
                                </div>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {formatCurrency(totalProducto.monto_devuelto)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Monto Neto
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {formatCurrency(totalProducto.monto_neto)}
                                </div>
                            </Card>
                        </div>

                        {/* Filtro de Estado */}
                        <Card className="p-6 bg-white dark:bg-slate-800">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                🔔 Filtrar por Estado
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFiltroEstado('todas')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filtroEstado === 'todas'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    Todas ({ventas.length})
                                </button>
                                <button
                                    onClick={() => setFiltroEstado('Aprobado')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filtroEstado === 'Aprobado'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    ✅ Aprobado ({ventas.filter(v => v.estado === 'Aprobado').length})
                                </button>
                                <button
                                    onClick={() => setFiltroEstado('Anulado')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filtroEstado === 'Anulado'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    ❌ Anulado ({ventas.filter(v => v.estado === 'Anulado').length})
                                </button>
                            </div>
                        </Card>

                        {/* Tabla de Ventas */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                📝 Detalle de Ventas ({ventasFiltradas.length})
                            </h3>

                            {ventasFiltradas.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>No hay ventas registradas para este producto en el período seleccionado</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 dark:bg-slate-700 border-b dark:border-slate-600">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                                                    Folio
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                                                    Cliente
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                                                    Fecha
                                                </th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                    Cant. Vendida
                                                </th>
                                                {/* <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                    Cant. Devuelta
                                                </th> */}
                                                {/* <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                    Cant. Neta
                                                </th> */}
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                    Precio Unit.
                                                </th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                    Monto Vendido
                                                </th>
                                                {/* <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                    Monto Devuelto
                                                </th> */}
                                                {/* <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                    Monto Neto
                                                </th> */}
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                                                    Estado
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-slate-700">
                                            {ventasFiltradas.map((venta) => (
                                                <tr
                                                    key={venta.detalle_id}
                                                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                                                >
                                                    <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">
                                                        {venta.venta_id}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                                        {venta.cliente}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        {venta.fecha}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                                                        {venta.cantidad_vendida.toFixed(2)}
                                                    </td>
                                                    {/* <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">
                                                        {venta.cantidad_devuelta.toFixed(2)}
                                                    </td> */}
                                                    {/* <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                        {venta.cantidad_neta.toFixed(2)}
                                                    </td> */}
                                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(venta.precio_unitario)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(venta.monto_vendido)}
                                                    </td>
                                                    {/* <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">
                                                        {formatCurrency(venta.monto_devuelto)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(venta.monto_neto)}
                                                    </td> */}
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded">
                                                            {venta.estado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {!productoSeleccionado && (
                    <Card className="p-8 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                            <p className="text-lg">👈 Selecciona un producto para ver sus ventas</p>
                            <p className="text-sm mt-2">
                                Elige un producto y un rango de fechas para comenzar
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
