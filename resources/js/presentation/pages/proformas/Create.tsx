import { Head } from '@inertiajs/react'
import { useState, useEffect, useMemo } from 'react'
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
import { Package, Plus, Trash2, ArrowLeft, Check, Search, AlertCircle, Loader2 } from 'lucide-react'
import { LoadingOverlay } from '@/presentation/components/ui/LoadingOverlay'
import InputSearch from '@/presentation/components/ui/input-search'
import ModalCrearCliente from '@/presentation/components/ui/modal-crear-cliente'
import ProductosTable, { DetalleProducto } from '@/presentation/components/ProductosTable'
import SearchSelect, { SelectOption } from '@/presentation/components/ui/search-select'
import { useClienteSearch } from '@/infrastructure/hooks/use-api-search'
import { usePrecioRangoCarrito } from '@/application/hooks/use-precio-rango-carrito'

// DOMAIN LAYER
import type { Id } from '@/domain/entities/shared'
import type { Producto } from '@/domain/entities/productos'
import type { Cliente } from '@/domain/entities/clientes'

// APPLICATION LAYER
import { useBuscarProductos } from '@/application/hooks/use-buscar-productos'

// Tipos locales
interface ProformaDetalleLocal {
    id: number | string
    producto?: Producto
    producto_id: Id
    producto_nombre: string
    sku?: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    stock_disponible?: number
    peso?: number
    categoria?: string | null
    limite_venta?: number | null
    // ✅ NUEVO: Tipo de precio para cálculos de rango y recalcular totales
    tipo_precio_id?: number | string
    tipo_precio_nombre?: string
}


interface ProformaData {
    // ✅ Campos básicos
    id: number
    numero: string
    estado: string
    estado_proforma_id?: number

    // ✅ Cliente
    cliente_id: number
    cliente_nombre: string

    // ✅ Fechas
    fecha: string
    fecha_vencimiento: string
    fecha_entrega_solicitada?: string

    // ✅ Horario de entrega
    hora_entrega_solicitada?: string
    hora_entrega_solicitada_fin?: string

    // ✅ Montos
    subtotal: number
    impuesto: number
    total: number
    descuento?: number | string

    // ✅ Entrega
    tipo_entrega?: 'DELIVERY' | 'PICKUP'
    direccion_entrega_solicitada_id?: number | null
    direccion_entrega_confirmada_id?: number | null

    // ✅ Configuración
    canal: string
    canal_origen?: string
    politica_pago: string
    observaciones?: string

    // ✅ Asignaciones
    preventista_id?: number | null
    usuario_creador_id?: number
    usuario_creador?: {
        id: number
        name: string
        email: string
    }

    // ✅ Estado actual
    estado_logistica?: {
        id: number
        codigo: string
        nombre: string
        categoria: string
        icono: string
        color: string
    }
}

interface Props {
    clientes: Cliente[]
    productos: Producto[]
    almacenes: Array<{ id: number; nombre: string }>
    preventistas: any[]  // Usuarios con rol 'preventista'
    almacen_id_empresa?: number // ✅ NUEVO: ID del almacén principal de la empresa
    modo?: 'crear' | 'editar'  // ✅ NUEVO: Modo de operación
    proforma?: ProformaData  // ✅ NUEVO: Datos de proforma en modo edición
    detallesProforma?: ProformaDetalleLocal[]  // ✅ NUEVO: Detalles precargados
    direccionesCliente?: Array<{ id: number; direccion: string; localidad_id: number }>  // ✅ NUEVO: Direcciones del cliente
    default_tipo_precio_id?: number | string  // ✅ NUEVO: ID del tipo de precio por defecto (VENTA)
}

export default function ProformasCreate({
    clientes,
    productos: productosIniciales,
    almacenes,
    preventistas,
    almacen_id_empresa = 1,
    modo = 'crear',
    proforma,
    detallesProforma = [],
    direccionesCliente = [],
    default_tipo_precio_id = 1  // ✅ NUEVO: Tipo precio por defecto (fallback a 1)
}: Props) {
    console.log('🚀 ProformasCreate renderizado con props:', { clientes, productosIniciales, almacenes, preventistas, almacen_id_empresa, modo, proforma, detallesProforma, direccionesCliente });


    // ✅ NUEVO: Validaciones defensivas con useMemo para evitar renderizados múltiples
    const clientesSeguro = useMemo(() => clientes || [], [clientes])
    const productosSeguro = useMemo(() => productosIniciales || [], [productosIniciales])
    const almacenesSeguro = useMemo(() => almacenes || [], [almacenes])
    const preventistasSeguro = useMemo(() => preventistas || [], [preventistas])
    const almacenIdSeguro = useMemo(() => almacen_id_empresa || 1, [almacen_id_empresa])

    // Estados principales
    const [detalles, setDetalles] = useState<ProformaDetalleLocal[]>([])
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)


    // Estados para cliente con búsqueda mejorada
    const [clienteValue, setClienteValue] = useState<string | number | null>(null)
    const [clienteDisplay, setClienteDisplay] = useState<string>('')
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
    const [clienteSearchQuery, setClienteSearchQuery] = useState('')

    // Fechas
    const hoy = new Date()
    const [fecha, setFecha] = useState(
        `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    )

    const vencimiento = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
    const [fechaVencimiento, setFechaVencimiento] = useState(
        `${vencimiento.getFullYear()}-${String(vencimiento.getMonth() + 1).padStart(2, '0')}-${String(vencimiento.getDate()).padStart(2, '0')}`
    )

    // Otros campos
    const [canal, setCanal] = useState<'PRESENCIAL' | 'ONLINE' | 'TELEFONO'>('PRESENCIAL')
    const [requiereEnvio, setRequiereEnvio] = useState(false)

    // NUEVOS: Estado inicial y preventista
    const [estadoInicial, setEstadoInicial] = useState<'BORRADOR' | 'PENDIENTE'>('BORRADOR')
    const [preventistaId, setPreventistaId] = useState<number | null>(null)
    const [fechaEntregaSolicitada, setFechaEntregaSolicitada] = useState('')
    const [tipoEntrega, setTipoEntrega] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY')
    const [observaciones, setObservaciones] = useState('')
    const [politicaPago, setPoliticaPago] = useState<'CONTRA_ENTREGA' | 'ANTICIPADO_100'>('CONTRA_ENTREGA')

    // ✅ NUEVO: Función para transformar detalles del backend al formato que ProductosTable espera
    const transformarDetalles = (detalles: any[]) => {
        return detalles.map((d) => ({
            id: d.id,
            producto: d.producto, // ✅ Ya viene con la estructura correcta del backend (incluye precios array)
            producto_id: d.producto_id,
            producto_nombre: d.producto_nombre || d.producto?.nombre || '',
            sku: d.sku || d.producto?.sku || '',
            cantidad: parseFloat(d.cantidad),
            precio_unitario: parseFloat(d.precio_unitario),
            tipo_precio_id: d.tipo_precio_id, // ✅ ProductosTable lo usará para inicializar select + calcularCarrito
            tipo_precio_nombre: d.tipo_precio_nombre, // ✅ Nombre del tipo de precio para auditoría
            subtotal: d.subtotal ? parseFloat(d.subtotal) : parseFloat(d.cantidad) * parseFloat(d.precio_unitario),
            stock_disponible: d.stock_disponible || d.producto?.stock_disponible || 0,
            peso: d.peso || d.producto?.peso || 0,
            categoria: d.categoria || d.producto?.categoria || null,
            limite_venta: d.limite_venta || d.producto?.limite_venta || null,
        }))
    }

    // ✅ NUEVO: useEffect para precarga de datos en modo edición
    useEffect(() => {
        if (modo === 'editar' && proforma) {
            // ✅ Fechas
            setFecha(proforma.fecha)
            setFechaVencimiento(proforma.fecha_vencimiento)
            if (proforma.fecha_entrega_solicitada) {
                setFechaEntregaSolicitada(proforma.fecha_entrega_solicitada)
            }

            // ✅ Configuración
            setCanal(proforma.canal as any)
            setPoliticaPago(proforma.politica_pago as any)
            setObservaciones(proforma.observaciones || '')
            setTipoEntrega((proforma.tipo_entrega as 'DELIVERY' | 'PICKUP') || 'DELIVERY')

            // ✅ Horarios de entrega (si existen)
            if (proforma.hora_entrega_solicitada) {
                // Actualizar la hora si es necesario
            }

            // ✅ Asignaciones
            setEstadoInicial((proforma.estado || 'BORRADOR') as 'BORRADOR' | 'PENDIENTE')

            // ✅ Auto-asignar preventista si el usuario creador es preventista
            if (proforma.preventista_id) {
                setPreventistaId(proforma.preventista_id)
            } else if (proforma.usuario_creador_id && preventistasSeguro.some(p => p.id === proforma.usuario_creador_id)) {
                // Si no hay preventista asignado pero el usuario creador está en la lista de preventistas, asignar automáticamente
                setPreventistaId(proforma.usuario_creador_id)
            } else {
                setPreventistaId(null)
            }

            // ✅ Precarga de cliente
            const clienteEncontrado = clientesSeguro.find(c => c.id === proforma.cliente_id)
            if (clienteEncontrado) {
                setClienteValue(clienteEncontrado.id)
                setClienteDisplay(clienteEncontrado.nombre)
                setClienteSeleccionado(clienteEncontrado)
            }

            // ✅ Precarga de detalles - Transformar al formato correcto para ProductosTable
            if (detallesProforma && detallesProforma.length > 0) {
                const detallesTransformados = transformarDetalles(detallesProforma)
                setDetalles(detallesTransformados)
            }

            // ✅ Activar envío si hay fecha de entrega solicitada
            if (proforma.fecha_entrega_solicitada) {
                setRequiereEnvio(true)
            }
        }
    }, [modo, proforma, detallesProforma, clientesSeguro])

    // Búsqueda de productos
    const {
        searchTerm: searchProducto,
        setSearchTerm: setSearchProducto,
        productos: productosDisponibles,
        isLoading: isLoadingProductos,
        error: errorProductos
    } = useBuscarProductos({ debounceMs: 400 })

    // Búsqueda de cliente mejorada
    const {
        results: clientesSearchResults,
        search: buscarClientes,
        loading: cargandoClientesSearch,
        clear: limpiarBusquedaClientes
    } = useClienteSearch()

    // Cálculo de precios por rango
    const {
        calcularCarritoDebounced,
        getPrecioActualizado,
        carritoCalculado,  // ✅ NUEVO (2026-02-17): Extraer datos calculados para ProductosTable
        loading: isCalculandoRangos,
        error: errorRangos
    } = usePrecioRangoCarrito(400)

    // Calcular totales
    const calcularTotales = () => {
        const subtotal = detalles.reduce((sum, d) => {
            // ✅ CORREGIDO: Usar d.precio_unitario primero (que incluye cambios manuales inmediatos)
            // Solo usar getPrecioActualizado si es mejor (descuento por volumen)
            const precioActualizado = getPrecioActualizado(d.producto_id as number)
            const precioUnitario = d.precio_unitario ?? 0
            // Usar el precio más bajo entre el manual y el calculado (si existe)
            const precio = (precioActualizado && precioActualizado < precioUnitario) ? precioActualizado : precioUnitario
            return sum + (d.cantidad * precio)
        }, 0)
        return { subtotal, total: subtotal }
    }

    const totales = calcularTotales()

    // Handlers para ProductosTable
    const handleAgregarProducto = (producto: Producto) => {
        // ✅ CAMBIO 2026-02-13: Usar tipo_precio_id_recomendado para seleccionar el precio correcto
        const tipoPrecioRecomendado = (producto as any).tipo_precio_id_recomendado

        // Buscar el precio recomendado en el array de precios
        const preciosArray = (producto as any).precios || []
        const precioRecomendado = preciosArray.find((p: any) => p.tipo_precio_id === tipoPrecioRecomendado)

        // Usar el precio recomendado si existe, si no, usar el precio de venta, si no, usar precio base
        const precioUnitario = precioRecomendado?.precio ?? (producto.precio_venta as number) ?? (producto.precio_base as number) ?? 0

        console.debug('💰 [Agregar Producto] tipoPrecioRecomendado:', tipoPrecioRecomendado, 'precioUnitario:', precioUnitario)

        const nuevoDetalle: ProformaDetalleLocal = {
            id: Math.random(),
            producto,
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            sku: producto.sku,
            cantidad: 1,
            precio_unitario: precioUnitario,
            subtotal: precioUnitario,
            stock_disponible: (producto as any).stock_disponible || 0,
            peso: (producto as any).peso || 0,
            categoria: (producto as any).categoria || undefined,
            limite_venta: (producto as any).limite_venta || null,
            // ✅ NUEVO: Guardar tipo_precio_id para que handleUpdateDetalle pueda usarlo al recalcular
            tipo_precio_id: tipoPrecioRecomendado,
            tipo_precio_nombre: precioRecomendado?.nombre,
        }

        const nuevosDetalles = [...detalles, nuevoDetalle]
        setDetalles(nuevosDetalles)

        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: tipoPrecioRecomendado  // ✅ CAMBIO: Usar el tipo_precio_id recomendado
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    const handleUpdateDetalle = (index: number, field: keyof ProformaDetalleLocal, value: number | string) => {
        const nuevosDetalles = [...detalles]
        const detalle = nuevosDetalles[index]

        if (field === 'cantidad') {
            const cantidadValida = Math.max(0.01, isNaN(value as any) ? 0.01 : (value as number))
            detalle.cantidad = cantidadValida
            detalle.subtotal = cantidadValida * detalle.precio_unitario
        } else if (field === 'precio_unitario') {
            detalle.precio_unitario = value as number
            detalle.subtotal = detalle.cantidad * (value as number)
        } else {
            (detalle as any)[field] = value
        }

        setDetalles(nuevosDetalles)

        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: d.tipo_precio_id  // ✅ CORREGIDO: Usar el tipo_precio_id del detalle para cálculos de rango
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    const handleRemoveDetalle = (index: number) => {
        const nuevosDetalles = detalles.filter((_, i) => i !== index)
        setDetalles(nuevosDetalles)
    }

    const handleTotalsChange = (detalles: ProformaDetalleLocal[]) => {
        // Este handler se llamará desde ProductosTable cuando cambien los totales
        // Por ahora solo actualizamos el estado de detalles si es necesario
        setDetalles(detalles as any)
    }

    // ✅ NUEVO (2026-02-18): Handler para cuando el usuario selecciona/deselecciona items opcionales del combo
    const handleComboItemsChange = (detailIndex: number, items: any[]) => {
        console.log(`🎁 [Create.tsx] Combo items cambiaron en detalle ${detailIndex}:`, items);

        // Actualizar el detalles array con los combo_items_seleccionados
        const nuevosDetalles = [...detalles];

        if (nuevosDetalles[detailIndex]) {
            // ✅ CRÍTICO: Guardar los items seleccionados en combo_items_seleccionados
            nuevosDetalles[detailIndex] = {
                ...nuevosDetalles[detailIndex],
                combo_items_seleccionados: items.map(item => ({
                    id: item.id,
                    producto_id: item.producto_id,
                    producto_nombre: item.producto_nombre,
                    cantidad: item.cantidad,
                    es_obligatorio: item.es_obligatorio,
                    incluido: item.incluido
                }))
            } as any;

            console.log(`✅ [Create.tsx] Detalle ${detailIndex} actualizado con combo_items:`, nuevosDetalles[detailIndex]);
            setDetalles(nuevosDetalles);
        }
    }

    const handleSeleccionarCliente = (cliente: Cliente) => {
        setClienteValue(cliente.id)
        setClienteDisplay(cliente.nombre)
        setClienteSeleccionado(cliente)
        limpiarBusquedaClientes()
    }

    const handleCreateCliente = () => {
        setMostrarModalCliente(true)
    }

    const handleCrearProforma = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!clienteValue) {
            toast.error('Selecciona un cliente')
            return
        }

        if (detalles.length === 0) {
            toast.error('Agrega al menos un producto')
            return
        }

        setIsSubmitting(true)

        try {
            // ✅ NUEVO: Diferencia entre crear y editar
            if (modo === 'editar' && proforma) {
                // 📝 MODO EDICIÓN: Actualizar detalles y otros campos de proforma existente

                // 🔍 DEBUG: Mostrar estado actual de detalles antes del mapeo
                console.log('📝 [EDICIÓN] Estado actual de detalles:', JSON.stringify(detalles, null, 2));

                const detallesPayload = {
                    // ✅ Cliente (ahora actualizable en edición)
                    cliente_id: clienteValue,
                    detalles: detalles.map((d, index) => {
                        const detalle = {
                            producto_id: d.producto_id,
                            cantidad: d.cantidad,
                            precio_unitario: getPrecioActualizado(d.producto_id as number) ?? d.precio_unitario,
                            subtotal: d.cantidad * (getPrecioActualizado(d.producto_id as number) ?? d.precio_unitario),
                            // ✅ NUEVO: Incluir campos de combo que ya vienen en detalles
                            tipo_precio_id: d.tipo_precio_id,
                            tipo_precio_nombre: d.tipo_precio_nombre,
                            combo_items_seleccionados: (d as any).combo_items_seleccionados || [],
                        };
                        console.log(`📝 [EDICIÓN] Detalle ${index} (Producto ${d.producto_id}):`, detalle);
                        return detalle;
                    }),
                    // ✅ NUEVO: Incluir campos adicionales opcionales para edición completa
                    fecha: fecha || undefined,
                    fecha_vencimiento: fechaVencimiento || undefined,
                    fecha_entrega_solicitada: requiereEnvio ? fechaEntregaSolicitada : null,
                    tipo_entrega: tipoEntrega,
                    canal: canal,
                    politica_pago: politicaPago,
                    observaciones: observaciones || undefined,
                    // ✅ ACTUALIZACIÓN: Incluir estado y preventista en modo edición
                    estado_inicial: estadoInicial,
                    preventista_id: preventistaId,
                }

                // 🔍 DEBUG: Mostrar payload completo antes de enviar
                console.log('📤 [EDICIÓN] Payload COMPLETO que se enviará:', JSON.stringify(detallesPayload, null, 2));

                const response = await fetch(`/api/proformas/${proforma.id}/actualizar-detalles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(detallesPayload),
                })

                // 🔍 DEBUG: Mostrar respuesta del servidor
                const responseData = await response.json();
                console.log('📨 [EDICIÓN] Respuesta del servidor:', responseData);

                if (!response.ok) {
                    throw new Error(responseData.message || 'Error al actualizar proforma')
                }

                toast.success('✅ Proforma actualizada exitosamente')

                // Redirigir a la proforma actualizada
                setTimeout(() => {
                    window.location.href = `/proformas/${proforma.id}`
                }, 1000)
            } else {
                // ✅ MODO CREACIÓN: Crear nueva proforma

                // 🔍 DEBUG: Mostrar estado actual de detalles antes del mapeo
                console.log('✨ [CREACIÓN] Estado actual de detalles:', JSON.stringify(detalles, null, 2));

                const payload = {
                    cliente_id: clienteValue,
                    fecha,
                    fecha_vencimiento: fechaVencimiento,
                    canal,
                    requiere_envio: requiereEnvio,
                    fecha_entrega_solicitada: requiereEnvio ? fechaEntregaSolicitada : null,
                    tipo_entrega: tipoEntrega,
                    politica_pago: politicaPago,
                    observaciones,
                    detalles: detalles.map((d, index) => {
                        const detalle = {
                            producto_id: d.producto_id,
                            cantidad: d.cantidad,
                            precio_unitario: getPrecioActualizado(d.producto_id as number) ?? d.precio_unitario,
                            // ✅ NUEVO: Incluir campos de combo que ya vienen en detalles
                            tipo_precio_id: d.tipo_precio_id,
                            tipo_precio_nombre: d.tipo_precio_nombre,
                            combo_items_seleccionados: (d as any).combo_items_seleccionados || [],
                        };
                        console.log(`✨ [CREACIÓN] Detalle ${index} (Producto ${d.producto_id}):`, detalle);
                        return detalle;
                    }),
                    subtotal: totales.subtotal,
                    impuesto: 0,
                    total: totales.total,
                    estado_inicial: estadoInicial,  // ✅ NUEVO: BORRADOR o PENDIENTE
                    preventista_id: preventistaId,  // ✅ NUEVO: Preventista asignado
                }

                // 🔍 DEBUG: Mostrar payload completo antes de enviar
                console.log('📤 [CREACIÓN] Payload COMPLETO que se enviará:', JSON.stringify(payload, null, 2));

                const response = await fetch('/proformas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                })

                // 🔍 DEBUG: Mostrar respuesta del servidor
                const data = await response.json();
                console.log('📨 [CREACIÓN] Respuesta del servidor:', data);

                if (!response.ok) {
                    throw new Error(data.message || 'Error al crear proforma')
                }

                toast.success('✅ Proforma creada exitosamente')

                // Redirigir a la proforma
                setTimeout(() => {
                    window.location.href = `/proformas/${data.data.id}`
                }, 1000)
            }

        } catch (error) {
            console.error('❌ [ERROR] Error en handleCrearProforma:', error)
            toast.error(error instanceof Error ? error.message : modo === 'editar' ? 'Error al actualizar proforma' : 'Error al crear proforma')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
        <AppLayout breadcrumbs={[
            { title: 'Proformas', href: '/proformas' },
            { title: modo === 'editar' ? `Editar Proforma #${proforma?.numero}` : 'Nueva proforma', href: '#' }
        ]}>
            <Head title={modo === 'editar' ? `Editar Proforma #${proforma?.numero}` : 'Nueva proforma'} />

            <form onSubmit={handleCrearProforma} className="space-y-6 p-4">
                {/* Información básica */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                        <div>
                            <InputSearch
                                id="cliente_search"
                                label="Cliente"
                                value={clienteValue}
                                displayValue={clienteDisplay}
                                onSearch={buscarClientes}
                                onChange={(value, option) => {
                                    setClienteValue(value)
                                    if (option) {
                                        setClienteDisplay(option.label)
                                    } else {
                                        setClienteDisplay('')
                                    }
                                }}
                                placeholder="Buscar cliente por nombre, NIT/CI o teléfono..."
                                emptyText="No se encontraron clientes"
                                required={true}
                                allowScanner={false}
                                showCreateButton={true}
                                onCreateClick={handleCreateCliente}
                                createButtonText="Crear Cliente"
                                showCreateIconButton={true}
                                createIconButtonTitle="Crear nuevo cliente"
                                className="w-full"
                            />
                            {clienteSeleccionado && (
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    {clienteSeleccionado.telefono && <span>📱 {clienteSeleccionado.telefono}</span>}
                                    {clienteSeleccionado.nit && <span>{clienteSeleccionado.telefono ? ' • ' : ''}NIT: {clienteSeleccionado.nit}</span>}
                                    {clienteSeleccionado.email && <span>{clienteSeleccionado.telefono || clienteSeleccionado.nit ? ' • ' : ''}Email: {clienteSeleccionado.email}</span>}
                                </p>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                            <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                🚚 Información de Envío
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRequiereEnvio(!requiereEnvio)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${requiereEnvio
                                    ? 'bg-green-600 dark:bg-green-700'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                    } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${requiereEnvio ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                                <span className="ml-2 text-sm font-medium text-white">
                                    {requiereEnvio ? 'Sí' : 'No'}
                                </span>
                            </button>
                        </div>
                        </div>
                    </div>

                    {/* NUEVO: Sección Estado y Preventista */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Estado Inicial */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    📝 Estado Inicial
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition">
                                        <input
                                            type="radio"
                                            name="estado_inicial"
                                            value="BORRADOR"
                                            checked={estadoInicial === 'BORRADOR'}
                                            onChange={(e) => setEstadoInicial(e.target.value as 'BORRADOR' | 'PENDIENTE')}
                                            className="h-4 w-4 text-gray-600 focus:ring-gray-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Borrador
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                Sin reservar stock, editable
                                            </p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/20 cursor-pointer transition">
                                        <input
                                            type="radio"
                                            name="estado_inicial"
                                            value="PENDIENTE"
                                            checked={estadoInicial === 'PENDIENTE'}
                                            onChange={(e) => setEstadoInicial(e.target.value as 'BORRADOR' | 'PENDIENTE')}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Pendiente
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                Reserva stock inmediatamente
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Preventista */}
                            <div>
                                <label htmlFor="preventista" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    👤 Preventista (Opcional)
                                </label>
                                <select
                                    id="preventista"
                                    value={preventistaId || ''}
                                    onChange={(e) => setPreventistaId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">-- Seleccionar preventista --</option>
                                    {preventistas && preventistas.map((preventista: any) => (
                                        <option key={preventista.id} value={preventista.id}>
                                            {preventista.name} ({preventista.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Envío - SIEMPRE VISIBLE */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                        {/* Campos de envío - mostrar solo si requiere_envio es true */}
                        {requiereEnvio && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-4">
                                {/* Política de Pago */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        💳 Política de Pago
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 cursor-pointer transition">
                                            <input
                                                type="radio"
                                                name="politica_pago"
                                                value="CONTRA_ENTREGA"
                                                checked={politicaPago === 'CONTRA_ENTREGA'}
                                                onChange={(e) => setPoliticaPago(e.target.value as any)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Contra Entrega
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    El cliente paga al recibir el pedido
                                                </p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 cursor-pointer transition">
                                            <input
                                                type="radio"
                                                name="politica_pago"
                                                value="ANTICIPADO_100"
                                                checked={politicaPago === 'ANTICIPADO_100'}
                                                onChange={(e) => setPoliticaPago(e.target.value as any)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Anticipado 100%
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    El cliente paga antes de enviar
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="fecha-entrega" className="text-sm">Fecha Entrega Solicitada</Label>
                                        <Input
                                            id="fecha-entrega"
                                            type="date"
                                            value={fechaEntregaSolicitada}
                                            onChange={(e) => setFechaEntregaSolicitada(e.target.value)}
                                            required={requiereEnvio}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="tipo-entrega" className="text-sm">Tipo Entrega</Label>
                                        <Select value={tipoEntrega} onValueChange={(v) => setTipoEntrega(v as any)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DELIVERY">Delivery</SelectItem>
                                                <SelectItem value="PICKUP">Pickup</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Información adicional */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 space-y-4 mb-2 mt-4">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="fecha" className="text-sm">Fecha</Label>
                                <Input
                                    id="fecha"
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="fecha-vencimiento" className="text-sm">Fecha Vencimiento</Label>
                                <Input
                                    id="fecha-vencimiento"
                                    type="date"
                                    value={fechaVencimiento}
                                    onChange={(e) => setFechaVencimiento(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className='mb-2'>
                            <Label htmlFor="observaciones" className="text-sm">Observaciones</Label>
                            <Textarea
                                id="observaciones"
                                placeholder="Notas adicionales..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Card Productos - ProductosTable */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">🛒 Productos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProductosTable
                                productos={productosDisponibles}
                                detalles={detalles as DetalleProducto[]}
                                onAddProduct={handleAgregarProducto}
                                onUpdateDetail={handleUpdateDetalle}
                                onRemoveDetail={handleRemoveDetalle}
                                onTotalsChange={handleTotalsChange}
                                onComboItemsChange={handleComboItemsChange}
                                tipo="venta"
                                almacen_id={almacenIdSeguro}
                                isCalculatingPrices={isCalculandoRangos}
                                errors={undefined}
                                default_tipo_precio_id={default_tipo_precio_id}
                                carritoCalculado={carritoCalculado}
                                onDetallesActualizados={(nuevosDetalles) => {
                                    console.log('🔄 [proformas/Create.tsx] ProductosTable notificó cambios en detalles por rangos');
                                    setDetalles(nuevosDetalles);
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Card Resumen */}
                    {detalles.length > 0 && (
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 mt-2">
                            <CardHeader>
                                <CardTitle className="text-lg">📊 Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span className="font-semibold">Bs. {totales.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total:</span>
                                    <span>Bs. {totales.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-3 mt-2">
                        <a href="/proformas" className="flex-1">
                            <Button type="button" variant="outline" className="w-full">
                                Cancelar
                            </Button>
                        </a>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={!clienteValue || detalles.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {modo === 'editar' ? 'Guardando...' : 'Creando...'}
                                </>
                            ) : (
                                modo === 'editar' ? 'Guardar Cambios' : 'Crear Proforma'
                            )}
                        </Button>
                    </div>
                    </div>
                </form>

                {/* Modal crear cliente */}
                {mostrarModalCliente && (
                    <ModalCrearCliente
                        isOpen={mostrarModalCliente}
                        onClose={() => setMostrarModalCliente(false)}
                        onClienteCreated={(nuevoCliente) => {
                            handleSeleccionarCliente(nuevoCliente)
                            setMostrarModalCliente(false)
                        }}
                    />
                )}

                {isSubmitting && <LoadingOverlay />}
            </AppLayout>
        </>
    )
}
