import { ChevronDown, ChevronUp } from 'lucide-react';
import { Almacen } from '@/domain/entities/almacenes';
import {
    InventarioInicialBorradorItem,
} from '@/domain/entities/inventario-inicial';
import type { Id } from '@/domain/entities/shared';
import AlmacenRegistroRow from './almacen-registro-row';

interface Props {
    item: InventarioInicialBorradorItem;
    almacenes: Almacen[];
    expanded: boolean;
    onToggleExpand: (productoId: Id) => void;
    onGuardarItem: (
        productoId: Id,
        almacenId: Id,
        cantidad?: number,
        lote?: string,
        fechaVencimiento?: string
    ) => Promise<void>;
    allItems: InventarioInicialBorradorItem[];
}

export default function ProductoRowExpandible({
    item,
    almacenes,
    expanded,
    onToggleExpand,
    onGuardarItem,
    allItems,
}: Props) {
    // const [eliminando, setEliminando] = useState(false);

    // Obtener todos los items del mismo producto
    const itemsProducto = allItems.filter(i => i.producto_id === item.producto_id);

    // Contar almacenes completados
    const almacenesCompletados = itemsProducto.filter(
        i => i.cantidad && i.cantidad > 0
    ).length;

    const porcentajeCompletado = (almacenesCompletados / almacenes.length) * 100;

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            {/* Fila principal del producto */}
            <button
                onClick={() => onToggleExpand(item.producto_id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {item.producto?.nombre}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                SKU: {item.producto?.sku}
                            </p>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-32">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${porcentajeCompletado}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[30px] text-right">
                                    {almacenesCompletados}/{almacenes.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ml-4">
                    {expanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
            </button>

            {/* Filas de almacenes */}
            {expanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                    {almacenes.map((almacen) => {
                        // Obtener todos los items para este almacén (puede haber múltiples lotes)
                        const itemsAlmacen = allItems.filter(
                            i =>
                                i.producto_id === item.producto_id &&
                                i.almacen_id === almacen.id
                        );

                        return (
                            <div key={`${item.producto_id}-${almacen.id}`}>
                                {itemsAlmacen.length > 0 ? (
                                    itemsAlmacen.map((itemLote, idx) => (
                                        <AlmacenRegistroRow
                                            key={`${item.producto_id}-${almacen.id}-${idx}`}
                                            producto={item.producto!}
                                            almacen={almacen}
                                            item={itemLote}
                                            onGuardarItem={onGuardarItem}
                                            mostrarNombreAlmacen={idx === 0}
                                        />
                                    ))
                                ) : (
                                    <AlmacenRegistroRow
                                        key={`${item.producto_id}-${almacen.id}-nuevo`}
                                        producto={item.producto!}
                                        almacen={almacen}
                                        item={undefined}
                                        onGuardarItem={onGuardarItem}
                                        mostrarNombreAlmacen={true}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
