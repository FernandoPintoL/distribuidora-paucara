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

interface ProductSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productos: Producto[]
    searchTerm: string
    onSearchChange: (term: string) => void
    onSelectProducto: (detalle: ProformaDetalleLocal) => void
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

    const productosFiltrados = productos

    const handleAgregarProductoSeleccionado = () => {
        if (!selectedProducto) return

        const precioUnitario = (selectedProducto.precio_base as number) || 0

        const nuevoDetalle = {
            id: Math.random(),
            producto: selectedProducto,
            producto_id: selectedProducto.id,
            producto_nombre: selectedProducto.nombre,
            sku: selectedProducto.sku,
            cantidad: Math.max(0.01, cantidad),
            precio_unitario: precioUnitario,
            subtotal: (Math.max(0.01, cantidad)) * precioUnitario,
            stock_disponible: (selectedProducto as any).stock_disponible || 0,
            peso: (selectedProducto as any).peso || 0,
            categoria: (selectedProducto as any).categoria || undefined,
            limite_venta: (selectedProducto as any).limite_venta || null,
            esNuevo: true
        }

        onSelectProducto(nuevoDetalle)

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
                    {/* Búsqueda */}
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

                    {/* Error */}
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
                                    className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors text-sm ${selectedProducto?.id === producto.id ? 'bg-accent' : ''}`}
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

                                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                                {(producto.sku || producto.codigo) && (
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground">SKU: </span>
                                                        <span className="font-mono text-foreground">{producto.sku || producto.codigo}</span>
                                                    </div>
                                                )}

                                                {(producto.codigo_barras || (Array.isArray(producto.codigos_barra) && producto.codigos_barra?.length > 0)) && (
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground">Código: </span>
                                                        <span className="font-mono text-foreground">
                                                            {producto.codigo_barras || (Array.isArray(producto.codigos_barra) ? producto.codigos_barra[0]?.codigo : '')}
                                                        </span>
                                                    </div>
                                                )}

                                                {producto.marca?.nombre && (
                                                    <div>
                                                        <span className="text-muted-foreground">Marca: </span>
                                                        <span className="text-foreground">{producto.marca.nombre}</span>
                                                    </div>
                                                )}

                                                {producto.unidad?.nombre && (
                                                    <div>
                                                        <span className="text-muted-foreground">Unidad: </span>
                                                        <span className="text-foreground">{producto.unidad.nombre}</span>
                                                    </div>
                                                )}

                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground">Stock: </span>
                                                    <span className={(producto.cantidad_disponible as number) || (producto.stock_disponible as number) ? 'text-green-600 font-medium' : 'text-red-600'}>
                                                        {((producto.cantidad_disponible as number) || (producto.stock_disponible as number) || 0)}
                                                    </span>
                                                </div>
                                            </div>

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
                            <p className="text-muted-foreground">No se encontraron productos para "{searchTerm}"</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Intenta con otro término: nombre, SKU, código de barra, marca, etc.
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-4 text-center bg-muted/30 text-sm">
                            <p className="text-muted-foreground">Comienza a escribir para buscar productos</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Puedes buscar por: nombre, SKU, código de barra, marca, etc.
                            </p>
                        </div>
                    )}

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

interface Props {
    clientes: Cliente[]
    productos: Producto[]
    almacenes: any[]
}

export default function ProformasCreate({ clientes, productos: productosIniciales, almacenes }: Props) {
    // Estados principales
    const [detalles, setDetalles] = useState<ProformaDetalleLocal[]>([])
    const [clienteId, setClienteId] = useState<number | null>(null)
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

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
    const [showAgregarProductoDialog, setShowAgregarProductoDialog] = useState(false)

    // Búsqueda de productos
    const {
        searchTerm: searchProducto,
        setSearchTerm: setSearchProducto,
        productos: productosDisponibles,
        isLoading: isLoadingProductos,
        error: errorProductos
    } = useBuscarProductos({ debounceMs: 400 })

    // Búsqueda de cliente
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

    // Handlers
    const handleAgregarProducto = (detalle: ProformaDetalleLocal) => {
        const nuevosDetalles = [...detalles, detalle]
        setDetalles(nuevosDetalles)
        setShowAgregarProductoDialog(false)

        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: undefined
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    const handleEliminarProducto = (index: number) => {
        const nuevosDetalles = detalles.filter((_, i) => i !== index)
        setDetalles(nuevosDetalles)
    }

    const handleEditarCantidad = (index: number, cantidad: number) => {
        const nuevosDetalles = [...detalles]
        const cantidadValida = Math.max(0.01, isNaN(cantidad) ? 0.01 : cantidad)
        nuevosDetalles[index].cantidad = cantidadValida
        nuevosDetalles[index].subtotal = cantidadValida * nuevosDetalles[index].precio_unitario
        setDetalles(nuevosDetalles)

        const itemsParaCalcular = nuevosDetalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            tipo_precio_id: undefined
        }))
        calcularCarritoDebounced(itemsParaCalcular)
    }

    const handleSeleccionarCliente = (cliente: Cliente) => {
        setClienteId(cliente.id)
        setClienteSeleccionado(cliente)
        limpiarBusquedaClientes()
    }

    const handleCrearProforma = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!clienteId) {
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
                cliente_id: clienteId,
                fecha,
                fecha_vencimiento: fechaVencimiento,
                canal,
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
            <Head title="Nueva Proforma" />
            <AppLayout>
                <div className="space-y-6">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <a href="/proformas" className="hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Proformas
                        </a>
                        <span>/</span>
                        <span>Nueva Proforma</span>
                    </div>

                    {/* Encabezado */}
                    <div>
                        <h1 className="text-3xl font-bold">Nueva Proforma</h1>
                        <p className="text-muted-foreground mt-2">Crea una nueva cotización para tu cliente</p>
                    </div>

                    <form onSubmit={handleCrearProforma} className="space-y-6">
                        {/* Card Cliente */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    👤 Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {clienteSeleccionado ? (
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/5">
                                        <div>
                                            <p className="font-semibold">{clienteSeleccionado.nombre}</p>
                                            <p className="text-sm text-muted-foreground">{clienteSeleccionado.nit}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setClienteId(null)
                                                setClienteSeleccionado(null)
                                                limpiarBusquedaClientes()
                                            }}
                                        >
                                            Cambiar
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <InputSearch
                                            placeholder="Busca un cliente por nombre, NIT..."
                                            onSearch={buscarClientes}
                                            loading={cargandoClientesSearch}
                                            results={clientesSearchResults}
                                            onSelect={(cliente) => handleSeleccionarCliente(cliente)}
                                            renderResult={(cliente) => (
                                                <div>
                                                    <p className="font-semibold">{cliente.nombre}</p>
                                                    <p className="text-sm text-muted-foreground">{cliente.nit}</p>
                                                </div>
                                            )}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setMostrarModalCliente(true)}
                                            >
                                                + Crear Cliente
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Card Información */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">📋 Información de Proforma</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
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

                                <div>
                                    <Label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={requiereEnvio}
                                            onChange={(e) => setRequiereEnvio(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm">Requiere Envío</span>
                                    </Label>
                                </div>

                                {requiereEnvio && (
                                    <div className="space-y-4">
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
                            </CardContent>
                        </Card>

                        {/* Card Productos */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">🛒 Productos</CardTitle>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setShowAgregarProductoDialog(true)}
                                    disabled={!clienteId}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Agregar Producto
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {detalles.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead className="w-20">SKU</TableHead>
                                                    <TableHead className="text-right w-24">Cantidad</TableHead>
                                                    <TableHead className="text-right w-24">Precio</TableHead>
                                                    <TableHead className="text-right w-24">Subtotal</TableHead>
                                                    <TableHead className="text-center w-12">Acción</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detalles.map((detalle, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{detalle.producto_nombre}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{detalle.sku}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={detalle.cantidad}
                                                                onChange={(e) => handleEditarCantidad(index, parseFloat(e.target.value))}
                                                                className="w-20 text-right text-sm"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            Bs. {detalle.precio_unitario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            Bs. {detalle.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEliminarProducto(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No hay productos agregados. Haz click en "Agregar Producto" para comenzar.</p>
                                    </div>
                                )}
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
                                disabled={!clienteId || detalles.length === 0 || isSubmitting}
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
                    </form>
                </div>

                {/* Dialog seleccionar producto */}
                <ProductSelectionDialog
                    open={showAgregarProductoDialog}
                    onOpenChange={setShowAgregarProductoDialog}
                    productos={productosDisponibles}
                    searchTerm={searchProducto}
                    onSearchChange={setSearchProducto}
                    onSelectProducto={handleAgregarProducto}
                    isLoading={isLoadingProductos}
                    error={errorProductos}
                />

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
