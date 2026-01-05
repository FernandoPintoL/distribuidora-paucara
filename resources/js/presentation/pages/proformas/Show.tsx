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
import { Package, MapPin, Check, X, ChevronUp, ChevronDown, ShoppingCart, MessageCircle, AlertCircle } from 'lucide-react'
import MapViewWithFallback from '@/presentation/components/maps/MapViewWithFallback'
import { FormatoSelector } from '@/presentation/components/impresion'

// DOMAIN LAYER: Importar tipos desde domain
import type { Proforma } from '@/domain/entities/proformas'

// APPLICATION LAYER: Importar hooks de lógica de negocio
import { useProformaActions, type CoordinacionData } from '@/application/hooks/use-proforma-actions'
import { useApprovalFlow } from '@/application/hooks/use-approval-flow'

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

// Componente para seleccionar producto
interface ProductSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productos: any[]
    searchTerm: string
    onSearchChange: (term: string) => void
    onSelectProducto: (producto: any) => void
}

function ProductSelectionDialog({
    open,
    onOpenChange,
    productos,
    searchTerm,
    onSearchChange,
    onSelectProducto
}: ProductSelectionDialogProps) {
    const [selectedProducto, setSelectedProducto] = useState<any | null>(null)
    const [cantidad, setCantidad] = useState(1)

    // Filtrar productos según el término de búsqueda
    const productosFiltrados = productos.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAgregarProductoSeleccionado = () => {
        if (!selectedProducto) return

        // Obtener precio del producto (puede venir como 'precio' o 'precio_venta')
        const precioUnitario = selectedProducto.precio || selectedProducto.precio_venta || 0

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
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 h-9 text-sm"
                        />
                    </div>

                    {/* Lista de productos */}
                    {productosFiltrados.length > 0 ? (
                        <div className="border rounded-lg divide-y bg-background">
                            {productosFiltrados.map((producto) => (
                                <div
                                    key={producto.id}
                                    className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors text-sm ${
                                        selectedProducto?.id === producto.id ? 'bg-accent' : ''
                                    }`}
                                    onClick={() => setSelectedProducto(producto)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{producto.nombre}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {producto.sku || producto.codigo} • Stock: {producto.cantidad_disponible || 0}
                                            </p>
                                            <p className="text-sm font-medium text-foreground mt-1">
                                                Bs. {(producto.precio || producto.precio_venta || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        {selectedProducto?.id === producto.id && (
                                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded-lg p-4 text-center bg-muted/30 text-sm">
                            <p className="text-muted-foreground">
                                {productos.length === 0
                                    ? 'Cargando productos...'
                                    : 'No se encontraron productos'}
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
                                Subtotal: Bs. {(cantidad * (selectedProducto.precio || selectedProducto.precio_venta || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
        onError: (error: any) => {
            console.error('Error en acción de proforma:', error);
            console.log('📋 Error code:', error.code);
            console.log('📋 Error message:', error.message);
            console.log('📋 Error reservasExpiradas:', error.reservasExpiradas);

            // Detectar si es error de reservas expiradas
            if (error.code === 'RESERVAS_EXPIRADAS') {
                console.log('⚠️ Detectado error de reservas expiradas - ESTABLECIENDO ESTADO');
                const newErrorState = {
                    code: 'RESERVAS_EXPIRADAS',
                    message: error.message,
                    reservasExpiradas: error.reservasExpiradas,
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
    const [convertErrorState, setConvertErrorState] = useState<{ code?: string; message?: string; reservasExpiradas?: number } | null>(null)

    // Estados para edición de detalles
    const [editableDetalles, setEditableDetalles] = useState(proforma.detalles.map(d => ({ ...d })))
    const [showAgregarProductoDialog, setShowAgregarProductoDialog] = useState(false)
    const [searchProducto, setSearchProducto] = useState('')
    const [productosDisponibles, setProductosDisponibles] = useState<any[]>([])

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

    // Cargar productos disponibles cuando se abre el diálogo
    useEffect(() => {
        if (showAgregarProductoDialog) {
            const cargarProductos = async () => {
                try {
                    const response = await fetch('/api/productos?per_page=100', {
                        credentials: 'same-origin', // Incluir cookies de sesión
                    })
                    if (response.ok) {
                        const result = await response.json()
                        // El API devuelve: { success, message, data: { data: [], current_page, ... } }
                        // data.data contiene el array de productos
                        const productos = result.data?.data || result.data || []
                        setProductosDisponibles(Array.isArray(productos) ? productos : [])
                    } else if (response.status === 401) {
                        console.warn('No autorizado para cargar productos')
                        setProductosDisponibles([])
                    }
                } catch (error) {
                    console.error('Error cargando productos:', error)
                    setProductosDisponibles([])
                }
            }
            cargarProductos()
        }
    }, [showAgregarProductoDialog])

    // Sincronizar datos de coordinación cuando la proforma cambia
    useEffect(() => {
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
    }, [proforma.id])

    // Handlers para edición de detalles
    const handleEditarCantidad = (index: number, cantidad: number) => {
        const nuevosDetalles = [...editableDetalles]
        // Validar que sea un número válido y positivo
        const cantidadValida = Math.max(0.01, isNaN(cantidad) ? 0.01 : cantidad)
        nuevosDetalles[index].cantidad = cantidadValida
        nuevosDetalles[index].subtotal = cantidadValida * nuevosDetalles[index].precio_unitario
        setEditableDetalles(nuevosDetalles)
    }

    // Calcular total en tiempo real
    const calcularTotales = () => {
        const subtotal = editableDetalles.reduce((sum, d) => sum + (d.subtotal || 0), 0)
        const total = subtotal
        return { subtotal, total }
    }

    const totales = calcularTotales()

    const handleEliminarProducto = (index: number) => {
        const nuevosDetalles = editableDetalles.filter((_, i) => i !== index)
        setEditableDetalles(nuevosDetalles)
    }

    const handleAgregarProducto = (detalle: any) => {
        // Si viene del diálogo, ya está completo
        // Si viene de otra fuente, es un producto simple
        const nuevoDetalle = detalle.id !== undefined
            ? detalle // Ya es un detalle completo del diálogo
            : {       // Es un producto simple, necesita ser transformado
                id: Math.random(),
                producto: detalle,
                producto_id: detalle.id,
                producto_nombre: detalle.nombre || detalle.producto_nombre,
                sku: detalle.sku,
                cantidad: 1,
                precio_unitario: detalle.precio || detalle.precio_venta || 0,
                subtotal: detalle.precio || detalle.precio_venta || 0
            }

        setEditableDetalles([...editableDetalles, nuevoDetalle])
        setShowAgregarProductoDialog(false)
    }

    // PRESENTATION LAYER: Handlers simples que delegan al hook
    const handleAprobar = () => {
        // Si hay datos de pago (con_pago = true), usar flujo combinado
        if (coordinacion.payment?.con_pago) {
            handleAprobarYConvertirConPago();
            return;
        }

        console.log('%c📋 Iniciando aprobación simple', 'color: blue; font-weight: bold;');

        // Inicializar flujo de aprobación si el contexto está disponible
        if (approvalFlow) {
            approvalFlow.initFlow(proforma);
            approvalFlow.updateCoordinacion(coordinacion);
            approvalFlow.setLoading(true, 'approving');
        }

        // Llamar al endpoint de aprobación
        aprobar(coordinacion);
        // El diálogo se cerrará cuando la página se recargue después del onSuccess
    }

    // Flujo combinado: Aprobar + Convertir con Pago
    const handleAprobarYConvertirConPago = async () => {
        console.log('%c📋 Iniciando flujo combinado: Aprobar + Convertir', 'color: blue; font-weight: bold;');

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
                        d.cantidad !== parseFloat(original.cantidad) ||
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
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
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
            console.log('%c⏳ PASO 1: Aprobando proforma...', 'color: blue;');

            const aprobarResponse = await fetch(`/api/proformas/${proforma.id}/aprobar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
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

            const convertirResponse = await fetch(`/api/proformas/${proforma.id}/convertir-venta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    con_pago: coordinacion.payment!.con_pago,
                    tipo_pago_id: coordinacion.payment!.tipo_pago_id,
                    politica_pago: coordinacion.payment!.politica_pago,
                    monto_pagado: coordinacion.payment!.monto_pagado,
                    fecha_pago: coordinacion.payment!.fecha_pago,
                    numero_recibo: coordinacion.payment!.numero_recibo,
                    numero_transferencia: coordinacion.payment!.numero_transferencia,
                }),
            });

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

            // Cerrar diálogo y recargar página
            setShowAprobarDialog(false);

            // Mostrar notificación de éxito
            const successMessage = `Proforma aprobada y convertida a venta exitosamente`;
            console.log('%c🎉 ' + successMessage, 'color: green; font-weight: bold;');

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

    return (
        <AppLayout>
            <Head title={`Proforma ${proforma.numero}`} />

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
                            <div className="space-y-1 mt-2">
                                <p className="text-[var(--text-sm)] text-muted-foreground">
                                    Creada el {new Date(proforma.created_at).toLocaleDateString('es-ES')}
                                </p>
                                {/* Mostrar origen */}
                                {(proforma.canal || proforma.canal_origen) && (
                                    <p className="text-[var(--text-sm)] text-muted-foreground">
                                        Origen: <span className="font-medium text-foreground">{proforma.canal || proforma.canal_origen}</span>
                                    </p>
                                )}
                                {/* <div>
                                    <p className="text-[var(--text-xs)] text-muted-foreground font-medium uppercase">Total</p>
                                    <p className="text-[var(--text-2xl)] font-bold text-[var(--brand-primary)]">
                                        Bs. {proforma.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </p>
                                </div> */}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-[var(--space-sm)] flex-wrap items-center">
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

                        <FormatoSelector
                            documentoId={proforma.id}
                            tipoDocumento="proforma"
                        />
                    </div>
                </div>

                <div className="grid gap-[var(--space-lg)] lg:grid-cols-3">
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
                                            <TableHead className="font-semibold text-right">Precio Unit.</TableHead>
                                            <TableHead className="text-right font-semibold">Subtotal</TableHead>
                                            {proforma.estado === 'PENDIENTE' && <TableHead className="text-center font-semibold">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableDetalles.map((detalle, index) => (
                                            <TableRow
                                                key={detalle.id}
                                                className={`transition-colors hover:bg-muted/30 ${
                                                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
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
                                                            value={detalle.cantidad || ''}
                                                            onChange={(e) => {
                                                                const valor = e.target.value
                                                                if (valor === '' || valor === '0') {
                                                                    handleEditarCantidad(index, 0.01)
                                                                } else {
                                                                    handleEditarCantidad(index, parseFloat(valor) || 0.01)
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const valor = parseFloat(e.target.value) || 0
                                                                if (valor <= 0) {
                                                                    handleEditarCantidad(index, 0.01)
                                                                }
                                                            }}
                                                            placeholder="0.00"
                                                            className="w-24 text-center"
                                                        />
                                                    ) : (
                                                        <span className="font-medium">{detalle.cantidad}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    Bs. {(detalle.precio_unitario ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    Bs. {(detalle.subtotal ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
                            {proforma.estado === 'PENDIENTE' && (
                                <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                                    <div className="flex justify-end gap-8">
                                        <div className="space-y-2 text-right">
                                            <p className="text-sm text-muted-foreground">Subtotal:</p>
                                            <p className="text-2xl font-bold text-foreground">
                                                Bs. {totales.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <p className="text-sm font-medium text-foreground">Total:</p>
                                            <p className="text-2xl font-bold text-[var(--brand-primary)]">
                                                Bs. {totales.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                    {totales.total !== proforma.total && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 text-right italic">
                                            ℹ️ Total modificado desde: Bs. {proforma.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>
                            )}
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

                    {/* Información lateral */}
                    <div className="space-y-[var(--space-lg)]">
                        {/* Cliente */}
                        <ProformaCard variant="default" title="Información del Cliente">
                            <div className="space-y-[var(--space-md)]">
                                {/* Nombre */}
                                <div>
                                    <div className="text-[var(--text-xs)] font-medium text-muted-foreground uppercase tracking-wide">Nombre</div>
                                    <div className="font-semibold text-[var(--text-base)] mt-1">{proforma.cliente.nombre}</div>
                                </div>

                                {/* Email */}
                                {proforma.cliente.email && (
                                    <div>
                                        <div className="text-[var(--text-xs)] font-medium text-muted-foreground uppercase tracking-wide">Email</div>
                                        <div className="text-[var(--text-sm)] mt-1 break-all">{proforma.cliente.email}</div>
                                    </div>
                                )}

                                {/* Teléfono */}
                                {proforma.cliente.telefono && (
                                    <div className="space-y-2">
                                        <div className="text-[var(--text-xs)] font-medium text-muted-foreground uppercase tracking-wide">Teléfono</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[var(--text-sm)]">{proforma.cliente.telefono}</span>
                                            <a
                                                href={`https://wa.me/${proforma.cliente.telefono.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Abrir en WhatsApp"
                                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Dirección del cliente */}
                                {proforma.cliente.direccion && (
                                    <div className="border-t pt-[var(--space-md)]">
                                        <div className="text-[var(--text-xs)] font-medium text-muted-foreground uppercase tracking-wide">Dirección Registrada</div>
                                        <div className="text-[var(--text-sm)] mt-1 text-muted-foreground">
                                            {proforma.cliente.direccion}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ProformaCard>

                        {/* Dirección de Entrega Solicitada */}
                        {proforma.direccion_solicitada && (
                            <ProformaCard variant="info" title="Dirección de Entrega">
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


                        {/* Información adicional */}
                        {/* <Card>
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
                        </Card> */}
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
                productos={productosDisponibles}
                searchTerm={searchProducto}
                onSearchChange={setSearchProducto}
                onSelectProducto={handleAgregarProducto}
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
