import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import {
    Package,
    Truck,
    Clock,
    CheckCircle,
    AlertCircle,
    MapPin,
    Phone,
    User,
    Calendar
} from 'lucide-react';

interface ProformaAppExterna {
    id: number;
    numero: string;
    cliente: {
        nombre: string;
        telefono: string;
    };
    total: number;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
    canal_origen: string;
    fecha: string;
    ubicacion_entrega: {
        direccion: string;
        referencia: string;
        latitud: number;
        longitud: number;
    };
    contacto_entrega: {
        nombre: string;
        telefono: string;
    };
}

interface Envio {
    id: number;
    numero: string;
    venta: {
        numero: string;
        cliente: {
            nombre: string;
        };
    };
    vehiculo: {
        placa: string;
        marca: string;
        modelo: string;
    };
    chofer: {
        name: string;
        telefono?: string;
    };
    estado: 'PROGRAMADO' | 'EN_PREPARACION' | 'EN_TRANSITO' | 'ENTREGADO' | 'FALLIDO';
    fecha_programada: string;
    direccion_entrega: string;
}

interface DashboardStats {
    proformas_pendientes: number;
    envios_programados: number;
    envios_en_transito: number;
    envios_entregados_hoy: number;
}

export default function LogisticaDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        proformas_pendientes: 0,
        envios_programados: 0,
        envios_en_transito: 0,
        envios_entregados_hoy: 0
    });
    const [proformas, setProformas] = useState<ProformaAppExterna[]>([]);
    const [envios, setEnvios] = useState<Envio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Cargar estadísticas
            const statsResponse = await fetch('/api/logistica/dashboard/stats');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }

            // Cargar proformas pendientes del app externa
            const proformasResponse = await fetch('/api/proformas?canal_origen=APP_EXTERNA&estado=PENDIENTE');
            if (proformasResponse.ok) {
                const proformasData = await proformasResponse.json();
                setProformas(proformasData.data || []);
            }

            // Cargar envíos activos
            const enviosResponse = await fetch('/api/envios?estados=PROGRAMADO,EN_PREPARACION,EN_TRANSITO');
            if (enviosResponse.ok) {
                const enviosData = await enviosResponse.json();
                setEnvios(enviosData.data || []);
            }

        } catch (error) {
            toast.error('Error al cargar datos del dashboard');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

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
                cargarDatos(); // Recargar datos
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
                cargarDatos(); // Recargar datos
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

        return <Badge variant={variants[estado as keyof typeof variants] as any}>{estado}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Dashboard de Logística</h1>
                <Button onClick={cargarDatos} variant="outline">
                    Actualizar
                </Button>
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
            <Tabs defaultValue="proformas" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="proformas">Proformas App Externa</TabsTrigger>
                    <TabsTrigger value="envios">Envíos Activos</TabsTrigger>
                </TabsList>

                <TabsContent value="proformas" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Proformas Pendientes de Aprobación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {proformas.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No hay proformas pendientes de aprobación
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {proformas.map((proforma) => (
                                        <div key={proforma.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{proforma.numero}</h3>
                                                    {getEstadoBadge(proforma.estado)}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">Bs {proforma.total}</p>
                                                    <p className="text-sm text-muted-foreground">{proforma.fecha}</p>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{proforma.cliente.nombre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{proforma.cliente.telefono}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{proforma.ubicacion_entrega.direccion}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {proforma.contacto_entrega.nombre} - {proforma.contacto_entrega.telefono}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    onClick={() => aprobarProforma(proforma.id)}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Aprobar
                                                </Button>
                                                <Button
                                                    onClick={() => rechazarProforma(proforma.id)}
                                                    size="sm"
                                                    variant="destructive"
                                                >
                                                    Rechazar
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
                        <CardContent>
                            {envios.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No hay envíos activos
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {envios.map((envio) => (
                                        <div key={envio.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{envio.numero}</h3>
                                                    {getEstadoBadge(envio.estado)}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{envio.venta.numero}</p>
                                                    <p className="text-sm text-muted-foreground">{envio.fecha_programada}</p>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{envio.venta.cliente.nombre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{envio.direccion_entrega}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {envio.vehiculo.marca} {envio.vehiculo.modelo} - {envio.vehiculo.placa}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">Chofer: {envio.chofer.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    onClick={() => window.open(`/logistica/envios/${envio.id}/seguimiento`, '_blank')}
                                                    size="sm"
                                                    variant="outline"
                                                >
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
    );
}