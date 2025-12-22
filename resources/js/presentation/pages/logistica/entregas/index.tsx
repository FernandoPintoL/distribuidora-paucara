import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Eye, Truck, User, Plus, Search, Filter, Route } from 'lucide-react';
import type { Entrega } from '@/domain/entities/entregas';
import type { Pagination } from '@/domain/entities/shared';
import { getEstadoBadgeVariant, getEstadoLabel, formatearFecha } from '@/lib/entregas.utils';
import { useEntregas } from '@/application/hooks/use-entregas';
import { useState } from 'react';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { ModalOptimizacionRutas } from '@/presentation/components/logistica/modal-optimizacion-rutas';

interface Props extends PageProps {
    entregas: Pagination<Entrega>;
    vehiculos?: Array<{ id: number; placa: string; marca: string; modelo: string; capacidad_kg: number }>;
    choferes?: Array<{ id: number; nombre: string }>;
}

export default function EntregasIndex({ entregas, vehiculos = [], choferes = [] }: Props) {
    const { handleVerEntrega, handlePaginaAnterior, handlePaginaSiguiente } = useEntregas();

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
    const [busqueda, setBusqueda] = useState<string>('');
    const [entregasSeleccionadas, setEntregasSeleccionadas] = useState<number[]>([]);
    const [mostrarOptimizacion, setMostrarOptimizacion] = useState(false);

    // Filtrar entregas localmente
    const entregasFiltradas = entregas.data.filter(entrega => {
        const cumpleFiltroEstado = filtroEstado === 'TODOS' || entrega.estado === filtroEstado;
        const cumpleBusqueda = busqueda === '' ||
            entrega.venta?.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            entrega.proforma?.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            entrega.chofer?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            entrega.vehiculo?.placa?.toLowerCase().includes(busqueda.toLowerCase());

        return cumpleFiltroEstado && cumpleBusqueda;
    });

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
            setEntregasSeleccionadas(entregasFiltradas.map(e => e.id));
        }
    };

    const entregasProgramadas = entregasFiltradas.filter(e => e.estado === 'PROGRAMADO' || e.estado === 'PENDIENTE');
    const puedeOptimizar = entregasSeleccionadas.length >= 2 &&
        entregasSeleccionadas.every(id => {
            const entrega = entregas.data.find(e => e.id === id);
            return entrega && (entrega.estado === 'PROGRAMADO' || entrega.estado === 'PENDIENTE');
        });

    return (
        <AppLayout>
            <Head title="Gestión de Entregas" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Gestión de Entregas</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {entregasProgramadas.length} entregas programadas disponibles para optimización
                        </p>
                    </div>
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
                        <Link href="/logistica/entregas/create">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Entrega
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Lista de Entregas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Filtros */}
                        <div className="mb-6 flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Filtros:</span>
                            </div>

                            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                                <SelectTrigger className="w-[180px] bg-background">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS">Todos los estados</SelectItem>
                                    <SelectItem value="PROGRAMADO">Programado</SelectItem>
                                    <SelectItem value="ASIGNADA">Asignada</SelectItem>
                                    <SelectItem value="EN_CAMINO">En Camino</SelectItem>
                                    <SelectItem value="LLEGO">Llegó</SelectItem>
                                    <SelectItem value="ENTREGADO">Entregado</SelectItem>
                                    <SelectItem value="NOVEDAD">Con Novedad</SelectItem>
                                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex-1 min-w-[200px] max-w-md relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cliente, chofer o vehículo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="pl-10 bg-background"
                                />
                            </div>

                            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Mostrando {entregasFiltradas.length} de {entregas.data.length}</span>
                            </div>
                        </div>

                        {entregas.data.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No se encontraron entregas.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={entregasSeleccionadas.length === entregasFiltradas.length && entregasFiltradas.length > 0}
                                                    onCheckedChange={toggleSeleccionTodos}
                                                    aria-label="Seleccionar todas"
                                                />
                                            </TableHead>
                                            <TableHead>Número</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Fecha Programada</TableHead>
                                            <TableHead>Vehículo</TableHead>
                                            <TableHead>Chofer</TableHead>
                                            <TableHead>Peso</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entregasFiltradas.map((entrega) => (
                                            <TableRow
                                                key={entrega.id}
                                                className={entregasSeleccionadas.includes(entrega.id) ? 'bg-blue-50 dark:bg-blue-950' : ''}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={entregasSeleccionadas.includes(entrega.id)}
                                                        onCheckedChange={() => toggleSeleccion(entrega.id)}
                                                        aria-label={`Seleccionar entrega ${entrega.id}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {entrega.numero_entrega || entrega.numero_envio || `#${entrega.id}`}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">
                                                                {entrega.venta?.cliente?.nombre || entrega.proforma?.cliente?.nombre || 'Sin cliente'}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {entrega.venta ? `Venta: ${entrega.venta.numero}` :
                                                                 entrega.proforma ? `Proforma: ${entrega.proforma.numero}` :
                                                                 'Sin referencia'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getEstadoBadgeVariant(entrega.estado)}>
                                                        {getEstadoLabel(entrega.estado)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatearFecha(entrega.fecha_programada)}
                                                </TableCell>
                                                <TableCell>
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
                                                </TableCell>
                                                <TableCell>
                                                    {entrega.chofer ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {entrega.chofer.name || entrega.chofer.nombre}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {entrega.peso_kg ? (
                                                        <span className="font-medium">{entrega.peso_kg} kg</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleVerEntrega(entrega.id)}
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

                {/* Modal de optimización */}
                <ModalOptimizacionRutas
                    open={mostrarOptimizacion}
                    onClose={() => setMostrarOptimizacion(false)}
                    entregasIds={entregasSeleccionadas}
                    vehiculos={vehiculos}
                    choferes={choferes}
                />
            </div>
        </AppLayout>
    );
}
