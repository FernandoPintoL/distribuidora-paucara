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
    modulosPadre: ModuloSidebar[]
    [key: string]: unknown
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Centro de Permisos',
        href: '/admin/permisos',
    },
    {
        title: 'Crear Módulo',
        href: '/admin/permisos/modulos/create',
    },
]

export default function Create({ modulosPadre }: PageProps) {
    const { data, setData, post, processing, errors } = useForm<ModuloFormData>({
        titulo: '',
        ruta: '',
        icono: 'Package',
        descripcion: '',
        orden: 1,
        activo: true,
        es_submenu: false,
        modulo_padre_id: '',
        categoria: '',
        visible_dashboard: false,
        permisos: [],
        color: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        post('/modulos-sidebar', {
            onSuccess: () => {
                toast.success('Módulo creado exitosamente.')
                router.visit('/admin/permisos?tab=modulos')
            },
            onError: () => {
                toast.error('Error al crear el módulo.')
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
            <Head title="Crear Módulo" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Crear Nuevo Módulo</h1>
                        <p className="text-muted-foreground">
                            Crea un nuevo módulo del sidebar con su configuración y permisos.
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
                            Complete la información requerida para crear el módulo.
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
                            submitLabel="Crear Módulo"
                            modulosPadre={modulosPadre}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
