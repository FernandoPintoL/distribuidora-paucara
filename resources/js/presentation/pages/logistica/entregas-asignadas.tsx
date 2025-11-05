import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Select } from '@/presentation/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/presentation/components/ui/dialog';
import { toast } from 'react-toastify';
import {
    Truck,
    User,
    Package,
    Clock,
    MapPin,
    ChevronRight,
    Plus,
    Filter,
    X,
    AlertCircle
} from 'lucide-react';
import logisticaService, { type Entrega, type FiltrosEntregas } from '@/infrastructure/services/logistica.service';

interface Props {
    entregas?: Entrega[];
    estadisticas?: {
        entregas_asignadas: number;
        entregas_en_transito: number;
    };
}

interface AsignacionFormData {
    chofer_id: number;
    vehiculo_id: number;
}

export default function EntregasAsignadas({ entregas: initialEntregas = [], estadisticas = {} }: Props) {
    const [entregas, setEntregas] = useState<Entrega[]>(initialEntregas);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState<FiltrosEntregas>({});
    const [showFilters, setShowFilters] = useState(false);
    const [mostraAsignacionModal, setMostrarAsignacionModal] = useState(false);
    const [entregaSeleccionada, setEntregaSeleccionada] = useState<Entrega | null>(null);
    const [vehículos, setVehículos] = useState<Array<{ id: number; placa: string; marca: string; modelo: string }>>([]);
    const [choferes, setChoferes] = useState<Array<{ id: number; nombre: string; email: string }>>([]);
    const [datosAsignacion, setDatosAsignacion] = useState<AsignacionFormData>({
        chofer_id: 0,
        vehiculo_id: 0,
    });
    const [asignandoId, setAsignandoId] = useState<number | null>(null);

    // Cargar entregas
    useEffect(() => {
        cargarEntregas();
    }, [filtros]);

    // Cargar vehículos y choferes al abrir modal
    useEffect(() => {
        if (mostraAsignacionModal) {
            cargarVehiculosYChoferes();
        }
    }, [mostraAsignacionModal]);

    const cargarEntregas = async () => {
        setLoading(true);
        try {
            const resultado = await logisticaService.obtenerEntregasAsignadas(1, filtros);
            setEntregas(resultado.data);
        } catch (error) {
            toast.error('Error al cargar entregas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const cargarVehiculosYChoferes = async () => {
        try {
            const [vehiculosData, choferesData] = await Promise.all([
                logisticaService.obtenerVehiculosDisponibles(),
                logisticaService.obtenerChoferesDisponibles(),
            ]);
            setVehículos(vehiculosData);
            setChoferes(choferesData);
        } catch (error) {
            toast.error('Error al cargar opciones de asignación');
        }
    };

    const abrirModalAsignacion = (entrega: Entrega) => {
        setEntregaSeleccionada(entrega);
        setDatosAsignacion({
            chofer_id: entrega.chofer_id || 0,
            vehiculo_id: entrega.vehiculo_id || 0,
        });
        setMostrarAsignacionModal(true);
    };

    const cerrarModalAsignacion = () => {
        setMostrarAsignacionModal(false);
        setEntregaSeleccionada(null);
        setDatosAsignacion({ chofer_id: 0, vehiculo_id: 0 });
    };

    const asignarEntrega = async () => {
        if (!entregaSeleccionada) return;

        const errores = logisticaService.validateAsignarEntrega(datosAsignacion);
        if (errores.length > 0) {
            errores.forEach(error => toast.error(error));
            return;
        }

        setAsignandoId(entregaSeleccionada.id);
        try {
            await logisticaService.asignarEntrega(entregaSeleccionada.id, datosAsignacion);
            cerrarModalAsignacion();
            cargarEntregas();
        } catch (error) {
            console.error(error);
        } finally {
            setAsignandoId(null);
        }
    };

    const handleFiltroChange = (key: keyof FiltrosEntregas, value: string) => {
        const nuevosFiltros = { ...filtros, [key]: value || undefined };
        setFiltros(nuevosFiltros);
    };

    const limpiarFiltros = () => {
        setFiltros({});
        setShowFilters(false);
    };

    const getEstadoBadge = (estado: string) => {
        const config: Record<string, { color: string; label: string }> = {
            'ASIGNADA': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200', label: 'Asignada' },
            'EN_CAMINO': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200', label: 'En Camino' },
            'LLEGO': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200', label: 'Llegó' },
            'ENTREGADO': { color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200', label: 'Entregado' },
            'NOVEDAD': { color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200', label: 'Novedad' },
            'CANCELADA': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200', label: 'Cancelada' },
        };

        const cfg = config[estado] || { color: 'bg-gray-100 text-gray-800', label: estado };
        return <Badge className={cfg.color}>{cfg.label}</Badge>;
    };

    return (
        <AppLayout>
            <Head title="Entregas Asignadas" />
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Entregas Asignadas</h1>
                        <p className="text-muted-foreground mt-1">Gestiona y asigna entregas a choferes</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            variant={showFilters ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filtros
                        </Button>
                        {Object.keys(filtros).length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={limpiarFiltros}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {showFilters && (
                        <Card className="bg-muted/30">
                            <CardContent className="pt-6">
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Estado</label>
                                        <Select
                                            value={filtros.estado || ''}
                                            onChange={(e) => handleFiltroChange('estado', e.target.value)}
                                        >
                                            <option value="">Todos</option>
                                            <option value="ASIGNADA">Asignada</option>
                                            <option value="EN_CAMINO">En Camino</option>
                                            <option value="LLEGO">Llegó</option>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Fecha Desde</label>
                                        <Input
                                            type="date"
                                            value={filtros.fecha_desde || ''}
                                            onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Fecha Hasta</label>
                                        <Input
                                            type="date"
                                            value={filtros.fecha_hasta || ''}
                                            onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Entregas */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Cargando entregas...</p>
                        </div>
                    ) : entregas.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No hay entregas asignadas</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        entregas.map((entrega) => (
                            <Card key={entrega.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        {/* Header entrega */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">Entrega #{entrega.id}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Proforma: #{entrega.proforma_id}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getEstadoBadge(entrega.estado)}
                                            </div>
                                        </div>

                                        {/* Detalles */}
                                        <div className="grid md:grid-cols-2 gap-4 border-y py-4">
                                            {/* Chofer */}
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-muted-foreground">Chofer</p>
                                                    <p className="font-medium">
                                                        {entrega.chofer_id ? `Asignado (#${entrega.chofer_id})` : 'No asignado'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Vehículo */}
                                            <div className="flex items-center gap-3">
                                                <Truck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-muted-foreground">Vehículo</p>
                                                    <p className="font-medium">
                                                        {entrega.vehiculo_id ? `Asignado (#${entrega.vehiculo_id})` : 'No asignado'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Fecha asignación */}
                                            {entrega.fecha_asignacion && (
                                                <div className="flex items-center gap-3">
                                                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Asignada</p>
                                                        <p className="font-medium">
                                                            {new Date(entrega.fecha_asignacion).toLocaleDateString('es-ES')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex gap-2 justify-end">
                                            {(!entrega.chofer_id || !entrega.vehiculo_id) && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => abrirModalAsignacion(entrega)}
                                                    className="gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Asignar
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => window.location.href = `/logistica/entregas/${entrega.id}`}
                                            >
                                                Ver detalles
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Asignación */}
            <Dialog open={mostraAsignacionModal} onOpenChange={setMostrarAsignacionModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Asignar Entrega #{entregaSeleccionada?.id}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Seleccionar Chofer */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Chofer</label>
                            <Select
                                value={datosAsignacion.chofer_id.toString()}
                                onChange={(e) => setDatosAsignacion({
                                    ...datosAsignacion,
                                    chofer_id: parseInt(e.target.value),
                                })}
                            >
                                <option value="0">Seleccionar chofer...</option>
                                {choferes.map((chofer) => (
                                    <option key={chofer.id} value={chofer.id}>
                                        {chofer.nombre} ({chofer.email})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {/* Seleccionar Vehículo */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Vehículo</label>
                            <Select
                                value={datosAsignacion.vehiculo_id.toString()}
                                onChange={(e) => setDatosAsignacion({
                                    ...datosAsignacion,
                                    vehiculo_id: parseInt(e.target.value),
                                })}
                            >
                                <option value="0">Seleccionar vehículo...</option>
                                {vehículos.map((vehiculo) => (
                                    <option key={vehiculo.id} value={vehiculo.id}>
                                        {vehiculo.placa} ({vehiculo.marca} {vehiculo.modelo})
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={cerrarModalAsignacion}
                            disabled={asignandoId === entregaSeleccionada?.id}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={asignarEntrega}
                            disabled={asignandoId === entregaSeleccionada?.id}
                            className="gap-2"
                        >
                            {asignandoId === entregaSeleccionada?.id ? 'Asignando...' : 'Asignar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
