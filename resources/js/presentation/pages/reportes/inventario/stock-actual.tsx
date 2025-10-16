import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Badge } from '@/presentation/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import { Package2, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

// Helper para generar rutas
const route = (name: string, params?: string | number) => {
    const routes: Record<string, string> = {
        'dashboard': '/dashboard',
        'reportes.inventario.stock-actual': '/reportes/inventario/stock-actual',
        'productos.show': '/productos',
    };

    const baseRoute = routes[name] || '/';

    if (params && name === 'productos.show') {
        return `${baseRoute}/${params}`;
    }

    return baseRoute;
};

interface StockItem {
    id: number;
    cantidad: number;
    producto: {
        id: number;
        nombre: string;
        codigo: string;
        stock_minimo: number;
        stock_maximo: number;
        categoria?: {
            nombre: string;
        };
    };
    almacen: {
        id: number;
        nombre: string;
    };
}

interface PageProps {
    stock: {
        data: StockItem[];
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
        total_productos: number;
        total_stock: number;
        productos_stock_bajo: number;
        productos_stock_alto: number;
        valor_total_inventario: number;
    };
    filtros: {
        almacen_id?: number;
        categoria_id?: number;
        stock_bajo?: boolean;
        stock_alto?: boolean;
    };
    almacenes: Array<{
        id: number;
        nombre: string;
    }>;
    categorias: Array<{
        id: number;
        nombre: string;
    }>;
}

export default function ReporteStockActual({
    stock,
    estadisticas,
    filtros,
    almacenes,
    categorias
}: PageProps) {
    const [formData, setFormData] = useState({
        almacen_id: filtros.almacen_id?.toString() || 'all',
        categoria_id: filtros.categoria_id?.toString() || 'all',
        stock_bajo: filtros.stock_bajo || false,
        stock_alto: filtros.stock_alto || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams();

        if (formData.almacen_id && formData.almacen_id !== 'all') {
            params.append('almacen_id', formData.almacen_id);
        }
        if (formData.categoria_id && formData.categoria_id !== 'all') {
            params.append('categoria_id', formData.categoria_id);
        }
        if (formData.stock_bajo) {
            params.append('stock_bajo', '1');
        }
        if (formData.stock_alto) {
            params.append('stock_alto', '1');
        }

        window.location.href = `${route('reportes.inventario.stock-actual')}?${params.toString()}`;
    };

    const getStockStatus = (item: StockItem) => {
        const { cantidad, producto } = item;

        if (producto.stock_minimo > 0 && cantidad < producto.stock_minimo) {
            return { status: 'bajo', color: 'destructive', icon: TrendingDown };
        }

        if (producto.stock_maximo > 0 && cantidad > producto.stock_maximo) {
            return { status: 'alto', color: 'outline', icon: TrendingUp };
        }

        return { status: 'normal', color: 'secondary', icon: Package2 };
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(value);
    };

    return (
        <AppLayout>
            <Head title="Reporte de Stock Actual" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reporte de Stock Actual</h1>
                        <p className="text-muted-foreground">
                            Visualiza el estado actual del inventario por almacén
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                            <Package2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{estadisticas.total_productos.toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
                            <Package2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{estadisticas.total_stock.toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                            <TrendingDown className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{estadisticas.productos_stock_bajo}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Alto</CardTitle>
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">{estadisticas.productos_stock_alto}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(estadisticas.valor_total_inventario)}</div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                                <div className="space-y-2">
                                    <Label htmlFor="categoria_id">Categoría</Label>
                                    <Select
                                        value={formData.categoria_id}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las categorías" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las categorías</SelectItem>
                                            {categorias.map((categoria) => (
                                                <SelectItem key={categoria.id} value={categoria.id.toString()}>
                                                    {categoria.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Filtros Especiales</Label>
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.stock_bajo}
                                                onChange={(e) => setFormData(prev => ({ ...prev, stock_bajo: e.target.checked }))}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm">Stock Bajo</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.stock_alto}
                                                onChange={(e) => setFormData(prev => ({ ...prev, stock_alto: e.target.checked }))}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm">Stock Alto</span>
                                        </label>
                                    </div>
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

                {/* Tabla de Stock */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock por Producto ({stock.total} registros)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Almacén</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead className="text-right">Min/Max</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stock.data.map((item) => {
                                        const stockInfo = getStockStatus(item);
                                        const Icon = stockInfo.icon;

                                        return (
                                            <TableRow key={`${item.producto.id}-${item.almacen.id}`}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={route('productos.show', item.producto.id)}
                                                        className="hover:underline"
                                                    >
                                                        {item.producto.nombre}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{item.producto.codigo}</TableCell>
                                                <TableCell>{item.producto.categoria?.nombre || 'Sin categoría'}</TableCell>
                                                <TableCell>{item.almacen.nombre}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {item.cantidad.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-muted-foreground">
                                                    {item.producto.stock_minimo} / {item.producto.stock_maximo}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={stockInfo.color as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                                                        <Icon className="h-3 w-3" />
                                                        {stockInfo.status === 'bajo' ? 'Stock Bajo' :
                                                            stockInfo.status === 'alto' ? 'Stock Alto' : 'Normal'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        {stock.last_page > 1 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {((stock.current_page - 1) * stock.per_page) + 1} a{' '}
                                    {Math.min(stock.current_page * stock.per_page, stock.total)} de{' '}
                                    {stock.total} registros
                                </div>
                                <div className="flex items-center space-x-2">
                                    {stock.links.map((link, index) => (
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
