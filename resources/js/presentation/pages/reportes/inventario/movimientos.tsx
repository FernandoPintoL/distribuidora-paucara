import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Badge } from '@/presentation/components/ui/badge';
import { Input } from '@/presentation/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    Calendar,
    User,
    Package,
    Building2
} from 'lucide-react';

// Helper para generar rutas
const route = (name: string) => {
    const routes: Record<string, string> = {
        'dashboard': '/dashboard',
        'reportes.inventario.movimientos': '/reportes/inventario/movimientos',
    };

    const baseRoute = routes[name] || '/';
    return baseRoute;
};

interface MovimientoInventario {
    id: number;
    tipo: string;
    cantidad: number;
    fecha: string;
    motivo?: string;
    numero_referencia?: string;
    observaciones?: string;
    stock_producto: {
        producto: {
            id: number;
            nombre: string;
        };
        almacen: {
            id: number;
            nombre: string;
        };
    };
    user?: {
        id: number;
        name: string;
    };
}

interface PageProps {
    movimientos: {
        data: MovimientoInventario[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    estadisticas: {
        total_entradas: number;
        total_salidas: number;
        movimientos_por_tipo: Record<string, number>;
    };
    filtros: {
        fecha_inicio?: string;
        fecha_fin?: string;
        tipo?: string;
        almacen_id?: number;
        producto_id?: number;
    };
    tipos: Record<string, string>;
    almacenes: Array<{
        id: number;
        nombre: string;
    }>;
}

export default function ReporteMovimientos({
    movimientos,
    estadisticas,
    filtros,
    tipos,
    almacenes
}: PageProps) {
    const [formData, setFormData] = useState({
        fecha_inicio: filtros.fecha_inicio || '',
        fecha_fin: filtros.fecha_fin || '',
        tipo: filtros.tipo || 'all',
        almacen_id: filtros.almacen_id?.toString() || 'all',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams();

        if (formData.fecha_inicio) {
            params.append('fecha_inicio', formData.fecha_inicio);
        }
        if (formData.fecha_fin) {
            params.append('fecha_fin', formData.fecha_fin);
        }
        if (formData.tipo && formData.tipo !== 'all') {
            params.append('tipo', formData.tipo);
        }
        if (formData.almacen_id && formData.almacen_id !== 'all') {
            params.append('almacen_id', formData.almacen_id);
        }

        window.location.href = `${route('reportes.inventario.movimientos')}?${params.toString()}`;
    };

    const getTipoColor = (tipo: string) => {
        if (tipo.includes('entrada') || tipo.includes('compra') || tipo.includes('devolucion')) {
            return 'default';
        }
        if (tipo.includes('salida') || tipo.includes('venta') || tipo.includes('merma')) {
            return 'destructive';
        }
        return 'secondary';
    };

    const getTipoIcon = (tipo: string) => {
        if (tipo.includes('entrada') || tipo.includes('compra') || tipo.includes('devolucion')) {
            return TrendingUp;
        }
        if (tipo.includes('salida') || tipo.includes('venta') || tipo.includes('merma')) {
            return TrendingDown;
        }
        return ArrowUpDown;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('es-BO').format(value);
    };

    return (
        <AppLayout>
            <Head title="Reporte de Movimientos de Inventario" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reporte de Movimientos</h1>
                        <p className="text-muted-foreground">
                            Historial detallado de movimientos de inventario
                        </p>
                    </div>
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                    >
                        Volver al Dashboard
                    </Link>
                </div>

                {/* Estadísticas */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                +{formatNumber(estadisticas.total_entradas)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Salidas</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                -{formatNumber(estadisticas.total_salidas)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Movimientos Netos</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatNumber(estadisticas.total_entradas - estadisticas.total_salidas)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                                    <Input
                                        type="date"
                                        id="fecha_inicio"
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fecha_fin">Fecha Fin</Label>
                                    <Input
                                        type="date"
                                        id="fecha_fin"
                                        value={formData.fecha_fin}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tipo">Tipo de Movimiento</Label>
                                    <Select
                                        value={formData.tipo}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los tipos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los tipos</SelectItem>
                                            {Object.entries(tipos).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="almacen_id">Almacén</Label>
                                    <Select
                                        value={formData.almacen_id}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, almacen_id: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los almacenes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los almacenes</SelectItem>
                                            {almacenes.map((almacen) => (
                                                <SelectItem key={almacen.id} value={almacen.id.toString()}>
                                                    {almacen.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button type="submit" className="w-full">
                                        Aplicar Filtros
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Tabla de Movimientos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Movimientos de Inventario ({movimientos.total} registros)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Almacén</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Referencia</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movimientos.data.map((movimiento) => {
                                        const TipoIcon = getTipoIcon(movimiento.tipo);

                                        return (
                                            <TableRow key={movimiento.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {formatDate(movimiento.fecha)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getTipoColor(movimiento.tipo) as "default" | "secondary" | "destructive"}
                                                        className="gap-1"
                                                    >
                                                        <TipoIcon className="h-3 w-3" />
                                                        {tipos[movimiento.tipo] || movimiento.tipo}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            {movimiento.stock_producto.producto.nombre}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                            {movimiento.stock_producto.almacen.nombre}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`font-mono font-semibold ${movimiento.cantidad > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {movimiento.cantidad > 0 ? '+' : ''}{formatNumber(movimiento.cantidad)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {movimiento.user && (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">
                                                                {movimiento.user.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                                                        {movimiento.numero_referencia || movimiento.motivo || '-'}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        {movimientos.last_page > 1 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {((movimientos.current_page - 1) * movimientos.per_page) + 1} a{' '}
                                    {Math.min(movimientos.current_page * movimientos.per_page, movimientos.total)} de{' '}
                                    {movimientos.total} registros
                                </div>
                                <div className="flex items-center space-x-2">
                                    {movimientos.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && (window.location.href = link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
