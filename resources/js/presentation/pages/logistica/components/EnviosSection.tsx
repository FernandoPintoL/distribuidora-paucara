import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { formatDate } from '@/lib/utils';

interface Envio {
    id: number;
    numero_seguimiento: string;
    cliente_nombre: string;
    estado: string;
    fecha_programada: string;
    direccion_entrega: string;
}

interface EnviosSectionProps {
    envios: Envio[];
    enviosPaginationInfo: any;
    searchEnvio: string;
    setSearchEnvio: (value: string) => void;
    filtroEstadoEnvio: string;
    setFiltroEstadoEnvio: (value: string) => void;
    cambiarPaginaEnvio: (page: number) => void;
    onVerEnvio: (envio: Envio) => void;
    getEstadoBadge: (estado: string) => any;
}

export function EnviosSection({
    envios,
    enviosPaginationInfo,
    searchEnvio,
    setSearchEnvio,
    filtroEstadoEnvio,
    setFiltroEstadoEnvio,
    cambiarPaginaEnvio,
    onVerEnvio,
    getEstadoBadge,
}: EnviosSectionProps) {
    const estados = ['TODOS', 'PROGRAMADO', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'CANCELADO'] as const;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Envíos Activos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="space-y-4">
                    {/* Búsqueda */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Buscar</label>
                        <Input
                            placeholder="Número de seguimiento o cliente..."
                            value={searchEnvio}
                            onChange={(e) => setSearchEnvio(e.target.value)}
                        />
                    </div>

                    {/* Filtro de estado */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Estado</label>
                        <div className="flex flex-wrap gap-2">
                            {estados.map((estado) => (
                                <Button
                                    key={estado}
                                    variant={filtroEstadoEnvio === estado ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFiltroEstadoEnvio(estado)}
                                >
                                    {estado}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Información de paginación */}
                <div className="text-sm text-muted-foreground">
                    Mostrando {enviosPaginationInfo.from}-{enviosPaginationInfo.to} de {enviosPaginationInfo.total}
                </div>

                {/* Tabla */}
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-2 text-left">Seguimiento</th>
                                <th className="px-4 py-2 text-left">Cliente</th>
                                <th className="px-4 py-2 text-left">Estado</th>
                                <th className="px-4 py-2 text-left">Dirección</th>
                                <th className="px-4 py-2 text-left">Fecha Prog.</th>
                                <th className="px-4 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {envios.map((envio) => (
                                <tr key={envio.id} className="border-t hover:bg-muted/50">
                                    <td className="px-4 py-2 font-mono text-xs">{envio.numero_seguimiento}</td>
                                    <td className="px-4 py-2">{envio.cliente_nombre}</td>
                                    <td className="px-4 py-2">{getEstadoBadge(envio.estado)}</td>
                                    <td className="px-4 py-2 text-xs">{envio.direccion_entrega}</td>
                                    <td className="px-4 py-2 text-xs">{formatDate(envio.fecha_programada)}</td>
                                    <td className="px-4 py-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onVerEnvio(envio)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cambiarPaginaEnvio(enviosPaginationInfo.current_page - 1)}
                        disabled={enviosPaginationInfo.current_page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Página {enviosPaginationInfo.current_page} de {enviosPaginationInfo.last_page}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cambiarPaginaEnvio(enviosPaginationInfo.current_page + 1)}
                        disabled={enviosPaginationInfo.current_page === enviosPaginationInfo.last_page}
                    >
                        Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
