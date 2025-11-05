import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useState, useEffect, useMemo } from 'react';
import VentaPreviewModal from '@/presentation/components/VentaPreviewModal';
import StockManager from '@/presentation/components/ventas/stock-manager';

// Importar componentes y hooks adicionales
import InputSearch from '@/presentation/components/ui/input-search';
import SearchSelect, { SelectOption } from '@/presentation/components/ui/search-select';
import { useClienteSearch } from '@/infrastructure/hooks/use-api-search';
import ModalCrearCliente from '@/presentation/components/ui/modal-crear-cliente';
import ProductosTable from '@/presentation/components/ProductosTable';

// Importar servicios adicionales
import { NotificationService } from '@/infrastructure/services/notification.service';

// Importar tipos del domain y servicio
import type {
    Producto,
    Moneda,
    EstadoDocumento,
    VentaFormData,
    DetalleVentaFormData,
    Venta
} from '@/domain/entities/ventas';
import type { TipoPago } from '@/domain/entities/tipos-pago';
import type { TipoDocumento } from '@/domain/entities/tipos-documento';
import type { Cliente } from '@/domain/entities/clientes';

import ventasService from '@/infrastructure/services/ventas.service';
import { formatCurrency } from '@/lib/utils';

// Interfaz para detalles con producto embebido (solo para la UI)
interface DetalleVentaConProducto extends DetalleVentaFormData {
    producto?: Producto;
}

interface PageProps extends InertiaPageProps {
    clientes: Cliente[];
    productos: Producto[];
    monedas: Moneda[];
    estados_documento: EstadoDocumento[];
    tipos_pago: TipoPago[];
    tipos_documento: TipoDocumento[];
    auth: {
        user: {
            id: number;
            name: string;
        };
    };
    venta?: Venta;
}

export default function VentaForm() {
    const { clientes, productos, monedas, estados_documento, tipos_pago, tipos_documento, auth, venta } = usePage<PageProps>().props;
    const isEditing = Boolean(venta);

    // Validaciones defensivas para evitar errores usando useMemo
    const clientesSeguro = useMemo(() => clientes || [], [clientes]);
    const productosSeguro = useMemo(() => productos || [], [productos]);
    const monedasSeguro = useMemo(() => monedas || [], [monedas]);
    const estadosSeguro = useMemo(() => estados_documento || [], [estados_documento]);
    const tiposPagoSeguro = useMemo(() => tipos_pago || [], [tipos_pago]);
    const tiposDocumentoSeguro = useMemo(() => tipos_documento || [], [tipos_documento]);

    // Opciones para SearchSelect
    const tiposPagoOptions: SelectOption[] = useMemo(() =>
        tiposPagoSeguro.map(tipo => ({
            value: tipo.id,
            label: tipo.nombre,
            description: tipo.codigo
        })), [tiposPagoSeguro]
    );

    const tiposDocumentoOptions: SelectOption[] = useMemo(() =>
        tiposDocumentoSeguro.map(tipo => ({
            value: tipo.id,
            label: tipo.nombre,
            description: tipo.codigo
        })), [tiposDocumentoSeguro]
    );

    const canalOrigenOptions: SelectOption[] = useMemo(() => [
        { value: 'PRESENCIAL', label: 'Presencial', description: 'Venta en tienda física' },
        { value: 'WEB', label: 'Web', description: 'Venta a través del sitio web' },
        { value: 'APP_EXTERNA', label: 'App Externa', description: 'Venta desde aplicación externa' }
    ], []);

    const [detallesWithProducts, setDetallesWithProducts] = useState<DetalleVentaConProducto[]>([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [stockValido, setStockValido] = useState(true);

    // Estado para InputSearch de cliente
    const [clienteValue, setClienteValue] = useState<string | number | null>(null);
    const [clienteDisplay, setClienteDisplay] = useState<string>('');

    // Hook para búsqueda de clientes
    const { search: searchClientes } = useClienteSearch();

    // Estado para el modal de crear cliente
    const [showCreateClienteModal, setShowCreateClienteModal] = useState(false);
    const [clienteSearchQuery, setClienteSearchQuery] = useState('');

    const { data, setData, processing, errors } = useForm<VentaFormData>({
        numero: venta?.numero || '', // Solo para edición, se genera automáticamente para nuevas ventas
        fecha: venta?.fecha || new Date().toISOString().split('T')[0],
        subtotal: venta?.subtotal || 0,
        descuento: venta?.descuento || 0,
        impuesto: venta?.impuesto || 0,
        total: venta?.total || 0,
        observaciones: venta?.observaciones || '',
        cliente_id: venta?.cliente_id || 0,
        usuario_id: auth?.user?.id || 0,
        estado_documento_id: venta?.estado_documento_id || (estadosSeguro[0]?.id || 0),
        moneda_id: venta?.moneda_id || 0, // Solo para edición, se establece automáticamente a BOB para nuevas ventas
        proforma_id: venta?.proforma_id || undefined,
        tipo_pago_id: venta?.tipo_pago_id || 1, // EFECTIVO por defecto
        tipo_documento_id: venta?.tipo_documento_id || 3, // REC por defecto
        requiere_envio: venta?.requiere_envio || false,
        canal_origen: venta?.canal_origen || 'PRESENCIAL',
        estado_logistico: venta?.estado_logistico || undefined,
        detalles: venta?.detalles?.map((d) => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento || 0,
            subtotal: d.subtotal
        })) || []
    });

    // Inicializar detalles con productos
    useEffect(() => {
        if (venta?.detalles) {
            setDetallesWithProducts(venta.detalles.map((d) => ({
                id: d.id,
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                descuento: d.descuento || 0,
                subtotal: d.subtotal,
                producto: d.producto
            })));
        }
    }, [venta]);

    // Sincronizar el estado del InputSearch con los datos del formulario
    useEffect(() => {
        if (data.cliente_id !== clienteValue) {
            setClienteValue(data.cliente_id);
        }
    }, [data.cliente_id, clienteValue]);

    // Inicializar el display del cliente cuando se carga la venta existente
    useEffect(() => {
        if (venta?.cliente && !clienteDisplay) {
            setClienteDisplay(venta.cliente.nombre + (venta.cliente.nit ? ` (${venta.cliente.nit})` : ''));
            setClienteValue(venta.cliente.id);
        }
    }, [venta?.cliente, clienteDisplay]);

    // Función para manejar la creación de cliente
    const handleCreateCliente = (searchQuery: string) => {
        setClienteSearchQuery(searchQuery);
        setShowCreateClienteModal(true);
    };

    // Función para manejar cuando se crea un cliente exitosamente
    const handleClienteCreated = (cliente: Cliente) => {
        // Actualizar el valor del cliente en el formulario
        setData('cliente_id', cliente.id);

        // Actualizar el estado del InputSearch
        setClienteValue(cliente.id);
        setClienteDisplay(cliente.nombre + (cliente.nit ? ` (${cliente.nit})` : ''));

        // Crear una descripción completa del cliente para mostrar en la notificación
        const descripcionCliente = [
            cliente.nombre,
            cliente.nit ? `NIT/CI: ${cliente.nit}` : '',
            cliente.telefono ? `Tel: ${cliente.telefono}` : '',
            cliente.email ? `Email: ${cliente.email}` : ''
        ].filter(Boolean).join(' • ');

        // Mostrar notificación detallada del cliente creado y seleccionado
        try {
            NotificationService.success(
                `✅ Cliente creado y seleccionado: ${descripcionCliente}`
            );
        } catch (error) {
            console.error('Error en NotificationService:', error);
            // Fallback: mostrar mensaje básico
            console.log(`✅ Cliente creado y seleccionado: ${descripcionCliente}`);
        }

        // Limpiar la query de búsqueda ya que ahora tenemos el cliente seleccionado
        setClienteSearchQuery('');
    };

    const addProductToDetail = (producto: Producto) => {
        // Verificar si el producto ya está en los detalles
        const existingDetail = detallesWithProducts.find(d => d.producto_id === producto.id);

        if (existingDetail) {
            NotificationService.error('El producto ya está agregado a la venta');
            return;
        }

        const newDetail: DetalleVentaConProducto = {
            producto_id: producto.id,
            cantidad: 1,
            precio_unitario: producto.precio_venta || 0,
            descuento: 0,
            subtotal: producto.precio_venta || 0,
            producto: producto
        };

        const newDetalles = [...detallesWithProducts, newDetail];
        setDetallesWithProducts(newDetalles);

        // Actualizar data form
        setData('detalles', newDetalles.map(d => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
            subtotal: d.subtotal
        })));

        calculateTotals(newDetalles);
    };

    const updateDetail = (index: number, field: keyof DetalleVentaFormData, value: number | string) => {
        const updatedDetalles = [...detallesWithProducts];
        const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        updatedDetalles[index] = { ...updatedDetalles[index], [field]: numericValue };

        // Recalcular subtotal del detalle
        if (field === 'cantidad' || field === 'precio_unitario' || field === 'descuento') {
            const cantidad = field === 'cantidad' ? numericValue : updatedDetalles[index].cantidad;
            const precio = field === 'precio_unitario' ? numericValue : updatedDetalles[index].precio_unitario;
            const descuento = field === 'descuento' ? numericValue : updatedDetalles[index].descuento;

            updatedDetalles[index].subtotal = (Number(cantidad) * Number(precio)) - Number(descuento);
        }

        setDetallesWithProducts(updatedDetalles);

        // Actualizar data form
        setData('detalles', updatedDetalles.map(d => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
            subtotal: d.subtotal
        })));

        calculateTotals(updatedDetalles);
    };

    const removeDetail = (index: number) => {
        const updatedDetalles = detallesWithProducts.filter((_, i) => i !== index);
        setDetallesWithProducts(updatedDetalles);

        // Actualizar data form
        setData('detalles', updatedDetalles.map(d => ({
            id: d.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            descuento: d.descuento,
            subtotal: d.subtotal
        })));

        calculateTotals(updatedDetalles);
    };

    const calculateTotals = (detalles: DetalleVentaConProducto[]) => {
        const subtotal = detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
        const descuentoGeneral = data.descuento || 0;
        const impuesto = data.impuesto || 0;
        // Por ahora no se suma impuesto al total
        const total = subtotal - descuentoGeneral;

        setData(prev => ({
            ...prev,
            subtotal: subtotal,
            total: total
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar stock antes de continuar
        if (!stockValido) {
            NotificationService.error('No se puede proceder con la venta debido a stock insuficiente');
            return;
        }

        // Validar usando el servicio
        const validationErrors = await ventasService.validateData(data);
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => NotificationService.error(error));
            return;
        }

        // Mostrar modal de vista previa
        setShowPreviewModal(true);
    };

    const handleConfirmSubmit = () => {
        setShowPreviewModal(false);

        const submitData = {
            ...data,
            detalles: data.detalles.map(d => ({
                id: d.id,
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                descuento: d.descuento,
                subtotal: d.subtotal
            }))
        };

        if (isEditing && venta) {
            ventasService.update(venta.id, submitData, {
                onSuccess: () => {
                    NotificationService.success('Venta actualizada exitosamente');
                }
            });
        } else {
            ventasService.store(submitData, {
                onSuccess: () => {
                    NotificationService.success('Venta creada exitosamente');
                }
            });
        }
    };

    // Obtener entidades relacionadas para el modal
    const selectedCliente = clientesSeguro.find(c => c.id === data.cliente_id);
    const selectedClienteForModal = selectedCliente ? {
        id: selectedCliente.id,
        nombre: selectedCliente.nombre,
        nit: selectedCliente.nit || undefined,
        telefono: selectedCliente.telefono || undefined,
        email: selectedCliente.email || undefined,
        direccion: selectedCliente.direccion || undefined,
    } : undefined;
    const selectedMoneda = monedasSeguro.find(m => m.id === data.moneda_id);
    const selectedEstado = estadosSeguro.find(e => e.id === data.estado_documento_id);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Ventas', href: '/ventas' },
            { title: isEditing ? 'Editar venta' : 'Nueva venta', href: '#' }
        ]}>
            <Head title={isEditing ? 'Editar venta' : 'Nueva venta'} />

            <form onSubmit={handleSubmit} className="space-y-6 p-4">
                {/* Información básica */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Información básica
                    </h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Campo número oculto - se genera automáticamente */}
                        <input
                            type="hidden"
                            value={data.numero}
                            onChange={(e) => setData('numero', e.target.value)}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                value={data.fecha}
                                onChange={(e) => setData('fecha', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            />
                            {errors.fecha && <p className="mt-1 text-sm text-red-600">{errors.fecha}</p>}
                        </div>
                        <div>
                            {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cliente *
                            </label> */}
                            <InputSearch
                                id="cliente_search"
                                label="Cliente"
                                value={clienteValue}
                                displayValue={clienteDisplay}
                                onSearch={searchClientes}
                                onChange={(value, option) => {
                                    setData('cliente_id', value || 0);
                                    setClienteValue(value);
                                    if (option) {
                                        setClienteDisplay(option.label);
                                    } else {
                                        setClienteDisplay('');
                                    }
                                }}
                                placeholder="Buscar cliente por nombre, NIT o teléfono..."
                                emptyText="No se encontraron clientes"
                                error={errors.cliente_id}
                                required={true}
                                allowScanner={false}
                                showCreateButton={true}
                                onCreateClick={handleCreateCliente}
                                createButtonText="Crear Cliente"
                                showCreateIconButton={true}
                                createIconButtonTitle="Crear nuevo cliente"
                                className="w-full"
                            />
                            {errors.cliente_id && <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>}
                        </div>

                        {/* Campo moneda oculto - se establece automáticamente a BOB */}
                        <input
                            type="hidden"
                            value={data.moneda_id}
                            onChange={(e) => setData('moneda_id', Number(e.target.value))}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Observaciones
                            </label>
                            <textarea
                                value={data.observaciones}
                                onChange={(e) => setData('observaciones', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                placeholder="Observaciones adicionales..."
                            />
                        </div>
                    </div>

                    {/* Campos adicionales */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                            Información adicional
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <SearchSelect
                                    label="Tipo de Pago"
                                    placeholder="Seleccionar tipo de pago"
                                    value={data.tipo_pago_id || ''}
                                    options={tiposPagoOptions}
                                    onChange={(value) => setData('tipo_pago_id', value ? Number(value) : undefined)}
                                    required
                                    error={errors.tipo_pago_id}
                                    searchPlaceholder="Buscar tipo de pago..."
                                    emptyText="No se encontraron tipos de pago"
                                />
                            </div>
                            <div>
                                <SearchSelect
                                    label="Tipo de Documento"
                                    placeholder="Seleccionar tipo de documento"
                                    value={data.tipo_documento_id || ''}
                                    options={tiposDocumentoOptions}
                                    onChange={(value) => setData('tipo_documento_id', value ? Number(value) : undefined)}
                                    required
                                    error={errors.tipo_documento_id}
                                    searchPlaceholder="Buscar tipo de documento..."
                                    emptyText="No se encontraron tipos de documento"
                                />
                            </div>

                            <div>
                                <SearchSelect
                                    label="Canal de Origen"
                                    placeholder="Seleccionar canal de origen"
                                    value={data.canal_origen || 'PRESENCIAL'}
                                    options={canalOrigenOptions}
                                    onChange={(value) => setData('canal_origen', value as any)}
                                    required
                                    error={errors.canal_origen}
                                    searchPlaceholder="Buscar canal..."
                                    emptyText="No se encontraron canales"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Requiere Envío
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.requiere_envio || false}
                                        onChange={(e: any) => setData('requiere_envio', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        Esta venta requiere envío
                                    </span>
                                </div>
                                {errors.requiere_envio && <p className="mt-1 text-sm text-red-600">{errors.requiere_envio}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Productos */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Productos
                    </h2>

                    <ProductosTable
                        productos={productosSeguro}
                        detalles={detallesWithProducts}
                        onAddProduct={addProductToDetail}
                        onUpdateDetail={updateDetail}
                        onRemoveDetail={removeDetail}
                        onTotalsChange={calculateTotals}
                        tipo="venta"
                        errors={errors}
                        showLoteFields={false}
                    />
                </div>

                {/* Gestión de Stock */}
                {detallesWithProducts.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Gestión de Stock
                        </h2>
                        <StockManager
                            productosEnCarrito={detallesWithProducts.map(d => ({
                                producto_id: Number(d.producto_id),
                                cantidad: d.cantidad,
                                nombre: d.producto?.nombre
                            }))}
                            almacenId={1} // TODO: Agregar selección de almacén
                            onStockChange={setStockValido}
                        />
                    </div>
                )}

                {/* Totales */}
                {detallesWithProducts.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Totales
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descuento general
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.descuento}
                                    onChange={(e) => {
                                        const descuento = Number(e.target.value);
                                        setData('descuento', descuento);
                                        // Por ahora no se suma impuesto al total
                                        setData('total', data.subtotal - descuento);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>

                            {/* Campo de impuesto oculto - por ahora no se requiere */}
                            <div style={{ display: 'none' }}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Impuesto
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.impuesto}
                                    onChange={(e) => {
                                        const impuesto = Number(e.target.value);
                                        setData('impuesto', impuesto);
                                        // Por ahora no se suma impuesto al total
                                        setData('total', data.subtotal - data.descuento);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Estado
                                </label>
                                <select
                                    value={data.estado_documento_id}
                                    onChange={(e) => setData('estado_documento_id', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                >
                                    {estadosSeguro.map((estado) => (
                                        <option key={estado.id} value={estado.id}>
                                            {estado.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                            <div className="flex justify-between items-center text-lg font-medium">
                                <span className="text-gray-900 dark:text-white">Subtotal:</span>
                                <span className="text-gray-900 dark:text-white">{formatCurrency(data.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold mt-2">
                                <span className="text-gray-900 dark:text-white">Total:</span>
                                <span className="text-gray-900 dark:text-white">{formatCurrency(data.total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Acciones */}
                <div className="flex justify-end space-x-3">
                    <Link
                        href="/ventas"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={processing || detallesWithProducts.length === 0 || !stockValido}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${!stockValido
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                            }`}
                    >
                        {processing
                            ? 'Guardando...'
                            : !stockValido
                                ? 'Stock insuficiente'
                                : (isEditing ? 'Actualizar venta' : 'Crear venta')
                        }
                    </button>
                </div>
            </form>

            {/* Modal de Vista Previa */}
            <VentaPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                onConfirm={handleConfirmSubmit}
                data={data}
                detallesWithProducts={detallesWithProducts}
                cliente={selectedClienteForModal}
                moneda={selectedMoneda}
                estadoDocumento={selectedEstado}
                processing={processing}
                isEditing={isEditing}
            />

            {/* Modal para crear cliente */}
            <ModalCrearCliente
                isOpen={showCreateClienteModal}
                onClose={() => setShowCreateClienteModal(false)}
                onClienteCreated={handleClienteCreated}
                searchQuery={clienteSearchQuery}
            />
        </AppLayout >
    );
}
