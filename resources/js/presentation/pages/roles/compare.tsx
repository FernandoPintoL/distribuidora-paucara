import { Link, Head } from '@inertiajs/react'
import React, { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { type BreadcrumbItem } from '@/types'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select'
import axios from 'axios'

interface ComparisonResult {
    rol1: {
        id: number
        nombre: string
        soloEnEste: string[]
        total: number
    }
    rol2: {
        id: number
        nombre: string
        soloEnEste: string[]
        total: number
    }
    comunes: number
    diferentes: number
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestión de Roles',
        href: '/roles',
    },
    {
        title: 'Comparar Roles',
        href: '/roles/compare',
    },
]

export default function Compare() {
    const [roles, setRoles] = useState<any[]>([])
    const [role1Id, setRole1Id] = useState<string>('')
    const [role2Id, setRole2Id] = useState<string>('')
    const [comparison, setComparison] = useState<ComparisonResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingRoles, setLoadingRoles] = useState(true)

    // Cargar roles al montar
    React.useEffect(() => {
        cargarRoles()
    }, [])

    const cargarRoles = async () => {
        try {
            setLoadingRoles(true)
            // Cargar todos los roles disponibles desde el API endpoint
            const response = await axios.get('/api/roles/details')
            const rolesData = response.data?.data?.roles || []
            setRoles(rolesData)
        } catch (error) {
            console.error('Error cargando roles:', error)
            toast.error('Error al cargar los roles')
        } finally {
            setLoadingRoles(false)
        }
    }

    const handleCompare = async () => {
        if (!role1Id || !role2Id) {
            toast.error('Selecciona dos roles para comparar')
            return
        }

        if (role1Id === role2Id) {
            toast.error('Selecciona dos roles diferentes')
            return
        }

        try {
            setLoading(true)
            const response = await axios.post('/roles-data/compare', {
                role1_id: parseInt(role1Id),
                role2_id: parseInt(role2Id),
            })
            setComparison(response.data)
        } catch (error) {
            toast.error('Error al comparar roles')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comparar Roles" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Comparar Roles</h1>
                        <p className="text-muted-foreground">
                            Compara permisos entre dos roles para ver diferencias.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/roles">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                </div>

                {/* Selector de roles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Seleccionar Roles</CardTitle>
                        <CardDescription>
                            Elige dos roles para compararlos lado a lado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-5 items-end">
                                {/* Rol 1 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rol 1</label>
                                    <RoleSelect
                                        value={role1Id}
                                        onChange={setRole1Id}
                                        excludeId={role2Id ? parseInt(role2Id) : undefined}
                                        roles={roles}
                                        loading={loadingRoles}
                                    />
                                </div>

                                {/* Ícono de comparación */}
                                <div className="flex justify-center pt-2">
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                </div>

                                {/* Rol 2 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rol 2</label>
                                    <RoleSelect
                                        value={role2Id}
                                        onChange={setRole2Id}
                                        excludeId={role1Id ? parseInt(role1Id) : undefined}
                                        roles={roles}
                                        loading={loadingRoles}
                                    />
                                </div>

                                {/* Espacio para botón */}
                                <div></div>

                                {/* Botón de comparación */}
                                <Button
                                    onClick={handleCompare}
                                    disabled={!role1Id || !role2Id || loading}
                                    className="w-full"
                                >
                                    {loading ? 'Comparando...' : 'Comparar'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Resultado de comparación */}
                {comparison && (
                    <div className="space-y-4">
                        {/* Resumen */}
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {comparison.comunes}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Permisos Comunes
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {comparison.diferentes}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Permisos Diferentes
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            <Badge variant="default">
                                                {Math.round(
                                                    (comparison.comunes /
                                                        (comparison.rol1.total + comparison.rol2.total - comparison.comunes)) *
                                                    100
                                                )}
                                                % Similar
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Comparación lado a lado */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Rol 1 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {comparison.rol1.nombre}
                                    </CardTitle>
                                    <CardDescription>
                                        Total: {comparison.rol1.total} permisos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {comparison.rol1.soloEnEste.length > 0 ? (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-orange-600 flex items-center gap-2">
                                                <XCircle className="h-4 w-4" />
                                                Exclusivos de {comparison.rol1.nombre}
                                            </h4>
                                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                                {comparison.rol1.soloEnEste.map((permiso, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-sm p-2 bg-orange-50 dark:bg-orange-900/20 rounded border-l-2 border-orange-500"
                                                    >
                                                        {permiso}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            No hay permisos exclusivos
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Rol 2 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {comparison.rol2.nombre}
                                    </CardTitle>
                                    <CardDescription>
                                        Total: {comparison.rol2.total} permisos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {comparison.rol2.soloEnEste.length > 0 ? (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-green-600 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Exclusivos de {comparison.rol2.nombre}
                                            </h4>
                                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                                {comparison.rol2.soloEnEste.map((permiso, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-500"
                                                    >
                                                        {permiso}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            No hay permisos exclusivos
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}

// Componente auxiliar para selector de rol
function RoleSelect({
    value,
    onChange,
    excludeId,
    roles = [],
    loading = false,
}: {
    value: string
    onChange: (value: string) => void
    excludeId?: number
    roles?: any[]
    loading?: boolean
}) {
    // Filtrar roles: excluir el que está seleccionado en el otro selector
    const filteredRoles = roles.filter((r) => !excludeId || r.id !== excludeId)

    if (loading) {
        return <div className="text-sm text-gray-500">Cargando...</div>
    }

    if (roles.length === 0) {
        return <div className="text-sm text-gray-500">No hay roles disponibles</div>
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol..." />
            </SelectTrigger>
            <SelectContent>
                {filteredRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
