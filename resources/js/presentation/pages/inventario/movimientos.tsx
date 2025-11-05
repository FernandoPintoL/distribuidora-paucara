import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useAuth } from '@/application/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    Activity,
    Calendar,
    Filter,
    DownloadIcon
} from 'lucide-react';
import MovimientoCard from '@/presentation/components/Inventario/MovimientoCard';
import FiltrosMovimientos from '@/presentation/components/Inventario/FiltrosMovimientos';
import type {
    MovimientoUnificado,
    FiltrosMovimientos as IFiltrosMovimientos,
    EstadisticasMovimientos
} from '@/types/inventario';
import { CONFIGURACION_MOVIMIENTOS } from '@/types/inventario';

interface TipoAjuste {
    id: number;
    clave: string;
    label: string;
}

interface PageProps extends InertiaPageProps {
    movimientos: MovimientoUnificado[];
    almacenes: Array<{ id: number; nombre: string; }>;
    productos: Array<{ id: number; nombre: string; codigo?: string; }>;
    tipos_ajuste_inventario?: TipoAjuste[];
    estadisticas?: EstadisticasMovimientos;
    filtros?: IFiltrosMovimientos;
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Movimientos',
        href: '/inventario/movimientos',
    },
];

export default function MovimientosInventario() {
    const { props } = usePage<PageProps>();
    const {
        movimientos: movimientosRaw,
        almacenes = [],
        productos = [],
        tipos_ajuste_inventario = [],
        estadisticas,
        filtros: filtrosIniciales = {}
    } = props;

    const { can } = useAuth();

    // Estados para filtros
    const [filtros, setFiltros] = useState<IFiltrosMovimientos>(filtrosIniciales);
    const [vistaCompacta, setVistaCompacta] = useState(false);

    // Memoizar movimientos para evitar problemas con useMemo
    const movimientos = useMemo(() => {
        return Array.isArray(movimientosRaw) ? movimientosRaw : [];
    }, [movimientosRaw]);

    // Aplicar filtros localmente
    const movimientosFiltrados = useMemo(() => {
        return movimientos.filter(movimiento => {
            // Filtro por búsqueda
            if (filtros.busqueda) {
                const busqueda = filtros.busqueda.toLowerCase();
                if (!movimiento.producto.nombre.toLowerCase().includes(busqueda) &&
                    !movimiento.motivo.toLowerCase().includes(busqueda) &&
                    !(movimiento.numero_referencia?.toLowerCase().includes(busqueda)) &&
                    !(movimiento.observaciones?.toLowerCase().includes(busqueda))) {
                    return false;
                }
            }

            // Filtro por tipos
            if (filtros.tipos && filtros.tipos.length > 0) {
                if (!filtros.tipos.includes(movimiento.tipo)) return false;
            }

            // Filtro por tipo
            if (filtros.tipo) {
                if (movimiento.tipo !== filtros.tipo) return false;
            }

            // Filtro por tipo de ajuste específico
            if (filtros.tipo_ajuste_id) {
                if (movimiento.tipo_ajuste_id !== filtros.tipo_ajuste_id) return false;
            }

            // Filtro por estados
            if (filtros.estados && filtros.estados.length > 0) {
                if (!movimiento.estado || !filtros.estados.includes(movimiento.estado)) return false;
            }

            // Filtro por almacenes
            if (filtros.almacenes && filtros.almacenes.length > 0) {
                if (!filtros.almacenes.includes(movimiento.almacen_id)) return false;
            }

            // Filtro por productos
            if (filtros.productos && filtros.productos.length > 0) {
                if (!filtros.productos.includes(movimiento.producto_id)) return false;
            }

            // Filtro por fechas
            if (filtros.fecha_desde) {
                if (movimiento.fecha < filtros.fecha_desde) return false;
            }
            if (filtros.fecha_hasta) {
                if (movimiento.fecha > filtros.fecha_hasta) return false;
            }

            // Filtro por cantidad
            if (filtros.cantidad_min !== undefined) {
                if (Math.abs(movimiento.cantidad) < filtros.cantidad_min) return false;
            }
            if (filtros.cantidad_max !== undefined) {
                if (Math.abs(movimiento.cantidad) > filtros.cantidad_max) return false;
            }

            // Filtro por valor
            if (filtros.valor_min !== undefined) {
                if (!movimiento.valor_total || movimiento.valor_total < filtros.valor_min) return false;
            }
            if (filtros.valor_max !== undefined) {
                if (!movimiento.valor_total || movimiento.valor_total > filtros.valor_max) return false;
            }

            // Filtro por número de referencia
            if (filtros.numero_referencia) {
                if (!movimiento.numero_referencia?.includes(filtros.numero_referencia)) return false;
            }

            // Filtro por lote
            if (filtros.lote) {
                if (!movimiento.lote?.includes(filtros.lote)) return false;
            }

            return true;
        });
    }, [movimientos, filtros]);

    // Calcular estadísticas
    const estadisticasCalculadas = useMemo(() => {
        if (estadisticas) return estadisticas;

        return {
            total_movimientos: movimientosFiltrados.length,
            total_entradas: movimientosFiltrados.filter(m => m.tipo === 'ENTRADA').length,
            total_salidas: movimientosFiltrados.filter(m => m.tipo === 'SALIDA').length,
            total_transferencias: movimientosFiltrados.filter(m => m.tipo === 'TRANSFERENCIA').length,
            total_mermas: movimientosFiltrados.filter(m => m.tipo === 'MERMA').length,
            total_ajustes: movimientosFiltrados.filter(m => m.tipo === 'AJUSTE').length,
            valor_total_entradas: movimientosFiltrados
                .filter(m => m.tipo === 'ENTRADA')
                .reduce((sum, m) => sum + (m.valor_total || 0), 0),
            valor_total_salidas: movimientosFiltrados
                .filter(m => m.tipo === 'SALIDA')
                .reduce((sum, m) => sum + (m.valor_total || 0), 0),
            valor_total_mermas: movimientosFiltrados
                .filter(m => m.tipo === 'MERMA')
                .reduce((sum, m) => sum + (m.valor_total || 0), 0),
            productos_afectados: new Set(movimientosFiltrados.map(m => m.producto_id)).size,
            almacenes_activos: new Set(movimientosFiltrados.map(m => m.almacen_id)).size,
            movimientos_pendientes: movimientosFiltrados.filter(m => m.estado === 'PENDIENTE').length,
            tendencia_semanal: []
        };
    }, [movimientosFiltrados, estadisticas]);

    if (!can('inventario.movimientos')) {
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
            <Head title="Movimientos de Inventario" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            Movimientos de Inventario
                        </h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            Sistema unificado de movimientos de inventario
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={vistaCompacta ? "default" : "outline"}
                            onClick={() => setVistaCompacta(!vistaCompacta)}
                            className="flex items-center gap-2"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            {vistaCompacta ? 'Vista Completa' : 'Vista Compacta'}
                        </Button>

                        <Button variant="outline" className="flex items-center gap-2">
                            <DownloadIcon className="h-4 w-4" />
                            Exportar
                        </Button>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{estadisticasCalculadas.total_movimientos}</div>
                            <p className="text-xs text-muted-foreground">
                                {estadisticasCalculadas.productos_afectados} productos afectados
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {estadisticasCalculadas.total_entradas}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Bs. {estadisticasCalculadas.valor_total_entradas.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Salidas</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {estadisticasCalculadas.total_salidas}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Bs. {estadisticasCalculadas.valor_total_salidas.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                            <Calendar className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {estadisticasCalculadas.movimientos_pendientes}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Requieren atención
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Resumen por tipos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Resumen por Tipo de Movimiento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                            {Object.entries(CONFIGURACION_MOVIMIENTOS).map(([tipo, config]) => {
                                const cantidad = movimientosFiltrados.filter(m => m.tipo === tipo).length;
                                return (
                                    <div key={tipo} className="text-center">
                                        <div className={`p-3 rounded-full mb-2 ${config.bgColor} mx-auto w-fit`}>
                                            <span className={`text-lg ${config.textColor}`}>
                                                {config.icon === 'ArrowDown' && '↗'}
                                                {config.icon === 'ArrowUp' && '↘'}
                                                {config.icon === 'ArrowLeftRight' && '⇄'}
                                                {config.icon === 'Settings' && '⚖'}
                                                {config.icon === 'AlertTriangle' && '⚠'}
                                                {config.icon === 'Factory' && '🏭'}
                                                {config.icon === 'Undo' && '↶'}
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold">{cantidad}</div>
                                        <div className="text-xs text-muted-foreground">{config.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Filtros */}
                <FiltrosMovimientos
                    filtros={filtros}
                    onFiltrosChange={setFiltros}
                    almacenes={almacenes}
                    productos={productos}
                    tiposAjuste={tipos_ajuste_inventario}
                    showAdvanced={false}
                />

                {/* Lista de movimientos */}
                <div className="space-y-4">
                    {movimientosFiltrados.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Sin movimientos
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    No se encontraron movimientos con los filtros aplicados.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Movimientos ({movimientosFiltrados.length})
                                </h3>
                                <div className="flex items-center gap-2">
                                    {Object.entries(CONFIGURACION_MOVIMIENTOS).map(([tipo, config]) => {
                                        const cantidad = movimientosFiltrados.filter(m => m.tipo === tipo).length;
                                        if (cantidad === 0) return null;
                                        return (
                                            <Badge key={tipo} variant="outline" className={`${config.bgColor} ${config.textColor}`}>
                                                {config.label}: {cantidad}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={vistaCompacta ? "space-y-2" : "space-y-4"}>
                                {movimientosFiltrados.map((movimiento) => (
                                    <MovimientoCard
                                        key={movimiento.id}
                                        movimiento={movimiento}
                                        compact={vistaCompacta}
                                        showActions={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
