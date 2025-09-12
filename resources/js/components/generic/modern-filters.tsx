// Modern Filters Component for Generic Tables
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X, RefreshCw, ArrowUpDown } from 'lucide-react';
import SearchSelect from '@/components/ui/search-select';
import { useEntitySelect } from '@/hooks/use-search-select';
import type { FilterField, IndexFiltersConfig } from '@/domain/generic';
import type { Filters } from '@/domain/shared';

interface ModernFiltersProps {
    config: IndexFiltersConfig;
    currentFilters: Filters;
    onApplyFilters: (filters: Filters) => void;
    onResetFilters: () => void;
    extraData?: Record<string, unknown>;
    isLoading?: boolean;
}

export default function ModernFilters({
    config,
    currentFilters,
    onApplyFilters,
    onResetFilters,
    extraData,
    isLoading = false
}: ModernFiltersProps) {
    const [filters, setFilters] = React.useState<Filters>(currentFilters);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [orderBy, setOrderBy] = React.useState<string>(
        config.defaultSort?.field || config.sortOptions[0]?.value || 'id'
    );
    const [orderDir, setOrderDir] = React.useState<'asc' | 'desc'>(
        config.defaultSort?.direction || 'desc'
    );

    // Prepare SearchSelect data for specific filters
    const categoriasData = React.useMemo(() => {
        return (extraData?.categorias as { id: number; nombre: string }[]) || [];
    }, [extraData?.categorias]);

    const marcasData = React.useMemo(() => {
        return (extraData?.marcas as { id: number; nombre: string }[]) || [];
    }, [extraData?.marcas]);

    const categoriasSelect = useEntitySelect(categoriasData);
    const marcasSelect = useEntitySelect(marcasData);

    // Sync local state with external filters
    React.useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters]);

    const handleFilterChange = (key: string, value: string | number | boolean | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' || value === '' ? undefined : value
        }));
    };

    const handleApplyFilters = () => {
        onApplyFilters({
            ...filters,
            order_by: orderBy,
            order_dir: orderDir
        });
    };

    const handleResetAll = () => {
        setFilters({});
        setOrderBy(config.defaultSort?.field || config.sortOptions[0]?.value || 'id');
        setOrderDir(config.defaultSort?.direction || 'desc');
        onResetFilters();
    };

    const getActiveFiltersCount = () => {
        return Object.values(filters).filter(value =>
            value !== undefined && value !== null && value !== ''
        ).length;
    };

    const renderFilterField = (field: FilterField) => {
        const value = filters[field.key];
        const fieldId = `filter-${field.key}`;

        switch (field.type) {
            case 'select': {
                const options = field.extraDataKey
                    ? (extraData?.[field.extraDataKey] as { id: number; nombre: string }[]) || []
                    : field.options || [];

                // Use SearchSelect for categoria_id and marca_id in productos module
                const shouldUseSearchSelect = field.extraDataKey &&
                    (field.key === 'categoria_id' || field.key === 'marca_id') &&
                    Array.isArray(options) && options.length > 0;

                if (shouldUseSearchSelect) {
                    let searchSelectOptions: Array<{ value: string | number; label: string; description?: string }>;

                    if (field.key === 'categoria_id') {
                        searchSelectOptions = categoriasSelect.filteredOptions;
                    } else if (field.key === 'marca_id') {
                        searchSelectOptions = marcasSelect.filteredOptions;
                    } else {
                        searchSelectOptions = [];
                    }

                    return (
                        <div key={field.key} className="space-y-1.5">
                            <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
                                {field.label}
                            </Label>
                            <SearchSelect
                                id={fieldId}
                                placeholder={field.placeholder}
                                value={value ? String(value) : ''}
                                options={[
                                    { value: '', label: 'Todos' },
                                    ...searchSelectOptions
                                ]}
                                onChange={(val) => handleFilterChange(field.key, val)}
                                allowClear={true}
                                className="h-8 text-sm border-border/60 hover:border-primary/50 transition-colors"
                                searchPlaceholder={`Buscar ${field.label.toLowerCase()}...`}
                            />
                        </div>
                    );
                }

                // Standard Select for other cases
                return (
                    <div key={field.key} className="space-y-1.5">
                        <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
                            {field.label}
                        </Label>
                        <Select
                            value={value ? String(value) : 'all'}
                            onValueChange={(val) => handleFilterChange(field.key, val)}
                        >
                            <SelectTrigger className="h-8 text-sm border-border/60 hover:border-primary/50 transition-colors">
                                <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {field.extraDataKey ? (
                                    (options as { id: number; nombre: string }[]).map((opt) => (
                                        <SelectItem key={opt.id} value={String(opt.id)}>
                                            {opt.nombre}
                                        </SelectItem>
                                    ))
                                ) : (
                                    field.options?.map(opt => (
                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                            {opt.label}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                );
            }

            case 'boolean': {
                return (
                    <div key={field.key} className="space-y-1.5">
                        <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
                            {field.label}
                        </Label>
                        <Select
                            value={value !== undefined ? String(value) : 'all'}
                            onValueChange={(val) => handleFilterChange(field.key, val)}
                        >
                            <SelectTrigger className="h-8 text-sm border-border/60 hover:border-primary/50 transition-colors">
                                <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="1">Activos</SelectItem>
                                <SelectItem value="0">Inactivos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                );
            }

            case 'text':
            case 'number': {
                return (
                    <div key={field.key} className="space-y-1.5">
                        <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
                            {field.label}
                        </Label>
                        <Input
                            id={fieldId}
                            type={field.type}
                            value={String(value || '')}
                            onChange={(e) => handleFilterChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="h-8 text-sm border-border/60 hover:border-primary/50 transition-colors"
                        />
                    </div>
                );
            }

            case 'date': {
                return (
                    <div key={field.key} className="space-y-2">
                        <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
                            {field.label}
                        </Label>
                        <Input
                            id={fieldId}
                            type="date"
                            value={String(value || '')}
                            onChange={(e) => handleFilterChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="h-9"
                        />
                    </div>
                );
            }

            default:
                return null;
        }
    };

    const getColumnWidth = (width?: string) => {
        switch (width) {
            case 'sm': return 'md:col-span-1';
            case 'md': return 'md:col-span-2';
            case 'lg': return 'md:col-span-3';
            case 'full': return 'md:col-span-4';
            default: return 'md:col-span-1';
        }
    };

    return (
        <div className="space-y-3 bg-gradient-to-r from-card to-card/90 border border-border rounded-lg p-4 shadow-sm">
            {/* Filter Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                            <Filter className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-sm">Filtros avanzados</span>
                        {getActiveFiltersCount() > 0 && (
                            <Badge variant="default" className="text-xs">
                                {getActiveFiltersCount()} activos
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs hover:bg-primary/10 transition-colors"
                    >
                        {isExpanded ? 'Contraer' : 'Expandir'}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetAll}
                        disabled={isLoading}
                        className="text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Limpiar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleApplyFilters}
                        disabled={isLoading}
                        className="text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                    >
                        Aplicar filtros
                    </Button>
                </div>
            </div>

            {/* Quick Sort Controls */}
            <div className="flex items-center gap-3 py-2 px-3 bg-muted/20 rounded-lg border border-border/30">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-muted-foreground">Ordenar por:</Label>
                    <Select value={orderBy} onValueChange={setOrderBy}>
                        <SelectTrigger className="h-8 w-32 text-sm border-border/60 hover:border-primary/50 transition-colors">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {config.sortOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderDir(orderDir === 'asc' ? 'desc' : 'asc')}
                        className="h-8 w-16 text-xs hover:bg-primary/10 transition-colors"
                    >
                        <ArrowUpDown className="h-3 w-3 mr-1" />
                        {orderDir === 'asc' ? 'Asc' : 'Desc'}
                    </Button>
                </div>
            </div>

            {/* Filter Fields */}
            {(isExpanded || getActiveFiltersCount() > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                    {config.filters.map(field => (
                        <div key={field.key} className={getColumnWidth(field.width)}>
                            {renderFilterField(field)}
                        </div>
                    ))}
                </div>
            )}

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && !isExpanded && (
                <div className="flex flex-wrap items-center gap-2 pt-4 px-4 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros activos:</span>
                    {Object.entries(filters).map(([key, value]) => {
                        if (value === undefined || value === null || value === '') return null;
                        const field = config.filters.find(f => f.key === key);
                        if (!field) return null;

                        return (
                            <Badge key={key} variant="default" className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                {field.label}: {String(value)}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 ml-1 hover:bg-destructive/20 hover:text-destructive transition-colors"
                                    onClick={() => handleFilterChange(key, undefined)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}