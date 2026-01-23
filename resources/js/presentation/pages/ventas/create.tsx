import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useState, useEffect, useMemo } from 'react';
import { useCajaWarning } from '@/application/hooks/use-caja-warning';
import { AlertSinCaja } from '@/presentation/components/cajas/alert-sin-caja';
import VentaPreviewModal from '@/presentation/components/VentaPreviewModal';
import StockManager from '@/presentation/components/ventas/stock-manager';

// Importar componentes y hooks adicionales
import InputSearch from '@/presentation/components/ui/input-search';
import SearchSelect, { SelectOption } from '@/presentation/components/ui/search-select';
import { useClienteSearch } from '@/infrastructure/hooks/use-api-search';
import ModalCrearCliente from '@/presentation/components/ui/modal-crear-cliente';
import ProductosTable, { DetalleProducto } from '@/presentation/components/ProductosTable';

// Importar servicios adicionales
import { NotificationService } from '@/infrastructure/services/notification.service';
import { usePrecioRangoCarrito } from '@/application/hooks/use-precio-rango-carrito';

// Importar tipos del domain y servicio
import type {
    Producto,
    Moneda,
    EstadoDocumento,
    DetalleVentaFormData,
    Venta
} from '@/domain/entities/ventas';
import type { TipoPago } from '@/domain/entities/tipos-pago';
import type { TipoDocumento } from '@/domain/entities/tipos-documento';
import type { Cliente } from '@/domain/entities/clientes';

import ventasService from '@/infrastructure/services/ventas.service';
import { formatCurrency } from '@/lib/utils';

interface PageProps extends InertiaPageProps {
    clientes: Cliente[];
    productos: Producto[]; // ✅ Ahora array vacío (búsqueda via API)
    almacenes: Array<{ id: number; nombre: string }>; // ✅ NUEVO: Lista de almacenes
    monedas: Moneda[];
    estados_documento: EstadoDocumento[];
    tipos_pago: TipoPago[];
    tipos_documento: TipoDocumento[];
    almacen_id_empresa: number; // ✅ NUEVO: Almacén de la empresa principal
    auth: {
        user: {
            id: number;
            name: string;
        };
    };
    venta?: Venta;
}

export default function VentaForm() {
    const { clientes, productos, monedas, estados_documento, tipos_pago, tipos_documento, almacen_id_empresa, auth, venta } = usePage<PageProps>().props;
    const isEditing = Boolean(venta);
    const { shouldShowBanner } = useCajaWarning();

    // Validaciones defensivas para evitar errores usando useMemo
    const clientesSeguro = useMemo(() => clientes || [], [clientes]);
    const productosSeguro = useMemo(() => productos || [], [productos]);
    const monedasSeguro = useMemo(() => monedas || [], [monedas]);
    const estadosSeguro = useMemo(() => estados_documento || [], [estados_documento]);
    const tiposPagoSeguro = useMemo(() => tipos_pago || [], [tipos_pago]);
    const tiposDocumentoSeguro = useMemo(() => tipos_documento || [], [tipos_documento]);

    // ✅ Obtener el ID del documento Recibo (REC) por defecto
    const tipoDocumentoReciboId = useMemo(() => {
        const recibo = tiposDocumentoSeguro.find(doc => doc.codigo === 'REC' || doc.nombre === 'Recibo');
        return recibo?.id || 3; // Fallback a 3 si no se encuentra
    }, [tiposDocumentoSeguro]);

    // ✅ Obtener el ID del estado APROBADO por defecto
    const estadoDocumentoAprobadoId = useMemo(() => {
        const aprobado = estadosSeguro.find(estado => estado.codigo === 'APROBADO');
        return aprobado?.id || (estadosSeguro[0]?.id || 0); // Fallback al primer estado
    }, [estadosSeguro]);

    // Mapeo de iconos para tipos de pago
    const getIconoEmoji = (icono?: string): string => {
        return {
            'Banknote': '💵',
            'Send': '📤',
            'CreditCard': '💳',
            'DollarSign': '💰',
        }[icono || ''] || '💰';
    };

    // Opciones para SearchSelect
    const tiposPagoOptions: SelectOption[] = useMemo(() =>
        tiposPagoSeguro.map(tipo => ({
            value: tipo.id,
            label: `${getIconoEmoji(tipo.icono)} ${tipo.nombre}`,
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

    const [detallesWithProducts, setDetallesWithProducts] = useState<DetalleProducto[]>([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [stockValido, setStockValido] = useState(true);

    // Hook para calcular carrito con precios por rango
    const precioRango = usePrecioRangoCarrito(500); // Debounce de 500ms

    // Estado para InputSearch de cliente
    const [clienteValue, setClienteValue] = useState<string | number | null>(null);
    const [clienteDisplay, setClienteDisplay] = useState<string>('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null); // ✅ NUEVO: Guardar cliente completo

    // Hook para búsqueda de clientes
    const { search: searchClientes } = useClienteSearch();

    // Estado para el modal de crear cliente
    const [showCreateClienteModal, setShowCreateClienteModal] = useState(false);
    const [clienteSearchQuery, setClienteSearchQuery] = useState('');

    const { data, setData, processing, errors, reset } = useForm({
        numero: venta?.numero || '', // Solo para edición, se genera automáticamente para nuevas ventas
        fecha: venta?.fecha || new Date().toISOString().split('T')[0],
        subtotal: venta?.subtotal || 0,
        descuento: venta?.descuento || 0,
        impuesto: venta?.impuesto || 0,
        total: venta?.total || 0,
        observaciones: venta?.observaciones || '',
        cliente_id: venta?.cliente_id || 0,
        usuario_id: auth?.user?.id || 0,
        estado_documento_id: venta?.estado_documento_id || estadoDocumentoAprobadoId, // ✅ MODIFICADO: Usa APROBADO por defecto
        moneda_id: venta?.moneda_id || 1, // Solo para edición, se establece automáticamente a BOB para nuevas ventas
        proforma_id: venta?.proforma_id || undefined,
        tipo_pago_id: venta?.tipo_pago_id || 1, // EFECTIVO por defecto
        tipo_documento_id: venta?.tipo_documento_id || tipoDocumentoReciboId, // ✅ MODIFICADO: Usa Recibo (REC) por defecto dinámicamente
        almacen_id: venta?.almacen_id || almacen_id_empresa, // ✅ MODIFICADO: Usa almacén de la empresa
        requiere_envio: venta?.requiere_envio || false,
        canal_origen: venta?.canal_origen || 'PRESENCIAL',
        estado_logistico: venta?.estado_logistico || undefined,
        // ✅ NUEVO: Campo para logística de envíos
        empresa_logistica_id: (venta?.empresa_logistica_id ? Number(venta.empresa_logistica_id) : null) as number | null,
        // ✅ NUEVO: Campos de pago y auditoría
        monto_pagado_inicial: venta?.monto_pagado_inicial || 0,
        referencia_pago: venta?.referencia_pago || '',
        // ✅ NUEVO: Política de pago por defecto ANTICIPADO_100 para ventas directas
        politica_pago: venta?.politica_pago || 'ANTICIPADO_100',
        // ✅ NUEVO: Estado de pago por defecto PAGADO (consistente con proformas)
        estado_pago: venta?.estado_pago || 'PAGADO'
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
            setClienteSeleccionado(venta.cliente);
        }
    }, [venta?.cliente, clienteDisplay]);

    // ✅ NUEVO: Cargar datos completos del cliente cuando se selecciona
    useEffect(() => {
        // ✅ VALIDACIÓN: Solo hacer fetch si cliente_id es un número válido
        if (data.cliente_id && data.cliente_id !== 0 && typeof data.cliente_id === 'number') {
            const cargarClienteCompleto = async () => {
                try {
                    const response = await fetch(`/api/clientes/${data.cliente_id}`, {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        }
                    });
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            setClienteSeleccionado(result.data);
                        }
                    }
                } catch (error) {
                    console.error('Error cargando cliente:', error);
                }
            };
            cargarClienteCompleto();
        }
    }, [data.cliente_id]);

    // ✅ NUEVO: Actualizar precios unitarios cuando cambia el carrito calculado
    useEffect(() => {
        if (!precioRango.carritoCalculado || detallesWithProducts.length === 0) {
            return;
        }

        setDetallesWithProducts(prev =>
            prev.map(detalle => {
                const detalleRango = precioRango.carritoCalculado?.detalles.find(
                    dr => dr.producto_id === detalle.producto_id
                );

                // Si existe un detalle con precio actualizado, actualizarlo
                if (detalleRango && detalleRango.precio_unitario !== detalle.precio_unitario) {
                    const nuevoPrecio = detalleRango.precio_unitario;
                    const nuevoSubtotal = (detalle.cantidad * nuevoPrecio) - (detalle.descuento || 0);

                    return {
                        ...detalle,
                        precio_unitario: nuevoPrecio,
                        subtotal: nuevoSubtotal
                    };
                }

                return detalle;
            })
        );
    }, [precioRango.carritoCalculado]);

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
        setClienteDisplay(cliente.nombre + (cliente.telefono ? ` (${cliente.telefono})` : ''));

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
        // ✅ DEBUG: Loguear producto que se agrega
        /* console.log('➕ Agregando producto a detalle:', {
            productoCompleto: producto,
            productoId: producto.id,
            productoNombre: producto.nombre,
            productoPrecioVenta: producto.precio_venta,
            productoStock: producto.stock,
            productoKeys: Object.keys(producto)
        }); */

        // Verificar si el producto ya está en los detalles
        const existingDetail = detallesWithProducts.find(d => d.producto_id === producto.id);

        if (existingDetail) {
            // ✅ NUEVO: En lugar de rechazar, incrementar la cantidad
            const updatedDetalles = detallesWithProducts.map(d => {
                if (d.producto_id === producto.id) {
                    const newCantidad = d.cantidad + 1;
                    const newSubtotal = (newCantidad * d.precio_unitario) - d.descuento;
                    return { ...d, cantidad: newCantidad, subtotal: newSubtotal };
                }
                return d;
            });

            setDetallesWithProducts(updatedDetalles);

            // Recalcular precios según rangos con la nueva cantidad
            precioRango.calcularCarritoDebounced(
                updatedDetalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad
                }))
            );

            calculateTotals(updatedDetalles);
            calculatePeso(updatedDetalles);

            // Mostrar notificación de incremento
            // NotificationService.success(`✅ ${producto.nombre} - Cantidad: ${existingDetail.cantidad + 1}`);
            return;
        }

        const newDetail: DetalleProducto = {
            producto_id: producto.id,
            cantidad: 1,
            precio_unitario: producto.precio_venta || 0,
            descuento: 0,
            subtotal: producto.precio_venta || 0,
            producto: producto
        };

        /* console.log('📝 Nuevo detalle creado:', {
            newDetail,
            productoEnDetalle: newDetail.producto
        }); */

        const newDetalles = [...detallesWithProducts, newDetail];
        setDetallesWithProducts(newDetalles);

        // 🔑 NUEVO: Calcular precios según rangos
        precioRango.calcularCarritoDebounced(
            newDetalles.map(d => ({
                producto_id: d.producto_id,
                cantidad: d.cantidad
            }))
        );

        calculateTotals(newDetalles);
        calculatePeso(newDetalles);
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

        // 🔑 NUEVO: Si cambió la cantidad, recalcular precios por rango
        if (field === 'cantidad') {
            precioRango.calcularCarritoDebounced(
                updatedDetalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad
                }))
            );
        }

        calculateTotals(updatedDetalles);
        calculatePeso(updatedDetalles);
    };

    const removeDetail = (index: number) => {
        const updatedDetalles = detallesWithProducts.filter((_, i) => i !== index);
        setDetallesWithProducts(updatedDetalles);

        // 🔑 NUEVO: Recalcular rangos cuando se elimina un producto
        if (updatedDetalles.length > 0) {
            precioRango.calcularCarritoDebounced(
                updatedDetalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad
                }))
            );
        }

        calculateTotals(updatedDetalles);
        calculatePeso(updatedDetalles);
    };

    const calculateTotals = (detalles: DetalleProducto[]) => {
        let subtotal = 0;

        // 🔑 NUEVO: Usar precios actualizados según rango si están disponibles
        detalles.forEach(detalle => {
            const precioActualizado = precioRango.getPrecioActualizado(detalle.producto_id as number);
            const precio = precioActualizado ?? detalle.precio_unitario;
            const cantidad = detalle.cantidad;
            const descuento = detalle.descuento || 0;

            subtotal += (Number(cantidad) * Number(precio)) - Number(descuento);
        });

        const descuentoGeneral = data.descuento || 0;
        // Por ahora no se suma impuesto al total
        const total = subtotal - descuentoGeneral;

        setData(prev => ({
            ...prev,
            subtotal: subtotal,
            total: total
        }));
    };

    /**
     * ✅ NUEVO: Calcular peso total de la venta
     * Fórmula: pesoTotal = Σ(cantidad × peso_producto)
     * Mismo patrón que calculateTotals()
     */
    const calculatePeso = (detalles: DetalleProducto[]) => {
        let pesoTotal = 0;

        // 🔑 Iterar cada detalle y sumar: cantidad * peso_producto
        detalles.forEach(detalle => {
            const peso = detalle.producto?.peso || 0;  // Peso del producto en kg
            const cantidad = detalle.cantidad || 0;     // Cantidad vendida

            // Sumar: cantidad × peso
            pesoTotal += Number(cantidad) * Number(peso);
        });

        /* console.log('⚖️ Peso total calculado:', {
            pesoTotal,
            detallesCount: detalles.length,
            detalles: detalles.map(d => ({
                numero: d.numero,
                producto: d.producto?.nombre,
                cantidad: d.cantidad,
                peso_unitario: d.producto?.peso,
                subtotal_peso: Number(d.cantidad) * Number(d.producto?.peso || 0)
            }))
        }); */

        setData(prev => ({
            ...prev,
            peso_total_estimado: pesoTotal
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
        const dataToValidate = {
            ...data,
            detalles: detallesWithProducts.map(d => ({
                id: d.id,
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                descuento: d.descuento,
                subtotal: d.subtotal
            }))
        };
        const validationErrors = await ventasService.validateData(dataToValidate);
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => NotificationService.error(error));
            return;
        }

        // Mostrar modal de vista previa
        setShowPreviewModal(true);
    };

    const handleConfirmSubmit = async () => {
        setShowPreviewModal(false);

        const submitData = {
            ...data,
            // ✅ IMPORTANTE: Asegurar que estos campos se envíen explícitamente
            requiere_envio: data.requiere_envio ?? false,
            politica_pago: data.politica_pago ?? 'ANTICIPADO_100',
            estado_pago: data.estado_pago ?? 'PAGADO',
            detalles: detallesWithProducts.map(d => {
                // 🔑 NUEVO: Usar precios calculados por rango si están disponibles
                const precioActualizado = precioRango.getPrecioActualizado(d.producto_id as number);
                const precioFinal = precioActualizado ?? d.precio_unitario;
                const subtotalFinal = (Number(d.cantidad) * Number(precioFinal)) - Number(d.descuento);

                return {
                    id: d.id,
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    precio_unitario: precioFinal,
                    descuento: d.descuento,
                    subtotal: subtotalFinal
                };
            })
        };

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const method = isEditing && venta ? 'PUT' : 'POST';
            const url = isEditing && venta ? `/ventas/${venta.id}` : '/ventas';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (result.success && result.data?.id) {
                // ✅ ÉXITO: Mostrar notificación, limpiar formulario y abrir imprimir
                const ventaId = result.data.id;
                const mensaje = isEditing ? 'Venta actualizada exitosamente' : 'Venta creada exitosamente';

                NotificationService.success(mensaje);

                // ✅ Limpiar todo el formulario y estados
                reset(); // Limpiar datos del formulario
                setDetallesWithProducts([]); // Limpiar detalles de productos
                setClienteSeleccionado(null); // Limpiar cliente seleccionado
                setClienteValue(null); // Limpiar valor del cliente
                setClienteDisplay(''); // Limpiar display del cliente
                precioRango.reset(); // Limpiar estado del carrito de precios

                // ✅ Abrir pantalla de imprimir en nueva ventana (formato 58mm)
                window.open(`/ventas/${ventaId}/imprimir?formato=TICKET_58&accion=stream`, '_blank');
            } else {
                // ❌ ERROR: Mostrar mensaje y mantener formulario
                const errorMessage = result.message || 'Error al procesar la venta';
                NotificationService.error(errorMessage);
            }
        } catch (error) {
            console.error('Error en la petición:', error);
            NotificationService.error('Error al procesar la venta. Intente nuevamente.');
        }
    };

    // ✅ MODIFICADO: Obtener entidades relacionadas - usar clienteSeleccionado si está cargado
    const selectedCliente = clienteSeleccionado || clientesSeguro.find(c => c.id === data.cliente_id);
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
                {/* Banner de advertencia - caja sin abrir */}
                {shouldShowBanner && (
                    <div className="mb-4">
                        <AlertSinCaja
                            onAbrir={() => router.visit('/cajas')}
                            onVerCajas={() => router.visit('/cajas')}
                        />
                    </div>
                )}

                {/* Información básica */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Información básica
                    </h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                        {/* Campo número oculto - se genera automáticamente */}
                        <input
                            type="hidden"
                            value={data.numero}
                            onChange={(e) => setData('numero', e.target.value)}
                        />
                        <div>
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
                                placeholder="Buscar cliente por nombre, NIT/CI o teléfono..."
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
                            {selectedCliente && (
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    {selectedCliente.telefono && <span>📱 {selectedCliente.telefono}</span>}
                                    {selectedCliente.nit && <span>{selectedCliente.telefono ? ' • ' : ''}NIT: {selectedCliente.nit}</span>}
                                    {selectedCliente.email && <span>{selectedCliente.telefono || selectedCliente.nit ? ' • ' : ''}Email: {selectedCliente.email}</span>}
                                </p>
                            )}
                        </div>

                        {/* Información del Cliente */}


                        {/* Campo moneda oculto - se establece automáticamente a BOB */}
                        <input
                            type="hidden"
                            value={data.moneda_id}
                            onChange={(e) => setData('moneda_id', Number(e.target.value))}
                        />

                        <div>
                            <SearchSelect
                                label="Tipo de Pago"
                                placeholder="Seleccionar tipo de pago"
                                value={data.tipo_pago_id || ''}
                                options={tiposPagoOptions}
                                onChange={(value) => setData('tipo_pago_id', value ? Number(value) : 0)}
                                required
                                error={errors.tipo_pago_id}
                                searchPlaceholder="Buscar tipo de pago..."
                                emptyText="No se encontraron tipos de pago"
                            />
                        </div>
                    </div>

                    {/* Sección de Envío - mostrar solo si empresa.logistica_envios = true */}
                    {selectedCliente?.empresa?.logistica_envios && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                    🚚 Información de Envío
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setData('requiere_envio', !data.requiere_envio)}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${data.requiere_envio
                                        ? 'bg-green-600 dark:bg-green-700'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${data.requiere_envio ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                    <span className="ml-2 text-sm font-medium text-white">
                                        {data.requiere_envio ? 'Sí' : 'No'}
                                    </span>
                                </button>
                            </div>

                            {/* Campos de envío - mostrar solo si requiere_envio es true */}
                            {data.requiere_envio && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Dirección de Envío *
                                        </label>
                                        <textarea
                                            value={data.observaciones || ''}
                                            onChange={(e) => setData('observaciones', e.target.value)}
                                            rows={2}
                                            placeholder="Calle, número, piso, referencias..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                        />
                                        {errors.observaciones && <p className="mt-1 text-sm text-red-600">{errors.observaciones}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Persona que Recibe
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Nombre de quien recibe"
                                                defaultValue={selectedCliente?.nombre || ''}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Teléfono de Contacto
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="Teléfono para envío"
                                                defaultValue={selectedCliente?.telefono || ''}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* ✅ NUEVO: Campo de Logística de Envíos - mostrar solo si empresa.logistica_envios = true */}
                                    {selectedCliente?.empresa?.logistica_envios && (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-3">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                🚚 Empresa de Logística
                                            </label>
                                            <select
                                                value={data.empresa_logistica_id || ''}
                                                onChange={(e) => setData('empresa_logistica_id', e.target.value ? Number(e.target.value) : null)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-zinc-800 dark:text-white"
                                            >
                                                <option value="">Selecciona empresa de logística...</option>
                                                <option value="">-- Envío directo (sin intermediario) --</option>
                                            </select>
                                            <p className="text-xs text-green-700 dark:text-green-300">
                                                ℹ️ Esta empresa dispone de servicio de logística para envíos
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        ℹ️ Los datos del cliente se pre-rellenan automáticamente. Modifica si es necesario.
                                    </p>
                                </div>
                            )}

                            {!data.requiere_envio && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Activa el envío para agregar dirección y datos de entrega
                                </p>
                            )}

                            {errors.requiere_envio && <p className="mt-2 text-sm text-red-600">{errors.requiere_envio}</p>}
                        </div>
                    )}
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
                        almacen_id={almacen_id_empresa} // ✅ MODIFICADO: Pasar almacén de la empresa
                        isCalculatingPrices={precioRango.loading} // ✅ NUEVO: Mostrar indicador de carga
                    />
                </div>

                {/* Totales */}
                {detallesWithProducts.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-right">
                            Totales
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md ml-auto">
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
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white text-right"
                                />
                            </div>

                            {/* ✅ NUEVO: Monto pagado por el cliente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Monto Pagado
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.monto_pagado_inicial}
                                    onChange={(e) => {
                                        const monto = Number(e.target.value);
                                        setData('monto_pagado_inicial', monto);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white text-right"
                                />
                            </div>
                        </div>

                        {/* ✅ NUEVO: Resumen completo de la transacción */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                                <span className="text-gray-900 dark:text-white font-medium text-right">{formatCurrency(data.subtotal)}</span>
                            </div>

                            {data.descuento > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">Descuento:</span>
                                    <span className="text-red-600 dark:text-red-400 font-medium text-right">-{formatCurrency(data.descuento)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200 dark:border-zinc-700">
                                <span className="text-gray-900 dark:text-white">Total:</span>
                                <span className="text-gray-900 dark:text-white text-right">{formatCurrency(data.total)}</span>
                            </div>

                            {data.monto_pagado_inicial > 0 && (
                                <>
                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-zinc-700">
                                        <span className="text-gray-700 dark:text-gray-300">Monto Pagado:</span>
                                        <span className="text-gray-900 dark:text-white font-medium text-right">{formatCurrency(data.monto_pagado_inicial)}</span>
                                    </div>

                                    <div className={`flex justify-between items-center text-sm font-medium ${data.monto_pagado_inicial - data.total < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        <span>Cambio / Vuelto:</span>
                                        <span className="text-right">{formatCurrency(Math.max(0, data.monto_pagado_inicial - data.total))}</span>
                                    </div>
                                </>
                            )}
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
