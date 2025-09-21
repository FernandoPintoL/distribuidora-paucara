import { Link, router, Head } from '@inertiajs/react'
import React, { useState, useEffect } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import SearchSelect from '@/components/ui/search-select'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'

interface EmpleadoFormData {
    crear_usuario: boolean
    nombre: string
    usernick: string
    email: string
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
    // const { } = usePage<PageProps>().props
    const [loading, setLoading] = useState(false)
    const [departamentos, setDepartamentos] = useState([])
    const [tiposContrato, setTiposContrato] = useState([])
    const [estados, setEstados] = useState([])
    const [supervisoresOptions, setSupervisoresOptions] = useState([])
    const [rolesOptions, setRolesOptions] = useState([])
    const [loadingSelects, setLoadingSelects] = useState(true)
    const [formData, setFormData] = useState<EmpleadoFormData>({
        crear_usuario: true,
        nombre: '',
        usernick: '',
        email: '',
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

    const handleSelectChange = (field: keyof EmpleadoFormData) => (
        value: string | number
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: value.toString()
        }))
    }

    // Cargar datos de los selects desde la API
    useEffect(() => {
        const loadSelectData = async () => {
            try {
                setLoadingSelects(true)

                const [departamentosRes, tiposContratoRes, estadosRes, supervisoresRes, rolesRes] = await Promise.all([
                    fetch('/empleados-data/departamentos'),
                    fetch('/empleados-data/tipos-contrato'),
                    fetch('/empleados-data/estados'),
                    fetch('/empleados-data/supervisores'),
                    fetch('/empleados-data/roles')
                ])

                const [departamentosData, tiposContratoData, estadosData, supervisoresData, rolesData] = await Promise.all([
                    departamentosRes.json(),
                    tiposContratoRes.json(),
                    estadosRes.json(),
                    supervisoresRes.json(),
                    rolesRes.json()
                ])

                setDepartamentos(departamentosData)
                setTiposContrato(tiposContratoData)
                setEstados(estadosData)
                setSupervisoresOptions(supervisoresData)
                setRolesOptions(rolesData)
            } catch (error) {
                console.error('Error cargando datos de selects:', error)
                toast.error('Error al cargar los datos del formulario')
            } finally {
                setLoadingSelects(false)
            }
        }

        loadSelectData()
    }, [])

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
                            {/* Checkbox para crear usuario */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="crear_usuario"
                                    checked={formData.crear_usuario}
                                    onCheckedChange={(checked) => handleInputChange('crear_usuario')(!!checked)}
                                />
                                <Label htmlFor="crear_usuario" className="text-sm font-medium">
                                    Crear usuario para acceso al sistema
                                </Label>
                            </div>

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
                                {formData.crear_usuario && (
                                    <div>
                                        <Label htmlFor="usernick">Usernick</Label>
                                        <Input
                                            id="usernick"
                                            value={formData.usernick}
                                            onChange={(e) => handleInputChange('usernick')(e.target.value)}
                                            placeholder="Nombre de usuario (opcional)"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Si no se especifica, se generará automáticamente
                                        </p>
                                    </div>
                                )}
                                {formData.crear_usuario && (
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
                                )}
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
                                    <Label htmlFor="cargo">Cargo *</Label>
                                    <Input
                                        id="cargo"
                                        value={formData.cargo}
                                        onChange={(e) => handleInputChange('cargo')(e.target.value)}
                                        placeholder="Analista de Ventas"
                                        required
                                    />
                                </div>
                                {/* <div>
                                    <Label htmlFor="puesto">Puesto</Label>
                                    <Input
                                        id="puesto"
                                        value={formData.puesto}
                                        onChange={(e) => handleInputChange('puesto')(e.target.value)}
                                        placeholder="Puesto específico"
                                    />
                                </div> */}
                                <div>
                                    <Label htmlFor="departamento">Departamento *</Label>
                                    <SearchSelect
                                        id="departamento"
                                        placeholder="Selecciona un departamento"
                                        value={formData.departamento}
                                        options={departamentos}
                                        onChange={(value) => handleSelectChange('departamento')(value)}
                                        loading={loadingSelects}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="supervisor_id">Supervisor</Label>
                                    <SearchSelect
                                        id="supervisor_id"
                                        placeholder="Sin supervisor"
                                        value={formData.supervisor_id}
                                        options={supervisoresOptions}
                                        onChange={(value) => handleSelectChange('supervisor_id')(value)}
                                        loading={loadingSelects}
                                    />
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
                                    <SearchSelect
                                        id="tipo_contrato"
                                        placeholder="Selecciona un tipo de contrato"
                                        value={formData.tipo_contrato}
                                        options={tiposContrato}
                                        onChange={(value) => handleSelectChange('tipo_contrato')(value)}
                                        loading={loadingSelects}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="estado">Estado *</Label>
                                    <SearchSelect
                                        id="estado"
                                        placeholder="Selecciona un estado"
                                        value={formData.estado}
                                        options={estados}
                                        onChange={(value) => handleSelectChange('estado')(value)}
                                        loading={loadingSelects}
                                        required
                                    />
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
                    {formData.crear_usuario && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuración del Sistema</CardTitle>
                                <CardDescription>Permisos y roles del empleado en el sistema</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <SearchSelect
                                            id="rol"
                                            label="Rol en el Sistema"
                                            placeholder="Seleccione un rol"
                                            value={formData.rol}
                                            options={rolesOptions}
                                            onChange={handleSelectChange('rol')}
                                            loading={loadingSelects}
                                            required
                                        />
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
                    )}

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