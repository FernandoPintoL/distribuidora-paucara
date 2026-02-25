import { useState, useMemo, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Search, Eye, CheckCircle, XCircle, FileText, Filter, Printer, PencilIcon, ChevronDown, X, TrendingUp } from 'lucide-react'
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal'
import { ImprimirProformasButton } from '@/presentation/components/impresion/ImprimirProformasButton'
import SearchSelect from '@/presentation/components/ui/search-select'

// DOMAIN LAYER: Importar tipos desde domain
import type { Proforma } from '@/domain/entities/proformas'
import type { Pagination, Id } from '@/domain/entities/shared'

// APPLICATION LAYER: Hooks para estados centralizados
import { useEstadosProformas } from '@/application/hooks'

// PRESENTATION LAYER: Componentes reutilizables
import { PageHeader } from '@/presentation/components/entrega/PageHeader'
import { ProformaEstadoBadge } from '@/presentation/components/proforma/ProformaEstadoBadge'

interface Props {
    proformas: Pagination<Proforma>
    usuarios?: any[]
    clientes?: any[]
}

export default function ProformasIndex({ proformas, usuarios = [], clientes = [] }: Props) {
    console.log('Proformas recibidas:', proformas);
    const { estados: estadosAPI, isLoading: estadosLoading } = useEstadosProformas()

    // ✅ NUEVO: Leer parámetros de URL
    const getQueryParam = (param: string, defaultValue: string = ''): string => {
        if (typeof window === 'undefined') return defaultValue
        const params = new URLSearchParams(window.location.search)
        return params.get(param) || defaultValue
    }

    // ✅ NUEVO 2026-02-21: Extraer clientes únicos PRIMERO (necesario para useState inicial)
    const clientesUnicos = useMemo(() => {
        const clientesSet = new Set()
        const clientesList = []
        proformas.data.forEach(p => {
            if (p.cliente && !clientesSet.has(p.cliente.id)) {
                clientesSet.add(p.cliente.id)
                clientesList.push(p.cliente)
            }
        })
        return clientesList.sort((a, b) => a.nombre.localeCompare(b.nombre))
    }, [proformas.data])

    // ✅ NUEVO 2026-02-21: Extraer usuarios únicos PRIMERO (necesario para useState inicial)
    const usuariosUnicos = useMemo(() => {
        const usuariosSet = new Set()
        const usuariosList = []
        proformas.data.forEach(p => {
            const user = (p.usuario_creador as any)
            if (user && user.id && !usuariosSet.has(user.id)) {
                usuariosSet.add(user.id)
                usuariosList.push(user)
            }
        })
        return usuariosList.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }, [proformas.data])

    // ✅ NUEVO 2026-02-21: Estados expandidos para filtrado mejorado (inicializar desde URL)
    const [showFilters, setShowFilters] = useState(true)
    const [searchTerm, setSearchTerm] = useState(getQueryParam('search', ''))
    const [filtroEstado, setFiltroEstado] = useState<string>(getQueryParam('estado', 'TODOS'))
    const [filtroCliente, setFiltroCliente] = useState<string>(getQueryParam('cliente_id', 'TODOS'))
    const [filtroUsuario, setFiltroUsuario] = useState<string>(getQueryParam('usuario_creador_id', 'TODOS'))
    const [fechaDesde, setFechaDesde] = useState<string>(getQueryParam('fecha_desde', ''))
    const [fechaHasta, setFechaHasta] = useState<string>(getQueryParam('fecha_hasta', ''))
    const [totalMin, setTotalMin] = useState<string>(getQueryParam('total_min', ''))
    const [totalMax, setTotalMax] = useState<string>(getQueryParam('total_max', ''))
    const [filtroVencidas, setFiltroVencidas] = useState<string>(getQueryParam('filtro_vencidas', 'TODAS'))
    // ✅ NUEVO: Filtro para proformas convertidas a ventas
    const [soloConvertidas, setSoloConvertidas] = useState<boolean>(getQueryParam('solo_convertidas') === 'true')
    const [fechaVentaDesde, setFechaVentaDesde] = useState<string>(getQueryParam('fecha_venta_desde', ''))
    const [fechaVentaHasta, setFechaVentaHasta] = useState<string>(getQueryParam('fecha_venta_hasta', ''))

    const [isLoading, setIsLoading] = useState(false)
    const [showPrintModal, setShowPrintModal] = useState<boolean>(false)
    const [selectedProformaForPrint, setSelectedProformaForPrint] = useState<Proforma | null>(null)

    // ✅ ACTUALIZADO 2026-02-21: Usar datos fijos del servidor en lugar de búsquedas dinámicas
    const [clientesOptions, setClientesOptions] = useState<any[]>([
        { value: 'TODOS', label: 'Todos los clientes' },
        ...(clientes || []).map(cliente => ({
            value: cliente.id.toString(),
            label: cliente.nombre,
            description: cliente.email || ''
        }))
    ])
    const [usuariosOptions, setUsuariosOptions] = useState<any[]>([
        { value: 'TODOS', label: 'Todos los usuarios' },
        ...(usuarios || []).map(usuario => ({
            value: usuario.id.toString(),
            label: usuario.name || 'Sin nombre',
            description: usuario.email || ''
        }))
    ])

    // Generar opciones de estado desde el API
    const estadoOptions = useMemo(() => {
        return estadosAPI.map(estado => ({
            value: estado.codigo,
            label: estado.nombre
        }))
    }, [estadosAPI])

    // ✅ SIMPLIFICADO 2026-02-21: Backend ya filtra los datos
    // Los datos de proformas.data ya vienen filtrados desde el servidor basándose en los parámetros URL
    const filteredProformas = useMemo(() => {
        return proformas.data
    }, [proformas.data])

    // ✅ ACTUALIZADO 2026-02-21: Estadísticas de los resultados filtrados por servidor
    const estadisticas = useMemo(() => {
        const total = proformas.data.length
        const sumaTotal = proformas.data.reduce((sum, p) => sum + p.total, 0)
        const promedio = total > 0 ? sumaTotal / total : 0

        return { total, sumaTotal, promedio }
    }, [proformas.data])

    // ✅ NUEVO 2026-02-21: Verificar si hay filtros activos
    const hasActiveFilters = useMemo(() => {
        return (
            searchTerm !== '' ||
            filtroEstado !== 'TODOS' ||
            filtroCliente !== 'TODOS' ||
            filtroUsuario !== 'TODOS' ||
            fechaDesde !== '' ||
            fechaHasta !== '' ||
            totalMin !== '' ||
            totalMax !== '' ||
            filtroVencidas !== 'TODAS' || // ✅ NUEVO: Incluir filtro de vencidas
            soloConvertidas || // ✅ NUEVO: Incluir filtro de convertidas
            fechaVentaDesde !== '' ||
            fechaVentaHasta !== ''
        )
    }, [searchTerm, filtroEstado, filtroCliente, filtroUsuario, fechaDesde, fechaHasta, totalMin, totalMax, filtroVencidas, soloConvertidas, fechaVentaDesde, fechaVentaHasta])

    // ✅ ACTUALIZADO 2026-02-21: Limpiar filtros y navegar al servidor
    const limpiarFiltros = () => {
        setSearchTerm('')
        setFiltroEstado('TODOS')
        setFiltroCliente('TODOS')
        setFiltroUsuario('TODOS')
        setFechaDesde('')
        setFechaHasta('')
        setTotalMin('')
        setTotalMax('')
        setFiltroVencidas('TODAS')
        // ✅ NUEVO: Limpiar filtros de convertidas
        setSoloConvertidas(false)
        setFechaVentaDesde('')
        setFechaVentaHasta('')
        // Navegar sin parámetros para ver todos los registros
        router.visit('/proformas', { preserveState: true })
    }

    // ✅ ACTUALIZADO 2026-02-21: Búsqueda local de clientes (datos fijos del servidor)
    const handleSearchClientes = (query: string) => {
        if (!query || query.length < 2) {
            setClientesOptions([
                { value: 'TODOS', label: 'Todos los clientes' },
                ...(clientes || []).map(cliente => ({
                    value: cliente.id.toString(),
                    label: cliente.nombre,
                    description: cliente.email || ''
                }))
            ])
            return
        }

        const queryLower = query.toLowerCase()
        const filtrados = (clientes || []).filter(cliente =>
            cliente.nombre.toLowerCase().includes(queryLower) ||
            (cliente.email && cliente.email.toLowerCase().includes(queryLower))
        )

        setClientesOptions([
            { value: 'TODOS', label: 'Todos los clientes' },
            ...filtrados.map(cliente => ({
                value: cliente.id.toString(),
                label: cliente.nombre,
                description: cliente.email || ''
            }))
        ])
    }

    // ✅ ACTUALIZADO 2026-02-21: Búsqueda local de usuarios (datos fijos del servidor)
    const handleSearchUsuarios = (query: string) => {
        if (!query || query.length < 2) {
            setUsuariosOptions([
                { value: 'TODOS', label: 'Todos los usuarios' },
                ...(usuarios || []).map(usuario => ({
                    value: usuario.id.toString(),
                    label: usuario.name || 'Sin nombre',
                    description: usuario.email || ''
                }))
            ])
            return
        }

        const queryLower = query.toLowerCase()
        const filtrados = (usuarios || []).filter(usuario =>
            (usuario.name && usuario.name.toLowerCase().includes(queryLower)) ||
            (usuario.email && usuario.email.toLowerCase().includes(queryLower))
        )

        setUsuariosOptions([
            { value: 'TODOS', label: 'Todos los usuarios' },
            ...filtrados.map(usuario => ({
                value: usuario.id.toString(),
                label: usuario.name || 'Sin nombre',
                description: usuario.email || ''
            }))
        ])
    }

    // ✅ ACTUALIZADO: Función mejorada que acepta valores de filtros
    const handleSearch = (
        searchValue?: string,
        estadoValue?: string,
        clienteValue?: string,
        usuarioValue?: string,
        fechaDesdeValue?: string,
        fechaHastaValue?: string,
        totalMinValue?: string,
        totalMaxValue?: string,
        filtroVencidasValue?: string,
        soloConvertidosValue?: boolean,
        fechaVentaDesdeValue?: string,
        fechaVentaHastaValue?: string
    ) => {
        // Usar los valores proporcionados o los del estado
        const search = searchValue ?? searchTerm
        const estado = estadoValue ?? filtroEstado
        const cliente = clienteValue ?? filtroCliente
        const usuario = usuarioValue ?? filtroUsuario
        const desde = fechaDesdeValue ?? fechaDesde
        const hasta = fechaHastaValue ?? fechaHasta
        const minTotal = totalMinValue ?? totalMin
        const maxTotal = totalMaxValue ?? totalMax
        const vencidas = filtroVencidasValue ?? filtroVencidas
        const convertidos = soloConvertidosValue !== undefined ? soloConvertidosValue : soloConvertidas
        const desdeVenta = fechaVentaDesdeValue ?? fechaVentaDesde
        const hastaVenta = fechaVentaHastaValue ?? fechaVentaHasta

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (estado !== 'TODOS') params.append('estado', estado)
        if (cliente !== 'TODOS') params.append('cliente_id', cliente)
        if (usuario !== 'TODOS') params.append('usuario_creador_id', usuario)
        if (desde) params.append('fecha_desde', desde)
        if (hasta) params.append('fecha_hasta', hasta)
        if (minTotal) params.append('total_min', minTotal)
        if (maxTotal) params.append('total_max', maxTotal)
        if (vencidas !== 'TODAS') params.append('filtro_vencidas', vencidas)
        // ✅ NUEVO: Agregar parámetros de filtro de convertidas
        if (convertidos) params.append('solo_convertidas', 'true')
        if (desdeVenta) params.append('fecha_venta_desde', desdeVenta)
        if (hastaVenta) params.append('fecha_venta_hasta', hastaVenta)

        const queryString = params.toString()
        const url = queryString ? `/proformas?${queryString}` : '/proformas'
        router.visit(url, { preserveState: true })
    }

    const handleView = (id: Id) => {
        router.visit(`/proformas/${id}`)
    }

    const handleAction = (action: string, id: Id) => {
        setIsLoading(true)
        router.post(`/proformas/${id}/${action}`, {}, {
            onFinish: () => setIsLoading(false),
        })
    }

    return (
        <AppLayout>
            <Head title="Proformas" />

            <div className="space-y-6 p-4">
                {/* Header con integración de filtros y botones */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proformas</h1>
                        <p className="text-gray-500 dark:text-gray-400">Gestiona las proformas del sistema</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* ✅ NUEVO: Botón de Impresión de Proformas Filtradas - Solo si hay datos */}
                        {filteredProformas.length > 0 && (
                            <ImprimirProformasButton
                                proformas={filteredProformas}
                                filtros={{
                                    searchTerm,
                                    filtroEstado,
                                    filtroCliente,
                                    filtroUsuario,
                                    fechaDesde,
                                    fechaHasta,
                                    totalMin,
                                    totalMax,
                                    filtroVencidas,
                                }}
                            />
                        )}
                        <Button asChild>
                            <Link href="/proformas/create">
                                <FileText className="mr-2 h-4 w-4" />
                                Nueva Proforma
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* ✅ NUEVO 2026-02-21: Estadísticas rápidas */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Resultados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{estadisticas.total}</div>
                            <p className="text-xs text-muted-foreground">
                                de {proformas.total} proformas totales
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Suma Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Bs. {estadisticas.sumaTotal.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                de {proformas.data.reduce((s, p) => s + p.total, 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })} total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Promedio
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Bs. {estadisticas.promedio.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                por proforma
                            </p>
                        </CardContent>
                    </Card>
                </div> */}

                {/* ✅ NUEVO 2026-02-21: Filtros colapsibles mejorados */}
                <Card>
                    <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtros
                                {hasActiveFilters && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                        {[searchTerm !== '', filtroEstado !== 'TODOS', filtroCliente !== 'TODOS',
                                        filtroUsuario !== 'TODOS', fechaDesde !== '', fechaHasta !== '',
                                        totalMin !== '', totalMax !== ''].filter(Boolean).length} activos
                                    </span>
                                )}
                            </CardTitle>
                            <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </div>
                    </CardHeader>

                    {showFilters && (
                        <CardContent className="space-y-4">
                            {/* Primera fila de filtros */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Búsqueda */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por ID, número o cliente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Estado */}
                                <Select value={filtroEstado} onValueChange={setFiltroEstado} disabled={estadosLoading}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TODOS">Todos los estados</SelectItem>
                                        {estadoOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Cliente con SearchSelect - Búsqueda local */}
                                <SearchSelect
                                    label="👥 Cliente"
                                    placeholder="Selecciona un cliente"
                                    value={filtroCliente}
                                    onChange={setFiltroCliente}
                                    onSearch={handleSearchClientes}
                                    options={clientesOptions}
                                    searchPlaceholder="Buscar cliente..."
                                    emptyText="No se encontraron clientes"
                                    allowClear={true}
                                />

                                {/* Usuario Creador/Preventista con SearchSelect - Búsqueda local */}
                                <SearchSelect
                                    label="👤 Preventista/Creador"
                                    placeholder="Selecciona un usuario"
                                    value={filtroUsuario}
                                    onChange={setFiltroUsuario}
                                    onSearch={handleSearchUsuarios}
                                    options={usuariosOptions}
                                    searchPlaceholder="Buscar usuario..."
                                    emptyText="No se encontraron usuarios"
                                    allowClear={true}
                                />
                            </div>

                            {/* Segunda fila de filtros */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Fecha desde */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Desde</label>
                                    <Input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => setFechaDesde(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Fecha hasta */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                                    <Input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => setFechaHasta(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Total mínimo */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Total Mín. (Bs.)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={totalMin}
                                        onChange={(e) => setTotalMin(e.target.value)}
                                        className="mt-1"
                                        step="0.01"
                                    />
                                </div>

                                {/* Total máximo */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Total Máx. (Bs.)</label>
                                    <Input
                                        type="number"
                                        placeholder="Sin límite"
                                        value={totalMax}
                                        onChange={(e) => setTotalMax(e.target.value)}
                                        className="mt-1"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">📅 Vencimiento</label>
                                    <Select value={filtroVencidas} onValueChange={setFiltroVencidas}>
                                        <SelectTrigger className="bg-background mt-1">
                                            <SelectValue placeholder="Vencimiento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TODAS">Todas las proformas</SelectItem>
                                            <SelectItem value="VIGENTES">⏳ Solo Vigentes</SelectItem>
                                            <SelectItem value="VENCIDAS">⚠️ Solo Vencidas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* ✅ NUEVA FILA: Filtros de proformas convertidas a ventas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                {/* Checkbox: Solo Convertidas */}
                                <div className="flex items-center gap-3 col-span-1 md:col-span-2 lg:col-span-1">
                                    <input
                                        type="checkbox"
                                        id="soloConvertidas"
                                        checked={soloConvertidas}
                                        onChange={(e) => setSoloConvertidas(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="soloConvertidas" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                        🛍️ Solo Convertidas a Ventas
                                    </label>
                                </div>

                                {/* Fecha de Venta Desde */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Venta Desde</label>
                                    <Input
                                        type="date"
                                        value={fechaVentaDesde}
                                        onChange={(e) => setFechaVentaDesde(e.target.value)}
                                        disabled={!soloConvertidas}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Fecha de Venta Hasta */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Venta Hasta</label>
                                    <Input
                                        type="date"
                                        value={fechaVentaHasta}
                                        onChange={(e) => setFechaVentaHasta(e.target.value)}
                                        disabled={!soloConvertidas}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Botón para acceder al reporte con filtros */}
                                <div className="flex items-end">
                                    <Link
                                        href={(() => {
                                            const params = new URLSearchParams();
                                            if (fechaVentaDesde) params.append('fecha_desde', fechaVentaDesde);
                                            if (fechaVentaHasta) params.append('fecha_hasta', fechaVentaHasta);
                                            if (filtroUsuario !== 'TODOS') params.append('usuario_creador_id', filtroUsuario);
                                            const queryString = params.toString();
                                            return queryString ? `/ventas/reporte-productos-vendidos?${queryString}` : '/ventas/reporte-productos-vendidos';
                                        })()}
                                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition flex items-center justify-center gap-2"
                                    >
                                        📊 Ver Reporte
                                    </Link>
                                </div>
                            </div>

                            {/* Tercera fila: Botones de acción */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleSearch(searchTerm, filtroEstado, filtroCliente, filtroUsuario, fechaDesde, fechaHasta, totalMin, totalMax, filtroVencidas, soloConvertidas, fechaVentaDesde, fechaVentaHasta)}
                                    className="flex-1"
                                >
                                    <Search className="h-4 w-4 mr-2" />
                                    Buscar
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        onClick={limpiarFiltros}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* ✅ NUEVO 2026-02-21: Tabla mejorada con ordenamiento */}
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>🛍️ Venta</TableHead>
                                    <TableHead>📅 Creada</TableHead>
                                    <TableHead>✏️ Actualizada</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProformas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                                            {hasActiveFilters
                                                ? '❌ No se encontraron proformas que coincidan con los filtros'
                                                : '📭 No hay proformas registradas'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProformas.map((proforma) => (
                                        <TableRow key={proforma.id}>
                                            <TableCell className="font-medium">
                                                {proforma.numero}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{proforma.cliente.nombre}</div>
                                                    {proforma.cliente.email && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {proforma.cliente.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                Bs. {proforma.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                {proforma.estado_logistica ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{proforma.estado_logistica.icono}</span>
                                                        <span className="text-sm font-medium">{proforma.estado_logistica.nombre}</span>
                                                    </div>
                                                ) : (
                                                    <ProformaEstadoBadge estado={proforma.estado} />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {(proforma.usuario_creador as any)?.name || 'Sin asignar'}
                                            </TableCell>
                                            <TableCell>
                                                {proforma.venta ? (
                                                    <Link href={`/ventas/${proforma.venta.id}`}>
                                                        <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer">
                                                            <span className="font-medium">🛍️ {proforma.venta.numero}</span>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="whitespace-nowrap">
                                                    <div>{new Date(proforma.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    <div className="text-xs">{new Date(proforma.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="whitespace-nowrap">
                                                    <div>{new Date(proforma.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    <div className="text-xs">{new Date(proforma.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleView(proforma.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedProformaForPrint(proforma)
                                                            setShowPrintModal(true)
                                                        }}
                                                        title="Imprimir proforma"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>

                                                    {['PENDIENTE', 'BORRADOR'].includes(proforma.estado) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="text-blue-600 hover:text-blue-700"
                                                            title="Editar proforma"
                                                        >
                                                            <Link href={`/proformas/${proforma.id}/edit`}>
                                                                <PencilIcon className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    {proforma.estado === 'PENDIENTE' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleAction('aprobar', proforma.id)}
                                                                disabled={isLoading}
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleAction('rechazar', proforma.id)}
                                                                disabled={isLoading}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {proformas.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {proformas.from} a {proformas.to} de {proformas.total} resultados
                        </div>
                        <div className="flex gap-2">
                            {proformas.links?.map((link, index) => {
                                if (!link.url) return null

                                return (
                                    <Button
                                        key={index}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => link.url && router.visit(link.url)}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ✅ NUEVO: Modal de Impresión */}
                {showPrintModal && selectedProformaForPrint && (
                    <OutputSelectionModal
                        isOpen={showPrintModal}
                        onClose={() => {
                            setShowPrintModal(false)
                            setSelectedProformaForPrint(null)
                        }}
                        tipoDocumento="proforma"
                        documentoId={selectedProformaForPrint.id}
                        documentoInfo={{
                            numero: selectedProformaForPrint.numero,
                            fecha: selectedProformaForPrint.created_at,
                            monto: selectedProformaForPrint.total,
                        }}
                    />
                )}
            </div>
        </AppLayout>
    )
}
