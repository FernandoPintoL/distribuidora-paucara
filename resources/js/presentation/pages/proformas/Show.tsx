import { Head, Link, router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Separator } from '@/presentation/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/presentation/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog'
import { Textarea } from '@/presentation/components/ui/textarea'
import { Label } from '@/presentation/components/ui/label'
import { ArrowLeft, FileText, Package, Calendar, Clock, MapPin, AlertCircle, Check, X } from 'lucide-react'
import MapView from '@/presentation/components/maps/MapView'

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

interface Direccion {
    id: number
    direccion: string
    latitud?: number
    longitud?: number
    observaciones?: string
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
    // Campos de entrega
    fecha_entrega_solicitada?: string
    hora_entrega_solicitada?: string
    direccion_entrega_solicitada_id?: number
    direccion_solicitada?: Direccion // snake_case como viene del backend
    fecha_entrega_confirmada?: string
    hora_entrega_confirmada?: string
    direccion_entrega_confirmada_id?: number
    direccion_confirmada?: Direccion // snake_case como viene del backend
    coordinacion_completada?: boolean
    comentario_coordinacion?: string
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
    const { errors } = usePage().props as any
    const [showAprobarDialog, setShowAprobarDialog] = useState(false)
    const [showRechazarDialog, setShowRechazarDialog] = useState(false)
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAprobar = () => {
        setIsSubmitting(true)
        router.post(
            route('proformas.aprobar', proforma.id),
            {},
            {
                onSuccess: () => {
                    setShowAprobarDialog(false)
                    setIsSubmitting(false)
                },
                onError: () => {
                    setIsSubmitting(false)
                },
            }
        )
    }

    const handleRechazar = () => {
        if (!motivoRechazo.trim()) {
            return
        }
        setIsSubmitting(true)
        router.post(
            route('proformas.rechazar', proforma.id),
            { motivo: motivoRechazo },
            {
                onSuccess: () => {
                    setShowRechazarDialog(false)
                    setMotivoRechazo('')
                    setIsSubmitting(false)
                },
                onError: () => {
                    setIsSubmitting(false)
                },
            }
        )
    }

    const puedeAprobar = proforma.estado === 'PENDIENTE'
    const puedeRechazar = proforma.estado === 'PENDIENTE'

    return (
        <AppLayout>
            <Head title={`Proforma ${proforma.numero}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">

                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Proforma {proforma.numero}
                            </h1>
                            <p className="text-muted-foreground">
                                Creada el {new Date(proforma.created_at).toLocaleDateString('es-ES')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Badge variant={estado.variant} className="text-sm px-3 py-1">
                            {estado.label}
                        </Badge>

                        {puedeAprobar && (
                            <Button
                                variant="default"
                                onClick={() => setShowAprobarDialog(true)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Aprobar
                            </Button>
                        )}

                        {puedeRechazar && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowRechazarDialog(true)}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Rechazar
                            </Button>
                        )}

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

                        {/* Información de Entrega */}
                        {(proforma.fecha_entrega_solicitada || proforma.fecha_entrega_confirmada) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Información de Entrega
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Solicitud del Cliente */}
                                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                                        <h4 className="font-semibold text-sm mb-3">Solicitud Original del Cliente</h4>
                                        <div className="grid md:grid-cols-3 gap-4 text-sm space-y-3">
                                            {proforma.fecha_entrega_solicitada && (
                                                <div>
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>Fecha Solicitada</span>
                                                    </div>
                                                    <p className="font-medium">
                                                        {new Date(proforma.fecha_entrega_solicitada).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            )}
                                            {proforma.hora_entrega_solicitada && (
                                                <div>
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Hora Solicitada</span>
                                                    </div>
                                                    <p className="font-medium">
                                                        {proforma.hora_entrega_solicitada}
                                                    </p>
                                                </div>
                                            )}
                                            {proforma.direccion_solicitada && (
                                                <div>
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>Dirección Solicitada</span>
                                                    </div>
                                                    <p className="font-medium text-xs">
                                                        {proforma.direccion_solicitada.direccion}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Confirmación del Vendedor */}
                                    {proforma.estado === 'APROBADA' && proforma.fecha_entrega_confirmada && (
                                        <div className="border-l-4 border-green-500 pl-4 py-2">
                                            <h4 className="font-semibold text-sm mb-3">Confirmación del Vendedor</h4>
                                            <div className="grid md:grid-cols-3 gap-4 text-sm space-y-3">
                                                <div>
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>Fecha Confirmada</span>
                                                    </div>
                                                    <p className="font-medium">
                                                        {new Date(proforma.fecha_entrega_confirmada).toLocaleDateString('es-ES')}
                                                    </p>
                                                    {proforma.fecha_entrega_confirmada !== proforma.fecha_entrega_solicitada && (
                                                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            Cambio detectado
                                                        </p>
                                                    )}
                                                </div>

                                                {proforma.hora_entrega_confirmada && (
                                                    <div>
                                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                            <Clock className="h-4 w-4" />
                                                            <span>Hora Confirmada</span>
                                                        </div>
                                                        <p className="font-medium">
                                                            {proforma.hora_entrega_confirmada}
                                                        </p>
                                                        {proforma.hora_entrega_confirmada !== proforma.hora_entrega_solicitada && (
                                                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Cambio detectado
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {proforma.direccion_confirmada && (
                                                    <div>
                                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                            <MapPin className="h-4 w-4" />
                                                            <span>Dirección Confirmada</span>
                                                        </div>
                                                        <p className="font-medium text-xs">
                                                            {proforma.direccion_confirmada.direccion}
                                                        </p>
                                                        {proforma.direccion_confirmada.id !== proforma.direccion_solicitada?.id && (
                                                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Cambio detectado
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {proforma.comentario_coordinacion && (
                                                <div className="mt-4 p-3 bg-muted/50 rounded">
                                                    <p className="text-xs font-medium mb-1">Notas de Coordinación:</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {proforma.comentario_coordinacion}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Información lateral */}
                    <div className="space-y-6">
                        {/* Cliente */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información del Cliente</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Nombre */}
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">Nombre</div>
                                    <div className="font-semibold text-base mt-1">{proforma.cliente.nombre}</div>
                                </div>

                                {/* Email */}
                                {proforma.cliente.email && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase">Email</div>
                                        <div className="text-sm mt-1 break-all">{proforma.cliente.email}</div>
                                    </div>
                                )}

                                {/* Teléfono */}
                                {proforma.cliente.telefono && (
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase">Teléfono</div>
                                        <div className="text-sm mt-1">{proforma.cliente.telefono}</div>
                                    </div>
                                )}

                                {/* Dirección del cliente */}
                                {proforma.cliente.direccion && (
                                    <div className="border-t pt-4">
                                        <div className="text-xs font-medium text-muted-foreground uppercase">Dirección Registrada</div>
                                        <div className="text-sm mt-1 text-muted-foreground">
                                            {proforma.cliente.direccion}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Dirección de Entrega Solicitada */}
                        {proforma.direccion_solicitada && (
                            <Card className="border-l-4 border-blue-500">
                                <CardHeader>
                                    <CardTitle className="text-base">Dirección de Entrega</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground uppercase">Dirección Solicitada</div>
                                        <div className="text-sm mt-2 text-muted-foreground">
                                            {proforma.direccion_solicitada.direccion}
                                        </div>
                                    </div>
                                    {proforma.direccion_solicitada.latitud && proforma.direccion_solicitada.longitud ? (
                                        <>
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-medium">Coordenadas:</span> {proforma.direccion_solicitada.latitud.toFixed(4)}, {proforma.direccion_solicitada.longitud.toFixed(4)}
                                            </div>
                                            {/* Mapa de ubicación */}
                                            <div className="pt-2">
                                                <div className="text-xs font-medium text-muted-foreground mb-2">Ubicación en el mapa:</div>
                                                <MapView
                                                    latitude={proforma.direccion_solicitada.latitud}
                                                    longitude={proforma.direccion_solicitada.longitud}
                                                    height="250px"
                                                    zoom={15}
                                                    markerTitle="Ubicación de entrega solicitada"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs text-amber-600 dark:text-amber-400">
                                            No hay coordenadas disponibles para esta dirección
                                        </div>
                                    )}
                                    {proforma.fecha_entrega_solicitada && (
                                        <div className="pt-2 border-t">
                                            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Fecha Solicitada</div>
                                            <div className="text-sm font-medium">
                                                {new Date(proforma.fecha_entrega_solicitada).toLocaleDateString('es-ES')}
                                            </div>
                                        </div>
                                    )}
                                    {proforma.hora_entrega_solicitada && (
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Hora Solicitada</div>
                                            <div className="text-sm font-medium">
                                                {proforma.hora_entrega_solicitada}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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
                                {/* Impuesto oculto - por ahora no se requiere */}
                                <div className="flex justify-between" style={{ display: 'none' }}>
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
                                <CardTitle>Información y Auditoría</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium">Fecha de Creación:</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(proforma.fecha).toLocaleDateString('es-ES')}
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-sm font-medium">Usuario Creador (Sistema):</div>
                                    <div className="text-sm text-muted-foreground">
                                        {proforma.usuarioCreador?.name || 'Sin asignar'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Es el usuario del sistema asociado al cliente que creó la proforma
                                    </p>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-sm font-medium">Última Actualización:</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(proforma.updated_at).toLocaleDateString('es-ES')}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Diálogo de confirmación para aprobar */}
            <AlertDialog open={showAprobarDialog} onOpenChange={setShowAprobarDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aprobar Proforma</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas aprobar la proforma {proforma.numero}?
                            Esta acción reservará el stock de los productos incluidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAprobar}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? 'Aprobando...' : 'Aprobar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Diálogo para rechazar con motivo */}
            <Dialog open={showRechazarDialog} onOpenChange={setShowRechazarDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Proforma</DialogTitle>
                        <DialogDescription>
                            Por favor, indica el motivo del rechazo de la proforma {proforma.numero}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="motivo">Motivo del rechazo *</Label>
                            <Textarea
                                id="motivo"
                                placeholder="Escribe el motivo del rechazo (mínimo 10 caracteres)..."
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                disabled={isSubmitting}
                                rows={4}
                                className="resize-none"
                            />
                            {errors?.motivo && (
                                <p className="text-sm text-destructive">{errors.motivo}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {motivoRechazo.length}/500 caracteres
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRechazarDialog(false)
                                setMotivoRechazo('')
                            }}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRechazar}
                            disabled={isSubmitting || !motivoRechazo.trim()}
                        >
                            {isSubmitting ? 'Rechazando...' : 'Rechazar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}
