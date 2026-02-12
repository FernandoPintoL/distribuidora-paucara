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
import { usePrecioRangoCarrito } from '@/application/hooks/use-precio-rango-carrito'
import { useClienteSearch } from '@/infrastructure/hooks/use-api-search'

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
}


interface Props {
    clientes: Cliente[]
    productos: Producto[]
    almacenes: any[]
}

export default function ProformasCreate({ clientes, productos: productosIniciales, almacenes }: Props) {
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
    const [fechaEntregaSolicitada, setFechaEntregaSolicitada] = useState('')
    const [tipoEntrega, setTipoEntrega] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY')
    const [observaciones, setObservaciones] = useState('')
    const [politicaPago, setPoliticaPago] = useState<'CONTRA_ENTREGA' | 'ANTICIPADO_100'>('CONTRA_ENTREGA')

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
        loading: isCalculandoRangos,
        error: errorRangos
    } = usePrecioRangoCarrito(400)

    // Calcular totales
    const calcularTotales = () => {
        const subtotal = detalles.reduce((sum, d) => {
            const precioActualizado = getPrecioActualizado(d.producto_id as number)
            const precio = precioActualizado ?? (d.precio_unitario ?? 0)
            return sum + (d.cantidad * precio)
        }, 0)
        return { subtotal, total: subtotal }
    }

    const totales = calcularTotales()

    // Handlers para ProductosTable
    const handleAgregarProducto = (producto: Producto) => {
        const precioUnitario = (producto.precio_base as number) || 0
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
        }

        const nuevosDetalles = [...detalles, nuevoDetalle]
        setDetalles(nuevosDetalles)

        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: undefined
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
            tipo_precio_id: undefined
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
                detalles: detalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    precio_unitario: getPrecioActualizado(d.producto_id as number) ?? d.precio_unitario
                })),
                subtotal: totales.subtotal,
                impuesto: 0,
                total: totales.total
            }

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

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Error al crear proforma')
            }

            const data = await response.json()
            toast.success('✅ Proforma creada exitosamente')

            // Redirigir a la proforma
            setTimeout(() => {
                window.location.href = `/proformas/${data.data.id}`
            }, 1000)

        } catch (error) {
            console.error('Error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al crear proforma')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
        <AppLayout breadcrumbs={[
            { title: 'Proformas', href: '/proformas' },
            { title: 'Nueva proforma', href: '#' }
        ]}>
            <Head title="Nueva proforma" />

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
                            <Label htmlFor="fecha" className="text-sm">Fecha</Label>
                            <Input
                                id="fecha"
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Sección de Envío - SIEMPRE VISIBLE */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
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
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 space-y-4">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

                            <div>
                                <Label htmlFor="canal" className="text-sm">Canal</Label>
                                <Select value={canal} onValueChange={(v) => setCanal(v as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                                            <SelectItem value="ONLINE">Online</SelectItem>
                                            <SelectItem value="TELEFONO">Teléfono</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                        </div>

                        <div>
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
                                tipo="venta"
                                almacen_id={undefined}
                                isCalculatingPrices={isCalculandoRangos}
                                errors={undefined}
                            />
                        </CardContent>
                    </Card>

                    {/* Card Resumen */}
                    {detalles.length > 0 && (
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
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
                    <div className="flex gap-3">
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
                                    Creando...
                                </>
                            ) : (
                                'Crear Proforma'
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
