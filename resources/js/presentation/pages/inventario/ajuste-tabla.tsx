import { useState, useCallback, useMemo, useEffect, useRef, ReactNode } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Almacen } from '@/domain/entities/almacenes';
import { StockProducto, Producto } from '@/domain/entities/movimientos-inventario';
import { Id } from '@/domain/entities/shared';
import { Button } from '@/presentation/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Trash2, Plus, Save, XCircle, Search, Loader, FileText } from 'lucide-react';
import { Breadcrumbs } from '@/presentation/components/breadcrumbs';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';

interface TipoAjusteInventario {
    id: number;
    clave: string;
    label: string;
    tipo_operacion: 'entrada' | 'salida' | 'ambos';
    descripcion?: string;
    color?: string;
    bg_color?: string;
    text_color?: string;
    activo: boolean;
}

interface AjusteItem {
    id: string; // ID temporal para la fila
    stock_producto_id: number | null;
    producto?: StockProducto & { producto: Producto };
    cantidad_actual: number;
    cantidad_ajuste: number;
    cantidad_nueva: number;
    tipo_ajuste: 'entrada' | 'salida';
    tipo_ajuste_inventario_id?: number;
    tipoAjusteInventario?: TipoAjusteInventario;
    observacion: string;
}

interface PageProps extends InertiaPageProps {
    almacenes: Almacen[];
    stock_productos: StockProducto[];
    almacen_seleccionado?: number;
    tipos_ajuste_inventario?: TipoAjusteInventario[];
}

const breadcrumbs = [
    { title: 'Inventario', href: '/inventario' },
    { title: 'Ajuste por Tabla', href: '/inventario/ajuste-tabla' },
];

// Componente para renderizar el dropdown como Portal
interface DropdownPortalProps {
    ajusteId: string;
    inputRef: React.RefObject<HTMLInputElement>;
    searchResults: any[];
    loadingSearch: boolean;
    onSelectProduct: (producto: any) => void;
    visible: boolean;
}

function DropdownPortal({
    ajusteId,
    inputRef,
    searchResults,
    onSelectProduct,
    visible,
}: DropdownPortalProps) {
    const [position, setPosition] = useState<{
        top: number;
        left: number;
        width: number;
    }>({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (!inputRef.current || !visible) return;

        const rect = inputRef.current.getBoundingClientRect();
        setPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
    }, [visible, inputRef, searchResults]);

    if (!visible || searchResults.length === 0) return null;

    return createPortal(
        <div
            className="fixed bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-2xl z-[9999] max-h-48 overflow-y-auto"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
            }}
        >
            {searchResults.map((producto) => (
                <div
                    key={producto.id}
                    onClick={() => {
                        onSelectProduct(producto);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-600 border-b dark:border-slate-600 last:border-b-0 transition"
                >
                    <div className="font-medium text-sm dark:text-gray-200">
                        {producto.nombre}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{producto.sku}</span>
                        {' | Stock: '}
                        {parseFloat(producto.cantidad_disponible).toFixed(2)}
                        {/* ✅ Mostrar lote si existe */}
                        {producto.lote && (
                            <>
                                {' | 📦 '}
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    {producto.lote}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>,
        document.body
    );
}

export default function AjusteTabla() {
    const { props } = usePage<PageProps>();
    const { almacenes, stock_productos: initialStockProductos, tipos_ajuste_inventario = [] } = props;

    const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>('');
    const [ajustes, setAjustes] = useState<AjusteItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar tipos de ajuste si no vienen del backend
    const [tiposAjuste, setTiposAjuste] = useState<TipoAjusteInventario[]>(tipos_ajuste_inventario);

    // ✅ Cargar tipos de ajuste desde el API si no vienen en props
    useEffect(() => {
        if (tiposAjuste.length === 0) {
            fetch('/api/tipos-ajuste-inventario', {
                headers: { 'Accept': 'application/json' },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.data) {
                        setTiposAjuste(data.data);
                    }
                })
                .catch((err) => console.error('Error cargando tipos de ajuste:', err));
        }
    }, []);

    // Estados para búsqueda de productos
    const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
    const [searchResults, setSearchResults] = useState<{ [key: string]: any[] }>({});
    const [loadingSearch, setLoadingSearch] = useState<{ [key: string]: boolean }>({});
    const [showDropdown, setShowDropdown] = useState<{ [key: string]: boolean }>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ajusteInventarioId, setAjusteInventarioId] = useState<number | null>(null);
    const ajustesGuardadosRef = useRef<AjusteItem[]>([]);
    const searchTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
    const dropdownRefsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const inputRefsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Filtrar stock_productos según almacén seleccionado
    const stockProductosFiltrados = useMemo(() => {
        if (!almacenSeleccionado) return [];
        return initialStockProductos.filter(
            (sp) => String(sp.almacen_id) === almacenSeleccionado
        );
    }, [almacenSeleccionado, initialStockProductos]);

    // Generar ID temporal único
    const generarIdTemporal = (): string => {
        return `temp_${Date.now()}_${Math.random()}`;
    };

    // Seleccionar producto de la búsqueda
    const seleccionarProducto = useCallback(
        (ajusteId: string, producto: any) => {
            // Cerrar dropdown
            setShowDropdown((prev) => ({
                ...prev,
                [ajusteId]: false,
            }));

            // Actualizar el término de búsqueda con el nombre del producto
            setSearchTerms((prev) => ({
                ...prev,
                [ajusteId]: `${producto.sku ? `${producto.sku} - ` : ''}${producto.nombre}`,
            }));

            // Actualizar la fila con el stock_producto_id
            // Actualizar ajustes directamente aquí para evitar stale closure
            setAjustes((prevAjustes) =>
                prevAjustes.map((ajuste) => {
                    if (ajuste.id !== ajusteId) return ajuste;

                    const actualizado = { ...ajuste, stock_producto_id: producto.id };

                    // Buscar el producto en los stock filtrados
                    const stockProducto = stockProductosFiltrados.find(
                        (sp) => sp.id === producto.id
                    );

                    if (stockProducto) {
                        actualizado.producto = stockProducto;
                        actualizado.cantidad_actual =
                            parseFloat(stockProducto.cantidad_disponible) || 0;
                        actualizado.cantidad_nueva = actualizado.cantidad_actual;
                    }

                    return actualizado;
                })
            );
        },
        [stockProductosFiltrados]
    );

    // Buscar productos por término de búsqueda (Enter o botón)
    const buscarProductos = useCallback(
        async (ajusteId: string, term: string) => {
            if (!almacenSeleccionado) {
                toast.error('Selecciona un almacén primero');
                return;
            }

            if (term.trim() === '') {
                toast.error('Ingresa un término de búsqueda');
                return;
            }

            try {
                setLoadingSearch((prev) => ({ ...prev, [ajusteId]: true }));

                const response = await fetch(
                    `/api/inventario/productos-almacen/${almacenSeleccionado}?q=${encodeURIComponent(
                        term
                    )}&limit=10`,
                    {
                        headers: {
                            'Accept': 'application/json',
                        },
                    }
                );

                const data = await response.json();

                if (data.success) {
                    if (data.data.length === 0) {
                        toast.error('No se encontraron productos');
                    } else if (data.data.length === 1) {
                        // Si hay solo 1 resultado, seleccionarlo automáticamente
                        const producto = data.data[0];
                        toast.success(`Producto seleccionado: ${producto.nombre}`);
                        seleccionarProducto(ajusteId, producto);
                    } else {
                        // Mostrar dropdown si hay múltiples resultados
                        setSearchResults((prev) => ({
                            ...prev,
                            [ajusteId]: data.data || [],
                        }));
                        setShowDropdown((prev) => ({
                            ...prev,
                            [ajusteId]: true,
                        }));
                    }
                } else {
                    toast.error(data.message || 'Error en la búsqueda');
                }
            } catch (error) {
                console.error('Error buscando productos:', error);
                toast.error('Error al buscar productos');
            } finally {
                setLoadingSearch((prev) => ({ ...prev, [ajusteId]: false }));
            }
        },
        [almacenSeleccionado, seleccionarProducto]
    );

    // Agregar nueva fila de ajuste
    const agregarFila = useCallback(() => {
        const nuevaFila: AjusteItem = {
            id: generarIdTemporal(),
            stock_producto_id: null,
            cantidad_actual: 0,
            cantidad_ajuste: 0,
            cantidad_nueva: 0,
            tipo_ajuste: 'entrada',
            observacion: '',
        };
        setAjustes([...ajustes, nuevaFila]);
    }, [ajustes]);

    // Eliminar fila de ajuste
    const eliminarFila = useCallback((id: string) => {
        setAjustes(ajustes.filter((a) => a.id !== id));
    }, [ajustes]);

    // Actualizar fila de ajuste
    const actualizarFila = useCallback(
        (id: string, campo: string, valor: any) => {
            setAjustes(
                ajustes.map((ajuste) => {
                    if (ajuste.id !== id) return ajuste;

                    const actualizado = { ...ajuste, [campo]: valor };

                    // Si cambió el stock_producto_id
                    if (campo === 'stock_producto_id') {
                        const stockProducto = stockProductosFiltrados.find(
                            (sp) => sp.id === valor
                        );
                        if (stockProducto) {
                            actualizado.producto = stockProducto;
                            actualizado.cantidad_actual =
                                parseFloat(stockProducto.cantidad_disponible) || 0;
                            actualizado.cantidad_nueva = actualizado.cantidad_actual;
                            // Actualizar término de búsqueda con el nombre del producto
                            setSearchTerms((prev) => ({
                                ...prev,
                                [id]: stockProducto.producto?.nombre || '',
                            }));
                        }
                    }

                    // Recalcular cantidad_nueva
                    if (
                        campo === 'cantidad_ajuste' ||
                        campo === 'tipo_ajuste'
                    ) {
                        const ajusteNum =
                            campo === 'cantidad_ajuste'
                                ? parseInt(valor) || 0
                                : actualizado.cantidad_ajuste;
                        const tipoAjuste =
                            campo === 'tipo_ajuste'
                                ? valor
                                : actualizado.tipo_ajuste;

                        if (tipoAjuste === 'entrada') {
                            actualizado.cantidad_nueva =
                                actualizado.cantidad_actual + ajusteNum;
                        } else {
                            actualizado.cantidad_nueva = Math.max(
                                0,
                                actualizado.cantidad_actual - ajusteNum
                            );
                        }
                    }

                    return actualizado;
                })
            );
        },
        [ajustes, stockProductosFiltrados]
    );

    // Validar ajustes
    const validarAjustes = (): boolean => {
        if (ajustes.length === 0) {
            toast.error('Debes agregar al menos un ajuste');
            return false;
        }

        for (const ajuste of ajustes) {
            if (!ajuste.stock_producto_id) {
                toast.error('Selecciona un producto en todas las filas');
                return false;
            }
            if (ajuste.cantidad_ajuste <= 0) {
                toast.error('La cantidad de ajuste debe ser mayor a 0');
                return false;
            }
        }

        return true;
    };

    // Preparar datos para enviar
    const prepararDatos = () => {
        return ajustes.map((ajuste) => ({
            stock_producto_id: ajuste.stock_producto_id,
            nueva_cantidad: ajuste.cantidad_nueva,
            observacion: ajuste.observacion,
            tipo_ajuste: ajuste.tipo_ajuste,
            tipo_ajuste_inventario_id: ajuste.tipo_ajuste_inventario_id, // ✅ Incluir tipo de ajuste
        }));
    };

    // Procesar ajustes
    const procesarAjustes = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarAjustes()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/inventario/ajuste', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    almacen_id: almacenSeleccionado,
                    ajustes: prepararDatos(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al procesar ajustes');
                return;
            }

            toast.success(
                `Se procesaron ${ajustes.length} ajustes exitosamente`
            );

            // Guardar ajustes temporalmente para impresión
            ajustesGuardadosRef.current = ajustes;

            // Guardar el ajuste_inventario_id para impresión histórica
            if (data.data?.ajuste_inventario_id) {
                setAjusteInventarioId(data.data.ajuste_inventario_id);
            }

            // Preparar para impresión
            abrirOpcionesImpresionDespuesDeGuardar();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar ajustes');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cerrar modal de impresión y limpiar datos
    const cerrarModalImpresion = () => {
        setIsModalOpen(false);
        // Limpiar datos después de cerrar el modal
        setTimeout(() => {
            setAjustes([]);
            setAlmacenSeleccionado('');
            ajustesGuardadosRef.current = [];
            setAjusteInventarioId(null);
            // Redireccionar a /inventario/ajuste después de cerrar el modal
            router.visit('/inventario/ajuste');
        }, 300); // Esperar a que se cierre la animación del modal
    };

    // Preparar ajustes para impresión y abrir modal de opciones
    const abrirOpcionesImpresion = async () => {
        if (ajustes.length === 0) {
            toast.error('No hay ajustes para imprimir');
            return;
        }

        try {
            // Preparar datos con información formateada para impresión
            const datosImpresion = ajustes.map((ajuste) => ({
                fecha: new Date().toISOString().split('T')[0],
                producto_nombre: ajuste.producto?.producto?.nombre || 'N/A',
                producto_sku: ajuste.producto?.producto?.sku || '-',
                almacen_nombre: ajuste.producto?.almacen?.nombre || 'N/A',
                cantidad: ajuste.cantidad_ajuste,
                cantidad_anterior: ajuste.cantidad_actual,
                cantidad_posterior: ajuste.cantidad_nueva,
                tipo_operacion: ajuste.tipo_ajuste,
                tipo_ajuste_label: ajuste.tipoAjusteInventario?.label || '',
                observacion: ajuste.observacion,
            }));

            // Enviar a backend para preparar la impresión (guardar en sesión)
            const response = await fetch('/api/inventario/ajuste/preparar-impresion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    ajustes: datosImpresion,
                    almacen_filtro:
                        ajustes[0]?.producto?.almacen?.nombre || 'Todos',
                    tipo_ajuste_filtro: null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                toast.error(data.message || 'Error al preparar impresión');
                return;
            }

            // Abrir modal de opciones de salida
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al preparar ajustes para impresión');
        }
    };

    // Preparar ajustes guardados para impresión y abrir modal (se ejecuta después de guardar)
    const abrirOpcionesImpresionDespuesDeGuardar = async () => {
        const ajustesGuardados = ajustesGuardadosRef.current;

        if (ajustesGuardados.length === 0) {
            toast.error('No hay ajustes para imprimir');
            setAjustes([]);
            setAlmacenSeleccionado('');
            return;
        }

        try {
            // Preparar datos con información formateada para impresión
            const datosImpresion = ajustesGuardados.map((ajuste) => ({
                fecha: new Date().toISOString().split('T')[0],
                producto_nombre: ajuste.producto?.producto?.nombre || 'N/A',
                producto_sku: ajuste.producto?.producto?.sku || '-',
                almacen_nombre: ajuste.producto?.almacen?.nombre || 'N/A',
                cantidad: ajuste.cantidad_ajuste,
                cantidad_anterior: ajuste.cantidad_actual,
                cantidad_posterior: ajuste.cantidad_nueva,
                tipo_operacion: ajuste.tipo_ajuste,
                tipo_ajuste_label: ajuste.tipoAjusteInventario?.label || '',
                observacion: ajuste.observacion,
            }));

            // Enviar a backend para preparar la impresión (guardar en sesión)
            const response = await fetch('/api/inventario/ajuste/preparar-impresion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    ajustes: datosImpresion,
                    almacen_filtro:
                        ajustesGuardados[0]?.producto?.almacen?.nombre || 'Todos',
                    tipo_ajuste_filtro: null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                toast.error(data.message || 'Error al preparar impresión');
                setAjustes([]);
                setAlmacenSeleccionado('');
                return;
            }

            // Abrir modal de opciones de salida
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al preparar ajustes para impresión');
            setAjustes([]);
            setAlmacenSeleccionado('');
        }
    };

    // Calcular resumen
    const resumen = useMemo(() => {
        const totalProductos = ajustes.filter(
            (a) => a.stock_producto_id !== null
        ).length;
        const entradas = ajustes.reduce(
            (sum, a) =>
                a.tipo_ajuste === 'entrada' ? sum + a.cantidad_ajuste : sum,
            0
        );
        const salidas = ajustes.reduce(
            (sum, a) =>
                a.tipo_ajuste === 'salida' ? sum + a.cantidad_ajuste : sum,
            0
        );

        return { totalProductos, entradas, salidas };
    }, [ajustes]);

    return (
        <AppLayout>
            <Head title="Ajuste de Inventario por Tabla" />

            <div className="space-y-4 p-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Ajuste de Inventario
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Realiza ajustes de stock por tabla editable
                        </p>
                    </div>
                </div>

                {/* Selector de Almacén */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow dark:shadow-slate-900">
                    <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                        Almacén
                    </label>
                    <Select
                        value={almacenSeleccionado}
                        onValueChange={setAlmacenSeleccionado}
                    >
                        <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Selecciona un almacén" />
                        </SelectTrigger>
                        <SelectContent>
                            {almacenes.map((almacen) => (
                                <SelectItem
                                    key={almacen.id}
                                    value={String(almacen.id)}
                                >
                                    {almacen.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tabla de Ajustes */}
                {almacenSeleccionado && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900 overflow-hidden">
                        <form onSubmit={procesarAjustes}>
                            {/* Tabla */}
                            <div className="overflow-x-auto overflow-y-visible">
                                <table className="w-full relative">
                                    <thead className="bg-gray-100 dark:bg-slate-700 border-b dark:border-slate-600">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-200">
                                                Producto
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-medium dark:text-gray-200">
                                                📥/📤 Movimiento
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-200">
                                                Stock Actual
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-200">
                                                Cantidad
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-200">
                                                Stock Nuevo
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-200">
                                                Observación
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-medium dark:text-gray-200">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ajustes.map((ajuste, idx) => (
                                            <tr
                                                key={ajuste.id}
                                                className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                                            >
                                                {/* Producto - Search Input */}
                                                <td className="px-4 py-3 relative">
                                                    <div className="relative">
                                                        <div className="relative flex items-center gap-1">
                                                            <div className="relative flex-1">
                                                                <Search
                                                                    size={16}
                                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                                                                />
                                                                <Input
                                                                    ref={(el) => {
                                                                        if (el) inputRefsRef.current[ajuste.id] = el;
                                                                    }}
                                                                    type="text"
                                                                    placeholder="SKU o nombre..."
                                                                    value={
                                                                        searchTerms[
                                                                        ajuste.id
                                                                        ] || ''
                                                                    }
                                                                    onChange={(e) => {
                                                                        setSearchTerms(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [ajuste.id]:
                                                                                    e.target
                                                                                        .value,
                                                                            })
                                                                        );
                                                                    }}
                                                                    onKeyPress={(e) => {
                                                                        if (
                                                                            e.key ===
                                                                            'Enter'
                                                                        ) {
                                                                            e.preventDefault();
                                                                            buscarProductos(
                                                                                ajuste.id,
                                                                                searchTerms[
                                                                                ajuste
                                                                                    .id
                                                                                ] || ''
                                                                            );
                                                                        }
                                                                    }}
                                                                    onFocus={() =>
                                                                        (searchResults[
                                                                            ajuste.id
                                                                        ]?.length >
                                                                            0) &&
                                                                        setShowDropdown(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [ajuste.id]:
                                                                                    true,
                                                                            })
                                                                        )
                                                                    }
                                                                    className="w-full pl-8 pr-10"
                                                                />
                                                                {loadingSearch[
                                                                    ajuste.id
                                                                ] && (
                                                                        <Loader
                                                                            size={16}
                                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin pointer-events-none"
                                                                        />
                                                                    )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    buscarProductos(
                                                                        ajuste.id,
                                                                        searchTerms[
                                                                        ajuste
                                                                            .id
                                                                        ] || ''
                                                                    )
                                                                }
                                                                disabled={
                                                                    loadingSearch[
                                                                    ajuste.id
                                                                    ] ||
                                                                    !almacenSeleccionado
                                                                }
                                                                className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-md transition flex items-center justify-center"
                                                                title="Buscar (Enter)"
                                                            >
                                                                <Search size={16} />
                                                            </button>
                                                        </div>

                                                        {/* Dropdown Portal - Renderizado fuera de la tabla */}
                                                        <DropdownPortal
                                                            ajusteId={ajuste.id}
                                                            inputRef={
                                                                {
                                                                    current:
                                                                        inputRefsRef
                                                                            .current[
                                                                        ajuste.id
                                                                        ] ||
                                                                        null,
                                                                } as React.RefObject<HTMLInputElement>
                                                            }
                                                            searchResults={
                                                                searchResults[
                                                                ajuste.id
                                                                ] || []
                                                            }
                                                            loadingSearch={
                                                                loadingSearch[
                                                                ajuste.id
                                                                ] || false
                                                            }
                                                            onSelectProduct={(producto) => {
                                                                seleccionarProducto(ajuste.id, producto);
                                                            }}
                                                            visible={
                                                                showDropdown[
                                                                ajuste.id
                                                                ] || false
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                                {/* 📥/📤 MOVIMIENTO - ENTRADA O SALIDA - INTERACTIVO */}
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex gap-1 justify-center mb-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // Usar actualizarFila para ejecutar el recálculo automático
                                                                actualizarFila(ajuste.id, 'tipo_ajuste', 'entrada');
                                                            }}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${ajuste.tipo_ajuste === 'entrada'
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-green-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-900/30'
                                                                }`}
                                                            title="Selecciona ENTRADA"
                                                        >
                                                            📥 ENTRADA
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // Usar actualizarFila para ejecutar el recálculo automático
                                                                actualizarFila(ajuste.id, 'tipo_ajuste', 'salida');
                                                            }}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${ajuste.tipo_ajuste === 'salida'
                                                                    ? 'bg-red-500 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-red-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/30'
                                                                }`}
                                                            title="Selecciona SALIDA"
                                                        >
                                                            📤 SALIDA
                                                        </button>
                                                    </div>
                                                    {/* Mostrar tipos filtrados según ENTRADA/SALIDA */}
                                                    <Select
                                                        value={String(ajuste.tipo_ajuste_inventario_id || '')}
                                                        onValueChange={(val) => {
                                                            const tipo = tiposAjuste.find(t => String(t.id) === val);
                                                            if (tipo) {
                                                                setAjustes(prevAjustes =>
                                                                    prevAjustes.map(a => {
                                                                        if (a.id !== ajuste.id) return a;
                                                                        return {
                                                                            ...a,
                                                                            tipo_ajuste_inventario_id: tipo.id,
                                                                            tipoAjusteInventario: tipo,
                                                                            // ✅ NO actualizar tipo_ajuste - son independientes
                                                                        };
                                                                    })
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className={`w-full ${!ajuste.tipo_ajuste ? 'border-yellow-300' : ''}`}>
                                                            <SelectValue
                                                                placeholder={ajuste.tipoAjusteInventario?.label || 'Selecciona subtipo...'}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {/* Mostrar todos los tipos si están vacíos, sino filtrar */}
                                                            {tiposAjuste.length === 0 ? (
                                                                <div className="p-2 text-sm text-gray-500">
                                                                    Cargando tipos de ajuste...
                                                                </div>
                                                            ) : (
                                                                (() => {
                                                                    const tiposFiltrados = tiposAjuste.filter(
                                                                        tipo => tipo.tipo_operacion === ajuste.tipo_ajuste
                                                                    );
                                                                    // Si no hay tipos filtrados, mostrar todos
                                                                    const tiposAMostrar = tiposFiltrados.length > 0 ? tiposFiltrados : tiposAjuste;

                                                                    return tiposAMostrar.map((tipo) => (
                                                                        <SelectItem
                                                                            key={tipo.id}
                                                                            value={String(tipo.id)}
                                                                        >
                                                                            {tipo.tipo_operacion === 'entrada' ? '📥' : '📤'} {tipo.label}
                                                                        </SelectItem>
                                                                    ));
                                                                })()
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </td>

                                                {/* Stock Actual */}
                                                <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">
                                                    {ajuste.cantidad_actual.toFixed(
                                                        2
                                                    )}
                                                </td>

                                                {/* Cantidad Ajuste */}
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                            ajuste.cantidad_ajuste
                                                        }
                                                        onChange={(e) =>
                                                            actualizarFila(
                                                                ajuste.id,
                                                                'cantidad_ajuste',
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 0
                                                            )
                                                        }
                                                        className="w-full"
                                                        placeholder="0"
                                                    />
                                                </td>

                                                {/* Stock Nuevo */}
                                                <td className="px-4 py-3 text-sm font-semibold bg-blue-50 dark:bg-blue-900 dark:text-blue-100">
                                                    {ajuste.cantidad_nueva.toFixed(
                                                        2
                                                    )}
                                                </td>

                                                {/* Observación */}
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="text"
                                                        value={
                                                            ajuste.observacion
                                                        }
                                                        onChange={(e) =>
                                                            actualizarFila(
                                                                ajuste.id,
                                                                'observacion',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full"
                                                        placeholder="Observación..."
                                                    />
                                                </td>

                                                {/* Acción */}
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            eliminarFila(
                                                                ajuste.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Resumen */}
                            {ajustes.length > 0 && (
                                <div className="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t dark:border-slate-600 grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Productos
                                        </p>
                                        <p className="text-2xl font-bold dark:text-white">
                                            {resumen.totalProductos}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Entradas
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            +{resumen.entradas}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Salidas
                                        </p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            -{resumen.salidas}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Botones */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t dark:border-slate-600 flex gap-3 justify-between">
                                <Button
                                    type="button"
                                    onClick={agregarFila}
                                    variant="outline"
                                    disabled={!almacenSeleccionado}
                                >
                                    <Plus size={18} className="mr-2" />
                                    Agregar Fila
                                </Button>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setAjustes([]);
                                            setAlmacenSeleccionado('');
                                        }}
                                    >
                                        <XCircle size={18} className="mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={abrirOpcionesImpresion}
                                        disabled={ajustes.length === 0}
                                    >
                                        <FileText size={18} className="mr-2" />
                                        Opciones de Salida
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            isSubmitting || ajustes.length === 0
                                        }
                                    >
                                        <Save size={18} className="mr-2" />
                                        {isSubmitting
                                            ? 'Procesando...'
                                            : 'Guardar Ajustes'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Mensaje cuando no hay almacén seleccionado */}
                {!almacenSeleccionado && (
                    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-700 dark:text-blue-200">
                        <p>
                            Selecciona un almacén para comenzar a realizar
                            ajustes
                        </p>
                    </div>
                )}

                {/* Modal de opciones de salida/impresión */}
                <OutputSelectionModal
                    isOpen={isModalOpen}
                    onClose={cerrarModalImpresion}
                    documentoId={ajusteInventarioId || 0}
                    tipoDocumento="ajuste"
                    documentoInfo={{
                        numero: `${ajustesGuardadosRef.current.length} ajuste(s)`,
                        fecha: new Date().toLocaleDateString('es-ES'),
                    }}
                />
            </div>
        </AppLayout>
    );
}
