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
    isCalculatingPrices?: boolean; // ✅ NUEVO: Mostrar indicador de carga al calcular precios
    readOnly?: boolean; // ✅ NUEVO: Deshabilitar edición de detalles (para APROBADO+)
    onUpdateDetailUnidadConPrecio?: (index: number, unidadId: number, precio: number) => void; // ✅ NUEVO: Actualizar unidad y precio juntos
    onManualTipoPrecioChange?: (index: number) => void; // ✅ NUEVO: Notificar cuando usuario selecciona manualmente un tipo de precio
    onComboItemsChange?: (detailIndex: number, items: any[]) => void; // ✅ NUEVO: Notificar cuando cambian los items opcionales del combo
}

export default function ProductosTable({
    productos,
    detalles,
    onAddProduct,
    onUpdateDetail,
    onRemoveDetail,
    almacen_id,
    isCalculatingPrices = false, // ✅ NUEVO: Indicador de carga
    readOnly = false, // ✅ NUEVO: Modo solo lectura
    tipo = 'compra', // ✅ NUEVO: Tipo de documento (compra o venta)
    onUpdateDetailUnidadConPrecio, // ✅ NUEVO: Actualizar unidad y precio juntos
    onManualTipoPrecioChange, // ✅ NUEVO: Notificar cuando usuario selecciona manualmente un tipo de precio
    onComboItemsChange // ✅ NUEVO: Notificar cambios en items opcionales del combo
}: ProductosTableProps) {
    // ✅ DEBUG: Loguear props recibidos
    /* console.log('📋 ProductosTable - Props recibidos:', {
        productosCount: productos?.length || 0,
        detallesCount: detalles?.length || 0,
        isCalculatingPrices,
        detalles: detalles.map(d => ({
            producto_id: d.producto_id,
            nombre: d.producto?.nombre,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario
        }))
    }); */
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
    // ✅ NUEVO: Estado para incluir combos en búsquedas (solo para ventas)
    const [incluirCombos, setIncluirCombos] = useState(false);
    // ✅ NUEVO: Estado para controlar qué combos están expandidos
    const [expandedCombos, setExpandedCombos] = useState<Record<number, boolean>>({});
    // ✅ NUEVO: Mapa de combo_items actualizados por índice (se mantiene aunque detalles cambien)
    const [comboItemsMap, setComboItemsMap] = useState<Record<number, Array<any>>>({});

    // ✅ NUEVO: useEffect para expandir automáticamente combos recién agregados
    useEffect(() => {
        if (detalles.length === 0) return;

        const ultimoDetalle = detalles[detalles.length - 1];
        const ultimoIndice = detalles.length - 1;

        // Verificar si el último detalle agregado es un combo
        if (ultimoDetalle?.producto && (ultimoDetalle.producto as any).es_combo) {
            const tieneComponentes = ((ultimoDetalle.producto as any).combo_items?.length || 0) > 0;

            if (tieneComponentes && !expandedCombos[ultimoIndice]) {
                console.log(`✅ [ProductosTable] Expandiendo automáticamente combo: ${ultimoDetalle.producto.nombre} (índice: ${ultimoIndice})`);
                setExpandedCombos(prev => ({
                    ...prev,
                    [ultimoIndice]: true
                }));

                // ✅ NUEVO: Inicializar combo_items con incluido = true para obligatorios y opcionales
                const comboItems = ((ultimoDetalle.producto as any).combo_items || []).map((item: any) => ({
                    ...item,
                    incluido: item.es_obligatorio !== false // Si es obligatorio O es opcional pero lo incluimos por defecto
                }));

                setComboItemsMap(prev => ({
                    ...prev,
                    [ultimoIndice]: comboItems
                }));
            }
        }
    }, [detalles.length]); // Solo vigilar cambios en la cantidad de detalles

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
                tipo: tipo // ✅ NUEVO: Pasar tipo de documento (compra o venta)
            });

            // ✅ Pasar incluir_combos solo si es venta y está marcado
            if (tipo === 'venta' && incluirCombos) {
                params.append('incluir_combos', 'true');
            }

            // ✅ Pasar almacen_id si está disponible
            if (almacen_id) {
                params.append('almacen_id', almacen_id.toString());
            }

            const response = await fetch(`/api/productos/buscar?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Error en búsqueda de productos');
            }

            const data = await response.json();

            console.log('📡 Respuesta API completa de la busqueda:', data.data);

            // Transformar respuesta de API a formato Producto
            const productosAPI = data.data.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                codigo: p.sku || p.codigo_barras,
                codigo_barras: p.codigo_barras,
                precio_venta: p.precio_base || 0,
                precio_costo: p.precio_costo || 0, // ✅ NUEVO: Precio de costo desde API
                precio_compra: p.precio_costo || 0, // ✅ NUEVO: Precio de compra (igual al costo)
                stock: p.stock_disponible || 0,
                stock_disponible_calc: p.stock_disponible || 0, // ✅ AGREGADO: Stock disponible calculado
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
                combo_items: p.combo_items || []
            }));

            console.log('✅ Productos transformados:', productosAPI);

            // ✅ NUEVO: Filtrar productos válidos para ventas (stock > 0 y precio_venta > 0)
            // IMPORTANTE: Si incluirCombos=true, permitir combos sin stock ni precio_venta (se calcula de los componentes)
            const productosValidos = productosAPI.filter(p => {
                if (tipo === 'venta') {
                    const esCombo = (p as any).es_combo || false;
                    const tieneComponentes = ((p as any).combo_items?.length || 0) > 0;

                    // ✅ DEBUG: Log para verificar filtrado
                    console.log(`📦 Filtrando producto ${p.nombre}:`, {
                        es_combo: esCombo,
                        incluir_combos: incluirCombos,
                        stock: p.stock,
                        precio_venta: p.precio_venta,
                        tiene_componentes: tieneComponentes,
                        resultado: esCombo && incluirCombos ? tieneComponentes : (p.stock > 0 && p.precio_venta > 0)
                    });

                    // Si es combo e incluirCombos=true, solo requerir que tenga componentes
                    if (esCombo && incluirCombos) {
                        return tieneComponentes;
                    }

                    // Para productos normales, siempre requiere stock y precio
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

                // ✅ Pasar incluir_combos solo si es venta y está marcado
                if (tipo === 'venta' && incluirCombos) {
                    params.append('incluir_combos', 'true');
                }

                if (almacen_id) {
                    params.append('almacen_id', almacen_id.toString());
                }

                const response = await fetch(`/api/productos/buscar?${params.toString()}`);

                if (!response.ok) {
                    throw new Error('Error buscando producto');
                }

                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    const productoAPI = data.data[0];

                    // ✅ NUEVO: Validar producto para ventas (stock > 0 y precio_venta > 0)
                    // IMPORTANTE: Si es combo e incluirCombos=true, no requiere stock ni precio (se calcula de componentes)
                    if (tipo === 'venta') {
                        const stock = productoAPI.stock_disponible || 0;
                        const precioVenta = productoAPI.precio_base || 0;
                        const esCombo = productoAPI.es_combo || false;
                        const tieneComponentes = (productoAPI.combo_items?.length || 0) > 0;

                        // Si NO es combo, requerir stock
                        if (!esCombo && stock === 0) {
                            NotificationService.error('Producto sin stock disponible');
                            return;
                        }

                        // Si es combo pero NO está marcado incluirCombos, rechazar
                        if (esCombo && !incluirCombos) {
                            NotificationService.error('Para buscar combos, marca la opción "Incluir combos"');
                            return;
                        }

                        // Si es combo, debe tener componentes
                        if (esCombo && !tieneComponentes) {
                            NotificationService.error('Combo sin productos componentes configurados');
                            return;
                        }

                        // Si NO es combo, requiere precio
                        if (!esCombo && precioVenta === 0) {
                            NotificationService.error('Producto sin precio de venta configurado');
                            return;
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

                // ✅ Actualizar cantidades en combo_items (componentes incrustados)
                const comboItems = ((detalles[index].producto as any).combo_items || []) as Array<any>;
                console.log(`🎁 Componentes del combo encontrados: ${comboItems.length}`, comboItems.map(item => ({ nombre: item.producto_nombre, cantidadOriginal: item.cantidad })));

                // ✅ CORRECTO: Multiplicar cantidad del combo × cantidad original del componente
                const comboItemsActualizados = comboItems.map((item) => {
                    const cantidadComponenteOriginal = item.cantidad; // Cantidad original en el combo (ej: 2, 1, etc)
                    const cantidadComponenteNueva = cantidadNueva * cantidadComponenteOriginal; // Cantidad final = combo_qty × componente_original_qty

                    console.log(`  ✏️  Actualizando componente: ${item.producto_nombre}`, {
                        cantidadOriginal: cantidadComponenteOriginal,
                        cantidadDelCombo: cantidadNueva,
                        cantidadFinal: cantidadComponenteNueva,
                    });

                    return {
                        ...item,
                        cantidad: cantidadComponenteNueva,
                    };
                });

                console.log(`✅ Actualización de combo completada - componentes actualizados:`,
                    comboItemsActualizados.map(i => ({ nombre: i.producto_nombre, cantidad: i.cantidad })));

                // ✅ CRÍTICO: Guardar combo_items en mapa (persisten aunque detalles cambien)
                setComboItemsMap(prev => ({
                    ...prev,
                    [index]: comboItemsActualizados
                }));

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

                    {/* ✅ NUEVO: Checkbox para incluir combos (solo en ventas) */}
                    {tipo === 'venta' && (
                        <label className="flex items-center gap-1.5 px-2 py-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <input
                                type="checkbox"
                                checked={incluirCombos}
                                onChange={(e) => setIncluirCombos(e.target.checked)}
                                disabled={readOnly}
                                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-zinc-600 text-purple-600 focus:ring-purple-500 dark:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-400 whitespace-nowrap">
                                Incluir combos
                            </span>
                        </label>
                    )}
                </div>

                {/* ✅ Mostrar resultados solo si hay búsqueda realizada */}
                {(productosDisponibles.length > 0 || searchError || (productSearch && !isLoading && productosDisponibles.length === 0)) && (
                    <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 dark:border-zinc-600 rounded-md">
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
                            productosDisponibles.map((producto) => (
                                <button
                                    key={producto.id}
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() => handleAgregarProductoYLimpiar(producto)}
                                    className="w-full text-left px-2.5 py-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 border-b border-gray-100 dark:border-zinc-700 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="font-medium text-xs text-gray-900 dark:text-white">
                                        {producto.nombre}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {producto.codigo} | {formatCurrency(producto.precio_venta || 0)}
                                        {(producto as any).stock_disponible && ` | ${(producto as any).stock_disponible}`}
                                    </div>
                                </button>
                            ))
                        )}

                        {/* ✅ ESTADO: Sin resultados */}
                        {!isLoading && productosDisponibles.length === 0 && !searchError && (
                            <div className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 text-center">
                                No se encontraron productos
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
                                {tipo === 'venta' && (
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Unidad Venta
                                    </th>
                                )}
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

                                // ✅ DEBUG: Loguear búsqueda de producto
                                console.log(`🔍 Detalle #${index}:`, {
                                    detalleProductoId: detalle.producto_id,
                                    detalleProductoNombre: detalle.producto?.nombre,
                                    productoInfo: productoInfo?.nombre || 'NO ENCONTRADO',
                                    usandoDetalleProducto: !!detalle.producto,
                                    buscandoEnArray: !detalle.producto
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
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {(() => {
                                                const stockDisponible = (productoInfo as any)?.stock_disponible_calc ?? (productoInfo as any)?.stock_disponible ?? 0;
                                                const stockTotal = (productoInfo as any)?.stock_total_calc ?? (productoInfo as any)?.stock_total ?? 0;
                                                const esComboCampo = (productoInfo as any)?.es_combo;
                                                const capacidad = (productoInfo as any)?.capacidad;

                                                if (esComboCampo) {
                                                    return (
                                                        <div className="text-xs">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 font-semibold">
                                                                📦 {capacidad ?? 0}
                                                            </span>
                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                                                {capacidad !== null && capacidad !== undefined ? 'combos' : '—'}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="text-xs">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md font-semibold ${
                                                            stockDisponible === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200' :
                                                            stockDisponible < 5 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200' :
                                                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200'
                                                        }`}>
                                                            {stockDisponible}
                                                        </span>
                                                        {stockTotal > stockDisponible && (
                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                                                Total: {stockTotal}
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
                                        </td>
                                        {tipo === 'venta' && (
                                            <td className="px-4 py-2 whitespace-nowrap">
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
                                            </td>
                                        )}
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

                                                    return (
                                                        <select
                                                            disabled={readOnly}
                                                            value={selectedTipoPrecio[index] ?? detalle.tipo_precio_nombre ?? preciosVenta[0]?.nombre ?? ''}
                                                            onChange={(e) => {
                                                                const nombreSeleccionado = e.target.value;
                                                                const precioSeleccionado = preciosVenta.find(p => p.nombre === nombreSeleccionado);

                                                                if (precioSeleccionado) {
                                                                    // ✅ NUEVO: Notificar al padre que el usuario ha seleccionado manualmente
                                                                    if (onManualTipoPrecioChange) {
                                                                        onManualTipoPrecioChange(index);
                                                                    }

                                                                    // ✅ NUEVO: Actualizar estado local del select inmediatamente (usando nombre como key)
                                                                    setSelectedTipoPrecio(prev => ({
                                                                        ...prev,
                                                                        [index]: nombreSeleccionado
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
                                                            <option value="">Seleccionar tipo de precio</option>
                                                            {preciosVenta.map((precio) => (
                                                                <option key={precio.id || precio.tipo_precio_id} value={precio.nombre || ''}>
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
                                    const itemsAMostrar = comboItemsMap[index] || ((productoInfo as any).combo_items || []);

                                    return (
                                        <Fragment key={`combo-${index}`}>
                                            {content}
                                            {/* Mostrar componentes del combo */}
                                            {itemsAMostrar.map((item: any, itemIndex: number) => (
                                                <tr key={`combo-item-${index}-${itemIndex}`} className={`border-l-4 ${item.incluido === false ? 'bg-gray-100 dark:bg-gray-800/50 opacity-60' : 'bg-purple-50 dark:bg-purple-900/10'} border-purple-400`}>
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {/* ✅ NUEVO: Checkbox para productos opcionales (es_obligatorio = false) */}
                                                            {item.es_obligatorio === false ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.incluido !== false}
                                                                    onChange={(e) => {
                                                                        const nuevosItems = [...itemsAMostrar];
                                                                        nuevosItems[itemIndex].incluido = e.target.checked;
                                                                        setComboItemsMap(prev => ({
                                                                            ...prev,
                                                                            [index]: nuevosItems
                                                                        }));
                                                                        // ✅ NUEVO: Notificar al parent component sobre los cambios en items opcionales
                                                                        onComboItemsChange?.(index, nuevosItems);
                                                                        console.log(`✅ Producto opcional ${item.producto_nombre}: ${e.target.checked ? 'INCLUIDO' : 'EXCLUIDO'}`);
                                                                    }}
                                                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer accent-purple-600"
                                                                    title="Marcar para incluir en la venta / desmarcar para excluir"
                                                                />
                                                            ) : (
                                                                <div className="w-4 h-4 flex items-center justify-center">
                                                                    <span className="text-purple-600 dark:text-purple-400 text-lg">✓</span>
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
                                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-purple-700 dark:text-purple-300 font-medium">
                                                        {item.cantidad}
                                                    </td>
                                                    {tipo === 'venta' && (
                                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-purple-700 dark:text-purple-300">
                                                            {item.unidad_medida_nombre || 'N/A'}
                                                        </td>
                                                    )}
                                                    {tipo === 'compra' && (
                                                        <>
                                                            <td className="px-4 py-2 whitespace-nowrap text-xs text-purple-700 dark:text-purple-300 font-mono">
                                                                {(item.precio_unitario || 0).toFixed(2)}
                                                            </td>
                                                            <td colSpan={2}></td>
                                                        </>
                                                    )}
                                                    {tipo === 'venta' && (
                                                        <td className="px-4 py-2 whitespace-nowrap text-xs text-purple-700 dark:text-purple-300 font-mono">
                                                            {(item.precio_unitario || 0).toFixed(2)}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-purple-700 dark:text-purple-300">
                                                        {((item.cantidad || 0) * (item.precio_unitario || 0)).toFixed(2)}
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
        </div>
    );
}
