import { Link, useForm, Head } from '@inertiajs/react'
import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Checkbox } from '@/presentation/components/ui/checkbox'
import InputError from '@/presentation/components/input-error'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'

interface Role {
    id: number
    name: string
}

interface Permission {
    id: number
    name: string
    guard_name: string
    roles: Role[]
}

interface PageProps {
    permission: Permission
    roles: Role[]
    [key: string]: unknown
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestión de Permisos',
        href: '/permissions',
    },
    {
        title: 'Editar Permiso',
        href: '/permissions/edit',
    },
]

export default function Edit({ permission, roles }: PageProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
        guard_name: permission.guard_name || 'web',
        roles: permission.roles.map(r => r.id),
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        put(`/permissions/${permission.id}`, {
            onSuccess: () => {
                toast.success('Permiso actualizado exitosamente.')
            },
            onError: () => {
                toast.error('Error al actualizar el permiso.')
            },
        })
    }

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, roleId])
        } else {
            setData('roles', data.roles.filter(id => id !== roleId))
        }
    }

    const isRoleSelected = (roleId: number) => {
        return data.roles.includes(roleId)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Permiso: ${permission.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Editar Permiso</h1>
                        <p className="text-muted-foreground">
                            Modifica la información del permiso y sus asignaciones a roles.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/permissions">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Información del Permiso</CardTitle>
                        <CardDescription>
                            Modifique la información del permiso según sea necesario.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del Permiso</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Ej: usuarios.index, roles.create, etc."
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="guard_name">Guard Name</Label>
                                    <Input
                                        id="guard_name"
                                        type="text"
                                        value={data.guard_name}
                                        onChange={(e) => setData('guard_name', e.target.value)}
                                        placeholder="web"
                                        required
                                    />
                                    <InputError message={errors.guard_name} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Roles Asignados</Label>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={isRoleSelected(role.id)}
                                                onCheckedChange={(checked) =>
                                                    handleRoleChange(role.id, checked as boolean)
                                                }
                                            />
                                            <Label
                                                htmlFor={`role-${role.id}`}
                                                className="text-sm font-normal"
                                            >
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <InputError message={errors.roles} />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/permissions">Cancelar</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Actualizando...' : 'Actualizar Permiso'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
