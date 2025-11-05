import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Form } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { AlertTriangle, Clock, Package, TrendingDown } from 'lucide-react';

// Interfaces TypeScript
interface Producto {
    id: number;
    nombre: string;
    categoria?: {
        id: number;
        nombre: string;
    };
}

interface Almacen {
    id: number;
    nombre: string;
}

interface ProductoVencimiento {
    id: number;
    cantidad: number;
    fecha_vencimiento: string;
    producto: Producto;
    almacen: Almacen;
}

interface Estadisticas {
    productos_vencidos: number;
    productos_proximos_vencer: number;
    valor_productos_vencidos: number;
}

interface Filtros {
    almacen_id?: string;
    dias_anticipacion?: number;
    solo_vencidos?: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData {
    data: ProductoVencimiento[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    productos: PaginatedData;
    estadisticas: Estadisticas;
    filtros: Filtros;
    almacenes: Almacen[];
}

export default function VencimientosInventario({
    productos,
    estadisticas,
    filtros,
    almacenes,
}: Props) {
    const obtenerEstadoVencimiento = (fechaVencimiento: string) => {
        const hoy = new Date();
        const fechaVenc = new Date(fechaVencimiento);
        const diasDiferencia = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

        if (diasDiferencia < 0) {
            return {
                estado: 'VENCIDO',
                color: 'destructive',
                className: 'bg-red-100 text-red-800',
                dias: Math.abs(diasDiferencia)
            };
        } else if (diasDiferencia <= 30) {
            return {
                estado: 'PRÓXIMO A VENCER',
                color: 'default',
                className: 'bg-yellow-100 text-yellow-800',
                dias: diasDiferencia
            };
        } else {
            return {
                estado: 'VIGENTE',
                color: 'secondary',
                className: 'bg-green-100 text-green-800',
                dias: diasDiferencia
            };
        }
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-BO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatearNumero = (numero: number) => {
        return new Intl.NumberFormat('es-BO').format(numero);
    };

    const formatearMoneda = (cantidad: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
        }).format(cantidad);
    };

    return (
        <AppLayout>
            <Head title="Reporte de Vencimientos de Inventario" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Vencimientos de Inventario
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Control de productos vencidos y próximos a vencer
                        </p>
                    </div>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Filtros de Búsqueda
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="almacen_id">Almacén</Label>
                                    <Select name="almacen_id" defaultValue={filtros.almacen_id || "all"}>
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

                                <div className="space-y-2">
                                    <Label htmlFor="dias_anticipacion">Días de Anticipación</Label>
                                    <Input
                                        id="dias_anticipacion"
                                        name="dias_anticipacion"
                                        type="number"
                                        min="1"
                                        max="365"
                                        defaultValue={filtros.dias_anticipacion || 30}
                                        placeholder="30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="solo_vencidos">Estado</Label>
                                    <Select name="solo_vencidos" defaultValue={filtros.solo_vencidos ? "true" : "false"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los productos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false">Todos los productos</SelectItem>
                                            <SelectItem value="true">Solo vencidos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <div className="flex gap-2 w-full">
                                        <Button type="submit" className="flex-1">
                                            Aplicar Filtros
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.location.href = '/reportes/inventario/vencimientos'}
                                        >
                                            Limpiar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    </CardContent>
                </Card>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Productos Vencidos
                                    </p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatearNumero(estadisticas.productos_vencidos)}
                                    </p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Próximos a Vencer
                                    </p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {formatearNumero(estadisticas.productos_proximos_vencer)}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Valor Productos Vencidos
                                    </p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatearMoneda(estadisticas.valor_productos_vencidos)}
                                    </p>
                                </div>
                                <TrendingDown className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabla de Productos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Productos con Fechas de Vencimiento</span>
                            <Badge variant="outline">
                                {formatearNumero(productos.total)} productos
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Almacén</TableHead>
                                        <TableHead className="text-center">Cantidad</TableHead>
                                        <TableHead className="text-center">Fecha Vencimiento</TableHead>
                                        <TableHead className="text-center">Días</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productos.data.length > 0 ? (
                                        productos.data.map((item) => {
                                            const estadoVenc = obtenerEstadoVencimiento(item.fecha_vencimiento);

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        {item.producto.nombre}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.producto.categoria?.nombre || 'Sin categoría'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.almacen.nombre}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {formatearNumero(item.cantidad)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {formatearFecha(item.fecha_vencimiento)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {estadoVenc.estado === 'VENCIDO'
                                                            ? `${estadoVenc.dias} días vencido`
                                                            : `${estadoVenc.dias} días`
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            className={estadoVenc.className}
                                                        >
                                                            {estadoVenc.estado}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                    <p className="text-gray-500">
                                                        No se encontraron productos con fechas de vencimiento
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        {productos.last_page > 1 && (
                            <div className="flex items-center justify-between px-2 py-4">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((productos.current_page - 1) * productos.per_page) + 1} a{' '}
                                    {Math.min(productos.current_page * productos.per_page, productos.total)} de{' '}
                                    {formatearNumero(productos.total)} resultados
                                </div>
                                <div className="flex gap-2">
                                    {productos.links.map((link, index) => {
                                        if (!link.url) return null;

                                        return (
                                            <Button
                                                key={index}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => window.location.href = link.url!}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
