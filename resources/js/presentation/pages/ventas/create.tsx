import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useCajaWarning } from '@/application/hooks/use-caja-warning';
import { AlertSinCaja } from '@/presentation/components/cajas/alert-sin-caja';
import VentaPreviewModal from '@/presentation/components/VentaPreviewModal';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';
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
import { formatCurrency, formatCurrencyWith2Decimals } from '@/lib/utils';

interface TipoPrecio {
    id: number;
    codigo: string;
    nombre: string;
}

interface PageProps extends InertiaPageProps {
    clientes: Cliente[];
    productos: Producto[]; // ✅ Ahora array vacío (búsqueda via API)
    almacenes: Array<{ id: number; nombre: string }>; // ✅ NUEVO: Lista de almacenes
    monedas: Moneda[];
    estados_documento: EstadoDocumento[];
    tipos_pago: TipoPago[];
    tipos_documento: TipoDocumento[];
    tipos_precio: TipoPrecio[]; // ✅ NUEVO: Tipos de precio para asignar por defecto
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
    const { clientes, productos, monedas, estados_documento, tipos_pago, tipos_documento, tipos_precio, almacen_id_empresa, auth, venta } = usePage<PageProps>().props;
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

    // Estados para validación de caja abierta
    interface CajaInfo {
        tiene_caja_abierta: boolean;
        es_de_hoy?: boolean;
        dias_atras?: number;
        caja_nombre?: string;
        usuario_caja?: string;
        mensaje?: string;
    }

    const [cajaInfo, setCajaInfo] = useState<CajaInfo | null>(null);
    const [cargandoCaja, setCargandoCaja] = useState(true);

    // ✅ NUEVO: Rastrear qué tipos de precio han sido seleccionados manualmente por el usuario
    const [manuallySelectedTipoPrecio, setManuallySelectedTipoPrecio] = useState<Record<number, boolean>>({});

    // ✅ NUEVO: Rastrear items seleccionados en combos por cada detalle
    const [comboItemsMap, setComboItemsMap] = useState<Record<number, any[]>>({});

    // ✅ NUEVO: Obtener ID del tipo de precio LICORERIA desde props
    const tipoPrecioLicoreriId = useMemo(() => {
        const licoreria = tipos_precio?.find(tp =>
            tp.codigo === 'LICORERIA' || tp.nombre?.toUpperCase() === 'LICORERIA'
        );
        if (licoreria) {
            console.log('✅ Tipo de precio LICORERIA obtenido:', licoreria.id);
        }
        return licoreria?.id || null;
    }, [tipos_precio]);

    // Verificar si hay caja abierta (de cualquier día)
    useEffect(() => {
        const verificarCaja = async () => {
            try {
                const response = await fetch('/ventas/check-caja-abierta');
                const data = await response.json();
                setCajaInfo(data);
                console.log('✅ Estado de caja (Ventas):', data);
            } catch (error) {
                console.error('❌ Error verificando caja (Ventas):', error);
                // Si hay error, permitir acceso (mejor UX que bloquear)
                setCajaInfo({ tiene_caja_abierta: true });
            } finally {
                setCargandoCaja(false);
            }
        };

        verificarCaja();
    }, []);

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

    // Estado para el modal de selección de salida (imprimir, Excel, PDF)
    const [showOutputModal, setShowOutputModal] = useState(false);
    const [ventaCreada, setVentaCreada] = useState<{ id: number; numero: string; fecha: string } | null>(null);

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

    // ✅ NUEVO: Guardar automáticamente en localStorage con debounce
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isEditing) return; // No guardar si estamos editando una venta existente

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            try {
                const datosAGuardar = {
                    data,
                    detallesWithProducts,
                    clienteValue,
                    clienteDisplay,
                    clienteSeleccionado,
                    manuallySelectedTipoPrecio
                };
                localStorage.setItem('venta-create-draft', JSON.stringify(datosAGuardar));
                console.log('✅ Venta guardada en localStorage');
            } catch (error) {
                console.error('❌ Error guardando venta en localStorage:', error);
            }
        }, 1000); // Debounce de 1 segundo

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [data, detallesWithProducts, clienteValue, clienteDisplay, clienteSeleccionado, manuallySelectedTipoPrecio, isEditing]);

    // ✅ NUEVO: Restaurar datos del localStorage al cargar
    useEffect(() => {
        if (isEditing) return; // No restaurar si estamos editando una venta existente

        const datosGuardados = localStorage.getItem('venta-create-draft');
        if (datosGuardados) {
            try {
                const parsed = JSON.parse(datosGuardados);
                console.log('📋 Restaurando venta desde localStorage:', parsed);

                // Restaurar datos del formulario
                if (parsed.data) {
                    Object.keys(parsed.data).forEach((key: string) => {
                        setData(key as any, parsed.data[key]);
                    });
                }

                // Restaurar detalles
                if (parsed.detallesWithProducts && parsed.detallesWithProducts.length > 0) {
                    setDetallesWithProducts(parsed.detallesWithProducts);
                }

                // Restaurar cliente
                if (parsed.clienteValue !== null) {
                    setClienteValue(parsed.clienteValue);
                }
                if (parsed.clienteDisplay) {
                    setClienteDisplay(parsed.clienteDisplay);
                }
                if (parsed.clienteSeleccionado) {
                    setClienteSeleccionado(parsed.clienteSeleccionado);
                }

                // Restaurar selecciones manuales de tipo de precio
                if (parsed.manuallySelectedTipoPrecio) {
                    setManuallySelectedTipoPrecio(parsed.manuallySelectedTipoPrecio);
                }

                NotificationService.success('✅ Venta restaurada desde borrador anterior');
            } catch (error) {
                console.error('❌ Error restaurando venta desde localStorage:', error);
            }
        }
    }, []); // Solo ejecutar al montar el componente

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
                    console.log('📡 Respuesta al cargar cliente:', response);
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

    // ✅ NUEVO: Buscar y seleccionar automáticamente cliente GENERAL al cargar el componente
    useEffect(() => {
        console.group('🔍 [useEffect] Buscando cliente GENERAL automáticamente');

        // Solo al cargar por primera vez y sin edición
        if (isEditing) {
            console.log('❌ Modo edición activo - Saltando selección automática');
            console.groupEnd();
            return;
        }

        if (data.cliente_id && data.cliente_id !== 0) {
            console.log('❌ Cliente ya seleccionado (ID:', data.cliente_id, ') - No cambiar');
            console.groupEnd();
            return;
        }

        if (!clientesSeguro || clientesSeguro.length === 0) {
            console.log('❌ No hay clientes disponibles', { clientesSeguro });
            console.groupEnd();
            return;
        }

        console.log('📋 Clientes disponibles:', {
            cantidad: clientesSeguro.length,
            clientes: clientesSeguro.map((c: Cliente) => ({
                id: c.id,
                nombre: c.nombre,
                codigo_cliente: c.codigo_cliente
            }))
        });

        // Buscar cliente con código_cliente === 'GENERAL'
        const clienteGeneral = clientesSeguro.find((c: Cliente) => c.codigo_cliente === 'GENERAL');

        if (clienteGeneral) {
            console.log('✅ CLIENTE GENERAL ENCONTRADO Y SELECCIONADO:', {
                id: clienteGeneral.id,
                nombre: clienteGeneral.nombre,
                nit: clienteGeneral.nit,
                codigo_cliente: clienteGeneral.codigo_cliente,
                email: clienteGeneral.email,
                telefono: clienteGeneral.telefono
            });

            setData('cliente_id', clienteGeneral.id);
            setClienteValue(clienteGeneral.id);
            setClienteDisplay(clienteGeneral.nombre + (clienteGeneral.nit ? ` (${clienteGeneral.nit})` : ''));
            setClienteSeleccionado(clienteGeneral);

            console.log('✅ Estados actualizados:');
            console.log('   - cliente_id:', clienteGeneral.id);
            console.log('   - clienteValue:', clienteGeneral.id);
            console.log('   - clienteDisplay:', clienteGeneral.nombre + (clienteGeneral.nit ? ` (${clienteGeneral.nit})` : ''));
        } else {
            console.log('❌ Cliente GENERAL NO ENCONTRADO en la lista de clientes');
            console.log('   Códigos disponibles:', clientesSeguro.map((c: Cliente) => c.codigo_cliente));
        }

        console.groupEnd();
    }, [isEditing, clientesSeguro.length]); // Ejecutar cuando clientes se cargan o cambia edición

    // ✅ NUEVO: Sincronizar política de pago cuando se selecciona tipo de pago CREDITO
    useEffect(() => {
        // Acceder directamente a tipos_pago desde props sin usar tiposPagoSeguro para evitar problemas de dependencias
        const tiposDisponibles = tipos_pago || [];
        const tipoPagoSeleccionado = tiposDisponibles.find((t: any) => t.id === data.tipo_pago_id);

        console.log(`🔍 useEffect triggerado - tipo_pago_id: ${data.tipo_pago_id}`, {
            tipoPagoSeleccionado,
            codigo: tipoPagoSeleccionado?.codigo,
            politicaActual: data.politica_pago
        });

        if (tipoPagoSeleccionado?.codigo === 'CREDITO') {
            // Si es CREDITO, cambiar política de pago a CREDITO
            setData('politica_pago', 'CREDITO');
            console.log(`💳 Tipo de pago CREDITO seleccionado - Política de pago actualizada a CREDITO`);
        } else if (data.politica_pago === 'CREDITO') {
            // Si no es CREDITO pero la política era CREDITO, revertir a ANTICIPADO_100
            setData('politica_pago', 'ANTICIPADO_100');
            console.log(`💵 Tipo de pago no-CREDITO seleccionado - Política de pago revertida a ANTICIPADO_100`);
        }
    }, [data.tipo_pago_id]);

    // ✅ NUEVO: Actualizar tipo de precio cuando cambia el carrito calculado
    // ✅ SOLO actualiza tipo_precio_id y tipo_precio_nombre si NO ha sido seleccionado manualmente
    // ✅ NO cambia el precio unitario, subtotal ni unidad_venta_id
    // ✅ RESPETA: Las selecciones manuales del usuario no son sobrescritas
    useEffect(() => {
        if (!precioRango.carritoCalculado || detallesWithProducts.length === 0) {
            return;
        }

        setDetallesWithProducts(prev =>
            prev.map((detalle, index) => {
                const detalleRango = precioRango.carritoCalculado?.detalles.find(
                    dr => dr.producto_id === detalle.producto_id
                );

                // ✅ MODIFICADO: Solo actualizar si NO ha sido seleccionado manualmente por el usuario
                if (
                    detalleRango &&
                    detalleRango.tipo_precio_nombre !== detalle.tipo_precio_nombre &&
                    !manuallySelectedTipoPrecio[index] // No actualizar si fue seleccionado manualmente
                ) {
                    console.log(`🏷️ [useEffect] Actualizando tipo de precio para producto ${detalle.producto_id}: ${detalle.tipo_precio_nombre} → ${detalleRango.tipo_precio_nombre}`, {
                        unidad_venta_id_preservada: detalle.unidad_venta_id,
                        fue_manual: manuallySelectedTipoPrecio[index] ? 'SÍ (IGNORADO)' : 'NO'
                    });

                    return {
                        ...detalle,
                        tipo_precio_id: detalleRango.tipo_precio_id,
                        tipo_precio_nombre: detalleRango.tipo_precio_nombre
                        // ✅ PRESERVADO: NO se modifica unidad_venta_id
                    };
                }

                if (manuallySelectedTipoPrecio[index] && detalleRango) {
                    console.log(`🔒 [useEffect] Tipo de precio manual PRESERVADO para producto ${detalle.producto_id}: ${detalle.tipo_precio_nombre} (Backend propone: ${detalleRango.tipo_precio_nombre})`);
                }

                return detalle;
            })
        );
    }, [precioRango.carritoCalculado, manuallySelectedTipoPrecio]);


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
                    return {
                        ...d,
                        cantidad: newCantidad,
                        subtotal: newSubtotal,
                        // ✅ NUEVO: Preservar información de conversiones y unidad_venta_id
                        es_fraccionado: d.es_fraccionado || (producto as any).es_fraccionado || false,
                        conversiones: d.conversiones || (producto as any).conversiones || [],
                        unidad_venta_id: d.unidad_venta_id // ✅ PRESERVADO: Mantener la unidad_venta_id actual
                    };
                }
                return d;
            });

            setDetallesWithProducts(updatedDetalles);

            // Recalcular precios según rangos con la nueva cantidad
            // ✅ COMENTADO: Deshabilitado temporalmente para evitar cambios automáticos de precio
            // ✅ NO calcular si el cliente es GENERAL (no se deben aplicar rangos)
            if (clienteSeleccionado?.codigo_cliente !== 'GENERAL') {
                precioRango.calcularCarritoDebounced(
                    updatedDetalles.map(d => ({
                        producto_id: d.producto_id,
                        cantidad: d.cantidad,
                        tipo_precio_id: d.tipo_precio_id // ✅ NUEVO: Respetar tipo_precio_id seleccionado
                    }))
                );
            }

            calculateTotals(updatedDetalles);
            calculatePeso(updatedDetalles);

            // Mostrar notificación de incremento
            // NotificationService.success(`✅ ${producto.nombre} - Cantidad: ${existingDetail.cantidad + 1}`);
            return;
        }

        // ✅ DEBUG: Loguear información del producto
        console.log('📦 [addProductToDetail] Producto que se agrega:', {
            id: producto.id,
            nombre: producto.nombre,
            es_fraccionado: (producto as any).es_fraccionado,
            unidad_medida_id: (producto as any).unidad_medida_id,
            unidad_medida_nombre: (producto as any).unidad_medida_nombre,
            conversiones: (producto as any).conversiones,
            producto_keys: Object.keys(producto),
            producto_completo: producto
        });

        // ✅ NUEVO: Determinar unidad_venta_id inicial - usar primera conversión si es fraccionado
        const conversiones = (producto as any).conversiones || [];
        const esProductoFraccionado = (producto as any).es_fraccionado && conversiones.length > 0;
        const unidadVentaInicial = esProductoFraccionado
            ? conversiones[0].unidad_destino_id
            : (producto as any).unidad_medida_id;

        // ✅ NUEVO: Calcular precio según la unidad de venta inicial
        let precioUnitarioInicial = producto.precio_venta || 0;
        if (esProductoFraccionado && conversiones.length > 0) {
            const conversion = conversiones[0];
            if (conversion.factor_conversion > 0) {
                precioUnitarioInicial = (producto.precio_venta || 0) / conversion.factor_conversion;
            }
        }

        // ✅ MODIFICADO: Usar tipo_precio_id que viene del backend, fallback a LICORERIA si no viene
        // El backend devuelve tipo_precio_id_recomendado basado en el código VENTA
        const tipoPrecioIdRecomendado = (producto as any).tipo_precio_id_recomendado || tipoPrecioLicoreriId;
        const tipoPrecioNombreRecomendado = (producto as any).tipo_precio_nombre_recomendado || 'LICORERIA';

        // ✅ DEBUG: Loguear los IDs de precios disponibles para verificar coincidencias
        const preciosConIds = (producto as any).precios?.map((p: any) => ({
            nombre: p.nombre,
            tipo_precio_id: p.tipo_precio_id
        })) || [];

        console.log(`🏷️ [addProductToDetail] Información de precios para producto ${producto.id}:`, {
            tipoPrecioIdRecomendado,
            tipoPrecioNombreRecomendado,
            preciosDisponibles: preciosConIds
        });

        const newDetail: DetalleProducto = {
            producto_id: producto.id,
            cantidad: 1,
            precio_unitario: precioUnitarioInicial,
            descuento: 0,
            subtotal: precioUnitarioInicial,
            producto: producto,
            // ✅ NUEVO: Información de conversiones para productos fraccionados
            es_fraccionado: (producto as any).es_fraccionado || false,
            unidad_medida_id: (producto as any).unidad_medida_id,
            unidad_medida_nombre: (producto as any).unidad_medida_nombre,
            conversiones: (producto as any).conversiones || [],
            unidad_venta_id: unidadVentaInicial, // ✅ MODIFICADO: Usa primera conversión si es fraccionado
            // ✅ MODIFICADO: Usar tipo_precio_id que viene del backend
            tipo_precio_id: tipoPrecioIdRecomendado,
            tipo_precio_nombre: tipoPrecioNombreRecomendado
        };

        console.log('📝 [addProductToDetail] Nuevo detalle creado:', {
            es_fraccionado: newDetail.es_fraccionado,
            unidad_medida_id: newDetail.unidad_medida_id,
            conversiones_count: newDetail.conversiones?.length,
            precio_unitario: newDetail.precio_unitario,
            tipo_precio_id: newDetail.tipo_precio_id,
            tipo_precio_nombre: newDetail.tipo_precio_nombre,
            nota: 'tipo_precio viene del backend - será respetado hasta que el usuario lo cambie manualmente'
        });

        const newDetalles = [...detallesWithProducts, newDetail];
        setDetallesWithProducts(newDetalles);

        // 🔑 NUEVO: Calcular precios según rangos
        // ✅ COMENTADO: Deshabilitado temporalmente para evitar cambios automáticos de precio
        // ✅ NO calcular si el cliente es GENERAL (no se deben aplicar rangos)
        if (clienteSeleccionado?.codigo_cliente !== 'GENERAL') {
            precioRango.calcularCarritoDebounced(
                newDetalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    tipo_precio_id: d.tipo_precio_id // ✅ NUEVO: Respetar tipo_precio_id seleccionado
                }))
            );
        }

        calculateTotals(newDetalles);
        calculatePeso(newDetalles);
    };

    // ✅ NUEVO: Método para cambiar unidad y precio juntos (sin separar)
    const updateDetailUnidadConPrecio = (index: number, unidadDestinoId: number, nuevoPrecio: number) => {
        const updatedDetalles = [...detallesWithProducts];

        // Actualizar ambos campos a la vez
        updatedDetalles[index] = {
            ...updatedDetalles[index],
            unidad_venta_id: unidadDestinoId,
            precio_unitario: nuevoPrecio,
            // Recalcular subtotal con el nuevo precio
            subtotal: (updatedDetalles[index].cantidad * nuevoPrecio) - (updatedDetalles[index].descuento || 0)
        };

        console.log(`🔄 [updateDetailUnidadConPrecio] Detalle #${index}:`, {
            unidad_venta_id: unidadDestinoId,
            precio_unitario: nuevoPrecio,
            subtotal: updatedDetalles[index].subtotal
        });

        setDetallesWithProducts(updatedDetalles);
        calculateTotals(updatedDetalles);
        calculatePeso(updatedDetalles);
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

        // ✅ DEBUG: Loguear cambios en detalles
        if (field === 'unidad_venta_id') {
            console.log(`🔄 [updateDetail] Cambio de unidad_venta_id para detalle #${index}:`, {
                anterior: detallesWithProducts[index].unidad_venta_id,
                nuevo: numericValue,
                precio_unitario: updatedDetalles[index].precio_unitario,
                es_fraccionado: (updatedDetalles[index] as any).es_fraccionado,
                detalle_antes: detallesWithProducts[index],
                detalle_despues: updatedDetalles[index]
            });
        }

        console.log(`📊 [updateDetail] Estado ANTES de setDetallesWithProducts, detalle #${index}:`, {
            field,
            valor_nuevo: numericValue,
            unidad_venta_id: updatedDetalles[index].unidad_venta_id,
            es_fraccionado: (updatedDetalles[index] as any).es_fraccionado,
            all_detalles: updatedDetalles
        });

        setDetallesWithProducts(updatedDetalles);

        console.log(`📊 [updateDetail] Estado DESPUÉS de setDetallesWithProducts, detalle #${index}:`, {
            field,
            valor_nuevo: numericValue,
            unidad_venta_id_guardado: updatedDetalles[index].unidad_venta_id
        });

        // ✅ MODIFICADO: Si cambió la cantidad O unidad de venta, recalcular precios por rango
        // PERO: No recalcular si cambió precio_unitario (es cambio manual del usuario)
        // y tampoco si cambió unidad_venta_id (el usuario está seleccionando otra unidad)
        const esProductoFraccionado = (updatedDetalles[index] as any).es_fraccionado;
        const esUnidadOPrecioFraccionado = esProductoFraccionado &&
            (field === 'unidad_venta_id' || field === 'precio_unitario');

        if (field === 'cantidad' && !esUnidadOPrecioFraccionado) {
            console.log(`📊 [updateDetail] Recalculando rango para cantidad de producto ${updatedDetalles[index].producto_id}`);
            // ✅ COMENTADO: Deshabilitado temporalmente para evitar cambios automáticos de precio
            // ✅ NO calcular si el cliente es GENERAL (no se deben aplicar rangos)
            if (clienteSeleccionado?.codigo_cliente !== 'GENERAL') {
                precioRango.calcularCarritoDebounced(
                    updatedDetalles.map(d => ({
                        producto_id: d.producto_id,
                        cantidad: d.cantidad,
                        tipo_precio_id: d.tipo_precio_id // ✅ NUEVO: Respetar tipo_precio_id seleccionado
                    }))
                );
            }
        }

        calculateTotals(updatedDetalles);
        calculatePeso(updatedDetalles);
    };

    const removeDetail = (index: number) => {
        const updatedDetalles = detallesWithProducts.filter((_, i) => i !== index);
        setDetallesWithProducts(updatedDetalles);

        // ✅ NUEVO: Limpiar el estado de selección manual para el índice removido
        setManuallySelectedTipoPrecio(prev => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
        });

        // 🔑 NUEVO: Recalcular rangos cuando se elimina un producto
        // ✅ COMENTADO: Deshabilitado temporalmente para evitar cambios automáticos de precio
        // ✅ NO calcular si el cliente es GENERAL (no se deben aplicar rangos)
        if (updatedDetalles.length > 0 && clienteSeleccionado?.codigo_cliente !== 'GENERAL') {
            precioRango.calcularCarritoDebounced(
                updatedDetalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    tipo_precio_id: d.tipo_precio_id // ✅ NUEVO: Respetar tipo_precio_id seleccionado
                }))
            );
        }

        calculateTotals(updatedDetalles);
        calculatePeso(updatedDetalles);
    };

    const calculateTotals = (detalles: DetalleProducto[]) => {
        // ✅ SIMPLIFICADO: Usar directamente el subtotal ya calculado en cada detalle
        let subtotal = 0;

        detalles.forEach(detalle => {
            subtotal += detalle.subtotal || 0;
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

        setData(prev => ({
            ...prev,
            peso_total_estimado: pesoTotal
        }));
    };

    // ✅ NUEVO: Función para limpiar manualmente el borrador de localStorage
    const limpiarBorrador = () => {
        const confirmar = window.confirm('¿Deseas limpiar el borrador? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        try {
            localStorage.removeItem('venta-create-draft');
            // Resetear estados
            reset();
            setDetallesWithProducts([]);
            setClienteSeleccionado(null);
            setClienteValue(null);
            setClienteDisplay('');
            setManuallySelectedTipoPrecio({});
            NotificationService.success('Borrador de venta eliminado');
        } catch (error) {
            console.error('Error limpiando borrador:', error);
            NotificationService.error('Error al limpiar el borrador');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ NUEVO: Permitir stock insuficiente para créditos
        const tipoPagoSeleccionado = tipos_pago?.find((t: any) => t.id === data.tipo_pago_id);
        const isCreditoPayment = tipoPagoSeleccionado?.codigo === 'CREDITO';

        // Validar stock antes de continuar (SOLO si NO es crédito)
        if (!stockValido && !isCreditoPayment) {
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

        // ✅ NUEVO: Verificar si el tipo de pago seleccionado es CREDITO y ajustar política de pago
        const tipoPagoSeleccionado = tipos_pago?.find((t: any) => t.id === data.tipo_pago_id);
        const politicaPagoFinal = tipoPagoSeleccionado?.codigo === 'CREDITO' ? 'CREDITO' : (data.politica_pago ?? 'ANTICIPADO_100');

        console.log(`🔍 handleConfirmSubmit - Verificación de tipo de pago:`, {
            tipo_pago_id: data.tipo_pago_id,
            tipoPagoSeleccionado: tipoPagoSeleccionado?.nombre,
            codigoTipoPago: tipoPagoSeleccionado?.codigo,
            politicaPagoOriginal: data.politica_pago,
            politicaPagoFinal
        });

        const submitData = {
            ...data,
            // ✅ IMPORTANTE: Asegurar que estos campos se envíen explícitamente
            requiere_envio: data.requiere_envio ?? false,
            tipo_pago_id: data.tipo_pago_id ?? 1,  // ✅ NUEVO: Tipo de pago seleccionado
            politica_pago: politicaPagoFinal,  // ✅ MODIFICADO: Usar politica_pago calculada
            estado_pago: data.estado_pago ?? 'PAGADO',
            detalles: detallesWithProducts.map((d, detailIndex) => {
                // ✅ MODIFICADO: Usar siempre d.precio_unitario (ya contiene valor editado manualmente o del tipo de precio)
                // NO usar precioRango para no sobrescribir ediciones manuales
                const precioFinal = d.precio_unitario;
                const subtotalFinal = (Number(d.cantidad) * Number(precioFinal)) - Number(d.descuento);

                const detalle: any = {
                    id: d.id,
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    precio_unitario: precioFinal,
                    descuento: d.descuento,
                    subtotal: subtotalFinal,
                    // ✅ NUEVO: Enviar información de fraccionado para que backend calcule correctamente
                    es_fraccionado: d.es_fraccionado || false,
                    unidad_venta_id: d.unidad_venta_id || undefined,
                    // ✅ NUEVO: Enviar tipo de precio seleccionado para guardar en BD
                    tipo_precio_id: d.tipo_precio_id || undefined,
                    tipo_precio_nombre: d.tipo_precio_nombre || undefined
                };

                // ✅ NUEVO: Si es combo, agregar items seleccionados
                if ((d.producto as any)?.es_combo) {
                    const comboItems = comboItemsMap[detailIndex] || ((d.producto as any).combo_items || []);
                    detalle.combo_items_seleccionados = comboItems.map((item: any) => ({
                        combo_item_id: item.id,
                        producto_id: item.producto_id,
                        incluido: item.incluido !== false // true si está incluido, false si está excluido
                    }));

                    console.log(`📦 [handleConfirmSubmit] Combo ${d.producto?.nombre}:`, {
                        total_items: comboItems.length,
                        items_incluidos: comboItems.filter((i: any) => i.incluido !== false).length,
                        detalles: detalle.combo_items_seleccionados
                    });
                }

                return detalle;
            })
        };

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const method = isEditing && venta ? 'PUT' : 'POST';
            const url = isEditing && venta ? `/ventas/${venta.id}` : '/ventas';

            // ✅ NUEVO: Log detallado de lo que se envía al backend
            const requestBody = JSON.stringify(submitData);
            console.group(`📤 PETICIÓN AL BACKEND - ${method} ${url}`);
            console.log('Datos enviados (objeto):', submitData);
            console.log('Detalles:', submitData.detalles.map((d, i) => ({
                index: i,
                producto_id: d.producto_id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                descuento: d.descuento,
                subtotal: d.subtotal,
                es_fraccionado: d.es_fraccionado,
                unidad_venta_id: d.unidad_venta_id
            })));
            console.log('Totales:', {
                subtotal: submitData.subtotal,
                descuento: submitData.descuento,
                impuesto: submitData.impuesto,
                total: submitData.total
            });
            console.log('JSON a enviar:', requestBody);
            console.groupEnd();

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: requestBody,
            });

            const result = await response.json();

            // ✅ NUEVO: Log de la respuesta del backend
            console.group(`📥 RESPUESTA DEL BACKEND - Status: ${response.status}`);
            console.log('Respuesta completa:', result);
            console.groupEnd();

            if (result.success && result.data?.id) {
                // ✅ ÉXITO: Mostrar notificación, limpiar formulario y mostrar modal de salida
                const ventaId = result.data.id;
                const mensaje = isEditing ? 'Venta actualizada exitosamente' : 'Venta creada exitosamente';

                console.group(`✅ VENTA CREADA EXITOSAMENTE`);
                console.log('ID:', result.data.id);
                console.log('Número:', result.data.numero);
                console.log('Total:', result.data.total);
                console.log('Datos completos:', result.data);
                console.groupEnd();

                NotificationService.success(mensaje);

                // ✅ NUEVO: Limpiar localStorage después de envío exitoso
                localStorage.removeItem('venta-create-draft');
                console.log('✅ Borrador de venta eliminado del localStorage');

                // ✅ Limpiar todo el formulario y estados
                reset(); // Limpiar datos del formulario
                setDetallesWithProducts([]); // Limpiar detalles de productos
                setClienteSeleccionado(null); // Limpiar cliente seleccionado
                setClienteValue(null); // Limpiar valor del cliente
                setClienteDisplay(''); // Limpiar display del cliente
                precioRango.reset(); // Limpiar estado del carrito de precios

                // ✅ NUEVO: Guardar datos de la venta y mostrar modal de selección de salida
                setVentaCreada({
                    id: ventaId,
                    numero: result.data.numero,
                    fecha: result.data.fecha
                });
                setShowOutputModal(true);
            } else {
                // ❌ ERROR: Mostrar mensaje y mantener formulario
                const errorMessage = result.message || 'Error al procesar la venta';

                // ✅ NUEVO: Log detallado del error del backend
                console.group(`❌ ERROR AL CREAR VENTA`);
                console.log('Status HTTP:', response.status, response.statusText);
                console.log('Mensaje:', result.message);
                console.log('Errores detallados:');
                if (result.errors) {
                    Object.entries(result.errors).forEach(([campo, mensajes]) => {
                        console.log(`  ${campo}:`, mensajes);
                    });
                }

                // ✅ NUEVO: Mostrar información de debug si está disponible
                if (result.debug) {
                    console.group('🔍 INFORMACIÓN DE DEBUG DEL BACKEND');
                    console.log('Detalles enviados:', result.debug.detalles_enviados);
                    console.log('Subtotal enviado:', result.debug.subtotal_enviado);
                    console.log('Total enviado:', result.debug.total_enviado);
                    console.groupEnd();
                }

                console.log('Respuesta completa:', result);
                console.groupEnd();

                // ✅ MEJORADO: Extraer mensajes específicos de los errores y mostrar en toast
                if (result.errors && Object.keys(result.errors).length > 0) {
                    // Si hay errores específicos por campo, mostrar el primero de cada campo
                    let primemerError = null;
                    Object.entries(result.errors).forEach(([campo, mensajes]: [string, any]) => {
                        if (Array.isArray(mensajes) && mensajes.length > 0) {
                            const mensaje = mensajes[0]; // Tomar el primer mensaje del campo
                            if (!primemerError) {
                                primemerError = mensaje;
                            }
                            // Log cada error
                            console.log(`❌ ${campo}:`, mensaje);
                        }
                    });

                    // Mostrar el primer error específico en el toast
                    if (primemerError) {
                        NotificationService.error(primemerError);
                    } else {
                        NotificationService.error(errorMessage);
                    }
                } else {
                    NotificationService.error(errorMessage);
                }
            }
        } catch (error) {
            console.error('❌ Error en la petición:', {
                error: error,
                mensaje: error instanceof Error ? error.message : 'Error desconocido',
                stack: error instanceof Error ? error.stack : undefined
            });
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

    // Mostrar alert si no hay caja abierta
    if (!cargandoCaja && !cajaInfo?.tiene_caja_abierta) {
        return (
            <AppLayout breadcrumbs={[
                { title: 'Ventas', href: '/ventas' },
                { title: 'Nueva venta', href: '#' }
            ]}>
                <Head title="Nueva venta" />
                <div className="p-6 space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">🚫 Caja Cerrada</h3>
                        <p className="text-red-600 dark:text-red-300 mt-2">
                            No puedes crear una venta sin una caja abierta. Por favor, abre una caja primero desde el módulo de Cajas.
                        </p>
                    </div>
                    <Link
                        href="/cajas"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        Ir a Cajas
                    </Link>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'Ventas', href: '/ventas' },
            { title: isEditing ? 'Editar venta' : 'Nueva venta', href: '#' }
        ]}>
            <Head title={isEditing ? 'Editar venta' : 'Nueva venta'} />

            <form onSubmit={handleSubmit} className="space-y-6 p-4">
                {/* Indicador de verificación de caja */}
                {cargandoCaja && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 rounded-lg p-4">
                        <div className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                            Verificando estado de caja...
                        </div>
                    </div>
                )}

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

                    {/* Sección de Envío - SIEMPRE VISIBLE */}
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
                                Desactiva el envío si la venta es presencial
                            </p>
                        )}

                        {errors.requiere_envio && <p className="mt-2 text-sm text-red-600">{errors.requiere_envio}</p>}
                    </div>
                    <br />
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
                        onUpdateDetailUnidadConPrecio={updateDetailUnidadConPrecio} // ✅ NUEVO: Actualizar unidad y precio juntos
                        onManualTipoPrecioChange={(index) => {
                            // ✅ NUEVO: Marcar que el usuario ha seleccionado manualmente este tipo de precio
                            setManuallySelectedTipoPrecio(prev => ({
                                ...prev,
                                [index]: true
                            }));
                        }} // ✅ NUEVO: Notificar cuando usuario selecciona manualmente un tipo de precio
                        onComboItemsChange={(detailIndex, items) => {
                            // ✅ NUEVO: Actualizar el estado de items opcionales cuando el usuario los selecciona/deselecciona
                            setComboItemsMap(prev => ({
                                ...prev,
                                [detailIndex]: items
                            }));
                            console.log(`🔄 [create.tsx] Items del combo actualizado (índice ${detailIndex}):`, items);
                        }} // ✅ NUEVO: Notificar cambios en items opcionales
                    />
                </div>
                {/* Totales */}
                {detallesWithProducts.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md ml-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descuento general
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={data.descuento === 0 && data.descuento.toString() === '0' ? '' : data.descuento}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        // Permitir vacío o solo números y un punto decimal
                                        if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                            const descuento = valor === '' ? 0 : parseFloat(valor);
                                            if (!isNaN(descuento) && descuento >= 0) {
                                                setData('descuento', descuento);
                                                setData('total', data.subtotal - descuento);
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white text-right"
                                    placeholder="0"
                                />
                            </div>

                            {/* ✅ NUEVO: Monto pagado por el cliente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Monto Pagado
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={data.monto_pagado_inicial === 0 && data.monto_pagado_inicial.toString() === '0' ? '' : data.monto_pagado_inicial}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        // Permitir vacío o solo números y un punto decimal
                                        if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                            const monto = valor === '' ? 0 : parseFloat(valor);
                                            if (!isNaN(monto) && monto >= 0) {
                                                setData('monto_pagado_inicial', monto);
                                            }
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white text-right"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* ✅ NUEVO: Resumen completo de la transacción */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700 space-y-2">
                            {/* <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                                <span className="text-gray-900 dark:text-white font-medium text-right">{formatCurrency(data.subtotal)}</span>
                            </div>
 */}
                            {data.descuento > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">Descuento:</span>
                                    <span className="text-red-600 dark:text-red-400 font-medium text-right">-{formatCurrencyWith2Decimals(data.descuento)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200 dark:border-zinc-700">
                                <span className="text-gray-900 dark:text-white">Total:</span>
                                <span className="text-gray-900 dark:text-white text-right">{formatCurrencyWith2Decimals(data.total)}</span>
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

                    {/* ✅ NUEVO: Botón para limpiar borrador manualmente */}
                    <button
                        type="button"
                        onClick={limpiarBorrador}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900 transition-colors"
                        title="Limpiar el borrador de venta guardado en localStorage"
                    >
                        🗑️ Limpiar borrador
                    </button>

                    {/* ✅ NUEVO: Permitir CREDITO incluso con stock insuficiente */}
                    {(() => {
                        const tipoPagoSeleccionado = tipos_pago?.find((t: any) => t.id === data.tipo_pago_id);
                        const isCreditoPayment = tipoPagoSeleccionado?.codigo === 'CREDITO';
                        const buttonDisabled = processing || detallesWithProducts.length === 0 || (!isCreditoPayment && !stockValido);

                        return (
                            <button
                                type="submit"
                                disabled={buttonDisabled}
                                className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${!stockValido && !isCreditoPayment
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                    }`}
                            >
                                {processing
                                    ? 'Guardando...'
                                    : (!stockValido && !isCreditoPayment)
                                        ? 'Stock insuficiente'
                                        : (isEditing ? 'Actualizar venta' : 'Crear venta')
                                }
                            </button>
                        );
                    })()}
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

            {/* Modal de Selección de Salida (Imprimir, Excel, PDF) */}
            {ventaCreada && (
                <OutputSelectionModal
                    isOpen={showOutputModal}
                    onClose={() => {
                        setShowOutputModal(false);
                        setVentaCreada(null);
                    }}
                    documentoId={ventaCreada.id}
                    tipoDocumento="venta"
                    documentoInfo={{
                        numero: ventaCreada.numero,
                        fecha: ventaCreada.fecha
                    }}
                />
            )}
        </AppLayout >
    );
}
