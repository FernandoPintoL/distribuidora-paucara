import { Head, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ArrowLeft, FileText, Package } from 'lucide-react'

interface Cliente {
    id: number
    nombre: string
    email?: string
    telefono?: string
    direccion?: string
}

interface Usuario {
    id: number
    name: string
}

interface Marca {
    id: number
    nombre: string
}

interface Categoria {
    id: number
    nombre: string
}

interface Producto {
    id: number
    nombre: string
    codigo?: string
    precio_venta: number
    marca: Marca
    categoria: Categoria
}

interface DetalleProforma {
    id: number
    cantidad: number
    precio_unitario: number
    descuento: number
    subtotal: number
    producto: Producto
}

interface Proforma {
    id: number
    numero: string
    fecha: string
    subtotal: number
    descuento: number
    impuesto: number
    total: number
    observaciones?: string
    estado: string
    cliente: Cliente
    usuarioCreador?: Usuario
    detalles: DetalleProforma[]
    created_at: string
    updated_at: string
}

interface Props {
    proforma: Proforma
}

const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        'PENDIENTE': { label: 'Pendiente', variant: 'default' },
        'APROBADA': { label: 'Aprobada', variant: 'default' },
        'RECHAZADA': { label: 'Rechazada', variant: 'destructive' },
        'CONVERTIDA': { label: 'Convertida', variant: 'default' },
        'VENCIDA': { label: 'Vencida', variant: 'destructive' },
    }

    return estados[estado] || { label: 'Desconocido', variant: 'secondary' as const }
}

export default function ProformasShow({ proforma }: Props) {
    const estado = getEstadoBadge(proforma.estado)

    return (
        <AppLayout>
            <Head title={`Proforma ${proforma.numero}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/proformas">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Proforma {proforma.numero}
                            </h1>
                            <p className="text-muted-foreground">
                                Creada el {new Date(proforma.created_at).toLocaleDateString('es-ES')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant={estado.variant} className="text-sm px-3 py-1">
                            {estado.label}
                        </Badge>
                        <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Imprimir
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Información principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Detalles de la proforma */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Detalles de la Proforma
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Cantidad</TableHead>
                                            <TableHead>Precio Unit.</TableHead>
                                            <TableHead>Descuento</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {proforma.detalles.map((detalle) => (
                                            <TableRow key={detalle.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {detalle.producto.nombre}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {detalle.producto.categoria.nombre} - {detalle.producto.marca.nombre}
                                                        </div>
                                                        {detalle.producto.codigo && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Código: {detalle.producto.codigo}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{detalle.cantidad}</TableCell>
                                                <TableCell>
                                                    Bs. {detalle.precio_unitario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>
                                                    Bs. {detalle.descuento.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    Bs. {detalle.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Observaciones */}
                        {proforma.observaciones && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Observaciones</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {proforma.observaciones}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Información lateral */}
                    <div className="space-y-6">
                        {/* Cliente */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cliente</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="font-medium">{proforma.cliente.nombre}</div>
                                    {proforma.cliente.email && (
                                        <div className="text-sm text-muted-foreground">
                                            {proforma.cliente.email}
                                        </div>
                                    )}
                                    {proforma.cliente.telefono && (
                                        <div className="text-sm text-muted-foreground">
                                            {proforma.cliente.telefono}
                                        </div>
                                    )}
                                </div>
                                {proforma.cliente.direccion && (
                                    <div>
                                        <div className="text-sm font-medium">Dirección:</div>
                                        <div className="text-sm text-muted-foreground">
                                            {proforma.cliente.direccion}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Resumen */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>Bs. {proforma.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Descuento:</span>
                                    <span>Bs. {proforma.descuento.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Impuesto:</span>
                                    <span>Bs. {proforma.impuesto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span>Bs. {proforma.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Información adicional */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium">Fecha:</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(proforma.fecha).toLocaleDateString('es-ES')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Usuario:</div>
                                    <div className="text-sm text-muted-foreground">
                                        {proforma.usuarioCreador?.name || 'Sin asignar'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Última actualización:</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(proforma.updated_at).toLocaleDateString('es-ES')}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}