import React, { useState, useCallback, useMemo } from 'react';
import InputSearch from '@/presentation/components/ui/input-search';
import SearchSelect from '@/presentation/components/ui/search-select';
import { useTipoAjustInventario } from '@/stores/useTipoAjustInventario';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/application/hooks/use-auth';
import { toast } from 'react-hot-toast';
import { Producto } from '@/domain/entities/productos';
import { Almacen } from '@/domain/entities/almacenes';
import { StockProducto } from '@/domain/entities/movimientos-inventario';
import { Id } from '@/domain/entities/shared';

interface AjusteItem {
    stock_producto_id: number;
    nueva_cantidad: number;
    observacion: string;
    tipo_ajuste_id?: number;
}

interface AjusteIndividual {
    stock_producto_id: number;
    inputCantidad: string;
    nueva_cantidad: number;
    observacion: string;
    tipo_ajuste_id?: number;
    tipoOperacion?: 'entrada' | 'salida';
}

interface PageProps extends InertiaPageProps {
    almacenes: Almacen[];
    stock_productos: StockProducto[];
    almacen_seleccionado?: number;
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Ajuste de Inventario',
        href: '/inventario/ajuste',
    },
];

export default function AjusteInventario() {
    const { props } = usePage<PageProps>();
    const { almacenes, stock_productos, almacen_seleccionado } = props;
    const { can } = useAuth();

    const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>(
        almacen_seleccionado ? String(almacen_seleccionado) : ''
    );

    const [ajustes, setAjustes] = useState<Record<string, AjusteIndividual>>({});
    const [productoSeleccionado, setProductoSeleccionado] = useState<StockProducto | null>(null);

    // Estado para el tipo de operación (entrada/salida)
    const [tipoOperacion, setTipoOperacion] = useState<'entrada' | 'salida'>('entrada');

    // Obtener tipos de ajuste del custom hook
    const { tipos, fetchTipos } = useTipoAjustInventario();
    const [mostrarSoloConAjustes] = useState(false);

    // Estado para mostrar todos los tipos o solo filtrados
    const [mostrarTodosTipos, setMostrarTodosTipos] = useState(false);

    React.useEffect(() => {
        fetchTipos();
    }, [fetchTipos]);

    // Función para obtener tipos a mostrar (filtrados o todos) - Memoizada
    const getTiposAMostrar = useCallback(() => {
        if (!tipos.length) return [];

        if (mostrarTodosTipos) {
            console.log('Mostrando todos los tipos de ajuste');
            return tipos;
        }

        return getTiposFiltrados();
    }, [tipos, mostrarTodosTipos]);

    // Función para manejar cambio de tipo de operación - Memoizada
    const handleTipoOperacionChange = useCallback((nuevaOperacion: 'entrada' | 'salida') => {
        setTipoOperacion(nuevaOperacion);

        // Si hay un producto seleccionado, recalcular el stock total
        if (productoSeleccionado) {
            const id = typeof productoSeleccionado.id === 'string' ? parseInt(productoSeleccionado.id, 10) : productoSeleccionado.id;
            const inputCantidad = ajustes[id]?.inputCantidad || String(productoSeleccionado.cantidad_disponible);
            const cantidad = inputCantidad === '' ? 0 : parseInt(inputCantidad, 10);

            let stockTotal = productoSeleccionado.cantidad_disponible;

            if (nuevaOperacion === 'entrada') {
                stockTotal = productoSeleccionado.cantidad_disponible + cantidad;
            } else {
                stockTotal = productoSeleccionado.cantidad_disponible - cantidad;
                if (stockTotal < 0) {
                    stockTotal = 0;
                }
            }

            setAjustes(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    nueva_cantidad: stockTotal,
                    tipoOperacion: nuevaOperacion,
                },
            }));
        }
    }, [productoSeleccionado, ajustes]);

    // Función para filtrar tipos de ajuste según la operación seleccionada - Memoizada
    const getTiposFiltrados = useCallback(() => {
        if (!tipos.length) return [];

        console.log('Tipos de ajuste disponibles:', tipos);
        console.log('Operación seleccionada:', tipoOperacion);

        // Si no hay tipos, devolver array vacío
        if (!tipos || tipos.length === 0) {
            console.log('No hay tipos de ajuste disponibles');
            return [];
        }

        // Filtrar tipos según la operación seleccionada
        const tiposFiltrados = tipos.filter(tipo => {
            if (!tipo) return false;

            const nombre = tipo.label?.toLowerCase() || '';
            const descripcion = tipo.descripcion?.toLowerCase() || '';
            const clave = tipo.clave?.toLowerCase() || '';

            console.log(`Evaluando tipo: ${tipo.label} (clave: ${tipo.clave})`);

            if (tipoOperacion === 'entrada') {
                const esEntrada = nombre.includes('entrada') || nombre.includes('ingreso') || nombre.includes('incremento') ||
                    descripcion.includes('entrada') || descripcion.includes('ingreso') || descripcion.includes('incremento') ||
                    clave.includes('entrada') || clave.includes('ingreso') || clave.includes('incremento');

                console.log(`  Es entrada: ${esEntrada}`);
                return esEntrada;
            } else {
                const esSalida = nombre.includes('salida') || nombre.includes('egreso') || nombre.includes('decremento') ||
                    descripcion.includes('salida') || descripcion.includes('egreso') || descripcion.includes('decremento') ||
                    clave.includes('salida') || clave.includes('egreso') || clave.includes('decremento');

                console.log(`  Es salida: ${esSalida}`);
                return esSalida;
            }
        });

        console.log(`Tipos filtrados para ${tipoOperacion}:`, tiposFiltrados);

        // Si no se encontraron tipos filtrados, mostrar todos los tipos disponibles
        if (tiposFiltrados.length === 0) {
            console.log('No se encontraron tipos filtrados, mostrando todos los tipos disponibles');
            return tipos.map(tipo => ({
                ...tipo,
                label: `${tipo.label} (${tipo.clave})`
            }));
        }

        return tiposFiltrados;
    }, [tipos, tipoOperacion]);

    const { setData, post, processing } = useForm({
        ajustes: [] as AjusteItem[]
    });

    const handleAlmacenChange = useCallback((almacenId: string) => {
        setAlmacenSeleccionado(almacenId);
        setAjustes({});

        if (almacenId) {
            router.get('/inventario/ajuste', { almacen_id: almacenId }, {
                preserveState: true,
                replace: true,
            });
        }
    }, []);

    const handleCantidadChange = useCallback((stockProductoId: number | string, nuevaCantidad: string) => {
        const id = typeof stockProductoId === 'string' ? parseInt(stockProductoId, 10) : stockProductoId;
        // Permitir vacío
        const input = nuevaCantidad.replace(/^0+(?!$)/, ''); // Elimina ceros a la izquierda excepto si es solo "0"
        if (input === '') {
            setAjustes(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    inputCantidad: '',
                }
            }));
            return;
        }
        const cantidad = parseInt(input, 10);
        const stockProducto = stock_productos.find(sp => sp.id === id);
        if (!stockProducto) return;

        // Validación numérica: asegurarse de que la cantidad sea un número positivo
        if (isNaN(cantidad) || cantidad < 0) {
            toast.error('La cantidad debe ser un número positivo');
            return;
        }

        // Obtener el tipo de ajuste seleccionado
        const tipoAjusteId = ajustes[id]?.tipo_ajuste_id || (tipos[0]?.id ?? undefined);
        const tipoAjuste = tipos.find(t => t.id === tipoAjusteId);

        // Calcular el stock total automáticamente basado en la cantidad ingresada y el tipo de ajuste
        let stockTotal = stockProducto.cantidad_disponible;

        // Si hay un tipo de ajuste seleccionado, aplicar la lógica correspondiente
        if (tipoAjuste) {
            // Si el tipo de ajuste es de incremento (entrada)
            if (tipoOperacion === 'entrada') {
                stockTotal = stockProducto.cantidad_disponible + cantidad;
            }
            // Si el tipo de ajuste es de decremento (salida)
            else {
                stockTotal = stockProducto.cantidad_disponible - cantidad;
                // Evitar stock negativo
                if (stockTotal < 0) {
                    stockTotal = 0;
                }
            }
        } else {
            // Si no hay tipo de ajuste, usar la lógica basada en la operación seleccionada
            if (tipoOperacion === 'entrada') {
                stockTotal = stockProducto.cantidad_disponible + cantidad;
            } else {
                stockTotal = stockProducto.cantidad_disponible - cantidad;
                if (stockTotal < 0) {
                    stockTotal = 0;
                }
            }
        }

        // Siempre guardar el cambio, incluso si es igual a la cantidad actual
        // Esto asegura que se registre en la base de datos
        setAjustes(prev => ({
            ...prev,
            [id]: {
                stock_producto_id: id,
                nueva_cantidad: stockTotal, // Usar el stock total calculado
                observacion: prev[id]?.observacion || '',
                tipo_ajuste_id: tipoAjusteId,
                inputCantidad: input,
                tipoOperacion: tipoOperacion,
            }
        }));
    }, [tipos, tipoOperacion, ajustes, stock_productos]);

    const handleTipoAjusteChange = useCallback((stockProductoId: number | string, tipoAjusteId: number) => {
        const id = typeof stockProductoId === 'string' ? parseInt(stockProductoId, 10) : stockProductoId;
        const stockProducto = stock_productos.find(sp => sp.id === id);
        if (!stockProducto) return;

        // Obtener el tipo de ajuste seleccionado
        const tipoAjuste = tipos.find(t => t.id === tipoAjusteId);

        // Obtener la cantidad ingresada actual
        const inputCantidad = ajustes[id]?.inputCantidad || String(stockProducto.cantidad_disponible);
        const cantidad = inputCantidad === '' ? 0 : parseInt(inputCantidad, 10);

        // Calcular el nuevo stock total basado en el tipo de ajuste
        let stockTotal = stockProducto.cantidad_disponible;

        if (tipoAjuste) {
            // Usar la lógica basada en la operación seleccionada en lugar de la propiedad incrementa
            if (tipoOperacion === 'entrada') {
                stockTotal = stockProducto.cantidad_disponible + cantidad;
            } else {
                stockTotal = stockProducto.cantidad_disponible - cantidad;
                // Evitar stock negativo
                if (stockTotal < 0) {
                    stockTotal = 0;
                }
            }
        } else {
            // Si no hay tipo de ajuste, usar la lógica basada en la operación seleccionada
            if (tipoOperacion === 'entrada') {
                stockTotal = stockProducto.cantidad_disponible + cantidad;
            } else {
                stockTotal = stockProducto.cantidad_disponible - cantidad;
                if (stockTotal < 0) {
                    stockTotal = 0;
                }
            }
        }

        setAjustes(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                tipo_ajuste_id: tipoAjusteId,
                nueva_cantidad: stockTotal, // Actualizar el stock total
                tipoOperacion: tipoOperacion,
            },
        }));
    }, [tipos, tipoOperacion, ajustes, stock_productos]);

    const handleObservacionChange = useCallback((stockProductoId: number | string, observacion: string) => {
        const id = typeof stockProductoId === 'string' ? parseInt(stockProductoId, 10) : stockProductoId;
        setAjustes(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                observacion
            }
        }));
    }, []);

    // Inicializar ajuste cuando se selecciona un producto - Memoizada
    const inicializarAjuste = useCallback((stockProducto: StockProducto) => {
        const id = typeof stockProducto.id === 'string' ? parseInt(stockProducto.id, 10) : stockProducto.id;

        // Obtener el primer tipo de ajuste que sea de entrada (por defecto)
        let tipoAjusteIdDefault = undefined;
        if (tipos.length > 0) {
            // Buscar un tipo de ajuste que sea de entrada
            const tipoEntrada = tipos.find(t => {
                const label = t.label?.toLowerCase() || '';
                return label.includes('entrada') || label.includes('ingreso') || label.includes('incremento');
            });
            tipoAjusteIdDefault = tipoEntrada?.id || tipos[0]?.id;
        }

        setAjustes(prev => ({
            ...prev,
            [id]: {
                stock_producto_id: id,
                nueva_cantidad: stockProducto.cantidad_disponible,
                observacion: '',
                tipo_ajuste_id: tipoAjusteIdDefault,
                inputCantidad: '',
                tipoOperacion: tipoOperacion,
            }
        }));
    }, [tipos, tipoOperacion]);

    const guardarAjusteIndividual = (stockProductoId: Id) => {
        const ajuste = ajustes[stockProductoId];
        const stockProducto = stock_productos.find(sp => sp.id === stockProductoId);

        // Validar que exista el ajuste
        if (!ajuste) {
            toast.error('No hay cambios para guardar');
            return;
        }

        // Validar que se haya ingresado una cantidad
        if (!ajuste.inputCantidad || ajuste.inputCantidad.trim() === '') {
            toast.error('Debe ingresar una cantidad');
            return;
        }

        // Validar que la cantidad haya cambiado
        if (stockProducto && ajuste.nueva_cantidad === stockProducto.cantidad_disponible) {
            toast.error('La cantidad no ha cambiado. Ingresa una cantidad diferente');
            return;
        }

        // Validar que se haya seleccionado un tipo de ajuste
        if (!ajuste.tipo_ajuste_id) {
            toast.error('Debe seleccionar un tipo de ajuste');
            return;
        }

        // Validar que se haya ingresado una observación
        if (!ajuste.observacion || ajuste.observacion.trim() === '') {
            toast.error('Debe ingresar una observación');
            return;
        }

        // Crear lista con solo este ajuste, filtrando propiedades innecesarias
        const ajustesList = [{
            stock_producto_id: ajuste.stock_producto_id,
            nueva_cantidad: ajuste.nueva_cantidad,
            observacion: ajuste.observacion,
            tipo_ajuste_id: ajuste.tipo_ajuste_id,
        }];

        console.log('Enviando ajuste individual:', ajustesList);
        setData('ajustes', ajustesList);

        post('/inventario/ajuste', {
            onSuccess: () => {
                toast.success('Ajuste guardado correctamente');
                // Eliminar solo este ajuste del estado
                setAjustes(prev => {
                    const newAjustes = { ...prev };
                    delete newAjustes[stockProductoId];
                    return newAjustes;
                });
                // Recargar solo los datos de stock
                router.reload({ only: ['stock_productos'] });
                // Limpiar el producto seleccionado
                setProductoSeleccionado(null);
            },
            onError: (errors: Record<string, string[]>) => {
                console.error('Errores del servidor:', errors);
                console.error('Datos enviados:', ajustesList);
                // Obtener el primer error disponible
                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    toast.error(errorMessages[0]);
                } else {
                    toast.error('Error al guardar el ajuste');
                }
            }
        });
    };

    const procesarAjustes = () => {
        // Procesar todos los ajustes sin filtrar por cambio de cantidad
        const ajustesRaw = Object.values(ajustes);

        if (ajustesRaw.length === 0) {
            toast.error('No hay ajustes para procesar');
            return;
        }

        // Validar que todos los ajustes tengan tipo de ajuste y observación
        const ajustesInvalidos = ajustesRaw.filter(ajuste =>
            !ajuste.tipo_ajuste_id || !ajuste.observacion || ajuste.observacion.trim() === ''
        );

        if (ajustesInvalidos.length > 0) {
            toast.error('Todos los ajustes deben tener tipo de ajuste y observación');
            return;
        }

        // Crear lista con ajustes filtrados, removiendo propiedades innecesarias
        const ajustesList = ajustesRaw.map(ajuste => ({
            stock_producto_id: ajuste.stock_producto_id,
            nueva_cantidad: ajuste.nueva_cantidad,
            observacion: ajuste.observacion,
            tipo_ajuste_id: ajuste.tipo_ajuste_id,
        }));

        console.log('Enviando ajustes múltiples:', ajustesList);
        setData('ajustes', ajustesList);

        post('/inventario/ajuste', {
            onSuccess: () => {
                toast.success('Ajustes procesados correctamente');
                setAjustes({});
                router.reload({ only: ['stock_productos'] });
            },
            onError: (errors: Record<string, string[]>) => {
                console.error('Errores al procesar ajustes:', errors);
                console.error('Datos enviados:', ajustesList);
                // Obtener el primer error disponible
                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    toast.error(errorMessages[0]);
                } else {
                    toast.error('Error al procesar los ajustes');
                }
            }
        });
    };

    const getDiferencia = (stockProducto: StockProducto): number => {
        const ajuste = ajustes[stockProducto.id];
        if (!ajuste) return 0;
        return ajuste.nueva_cantidad - stockProducto.cantidad;
    };

    const getProductosFiltrados = (): StockProducto[] => {
        if (!mostrarSoloConAjustes) return stock_productos;
        return stock_productos.filter(sp => ajustes[sp.id] !== undefined);
    };

    const limpiarAjustes = () => {
        if (confirm('¿Estás seguro de limpiar todos los ajustes?')) {
            setAjustes({});
        }
    };

    // Renderizado del componente
    const renderContent = () => {
        if (!can('inventario.ajuste.form')) {
            return (
                <AppLayout breadcrumbs={breadcrumbs}>
                    <Head title="Acceso Denegado" />
                    <div className="text-center py-12">
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            No tienes permisos para acceder a esta página
                        </h3>
                    </div>
                </AppLayout>
            );
        }

        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <>
                    <Head title="Ajuste de Inventario" />
                    <div className="flex flex-col gap-6 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    Ajuste de Inventario
                                </h2>
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                    Realizar ajustes manuales de stock por almacén
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href="/inventario"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Volver al Dashboard
                                </Link>
                                <Link
                                    href="/inventario/tipos-ajuste-inventario"
                                    className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Tipos de Ajuste
                                </Link>
                            </div>
                        </div>
                        {/* Selección de almacén y buscador de productos en una fila */}
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <SearchSelect
                                        label="Seleccionar Almacén"
                                        placeholder="Selecciona un almacén..."
                                        value={almacenSeleccionado}
                                        options={almacenes.map(a => ({ value: String(a.id), label: a.nombre }))}
                                        onChange={value => handleAlmacenChange(String(value))}
                                        searchPlaceholder="Buscar almacén..."
                                        emptyText="No se encontraron almacenes"
                                        required
                                    />
                                </div>
                                <div className={almacenSeleccionado ? '' : 'opacity-50 pointer-events-none'}>
                                    <InputSearch
                                        label="Buscar producto"
                                        value={productoSeleccionado?.id ?? null}
                                        onChange={(_id, option) => {
                                            if (option) {
                                                const prod = stock_productos.find(p => p.id === option.value);
                                                if (prod) {
                                                    setProductoSeleccionado(prod);
                                                    // Inicializar el ajuste con valores por defecto
                                                    inicializarAjuste(prod);
                                                }
                                            } else {
                                                setProductoSeleccionado(null);
                                            }
                                        }}
                                        showSearchButton={true}
                                        onSearch={async (query) => {
                                            const q = query.toLowerCase().trim();
                                            if (!q) return [];

                                            return stock_productos
                                                .filter(p => {
                                                    if (!p.producto) return false;

                                                    // Búsqueda por ID exacto
                                                    if (p.id.toString() === q) return true;

                                                    // Búsqueda por nombre
                                                    if (p.producto.nombre.toLowerCase().includes(q)) return true;

                                                    // Búsqueda por SKU
                                                    if (p.producto.sku && p.producto.sku.toLowerCase().includes(q)) return true;

                                                    // Búsqueda por código de barras principal (si existe)
                                                    if (p.producto.codigo_barras && p.producto.codigo_barras.toLowerCase().includes(q)) return true;

                                                    // Búsqueda por lote (si existe)
                                                    if (p.lote && p.lote.toLowerCase().includes(q)) return true;

                                                    // Búsqueda numérica (solo números del código de barras)
                                                    const soloNumerosQuery = q.replace(/[^\d]/g, '');
                                                    if (soloNumerosQuery.length > 0) {
                                                        // Código de barras principal (solo números)
                                                        if (p.producto.codigo_barras) {
                                                            const soloNumerosCodigo = p.producto.codigo_barras.replace(/[^\d]/g, '');
                                                            if (soloNumerosCodigo.includes(soloNumerosQuery)) return true;
                                                        }
                                                    }

                                                    return false;
                                                })
                                                .map(p => {
                                                    const descripciones = [];

                                                    // Agregar SKU (primero, como identificador único)
                                                    if (p.producto?.sku) {
                                                        descripciones.push(`SKU: ${p.producto.sku}`);
                                                    }

                                                    // Agregar código de barras principal
                                                    if (p.producto?.codigo_barras) {
                                                        descripciones.push(`CB: ${p.producto.codigo_barras}`);
                                                    }

                                                    // Agregar código QR si existe
                                                    if (p.producto && 'codigo_qr' in p.producto && p.producto.codigo_qr) {
                                                        descripciones.push(`QR: ${String(p.producto.codigo_qr)}`);
                                                    }

                                                    // Agregar lote si existe
                                                    if (p.lote) {
                                                        descripciones.push(`Lote: ${p.lote}`);
                                                    }

                                                    // Agregar stock disponible
                                                    descripciones.push(`Stock: ${p.cantidad}`);

                                                    return {
                                                        value: p.id,
                                                        label: p.producto?.nombre || 'Producto sin nombre',
                                                        description: descripciones.join(' | ') || 'Sin información adicional'
                                                    };
                                                });
                                        }}
                                        placeholder="Buscar por ID, nombre, SKU, código de barras, QR, lote..."
                                        emptyText="No se encontraron productos"
                                        disabled={!almacenSeleccionado}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Formulario de ajuste para el producto seleccionado */}
                        {productoSeleccionado && (
                            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mt-4">
                                <div className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-lg text-gray-900 dark:text-gray-100">
                                                {productoSeleccionado.producto?.nombre || 'Producto no encontrado'}
                                            </div>
                                            <div className="flex flex-wrap gap-4 mt-2">
                                                {productoSeleccionado.producto?.sku && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">SKU:</span> {productoSeleccionado.producto.sku}
                                                    </div>
                                                )}
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">Código:</span> {productoSeleccionado.producto?.codigo_barras || 'Sin código'}
                                                </div>
                                            </div>
                                            {/* Mostrar código QR si existe */}
                                            {(() => {
                                                const producto = productoSeleccionado.producto;
                                                if (!producto) return null;
                                                // Verificar si tiene codigo_qr de forma segura
                                                if ('codigo_qr' in producto && producto.codigo_qr) {
                                                    return (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            Código QR: {String(producto.codigo_qr)}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            {/* Mostrar códigos de barra adicionales */}
                                            {(() => {
                                                const producto = productoSeleccionado.producto;
                                                if (!producto) return null;
                                                // Verificar si tiene codigos de forma segura
                                                if ('codigos' in producto && Array.isArray(producto.codigos) && producto.codigos.length > 0) {
                                                    const codigosAdicionales = producto.codigos
                                                        .filter((c: unknown) => {
                                                            const codigo = c as { es_principal?: boolean; codigo?: string };
                                                            return codigo.es_principal !== true && codigo.codigo;
                                                        })
                                                        .map((c: unknown) => {
                                                            const codigo = c as { codigo: string };
                                                            return codigo.codigo;
                                                        })
                                                        .join(', ');
                                                    return codigosAdicionales ? (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            CB Adicionales: {codigosAdicionales}
                                                        </div>
                                                    ) : null;
                                                }
                                                return null;
                                            })()}
                                            {productoSeleccionado.lote && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Lote: {productoSeleccionado.lote}
                                                </div>
                                            )}
                                        </div>
                                        {/* Indicador de stock actual */}
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                Stock Actual
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {productoSeleccionado.cantidad}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Indicador de cambio de stock */}
                                    {(() => {
                                        const diferencia = getDiferencia(productoSeleccionado);
                                        if (diferencia !== 0) {
                                            return (
                                                <div className={`mb-6 p-4 rounded-lg border-2 ${diferencia > 0
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                                    }`}>
                                                    <div className="flex items-center">
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${diferencia > 0
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-red-500 text-white'
                                                            }`}>
                                                            {diferencia > 0 ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className={`font-medium text-sm ${diferencia > 0
                                                                ? 'text-green-800 dark:text-green-300'
                                                                : 'text-red-800 dark:text-red-300'
                                                                }`}>
                                                                {tipoOperacion === 'entrada' ? 'Entrada' : 'Salida'} de {Math.abs(diferencia)} unidades
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                Stock actual: {productoSeleccionado.cantidad} → Stock final: {ajustes[productoSeleccionado.id]?.nueva_cantidad || productoSeleccionado.cantidad}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    {/* Stock Actual */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Stock Actual
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                min="0"
                                                value={productoSeleccionado.cantidad}
                                                readOnly
                                                className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-gray-100 dark:bg-gray-800 font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* Cantidad */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Cantidad
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                {tipoOperacion === 'entrada' ? (
                                                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                min="0"
                                                value={ajustes[productoSeleccionado.id]?.inputCantidad !== undefined ? ajustes[productoSeleccionado.id].inputCantidad : productoSeleccionado.cantidad}
                                                onChange={e => handleCantidadChange(productoSeleccionado.id, e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder={ajustes[productoSeleccionado.id]?.inputCantidad === '' ? String(productoSeleccionado.cantidad) : ''}
                                                className={`block w-full pl-10 pr-3 py-2 rounded-md shadow-sm focus:ring-2 text-sm font-medium ${tipoOperacion === 'entrada'
                                                    ? 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500/20 bg-green-50 dark:bg-green-900/20'
                                                    : 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/20'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Stock Total */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Stock Total
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                min="0"
                                                value={ajustes[productoSeleccionado.id]?.nueva_cantidad !== undefined ? ajustes[productoSeleccionado.id].nueva_cantidad : productoSeleccionado.cantidad}
                                                readOnly
                                                className="block w-full pl-10 pr-3 py-2 rounded-md border-blue-300 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-blue-50 dark:bg-blue-900/20 font-bold text-blue-700 dark:text-blue-300"
                                            />
                                            {/* Indicador de cambio */}
                                            {(() => {
                                                const diferencia = getDiferencia(productoSeleccionado);
                                                if (diferencia > 0) {
                                                    return (
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                            </svg>
                                                        </div>
                                                    );
                                                } else if (diferencia < 0) {
                                                    return (
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                            </svg>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>

                                    {/* Indicador de operación */}
                                    <div className="flex items-end">
                                        <div className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${tipoOperacion === 'entrada'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                            }`}>
                                            {tipoOperacion === 'entrada' ? (
                                                <>
                                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    Entrada
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                    </svg>
                                                    Salida
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Nueva fila para TipoAjuste y Observación */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {/* Radio buttons para Entrada/Salida */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Tipo de Operación
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${tipoOperacion === 'entrada'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="tipo-operacion"
                                                    value="entrada"
                                                    checked={tipoOperacion === 'entrada'}
                                                    onChange={(e) => handleTipoOperacionChange(e.target.value as 'entrada' | 'salida')}
                                                    className="sr-only"
                                                />
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tipoOperacion === 'entrada'
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                                                        }`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className={`font-medium text-sm ${tipoOperacion === 'entrada'
                                                            ? 'text-green-800 dark:text-green-300'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            Entrada
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Agregar stock
                                                        </div>
                                                    </div>
                                                </div>
                                                {tipoOperacion === 'entrada' && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </label>

                                            <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${tipoOperacion === 'salida'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="tipo-operacion"
                                                    value="salida"
                                                    checked={tipoOperacion === 'salida'}
                                                    onChange={(e) => handleTipoOperacionChange(e.target.value as 'entrada' | 'salida')}
                                                    className="sr-only"
                                                />
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tipoOperacion === 'salida'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                                                        }`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className={`font-medium text-sm ${tipoOperacion === 'salida'
                                                            ? 'text-red-800 dark:text-red-300'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            Salida
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Reducir stock
                                                        </div>
                                                    </div>
                                                </div>
                                                {tipoOperacion === 'salida' && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Observación
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Describa el motivo del ajuste..."
                                                value={ajustes[productoSeleccionado.id]?.observacion || ''}
                                                onChange={e => handleObservacionChange(productoSeleccionado.id, e.target.value)}
                                                className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Tipo de ajuste filtrado */}
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Tipo de Ajuste Específico
                                            </label>
                                            <div className="ml-2 relative">
                                                <div className="group">
                                                    <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                                        Selecciona el tipo específico de ajuste de inventario
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Toggle para mostrar todos los tipos */}
                                        {tipos.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setMostrarTodosTipos(!mostrarTodosTipos)}
                                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                            >
                                                {mostrarTodosTipos ? 'Mostrar filtrados' : 'Mostrar todos'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <SearchSelect
                                            label=""
                                            placeholder={getTiposAMostrar().length === 0 ? "Cargando tipos de ajuste..." : `Selecciona tipo de ajuste${mostrarTodosTipos ? ' (todos)' : ''}...`}
                                            value={ajustes[productoSeleccionado.id]?.tipo_ajuste_id ?? ''}
                                            options={getTiposAMostrar().map(tipo => ({
                                                value: tipo.id,
                                                label: tipo.label,
                                                description: tipo.descripcion || `Clave: ${tipo.clave}`
                                            }))}
                                            onChange={value => handleTipoAjusteChange(productoSeleccionado.id, Number(value))}
                                            searchPlaceholder="Buscar tipo de ajuste..."
                                            emptyText={tipos.length === 0 ? "Cargando tipos de ajuste..." : `No se encontraron tipos de ajuste${mostrarTodosTipos ? '' : ` para ${tipoOperacion}`}`}
                                            disabled={getTiposAMostrar().length === 0}
                                            loading={tipos.length === 0}
                                            className="pl-10"
                                        />
                                        {/* Indicador de cantidad de tipos */}
                                        {tipos.length > 0 && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-xs text-gray-400">
                                                    {getTiposAMostrar().length} de {tipos.length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Botón de guardar */}
                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => guardarAjusteIndividual(productoSeleccionado.id)}
                                        disabled={processing}
                                        className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-200 ${processing
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : tipoOperacion === 'entrada'
                                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                            } text-white focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                {tipoOperacion === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Aquí irán los siguientes pasos: agregar a lista y resumen */}
                    </div>
                </>
            </AppLayout>
        );
    };

    // Retornar el contenido renderizado
    return renderContent();
}
