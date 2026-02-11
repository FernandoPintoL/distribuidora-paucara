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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select'
import { Package, MapPin, Check, X, ChevronUp, ChevronDown, ShoppingCart, MessageCircle, AlertCircle, ChevronRight, Search, RefreshCw } from 'lucide-react'
import MapViewWithFallback from '@/presentation/components/maps/MapViewWithFallback'
import { FormatoSelector } from '@/presentation/components/impresion'
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal'  // ✅ NUEVO

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

interface TipoPrecioOption {
    value: number
    code: string
    label: string
    description?: string
    color?: string
    es_ganancia?: boolean
    es_precio_base?: boolean
    icono?: string
    tooltip?: string
}

interface Props {
    item: Proforma
    tiposPrecio?: TipoPrecioOption[]
}

// Interfaz para detalle que devuelve el diálogo de selección
interface ProformaDetalleDialogo {
    id: number
    producto?: Producto
    producto_id: Id
    producto_nombre: string
    sku?: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    // ✅ NUEVO: Datos de stock, peso, categoría y límite de venta para visualización
    stock_disponible?: number
    peso?: number
    categoria?: string | null
    limite_venta?: number | null
    // ✅ NUEVO: Tipo de precio
    tipo_precio_id?: number | null
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
            subtotal: (Math.max(0.01, cantidad)) * precioUnitario,
            // ✅ NUEVO: Incluir stock, peso, categoría y límite de venta del producto
            stock_disponible: (selectedProducto as any).stock_disponible || 0,
            peso: (selectedProducto as any).peso || 0,
            categoria: (selectedProducto as any).categoria || undefined,
            limite_venta: (selectedProducto as any).limite_venta || null,
            // ✅ NUEVO: Marcar como detalle nuevo para validar sobrestock
            esNuevo: true
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

export default function ProformasShow({ item: proforma, tiposPrecio = [] }: Props) {
    // APPLICATION LAYER: Lógica de negocio desde hook
    console.log('📦 Proforma recibida en Show.tsx:', proforma);
    console.log('💰 Tipos de Precio disponibles:', tiposPrecio);
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
    // ✅ NUEVO: Estado para error de caja no disponible
    const [showCajaErrorDialog, setShowCajaErrorDialog] = useState(false)
    const [cajaErrorMessage, setCajaErrorMessage] = useState('')
    // ✅ NUEVO: Estado para verificar reservas al cargar la proforma
    const [verificandoReservas, setVerificandoReservas] = useState(false)
    const [reservasExpiradasAlCargar, setReservasExpiradasAlCargar] = useState(false)

    // ✅ NUEVO: Estados para navegación a siguiente proforma
    const [loadingSiguiente, setLoadingSiguiente] = useState(false)
    const [siguienteProforma, setSiguienteProforma] = useState<{ id: number; numero: string; cliente_nombre: string; total: number; fecha_creacion: string } | null>(null)

    // ✅ NUEVO: Flag para evitar que el componente se remonte durante flujo de aprobación + conversión
    const [isFlowAprobacionConversion, setIsFlowAprobacionConversion] = useState(false)

    // ✅ NUEVO: Estado para el modal de selección de salida (OutputSelection)
    const [showOutputSelection, setShowOutputSelection] = useState(false)
    const [ventaParaImprimir, setVentaParaImprimir] = useState<any>(null)

    // Estados para edición de detalles
    const [editableDetalles, setEditableDetalles] = useState(proforma.detalles.map(d => ({ ...d })))
    const [preciosEditadosManualmente, setPreciosEditadosManualmente] = useState<Set<number>>(new Set())
    const [showAgregarProductoDialog, setShowAgregarProductoDialog] = useState(false)

    // Estados para búsqueda rápida de productos
    const [busquedaRapidaCodigo, setBusquedaRapidaCodigo] = useState('')
    const [cargandoBusquedaRapida, setCargandoBusquedaRapida] = useState(false)
    const [errorBusquedaRapida, setErrorBusquedaRapida] = useState<string | null>(null)

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
        // ✅ IMPORTANTE: Siempre usar hoy como fecha confirmada
        const hoy = new Date()
        const year = hoy.getFullYear()
        const month = String(hoy.getMonth() + 1).padStart(2, '0')
        const day = String(hoy.getDate()).padStart(2, '0')
        const fechaConfirmada = `${year}-${month}-${day}`

        // Usar las horas guardadas en la proforma si existen
        let horaConfirmada = '09:00'
        let horaConfirmadaFin = '17:00'

        if (proforma.hora_entrega_confirmada) {
            horaConfirmada = extractTime(proforma.hora_entrega_confirmada, '09:00')
        }
        if (proforma.hora_entrega_confirmada_fin) {
            horaConfirmadaFin = extractTime(proforma.hora_entrega_confirmada_fin, '17:00')
        }

        return {
            fecha: fechaConfirmada,
            hora: horaConfirmada,
            hora_fin: horaConfirmadaFin
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
        numero_intentos_contacto: proforma.numero_intentos_contacto || 1,
        resultado_ultimo_intento: proforma.resultado_ultimo_intento || 'Aceptado',
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
                    // ✅ NO sobrescribir precios editados manualmente por el usuario
                    if (preciosEditadosManualmente.has(detalle.id)) {
                        console.log(`⏸️ Precio manual detectado para detalle ${detalle.id}, NO sobrescribir`)
                        return detalle
                    }

                    // Obtener el detalle calculado del hook
                    const precioActualizado = getPrecioActualizado(detalle.producto_id as number)

                    if (precioActualizado) {
                        // Si hay precio actualizado, recalcular subtotal
                        console.log(`📊 Actualizando precio para producto ${detalle.producto_id}: ${precioActualizado}`)
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
    }, [isCalculandoRangos, errorRangos, getPrecioActualizado, preciosEditadosManualmente])

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
        // ✅ IMPORTANTE: Siempre usar la fecha de hoy para fecha_entrega_confirmada
        const defaultDeliveryEffect = (() => {
            // Siempre usar hoy como fecha confirmada (no la guardada en la proforma)
            const hoy = new Date()
            const year = hoy.getFullYear()
            const month = String(hoy.getMonth() + 1).padStart(2, '0')
            const day = String(hoy.getDate()).padStart(2, '0')
            const fechaConfirmada = `${year}-${month}-${day}`

            // Usar las horas guardadas en la proforma si existen
            let horaConfirmada = '09:00'
            let horaConfirmadaFin = '17:00'

            if (proforma.hora_entrega_confirmada) {
                horaConfirmada = extractTime(proforma.hora_entrega_confirmada, '09:00')
            }
            if (proforma.hora_entrega_confirmada_fin) {
                horaConfirmadaFin = extractTime(proforma.hora_entrega_confirmada_fin, '17:00')
            }

            return {
                fecha: fechaConfirmada,
                hora: horaConfirmada,
                hora_fin: horaConfirmadaFin
            }
        })()

        setCoordinacion({
            fecha_entrega_confirmada: defaultDeliveryEffect.fecha,
            hora_entrega_confirmada: defaultDeliveryEffect.hora,
            hora_entrega_confirmada_fin: defaultDeliveryEffect.hora_fin,
            comentario_coordinacion: proforma.comentario_coordinacion || '',
            notas_llamada: '',
            numero_intentos_contacto: proforma.numero_intentos_contacto || 0,
            resultado_ultimo_intento: proforma.resultado_ultimo_intento || 'Aceptado',
            entregado_en: proforma.entregado_en || '',
            entregado_a: proforma.entregado_a || '',
            observaciones_entrega: proforma.observaciones_entrega || '',
        })
    }, [proforma.id, isFlowAprobacionConversion])

    // ✅ NUEVO: Verificar reservas al cargar la proforma
    useEffect(() => {
        if (!proforma.id) return;

        const verificarReservasAlCargar = async () => {
            setVerificandoReservas(true);
            try {
                const response = await fetch(`/api/proformas/${proforma.id}/reservas`);
                const data = await response.json();

                if (data.success && data.data.reservas_expiradas) {
                    console.log('⚠️ Se detectó que las reservas han expirado al cargar la proforma');
                    setReservasExpiradasAlCargar(true);
                } else {
                    setReservasExpiradasAlCargar(false);
                }
            } catch (error) {
                console.error('Error al verificar reservas:', error);
                setReservasExpiradasAlCargar(false);
            } finally {
                setVerificandoReservas(false);
            }
        };

        verificarReservasAlCargar();
    }, [proforma.id])

    // Handlers para edición de detalles
    const handleEditarCantidad = (index: number, cantidad: number) => {
        const nuevosDetalles = [...editableDetalles]
        // Validar que sea un número válido y positivo
        const cantidadValida = Math.max(0.01, isNaN(cantidad) ? 0.01 : cantidad)
        const cantidadAnterior = nuevosDetalles[index].cantidad
        nuevosDetalles[index].cantidad = cantidadValida
        nuevosDetalles[index].subtotal = cantidadValida * nuevosDetalles[index].precio_unitario
        setEditableDetalles(nuevosDetalles)

        // ✅ Log para verificar que se actualiza el subtotal
        console.log('📦 Cantidad editada - Detalle:', index, 'De:', cantidadAnterior, 'A:', cantidadValida, 'Nuevo subtotal:', nuevosDetalles[index].subtotal)

        // Recalcular rangos de precio
        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: d.tipo_precio_id // ✅ NUEVO: Respetar tipo_precio_id seleccionado
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    // ✅ NUEVO: Handler para editar precio manualmente
    const handleEditarPrecio = (index: number, precioNuevo: number) => {
        const nuevosDetalles = [...editableDetalles]
        const precioValido = Math.max(0.01, isNaN(precioNuevo) ? nuevosDetalles[index].precio_unitario : precioNuevo)
        nuevosDetalles[index].precio_unitario = precioValido
        nuevosDetalles[index].subtotal = nuevosDetalles[index].cantidad * precioValido
        setEditableDetalles(nuevosDetalles)

        // ✅ Marcar este detalle como editado manualmente para que el API no lo sobrescriba
        const detalleId = nuevosDetalles[index].id
        if (detalleId) {
            setPreciosEditadosManualmente(prev => new Set(prev).add(detalleId))
        }

        // ✅ Recalcular totales (se hace automáticamente en el siguiente render,
        // pero aquí lo registramos en logs para feedback visual)
        console.log('💰 Precio editado - Detalle:', index, 'Nuevo precio:', precioValido, 'Nuevo subtotal:', nuevosDetalles[index].subtotal)
    }

    // ✅ NUEVO: Handler para cambiar tipo de precio
    const handleCambiarTipoPrecio = (index: number, tipoPrecioId: number | null) => {
        const nuevosDetalles = [...editableDetalles]
        const tipoAnterior = nuevosDetalles[index].tipo_precio_id
        nuevosDetalles[index].tipo_precio_id = tipoPrecioId
        setEditableDetalles(nuevosDetalles)

        // ✅ Limpiar marca de "editado manualmente" para este detalle
        // Así el nuevo precio del API carrito se aplicará automáticamente
        const detalleId = nuevosDetalles[index].id
        if (detalleId) {
            setPreciosEditadosManualmente(prev => {
                const newSet = new Set(prev)
                newSet.delete(detalleId)
                return newSet
            })
        }

        // Recalcular rangos con el nuevo tipo de precio
        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: d.tipo_precio_id
        }))
        console.log('🏷️ Tipo de precio cambiado - Detalle:', index, 'De:', tipoAnterior, 'A:', tipoPrecioId, '- Recalculando...')
        calcularCarritoDebounced(itemsParaCalcular)
    }

    // Calcular total en tiempo real (usando precios actualizados por rango)
    const calcularTotales = () => {
        const subtotal = editableDetalles.reduce((sum, d) => {
            let precio: number

            // ✅ PRIORIDAD 1: Si el precio fue editado manualmente, usar ese
            if (preciosEditadosManualmente.has(d.id)) {
                precio = d.precio_unitario ?? 0
                console.log(`  ✏️ Precio MANUAL para Prod ${d.producto_id}: ${precio.toFixed(2)}`)
            } else {
                // ✅ PRIORIDAD 2: Si el API carrito tiene precio, usar ese
                const precioActualizado = getPrecioActualizado(d.producto_id as number)
                if (precioActualizado) {
                    precio = precioActualizado
                    console.log(`  📊 Precio API para Prod ${d.producto_id}: ${precio.toFixed(2)}`)
                } else {
                    // ✅ FALLBACK: Usar precio actual del detalle
                    precio = d.precio_unitario ?? 0
                }
            }

            const lineTotal = d.cantidad * precio
            return sum + lineTotal
        }, 0)
        const total = subtotal

        // ✅ Log del total calculado
        if (editableDetalles.length > 0) {
            console.log(`💹 TOTALES RECALCULADOS - Subtotal: ${subtotal.toFixed(2)}, Total: ${total.toFixed(2)}`)
        }

        return { subtotal, total }
    }

    const totales = calcularTotales()

    const handleEliminarProducto = (index: number) => {
        const detalleEliminado = editableDetalles[index]
        const nuevosDetalles = editableDetalles.filter((_, i) => i !== index)
        setEditableDetalles(nuevosDetalles)

        // ✅ Limpiar marca de "editado manualmente" si existe
        if (detalleEliminado.id) {
            setPreciosEditadosManualmente(prev => {
                const newSet = new Set(prev)
                newSet.delete(detalleEliminado.id)
                return newSet
            })
        }
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
                subtotal: (detalle as Producto).precio_base || 0,
                // ✅ NUEVO: Incluir stock, peso, categoría y límite de venta del producto
                stock_disponible: (detalle as Producto).stock_disponible || 0,
                peso: (detalle as Producto).peso || 0,
                categoria: (detalle as Producto).categoria?.nombre || (detalle as any).categoria || undefined,
                limite_venta: (detalle as Producto).limite_venta || null
            }

        // ✅ NUEVO: Verificar si el producto ya existe en la tabla
        const productoExistente = editableDetalles.find(d => d.producto_id === nuevoDetalle.producto_id)

        let nuevosDetalles: typeof editableDetalles

        if (productoExistente) {
            // ✅ Si el producto ya existe, incrementar su cantidad
            nuevosDetalles = editableDetalles.map(d =>
                d.producto_id === nuevoDetalle.producto_id
                    ? {
                        ...d,
                        cantidad: d.cantidad + 1,
                        subtotal: (d.cantidad + 1) * d.precio_unitario
                    }
                    : d
            )
            console.log(`📦 Producto "${nuevoDetalle.producto_nombre}" ya existe. Cantidad incrementada.`)
        } else {
            // ✅ Si es nuevo, agregarlo como una nueva fila
            nuevosDetalles = [...editableDetalles, nuevoDetalle]
            console.log(`📦 Nuevo producto "${nuevoDetalle.producto_nombre}" agregado.`)
        }

        setEditableDetalles(nuevosDetalles)
        setShowAgregarProductoDialog(false)

        // Calcular rangos para el nuevo detalle
        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: d.tipo_precio_id // ✅ NUEVO: Respetar tipo_precio_id seleccionado
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    // ✅ NUEVO: Función para búsqueda rápida por código/ID de producto
    const handleBuscarYAgregarProducto = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!busquedaRapidaCodigo.trim()) {
            setErrorBusquedaRapida('Ingresa un código o ID de producto')
            return
        }

        setCargandoBusquedaRapida(true)
        setErrorBusquedaRapida(null)

        try {
            // Construir query params para la búsqueda
            // tipo=venta asegura que busca productos aptos para venta
            const params = new URLSearchParams({
                q: busquedaRapidaCodigo.trim(),
                tipo: 'venta', // ✅ Especificar que es para venta
                tipo_busqueda: 'parcial' // ✅ Búsqueda parcial para mayor flexibilidad
            })

            const response = await fetch(`/api/productos/buscar?${params.toString()}`)

            if (!response.ok) {
                if (response.status === 404) {
                    setErrorBusquedaRapida('Producto no encontrado')
                } else {
                    setErrorBusquedaRapida('Error al buscar el producto')
                }
                return
            }

            const data = await response.json()

            // Validar que la respuesta tiene estructura correcta
            if (!data.data || !Array.isArray(data.data)) {
                setErrorBusquedaRapida('Formato de respuesta inválido del servidor')
                return
            }

            // Obtener lista de productos encontrados
            const productos = data.data as Producto[]

            if (productos.length === 0) {
                setErrorBusquedaRapida('Producto no encontrado')
                return
            }

            // ✅ Si encuentra exactamente 1 producto, agregarlo automáticamente
            if (productos.length === 1) {
                const producto = productos[0]
                handleAgregarProducto(producto)
                setBusquedaRapidaCodigo('')
                toast.success(`Producto "${producto.nombre}" agregado a la proforma`)
                return
            }

            // ✅ Si encuentra más de 1 producto, mostrar una alerta al usuario
            // El usuario debe ser más específico en su búsqueda
            const productosTexto = productos
                .slice(0, 5) // Mostrar máximo 5 opciones
                .map((p, i) => `${i + 1}. ${p.nombre} (SKU: ${p.sku || 'N/A'})`)
                .join('\n')

            setErrorBusquedaRapida(
                `Se encontraron ${productos.length} productos. Sé más específico:\n${productosTexto}`
            )
        } catch (error) {
            console.error('Error en búsqueda rápida:', error)
            setErrorBusquedaRapida('Error al conectar con el servidor')
        } finally {
            setCargandoBusquedaRapida(false)
        }
    }

    // PRESENTATION LAYER: Handlers simples que delegan al hook
    const handleAprobar = () => {
        // ✅ SIEMPRE usar flujo combinado: Aprobar + Convertir (incluso sin pago especificado)
        handleAprobarYConvertirConPago();
    }

    // Flujo combinado: Aprobar + Convertir con Pago
    /**
     * ✅ NUEVO: Función independiente para actualizar detalles de proforma
     *
     * Puede ser llamada:
     * 1. Desde un botón en la UI para guardar cambios sin aprobar
     * 2. Desde handleAprobarYConvertirConPago() como PASO 0 del flujo de aprobación
     *
     * @returns Promise<boolean> - true si se actualizó exitosamente, false si no hay cambios o error
     */
    const actualizarDetallesProforma = async (mostrarNotificaciones: boolean = true): Promise<boolean> => {
        console.log('%c✏️ Intentando actualizar detalles de proforma', 'color: blue;');

        // Validar que la proforma está en estado PENDIENTE
        if (proforma.estado !== 'PENDIENTE') {
            if (mostrarNotificaciones) {
                toast.error('Solo se pueden actualizar detalles de proformas pendientes');
            }
            console.log('%c⏭️ Actualización omitida: Proforma no está en estado "pendiente"', 'color: orange;', {
                estado: proforma.estado,
            });
            return false;
        }

        // Detectar si hay cambios entre los detalles editables y los originales
        const hayChangios = (
            editableDetalles.length !== proforma.detalles.length ||
            editableDetalles.some((d, i) => {
                const original = proforma.detalles[i];
                return !original ||
                    d.cantidad !== (typeof original.cantidad === 'string' ? parseFloat(original.cantidad) : original.cantidad) ||
                    d.precio_unitario !== original.precio_unitario;
            })
        );

        if (!hayChangios) {
            if (mostrarNotificaciones) {
                console.log('%c⏭️ No hay cambios en los detalles', 'color: orange;');
            }
            return false;
        }

        try {
            console.log('%c📤 Enviando detalles actualizados al servidor...', 'color: blue;');

            // Preparar detalles para enviar
            const detallesParaGuardar = editableDetalles.map(d => ({
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal,
            }));

            // Realizar petición POST
            const response = await fetch(`/api/proformas/${proforma.id}/actualizar-detalles`, {
                method: 'POST',
                redirect: 'manual',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ detalles: detallesParaGuardar }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = `Error al actualizar detalles: ${errorData.message || 'Error desconocido'}`;
                if (mostrarNotificaciones) {
                    toast.error(errorMsg);
                }
                console.error('%c❌ Error en actualización de detalles', 'color: red;', errorData);
                throw new Error(errorMsg);
            }

            const actualizarData = await response.json();
            console.log('%c✅ Detalles actualizados exitosamente', 'color: green;', actualizarData);

            if (mostrarNotificaciones) {
                toast.success('✅ Detalles actualizados correctamente');
            }

            return true;

        } catch (error) {
            console.error('%c❌ Error actualizando detalles:', 'color: red;', error);
            if (mostrarNotificaciones) {
                toast.error(error instanceof Error ? error.message : 'Error al actualizar detalles');
            }
            throw error;
        }
    };

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
            // PASO 0: Intentar actualizar detalles usando función independiente
            // ✅ REFACTORIZADO: Usa actualizarDetallesProforma() que es reutilizable
            console.log('%c🔍 PASO 0: Detectando cambios en detalles...', 'color: blue;');

            try {
                // Intentar actualizar (mostrarNotificaciones=false para no duplicar mensajes)
                const seActualizaron = await actualizarDetallesProforma(false);

                if (seActualizaron) {
                    console.log('%c✅ PASO 0 completado: Detalles actualizados', 'color: green;');
                    toast.success('✅ Detalles actualizados correctamente');

                    // Actualizar estado del flujo
                    if (approvalFlow) {
                        approvalFlow.setLoading(true, 'approving');
                    }
                } else {
                    // Sin cambios o proforma no está pendiente
                    console.log('%c⏭️ PASO 0 omitido: Sin cambios en detalles o proforma no está pendiente', 'color: orange;');
                }
            } catch (error) {
                // Si hay error en actualización, propagar
                const errorMsg = error instanceof Error ? error.message : 'Error al actualizar detalles';
                console.error('%c❌ Error en PASO 0:', 'color: red;', errorMsg);
                toast.error(errorMsg);
                throw error;
            }

            // PASO 1: Aprobar proforma con coordinación
            // ✅ NUEVO: Solo ejecutar si la proforma está en estado "pendiente"
            console.log('%c🔍 PASO 1: Validando estado de proforma...', 'color: blue;', {
                estado: proforma.estado,
                ejecutar: proforma.estado === 'PENDIENTE',
            });

            if (proforma.estado === 'PENDIENTE') {
                console.log('%c⏳ PASO 1: Aprobando proforma...', 'color: blue;');

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
            } else {
                // ✅ NUEVO: Log claro cuando se omite el PASO 1 porque no está pendiente
                console.log('%c⏭️ PASO 1 omitido: Proforma no está en estado "pendiente"', 'color: orange;', {
                    estado: proforma.estado,
                    razon: 'Solo se aprueba si la proforma está pendiente'
                });
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

            // Actualizar estado del flujo con éxito
            if (approvalFlow) {
                approvalFlow.setVentaCreada(convertirData.data?.venta || {});
                approvalFlow.markAsSuccess();
                approvalFlow.setLoading(false, 'success');
            }

            // Cerrar diálogo
            setShowAprobarDialog(false);

            // Mostrar notificación de éxito
            const successMessage = `Proforma aprobada, convertida a venta y reservas consumidas exitosamente`;
            console.log('%c🎉 ' + successMessage, 'color: green; font-weight: bold;');

            // ✅ NUEVO: Obtener la venta creada para imprimir
            const ventaCreada = convertirData.data?.venta;
            if (ventaCreada && ventaCreada.id) {
                console.log('%c📋 Abriendo modal de impresión para venta:', 'color: blue;', {
                    venta_id: ventaCreada.id,
                    venta_numero: ventaCreada.numero,
                });

                // Guardar la venta para imprimir
                setVentaParaImprimir(ventaCreada);

                // Abrir el modal de selección de salida
                setShowOutputSelection(true);
            } else {
                // Si no hay venta, recargar la página directamente
                console.warn('⚠️ No se obtuvo venta para imprimir, recargan página directamente');
                setIsFlowAprobacionConversion(false);
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }

        } catch (error) {
            console.error('%c❌ Error en flujo combinado:', 'color: red;', error);

            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

            // ✅ NUEVO: Detectar si es error de caja no disponible
            const isCajaError = errorMessage.includes('caja abierta') ||
                errorMessage.includes('caja consolidada') ||
                errorMessage.includes('CAJA_NO_DISPONIBLE');

            if (isCajaError) {
                console.warn('%c⚠️ Error de caja detectado, mostrando dialog de redirección:', 'color: orange;', errorMessage);

                // Mostrar dialog para navegar a cajas
                setCajaErrorMessage(errorMessage);
                setShowCajaErrorDialog(true);
            } else {
                // Mostrar notificación de error en toast para otros errores
                toast.error(`Error: ${errorMessage}`);
            }

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
                {/* ✅ NUEVO: Banner de reservas expiradas al cargar */}
                {reservasExpiradasAlCargar && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-bold text-red-900 dark:text-red-200 mb-2 text-lg">
                                    🚨 Las Reservas han Expirado
                                </h3>
                                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                                    Las reservas de stock para esta proforma han expirado.
                                    Para poder procesar la venta, necesitas renovarlas primero.
                                </p>
                                <Button
                                    onClick={() => {
                                        renovarReservas(() => {
                                            console.log('✅ Reservas renovadas desde el banner inicial');
                                            setReservasExpiradasAlCargar(false);
                                        });
                                    }}
                                    disabled={isRenovandoReservas}
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                >
                                    {isRenovandoReservas ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Renovando Reservas...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Renovar Reservas por 7 Días
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

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
                                <div className="flex flex-wrap gap-4 text-[var(--text-sm)] text-muted-foreground">
                                    <p>
                                        📅 Creada: {new Date(proforma.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })} {new Date(proforma.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p>
                                        ✏️ Actualizada: {new Date(proforma.updated_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })} {new Date(proforma.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <ProformaEstadoBadge estado={proforma.estado} className="text-sm px-3 py-1" />

                                {/* ✅ NUEVO: Mostrar información de venta cuando está convertida */}
                                {proforma.estado === 'CONVERTIDA' && proforma.venta && (
                                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                                            ✅ Convertida a Venta
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">ID Venta</span>
                                                <span className="font-semibold text-green-900 dark:text-green-100">{proforma.venta.id}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Número Venta</span>
                                                <span className="font-semibold text-green-900 dark:text-green-100">{proforma.venta.numero}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

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

                                    {/* Usuario Creador */}
                                    {proforma.usuario_creador && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Creado por</span>
                                            <span className="font-medium text-foreground">{proforma.usuario_creador.name}</span>
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

                        {/* ✅ NUEVO: Botón para guardar cambios en detalles sin aprobar */}
                        {proforma.estado === 'PENDIENTE' && (
                            <Button
                                variant="outline"
                                onClick={() => actualizarDetallesProforma(true)}
                                className="border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                title="Guardar los cambios realizados en los detalles sin aprobar la proforma"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </Button>
                        )}

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
                                onClick={() => setShowAprobarDialog(true)}
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
                                {/* {proforma.estado === 'PENDIENTE' && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => setShowAgregarProductoDialog(true)}
                                        className="text-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-1" />
                                        + Agregar Producto
                                    </Button>
                                )} */}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* ✅ NUEVO: Búsqueda rápida de productos por código */}
                                {proforma.estado === 'PENDIENTE' && (
                                    <form onSubmit={handleBuscarYAgregarProducto} className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                                <Input
                                                    type="text"
                                                    placeholder="Búsqueda rápida: código, SKU o ID del producto..."
                                                    value={busquedaRapidaCodigo}
                                                    onChange={(e) => {
                                                        setBusquedaRapidaCodigo(e.target.value)
                                                        setErrorBusquedaRapida(null)
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !cargandoBusquedaRapida) {
                                                            handleBuscarYAgregarProducto()
                                                        }
                                                    }}
                                                    disabled={cargandoBusquedaRapida}
                                                    className="pl-10"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                variant="secondary"
                                                size="sm"
                                                disabled={cargandoBusquedaRapida || !busquedaRapidaCodigo.trim()}
                                                onClick={() => handleBuscarYAgregarProducto()}
                                            >
                                                {cargandoBusquedaRapida ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                                        Buscando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="h-4 w-4 mr-1" />
                                                        Buscar
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Mensaje de error o ayuda */}
                                        {errorBusquedaRapida && (
                                            <div className="text-xs text-red-600 dark:text-red-400">
                                                ⚠️ {errorBusquedaRapida}
                                            </div>
                                        )}
                                        {!errorBusquedaRapida && !busquedaRapidaCodigo && (
                                            <div className="text-xs text-muted-foreground">
                                                💡 Escribe el código, SKU o ID del producto y presiona Enter o haz clic en Buscar
                                            </div>
                                        )}
                                    </form>
                                )}

                                <Separator />

                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-semibold">Producto</TableHead>
                                            <TableHead className="font-semibold">Cantidad</TableHead>
                                            {/* <TableHead className="font-semibold text-center">Rango</TableHead> */}
                                            <TableHead className="font-semibold">Tipo Precio</TableHead>
                                            <TableHead className="font-semibold">Precio Unit.</TableHead>
                                            <TableHead className="font-semibold">Subtotal</TableHead>
                                            {proforma.estado === 'PENDIENTE' && <TableHead className="text-center font-semibold">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableDetalles.map((detalle, index) => {
                                            // ✅ ACTUALIZADO: Solo validar sobrestock para detalles NUEVOS
                                            // Los detalles existentes (del backend) ya están reservados, no necesitan validación
                                            const tieneSobrestock = (detalle as any).esNuevo && parseFloat(String(detalle.cantidad || 0)) > parseFloat(String(detalle.stock_disponible || 0))

                                            return (
                                                <TableRow
                                                key={detalle.id}
                                                className={`transition-colors hover:bg-muted/30 ${
                                                    tieneSobrestock
                                                        ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500'
                                                        : index % 2 === 0
                                                            ? 'bg-background'
                                                            : 'bg-muted/10'
                                                }`}
                                            >
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-[var(--text-base)] flex items-center gap-2">
                                                            {detalle.producto?.nombre || detalle.producto_nombre || 'Producto sin datos'}
                                                            {tieneSobrestock && (
                                                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" title="Cantidad supera el stock disponible" />
                                                            )}
                                                        </div>
                                                        {/* {(detalle.producto || detalle.categoria) && (
                                                            <div className="text-[var(--text-sm)] text-muted-foreground">
                                                                {detalle.producto?.categoria?.nombre || detalle.categoria || 'Sin categoría'}
                                                                {detalle.producto?.marca?.nombre && ` - ${detalle.producto.marca.nombre}`}
                                                            </div>
                                                        )} */}
                                                        {(detalle.producto?.codigo || detalle.sku) && (
                                                            <div className="text-[var(--text-xs)] text-muted-foreground font-mono">
                                                                Código: {detalle.producto?.codigo || detalle.sku}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-medium">
                                                        {Math.floor(detalle.stock_disponible || 0)} Unid. Dispobibles
                                                    </p>
                                                    {/* <p className="font-medium">
                                                        {detalle.peso ? detalle.peso.toFixed(2) : '0.00'} Kg
                                                    </p> */}
                                                    <p>
                                                        {detalle.limite_venta ? (
                                                            <>
                                                                <span className={`font-medium ${detalle.cantidad > detalle.limite_venta
                                                                    ? 'text-red-600 dark:text-red-400'
                                                                    : detalle.cantidad >= detalle.limite_venta * 0.8
                                                                        ? 'text-yellow-600 dark:text-yellow-400'
                                                                        : 'text-green-600 dark:text-green-400'
                                                                    }`}>
                                                                    Limite Venta: {Math.floor(detalle.limite_venta)}
                                                                </span>
                                                                {detalle.cantidad > detalle.limite_venta && (
                                                                    <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                                                        ¡Excedido!
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                Sin límite
                                                            </span>
                                                        )}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    {proforma.estado === 'PENDIENTE' ? (
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            inputMode="numeric"
                                                            value={detalle.cantidad && detalle.cantidad > 0 ? Math.floor(detalle.cantidad).toString() : ''}
                                                            onChange={(e) => {
                                                                const valor = e.target.value
                                                                // ✅ MEJORADO: Permitir escribir y borrar libremente
                                                                if (valor === '') {
                                                                    // Permitir que quede vacío mientras escribe
                                                                    handleEditarCantidad(index, 0)
                                                                } else {
                                                                    const cantidad = parseInt(valor, 10)
                                                                    // Solo actualizar si es un número válido (parseInt no falla)
                                                                    if (!isNaN(cantidad)) {
                                                                        handleEditarCantidad(index, Math.floor(cantidad))
                                                                    }
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const valor = e.target.value.trim()
                                                                // ✅ Al perder el foco, establecer valor por defecto si está vacío
                                                                if (valor === '') {
                                                                    handleEditarCantidad(index, 1)
                                                                } else {
                                                                    const cantidad = Math.floor(parseInt(valor, 10) || 0)
                                                                    handleEditarCantidad(index, Math.max(1, cantidad))
                                                                }
                                                            }}
                                                            placeholder="1"
                                                            className={`w-24 text-center ${
                                                                tieneSobrestock
                                                                    ? 'border-red-500 border-2 focus:ring-red-500'
                                                                    : ''
                                                            }`}
                                                        />
                                                    ) : (
                                                        <span className="font-medium">{Math.floor(detalle.cantidad || 1)}</span>
                                                    )}
                                                </TableCell>

                                                {/* ✅ NUEVO: Selector de Tipo de Precio (desde Backend) */}
                                                <TableCell>
                                                    {proforma.estado === 'PENDIENTE' ? (
                                                        <Select
                                                            value={detalle.tipo_precio_id ? String(detalle.tipo_precio_id) : '0'}
                                                            onValueChange={(value) => handleCambiarTipoPrecio(index, value === '0' ? null : parseInt(value, 10))}
                                                        >
                                                            <SelectTrigger className="w-40 text-sm">
                                                                <SelectValue placeholder="Seleccionar..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="0">📌 Base</SelectItem>
                                                                {tiposPrecio.map((tipo) => (
                                                                    <SelectItem key={tipo.value} value={String(tipo.value)}>
                                                                        {tipo.icono} {tipo.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <span className="text-sm">
                                                            {detalle.tipo_precio_id
                                                                ? tiposPrecio.find(t => t.value === detalle.tipo_precio_id)?.label || 'Base'
                                                                : '📌 Base'}
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Precio actualizado según rango */}
                                                <TableCell className="font-medium">
                                                    {proforma.estado === 'PENDIENTE' ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                value={detalle.precio_unitario || ''}
                                                                onChange={(e) => handleEditarPrecio(index, parseFloat(e.target.value))}
                                                                placeholder="Precio"
                                                                className={`w-28 text-right text-sm ${
                                                                    preciosEditadosManualmente.has(detalle.id)
                                                                        ? 'border-orange-500 border-2 bg-orange-50 dark:bg-orange-950'
                                                                        : ''
                                                                }`}
                                                                title={preciosEditadosManualmente.has(detalle.id) ? '✏️ Editado manualmente - No se actualizará al cambiar tipo de precio' : '📊 Precio automático - Se actualizará según tipo de precio y cantidad'}
                                                            />
                                                            {/* ✅ Indicador visual si fue editado manualmente */}
                                                            {preciosEditadosManualmente.has(detalle.id) && (
                                                                <span className="text-orange-600 dark:text-orange-400 text-xs font-bold" title="Editado manualmente">
                                                                    ✏️
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        (() => {
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
                                                        })()
                                                    )}
                                                </TableCell>
                                                {/* Subtotal actualizado */}
                                                <TableCell className="font-semibold">
                                                    {(() => {
                                                        let precio: number

                                                        // ✅ PRIORIDAD 1: Si el precio fue editado manualmente, usar ese
                                                        if (preciosEditadosManualmente.has(detalle.id)) {
                                                            precio = detalle.precio_unitario ?? 0
                                                        } else {
                                                            // ✅ PRIORIDAD 2: Si el API carrito tiene precio, usar ese
                                                            const precioActualizado = getPrecioActualizado(detalle.producto_id as number)
                                                            precio = precioActualizado ?? (detalle.precio_unitario ?? 0)
                                                        }

                                                        const subtotalActualizado = detalle.cantidad * precio

                                                        return (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className={preciosEditadosManualmente.has(detalle.id) ? 'text-orange-600 dark:text-orange-400 font-bold' : ''}>
                                                                    Bs. {subtotalActualizado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                {/* Mostrar precio anterior si fue actualizado por carrito */}
                                                                {!preciosEditadosManualmente.has(detalle.id) && getPrecioActualizado(detalle.producto_id as number) &&
                                                                    subtotalActualizado !== detalle.subtotal && (
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
                                        )
                                        })}
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

                                    <div className="flex justify-end gap-12">
                                        {/* Subtotal */}
                                        <div className="space-y-2 text-right">
                                            <p className="text-sm font-medium text-foreground">Subtotal:</p>
                                            <p className="text-xl font-semibold text-muted-foreground">
                                                Bs. {totales.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>

                                        {/* Total */}
                                        <div className="space-y-2 text-right">
                                            <p className="text-sm font-medium text-foreground">Total:</p>
                                            <p className="text-2xl font-bold text-[var(--brand-primary)]">
                                                Bs. {totales.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                    {/* {totales.total !== proforma.subtotal && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 text-right italic">
                                            ℹ️ Total modificado desde: Bs. {proforma.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </p>
                                    )} */}
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
                                                        value={coordinacion.numero_intentos_contacto}
                                                        onChange={(e) =>
                                                            setCoordinacion({
                                                                ...coordinacion,
                                                                numero_intentos_contacto: parseInt(e.target.value) || 1,
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
                                                        value={coordinacion.resultado_ultimo_intento ?? 'Aceptado'}
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
                                        <Separator className="my-[var(--space-md)]" />

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
                        errorState={convertErrorState}
                        onRenovarReservas={() => {
                            renovarReservas(() => {
                                // Después de renovar, resetear el estado de error
                                console.log('✅ Reservas renovadas, habilitando aprobación...');
                                setConvertErrorState(null);
                                // Permitir que el usuario intente de nuevo
                            });
                        }}
                        isRenovando={isRenovandoReservas}
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

            {/* ✅ NUEVO: Diálogo para error de caja no disponible */}
            <Dialog open={showCajaErrorDialog} onOpenChange={setShowCajaErrorDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Caja No Disponible
                        </DialogTitle>
                        <DialogDescription>
                            No puedes convertir la proforma a venta sin una caja abierta
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                {cajaErrorMessage || 'Por favor, abre una caja antes de convertir esta proforma a venta.'}
                            </p>
                        </div>
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                ¿Qué necesitas hacer?
                            </p>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                <li>Abre una nueva caja en el módulo de Cajas</li>
                                <li>O utiliza una caja consolidada del día anterior</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowCajaErrorDialog(false)}
                        >
                            Cerrar
                        </Button>
                        <Button
                            onClick={() => {
                                // Navegar a la página de cajas
                                window.location.href = '/cajas';
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Ir a Cajas
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

            {/* ✅ NUEVO: Modal para seleccionar formato de salida (impresión) */}
            {ventaParaImprimir && (
                <OutputSelectionModal
                    isOpen={showOutputSelection}
                    onClose={() => {
                        console.log('%c📋 Modal cerrado, recargando página...', 'color: blue;');
                        setShowOutputSelection(false);
                        setVentaParaImprimir(null);

                        // ✅ CRÍTICO: Resetear flag ANTES de recargar la página
                        setIsFlowAprobacionConversion(false);

                        // Recargar la página después de cerrar el modal
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }}
                    documentoId={ventaParaImprimir.id}
                    tipoDocumento="venta"
                    documentoInfo={{
                        numero: ventaParaImprimir.numero,
                        fecha: ventaParaImprimir.fecha_venta,
                        monto: ventaParaImprimir.total,
                    }}
                />
            )}
        </AppLayout>
    )
}
