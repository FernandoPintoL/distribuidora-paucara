import { Trash2, Save, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import SearchSelect from '@/presentation/components/ui/search-select';
import NotificationService from '@/infrastructure/services/notification.service';

interface Producto {
    id: number;
    nombre: string;
    sku?: string | null;
    categoria?: string;
    marca?: string;
}

interface Almacen {
    id: number;
    nombre: string;
}

interface InventarioItem {
    producto_id: number | '';
    almacen_id: number | '';
    cantidad: number | '';
    lote?: string;
    fecha_vencimiento?: string;
    observaciones?: string;
}

interface ModoTablaProps {
    items: InventarioItem[];
    productos: Producto[];
    almacenes: Almacen[];
    onAgregarItem: () => void;
    onActualizarItem: (index: number, field: keyof InventarioItem, value: any) => void;
    onEliminarItem: (index: number) => void;
    onGuardar: () => void;
    processing: boolean;
}

export default function ModoTabla({
    items,
    productos,
    almacenes,
    onAgregarItem,
    onActualizarItem,
    onEliminarItem,
    onGuardar,
    processing,
}: ModoTablaProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col h-full gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">Tabla Editable</h3>
                        <p className="text-sm text-muted-foreground">
                            Edita múltiples productos simultáneamente en una tabla estilo spreadsheet
                        </p>
                    </div>
                    <Button
                        onClick={onAgregarItem}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar Producto
                    </Button>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="text-center py-12">
                        <p className="text-sm">No hay items en la tabla</p>
                        <p className="text-xs mt-1">Haz clic en "Agregar Producto" para comenzar</p>
                    </div>
                </div>
            </div>
        );
    }

    const productoMap = new Map(productos.map(p => [p.id, p]));
    const almacenMap = new Map(almacenes.map(a => [a.id, a]));

    const productosOptions = productos.map(p => ({
        value: p.id,
        label: `${p.nombre}${p.sku ? ` (${p.sku})` : ''}`,
        description: [p.categoria, p.marca].filter(Boolean).join(' • ')
    }));

    const almacenesOptions = almacenes.map(a => ({
        value: a.id,
        label: a.nombre,
    }));

    // Función para detectar duplicados (producto + almacén)
    const verificarDuplicado = (productoId: number, almacenId: number, indexActual: number): boolean => {
        return items.some((item, index) =>
            index !== indexActual &&
            item.producto_id === productoId &&
            item.almacen_id === almacenId
        );
    };

    // Función para obtener nombre de producto
    const obtenerNombreProducto = (productoId: number | '') => {
        if (!productoId) return '';
        return productoMap.get(productoId as number)?.nombre || 'Producto desconocido';
    };

    // Función para obtener nombre de almacén
    const obtenerNombreAlmacen = (almacenId: number | '') => {
        if (!almacenId) return '';
        return almacenMap.get(almacenId as number)?.nombre || 'Almacén desconocido';
    };

    // Función manejadora para cambios con validación
    const handleActualizarConValidacion = (index: number, field: keyof InventarioItem, value: any) => {
        // Si es cambio de producto o almacén, verificar duplicados
        if ((field === 'producto_id' || field === 'almacen_id') && value) {
            const productoId = field === 'producto_id' ? value : items[index].producto_id;
            const almacenId = field === 'almacen_id' ? value : items[index].almacen_id;

            if (productoId && almacenId && verificarDuplicado(Number(productoId), Number(almacenId), index)) {
                NotificationService.warning(
                    `Ya existe "${obtenerNombreProducto(productoId)}" en "${obtenerNombreAlmacen(almacenId)}"`
                );
                return;
            }
        }

        onActualizarItem(index, field, value);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Tabla Editable</h3>
                    <p className="text-sm text-muted-foreground">
                        Edita directamente en las celdas para cambios rápidos
                    </p>
                </div>
                <Button
                    onClick={onAgregarItem}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Agregar Producto
                </Button>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 border-b sticky top-0">
                        <tr>
                            <th className="px-2 py-1.5 text-left font-medium w-10">#</th>
                            <th className="px-2 py-1.5 text-left font-medium min-w-48">Producto</th>
                            <th className="px-2 py-1.5 text-left font-medium min-w-32">Almacén</th>
                            <th className="px-2 py-1.5 text-left font-medium w-20">Cantidad</th>
                            <th className="px-2 py-1.5 text-left font-medium w-24">Lote</th>
                            <th className="px-2 py-1.5 text-left font-medium w-28">Vencimiento</th>
                            <th className="px-2 py-1.5 text-center font-medium w-10">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const hasDuplicado = item.producto_id && item.almacen_id && verificarDuplicado(Number(item.producto_id), Number(item.almacen_id), index);

                            return (
                            <tr key={index} className={`border-b hover:bg-slate-50 dark:hover:bg-slate-900/50 ${hasDuplicado ? 'bg-yellow-50 dark:bg-yellow-950/10' : ''}`}>
                                <td className="px-2 py-1.5 font-medium text-slate-600 dark:text-slate-400 w-10">
                                    {hasDuplicado && <AlertCircle className="h-4 w-4 text-yellow-600 inline mr-1" />}
                                    {index + 1}
                                </td>
                                <td className="px-2 py-1.5 min-w-48">
                                    <SearchSelect
                                        placeholder="Buscar..."
                                        value={item.producto_id ? String(item.producto_id) : ''}
                                        options={productosOptions}
                                        onChange={(value) => handleActualizarConValidacion(index, 'producto_id', value ? Number(value) : '')}
                                        allowClear={true}
                                        emptyText="No encontrado"
                                    />
                                </td>
                                <td className="px-2 py-1.5 min-w-32">
                                    <SearchSelect
                                        placeholder="Almacén..."
                                        value={item.almacen_id ? String(item.almacen_id) : ''}
                                        options={almacenesOptions}
                                        onChange={(value) => handleActualizarConValidacion(index, 'almacen_id', value ? Number(value) : '')}
                                        allowClear={true}
                                        emptyText="N/A"
                                    />
                                </td>
                                <td className="px-2 py-1.5 w-20">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.cantidad}
                                        onChange={(e) => onActualizarItem(index, 'cantidad', Number(e.target.value) || '')}
                                        className="w-full text-center"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="px-2 py-1.5 w-24">
                                    <Input
                                        type="text"
                                        value={item.lote || ''}
                                        onChange={(e) => onActualizarItem(index, 'lote', e.target.value)}
                                        className="w-full text-xs"
                                        placeholder="-"
                                    />
                                </td>
                                <td className="px-2 py-1.5 w-28">
                                    <Input
                                        type="date"
                                        value={item.fecha_vencimiento || ''}
                                        onChange={(e) => onActualizarItem(index, 'fecha_vencimiento', e.target.value)}
                                        className="w-full"
                                    />
                                </td>
                                <td className="px-2 py-1.5 text-center w-10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEliminarItem(index)}
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {items.length > 0 && (
                <div className="flex justify-end gap-3">
                    <Button
                        onClick={onGuardar}
                        disabled={processing || items.length === 0}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Cargar Inventario Inicial ({items.length} items)
                    </Button>
                </div>
            )}
        </div>
    );
}
