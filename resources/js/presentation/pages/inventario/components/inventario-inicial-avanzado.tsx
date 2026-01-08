import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import NotificationService from '@/infrastructure/services/notification.service';
import { AlertCircle, Barcode, RefreshCw, CheckCircle2, Clock, Camera } from 'lucide-react';
import { Almacen } from '@/domain/entities/almacenes';
import { Producto } from '@/domain/entities/productos';
import type { Id } from '@/domain/entities/shared';
// import type { InventarioInicialBorradorItem } from '@/domain/entities/inventario-inicial';
import ProductoRowExpandible from './producto-row-expandible';
import CargarProductosModal from './cargar-productos-modal';
import EstadoBorrador from './estado-borrador';
import ScannerCodigoBarras from './scanner-codigo-barras';
import ScannerCamaraModal from './scanner-camara-modal';

// Declarar la función global route de Ziggy
declare function route(name: string, params?: { [key: string]: Id | string | number }): string;

// Helper function para rutas (Ziggy)
const getRoute = (name: string, params?: { [key: string]: Id | string }) => {
    if (typeof route !== 'undefined') {
        return route(name, params);
    }
    // Fallback si route no está disponible
    const routes: { [key: string]: string } = {
        'inicial.draft.create': '/inventario/inventario-inicial/draft/create',
        'inicial.draft.get': '/inventario/inventario-inicial/draft/{borrador}',
        'inicial.draft.item.store': '/inventario/inventario-inicial/draft/{borrador}/items',
        'inicial.draft.productos.add': '/inventario/inventario-inicial/draft/{borrador}/productos',
        'inicial.draft.complete': '/inventario/inventario-inicial/draft/{borrador}/complete',
        'draft.productos.load-paginated': '/inventario/inventario-inicial/draft/{borrador}/productos/load-paginated',
        'productos.paginados': '/productos/paginados/listar',
        'inicial.index': '/inventario/inventario-inicial',
    };
    let url = routes[name] || '';
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`{${key}}`, String(value));
        });
    }
    return url;
};

interface BorradorItem {
    id?: number;
    producto_id: number;
    almacen_id: number;
    cantidad?: number;
    lote?: string;
    fecha_vencimiento?: string;
    precio_costo?: number;
    producto?: Producto;
    almacen?: Almacen;
    stock_existente_id?: number;
    es_actualizacion?: boolean;
}

interface Borrador {
    id: number;
    estado: 'borrador' | 'completado';
    items: BorradorItem[];
}

interface Props {
    almacenes: Almacen[];
}

export default function InventarioInicialAvanzado({ almacenes }: Props) {
    const [borrador, setBorrador] = useState<Borrador | null>(null);
    const [expandidos, setExpandidos] = useState<Set<Id>>(new Set());
    const [showCargarModal, setShowCargarModal] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [busqueda, setBusqueda] = useState('');
    const [productosPorPagina] = useState(30);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [paginaProductosBackend, setPaginaProductosBackend] = useState(1);
    const [totalPaginasBackend, setTotalPaginasBackend] = useState(0);
    const [totalProductosBackend, setTotalProductosBackend] = useState(0);
    const [modoCargarTodos, setModoCargarTodos] = useState(false);
    const [sugerencias, setSugerencias] = useState<BorradorItem[]>([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [mostrarScannerCamara, setMostrarScannerCamara] = useState(false);

    // Obtener token CSRF
    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        return token?.content || '';
    };

    // Inicializar borrador al cargar
    useEffect(() => {
        inicializarBorrador();
    }, []);

    const inicializarBorrador = async () => {
        try {
            const response = await fetch(getRoute('inicial.draft.create'), {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken(),
                },
            });

            if (!response.ok) throw new Error('Error al crear borrador');

            const data = await response.json();
            setBorrador({
                id: data.id,
                estado: 'borrador',
                items: [],
            });

            // Cargar borrador existente si lo hay
            cargarBorrador(data.id);
        } catch (error) {
            NotificationService.error('Error al inicializar borrador');
            console.error(error);
        }
    };

    const cargarBorrador = async (borradorId: number) => {
        try {
            const response = await fetch(getRoute('inicial.draft.get', { borrador: borradorId }), {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) throw new Error('Error al cargar borrador');

            const data = await response.json();
            setBorrador(prev => prev ? { ...prev, items: data.items || [] } : null);
        } catch (error) {
            console.error('Error cargando borrador:', error);
        }
    };

    const agregarProductos = async (productoIds: number[]) => {
        if (!borrador) return;

        try {
            setGuardando(true);
            const response = await fetch(
                getRoute('inicial.draft.productos.add', { borrador: borrador.id }),
                {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken(),
                    },
                    body: JSON.stringify({ producto_ids: productoIds }),
                }
            );

            if (!response.ok) throw new Error('Error al agregar productos');

            const data = await response.json();
            await cargarBorrador(borrador.id);
            NotificationService.success(`Se agregaron ${data.itemsCount} items`);
        } catch (error) {
            NotificationService.error('Error al agregar productos');
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    const cargarProductosPaginados = async (page: number = 1, search: string = '') => {
        if (!borrador) return;

        try {
            setCargandoProductos(true);
            const response = await fetch(
                getRoute('draft.productos.load-paginated', { borrador: borrador.id }),
                {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        page: page,
                        per_page: 30,
                        search: search,
                    }),
                }
            );

            if (!response.ok) throw new Error('Error al cargar productos');

            const data = await response.json();

            // Actualizar metadata de paginación backend
            setPaginaProductosBackend(data.current_page);
            setTotalPaginasBackend(data.last_page);
            setTotalProductosBackend(data.total);

            // Recargar borrador para obtener items actualizados
            await cargarBorrador(borrador.id);

            NotificationService.success(
                `Cargados ${data.itemsAdded} items de ${data.productos.length} productos (Página ${data.current_page} de ${data.last_page})`
            );
        } catch (error) {
            NotificationService.error('Error al cargar productos paginados');
            console.error(error);
        } finally {
            setCargandoProductos(false);
        }
    };

    const guardarItem = async (
        productoId: Id,
        almacenId: Id,
        cantidad?: number,
        lote?: string,
        fechaVencimiento?: string
    ) => {
        if (!borrador) return;

        try {
            const response = await fetch(
                getRoute('inicial.draft.item.store', { borrador: borrador.id }),
                {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        producto_id: productoId,
                        almacen_id: almacenId,
                        cantidad: cantidad || null,
                        lote: lote || null,
                        fecha_vencimiento: fechaVencimiento || null,
                    }),
                }
            );

            if (!response.ok) throw new Error('Error al guardar item');

            const data = await response.json();
            console.log('Item guardado:', data);
            await cargarBorrador(borrador.id);
        } catch (error) {
            console.error('Error guardando item:', error);
            throw error;
        }
    };

    const guardarTodosBorrador = async () => {
        if (!borrador) return;

        try {
            setGuardando(true);
            let itemsGuardados = 0;

            // Guardar todos los items del borrador que tengan cantidad
            for (const item of borrador.items) {
                if (item.cantidad && typeof item.cantidad === 'number' && item.cantidad > 0) {
                    try {
                        await guardarItem(
                            item.producto_id,
                            item.almacen_id,
                            item.cantidad,
                            item.lote || undefined,
                            item.fecha_vencimiento || undefined
                        );
                        itemsGuardados++;
                    } catch (error) {
                        console.error('Error guardando item individual:', error);
                    }
                }
            }

            NotificationService.success(`Se guardaron ${itemsGuardados} items en el borrador`);
        } catch (error) {
            NotificationService.error('Error guardando borrador');
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    const handleBusquedaChange = (valor: string) => {
        setBusqueda(valor);
        setPaginaActual(1);

        // Generar sugerencias basadas en la búsqueda
        if (valor.trim().length > 0) {
            const filtrados = productosUnicos.filter(
                p => p.producto?.nombre?.toLowerCase().includes(valor.toLowerCase()) ||
                    p.producto?.sku?.toLowerCase().includes(valor.toLowerCase()) ||
                    p.producto?.codigo_barras?.toLowerCase().includes(valor.toLowerCase())
            );
            setSugerencias(filtrados.slice(0, 5)); // Máximo 5 sugerencias
            setMostrarSugerencias(filtrados.length > 0);
        } else {
            setSugerencias([]);
            setMostrarSugerencias(false);
        }
    };

    const seleccionarSugerencia = (item: BorradorItem) => {
        // Actualizar búsqueda con el nombre del producto seleccionado
        setBusqueda(item.producto?.nombre || '');
        setSugerencias([]);
        setMostrarSugerencias(false);

        // Expandir el producto seleccionado
        setExpandidos(prev => new Set([...prev, item.producto_id]));

        // Llevar a la primera página donde está el producto
        setPaginaActual(1);
    };

    const buscarPorCodigoBarras = async (codigo: string) => {
        if (!borrador) {
            NotificationService.error('No hay borrador disponible');
            return;
        }

        // Validar código
        const codigoLimpio = codigo.trim();
        if (!codigoLimpio || codigoLimpio.length === 0) {
            NotificationService.error('Código de barras vacío');
            return;
        }

        try {
            console.log(`🔍 Buscando producto: "${codigoLimpio}"`);

            // ═══════════════════════════════════════════════════════════════
            // PASO 1️⃣: BUSCAR EN BORRADOR LOCAL (SESIÓN ACTUAL)
            // ═══════════════════════════════════════════════════════════════
            console.log('1️⃣ Buscando en borrador local (esta sesión)...');

            const productoEnBorradorLocal = borrador.items.find(
                item =>
                    // Case insensitive para código de barras, SKU, nombre
                    item.producto?.codigo_barras?.toLowerCase() === codigoLimpio.toLowerCase() ||
                    item.producto?.sku?.toLowerCase() === codigoLimpio.toLowerCase() ||
                    item.producto?.nombre?.toLowerCase().includes(codigoLimpio.toLowerCase()) ||
                    String(item.producto_id) === codigoLimpio ||
                    item.producto?.marca?.nombre?.toLowerCase().includes(codigoLimpio.toLowerCase()) ||
                    item.producto?.categoria?.nombre?.toLowerCase().includes(codigoLimpio.toLowerCase())
            );

            if (productoEnBorradorLocal?.producto) {
                console.log(`✅ Encontrado en borrador local: ${productoEnBorradorLocal.producto.nombre}`);
                setExpandidos(prev => new Set([...prev, productoEnBorradorLocal.producto_id]));
                NotificationService.success(
                    `✓ Producto encontrado: ${productoEnBorradorLocal.producto.nombre}`
                );
                return;
            }

            // ═══════════════════════════════════════════════════════════════
            // PASO 2️⃣: BUSCAR EN TABLA PRODUCTOS (API)
            // ═══════════════════════════════════════════════════════════════
            console.log('2️⃣ Buscando en tabla de productos (API)...');

            const responseProductos = await fetch(
                getRoute('productos.paginados') + `?barcode=${encodeURIComponent(codigoLimpio)}`,
                {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                }
            );

            if (!responseProductos.ok) {
                throw new Error('Error al buscar en tabla de productos');
            }

            const dataProductos = await responseProductos.json();
            const productos = dataProductos.data || [];

            if (!productos || productos.length === 0) {
                console.warn(`❌ Producto NO EXISTE en tabla productos: ${codigoLimpio}`);
                NotificationService.error(
                    `❌ Producto no encontrado\nCódigo: ${codigoLimpio}\n\nVerifica que el código sea correcto`
                );
                return;
            }

            const producto = productos[0];
            console.log(`✅ Encontrado en productos: ${producto.nombre}`);

            // ═══════════════════════════════════════════════════════════════
            // PASO 3️⃣: VERIFICAR SI YA EXISTE EN BORRADOR (SERVIDOR)
            // ═══════════════════════════════════════════════════════════════
            console.log('3️⃣ Verificando si ya existe en borrador del servidor...');

            const responseSearch = await fetch(
                getRoute('inicial.draft.productos.search', { borrador: borrador.id }),
                {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        search: codigoLimpio,
                    }),
                }
            );

            if (!responseSearch.ok) {
                throw new Error('Error al verificar producto en borrador');
            }

            const dataSearch = await responseSearch.json();

            // ═══════════════════════════════════════════════════════════════
            // PRODUCTO YA EXISTE EN BORRADOR
            // ═══════════════════════════════════════════════════════════════
            if (dataSearch.found) {
                console.log(`⚠️ Producto ya registrado en borrador anterior`);

                const itemExistente = dataSearch.item;
                const productoExistente = dataSearch.producto;

                // Expandir y mostrar info detallada
                setExpandidos(prev => new Set([...prev, productoExistente.id]));

                NotificationService.warning(
                    `⚠️ Producto ya registrado\n\n` +
                    `📦 ${productoExistente.nombre}\n` +
                    `📊 Cantidad: ${itemExistente.cantidad || 'Sin registrar'} unidades\n` +
                    `🏢 Almacén: ${itemExistente.almacen || 'N/A'}`
                );
                return;
            }

            // ═══════════════════════════════════════════════════════════════
            // PRODUCTO ES NUEVO - AGREGAR AL BORRADOR
            // ═══════════════════════════════════════════════════════════════
            console.log(`✅ Producto es nuevo, agregando al borrador...`);

            await agregarProductos([producto.id]);
            setExpandidos(prev => new Set([...prev, producto.id]));

            NotificationService.success(
                `✓ Producto agregado\n\n` +
                `📦 ${producto.nombre}\n` +
                `📌 Ahora registra la cantidad`
            );

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
            console.error('❌ Error en búsqueda de código de barras:', error);

            NotificationService.error(
                `Error al buscar código de barras:\n${errorMsg}`
            );
        }
    };

    const finalizarInventario = async () => {
        if (!borrador) return;

        const confirmado = await NotificationService.confirm(
            'Esta acción guardará el inventario inicial en el sistema.',
            {
                title: 'Confirmar finalización de inventario inicial',
                confirmText: 'Sí, finalizar',
                cancelText: 'Cancelar',
            }
        );

        if (!confirmado) return;

        try {
            setGuardando(true);
            const response = await fetch(
                getRoute('inicial.draft.complete', { borrador: borrador.id }),
                {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken(),
                    },
                    body: JSON.stringify({ validar_cantidades: false }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al completar inventario');
            }

            const data = await response.json();
            NotificationService.success(
                `Inventario completado: ${data.resultados.exitosos} items guardados`
            );

            // Recargar borrador para mostrar estado actualizado
            cargarBorrador(borrador.id);
        } catch (error) {
            NotificationService.error(
                error instanceof Error ? error.message : 'Error al completar inventario'
            );
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    if (!borrador) {
        return (
            <AppLayout>
                <Head title="Inventario Inicial - Cargando" />
                <div className="flex items-center justify-center h-96">
                    <p>Cargando...</p>
                </div>
            </AppLayout>
        );
    }

    const productosUnicos = [...new Map(
        borrador.items.map(item => [item.producto_id, item])
    ).values()];

    const productosFiltrados = busqueda
        ? productosUnicos.filter(
            p => p.producto?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.producto?.sku?.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.producto?.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase())
        )
        : productosUnicos;

    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    const inicio = (paginaActual - 1) * productosPorPagina;
    const productosPaginados = productosFiltrados.slice(inicio, inicio + productosPorPagina);

    return (
        <AppLayout>
            <Head title="Inventario Inicial Avanzado" />

            <div className="py-4 sm:py-2 px-3 sm:px-4 space-y-4 sm:space-y-6">
                {/* Encabezado responsivo */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-gray-900 dark:text-gray-100">Inventario Inicial Avanzado</h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hidden sm:block">
                        Sistema de carga inicial de inventario con guardado automático como borrador
                    </p>
                </div>
                {/* Estado del borrador */}
                <EstadoBorrador borrador={borrador} />
                {/* Barra de herramientas responsiva */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {/* Búsqueda */}
                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <Input
                                        placeholder="Buscar producto..."
                                        value={busqueda}
                                        onChange={(e) => handleBusquedaChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                                        className="flex-1 text-sm sm:text-base h-9 sm:h-10"
                                        autoComplete="off"
                                    />
                                    {/* Dropdown de sugerencias - responsivo */}
                                    {mostrarSugerencias && sugerencias.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                                            <div className="max-h-64 overflow-y-auto">
                                                {sugerencias.map((item) => (
                                                    <button
                                                        key={item.producto_id}
                                                        onClick={() => seleccionarSugerencia(item)}
                                                        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                                                                    {item.producto?.nombre}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                    SKU: {item.producto?.sku}
                                                                    {item.producto?.codigo_barras && (
                                                                        <> • {item.producto.codigo_barras}</>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botones responsivos - Grid en móvil, flex en desktop */}
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setModoCargarTodos(true);
                                        cargarProductosPaginados(1, busqueda);
                                    }}
                                    disabled={guardando || cargandoProductos}
                                    className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 col-span-1"
                                >
                                    <Barcode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">{cargandoProductos ? 'Cargando...' : 'Cargar Todo'}</span>
                                    <span className="sm:hidden">{cargandoProductos ? 'Cargando...' : 'Cargar'}</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => cargarBorrador(borrador.id)}
                                    disabled={guardando}
                                    title="Refrescar borrador"
                                    className="h-9 sm:h-10 text-xs sm:text-sm col-span-1"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Refrescar</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMostrarScannerCamara(true)}
                                    disabled={guardando}
                                    title="Abrir scanner de cámara"
                                    className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 col-span-1"
                                >
                                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Scanner</span>
                                </Button>

                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={guardarTodosBorrador}
                                    disabled={guardando || productosUnicos.length === 0}
                                    className="gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white text-xs sm:text-sm h-9 sm:h-10 col-span-2 sm:col-span-1"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Guardar</span>
                                    <span className="sm:hidden">Guardar en Borrador</span>
                                </Button>
                            </div>

                            {/* Estado del guardado - responsivo */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                                <span>
                                    {productosUnicos.length} producto(s)
                                </span>
                                <span className="flex items-center gap-1">
                                    {guardando ? (
                                        <>
                                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                                            <span className="hidden sm:inline">Sincronizado</span>
                                            <span className="sm:hidden">OK</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
                {/* Productos */}
                <Card>
                    <CardHeader className="px-3 sm:px-6">
                        <CardTitle className="text-lg sm:text-xl">Productos a Registrar</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Expande para registrar cantidades por almacén
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 sm:px-6">
                        {productosPaginados.length === 0 ? (
                            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                No hay productos. Usa el botón "Cargar Productos" para comenzar.
                            </div>
                        ) : (
                            <>
                                {productosPaginados.map((item) => (
                                    <ProductoRowExpandible
                                        key={item.producto_id}
                                        item={item}
                                        almacenes={almacenes}
                                        expanded={expandidos.has(item.producto_id)}
                                        onToggleExpand={(productoId) => {
                                            setExpandidos(prev => {
                                                const next = new Set(prev);
                                                if (next.has(productoId)) {
                                                    next.delete(productoId);
                                                } else {
                                                    next.add(productoId);
                                                }
                                                return next;
                                            });
                                        }}
                                        onGuardarItem={guardarItem}
                                        allItems={borrador.items}
                                    />
                                ))}

                                {/* Paginación responsiva */}
                                {(totalPaginas > 1 || modoCargarTodos) && (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            {modoCargarTodos ? (
                                                <>Página {paginaProductosBackend} de {totalPaginasBackend} ({totalProductosBackend} total)</>
                                            ) : (
                                                <>Página {paginaActual} de {totalPaginas}</>
                                            )}
                                        </span>
                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            {modoCargarTodos && totalPaginasBackend > 1 && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => cargarProductosPaginados(paginaProductosBackend - 1, busqueda)}
                                                        disabled={paginaProductosBackend === 1 || cargandoProductos}
                                                        className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                                                    >
                                                        ← Anterior
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => cargarProductosPaginados(paginaProductosBackend + 1, busqueda)}
                                                        disabled={paginaProductosBackend === totalPaginasBackend || cargandoProductos}
                                                        className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                                                    >
                                                        Siguiente →
                                                    </Button>
                                                </>
                                            )}
                                            {totalPaginas > 1 && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                                        disabled={paginaActual === 1}
                                                        className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                                                    >
                                                        ← Anterior
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                                        disabled={paginaActual === totalPaginas}
                                                        className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                                                    >
                                                        Siguiente →
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Botones de acción responsivos */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => router.visit(getRoute('inicial.index'))}
                        className="w-full sm:w-auto text-sm h-10 sm:h-9"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={finalizarInventario}
                        disabled={guardando || productosUnicos.length === 0}
                        className="w-full sm:w-auto text-sm h-10 sm:h-9"
                    >
                        Finalizar y Guardar
                    </Button>
                </div>
            </div>

            {/* Modal para cargar productos - Modal simple */}
            {showCargarModal && (
                <CargarProductosModal
                    onClose={() => setShowCargarModal(false)}
                    onAgregar={agregarProductos}
                    productosYaAgregados={productosUnicos.map(p => p.producto_id)}
                />
            )}

            {/* Modal Scanner de Cámara */}
            {mostrarScannerCamara && (
                <ScannerCamaraModal
                    onClose={() => setMostrarScannerCamara(false)}
                    onDetected={buscarPorCodigoBarras}
                />
            )}

            {/* Scanner de código de barras - Activable con botón flotante */}
            <ScannerCodigoBarras
                onBarcodeDetected={buscarPorCodigoBarras}
                enabled={true}
            />
        </AppLayout>
    );
}
