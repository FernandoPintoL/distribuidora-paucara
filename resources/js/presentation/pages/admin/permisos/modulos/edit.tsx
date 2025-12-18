import { Link, useForm, Head, router } from '@inertiajs/react'
import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { ModuloForm } from '@/presentation/pages/ModulosSidebar/ModuloForm'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'
import { type ModuloSidebar, type ModuloFormData } from '@/domain/modulos/types'

interface PageProps {
    modulo: ModuloSidebar
    modulosPadre: ModuloSidebar[]
    [key: string]: unknown
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Centro de Permisos',
        href: '/admin/permisos',
    },
    {
        title: 'Editar Módulo',
        href: '/admin/permisos/modulos/edit',
    },
]

export default function Edit({ modulo, modulosPadre }: PageProps) {
    const { data, setData, put, processing, errors } = useForm<ModuloFormData>({
        titulo: modulo.titulo,
        ruta: modulo.ruta,
        icono: modulo.icono || 'Package',
        descripcion: modulo.descripcion || '',
        orden: modulo.orden,
        activo: modulo.activo,
        es_submenu: modulo.es_submenu,
        modulo_padre_id: modulo.modulo_padre_id?.toString() || '',
        categoria: modulo.categoria || '',
        visible_dashboard: modulo.visible_dashboard || false,
        permisos: modulo.permisos || [],
        color: modulo.color || '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        put(`/modulos-sidebar/${modulo.id}`, {
            onSuccess: () => {
                toast.success('Módulo actualizado exitosamente.')
                router.visit('/admin/permisos?tab=modulos')
            },
            onError: () => {
                toast.error('Error al actualizar el módulo.')
            },
        })
    }

    const handleChange = <K extends keyof ModuloFormData>(
        key: K,
        value: ModuloFormData[K]
    ) => {
        setData(key, value)
    }

    const handleCancel = () => {
        router.visit('/admin/permisos')
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Módulo: ${modulo.titulo}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Editar Módulo: {modulo.titulo}</h1>
                        <p className="text-muted-foreground">
                            Modifica la configuración y permisos del módulo del sidebar.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/admin/permisos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Información del Módulo</CardTitle>
                        <CardDescription>
                            Modifique la información del módulo según sea necesario.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ModuloForm
                            data={data}
                            errors={errors}
                            processing={processing}
                            onSubmit={handleSubmit}
                            onChange={handleChange}
                            onCancel={handleCancel}
                            submitLabel="Actualizar Módulo"
                            modulosPadre={modulosPadre}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
