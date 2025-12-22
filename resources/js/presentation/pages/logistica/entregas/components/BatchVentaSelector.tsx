import { useState, useMemo } from 'react';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Badge } from '@/presentation/components/ui/badge';
import { CheckCircle2, Package, Search } from 'lucide-react';

interface Venta {
    id: number;
    numero_venta: string;
    total: number;
    fecha_venta: string;
    cliente: {
        id: number;
        nombre: string;
    };
    cantidad_items: number;
    peso_estimado: number;
}

interface BatchVentaSelectorProps {
    ventas: Venta[];
    selectedIds: number[];
    onToggleVenta: (ventaId: number) => void;
    onSelectAll: (ventaIds: number[]) => void;
    onClearSelection: () => void;
}

export default function BatchVentaSelector({
    ventas,
    selectedIds,
    onToggleVenta,
    onSelectAll,
    onClearSelection,
}: BatchVentaSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar ventas por búsqueda
    const filteredVentas = useMemo(() => {
        return ventas.filter((venta) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                venta.numero_venta.toLowerCase().includes(searchLower) ||
                venta.cliente.nombre.toLowerCase().includes(searchLower)
            );
        });
    }, [ventas, searchTerm]);

    // Calcular totales
    const totalSeleccionado = useMemo(() => {
        return {
            cantidad: selectedIds.length,
            peso: ventas
                .filter((v) => selectedIds.includes(v.id))
                .reduce((sum, v) => sum + v.peso_estimado, 0),
            monto: ventas
                .filter((v) => selectedIds.includes(v.id))
                .reduce((sum, v) => sum + v.total, 0),
        };
    }, [ventas, selectedIds]);

    return (
        <div className="space-y-4">
            {/* Encabezado y búsqueda */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-gray-900 dark:text-white">
                        Seleccionar Ventas
                    </Label>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedIds.length} seleccionadas
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Buscar por número de venta o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                    />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onSelectAll(ventas.map((v) => v.id))}
                        className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200"
                    >
                        Seleccionar Todo
                    </button>
                    <button
                        onClick={onClearSelection}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Lista de ventas */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredVentas.length === 0 ? (
                    <Card className="p-4 text-center text-gray-500 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-400">
                        No hay ventas disponibles
                    </Card>
                ) : (
                    filteredVentas.map((venta) => {
                        const isSelected = selectedIds.includes(venta.id);
                        return (
                            <Card
                                key={venta.id}
                                onClick={() => onToggleVenta(venta.id)}
                                className={`cursor-pointer transition-all p-3 ${
                                    isSelected
                                        ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:shadow-md dark:hover:bg-slate-800'
                                } dark:bg-slate-900 dark:border-slate-700`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox visual */}
                                    <div className="mt-0.5">
                                        {isSelected ? (
                                            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <div className="h-5 w-5 rounded border-2 border-gray-300 dark:border-gray-600" />
                                        )}
                                    </div>

                                    {/* Información */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {venta.numero_venta}
                                            </h4>
                                            <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                                {venta.cliente.nombre}
                                            </Badge>
                                        </div>

                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                <span>
                                                    {venta.cantidad_items} artículos • {venta.peso_estimado} kg
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs">
                                                    Fecha: {venta.fecha_venta}
                                                </span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    Bs {venta.total.toLocaleString('es-BO', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Resumen de selección */}
            {selectedIds.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-3">
                    <div className="text-sm space-y-2">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200">Resumen de Selección</h4>
                        <div className="grid grid-cols-3 gap-2 text-blue-800 dark:text-blue-300">
                            <div>
                                <span className="text-xs opacity-75">Ventas</span>
                                <p className="font-semibold">{totalSeleccionado.cantidad}</p>
                            </div>
                            <div>
                                <span className="text-xs opacity-75">Peso Total</span>
                                <p className="font-semibold">{totalSeleccionado.peso.toFixed(1)} kg</p>
                            </div>
                            <div>
                                <span className="text-xs opacity-75">Monto</span>
                                <p className="font-semibold">
                                    Bs {totalSeleccionado.monto.toLocaleString('es-BO', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
