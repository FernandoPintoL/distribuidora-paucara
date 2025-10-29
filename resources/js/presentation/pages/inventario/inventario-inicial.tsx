import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import NotificationService from '@/infrastructure/services/notification.service';
import { Trash2, Plus, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface Producto {
    id: number;
    nombre: string;
    sku?: string | null;
    categoria?: string;
    marca?: string;
    unidad?: string;
    stock_minimo?: number;
    tiene_inventario_inicial: boolean;
}

interface Almacen {
    id: number;
    nombre: string;
    ubicacion?: string;
}

interface TipoAjuste {
    id: number;
    clave: string;
    label: string;
    descripcion: string;
}

interface InventarioItem {
    producto_id: number | '';
    almacen_id: number | '';
    cantidad: number | '';
    lote?: string;
    fecha_vencimiento?: string;
    observaciones?: string;
}

interface Props {
    productos: Producto[];
    almacenes: Almacen[];
    tipoInventarioInicial: TipoAjuste;
}

export default function InventarioInicial({ productos, almacenes, tipoInventarioInicial }: Props) {
    const { data, setData, post, processing, errors } = useForm<{ items: InventarioItem[] }>({
        items: []
    });

    const [searchProducto, setSearchProducto] = useState('');
    const [searchAlmacen, setSearchAlmacen] = useState('');

    // Opciones para SearchSelect
    const productosOptions = productos.map(p => ({
        value: p.id,
        label: `${p.nombre}${p.sku ? ` (${p.sku})` : ''}`,
        description: [p.categoria, p.marca].filter(Boolean).join(' • ')
    }));

    const almacenesOptions = almacenes.map(a => ({
        value: a.id,
        label: a.nombre,
        description: a.ubicacion
    }));

    const agregarItem = () => {
        setData('items', [
            ...data.items,
            {
                producto_id: '',
                almacen_id: '',
                cantidad: '',
                lote: '',
                fecha_vencimiento: '',
                observaciones: ''
            }
        ]);
    };

    const eliminarItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
    };

    const actualizarItem = (index: number, field: keyof InventarioItem, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const validarYGuardar = async () => {
        // Validaciones
        if (data.items.length === 0) {
            NotificationService.error('Debe agregar al menos un item');
            return;
        }

        const errores: string[] = [];

        data.items.forEach((item, index) => {
            if (!item.producto_id) {
                errores.push(`Item ${index + 1}: Debe seleccionar un producto`);
            }
            if (!item.almacen_id) {
                errores.push(`Item ${index + 1}: Debe seleccionar un almacén`);
            }
            if (item.cantidad <= 0) {
                errores.push(`Item ${index + 1}: La cantidad debe ser mayor a 0`);
            }
        });

        if (errores.length > 0) {
            errores.forEach(err => NotificationService.error(err));
            return;
        }

        // Confirmar antes de guardar
        const confirmado = await NotificationService.confirm(
            `¿Confirmar carga de ${data.items.length} items de inventario inicial?`,
            {
                confirmText: 'Sí, cargar inventario',
                cancelText: 'Cancelar',
                description: 'Esta acción registrará el inventario inicial en los almacenes seleccionados.'
            }
        );

        if (!confirmado) return;

        // Enviar al backend
        post(route('inventario.inicial.store'), {
            onSuccess: () => {
                NotificationService.success('Inventario inicial cargado exitosamente');
                setData('items', []);
            },
            onError: (errors) => {
                console.error('Errores:', errors);
                Object.values(errors).forEach(error => {
                    NotificationService.error(String(error));
                });
            }
        });
    };

    const productoSeleccionado = (index: number) => {
        const item = data.items[index];
        if (!item.producto_id) return null;
        return productos.find(p => p.id === item.producto_id);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Inventario', href: route('inventario.dashboard') },
            { title: 'Carga Inicial', href: route('inventario.inicial.index') }
        ]}>
            <Head title="Carga Masiva de Inventario Inicial" />

            <div className="space-y-6">
                {/* Header con información */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-6 w-6 text-purple-600" />
                            Carga Masiva de Inventario Inicial
                        </CardTitle>
                        <CardDescription>
                            Registra el stock existente en tus almacenes al implementar el sistema por primera vez
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-2">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                        Tipo de ajuste: {tipoInventarioInicial.label}
                                    </p>
                                    <p className="text-xs text-purple-700 dark:text-purple-300">
                                        {tipoInventarioInicial.descripcion}
                                    </p>
                                    <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
                                        <li>Usa este módulo solo UNA VEZ al implementar el sistema</li>
                                        <li>Registra el stock real que tienes actualmente en cada almacén</li>
                                        <li>Puedes filtrar estos movimientos en reportes para ver solo operaciones del día a día</li>
                                        <li>Si un producto ya tiene inventario inicial, se agregará como ajuste adicional</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de items */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Items de Inventario</CardTitle>
                            <CardDescription>
                                {data.items.length} item{data.items.length !== 1 ? 's' : ''} agregado{data.items.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        <Button onClick={agregarItem} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Item
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {data.items.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-sm">No hay items agregados</p>
                                <p className="text-xs mt-1">Haz clic en "Agregar Item" para comenzar</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.items.map((item, index) => {
                                    const producto = productoSeleccionado(index);
                                    return (
                                        <div key={index} className="border rounded-lg p-4 space-y-4 bg-card relative">
                                            {/* Badge con número de item */}
                                            <div className="absolute -top-3 left-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                                #{index + 1}
                                            </div>

                                            {/* Advertencia si ya tiene inventario inicial */}
                                            {producto?.tiene_inventario_inicial && (
                                                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded p-2 flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-orange-700 dark:text-orange-300">
                                                        Este producto ya tiene inventario inicial cargado. Se agregará como ajuste adicional.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {/* Producto */}
                                                <div className="space-y-2">
                                                    <Label htmlFor={`producto-${index}`}>
                                                        Producto <span className="text-red-500">*</span>
                                                    </Label>
                                                    <SearchSelect
                                                        id={`producto-${index}`}
                                                        placeholder="Buscar producto..."
                                                        value={item.producto_id ? String(item.producto_id) : ''}
                                                        options={productosOptions}
                                                        onChange={(value) => actualizarItem(index, 'producto_id', value ? Number(value) : '')}
                                                        allowClear={true}
                                                        emptyText="No se encontraron productos"
                                                    />
                                                </div>

                                                {/* Almacén */}
                                                <div className="space-y-2">
                                                    <Label htmlFor={`almacen-${index}`}>
                                                        Almacén <span className="text-red-500">*</span>
                                                    </Label>
                                                    <SearchSelect
                                                        id={`almacen-${index}`}
                                                        placeholder="Seleccionar almacén..."
                                                        value={item.almacen_id ? String(item.almacen_id) : ''}
                                                        options={almacenesOptions}
                                                        onChange={(value) => actualizarItem(index, 'almacen_id', value ? Number(value) : '')}
                                                        allowClear={true}
                                                        emptyText="No se encontraron almacenes"
                                                    />
                                                </div>

                                                {/* Cantidad */}
                                                <div className="space-y-2">
                                                    <Label htmlFor={`cantidad-${index}`}>
                                                        Cantidad <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id={`cantidad-${index}`}
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.cantidad}
                                                        onChange={(e) => actualizarItem(index, 'cantidad', Number(e.target.value))}
                                                        placeholder="Ej: 100"
                                                    />
                                                </div>

                                                {/* Lote */}
                                                <div className="space-y-2">
                                                    <Label htmlFor={`lote-${index}`}>
                                                        Lote (opcional)
                                                    </Label>
                                                    <Input
                                                        id={`lote-${index}`}
                                                        value={item.lote || ''}
                                                        onChange={(e) => actualizarItem(index, 'lote', e.target.value)}
                                                        placeholder="Código de lote"
                                                    />
                                                </div>

                                                {/* Fecha de vencimiento */}
                                                <div className="space-y-2">
                                                    <Label htmlFor={`fecha-${index}`}>
                                                        Fecha de vencimiento (opcional)
                                                    </Label>
                                                    <Input
                                                        id={`fecha-${index}`}
                                                        type="date"
                                                        value={item.fecha_vencimiento || ''}
                                                        onChange={(e) => actualizarItem(index, 'fecha_vencimiento', e.target.value)}
                                                    />
                                                </div>

                                                {/* Botón eliminar */}
                                                <div className="flex items-end">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => eliminarItem(index)}
                                                        className="w-full"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Observaciones */}
                                            <div className="space-y-2">
                                                <Label htmlFor={`obs-${index}`}>
                                                    Observaciones (opcional)
                                                </Label>
                                                <Input
                                                    id={`obs-${index}`}
                                                    value={item.observaciones || ''}
                                                    onChange={(e) => actualizarItem(index, 'observaciones', e.target.value)}
                                                    placeholder="Agregar comentario o nota sobre este item..."
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Botones de acción */}
                {data.items.length > 0 && (
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route('inventario.dashboard'))}
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={validarYGuardar}
                            disabled={processing || data.items.length === 0}
                        >
                            {processing ? (
                                <>
                                    <span className="mr-2">Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Cargar Inventario Inicial ({data.items.length} items)
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
