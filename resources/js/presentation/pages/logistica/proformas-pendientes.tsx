import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/presentation/components/ui/dialog';
import { toast } from 'react-toastify';
import {
    AlertCircle,
    CheckCircle,
    XCircle,
    Package,
    User,
    DollarSign,
    Calendar,
    Filter,
    X,
    Eye
} from 'lucide-react';
import logisticaService, { type Proforma, type FiltrosProformas } from '@/infrastructure/services/logistica.service';

interface Props {
    proformas?: Proforma[];
}

export default function ProformasPendientes({ proformas: initialProformas = [] }: Props) {
    const [proformas, setProformas] = useState<Proforma[]>(initialProformas);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState<FiltrosProformas>({});
    const [showFilters, setShowFilters] = useState(false);
    const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);
    const [proformaSeleccionada, setProformaSeleccionada] = useState<Proforma | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [procesandoId, setProcesandoId] = useState<number | null>(null);

    // Cargar proformas
    useEffect(() => {
        cargarProformas();
    }, [filtros]);

    const cargarProformas = async () => {
        setLoading(true);
        try {
            const resultado = await logisticaService.obtenerProformasPendientes(1, filtros);
            setProformas(resultado.data);
        } catch (error) {
            toast.error('Error al cargar proformas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const aprobarProforma = async (proformaId: number) => {
        setProcesandoId(proformaId);
        try {
            await logisticaService.aprobarProforma(proformaId, 'Aprobada por gestor de logística');
            cargarProformas();
        } catch (error) {
            console.error(error);
        } finally {
            setProcesandoId(null);
        }
    };

    const abrirModalRechazo = (proforma: Proforma) => {
        setProformaSeleccionada(proforma);
        setMotivoRechazo('');
        setMostrarModalRechazo(true);
    };

    const cerrarModalRechazo = () => {
        setMostrarModalRechazo(false);
        setProformaSeleccionada(null);
        setMotivoRechazo('');
    };

    const rechazarProforma = async () => {
        if (!proformaSeleccionada) return;

        const errores = logisticaService.validateRechazarProforma(motivoRechazo);
        if (errores.length > 0) {
            errores.forEach(error => toast.error(error));
            return;
        }

        setProcesandoId(proformaSeleccionada.id);
        try {
            await logisticaService.rechazarProforma(proformaSeleccionada.id, motivoRechazo);
            cerrarModalRechazo();
            cargarProformas();
        } catch (error) {
            console.error(error);
        } finally {
            setProcesandoId(null);
        }
    };

    const handleFiltroChange = (key: keyof FiltrosProformas, value: string) => {
        const nuevosFiltros = { ...filtros, [key]: value || undefined };
        setFiltros(nuevosFiltros);
    };

    const limpiarFiltros = () => {
        setFiltros({});
        setShowFilters(false);
    };

    return (
        <AppLayout>
            <Head title="Proformas Pendientes" />
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Proformas Pendientes</h1>
                        <p className="text-muted-foreground mt-1">Gestiona la aprobación y rechazo de proformas</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">{proformas.length}</div>
                        <p className="text-sm text-muted-foreground">Pendientes de aprobación</p>
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
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                {/* Proformas */}
                <div className="space-y-3">
                    {loading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">Cargando proformas...</p>
                            </CardContent>
                        </Card>
                    ) : proformas.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                    <h3 className="font-semibold text-lg mb-2">¡Sin proformas pendientes!</h3>
                                    <p className="text-muted-foreground">Todas las proformas han sido procesadas</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        proformas.map((proforma) => (
                            <Card key={proforma.id} className="hover:shadow-md transition-shadow border-l-4 border-orange-500">
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <AlertCircle className="h-8 w-8 text-orange-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{proforma.numero}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Creada el {new Date(proforma.fecha).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                                                Pendiente
                                            </Badge>
                                        </div>

                                        {/* Información detallada */}
                                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 border-y py-4">
                                            {/* Cliente */}
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Cliente</p>
                                                    <p className="font-medium">{proforma.cliente_nombre}</p>
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="flex items-center gap-3">
                                                <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                    <p className="font-medium">Bs {parseFloat(String(proforma.total)).toFixed(2)}</p>
                                                </div>
                                            </div>

                                            {/* Canal origen */}
                                            <div className="flex items-center gap-3">
                                                <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Canal</p>
                                                    <p className="font-medium">{proforma.canal_origen}</p>
                                                </div>
                                            </div>

                                            {/* Usuario creador */}
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Creado por</p>
                                                    <p className="font-medium text-sm">{proforma.usuario_creador_nombre}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.location.href = `/proformas/${proforma.id}`}
                                                className="gap-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Ver detalles
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => abrirModalRechazo(proforma)}
                                                disabled={procesandoId === proforma.id}
                                                className="gap-2"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Rechazar
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => aprobarProforma(proforma.id)}
                                                disabled={procesandoId === proforma.id}
                                                className="gap-2 bg-green-600 hover:bg-green-700"
                                            >
                                                {procesandoId === proforma.id ? 'Procesando...' : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4" />
                                                        Aprobar
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Rechazo */}
            <Dialog open={mostrarModalRechazo} onOpenChange={setMostrarModalRechazo}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rechazar Proforma</DialogTitle>
                    </DialogHeader>

                    {proformaSeleccionada && (
                        <div className="space-y-4">
                            <div className="bg-muted/30 rounded-lg p-3">
                                <p className="text-sm font-medium">{proformaSeleccionada.numero}</p>
                                <p className="text-xs text-muted-foreground">
                                    {proformaSeleccionada.cliente_nombre} - Bs {parseFloat(String(proformaSeleccionada.total)).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Motivo de rechazo *</label>
                                <Textarea
                                    placeholder="Explica por qué estás rechazando esta proforma..."
                                    value={motivoRechazo}
                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Mínimo 10 caracteres, máximo 500 caracteres
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={cerrarModalRechazo}
                            disabled={procesandoId === proformaSeleccionada?.id}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={rechazarProforma}
                            disabled={procesandoId === proformaSeleccionada?.id}
                            className="gap-2"
                        >
                            {procesandoId === proformaSeleccionada?.id ? 'Rechazando...' : (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    Rechazar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
