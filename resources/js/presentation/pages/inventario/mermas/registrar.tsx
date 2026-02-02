import React, { useState, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/application/hooks/use-auth';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import type {
    TipoMerma
} from '@/domain/entities/mermas-inventario';
import type { Almacen } from '@/domain/entities/almacenes';
import { TIPOS_MERMA } from '@/presentation/config/inventory.config';

// ProductoInventario not needed - using Producto from productos.ts instead
import { useTipoMermas } from '@/stores/useTipoMermas';
import { TipoMermaCrudModal } from '@/presentation/components/Inventario/TipoMermaCrudModal';
import { EstadoMermaCrudModal } from '@/presentation/components/Inventario/EstadoMermaCrudModal';
import {
    Search,
    Package,
    Trash2,
    Save,
    X,
    AlertTriangle
} from 'lucide-react';
import { NotificationService } from '@/infrastructure/services/notification.service';

interface PageProps extends InertiaPageProps {
    almacenes: Almacen[];
}

interface ProductoMermaForm {
    producto_id: number;
    producto?: ProductoInventario;
    cantidad: number;
    costo_unitario?: number;
    lote?: string;
    fecha_vencimiento?: string;
    observaciones?: string;
}

const RegistrarMermaPage: React.FC = () => {
    const { tipos, fetchTipos } = useTipoMermas();
    React.useEffect(() => { fetchTipos(); }, [fetchTipos]);
    const [openTipoModal, setOpenTipoModal] = useState(false);
    const [openEstadoModal, setOpenEstadoModal] = useState(false);
    const { props } = usePage<PageProps>();
    const { almacenes } = props;
    const { can } = useAuth();

    const [formData, setFormData] = useState({
        almacen_id: '',
        tipo_merma: '' as TipoMerma | '',
        motivo: '',
        observaciones: ''
    });

    const [productos, setProductos] = useState<ProductoMermaForm[]>([]);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [productosDisponibles, setProductosDisponibles] = useState<ProductoInventario[]>([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const breadcrumbs = [
        {
            title: 'Inventario',
            href: '/inventario',
        },
        {
            title: 'Mermas',
            href: '/inventario/mermas',
        },
        {
            title: 'Registrar Merma',
            href: '/inventario/mermas/registrar',
        },
    ];

    const buscarProductos = useCallback(async (termino: string) => {
        if (!termino.trim() || !formData.almacen_id) {
            setProductosDisponibles([]);
            return;
        }

        setCargandoProductos(true);
        try {
            const params = new URLSearchParams();
            params.append('busqueda', termino);
            params.append('almacen_id', formData.almacen_id);
            params.append('rango_stock', 'todos');
            params.append('ordenamiento', 'producto');

            console.log('📤 [MERMAS] Enviando búsqueda:', {
                url: `/api/inventario/stock-filtrado?${params.toString()}`,
                parametros: {
                    busqueda: termino,
                    almacen_id: formData.almacen_id,
                    rango_stock: 'todos',
                    ordenamiento: 'producto'
                }
            });

            const response = await fetch(`/api/inventario/stock-filtrado?${params.toString()}`);
            const data = await response.json();

            console.log('📥 [MERMAS] Respuesta recibida:', data);

            if (data.success && Array.isArray(data.data)) {
                // Convertir respuesta de stock-filtrado al formato esperado
                // Filtrar duplicados por producto_id (tomar el primero de cada producto)
                const productosMap = new Map();
                for (const stock of data.data) {
                    if (!productosMap.has(stock.producto_id)) {
                        productosMap.set(stock.producto_id, {
                            id: stock.producto_id,
                            nombre: stock.producto_nombre,
                            codigo: stock.producto_codigo_barra || stock.producto_sku || stock.producto_codigo,
                            stock_actual: stock.cantidad,
                            precio_venta: stock.precio_venta || 0
                        });
                    }
                }
                const productosFormatados = Array.from(productosMap.values());
                console.log('✅ [MERMAS] Productos encontrados:', productosFormatados);

                // Si hay un solo resultado, agregarlo automáticamente
                if (productosFormatados.length === 1) {
                    console.log('🎯 [MERMAS] Un solo resultado encontrado, agregando automáticamente...');
                    agregarProducto(productosFormatados[0]);
                } else {
                    setProductosDisponibles(productosFormatados);
                }
            } else {
                console.warn('⚠️ [MERMAS] No se encontraron resultados o error en respuesta:', data.message);
                setProductosDisponibles([]);
            }
        } catch (error) {
            console.error('❌ [MERMAS] Error al buscar productos:', error);
            setProductosDisponibles([]);
        } finally {
            setCargandoProductos(false);
        }
    }, [formData.almacen_id]);

    const agregarProducto = (producto: ProductoInventario) => {
        const productoExistente = productos.find(p => p.producto_id === producto.id);
        if (productoExistente) {
            NotificationService.error('Este producto ya está agregado');
            return;
        }

        setProductos(prev => [...prev, {
            producto_id: producto.id,
            producto,
            cantidad: 1,
            costo_unitario: (producto as any).precio_venta || 0,
            lote: '',
            fecha_vencimiento: '',
            observaciones: ''
        }]);

        setBusquedaProducto('');
        setProductosDisponibles([]);
    };

    const eliminarProducto = (index: number) => {
        setProductos(prev => prev.filter((_, i) => i !== index));
    };

    const actualizarProducto = (index: number, campo: keyof ProductoMermaForm, valor: string | number) => {
        setProductos(prev => prev.map((producto, i) =>
            i === index ? { ...producto, [campo]: valor } : producto
        ));
    };

    const validarFormulario = (): boolean => {
        if (!formData.almacen_id) {
            NotificationService.error('Debe seleccionar un almacén');
            return false;
        }

        if (!formData.tipo_merma) {
            NotificationService.error('Debe seleccionar el tipo de merma');
            return false;
        }

        if (!formData.motivo.trim()) {
            NotificationService.error('Debe especificar el motivo de la merma');
            return false;
        }

        if (productos.length === 0) {
            NotificationService.error('Debe agregar al menos un producto');
            return false;
        }

        for (const producto of productos) {
            if (producto.cantidad <= 0) {
                NotificationService.error(`La cantidad del producto ${producto.producto?.nombre} debe ser mayor a 0`);
                return false;
            }
        }

        return true;
    };

    const registrarMerma = async () => {
        if (!validarFormulario()) return;

        setGuardando(true);
        try {
            const response = await fetch('/inventario/mermas/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    ...formData,
                    productos: productos.map((item) => ({
                        producto_id: item.producto_id,
                        cantidad: item.cantidad,
                        costo_unitario: item.costo_unitario,
                        lote: item.lote,
                        fecha_vencimiento: item.fecha_vencimiento,
                        observaciones: item.observaciones
                    }))
                }),
            });

            const result = await response.json();

            if (result.success) {
                NotificationService.success('Merma registrada exitosamente');
                router.visit('/inventario/mermas');
            } else {
                NotificationService.error(result.message || 'Error al registrar merma');
            }
        } catch {
            NotificationService.error('Error al procesar la solicitud');
        } finally {
            setGuardando(false);
        }
    };

    const calcularTotalCosto = () => {
        return productos.reduce((total, producto) => {
            const costo = (producto.costo_unitario || 0) * producto.cantidad;
            return total + costo;
        }, 0);
    };

    if (!can('inventario.mermas.registrar')) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Acceso Denegado" />
                <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Acceso Denegado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        No tienes permisos para registrar mermas.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registrar Merma" />

            <TipoMermaCrudModal open={openTipoModal} onOpenChange={setOpenTipoModal} />
            <EstadoMermaCrudModal open={openEstadoModal} onOpenChange={setOpenEstadoModal} />

            <div className="flex flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Registrar Merma
                        </h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Registrar productos perdidos, dañados o vencidos
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.visit('/inventario/mermas')}
                        >
                            <X className="w-4 h-4" />
                            <span className="ml-2">Cancelar</span>
                        </Button>
                        <Button
                            onClick={registrarMerma}
                            disabled={guardando}
                        >
                            <Save className="w-4 h-4" />
                            <span className="ml-2">
                                {guardando ? 'Registrando...' : 'Registrar Merma'}
                            </span>
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2 mb-2">
                    <Button type="button" variant="secondary" onClick={() => setOpenTipoModal(true)}>
                        Gestionar Tipos de Merma
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setOpenEstadoModal(true)}>
                        Gestionar Estados de Merma
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información General */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Información General
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="almacen">Almacén *</Label>
                                    <select
                                        id="almacen"
                                        value={formData.almacen_id}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                almacen_id: e.target.value
                                            }));
                                            // Limpiar productos cuando cambie el almacén
                                            setProductos([]);
                                            setBusquedaProducto('');
                                            setProductosDisponibles([]);
                                        }}
                                        className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                                    >
                                        <option value="">Seleccionar almacén</option>
                                        {almacenes.map(almacen => (
                                            <option key={almacen.id} value={almacen.id}>
                                                {almacen.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="tipo_merma">Tipo de Merma *</Label>
                                    <select
                                        id="tipo_merma"
                                        value={formData.tipo_merma}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            tipo_merma: e.target.value as TipoMerma
                                        }))}
                                        className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        {tipos.map(tipo => (
                                            <option key={tipo.clave} value={tipo.clave}>
                                                {tipo.label} - {tipo.descripcion}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="motivo">Motivo Específico *</Label>
                                    <Input
                                        id="motivo"
                                        type="text"
                                        value={formData.motivo}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            motivo: e.target.value
                                        }))}
                                        placeholder="Describe el motivo específico de la merma..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="observaciones">Observaciones</Label>
                                    <textarea
                                        id="observaciones"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            observaciones: e.target.value
                                        }))}
                                        rows={3}
                                        className="flex w-full rounded-md border border-input bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                                        placeholder="Observaciones adicionales..."
                                    />
                                </div>
                            </div>

                            {formData.tipo_merma && tipos.find(t => t.clave === formData.tipo_merma)?.requiere_aprobacion && (
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <div className="flex items-center">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            <strong>Nota:</strong> Este tipo de merma requiere aprobación del supervisor.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Productos */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Productos con Merma
                            </h3>

                            {/* Búsqueda de productos */}
                            {formData.almacen_id && (
                                <div className="mb-6">
                                    <Label htmlFor="busqueda-producto">Buscar producto para agregar</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                            <Input
                                                id="busqueda-producto"
                                                type="text"
                                                placeholder="Buscar por nombre, SKU o código..."
                                                value={busquedaProducto}
                                                onChange={(e) => setBusquedaProducto(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        buscarProductos(busquedaProducto);
                                                    }
                                                }}
                                                className="pl-10 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => buscarProductos(busquedaProducto)}
                                            disabled={cargandoProductos || !busquedaProducto.trim()}
                                        >
                                            {cargandoProductos ? 'Buscando...' : 'Buscar'}
                                        </Button>
                                    </div>

                                    {/* Resultados de búsqueda */}
                                    {productosDisponibles.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {productosDisponibles.map((producto) => (
                                                <button
                                                    key={producto.id}
                                                    onClick={() => agregarProducto(producto)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                >
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {producto.nombre}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Código: {producto.codigo} | Stock: {producto.stock_actual || 0}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {cargandoProductos && (
                                        <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                                            Buscando productos...
                                        </div>
                                    )}
                                </div>
                            )}

                            {!formData.almacen_id && (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Selecciona un almacén para buscar productos
                                    </p>
                                </div>
                            )}

                            {/* Lista de productos agregados */}
                            {productos.length === 0 && formData.almacen_id ? (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No hay productos agregados
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        Usa el buscador para agregar productos con merma
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {productos.map((producto, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                    {producto.producto?.nombre}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Código: {producto.producto?.codigo}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <Label className="text-xs">Cantidad *</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        step="0.01"
                                                        value={producto.cantidad}
                                                        onChange={(e) => actualizarProducto(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                        className="w-20 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs">Costo Unit.</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={producto.costo_unitario || ''}
                                                        onChange={(e) => actualizarProducto(index, 'costo_unitario', parseFloat(e.target.value) || 0)}
                                                        className="w-24 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs">Lote</Label>
                                                    <Input
                                                        type="text"
                                                        value={producto.lote || ''}
                                                        onChange={(e) => actualizarProducto(index, 'lote', e.target.value)}
                                                        className="w-24 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                                        placeholder="Opcional"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs">F. Venc.</Label>
                                                    <Input
                                                        type="date"
                                                        value={producto.fecha_vencimiento || ''}
                                                        onChange={(e) => actualizarProducto(index, 'fecha_vencimiento', e.target.value)}
                                                        className="w-36 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                                    />
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => eliminarProducto(index)}
                                                    className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
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
                                Resumen de Merma
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Almacén:</span>
                                    <span className="font-medium">
                                        {formData.almacen_id
                                            ? almacenes.find(a => a.id.toString() === formData.almacen_id)?.nombre
                                            : 'No seleccionado'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                                    <span className="font-medium">
                                        {formData.tipo_merma
                                            ? TIPOS_MERMA[formData.tipo_merma as TipoMerma]?.label
                                            : 'No seleccionado'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total productos:</span>
                                    <span className="font-medium">{productos.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total unidades:</span>
                                    <span className="font-medium">
                                        {productos.reduce((total, producto) => total + producto.cantidad, 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Costo estimado:</span>
                                    <span className="font-medium text-lg">
                                        {new Intl.NumberFormat('es-BO', {
                                            style: 'currency',
                                            currency: 'BOB'
                                        }).format(calcularTotalCosto())}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    * Los campos marcados son obligatorios
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default RegistrarMermaPage;
