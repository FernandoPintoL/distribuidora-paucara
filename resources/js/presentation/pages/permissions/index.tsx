import { Link, router, usePage, Head } from '@inertiajs/react'
import React, { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import toast from 'react-hot-toast'
import { Trash2, Pencil, Plus, Search, Shield, Users, Eye } from 'lucide-react'
import Can from '@/presentation/components/auth/Can'
import { type BreadcrumbItem } from '@/types'

interface Permission {
    id: number
    name: string
    guard_name: string
    created_at: string
    roles_count: number
    users_count: number
    roles?: Array<{
        id: number
        name: string
    }>
}

interface PaginationLink {
    url: string | null
    label: string
    active: boolean
}

interface PageProps {
    permissions?: {
        current_page: number
        data: Permission[]
        first_page_url: string | null
        from: number
        last_page: number
        last_page_url: string | null
        links: PaginationLink[]
        next_page_url: string | null
        path: string
        per_page: number
        prev_page_url: string | null
        to: number
        total: number
    }
    modules?: string[]
    filters?: {
        search?: string
        module?: string
    }
    [key: string]: unknown
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestión de Permisos',
        href: '/permissions',
    },
]

export default function Index() {
    const { permissions, modules, filters } = usePage<PageProps>().props
    const [searchTerm, setSearchTerm] = useState(filters?.search || '')
    const [selectedModule, setSelectedModule] = useState(filters?.module || '')

    // Early return if permissions is undefined
    if (!permissions) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Gestión de Permisos" />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Cargando permisos...</p>
                    </div>
                </div>
            </AppLayout>
        )
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        router.get('/permissions', {
            search: searchTerm,
            module: selectedModule,
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const handleModuleChange = (module: string) => {
        setSelectedModule(module)
        router.get('/permissions', {
            search: searchTerm,
            module: module === 'all' ? '' : module,
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedModule('')
        router.get('/permissions', {}, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const handleDelete = (permission: Permission) => {
        if (permission.roles_count > 0 || permission.users_count > 0) {
            toast.error(`No se puede eliminar el permiso "${permission.name}" porque está asignado a ${permission.roles_count} rol(es) y ${permission.users_count} usuario(s).`)
            return
        }

        if (confirm(`¿Estás seguro de que quieres eliminar el permiso "${permission.name}"?`)) {
            router.delete(`/permissions/${permission.id}`, {
                onSuccess: () => {
                    toast.success('Permiso eliminado exitosamente')
                },
                onError: () => {
                    toast.error('Error al eliminar el permiso')
                }
            })
        }
    }

    const getPermissionBadgeColor = (permissionName: string) => {
        if (permissionName.includes('.index') || permissionName.includes('.show')) {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
        }
        if (permissionName.includes('.create') || permissionName.includes('.store')) {
            return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
        }
        if (permissionName.includes('.edit') || permissionName.includes('.update')) {
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
        }
        if (permissionName.includes('.destroy') || permissionName.includes('.delete')) {
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
        }
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200'
    }

    const getPermissionIcon = (permissionName: string) => {
        if (permissionName.includes('.index') || permissionName.includes('.show')) {
            return <Eye className="w-3 h-3" />
        }
        if (permissionName.includes('.create') || permissionName.includes('.store')) {
            return <Plus className="w-3 h-3" />
        }
        if (permissionName.includes('.edit') || permissionName.includes('.update')) {
            return <Pencil className="w-3 h-3" />
        }
        if (permissionName.includes('.destroy') || permissionName.includes('.delete')) {
            return <Trash2 className="w-3 h-3" />
        }
        return <Shield className="w-3 h-3" />
    }

    const formatPermissionName = (name: string) => {
        const parts = name.split('.')
        if (parts.length >= 2) {
            const module = parts[0].replace(/([A-Z])/g, ' $1').trim()
            const action = parts[1].replace(/([A-Z])/g, ' $1').trim()
            return `${module}: ${action}`
        }
        return name.replace(/([A-Z])/g, ' $1').trim()
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Permisos" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Gestión de Permisos
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {permissions?.total && permissions.total > 0
                                ? `${permissions.from}-${permissions.to} de ${permissions.total} permisos`
                                : 'No se encontraron permisos'
                            }
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Can permission="permissions.create">
                            <Link href="/permissions/create">
                                <Button className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Nuevo Permiso
                                </Button>
                            </Link>
                        </Can>
                    </div>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Filtros de Búsqueda
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Búsqueda por nombre */}
                                <div>
                                    <Label htmlFor="search">Buscar por nombre</Label>
                                    <Input
                                        id="search"
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Nombre del permiso..."
                                        className="w-full"
                                    />
                                </div>

                                {/* Filtro por módulo */}
                                <div>
                                    <Label htmlFor="module">Módulo</Label>
                                    <Select
                                        value={selectedModule || 'all'}
                                        onValueChange={handleModuleChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los módulos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los módulos</SelectItem>
                                            {modules?.map((module) => (
                                                <SelectItem key={module} value={module}>
                                                    {module.charAt(0).toUpperCase() + module.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Botones */}
                                <div className="flex items-end gap-2">
                                    <Button type="submit" className="flex-1">
                                        <Search className="w-4 h-4 mr-2" />
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

                {/* Lista de Permisos */}
                <div className="grid gap-4">
                    {permissions?.data && permissions.data.length > 0 ? (
                        permissions.data.map((permission) => (
                            <Card key={permission.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge className={`flex items-center gap-1 ${getPermissionBadgeColor(permission.name)}`}>
                                                    {getPermissionIcon(permission.name)}
                                                    {permission.name}
                                                </Badge>
                                            </div>

                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                                {formatPermissionName(permission.name)}
                                            </h3>

                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Shield className="w-4 h-4" />
                                                    {permission.roles_count} rol(es)
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {permission.users_count} usuario(s)
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Creado: {new Date(permission.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Can permission="permissions.show">
                                                <Link href={`/permissions/${permission.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </Can>

                                            <Can permission="permissions.edit">
                                                <Link href={`/permissions/${permission.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </Can>

                                            <Can permission="permissions.delete">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(permission)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </Can>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No se encontraron permisos
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    No hay permisos que coincidan con los filtros aplicados.
                                </p>
                                <Button variant="outline" onClick={clearFilters}>
                                    Limpiar filtros
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Paginación */}
                {permissions?.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <Button
                                variant="outline"
                                onClick={() => permissions.links?.find(link => link.label === 'Previous')?.url && router.get(permissions.links.find(link => link.label === 'Previous')!.url!)}
                                disabled={!permissions.links?.find(link => link.label === 'Previous')?.url}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => permissions.links?.find(link => link.label === 'Next')?.url && router.get(permissions.links.find(link => link.label === 'Next')!.url!)}
                                disabled={!permissions.links?.find(link => link.label === 'Next')?.url}
                            >
                                Siguiente
                            </Button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Mostrando <span className="font-medium">{permissions?.from}</span> a{' '}
                                    <span className="font-medium">{permissions?.to}</span> de{' '}
                                    <span className="font-medium">{permissions?.total}</span> resultados
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    {permissions.links?.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${link.active
                                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : link.url
                                                    ? 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-offset-0'
                                                    : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                } ${index === 0 ? 'rounded-l-md' : ''
                                                } ${index === (permissions.links?.length || 0) - 1 ? 'rounded-r-md' : ''
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
