import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { Input } from '@/presentation/components/ui/input';
import { toast } from 'react-toastify';
import { formatDate } from '@/lib/utils';
import {
    Package,
    Truck,
    Clock,
    CheckCircle,
    AlertCircle,
    MapPin,
    User,
    ChevronRight,
    List,
    Map as MapIcon,
    Search,
    Eye,
    X
} from 'lucide-react';

interface ProformaAppExterna {
    id: number;
    numero: string;
    cliente_nombre: string;
    total: number;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
    canal_origen: string;
    fecha: string;
    usuario_creador_nombre: string;
}

interface Envio {
    id: number;
    numero_seguimiento: string;
    cliente_nombre: string;
    estado: 'PROGRAMADO' | 'EN_PREPARACION' | 'EN_RUTA' | 'ENTREGADO' | 'FALLIDO';
    fecha_programada: string;
    fecha_salida?: string;
    fecha_entrega?: string;
    direccion_entrega: string;
}

interface DashboardStats {
    proformas_pendientes: number;
    envios_programados: number;
    envios_en_transito: number;
    envios_entregados_hoy: number;
}

interface Props {
    estadisticas: DashboardStats;
    proformasRecientes: ProformaAppExterna[];
    enviosActivos: Envio[];
}

export default function LogisticaDashboard({ estadisticas, proformasRecientes, enviosActivos }: Props) {
    const [stats] = useState<DashboardStats>(estadisticas);
    const [proformas] = useState<ProformaAppExterna[]>(proformasRecientes);
    const [envios] = useState<Envio[]>(enviosActivos);
    const [searchProforma, setSearchProforma] = useState('');
    const [filtroEstadoProforma, setFiltroEstadoProforma] = useState<'TODOS' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'>('TODOS');
    const [searchEnvio, setSearchEnvio] = useState('');
    const [filtroEstadoEnvio, setFiltroEstadoEnvio] = useState<'TODOS' | 'PROGRAMADO' | 'EN_PREPARACION' | 'EN_RUTA' | 'ENTREGADO' | 'FALLIDO'>('TODOS');

    // Filtrar proformas
    const proformasFiltradas = proformas.filter(p => {
        const coincideTexto = p.numero.toLowerCase().includes(searchProforma.toLowerCase()) ||
            p.cliente_nombre.toLowerCase().includes(searchProforma.toLowerCase());
        const coincideEstado = filtroEstadoProforma === 'TODOS' || p.estado === filtroEstadoProforma;
        return coincideTexto && coincideEstado;
    });

    // Filtrar envíos
    const enviosFiltrados = envios.filter(e => {
        const coincideTexto = e.numero_seguimiento.toLowerCase().includes(searchEnvio.toLowerCase()) ||
            e.cliente_nombre.toLowerCase().includes(searchEnvio.toLowerCase());
        const coincideEstado = filtroEstadoEnvio === 'TODOS' || e.estado === filtroEstadoEnvio;
        return coincideTexto && coincideEstado;
    });

    const aprobarProforma = async (proformaId: number) => {
        try {
            const response = await fetch(`/api/proformas/${proformaId}/aprobar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    comentario: 'Aprobado desde dashboard de logística'
                })
            });

            if (response.ok) {
                toast.success('Proforma aprobada exitosamente');
                // Recargar página para actualizar datos
                window.location.reload();
            } else {
                toast.error('Error al aprobar la proforma');
            }
        } catch (error) {
            toast.error('Error al aprobar la proforma');
            console.error('Error:', error);
        }
    };

    const rechazarProforma = async (proformaId: number) => {
        try {
            const response = await fetch(`/api/proformas/${proformaId}/rechazar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    comentario: 'Rechazado desde dashboard de logística'
                })
            });

            if (response.ok) {
                toast.success('Proforma rechazada');
                // Recargar página para actualizar datos
                window.location.reload();
            } else {
                toast.error('Error al rechazar la proforma');
            }
        } catch (error) {
            toast.error('Error al rechazar la proforma');
            console.error('Error:', error);
        }
    };

    const getEstadoBadge = (estado: string) => {
        const variants = {
            'PENDIENTE': 'secondary',
            'APROBADA': 'default',
            'RECHAZADA': 'destructive',
            'PROGRAMADO': 'secondary',
            'EN_PREPARACION': 'default',
            'EN_TRANSITO': 'default',
            'ENTREGADO': 'default',
            'FALLIDO': 'destructive'
        };

        type VariantType = 'default' | 'destructive' | 'outline' | 'secondary';
        return <Badge variant={variants[estado as keyof typeof variants] as VariantType}>{estado}</Badge>;
    };

    return (
        <AppLayout>
            <Head title="Dashboard de Logística" />
            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Dashboard de Logística</h1>
                </div>

                {/* Estadísticas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Proformas Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.proformas_pendientes}</div>
                            <p className="text-xs text-muted-foreground">Esperando aprobación</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Envíos Programados</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.envios_programados}</div>
                            <p className="text-xs text-muted-foreground">Listos para despacho</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.envios_en_transito}</div>
                            <p className="text-xs text-muted-foreground">En camino</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Entregados Hoy</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.envios_entregados_hoy}</div>
                            <p className="text-xs text-muted-foreground">Completados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs principales */}
                <Tabs defaultValue="entregas" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="entregas">Entregas</TabsTrigger>
                        <TabsTrigger value="proformas">Proformas App Externa</TabsTrigger>
                        <TabsTrigger value="envios">Envíos Activos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="entregas" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Gestión de Entregas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-auto p-6 flex flex-col items-start gap-3 justify-start"
                                        onClick={() => window.location.href = '/logistica/entregas-asignadas'}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <List className="h-5 w-5" />
                                            <span className="font-semibold">Entregas Asignadas</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Gestiona entregas asignadas y pendientes de asignar chofer/vehículo</p>
                                        <div className="flex items-center gap-1 text-xs mt-2">
                                            Ir <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-6 flex flex-col items-start gap-3 justify-start"
                                        onClick={() => window.location.href = '/logistica/entregas-en-transito'}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <MapIcon className="h-5 w-5" />
                                            <span className="font-semibold">En Tránsito</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Visualiza en mapa el seguimiento de entregas en tiempo real</p>
                                        <div className="flex items-center gap-1 text-xs mt-2">
                                            Ir <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-6 flex flex-col items-start gap-3 justify-start"
                                        onClick={() => window.location.href = '/logistica/proformas-pendientes'}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <AlertCircle className="h-5 w-5" />
                                            <span className="font-semibold">Proformas</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Aprueba o rechaza proformas pendientes de gestión</p>
                                        <div className="flex items-center gap-1 text-xs mt-2">
                                            Ir <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="proformas" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Proformas Pendientes de Aprobación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Búsqueda y Filtros */}
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por número o cliente..."
                                                value={searchProforma}
                                                onChange={(e) => setSearchProforma(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                        {searchProforma && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSearchProforma('')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Filtro por estado */}
                                    <div className="flex gap-2 flex-wrap">
                                        {(['TODOS', 'PENDIENTE', 'APROBADA', 'RECHAZADA'] as const).map((estado) => (
                                            <Button
                                                key={estado}
                                                variant={filtroEstadoProforma === estado ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setFiltroEstadoProforma(estado)}
                                            >
                                                {estado}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Resultados */}
                                {proformasFiltradas.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        {searchProforma || filtroEstadoProforma !== 'TODOS'
                                            ? 'No hay proformas que coincidan con los filtros'
                                            : 'No hay proformas pendientes de aprobación'}
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {proformasFiltradas.map((proforma) => (
                                            <div key={proforma.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-base">{proforma.numero}</h3>
                                                        {getEstadoBadge(proforma.estado)}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-green-600">Bs {parseFloat(String(proforma.total)).toFixed(2)}</p>
                                                        <p className="text-xs text-muted-foreground">{formatDate(proforma.fecha)}</p>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 border-y py-3 text-sm">
                                                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 rounded p-2.5">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Cliente</p>
                                                            <p className="font-medium truncate text-sm">{proforma.cliente_nombre}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950 rounded p-2.5">
                                                        <User className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Creado por</p>
                                                            <p className="font-medium truncate text-sm">{proforma.usuario_creador_nombre}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Canal</p>
                                                            <p className="font-medium">{proforma.canal_origen}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">ID</p>
                                                        <p className="font-medium text-xs">#{proforma.id}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2 justify-end">
                                                    <Button
                                                        onClick={() => window.location.href = `/proformas/${proforma.id}`}
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Ver detalles
                                                    </Button>
                                                    <Button
                                                        onClick={() => rechazarProforma(proforma.id)}
                                                        size="sm"
                                                        variant="destructive"
                                                    >
                                                        Rechazar
                                                    </Button>
                                                    <Button
                                                        onClick={() => aprobarProforma(proforma.id)}
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Aprobar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="envios" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Envíos en Proceso
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Búsqueda y Filtros */}
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por número de seguimiento o cliente..."
                                                value={searchEnvio}
                                                onChange={(e) => setSearchEnvio(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                        {searchEnvio && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSearchEnvio('')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Filtro por estado */}
                                    <div className="flex gap-2 flex-wrap">
                                        {(['TODOS', 'PROGRAMADO', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'FALLIDO'] as const).map((estado) => (
                                            <Button
                                                key={estado}
                                                variant={filtroEstadoEnvio === estado ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setFiltroEstadoEnvio(estado)}
                                            >
                                                {estado.replace('_', ' ')}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Resultados */}
                                {enviosFiltrados.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        {searchEnvio || filtroEstadoEnvio !== 'TODOS'
                                            ? 'No hay envíos que coincidan con los filtros'
                                            : 'No hay envíos activos'}
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {enviosFiltrados.map((envio) => (
                                            <div key={envio.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-base">{envio.numero_seguimiento}</h3>
                                                        {getEstadoBadge(envio.estado)}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground font-medium">Programado: {formatDate(envio.fecha_programada)}</p>
                                                        {envio.fecha_salida && (
                                                            <p className="text-xs text-muted-foreground">Salida: {formatDate(envio.fecha_salida)}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 border-y py-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Cliente</p>
                                                            <p className="font-medium truncate">{envio.cliente_nombre}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Dirección</p>
                                                            <p className="font-medium truncate">{envio.direccion_entrega}</p>
                                                        </div>
                                                    </div>
                                                    {envio.fecha_entrega && (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Entregado</p>
                                                                <p className="font-medium">{formatDate(envio.fecha_entrega)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">ID</p>
                                                            <p className="font-medium text-xs">#{envio.id}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2 justify-end">
                                                    <Button
                                                        onClick={() => window.open(`/logistica/envios/${envio.id}/seguimiento`, '_blank')}
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Ver Seguimiento
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
