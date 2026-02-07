import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Eye, Truck, User, Plus, Route, XCircle, FileText } from 'lucide-react';
import type { Entrega } from '@/domain/entities/entregas';
import type { Pagination } from '@/domain/entities/shared';
import { getEstadoBadgeVariant, getEstadoLabel, formatearFecha } from '@/lib/entregas.utils';
import { useEntregas } from '@/application/hooks/use-entregas';
import { useEstadosEntregas } from '@/application/hooks';
import { useState, useMemo, useCallback } from 'react';
import { ModalOptimizacionRutas } from '@/presentation/components/logistica/modal-optimizacion-rutas';
import { useQueryParam } from '@/application/hooks/use-query-param';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';
import EstadoEntregaBadge from '@/presentation/components/logistica/EstadoEntregaBadge';

// Importar componente de filtros
import { EntregasFilters, type FiltrosEntregas } from './EntregasFilters';
import { CancelarEntregaModal } from './CancelarEntregaModal';

interface Props {
    entregas: Pagination<Entrega>;
    vehiculos?: Array<{ id: number; placa: string; marca: string; modelo: string; capacidad_kg: number }>;
    choferes?: Array<{ id: number; nombre: string }>;
    localidades?: Array<{ id: number; nombre: string; codigo: string }>;
    estadosLogisticos?: Array<{ id: number; codigo: string; nombre: string; color?: string; icono?: string }>;
}

/**
 * Vista simple: tabla de entregas con filtros avanzados y opciones de batch
 *
 * MEJORAS IMPLEMENTADAS:
 * ✅ Filtros separados en componente `EntregasFilters`
 * ✅ Búsqueda con debounce (300ms)
 * ✅ Filtros por chofer, vehículo, fecha
 * ✅ Persistencia de filtros en URL (?estado=...&chofer_id=...&q=...)
 * ✅ Indicador visual de filtros activos
 * ✅ Botón reset rápido
 */
export function EntregasTableView({ entregas, vehiculos = [], choferes = [], localidades = [], estadosLogisticos = [] }: Props) {
    console.log('Renderizando EntregasTableView con entregas:', entregas);
    const { handleVerEntrega, handlePaginaAnterior, handlePaginaSiguiente } = useEntregas();

    // Usar hook de estados centralizados para obtener datos dinámicamente
    const { estados: estadosAPI, isLoading: estadosLoading } = useEstadosEntregas();

    // ✅ URL PERSISTENCE: Leer filtros desde URL y guardar cuando cambien
    const [estadoURL, setEstadoURL] = useQueryParam('estado', 'TODOS');
    const [busquedaURL, setBusquedaURL] = useQueryParam('q', '');
    const [choferURL, setChoferURL] = useQueryParam('chofer_id', '');
    const [vehiculoURL, setVehiculoURL] = useQueryParam('vehiculo_id', '');
    const [localidadURL, setLocalidadURL] = useQueryParam('localidad_id', '');
    const [estadoLogisticaURL, setEstadoLogisticaURL] = useQueryParam('estado_logistica_id', '');
    const [fechaDesdeURL, setFechaDesdeURL] = useQueryParam('fecha_desde', '');
    const [fechaHastaURL, setFechaHastaURL] = useQueryParam('fecha_hasta', '');

    // Estado de filtros
    const [filtros, setFiltros] = useState<FiltrosEntregas>({
        estado: estadoURL,
        busqueda: busquedaURL,
        chofer_id: choferURL,
        vehiculo_id: vehiculoURL,
        localidad_id: localidadURL,
        estado_logistica_id: estadoLogisticaURL,
        fecha_desde: fechaDesdeURL,
        fecha_hasta: fechaHastaURL,
    });

    // Estados para selección y modal
    const [entregasSeleccionadas, setEntregasSeleccionadas] = useState<number[]>([]);
    const [mostrarOptimizacion, setMostrarOptimizacion] = useState(false);
    const [mostrarCancelarModal, setMostrarCancelarModal] = useState(false);
    const [entregaSeleccionadaParaCancelar, setEntregaSeleccionadaParaCancelar] = useState<{
        id: number;
        numero_entrega: string;
        estado: string;
    } | null>(null);
    const [mostrarOutputSelection, setMostrarOutputSelection] = useState(false);
    const [entregaSeleccionadaParaOutput, setEntregaSeleccionadaParaOutput] = useState<number | null>(null);

    // Handler para cambiar filtros y actualizar URL
    const handleFilterChange = useCallback((key: keyof FiltrosEntregas, value: string) => {
        setFiltros(prev => ({ ...prev, [key]: value }));

        // Actualizar URL correspondiente
        switch (key) {
            case 'estado':
                setEstadoURL(value);
                break;
            case 'busqueda':
                setBusquedaURL(value);
                break;
            case 'chofer_id':
                setChoferURL(value);
                break;
            case 'vehiculo_id':
                setVehiculoURL(value);
                break;
            case 'localidad_id':
                setLocalidadURL(value);
                break;
            case 'estado_logistica_id':
                setEstadoLogisticaURL(value);
                break;
            case 'fecha_desde':
                setFechaDesdeURL(value);
                break;
            case 'fecha_hasta':
                setFechaHastaURL(value);
                break;
        }
    }, [setEstadoURL, setBusquedaURL, setChoferURL, setVehiculoURL, setLocalidadURL, setEstadoLogisticaURL, setFechaDesdeURL, setFechaHastaURL]);

    // Handler para resetear todos los filtros
    const handleResetFiltros = useCallback(() => {
        setFiltros({
            estado: 'TODOS',
            busqueda: '',
            chofer_id: '',
            vehiculo_id: '',
            localidad_id: '',
            estado_logistica_id: '',
            fecha_desde: '',
            fecha_hasta: '',
        });
        setEstadoURL('TODOS');
        setBusquedaURL('');
        setChoferURL('');
        setVehiculoURL('');
        setLocalidadURL('');
        setEstadoLogisticaURL('');
        setFechaDesdeURL('');
        setFechaHastaURL('');
    }, [setEstadoURL, setBusquedaURL, setChoferURL, setVehiculoURL, setLocalidadURL, setEstadoLogisticaURL, setFechaDesdeURL, setFechaHastaURL]);

    // Handler para abrir modal de cancelación
    const handleAbrirCancelarModal = useCallback((entrega: Entrega) => {
        // Validar que la entrega puede ser cancelada
        const estadosCancelables = ['PROGRAMADO', 'PENDIENTE', 'EN_TRANSITO', 'PREPARACION_CARGA'];
        if (!estadosCancelables.includes(entrega.estado)) {
            console.warn(`No se puede cancelar entrega en estado: ${entrega.estado}`);
            return;
        }

        setEntregaSeleccionadaParaCancelar({
            id: entrega.id,
            numero_entrega: entrega.numero_entrega,
            estado: entrega.estado,
        });
        setMostrarCancelarModal(true);
    }, []);

    // Handler para abrir modal de output selection
    const handleAbrirOutputSelection = useCallback((entregaId: number) => {
        setEntregaSeleccionadaParaOutput(entregaId);
        setMostrarOutputSelection(true);
    }, []);

    // ✅ FILTRADO MEJORADO: Usar búsqueda manual y filtros múltiples
    const entregasFiltradas = useMemo(() => {
        return entregas.data.filter(entrega => {
            // Filtro por estado
            const cumpleEstado = filtros.estado === 'TODOS' || entrega.estado === filtros.estado;

            // Filtro por búsqueda (manual - solo con Enter o botón) - busca en múltiples campos case insensitive
            const searchLower = filtros.busqueda.toLowerCase();
            const cumpleBusqueda = filtros.busqueda === '' || (
                // Buscar en datos del chofer
                entrega.chofer?.nombre?.toLowerCase().includes(searchLower) ||
                entrega.chofer?.name?.toLowerCase().includes(searchLower) ||
                // Buscar en datos del vehículo
                entrega.vehiculo?.placa?.toLowerCase().includes(searchLower) ||
                // Buscar en ventas asignadas a la entrega (numero de venta)
                entrega.ventas?.some(venta =>
                    venta.numero?.toLowerCase().includes(searchLower) ||
                    venta.cliente?.nombre?.toLowerCase().includes(searchLower)
                )
            );

            // Filtro por chofer
            const cumpleChofer = !filtros.chofer_id ||
                entrega.chofer_id?.toString() === filtros.chofer_id;

            // Filtro por vehículo
            const cumpleVehiculo = !filtros.vehiculo_id ||
                entrega.vehiculo_id?.toString() === filtros.vehiculo_id;

            // Filtro por localidad (zona_id en tabla entregas)
            const cumpleLocalidad = !filtros.localidad_id ||
                entrega.zona_id?.toString() === filtros.localidad_id;

            // Filtro por estado logístico (estado_entrega_id en tabla entregas)
            const cumpleEstadoLogistica = !filtros.estado_logistica_id ||
                entrega.estado_entrega_id?.toString() === filtros.estado_logistica_id;

            // Filtro por fecha desde
            const cumpleFechaDesde = !filtros.fecha_desde ||
                (entrega.fecha_programada && new Date(entrega.fecha_programada) >= new Date(filtros.fecha_desde));

            // Filtro por fecha hasta
            const cumpleFechaHasta = !filtros.fecha_hasta ||
                (entrega.fecha_programada && new Date(entrega.fecha_programada) <= new Date(filtros.fecha_hasta));

            return cumpleEstado && cumpleBusqueda && cumpleChofer && cumpleVehiculo && cumpleLocalidad && cumpleEstadoLogistica && cumpleFechaDesde && cumpleFechaHasta;
        });
    }, [entregas.data, filtros]);

    // Selección múltiple
    const toggleSeleccion = (id: number) => {
        setEntregasSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSeleccionTodos = () => {
        if (entregasSeleccionadas.length === entregasFiltradas.length) {
            setEntregasSeleccionadas([]);
        } else {
            setEntregasSeleccionadas(entregasFiltradas.map(e => Number(e.id)));
        }
    };

    // ✅ Función para calcular el total de una entrega (suma de subtotales de todas las ventas)
    const calcularTotalEntrega = (entrega: Entrega): number => {
        return entrega.ventas?.reduce((total, venta) => {
            const subtotal = typeof venta.subtotal === 'string' ? parseFloat(venta.subtotal) : venta.subtotal || 0;
            return total + subtotal;
        }, 0) ?? 0;
    };

    const entregasProgramadas = entregasFiltradas.filter(e => e.estado === 'PROGRAMADO' || e.estado === 'PENDIENTE');
    const puedeOptimizar = entregasSeleccionadas.length >= 2 &&
        entregasSeleccionadas.every(id => {
            const entrega = entregas.data.find(e => Number(e.id) === id);
            return entrega && (entrega.estado === 'PROGRAMADO' || entrega.estado === 'PENDIENTE');
        });

    return (
        <div className="space-y-6">
            {/* Acciones rápidas */}
            <div className="flex gap-2">
                {entregasSeleccionadas.length > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => setEntregasSeleccionadas([])}
                    >
                        Limpiar selección ({entregasSeleccionadas.length})
                    </Button>
                )}
                {puedeOptimizar && (
                    <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setMostrarOptimizacion(true)}
                    >
                        <Route className="h-4 w-4 mr-2" />
                        Optimizar Rutas ({entregasSeleccionadas.length})
                    </Button>
                )}
                <Link href="/logistica/entregas/create" className="ml-auto">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Entrega
                    </Button>
                </Link>
            </div>

            {/* ✅ COMPONENTE DE FILTROS MEJORADO */}
            <EntregasFilters
                filtros={filtros}
                onFilterChange={handleFilterChange}
                onReset={handleResetFiltros}
                estadosAPI={estadosAPI}
                vehiculos={vehiculos}
                choferes={choferes}
                localidades={localidades}
                estadosLogisticos={estadosLogisticos}
                isLoading={estadosLoading}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Lista de Entregas
                        <Badge variant="outline" className="ml-2">
                            {entregasFiltradas.length} / {entregas.data.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>

                    {entregas.data.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No se encontraron entregas.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Table className="w-full table-fixed">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[25%]">#ID</TableHead>
                                        <TableHead className="w-[25%]">Vehículo / Chofer</TableHead>
                                        <TableHead className="w-[25%]">Total</TableHead>
                                        <TableHead className="w-[25%]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entregasFiltradas.map((entrega) => (
                                        <TableRow
                                            key={entrega.id}
                                            className={entregasSeleccionadas.includes(Number(entrega.id)) ? 'bg-blue-50 dark:bg-blue-950' : ''}
                                        >
                                            <TableCell className="w-[25%]">
                                                {/* <Checkbox
                                                    checked={entregasSeleccionadas.includes(Number(entrega.id))}
                                                    onCheckedChange={() => toggleSeleccion(Number(entrega.id))}
                                                    aria-label={`Seleccionar entrega ${entrega.id}`}
                                                /> */}
                                                #{entrega.id} | {entrega.numero_entrega || entrega.numero_envio}
                                                <br />
                                                <EstadoEntregaBadge
                                                    estado={entrega.estado}
                                                    tamaño="sm"
                                                    conIcono={true}
                                                    mostrarLabel={true}
                                                />
                                                <br />
                                                {formatearFecha(entrega.fecha_programada)}
                                            </TableCell>
                                            <TableCell className="w-[25%]">
                                                {entrega.vehiculo ? (
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">{entrega.vehiculo.placa}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {entrega.vehiculo.marca} {entrega.vehiculo.modelo}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                                {entrega.chofer ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {entrega.chofer.name || entrega.chofer.nombre}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="w-[25%]">
                                                <span className="font-bold text-lg">
                                                    {entrega.peso_kg ? (
                                                        <span className="font-medium">{entrega.peso_kg} kg</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                    <br />
                                                    {calcularTotalEntrega(entrega).toLocaleString('es-BO', {
                                                        style: 'currency',
                                                        currency: 'BOB',
                                                        minimumFractionDigits: 2
                                                    })}
                                                </span>
                                                <br />
                                                <span className="text-sm text-muted-foreground">
                                                    {entrega.ventas?.length || 0} venta{(entrega.ventas?.length || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[25%]">
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleVerEntrega(entrega.id)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Ver
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleAbrirOutputSelection(entrega.id)}
                                                        title="Descargar o imprimir entrega"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                    {/* Botón de cancelación - solo si el estado permite */}
                                                    {['PROGRAMADO', 'PENDIENTE', 'EN_TRANSITO', 'PREPARACION_CARGA'].includes(entrega.estado) && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleAbrirCancelarModal(entrega)}
                                                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            title="Cancelar entrega"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Paginación simple */}
                            {entregas.last_page > 1 && (
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Página {entregas.current_page} de {entregas.last_page}
                                        ({entregas.total} total)
                                    </div>
                                    <div className="flex gap-2">
                                        {entregas.current_page > 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePaginaAnterior(entregas.current_page)}
                                            >
                                                Anterior
                                            </Button>
                                        )}
                                        {entregas.current_page < entregas.last_page && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePaginaSiguiente(entregas.current_page)}
                                            >
                                                Siguiente
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de cancelación de entrega */}
            <CancelarEntregaModal
                isOpen={mostrarCancelarModal}
                onClose={() => {
                    setMostrarCancelarModal(false);
                    setEntregaSeleccionadaParaCancelar(null);
                }}
                entrega={entregaSeleccionadaParaCancelar}
            />

            {/* Modal de selección de output (imprimir/descargar) */}
            {entregaSeleccionadaParaOutput && (
                <OutputSelectionModal
                    isOpen={mostrarOutputSelection}
                    onClose={() => {
                        setMostrarOutputSelection(false);
                        setEntregaSeleccionadaParaOutput(null);
                    }}
                    documentoId={entregaSeleccionadaParaOutput}
                    tipoDocumento="entrega"
                />
            )}

            {/* Modal de optimización */}
            <ModalOptimizacionRutas
                open={mostrarOptimizacion}
                onClose={() => setMostrarOptimizacion(false)}
                entregasIds={entregasSeleccionadas}
                vehiculos={vehiculos}
                choferes={choferes}
            />
        </div>
    );
}
