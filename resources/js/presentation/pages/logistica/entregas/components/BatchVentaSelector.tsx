import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Badge } from '@/presentation/components/ui/badge';
import { CheckCircle2, Package, Search, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { VentaConDetalles } from '@/domain/entities/entregas';
import type { Id } from '@/domain/entities/shared';

interface BatchVentaSelectorProps {
    ventas: VentaConDetalles[];
    selectedIds: Id[];
    ventasAsignadas?: Id[]; // 🔧 NUEVO: IDs de ventas ya asignadas (para modo edición)
    onToggleVenta: (ventaId: Id) => void;
    onSelectAll: (ventaIds: Id[]) => void;
    onClearSelection: () => void;
}

export default function BatchVentaSelector({
    ventas,
    selectedIds,
    ventasAsignadas = [],
    onToggleVenta,
    onSelectAll,
    onClearSelection,
}: BatchVentaSelectorProps) {
    console.log('Renderizando BatchVentaSelector');
    console.log('Ventas disponibles:', ventas);
    console.log('Ventas seleccionadas:', selectedIds);
    console.log('Ventas asignadas:', ventasAsignadas);
    const [searchInputValue, setSearchInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [expandedLocalidades, setExpandedLocalidades] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<VentaConDetalles[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasSearched, setHasSearched] = useState(false);
    const [isDateFilterExpanded, setIsDateFilterExpanded] = useState(false);

    // Función para aplicar búsqueda en BD
    const handleSearch = useCallback(async () => {
        if (!searchInputValue && !fechaDesde && !fechaHasta) {
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const params = new URLSearchParams();
            if (searchInputValue) params.append('q', searchInputValue);
            if (fechaDesde) params.append('fecha_desde', fechaDesde);
            if (fechaHasta) params.append('fecha_hasta', fechaHasta);
            params.append('page', '1');

            const response = await fetch(`/logistica/entregas/ventas/search?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Error al buscar ventas');
            }

            const data = await response.json();
            setSearchResults(data.data);
            setTotalPages(data.pagination.last_page);
            setCurrentPage(1);
            setSearchTerm(searchInputValue);
            setHasSearched(true);
        } catch (error) {
            setSearchError(error instanceof Error ? error.message : 'Error desconocido');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [searchInputValue, fechaDesde, fechaHasta]);

    // Función para limpiar búsqueda
    const handleClearSearch = useCallback(() => {
        setSearchInputValue('');
        setSearchTerm('');
        setSearchResults([]);
        setHasSearched(false);
        setSearchError(null);
        setCurrentPage(1);
    }, []);

    // Manejar Enter en el input
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Filtrar ventas: usar resultados de búsqueda BD si existe, sino usar datos locales
    const filteredVentas = useMemo(() => {
        // Si hay búsqueda activa, usar resultados de búsqueda en BD
        if (hasSearched && searchResults.length > 0) {
            return searchResults;
        }
        // Sino, usar datos iniciales cargados
        return ventas;
    }, [ventas, searchResults, hasSearched]);

    // Agrupar ventas por localidad
    const ventasPorLocalidad = useMemo(() => {
        const grupos = new Map<string, { nombre: string; ventas: VentaConDetalles[] }>();

        filteredVentas.forEach((venta) => {
            const localidadKey = venta.cliente.localidad?.nombre || 'Sin localidad';
            if (!grupos.has(localidadKey)) {
                grupos.set(localidadKey, {
                    nombre: localidadKey,
                    ventas: [],
                });
            }
            grupos.get(localidadKey)!.ventas.push(venta);
        });

        // Ordenar localidades alfabéticamente
        return Array.from(grupos.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, grupo]) => grupo);
    }, [filteredVentas]);

    // Toggle para expandir/contraer localidad
    const toggleLocalidad = (localidadNombre: string) => {
        setExpandedLocalidades((prev) => {
            const next = new Set(prev);
            if (next.has(localidadNombre)) {
                next.delete(localidadNombre);
            } else {
                next.add(localidadNombre);
            }
            return next;
        });
    };

    // Calcular totales
    // ✅ ACTUALIZADO: Usar peso_total_estimado y subtotal (sin impuesto)
    const totalSeleccionado = useMemo(() => {
        return {
            cantidad: selectedIds.length,
            peso: ventas
                .filter((v) => selectedIds.includes(v.id))
                .reduce((sum, v) => sum + (v.peso_total_estimado || v.peso_estimado || 0), 0),  // ✅ Usar peso_total_estimado
            monto: ventas
                .filter((v) => selectedIds.includes(v.id))
                .reduce((sum, v) => sum + (v.subtotal || 0), 0),  // ✅ Usar subtotal (sin impuesto)
        };
    }, [ventas, selectedIds]);

    return (
        <div className="space-y-4">
            {/* Encabezado y búsqueda - STICKY */}
            <div className="space-y-3 sticky top-0 bg-gradient-to-b from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent z-10 pb-2">
                <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-gray-900 dark:text-white">
                        Seleccionar Ventas
                    </Label>
                    <div className="flex items-center gap-3">
                        {/* Toggle Compacto/Detallado */}
                        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('detailed')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all ${viewMode === 'detailed'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                Detallada
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-all ${viewMode === 'compact'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                Compacta
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedIds.length} seleccionadas
                    {hasSearched && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            • Búsqueda activa
                        </span>
                    )}
                </div>

                {/* Búsqueda con Botón */}
                <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Busca por: ID venta • Número • Cliente • Teléfono • NIT • Localidad
                    </p>
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Id, número, cliente, teléfono, NIT o localidad..."
                                value={searchInputValue}
                                onChange={(e) => setSearchInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isSearching}
                                className="pl-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white disabled:opacity-50"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={!searchInputValue || isSearching}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white dark:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            {isSearching ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Buscando...</span>
                                </>
                            ) : (
                                'Buscar'
                            )}
                        </button>
                    </div>

                    {/* Error en búsqueda */}
                    {searchError && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
                            <span className="text-red-700 dark:text-red-300">
                                ❌ {searchError}
                            </span>
                            <button
                                onClick={() => setSearchError(null)}
                                className="text-red-600 dark:text-red-400 hover:underline font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}

                    {/* Indicador de búsqueda activa */}
                    {hasSearched && !searchError && (
                        <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                            <span className="text-blue-700 dark:text-blue-300">
                                🔍 {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={handleClearSearch}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    )}
                </div>

                {/* Filtros de Fecha - Collapsible */}
                <button
                    onClick={() => setIsDateFilterExpanded(!isDateFilterExpanded)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        isDateFilterExpanded
                            ? 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600'
                            : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filtrar por Fecha de Venta
                        </span>
                        {(fechaDesde || fechaHasta) && (
                            <Badge variant="secondary" className="text-xs">
                                ✓ Activo
                            </Badge>
                        )}
                    </div>
                    {isDateFilterExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    )}
                </button>

                {/* Contenido del filtro de fechas - Solo visible si está expandido */}
                {isDateFilterExpanded && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                    Desde
                                </label>
                                <Input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm h-9"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
                                    Hasta
                                </label>
                                <Input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm h-9"
                                />
                            </div>
                        </div>
                        {(fechaDesde || fechaHasta) && (
                            <button
                                onClick={() => {
                                    setFechaDesde('');
                                    setFechaHasta('');
                                }}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                ✕ Limpiar filtros de fechas
                            </button>
                        )}
                    </div>
                )}

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

            {/* Lista de ventas agrupadas por localidad */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {ventasPorLocalidad.length === 0 ? (
                    <Card className="p-4 text-center text-gray-500 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-400">
                        No hay ventas disponibles
                    </Card>
                ) : (
                    ventasPorLocalidad.map((grupo) => {
                        const isExpanded = expandedLocalidades.has(grupo.nombre);
                        const localidadVentasSeleccionadas = grupo.ventas.filter((v) =>
                            selectedIds.includes(v.id)
                        ).length;

                        return (
                            <div key={grupo.nombre} className="space-y-2">
                                {/* Encabezado de localidad */}
                                <button
                                    onClick={() => toggleLocalidad(grupo.nombre)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${isExpanded
                                        ? 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 border border-blue-300 dark:border-blue-700'
                                        : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {grupo.nombre}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {grupo.ventas.length} venta{grupo.ventas.length !== 1 ? 's' : ''} • {localidadVentasSeleccionadas} seleccionada{localidadVentasSeleccionadas !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {grupo.ventas.length}
                                        </Badge>
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Ventas de la localidad */}
                                {isExpanded && (
                                    <div className={`space-y-2 pl-4 border-l-2 border-blue-300 dark:border-blue-700`}>
                                        {grupo.ventas.map((venta) => {
                                            const isSelected = selectedIds.includes(venta.id);
                                            const isAsignada = ventasAsignadas.includes(venta.id);
                                            const isNueva = isSelected && !isAsignada;

                                            if (viewMode === 'compact') {
                                                // Vista Compacta
                                                return (
                                                    <Card
                                                        key={venta.id}
                                                        onClick={() => onToggleVenta(venta.id)}
                                                        className={`cursor-pointer transition-all p-2 ${isSelected
                                                            ? isNueva
                                                                ? 'ring-2 ring-green-500 dark:ring-green-400 bg-green-50 dark:bg-green-900/20'
                                                                : 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'hover:shadow-md dark:hover:bg-slate-800'
                                                            } dark:bg-slate-900 dark:border-slate-700`}
                                                    >
                                                        <div className="flex items-center gap-2 text-xs">
                                                            {isSelected ? (
                                                                <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${isNueva ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                                                            ) : (
                                                                <div className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0" />
                                                            )}
                                                            <span className="font-mono font-semibold text-gray-900 dark:text-white min-w-fit">
                                                                Folio: {venta.id}  | {venta.numero_venta}
                                                            </span>
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {venta.cliente.nombre}
                                                            </span>
                                                            {isNueva && <Badge variant="default" className="ml-auto text-xs bg-green-600">✨ Nueva</Badge>}
                                                            {isAsignada && isSelected && <Badge variant="secondary" className="ml-auto text-xs">✓ Asignada</Badge>}
                                                            <span className="text-gray-600 dark:text-gray-400 font-semibold ml-auto">
                                                                Bs {(venta.subtotal).toFixed(0)}
                                                            </span>
                                                        </div>
                                                    </Card>
                                                );
                                            }

                                            // Vista Detallada
                                            return (
                                                <Card
                                                    key={venta.id}
                                                    onClick={() => onToggleVenta(venta.id)}
                                                    className={`cursor-pointer transition-all p-3 ${isSelected
                                                        ? isNueva
                                                            ? 'ring-2 ring-green-500 dark:ring-green-400 bg-green-50 dark:bg-green-900/20'
                                                            : 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'hover:shadow-md dark:hover:bg-slate-800'
                                                        } dark:bg-slate-900 dark:border-slate-700`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Checkbox visual */}
                                                        <div className="mt-0.5">
                                                            {isSelected ? (
                                                                <CheckCircle2 className={`h-5 w-5 ${isNueva ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                                                            ) : (
                                                                <div className="h-5 w-5 rounded border-2 border-gray-300 dark:border-gray-600" />
                                                            )}
                                                        </div>

                                                        {/* Información */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="grid grid-cols-1 gap-1.5 mb-2">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h4 className="font-semibold text-gray-900 dark:text-white break-words flex-1">
                                                                        Folio: {venta.id} | {venta.numero_venta}
                                                                    </h4>
                                                                    <div className="flex gap-1 flex-shrink-0">
                                                                        {isNueva && <Badge className="text-xs bg-green-600 whitespace-nowrap">✨ Nueva</Badge>}
                                                                        {isAsignada && isSelected && <Badge variant="secondary" className="text-xs whitespace-nowrap">✓ Asignada</Badge>}
                                                                    </div>
                                                                </div>
                                                                <Badge variant="secondary" className="text-xs w-fit break-words">
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
                                                                    <div className="flex flex-col gap-1">
                                                                        {/* <span className="text-xs text-gray-700 dark:text-gray-300">
                                                                            📅 Venta: {venta.fecha_venta}
                                                                        </span> */}
                                                                        {venta.created_at && (
                                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                                🕐 Creada: {venta.created_at}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                                        Bs {venta.subtotal.toLocaleString('es-BO', {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                {venta.fecha_entrega_comprometida && (
                                                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
                                                                        📅 Entrega comprometida: {new Date(venta.fecha_entrega_comprometida).toLocaleDateString('es-BO', {
                                                                            weekday: 'short',
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
