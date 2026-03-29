import { useState } from 'react';
import { NotificationService } from '@/infrastructure/services/notification.service';
import type { Producto } from '@/domain/entities/ventas';

interface UseProductSearchProps {
    tipo: 'compra' | 'venta';
    almacen_id?: number;
    cliente_id?: number | null;
    readOnly?: boolean;
    onAddProduct: (producto: Producto) => void;
}

export function useProductSearch({
    tipo,
    almacen_id,
    cliente_id,
    readOnly,
    onAddProduct
}: UseProductSearchProps) {
    const [productSearch, setProductSearch] = useState('');
    const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);

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
            console.log('🔍 [useProductSearch] Buscando productos con endpoint:', url);

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`⚠️ [useProductSearch] Respuesta fallida: ${response.status} ${response.statusText}`);
                throw new Error('Error en búsqueda de productos');
            }

            const data = await response.json();

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

            // ✅ NUEVO: Filtrar productos válidos para ventas (stock > 0 y precio_venta > 0)
            // IMPORTANTE: Si incluirCombos=true, permitir combos sin stock ni precio_venta (se calcula de los componentes)
            const productosValidos = productosAPI.filter(p => {
                if (tipo === 'venta') {
                    const esCombo = (p as any).es_combo || false;
                    const tieneComponentes = ((p as any).combo_items?.length || 0) > 0;

                    // ✅ Si es combo, solo requiere componentes (stock se calcula de ellos)
                    if (esCombo) {
                        return tieneComponentes;
                    }

                    // Para productos normales, requiere stock y precio
                    return p.stock > 0 && p.precio_venta > 0;
                }
                return true; // Para compras mostrar todos
            });
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
                console.log('🔍 [useProductSearch - Scanner] Buscando por código de barras:', url);

                const response = await fetch(url);

                if (!response.ok) {
                    console.error(`⚠️ [useProductSearch - Scanner] Respuesta fallida: ${response.status} ${response.statusText}`);
                    throw new Error('Error buscando producto');
                }

                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    const productoAPI = data.data[0];

                    // ✅ NUEVO: Validar producto para ventas (stock > 0 y precio_venta > 0)
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
                        precio_costo: productoAPI.precio_costo || 0,
                        precio_compra: productoAPI.precio_costo || 0,
                        stock: productoAPI.stock_disponible || 0,
                        peso: productoAPI.peso,
                        codigos_barras: productoAPI.codigosBarra?.map((cb: any) => cb.codigo) || [],
                        es_fraccionado: productoAPI.es_fraccionado || false,
                        unidad_medida_id: productoAPI.unidad_medida_id,
                        unidad_medida_nombre: productoAPI.unidad_medida_nombre,
                        conversiones: productoAPI.conversiones || [],
                        precios: productoAPI.precios?.map((pr: any) => ({
                            id: pr.id,
                            tipo_precio_id: pr.tipo_precio_id,
                            nombre: pr.nombre || pr.tipoPrecio?.nombre,
                            precio: pr.precio
                        })) || []
                    };

                    handleAgregarProductoYLimpiar(producto);
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

    return {
        productSearch,
        setProductSearch,
        productosDisponibles,
        isLoading,
        searchError,
        isFocused,
        setIsFocused,
        buscarProductos,
        handleScannerResult,
        handleAgregarProductoYLimpiar
    };
}
