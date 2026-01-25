/**
 * Component: MovimientosDelDiaTable
 *
 * Responsabilidades:
 * ✅ Renderizar tabla de movimientos de caja del día
 * ✅ Mostrar columnas: Hora, Tipo, Descripción, Documento, Monto
 * ✅ Indicadores visuales de ingresos/egresos
 * ✅ Agrupar movimientos por tipo
 * ✅ Resumen de totales por tipo
 */

import { useState } from 'react';
import type { AperturaCaja, MovimientoCaja } from '@/domain/entities/cajas';
import { formatCurrency, formatDateTime, getMovimientoIcon, getMovimientoColor, toNumber } from '@/lib/cajas.utils';
import { ComprobantesMovimiento } from '@/presentation/components/ComprobantesMovimiento';

interface Props {
    cajaAbiertaHoy: AperturaCaja | null;
    movimientosHoy: MovimientoCaja[];
}

export function MovimientosDelDiaTable({ cajaAbiertaHoy, movimientosHoy }: Props) {
    console.log('MovimientosDelDiaTable renderizado con movimientosHoy:', movimientosHoy);
    console.log('cajaAbiertaHoy:', cajaAbiertaHoy);
    const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
    const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
    const [filtroSigno, setFiltroSigno] = useState<'todos' | 'ingresos' | 'egresos'>('todos');
    const [busquedaDescripcion, setBusquedaDescripcion] = useState<string>('');
    const [montoMin, setMontoMin] = useState<string>('');
    const [montoMax, setMontoMax] = useState<string>('');
    const [filtroUsuario, setFiltroUsuario] = useState<string>('');
    const [filtroDocumento, setFiltroDocumento] = useState<string>('');
    const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'monto' | 'tipo'>('fecha');
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);

    if (!cajaAbiertaHoy || movimientosHoy.length === 0) {
        return null;
    }

    // ✅ NUEVO: Determinar si la caja es de hoy o de otro día
    const fechaApertura = new Date(cajaAbiertaHoy.fecha);
    const hoy = new Date();
    const esHoy = fechaApertura.toDateString() === hoy.toDateString();
    const etiquetaPeriodo = esHoy ? 'del Día' : `desde ${fechaApertura.toLocaleDateString('es-BO', { month: 'short', day: 'numeric' })}`;

    // ✅ NUEVO: Agrupar movimientos por tipo
    const movimientosAgrupados = movimientosHoy.reduce((acc: Record<string, MovimientoCaja[]>, mov) => {
        const tipo = mov.tipo_operacion.nombre;
        if (!acc[tipo]) {
            acc[tipo] = [];
        }
        acc[tipo].push(mov);
        return acc;
    }, {});

    // ✅ NUEVO: Obtener tipos únicos y calcular totales
    const tipos = Object.keys(movimientosAgrupados);
    const totalesPorTipo = Object.entries(movimientosAgrupados).map(([tipo, movs]) => ({
        tipo,
        total: movs.reduce((sum, m) => sum + m.monto, 0),
        count: movs.length,
    }));

    // ✅ Obtener usuarios únicos
    const usuariosUnicos = Array.from(new Set(movimientosHoy.map(mov => mov.usuario?.name || 'Sin Usuario')))
        .filter(u => u !== 'Sin Usuario')
        .sort();

    // ✅ NUEVO: Filtrar movimientos por múltiples criterios
    let movimientosAMostrar = movimientosHoy.filter((mov) => {
        // 1️⃣ Filtro por tipo
        if (filtroTipo && mov.tipo_operacion.nombre !== filtroTipo) {
            return false;
        }

        // 2️⃣ Filtro por rango de fechas
        if (filtroFechaDesde || filtroFechaHasta) {
            const fechaMov = new Date(mov.fecha).toISOString().split('T')[0];
            const desde = filtroFechaDesde ? filtroFechaDesde : '1900-01-01';
            const hasta = filtroFechaHasta ? filtroFechaHasta : '2100-12-31';
            if (!(fechaMov >= desde && fechaMov <= hasta)) {
                return false;
            }
        }

        // 3️⃣ Filtro por signo (ingreso/egreso)
        const monto = toNumber(mov.monto);
        if (filtroSigno === 'ingresos' && monto < 0) {
            return false;
        }
        if (filtroSigno === 'egresos' && monto > 0) {
            return false;
        }

        // 4️⃣ Filtro por descripción (búsqueda)
        if (busquedaDescripcion) {
            const busqueda = busquedaDescripcion.toLowerCase();
            const coincide =
                mov.observaciones?.toLowerCase().includes(busqueda) ||
                mov.numero_documento?.toLowerCase().includes(busqueda) ||
                mov.tipo_operacion.nombre.toLowerCase().includes(busqueda);
            if (!coincide) {
                return false;
            }
        }

        // 5️⃣ Filtro por rango de monto
        if (montoMin || montoMax) {
            const montoAbsoluto = Math.abs(monto);
            const min = montoMin ? parseFloat(montoMin) : 0;
            const max = montoMax ? parseFloat(montoMax) : Infinity;
            if (!(montoAbsoluto >= min && montoAbsoluto <= max)) {
                return false;
            }
        }

        // 6️⃣ Filtro por usuario
        if (filtroUsuario) {
            const nombreUsuario = mov.usuario?.name || 'Sin Usuario';
            if (nombreUsuario !== filtroUsuario) {
                return false;
            }
        }

        // 7️⃣ Filtro por documento
        if (filtroDocumento) {
            const busqueda = filtroDocumento.toLowerCase();
            if (!mov.numero_documento?.toLowerCase().includes(busqueda)) {
                return false;
            }
        }

        return true;
    });

    // ✅ Aplicar ordenamiento
    movimientosAMostrar = [...movimientosAMostrar].sort((a, b) => {
        switch (ordenarPor) {
            case 'fecha':
                return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
            case 'monto':
                return Math.abs(toNumber(b.monto)) - Math.abs(toNumber(a.monto));
            case 'tipo':
                return a.tipo_operacion.nombre.localeCompare(b.tipo_operacion.nombre);
            default:
                return 0;
        }
    });

    // ✅ Función para exportar movimientos a CSV
    const exportarACSV = () => {
        const headers = ['Fecha/Hora', 'Tipo', 'Descripción', 'Documento', 'Monto', 'Usuario'];
        const rows = movimientosAMostrar.map(mov => [
            new Date(mov.fecha).toLocaleString('es-BO'),
            mov.tipo_operacion.nombre,
            mov.observaciones || '',
            mov.numero_documento || '',
            mov.monto,
            mov.usuario?.name || 'Sin Usuario',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `movimientos-caja-${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Movimientos {etiquetaPeriodo} ({movimientosAMostrar.length})
                    </h3>
                </div>
                {/* ✅ NUEVO: Resumen final */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Mostrado (respeta filtro) */}
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Total Mostrado
                                {filtroTipo && ` (${filtroTipo})`}
                            </p>
                            {(() => {
                                const totalMostrado = movimientosAMostrar.reduce((sum, m) => sum + toNumber(m.monto), 0);
                                return (
                                    <>
                                        <p className={`text-lg font-bold ${getMovimientoColor(totalMostrado)}`}>
                                            {formatCurrency(totalMostrado)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {movimientosAMostrar.length} movimiento{movimientosAMostrar.length !== 1 ? 's' : ''}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Total del Día (siempre todos sin filtro) */}
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Total del Día
                            </p>
                            {(() => {
                                const totalDia = movimientosHoy.reduce((sum, m) => sum + toNumber(m.monto), 0);
                                return (
                                    <>
                                        <p className={`text-lg font-bold ${getMovimientoColor(totalDia)}`}>
                                            {formatCurrency(totalDia)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {movimientosHoy.length} movimiento{movimientosHoy.length !== 1 ? 's' : ''}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Saldo Esperado */}
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Saldo Esperado
                            </p>
                            {(() => {
                                const apertura = toNumber(cajaAbiertaHoy.monto_apertura);
                                const totalDia = movimientosHoy.reduce((sum, m) => sum + toNumber(m.monto), 0);
                                const saldoEsperado = apertura + totalDia;
                                return (
                                    <>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(saldoEsperado)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Apertura: {formatCurrency(apertura)}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* ✅ NUEVO: Filtros por tipo */}
                <div className="mb-6 flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => setFiltroTipo(null)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${!filtroTipo
                            ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        Todos ({movimientosHoy.length})
                    </button>
                    {tipos.map((tipo) => {
                        // const total = totalesPorTipo.find(t => t.tipo === tipo)?.total || 0;
                        return (
                            <button
                                key={tipo}
                                onClick={() => setFiltroTipo(tipo)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${filtroTipo === tipo
                                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {tipo} ({movimientosAgrupados[tipo].length})
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                        className="ml-auto px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                        {filtrosVisibles ? '🔼 Ocultar Filtros' : '🔽 Mostrar Filtros'}
                    </button>
                </div>

                {/* ✅ NUEVO: Filtros Avanzados */}
                {filtrosVisibles && (
                <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-4">
                    {/* Filtro por Signo */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Tipo de Movimiento
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFiltroSigno('todos')}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${filtroSigno === 'todos'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFiltroSigno('ingresos')}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${filtroSigno === 'ingresos'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                ⬆️ Ingresos
                            </button>
                            <button
                                onClick={() => setFiltroSigno('egresos')}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${filtroSigno === 'egresos'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                ⬇️ Egresos
                            </button>
                        </div>
                    </div>

                    {/* Filtro por Rango de Fechas */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Rango de Fechas
                        </p>
                        <div className="flex gap-2 flex-wrap items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Desde:</label>
                                <input
                                    type="datetime-local"
                                    value={filtroFechaDesde}
                                    onChange={(e) => setFiltroFechaDesde(e.target.value ? e.target.value.split('T')[0] : '')}
                                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Hasta:</label>
                                <input
                                    type="datetime-local"
                                    value={filtroFechaHasta}
                                    onChange={(e) => setFiltroFechaHasta(e.target.value ? e.target.value.split('T')[0] : '')}
                                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                                />
                            </div>
                            {(filtroFechaDesde || filtroFechaHasta) && (
                                <button
                                    onClick={() => {
                                        setFiltroFechaDesde('');
                                        setFiltroFechaHasta('');
                                    }}
                                    className="px-2 py-1 rounded text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Búsqueda por Descripción */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Buscar por Descripción
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Buscar en observaciones, documento, tipo..."
                                value={busquedaDescripcion}
                                onChange={(e) => setBusquedaDescripcion(e.target.value)}
                                className="flex-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                            />
                            {busquedaDescripcion && (
                                <button
                                    onClick={() => setBusquedaDescripcion('')}
                                    className="px-2 py-1 rounded text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtro por Rango de Monto */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Rango de Monto
                        </p>
                        <div className="flex gap-2 flex-wrap items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Min:</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={montoMin}
                                    onChange={(e) => setMontoMin(e.target.value)}
                                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm w-24"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Max:</label>
                                <input
                                    type="number"
                                    placeholder="∞"
                                    value={montoMax}
                                    onChange={(e) => setMontoMax(e.target.value)}
                                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm w-24"
                                />
                            </div>
                            {(montoMin || montoMax) && (
                                <button
                                    onClick={() => {
                                        setMontoMin('');
                                        setMontoMax('');
                                    }}
                                    className="px-2 py-1 rounded text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtro por Usuario */}
                    {usuariosUnicos.length > 0 && (
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Filtrar por Usuario
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFiltroUsuario('')}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${!filtroUsuario
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Todos
                            </button>
                            {usuariosUnicos.map(usuario => (
                                <button
                                    key={usuario}
                                    onClick={() => setFiltroUsuario(usuario)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition ${filtroUsuario === usuario
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {usuario}
                                </button>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Filtro por Documento */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Buscar por Documento
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Número de comprobante..."
                                value={filtroDocumento}
                                onChange={(e) => setFiltroDocumento(e.target.value)}
                                className="flex-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                            />
                            {filtroDocumento && (
                                <button
                                    onClick={() => setFiltroDocumento('')}
                                    className="px-2 py-1 rounded text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ordenamiento */}
                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Ordenar por
                        </p>
                        <div className="flex gap-2">
                            <select
                                value={ordenarPor}
                                onChange={(e) => setOrdenarPor(e.target.value as 'fecha' | 'monto' | 'tipo')}
                                className="flex-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                            >
                                <option value="fecha">📅 Por Fecha (más reciente)</option>
                                <option value="monto">💰 Por Monto (mayor primero)</option>
                                <option value="tipo">📋 Por Tipo de Operación</option>
                            </select>
                        </div>
                    </div>

                    {/* Botón Exportar */}
                    <div>
                        <button
                            onClick={exportarACSV}
                            className="w-full px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium transition"
                        >
                            📥 Exportar a CSV
                        </button>
                    </div>

                    {/* Resumen de Filtros Activos */}
                    {(filtroFechaDesde || filtroFechaHasta || filtroSigno !== 'todos' || busquedaDescripcion || montoMin || montoMax || filtroUsuario || filtroDocumento) && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-300 dark:border-gray-600">
                            ✅ Mostrando <strong>{movimientosAMostrar.length}</strong> de <strong>{movimientosHoy.length}</strong> movimientos
                        </div>
                    )}
                </div>
                )}

                {/* ✅ NUEVO: Resumen por tipo */}
                {totalesPorTipo.length > 1 && !filtroTipo && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {totalesPorTipo.map(({ tipo, total, count }) => (
                            <div
                                key={tipo}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                onClick={() => setFiltroTipo(tipo)}
                            >
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    {tipo}
                                </p>
                                <p className={`text-lg font-bold ${getMovimientoColor(total)}`}>
                                    {formatCurrency(Math.abs(total))}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {count} movimiento{count !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Informacion
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Descripcion
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Comprobantes
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monto
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {movimientosAMostrar.map((movimiento) => (
                                <tr key={movimiento.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                        {formatDateTime(movimiento.fecha)}
                                        <br />
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                            {movimiento.tipo_operacion.nombre}
                                        </span>
                                        <br />
                                        {movimiento.numero_documento}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                        {movimiento.observaciones}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <ComprobantesMovimiento comprobantes={movimiento.comprobantes} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end">
                                            {getMovimientoIcon(toNumber(movimiento.monto))}
                                            <span className={`ml-2 text-sm font-medium ${getMovimientoColor(toNumber(movimiento.monto))}`}>
                                                {formatCurrency(Math.abs(toNumber(movimiento.monto)))}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
