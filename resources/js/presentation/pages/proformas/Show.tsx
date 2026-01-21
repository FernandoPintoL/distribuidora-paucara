import { Head } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '@/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
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

import { Textarea } from '@/presentation/components/ui/textarea'
import { Label } from '@/presentation/components/ui/label'
import { Input } from '@/presentation/components/ui/input'
import { Package, MapPin, Check, X, ChevronUp, ChevronDown, ShoppingCart, MessageCircle, AlertCircle, ChevronRight } from 'lucide-react'
import MapViewWithFallback from '@/presentation/components/maps/MapViewWithFallback'
import { FormatoSelector } from '@/presentation/components/impresion'

// DOMAIN LAYER: Importar tipos desde domain
import type { Id } from '@/domain/entities/shared'
import type { Proforma } from '@/domain/entities/proformas'
import type { Producto } from '@/domain/entities/productos'

// APPLICATION LAYER: Importar hooks de lógica de negocio
import { useProformaActions, type CoordinacionData } from '@/application/hooks/use-proforma-actions'
import { useApprovalFlow } from '@/application/hooks/use-approval-flow'
import { useBuscarProductos } from '@/application/hooks/use-buscar-productos'
import { usePrecioRangoCarrito } from '@/application/hooks/use-precio-rango-carrito'

// PRESENTATION LAYER: Componentes reutilizables
import { ProformaEstadoBadge } from '@/presentation/components/proforma/ProformaEstadoBadge'
import { ProformaConvertirModal } from '@/presentation/pages/logistica/components/modals/ProformaConvertirModal'
import { ApprovalPaymentForm } from './components/ApprovalPaymentForm'
import { LoadingOverlay } from '@/presentation/components/ui/LoadingOverlay'
import { ProformaCard } from '@/presentation/components/ui/ProformaCard'
import { Search } from 'lucide-react'

interface Props {
    item: Proforma
}

// Interfaz para detalle que devuelve el diálogo de selección
interface ProformaDetalleDialogo {
    id: number
    producto: Producto
    producto_id: Id
    producto_nombre: string
    sku?: string
    cantidad: number
    precio_unitario: number
    subtotal: number
}

// Interfaz para detalle de proforma completo
interface ProformaDetalleInput extends ProformaDetalleDialogo {
    proforma_id: Id
    descuento: number
}

// Componente para seleccionar producto
interface ProductSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productos: Producto[]
    searchTerm: string
    onSearchChange: (term: string) => void
    onSelectProducto: (detalle: ProformaDetalleDialogo) => void
    isLoading?: boolean
    error?: string | null
}

function ProductSelectionDialog({
    open,
    onOpenChange,
    productos,
    searchTerm,
    onSearchChange,
    onSelectProducto,
    isLoading = false,
    error = null
}: ProductSelectionDialogProps) {
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
    const [cantidad, setCantidad] = useState(1)

    // Los productos ya están filtrados por el servidor (servidor-side search)
    const productosFiltrados = productos

    const handleAgregarProductoSeleccionado = () => {
        if (!selectedProducto) return

        // Obtener precio del producto (precio_base es el campo disponible en Producto)
        const precioUnitario = (selectedProducto.precio_base as number) || 0

        // Crear detalle con la cantidad especificada
        const nuevoDetalle = {
            id: Math.random(),
            producto: selectedProducto,
            producto_id: selectedProducto.id,
            producto_nombre: selectedProducto.nombre, // Campo directo para mostrar nombre
            sku: selectedProducto.sku, // Campo directo para mostrar código
            cantidad: Math.max(0.01, cantidad),
            precio_unitario: precioUnitario,
            subtotal: (Math.max(0.01, cantidad)) * precioUnitario
        }

        onSelectProducto(nuevoDetalle)

        // Limpiar el formulario
        setSelectedProducto(null)
        setCantidad(1)
        onSearchChange('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Agregar Producto</DialogTitle>
                    <DialogDescription className="text-xs">
                        Busca y selecciona un producto para agregarlo a la proforma
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 px-1">
                    {/* Búsqueda de productos */}
                    <div className="relative sticky top-0 bg-background pb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por nombre, SKU, código de barra, marca..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 h-9 text-sm"
                            disabled={isLoading}
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        )}
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Lista de productos */}
                    {isLoading ? (
                        <div className="border rounded-lg p-8 text-center bg-muted/30">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                                <p className="text-sm text-muted-foreground">Buscando productos...</p>
                            </div>
                        </div>
                    ) : productosFiltrados.length > 0 ? (
                        <div className="border rounded-lg divide-y bg-background">
                            {productosFiltrados.map((producto) => (
                                <div
                                    key={producto.id}
                                    className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors text-sm ${selectedProducto?.id === producto.id ? 'bg-accent' : ''
                                        }`}
                                    onClick={() => setSelectedProducto(producto)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-sm truncate flex-1">{producto.nombre}</p>
                                                {selectedProducto?.id === producto.id && (
                                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                )}
                                            </div>

                                            {/* Información técnica del producto */}
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                                {/* SKU */}
                                                {(producto.sku || producto.codigo) && (
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground">SKU: </span>
                                                        <span className="font-mono text-foreground">{producto.sku || producto.codigo}</span>
                                                    </div>
                                                )}

                                                {/* Códigos de barra */}
                                                {(producto.codigo_barras || (Array.isArray(producto.codigos_barra) && producto.codigos_barra?.length > 0)) && (
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground">Código: </span>
                                                        <span className="font-mono text-foreground">
                                                            {producto.codigo_barras || (Array.isArray(producto.codigos_barra) ? producto.codigos_barra[0]?.codigo : '')}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Marca */}
                                                {producto.marca?.nombre && (
                                                    <div>
                                                        <span className="text-muted-foreground">Marca: </span>
                                                        <span className="text-foreground">{producto.marca.nombre}</span>
                                                    </div>
                                                )}

                                                {/* Unidad */}
                                                {producto.unidad?.nombre && (
                                                    <div>
                                                        <span className="text-muted-foreground">Unidad: </span>
                                                        <span className="text-foreground">{producto.unidad.nombre}</span>
                                                    </div>
                                                )}

                                                {/* Stock */}
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground">Stock: </span>
                                                    <span className={(producto.cantidad_disponible as number) || (producto.stock_disponible as number) ? 'text-green-600 font-medium' : 'text-red-600'}>
                                                        {((producto.cantidad_disponible as number) || (producto.stock_disponible as number) || 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Precio */}
                                            <p className="text-sm font-semibold text-foreground mt-2">
                                                Bs. {((producto.precio_base as number) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchTerm ? (
                        <div className="border rounded-lg p-4 text-center bg-muted/30 text-sm">
                            <p className="text-muted-foreground">
                                No se encontraron productos para "{searchTerm}"
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Intenta con otro término: nombre, SKU, código de barra, marca, etc.
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-4 text-center bg-muted/30 text-sm">
                            <p className="text-muted-foreground">
                                Comienza a escribir para buscar productos
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Puedes buscar por: nombre, SKU, código de barra, marca, etc.
                            </p>
                        </div>
                    )}

                    {/* Cantidad - Solo mostrar si hay producto seleccionado */}
                    {selectedProducto && (
                        <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                            <Label htmlFor="cantidad-input" className="text-sm">Cantidad</Label>
                            <Input
                                id="cantidad-input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={cantidad || ''}
                                onChange={(e) => {
                                    const valor = parseFloat(e.target.value)
                                    if (!isNaN(valor) && valor > 0) {
                                        setCantidad(valor)
                                    }
                                }}
                                onBlur={(e) => {
                                    const valor = parseFloat(e.target.value)
                                    if (isNaN(valor) || valor <= 0) {
                                        setCantidad(1)
                                    }
                                }}
                                placeholder="1.00"
                                className="h-9 text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Subtotal: Bs. {(cantidad * ((selectedProducto.precio_base as number) || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="shrink-0 gap-2 pt-2 flex">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            onOpenChange(false)
                            setSelectedProducto(null)
                            setCantidad(1)
                            onSearchChange('')
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAgregarProductoSeleccionado}
                        disabled={!selectedProducto}
                    >
                        Agregar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ProformasShow({ item: proforma }: Props) {
    // APPLICATION LAYER: Lógica de negocio desde hook
    console.log('📦 Proforma recibida en Show.tsx:', proforma);
    const {
        isSubmitting,
        isConverting,
        isGuardandoCoordinacion,
        isRenovandoReservas,
        puedeAprobar,
        puedeRechazar,
        puedeConvertir,
        aprobar,
        rechazar,
        convertirAVenta,
        renovarReservas,
    } = useProformaActions(proforma, {
        onSuccess: () => {
            // Cerrar diálogos cuando la operación sea exitosa
            // La página se recargaráy mostrará los cambios
            setShowAprobarDialog(false);
            setShowRechazarDialog(false);
            setShowConvertirDialog(false);
            setConvertErrorState(null);
        },
        onError: (error: Error & { code?: string; reservasExpiradas?: unknown }) => {
            console.error('Error en acción de proforma:', error);
            // console.log('📋 Error code:', (error as any).code);
            console.log('📋 Error message:', error.message);
            // console.log('📋 Error reservasExpiradas:', (error as any).reservasExpiradas);

            // Detectar si es error de reservas expiradas
            if (error.code === 'RESERVAS_EXPIRADAS') {
                console.log('⚠️ Detectado error de reservas expiradas - ESTABLECIENDO ESTADO');
                const newErrorState = {
                    code: 'RESERVAS_EXPIRADAS',
                    message: error.message,
                    reservasExpiradas: typeof error.reservasExpiradas === 'number' ? error.reservasExpiradas : undefined,
                };
                console.log('📋 Nuevo error state:', newErrorState);
                setConvertErrorState(newErrorState);
                console.log('✅ Error state establecido, showConvertirDialog debería estar true');
                // Mantener el diálogo abierto para que muestre las opciones
            } else {
                // Cerrar diálogos para otros errores
                setShowAprobarDialog(false);
                setShowRechazarDialog(false);
                setShowConvertirDialog(false);
                setConvertErrorState(null);
            }
        }
    })

    // APPROVAL FLOW CONTEXT: Estado del flujo de aprobación (puede ser null si el provider no existe)
    const approvalFlow = useApprovalFlow();

    // PRESENTATION LAYER: Estados locales solo de UI
    const [showAprobarDialog, setShowAprobarDialog] = useState(false)
    const [showRechazarDialog, setShowRechazarDialog] = useState(false)
    const [showConvertirDialog, setShowConvertirDialog] = useState(false)
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [showCoordinacionForm, setShowCoordinacionForm] = useState(true)
    const [showMapaEntrega, setShowMapaEntrega] = useState(false)
    // ✅ Estado para mostrar/ocultar card de dirección (inicia OCULTO)
    const [showDireccionCard, setShowDireccionCard] = useState(false)
    const [convertErrorState, setConvertErrorState] = useState<{ code?: string; message?: string; reservasExpiradas?: number } | null>(null)

    // ✅ NUEVO: Estados para navegación a siguiente proforma
    const [loadingSiguiente, setLoadingSiguiente] = useState(false)
    const [siguienteProforma, setSiguienteProforma] = useState<{ id: number; numero: string; cliente_nombre: string; total: number; fecha_creacion: string } | null>(null)

    // ✅ NUEVO: Flag para evitar que el componente se remonte durante flujo de aprobación + conversión
    const [isFlowAprobacionConversion, setIsFlowAprobacionConversion] = useState(false)

    // Estados para edición de detalles
    const [editableDetalles, setEditableDetalles] = useState(proforma.detalles.map(d => ({ ...d })))
    const [showAgregarProductoDialog, setShowAgregarProductoDialog] = useState(false)

    // Hook para búsqueda de productos con debounce
    const {
        searchTerm: searchProducto,
        setSearchTerm: setSearchProducto,
        productos: productosDisponibles,
        isLoading: isLoadingProductos,
        error: errorProductos
    } = useBuscarProductos({ debounceMs: 400 })

    // Hook para cálculo de precios por rango de cantidad
    const {
        calcularCarritoDebounced,
        getPrecioActualizado,
        loading: isCalculandoRangos,
        error: errorRangos
    } = usePrecioRangoCarrito(400)

    // Función helper para calcular fecha/hora por defecto (DEBE estar aquí para usarla en useState)
    // 🔧 Helper para extraer solo la hora (HH:ii) - mantener por compatibilidad con datos legados
    const extractTime = (timeValue: string | undefined, defaultTime: string = '09:00'): string => {
        if (!timeValue) return defaultTime
        // Si contiene espacio, es un datetime completo - extraer la parte de hora (compatibilidad)
        if (timeValue.includes(' ')) {
            return timeValue.split(' ')[1].substring(0, 5)
        }
        // Si ya es solo hora, retornar como está
        return timeValue
    }

    const defaultDelivery = (() => {
        // Si ya hay fecha confirmada, usarla
        if (proforma.fecha_entrega_confirmada) {
            return {
                fecha: proforma.fecha_entrega_confirmada,
                hora: extractTime(proforma.hora_entrega_confirmada, '09:00'),
                hora_fin: extractTime(proforma.hora_entrega_confirmada_fin, '17:00')
            }
        }

        // Si hay fecha solicitada, usar día siguiente
        if (proforma.fecha_entrega_solicitada) {
            const fechaSolicitada = new Date(proforma.fecha_entrega_solicitada)
            const fechaSiguiente = new Date(fechaSolicitada)
            fechaSiguiente.setDate(fechaSiguiente.getDate() + 1)

            // Convertir a formato YYYY-MM-DD
            const fechaFormato = fechaSiguiente.toISOString().split('T')[0]
            const horaDefault = extractTime(proforma.hora_entrega_solicitada, '09:00')
            const horaFinDefault = extractTime(proforma.hora_entrega_solicitada_fin, '17:00')

            return {
                fecha: fechaFormato,
                hora: horaDefault,
                hora_fin: horaFinDefault
            }
        }

        // Si no hay nada, usar hoy + 1 día a las 09:00 - 17:00
        const hoy = new Date()
        const manana = new Date(hoy)
        manana.setDate(manana.getDate() + 1)
        const fechaFormato = manana.toISOString().split('T')[0]

        return {
            fecha: fechaFormato,
            hora: '09:00',
            hora_fin: '17:00'
        }
    })()

    // Estado del formulario de coordinación
    const [coordinacion, setCoordinacion] = useState<CoordinacionData>({
        fecha_entrega_confirmada: defaultDelivery.fecha,
        hora_entrega_confirmada: defaultDelivery.hora,
        hora_entrega_confirmada_fin: defaultDelivery.hora_fin,
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

    // Limpiar búsqueda cuando se cierra el diálogo
    useEffect(() => {
        if (!showAgregarProductoDialog) {
            // Limpiar el término de búsqueda cuando se cierra el modal
            setSearchProducto('')
        }
    }, [showAgregarProductoDialog, setSearchProducto])

    // 🔄 CRÍTICO: Cuando el cálculo de rangos completa, actualizar detalles con nuevos precios
    // El backend retorna los detalles con precio_unitario y subtotal ya calculados
    useEffect(() => {
        if (!isCalculandoRangos && errorRangos === null) {
            // La carga completó sin errores, ahora actualizar editableDetalles
            // con los precios calculados del backend

            setEditableDetalles(prevDetalles => {
                const detallesActualizados = prevDetalles.map(detalle => {
                    // Obtener el detalle calculado del hook
                    const precioActualizado = getPrecioActualizado(detalle.producto_id as number)

                    if (precioActualizado) {
                        // Si hay precio actualizado, recalcular subtotal
                        return {
                            ...detalle,
                            precio_unitario: precioActualizado,
                            subtotal: detalle.cantidad * precioActualizado
                        }
                    }

                    return detalle
                })

                console.log('📊 Tabla actualizada con nuevos precios:', detallesActualizados)
                return detallesActualizados
            })
        }
    }, [isCalculandoRangos, errorRangos, getPrecioActualizado])

    // Sincronizar datos de coordinación cuando la proforma cambia
    // ✅ CRÍTICO: No actualizar si estamos en el flujo de aprobación + conversión
    useEffect(() => {
        // Saltar si estamos en el flujo de aprobación + conversión
        if (isFlowAprobacionConversion) {
            console.log('⏭️ Saltando sincronización de coordinación - flujo en progreso');
            return;
        }

        console.log('📦 Datos de Proforma desde Backend:', proforma)

        // Calcular fecha/hora por defecto cuando cambia la proforma
        const defaultDeliveryEffect = (() => {
            if (proforma.fecha_entrega_confirmada) {
                return {
                    fecha: proforma.fecha_entrega_confirmada,
                    hora: extractTime(proforma.hora_entrega_confirmada, '09:00'),
                    hora_fin: extractTime(proforma.hora_entrega_confirmada_fin, '17:00')
                }
            }

            if (proforma.fecha_entrega_solicitada) {
                const fechaSolicitada = new Date(proforma.fecha_entrega_solicitada)
                const fechaSiguiente = new Date(fechaSolicitada)
                fechaSiguiente.setDate(fechaSiguiente.getDate() + 1)
                const fechaFormato = fechaSiguiente.toISOString().split('T')[0]
                const horaDefault = extractTime(proforma.hora_entrega_solicitada, '09:00')
                const horaFinDefault = extractTime(proforma.hora_entrega_solicitada_fin, '17:00')

                return {
                    fecha: fechaFormato,
                    hora: horaDefault,
                    hora_fin: horaFinDefault
                }
            }

            const hoy = new Date()
            const manana = new Date(hoy)
            manana.setDate(manana.getDate() + 1)
            const fechaFormato = manana.toISOString().split('T')[0]

            return {
                fecha: fechaFormato,
                hora: '09:00',
                hora_fin: '17:00'
            }
        })()

        setCoordinacion({
            fecha_entrega_confirmada: defaultDeliveryEffect.fecha,
            hora_entrega_confirmada: defaultDeliveryEffect.hora,
            hora_entrega_confirmada_fin: defaultDeliveryEffect.hora_fin,
            comentario_coordinacion: proforma.comentario_coordinacion || '',
            notas_llamada: '',
            numero_intentos_contacto: proforma.numero_intentos_contacto || 0,
            resultado_ultimo_intento: proforma.resultado_ultimo_intento || '',
            entregado_en: proforma.entregado_en || '',
            entregado_a: proforma.entregado_a || '',
            observaciones_entrega: proforma.observaciones_entrega || '',
        })
    }, [proforma.id, isFlowAprobacionConversion])

    // Handlers para edición de detalles
    const handleEditarCantidad = (index: number, cantidad: number) => {
        const nuevosDetalles = [...editableDetalles]
        // Validar que sea un número válido y positivo
        const cantidadValida = Math.max(0.01, isNaN(cantidad) ? 0.01 : cantidad)
        nuevosDetalles[index].cantidad = cantidadValida
        nuevosDetalles[index].subtotal = cantidadValida * nuevosDetalles[index].precio_unitario
        setEditableDetalles(nuevosDetalles)

        // Recalcular rangos de precio
        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    // Calcular total en tiempo real (usando precios actualizados por rango)
    const calcularTotales = () => {
        const subtotal = editableDetalles.reduce((sum, d) => {
            // Obtener precio actualizado del hook, o usar el actual
            const precioActualizado = getPrecioActualizado(d.producto_id as number)
            const precio = precioActualizado ?? (d.precio_unitario ?? 0)
            return sum + (d.cantidad * precio)
        }, 0)
        const total = subtotal
        return { subtotal, total }
    }

    const totales = calcularTotales()

    const handleEliminarProducto = (index: number) => {
        const nuevosDetalles = editableDetalles.filter((_, i) => i !== index)
        setEditableDetalles(nuevosDetalles)
    }

    const handleAgregarProducto = (detalle: ProformaDetalleDialogo | Producto) => {
        // Si viene del diálogo, ya es un ProformaDetalleDialogo
        // Si viene de otra fuente, es un Producto simple
        const nuevoDetalle: ProformaDetalleInput = 'cantidad' in detalle && 'precio_unitario' in detalle
            ? {       // Ya es un detalle del diálogo, agregar campos faltantes
                ...(detalle as ProformaDetalleDialogo),
                proforma_id: proforma.id,
                descuento: 0
            }
            : {       // Es un producto simple, necesita ser transformado
                id: Math.random(),
                proforma_id: proforma.id,
                producto: detalle as Producto,
                producto_id: (detalle as Producto).id,
                producto_nombre: (detalle as Producto).nombre,
                sku: (detalle as Producto).sku || undefined,
                cantidad: 1,
                precio_unitario: (detalle as Producto).precio_base || 0,
                descuento: 0,
                subtotal: (detalle as Producto).precio_base || 0
            }

        const nuevosDetalles = [...editableDetalles, nuevoDetalle]
        setEditableDetalles(nuevosDetalles)
        setShowAgregarProductoDialog(false)

        // Calcular rangos para el nuevo detalle
        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    // PRESENTATION LAYER: Handlers simples que delegan al hook
    const handleAprobar = () => {
        // ✅ SIEMPRE usar flujo combinado: Aprobar + Convertir (incluso sin pago especificado)
        handleAprobarYConvertirConPago();
    }

    // Flujo combinado: Aprobar + Convertir con Pago
    const handleAprobarYConvertirConPago = async () => {
        console.log('%c📋 Iniciando flujo combinado: Aprobar + Convertir', 'color: blue; font-weight: bold;');

        // ✅ CRÍTICO: Establecer flag para evitar que el componente se remonte
        setIsFlowAprobacionConversion(true);

        // Inicializar flujo
        if (approvalFlow) {
            approvalFlow.initFlow(proforma);
            approvalFlow.updateCoordinacion(coordinacion);
            approvalFlow.updatePayment(coordinacion.payment!);
            approvalFlow.setLoading(true, 'approving');
        }

        try {
            // PASO 0: Detectar cambios en detalles y actualizar si es necesario
            const hayChangios = editableDetalles.length !== proforma.detalles.length ||
                editableDetalles.some((d, i) => {
                    const original = proforma.detalles[i];
                    return !original ||
                        d.cantidad !== (typeof original.cantidad === 'string' ? parseFloat(original.cantidad) : original.cantidad) ||
                        d.precio_unitario !== original.precio_unitario;
                });

            if (hayChangios) {
                console.log('%c⏳ PASO 0: Actualizando detalles de proforma...', 'color: blue;');

                const detallesParaGuardar = editableDetalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.subtotal,
                }));

                const actualizarResponse = await fetch(`/api/proformas/${proforma.id}/actualizar-detalles`, {
                    method: 'POST',
                    redirect: 'manual', // ✅ NO seguir redirects automáticamente
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'X-Requested-With': 'XMLHttpRequest', // ✅ Indica que es AJAX
                    },
                    body: JSON.stringify({ detalles: detallesParaGuardar }),
                });

                if (!actualizarResponse.ok) {
                    const errorData = await actualizarResponse.json();
                    const errorMsg = `Error al actualizar detalles: ${errorData.message || 'Error desconocido'}`;
                    toast.error(errorMsg);
                    throw new Error(errorMsg);
                }

                const actualizarData = await actualizarResponse.json();
                console.log('%c✅ PASO 0 completado: Detalles actualizados', 'color: green;', actualizarData);
                toast.success('✅ Detalles actualizados correctamente');

                // Actualizar estado del flujo
                if (approvalFlow) {
                    approvalFlow.setLoading(true, 'approving');
                }
            }

            // PASO 1: Aprobar proforma con coordinación
            console.log('%c⏳ PASO 1: Aprobando proforma...');

            const aprobarResponse = await fetch(`/api/proformas/${proforma.id}/aprobar`, {
                method: 'POST',
                redirect: 'manual', // ✅ NO seguir redirects automáticamente
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest', // ✅ Indica que es AJAX
                },
                body: JSON.stringify({
                    fecha_entrega_confirmada: coordinacion.fecha_entrega_confirmada,
                    // Ahora el backend devuelve tiempos en formato 'H:i', pero mantenemos la extracción por compatibilidad
                    hora_entrega_confirmada: extractTime(coordinacion.hora_entrega_confirmada),
                    hora_entrega_confirmada_fin: extractTime(coordinacion.hora_entrega_confirmada_fin),
                    comentario_coordinacion: coordinacion.comentario_coordinacion,
                    numero_intentos_contacto: coordinacion.numero_intentos_contacto,
                    fecha_ultimo_intento: coordinacion.fecha_ultimo_intento || null,
                    resultado_ultimo_intento: coordinacion.resultado_ultimo_intento,
                    notas_llamada: coordinacion.notas_llamada || null,
                }),
            });

            console.log('%c📥 Respuesta de aprobación recibida', 'color: gray;', {
                status: aprobarResponse.status,
                ok: aprobarResponse.ok,
                redirected: aprobarResponse.redirected,
                type: aprobarResponse.type,
                url: aprobarResponse.url,
            });

            // ✅ Detectar redirects (cuando redirect: 'manual')
            if (aprobarResponse.redirected || (aprobarResponse.status >= 300 && aprobarResponse.status < 400)) {
                console.error('❌ Servidor está redirigiendo en lugar de retornar JSON:', {
                    redirectedTo: aprobarResponse.url,
                    status: aprobarResponse.status,
                });
                throw new Error(`El servidor está redirigiendo a ${aprobarResponse.url} en lugar de retornar JSON. Esto indica un problema de middleware.`);
            }

            if (!aprobarResponse.ok) {
                const errorData = await aprobarResponse.json();
                console.error('❌ Error en aprobación:', {
                    status: aprobarResponse.status,
                    error: errorData
                });
                const errorMessage = errorData.message || `Error ${aprobarResponse.status}: Error al aprobar proforma`;
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }

            const aprobarData = await aprobarResponse.json();
            console.log('%c✅ PASO 1 completado: Proforma aprobada', 'color: green;', aprobarData);
            toast.success('✅ Proforma aprobada exitosamente');

            // Actualizar estado del flujo
            if (approvalFlow) {
                approvalFlow.setProformaAprobada(aprobarData.data?.proforma || proforma);
                approvalFlow.setLoading(true, 'converting');
            }

            // PASO 2: Convertir a venta con datos de pago
            console.log('%c⏳ PASO 2: Convirtiendo a venta...', 'color: blue;');

            // ✅ Preparar datos de pago (pueden no existir si no se especificaron)
            const paymentData = coordinacion.payment ? {
                con_pago: coordinacion.payment.con_pago,
                tipo_pago_id: coordinacion.payment.tipo_pago_id,
                politica_pago: coordinacion.payment.politica_pago,
                monto_pagado: coordinacion.payment.monto_pagado,
                fecha_pago: coordinacion.payment.fecha_pago,
                numero_recibo: coordinacion.payment.numero_recibo,
                numero_transferencia: coordinacion.payment.numero_transferencia,
            } : {
                con_pago: false,
                politica_pago: 'CONTRA_ENTREGA', // Política por defecto
            };

            console.log('%c💳 Datos de pago para conversión:', 'color: orange;', paymentData);

            const convertirResponse = await fetch(`/api/proformas/${proforma.id}/convertir-venta`, {
                method: 'POST',
                redirect: 'manual', // ✅ NO seguir redirects automáticamente
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest', // ✅ Indica que es AJAX
                },
                body: JSON.stringify(paymentData),
            });

            // ✅ Detectar redirects
            if (convertirResponse.redirected || (convertirResponse.status >= 300 && convertirResponse.status < 400)) {
                console.error('❌ Servidor está redirigiendo en conversión:', {
                    redirectedTo: convertirResponse.url,
                    status: convertirResponse.status,
                });
                throw new Error(`El servidor está redirigiendo en conversión. Middleware issue.`);
            }

            if (!convertirResponse.ok) {
                const errorData = await convertirResponse.json();
                const errorMessage = errorData.message || 'Error al convertir a venta';
                console.error('❌ Error en conversión:', { status: convertirResponse.status, error: errorData });
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }

            const convertirData = await convertirResponse.json();
            console.log('%c✅ PASO 2 completado: Proforma convertida a venta', 'color: green;', convertirData);
            toast.success('✅ Proforma convertida a venta exitosamente');

            // ✅ PASO 3: Actualizar stocks (nuevo endpoint simplificado)
            console.log('%c⏳ PASO 3: Actualizando stocks...', 'color: blue;');

            const procesarResponse = await fetch(`/proformas/${proforma.id}/procesar-venta`, {
                method: 'POST',
                redirect: 'manual', // ✅ NO seguir redirects automáticamente
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest', // ✅ Indica que es AJAX
                },
            });

            // ✅ Detectar redirects
            if (procesarResponse.redirected || (procesarResponse.status >= 300 && procesarResponse.status < 400)) {
                console.warn('⚠️ Servidor está redirigiendo en procesar-venta:', {
                    redirectedTo: procesarResponse.url,
                    status: procesarResponse.status,
                });
                toast('⚠️ Proforma convertida, pero hubo un aviso al actualizar stocks');
            } else if (!procesarResponse.ok) {
                const errorData = await procesarResponse.json();
                console.warn('⚠️ PASO 3 completado con aviso:', errorData);
                toast('⚠️ Proforma convertida, pero hubo un aviso al actualizar stocks');
            } else {
                const procesarData = await procesarResponse.json();
                console.log('%c✅ PASO 3 completado: Stocks actualizados', 'color: green;', procesarData);
                toast.success('✅ Stocks actualizados correctamente');
            }

            // Actualizar estado del flujo con éxito
            if (approvalFlow) {
                approvalFlow.setVentaCreada(convertirData.data?.venta || {});
                approvalFlow.markAsSuccess();
                approvalFlow.setLoading(false, 'success');
            }

            // Cerrar diálogo y recargar página
            setShowAprobarDialog(false);

            // Mostrar notificación de éxito
            const successMessage = `Proforma aprobada, convertida a venta y stocks actualizados exitosamente`;
            console.log('%c🎉 ' + successMessage, 'color: green; font-weight: bold;');

            // ✅ CRÍTICO: Resetear flag ANTES de recargar la página
            setIsFlowAprobacionConversion(false);

            // Esperar un momento para que el usuario vea el loading, luego recargar
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('%c❌ Error en flujo combinado:', 'color: red;', error);

            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

            // Mostrar notificación de error en toast
            toast.error(`Error: ${errorMessage}`);

            // Actualizar estado de error
            if (approvalFlow) {
                approvalFlow.setError(errorMessage);
                approvalFlow.setLoading(false, 'error');
            }

            // ✅ CRÍTICO: Resetear flag para permitir que el componente se actualice nuevamente
            setIsFlowAprobacionConversion(false);
        }
    }

    const handleRechazar = () => {
        rechazar(motivoRechazo, coordinacion)
        setShowRechazarDialog(false)
        setMotivoRechazo('')
    }

    const handleConvertir = () => {
        // Resetear estado de error previo
        setConvertErrorState(null);

        // Llamar a convertirAVenta
        // NO cerrar el modal aún - dejaremos que el callback onError lo maneje
        convertirAVenta();

        // El modal se cerrará desde el callback onSuccess o onError
        // si NO es RESERVAS_EXPIRADAS
    }

    // ✅ NUEVO: Manejar navegación a siguiente proforma pendiente
    const handleSiguiente = async () => {
        setLoadingSiguiente(true);
        try {
            const response = await fetch(`/api/proformas/siguiente-pendiente?current_id=${proforma.id}&incluir_stats=true`);
            const data = await response.json();

            if (!data.success) {
                toast.error('Error al obtener siguiente proforma');
                setLoadingSiguiente(false);
                return;
            }

            if (!data.existe_siguiente) {
                toast.success('¡No hay más proformas pendientes!');
                setLoadingSiguiente(false);
                return;
            }

            // Guardar información de siguiente proforma
            setSiguienteProforma(data.proforma);

            // Mostrar toast informativo
            if (data.stats) {
                toast.success(`Siguiente: ${data.proforma.numero} (${data.stats.indice})`);
            }

            // Navegar a la siguiente proforma
            setTimeout(() => {
                window.location.href = `/proformas/${data.proforma.id}`;
            }, 300);

        } catch (error) {
            console.error('Error al obtener siguiente proforma:', error);
            toast.error('Error al obtener siguiente proforma');
        } finally {
            setLoadingSiguiente(false);
        }
    }

    return (
        <AppLayout>
            <Head title={`Proforma ${proforma.id}`} />

            <div className="space-y-6 p-4">
                {/* Banner de advertencia si hay error de reservas */}
                {convertErrorState?.code === 'RESERVAS_EXPIRADAS' && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                                    ⚠️ Reservas Expiradas
                                </h3>
                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                    {convertErrorState.reservasExpiradas} reserva(s) de esta proforma han expirado.
                                    Para convertir a venta, necesitas renovar las reservas primero.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-[var(--space-lg)] md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-[var(--space-md)]">
                        <div>
                            <h1 className="text-[var(--text-3xl)] font-bold tracking-tight">
                                Proforma {proforma.numero}
                            </h1>
                            <div className="space-y-2 mt-3">
                                <p className="text-[var(--text-sm)] text-muted-foreground">
                                    Creada el {new Date(proforma.created_at).toLocaleDateString('es-ES')}
                                </p>

                                {/* Información adicional - Horizontal en una sola línea */}
                                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                    {/* Origen */}
                                    {proforma.canal_origen && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Origen</span>
                                            <span className="font-medium text-foreground capitalize">{(proforma.canal_origen as string).replace(/_/g, ' ')}</span>
                                        </div>
                                    )}

                                    {/* Tipo de Entrega */}
                                    {proforma.tipo_entrega && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Tipo de Entrega</span>
                                            <span className="font-medium text-foreground capitalize">{proforma.tipo_entrega}</span>
                                        </div>
                                    )}

                                    {/* Política de Pago */}
                                    {proforma.politica_pago && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Política de Pago</span>
                                            <span className="font-medium text-foreground capitalize">{(proforma.politica_pago as string).replace(/_/g, ' ')}</span>
                                        </div>
                                    )}

                                    {/* Fecha de Vencimiento */}
                                    {proforma.fecha_vencimiento && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Vencimiento</span>
                                            <span className="font-medium text-foreground">{new Date(proforma.fecha_vencimiento).toLocaleDateString('es-ES')}</span>
                                        </div>
                                    )}

                                    {/* Moneda */}
                                    {proforma.moneda && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Moneda</span>
                                            <span className="font-medium text-foreground">{proforma.moneda.codigo}</span>
                                        </div>
                                    )}

                                    {/* Items */}
                                    {(proforma.items_count ?? 0) > 0 && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Items</span>
                                            <span className="font-medium text-foreground">{proforma.items_count} producto{(proforma.items_count ?? 0) !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Información del Cliente - Horizontal */}
                                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/30 text-sm">
                                    {/* Nombre del Cliente */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground font-medium">Cliente</span>
                                        <span className="font-medium text-foreground">{proforma.cliente.nombre}</span>
                                    </div>

                                    {/* Email */}
                                    {proforma.cliente.email && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Email</span>
                                            <span className="font-medium text-foreground truncate">{proforma.cliente.email}</span>
                                        </div>
                                    )}

                                    {/* Teléfono */}
                                    {proforma.cliente.telefono && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Teléfono</span>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-foreground">{proforma.cliente.telefono}</span>
                                                <a
                                                    href={`https://wa.me/${proforma.cliente.telefono.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Abrir en WhatsApp"
                                                    className="inline-flex items-center justify-center h-5 w-5 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                >
                                                    <MessageCircle className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* ✅ Dirección de Entrega (Solicitada o Confirmada) */}
                                    {(proforma.direccion_solicitada || proforma.direccion_confirmada) && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {proforma.direccion_confirmada ? 'Dirección Confirmada' : 'Dirección Solicitada'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground truncate max-w-xs">
                                                    {(proforma.direccion_confirmada || proforma.direccion_solicitada)?.direccion}
                                                </span>
                                                {/* ✅ Botón toggle para mostrar/ocultar card de dirección de entrega */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setShowDireccionCard(!showDireccionCard)}
                                                    title={showDireccionCard ? 'Ocultar detalles de entrega' : 'Mostrar detalles de entrega'}
                                                    className="h-5 w-5 p-0 flex-shrink-0"
                                                >
                                                    <MapPin className="h-4 w-4 text-[var(--brand-primary)]" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mostrar límite de crédito si la política es CREDITO */}
                                {proforma.politica_pago === 'CREDITO' && proforma.cliente?.puede_tener_credito && (
                                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                                        <p className="text-muted-foreground">
                                            Límite de Crédito: <span className="font-medium text-foreground">
                                                {proforma.moneda?.simbolo || 'Bs.'} {proforma.cliente.limite_credito?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-[var(--space-sm)] flex-wrap items-center">
                        <ProformaEstadoBadge estado={proforma.estado} className="text-sm px-3 py-1" />

                        {puedeAprobar && (
                            <Button
                                variant="default"
                                onClick={() => setShowAprobarDialog(true)}
                                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
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
                                className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)] text-white"
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Convertir a Venta
                            </Button>
                        )}

                        {/* ✅ NUEVO: Botón para ir a la siguiente proforma pendiente */}
                        {/* {proforma.estado === 'PENDIENTE' && (
                            <Button
                                onClick={handleSiguiente}
                                disabled={loadingSiguiente}
                                variant="outline"
                                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                title="Ir a la siguiente proforma pendiente sin volver al dashboard"
                            >
                                {loadingSiguiente ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                                        Cargando...
                                    </>
                                ) : (
                                    <>
                                        <ChevronRight className="mr-2 h-4 w-4" />
                                        Siguiente
                                    </>
                                )}
                            </Button>
                        )} */}

                        <FormatoSelector
                            documentoId={proforma.id}
                            tipoDocumento="proforma"
                        />
                    </div>
                </div>

                <div className="grid gap-[var(--space-lg)]">
                    {/* Información principal */}
                    <div className="lg:col-span-2 space-y-[var(--space-lg)]">
                        {/* Advertencia sobre cambios locales */}
                        {editableDetalles.length !== proforma.detalles.length && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2 text-sm">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-amber-900 dark:text-amber-100">
                                    <p className="font-medium">Cambios no guardados</p>
                                    <p className="text-xs mt-1">Los productos agregados/modificados solo existen localmente. Para guardarlos, debes aprobar la proforma.</p>
                                </div>
                            </div>
                        )}

                        {/* Detalles de la proforma */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Detalles de la Proforma
                                </CardTitle>
                                {proforma.estado === 'PENDIENTE' && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => setShowAgregarProductoDialog(true)}
                                        className="text-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-1" />
                                        + Agregar Producto
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-semibold">Producto</TableHead>
                                            <TableHead className="font-semibold text-center">Cantidad</TableHead>
                                            {/* <TableHead className="font-semibold text-center">Rango</TableHead> */}
                                            <TableHead className="font-semibold text-right">Precio Unit.</TableHead>
                                            <TableHead className="text-right font-semibold">Subtotal</TableHead>
                                            {proforma.estado === 'PENDIENTE' && <TableHead className="text-center font-semibold">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableDetalles.map((detalle, index) => (
                                            <TableRow
                                                key={detalle.id}
                                                className={`transition-colors hover:bg-muted/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                    }`}
                                            >
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-[var(--text-base)]">
                                                            {detalle.producto?.nombre || detalle.producto_nombre || 'Producto sin datos'}
                                                        </div>
                                                        {detalle.producto && (
                                                            <div className="text-[var(--text-sm)] text-muted-foreground">
                                                                {detalle.producto.categoria?.nombre || 'Sin categoría'} - {detalle.producto.marca?.nombre || 'Sin marca'}
                                                            </div>
                                                        )}
                                                        {(detalle.producto?.codigo || detalle.sku) && (
                                                            <div className="text-[var(--text-xs)] text-muted-foreground font-mono">
                                                                Código: {detalle.producto?.codigo || detalle.sku}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {proforma.estado === 'PENDIENTE' ? (
                                                        <Input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={detalle.cantidad ? parseFloat(detalle.cantidad.toString()).toFixed(2) : ''}
                                                            onChange={(e) => {
                                                                const valor = e.target.value
                                                                if (valor === '' || valor === '0') {
                                                                    handleEditarCantidad(index, 1)
                                                                } else {
                                                                    const cantidad = parseFloat(valor) || 1
                                                                    handleEditarCantidad(index, parseFloat(cantidad.toFixed(2)))
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const valor = parseFloat(e.target.value) || 0
                                                                if (valor <= 0) {
                                                                    handleEditarCantidad(index, 1)
                                                                } else {
                                                                    handleEditarCantidad(index, parseFloat(valor.toFixed(2)))
                                                                }
                                                            }}
                                                            placeholder="1"
                                                            className="w-24 text-center"
                                                        />
                                                    ) : (
                                                        <span className="font-medium">{parseFloat(detalle.cantidad.toString()).toFixed(2)}</span>
                                                    )}
                                                </TableCell>
                                                {/* Precio actualizado según rango */}
                                                <TableCell className="text-right font-medium">
                                                    {(() => {
                                                        const precioActualizado = getPrecioActualizado(detalle.producto_id as number)
                                                        const precio = precioActualizado ?? (detalle.precio_unitario ?? 0)

                                                        return (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span>
                                                                    Bs. {precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                {precioActualizado && precioActualizado !== detalle.precio_unitario && (
                                                                    <span className="text-xs text-green-600 dark:text-green-400 line-through opacity-60">
                                                                        {detalle.precio_unitario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })()}
                                                </TableCell>
                                                {/* Subtotal actualizado */}
                                                <TableCell className="text-right font-semibold">
                                                    {(() => {
                                                        const precioActualizado = getPrecioActualizado(detalle.producto_id as number)
                                                        const precio = precioActualizado ?? (detalle.precio_unitario ?? 0)
                                                        const subtotalActualizado = detalle.cantidad * precio

                                                        return (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span>
                                                                    Bs. {subtotalActualizado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                {precioActualizado && subtotalActualizado !== detalle.subtotal && (
                                                                    <span className="text-xs text-green-600 dark:text-green-400 line-through opacity-60">
                                                                        {detalle.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })()}
                                                </TableCell>
                                                {proforma.estado === 'PENDIENTE' && (
                                                    <TableCell className="text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEliminarProducto(index)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Resumen de Totales en Tiempo Real */}
                                <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                                    {/* Indicador de cálculo en progreso */}
                                    {isCalculandoRangos && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 flex items-center gap-2">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                            <p className="text-xs text-blue-700 dark:text-blue-200">Recalculando precios...</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-8">
                                        <div className="space-y-2 text-right">
                                            <p className="text-sm font-medium text-foreground">Total:</p>
                                            <p className="text-2xl font-bold text-[var(--brand-primary)]">
                                                Bs. {totales.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                    {totales.total !== proforma.subtotal && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 text-right italic">
                                            ℹ️ Total modificado desde: Bs. {proforma.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Observaciones */}
                        {proforma.observaciones && (
                            <ProformaCard variant="default" title="Observaciones">
                                <p className="text-[var(--text-sm)] text-muted-foreground leading-relaxed">
                                    {proforma.observaciones}
                                </p>
                            </ProformaCard>
                        )}

                        {/* ✅ Card de Dirección - Se oculta completamente cuando showDireccionCard es false */}
                        {proforma.direccion_solicitada && showDireccionCard && (
                            <ProformaCard
                                variant="info"
                                title="Dirección de Entrega"
                                // ✅ Botón toggle en el header para mostrar/ocultar
                                headerAction={
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowDireccionCard(!showDireccionCard)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </Button>
                                }
                            >
                                <div className="space-y-[var(--space-sm)]">
                                    <div>
                                        <div className="text-[var(--text-xs)] font-medium text-muted-foreground uppercase">Dirección Solicitada</div>
                                        <div className="text-[var(--text-sm)] mt-2 text-muted-foreground">
                                            {proforma.direccion_solicitada.direccion}
                                        </div>
                                    </div>

                                    {proforma.direccion_solicitada.latitud && proforma.direccion_solicitada.longitud ? (
                                        <>
                                            {/* Mostrar coordenadas */}
                                            <div className="text-[var(--text-xs)] text-muted-foreground">
                                                <span className="font-medium">Coordenadas:</span> {proforma.direccion_solicitada.latitud.toFixed(4)}, {proforma.direccion_solicitada.longitud.toFixed(4)}
                                            </div>

                                            {/* Botón para mostrar mapa - LAZY LOAD */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowMapaEntrega(true)}
                                                className="w-full mt-2 text-sm"
                                            >
                                                <MapPin className="h-4 w-4 mr-1" />
                                                Ver ubicación en mapa
                                            </Button>

                                            {/* Modal expandible con mapa - Optimizado para mobile */}
                                            {showMapaEntrega && (
                                                <div className="pt-[var(--space-sm)] border-t space-y-[var(--space-sm)] animate-in fade-in duration-200">
                                                    <div className="text-[var(--text-xs)] font-medium text-muted-foreground mb-2">
                                                        📍 Ubicación en el mapa:
                                                    </div>

                                                    {/* Contenedor responsive del mapa */}
                                                    <div className="rounded-lg overflow-hidden border border-border/50">
                                                        <MapViewWithFallback
                                                            latitude={proforma.direccion_solicitada.latitud}
                                                            longitude={proforma.direccion_solicitada.longitud}
                                                            height="280px"
                                                            zoom={16}
                                                            markerTitle="Ubicación de entrega solicitada"
                                                        />
                                                    </div>

                                                    {/* Botón para cerrar - Mobile optimizado */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setShowMapaEntrega(false)}
                                                        className="w-full text-xs hover:bg-muted"
                                                    >
                                                        ✕ Cerrar mapa
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-[var(--text-xs)] text-amber-600 dark:text-amber-400">
                                            No hay coordenadas disponibles para esta dirección
                                        </div>
                                    )}

                                    {proforma.fecha_entrega_solicitada && (
                                        <div className="pt-[var(--space-sm)] border-t">
                                            <div className="text-[var(--text-xs)] font-medium text-muted-foreground uppercase mb-1">Fecha Solicitada</div>
                                            <div className="text-[var(--text-sm)] font-medium">
                                                {new Date(proforma.fecha_entrega_solicitada).toLocaleDateString('es-ES')}
                                            </div>
                                        </div>
                                    )}
                                    {proforma.hora_entrega_solicitada && (
                                        <div>
                                            <div className="text-[var(--text-xs)] font-medium text-muted-foreground uppercase mb-1">Hora Solicitada</div>
                                            <div className="text-[var(--text-sm)] font-medium">
                                                {proforma.hora_entrega_solicitada}
                                                {proforma.hora_entrega_solicitada_fin && (
                                                    <span>
                                                        {' - '}
                                                        {proforma.hora_entrega_solicitada_fin}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ProformaCard>
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
                                    <CardContent className="space-y-[var(--space-lg)]">
                                        <div className="grid md:grid-cols-3 gap-[var(--space-md)]">
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

                                            {/* Hora de entrega confirmada (inicio) */}
                                            <div className="space-y-2">
                                                <Label htmlFor="hora_confirmada">
                                                    Desde (Hora)
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

                                            {/* Hora de entrega confirmada (fin) */}
                                            <div className="space-y-2">
                                                <Label htmlFor="hora_confirmada_fin">
                                                    Hasta (Hora)
                                                </Label>
                                                <Input
                                                    id="hora_confirmada_fin"
                                                    type="time"
                                                    value={coordinacion.hora_entrega_confirmada_fin || ''}
                                                    onChange={(e) =>
                                                        setCoordinacion({
                                                            ...coordinacion,
                                                            hora_entrega_confirmada_fin: e.target.value || undefined,
                                                        })
                                                    }
                                                    disabled={isGuardandoCoordinacion}
                                                />
                                            </div>
                                        </div>

                                        {/* Comentario de coordinación */}
                                        <div className="space-y-2">
                                            <Label htmlFor="comentario" className='mb-2'>
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
                                                className="resize-none mt-2"
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
                                                className="resize-none mt-2"
                                            />
                                        </div>

                                        <Separator className="my-[var(--space-md)]" />

                                        {/* Control de Intentos de Contacto */}
                                        <div className="space-y-[var(--space-md)]">
                                            <h4 className="font-semibold text-[var(--text-sm)]">Control de Intentos de Contacto</h4>
                                            <div className="grid md:grid-cols-2 gap-[var(--space-md)]">
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
                </div>
            </div>

            {/* Diálogo de aprobación con verificación de pago */}
            <Dialog open={showAprobarDialog} onOpenChange={setShowAprobarDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Aprobar Proforma con Verificación de Pago</DialogTitle>
                        <DialogDescription>
                            Complete los datos de coordinación de entrega y verifique el pago
                        </DialogDescription>
                    </DialogHeader>

                    <ApprovalPaymentForm
                        proforma={proforma}
                        coordinacion={coordinacion}
                        onCoordinacionChange={setCoordinacion}
                        onSubmit={handleAprobar}
                        onCancel={() => setShowAprobarDialog(false)}
                        isSubmitting={isSubmitting}
                    />
                </DialogContent>
            </Dialog>

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

            {/* Modal para convertir a venta */}
            <ProformaConvertirModal
                isOpen={showConvertirDialog}
                onClose={() => {
                    setShowConvertirDialog(false);
                    setConvertErrorState(null);
                }}
                proforma={proforma}
                onConvertir={handleConvertir}
                isProcessing={isConverting}
                onRenovarReservas={() => {
                    renovarReservas(() => {
                        // Después de renovar, reintentar conversión automáticamente
                        console.log('✅ Reservas renovadas, reintentando conversión...');
                        setConvertErrorState(null);
                        setTimeout(() => {
                            convertirAVenta();
                        }, 1500);
                    });
                }}
                isRenovando={isRenovandoReservas}
                errorState={convertErrorState}
            />

            {/* Diálogo para agregar productos */}
            <ProductSelectionDialog
                open={showAgregarProductoDialog}
                onOpenChange={setShowAgregarProductoDialog}
                productos={productosDisponibles as Producto[]}
                searchTerm={searchProducto}
                onSearchChange={setSearchProducto}
                onSelectProducto={handleAgregarProducto}
                isLoading={isLoadingProductos}
                error={errorProductos}
            />

            {/* Loading Overlay para flujo de aprobación */}
            {approvalFlow && (
                <LoadingOverlay
                    isVisible={approvalFlow.state.loading}
                    step={approvalFlow.state.step === 'approving' ? 'approval' : approvalFlow.state.step === 'converting' ? 'conversion' : 'processing'}
                    message={
                        approvalFlow.state.step === 'approving'
                            ? 'Aprobando proforma con datos de coordinación...'
                            : approvalFlow.state.step === 'converting'
                                ? 'Convirtiendo a venta y registrando pago...'
                                : 'Procesando solicitud...'
                    }
                />
            )}
        </AppLayout>
    )
}
