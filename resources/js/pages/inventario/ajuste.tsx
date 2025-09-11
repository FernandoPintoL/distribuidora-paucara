import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'react-hot-toast';

interface Producto {
    id: number;
    nombre: string;
    codigo?: string;
}

interface Almacen {
    id: number;
    nombre: string;
}

interface StockProducto {
    id: number;
    producto: Producto;
    almacen: Almacen;
    cantidad: number;
    fecha_vencimiento?: string;
    lote?: string;
}

interface AjusteItem {
    stock_producto_id: number;
    nueva_cantidad: number;
    observacion: string;
}

interface PageProps extends InertiaPageProps {
    almacenes: Almacen[];
    stock_productos: StockProducto[];
    almacen_seleccionado?: number;
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Ajuste de Inventario',
        href: '/inventario/ajuste',
    },
];

export default function AjusteInventario() {
    const { props } = usePage<PageProps>();
    const { almacenes, stock_productos, almacen_seleccionado } = props;
    const { can } = useAuth();

    const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>(
        almacen_seleccionado ? String(almacen_seleccionado) : ''
    );

    const [ajustes, setAjustes] = useState<Record<number, AjusteItem>>({});
    const [mostrarSoloConAjustes, setMostrarSoloConAjustes] = useState(false);

    const { setData, post, processing } = useForm({
        ajustes: [] as AjusteItem[]
    });

    const handleAlmacenChange = (almacenId: string) => {
        setAlmacenSeleccionado(almacenId);
        setAjustes({});

        if (almacenId) {
            router.get('/inventario/ajuste', { almacen_id: almacenId }, {
                preserveState: true,
                replace: true,
            });
        }
    };

    const handleCantidadChange = (stockProductoId: number, nuevaCantidad: string) => {
        const cantidad = parseInt(nuevaCantidad) || 0;
        const stockProducto = stock_productos.find(sp => sp.id === stockProductoId);

        if (!stockProducto) return;

        if (cantidad !== stockProducto.cantidad) {
            setAjustes(prev => ({
                ...prev,
                [stockProductoId]: {
                    stock_producto_id: stockProductoId,
                    nueva_cantidad: cantidad,
                    observacion: prev[stockProductoId]?.observacion || ''
                }
            }));
        } else {
            // Si la cantidad es igual a la actual, remover el ajuste
            setAjustes(prev => {
                const newAjustes = { ...prev };
                delete newAjustes[stockProductoId];
                return newAjustes;
            });
        }
    };

    const handleObservacionChange = (stockProductoId: number, observacion: string) => {
        setAjustes(prev => ({
            ...prev,
            [stockProductoId]: {
                ...prev[stockProductoId],
                observacion
            }
        }));
    };

    const procesarAjustes = () => {
        const ajustesList = Object.values(ajustes).filter(ajuste => {
            const stockProducto = stock_productos.find(sp => sp.id === ajuste.stock_producto_id);
            return stockProducto && ajuste.nueva_cantidad !== stockProducto.cantidad;
        });

        if (ajustesList.length === 0) {
            toast.error('No hay ajustes para procesar');
            return;
        }

        setData('ajustes', ajustesList);

        post('/inventario/ajuste', {
            onSuccess: () => {
                toast.success('Ajustes procesados correctamente');
                setAjustes({});
                router.reload({ only: ['stock_productos'] });
            },
            onError: () => {
                toast.error('Error al procesar los ajustes');
            }
        });
    };

    const getDiferencia = (stockProducto: StockProducto): number => {
        const ajuste = ajustes[stockProducto.id];
        if (!ajuste) return 0;
        return ajuste.nueva_cantidad - stockProducto.cantidad;
    };

    const getProductosFiltrados = (): StockProducto[] => {
        if (!mostrarSoloConAjustes) return stock_productos;
        return stock_productos.filter(sp => ajustes[sp.id] !== undefined);
    };

    const limpiarAjustes = () => {
        if (confirm('¿Estás seguro de limpiar todos los ajustes?')) {
            setAjustes({});
        }
    };

    if (!can('inventario.ajuste.form')) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajuste de Inventario" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Ajuste de Inventario
                        </h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Realizar ajustes manuales de stock por almacén
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/inventario"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Dashboard
                        </Link>
                    </div>
                </div>

                {/* Selección de almacén */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Seleccionar Almacén
                                </label>
                                <select
                                    value={almacenSeleccionado}
                                    onChange={(e) => handleAlmacenChange(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Selecciona un almacén...</option>
                                    {almacenes.map(almacen => (
                                        <option key={almacen.id} value={almacen.id}>
                                            {almacen.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {stock_productos.length > 0 && (
                                <div className="flex items-end">
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={mostrarSoloConAjustes}
                                                onChange={(e) => setMostrarSoloConAjustes(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                Solo productos con ajustes
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                {Object.keys(ajustes).length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                                        {Object.keys(ajustes).length} productos con ajustes pendientes
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Revisa los cambios antes de procesar los ajustes
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={limpiarAjustes}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Limpiar
                                    </button>
                                    <button
                                        onClick={procesarAjustes}
                                        disabled={processing}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Procesar Ajustes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabla de productos */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                    {!almacenSeleccionado ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                Selecciona un almacén
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Elige un almacén para ver y ajustar su inventario.
                            </p>
                        </div>
                    ) : getProductosFiltrados().length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-4.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {mostrarSoloConAjustes ? 'No hay productos con ajustes' : 'No hay productos en este almacén'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {mostrarSoloConAjustes
                                    ? 'Realiza algunos ajustes de cantidad para que aparezcan aquí.'
                                    : 'Este almacén no tiene productos en stock.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Stock Actual
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Nueva Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Diferencia
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Observación
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                    {getProductosFiltrados().map((stockProducto) => {
                                        const diferencia = getDiferencia(stockProducto);
                                        const ajuste = ajustes[stockProducto.id];
                                        return (
                                            <tr key={stockProducto.id} className={diferencia !== 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {stockProducto.producto.nombre}
                                                        </div>
                                                        {stockProducto.producto.codigo && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                Código: {stockProducto.producto.codigo}
                                                            </div>
                                                        )}
                                                        {stockProducto.lote && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                Lote: {stockProducto.lote}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {stockProducto.cantidad}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={ajuste?.nueva_cantidad ?? stockProducto.cantidad}
                                                        onChange={(e) => handleCantidadChange(stockProducto.id, e.target.value)}
                                                        className="block w-20 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                    {diferencia !== 0 && (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${diferencia > 0
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                            }`}>
                                                            {diferencia > 0 ? '+' : ''}{diferencia}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Motivo del ajuste..."
                                                        value={ajuste?.observacion || ''}
                                                        onChange={(e) => handleObservacionChange(stockProducto.id, e.target.value)}
                                                        disabled={diferencia === 0}
                                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-400"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
