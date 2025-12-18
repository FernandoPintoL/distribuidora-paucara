import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import NotificationService from '@/infrastructure/services/notification.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import type { Producto, Almacen, InventarioItem } from '@/domain/entities/inventario-inicial';

interface ModoManualProps {
    items: InventarioItem[];
    productos: Producto[];
    almacenes: Almacen[];
    onAgregarItem: () => void;
    onEliminarItem: (index: number) => void;
    onActualizarItem: (index: number, field: keyof InventarioItem, value: any) => void;
    onGuardar: () => void;
    processing: boolean;
}

export default function ModoManual({
    items,
    productos,
    almacenes,
    onAgregarItem,
    onEliminarItem,
    onActualizarItem,
    onGuardar,
    processing,
}: ModoManualProps) {
    const productosOptions = productos.map(p => ({
        value: p.id,
        label: `${p.nombre}${p.sku ? ` (${p.sku})` : ''}`,
        description: [p.categoria, p.marca].filter(Boolean).join(' • ')
    }));

    const almacenesOptions = almacenes.map(a => ({
        value: a.id,
        label: a.nombre,
        description: a.ubicacion_fisica
    }));

    const productoSeleccionado = (index: number) => {
        const item = items[index];
        if (!item.producto_id) return null;
        return productos.find(p => p.id === item.producto_id);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Formulario Manual</h3>
                    <p className="text-sm text-muted-foreground">
                        Agrega productos uno por uno usando el formulario
                    </p>
                </div>
                <Button onClick={onAgregarItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Item
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-sm">No hay items agregados</p>
                    <p className="text-xs mt-1">Haz clic en "Agregar Item" para comenzar</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item, index) => {
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
                                            onChange={(value) => onActualizarItem(index, 'producto_id', value ? Number(value) : '')}
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
                                            onChange={(value) => onActualizarItem(index, 'almacen_id', value ? Number(value) : '')}
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
                                            onChange={(e) => onActualizarItem(index, 'cantidad', Number(e.target.value))}
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
                                            onChange={(e) => onActualizarItem(index, 'lote', e.target.value)}
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
                                            onChange={(e) => onActualizarItem(index, 'fecha_vencimiento', e.target.value)}
                                        />
                                    </div>

                                    {/* Observaciones */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`obs-${index}`}>
                                            Observaciones (opcional)
                                        </Label>
                                        <Input
                                            id={`obs-${index}`}
                                            value={item.observaciones || ''}
                                            onChange={(e) => onActualizarItem(index, 'observaciones', e.target.value)}
                                            placeholder="Notas sobre este item..."
                                        />
                                    </div>

                                    {/* Botón eliminar */}
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onEliminarItem(index)}
                                            className="w-full"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
