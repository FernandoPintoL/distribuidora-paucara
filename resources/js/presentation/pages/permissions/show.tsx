import { Link, Head } from '@inertiajs/react'
import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Label } from '@/presentation/components/ui/label'
import { ArrowLeft, Edit, Users, Shield } from 'lucide-react'
import Can from '@/presentation/components/auth/Can'
import { type BreadcrumbItem } from '@/types'

interface Role {
    id: number
    name: string
}

interface User {
    id: number
    name: string
    email: string
}

interface Permission {
    id: number
    name: string
    guard_name: string
    created_at: string
    roles: Role[]
    users: User[]
}

interface PageProps {
    permission: Permission
    [key: string]: unknown
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestión de Permisos',
        href: '/permissions',
    },
    {
        title: 'Detalles del Permiso',
        href: '/permissions/show',
    },
]

export default function Show({ permission }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Permiso: ${permission.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Detalles del Permiso</h1>
                        <p className="text-muted-foreground">
                            Información completa del permiso y sus asignaciones.
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Can permission="permissions.edit">
                            <Button variant="outline" asChild>
                                <Link href={`/permissions/${permission.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                        </Can>
                        <Button variant="outline" asChild>
                            <Link href="/permissions">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Información del Permiso */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="mr-2 h-5 w-5" />
                                Información del Permiso
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                                <p className="text-lg font-semibold">{permission.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Guard Name</Label>
                                <p>{permission.guard_name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Fecha de Creación</Label>
                                <p>{new Date(permission.created_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Roles Asignados</Label>
                                <p className="text-2xl font-bold text-primary">{permission.roles.length}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Usuarios Asignados</Label>
                                <p className="text-2xl font-bold text-primary">{permission.users.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Roles Asignados */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Roles Asignados</CardTitle>
                            <CardDescription>
                                Lista de roles que tienen este permiso.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {permission.roles.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {permission.roles.map((role) => (
                                        <Badge key={role.id} variant="secondary">
                                            {role.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No hay roles asignados a este permiso.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Usuarios Asignados */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5" />
                                Usuarios Asignados
                            </CardTitle>
                            <CardDescription>
                                Usuarios que tienen este permiso asignado directamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {permission.users.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {permission.users.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No hay usuarios con este permiso asignado directamente.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
