import { Link, router, usePage, Head } from '@inertiajs/react'
import React, { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'

interface Supervisor {
    id: number
    nombre: string
    cargo: string
}

interface Role {
    id: number
    name: string
}

interface PageProps {
    supervisores: Supervisor[]
    roles: Role[]
    [key: string]: unknown
}

interface EmpleadoFormData {
    nombre: string
    email: string
    codigo_empleado: string
    ci: string
    fecha_nacimiento: string
    telefono: string
    direccion: string
    cargo: string
    puesto: string
    departamento: string
    supervisor_id: string
    fecha_ingreso: string
    tipo_contrato: string
    salario_base: string
    bonos: string
    estado: string
    puede_acceder_sistema: boolean
    contacto_emergencia_nombre: string
    contacto_emergencia_telefono: string
    rol: string
}

export default function EmpleadosCreate() {
    const { supervisores, roles } = usePage<PageProps>().props
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<EmpleadoFormData>({
        nombre: '',
        email: '',
        codigo_empleado: '',
        ci: '',
        fecha_nacimiento: '',
        telefono: '',
        direccion: '',
        cargo: '',
        puesto: '',
        departamento: '',
        supervisor_id: 'sin-supervisor',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        tipo_contrato: 'indefinido',
        salario_base: '',
        bonos: '0',
        estado: 'activo',
        puede_acceder_sistema: true,
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        rol: 'Empleado'
    })

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Empleados', href: '/empleados' },
        { title: 'Nuevo Empleado', href: '/empleados/create' }
    ]

    const handleInputChange = (field: keyof EmpleadoFormData) => (
        value: string | boolean
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const submitData = {
            ...formData,
            supervisor_id: formData.supervisor_id === 'sin-supervisor' ? '' : formData.supervisor_id
        }
        router.post('/empleados', submitData, {
            onSuccess: () => {
                toast.success('Empleado creado exitosamente')
            },
            onError: (errors) => {
                console.error('Errores de validación:', errors)
                toast.error('Corrige los errores en el formulario')
            },
            onFinish: () => {
                setLoading(false)
            }
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nuevo Empleado" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/empleados">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Nuevo Empleado</h1>
                        <p className="text-gray-600">Registra un nuevo empleado en el sistema</p>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información Personal */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Personal</CardTitle>
                            <CardDescription>Datos básicos del empleado</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="nombre">Nombre Completo *</Label>
                                    <Input
                                        id="nombre"
                                        value={formData.nombre}
                                        onChange={(e) => handleInputChange('nombre')(e.target.value)}
                                        placeholder="Nombre completo del empleado"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email')(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="ci">Cédula de Identidad *</Label>
                                    <Input
                                        id="ci"
                                        value={formData.ci}
                                        onChange={(e) => handleInputChange('ci')(e.target.value)}
                                        placeholder="12345678"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                                    <Input
                                        id="fecha_nacimiento"
                                        type="date"
                                        value={formData.fecha_nacimiento}
                                        onChange={(e) => handleInputChange('fecha_nacimiento')(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input
                                        id="telefono"
                                        value={formData.telefono}
                                        onChange={(e) => handleInputChange('telefono')(e.target.value)}
                                        placeholder="70123456"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="direccion">Dirección</Label>
                                <Textarea
                                    id="direccion"
                                    value={formData.direccion}
                                    onChange={(e) => handleInputChange('direccion')(e.target.value)}
                                    placeholder="Dirección completa del empleado"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Laboral */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Laboral</CardTitle>
                            <CardDescription>Datos del puesto y contrato</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="codigo_empleado">Código de Empleado *</Label>
                                    <Input
                                        id="codigo_empleado"
                                        value={formData.codigo_empleado}
                                        onChange={(e) => handleInputChange('codigo_empleado')(e.target.value)}
                                        placeholder="EMP001"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cargo">Cargo *</Label>
                                    <Input
                                        id="cargo"
                                        value={formData.cargo}
                                        onChange={(e) => handleInputChange('cargo')(e.target.value)}
                                        placeholder="Analista de Ventas"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="puesto">Puesto</Label>
                                    <Input
                                        id="puesto"
                                        value={formData.puesto}
                                        onChange={(e) => handleInputChange('puesto')(e.target.value)}
                                        placeholder="Puesto específico"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="departamento">Departamento *</Label>
                                    <Select value={formData.departamento} onValueChange={handleInputChange('departamento')}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un departamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ventas">Ventas</SelectItem>
                                            <SelectItem value="Administración">Administración</SelectItem>
                                            <SelectItem value="Logística">Logística</SelectItem>
                                            <SelectItem value="Contabilidad">Contabilidad</SelectItem>
                                            <SelectItem value="RRHH">Recursos Humanos</SelectItem>
                                            <SelectItem value="Sistemas">Sistemas</SelectItem>
                                            <SelectItem value="Compras">Compras</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="supervisor_id">Supervisor</Label>
                                    <Select value={formData.supervisor_id || 'sin-supervisor'} onValueChange={handleInputChange('supervisor_id')}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sin supervisor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sin-supervisor">Sin supervisor</SelectItem>
                                            {supervisores.map((supervisor) => (
                                                <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                                                    {supervisor.nombre} - {supervisor.cargo}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
                                    <Input
                                        id="fecha_ingreso"
                                        type="date"
                                        value={formData.fecha_ingreso}
                                        onChange={(e) => handleInputChange('fecha_ingreso')(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
                                    <Select value={formData.tipo_contrato} onValueChange={handleInputChange('tipo_contrato')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="indefinido">Indefinido</SelectItem>
                                            <SelectItem value="temporal">Temporal</SelectItem>
                                            <SelectItem value="practicante">Practicante</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="estado">Estado *</Label>
                                    <Select value={formData.estado} onValueChange={handleInputChange('estado')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="activo">Activo</SelectItem>
                                            <SelectItem value="inactivo">Inactivo</SelectItem>
                                            <SelectItem value="vacaciones">Vacaciones</SelectItem>
                                            <SelectItem value="licencia">Licencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Salarial */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Salarial</CardTitle>
                            <CardDescription>Datos de remuneración</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="salario_base">Salario Base (Bs.) *</Label>
                                    <Input
                                        id="salario_base"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.salario_base}
                                        onChange={(e) => handleInputChange('salario_base')(e.target.value)}
                                        placeholder="3000.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="bonos">Bonos (Bs.)</Label>
                                    <Input
                                        id="bonos"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.bonos}
                                        onChange={(e) => handleInputChange('bonos')(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuración del Sistema */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración del Sistema</CardTitle>
                            <CardDescription>Permisos y roles del empleado</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="rol">Rol en el Sistema</Label>
                                    <Select value={formData.rol} onValueChange={handleInputChange('rol')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.name}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="puede_acceder_sistema"
                                        checked={formData.puede_acceder_sistema}
                                        onCheckedChange={(checked) => handleInputChange('puede_acceder_sistema')(!!checked)}
                                    />
                                    <Label htmlFor="puede_acceder_sistema">
                                        Puede acceder al sistema
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacto de Emergencia */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contacto de Emergencia</CardTitle>
                            <CardDescription>Persona a contactar en caso de emergencia</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="contacto_emergencia_nombre">Nombre del Contacto</Label>
                                    <Input
                                        id="contacto_emergencia_nombre"
                                        value={formData.contacto_emergencia_nombre}
                                        onChange={(e) => handleInputChange('contacto_emergencia_nombre')(e.target.value)}
                                        placeholder="Nombre del contacto de emergencia"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="contacto_emergencia_telefono">Teléfono del Contacto</Label>
                                    <Input
                                        id="contacto_emergencia_telefono"
                                        value={formData.contacto_emergencia_telefono}
                                        onChange={(e) => handleInputChange('contacto_emergencia_telefono')(e.target.value)}
                                        placeholder="70123456"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/empleados">
                                Cancelar
                            </Link>
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Guardando...' : 'Guardar Empleado'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}