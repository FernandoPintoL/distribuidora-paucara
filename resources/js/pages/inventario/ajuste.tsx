import React, { useState } from 'react';
import InputSearch from '@/components/ui/input-search';
import SearchSelect from '@/components/ui/search-select';
import { TipoAjustInventarioCrudModal } from '@/components/inventario/TipoAjustInventarioCrudModal';
import { useTipoAjustInventario } from '@/stores/useTipoAjustInventario';
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
    tipo_ajuste_id?: number;
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

    const [ajustes, setAjustes] = useState<Record<number, AjusteItem & { inputCantidad?: string }>>({});
    const [productoSeleccionado, setProductoSeleccionado] = useState<StockProducto | null>(null);

    // Modal CRUD TipoAjustInventario
    const [openTipoAjustModal, setOpenTipoAjustModal] = useState(false);
    const { tipos, fetchTipos } = useTipoAjustInventario();
    const [mostrarSoloConAjustes, setMostrarSoloConAjustes] = useState(false);

    React.useEffect(() => {
        fetchTipos();
    }, [fetchTipos]);

    // DEBUG: Mostrar los tipos de ajuste en consola
    React.useEffect(() => {
        console.log('Tipos de ajuste cargados:', tipos);
    }, [tipos]);

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
        // Permitir vacío
        let input = nuevaCantidad.replace(/^0+(?!$)/, ''); // Elimina ceros a la izquierda excepto si es solo "0"
        if (input === '') {
            setAjustes(prev => ({
                ...prev,
                [stockProductoId]: {
                    ...prev[stockProductoId],
                    inputCantidad: '',
                }
            }));
            return;
        }
        const cantidad = parseInt(input, 10);
        const stockProducto = stock_productos.find(sp => sp.id === stockProductoId);
        if (!stockProducto) return;
        if (cantidad !== stockProducto.cantidad) {
            setAjustes(prev => ({
                ...prev,
                [stockProductoId]: {
                    stock_producto_id: stockProductoId,
                    nueva_cantidad: cantidad,
                    observacion: prev[stockProductoId]?.observacion || '',
                    tipo_ajuste_id: prev[stockProductoId]?.tipo_ajuste_id || (tipos[0]?.id ?? undefined),
                    inputCantidad: input,
                }
            }));
        } else {
            setAjustes(prev => {
                const newAjustes = { ...prev };
                delete newAjustes[stockProductoId];
                return newAjustes;
            });
        }
    };

    const handleTipoAjusteChange = (stockProductoId: number, tipoAjusteId: number) => {
        setAjustes(prev => ({
            ...prev,
            [stockProductoId]: {
                ...prev[stockProductoId],
                tipo_ajuste_id: tipoAjusteId,
            },
        }));
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
            <>
                <Head title="Ajuste de Inventario" />
                <div className="flex flex-col gap-6 p-4">
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
                            <button
                                type="button"
                                onClick={() => setOpenTipoAjustModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors duration-200"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Tipos de Ajuste
                            </button>
                        </div>
                    </div>
                    {/* Selección de almacén y buscador de productos en una fila */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <SearchSelect
                                    label="Seleccionar Almacén"
                                    placeholder="Selecciona un almacén..."
                                    value={almacenSeleccionado}
                                    options={almacenes.map(a => ({ value: String(a.id), label: a.nombre }))}
                                    onChange={value => handleAlmacenChange(String(value))}
                                    searchPlaceholder="Buscar almacén..."
                                    emptyText="No se encontraron almacenes"
                                    required
                                />
                            </div>
                            <div className={almacenSeleccionado ? '' : 'opacity-50 pointer-events-none'}>
                                <InputSearch
                                    label="Buscar producto"
                                    value={productoSeleccionado?.id ?? null}
                                    onChange={(_id, option) => {
                                        if (option) {
                                            const prod = stock_productos.find(p => p.id === option.value);
                                            setProductoSeleccionado(prod || null);
                                        } else {
                                            setProductoSeleccionado(null);
                                        }
                                    }}
                                    onSearch={async (query) => {
                                        const q = query.toLowerCase();
                                        return stock_productos
                                            .filter(p =>
                                                p.id.toString() === q ||
                                                p.producto.nombre.toLowerCase().includes(q) ||
                                                (p.producto.codigo && p.producto.codigo.toLowerCase().includes(q)) ||
                                                (p.producto.codigo && p.producto.codigo.replace(/[^\d]/g, '').includes(q.replace(/[^\d]/g, '')))
                                            )
                                            .map(p => ({
                                                value: p.id,
                                                label: p.producto.nombre,
                                                description: [
                                                    p.producto.codigo ? `Código: ${p.producto.codigo}` : null,
                                                    p.lote ? `Lote: ${p.lote}` : null
                                                ].filter(Boolean).join(' | ')
                                            }));
                                    }}
                                    placeholder="Buscar por nombre, código o ID..."
                                    emptyText="No se encontraron productos"
                                    disabled={!almacenSeleccionado}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Formulario de ajuste para el producto seleccionado */}
                    {productoSeleccionado && (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mt-4">
                            <div className="mb-4">
                                <div className="font-medium text-lg text-gray-900 dark:text-gray-100">
                                    {productoSeleccionado.producto.nombre}
                                </div>
                                {productoSeleccionado.producto.codigo && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Código: {productoSeleccionado.producto.codigo}
                                    </div>
                                )}
                                {productoSeleccionado.lote && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Lote: {productoSeleccionado.lote}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock actual</label>
                                    <div className="text-lg font-semibold">{productoSeleccionado.cantidad}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva cantidad</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        min="0"
                                        value={ajustes[productoSeleccionado.id]?.inputCantidad !== undefined ? ajustes[productoSeleccionado.id].inputCantidad : productoSeleccionado.cantidad}
                                        onChange={e => handleCantidadChange(productoSeleccionado.id, e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder={ajustes[productoSeleccionado.id]?.inputCantidad === '' ? String(productoSeleccionado.cantidad) : ''}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de ajuste</label>
                                    <select
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        value={ajustes[productoSeleccionado.id]?.tipo_ajuste_id ?? ''}
                                        onChange={e => handleTipoAjusteChange(productoSeleccionado.id, Number(e.target.value))}
                                        disabled={tipos.length === 0}
                                    >
                                        {tipos.length === 0 ? (
                                            <option value="">Cargando tipos de ajuste...</option>
                                        ) : (
                                            <>
                                                <option value="">Selecciona tipo...</option>
                                                {tipos.map(tipo => (
                                                    <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                                                ))}
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observación</label>
                                    <input
                                        type="text"
                                        placeholder="Motivo del ajuste..."
                                        value={ajustes[productoSeleccionado.id]?.observacion || ''}
                                        onChange={e => handleObservacionChange(productoSeleccionado.id, e.target.value)}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Aquí irán los siguientes pasos: agregar a lista y resumen */}
                </div>
                <TipoAjustInventarioCrudModal open={openTipoAjustModal} onOpenChange={setOpenTipoAjustModal} />
            </>
        </AppLayout>
    );
}
