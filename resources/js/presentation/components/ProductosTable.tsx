import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { formatCurrency, formatCurrencyWith2Decimals } from '@/lib/utils';
import { NotificationService } from '@/infrastructure/services/notification.service';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { ModalComprasDiferenciaCostoComponent } from '@/presentation/components/precios/modal-compras-diferencia-costo';
import { tienePreferenciaDiferencia } from '@/domain/types/cascada-precios.types';
import { preciosService } from '@/application/services/precios.service'; // ✅ USAR SERVICIO EXISTENTE
import type { Producto } from '@/domain/entities/ventas';

// Tipos para el componente - más genéricos para compatibilidad
export interface DetalleProducto {
    id?: number | string;
    numero?: number | string; // ✅ NUEVO: Número de línea o identificador
    producto_id: number | string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
    lote?: string;
    fecha_vencimiento?: string;
    precio_costo?: number; // ✅ NUEVO: Precio de costo registrado
    unidad_venta_id?: number | string; // ✅ NUEVO: Unidad de venta para productos fraccionados
    conversiones?: Array<{
        unidad_destino_id: number | string;
        unidad_destino_nombre?: string;
        factor_conversion: number;
    }>; // ✅ NUEVO: Conversiones disponibles
    es_fraccionado?: boolean; // ✅ NUEVO: Indica si el producto es fraccionado
    unidad_medida_id?: number | string; // ✅ NUEVO: Unidad base del producto
    unidad_medida_nombre?: string; // ✅ NUEVO: Nombre de la unidad base
    tipo_precio_id?: number | string | null; // ✅ MODIFICADO: Permite null cuando cliente es GENERAL
    tipo_precio_nombre?: string | null; // ✅ MODIFICADO: Permite null cuando cliente es GENERAL
    tipo_precio_id_recomendado?: number | string | null; // ✅ NUEVO: ID de tipo de precio recomendado del backend
    tipo_precio_nombre_recomendado?: string | null; // ✅ NUEVO: Nombre de tipo de precio recomendado del backend
    producto?: {
        id: number | string;
        nombre: string;
        codigo?: string;
        codigo_barras?: string;
        precio_venta?: number;
        precio_compra?: number;
        precio_costo?: number; // ✅ NUEVO: Precio de costo
        peso?: number; // ✅ NUEVO: Peso del producto en kg
        es_fraccionado?: boolean;
        sku?: string; // ✅ NUEVO 2026-03-06
        marca?: { id?: number; nombre?: string } | null; // ✅ NUEVO 2026-03-06: Mantener como objeto
        unidad?: { id?: number; codigo?: string; nombre?: string } | null; // ✅ NUEVO 2026-03-06: Mantener como objeto
        conversiones?: Array<{
            unidad_destino_id: number | string;
            unidad_destino_nombre?: string;
            factor_conversion: number;
        }>;
        // ✅ NUEVO: Incluir precios disponibles para selección de tipo de precio
        precios?: Array<{
            id: number | string;
            tipo_precio_id: number | string;
            nombre: string;
            precio: number;
        }>;
    };
}

interface ProductosTableProps {
    productos: Producto[]; // Ahora solo para referencia de IDs (podría no usarse)
    detalles: DetalleProducto[];
    onAddProduct: (producto: Producto) => void;
    onUpdateDetail: (index: number, field: keyof DetalleProducto, value: number | string) => void;
    onRemoveDetail: (index: number) => void;
    onTotalsChange: (detalles: DetalleProducto[]) => void;
    tipo: 'compra' | 'venta';
    errors?: Record<string, string>;
    showLoteFields?: boolean; // Para mostrar campos de lote y fecha de vencimiento en compras
    almacen_id?: number; // ✅ NUEVO: Almacén para búsqueda API
    cliente_id?: number | null; // ✅ NUEVO: Cliente para filtrar tipos_precio (LICORERIA vs VENTA)
    manuallySelectedTipoPrecio?: Record<number, boolean>; // ✅ NUEVO: Track cuáles fueron selecciones manuales del usuario
    isCalculatingPrices?: boolean; // ✅ NUEVO: Mostrar indicador de carga al calcular precios
    readOnly?: boolean; // ✅ NUEVO: Deshabilitar edición de detalles (para APROBADO+)
    onUpdateDetailUnidadConPrecio?: (index: number, unidadId: number, precio: number) => void; // ✅ NUEVO: Actualizar unidad y precio juntos
    onManualTipoPrecioChange?: (index: number) => void; // ✅ NUEVO: Notificar cuando usuario selecciona manualmente un tipo de precio
    onComboItemsChange?: (detailIndex: number, items: any[]) => void; // ✅ NUEVO: Notificar cuando cambian los items opcionales del combo
    default_tipo_precio_id?: number | string; // ✅ NUEVO: ID del tipo de precio por defecto (fallback cuando no hay tipo asignado)
    carritoCalculado?: any; // ✅ NUEVO (2026-02-17): Datos de rangos aplicados para actualizar precios automáticamente
    onDetallesActualizados?: (detalles: DetalleProducto[]) => void; // ✅ NUEVO (2026-02-17): Callback cuando se actualizan detalles por cambios de rangos
    es_farmacia?: boolean; // ✅ NUEVO: Indicador para mostrar/ocultar campos de medicamentos en sugerencias
}

export default function ProductosTable({
    productos,
    detalles,
    onAddProduct,
    onUpdateDetail,
    onRemoveDetail,
    almacen_id,
    cliente_id, // ✅ NUEVO: Cliente para filtrar tipos_precio
    manuallySelectedTipoPrecio = {}, // ✅ NUEVO: Track cuáles fueron selecciones manuales
    isCalculatingPrices = false, // ✅ NUEVO: Indicador de carga
    readOnly = false, // ✅ NUEVO: Modo solo lectura
    tipo = 'compra', // ✅ NUEVO: Tipo de documento (compra o venta)
    onUpdateDetailUnidadConPrecio, // ✅ NUEVO: Actualizar unidad y precio juntos
    onManualTipoPrecioChange, // ✅ NUEVO: Notificar cuando usuario selecciona manualmente un tipo de precio
    onComboItemsChange, // ✅ NUEVO: Notificar cambios en items opcionales del combo
    default_tipo_precio_id, // ✅ NUEVO: Tipo precio por defecto (fallback)
    carritoCalculado, // ✅ NUEVO (2026-02-17): Datos de rangos para actualizar precios
    onDetallesActualizados, // ✅ NUEVO (2026-02-17): Callback cuando se actualizan detalles
    es_farmacia = false // ✅ NUEVO: Indicador para mostrar/ocultar campos de medicamentos
}: ProductosTableProps) {

    // ✅ DEBUG: Loguear props recibidos
    console.log('📋 ProductosTable - Props recibidos:', productos);
    console.log('Detalles recibidos:', detalles);
    // ✅ DEBUG: Loguear si es farmacia
    console.log('🏥 ProductosTable - es_farmacia:', es_farmacia);
    const [productSearch, setProductSearch] = useState('');
    const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    // ✅ NUEVO: Estado local para edición de campos (previene re-renders mientras escribes)
    const [editingField, setEditingField] = useState<{ index: number; field: string } | null>(null);
    // ✅ NUEVO: Estado local para tipos de precio seleccionados (cache para re-renderización)
    const [selectedTipoPrecio, setSelectedTipoPrecio] = useState<Record<number, number>>({});
    // ✅ Estado para controlar qué combos están expandidos
    const [expandedCombos, setExpandedCombos] = useState<Record<number, boolean>>({});
    // ✅ NUEVO: Mapa de combo_items actualizados por COMBO_ID (no por índice) para evitar conflictos
    const [comboItemsMap, setComboItemsMap] = useState<Record<number, Array<any>>>({});
    // ✅ NUEVO: Estado para mostrar modal con info de medicamentos (farmacia)
    const [farmaciaProdutoSeleccionado, setFarmaciaProdutoSeleccionado] = useState<Producto | null>(null);

    // ✅ NUEVO: useEffect para expandir automáticamente combos recién agregados
    useEffect(() => {
        if (detalles.length === 0) return;

        const ultimoDetalle = detalles[detalles.length - 1];
        const ultimoIndice = detalles.length - 1;

        // ✅ CRÍTICO: Usar INDEX (no comboId) para expandedCombos para consistencia con renderización
        // En la línea 1406, renderiza usa expandedCombos[index], así que debe ser consistente
        const comboId = ultimoDetalle?.producto?.id;

        // Verificar si el último detalle agregado es un combo
        if (ultimoDetalle?.producto && (ultimoDetalle.producto as any).es_combo && comboId) {
            const tieneComponentes = ((ultimoDetalle.producto as any).combo_items?.length || 0) > 0;

            // ✅ FIJO (2026-02-18): Usar ultimoIndice para expandedCombos (no comboId)
            if (tieneComponentes && !expandedCombos[ultimoIndice]) {
                console.log(`✅ [ProductosTable] Expandiendo automáticamente combo: ${ultimoDetalle.producto.nombre} (index: ${ultimoIndice}, comboId: ${comboId})`);
                setExpandedCombos(prev => ({
                    ...prev,
                    [ultimoIndice]: true
                }));

                // ✅ Inicializar combo_items: obligatorios marcados, opcionales desmarcados
                const comboItems = ((ultimoDetalle.producto as any).combo_items || []).map((item: any) => ({
                    ...item,
                    incluido: item.es_obligatorio === true // Solo marcar obligatorios inicialmente
                }));

                // ✅ CRÍTICO: Guardar con comboId, no con índice
                setComboItemsMap(prev => ({
                    ...prev,
                    [comboId]: comboItems
                }));
            }
        }

        // ✅ NUEVO: Inicializar select de tipo de precio con tipo_precio_id_recomendado del backend, fallback a "Precio Venta"
        if (tipo === 'venta' && !selectedTipoPrecio[ultimoIndice]) {
            // ✅ CRÍTICO: Primero intentar usar el tipo_precio_id_recomendado que viene del backend
            if (ultimoDetalle.tipo_precio_id_recomendado) {
                console.log(`✅ [ProductosTable] Inicializando select con tipo_precio_id_recomendado del backend: ${ultimoDetalle.tipo_precio_id_recomendado} (${ultimoDetalle.tipo_precio_nombre_recomendado})`);
                setSelectedTipoPrecio(prev => ({
                    ...prev,
                    [ultimoIndice]: String(ultimoDetalle.tipo_precio_id_recomendado)
                }));
            } else {
                // Fallback: Buscar "Precio Venta" o usar el primero disponible
                const precios = ultimoDetalle.producto?.precios || [];
                const preciosVenta = precios.filter(p => {
                    const nombre = (p.nombre || '').toLowerCase();
                    return !nombre.includes('costo') && !nombre.includes('cost');
                });

                const precioVenta = preciosVenta.find(p =>
                    (p.nombre || '').toLowerCase().includes('venta')
                ) || preciosVenta[0];

                if (precioVenta) {
                    console.log(`✅ [ProductosTable] Inicializando select con fallback - Precio Venta: ${precioVenta.nombre} (ID: ${precioVenta.tipo_precio_id})`);
                    setSelectedTipoPrecio(prev => ({
                        ...prev,
                        [ultimoIndice]: String(precioVenta.tipo_precio_id)
                    }));
                }
            }
        }
    }, [detalles.length]); // Solo vigilar cambios en la cantidad de detalles

    // ✅ NUEVO (2026-02-17): useEffect para inicializar combos expandidos desde el backend
    // Maneja combos pre-existentes que llegan con expanded: true (ej: desde proforma Show.tsx)
    useEffect(() => {
        if (detalles.length === 0) return;

        const newExpandedCombos: Record<number, boolean> = { ...expandedCombos };
        const newComboItemsMap: Record<number, Array<any>> = { ...comboItemsMap };
        let hasChanges = false;

        detalles.forEach((detalle, index) => {
            const producto = detalle.producto as any;
            if (!producto) return;

            const esCombo = producto.es_combo === true;
            const comboItems = producto.combo_items || [];
            const tieneComponentes = comboItems.length > 0;

            // ✅ CRÍTICO (2026-02-18): Usar campo 'expanded' del backend si está presente
            // El backend (ProformaResponseDTO) envía expanded: true para combos que deben mostrarse expandidos
            const deberiaEstarExpandido = (detalle as any).expanded === true || tieneComponentes;

            // ✅ Expandir todos los combos que tengan componentes
            if (esCombo && tieneComponentes) {
                const comboId = producto.id;

                // ✅ CRÍTICO: Usar INDEX para expandedCombos (es lo que espera ProductosTable)
                // pero usar comboId para comboItemsMap (para evitar colisiones si hay múltiples detalles con el mismo producto)
                if (!expandedCombos[index] && deberiaEstarExpandido) {
                    console.log(`✅ [ProductosTable] Inicializando combo expandido desde backend: ${producto.nombre} (index: ${index}, comboId: ${comboId}, expanded field: ${(detalle as any).expanded})`);
                    newExpandedCombos[index] = true;
                    hasChanges = true;

                    // ✅ Inicializar combo_items desde el detalle (usar comboId para la clave)
                    if (!comboItemsMap[comboId]) {
                        const comboItemsSeleccionados = (detalle as any).combo_items_seleccionados || [];
                        const inicializados = comboItemsSeleccionados.length > 0
                            ? comboItemsSeleccionados
                            : comboItems.map((item: any) => ({
                                ...item,
                                incluido: item.es_obligatorio === true // Solo obligatorios inicialmente
                            }));

                        newComboItemsMap[comboId] = inicializados;
                        console.log(`✅ [ProductosTable] Inicializados combo_items para: ${producto.nombre}`, inicializados);
                    }
                }
            }
        });

        // ✅ Actualizar estados solo si hay cambios
        if (hasChanges) {
            setExpandedCombos(newExpandedCombos);
            setComboItemsMap(newComboItemsMap);
        }
    }, [detalles.length, detalles.map(d => d.producto?.id).join('')]); // ✅ FIXED: Solo vigilar cambios en detalles, no en expandedCombos/comboItemsMap (causa bucles)

    // ✅ NUEVO (2026-02-17): useEffect para actualizar precios cuando cambian rangos aplicables
    // Centraliza la lógica que estaba en create.tsx para reutilizarla en Show/Edit de proformas
    useEffect(() => {
        if (!carritoCalculado || detalles.length === 0) {
            return;
        }

        const detallesActualizados = detalles.map((detalle, index) => {
            const detalleRango = carritoCalculado?.detalles?.find(
                (dr: any) => dr.producto_id === detalle.producto_id
            );

            // ✅ Solo actualizar si:
            // 1. Hay detalleRango disponible
            // 2. El tipo_precio_nombre del rango es diferente AL ACTUAL
            // 3. El rango devolvió un tipo_precio_nombre (NO es null) - si es null, mantener el actual
            // 4. NO ha sido seleccionado manualmente por el usuario
            if (
                detalleRango &&
                detalleRango.tipo_precio_nombre !== null &&  // ✅ NUEVO (2026-02-17): Solo actualizar si hay tipo_precio válido
                detalleRango.tipo_precio_nombre !== detalle.tipo_precio_nombre &&
                !manuallySelectedTipoPrecio[index] // No actualizar si fue seleccionado manualmente
            ) {
                console.log(`🏷️ [ProductosTable - useEffect] Actualizando tipo de precio para producto ${detalle.producto_id}: ${detalle.tipo_precio_nombre} → ${detalleRango.tipo_precio_nombre}`, {
                    precio_anterior: detalle.precio_unitario,
                    precio_nuevo: detalleRango.precio_unitario,
                    subtotal_anterior: detalle.subtotal,
                    subtotal_nuevo: detalleRango.cantidad * (detalleRango.precio_unitario || detalle.precio_unitario),
                    unidad_venta_id_preservada: detalle.unidad_venta_id,
                    fue_manual: manuallySelectedTipoPrecio[index] ? 'SÍ (IGNORADO)' : 'NO'
                });

                // ✅ Actualizar precio_unitario y subtotal junto con tipo_precio
                const nuevoSubtotal = detalleRango.cantidad * (detalleRango.precio_unitario || detalle.precio_unitario);

                return {
                    ...detalle,
                    tipo_precio_id: detalleRango.tipo_precio_id,
                    tipo_precio_nombre: detalleRango.tipo_precio_nombre,
                    precio_unitario: detalleRango.precio_unitario ?? detalle.precio_unitario,
                    subtotal: nuevoSubtotal
                };
            }

            return detalle;
        });

        // ✅ Verificar si hubo cambios reales
        const huboCambios = detallesActualizados.some((det, idx) =>
            JSON.stringify(det) !== JSON.stringify(detalles[idx])
        );

        if (huboCambios && onDetallesActualizados) {
            console.log('✅ [ProductosTable] Detalles actualizados por cambio de rangos, notificando al padre');
            onDetallesActualizados(detallesActualizados);
        }
    }, [carritoCalculado, detalles, manuallySelectedTipoPrecio, onDetallesActualizados]);

    // ✅ NUEVO: Estado para modal de cascada de precios
    const [modalCascadaState, setModalCascadaState] = useState<{
        isOpen: boolean;
        productoId: number | null;
        precioActual: number | null;
        precioCostoNuevo: number | null;
        detalleIndex: number | null;
        productoData: any;
    }>({
        isOpen: false,
        productoId: null,
        precioActual: null,
        precioCostoNuevo: null,
        detalleIndex: null,
        productoData: null
    });

    // ✅ NUEVO: Función para agregar producto y limpiar input/sugerencias
    const handleAgregarProductoYLimpiar = (producto: Producto) => {
        // ✅ NUEVO 2026-03-06: Log para ver estructura exacta del producto antes de agregar
        console.log('📥 [handleAgregarProductoYLimpiar] Producto a agregar:', JSON.stringify(producto, null, 2));
        console.log('🔍 [handleAgregarProductoYLimpiar] Campos específicos:', {
            id: producto.id,
            nombre: producto.nombre,
            codigo: producto.codigo,
            sku: producto.sku,
            codigo_barras: producto.codigo_barras,
            marca: producto.marca,
            unidad: producto.unidad,
            precio_compra: (producto as any).precio_compra,
            precio_venta: (producto as any).precio_venta
        });
        onAddProduct(producto);
        setProductSearch('');
        setProductosDisponibles([]);
        setSearchError(null);
    };

    // ✅ NUEVO: Función para buscar productos manualmente (botón o Enter)
    const buscarProductos = async (searchTerm?: string) => {
        const term = (searchTerm || productSearch).trim();

        // Si no hay búsqueda, limpiar resultados
        if (term === '') {
            setProductosDisponibles([]);
            setSearchError(null);
            return;
        }

        // Si búsqueda muy corta, no hacer request
        if (term.length < 2) {
            setSearchError('Ingresa al menos 2 caracteres para buscar');
            return;
        }

        // Llamar a API de búsqueda
        setIsLoading(true);
        setSearchError(null);

        try {
            const params = new URLSearchParams({
                q: term,
                limite: '10',
                tipo: tipo // ✅ Pasar tipo de documento (compra o venta)
            });

            // ✅ Pasar almacen_id si está disponible
            if (almacen_id) {
                params.append('almacen_id', almacen_id.toString());
            }

            // ✅ NUEVO: Pasar cliente_id para filtrar tipos_precio (LICORERIA vs VENTA)
            if (cliente_id) {
                params.append('cliente_id', cliente_id.toString());
            }

            const url = `/api/productos/buscar?${params.toString()}`;
            console.log('🔍 [ProductosTable] Buscando productos con endpoint:', url);
            console.log('📋 [ProductosTable] Parámetros:', {
                q: term,
                limite: '10',
                tipo: tipo,
                almacen_id: almacen_id || 'sin especificar',
                cliente_id: cliente_id || 'sin especificar'
            });

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`⚠️ [ProductosTable] Respuesta fallida: ${response.status} ${response.statusText}`);
                throw new Error('Error en búsqueda de productos');
            }

            const data = await response.json();

            console.log('✅ [ProductosTable] Respuesta API completa:', data.data);
            // ✅ NUEVO 2026-03-06: Mostrar estructura del primer producto
            if (data.data && data.data.length > 0) {
                console.log('📦 [ProductosTable] Estructura del PRIMER PRODUCTO del endpoint:', JSON.stringify(data.data[0], null, 2));
                console.log('🔍 [ProductosTable] Campos específicos:', {
                    id: data.data[0].id,
                    nombre: data.data[0].nombre,
                    codigo: data.data[0].codigo,
                    codigo_barras: data.data[0].codigo_barras,
                    marca: data.data[0].marca,
                    unidad: data.data[0].unidad,
                    precio_compra: data.data[0].precio_compra,
                    precio_venta: data.data[0].precio_venta
                });
            }
            console.log('🏥 [buscarProductos] Contexto de farmacia - es_farmacia:', es_farmacia);

            // Transformar respuesta de API a formato Producto
            const productosAPI = data.data.map((p: any) => {
                // ✅ CORREGIDO: Para compras, asegurar que stock_disponible siempre tiene un valor
                const stockDisponible = tipo === 'compra'
                    ? (p.stock_disponible !== null && p.stock_disponible !== undefined ? p.stock_disponible : (p.stock || 0))
                    : (p.stock_disponible || 0);

                return {
                    id: p.id,
                    nombre: p.nombre,
                    codigo: p.sku || p.codigo_barras,
                    codigo_barras: p.codigo_barras,
                    precio_venta: p.precio_base || 0,
                    precio_costo: p.precio_costo || 0, // ✅ NUEVO: Precio de costo desde API
                    precio_compra: p.precio_costo || 0, // ✅ NUEVO: Precio de compra (igual al costo)
                    stock: stockDisponible,
                    stock_disponible_calc: stockDisponible, // ✅ CORREGIDO: Stock disponible para compras
                    stock_total_calc: p.stock_total || 0, // ✅ AGREGADO: Stock total calculado
                    stock_reservado: p.stock_reservado || 0, // ✅ AGREGADO: Stock reservado
                    capacidad: p.capacidad || null, // ✅ AGREGADO: Capacidad (para combos)
                    peso: p.peso,
                    codigos_barras: p.codigosBarra?.map((cb: any) => cb.codigo) || [],
                    // ✅ NUEVO: Campos para productos fraccionados
                    es_fraccionado: p.es_fraccionado || false,
                    unidad_medida_id: p.unidad_medida_id,
                    unidad_medida_nombre: p.unidad_medida_nombre,
                    conversiones: p.conversiones || [],
                    // ✅ NUEVO: Incluir precios disponibles para selección
                    precios: p.precios?.map((pr: any) => ({
                        id: pr.id,
                        tipo_precio_id: pr.tipo_precio_id,
                        nombre: pr.nombre || pr.tipoPrecio?.nombre,
                        precio: pr.precio
                    })) || [],
                    // ✅ NUEVO: Incluir tipo de precio recomendado del backend
                    tipo_precio_id_recomendado: p.tipo_precio_id_recomendado,
                    tipo_precio_nombre_recomendado: p.tipo_precio_nombre_recomendado,
                    // ✅ NUEVO: Incluir es_combo
                    es_combo: p.es_combo || false,
                    combo_items: p.combo_items || [],
                    // ✅ NUEVO: Incluir límites
                    limite_productos: p.limite_productos || null,
                    limite_venta: p.limite_venta || null,
                    // ✅ NUEVO: Incluir marca, unidad y categoría para mostrar en sugerencias
                    marca: p.marca ? { id: p.marca.id, nombre: p.marca.nombre } : null,
                    unidad: p.unidad ? { id: p.unidad.id, nombre: p.unidad.nombre, codigo: p.unidad.codigo } : null,
                    categoria: p.categoria ? { id: p.categoria.id, nombre: p.categoria.nombre } : null,
                    // ✅ NUEVO: Incluir campos de medicamentos (farmacia)
                    principio_activo: p.principio_activo || null,
                    uso_de_medicacion: p.uso_de_medicacion || null
                };
            });

            console.log('✅ Productos transformados:', productosAPI);

            // ✅ NUEVO: Filtrar productos válidos para ventas (stock > 0 y precio_venta > 0)
            // IMPORTANTE: Si incluirCombos=true, permitir combos sin stock ni precio_venta (se calcula de los componentes)
            const productosValidos = productosAPI.filter(p => {
                if (tipo === 'venta') {
                    const esCombo = (p as any).es_combo || false;
                    const tieneComponentes = ((p as any).combo_items?.length || 0) > 0;

                    // ✅ SIMPLIFICADO: Backend determina automáticamente si es combo
                    console.log(`📦 Filtrando producto ${p.nombre}:`, {
                        es_combo: esCombo,
                        stock: p.stock,
                        precio_venta: p.precio_venta,
                        tiene_componentes: tieneComponentes,
                        resultado: esCombo ? tieneComponentes : (p.stock > 0 && p.precio_venta > 0)
                    });

                    // ✅ Si es combo, solo requiere componentes (stock se calcula de ellos)
                    if (esCombo) {
                        return tieneComponentes;
                    }

                    // Para productos normales, requiere stock y precio
                    return p.stock > 0 && p.precio_venta > 0;
                }
                return true; // Para compras mostrar todos
            });

            console.log(`🔍 Productos encontrados: ${productosAPI.length}, Válidos: ${productosValidos.length}`, { productosValidos });

            setProductosDisponibles(productosValidos);

            // ✅ NUEVO: Si hay exactamente 1 resultado válido, agregarlo automáticamente
            if (productosValidos.length === 1) {
                handleAgregarProductoYLimpiar(productosValidos[0]);
            }
        } catch (error) {
            console.error('Error buscando productos:', error);
            setSearchError('Error al buscar productos');
            setProductosDisponibles([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ MODIFICADO: Manejar resultado del escáner via API (búsqueda EXACTA)
    const handleScannerResult = async (result: string) => {
        if (result) {
            try {
                setIsLoading(true);
                setSearchError(null);

                const params = new URLSearchParams({
                    q: result,
                    tipo_busqueda: 'exacta', // ✅ NUEVO: Búsqueda exacta para código de barras
                    limite: '1',
                    tipo: tipo // ✅ NUEVO: Pasar tipo de documento (compra o venta)
                });

                if (almacen_id) {
                    params.append('almacen_id', almacen_id.toString());
                }

                // ✅ NUEVO: Pasar cliente_id para filtrar tipos_precio (LICORERIA vs VENTA)
                if (cliente_id) {
                    params.append('cliente_id', cliente_id.toString());
                }

                const url = `/api/productos/buscar?${params.toString()}`;
                console.log('🔍 [ProductosTable - Scanner] Buscando por código de barras:', url);

                const response = await fetch(url);

                if (!response.ok) {
                    console.error(`⚠️ [ProductosTable - Scanner] Respuesta fallida: ${response.status} ${response.statusText}`);
                    throw new Error('Error buscando producto');
                }

                const data = await response.json();
                console.log('✅ [ProductosTable - Scanner] Respuesta:', data.data);

                if (data.data && data.data.length > 0) {
                    const productoAPI = data.data[0];

                    // ✅ NUEVO: Validar producto para ventas (stock > 0 y precio_venta > 0)
                    // ✅ SIMPLIFICADO: Backend determina automáticamente si es combo
                    if (tipo === 'venta') {
                        const stock = productoAPI.stock_disponible || 0;
                        const precioVenta = productoAPI.precio_base || 0;
                        const esCombo = productoAPI.es_combo || false;
                        const tieneComponentes = (productoAPI.combo_items?.length || 0) > 0;

                        // Si NO es combo, requerir stock y precio
                        if (!esCombo) {
                            if (stock === 0) {
                                NotificationService.error('Producto sin stock disponible');
                                return;
                            }

                            if (precioVenta === 0) {
                                NotificationService.error('Producto sin precio de venta configurado');
                                return;
                            }
                        } else {
                            // Si es combo, debe tener componentes
                            if (!tieneComponentes) {
                                NotificationService.error('Combo sin productos componentes configurados');
                                return;
                            }
                        }
                    }

                    const producto: Producto = {
                        id: productoAPI.id,
                        nombre: productoAPI.nombre,
                        codigo: productoAPI.sku || productoAPI.codigo_barras,
                        codigo_barras: productoAPI.codigo_barras,
                        precio_venta: productoAPI.precio_base || 0,
                        precio_costo: productoAPI.precio_costo || 0, // ✅ NUEVO: Precio de costo desde API
                        precio_compra: productoAPI.precio_costo || 0, // ✅ NUEVO: Precio de compra (igual al costo)
                        stock: productoAPI.stock_disponible || 0,
                        peso: productoAPI.peso,
                        codigos_barras: productoAPI.codigosBarra?.map((cb: any) => cb.codigo) || [],
                        // ✅ NUEVO: Campos para productos fraccionados
                        es_fraccionado: productoAPI.es_fraccionado || false,
                        unidad_medida_id: productoAPI.unidad_medida_id,
                        unidad_medida_nombre: productoAPI.unidad_medida_nombre,
                        conversiones: productoAPI.conversiones || [],
                        // ✅ NUEVO: Incluir precios disponibles para selección
                        precios: productoAPI.precios?.map((pr: any) => ({
                            id: pr.id,
                            tipo_precio_id: pr.tipo_precio_id,
                            nombre: pr.nombre || pr.tipoPrecio?.nombre,
                            precio: pr.precio
                        })) || []
                    };

                    handleAgregarProductoYLimpiar(producto);
                    setShowScannerModal(false);
                    NotificationService.success(`Producto escaneado: ${producto.nombre}`);
                } else {
                    NotificationService.error('No se encontró producto con ese código de barras');
                }
            } catch (error) {
                console.error('Error escaneando:', error);
                NotificationService.error('Error al buscar producto escaneado');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Función para manejar errores del escáner
    const handleScannerError = (error: string) => {
        setScannerError(error);
        console.warn('Error del escáner:', error);
    };

    // Función para abrir el modal del escáner
    const openScannerModal = () => {
        setScannerError(null);
        setShowScannerModal(true);
    };

    // Función para cerrar el modal del escáner
    const closeScannerModal = () => {
        setShowScannerModal(false);
        setScannerError(null);
    };

    // Función para actualizar detalle
    const handleUpdateDetail = (index: number, field: keyof DetalleProducto, value: number | string) => {
        // ✅ NUEVO: Si se actualiza cantidad de un combo, propagar a componentes
        if (field === 'cantidad' && detalles[index]?.producto && (detalles[index].producto as any).es_combo) {
            const cantidadAnterior = detalles[index].cantidad;
            const cantidadNueva = typeof value === 'number' ? value : parseInt(value as string, 10);

            console.log(`🔄 [COMBO] Cambio de cantidad detectado:`, {
                index,
                esCombo: true,
                cantidadAnterior,
                cantidadNueva,
                productoNombre: (detalles[index].producto as any)?.nombre,
                totalDetalles: detalles.length,
            });

            if (!isNaN(cantidadNueva) && cantidadAnterior !== cantidadNueva) {
                console.log(`📊 Cantidad del combo: ${cantidadAnterior} → ${cantidadNueva}`);

                // ✅ Obtener items actuales del mapa (si existen, preservan selecciones del usuario)
                const comboId = (detalles[index].producto as any)?.id;
                const itemsActualesDelMapa = comboId ? comboItemsMap[comboId] : null;
                const comboItems = ((detalles[index].producto as any).combo_items || []) as Array<any>;
                console.log(`🎁 Componentes del combo encontrados: ${comboItems.length}`, comboItems.map(item => ({ nombre: item.producto_nombre, cantidadOriginal: item.cantidad })));

                // ✅ CRÍTICO: Preservar TANTO el estado "incluido" como las cantidades editadas manualmente
                // Mapear items originales con sus selecciones guardadas
                const comboItemsActualizados = comboItems.map((item, itemIdx) => {
                    const cantidadComponenteOriginal = item.cantidad; // Cantidad original en el combo (ej: 2, 1, etc)
                    const cantidadComponenteNueva = cantidadNueva * cantidadComponenteOriginal; // Cantidad final = combo_qty × componente_original_qty

                    // ✅ IMPORTANTE: Preservar TANTO el valor "incluido" como la cantidad editada manualmente
                    const incluidoDelUsuario = itemsActualesDelMapa?.[itemIdx]?.incluido;
                    const cantidadEditadaManualmente = itemsActualesDelMapa?.[itemIdx]?.cantidad;
                    const incluido = incluidoDelUsuario !== undefined ? incluidoDelUsuario : (item.es_obligatorio !== false);

                    // ✅ Si el usuario editó manualmente la cantidad, mantener esa edición (escala proporcionalmente)
                    // De lo contrario, usar la cantidad calculada
                    let cantidadFinal = cantidadComponenteNueva;
                    if (cantidadEditadaManualmente !== undefined && cantidadEditadaManualmente !== null) {
                        // Si hay una cantidad editada, usar la proporción: cantidad_editada / cantidad_anterior
                        const cantidadAnteriorDelItem = itemsActualesDelMapa?.[itemIdx]?.cantidad || cantidadComponenteNueva;
                        const proporcion = cantidadAnteriorDelItem > 0 ? (cantidadEditadaManualmente / cantidadAnteriorDelItem) : 1;
                        cantidadFinal = cantidadComponenteNueva * proporcion;
                    }

                    console.log(`  ✏️  Actualizando componente: ${item.producto_nombre}`, {
                        cantidadOriginal: cantidadComponenteOriginal,
                        cantidadDelCombo: cantidadNueva,
                        cantidadFinal: cantidadFinal,
                        cantidadEditadaManualmente: cantidadEditadaManualmente,
                        incluido: incluido,
                        preservadoDelMapa: incluidoDelUsuario !== undefined
                    });

                    return {
                        ...item,
                        cantidad: cantidadFinal,
                        incluido: incluido  // ✅ Preservar selección del usuario
                    };
                });

                console.log(`✅ Actualización de combo completada - componentes actualizados:`,
                    comboItemsActualizados.map(i => ({ nombre: i.producto_nombre, cantidad: i.cantidad, incluido: i.incluido })));

                // ✅ CRÍTICO: Guardar combo_items en mapa (persisten aunque detalles cambien)
                // Usar comboId en lugar de index para evitar colisiones entre diferentes combos
                if (comboId) {
                    setComboItemsMap(prev => ({
                        ...prev,
                        [comboId]: comboItemsActualizados
                    }));
                }

                // ✅ IMPORTANTE: Llamar a onUpdateDetail UNA SOLA VEZ para actualizar cantidad del combo
                onUpdateDetail(index, field, value);

                return;
            }
        }

        onUpdateDetail(index, field, value);
    };

    // ✅ NUEVO: Handler para guardar precios desde modal
    const handleGuardarPreciosModal = useCallback(async (
        preciosCambiados: Array<{
            precio_id: number;
            precio_nuevo: number;
            porcentaje_ganancia: number;
            motivo: string;
        }>
    ) => {
        return await preciosService.actualizarLote(preciosCambiados);
    }, []);

    // ✅ NUEVO: Handler cuando se guardan precios exitosamente
    const handlePreciosActualizados = useCallback(() => {
        setModalCascadaState(prev => ({ ...prev, isOpen: false }));
        // El modal ya muestra el mensaje de éxito
    }, []);

    // ✅ NUEVO: Handler para cerrar modal
    const handleCerrarModalCascada = useCallback(() => {
        setModalCascadaState(prev => ({ ...prev, isOpen: false }));
    }, []);

    // ✅ NUEVO: Handler para abrir modal de cascada
    const handleAbrirModalCascada = useCallback((index: number, detalle: DetalleProducto) => {
        setModalCascadaState({
            isOpen: true,
            productoId: typeof detalle.producto_id === 'string' ? parseInt(detalle.producto_id) : detalle.producto_id,
            precioActual: detalle.precio_costo || null,
            precioCostoNuevo: detalle.precio_unitario || null,
            detalleIndex: index,
            productoData: detalle.producto || { id: detalle.producto_id, nombre: 'Producto' }
        });
    }, []);

    // ✅ NUEVO: Calcular precio según unidad seleccionada
    const calcularPrecioPorUnidad = (precioBase: number, unidadDestinoId: number | string | undefined, conversiones?: Array<any>): number => {
        if (!unidadDestinoId || !conversiones || conversiones.length === 0) {
            return precioBase;
        }

        const conversion = conversiones.find(c => c.unidad_destino_id === unidadDestinoId);
        if (!conversion || conversion.factor_conversion === 0) {
            return precioBase;
        }

        return precioBase / conversion.factor_conversion;
    };

    // ✅ NUEVO: Formatear precio de venta - mostrar 2 decimales si tiene decimales, solo entero si no
    const formatearPrecioVenta = (precio: number): string => {
        const parteDecimal = precio % 1;
        if (parteDecimal === 0) {
            return Math.floor(precio).toString();
        }
        return precio.toFixed(2);
    };

    return (
        <div>
            {/* Buscador de productos */}
            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 pb-3 mb-3">
                <div className="flex gap-1.5">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    buscarProductos();
                                }
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoComplete="off"
                            disabled={readOnly}
                            className={`w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${productSearch ? 'pt-3' : ''}`}
                            placeholder=""
                        />
                        <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${productSearch || isFocused
                            ? 'top-[-20px] text-xs font-medium text-blue-600 dark:text-blue-400'
                            : 'top-1/2 -translate-y-1/2 text-xs text-gray-600 dark:text-gray-400'
                            }`}>
                            Buscar productos
                        </label>
                    </div>
                    <button
                        type="button"
                        disabled={readOnly || isLoading}
                        onClick={() => buscarProductos()}
                        className="px-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Buscar producto"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        disabled={readOnly}
                        onClick={openScannerModal}
                        className="px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Escanear código de barras"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 18h4.01M12 9h4.01M12 6h4.01M12 3h4.01" />
                        </svg>
                    </button>
                </div>

                {/* ✅ Mostrar resultados solo si hay búsqueda realizada */}
                {(productosDisponibles.length > 0 || searchError || (productSearch && !isLoading && productosDisponibles.length === 0)) && (
                    <div className="mt-1 max-h-[300px] overflow-y-auto border border-gray-200 dark:border-zinc-600 rounded-md">
                        {/* ✅ ESTADO: Cargando */}
                        {isLoading && (
                            <div className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 text-center">
                                🔍 Buscando...
                            </div>
                        )}

                        {/* ✅ ESTADO: Error */}
                        {searchError && !isLoading && (
                            <div className="px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 text-center">
                                ❌ {searchError}
                            </div>
                        )}

                        {/* ✅ ESTADO: Resultados encontrados */}
                        {!isLoading && productosDisponibles.length > 0 && (
                            <>
                                {/* ✅ ENCABEZADO: Contador de productos */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-3 border-b-2 border-green-200 dark:border-green-800">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm text-green-900 dark:text-green-200">
                                            ✨ {productosDisponibles.length} {productosDisponibles.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                                        </span>
                                        <span className="text-xs text-green-700 dark:text-green-300">Haz clic para agregar</span>
                                    </div>
                                </div>

                                {productosDisponibles.map((producto) => (
                                    <div
                                        key={producto.id}
                                        className="border-b border-gray-100 dark:border-zinc-700 last:border-b-0"
                                    >
                                        <button
                                            type="button"
                                            disabled={readOnly}
                                            onClick={() => handleAgregarProductoYLimpiar(producto)}
                                            className="w-full text-left px-4 py-3.5 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {/* ✅ NUEVO: Nombre del producto */}
                                            <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {producto.nombre}
                                            </div>
                                            {/* ✅ NUEVO: Código, precio (redondeado a 2 decimales) y stock */}
                                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                                                <span className="font-medium">{producto.codigo}</span>
                                                <span className="text-green-700 dark:text-green-400 font-bold ml-2">
                                                    {formatCurrencyWith2Decimals(producto.precio_venta || 0)}
                                                </span>
                                                {/* ✅ Mostrar stock para compras */}
                                                {tipo === 'compra' ? (
                                                    <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">
                                                        📦 Stock: {(producto as any).stock_disponible ?? (producto as any).stock ?? 0}
                                                    </span>
                                                ) : (
                                                    (producto as any).stock_disponible && <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">📦 Stock: {(producto as any).stock_disponible}</span>
                                                )}
                                            </div>
                                            {/* ✅ NUEVO: Metadatos del producto (unidad, marca, categoría) */}
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 flex flex-wrap gap-2">
                                                {producto.unidad && (
                                                    <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full text-blue-700 dark:text-blue-300 font-medium">
                                                        {producto.unidad.nombre}
                                                    </span>
                                                )}
                                                {producto.marca && (
                                                    <span className="bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300 font-medium">
                                                        {producto.marca.nombre}
                                                    </span>
                                                )}
                                                {producto.categoria && (
                                                    <span className="bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full text-amber-700 dark:text-amber-300 font-medium">
                                                        {producto.categoria.nombre}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                        {/* ✅ NUEVO: Botón para mostrar info de medicamentos (solo para farmacias) */}
                                        {(() => {
                                            const mostrarMedicamentos = es_farmacia && (producto.principio_activo || producto.uso_de_medicacion);
                                            if (mostrarMedicamentos) {
                                                console.log(`💊 [Sugerencias] Mostrando medicamento para ${producto.nombre}:`, {
                                                    es_farmacia,
                                                    principio_activo: producto.principio_activo,
                                                    uso_de_medicacion: producto.uso_de_medicacion
                                                });
                                            }
                                            return mostrarMedicamentos && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFarmaciaProdutoSeleccionado(producto)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-zinc-700 font-semibold flex items-center gap-2"
                                                >
                                                    <span>💊 Ver información del medicamento</span>
                                                </button>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </>
                        )}

                        {/* ✅ ESTADO: Sin resultados */}
                        {!isLoading && productosDisponibles.length === 0 && !searchError && (
                            <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 text-center bg-gray-50 dark:bg-zinc-800/50">
                                🔍 No se encontraron productos
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lista de productos agregados */}
            {detalles.length > 0 ? (
                <div className="overflow-x-auto relative">
                    {/* ✅ NUEVO: Indicador de carga de precios */}
                    {isCalculatingPrices && (
                        <div className="absolute top-0 right-0 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-bl-lg border-l border-b border-blue-200 dark:border-blue-800 z-10">
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-blue-700 dark:border-t-blue-300 rounded-full animate-spin"></div>
                            <span className="text-xs font-medium">Actualizando...</span>
                        </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                        <thead className="bg-gray-50 dark:bg-zinc-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Stock Disponible
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cantidad
                                </th>
                                {tipo === 'compra' && (
                                    <>

                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Precio Compra
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Lote
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Vencimiento
                                        </th>
                                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Unidad Compra
                                        </th>
                                         */}
                                        {/* ✨ NUEVA COLUMNA: Precio por Unidad (solo si hay fraccionados) */}
                                        {/* {detalles.some(d => d.es_fraccionado && d.conversiones && d.conversiones.length > 0) && (
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Precio / Unidad
                                            </th>
                                        )} */}
                                    </>
                                )}
                                {tipo === 'venta' && (
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Precio de Venta
                                    </th>
                                )}
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Subtotal
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                            {detalles.map((detalle, index) => {
                                // ✅ MODIFICADO: Usar detalle.producto si existe, sino buscar en productos
                                // detalle.producto ya tiene toda la información necesaria
                                const productoInfo = detalle.producto || productos.find(p => p.id === detalle.producto_id);
                                const esCombo = productoInfo && (productoInfo as any).es_combo;

                                // ✅ DEBUG: Loguear búsqueda de producto y estructura completa
                                console.log(`🔍 Detalle #${index}:`, {
                                    detalleProductoId: detalle.producto_id,
                                    detalleProductoNombre: detalle.producto?.nombre,
                                    productoInfo: productoInfo?.nombre || 'NO ENCONTRADO',
                                    usandoDetalleProducto: !!detalle.producto,
                                    buscandoEnArray: !detalle.producto
                                });
                                // ✅ NUEVO 2026-03-06: Mostrar estructura completa del objeto producto
                                console.log(`📦 Detalle #${index} - Objeto Producto COMPLETO:`, detalle.producto);
                                // ✅ NUEVO 2026-03-06: Mostrar productoInfo renderizado
                                console.log(`📊 Detalle #${index} - productoInfo para renderizar:`, {
                                    nombre: productoInfo?.nombre,
                                    codigo: productoInfo?.codigo,
                                    codigo_barras: productoInfo?.codigo_barras,
                                    marca: (productoInfo as any)?.marca,
                                    unidad: (productoInfo as any)?.unidad,
                                    productoInfoCompleto: JSON.stringify(productoInfo, null, 2)
                                });

                                // ✅ NUEVO: Calcular diferencia entre precio ingresado y costo registrado (solo para compras)
                                const precioCosto = detalle.precio_costo || productoInfo?.precio_costo || 0;
                                const tieneDiferencia = tipo === 'compra' && precioCosto > 0 && Math.abs(detalle.precio_unitario - precioCosto) > 0.01;
                                const esAumento = precioCosto > 0 && detalle.precio_unitario > precioCosto;

                                const content = (
                                    <tr key={detalle.producto_id} className={`hover:bg-gray-50 dark:hover:bg-zinc-800 ${tipo === 'compra' && tieneDiferencia && esAumento
                                        ? 'bg-amber-50 dark:bg-amber-950/10'
                                        : tipo === 'compra' && tieneDiferencia && !esAumento
                                            ? 'bg-green-50 dark:bg-green-950/10'
                                            : ''
                                        }`}>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="text-xs font-medium text-gray-900 dark:text-white">
                                                {productoInfo?.nombre || 'Producto no encontrado'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 text-left">
                                                {productoInfo?.codigo && (
                                                    <div>Código: {productoInfo.codigo}</div>
                                                )}
                                                {productoInfo?.codigo_barras && (
                                                    <div>Código Barras: {productoInfo.codigo_barras}</div>
                                                )}
                                                {/* ✅ NUEVO: Mostrar Marca y Unidad en línea compacta */}
                                                {((productoInfo as any)?.marca || (productoInfo as any)?.unidad) && (
                                                    <div className="text-gray-600 dark:text-gray-500">
                                                        {(productoInfo as any)?.marca?.nombre && `Marca: ${(productoInfo as any).marca.nombre}`}
                                                        {(productoInfo as any)?.marca?.nombre && (productoInfo as any)?.unidad?.codigo && ' | '}
                                                        {(productoInfo as any)?.unidad?.codigo && `Unidad: ${(productoInfo as any).unidad.codigo}`}
                                                    </div>
                                                )}
                                                {/* ✅ NUEVO: Mostrar campos de medicamentos solo si es farmacia */}
                                                {(() => {
                                                    const tieneDataMedicamentos = (productoInfo as any)?.principio_activo || (productoInfo as any)?.uso_de_medicacion;
                                                    const mostrarMedicamentos = es_farmacia && tieneDataMedicamentos;
                                                    if (mostrarMedicamentos) {
                                                        console.log(`💊 [Tabla] Mostrando medicamento para ${productoInfo?.nombre}:`, {
                                                            es_farmacia,
                                                            principio_activo: (productoInfo as any)?.principio_activo,
                                                            uso_de_medicacion: (productoInfo as any)?.uso_de_medicacion
                                                        });
                                                    }
                                                    return mostrarMedicamentos && (
                                                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-0.5">
                                                            {(productoInfo as any)?.principio_activo && (
                                                                <div>💊 P.A.: {(productoInfo as any).principio_activo}</div>
                                                            )}
                                                            {(productoInfo as any)?.uso_de_medicacion && (
                                                                <div>📋 Uso: {(productoInfo as any).uso_de_medicacion}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {(() => {
                                                // ✅ CORREGIDO: Leer stock correctamente desde el backend
                                                // Prioridad: stock_disponible_calc > stock_disponible > stock > 0
                                                const stockDisponible =
                                                    (productoInfo as any)?.stock_disponible_calc ??
                                                    (productoInfo as any)?.stock_disponible ??
                                                    (productoInfo as any)?.stock ??
                                                    0;

                                                const stockTotal =
                                                    (productoInfo as any)?.stock_total_calc ??
                                                    (productoInfo as any)?.stock_total ??
                                                    0;

                                                const esComboCampo = (productoInfo as any)?.es_combo;
                                                const capacidad = (productoInfo as any)?.capacidad;

                                                // ✅ DEBUG: Log para verificar valores
                                                console.log(`📦 [ProductosTable] Stock para ${productoInfo?.nombre}:`, {
                                                    stock_disponible_calc: (productoInfo as any)?.stock_disponible_calc,
                                                    stock_disponible: (productoInfo as any)?.stock_disponible,
                                                    stock: (productoInfo as any)?.stock,
                                                    resultado: stockDisponible
                                                });

                                                if (esComboCampo) {
                                                    return (
                                                        <div className="text-xs space-y-1">
                                                            {/* Stock disponible/total del combo */}
                                                            {/* <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 font-semibold">
                                                                📊 {stockDisponible}/{stockTotal}
                                                            </div> */}
                                                            {/* Capacidad de combos */}
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 font-semibold ml-1">
                                                                📦 {stockDisponible ?? 0}
                                                            </span>
                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                                                {capacidad !== null && capacidad !== undefined ? 'combos' : '—'}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const limiteProductos = (productoInfo as any)?.limite_productos;
                                                const limiteVenta = (productoInfo as any)?.limite_venta;

                                                return (
                                                    <div className="text-xs">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md font-semibold ${stockDisponible === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200' :
                                                            stockDisponible < 5 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200' :
                                                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 text-xs'
                                                            }`}>
                                                            Disponible: {stockDisponible}
                                                        </span>
                                                        {stockTotal > stockDisponible && (
                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                                                Total: {stockTotal}
                                                            </div>
                                                        )}
                                                        {limiteVenta !== null && limiteVenta !== undefined && (
                                                            <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-semibold">
                                                                Límite Venta: {limiteVenta}
                                                            </div>
                                                        )}
                                                        {limiteProductos !== null && limiteProductos !== undefined && (
                                                            <div className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1 font-semibold">
                                                                Límite Productos: {limiteProductos}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                disabled={readOnly}
                                                value={detalle.cantidad}
                                                onChange={(e) => {
                                                    const valor = e.target.value;
                                                    if (valor === '' || /^\d+$/.test(valor)) {
                                                        const num = valor === '' ? 0 : parseInt(valor, 10);
                                                        if (num >= 0) {
                                                            handleUpdateDetail(index, 'cantidad', num);
                                                        }
                                                    }
                                                }}
                                                className="w-16 px-1.5 py-1 text-xs border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <div>
                                                {tipo === 'venta' && (
                                                    <div className="px-4 py-2 whitespace-nowrap">
                                                        {(() => {
                                                            console.log(`🔍 [ProductosTable] Detalle #${index}:`, {
                                                                es_fraccionado: detalle.es_fraccionado,
                                                                unidad_medida_id: detalle.unidad_medida_id,
                                                                unidad_medida_nombre: detalle.unidad_medida_nombre,
                                                                unidad_venta_id: detalle.unidad_venta_id,
                                                                conversiones_count: detalle.conversiones?.length,
                                                                conversiones: detalle.conversiones,
                                                                precio_venta: detalle.producto?.precio_venta
                                                            });

                                                            if (detalle.es_fraccionado && detalle.conversiones && detalle.conversiones.length > 0) {
                                                                // ✅ NUEVO: Determinar el valor inicial - si no hay unidad_venta_id, usar la primera conversión
                                                                const unidadInicial = detalle.unidad_venta_id || detalle.conversiones[0].unidad_destino_id;

                                                                return (
                                                                    <select
                                                                        disabled={readOnly}
                                                                        value={unidadInicial || ''}
                                                                        onChange={(e) => {
                                                                            const unidadSeleccionada = Number(e.target.value);

                                                                            const nuevoPrecio = calcularPrecioPorUnidad(
                                                                                detalle.producto?.precio_venta || 0,
                                                                                unidadSeleccionada,
                                                                                detalle.conversiones
                                                                            );

                                                                            console.log(`💰 [ProductosTable] Cambio de unidad para detalle #${index}:`, {
                                                                                unidad_anterior: detalle.unidad_venta_id,
                                                                                unidad_nueva: unidadSeleccionada,
                                                                                precio_base: detalle.producto?.precio_venta,
                                                                                precio_nuevo: nuevoPrecio
                                                                            });

                                                                            if (onUpdateDetailUnidadConPrecio) {
                                                                                onUpdateDetailUnidadConPrecio(index, unidadSeleccionada, nuevoPrecio);
                                                                            } else {
                                                                                handleUpdateDetail(index, 'unidad_venta_id', unidadSeleccionada);
                                                                                handleUpdateDetail(index, 'precio_unitario', nuevoPrecio);
                                                                            }
                                                                        }}
                                                                        className="w-28 px-1.5 py-1 text-xs border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <option value={detalle.unidad_medida_id || ''}>
                                                                            {detalle.unidad_medida_nombre || 'Unidad Base'}
                                                                        </option>
                                                                        {detalle.conversiones.map((conv) => (
                                                                            <option key={conv.unidad_destino_id} value={conv.unidad_destino_id}>
                                                                                {conv.unidad_destino_nombre || `Unidad ${conv.unidad_destino_id}`}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {detalle.unidad_medida_nombre || 'N/A'}
                                                                    </div>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {tipo === 'compra' && (
                                            <>


                                                {/* ✅ SIMPLIFICADO: Solo mostrar unidad base, sin selector */}
                                                {/* <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {detalle.unidad_medida_nombre || 'N/A'}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {precioCosto > 0 ? formatCurrency(precioCosto) : 'N/A'}
                                                    </div>

                                                </td> */}
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        disabled={readOnly}
                                                        value={editingField?.index === index && editingField?.field === 'precio_unitario'
                                                            ? editingField.value
                                                            : detalle.precio_unitario.toString()}
                                                        placeholder="0.0000"
                                                        onFocus={() => {
                                                            setEditingField({
                                                                index,
                                                                field: 'precio_unitario',
                                                                value: detalle.precio_unitario.toString()
                                                            });
                                                        }}
                                                        onChange={(e) => {
                                                            const valor = e.target.value;
                                                            setEditingField(prev => prev && prev.index === index
                                                                ? { ...prev, value: valor }
                                                                : prev);
                                                            // ✅ NUEVO: Actualizar en tiempo real mientras escribes
                                                            if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                                                const num = valor === '' ? 0 : parseFloat(valor);
                                                                if (num >= 0) {
                                                                    handleUpdateDetail(index, 'precio_unitario', num);
                                                                }
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            setEditingField(null);
                                                        }}
                                                        className={`w-24 px-1.5 py-1 text-xs border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono ${tieneDiferencia
                                                            ? esAumento
                                                                ? 'border-amber-300 dark:border-amber-700'
                                                                : 'border-green-300 dark:border-green-700'
                                                            : 'border-gray-300 dark:border-zinc-600'
                                                            }`}
                                                    />
                                                    {tieneDiferencia && (
                                                        <div className={`text-xs font-semibold mt-0.5 ${esAumento
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                            }`}>
                                                            {esAumento ? '↑' : '↓'} {formatCurrency(Math.abs(detalle.precio_unitario - precioCosto))}
                                                        </div>
                                                    )}
                                                    {/* ✨ NUEVA CELDA: Precio por Unidad en compras fraccionados */}
                                                    {detalle.es_fraccionado && detalle.conversiones && detalle.conversiones.length > 0 && (
                                                        <td className="whitespace-nowrap">
                                                            {(() => {
                                                                // Encontrar el factor de conversión para la unidad seleccionada
                                                                const unidadActual = detalle.unidad_venta_id || detalle.unidad_medida_id;

                                                                // Si es la unidad base, no dividir
                                                                if (unidadActual === detalle.unidad_medida_id) {
                                                                    return (
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                            {formatCurrency(detalle.precio_unitario)} / {detalle.unidad_medida_nombre || 'Base'}
                                                                        </div>
                                                                    );
                                                                }

                                                                // Si es una unidad de conversión
                                                                const conversion = detalle.conversiones.find(
                                                                    c => c.unidad_destino_id === unidadActual
                                                                );

                                                                if (conversion && conversion.factor_conversion > 0) {
                                                                    const precioPorUnidad = detalle.precio_unitario / conversion.factor_conversion;
                                                                    return (
                                                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                                            {formatCurrency(precioPorUnidad)} / {conversion.unidad_destino_nombre || `Unidad ${conversion.unidad_destino_id}`}
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        N/A
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                    )}
                                                </td>
                                                {/* ✅ CELDA: Lote */}
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        disabled={readOnly}
                                                        value={detalle.lote || ''}
                                                        placeholder="Ej: LOT-001"
                                                        onChange={(e) => {
                                                            handleUpdateDetail(index, 'lote', e.target.value);
                                                        }}
                                                        className="w-28 px-2 py-1 text-xs border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                </td>

                                                {/* ✅ CELDA: Fecha de Vencimiento */}
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <input
                                                        type="date"
                                                        disabled={readOnly}
                                                        value={detalle.fecha_vencimiento || ''}
                                                        onChange={(e) => {
                                                            handleUpdateDetail(index, 'fecha_vencimiento', e.target.value);
                                                        }}
                                                        className="w-32 px-2 py-1 text-xs border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                </td>

                                            </>
                                        )}
                                        {tipo === 'venta' && (
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    disabled={readOnly}
                                                    value={editingField?.index === index && editingField?.field === 'precio_venta'
                                                        ? editingField.value
                                                        : formatearPrecioVenta(detalle.precio_unitario)}
                                                    placeholder="0"
                                                    onFocus={() => {
                                                        setEditingField({
                                                            index,
                                                            field: 'precio_venta',
                                                            value: formatearPrecioVenta(detalle.precio_unitario)
                                                        });
                                                    }}
                                                    onChange={(e) => {
                                                        const valor = e.target.value;
                                                        setEditingField(prev => prev && prev.index === index
                                                            ? { ...prev, value: valor }
                                                            : prev);
                                                        // ✅ NUEVO: Actualizar en tiempo real mientras escribes
                                                        if (valor === '' || /^\d+$/.test(valor)) {
                                                            const num = valor === '' ? 0 : parseInt(valor, 10);
                                                            if (num >= 0) {
                                                                handleUpdateDetail(index, 'precio_unitario', num);
                                                            }
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const valor = e.target.value;
                                                        if (valor === '' || /^\d+$/.test(valor)) {
                                                            const num = valor === '' ? 0 : parseInt(valor, 10);
                                                            if (num >= 0) {
                                                                handleUpdateDetail(index, 'precio_unitario', num);
                                                            }
                                                        }
                                                        setEditingField(null);
                                                    }}
                                                    className="w-20 px-1.5 py-1 text-xs border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <br />
                                                {/* ✅ NUEVO: Selector de tipo de precio (solo tipos de venta, sin costo) */}
                                                {(() => {
                                                    // Obtener precios del detalle (vienen del producto adjunto)
                                                    const precios = detalle.producto?.precios || [];

                                                    // Filtrar precios: excluir "Precio de Costo" y similares
                                                    const preciosVenta = precios.filter(p => {
                                                        const nombre = (p.nombre || '').toLowerCase();
                                                        return !nombre.includes('costo') && !nombre.includes('cost');
                                                    });

                                                    if (preciosVenta.length === 0) {
                                                        // Si no hay precios de venta, mostrar al menos el tipo actual
                                                        return detalle.tipo_precio_nombre ? (
                                                            <div className="mt-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                                                                {detalle.tipo_precio_nombre}
                                                            </div>
                                                        ) : null;
                                                    }

                                                    // ✅ Obtener el valor inicial: Orden de prioridad MEJORADO (2026-02-17 v2):
                                                    // 1. selectedTipoPrecio (SOLO si fue seleccionado manualmente por usuario en esta sesión)
                                                    // 2. detalle.tipo_precio_id (el valor ACTUAL - puede cambiar por rango)
                                                    // 3. detalle.tipo_precio_id_recomendado (recomendación inicial basada en cliente)
                                                    // 4. default_tipo_precio_id (prop del componente - centralizado)
                                                    // 5. preciosVenta[0] (primer tipo de precio disponible)
                                                    //
                                                    // CRÍTICO: Usar tipo_precio_id (no recomendado) porque se actualiza cuando rango aplica
                                                    const valorInicial = (manuallySelectedTipoPrecio?.[index] && selectedTipoPrecio[index])
                                                        ? selectedTipoPrecio[index]
                                                        : (
                                                            detalle.tipo_precio_id
                                                                ? String(detalle.tipo_precio_id)
                                                                : (
                                                                    detalle.tipo_precio_id_recomendado
                                                                        ? String(detalle.tipo_precio_id_recomendado)
                                                                        : (
                                                                            default_tipo_precio_id
                                                                                ? String(default_tipo_precio_id)
                                                                                : (preciosVenta[0]?.tipo_precio_id ? String(preciosVenta[0].tipo_precio_id) : '')
                                                                        )
                                                                )
                                                        );

                                                    return (
                                                        <select
                                                            disabled={readOnly}
                                                            value={valorInicial}
                                                            onChange={(e) => {
                                                                const tipoPrecioIdSeleccionado = e.target.value;
                                                                // ✅ CORREGIDO: Buscar por tipo_precio_id (más confiable que nombre)
                                                                const precioSeleccionado = preciosVenta.find(p => String(p.tipo_precio_id) === String(tipoPrecioIdSeleccionado));

                                                                if (precioSeleccionado) {
                                                                    // ✅ NUEVO: Notificar al padre que el usuario ha seleccionado manualmente
                                                                    if (onManualTipoPrecioChange) {
                                                                        onManualTipoPrecioChange(index);
                                                                    }

                                                                    // ✅ NUEVO: Actualizar estado local del select inmediatamente (usando tipo_precio_id)
                                                                    setSelectedTipoPrecio(prev => ({
                                                                        ...prev,
                                                                        [index]: tipoPrecioIdSeleccionado
                                                                    }));

                                                                    // ✅ Actualizar tipo de precio y precio en orden
                                                                    // El precio_unitario gatilla el recalcuilo del subtotal y totales
                                                                    handleUpdateDetail(index, 'tipo_precio_id', precioSeleccionado.tipo_precio_id);
                                                                    handleUpdateDetail(index, 'tipo_precio_nombre', precioSeleccionado.nombre || '');
                                                                    handleUpdateDetail(index, 'precio_unitario', precioSeleccionado.precio || 0);
                                                                }
                                                            }}
                                                            className="mt-1 px-2 py-1 text-xs border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {/* ✅ NUEVO: Solo mostrar opción vacía si no hay valor inicial */}
                                                            {!valorInicial && <option value="">Seleccionar tipo de precio</option>}
                                                            {preciosVenta.map((precio) => (
                                                                <option key={precio.id || precio.tipo_precio_id} value={String(precio.tipo_precio_id)}>
                                                                    {precio.nombre || `Tipo ${precio.tipo_precio_id}`} - {formatCurrencyWith2Decimals(precio.precio || 0)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                                            {tipo === 'venta'
                                                ? formatCurrencyWith2Decimals(detalle.subtotal)
                                                : formatCurrency(detalle.subtotal)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium flex gap-2">
                                            {/* ✅ NUEVO: Botón para expandir/contraer combo */}
                                            {detalle.producto && (detalle.producto as any).es_combo && (
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedCombos(prev => ({
                                                        ...prev,
                                                        [index]: !prev[index]
                                                    }))}
                                                    className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded transition-colors"
                                                    title={expandedCombos[index] ? "Ocultar componentes" : "Mostrar componentes"}
                                                >
                                                    <svg className={`w-4 h-4 transition-transform ${expandedCombos[index] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                    </svg>
                                                </button>
                                            )}
                                            {/* ✅ NUEVO: Botón para abrir modal de cascada si hay diferencia */}
                                            {tipo === 'compra' && tieneDiferencia && (
                                                <button
                                                    type="button"
                                                    disabled={readOnly}
                                                    onClick={() => handleAbrirModalCascada(index, detalle)}
                                                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Editar cascada de precios"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                disabled={readOnly}
                                                onClick={() => onRemoveDetail(index)}
                                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Eliminar producto"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );

                                // Si es combo, envolver en Fragment con componentes
                                if (esCombo && expandedCombos[index]) {
                                    // ✅ CRÍTICO: Usar combo_items del mapa si existen, sino usar los originales
                                    // Usar comboId (producto.id) en lugar de index para evitar colisiones
                                    const comboIdDisplay = (productoInfo as any)?.id;

                                    // ✅ SIMPLIFICADO (2026-02-20): Mostrar TODOS los items del combo
                                    // Estrategia: Priorizar productoInfo.combo_items (tiene stock completo)
                                    const detalleActual = detalles[index] as any;

                                    // TODOS los items disponibles en el combo
                                    // ✅ CRÍTICO: Usar productoInfo.combo_items PRIMERO (tiene stock_disponible, stock_total, etc.)
                                    // Solo usar detalleActual.combo_items como fallback
                                    const todosLosItems = ((productoInfo as any).combo_items || detalleActual?.combo_items || []);

                                    // Items que el usuario seleccionó (guardados en proforma)
                                    const idsSeleccionados = new Set(
                                        (detalleActual?.combo_items_seleccionados || [])
                                            .map((item: any) => item.id)
                                    );

                                    // ✅ NUEVO (2026-02-20): Obtener items actualizados de comboItemsMap si existen
                                    // Esto refleja cambios de cantidad cuando el usuario modifica la cantidad del combo
                                    const itemsDelMapa = comboIdDisplay ? comboItemsMap[comboIdDisplay] : null;

                                    // Mapear items para agregar flag "checked" y cantidad actualizada
                                    const itemsAMostrar = todosLosItems.map((item: any) => {
                                        // Si existe en el mapa (usuario editó), usar esa cantidad; si no, usar la del backend
                                        const itemDelMapa = itemsDelMapa?.find((i: any) => i.id === item.id);
                                        const cantidadActualizada = itemDelMapa?.cantidad ?? item.cantidad;

                                        return {
                                            ...item,
                                            cantidad: cantidadActualizada, // ✅ Usar cantidad actualizada
                                            _isChecked: idsSeleccionados.has(item.id) // Flag para saber si está seleccionado
                                        };
                                    });

                                    // ✅ NUEVO: Obtener información referencial de grupo_opcional
                                    const grupoOpcional = (detalles[index] as any)?.grupo_opcional;
                                    const cantidadALlevar = grupoOpcional?.cantidad_a_llevar;

                                    // ✅ Contar items seleccionados vs totales
                                    const itemsSeleccionados = itemsAMostrar.filter((i: any) => i._isChecked === true);
                                    const totalItems = itemsAMostrar.length;

                                    // ✅ DEBUG: Verificar stock del combo
                                    console.log(`📦 [ProductosTable] Stock del combo ${(productoInfo as any)?.nombre}:`, {
                                        stock_disponible: (productoInfo as any)?.stock_disponible,
                                        stock_total: (productoInfo as any)?.stock_total,
                                        stock_reservado: (productoInfo as any)?.stock_reservado,
                                        productoInfo: productoInfo
                                    });

                                    return (
                                        <Fragment key={`combo-${index}`}>
                                            {content}

                                            {/* ✅ INFORMACIÓN REFERENCIAL: Cantidad de productos opcionales a elegir */}
                                            {cantidadALlevar && (
                                                <tr className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-400">
                                                    <td colSpan={tipo === 'compra' ? 4 : 5} className="px-4 py-3">
                                                        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                                            <span className="text-lg">ℹ️</span>
                                                            <span className="font-medium">Referencia:</span>
                                                            <span>Seleccionar <strong>{cantidadALlevar}</strong> producto{cantidadALlevar !== 1 ? 's' : ''} opcional{cantidadALlevar !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            {/* ✅ NUEVO (2026-02-20): Header mostrando resumen de selección + stock */}
                                            <tr className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400">
                                                <td colSpan={tipo === 'compra' ? 4 : 5} className="px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-amber-600 dark:text-amber-400 font-medium">📦 Componentes:</span>
                                                            <span className="text-amber-700 dark:text-amber-300">
                                                                <strong className="text-green-600 dark:text-green-400">{itemsSeleccionados.length} seleccionados</strong>
                                                                {' '}/ {totalItems} disponibles
                                                            </span>
                                                        </div>
                                                        {/* ✅ NUEVO (2026-02-20): Stock del combo */}
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-amber-600 dark:text-amber-400">📊</span>
                                                            <span className="text-amber-700 dark:text-amber-300">
                                                                Stock: <strong className="text-blue-600 dark:text-blue-400">
                                                                    {(productoInfo as any)?.stock_disponible ?? '-'}
                                                                </strong>
                                                                {' '}/ <strong className="text-gray-600 dark:text-gray-400">
                                                                    {(productoInfo as any)?.stock_total ?? '-'}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Mostrar TODOS los componentes del combo */}
                                            {itemsAMostrar.map((item: any, itemIndex: number) => (
                                                <tr key={`combo-item-${index}-${itemIndex}`} className={`border-l-4 ${item._isChecked === true
                                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-400'
                                                    : 'bg-gray-100 dark:bg-gray-800/50 opacity-60 border-gray-300'
                                                    }`}>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {/* ✅ SIMPLIFICADO (2026-02-20): Checkbox para todos los items, editable si proforma es PENDIENTE */}
                                                            {item.es_obligatorio === false ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item._isChecked === true}
                                                                    disabled={readOnly}  // Habilitar si proforma es editable
                                                                    onChange={(e) => {
                                                                        const nuevosItems = [...itemsAMostrar];
                                                                        nuevosItems[itemIndex]._isChecked = e.target.checked;
                                                                        // Notificar al parent component sobre los cambios
                                                                        if (comboIdDisplay) {
                                                                            setComboItemsMap(prev => ({
                                                                                ...prev,
                                                                                [comboIdDisplay]: nuevosItems
                                                                            }));
                                                                        }
                                                                        onComboItemsChange?.(index, nuevosItems);
                                                                        console.log(`✏️ Combo item ${item.producto_nombre}: ${e.target.checked ? 'HABILITADO' : 'DESHABILITADO'}`);
                                                                    }}
                                                                    className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer accent-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    title={readOnly ? (item._isChecked ? "Producto seleccionado (solo lectura)" : "Producto no seleccionado (solo lectura)") : (item._isChecked ? "Click para deseleccionar" : "Click para seleccionar")}
                                                                />
                                                            ) : (
                                                                <div className="w-4 h-4 flex items-center justify-center">
                                                                    <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                                                                </div>
                                                            )}
                                                            <div className="w-4 h-4 flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                                                {item.producto_nombre}
                                                                {item.es_obligatorio && <span className="text-purple-600 dark:text-purple-400 ml-1">*</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            SKU: {item.producto_sku}
                                                        </div>

                                                    </td>
                                                    <td>
                                                        {/* Stock del producto */}
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1">
                                                            <span className="text-purple-600 dark:text-purple-400">📦</span>
                                                            <span>
                                                                Stock: <span className="font-semibold text-purple-700 dark:text-purple-300">
                                                                    {item.stock_disponible ?? '-'} / {item.stock_total ?? '-'}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            disabled={readOnly}
                                                            value={item.cantidad || 0}
                                                            onChange={(e) => {
                                                                const nuevaCantidad = parseFloat(e.target.value) || 0;
                                                                const nuevosItems = [...itemsAMostrar];
                                                                nuevosItems[itemIndex].cantidad = nuevaCantidad;
                                                                // Usar comboIdDisplay para mantener consistencia
                                                                if (comboIdDisplay) {
                                                                    setComboItemsMap(prev => ({
                                                                        ...prev,
                                                                        [comboIdDisplay]: nuevosItems
                                                                    }));
                                                                }
                                                                onComboItemsChange?.(index, nuevosItems);
                                                                console.log(`✏️ Cantidad actualizada para ${item.producto_nombre}: ${nuevaCantidad}`);
                                                            }}
                                                            className="w-16 px-2 py-1 text-xs border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                    {tipo === 'venta' && (
                                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-purple-700 dark:text-purple-300">
                                                            {item.unidad_medida_nombre || 'N/A'}
                                                        </td>
                                                    )}
                                                    {tipo === 'compra' && (
                                                        <>
                                                            <td className="px-4 py-2 whitespace-nowrap text-xs text-purple-700 dark:text-purple-300 font-mono">
                                                                {formatCurrencyWith2Decimals(item.precio_unitario || 0)}
                                                            </td>
                                                            <td colSpan={2}></td>
                                                        </>
                                                    )}
                                                    {tipo === 'venta' && (
                                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-purple-700 dark:text-purple-300 font-mono">
                                                            {formatCurrencyWith2Decimals(item.precio_unitario || 0)}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-purple-700 dark:text-purple-300">
                                                        {formatCurrencyWith2Decimals((item.cantidad || 0) * (item.precio_unitario || 0))}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap"></td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    );
                                }

                                // Si no es combo o no está expandido, retornar solo la fila
                                return content;
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-4">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="mt-1.5 text-xs font-medium text-gray-900 dark:text-white">
                        Sin productos
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Busca y agrega productos
                    </p>
                </div>
            )}

            {/* Modal del escáner de códigos de barras */}
            {showScannerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                Escanear código
                            </h3>
                            <button
                                type="button"
                                onClick={closeScannerModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-3">
                            <BarcodeScannerComponent
                                width={280}
                                height={280}
                                onUpdate={(err, result) => {
                                    if (result) {
                                        handleScannerResult(result.getText());
                                    } else if (err) {
                                        handleScannerError(typeof err === 'string' ? err : 'Error al escanear');
                                    }
                                }}
                            />
                        </div>

                        {scannerError && (
                            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    {scannerError}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-1.5">
                            <button
                                type="button"
                                onClick={closeScannerModal}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NUEVO: Modal de cascada de precios */}
            <ModalComprasDiferenciaCostoComponent
                isOpen={modalCascadaState.isOpen}
                onClose={handleCerrarModalCascada}
                producto={modalCascadaState.productoData}
                precioActual={modalCascadaState.precioActual}
                precioCostoNuevo={modalCascadaState.precioCostoNuevo}
                onActualizarPrecios={handleGuardarPreciosModal}
                onSuccess={handlePreciosActualizados}
            />

            {/* ✅ NUEVO: Modal de información de medicamentos (farmacia) */}
            {farmaciaProdutoSeleccionado && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-900 dark:to-blue-800 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span>💊</span> Información de Medicamento
                            </h3>
                            <button
                                onClick={() => setFarmaciaProdutoSeleccionado(null)}
                                className="text-white hover:text-gray-200 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {/* Nombre del producto */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Producto</h4>
                                <p className="text-base text-gray-900 dark:text-white font-medium">{farmaciaProdutoSeleccionado.nombre}</p>
                            </div>

                            {/* Principio activo */}
                            {farmaciaProdutoSeleccionado.principio_activo && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Principio Activo</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded border border-blue-200 dark:border-blue-800">
                                        {farmaciaProdutoSeleccionado.principio_activo}
                                    </p>
                                </div>
                            )}

                            {/* Uso de medicación */}
                            {farmaciaProdutoSeleccionado.uso_de_medicacion && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Uso / Indicaciones</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded border border-green-200 dark:border-green-800">
                                        {farmaciaProdutoSeleccionado.uso_de_medicacion}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 dark:bg-zinc-700 px-6 py-4 flex justify-end rounded-b-lg">
                            <button
                                type="button"
                                onClick={() => setFarmaciaProdutoSeleccionado(null)}
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 font-medium text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
