import { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Select } from '@/presentation/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { toast } from 'react-toastify';
import {
    Truck,
    User,
    MapPin,
    Clock,
    Zap,
    Navigation,
    Filter,
    X,
    List,
    Map as MapIcon,
    Phone,
    AlertCircle,
    Wifi,
    WifiOff
} from 'lucide-react';
import logisticaService, { type Entrega, type FiltrosEntregas } from '@/infrastructure/services/logistica.service';
import { useWebSocket } from '@/application/hooks/use-websocket';
import { useTracking } from '@/application/hooks/use-tracking';
import { useRealtimeNotifications } from '@/application/hooks/use-realtime-notifications';

interface Props {
    entregas?: Entrega[];
}

interface UbicacionEntrega {
    entrega_id: number;
    latitud: number;
    longitud: number;
    velocidad?: number;
    timestamp: string;
}

export default function EntregasEnTransito({ entregas: initialEntregas = [] }: Props) {
    const [entregas, setEntregas] = useState<Entrega[]>(initialEntregas);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState<FiltrosEntregas>({});
    const [showFilters, setShowFilters] = useState(false);
    const [ubicaciones, setUbicaciones] = useState<Map<number, UbicacionEntrega>>(new Map());
    const [etasInfo, setEtasInfo] = useState<Map<number, any>>(new Map());
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Map<number, any>>(new Map());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ WebSocket hooks para conexión en tiempo real
    const { isConnected: wsConnected, subscribeTo, on, off } = useWebSocket({
        autoConnect: true
    });
    const { unreadCount } = useRealtimeNotifications({ enableAutoNotify: true });

    // ✅ Escuchar eventos de WebSocket para actualizaciones en tiempo real
    useEffect(() => {
        if (!wsConnected) {
            console.log('⏳ Esperando conexión WebSocket...');
            return;
        }

        console.log('✅ Suscribiendo a eventos de WebSocket para entregas');

        // Escuchar cambios de ubicación en tiempo real
        on('ubicacion.actualizada', (data: any) => {
            console.log('📍 Ubicación actualizada:', data);
            if (data.entrega_id) {
                setUbicaciones(prev => new Map(prev).set(data.entrega_id, {
                    entrega_id: data.entrega_id,
                    latitud: data.latitud,
                    longitud: data.longitud,
                    velocidad: data.velocidad,
                    timestamp: data.timestamp || new Date().toISOString(),
                }));
            }
        });

        // Escuchar cambios de estado de entregas
        on('entrega.estado-cambio', (data: any) => {
            console.log('🔄 Estado de entrega actualizado:', data);
            setEntregas(prev =>
                prev.map(e =>
                    e.id === data.entrega_id
                        ? { ...e, estado: data.estado_nuevo }
                        : e
                )
            );
        });

        // Escuchar cuando una entrega se entrega
        on('entrega.entregado', (data: any) => {
            console.log('✅ Entrega completada:', data);
            setEntregas(prev => prev.filter(e => e.id !== data.entrega_id));
            setUbicaciones(prev => {
                const newMap = new Map(prev);
                newMap.delete(data.entrega_id);
                return newMap;
            });
            toast.success(`Entrega #${data.entrega_id} completada`);
        });

        // Cleanup: dejar de escuchar cuando se desmonta
        return () => {
            off('ubicacion.actualizada');
            off('entrega.estado-cambio');
            off('entrega.entregado');
        };
    }, [wsConnected, on, off]);

    // Cargar entregas en tránsito
    useEffect(() => {
        cargarEntregas();
    }, [filtros]);

    // Auto-actualizar ubicaciones como fallback si WebSocket falla (cada 30 segundos)
    useEffect(() => {
        if (wsConnected) {
            // Si WebSocket está conectado, no hacer polling
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Si WebSocket no está conectado, hacer polling
        if (entregas.length > 0) {
            console.warn('⚠️ WebSocket desconectado, usando polling de ubicaciones');
            intervalRef.current = setInterval(() => {
                actualizarUbicaciones();
            }, 30000); // Actualizar cada 30 segundos como fallback

            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
    }, [wsConnected, entregas]);

    // Inicializar mapa
    useEffect(() => {
        if (mapContainer.current && !mapRef.current) {
            inicializarMapa();
        }
    }, [mapContainer]);

    // Actualizar marcadores cuando cambien ubicaciones
    useEffect(() => {
        actualizarMarcadores();
    }, [ubicaciones]);

    const cargarEntregas = async () => {
        setLoading(true);
        try {
            const resultado = await logisticaService.obtenerEntregasEnTransito(1, filtros);
            setEntregas(resultado.data);

            // Cargar ubicaciones de todas las entregas
            resultado.data.forEach((entrega) => {
                cargarUbicacionEntrega(entrega.id);
            });
        } catch (error) {
            toast.error('Error al cargar entregas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const cargarUbicacionEntrega = async (entregaId: number) => {
        try {
            const data = await logisticaService.obtenerUbicacionesEntrega(entregaId);
            if (data.ultima_ubicacion) {
                setUbicaciones(prev => new Map(prev).set(entregaId, {
                    entrega_id: entregaId,
                    latitud: data.ultima_ubicacion!.latitud,
                    longitud: data.ultima_ubicacion!.longitud,
                    velocidad: data.ultima_ubicacion!.velocidad,
                    timestamp: data.ultima_ubicacion!.timestamp,
                }));
            }
        } catch (error) {
            console.error(`Error cargando ubicación entrega ${entregaId}:`, error);
        }
    };

    const actualizarUbicaciones = async () => {
        for (const entrega of entregas) {
            await cargarUbicacionEntrega(entrega.id);
        }
    };

    const inicializarMapa = () => {
        if (!mapContainer.current) {
            console.warn('Map container no está disponible');
            return;
        }

        try {
            // Centro predeterminado (Bolivia)
            const centro: [number, number] = [-16.5, -68.15];

            mapRef.current = L.map(mapContainer.current).setView(centro, 6);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(mapRef.current);

            console.log('✅ Mapa inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar Leaflet:', error);
        }
    };

    const actualizarMarcadores = () => {
        if (!mapRef.current) return;

        try {
            // Limpiar marcadores previos
            markersRef.current.forEach((marker) => {
                mapRef.current!.removeLayer(marker);
            });
            markersRef.current.clear();

            // Agregar nuevos marcadores
            ubicaciones.forEach((ubicacion) => {
                const entrega = entregas.find(e => e.id === ubicacion.entrega_id);
                if (entrega) {
                    const marker = L.marker([ubicacion.latitud, ubicacion.longitud], {
                        title: `Entrega #${entrega.id}`,
                    }).addTo(mapRef.current!);

                    marker.bindPopup(`
                        <div style="min-width: 200px;">
                            <strong>Entrega #${entrega.id}</strong><br/>
                            <small>Proforma: #${entrega.proforma_id}</small><br/>
                            ${ubicacion.velocidad ? `<small>Velocidad: ${ubicacion.velocidad.toFixed(1)} km/h</small><br/>` : ''}
                            <small>Actualizado: ${new Date(ubicacion.timestamp).toLocaleTimeString('es-ES')}</small>
                        </div>
                    `);

                    markersRef.current.set(ubicacion.entrega_id, marker);
                }
            });

            // Auto-ajustar vista si hay marcadores
            if (markersRef.current.size > 0) {
                const bounds = L.latLngBounds(
                    Array.from(ubicaciones.values()).map(u => [u.latitud, u.longitud] as L.LatLngExpression)
                );
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
        } catch (error) {
            console.error('Error al actualizar marcadores:', error);
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
            'EN_CAMINO': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200', label: 'En Camino' },
            'LLEGO': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200', label: 'Llegó' },
            'ENTREGADO': { color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200', label: 'Entregado' },
        };

        const cfg = config[estado] || { color: 'bg-gray-100 text-gray-800', label: estado };
        return <Badge className={cfg.color}>{cfg.label}</Badge>;
    };

    return (
        <AppLayout>
            <Head title="Entregas en Tránsito" />
            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Entregas en Tránsito</h1>
                        <p className="text-muted-foreground mt-1">
                            Seguimiento de entregas en tiempo real
                            {wsConnected && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    ✓ WebSocket conectado
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            title={wsConnected ? 'WebSocket conectado' : 'WebSocket desconectado'}
                        >
                            {wsConnected ? (
                                <>
                                    <Wifi className="h-4 w-4 text-green-600 animate-pulse" />
                                    En vivo
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-4 w-4 text-red-600" />
                                    Fuera de línea
                                </>
                            )}
                        </Button>
                        {unreadCount > 0 && (
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    🔔 Notificaciones
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                        {unreadCount}
                                    </span>
                                </Button>
                            </div>
                        )}
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
                                        <label className="text-sm font-medium mb-2 block">Estado</label>
                                        <Select
                                            value={filtros.estado || ''}
                                            onChange={(e) => handleFiltroChange('estado', e.target.value)}
                                        >
                                            <option value="">Todos</option>
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

                {/* Vista Tabs: Mapa y Lista */}
                <Tabs defaultValue="mapa" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="mapa" className="gap-2">
                            <MapIcon className="h-4 w-4" />
                            Mapa
                        </TabsTrigger>
                        <TabsTrigger value="lista" className="gap-2">
                            <List className="h-4 w-4" />
                            Lista
                        </TabsTrigger>
                    </TabsList>

                    {/* Mapa */}
                    <TabsContent value="mapa">
                        <Card>
                            <CardContent className="pt-6 p-0">
                                <div
                                    ref={mapContainer}
                                    className="h-[600px] rounded-lg"
                                    style={{ minHeight: '600px' }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Lista */}
                    <TabsContent value="lista" className="space-y-3">
                        {loading ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-center text-muted-foreground">Cargando entregas...</p>
                                </CardContent>
                            </Card>
                        ) : entregas.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center py-8">
                                        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No hay entregas en tránsito</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            entregas.map((entrega) => {
                                const ubicacion = ubicaciones.get(entrega.id);
                                return (
                                    <Card key={entrega.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="space-y-3">
                                                {/* Header */}
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-lg">Entrega #{entrega.id}</h3>
                                                    {getEstadoBadge(entrega.estado)}
                                                </div>

                                                {/* Información de localización */}
                                                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                                    {ubicacion ? (
                                                        <>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <MapPin className="h-4 w-4 text-green-600" />
                                                                <span>
                                                                    {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                                                                </span>
                                                            </div>
                                                            {ubicacion.velocidad !== undefined && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Navigation className="h-4 w-4 text-blue-600" />
                                                                    <span>{ubicacion.velocidad.toFixed(1)} km/h</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                <span>Última actualización: {new Date(ubicacion.timestamp).toLocaleTimeString('es-ES')}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <span>Sin ubicación registrada</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Detalles */}
                                                <div className="grid md:grid-cols-2 gap-3 border-t pt-3">
                                                    <div className="text-sm">
                                                        <p className="text-muted-foreground">Proforma</p>
                                                        <p className="font-medium">#{entrega.proforma_id}</p>
                                                    </div>
                                                    {entrega.fecha_inicio && (
                                                        <div className="text-sm">
                                                            <p className="text-muted-foreground">Iniciada</p>
                                                            <p className="font-medium">
                                                                {new Date(entrega.fecha_inicio).toLocaleDateString('es-ES')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Acciones */}
                                                <div className="flex gap-2 justify-end border-t pt-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.location.href = `/logistica/entregas/${entrega.id}`}
                                                    >
                                                        Ver detalles
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </TabsContent>
                </Tabs>

            </div>
        </AppLayout>
    );
}
