import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Eye, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Clock, CheckCircle, XCircle, FileCheck, AlertCircle, Filter, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ProformaAppExterna } from '@/domain/entities/logistica';
import { useEstadosProformas } from '@/application/hooks';

type SortField = 'numero' | 'cliente' | 'estado' | 'monto' | 'fecha' | null;
type SortDirection = 'asc' | 'desc' | null;

interface ProformasSectionProps {
    proformas: ProformaAppExterna[];
    paginationInfo: any;
    searchProforma: string;
    setSearchProforma: (value: string) => void;
    filtroEstadoProforma: string;
    setFiltroEstadoProforma: (value: string) => void;
    soloVencidas: boolean;
    setSoloVencidas: (value: boolean) => void;
    cambiarPagina: (page: number) => void;
    onVerProforma: (proforma: ProformaAppExterna) => void;
    getEstadoBadge: (estado: string, proforma: ProformaAppExterna) => any;
    estaVencida: (proforma: ProformaAppExterna) => boolean;
}

export function ProformasSection({
    proformas,
    paginationInfo,
    searchProforma,
    setSearchProforma,
    filtroEstadoProforma,
    setFiltroEstadoProforma,
    soloVencidas,
    setSoloVencidas,
    cambiarPagina,
    onVerProforma,
    getEstadoBadge,
    estaVencida,
}: ProformasSectionProps) {
    // console.log('🚀 ~ file: ProformasSection.tsx:48 ~ ProformasSection ~ proformas:', proformas);
    const [expandedProformaId, setExpandedProformaId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [amountFrom, setAmountFrom] = useState<string>('');
    const [amountTo, setAmountTo] = useState<string>('');
    const [searchInput, setSearchInput] = useState<string>(searchProforma);

    // Fase 3: Usar hook de estados centralizados para obtener estados dinámicamente
    const { estados: estadosAPI, isLoading, error } = useEstadosProformas();

    // Crear array de opciones: TODOS + estados del API
    const estados = useMemo(() => {
        const estadosCodigos = estadosAPI.map(e => e.codigo);
        return ['TODOS' as const, ...estadosCodigos];
    }, [estadosAPI]);

    // Función para manejar el click en headers para ordenar
    const handleSort = (field: SortField) => {
        if (sortField === field && sortDirection === 'asc') {
            setSortDirection('desc');
        } else if (sortField === field && sortDirection === 'desc') {
            setSortField(null);
            setSortDirection(null);
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Aplicar filtros y ordenamiento a las proformas
    const sortedProformas = useMemo(() => {
        // Primero aplicar filtros
        let filtered = proformas.filter((proforma) => {
            // Filtro de fecha
            if (dateFrom) {
                const proformaDate = new Date(proforma.fecha);
                const filterDate = new Date(dateFrom);
                if (proformaDate < filterDate) return false;
            }

            if (dateTo) {
                const proformaDate = new Date(proforma.fecha);
                const filterDate = new Date(dateTo);
                filterDate.setHours(23, 59, 59, 999); // Incluir todo el día
                if (proformaDate > filterDate) return false;
            }

            // Filtro de monto
            if (amountFrom) {
                const minAmount = parseFloat(amountFrom);
                if (!isNaN(minAmount) && proforma.total < minAmount) return false;
            }

            if (amountTo) {
                const maxAmount = parseFloat(amountTo);
                if (!isNaN(maxAmount) && proforma.total > maxAmount) return false;
            }

            return true;
        });

        // Luego aplicar ordenamiento
        if (sortField && sortDirection) {
            filtered = filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortField) {
                    case 'numero':
                        aValue = a.numero?.toLowerCase() || '';
                        bValue = b.numero?.toLowerCase() || '';
                        break;
                    case 'cliente':
                        aValue = a.cliente_nombre?.toLowerCase() || '';
                        bValue = b.cliente_nombre?.toLowerCase() || '';
                        break;
                    case 'estado':
                        aValue = a.estado?.toLowerCase() || '';
                        bValue = b.estado?.toLowerCase() || '';
                        break;
                    case 'monto':
                        aValue = a.total || 0;
                        bValue = b.total || 0;
                        break;
                    case 'fecha':
                        aValue = new Date(a.fecha).getTime();
                        bValue = new Date(b.fecha).getTime();
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [proformas, sortField, sortDirection, dateFrom, dateTo, amountFrom, amountTo]);

    // Función para obtener badge con iconos (Fase 3: Mejorada con datos del API)
    const getEstadoIcon = (estado: string) => {
        // Fallback a iconos hardcodeados si el API no está disponible
        switch (estado) {
            case 'PENDIENTE':
                return <Clock className="w-4 h-4" />;
            case 'APROBADA':
                return <CheckCircle className="w-4 h-4" />;
            case 'RECHAZADA':
                return <XCircle className="w-4 h-4" />;
            case 'CONVERTIDA':
                return <FileCheck className="w-4 h-4" />;
            case 'VENCIDA':
                return <AlertCircle className="w-4 h-4" />;
            case 'TODOS':
                return <Filter className="w-4 h-4" />;
            default:
                return null;
        }
    };

    // Función para obtener estilos del badge según estado
    const getEstadoBadgeStyles = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE':
                return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700';
            case 'APROBADA':
                return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
            case 'RECHAZADA':
                return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
            case 'CONVERTIDA':
                return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700';
            case 'VENCIDA':
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
        }
    };

    // Función para obtener estilos de los botones de filtro
    const getFilterButtonStyles = (estado: string, isActive: boolean) => {
        const baseStyles = 'font-medium transition-all duration-200 flex items-center gap-2';

        if (estado === 'TODOS') {
            return isActive
                ? `${baseStyles} bg-slate-900 dark:bg-slate-700 text-white border border-slate-700 dark:border-slate-500`
                : `${baseStyles} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700`;
        }

        const stateStyles = {
            'PENDIENTE': {
                active: 'bg-yellow-500 dark:bg-yellow-600 text-white border border-yellow-600 dark:border-yellow-700 shadow-md',
                inactive: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
            },
            'APROBADA': {
                active: 'bg-green-500 dark:bg-green-600 text-white border border-green-600 dark:border-green-700 shadow-md',
                inactive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50'
            },
            'RECHAZADA': {
                active: 'bg-red-500 dark:bg-red-600 text-white border border-red-600 dark:border-red-700 shadow-md',
                inactive: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50'
            },
            'CONVERTIDA': {
                active: 'bg-blue-500 dark:bg-blue-600 text-white border border-blue-600 dark:border-blue-700 shadow-md',
                inactive: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            },
            'VENCIDA': {
                active: 'bg-gray-500 dark:bg-gray-600 text-white border border-gray-600 dark:border-gray-700 shadow-md',
                inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
        };

        const style = stateStyles[estado as keyof typeof stateStyles];
        return style ? `${baseStyles} ${isActive ? style.active : style.inactive}` : baseStyles;
    };

    // Función para obtener ícono del filtro según estado
    const getFilterIcon = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE':
                return <Clock className="w-4 h-4" />;
            case 'APROBADA':
                return <CheckCircle className="w-4 h-4" />;
            case 'RECHAZADA':
                return <XCircle className="w-4 h-4" />;
            case 'CONVERTIDA':
                return <FileCheck className="w-4 h-4" />;
            case 'VENCIDA':
                return <AlertCircle className="w-4 h-4" />;
            case 'TODOS':
                return <Filter className="w-4 h-4" />;
            default:
                return null;
        }
    };

    return (
        <Card className="dark:bg-slate-900 dark:border-slate-700">
            <CardHeader>
                <CardTitle className="dark:text-white">Proformas App Externa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="space-y-4">
                    {/* Búsqueda */}
                    <div>
                        <label className="text-sm font-medium mb-2 block dark:text-gray-300">Buscar</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Número de proforma o cliente..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSearchProforma(searchInput);
                                    }
                                }}
                            />
                            <Button
                                size="sm"
                                onClick={() => setSearchProforma(searchInput)}
                                className="dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                            {searchProforma && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setSearchInput('');
                                        setSearchProforma('');
                                    }}
                                    className="dark:border-slate-600 dark:text-slate-300"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Filtro de estado - Fase 3: Dinámico desde API */}
                    <div>
                        <label className="text-sm font-medium mb-2 block dark:text-gray-300">
                            Filtrar por Estado
                            {isLoading && <span className="text-xs text-gray-500 ml-2">(cargando...)</span>}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {estados.map((estado) => (
                                <button
                                    key={estado}
                                    onClick={() => setFiltroEstadoProforma(estado)}
                                    className={`px-4 py-2 rounded-lg text-sm ${getFilterButtonStyles(estado, filtroEstadoProforma === estado)}`}
                                >
                                    {getFilterIcon(estado)}
                                    {estado}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Checkbox: Solo vencidas */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="solo_vencidas"
                            checked={soloVencidas}
                            onCheckedChange={(checked) => setSoloVencidas(checked as boolean)}
                            className="dark:border-slate-600"
                        />
                        <label htmlFor="solo_vencidas" className="text-sm cursor-pointer dark:text-gray-300">
                            Solo vencidas
                        </label>
                    </div>

                    {/* Filtro de Rango de Fechas */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block dark:text-gray-300">Desde</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block dark:text-gray-300">Hasta</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Filtro de Rango de Montos */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block dark:text-gray-300">Monto Desde</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={amountFrom}
                                onChange={(e) => setAmountFrom(e.target.value)}
                                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block dark:text-gray-300">Monto Hasta</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={amountTo}
                                onChange={(e) => setAmountTo(e.target.value)}
                                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-500"
                            />
                        </div>
                    </div>

                    {/* Botón para limpiar filtros */}
                    {(dateFrom || dateTo || amountFrom || amountTo) && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setDateFrom('');
                                setDateTo('');
                                setAmountFrom('');
                                setAmountTo('');
                            }}
                            className="w-full dark:border-slate-600 dark:text-slate-300"
                        >
                            Limpiar Filtros
                        </Button>
                    )}
                </div>

                {/* Información de paginación */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {paginationInfo.from}-{paginationInfo.to} de {paginationInfo.total}
                </div>

                {/* Tabla */}
                <div className="border rounded-lg overflow-x-auto dark:border-slate-700">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800">
                            <tr className="border-b dark:border-slate-700">
                                <th
                                    className="px-4 py-2 text-left font-medium dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 select-none"
                                    onClick={() => handleSort('numero')}
                                >
                                    <div className="flex items-center gap-2">
                                        Número
                                        {sortField === 'numero' && (
                                            sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Cliente</th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Estado</th>
                                <th
                                    className="px-4 py-2 text-left font-medium dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 select-none"
                                    onClick={() => handleSort('monto')}
                                >
                                    <div className="flex items-center gap-2">
                                        Monto
                                        {sortField === 'monto' && (
                                            sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-2 text-left font-medium dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 select-none"
                                    onClick={() => handleSort('fecha')}
                                >
                                    <div className="flex items-center gap-2">
                                        Fecha
                                        {sortField === 'fecha' && (
                                            sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProformas.map((proforma) => (
                                <tr key={proforma.id} className="border-t dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-2 font-mono text-xs dark:text-gray-300">{proforma.numero}</td>
                                    <td className="px-4 py-2 dark:text-gray-300">{proforma.cliente_nombre}</td>
                                    <td className="px-4 py-2">
                                        <div className={`gap-2 flex items-center w-fit px-3 py-1 rounded-full font-medium text-sm ${getEstadoBadgeStyles(proforma.estado)}`}>
                                            {getEstadoIcon(proforma.estado)}
                                            {proforma.estado}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right dark:text-gray-300">
                                        Bs {proforma.total.toLocaleString('es-BO', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-2 text-xs dark:text-gray-300">
                                        {formatDate(proforma.fecha)}
                                        {estaVencida(proforma) && <div className="text-red-600 dark:text-red-400 text-xs font-semibold">VENCIDA</div>}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onVerProforma(proforma)}
                                                className="dark:hover:bg-slate-700"
                                            >
                                                <Eye className="h-4 w-4 dark:text-gray-400" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cambiarPagina(paginationInfo.current_page - 1)}
                        disabled={paginationInfo.current_page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Página {paginationInfo.current_page} de {paginationInfo.last_page}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cambiarPagina(paginationInfo.current_page + 1)}
                        disabled={paginationInfo.current_page === paginationInfo.last_page}
                    >
                        Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
