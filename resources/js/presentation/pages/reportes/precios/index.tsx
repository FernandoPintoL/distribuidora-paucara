import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
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

// Helper para generar rutas
const route = (name: string, params?: any) => {
  const routes: Record<string, string> = {
    'dashboard': '/dashboard',
    'reportes.precios.index': '/reportes/precios',
    'reportes.precios.export': '/reportes/precios/export',
    'reportes.ganancias.index': '/reportes/ganancias',
    'productos.edit': '/productos',
  };

  const baseRoute = routes[name] || '/';

  if (params && name === 'productos.edit') {
    return `${baseRoute}/${params}/edit`;
  }

  return baseRoute;
};

const ALL_VALUE = 'all';

interface Precio {
  id: number;
  nombre: string;
  precio: number;
  fecha_ultima_actualizacion: string;
  producto: {
    id: number;
    nombre: string;
    categoria?: {
      nombre: string;
    };
  };
  tipo_precio: {
    id: number;
    nombre: string;
    color: string;
    configuracion: {
      icono?: string;
    };
  };
}

interface PageProps {
  precios: {
    data: Precio[];
    links: any[];
    meta: any;
  };
  estadisticas: {
    total_precios: number;
    precio_promedio: number;
    precio_minimo: number;
    precio_maximo: number;
    total_productos_con_precio: number;
  };
  filtros: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo_precio_id?: number;
    categoria_id?: number;
    producto_id?: number;
  };
  tipos_precio: Array<{
    id: number;
    nombre: string;
    color: string;
  }>;
  categorias: Array<{
    id: number;
    nombre: string;
  }>;
}

export default function ReportePreciosIndex({
  precios,
  estadisticas,
  filtros,
  tipos_precio,
  categorias
}: PageProps) {
  const [formData, setFormData] = useState({
    fecha_desde: filtros.fecha_desde || '',
    fecha_hasta: filtros.fecha_hasta || '',
    tipo_precio_id: filtros.tipo_precio_id?.toString() || ALL_VALUE,
    categoria_id: filtros.categoria_id?.toString() || ALL_VALUE,
  });

  const handleFilter = () => {
    const paramsRaw = { ...formData } as Record<string, string>;
    if (paramsRaw.tipo_precio_id === ALL_VALUE) { delete paramsRaw.tipo_precio_id; }
    if (paramsRaw.categoria_id === ALL_VALUE) { delete paramsRaw.categoria_id; }
    const params = Object.fromEntries(Object.entries(paramsRaw).filter(([_, v]) => v !== ''));
    router.get(route('reportes.precios.index'), params);
  };

  const exportar = () => {
    const paramsRaw = { ...formData } as Record<string, string>;
    if (paramsRaw.tipo_precio_id === ALL_VALUE) { delete paramsRaw.tipo_precio_id; }
    if (paramsRaw.categoria_id === ALL_VALUE) { delete paramsRaw.categoria_id; }
    const params = Object.fromEntries(Object.entries(paramsRaw).filter(([_, v]) => v !== ''));
    window.open(route('reportes.precios.export') + '?' + new URLSearchParams(params).toString());
  };

  const getColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      pink: 'bg-pink-100 text-pink-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
      teal: 'bg-teal-100 text-teal-800',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: route('dashboard') },
      { title: 'Reportes', href: '#' },
      { title: 'Precios', href: '#' }
    ]}>
      <Head title="Reporte de Precios" />

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Precios</h1>
            <p className="text-gray-600">Análisis detallado de precios por producto y tipo</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={exportar} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
            </Button>

            <Button asChild>
              <Link href={route('reportes.ganancias.index')}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Ver Ganancias
              </Link>
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estadisticas.total_precios}</p>
                <p className="text-sm text-gray-600">Total Precios</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(estadisticas.precio_promedio)}
                </p>
                <p className="text-sm text-gray-600">Precio Promedio</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(estadisticas.precio_minimo)}
                </p>
                <p className="text-sm text-gray-600">Precio Mínimo</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(estadisticas.precio_maximo)}
                </p>
                <p className="text-sm text-gray-600">Precio Máximo</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{estadisticas.total_productos_con_precio}</p>
                <p className="text-sm text-gray-600">Productos</p>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Fecha Desde</Label>
                <Input
                  type="date"
                  value={formData.fecha_desde}
                  onChange={(e) => setFormData({ ...formData, fecha_desde: e.target.value })}
                />
              </div>

              <div>
                <Label>Fecha Hasta</Label>
                <Input
                  type="date"
                  value={formData.fecha_hasta}
                  onChange={(e) => setFormData({ ...formData, fecha_hasta: e.target.value })}
                />
              </div>

              <div>
                <Label>Tipo de Precio</Label>
                <Select
                  value={formData.tipo_precio_id}
                  onValueChange={(value) => setFormData({ ...formData, tipo_precio_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos los tipos</SelectItem>
                    {tipos_precio.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todas las categorías</SelectItem>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  Filtrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      fecha_desde: '',
                      fecha_hasta: '',
                      tipo_precio_id: ALL_VALUE,
                      categoria_id: ALL_VALUE,
                    });
                    router.get(route('reportes.precios.index'));
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Precios */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Precios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo de Precio</TableHead>
                  <TableHead>Nombre del Precio</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Última Actualización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {precios.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron precios con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  precios.data.map((precio) => (
                    <TableRow key={precio.id}>
                      <TableCell>
                        <Link
                          href={route('productos.edit', precio.producto.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {precio.producto.nombre}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <span className="text-gray-600">
                          {precio.producto.categoria?.nombre || 'Sin categoría'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge className={getColorClass(precio.tipo_precio.color)}>
                          <span className="mr-1">
                            {precio.tipo_precio.configuracion?.icono || '💰'}
                          </span>
                          {precio.tipo_precio.nombre}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="text-gray-900">{precio.nombre}</span>
                      </TableCell>

                      <TableCell className="text-right font-semibold">
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(precio.precio)}
                      </TableCell>

                      <TableCell className="text-center text-gray-600">
                        {precio.fecha_ultima_actualizacion
                          ? new Date(precio.fecha_ultima_actualizacion).toLocaleDateString('es-BO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Paginación */}
        {precios.links && precios.links.length > 3 && (
          <div className="flex justify-center gap-1">
            {precios.links.map((link, index) => (
              <Button
                key={index}
                variant={link.active ? "default" : "outline"}
                size="sm"
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
