import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Badge } from '@/presentation/components/ui/badge';
import { Calendar, Filter, X, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/presentation/components/ui/collapsible';
import type { FiltrosMovimientos as IFiltrosMovimientos } from '@/domain/entities/movimientos-inventario';

interface TipoAjuste {
    id: number;
    clave: string;
    label: string;
}

interface FiltrosMovimientosProps {
    filtros: IFiltrosMovimientos;
    onFiltrosChange: (filtros: IFiltrosMovimientos) => void;
    almacenes: Array<{ id: number; nombre: string; }>;
    productos: Array<{ id: number; nombre: string; codigo?: string; }>;
    tiposAjuste?: TipoAjuste[];
    showAdvanced?: boolean;
}

const tiposMovimiento = [
    { value: 'ENTRADA', label: 'Entradas' },
    { value: 'SALIDA', label: 'Salidas' },
    { value: 'AJUSTE', label: 'Ajustes' },
    { value: 'TRANSFERENCIA', label: 'Transferencias' },
    { value: 'MERMA', label: 'Mermas' },
    { value: 'PRODUCCION', label: 'Producción' },
    { value: 'DEVOLUCION', label: 'Devoluciones' },
];

export default function FiltrosMovimientos({
    filtros,
    onFiltrosChange,
    almacenes,
    productos,
    tiposAjuste = [],
    showAdvanced = false
}: FiltrosMovimientosProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Convertir opciones a formato SearchSelect
    const tiposMovimientoOptions = tiposMovimiento.map(tipo => ({
        value: tipo.value,
        label: tipo.label,
    }));

    const almacenesOptions = almacenes.map(a => ({
        value: a.id.toString(),
        label: a.nombre,
    }));

    const productosOptions = productos.map(p => ({
        value: p.id.toString(),
        label: p.codigo ? `${p.codigo} - ${p.nombre}` : p.nombre,
    }));

    const tiposAjusteOptions = tiposAjuste.map(ta => ({
        value: ta.id.toString(),
        label: ta.label,
        description: ta.clave,
    }));

    const updateFiltro = (key: keyof IFiltrosMovimientos, value: string | number | boolean | undefined) => {
        onFiltrosChange({
            ...filtros,
            [key]: value
        });
    };

    const clearFiltro = (key: keyof IFiltrosMovimientos) => {
        const newFiltros = { ...filtros };
        delete newFiltros[key];
        onFiltrosChange(newFiltros);
    };

    const clearAllFiltros = () => {
        onFiltrosChange({});
    };

    const hasActiveFilters = Object.keys(filtros).length > 0;

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-2">
                                {Object.keys(filtros).length}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFiltros}
                                className="text-muted-foreground"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Limpiar
                            </Button>
                        )}
                        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {isOpen ? 'Ocultar' : 'Mostrar'} filtros
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    </div>
                </div>
            </CardHeader>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <CardContent className="space-y-4">
                        {/* Búsqueda general */}
                        <div className="space-y-2">
                            <Label htmlFor="search">Búsqueda general</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Buscar por producto, referencia, observaciones..."
                                    value={filtros.search || ''}
                                    onChange={(e) => updateFiltro('search', e.target.value)}
                                    className="pl-9"
                                />
                                {filtros.search && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                        onClick={() => clearFiltro('search')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Tipo de movimiento */}
                            <div className="space-y-2">
                                <Label>Tipo de movimiento</Label>
                                <SearchSelect
                                    placeholder="Seleccionar tipo..."
                                    value={filtros.tipo || ''}
                                    options={tiposMovimientoOptions}
                                    onChange={(value) => updateFiltro('tipo', value || undefined)}
                                    allowClear={true}
                                    emptyText="No se encontraron tipos"
                                />
                            </div>

                            {/* Tipo de Ajuste */}
                            {tiposAjusteOptions.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Tipo de Ajuste</Label>
                                    <SearchSelect
                                        placeholder="Seleccionar ajuste..."
                                        value={filtros.tipo_ajuste_id?.toString() || ''}
                                        options={tiposAjusteOptions}
                                        onChange={(value) => updateFiltro('tipo_ajuste_id', value ? parseInt(value) : undefined)}
                                        allowClear={true}
                                        emptyText="No se encontraron ajustes"
                                    />
                                </div>
                            )}

                            {/* Almacén */}
                            <div className="space-y-2">
                                <Label>Almacén</Label>
                                <SearchSelect
                                    placeholder="Seleccionar almacén..."
                                    value={filtros.almacen_id?.toString() || ''}
                                    options={almacenesOptions}
                                    onChange={(value) => updateFiltro('almacen_id', value ? parseInt(value) : undefined)}
                                    allowClear={true}
                                    emptyText="No se encontraron almacenes"
                                />
                            </div>

                            {/* Fecha desde */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_desde">Fecha desde</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fecha_desde"
                                        type="date"
                                        value={filtros.fecha_desde || ''}
                                        onChange={(e) => updateFiltro('fecha_desde', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Fecha hasta */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_hasta">Fecha hasta</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fecha_hasta"
                                        type="date"
                                        value={filtros.fecha_hasta || ''}
                                        onChange={(e) => updateFiltro('fecha_hasta', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                                {/* Producto específico */}
                                <div className="space-y-2">
                                    <Label>Producto</Label>
                                    <SearchSelect
                                        placeholder="Buscar producto..."
                                        value={filtros.producto_id?.toString() || ''}
                                        options={productosOptions}
                                        onChange={(value) => updateFiltro('producto_id', value ? parseInt(value) : undefined)}
                                        allowClear={true}
                                        emptyText="No se encontraron productos"
                                    />
                                </div>

                                {/* Número de referencia */}
                                <div className="space-y-2">
                                    <Label htmlFor="numero_referencia">Número de referencia</Label>
                                    <Input
                                        id="numero_referencia"
                                        placeholder="Ej: FAC-001, TRANSF-100..."
                                        value={filtros.numero_referencia || ''}
                                        onChange={(e) => updateFiltro('numero_referencia', e.target.value)}
                                    />
                                </div>

                                {/* Cantidad mínima */}
                                <div className="space-y-2">
                                    <Label htmlFor="cantidad_min">Cantidad mínima</Label>
                                    <Input
                                        id="cantidad_min"
                                        type="number"
                                        placeholder="0"
                                        value={filtros.cantidad_min || ''}
                                        onChange={(e) => updateFiltro('cantidad_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Filtros activos */}
                        {hasActiveFilters && (
                            <div className="pt-4 border-t">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-muted-foreground">Filtros activos:</span>
                                    {Object.entries(filtros).map(([key, value]) => {
                                        if (!value) return null;

                                        let displayValue = value.toString();
                                        let displayKey = key;

                                        // Personalizar la visualización de algunos filtros
                                        if (key === 'almacen_id') {
                                            const almacen = almacenes.find(a => a.id === value);
                                            displayValue = almacen?.nombre || value.toString();
                                            displayKey = 'Almacén';
                                        } else if (key === 'producto_id') {
                                            const producto = productos.find(p => p.id === value);
                                            displayValue = producto?.nombre || value.toString();
                                            displayKey = 'Producto';
                                        } else if (key === 'tipo') {
                                            const tipo = tiposMovimiento.find(t => t.value === value);
                                            displayValue = tipo?.label || value.toString();
                                            displayKey = 'Tipo';
                                        } else if (key === 'tipo_ajuste_id') {
                                            const ajuste = tiposAjuste.find(ta => ta.id === value);
                                            displayValue = ajuste?.label || value.toString();
                                            displayKey = 'Tipo Ajuste';
                                        }

                                        return (
                                            <Badge
                                                key={key}
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {displayKey}: {displayValue}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-3 w-3 p-0 hover:bg-transparent"
                                                    onClick={() => clearFiltro(key as keyof IFiltrosMovimientos)}
                                                >
                                                    <X className="h-2 w-2" />
                                                </Button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
