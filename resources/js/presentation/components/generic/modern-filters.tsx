// Modern Filters Component for Generic Tables
import React from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Filter, RotateCcw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchSelect from '@/presentation/components/ui/search-select';
import { useEntitySelect } from '@/presentation/hooks/use-search-select';
import type { FilterField, IndexFiltersConfig } from '@/domain/entities/generic';
import type { Filters } from '@/domain/entities/shared';

interface ModernFiltersProps {
    config: IndexFiltersConfig;
    currentFilters: Filters;
    onApplyFilters: (filters: Filters) => void;
    onResetFilters: () => void;
    extraData?: Record<string, unknown>;
    isLoading?: boolean;
    className?: string;
}

export default function ModernFilters({
    config,
    currentFilters,
    onApplyFilters,
    onResetFilters,
    extraData,
    className
}: ModernFiltersProps) {
    const [filters, setFilters] = React.useState<Filters>(currentFilters);
    const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = React.useState(false); // 🆕 Siempre empiezan cerrados
    const [searchQuery, setSearchQuery] = React.useState<string>(String(currentFilters.q || ''));

    // Prepare SearchSelect data for specific filters
    const categoriasData = React.useMemo(() => {
        return (extraData?.categorias as { id: number; nombre: string }[]) || [];
    }, [extraData?.categorias]);

    const marcasData = React.useMemo(() => {
        return (extraData?.marcas as { id: number; nombre: string }[]) || [];
    }, [extraData?.marcas]);

    const localidadesData = React.useMemo(() => {
        return (extraData?.localidades as { id: number; nombre: string; codigo: string }[]) || [];
    }, [extraData?.localidades]);

    const categoriasSelect = useEntitySelect(categoriasData);
    const marcasSelect = useEntitySelect(marcasData);
    const localidadesSelect = useEntitySelect(localidadesData);

    // Sync local state with external filters
    React.useEffect(() => {
        setFilters(currentFilters);
        setSearchQuery(String(currentFilters.q || ''));
    }, [currentFilters]);

    const handleFilterChange = (key: string, value: string | number | boolean | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' || value === '' ? undefined : value
        }));
    };

    const aplicarFiltros = () => {
        const filtrosLimpios = Object.fromEntries(
            Object.entries({ ...filters, q: searchQuery }).filter(([, value]) => value !== '' && value != null)
        );
        onApplyFilters(filtrosLimpios);
    };

    const limpiarFiltros = () => {
        setFilters({});
        setSearchQuery('');
        onResetFilters();
    };

    const busquedaRapida = (e: React.FormEvent) => {
        e.preventDefault();
        const filtrosParaBusqueda = {
            ...Object.fromEntries(
                Object.entries(filters).filter(([key, value]) =>
                    key !== 'q' && value !== '' && value != null
                )
            ),
            q: searchQuery
        };
        onApplyFilters(filtrosParaBusqueda);
    };

    const hayFiltrosActivos = Object.values({ ...filters, q: searchQuery }).some(value =>
        value !== '' && value != null
    );

    const renderFilterField = (field: FilterField) => {
        const value = filters[field.key];
        const fieldId = `filter-${field.key}`;

        switch (field.type) {
            case 'select': {
                const options = field.extraDataKey
                    ? (extraData?.[field.extraDataKey] as { id: number; nombre: string }[]) || []
                    : field.options || [];

                // Use SearchSelect for categoria_id, marca_id, and localidad_id
                const shouldUseSearchSelect = field.extraDataKey &&
                    (field.key === 'categoria_id' || field.key === 'marca_id' || field.key === 'localidad_id') &&
                    Array.isArray(options) && options.length > 0;

                if (shouldUseSearchSelect) {
                    let searchSelectOptions: Array<{ value: string | number; label: string; description?: string }>;

                    if (field.key === 'categoria_id') {
                        searchSelectOptions = categoriasSelect.filteredOptions;
                    } else if (field.key === 'marca_id') {
                        searchSelectOptions = marcasSelect.filteredOptions;
                    } else if (field.key === 'localidad_id') {
                        searchSelectOptions = localidadesSelect.filteredOptions;
                    } else {
                        searchSelectOptions = [];
                    }

                    return (
                        <div key={field.key}>
                            <Label htmlFor={fieldId} className="text-sm font-medium">
                                {field.label}
                            </Label>
                            <SearchSelect
                                id={fieldId}
                                placeholder={field.placeholder}
                                value={value ? String(value) : ''}
                                options={searchSelectOptions}
                                onChange={(val) => handleFilterChange(field.key, val)}
                                allowClear={true}
                                emptyText={`No hay ${field.label.toLowerCase()} disponibles`}
                            />
                        </div>
                    );
                }

                // Standard Select for other cases
                return (
                    <div key={field.key}>
                        <Label htmlFor={fieldId} className="text-sm font-medium">
                            {field.label}
                        </Label>
                        <SearchSelect
                            id={fieldId}
                            placeholder={field.placeholder}
                            value={value ? String(value) : ''}
                            options={field.extraDataKey ?
                                (options as { id: number; nombre: string }[]).map(opt => ({
                                    value: opt.id,
                                    label: opt.nombre
                                })) :
                                field.options?.map(opt => ({
                                    value: opt.value,
                                    label: opt.label
                                })) || []
                            }
                            onChange={(val) => handleFilterChange(field.key, val)}
                            allowClear={true}
                            emptyText={`No hay ${field.label.toLowerCase()} disponibles`}
                        />
                    </div>
                );
            }

            case 'boolean': {
                return (
                    <div key={field.key}>
                        <Label htmlFor={fieldId} className="text-sm font-medium">
                            {field.label}
                        </Label>
                        <SearchSelect
                            id={fieldId}
                            placeholder={field.placeholder}
                            value={value !== undefined ? String(value) : ''}
                            options={[
                                { value: '1', label: 'Activos' },
                                { value: '0', label: 'Inactivos' },
                            ]}
                            onChange={(val) => handleFilterChange(field.key, val)}
                            allowClear={true}
                            emptyText="No hay estados disponibles"
                        />
                    </div>
                );
            }

            case 'text':
            case 'number': {
                return (
                    <div key={field.key}>
                        <Label htmlFor={fieldId} className="text-sm font-medium">
                            {field.label}
                        </Label>
                        <Input
                            id={fieldId}
                            type={field.type}
                            value={String(value || '')}
                            onChange={(e) => handleFilterChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            min={field.type === 'number' ? '0' : undefined}
                        />
                    </div>
                );
            }

            case 'date': {
                return (
                    <div key={field.key}>
                        <Label htmlFor={fieldId} className="text-sm font-medium">
                            {field.label}
                        </Label>
                        <Input
                            id={fieldId}
                            type="date"
                            value={String(value || '')}
                            onChange={(e) => handleFilterChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                        />
                    </div>
                );
            }

            default:
                return null;
        }
    };

    // Opciones de ordenamiento
    const opcionesOrden = config.sortOptions || [
        { value: 'created_at', label: 'Fecha de creación' },
        { value: 'id', label: 'ID' },
    ];

    return (
        <div className={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4', className)}>
            {/* Búsqueda rápida */}
            <form onSubmit={busquedaRapida} className="flex gap-3">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <Button type="submit" variant="outline" size="sm">
                    <Search className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                    className={cn(
                        mostrarFiltrosAvanzados && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    )}
                >
                    <Filter className="h-4 w-4 mr-1" />
                    Filtros
                </Button>
                {hayFiltrosActivos && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={limpiarFiltros}
                    >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Limpiar
                    </Button>
                )}
            </form>

            {/* Filtros avanzados */}
            {mostrarFiltrosAvanzados && (
                <div className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {config.filters.map(field => renderFilterField(field))}
                    </div>

                    {/* Ordenamiento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sort_by" className="text-sm font-medium">
                                Ordenar por
                            </Label>
                            <SearchSelect
                                id="sort_by"
                                placeholder="Campo de ordenamiento"
                                value={String(filters.order_by || opcionesOrden[0]?.value || 'id')}
                                options={opcionesOrden}
                                onChange={value => handleFilterChange('order_by', String(value))}
                                allowClear={false}
                            />
                        </div>

                        <div>
                            <Label htmlFor="sort_dir" className="text-sm font-medium">
                                Dirección
                            </Label>
                            <SearchSelect
                                id="sort_dir"
                                placeholder="Dirección"
                                value={String(filters.order_dir || 'desc')}
                                options={[
                                    { value: 'asc', label: 'Ascendente' },
                                    { value: 'desc', label: 'Descendente' },
                                ]}
                                onChange={value => handleFilterChange('order_dir', String(value))}
                                allowClear={false}
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMostrarFiltrosAvanzados(false)}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Cerrar
                        </Button>
                        <Button
                            type="button"
                            onClick={aplicarFiltros}
                            size="sm"
                        >
                            Aplicar Filtros
                        </Button>
                    </div>
                </div>
            )}

            {/* Indicadores de filtros activos */}
            {hayFiltrosActivos && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Filtros activos:</span>
                    {searchQuery && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Búsqueda: {searchQuery}
                        </span>
                    )}
                    {Object.entries(filters).map(([key, value]) => {
                        if (value === undefined || value === null || value === '') return null;
                        const field = config.filters.find(f => f.key === key);
                        if (!field) return null;

                        let displayValue = String(value);

                        // Mostrar nombres en lugar de IDs para selects
                        if (field.type === 'select' && field.extraDataKey) {
                            const options = extraData?.[field.extraDataKey] as { id: number; nombre: string }[];
                            const option = options?.find(opt => opt.id === Number(value));
                            displayValue = option?.nombre || displayValue;
                        } else if (field.type === 'boolean') {
                            displayValue = value === '1' ? 'Activos' : 'Inactivos';
                        }

                        return (
                            <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {field.label}: {displayValue}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
