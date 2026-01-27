import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { NotificationService } from '@/infrastructure/services/notification.service';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
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
    onUpdateDetailUnidadConPrecio // ✅ NUEVO: Actualizar unidad y precio juntos
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

            // ✅ Pasar almacen_id si está disponible
            if (almacen_id) {
                params.append('almacen_id', almacen_id.toString());
            }

            const response = await fetch(`/api/productos/buscar?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Error en búsqueda de productos');
            }

            const data = await response.json();

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
                peso: p.peso,
                codigos_barras: p.codigosBarra?.map((cb: any) => cb.codigo) || [],
                // ✅ NUEVO: Campos para productos fraccionados
                es_fraccionado: p.es_fraccionado || false,
                unidad_medida_id: p.unidad_medida_id,
                unidad_medida_nombre: p.unidad_medida_nombre,
                conversiones: p.conversiones || []
            }));

            setProductosDisponibles(productosAPI);

            // ✅ NUEVO: Si hay exactamente 1 resultado exacto, agregarlo automáticamente
            if (productosAPI.length === 1 && productosAPI[0].codigo === term) {
                handleAddProduct(productosAPI[0]);
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

                const response = await fetch(`/api/productos/buscar?${params.toString()}`);

                if (!response.ok) {
                    throw new Error('Error buscando producto');
                }

                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    const productoAPI = data.data[0];
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
                        conversiones: productoAPI.conversiones || []
                    };

                    onAddProduct(producto);
                    setShowScannerModal(false);
                    setProductSearch('');
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
        onUpdateDetail(index, field, value);
    };

    // Función para eliminar detalle
    const handleRemoveDetail = (index: number) => {
        onRemoveDetail(index);
    };

    // Función para agregar producto desde la búsqueda
    const handleAddProduct = (producto: Producto) => {
        onAddProduct(producto);
        // ✅ Limpiar búsqueda y sugerencias completamente después de agregar
        setProductSearch('');
        setProductosDisponibles([]);
        setSearchError(null);
    };

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

    return (
        <div>
            {/* Buscador de productos */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar productos
                </label>
                <div className="flex gap-2">
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
                        autoComplete="off" // ✅ Deshabilitar autocompletado
                        disabled={readOnly}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Buscar por nombre o código... (Enter para buscar)"
                    />
                    <button
                        type="button"
                        disabled={readOnly || isLoading}
                        onClick={() => buscarProductos()}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Buscar producto"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        disabled={readOnly}
                        onClick={openScannerModal}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Escanear código de barras"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 18h4.01M12 9h4.01M12 6h4.01M12 3h4.01" />
                        </svg>
                    </button>
                </div>

                {/* ✅ Mostrar resultados solo si hay búsqueda realizada */}
                {(productosDisponibles.length > 0 || searchError || (productSearch && !isLoading && productosDisponibles.length === 0)) && (
                    <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-zinc-600 rounded-md">
                        {/* ✅ ESTADO: Cargando */}
                        {isLoading && (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                🔍 Buscando productos...
                            </div>
                        )}

                        {/* ✅ ESTADO: Error */}
                        {searchError && !isLoading && (
                            <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 text-center">
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
                                    onClick={() => handleAddProduct(producto)}
                                    className="w-full text-left px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 border-b border-gray-100 dark:border-zinc-700 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {producto.nombre}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Código: {producto.codigo} | Precio: {formatCurrency(producto.precio_venta || 0)}
                                        {(producto as any).stock_disponible && ` | Stock: ${(producto as any).stock_disponible}`}
                                    </div>
                                </button>
                            ))
                        )}

                        {/* ✅ ESTADO: Sin resultados */}
                        {!isLoading && productosDisponibles.length === 0 && !searchError && (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                No se encontraron productos con ese criterio
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
                        <div className="absolute top-0 right-0 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-bl-lg border-l border-b border-blue-200 dark:border-blue-800 z-10">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-700 dark:border-t-blue-300 rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Actualizando precios...</span>
                        </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                        <thead className="bg-gray-50 dark:bg-zinc-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cantidad
                                </th>
                                {tipo === 'venta' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Unidad Venta
                                    </th>
                                )}
                                {tipo === 'compra' && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Costo Registrado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Precio Compra
                                        </th>
                                    </>
                                )}
                                {tipo === 'venta' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Precio de Venta
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Subtotal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                            {detalles.map((detalle, index) => {
                                // ✅ MODIFICADO: Usar detalle.producto si existe, sino buscar en productos
                                // detalle.producto ya tiene toda la información necesaria
                                const productoInfo = detalle.producto || productos.find(p => p.id === detalle.producto_id);

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

                                return (
                                    <tr key={detalle.producto_id} className={`hover:bg-gray-50 dark:hover:bg-zinc-800 ${tipo === 'compra' && tieneDiferencia && esAumento
                                        ? 'bg-amber-50 dark:bg-amber-950/10'
                                        : tipo === 'compra' && tieneDiferencia && !esAumento
                                            ? 'bg-green-50 dark:bg-green-950/10'
                                            : ''
                                        }`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {productoInfo?.nombre || 'Producto no encontrado'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-1">
                                                {productoInfo?.codigo && (
                                                    <div>Código: {productoInfo.codigo}</div>
                                                )}
                                                {productoInfo?.sku && (
                                                    <div>SKU: {productoInfo.sku}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                inputMode="numeric" // ✅ Mostrar teclado numérico en móvil
                                                disabled={readOnly}
                                                value={detalle.cantidad}
                                                onChange={(e) => {
                                                    // ✅ Solo permitir números enteros positivos
                                                    const valor = e.target.value;
                                                    if (valor === '' || /^\d+$/.test(valor)) {
                                                        const num = valor === '' ? 0 : parseInt(valor, 10);
                                                        if (num >= 0) {
                                                            handleUpdateDetail(index, 'cantidad', num);
                                                        }
                                                    }
                                                }}
                                                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        {tipo === 'venta' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
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
                                                        return (
                                                            <select
                                                                disabled={readOnly}
                                                                value={detalle.unidad_venta_id || detalle.unidad_medida_id || ''}
                                                                onChange={(e) => {
                                                                    const unidadSeleccionada = Number(e.target.value);

                                                                    // Recalcular precio según la unidad
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

                                                                    // ✅ NUEVO: Usar el método que actualiza unidad y precio juntos
                                                                    if (onUpdateDetailUnidadConPrecio) {
                                                                        onUpdateDetailUnidadConPrecio(index, unidadSeleccionada, nuevoPrecio);
                                                                    } else {
                                                                        // Fallback: hacer dos llamadas (antiguo comportamiento)
                                                                        handleUpdateDetail(index, 'unidad_venta_id', unidadSeleccionada);
                                                                        handleUpdateDetail(index, 'precio_unitario', nuevoPrecio);
                                                                    }
                                                                }}
                                                                className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {precioCosto > 0 ? formatCurrency(precioCosto) : 'N/A'}
                                                    </div>
                                                    {tieneDiferencia && (
                                                        <div className={`text-xs font-semibold mt-1 ${esAumento
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                            }`}>
                                                            {esAumento ? '↑ Aumento' : '↓ Disminución'} {formatCurrency(Math.abs(detalle.precio_unitario - precioCosto))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal" // ✅ Mostrar teclado decimal en móvil
                                                        disabled={readOnly}
                                                        value={detalle.precio_unitario}
                                                        onChange={(e) => {
                                                            // ✅ Solo permitir números decimales positivos
                                                            const valor = e.target.value;
                                                            if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                                                const num = valor === '' ? 0 : parseFloat(valor);
                                                                if (num >= 0) {
                                                                    handleUpdateDetail(index, 'precio_unitario', num);
                                                                }
                                                            }
                                                        }}
                                                        className={`w-24 px-2 py-1 text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${tieneDiferencia
                                                            ? esAumento
                                                                ? 'border-amber-300 dark:border-amber-700'
                                                                : 'border-green-300 dark:border-green-700'
                                                            : 'border-gray-300 dark:border-zinc-600'
                                                            }`}
                                                    />
                                                </td>
                                            </>
                                        )}
                                        {tipo === 'venta' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(detalle.precio_unitario)}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(detalle.subtotal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                type="button"
                                                disabled={readOnly}
                                                onClick={() => handleRemoveDetail(index)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No hay productos agregados
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Busca y agrega productos a la venta.
                    </p>
                </div>
            )}

            {/* Modal del escáner de códigos de barras */}
            {showScannerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Escanear código de barras
                            </h3>
                            <button
                                type="button"
                                onClick={closeScannerModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <BarcodeScannerComponent
                                width={300}
                                height={300}
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
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {scannerError}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeScannerModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
