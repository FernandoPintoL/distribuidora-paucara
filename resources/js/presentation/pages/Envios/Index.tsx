import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Eye, Truck, User, Plus } from 'lucide-react';

interface Envio {
    id: number;
    numero_envio: string;
    estado: string;
    fecha_programada: string;
    fecha_salida?: string;
    fecha_entrega?: string;
    direccion_entrega: string;
    venta: {
        numero: string;
        cliente: {
            nombre: string;
        };
    };
    vehiculo?: {
        placa: string;
        marca: string;
        modelo: string;
    };
    chofer?: {
        name: string;
    };
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    envios: Pagination<Envio>;
}

export default function EnviosIndex({ envios }: Props) {
    const getEstadoBadge = (estado: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
            'PROGRAMADO': 'secondary',
            'EN_PREPARACION': 'default',
            'EN_RUTA': 'default',
            'EN_TRANSITO': 'default',
            'ENTREGADO': 'default',
            'FALLIDO': 'destructive'
        };

        return <Badge variant={variants[estado] || 'default'}>{estado}</Badge>;
    };

    return (
        <AppLayout>
            <Head title="Gestión de Envíos" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Gestión de Envíos</h1>
                    <Link href="/envios/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear Envío
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Lista de Envíos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {envios.data.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No se encontraron envíos.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Número</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Fecha Programada</TableHead>
                                            <TableHead>Vehículo</TableHead>
                                            <TableHead>Chofer</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {envios.data.map((envio) => (
                                            <TableRow key={envio.id}>
                                                <TableCell className="font-medium">
                                                    {envio.numero_envio}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">{envio.venta.cliente.nombre}</div>
                                                            <div className="text-sm text-muted-foreground">Venta: {envio.venta.numero}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getEstadoBadge(envio.estado)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(envio.fecha_programada).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {envio.vehiculo ? (
                                                        <div className="flex items-center gap-2">
                                                            <Truck className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <div className="font-medium">{envio.vehiculo.placa}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {envio.vehiculo.marca} {envio.vehiculo.modelo}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {envio.chofer ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {envio.chofer.name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => window.open(`/envios/${envio.id}`, '_blank')}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Ver
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Paginación simple */}
                                {envios.last_page > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Página {envios.current_page} de {envios.last_page}
                                            ({envios.total} total)
                                        </div>
                                        <div className="flex gap-2">
                                            {envios.current_page > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.location.href = `?page=${envios.current_page - 1}`}
                                                >
                                                    Anterior
                                                </Button>
                                            )}
                                            {envios.current_page < envios.last_page && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.location.href = `?page=${envios.current_page + 1}`}
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
            </div>
        </AppLayout>
    );
}
