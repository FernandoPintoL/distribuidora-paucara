import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Almacen,
    Vehiculo,
    Chofer,
    StockProducto,
    NuevaTransferencia
} from '@/types/inventario';
import { Plus, Minus, Search, Package, ArrowRight } from 'lucide-react';
import { NotificationService } from '@/services/notification.service';

interface PageProps extends InertiaPageProps {
    almacenes: Almacen[];
    vehiculos: Vehiculo[];
    choferes: Chofer[];
}

interface DetalleFormulario {
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    lote?: string;
    fecha_vencimiento?: string;
    stock_disponible: number;
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Transferencias',
        href: '/inventario/transferencias',
    },
    {
        title: 'Nueva Transferencia',
        href: '/inventario/transferencias/crear',
    },
];

export default function CrearTransferencia() {
    const { props } = usePage<PageProps>();
    const { almacenes, vehiculos, choferes } = props;
    const { can } = useAuth();

    const [productosDisponibles, setProductosDisponibles] = useState<StockProducto[]>([]);
    const [detalles, setDetalles] = useState<DetalleFormulario[]>([]);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
    const [cargandoProductos, setCargandoProductos] = useState(false);

    const { data, setData, post, processing, errors } = useForm<NuevaTransferencia>({
        almacen_origen_id: 0,
        almacen_destino_id: 0,
        vehiculo_id: undefined,
        chofer_id: undefined,
        observaciones: '',
        detalles: []
    });

    // Buscar productos cuando cambie el almacén origen
    const buscarProductos = useCallback(async (termino: string = '') => {
        if (data.almacen_origen_id === 0) return;

        setCargandoProductos(true);
        try {
            const params = new URLSearchParams({
                almacen_id: data.almacen_origen_id.toString(),
                ...(termino && { search: termino })
            });

            const response = await fetch(`/api/inventario/buscar-productos?${params}`);
            const result = await response.json();

            if (result.success) {
                setProductosDisponibles(result.data);
            } else {
                NotificationService.error('Error al buscar productos');
            }
        } catch {
            NotificationService.error('Error al consultar productos');
        } finally {
            setCargandoProductos(false);
        }
    }, [data.almacen_origen_id]);

    useEffect(() => {
        if (data.almacen_origen_id > 0) {
            buscarProductos();
        } else {
            setProductosDisponibles([]);
        }
    }, [data.almacen_origen_id, buscarProductos]);

    const buscarProductosConTermino = (termino: string) => {
        setBusquedaProducto(termino);
        if (termino.length > 2) {
            buscarProductos(termino);
        } else if (termino.length === 0) {
            buscarProductos();
        }
    };

    const agregarProducto = (stockProducto: StockProducto) => {
        const productoExiste = detalles.find(d => d.producto_id === stockProducto.producto.id);

        if (productoExiste) {
            NotificationService.error('El producto ya está agregado a la transferencia');
            return;
        }

        const nuevoDetalle: DetalleFormulario = {
            producto_id: stockProducto.producto.id,
            producto_nombre: stockProducto.producto.nombre,
            cantidad: 1,
            lote: stockProducto.lote,
            fecha_vencimiento: stockProducto.fecha_vencimiento,
            stock_disponible: stockProducto.cantidad
        };

        setDetalles([...detalles, nuevoDetalle]);
        setMostrarBusqueda(false);
        setBusquedaProducto('');
    };

    const actualizarDetalle = (index: number, campo: keyof DetalleFormulario, valor: string | number) => {
        const nuevosDetalles = [...detalles];
        nuevosDetalles[index] = { ...nuevosDetalles[index], [campo]: valor };
        setDetalles(nuevosDetalles);
    };

    const eliminarDetalle = (index: number) => {
        const nuevosDetalles = detalles.filter((_, i) => i !== index);
        setDetalles(nuevosDetalles);
    };

    const validarYEnviar = () => {
        // Validaciones locales
        if (data.almacen_origen_id === 0) {
            NotificationService.error('Debes seleccionar un almacén de origen');
            return;
        }

        if (data.almacen_destino_id === 0) {
            NotificationService.error('Debes seleccionar un almacén de destino');
            return;
        }

        if (data.almacen_origen_id === data.almacen_destino_id) {
            NotificationService.error('El almacén de origen y destino deben ser diferentes');
            return;
        }

        if (detalles.length === 0) {
            NotificationService.error('Debes agregar al menos un producto');
            return;
        }

        // Validar cantidades
        const erroresCantidad = detalles.some(detalle =>
            detalle.cantidad <= 0 || detalle.cantidad > detalle.stock_disponible
        );

        if (erroresCantidad) {
            NotificationService.error('Verifica las cantidades de los productos');
            return;
        }

        // Preparar datos para envío
        const datosFinales: NuevaTransferencia = {
            ...data,
            detalles: detalles.map(detalle => ({
                producto_id: detalle.producto_id,
                cantidad: detalle.cantidad,
                lote: detalle.lote,
                fecha_vencimiento: detalle.fecha_vencimiento
            }))
        };

        setData('detalles', datosFinales.detalles);

        post('/inventario/transferencias/crear', {
            onSuccess: () => {
                NotificationService.success('Transferencia creada exitosamente');
            },
            onError: () => {
                NotificationService.error('Error al crear la transferencia');
            }
        });
    };

    const almacenOrigenSeleccionado = almacenes.find(a => a.id === data.almacen_origen_id);
    const almacenDestinoSeleccionado = almacenes.find(a => a.id === data.almacen_destino_id);

    if (!can('inventario.transferencias.crear')) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Acceso Denegado" />
                <div className="text-center py-12">
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No tienes permisos para crear transferencias
                    </h3>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva Transferencia" />

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Nueva Transferencia
                    </h2>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        Crea una nueva transferencia de productos entre almacenes
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información Básica */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Información de la Transferencia
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="almacen_origen_id">Almacén de Origen *</Label>
                                    <select
                                        id="almacen_origen_id"
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                                        value={data.almacen_origen_id}
                                        onChange={(e) => setData('almacen_origen_id', parseInt(e.target.value))}
                                    >
                                        <option value={0}>Selecciona un almacén</option>
                                        {almacenes.filter(a => a.activo).map(almacen => (
                                            <option key={almacen.id} value={almacen.id}>
                                                {almacen.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.almacen_origen_id && (
                                        <p className="text-red-500 text-sm mt-1">{errors.almacen_origen_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="almacen_destino_id">Almacén de Destino *</Label>
                                    <select
                                        id="almacen_destino_id"
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                                        value={data.almacen_destino_id}
                                        onChange={(e) => setData('almacen_destino_id', parseInt(e.target.value))}
                                    >
                                        <option value={0}>Selecciona un almacén</option>
                                        {almacenes.filter(a => a.activo && a.id !== data.almacen_origen_id).map(almacen => (
                                            <option key={almacen.id} value={almacen.id}>
                                                {almacen.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.almacen_destino_id && (
                                        <p className="text-red-500 text-sm mt-1">{errors.almacen_destino_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="vehiculo_id">Vehículo (Opcional)</Label>
                                    <select
                                        id="vehiculo_id"
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                                        value={data.vehiculo_id || ''}
                                        onChange={(e) => setData('vehiculo_id', e.target.value ? parseInt(e.target.value) : undefined)}
                                    >
                                        <option value="">Sin vehículo asignado</option>
                                        {vehiculos.map(vehiculo => (
                                            <option key={vehiculo.id} value={vehiculo.id}>
                                                {vehiculo.placa} - {vehiculo.modelo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="chofer_id">Chofer (Opcional)</Label>
                                    <select
                                        id="chofer_id"
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                                        value={data.chofer_id || ''}
                                        onChange={(e) => setData('chofer_id', e.target.value ? parseInt(e.target.value) : undefined)}
                                    >
                                        <option value="">Sin chofer asignado</option>
                                        {choferes.map(chofer => (
                                            <option key={chofer.id} value={chofer.id}>
                                                {chofer.user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <Textarea
                                    id="observaciones"
                                    placeholder="Observaciones adicionales sobre la transferencia..."
                                    value={data.observaciones}
                                    onChange={(e) => setData('observaciones', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Productos */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Productos a Transferir
                                </h3>
                                {data.almacen_origen_id > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setMostrarBusqueda(!mostrarBusqueda)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Agregar Producto
                                    </Button>
                                )}
                            </div>

                            {/* Panel de búsqueda */}
                            {mostrarBusqueda && (
                                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex gap-2 mb-3">
                                        <div className="flex-1 relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <Input
                                                placeholder="Buscar productos..."
                                                value={busquedaProducto}
                                                onChange={(e) => buscarProductosConTermino(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setMostrarBusqueda(false)}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto">
                                        {cargandoProductos ? (
                                            <div className="text-center py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Cargando productos...
                                                </div>
                                            </div>
                                        ) : productosDisponibles.length === 0 ? (
                                            <div className="text-center py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    No hay productos disponibles en este almacén
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {productosDisponibles.map(stock => (
                                                    <div
                                                        key={stock.id}
                                                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                                        onClick={() => agregarProducto(stock)}
                                                    >
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                                {stock.producto.nombre}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                Stock: {stock.cantidad} unidades
                                                                {stock.lote && ` - Lote: ${stock.lote}`}
                                                                {stock.fecha_vencimiento && ` - Vence: ${stock.fecha_vencimiento}`}
                                                            </div>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Lista de productos seleccionados */}
                            {detalles.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                                        No hay productos agregados
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        {data.almacen_origen_id === 0
                                            ? 'Selecciona un almacén de origen para ver los productos disponibles'
                                            : 'Haz clic en "Agregar Producto" para comenzar'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {detalles.map((detalle, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {detalle.producto_nombre}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Stock disponible: {detalle.stock_disponible} unidades
                                                </div>
                                            </div>
                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={detalle.stock_disponible}
                                                    value={detalle.cantidad}
                                                    onChange={(e) => actualizarDetalle(index, 'cantidad', parseInt(e.target.value) || 1)}
                                                    className="text-center"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => eliminarDetalle(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Lateral - Resumen */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Resumen de Transferencia
                            </h3>

                            {/* Almacenes */}
                            {(almacenOrigenSeleccionado || almacenDestinoSeleccionado) && (
                                <div className="mb-4">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ruta de transferencia:</div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">
                                            {almacenOrigenSeleccionado?.nombre || 'Sin seleccionar'}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">
                                            {almacenDestinoSeleccionado?.nombre || 'Sin seleccionar'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Estadísticas */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total productos:</span>
                                    <span className="font-medium">{detalles.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total unidades:</span>
                                    <span className="font-medium">
                                        {detalles.reduce((sum, d) => sum + d.cantidad, 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="mt-6 space-y-3">
                                <Button
                                    onClick={validarYEnviar}
                                    disabled={processing || detalles.length === 0}
                                    className="w-full"
                                >
                                    {processing ? 'Creando...' : 'Crear Transferencia'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className="w-full"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}