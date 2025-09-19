import { Link, usePage, Head } from '@inertiajs/react'
import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Mail, Phone, MapPin, User, Briefcase, DollarSign, Shield, AlertTriangle } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'

interface Supervisor {
    id: number
    nombre: string
    cargo: string
}

interface Empleado {
    id: number
    codigo_empleado: string
    numero_empleado: string
    ci: string
    fecha_nacimiento: string
    telefono: string
    direccion: string
    cargo: string
    puesto: string
    departamento: string
    supervisor_id?: number
    supervisor?: Supervisor
    fecha_ingreso: string
    tipo_contrato: string
    salario_base: number
    bonos: number
    estado: string
    puede_acceder_sistema: boolean
    contacto_emergencia_nombre: string
    contacto_emergencia_telefono: string
    created_at: string
    updated_at: string
    user?: {
        id: number
        name: string
        email: string
        usernick?: string
        roles: Array<{
            id: number
            name: string
        }>
    }
}

interface PageProps {
    empleado: Empleado
    [key: string]: unknown
}

const getEstadoBadge = (estado: string) => {
    const variants = {
        activo: 'bg-green-100 text-green-800 border-green-200',
        inactivo: 'bg-red-100 text-red-800 border-red-200',
        vacaciones: 'bg-blue-100 text-blue-800 border-blue-200',
        licencia: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return variants[estado as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getTipoContratoBadge = (tipo: string) => {
    const variants = {
        indefinido: 'bg-blue-100 text-blue-800 border-blue-200',
        temporal: 'bg-orange-100 text-orange-800 border-orange-200',
        practicante: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return variants[tipo as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2
    }).format(amount)
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }

    return age
}

const calculateYearsWorked = (startDate: string) => {
    const today = new Date()
    const start = new Date(startDate)
    let years = today.getFullYear() - start.getFullYear()
    const monthDiff = today.getMonth() - start.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
        years--
    }

    return years
}

export default function EmpleadosShow() {
    const { empleado } = usePage<PageProps>().props

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Empleados', href: '/empleados' },
        { title: empleado.user?.name || empleado.codigo_empleado, href: `/empleados/${empleado.id}` }
    ]

    const age = calculateAge(empleado.fecha_nacimiento)
    const yearsWorked = calculateYearsWorked(empleado.fecha_ingreso)
    const totalSalary = empleado.salario_base + empleado.bonos

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Empleado - ${empleado.user?.name || empleado.codigo_empleado}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/empleados">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{empleado.user?.name || empleado.codigo_empleado}</h1>
                            <p className="text-gray-600">{empleado.cargo} - {empleado.departamento}</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={`/empleados/${empleado.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Link>
                    </Button>
                </div>

                {/* Estado y badges */}
                <div className="flex items-center gap-3">
                    <Badge className={getEstadoBadge(empleado.estado)}>
                        {empleado.estado.charAt(0).toUpperCase() + empleado.estado.slice(1)}
                    </Badge>
                    <Badge className={getTipoContratoBadge(empleado.tipo_contrato)}>
                        {empleado.tipo_contrato.charAt(0).toUpperCase() + empleado.tipo_contrato.slice(1)}
                    </Badge>
                    {empleado.puede_acceder_sistema ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Acceso al Sistema
                        </Badge>
                    ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            Sin Acceso al Sistema
                        </Badge>
                    )}
                    {empleado.user?.roles?.map((role) => (
                        <Badge key={role.id} variant="outline">
                            {role.name}
                        </Badge>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Información Personal */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Información Personal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Nombre Completo</div>
                                        <div className="font-medium">{empleado.user?.name || empleado.codigo_empleado}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Código de Empleado</div>
                                        <div className="font-medium">{empleado.codigo_empleado}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Cédula de Identidad</div>
                                        <div className="font-medium">{empleado.ci}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Fecha de Nacimiento</div>
                                        <div className="font-medium">{formatDate(empleado.fecha_nacimiento)} ({age} años)</div>
                                    </div>
                                </div>

                                {empleado.telefono && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        <span>{empleado.telefono}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span>{empleado.user?.email || 'Sin email registrado'}</span>
                                </div>

                                {empleado.direccion && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                                        <span>{empleado.direccion}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Información Laboral */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Información Laboral
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Cargo</div>
                                        <div className="font-medium">{empleado.cargo}</div>
                                    </div>
                                    {empleado.puesto && (
                                        <div>
                                            <div className="text-sm text-gray-500">Puesto</div>
                                            <div className="font-medium">{empleado.puesto}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm text-gray-500">Departamento</div>
                                        <div className="font-medium">{empleado.departamento}</div>
                                    </div>
                                    {empleado.supervisor && (
                                        <div>
                                            <div className="text-sm text-gray-500">Supervisor</div>
                                            <div className="font-medium">{empleado.supervisor.nombre}</div>
                                            <div className="text-sm text-gray-500">{empleado.supervisor.cargo}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm text-gray-500">Fecha de Ingreso</div>
                                        <div className="font-medium">{formatDate(empleado.fecha_ingreso)} ({yearsWorked} años)</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Tipo de Contrato</div>
                                        <div className="font-medium">{empleado.tipo_contrato.charAt(0).toUpperCase() + empleado.tipo_contrato.slice(1)}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Información Salarial */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Información Salarial
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Salario Base</div>
                                        <div className="font-medium text-lg">{formatCurrency(empleado.salario_base)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Bonos</div>
                                        <div className="font-medium text-lg">{formatCurrency(empleado.bonos)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Total</div>
                                        <div className="font-bold text-xl text-green-600">{formatCurrency(totalSalary)}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Resumen Rápido */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Estado</span>
                                    <Badge className={getEstadoBadge(empleado.estado)}>
                                        {empleado.estado.charAt(0).toUpperCase() + empleado.estado.slice(1)}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Antigüedad</span>
                                    <span className="font-medium">{yearsWorked} años</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Edad</span>
                                    <span className="font-medium">{age} años</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Salario Total</span>
                                    <span className="font-medium">{formatCurrency(totalSalary)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contacto de Emergencia */}
                        {(empleado.contacto_emergencia_nombre || empleado.contacto_emergencia_telefono) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Contacto de Emergencia
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {empleado.contacto_emergencia_nombre && (
                                        <div>
                                            <div className="text-sm text-gray-500">Nombre</div>
                                            <div className="font-medium">{empleado.contacto_emergencia_nombre}</div>
                                        </div>
                                    )}
                                    {empleado.contacto_emergencia_telefono && (
                                        <div>
                                            <div className="text-sm text-gray-500">Teléfono</div>
                                            <div className="font-medium">{empleado.contacto_emergencia_telefono}</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Información del Usuario del Sistema */}
                        {empleado.user && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Usuario del Sistema
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-500">Nombre de Usuario</div>
                                            <div className="font-medium">{empleado.user?.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Usernick</div>
                                            <div className="font-medium">{empleado.user.usernick || 'No definido'}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Email</div>
                                            <div className="font-medium">{empleado.user?.email}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Estado de Acceso</div>
                                            <div className="font-medium">
                                                {empleado.puede_acceder_sistema ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Habilitado
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-800 border-red-200">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Deshabilitado
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 mb-2">Roles Asignados</div>
                                        <div className="flex flex-wrap gap-2">
                                            {empleado.user.roles?.map((role) => (
                                                <Badge key={role.id} variant="outline">
                                                    {role.name}
                                                </Badge>
                                            )) || <span className="text-gray-500">Sin roles asignados</span>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Información del Sistema */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sistema</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm text-gray-500">Usuario del Sistema</div>
                                    <div className="font-medium">
                                        {empleado.user ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                                <User className="h-3 w-3 mr-1" />
                                                Tiene usuario
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Sin usuario
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {empleado.user && (
                                    <>
                                        <div>
                                            <div className="text-sm text-gray-500">Acceso al Sistema</div>
                                            <div className="font-medium">
                                                {empleado.puede_acceder_sistema ? 'Habilitado' : 'Deshabilitado'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Roles</div>
                                            <div className="space-y-1">
                                                {empleado.user.roles?.map((role) => (
                                                    <Badge key={role.id} variant="outline" className="mr-1">
                                                        {role.name}
                                                    </Badge>
                                                )) || <span className="text-gray-500">Sin roles asignados</span>}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <div className="text-sm text-gray-500">Creado</div>
                                    <div className="font-medium text-sm">{formatDate(empleado.created_at)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Última actualización</div>
                                    <div className="font-medium text-sm">{formatDate(empleado.updated_at)}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}