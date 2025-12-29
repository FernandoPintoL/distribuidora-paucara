import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, FileText, DollarSign } from 'lucide-react';
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

    // Valores por defecto para datosParaFiltros
    const datosSeguros = {
        clientes: datosParaFiltros?.clientes || [],
        estados_documento: datosParaFiltros?.estados_documento || [],
        monedas: datosParaFiltros?.monedas || [],
        usuarios: datosParaFiltros?.usuarios || []
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
        filtros.usuario_id
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

    const aplicarFiltros = () => {
        ventasService.searchVentas(filtros);
    };

    const limpiarFiltros = () => {
        const filtrosVacios: FiltrosVentas = {};
        setFiltros(filtrosVacios);
        setMostrarFiltrosAvanzados(false);
        ventasService.clearFilters();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            aplicarFiltros();
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 mb-6">
            {/* Filtros básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda general */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar en ventas..."
                        value={filtros.search || ''}
                        onChange={(e) => handleFiltroChange('search', e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    />
                </div>

                {/* Número de venta */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Número de venta"
                        value={filtros.numero || ''}
                        onChange={(e) => handleFiltroChange('numero', e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    />
                </div>

                {/* Cliente */}
                <div>
                    <SearchSelect
                        placeholder="Seleccionar cliente..."
                        value={filtros.cliente_id || ''}
                        options={datosSeguros.clientes.map((cliente) => ({
                            value: cliente.id,
                            label: cliente.nombre,
                            description: cliente.nit ? `NIT: ${cliente.nit}` : undefined
                        }))}
                        onChange={(value) => handleFiltroChange('cliente_id', value ? Number(value) : null)}
                        allowClear={true}
                        className="w-full"
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
                        onClick={aplicarFiltros}
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
