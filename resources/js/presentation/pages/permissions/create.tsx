import { Head, Link, useForm, router, usePage } from '@inertiajs/react'
import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Shield } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'

interface PageProps {
    modules?: string[]
    [key: string]: unknown
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestión de Permisos',
        href: '/permissions',
    },
    {
        title: 'Crear Permiso',
        href: '/permissions/create',
    },
]

export default function Create() {
    const { modules } = usePage<PageProps>().props

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        guard_name: 'web',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        post('/permissions', {
            onSuccess: () => {
                toast.success('Permiso creado exitosamente')
                router.visit('/permissions')
            },
            onError: (errors) => {
                console.error('Error creating permission:', errors)
                toast.error('Error al crear el permiso')
            }
        })
    }

    const generatePermissionName = (module: string, action: string) => {
        return `${module}.${action}`
    }

    const commonActions = ['index', 'show', 'create', 'store', 'edit', 'update', 'destroy', 'delete']

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Permiso" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/permissions">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Crear Nuevo Permiso
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Define un nuevo permiso para el sistema
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Información del Permiso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nombre del permiso */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Permiso *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ej: productos.index, usuarios.create"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.name}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Usa el formato: módulo.acción (ej: productos.index, usuarios.create)
                                </p>
                            </div>

                            {/* Guard name */}
                            <div className="space-y-2">
                                <Label htmlFor="guard_name">Guard Name</Label>
                                <Select
                                    value={data.guard_name}
                                    onValueChange={(value) => setData('guard_name', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un guard" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="web">Web</SelectItem>
                                        <SelectItem value="api">API</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.guard_name && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errors.guard_name}
                                    </p>
                                )}
                            </div>

                            {/* Generador rápido de permisos */}
                            {modules && modules.length > 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-base font-medium">Generador Rápido</Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Selecciona un módulo y acción para generar el nombre automáticamente
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="module">Módulo</Label>
                                            <Select onValueChange={(module) => {
                                                if (module && data.name.split('.')[1]) {
                                                    setData('name', generatePermissionName(module, data.name.split('.')[1]))
                                                }
                                            }}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un módulo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {modules.map((module: string) => (
                                                        <SelectItem key={module} value={module}>
                                                            {module.charAt(0).toUpperCase() + module.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="action">Acción</Label>
                                            <Select onValueChange={(action) => {
                                                if (action && data.name.split('.')[0]) {
                                                    setData('name', generatePermissionName(data.name.split('.')[0], action))
                                                }
                                            }}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una acción" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {commonActions.map((action) => (
                                                        <SelectItem key={action} value={action}>
                                                            {action.charAt(0).toUpperCase() + action.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-4 pt-6 border-t">
                                <Link href="/permissions">
                                    <Button type="button" variant="outline">
                                        Cancelar
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? 'Creando...' : 'Crear Permiso'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Preview */}
                {data.name && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Vista Previa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Nombre:</span> {data.name}
                                </div>
                                <div>
                                    <span className="font-medium">Guard:</span> {data.guard_name}
                                </div>
                                <div>
                                    <span className="font-medium">Formato esperado:</span>{' '}
                                    {data.name.includes('.') ? (
                                        <span className="text-green-600 dark:text-green-400">
                                            ✓ Correcto (módulo.acción)
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600 dark:text-yellow-400">
                                            ⚠ Recomendado usar formato módulo.acción
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    )
}
