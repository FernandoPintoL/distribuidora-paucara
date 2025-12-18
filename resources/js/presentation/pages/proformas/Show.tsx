import { Head } from '@inertiajs/react'
import { useState, useEffect } from 'react'
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
import { Input } from '@/presentation/components/ui/input'
import { FileText, Package, Calendar, Clock, MapPin, AlertCircle, Check, X, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react'
import MapView from '@/presentation/components/maps/MapView'

// DOMAIN LAYER: Importar tipos desde domain
import type { Proforma } from '@/domain/entities/proformas'
import { getEstadoBadge } from '@/domain/entities/proformas'

// APPLICATION LAYER: Importar hook de lógica de negocio
import { useProformaActions, type CoordinacionData } from '@/application/hooks/use-proforma-actions'

interface Props {
    item: Proforma
}

export default function ProformasShow({ item: proforma }: Props) {
    // DOMAIN LAYER: Utilidades del dominio
    const estado = getEstadoBadge(proforma.estado)

    // APPLICATION LAYER: Lógica de negocio desde hook
    const {
        isSubmitting,
        isConverting,
        isGuardandoCoordinacion,
        puedeAprobar,
        puedeRechazar,
        puedeConvertir,
        aprobar,
        rechazar,
        convertirAVenta,
    } = useProformaActions(proforma)

    // PRESENTATION LAYER: Estados locales solo de UI
    const [showAprobarDialog, setShowAprobarDialog] = useState(false)
    const [showRechazarDialog, setShowRechazarDialog] = useState(false)
    const [showConvertirDialog, setShowConvertirDialog] = useState(false)
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [showCoordinacionForm, setShowCoordinacionForm] = useState(true)

    // Función helper para calcular fecha/hora por defecto (DEBE estar aquí para usarla en useState)
    const defaultDelivery = (() => {
        // Si ya hay fecha confirmada, usarla
        if (proforma.fecha_entrega_confirmada) {
            return {
                fecha: proforma.fecha_entrega_confirmada,
                hora: proforma.hora_entrega_confirmada || '09:00'
            }
        }

        // Si hay fecha solicitada, usar día siguiente
        if (proforma.fecha_entrega_solicitada) {
            const fechaSolicitada = new Date(proforma.fecha_entrega_solicitada)
            const fechaSiguiente = new Date(fechaSolicitada)
            fechaSiguiente.setDate(fechaSiguiente.getDate() + 1)

            // Convertir a formato YYYY-MM-DD
            const fechaFormato = fechaSiguiente.toISOString().split('T')[0]
            const horaDefault = proforma.hora_entrega_solicitada || '09:00'

            return {
                fecha: fechaFormato,
                hora: horaDefault
            }
        }

        // Si no hay nada, usar hoy + 1 día a las 09:00
        const hoy = new Date()
        const manana = new Date(hoy)
        manana.setDate(manana.getDate() + 1)
        const fechaFormato = manana.toISOString().split('T')[0]

        return {
            fecha: fechaFormato,
            hora: '09:00'
        }
    })()

    // Estado del formulario de coordinación
    const [coordinacion, setCoordinacion] = useState<CoordinacionData>({
        fecha_entrega_confirmada: defaultDelivery.fecha,
        hora_entrega_confirmada: defaultDelivery.hora,
        comentario_coordinacion: proforma.comentario_coordinacion || '',
        notas_llamada: '',
        // Control de intentos
        numero_intentos_contacto: proforma.numero_intentos_contacto || 0,
        resultado_ultimo_intento: proforma.resultado_ultimo_intento || '',
        // Datos de entrega realizada
        entregado_en: proforma.entregado_en || '',
        entregado_a: proforma.entregado_a || '',
        observaciones_entrega: proforma.observaciones_entrega || '',
    })

    // Sincronizar datos de coordinación cuando la proforma cambia
    useEffect(() => {
        console.log('📦 Datos de Proforma desde Backend:', proforma)

        // Calcular fecha/hora por defecto cuando cambia la proforma
        const defaultDeliveryEffect = (() => {
            if (proforma.fecha_entrega_confirmada) {
                return {
                    fecha: proforma.fecha_entrega_confirmada,
                    hora: proforma.hora_entrega_confirmada || '09:00'
                }
            }

            if (proforma.fecha_entrega_solicitada) {
                const fechaSolicitada = new Date(proforma.fecha_entrega_solicitada)
                const fechaSiguiente = new Date(fechaSolicitada)
                fechaSiguiente.setDate(fechaSiguiente.getDate() + 1)
                const fechaFormato = fechaSiguiente.toISOString().split('T')[0]
                const horaDefault = proforma.hora_entrega_solicitada || '09:00'

                return {
                    fecha: fechaFormato,
                    hora: horaDefault
                }
            }

            const hoy = new Date()
            const manana = new Date(hoy)
            manana.setDate(manana.getDate() + 1)
            const fechaFormato = manana.toISOString().split('T')[0]

            return {
                fecha: fechaFormato,
                hora: '09:00'
            }
        })()

        setCoordinacion({
            fecha_entrega_confirmada: defaultDeliveryEffect.fecha,
            hora_entrega_confirmada: defaultDeliveryEffect.hora,
            comentario_coordinacion: proforma.comentario_coordinacion || '',
            notas_llamada: '',
            numero_intentos_contacto: proforma.numero_intentos_contacto || 0,
            resultado_ultimo_intento: proforma.resultado_ultimo_intento || '',
            entregado_en: proforma.entregado_en || '',
            entregado_a: proforma.entregado_a || '',
            observaciones_entrega: proforma.observaciones_entrega || '',
        })
    }, [proforma.id])

    // PRESENTATION LAYER: Handlers simples que delegan al hook
    const handleAprobar = () => {
        aprobar(coordinacion)
        setShowAprobarDialog(false)
    }

    const handleRechazar = () => {
        rechazar(motivoRechazo, coordinacion)
        setShowRechazarDialog(false)
        setMotivoRechazo('')
    }

    const handleConvertir = () => {
        convertirAVenta()
        setShowConvertirDialog(false)
    }

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
                                className="bg-green-600 hover:bg-green-700 text-white"
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

                        {puedeConvertir && (
                            <Button
                                onClick={() => setShowConvertirDialog(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Convertir a Venta
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
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {proforma.detalles.map((detalle) => (
                                            <TableRow key={detalle.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {detalle.producto?.nombre || 'Producto sin datos'}
                                                        </div>
                                                        {detalle.producto && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {detalle.producto.categoria?.nombre || 'Sin categoría'} - {detalle.producto.marca?.nombre || 'Sin marca'}
                                                            </div>
                                                        )}
                                                        {detalle.producto?.codigo && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Código: {detalle.producto.codigo}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{detalle.cantidad}</TableCell>
                                                <TableCell>
                                                    Bs. {(detalle.precio_unitario ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    Bs. {(detalle.subtotal ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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

                                    {/* Entrega Realizada */}
                                    {proforma.entregado_en && (
                                        <div className="border-l-4 border-purple-500 pl-4 py-2">
                                            <h4 className="font-semibold text-sm mb-3">Entrega Realizada</h4>
                                            <div className="grid md:grid-cols-3 gap-4 text-sm space-y-3">
                                                <div>
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>Fecha y Hora</span>
                                                    </div>
                                                    <p className="font-medium">
                                                        {new Date(proforma.entregado_en).toLocaleDateString('es-ES')} a las {new Date(proforma.entregado_en).toLocaleTimeString('es-ES')}
                                                    </p>
                                                </div>

                                                {proforma.entregado_a && (
                                                    <div>
                                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                            <MapPin className="h-4 w-4" />
                                                            <span>Entregado a</span>
                                                        </div>
                                                        <p className="font-medium">
                                                            {proforma.entregado_a}
                                                        </p>
                                                    </div>
                                                )}

                                                {proforma.numero_intentos_contacto !== undefined && (
                                                    <div>
                                                        <div className="text-xs font-medium text-muted-foreground mb-1">Intentos de Contacto</div>
                                                        <p className="font-medium">
                                                            {proforma.numero_intentos_contacto}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {proforma.resultado_ultimo_intento && (
                                                <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950 rounded text-sm">
                                                    <p className="text-xs font-medium mb-1">Resultado Último Intento:</p>
                                                    <p className="font-medium">{proforma.resultado_ultimo_intento}</p>
                                                </div>
                                            )}

                                            {proforma.observaciones_entrega && (
                                                <div className="mt-3 p-3 bg-muted/50 rounded">
                                                    <p className="text-xs font-medium mb-1">Observaciones de Entrega:</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {proforma.observaciones_entrega}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Coordinación de Entrega - Mostrar cuando está PENDIENTE */}
                        {proforma.estado === 'PENDIENTE' && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowCoordinacionForm(!showCoordinacionForm)}>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Coordinación de Entrega
                                        </CardTitle>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowCoordinacionForm(!showCoordinacionForm)
                                            }}
                                        >
                                            {showCoordinacionForm ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                {showCoordinacionForm && (
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {/* Fecha de entrega confirmada */}
                                            <div className="space-y-2">
                                                <Label htmlFor="fecha_confirmada">
                                                    Fecha de Entrega Confirmada
                                                </Label>
                                                <Input
                                                    id="fecha_confirmada"
                                                    type="date"
                                                    value={coordinacion.fecha_entrega_confirmada}
                                                    onChange={(e) =>
                                                        setCoordinacion({
                                                            ...coordinacion,
                                                            fecha_entrega_confirmada: e.target.value,
                                                        })
                                                    }
                                                    disabled={isGuardandoCoordinacion}
                                                />
                                            </div>

                                            {/* Hora de entrega confirmada */}
                                            <div className="space-y-2">
                                                <Label htmlFor="hora_confirmada">
                                                    Hora de Entrega Confirmada
                                                </Label>
                                                <Input
                                                    id="hora_confirmada"
                                                    type="time"
                                                    value={coordinacion.hora_entrega_confirmada}
                                                    onChange={(e) =>
                                                        setCoordinacion({
                                                            ...coordinacion,
                                                            hora_entrega_confirmada: e.target.value,
                                                        })
                                                    }
                                                    disabled={isGuardandoCoordinacion}
                                                />
                                            </div>
                                        </div>

                                        {/* Comentario de coordinación */}
                                        <div className="space-y-2">
                                            <Label htmlFor="comentario">
                                                Comentario de Coordinación
                                            </Label>
                                            <Textarea
                                                id="comentario"
                                                placeholder="Notas sobre la coordinación con el cliente..."
                                                value={coordinacion.comentario_coordinacion}
                                                onChange={(e) =>
                                                    setCoordinacion({
                                                        ...coordinacion,
                                                        comentario_coordinacion: e.target.value,
                                                    })
                                                }
                                                disabled={isGuardandoCoordinacion}
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>

                                        {/* Notas de llamada */}
                                        <div className="space-y-2">
                                            <Label htmlFor="notas_llamada">
                                                Notas de Llamada
                                            </Label>
                                            <Textarea
                                                id="notas_llamada"
                                                placeholder="Registra las notas de las llamadas realizadas con el cliente..."
                                                value={coordinacion.notas_llamada}
                                                onChange={(e) =>
                                                    setCoordinacion({
                                                        ...coordinacion,
                                                        notas_llamada: e.target.value,
                                                    })
                                                }
                                                disabled={isGuardandoCoordinacion}
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>

                                        <Separator className="my-4" />

                                        {/* Control de Intentos de Contacto */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-sm">Control de Intentos de Contacto</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="numero_intentos">
                                                        Número de Intentos
                                                    </Label>
                                                    <Input
                                                        id="numero_intentos"
                                                        type="number"
                                                        min="0"
                                                        value={coordinacion.numero_intentos_contacto}
                                                        onChange={(e) =>
                                                            setCoordinacion({
                                                                ...coordinacion,
                                                                numero_intentos_contacto: parseInt(e.target.value) || 0,
                                                            })
                                                        }
                                                        disabled={isGuardandoCoordinacion}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="resultado_intento">
                                                        Resultado del Último Intento
                                                    </Label>
                                                    <select
                                                        id="resultado_intento"
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={coordinacion.resultado_ultimo_intento}
                                                        onChange={(e) =>
                                                            setCoordinacion({
                                                                ...coordinacion,
                                                                resultado_ultimo_intento: e.target.value,
                                                            })
                                                        }
                                                        disabled={isGuardandoCoordinacion}
                                                    >
                                                        <option value="">Seleccionar resultado...</option>
                                                        <option value="Aceptado">Aceptado</option>
                                                        <option value="No contactado">No contactado</option>
                                                        <option value="Rechazado">Rechazado</option>
                                                        <option value="Reagendar">Reagendar</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Datos de Entrega Realizada - Solo mostrar si ya se entregó */}
                                        {coordinacion.entregado_en && (
                                            <>
                                                <Separator className="my-4" />
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold text-sm">Datos de Entrega Realizada</h4>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="entregado_en">
                                                                Fecha y Hora de Entrega
                                                            </Label>
                                                            <Input
                                                                id="entregado_en"
                                                                type="datetime-local"
                                                                value={coordinacion.entregado_en}
                                                                onChange={(e) =>
                                                                    setCoordinacion({
                                                                        ...coordinacion,
                                                                        entregado_en: e.target.value,
                                                                    })
                                                                }
                                                                disabled={isGuardandoCoordinacion}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="entregado_a">
                                                                Entregado a (Nombre)
                                                            </Label>
                                                            <Input
                                                                id="entregado_a"
                                                                type="text"
                                                                placeholder="Nombre de quién recibió"
                                                                value={coordinacion.entregado_a}
                                                                onChange={(e) =>
                                                                    setCoordinacion({
                                                                        ...coordinacion,
                                                                        entregado_a: e.target.value,
                                                                    })
                                                                }
                                                                disabled={isGuardandoCoordinacion}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="observaciones_entrega">
                                                            Observaciones de la Entrega
                                                        </Label>
                                                        <Textarea
                                                            id="observaciones_entrega"
                                                            placeholder="Observaciones sobre cómo fue la entrega, incidencias, etc..."
                                                            value={coordinacion.observaciones_entrega}
                                                            onChange={(e) =>
                                                                setCoordinacion({
                                                                    ...coordinacion,
                                                                    observaciones_entrega: e.target.value,
                                                                })
                                                            }
                                                            disabled={isGuardandoCoordinacion}
                                                            rows={3}
                                                            className="resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                )}
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

            {/* Diálogo de confirmación para convertir a venta */}
            <AlertDialog open={showConvertirDialog} onOpenChange={setShowConvertirDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Convertir Proforma a Venta</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas convertir la proforma {proforma.numero} a una venta?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3 text-sm text-foreground px-6">
                        <p>Esta acción:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Crearán una nueva venta con los detalles de esta proforma</li>
                            <li>Consumirán el stock reservado de los productos</li>
                            <li>Generarán los números de serie correspondientes</li>
                            <li>Marcarán esta proforma como CONVERTIDA</li>
                        </ul>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isConverting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConvertir}
                            disabled={isConverting}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isConverting ? 'Convirtiendo...' : 'Convertir a Venta'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    )
}
