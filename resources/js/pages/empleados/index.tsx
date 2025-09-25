import { Link, router, usePage, Head } from '@inertiajs/react'
import React, { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { Trash2, Pencil, Plus, Search, Eye, User, Shield, ShieldOff, Calendar } from 'lucide-react'
import Can from '@/components/auth/Can'
import { type BreadcrumbItem } from '@/types'

interface Empleado {
    id: number
    codigo_empleado: string
    ci: string
    cargo: string
    departamento: string
    fecha_ingreso: string
    tipo_contrato: string
    salario_base: number
    bonos: number
    estado: string
    puede_acceder_sistema: boolean
    supervisor_id?: number
    created_at: string
    user?: {
        id: number
        name: string
        email: string
        usernick?: string
    }
    supervisor?: {
        id: number
        user: {
            name: string
        }
    }
}

interface PageProps {
    empleados: {
        data: Empleado[]
        links: Array<{
            url: string | null
            label: string
            active: boolean
        }>
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
    departamentos: string[]
    supervisores: Array<{
        id: number
        user: {
            name: string
        }
    }>
    filters: {
        search?: string
        departamento?: string
        estado?: string
        acceso_sistema?: string
    }
    [key: string]: unknown
}

export default function EmpleadosIndex() {
    const { empleados, departamentos, filters } = usePage<PageProps>().props
    const [searchTerm, setSearchTerm] = useState(filters.search || '')
    const [selectedDepartamento, setSelectedDepartamento] = useState(filters.departamento || 'all')
    const [selectedEstado, setSelectedEstado] = useState(filters.estado || 'all')
    const [selectedAccesoSistema, setSelectedAccesoSistema] = useState(filters.acceso_sistema || 'all')

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Empleados', href: '/empleados' }
    ]

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        router.get('/empleados', {
            search: searchTerm,
            departamento: selectedDepartamento === 'all' ? '' : selectedDepartamento,
            estado: selectedEstado === 'all' ? '' : selectedEstado,
            acceso_sistema: selectedAccesoSistema === 'all' ? '' : selectedAccesoSistema,
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const handleDelete = (empleado: Empleado) => {
        if (confirm(`¿Estás seguro de que quieres eliminar al empleado ${empleado.user?.name || empleado.codigo_empleado}?`)) {
            router.delete(`/empleados/${empleado.id}`, {
                onSuccess: () => {
                    toast.success('Empleado eliminado exitosamente.')
                },
                onError: () => {
                    toast.error('Ocurrió un error al eliminar el empleado.')
                }
            })
        }
    }

    const toggleAccesoSistema = (empleado: Empleado) => {
        const accion = empleado.puede_acceder_sistema ? 'revocar' : 'otorgar'
        if (confirm(`¿Estás seguro de que quieres ${accion} el acceso al sistema para ${empleado.user?.name || empleado.codigo_empleado}?`)) {
            router.patch(`/empleados/${empleado.id}/toggle-acceso-sistema`, {}, {
                onSuccess: () => {
                    toast.success(`Acceso al sistema ${empleado.puede_acceder_sistema ? 'revocado' : 'otorgado'} exitosamente.`)
                },
                onError: () => {
                    toast.error('Ocurrió un error al actualizar el acceso al sistema.')
                }
            })
        }
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedDepartamento('all')
        setSelectedEstado('all')
        setSelectedAccesoSistema('all')
        router.get('/empleados')
    }

    const getEstadoBadge = (estado: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            'activo': 'default',
            'inactivo': 'secondary',
            'vacaciones': 'outline',
            'licencia': 'destructive'
        }

        const colors: Record<string, string> = {
            'activo': 'bg-green-100 text-green-800 hover:bg-green-200',
            'inactivo': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
            'vacaciones': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
            'licencia': 'bg-red-100 text-red-800 hover:bg-red-200'
        }

        return (
            <Badge className={colors[estado]} variant={variants[estado]}>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </Badge>
        )
    }

    const getTipoContratoBadge = (tipo: string) => {
        const colors: Record<string, string> = {
            'indefinido': 'bg-blue-100 text-blue-800',
            'temporal': 'bg-yellow-100 text-yellow-800',
            'practicante': 'bg-purple-100 text-purple-800'
        }

        return (
            <Badge className={colors[tipo]}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </Badge>
        )
    }

    const calcularAntiguedad = (fechaIngreso: string) => {
        const fecha = new Date(fechaIngreso)
        const hoy = new Date()
        const años = hoy.getFullYear() - fecha.getFullYear()
        const meses = hoy.getMonth() - fecha.getMonth()

        if (años > 0) {
            return `${años} año${años > 1 ? 's' : ''}`
        } else if (meses > 0) {
            return `${meses} mes${meses > 1 ? 'es' : ''}`
        } else {
            return 'Menos de 1 mes'
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Empleados" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
                        <p className="text-gray-600">Gestiona la información de los empleados</p>
                    </div>
                    <Can permission="empleados.create">
                        <Button asChild>
                            <Link href="/empleados/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Empleado
                            </Link>
                        </Button>
                    </Can>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros de búsqueda</CardTitle>
                        <CardDescription>Filtra empleados por diferentes criterios</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <Label htmlFor="search">Buscar</Label>
                                    <Input
                                        id="search"
                                        type="text"
                                        placeholder="Nombre, código, CI..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/*<div>
                                    <Label htmlFor="departamento">Departamento</Label>
                                    <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            {departamentos.map((dept) => (
                                                <SelectItem key={dept} value={dept}>
                                                    {dept}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>*/}

                                <div>
                                    <Label htmlFor="estado">Estado</Label>
                                    <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="activo">Activo</SelectItem>
                                            <SelectItem value="inactivo">Inactivo</SelectItem>
                                            <SelectItem value="vacaciones">Vacaciones</SelectItem>
                                            <SelectItem value="licencia">Licencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="acceso_sistema">Acceso Sistema</Label>
                                    <Select value={selectedAccesoSistema} onValueChange={setSelectedAccesoSistema}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="con_usuario">Con usuario</SelectItem>
                                            <SelectItem value="sin_usuario">Sin usuario</SelectItem>
                                            <SelectItem value="1">Con acceso</SelectItem>
                                            <SelectItem value="0">Sin acceso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button type="submit" className="flex-1">
                                        <Search className="h-4 w-4 mr-2" />
                                        Buscar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="flex-1"
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Lista de empleados */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Lista de Empleados</CardTitle>
                                <CardDescription>
                                    Mostrando {empleados.data.length} de {empleados.total} empleados
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Empleado</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Código</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Cargo</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Departamento</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Contrato</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Antigüedad</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Usuario Sistema</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Acceso Sistema</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Supervisor</th>
                                        <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empleados.data.map((empleado) => (
                                        <tr key={empleado.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {empleado.user?.name || empleado.codigo_empleado}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {empleado.user?.email || 'Sin usuario del sistema'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-sm">{empleado.codigo_empleado}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm font-medium">{empleado.cargo}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm">{empleado.departamento}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {getEstadoBadge(empleado.estado)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getTipoContratoBadge(empleado.tipo_contrato)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                                    {calcularAntiguedad(empleado.fecha_ingreso)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center text-sm">
                                                    {empleado.user ? (
                                                        <>
                                                            <User className="h-4 w-4 mr-1 text-green-500" />
                                                            <span className="text-green-700">Sí</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldOff className="h-4 w-4 mr-1 text-gray-400" />
                                                            <span className="text-gray-500">No</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Can permission="empleados.toggle-acceso-sistema">
                                                    {empleado.user ? (
                                                        <Button
                                                            size="sm"
                                                            variant={empleado.puede_acceder_sistema ? "default" : "outline"}
                                                            onClick={() => toggleAccesoSistema(empleado)}
                                                            className="h-7"
                                                        >
                                                            {empleado.puede_acceder_sistema ? (
                                                                <>
                                                                    <Shield className="h-3 w-3 mr-1" />
                                                                    Sí
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShieldOff className="h-3 w-3 mr-1" />
                                                                    No
                                                                </>
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">N/A</span>
                                                    )}
                                                </Can>
                                                {!Can({ permission: "empleados.toggle-acceso-sistema" }) && (
                                                    empleado.user ? (
                                                        <Badge variant={empleado.puede_acceder_sistema ? "default" : "secondary"}>
                                                            {empleado.puede_acceder_sistema ? "Sí" : "No"}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            N/A
                                                        </Badge>
                                                    )
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {empleado.supervisor ? (
                                                    <span className="text-sm">{empleado.supervisor.user.name}</span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Sin supervisor</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Can permission="empleados.show">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/empleados/${empleado.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </Can>
                                                    <Can permission="empleados.edit">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/empleados/${empleado.id}/edit`}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </Can>
                                                    <Can permission="empleados.destroy">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(empleado)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </Can>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {empleados.data.length === 0 && (
                            <div className="text-center py-12">
                                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 mb-2">No se encontraron empleados</p>
                                <p className="text-sm text-gray-400">
                                    {Object.values(filters).some(v => v)
                                        ? 'Intenta ajustar los filtros de búsqueda'
                                        : 'Comienza agregando tu primer empleado'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Paginación */}
                        {empleados.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Página {empleados.current_page} de {empleados.last_page}
                                </div>
                                <div className="flex items-center gap-2">
                                    {empleados.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
