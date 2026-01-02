import { useState, useMemo } from 'react'
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
import { Search, Eye, CheckCircle, XCircle, FileText, Filter } from 'lucide-react'

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
}

export default function ProformasIndex({ proformas }: Props) {
    // Fase 3: Usar hook de estados centralizados para obtener datos dinámicamente
    const { estados: estadosAPI, isLoading: estadosLoading } = useEstadosProformas()

    const [search, setSearch] = useState('')
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
    const [isLoading, setIsLoading] = useState(false)

    // Generar opciones de estado desde el API
    const estadoOptions = useMemo(() => {
        return estadosAPI.map(estado => ({
            value: estado.codigo,
            label: estado.nombre
        }))
    }, [estadosAPI])

    const filteredProformas = proformas.data.filter(proforma => {
        const cumpleFiltroEstado = filtroEstado === 'TODOS' || proforma.estado === filtroEstado
        const cumpleBusqueda =
            proforma.numero.toLowerCase().includes(search.toLowerCase()) ||
            proforma.cliente.nombre.toLowerCase().includes(search.toLowerCase())

        return cumpleFiltroEstado && cumpleBusqueda
    })

    const handleSearch = (value: string) => {
        setSearch(value)
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
                {/* Header */}
                <PageHeader
                    title="Proformas"
                    description="Gestiona las proformas del sistema"
                    actions={
                        <Button asChild>
                            <Link href="/proformas/create">
                                <FileText className="mr-2 h-4 w-4" />
                                Nueva Proforma
                            </Link>
                        </Button>
                    }
                />

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Select value={filtroEstado} onValueChange={setFiltroEstado} disabled={estadosLoading}>
                                <SelectTrigger className="w-[180px] bg-background">
                                    <SelectValue placeholder={estadosLoading ? "Cargando..." : "Estado"} />
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

                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por número o cliente..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProformas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            {search ? 'No se encontraron proformas que coincidan con la búsqueda' : 'No hay proformas registradas'}
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
                                            <TableCell>
                                                {new Date(proforma.fecha).toLocaleDateString('es-ES')}
                                            </TableCell>
                                            <TableCell>
                                                Bs. {proforma.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <ProformaEstadoBadge estado={proforma.estado} />
                                            </TableCell>
                                            <TableCell>
                                                {proforma.usuarioCreador?.name || 'Sin asignar'}
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
            </div>
        </AppLayout>
    )
}
