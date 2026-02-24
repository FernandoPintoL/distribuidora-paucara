import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, DollarSign, Hash, ArrowUpDown } from 'lucide-react';
import type { FiltrosVentas, DatosParaFiltrosVentas } from '@/domain/entities/ventas';
import ventasService from '@/infrastructure/services/ventas.service';
import SearchSelect from '@/presentation/components/ui/search-select';

interface FiltrosVentasProps {
    filtros: FiltrosVentas;
    datosParaFiltros?: DatosParaFiltrosVentas;
    onFiltrosChange?: (filtros: FiltrosVentas) => void;
}

export default function FiltrosVentasComponent({
    filtros: filtrosIniciales,
    datosParaFiltros,
    onFiltrosChange
}: FiltrosVentasProps) {
    const [filtros, setFiltros] = useState<FiltrosVentas>(filtrosIniciales);
    const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
    const [busquedaCombinada, setBusquedaCombinada] = useState<string>('');

    // Valores por defecto para datosParaFiltros
    const datosSeguros = {
        clientes: datosParaFiltros?.clientes || [],
        estados_documento: datosParaFiltros?.estados_documento || [],
        monedas: datosParaFiltros?.monedas || [],
        usuarios: datosParaFiltros?.usuarios || [],
        tipos_pago: datosParaFiltros?.tipos_pago || []  // ✅ NUEVO: Tipos de pago
    };

    // Detectar si hay filtros activos
    const hayFiltrosActivos = Object.values(filtros).some(
        value => value !== undefined && value !== null && value !== ''
    );

    // Detectar si hay filtros avanzados activos
    const hayFiltrosAvanzadosActivos = Boolean(
        filtros.fecha_desde ||
        filtros.fecha_hasta ||
        filtros.monto_min ||
        filtros.monto_max ||
        filtros.usuario_id ||
        filtros.tipo_pago_id ||  // ✅ NUEVO: Incluir tipo_pago_id
        filtros.id_desde ||       // ✅ NUEVO: Incluir id_desde
        filtros.id_hasta          // ✅ NUEVO: Incluir id_hasta
    );

    useEffect(() => {
        if (hayFiltrosAvanzadosActivos) {
            setMostrarFiltrosAvanzados(true);
        }
    }, [hayFiltrosAvanzadosActivos]);

    const handleFiltroChange = (campo: keyof FiltrosVentas, valor: string | number | null | undefined) => {
        const nuevosFiltros = { ...filtros, [campo]: valor };
        setFiltros(nuevosFiltros);

        if (onFiltrosChange) {
            onFiltrosChange(nuevosFiltros);
        }
    };

    // Detecta si el input es un número puro o contiene letras (para numero de venta)
    const handleBusquedaCombinada = (valor: string, aplicarAhora: boolean = false) => {
        setBusquedaCombinada(valor);

        let nuevosFiltros = { ...filtros };

        if (!valor) {
            nuevosFiltros.id = null;
            nuevosFiltros.numero = null;
        } else if (/^\d+$/.test(valor)) {
            // Si es un número puro, buscar por ID
            nuevosFiltros.id = Number(valor);
            nuevosFiltros.numero = null;
        } else {
            // Si contiene letras o caracteres especiales, buscar por número de venta
            nuevosFiltros.numero = valor;
            nuevosFiltros.id = null;
        }

        setFiltros(nuevosFiltros);

        if (onFiltrosChange) {
            onFiltrosChange(nuevosFiltros);
        }

        // Si se llama con aplicarAhora=true, envía al backend inmediatamente
        if (aplicarAhora) {
            aplicarFiltros(nuevosFiltros);
        }
    };

    const aplicarFiltros = (filtrosAplicar?: FiltrosVentas) => {
        ventasService.searchVentas(filtrosAplicar || filtros);
    };

    const limpiarFiltros = () => {
        const filtrosVacios: FiltrosVentas = {};
        setFiltros(filtrosVacios);
        setBusquedaCombinada('');
        setMostrarFiltrosAvanzados(false);
        ventasService.clearFilters();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            aplicarFiltros();
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 mb-6">
            {/* Filtros básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                {/* ID de venta o Número de venta (búsqueda combinada) */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="ID o Número"
                        title="Buscar por ID (58, 100) o Número (VEN20260128-0010)"
                        value={busquedaCombinada}
                        onChange={(e) => handleBusquedaCombinada(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleBusquedaCombinada(busquedaCombinada, true);
                            }
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    />
                </div>

                {/* Rango de IDs - Desde */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="number"
                        placeholder="ID desde"
                        title="ID mínimo de la venta"
                        value={filtros.id_desde || ''}
                        onChange={(e) => handleFiltroChange('id_desde', e.target.value ? Number(e.target.value) : null)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    />
                </div>

                {/* Rango de IDs - Hasta */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="number"
                        placeholder="ID hasta"
                        title="ID máximo de la venta"
                        value={filtros.id_hasta || ''}
                        onChange={(e) => handleFiltroChange('id_hasta', e.target.value ? Number(e.target.value) : null)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    />
                </div>


                {/* Cliente - Búsqueda por múltiples campos */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cliente (ID, código, nombre, NIT, teléfono)"
                        title="Buscar por ID, código cliente, nombre, NIT o teléfono"
                        value={filtros.cliente_id || ''}
                        onChange={(e) => handleFiltroChange('cliente_id', e.target.value || null)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                aplicarFiltros();
                            }
                        }}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    />
                </div>

                {/* Estado */}
                <div>
                    <select
                        value={filtros.estado_documento_id || ''}
                        onChange={(e) => handleFiltroChange('estado_documento_id', e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    >
                        <option value="">Todos los estados</option>
                        {datosSeguros.estados_documento.map((estado) => (
                            <option key={estado.id} value={estado.id}>
                                {estado.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tipo de Venta */}
                <div>
                    <select
                        value={filtros.tipo_venta || ''}
                        onChange={(e) => handleFiltroChange('tipo_venta', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="presencial">🏪 Presencial</option>
                        <option value="delivery">🚚 Delivery</option>
                    </select>
                </div>
            </div>

            {/* ✅ NUEVO: Controles de Ordenamiento */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        Ordenar por:
                    </span>

                    {/* Campo de ordenamiento */}
                    <select
                        value={filtros.sort_by || 'id'}
                        onChange={(e) => handleFiltroChange('sort_by', e.target.value || 'id')}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    >
                        <option value="id">ID (predeterminado)</option>
                        <option value="created_at">Fecha de creación</option>
                        <option value="updated_at">Fecha de actualización</option>
                        <option value="fecha">Fecha de emisión</option>
                        <option value="numero">Número de venta</option>
                        <option value="total">Total</option>
                        <option value="estado">Estado</option>
                    </select>

                    {/* Orden ascendente/descendente */}
                    <select
                        value={filtros.sort_order || 'desc'}
                        onChange={(e) => handleFiltroChange('sort_order', (e.target.value as 'asc' | 'desc') || 'desc')}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    >
                        <option value="desc">↓ Descendente (más reciente)</option>
                        <option value="asc">↑ Ascendente (más antiguo)</option>
                    </select>
                </div>
            </div>

            {/* Filtros avanzados */}
            {mostrarFiltrosAvanzados && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Rango de fechas */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Fecha desde
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={filtros.fecha_desde || ''}
                                    onChange={(e) => handleFiltroChange('fecha_desde', e.target.value || undefined)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Fecha hasta
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={filtros.fecha_hasta || ''}
                                    onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value || undefined)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Usuario */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Usuario
                            </label>
                            <SearchSelect
                                placeholder="Seleccionar usuario..."
                                value={filtros.usuario_id || ''}
                                options={datosSeguros.usuarios.map((usuario) => ({
                                    value: usuario.id,
                                    label: usuario.name
                                }))}
                                onChange={(value) => handleFiltroChange('usuario_id', value ? Number(value) : null)}
                                allowClear={true}
                                className="w-full"
                            />
                        </div>

                        {/* Tipo de Pago */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tipo de Pago
                            </label>
                            <select
                                value={filtros.tipo_pago_id || ''}
                                onChange={(e) => handleFiltroChange('tipo_pago_id', e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value="">Todos los tipos</option>
                                {datosSeguros.tipos_pago.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Rango de montos */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Monto mínimo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={filtros.monto_min || ''}
                                    onChange={(e) => handleFiltroChange('monto_min', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Monto máximo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={filtros.monto_max || ''}
                                    onChange={(e) => handleFiltroChange('monto_max', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Moneda */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Moneda
                            </label>
                            <select
                                value={filtros.moneda_id || ''}
                                onChange={(e) => handleFiltroChange('moneda_id', e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value="">Todas las monedas</option>
                                {datosSeguros.monedas.map((moneda) => (
                                    <option key={moneda.id} value={moneda.id}>
                                        {moneda.nombre} ({moneda.codigo})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NUEVO: Filtros rápidos por Estado */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Estados rápidos:
                    </span>
                    <button
                        type="button"
                        onClick={() => handleFiltroChange('estado_documento_id', 3)} // ID de APROBADO
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            filtros.estado_documento_id === 3
                                ? 'bg-green-600 text-white'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50'
                        }`}
                    >
                        ✓ Aprobadas
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFiltroChange('estado_documento_id', 5)} // ID de ANULADO
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            filtros.estado_documento_id === 5
                                ? 'bg-red-600 text-white'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50'
                        }`}
                    >
                        ✗ Anuladas
                    </button>
                    {filtros.estado_documento_id && (
                        <button
                            type="button"
                            onClick={() => handleFiltroChange('estado_documento_id', null)}
                            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700"
                        >
                            ↻ Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Filter className="h-4 w-4 mr-1" />
                        {mostrarFiltrosAvanzados ? 'Ocultar filtros' : 'Más filtros'}
                    </button>

                    {hayFiltrosActivos && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Filtros aplicados
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {hayFiltrosActivos && (
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => handleBusquedaCombinada(busquedaCombinada, true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        <Search className="h-4 w-4 mr-1" />
                        Buscar
                    </button>
                </div>
            </div>
        </div>
    );
}
